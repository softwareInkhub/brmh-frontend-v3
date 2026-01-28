'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const addDebugLog = (message: string) => {
    console.log(`[AuthGuard] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Determine API URL based on environment
      const isProduction = window.location.hostname.includes('brmh.in') && !window.location.hostname.includes('localhost');
      let API_BASE_URL = isProduction 
        ? (process.env.NEXT_PUBLIC_AWS_URL || 'https://brmh.in')
        : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001');
      
      // Remove trailing slash to prevent double slashes in URLs
      API_BASE_URL = API_BASE_URL.replace(/\/+$/, '');
      
      // Safety check: If API_BASE_URL points to auth.brmh.in, redirect to brmh.in
      if (API_BASE_URL.includes('auth.brmh.in')) {
        console.warn('[AuthGuard] API_BASE_URL incorrectly points to auth.brmh.in, using brmh.in instead');
        API_BASE_URL = 'https://brmh.in';
      }
      
      // Get auth URL from environment variable with fallback logic
      // Priority: .env > default localhost:3000 (auth app) > fallback
      const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL  || 'http://localhost:3000';
      
      addDebugLog(`🔍 Starting auth check for path: ${pathname}`);
      addDebugLog(`📍 Current URL: ${window.location.href.substring(0, 100)}`);
      addDebugLog(`🌐 API Base URL: ${API_BASE_URL} (${isProduction ? 'production' : 'development'})`);
      
      // Skip auth check for public routes (removed /login as it's not a route in main app)
      const publicRoutes = ['/authPage', '/callback', '/register', '/landingPage', '/debug-auth'];
      const isPublicRoute = publicRoutes.some(route => pathname === route || pathname?.startsWith(route));
      
      if (isPublicRoute) {
        addDebugLog(`✅ Public route detected: ${pathname}, skipping auth check`);
        setIsChecking(false);
        setIsAuthenticated(true);
        return;
      }

      // CRITICAL: Extract tokens from URL hash FIRST before any other checks
      // This ensures tokens are in localStorage before we check for them
      let tokensExtractedFromHash = false;
      
      if (window.location.hash) {
        addDebugLog(`🔗 URL hash detected, extracting tokens...`);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashIdToken = hashParams.get('id_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        
        if (hashAccessToken || hashIdToken) {
          addDebugLog('✅ Tokens found in URL hash, storing in localStorage...');
          tokensExtractedFromHash = true;
          
          // Store tokens in localStorage
          if (hashAccessToken) {
            localStorage.setItem('access_token', hashAccessToken);
            localStorage.setItem('accessToken', hashAccessToken);
            addDebugLog(`💾 Stored access_token (${hashAccessToken.substring(0, 30)}...)`);
          }
          if (hashIdToken) {
            localStorage.setItem('id_token', hashIdToken);
            localStorage.setItem('idToken', hashIdToken);
            addDebugLog(`💾 Stored id_token`);
            
            // Extract user info from ID token
            try {
              const payload = JSON.parse(atob(hashIdToken.split('.')[1]));
              if (payload.sub) {
                localStorage.setItem('user_id', payload.sub);
                addDebugLog(`👤 User ID: ${payload.sub}`);
              }
              if (payload.email) {
                localStorage.setItem('user_email', payload.email);
                addDebugLog(`📧 User email: ${payload.email}`);
              }
              if (payload.username) {
                localStorage.setItem('user_name', payload['cognito:username'] || payload.username);
                addDebugLog(`👤 Username: ${payload['cognito:username'] || payload.username}`);
              }
            } catch (e) {
              addDebugLog(`⚠️ Error extracting user info: ${e}`);
            }
          }
          if (hashRefreshToken) {
            localStorage.setItem('refresh_token', hashRefreshToken);
            localStorage.setItem('refreshToken', hashRefreshToken);
            addDebugLog(`💾 Stored refresh_token`);
          }
          
          // Clear hash from URL
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          addDebugLog(`🧹 Cleared URL hash`);
          addDebugLog(`✨ Token extraction complete!`);
        } else {
          addDebugLog(`ℹ️ URL hash present but no tokens found in it`);
        }
      } else {
        addDebugLog(`ℹ️ No URL hash present`);
      }

      // NOW check for tokens in localStorage (after hash extraction is complete)
      let accessToken = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      let idToken = localStorage.getItem('id_token') || localStorage.getItem('idToken');

      addDebugLog(`📦 Token check in localStorage: accessToken=${!!accessToken}, idToken=${!!idToken}`);
      
      if (tokensExtractedFromHash) {
        addDebugLog(`✨ Just extracted tokens from hash, proceeding with validation...`);
      }

      // If no tokens in localStorage, try to check if user is authenticated via cookies (production)
      if (!accessToken && !idToken) {
        addDebugLog(`🍪 No tokens in localStorage, checking for cookie-based auth...`);
        
        try {
          // Use backend API URL (brmh.in), not auth.brmh.in
          const authCheckUrl = `${API_BASE_URL}/auth/me`;
          addDebugLog(`🔗 Checking auth at: ${authCheckUrl}`);
          const response = await fetch(authCheckUrl, {
            method: 'GET',
            credentials: 'include' // Send cookies
          });
          
          if (response.ok) {
            const userData = await response.json();
            addDebugLog(`✅ Authenticated via cookies! User: ${userData.user?.email || userData.user?.sub}`);
            
            // User is authenticated via cookies (production scenario)
            // Store user data in localStorage for app compatibility
            if (userData.user) {
              if (userData.user.sub) localStorage.setItem('user_id', userData.user.sub);
              if (userData.user.email) localStorage.setItem('user_email', userData.user.email);
              if (userData.user['cognito:username']) localStorage.setItem('user_name', userData.user['cognito:username']);
            }
            
            setIsAuthenticated(true);
            setIsChecking(false);
            addDebugLog(`🎉 Cookie-based authentication successful!`);
            return;
          } else {
            addDebugLog(`❌ Cookie-based auth failed, redirecting to login...`);
          }
        } catch (error) {
          addDebugLog(`⚠️ Cookie auth check failed: ${error}`);
        }
        
        // No tokens and no valid cookies, redirect to auth URL
        const currentUrl = window.location.href.split('#')[0]; // Remove hash before redirect
        const authUrl = `${AUTH_URL}/login?next=${encodeURIComponent(currentUrl)}`;
        addDebugLog(`❌ No authentication found, will redirect to auth in 2 seconds...`);
        addDebugLog(`🔀 Redirect URL: ${authUrl}`);
        
        // Give time to see debug info  
        setTimeout(() => {
          window.location.href = authUrl;
        }, 2000);
        return;
      }

      // Validate token with backend
      addDebugLog(`🌐 Validating token with backend: ${API_BASE_URL}/auth/validate`);
      addDebugLog(`🔑 Using token: ${accessToken?.substring(0, 30)}...`);
      
      try {
        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        addDebugLog(`📡 Validation response: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          addDebugLog(`✅ Token validated successfully!`);
          addDebugLog(`👤 User data: ${JSON.stringify(data).substring(0, 150)}`);
          setIsAuthenticated(true);
          addDebugLog(`🎉 Authentication complete! Rendering app...`);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          addDebugLog(`❌ Token validation failed (${response.status}): ${JSON.stringify(errorData)}`);
          
          // Token invalid, clear and redirect
          addDebugLog(`🗑️ Clearing invalid tokens...`);
          localStorage.clear();
          const currentUrl = window.location.href.split('#')[0]; // Remove hash before redirect
          const authUrl = `${AUTH_URL}/login?next=${encodeURIComponent(currentUrl)}`;
          addDebugLog(`🔀 Will redirect to auth in 2 seconds: ${authUrl}`);
          
          setTimeout(() => {
            window.location.href = authUrl;
          }, 2000);
          return;
        }
      } catch (error) {
        addDebugLog(`⚠️ Token validation network error: ${error}`);
        addDebugLog(`🔌 Backend might be offline. Allowing access anyway (development mode)`);
        // Network error, try to continue with existing tokens
        setIsAuthenticated(true);
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
        <div className="text-center mb-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-white text-lg">Checking authentication...</p>
        </div>
        
        {/* Debug Panel */}
        <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-lg rounded-lg p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Auth Debug Log
          </h3>
          <div className="space-y-1 max-h-60 overflow-y-auto font-mono text-xs">
            {debugInfo.map((log, i) => (
              <div key={i} className="text-gray-300 bg-gray-900/50 p-2 rounded">
                {log}
              </div>
            ))}
            {debugInfo.length === 0 && (
              <div className="text-gray-400 italic">Initializing...</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}

