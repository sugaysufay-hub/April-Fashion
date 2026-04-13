import React, { createContext, useContext, useState, useEffect } from 'react';

interface WebsiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroButton: string;
  sectionTitle: string;
  sectionDescription: string;
  shopMenu: string[];
  supportMenu: string[];
  footerDescription: string;
}

interface ContentContextType {
  content: WebsiteContent;
  updateContent: (newContent: WebsiteContent) => Promise<void>;
  isLoading: boolean;
}

const defaultContent: WebsiteContent = {
  heroTitle: "Ethereal Essence",
  heroSubtitle: "New Collection 2026",
  heroButton: "Explore Collection",
  sectionTitle: "Curated Essentials",
  sectionDescription: "Timeless pieces designed for the modern woman, crafted with the finest materials.",
  shopMenu: ["Shop All", "New Arrivals", "Best Sellers"],
  supportMenu: ["Shipping & Returns", "Contact Us", "FAQ", "Size Guide"],
  footerDescription: "Premium fashion destination for the modern woman. Curated collections that blend elegance with contemporary style."
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<WebsiteContent>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/content');
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateContent = async (newContent: WebsiteContent) => {
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent),
      });
      if (response.ok) {
        setContent(newContent);
      }
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  };

  return (
    <ContentContext.Provider value={{ content, updateContent, isLoading }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
