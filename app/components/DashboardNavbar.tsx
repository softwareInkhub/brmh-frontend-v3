'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Settings, Search, Menu, X } from 'lucide-react';
import Link from 'next/link';

const DashboardNavbar = () => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
        credentials: 'include',
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
    
    // Redirect to auth.brmh.in
    window.location.href = 'https://auth.brmh.in/login';
  };

  return (
    <nav className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Empty space for mobile centering */}
          <div className="flex items-center md:hidden flex-shrink-0">
            <div className="w-8 h-8"></div>
          </div>

          {/* Center section - Logo (mobile only) */}
          <div className="flex items-center justify-center md:hidden flex-1">
            <Link href="/landingPage" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-300 flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">BRMH</span>
            </Link>
          </div>

          {/* Center section - Search (hidden on mobile) */}
          <div className="hidden md:flex flex-1 justify-center max-w-md">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search dashboard..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-1 md:space-x-3 flex-shrink-0">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* User Profile */}
            <div className="relative" ref={dropdownRef}>
              <button 
                className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">admin@brmh.in</p>
                </div>
              </button>
              
              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 py-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Admin User</p>
                    <p className="text-xs text-gray-500">admin@brmh.in</p>
                  </div>
                  
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  
                  <Link 
                    href="/settings" 
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  
                  <div className="h-px bg-gray-200 my-2"></div>
                  
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
