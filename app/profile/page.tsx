'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Shield, Settings, Edit, Save, X, Globe, Key, Clock, CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  userId?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  cognitoUsername?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: {
    signupMethod?: string;
    verified?: boolean;
    lastLogin?: string;
    loginCount?: number;
    accessedDomains?: string[];
    accessedNamespaces?: string[];
    lastAccessedDomain?: string;
    lastAccessedNamespace?: string;
  };
  namespaceRoles?: Record<string, {
    role: string;
    permissions: string[];
  }>;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    phoneNumber: '',
  });
  const [saving, setSaving] = useState(false);
  const [showUserId, setShowUserId] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get user info from localStorage/tokens
  useEffect(() => {
    // Helper function to decode token
    const decodeToken = (token: string | null) => {
      if (!token) {
        return {
          userEmail: 'admin@brmh.in',
          userName: 'Admin User',
          userId: null,
          cognitoUsername: null,
          authTime: null,
          iat: null,
          exp: null,
          authTimeISO: null,
          iatISO: null,
          expISO: null,
        };
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
    
        const authTime = payload.auth_time ?? payload.iat ?? null;
        const iat = payload.iat ?? null;
        const exp = payload.exp ?? null;

        const authTimeISO = authTime ? new Date(authTime * 1000).toISOString() : null;
        const iatISO = iat ? new Date(iat * 1000).toISOString() : null;
        const expISO = exp ? new Date(exp * 1000).toISOString() : null;

        return {
          userEmail: payload.email || payload['cognito:username'] || 'admin@brmh.in',
          userName: payload.name || payload['cognito:username'] || 'Admin User',
          userId: payload.sub || payload['cognito:username'] || null,
          cognitoUsername: payload['cognito:username'] || payload.sub || null,
          authTime,
          iat,
          exp,
          authTimeISO,
          iatISO,
          expISO,
        };
      } catch (e) {
        console.warn('Could not decode token:', e);
        return {
          userEmail: 'admin@brmh.in',
          userName: 'Admin User',
          userId: null,
          cognitoUsername: null,
          authTime: null,
          iat: null,
          exp: null,
          authTimeISO: null,
          iatISO: null,
          expISO: null,
        };
      }
    };
    
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        
        // Try to get user info from token or API
        const idToken = typeof window !== 'undefined' ? localStorage.getItem('id_token') : null;
        
        
        // Decode token to get user info
        const tokenData = decodeToken(idToken);
        let {
          userEmail,
          userName,
          userId,
          cognitoUsername,
          authTime,
          iat,
          authTimeISO,
          iatISO,
        } = tokenData;

        // Try to load cached profile data first
        let cachedProfile = null;
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('profile_cache');
            if (cached) {
              cachedProfile = JSON.parse(cached);
            }
          } catch (e) {
            console.warn('Could not load cached profile:', e);
          }
        }

        // Try to fetch full profile from API
        try {
          const response = await fetch(`${apiBase}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${idToken || ''}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            // /auth/me returns { user: decoded } format
            const userData = data.user || data;
            const baseUsername = userData.name || userData['cognito:username'] || userName;
            const basePhoneNumber = userData.phone_number || userData.phoneNumber || '';
            
            const createdAt = (userData.iat && new Date(userData.iat * 1000).toISOString()) || iatISO;
            const lastLogin =
              (userData.auth_time && new Date(userData.auth_time * 1000).toISOString()) ||
              authTimeISO ||
              createdAt;

            setProfile({
              userId: userData.sub || userData['cognito:username'] || userId,
              username: cachedProfile?.username || baseUsername,
              email: userData.email || userEmail,
              cognitoUsername: userData['cognito:username'] || userData.sub || cognitoUsername,
              phoneNumber: cachedProfile?.phoneNumber || basePhoneNumber,
              status: 'active',
              metadata: {
                verified: userData.email_verified || true,
                signupMethod: 'email',
                lastLogin,
              },
              createdAt,
            });
            setEditForm({
              username: cachedProfile?.username || baseUsername,
              phoneNumber: cachedProfile?.phoneNumber || basePhoneNumber,
            });
          } else {
            // Fallback to basic info from token
            setProfile({
              userId: userId,
              username: userName,
              email: userEmail,
              cognitoUsername: cognitoUsername,
              status: 'active',
              createdAt: iatISO || undefined,
              metadata: {
                verified: true,
                signupMethod: 'email',
                lastLogin: authTimeISO || iatISO || undefined,
              },
            });
            setEditForm({
              username: userName,
              phoneNumber: '',
            });
          }
        } catch (error) {
          // Fallback to basic info from token
          setProfile({
            userId: userId,
            username: userName,
            email: userEmail,
            cognitoUsername: cognitoUsername,
            status: 'active',
            metadata: {
              verified: true,
              signupMethod: 'email',
            },
          });
          setEditForm({
            username: userName,
            phoneNumber: '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Set default profile with token data if available
        const idToken = typeof window !== 'undefined' ? localStorage.getItem('id_token') : null;
        const tokenData = decodeToken(idToken);
        setProfile({
          userId: tokenData.userId,
          username: tokenData.userName,
          email: tokenData.userEmail,
          cognitoUsername: tokenData.cognitoUsername,
          status: 'active',
          createdAt: tokenData.iatISO || undefined,
          metadata: {
            verified: true,
            signupMethod: 'email',
            lastLogin: tokenData.authTimeISO || tokenData.iatISO || undefined,
          },
        });
        setEditForm({
          username: tokenData.userName,
          phoneNumber: '',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Note: There's no backend endpoint for updating profile yet
      // For now, we'll just update local state
      // TODO: Create PUT /auth/me or PUT /auth/user/profile endpoint in backend
      setProfile({
        ...profile,
        username: editForm.username,
        phoneNumber: editForm.phoneNumber,
      });
      setEditing(false);
      
      // Optionally, you could store in localStorage as a temporary solution
      if (typeof window !== 'undefined') {
        const profileCache = {
          username: editForm.username,
          phoneNumber: editForm.phoneNumber,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('profile_cache', JSON.stringify(profileCache));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      // Update local state anyway
      setProfile({
        ...profile,
        username: editForm.username,
        phoneNumber: editForm.phoneNumber,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      username: profile?.username || '',
      phoneNumber: profile?.phoneNumber || '',
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 px-4 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                User Profile
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Manage your account information and settings
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors mt-2 sm:mt-0 w-full sm:w-auto"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-800/80 overflow-hidden backdrop-blur-sm">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 relative overflow-hidden">
            {/* subtle glow circles for dark mode aesthetics */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl opacity-40 dark:opacity-60" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/30 blur-3xl opacity-40 dark:opacity-60" />
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white/90 dark:bg-gray-900/80 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-300 shadow-xl ring-4 ring-white/20 dark:ring-slate-700/60 relative z-10">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 text-white relative z-10">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="Username"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-sm">
                      {profile?.username || 'User'}
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-blue-50/90 dark:text-slate-200/90">
                      {profile?.email || 'No email'}
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-2 relative z-10">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors flex items-center justify-center shadow-sm"
                    aria-label="Edit profile"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{profile?.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1234567890"
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {profile?.phoneNumber || 'Not provided'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Status
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {profile?.status === 'active' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-gray-900 dark:text-white capitalize">
                        {profile?.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Verified
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {profile?.metadata?.verified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-gray-900 dark:text-white">
                        {profile?.metadata?.verified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Account Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      User ID
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Key className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-gray-900 dark:text-white font-mono text-sm flex-1 truncate">
                        {showUserId 
                          ? (profile?.userId || profile?.cognitoUsername || 'N/A')
                          : '********'}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onMouseDown={() => setShowUserId(true)}
                          onMouseUp={() => setShowUserId(false)}
                          onMouseLeave={() => setShowUserId(false)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          title={showUserId ? 'Hide User ID' : 'Show User ID'}
                        >
                          {showUserId ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            const userId = profile?.userId || profile?.cognitoUsername || 'N/A';
                            if (userId !== 'N/A') {
                              navigator.clipboard.writeText(userId);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }
                          }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors relative"
                          title="Copy User ID"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Member Since
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {profile?.createdAt 
                          ? new Date(profile.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Login
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {profile?.metadata?.lastLogin
                          ? new Date(profile.metadata.lastLogin).toLocaleString('en-US')
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Total logins removed for now */}
                </div>
              </div>
            </div>

            {/* Namespace Roles */}
            {profile?.namespaceRoles && Object.keys(profile.namespaceRoles).length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Namespace Roles & Permissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(profile.namespaceRoles).map(([namespace, roleData]) => (
                    <div
                      key={namespace}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white capitalize">
                          {namespace}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm">
                          {roleData.role}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {roleData.permissions.map((permission, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accessed Namespaces */}
            {profile?.metadata?.accessedNamespaces && profile.metadata.accessedNamespaces.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Accessed Namespaces
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.metadata.accessedNamespaces.map((namespace, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                    >
                      {namespace}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

