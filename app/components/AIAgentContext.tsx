'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AIAgentContextType {
  isOpen: boolean;
  panelWidth: number;
  setIsOpen: (isOpen: boolean) => void;
  setPanelWidth: (width: number) => void;
}

const AIAgentContext = createContext<AIAgentContextType | undefined>(undefined);

export const useAIAgent = () => {
  const context = useContext(AIAgentContext);
  if (context === undefined) {
    throw new Error('useAIAgent must be used within an AIAgentProvider');
  }
  return context;
};

interface AIAgentProviderProps {
  children: ReactNode;
}

export const AIAgentProvider: React.FC<AIAgentProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(800); // Default width

  return (
    <AIAgentContext.Provider value={{ isOpen, panelWidth, setIsOpen, setPanelWidth }}>
      {children}
    </AIAgentContext.Provider>
  );
};

