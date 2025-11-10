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
    <nav className="sticky top-0 z-30 w-full bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 shadow-sm backdrop-blur-sm">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - BRMH Logo & Title with Tooltip */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative group/tooltip">
              <Link href="/user-dashboard" className="flex items-center gap-3 group">
                <div className="relative">
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl opacity-20 blur-md group-hover:opacity-30 transition-opacity"></div>
                  {/* Main logo */}
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-400 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                    <span className="text-white font-bold text-xl drop-shadow-sm">B</span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 bg-clip-text text-transparent">
                    BRMH
                  </span>
                  <span className="text-[10px] text-gray-500 -mt-1">Backend Runtime Manager</span>
                </div>
              </Link>
              
              {/* Logo Tooltip */}
              <div className="absolute top-full mt-2 left-0 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 ease-out z-50 pointer-events-none">
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl min-w-[200px] relative">
                  <div className="absolute bottom-full left-4 border-8 border-transparent border-b-gray-900"></div>
                  <div className="text-sm font-semibold mb-0.5">BRMH Dashboard</div>
                  <div className="text-xs text-gray-300 leading-tight">Go to main dashboard</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right section - Search, Notifications & User Profile */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
            {/* Search Bar with Tooltip - Compact & Elegant */}
            <div className="relative group/tooltip hidden md:block w-64 lg:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white text-sm transition-all hover:border-gray-300 hover:bg-white"
              />
              
              {/* Search Tooltip */}
              <div className="absolute top-full mt-2 left-0 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-focus-within:opacity-0 group-focus-within:invisible transition-all duration-200 ease-out z-50 pointer-events-none">
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl min-w-[200px] relative">
                  <div className="absolute bottom-full left-4 border-8 border-transparent border-b-gray-900"></div>
                  <div className="text-sm font-semibold mb-0.5">Quick Search</div>
                  <div className="text-xs text-gray-300 leading-tight">Search across namespaces, methods, and more</div>
                </div>
              </div>
            </div>

            {/* Mobile Search Button with Tooltip */}
            <div className="relative group/tooltip md:hidden">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="h-5 w-5" />
              </button>
              
              {/* Mobile Search Tooltip */}
              <div className="absolute top-full mt-2 right-0 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 ease-out z-50 pointer-events-none">
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl min-w-[140px] relative">
                  <div className="absolute bottom-full right-2 border-6 border-transparent border-b-gray-900"></div>
                  <div className="text-xs text-gray-300">Search</div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block h-6 w-px bg-gray-200"></div>

            {/* Notifications with Tooltip */}
            <div className="relative group/tooltip">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-lg transition-all group">
                <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
              </button>
              
              {/* Notification Tooltip */}
              <div className="absolute top-full mt-2 right-0 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 ease-out z-50 pointer-events-none">
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl min-w-[160px] relative">
                  <div className="absolute bottom-full right-2 border-8 border-transparent border-b-gray-900"></div>
                  <div className="text-sm font-semibold mb-0.5">Notifications</div>
                  <div className="text-xs text-gray-300 leading-tight">You have new updates</div>
                </div>
              </div>
            </div>

            {/* User Profile with Tooltip */}
            <div className="relative group/tooltip" ref={dropdownRef}>
              <button 
                className="flex items-center gap-2 md:gap-3 p-1.5 md:px-3 md:py-2 hover:bg-gray-100/80 rounded-lg transition-all group border border-transparent hover:border-gray-200"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">admin@brmh.in</p>
                </div>
              </button>
              
              {/* User Profile Tooltip (only when dropdown is closed) */}
              {!isProfileDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 ease-out z-50 pointer-events-none">
                  <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl min-w-[180px] relative">
                    <div className="absolute bottom-full right-4 border-8 border-transparent border-b-gray-900"></div>
                    <div className="text-sm font-semibold mb-0.5">Account Menu</div>
                    <div className="text-xs text-gray-300 leading-tight">Profile, settings, and logout</div>
                  </div>
                </div>
              )}
              
              
              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 py-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-sm">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Admin User</p>
                        <p className="text-xs text-gray-600">admin@brmh.in</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors group"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <User className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    <span className="group-hover:text-blue-600 transition-colors">Profile Settings</span>
                  </Link>
                  
                  <Link 
                    href="/settings" 
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors group"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    <span className="group-hover:text-blue-600 transition-colors">Account Settings</span>
                  </Link>
                  
                  <div className="h-px bg-gray-200 my-2"></div>
                  
                  <button 
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors group"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                  >
                    <svg className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="font-medium">Sign Out</span>
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
