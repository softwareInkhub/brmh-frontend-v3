'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useDrop } from 'react-dnd';
import { toast } from 'sonner';
import { useNamespaceContext } from './NamespaceContext';
import { useAIAgent } from './AIAgentContext';
import { useBottomTerminal } from './BottomTerminalContext';

interface GlobalAIAgentButtonProps {
  isVisible?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

const GlobalAIAgentButton: React.FC<GlobalAIAgentButtonProps> = ({ isVisible = true, onOpen, onClose }) => {
  const { isOpen: isBottomTerminalOpen, open: openBottomTerminal, setNamespace: setTerminalNamespace } = useBottomTerminal();
  const { setIsOpen: setContextIsOpen } = useAIAgent();
  const [isDragOver, setIsDragOver] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(0);
  const dropRef = useRef<HTMLDivElement>(null);
  const { currentNamespace, getCurrentNamespaceContext } = useNamespaceContext();

  // Drop zone for namespace
  const [{ isOver }, drop] = useDrop({
    accept: 'namespace',
    drop: (item: any) => {
      console.log('Drop function called with item:', item);
      console.log('Namespace dropped:', item.namespace);
      setTerminalNamespace(item.namespace);
      openBottomTerminal();
      setIsDragOver(false);
      
      // Show success toast
      if (item.namespace && item.namespace['namespace-name']) {
        toast.success(`AI Agent context set to: ${item.namespace['namespace-name']}`, {
          description: 'You can now ask questions about this namespace',
          duration: 3000,
        });
      }
    },
    hover: () => {
      console.log('Hovering over drop zone');
      setIsDragOver(true);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Connect the drop ref
  drop(dropRef);
  
  // Debug logging
  useEffect(() => {
    console.log('Drop zone isOver:', isOver);
    console.log('Drop zone isDragOver:', isDragOver);
  }, [isOver, isDragOver]);

  // Check for right side panel (method details/create panel)
  useEffect(() => {
    const checkRightPanel = () => {
      // IMPORTANT: Multiple namespace tabs = multiple modals in DOM!
      // We need to check ALL panels and find the one that's actually visible
      const rightPanels = document.querySelectorAll('.method-details-panel') as NodeListOf<HTMLElement>;
      
      let foundVisiblePanel = false;
      
      for (const rightPanel of rightPanels) {
        // Get bounding rect to check if panel is actually visible on screen
        const rect = rightPanel.getBoundingClientRect();
        const styles = window.getComputedStyle(rightPanel);
        
        // Panel is visible if:
        // 1. It has width
        // 2. It's positioned on the right side of the screen (right edge is at viewport)
        // 3. Basic visibility checks
        // 4. Parent is not hidden (for namespace tabs)
        const parentHidden = rightPanel.closest('[style*="display: none"]') !== null;
        
        const isVisible = rect.width > 0 && 
                         rect.right >= window.innerWidth - 10 &&
                         styles.display !== 'none' && 
                         styles.visibility !== 'hidden' &&
                         !parentHidden;
        
        if (isVisible) {
          const width = parseInt(styles.width);
          setRightPanelWidth(width > 0 ? width : 0);
          foundVisiblePanel = true;
          break; // Found visible panel, stop searching
        }
      }
      
      if (!foundVisiblePanel) {
        setRightPanelWidth(0);
      }
    };

    checkRightPanel();
    const interval = setInterval(checkRightPanel, 100); // Faster polling

    return () => clearInterval(interval);
  }, []);

  const handleOpenAIAgent = (forceGeneralContext = false) => {
    // Get current namespace context if available
    const contextNamespace = getCurrentNamespaceContext();
    console.log('Opening AI Agent, current namespace context:', contextNamespace);
    
    if (forceGeneralContext) {
      // Force general context for namespace generation
      setTerminalNamespace(null);
      toast.success('AI Agent opened in general context', {
        description: 'You can now create new namespaces or work on general tasks',
        duration: 3000,
      });
    } else if (contextNamespace) {
      // Prefer current namespace context when available
      setTerminalNamespace(contextNamespace);
      console.log('Using current namespace context:', contextNamespace);
      toast.success(`AI Agent opened with current namespace: ${contextNamespace['namespace-name']}`, {
        description: 'Using current namespace context',
        duration: 3000,
      });
    } else {
      // Default to general context for namespace generation
      setTerminalNamespace(null);
      console.log('Opening AI Agent in general context (default)');
      toast.success('AI Agent opened in general context', {
        description: 'You can now create new namespaces or work on general tasks',
        duration: 3000,
      });
    }
    openBottomTerminal();
    setContextIsOpen(true);
    onOpen?.();
  };

  if (!isVisible || isBottomTerminalOpen) return null;

  return (
    <>
      {/* Global Floating AI Agent Button */}
      <div
        ref={dropRef}
        className={`fixed bottom-12 z-40 transition-all duration-300 ${
          isDragOver ? 'scale-110' : 'scale-100'
        }`}
        style={{ 
          right: `${rightPanelWidth + 24}px`,
          border: isDragOver ? '3px dashed #8b5cf6' : 'none',
          borderRadius: '50%',
          padding: isDragOver ? '3px' : '0px'
        }}
      >
        <button
          onClick={(e) => {
            if (e.shiftKey) {
              // Shift+click opens in general context
              handleOpenAIAgent(true);
            } else {
              handleOpenAIAgent(false);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            // Right-click uses current namespace context if available
            const contextNamespace = getCurrentNamespaceContext();
            if (contextNamespace) {
              setTerminalNamespace(contextNamespace);
              toast.success(`AI Agent opened with current namespace: ${contextNamespace['namespace-name']}`, {
                description: 'Using current namespace context',
                duration: 3000,
              });
            } else {
              setTerminalNamespace(null);
              toast.success('AI Agent opened in general context', {
                description: 'No current namespace context available',
                duration: 3000,
              });
            }
            openBottomTerminal();
            onOpen?.();
          }}
          className={`group relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${
            isDragOver
              ? 'bg-purple-600 shadow-purple-500/50 scale-110 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/50 hover:shadow-blue-500/70'
          }`}
          title="Open AI Agent in Bottom Terminal - Click for general context | Right-click for current namespace | Drag namespace here"
        >
          {/* Drag indicator */}
          {isDragOver && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          )}
          
          <Bot className="w-7 h-7 text-white" />
          
          
        </button>
      </div>
    </>
  );
};

export default GlobalAIAgentButton;
