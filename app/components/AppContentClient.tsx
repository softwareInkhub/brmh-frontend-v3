'use client';

import { useState, useEffect } from "react";
import Sidebar from "./projectSidebar";
import DashboardNavbar from "./DashboardNavbar";
import FooterWithCollapseButton from "./FooterWithCollapseButton";
import GlobalAIAgentButton from "./GlobalAIAgentButton";
import { usePathname } from 'next/navigation';
import { useAIAgent } from './AIAgentContext';

export default function AppContentClient({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAIAgentOpen, setIsAIAgentOpen] = useState(false);
  const [currentNamespaceContext, setCurrentNamespaceContext] = useState<any>(null);
  const { isOpen: aiAgentIsOpen, panelWidth } = useAIAgent();
  const pathname = usePathname();
  const hideSidebar = pathname === '/Home' || pathname === '/authPage';

  // Hide body scrollbar on mount, restore on unmount
  useEffect(() => {
    if (!hideSidebar) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }
  }, [hideSidebar]);

  return (
    <>
      <div 
        className={`flex h-screen bg-gray-50 ${!hideSidebar ? 'ml-0 md:ml-20' : ''} transition-all duration-300 ease-in-out overflow-hidden`}
        style={{ 
          marginRight: '0px',
          maxWidth: '100%'
        }}
      >
        {!hideSidebar && <Sidebar />}
        <div className="flex-1 h-screen flex flex-col overflow-hidden" style={{ maxWidth: '100%' }}>
          {!hideSidebar && <DashboardNavbar />}
          <main className="w-full flex-1 overflow-y-auto no-scrollbar px-2 md:px-0" style={{ maxWidth: '100%' }}>
            {children}
          </main>
        </div>
      </div>
      {!hideSidebar && <FooterWithCollapseButton />}
      
      {/* Global AI Agent Button */}
      <GlobalAIAgentButton 
        isVisible={!hideSidebar} 
        onOpen={() => setIsAIAgentOpen(true)}
        onClose={() => setIsAIAgentOpen(false)}
      />
    </>
  );
} 