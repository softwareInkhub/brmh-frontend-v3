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
  Menu,
  X,
} from 'lucide-react';

const sidebarItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={20} />,
  },
  {
    name: 'Namespace',
    path: '/namespace',
    icon: <Database size={20} />,
  },
  {
    name: 'AWS',
    path: '/aws',
    icon: <Cloud size={20} />,
  },
  {
    name: 'Tests',
    path: '/tests',
    icon: <Play size={20} />,
  },
  {
    name: 'Docs',
    path: '/docsPage',
    icon: <BookOpen size={20} />,
  },
  {
    name: 'Notification',
    path: '/notification-service',
    icon: <Bell size={20} />,
  },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

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
    <>
      {/* Mobile Hamburger Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50  bg-white  pb-4"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 flex flex-col py-5
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        w-64 md:w-20
      `}>
        {/* Logo - Mobile only */}
        <div className="mb-8 flex items-center justify-center px-6 md:hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-300 flex items-center justify-center mr-3">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-xl font-bold text-gray-900">BRMH</span>
        </div>
        
        {/* Desktop Logo */}
        <div className="mb-6 flex flex-col items-center hidden md:flex">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-300 flex items-center justify-center mb-1 hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => {
            window.location.href = '/landingPage';
          }}>
            <span className="text-white font-bold text-2xl">B</span>
          </div>
        </div>
        
        {/* Main Navigation */}
        <nav className="flex flex-col flex-1 px-4 md:px-0">
          <div className="space-y-1 md:space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-lg group transition-colors md:flex-col md:gap-1 md:py-2 md:w-full
                  ${pathname === item.path 
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 md:bg-white md:text-blue-600 md:shadow-sm' 
                    : 'text-gray-600 hover:text-yellow-700 hover:bg-yellow-50 md:text-gray-500 md:hover:text-blue-600 md:hover:bg-gray-100'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className={`${pathname === item.path ? 'text-yellow-600 md:text-blue-600' : 'text-gray-500 group-hover:text-yellow-700 md:group-hover:text-blue-600'}`}>
                  {item.icon}
                </div>
                <span className="font-medium text-sm md:hidden">{item.name}</span>
                <span className="text-[11px] font-medium mt-0.5 group-hover:text-blue-600 hidden md:block" style={{fontSize:'11px'}}>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
        
        {/* Bottom Section - Settings and Help */}
        <div className="mt-auto px-4 md:px-0">
          <div className="h-px bg-gray-200 mb-3"></div>
          <div className="space-y-1">
            <Link
              href="/settings"
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-gray-600 hover:text-yellow-700 hover:bg-yellow-50 transition-colors md:flex-col md:gap-1 md:py-2 md:w-full md:text-gray-500 md:hover:text-blue-600 md:hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Settings size={20} className="text-gray-500" />
              <span className="font-medium text-sm md:hidden">Settings</span>
              <span className="text-[11px] font-medium mt-0.5 group-hover:text-blue-600 hidden md:block" style={{fontSize:'11px'}}>Settings</span>
            </Link>
            
            <Link
              href="/help"
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-gray-600 hover:text-yellow-700 hover:bg-yellow-50 transition-colors md:flex-col md:gap-1 md:py-2 md:w-full md:text-gray-500 md:hover:text-blue-600 md:hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <HelpCircle size={20} className="text-gray-500" />
              <span className="font-medium text-sm md:hidden">Help Center</span>
              <span className="text-[11px] font-medium mt-0.5 group-hover:text-blue-600 hidden md:block" style={{fontSize:'11px'}}>Help</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;