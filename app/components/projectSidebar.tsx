'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database,
  Play,
  Cloud,
  FileCode,
  HelpCircle,
  History,
  Settings,
  UserPlus,
  Rocket,
  BookOpen,
  Plus,
  Bell,
  User,
} from 'lucide-react';

const sidebarItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={24} />, // Use your logo or API icon
  },
  {
    name: 'Namespace',
    path: '/namespace',
    icon: <Database size={24} />,
  },
  {
  name: 'AWS',
  path: '/aws',
  icon: <Cloud size={24} />, // AWS icon
  },
  {
    name: 'Tests',
    path: '/tests',
    icon: <Play size={24} />, // Tests icon
  },
  {
    name: 'Docs',
    path: '/docsPage',
    icon: <BookOpen size={24} />, // Documentation icon
  },
  {
    name: 'Notification',
    path: '/notification-service',
    icon: <Bell size={24} />,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings size={24} />, // Settings icon
  },

];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const api = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    
    // Call backend to revoke tokens
    try {
      await fetch(`${api}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for cross-domain logout
        body: JSON.stringify({ refresh_token: refreshToken })
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    
    // Clear local storage
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('phone_signup_username');
    } catch {}
    
    // Redirect to auth.brmh.in instead of Cognito
    window.location.href = 'https://auth.brmh.in/login';
  };

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-20 bg-[#f7f8fa] border-r border-gray-200 flex flex-col items-center py-4">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-300 flex items-center justify-center mb-1 hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => {
          window.location.href = '/landingPage';
        }}>
          {/* Replace with your logo if needed */}
          <span className="text-white font-bold text-2xl">B</span>
        </div>
      </div>
      {/* Icons */}
      <nav className="flex flex-col gap-2 flex-1 items-center w-full">
        {sidebarItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`flex flex-col items-center gap-1 py-2 w-full group transition-colors
              ${pathname === item.path ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'}`}
      >
            <span className="flex items-center justify-center w-full">{item.icon}</span>
            <span className="text-[11px] font-medium mt-0.5 group-hover:text-blue-500" style={{fontSize:'11px'}}>{item.name}</span>
            </Link>
        ))}
          </nav>
      
      {/* Notification and User Profile */}
      <div className="mt-auto mb-4 flex flex-col items-center gap-3">
        {/* Notification Bell */}
        <div className="relative group">
          <button className="flex flex-col items-center gap-1 py-2 w-full text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </div>
            <span className="text-[11px] font-medium">Notify</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="relative group" ref={dropdownRef}>
          <button 
            className="flex flex-col items-center gap-1 py-2 w-full text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <User size={16} className="text-white" />
            </div>
            <span className="text-[11px] font-medium">Profile</span>
          </button>
          
          {/* Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="absolute bottom-0 left-full ml-2 w-48 py-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
              <Link 
                href="/profile" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <User size={14} />
                Profile
              </Link>
              <Link 
                href="/settings" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <Settings size={14} />
                Settings
              </Link>
              <div className="h-px bg-gray-200 my-2"></div>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  handleLogout();
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
      </aside>
  );
};

export default Sidebar;