import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Helper to format phone
  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("08")) {
      cleaned = "628" + cleaned.slice(2);
    }
    return cleaned;
  };

  // Helper to read/write JSON
  const readData = async (file: string) => {
    try {
      const data = await fs.readFile(path.join(__dirname, file), "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const writeData = async (file: string, data: any) => {
    await fs.writeFile(path.join(__dirname, file), JSON.stringify(data, null, 2));
  };

  // Rate limiting
  const requestCounts: { [phone: string]: { count: number; lastReset: number } } = {};
  const checkRateLimit = (phone: string) => {
    const now = Date.now();
    if (!requestCounts[phone] || now - requestCounts[phone].lastReset > 60000) {
      requestCounts[phone] = { count: 1, lastReset: now };
      return true;
    }
    if (requestCounts[phone].count >= 3) return false;
    requestCounts[phone].count++;
    return true;
  };

  // API Routes
  app.post("/api/auth/register", async (req, res) => {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ error: "Missing fields" });

    const formattedPhone = formatPhone(phone);
    if (!checkRateLimit(formattedPhone)) {
      return res.status(429).json({ error: "Limit 3 request per menit. Silakan tunggu." });
    }

    const users = await readData("users.json");
    
    if (users.find((u: any) => u.phone === formattedPhone)) {
      return res.status(400).json({ error: "Phone already registered" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    const otps = await readData("otp.json");
    const filteredOtps = otps.filter((o: any) => o.phone !== formattedPhone);
    filteredOtps.push({ phone: formattedPhone, code: otpCode, expiredAt, name, password });
    await writeData("otp.json", filteredOtps);

    // Send OTP via Fonnte
    try {
      const fonnteKey = process.env.FONNTE_API_KEY;
      if (fonnteKey) {
        await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            "Authorization": fonnteKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: formattedPhone,
            message: `Kode verifikasi Aprilfashion kamu: ${otpCode}`
          })
        });
      } else {
        console.log("FONNTE_API_KEY missing. OTP Code:", otpCode);
      }
    } catch (err) {
      console.error("Fonnte error:", err);
    }

    res.json({ success: true, phone: formattedPhone });
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { phone, code } = req.body;
    const otps = await readData("otp.json");
    const otpIndex = otps.findIndex((o: any) => o.phone === phone && o.code === code);

    if (otpIndex === -1) return res.status(400).json({ error: "Kode salah" });
    
    const otp = otps[otpIndex];
    if (Date.now() > otp.expiredAt) {
      return res.status(400).json({ error: "Kode expired" });
    }

    // If it was a registration (has name/password)
    if (otp.name && otp.password) {
      const users = await readData("users.json");
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: otp.name,
        phone: otp.phone,
        password: otp.password
      };
      users.push(newUser);
      await writeData("users.json", users);
      
      // Remove OTP
      await writeData("otp.json", otps.filter((o: any) => o.phone !== phone));
      return res.json({ success: true, user: newUser });
    } 
    
    // If it was a login
    const users = await readData("users.json");
    const user = users.find((u: any) => u.phone === phone);
    if (!user) return res.status(400).json({ error: "User not found" });

    await writeData("otp.json", otps.filter((o: any) => o.phone !== phone));
    res.json({ success: true, user });
  });

  app.post("/api/auth/login-otp", async (req, res) => {
    const { phone } = req.body;
    const formattedPhone = formatPhone(phone);
    if (!checkRateLimit(formattedPhone)) {
      return res.status(429).json({ error: "Limit 3 request per menit. Silakan tunggu." });
    }
    const users = await readData("users.json");
    const user = users.find((u: any) => u.phone === formattedPhone);

    if (!user) return res.status(400).json({ error: "Nomor tidak terdaftar" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = Date.now() + 5 * 60 * 1000;

    const otps = await readData("otp.json");
    const filteredOtps = otps.filter((o: any) => o.phone !== formattedPhone);
    filteredOtps.push({ phone: formattedPhone, code: otpCode, expiredAt });
    await writeData("otp.json", filteredOtps);

    // Send OTP
    try {
      const fonnteKey = process.env.FONNTE_API_KEY;
      if (fonnteKey) {
        await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            "Authorization": fonnteKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: formattedPhone,
            message: `Kode verifikasi Aprilfashion kamu: ${otpCode}`
          })
        });
      } else {
        console.log("FONNTE_API_KEY missing. OTP Code:", otpCode);
      }
    } catch (err) {
      console.error("Fonnte error:", err);
    }

    res.json({ success: true, phone: formattedPhone });
  });

  app.post("/api/auth/resend-otp", async (req, res) => {
    const { phone } = req.body;
    if (!checkRateLimit(phone)) {
      return res.status(429).json({ error: "Limit 3 request per menit. Silakan tunggu." });
    }
    const otps = await readData("otp.json");
    const existingOtp = otps.find((o: any) => o.phone === phone);

    if (!existingOtp) return res.status(400).json({ error: "No pending verification" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = Date.now() + 5 * 60 * 1000;

    existingOtp.code = otpCode;
    existingOtp.expiredAt = expiredAt;
    await writeData("otp.json", otps);

    // Send OTP
    try {
      const fonnteKey = process.env.FONNTE_API_KEY;
      if (fonnteKey) {
        await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            "Authorization": fonnteKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: phone,
            message: `Kode verifikasi Aprilfashion kamu: ${otpCode}`
          })
        });
      } else {
        console.log("FONNTE_API_KEY missing. OTP Code:", otpCode);
      }
    } catch (err) {
      console.error("Fonnte error:", err);
    }

    res.json({ success: true });
  });

  app.post("/api/orders/create", async (req, res) => {
    const order = req.body;
    if (!order.items || !order.customer) return res.status(400).json({ error: "Invalid order data" });
    
    const orders = await readData("orders.json");
    const newOrder = {
      ...order,
      id: "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    orders.push(newOrder);
    await writeData("orders.json", orders);

    // Send WhatsApp notification to admin
    try {
      const fonnteKey = process.env.FONNTE_API_KEY;
      const adminPhone = "62895614807143";
      
      if (fonnteKey) {
        const productList = newOrder.items
          .map((item: any) => `- ${item.name} (x${item.quantity})`)
          .join('\n');

        const message = `Order Baru:
Nama: ${newOrder.customer.name}
Produk:
${productList}
Total: Rp ${newOrder.total.toLocaleString('id-ID')}.000`;

        await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            "Authorization": fonnteKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: adminPhone,
            message: message
          })
        });
      }
    } catch (err) {
      console.error("Fonnte order notification error:", err);
    }

    res.json({ success: true, order: newOrder });
  });

  app.get("/api/orders/user/:phone", async (req, res) => {
    const { phone } = req.params;
    const orders = await readData("orders.json");
    const userOrders = orders.filter((o: any) => o.customer.phone === phone);
    res.json(userOrders);
  });

  app.get("/api/content", async (req, res) => {
    const content = await readData("content.json");
    if (Array.isArray(content) && content.length === 0) {
      // Default content if file doesn't exist or is empty
      const defaultContent = {
        heroTitle: "Ethereal Essence",
        heroSubtitle: "New Collection 2026",
        heroButton: "Explore Collection",
        sectionTitle: "Curated Essentials",
        sectionDescription: "Timeless pieces designed for the modern woman, crafted with the finest materials.",
        shopMenu: ["Shop All", "New Arrivals", "Best Sellers"],
        supportMenu: ["Shipping & Returns", "Contact Us", "FAQ", "Size Guide"],
        footerDescription: "Premium fashion destination for the modern woman. Curated collections that blend elegance with contemporary style."
      };
      await writeData("content.json", defaultContent);
      return res.json(defaultContent);
    }
    res.json(content);
  });

  app.post("/api/content", async (req, res) => {
    const newContent = req.body;
    await writeData("content.json", newContent);
    res.json({ success: true, content: newContent });
  });

  app.get("/api/chats", async (req, res) => {
    const chats = await readData("chats.json");
    res.json(chats);
  });

  app.post("/api/chats", async (req, res) => {
    const { sessionId, messages, lastUpdated, userEmail } = req.body;
    let chats = await readData("chats.json");
    if (!Array.isArray(chats)) chats = [];

    const existingIndex = chats.findIndex((c: any) => c.sessionId === sessionId);
    if (existingIndex >= 0) {
      chats[existingIndex] = { ...chats[existingIndex], messages, lastUpdated, userEmail };
    } else {
      chats.push({ sessionId, messages, lastUpdated, userEmail });
    }

    await writeData("chats.json", chats);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
