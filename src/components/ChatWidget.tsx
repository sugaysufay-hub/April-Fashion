import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, Bot, Loader2, Phone } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, isTyping } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    { label: 'Produk', value: 'Boleh info produk terbaru?' },
    { label: 'Size Guide', value: 'Bagaimana panduan ukurannya?' },
    { label: 'Promo', value: 'Apakah ada promo saat ini?' },
    { label: 'Pengiriman', value: 'Berapa lama pengirimannya?' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    await sendMessage(text);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
    setInput('');
  };

  const handleWhatsApp = () => {
    const phone = '6281234567890'; // Example phone
    const text = encodeURIComponent('Halo saya mau tanya produk April Fashion');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[380px] h-[550px] bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden border border-ink/5"
          >
            {/* Header */}
            <div className="bg-ink p-5 flex items-center justify-between text-paper">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center border border-accent/30">
                    <Bot size={20} className="text-accent" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-ink rounded-full" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em]">Customer Service</h3>
                  <p className="text-[10px] text-paper/60 uppercase tracking-widest flex items-center">
                    Online <span className="ml-1 w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-paper/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 bg-paper/20 scrollbar-hide"
            >
              {/* Welcome Message */}
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[85%]">
                  <div className="w-6 h-6 bg-accent/10 text-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={12} />
                  </div>
                  <div className="bg-white shadow-sm border border-ink/5 p-4 rounded-2xl rounded-tl-none">
                    <p className="text-sm text-ink leading-relaxed">
                      Hai kak 👋 ada yang bisa kami bantu?
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat History */}
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start max-w-[85%] space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-ink/10 text-ink' : 'bg-accent/10 text-accent'}`}>
                      {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-ink text-paper rounded-tr-none shadow-lg' : 'bg-white shadow-sm border border-ink/5 rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-accent/10 text-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={12} />
                    </div>
                    <div className="bg-white shadow-sm border border-ink/5 p-3 rounded-2xl rounded-tl-none">
                      <Loader2 size={16} className="animate-spin text-accent" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies & WhatsApp */}
            <div className="p-4 bg-white border-t border-ink/5 space-y-3">
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply.label}
                    onClick={() => handleSend(reply.value)}
                    className="px-3 py-1.5 bg-paper border border-ink/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-accent hover:text-accent transition-all"
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleWhatsApp}
                className="w-full bg-green-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
              >
                <Phone size={14} />
                <span>Lanjut ke WhatsApp</span>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="p-4 bg-paper/30 flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pesan..."
                className="flex-1 bg-white border border-ink/10 px-4 py-3 text-sm rounded-xl focus:outline-none focus:border-accent transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-3 bg-ink text-paper rounded-xl hover:bg-accent disabled:opacity-50 transition-all shadow-md"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bubble */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-ink text-paper rounded-full shadow-2xl flex items-center justify-center hover:shadow-accent/20 transition-all relative group"
      >
        <div className="absolute inset-0 bg-accent rounded-full opacity-0 group-hover:opacity-10 transition-opacity" />
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-paper animate-bounce" />
        )}
      </motion.button>
    </div>
  );
};

export default ChatWidget;
