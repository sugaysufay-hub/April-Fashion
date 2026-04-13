import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface ChatSession {
  sessionId: string;
  messages: Message[];
  lastUpdated: string;
  userEmail?: string;
}

interface ChatContextType {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  isTyping: boolean;
  sessions: ChatSession[];
  fetchSessions: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('chat_session_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('chat_session_id', newId);
    return newId;
  });
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Initialize AI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_messages_${sessionId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [sessionId]);

  const saveToBackend = async (msgs: Message[]) => {
    try {
      const user = JSON.parse(localStorage.getItem('april_user') || '{}');
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messages: msgs,
          lastUpdated: new Date().toISOString(),
          userEmail: user.email || 'Guest'
        })
      });
    } catch (error) {
      console.error('Failed to save chat to backend:', error);
    }
  };

  const sendMessage = async (text: string) => {
    const userMessage: Message = { role: 'user', text, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(newMessages));
    saveToBackend(newMessages);

    setIsTyping(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: newMessages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: `You are the Customer Service Assistant for 'April Fashion', a premium luxury boutique. 
          Your goal is to provide elegant, helpful, and concise support.
          
          Key Information:
          - Shipping: Worldwide shipping available.
          - Returns: 30-day return policy for unworn items.
          - Size Guide: Available on each product page.
          - WhatsApp: If the user needs human assistance or has complex issues, politely suggest they use the 'Lanjut ke WhatsApp' button.
          
          Tone: Professional, warm, and sophisticated. Use emojis sparingly but effectively (e.g., ✨, 👗, 👋).`
        }
      });

      const aiText = response.text || "I'm sorry, I couldn't process that. How else can I help you?";
      const aiMessage: Message = { role: 'model', text: aiText, timestamp: new Date().toISOString() };
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(finalMessages));
      saveToBackend(finalMessages);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: Message = { role: 'model', text: "I'm having trouble connecting right now. Please try again later.", timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, isTyping, sessions, fetchSessions }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
