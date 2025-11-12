import { useSidePanel } from "./SidePanelContext";
import { useBottomTerminal } from "./BottomTerminalContext";
import { ChevronLeft, ChevronRight } from "react-feather";
import { useState, useRef, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Bot, GripHorizontal } from 'lucide-react';

const SIDEBAR_WIDTH = 80;
const SIDEPANEL_WIDTH = 256;
const TERTIARY_SIDEBAR_WIDTH = 224; // w-56 = 224px
const TERTIARY_SIDEBAR_COLLAPSED_WIDTH = 48; // collapsed width
const MIN_HEIGHT = 200;
const MAX_HEIGHT = 800;
const DEFAULT_HEIGHT = 350;

// Dynamically import AIAgentWorkspace
const AIAgentWorkspace = dynamic(() => import('../namespace/components/AIAgentWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0e1621]">
      <div className="flex items-center gap-3 text-white">
        <Bot className="animate-pulse" size={24} />
        <span>Loading AI Agent...</span>
      </div>
    </div>
  )
});

export default function FooterWithCollapseButton() {
  const { isCollapsed, toggle } = useSidePanel();
  const { isOpen: bottomTerminalOpen, toggle: toggleBottomTerminal, namespace: terminalNamespace } = useBottomTerminal();
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [tertiarySidebarState, setTertiarySidebarState] = useState<'none' | 'expanded' | 'collapsed'>('none');
  const [rightPanelWidth, setRightPanelWidth] = useState(0);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Check if tertiary sidebar exists and its state (expanded/collapsed)
  useEffect(() => {
    const checkTertiarySidebar = () => {
      const tertiarySidebar = document.querySelector('.tertiary-sidebar');
      if (tertiarySidebar) {
        const width = parseInt(window.getComputedStyle(tertiarySidebar).width);
        // Check if expanded (>100px) or collapsed (<=100px)
        if (width > 100) {
          setTertiarySidebarState('expanded');
        } else {
          setTertiarySidebarState('collapsed');
        }
      } else {
        setTertiarySidebarState('none');
      }
    };

    checkTertiarySidebar();
    // Check periodically as sidebar can appear/disappear/resize based on navigation
    const interval = setInterval(checkTertiarySidebar, 300);

    return () => clearInterval(interval);
  }, []);

  // Check for right side panel (method details/create panel AND namespace details panel)
  useEffect(() => {
    const checkRightPanel = () => {
      // IMPORTANT: Multiple namespace tabs = multiple modals in DOM!
      // We need to check ALL panels (method panels + namespace panels) and find the one that's actually visible
      const methodPanels = document.querySelectorAll('.method-details-panel') as NodeListOf<HTMLElement>;
      const namespacePanels = document.querySelectorAll('.namespace-details-panel') as NodeListOf<HTMLElement>;
      const rightPanels = [...Array.from(methodPanels), ...Array.from(namespacePanels)];
      
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
    // Check periodically as panel can open/close
    const interval = setInterval(checkRightPanel, 100); // Faster polling for better responsiveness

    return () => clearInterval(interval);
  }, []);

  // Mouse event handlers for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = panelHeight;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      e.preventDefault();
      const deltaY = resizeStartY.current - e.clientY; // Inverted because we're dragging from top
      const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, resizeStartHeight.current + deltaY));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, panelHeight]);

  return (
    <>
      {bottomTerminalOpen && (
        <div
          className="fixed bg-white shadow-lg overflow-hidden bottom-ai-agent-panel"
          style={{
            left: isCollapsed 
              ? SIDEBAR_WIDTH 
              : (tertiarySidebarState === 'expanded'
                  ? SIDEBAR_WIDTH + SIDEPANEL_WIDTH + TERTIARY_SIDEBAR_WIDTH 
                  : tertiarySidebarState === 'collapsed'
                    ? SIDEBAR_WIDTH + SIDEPANEL_WIDTH + TERTIARY_SIDEBAR_COLLAPSED_WIDTH
                    : SIDEBAR_WIDTH + SIDEPANEL_WIDTH),
            right: rightPanelWidth,
            width: isCollapsed
              ? `calc(100% - ${SIDEBAR_WIDTH + rightPanelWidth}px)`
              : (tertiarySidebarState === 'expanded'
                  ? `calc(100% - ${SIDEBAR_WIDTH + SIDEPANEL_WIDTH + TERTIARY_SIDEBAR_WIDTH + rightPanelWidth}px)`
                  : tertiarySidebarState === 'collapsed'
                    ? `calc(100% - ${SIDEBAR_WIDTH + SIDEPANEL_WIDTH + TERTIARY_SIDEBAR_COLLAPSED_WIDTH + rightPanelWidth}px)`
                    : `calc(100% - ${SIDEBAR_WIDTH + SIDEPANEL_WIDTH + rightPanelWidth}px)`),
            bottom: 40,
            height: `${panelHeight}px`,
            margin: 0,
            padding: 0,
            borderTop: '3px solid #6366f1',
            transition: isResizing ? 'none' : 'all 0.3s ease',
            zIndex: 35,
          }}
        >
          {/* Resize Handle - Minimal */}
          <div
            onMouseDown={handleMouseDown}
            className={`absolute top-0 left-0 right-0 h-1 cursor-ns-resize group z-[100] ${
              isResizing 
                ? 'bg-indigo-600' 
                : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
            style={{ 
              userSelect: 'none',
              transition: isResizing ? 'none' : 'background-color 0.2s ease'
            }}
            title="Drag to resize panel"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-indigo-700 px-2 py-0.5 rounded-full shadow-lg">
                <GripHorizontal 
                  className="text-white"
                  size={12} 
                />
              </div>
            </div>
          </div>
          <div className="w-full h-full relative" style={{ paddingTop: '4px' }}>
            <style dangerouslySetInnerHTML={{__html: `
              /* Override AIAgentWorkspace fixed positioning when in bottom panel */
              .bottom-ai-agent-container > div {
                position: relative !important;
                top: auto !important;
                right: auto !important;
                left: auto !important;
                width: 100% !important;
                max-width: 100% !important;
                height: 100% !important;
                border-left: none !important;
              }
            `}} />
            <div className="bottom-ai-agent-container w-full" style={{ height: 'calc(100% - 4px)' }}>
              <AIAgentWorkspace
                namespace={terminalNamespace}
                onClose={toggleBottomTerminal}
              />
            </div>
          </div>
        </div>
      )}
    <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50 flex justify-between items-center px-8 py-1 gap-1">
      {/* Collapse/Expand Button */}
      <button
        className="bg-gray-100 text-gray-700 px-2 ml-4 py-0.5 rounded-full text-xs hover:bg-gray-200 transition flex items-center"
        onClick={toggle}
        aria-label={isCollapsed ? "Expand side panel" : "Collapse side panel"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      <div className="flex gap-1">
        <button className="bg-blue-600 text-white px-3 py-0.5 rounded-md text-xs hover:bg-blue-700 transition">Action 1</button>
        <button className="bg-gray-200 text-gray-700 px-3 py-0.5 rounded-md text-xs hover:bg-gray-300 transition">Action 2</button>
        <button className="bg-green-600 text-white px-3 py-0.5 rounded-md text-xs hover:bg-green-700 transition">Action 3</button>
        <button
          className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white px-4 py-1 rounded-lg text-xs font-medium shadow-md hover:shadow-lg transition-all duration-200 ml-2 flex items-center gap-1.5"
          onClick={toggleBottomTerminal}
        >
          <Bot size={16} />
          {bottomTerminalOpen ? 'Close AI Agent' : 'Open AI Agent'}
        </button>
      </div>
    </footer>
    </>
  );
} 