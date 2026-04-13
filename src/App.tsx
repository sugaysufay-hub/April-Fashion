/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Menu, X, ArrowLeft, ArrowRight, Instagram, Twitter, Facebook, Plus, Edit2, Trash2, LogOut, Lock, Minus, CheckCircle, Star, DollarSign, TrendingUp, MousePointerClick, MessageCircle, Upload, Loader2 } from 'lucide-react';
import initialProductsData from './products.json';
import brandConfig from './config.json';
import { ContentProvider, useContent } from './contexts/ContentContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import ChatWidget from './components/ChatWidget';

// --- Types ---
interface Product {
  id: string;
  name: string;
  price: number;
  type: 'own' | 'affiliate';
  category: string;
  image: string;
  description: string;
  details: string[];
  isAffiliate?: boolean;
  externalLink?: string;
  clickCount?: number;
  isBestSeller?: boolean;
  discount?: number;
  isShopee?: boolean;
  rating?: number;
  soldCount?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  trackClick: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

interface User {
  id: string;
  name: string;
  phone: string;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
  };
  shipping: {
    option: string;
    cost: number;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);
const CartContext = createContext<CartContextType | undefined>(undefined);

const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

// --- Utilities ---
const formatRupiah = (number: number) => {
  return "Rp " + number.toLocaleString("id-ID");
};

// --- Components ---

const CartSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-paper z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-ink/5 flex justify-between items-center">
              <h2 className="text-xl font-serif italic">Your Bag</h2>
              <button onClick={onClose} className="p-2 hover:text-accent transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <ShoppingBag size={48} className="text-ink/10" />
                  <p className="text-ink/40 text-sm uppercase tracking-widest">Your bag is empty</p>
                  <button onClick={onClose} className="text-accent text-xs font-bold uppercase tracking-widest border-b border-accent">Start Shopping</button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex space-x-4">
                    <div className="w-20 h-28 bg-gray-100 overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-sm font-serif font-medium">{item.name}</h3>
                          <button onClick={() => removeFromCart(item.id)} className="text-ink/30 hover:text-red-500">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-ink/40 mt-1">{formatRupiah(item.price)}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 border border-ink/10 hover:border-ink transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 border border-ink/10 hover:border-ink transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-ink/5 bg-paper/50 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs uppercase tracking-widest font-bold text-ink/40">Subtotal</span>
                  <span className="text-xl font-serif">{formatRupiah(total)}</span>
                </div>
                <button 
                  onClick={() => { onClose(); navigate('/checkout'); }}
                  className="w-full bg-ink text-paper py-4 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all"
                >
                  Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useProducts();
  const { content } = useContent();

  return (
    <>
      <nav className="sticky top-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Left Section */}
            <div className={`flex items-center ${isSearchVisible ? 'flex-none' : 'w-1/3'}`}>
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 lg:hidden text-ink hover:text-accent transition-colors"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              {!isSearchVisible && (
                <div className="hidden lg:flex space-x-8 text-[10px] uppercase tracking-[0.2em] font-bold text-ink/70">
                  {content.shopMenu.slice(0, 3).map((item, idx) => (
                    <Link key={idx} to="/" className="hover:text-accent transition-colors">{item}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* Center: Logo or Search */}
            <div className={`flex items-center ${isSearchVisible ? 'flex-1' : 'justify-center w-1/3'}`}>
              <AnimatePresence mode="wait">
                {!isSearchVisible ? (
                  <motion.div
                    key="logo"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link to="/" className="flex items-center group">
                      <img 
                        src={brandConfig.logoUrl} 
                        alt={`${brandConfig.brandName} logo`} 
                        className="h-8 md:h-10 w-auto object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full flex items-center bg-beige/50 rounded-full px-4 h-10 border border-ink/5"
                  >
                    <Search size={16} className="text-ink/40 mr-3 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search for premium fashion..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent w-full text-sm focus:outline-none placeholder:text-ink/30"
                      autoFocus
                    />
                    <button onClick={() => setIsSearchVisible(false)} className="ml-3 text-ink/40 hover:text-accent shrink-0">
                      <X size={18} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Section */}
            <div className={`flex items-center justify-end space-x-2 sm:space-x-4 ${isSearchVisible ? 'flex-none' : 'w-1/3'}`}>
              <div className="hidden md:flex items-center space-x-4 mr-2">
                {user ? (
                  <Link to="/account" className="text-[10px] uppercase tracking-widest font-bold text-ink/60 hover:text-accent transition-colors">Hi, {user.name}</Link>
                ) : (
                  <Link to="/login" className="text-[10px] uppercase tracking-widest font-bold text-ink/60 hover:text-accent transition-colors">Login</Link>
                )}
              </div>
              
              {!isSearchVisible && (
                <button 
                  onClick={() => setIsSearchVisible(true)}
                  className="p-2 text-ink hover:text-accent transition-colors"
                >
                  <Search size={20} />
                </button>
              )}

              <button 
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-ink hover:text-accent transition-colors relative"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-white text-[8px] flex items-center justify-center rounded-full font-bold">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-paper border-b border-ink/5 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-4 text-sm uppercase tracking-widest font-medium">
                <Link to="/" onClick={() => setIsOpen(false)} className="block py-2">Shop All</Link>
                <Link to="/" onClick={() => setIsOpen(false)} className="block py-2">New Arrivals</Link>
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block py-2">Admin Panel</Link>
                {!user ? (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="block py-2">Login</Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="block py-2">Register</Link>
                  </>
                ) : (
                  <button onClick={() => { logout(); setIsOpen(false); }} className="block py-2 text-accent">Logout</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

const ProductCard = ({ product }: { product: Product; key?: string | number }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert("Silakan login dulu untuk melanjutkan");
      localStorage.setItem("april_redirect", location.pathname);
      navigate("/login");
      return;
    }

    addToCart(product);
    alert("Produk berhasil ditambahkan ke keranjang");
  };

  const discountedPrice = product.discount 
    ? Math.round(product.price * (1 - product.discount / 100))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full border border-ink/5"
    >
      <div className="relative aspect-square overflow-hidden bg-beige">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
          {product.isBestSeller && (
            <span className="bg-ink text-paper text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-full shadow-sm">
              Best Seller
            </span>
          )}
          {product.discount && (
            <span className="bg-accent text-white text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-full shadow-sm">
              -{product.discount}%
            </span>
          )}
          {product.isAffiliate && (
            <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-full shadow-sm border border-ink/5 ${product.isShopee ? 'bg-[#EE4D2D] text-white' : 'bg-pink text-ink'}`}>
              {product.isShopee ? 'Shopee' : 'Affiliate'}
            </span>
          )}
        </div>

        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </Link>
        
        <div className="absolute bottom-2 left-2 right-2 translate-y-12 group-hover:translate-y-0 transition-all duration-300 opacity-0 group-hover:opacity-100 hidden sm:block">
          {product.isAffiliate ? (
            <Link 
              to={`/product/${product.id}`}
              className="block w-full bg-paper/90 backdrop-blur-md py-2 text-[10px] uppercase tracking-widest font-bold shadow-lg hover:bg-ink hover:text-white transition-all text-center rounded-xl"
            >
              Details
            </Link>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="w-full bg-paper/90 backdrop-blur-md py-2 text-[10px] uppercase tracking-widest font-bold shadow-lg hover:bg-accent hover:text-white transition-all rounded-xl"
            >
              Add to Bag
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <Link to={`/product/${product.id}`} className="space-y-1 flex-1">
          <p className="text-[9px] uppercase tracking-widest text-accent font-bold opacity-70">{product.category}</p>
          <h3 className="text-sm font-medium tracking-tight text-ink line-clamp-2 group-hover:text-accent transition-colors leading-tight">{product.name}</h3>
        </Link>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-col">
            {discountedPrice ? (
              <div className="flex items-center space-x-2">
                <p className="text-base font-bold text-ink">{formatRupiah(discountedPrice)}</p>
                <p className="text-[10px] text-ink/30 line-through">{formatRupiah(product.price)}</p>
              </div>
            ) : (
              <p className="text-base font-bold text-ink">{formatRupiah(product.price)}</p>
            )}
          </div>
          
          {product.isShopee && (
            <div className="flex items-center space-x-1 text-[9px] text-ink/40">
              <Star size={8} className="fill-gold text-gold" />
              <span>{product.rating}</span>
            </div>
          )}
        </div>

        {/* Mobile Add to Cart Button */}
        <div className="mt-3 sm:hidden">
          {product.isAffiliate ? (
            <Link 
              to={`/product/${product.id}`}
              className="block w-full bg-beige py-2 text-[9px] uppercase tracking-widest font-bold text-center rounded-lg border border-ink/5"
            >
              Details
            </Link>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="w-full bg-accent text-white py-2 text-[9px] uppercase tracking-widest font-bold rounded-lg shadow-sm"
            >
              Add to Bag
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const { products, searchQuery, setSearchQuery } = useProducts();
  const { content } = useContent();
  const [activeFilter, setActiveFilter] = useState('All');
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Best Seller') return product.isBestSeller;
    if (activeFilter === 'Discounted') return !!product.discount;
    if (activeFilter === 'Affiliate') return product.isAffiliate;
    return product.category === activeFilter;
  });
  
  const filters = ['All', 'Dresses', 'Knitwear', 'Accessories', 'Best Seller', 'Discounted', 'Affiliate'];
  
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      {!searchQuery && (
        <section className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden bg-beige">
          <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block">
            <motion.div 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="w-full h-full"
            >
              <img 
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=80" 
                alt="Hero" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
            <div className="max-w-2xl">
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs uppercase tracking-[0.5em] mb-4 text-accent font-bold"
              >
                {content.heroSubtitle}
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl font-serif leading-[0.9] mb-6 tracking-tighter text-ink"
              >
                {content.heroTitle.split(' ').length > 1 ? (
                  <>
                    {content.heroTitle.split(' ')[0]} <br /> 
                    <span className="italic font-light ml-12 md:ml-24">{content.heroTitle.split(' ').slice(1).join(' ')}</span>
                  </>
                ) : content.heroTitle}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-8"
              >
                <Link 
                  to="/" 
                  className="bg-ink text-paper px-8 py-4 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all shadow-xl"
                >
                  {content.heroButton}
                </Link>
                <div className="hidden sm:block h-[1px] w-16 bg-ink/10" />
                <p className="hidden sm:block text-[10px] uppercase tracking-widest text-ink/40 font-bold">
                  Limited Edition <br /> Pieces
                </p>
              </motion.div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute bottom-6 left-12 hidden lg:block">
            <div className="flex flex-col space-y-2">
              <div className="w-[1px] h-12 bg-ink/20 mx-auto" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-ink/30 [writing-mode:vertical-rl] rotate-180">Explore</p>
            </div>
          </div>
        </section>
      )}

      {/* Product Grid */}
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${searchQuery ? 'pt-32' : ''}`}>
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-4xl font-serif mb-2">
              {searchQuery ? `Search results for "${searchQuery}"` : content.sectionTitle}
            </h2>
            <p className="text-ink/60 max-w-md">
              {searchQuery 
                ? `Found ${filteredProducts.length} products matching your search.`
                : content.sectionDescription}
            </p>
          </div>
          {!searchQuery && (
            <div className="flex flex-wrap gap-4 text-xs uppercase tracking-widest font-bold border-b border-ink/10 pb-2 w-full md:w-auto">
              {filters.map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`transition-colors pb-2 -mb-2 border-b-2 ${
                    activeFilter === filter 
                      ? 'text-accent border-accent' 
                      : 'text-ink/40 hover:text-ink border-transparent'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-ink/40 uppercase tracking-widest">No products found matching your search.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 text-accent border-b border-accent text-xs font-bold uppercase tracking-widest"
            >
              Clear Search
            </button>
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="bg-ink text-paper py-24 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-serif italic">Join the April Circle</h2>
          <p className="text-paper/60 text-sm tracking-wide leading-relaxed">
            Subscribe to receive updates on new collections, exclusive events, and seasonal inspirations.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Email Address" 
              className="flex-1 bg-transparent border-b border-paper/30 py-3 text-sm focus:outline-none focus:border-paper transition-colors"
            />
            <button className="bg-paper text-ink px-8 py-3 text-xs uppercase tracking-widest font-bold hover:bg-accent hover:text-paper transition-all">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const { products, trackClick } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const product = products.find(p => p.id === id);
  const [selectedSize, setSelectedSize] = useState('S');

  if (!product) return <div className="h-screen flex items-center justify-center">Product not found</div>;

  const handleAddToCart = () => {
    if (!user) {
      alert("Silakan login dulu untuk melanjutkan");
      localStorage.setItem("april_redirect", location.pathname);
      navigate("/login");
      return;
    }

    addToCart(product);
    alert("Produk berhasil ditambahkan ke keranjang");
  };

  const handleAffiliateClick = () => {
    trackClick(product.id);
  };

  const discountedPrice = product.discount 
    ? Math.round(product.price * (1 - product.discount / 100))
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24"
    >
      <Link to="/" className="inline-flex items-center text-xs uppercase tracking-[0.3em] font-bold mb-12 hover:text-accent transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back to Collection
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        {/* Images */}
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="aspect-[3/4] overflow-hidden bg-beige rounded-sm shadow-sm"
          >
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="border-b border-ink/5 pb-10 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <p className="text-[10px] uppercase tracking-[0.4em] text-accent font-bold">{product.category}</p>
              {product.isBestSeller && (
                <span className="bg-ink text-paper text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full">Best Seller</span>
              )}
              {product.isShopee && (
                <span className="bg-[#EE4D2D] text-white text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full">Shopee Affiliate</span>
              )}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 tracking-tight leading-tight">{product.name}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {discountedPrice ? (
                  <>
                    <p className="text-3xl font-display font-light text-ink">{formatRupiah(discountedPrice)}</p>
                    <p className="text-xl text-ink/20 line-through font-display font-light">{formatRupiah(product.price)}</p>
                  </>
                ) : (
                  <p className="text-3xl font-display font-light text-ink">{formatRupiah(product.price)}</p>
                )}
              </div>
              {product.isShopee && (
                <div className="flex items-center space-x-4 text-sm text-ink/60">
                  <div className="flex items-center space-x-1">
                    <Star size={16} className="fill-gold text-gold" />
                    <span className="font-bold">{product.rating}</span>
                  </div>
                  <div className="h-4 w-[1px] bg-ink/10" />
                  <span>{product.soldCount} items sold</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-10 flex-1">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-4 text-ink/40">Description</h3>
              <p className="text-ink/70 leading-relaxed font-light text-lg">{product.description}</p>
            </div>

            {!product.isAffiliate && (
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold mb-4">Select Size</h3>
                <div className="flex space-x-3">
                  {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 border flex items-center justify-center text-xs transition-all ${
                        selectedSize === size 
                          ? 'bg-ink text-paper border-ink' 
                          : 'border-ink/10 hover:border-ink'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-8">
              {product.isAffiliate ? (
                <a 
                  href={product.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleAffiliateClick}
                  className={`w-full py-5 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center ${product.isShopee ? 'bg-[#EE4D2D] text-white hover:bg-[#d73211]' : 'bg-accent text-white hover:bg-ink'}`}
                >
                  {product.isShopee ? 'Buy on Shopee' : 'Buy on external store'} <ArrowRight size={16} className="ml-2" />
                </a>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className="w-full bg-ink text-paper py-5 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all flex items-center justify-center"
                >
                  Add to Bag <ArrowRight size={16} className="ml-2" />
                </button>
              )}
            </div>

            <div className="pt-8 border-t border-ink/10">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-4">Details & Care</h3>
              <ul className="space-y-2">
                {product.details.map((detail, index) => (
                  <li key={index} className="text-sm text-ink/60 flex items-center">
                    <span className="w-1.5 h-1.5 bg-accent/30 rounded-full mr-3" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Checkout Component ---

const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    zip: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        phone: user.phone
      }));
    }
  }, [user]);

  const [shippingOption, setShippingOption] = useState<'cod' | 'grab' | 'jnt'>('cod');
  const shippingCost = shippingOption === 'cod' ? 10000 : shippingOption === 'grab' ? 15000 : 20000;
  const finalTotal = total + shippingCost;

  const handleWhatsAppOrder = () => {
    if (!formData.name) {
      alert('Please enter your name first');
      return;
    }

    const productList = cart
      .map((item) => `- ${item.name} (x${item.quantity})`)
      .join('\n');

    const shippingText = 
      shippingOption === 'cod' ? `COD Singkawang kota (${formatRupiah(10000)})` :
      shippingOption === 'grab' ? `Singkawang via Grab (${formatRupiah(15000)})` :
      `Luar Singkawang via JNT (${formatRupiah(20000)})`;

    const message = `Halo, saya mau order:
Nama: ${formData.name}

Produk:
${productList}

Pengiriman: ${shippingText}
Total: ${formatRupiah(finalTotal)}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/62895614807143?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderData = {
      items: cart,
      total: finalTotal,
      customer: formData,
      shipping: {
        option: shippingOption,
        cost: shippingCost
      }
    };

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        setIsSuccess(true);
        clearCart();
      } else {
        alert('Failed to place order');
      }
    } catch (err) {
      alert('Something went wrong');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 text-green-500 rounded-full mb-4">
            <CheckCircle size={48} />
          </div>
          <h1 className="text-4xl font-serif">Order Confirmed</h1>
          <p className="text-ink/60 max-w-md mx-auto">
            Thank you for your purchase. We've received your order and will begin processing it shortly.
          </p>
          <Link to="/" className="inline-block bg-ink text-paper px-10 py-4 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all">
            Return to Shop
          </Link>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) return <Navigate to="/" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
      <h1 className="text-5xl font-serif mb-16">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-10">
            <section>
              <h2 className="text-xs uppercase tracking-widest font-bold mb-8 flex items-center">
                <span className="w-6 h-6 bg-ink text-paper rounded-full flex items-center justify-center text-[10px] mr-3">1</span>
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Phone Number</label>
                  <input 
                    required
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Address</label>
                  <input 
                    required
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">City</label>
                  <input 
                    required
                    type="text" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Zip Code</label>
                  <input 
                    required
                    type="text" 
                    value={formData.zip}
                    onChange={(e) => setFormData({...formData, zip: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-bold mb-8 flex items-center">
                <span className="w-6 h-6 bg-ink text-paper rounded-full flex items-center justify-center text-[10px] mr-3">2</span>
                Shipping Method
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setShippingOption('cod')}
                  className={`p-6 border text-left transition-all ${shippingOption === 'cod' ? 'border-accent bg-accent/5' : 'border-ink/10 hover:border-ink/20'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest">COD Singkawang</span>
                    <span className="text-accent font-bold">10k</span>
                  </div>
                  <p className="text-[10px] text-ink/40">COD Singkawang Kota</p>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingOption('grab')}
                  className={`p-6 border text-left transition-all ${shippingOption === 'grab' ? 'border-accent bg-accent/5' : 'border-ink/10 hover:border-ink/20'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Singkawang</span>
                    <span className="text-accent font-bold">15k</span>
                  </div>
                  <p className="text-[10px] text-ink/40">Pesan via Grab</p>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingOption('jnt')}
                  className={`p-6 border text-left transition-all ${shippingOption === 'jnt' ? 'border-accent bg-accent/5' : 'border-ink/10 hover:border-ink/20'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Luar Singkawang</span>
                    <span className="text-accent font-bold">20k</span>
                  </div>
                  <p className="text-[10px] text-ink/40">Pesan melalui JNT</p>
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest font-bold mb-8 flex items-center">
                <span className="w-6 h-6 bg-ink text-paper rounded-full flex items-center justify-center text-[10px] mr-3">3</span>
                Payment
              </h2>
              <div className="p-6 bg-paper border border-ink/10 rounded-lg">
                <p className="text-sm text-ink/60">Payment will be collected upon delivery. No credit card required for this demo.</p>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-4">
              <button type="submit" className="flex-1 bg-ink text-paper py-5 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all">
                Complete Order
              </button>
              <button 
                type="button"
                onClick={handleWhatsAppOrder}
                className="flex-1 bg-[#25D366] text-white py-5 text-xs uppercase tracking-widest font-bold hover:bg-[#128C7E] transition-all flex items-center justify-center"
              >
                Order via WhatsApp
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white p-8 shadow-xl border border-ink/5 sticky top-32">
            <h2 className="text-xl font-serif mb-8">Order Summary</h2>
            <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex space-x-4">
                    <img src={item.image} alt={item.name} className="w-12 h-16 object-cover" />
                    <div>
                      <h4 className="text-sm font-serif">{item.name}</h4>
                      <p className="text-xs text-ink/40">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{formatRupiah(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4 pt-6 border-t border-ink/5">
              <div className="flex justify-between text-sm">
                <span className="text-ink/40">Subtotal</span>
                <span>{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink/40">Shipping</span>
                <span>{formatRupiah(shippingCost)}</span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-ink/5">
                <span className="text-xs uppercase tracking-widest font-bold">Total</span>
                <span className="text-2xl font-serif">{formatRupiah(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Admin Components ---

// --- Auth Components ---

const Register = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        navigate('/verify-otp', { state: { phone: data.phone } });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-4xl font-serif mb-8">Create Account</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Name</label>
          <input 
            required
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Phone Number (08xxx)</label>
          <input 
            required
            type="tel" 
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Password</label>
          <input 
            required
            type="password" 
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-ink text-paper py-4 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all disabled:opacity-50"
        >
          {loading ? 'Sending OTP...' : 'Register'}
        </button>
        <p className="text-center text-xs text-ink/40">
          Already have an account? <Link to="/login" className="text-accent border-b border-accent">Login here</Link>
        </p>
      </form>
    </div>
  );
};

const Account = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders/user/${user.phone}`);
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-serif">My Account</h1>
          <p className="text-ink/40 text-xs uppercase tracking-widest mt-2">Welcome back, {user.name}</p>
        </div>
        <button 
          onClick={() => { logout(); navigate('/'); }}
          className="border border-ink/10 px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-ink hover:text-paper transition-all flex items-center"
        >
          <LogOut size={16} className="mr-2" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 shadow-xl border border-ink/5 rounded-sm">
            <h2 className="text-xs uppercase tracking-widest font-bold mb-6">Profile Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-1">Name</p>
                <p className="text-sm">{user.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-1">Phone</p>
                <p className="text-sm">{user.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-2xl font-serif mb-8">Order History</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 text-center border border-ink/5 rounded-sm">
              <ShoppingBag size={48} className="mx-auto text-ink/10 mb-4" />
              <p className="text-ink/40 text-sm uppercase tracking-widest">No orders yet</p>
              <Link to="/" className="inline-block mt-6 text-accent text-xs font-bold uppercase tracking-widest border-b border-accent">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-6 shadow-lg border border-ink/5 rounded-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">{order.id}</p>
                      <p className="text-[10px] text-ink/40 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="border-t border-ink/5 pt-6 space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-ink/60">{item.name} <span className="text-[10px] ml-1">x{item.quantity}</span></span>
                        <span className="font-medium">{formatRupiah(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="border-t border-ink/5 pt-4 flex justify-between items-center">
                      <span className="text-xs uppercase tracking-widest font-bold">Total</span>
                      <span className="text-lg font-serif font-bold">{formatRupiah(order.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.success) {
        navigate('/verify-otp', { state: { phone: data.phone } });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-4xl font-serif mb-8">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Phone Number (08xxx)</label>
          <input 
            required
            type="tel" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-ink text-paper py-4 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all disabled:opacity-50"
        >
          {loading ? 'Sending OTP...' : 'Login with OTP'}
        </button>
        <p className="text-center text-xs text-ink/40">
          Don't have an account? <Link to="/register" className="text-accent border-b border-accent">Register here</Link>
        </p>
      </form>
    </div>
  );
};

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const phone = location.state?.phone;

  useEffect(() => {
    if (!phone) navigate('/login');
  }, [phone, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      const data = await res.json();
      if (data.success) {
        login(data.user);
        const redirect = localStorage.getItem("april_redirect");
        if (redirect) {
          localStorage.removeItem("april_redirect");
          navigate(redirect);
        } else {
          navigate('/');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      alert('OTP Resent!');
    } catch (err) {
      alert('Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-4xl font-serif mb-4">Verify OTP</h1>
      <p className="text-xs text-ink/40 mb-8 uppercase tracking-widest">Sent to {phone}</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">6-Digit Code</label>
          <input 
            required
            maxLength={6}
            type="text" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent text-center tracking-[1em] font-bold"
          />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-ink text-paper py-4 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        <button 
          type="button"
          disabled={resendLoading}
          onClick={handleResend}
          className="w-full text-[10px] uppercase tracking-widest font-bold text-accent hover:text-ink transition-colors disabled:opacity-50"
        >
          {resendLoading ? 'Resending...' : 'Resend Code'}
        </button>
      </form>
    </div>
  );
};

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'April' && password === 'April18') {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 shadow-2xl border border-ink/5"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full text-accent mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-serif">Admin Access</h2>
          <p className="text-ink/40 text-xs uppercase tracking-widest mt-2">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="April"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
          <button className="w-full bg-ink text-paper py-4 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all">
            Login
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { content, updateContent } = useContent();
  const { sessions, fetchSessions } = useChat();
  const [activeTab, setActiveTab] = useState<'products' | 'content' | 'chats'>('products');
  const [isEditing, setIsEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    type: 'own',
    category: '',
    image: '',
    description: '',
    details: [],
    isAffiliate: false,
    externalLink: '',
    isBestSeller: false,
    discount: 0,
    isShopee: false,
    rating: 5,
    soldCount: 0
  });

  const [contentForm, setContentForm] = useState(content);

  useEffect(() => {
    setContentForm(content);
  }, [content]);

  useEffect(() => {
    if (activeTab === 'chats') {
      fetchSessions();
    }
  }, [activeTab]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateProduct({ ...isEditing, ...formData } as Product);
      setIsEditing(null);
    } else {
      const newProduct = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        details: formData.details || []
      } as Product;
      addProduct(newProduct);
      setIsAdding(false);
    }
    setFormData({ name: '', price: 0, type: 'own', category: '', image: '', description: '', details: [], isAffiliate: false, externalLink: '', isBestSeller: false, discount: 0, isShopee: false, rating: 5, soldCount: 0 });
  };

  const handleContentSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateContent(contentForm);
      alert('Content updated successfully!');
    } catch (error) {
      alert('Failed to update content.');
    }
  };

  const startEdit = (product: Product) => {
    setIsEditing(product);
    setFormData(product);
    setIsAdding(false);
    setActiveTab('products');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'ml_default'); // Unsigned preset

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (result.secure_url) {
        setFormData(prev => ({ ...prev, image: result.secure_url }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const totalClicks = products.reduce((sum, p) => sum + (p.clickCount || 0), 0);
  const estimatedEarnings = totalClicks * 500; // Assuming 500 Rp per click

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-serif">Admin Dashboard</h1>
          <p className="text-ink/40 text-xs uppercase tracking-widest mt-2">Manage your website content and inventory</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={onLogout}
            className="border border-ink/10 px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-ink hover:text-paper transition-all flex items-center"
          >
            <LogOut size={16} className="mr-2" /> Logout
          </button>
        </div>
      </div>

      <div className="flex space-x-8 mb-12 border-b border-ink/5 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button 
          onClick={() => setActiveTab('products')}
          className={`pb-4 text-xs uppercase tracking-widest font-bold transition-all border-b-2 ${activeTab === 'products' ? 'text-accent border-accent' : 'text-ink/40 border-transparent'}`}
        >
          Products
        </button>
        <button 
          onClick={() => setActiveTab('content')}
          className={`pb-4 text-xs uppercase tracking-widest font-bold transition-all border-b-2 ${activeTab === 'content' ? 'text-accent border-accent' : 'text-ink/40 border-transparent'}`}
        >
          Website Content
        </button>
        <button 
          onClick={() => setActiveTab('chats')}
          className={`pb-4 text-xs uppercase tracking-widest font-bold transition-all border-b-2 ${activeTab === 'chats' ? 'text-accent border-accent' : 'text-ink/40 border-transparent'}`}
        >
          AI Chat Logs
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          <div className="flex justify-end mb-8">
            <button 
              onClick={() => { setIsAdding(true); setIsEditing(null); setFormData({ name: '', price: 0, type: 'own', category: '', image: '', description: '', details: [], isAffiliate: false, externalLink: '', isBestSeller: false, discount: 0, isShopee: false, rating: 5, soldCount: 0 }); }}
              className="bg-accent text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-accent/90 transition-all flex items-center"
            >
              <Plus size={16} className="mr-2" /> Add Product
            </button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 shadow-xl border border-ink/5 rounded-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <MousePointerClick size={20} className="text-accent" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Total Clicks</span>
              </div>
              <p className="text-3xl font-display font-light">{totalClicks}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-accent mt-2">Affiliate Traffic</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 shadow-xl border border-ink/5 rounded-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Est. Earnings</span>
              </div>
              <p className="text-3xl font-display font-light">{formatRupiah(estimatedEarnings)}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-green-600 mt-2">Rp 500 per click</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 shadow-xl border border-ink/5 rounded-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-ink/5 rounded-lg">
                  <TrendingUp size={20} className="text-ink" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Active Products</span>
              </div>
              <p className="text-3xl font-display font-light">{products.length}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40 mt-2">In Inventory</p>
            </motion.div>
          </div>

          <AnimatePresence>
            {(isAdding || isEditing) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-8 shadow-xl border border-ink/5 mb-12"
              >
                <h2 className="text-2xl font-serif mb-8">{isEditing ? 'Edit Product' : 'New Product'}</h2>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Product Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Price (Rp)</label>
                        <div className="relative">
                          <input 
                            required
                            type="text" 
                            value={formData.price ? formData.price.toLocaleString('id-ID') : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\./g, '');
                              if (/^\d*$/.test(val)) {
                                setFormData({...formData, price: Number(val)});
                              }
                            }}
                            className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                            placeholder="e.g. 245000"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Category</label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                        >
                          <option value="">Select Category</option>
                          <option value="Dresses">Dresses</option>
                          <option value="Knitwear">Knitwear</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Outerwear">Outerwear</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Product Image</label>
                      <div className="flex items-start space-x-4">
                        {formData.image && (
                          <div className="relative w-32 h-32 border border-ink/10 rounded-lg overflow-hidden group">
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[8px] text-white font-bold uppercase tracking-widest">Preview</span>
                            </div>
                          </div>
                        )}
                        <div className={`flex-1 h-32 border-2 border-dashed border-ink/10 rounded-lg flex flex-col items-center justify-center p-4 transition-colors ${isUploading ? 'bg-paper' : 'hover:border-accent/50 cursor-pointer'}`}>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                            disabled={isUploading}
                          />
                          <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                            {isUploading ? (
                              <>
                                <Loader2 size={24} className="text-accent animate-spin mb-2" />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={24} className="text-ink/20 mb-2" />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Click to upload image</span>
                                <span className="text-[8px] text-ink/20 mt-1">PNG, JPG up to 10MB</span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                      <input 
                        type="hidden" 
                        value={formData.image}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Description</label>
                      <textarea 
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent h-32"
                      />
                    </div>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.isAffiliate}
                          onChange={(e) => setFormData({...formData, isAffiliate: e.target.checked, type: e.target.checked ? 'affiliate' : 'own'})}
                          className="w-4 h-4 accent-accent"
                        />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Affiliate Product</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.isBestSeller}
                          onChange={(e) => setFormData({...formData, isBestSeller: e.target.checked})}
                          className="w-4 h-4 accent-accent"
                        />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Best Seller</span>
                      </label>
                    </div>
                    {formData.isAffiliate && (
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">External Affiliate Link</label>
                        <input 
                          required
                          type="text" 
                          value={formData.externalLink}
                          onChange={(e) => setFormData({...formData, externalLink: e.target.value})}
                          className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                          placeholder="https://shopee.co.id/..."
                        />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
                    <button 
                      type="button"
                      onClick={() => { setIsAdding(false); setIsEditing(null); }}
                      className="px-8 py-4 text-xs uppercase tracking-widest font-bold border border-ink/10 hover:bg-paper transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-ink text-paper px-12 py-4 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all"
                    >
                      {isEditing ? 'Update Product' : 'Create Product'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-4">
            {products.map((product) => (
              <motion.div 
                layout
                key={product.id}
                className="bg-white p-4 shadow-sm border border-ink/5 flex items-center justify-between group hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-6">
                  <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-sm" />
                  <div>
                    <h3 className="font-serif text-lg">{product.name}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs font-bold text-accent">{formatRupiah(product.price)}</span>
                      <span className="text-[10px] uppercase tracking-widest text-ink/40">{product.category}</span>
                      {product.isAffiliate && <span className="text-[8px] px-2 py-0.5 bg-accent/10 text-accent font-bold uppercase tracking-widest rounded-full">Affiliate</span>}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEdit(product)}
                    className="p-3 text-ink/40 hover:text-accent hover:bg-accent/5 rounded-full transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setDeleteId(product.id)}
                    className="p-3 text-ink/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : activeTab === 'content' ? (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 shadow-xl border border-ink/5"
        >
          <h2 className="text-2xl font-serif mb-8">Edit Website Content</h2>
          <form onSubmit={handleContentSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-accent border-b border-accent/20 pb-2">Hero Section</h3>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Hero Title</label>
                  <input 
                    type="text" 
                    value={contentForm.heroTitle}
                    onChange={(e) => setContentForm({...contentForm, heroTitle: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Hero Subtitle</label>
                  <input 
                    type="text" 
                    value={contentForm.heroSubtitle}
                    onChange={(e) => setContentForm({...contentForm, heroSubtitle: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Hero Button Text</label>
                  <input 
                    type="text" 
                    value={contentForm.heroButton}
                    onChange={(e) => setContentForm({...contentForm, heroButton: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-accent border-b border-accent/20 pb-2">Product Section</h3>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Section Title</label>
                  <input 
                    type="text" 
                    value={contentForm.sectionTitle}
                    onChange={(e) => setContentForm({...contentForm, sectionTitle: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Section Description</label>
                  <textarea 
                    value={contentForm.sectionDescription}
                    onChange={(e) => setContentForm({...contentForm, sectionDescription: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent h-24"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-accent border-b border-accent/20 pb-2">Navigation & Footer</h3>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Footer Description</label>
                  <textarea 
                    value={contentForm.footerDescription}
                    onChange={(e) => setContentForm({...contentForm, footerDescription: e.target.value})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent h-24"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-accent border-b border-accent/20 pb-2">Menu Items (Comma separated)</h3>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Shop Menu</label>
                  <input 
                    type="text" 
                    value={contentForm.shopMenu.join(', ')}
                    onChange={(e) => setContentForm({...contentForm, shopMenu: e.target.value.split(',').map(s => s.trim())})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Support Menu</label>
                  <input 
                    type="text" 
                    value={contentForm.supportMenu.join(', ')}
                    onChange={(e) => setContentForm({...contentForm, supportMenu: e.target.value.split(',').map(s => s.trim())})}
                    className="w-full bg-paper border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-ink/5">
              <button 
                type="submit"
                className="bg-ink text-paper px-12 py-4 text-xs uppercase tracking-widest font-bold hover:bg-accent transition-all shadow-lg"
              >
                Save All Changes
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Session List */}
          <div className="lg:col-span-1 bg-white shadow-xl border border-ink/5 rounded-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-ink/5 bg-paper/50">
              <h3 className="text-xs uppercase tracking-widest font-bold">Active Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-ink/5">
              {sessions.length === 0 && (
                <div className="p-8 text-center text-ink/40 italic text-sm">No chat history found.</div>
              )}
              {sessions.map((session) => (
                <button
                  key={session.sessionId}
                  onClick={() => setSelectedChat(session)}
                  className={`w-full p-4 text-left hover:bg-paper transition-all flex items-center justify-between group ${selectedChat?.sessionId === session.sessionId ? 'bg-paper' : ''}`}
                >
                  <div>
                    <p className="text-sm font-bold text-ink">{session.userEmail || 'Guest'}</p>
                    <p className="text-[10px] text-ink/40 uppercase tracking-widest mt-1">
                      {new Date(session.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-[10px] bg-ink/5 px-2 py-1 rounded-full group-hover:bg-accent group-hover:text-paper transition-all">
                    {session.messages.length} msgs
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Detail */}
          <div className="lg:col-span-2 bg-white shadow-xl border border-ink/5 rounded-sm overflow-hidden flex flex-col h-[600px]">
            {selectedChat ? (
              <>
                <div className="p-4 border-b border-ink/5 bg-paper/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs uppercase tracking-widest font-bold">Conversation Log</h3>
                    <p className="text-[10px] text-ink/40 uppercase tracking-widest mt-1">Session: {selectedChat.sessionId}</p>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-accent">
                    {selectedChat.userEmail}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-paper/20">
                  {selectedChat.messages.map((msg: any, idx: number) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-ink text-paper rounded-tr-none' : 'bg-white shadow-sm border border-ink/5 rounded-tl-none'}`}>
                        <div className="flex items-center justify-between mb-2 gap-4">
                          <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                            {msg.role === 'user' ? 'User' : 'AI Assistant'}
                          </span>
                          <span className="text-[8px] opacity-40">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-ink/30 flex-col p-12 text-center">
                <MessageCircle size={48} className="mb-4 opacity-20" />
                <p className="font-serif italic">Select a conversation to view the full log.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white p-8 max-w-sm w-full shadow-2xl rounded-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-serif mb-2">Hapus Produk?</h3>
              <p className="text-sm text-ink/60 mb-8 leading-relaxed">
                Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="px-6 py-3 text-xs uppercase tracking-widest font-bold border border-ink/10 hover:bg-paper transition-all rounded-xl"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    deleteProduct(deleteId);
                    setDeleteId(null);
                  }}
                  className="px-6 py-3 text-xs uppercase tracking-widest font-bold bg-red-500 text-white hover:bg-red-600 transition-all rounded-xl shadow-lg shadow-red-500/20"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Footer = () => {
  const { content } = useContent();
  return (
    <footer className="bg-paper border-t border-ink/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-3 mb-6 group">
              <img 
                src={brandConfig.logoUrl} 
                alt={`${brandConfig.brandName} logo`} 
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-xl font-serif tracking-tighter font-semibold italic group-hover:text-accent transition-colors">
                {brandConfig.brandName}
              </span>
            </Link>
            <p className="text-sm text-ink/50 leading-relaxed">
              {content.footerDescription}
            </p>
          </div>
          
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Shop</h4>
            <ul className="space-y-4 text-sm text-ink/60">
              {content.shopMenu.map((item, idx) => (
                <li key={idx}><Link to="/" className="hover:text-ink transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-ink/60">
              {content.supportMenu.map((item, idx) => (
                <li key={idx}><Link to="/" className="hover:text-ink transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Connect</h4>
            <div className="flex space-x-6 text-ink/60">
              <Instagram size={20} className="hover:text-ink cursor-pointer" />
              <Twitter size={20} className="hover:text-ink cursor-pointer" />
              <Facebook size={20} className="hover:text-ink cursor-pointer" />
            </div>
          </div>
        </div>
        
        <div className="border-t border-ink/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] uppercase tracking-widest text-ink/40">
            © 2026 April Fashion. All rights reserved.
          </p>
          <div className="flex space-x-8 text-[10px] uppercase tracking-widest text-ink/40 font-bold">
            <Link to="/" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-ink transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('april_products');
    const initialData = saved ? JSON.parse(saved) : initialProductsData;
    
    // Auto-convert USD to Rupiah (1 USD = 15,000 Rp)
    // We assume prices < 1000 are in USD
    return initialData.map((p: Product) => ({
      ...p,
      price: p.price < 1000 ? p.price * 15000 : p.price
    }));
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('april_products', JSON.stringify(products));
  }, [products]);

  const addProduct = (product: Product) => setProducts([...products, { ...product, clickCount: product.clickCount || 0 }]);
  const updateProduct = (product: Product) => setProducts(products.map(p => p.id === product.id ? product : p));
  const deleteProduct = (id: string) => setProducts(products.filter(p => p.id !== id));
  const trackClick = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, clickCount: (p.clickCount || 0) + 1 } : p));
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, trackClick, searchQuery, setSearchQuery }}>
      {children}
    </ProductContext.Provider>
  );
};

const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('april_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('april_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('april_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (user: User) => {
    setUser(user);
    localStorage.setItem('april_user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('april_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('april_admin_auth') === 'true');

  const handleLogin = () => {
    setIsAdmin(true);
    localStorage.setItem('april_admin_auth', 'true');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('april_admin_auth');
  };

  return (
    <ContentProvider>
      <AuthProvider>
        <ChatProvider>
          <ProductProvider>
            <CartProvider>
              <Router>
                <ScrollToTop />
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/verify-otp" element={<VerifyOTP />} />
                      <Route 
                        path="/admin" 
                        element={isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <AdminLogin onLogin={handleLogin} />} 
                      />
                    </Routes>
                  </main>
                  <Footer />
                  <ChatWidget />
                </div>
              </Router>
            </CartProvider>
          </ProductProvider>
        </ChatProvider>
      </AuthProvider>
    </ContentProvider>
  );
}
