'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BottomTerminalContextType {
  isOpen: boolean;
  namespace: any;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setNamespace: (namespace: any) => void;
}

const BottomTerminalContext = createContext<BottomTerminalContextType | undefined>(undefined);

export const BottomTerminalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [namespace, setNamespace] = useState<any>(null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);

  return (
    <BottomTerminalContext.Provider value={{ isOpen, namespace, open, close, toggle, setNamespace }}>
      {children}
    </BottomTerminalContext.Provider>
  );
};

export const useBottomTerminal = () => {
  const context = useContext(BottomTerminalContext);
  if (context === undefined) {
    throw new Error('useBottomTerminal must be used within a BottomTerminalProvider');
  }
  return context;
};

