'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function DebugAuthPage() {
  const [tokens, setTokens] = useState<any>({});
  const [hashTokens, setHashTokens] = useState<any>({});
  const [cookies, setCookies] = useState<any>({});
  const [validationResult, setValidationResult] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<string>('checking...');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [logMessage, ...prev]);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    addLog('🔍 Loading authentication debug data...');
    
    // Check URL hash
    if (window.location.hash) {
      addLog(`📍 URL Hash detected: ${window.location.hash.substring(0, 100)}`);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashData = {
        access_token: hashParams.get('access_token')?.substring(0, 50) + '...',
        id_token: hashParams.get('id_token')?.substring(0, 50) + '...',
        refresh_token: hashParams.get('refresh_token')?.substring(0, 50) + '...',
      };
      setHashTokens(hashData);
      addLog(`✅ Hash tokens extracted: ${Object.keys(hashData).filter(k => hashData[k]).join(', ')}`);
    } else {
      addLog('ℹ️ No URL hash present');
    }
    
    // Get localStorage tokens
    const localStorageTokens = {
      access_token: localStorage.getItem('access_token'),
      accessToken: localStorage.getItem('accessToken'),
      id_token: localStorage.getItem('id_token'),
      idToken: localStorage.getItem('idToken'),
      refresh_token: localStorage.getItem('refresh_token'),
      refreshToken: localStorage.getItem('refreshToken'),
      user_id: localStorage.getItem('user_id'),
      user_email: localStorage.getItem('user_email'),
    };
    setTokens(localStorageTokens);
    
    const hasTokens = !!(localStorageTokens.access_token || localStorageTokens.accessToken);
    addLog(`💾 localStorage tokens: ${hasTokens ? 'FOUND' : 'NOT FOUND'}`);
    if (hasTokens) {
      addLog(`   - access_token: ${localStorageTokens.access_token?.substring(0, 30)}...`);
      addLog(`   - user_email: ${localStorageTokens.user_email}`);
      addLog(`   - user_id: ${localStorageTokens.user_id}`);
    }
    
    // Get cookies
    const cookieData = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = value.substring(0, 50) + (value.length > 50 ? '...' : '');
      }
      return acc;
    }, {} as Record<string, string>);
    setCookies(cookieData);
    addLog(`🍪 Cookies: ${Object.keys(cookieData).length} found`);
    
    // Test backend connection
    testBackend();
  };

  const testBackend = async () => {
    addLog(`🌐 Testing backend connection: ${API_BASE_URL}/test`);
    try {
      const response = await fetch(`${API_BASE_URL}/test`);
      const data = await response.json();
      setBackendStatus('✅ Connected');
      addLog(`✅ Backend connection successful: ${JSON.stringify(data)}`);
    } catch (error) {
      setBackendStatus('❌ Failed');
      addLog(`❌ Backend connection failed: ${error}`);
    }
  };

  const validateToken = async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    
    if (!token) {
      addLog('❌ No access token found for validation');
      setValidationResult({ error: 'No token found' });
      return;
    }

    addLog(`🔐 Validating token: ${token.substring(0, 30)}...`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      setValidationResult({ status: response.status, data });
      
      if (response.ok) {
        addLog(`✅ Token validation successful: ${JSON.stringify(data)}`);
      } else {
        addLog(`❌ Token validation failed (${response.status}): ${JSON.stringify(data)}`);
      }
    } catch (error) {
      addLog(`❌ Token validation error: ${error}`);
      setValidationResult({ error: String(error) });
    }
  };

  const extractHashTokens = () => {
    if (!window.location.hash) {
      addLog('⚠️ No URL hash to extract');
      return;
    }

    addLog('🔓 Extracting tokens from URL hash...');
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashAccessToken = hashParams.get('access_token');
    const hashIdToken = hashParams.get('id_token');
    const hashRefreshToken = hashParams.get('refresh_token');
    
    if (hashAccessToken) {
      localStorage.setItem('access_token', hashAccessToken);
      localStorage.setItem('accessToken', hashAccessToken);
      addLog('✅ Stored access_token from hash');
    }
    if (hashIdToken) {
      localStorage.setItem('id_token', hashIdToken);
      localStorage.setItem('idToken', hashIdToken);
      
      try {
        const payload = JSON.parse(atob(hashIdToken.split('.')[1]));
        if (payload.sub) localStorage.setItem('user_id', payload.sub);
        if (payload.email) localStorage.setItem('user_email', payload.email);
        addLog(`✅ Stored id_token and user info: ${payload.email}`);
      } catch (e) {
        addLog(`⚠️ Could not extract user info: ${e}`);
      }
    }
    if (hashRefreshToken) {
      localStorage.setItem('refresh_token', hashRefreshToken);
      localStorage.setItem('refreshToken', hashRefreshToken);
      addLog('✅ Stored refresh_token from hash');
    }
    
    window.history.replaceState(null, '', window.location.pathname);
    addLog('🧹 Cleared URL hash');
    
    loadAllData();
  };

  const clearAllTokens = () => {
    addLog('🗑️ Clearing all tokens...');
    localStorage.clear();
    sessionStorage.clear();
    addLog('✅ All tokens cleared');
    loadAllData();
  };

  const redirectToAuth = () => {
    const currentUrl = window.location.href.split('#')[0];
    const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL 
      || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'http://localhost:3000');
    const authUrl = `${AUTH_URL}/login?next=${encodeURIComponent(currentUrl)}`;
    addLog(`🔀 Redirecting to: ${authUrl}`);
    window.location.href = authUrl;
  };

  const testFullFlow = async () => {
    addLog('🧪 Starting full authentication flow test...');
    
    // Step 1: Check backend
    addLog('Step 1: Testing backend connection...');
    await testBackend();
    
    // Step 2: Check tokens
    addLog('Step 2: Checking localStorage tokens...');
    const hasTokens = !!(localStorage.getItem('access_token') || localStorage.getItem('accessToken'));
    addLog(`   Result: ${hasTokens ? '✅ Tokens found' : '❌ No tokens'}`);
    
    // Step 3: Validate if we have tokens
    if (hasTokens) {
      addLog('Step 3: Validating token with backend...');
      await validateToken();
    } else {
      addLog('Step 3: Skipped (no tokens to validate)');
    }
    
    addLog('🎉 Test complete! Check results above.');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">🔐 Auth Debug Dashboard</h1>
          <p className="text-gray-400">Comprehensive authentication debugging for localhost:3000</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={loadAllData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            🔄 Refresh Data
          </button>
          <button
            onClick={validateToken}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            ✅ Validate Token
          </button>
          <button
            onClick={clearAllTokens}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            🗑️ Clear Tokens
          </button>
          <button
            onClick={redirectToAuth}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            🔐 Go to Auth
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Backend Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Backend Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Connection:</span>
                <span className={backendStatus.includes('✅') ? 'text-green-400' : 'text-red-400'}>
                  {backendStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">URL:</span>
                <span className="text-gray-300 text-sm">{API_BASE_URL}</span>
              </div>
            </div>
          </div>

          {/* Token Validation */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Token Validation</h2>
            {validationResult ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className={validationResult.status === 200 ? 'text-green-400' : 'text-red-400'}>
                    {validationResult.status || 'Error'}
                  </span>
                </div>
                <div className="mt-4">
                  <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto max-h-40">
                    {JSON.stringify(validationResult, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Click "Validate Token" to test</p>
            )}
          </div>
        </div>

        {/* URL Hash Tokens */}
        {window.location.hash && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-yellow-500">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Tokens in URL Hash Detected!</h2>
            <p className="text-gray-300 mb-4">You have tokens in your URL hash. Click below to extract and store them.</p>
            <button
              onClick={extractHashTokens}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              📥 Extract & Store Tokens from Hash
            </button>
            <div className="mt-4 bg-gray-900 p-4 rounded">
              <p className="text-gray-400 text-sm font-mono break-all">{window.location.hash}</p>
            </div>
          </div>
        )}

        {/* localStorage Tokens */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">💾 localStorage Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(tokens).map(([key, value]) => (
              <div key={key} className="bg-gray-900 p-3 rounded">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-400 text-sm font-semibold">{key}:</span>
                  {value ? (
                    <span className="text-green-400 text-xs">✓ Present</span>
                  ) : (
                    <span className="text-red-400 text-xs">✗ Missing</span>
                  )}
                </div>
                {value && (
                  <p className="text-gray-300 text-xs font-mono break-all">
                    {typeof value === 'string' && value.length > 100
                      ? value.substring(0, 100) + '...'
                      : value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">🍪 Cookies</h2>
          {Object.keys(cookies).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(cookies).map(([key, value]) => (
                <div key={key} className="bg-gray-900 p-3 rounded flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{key}:</span>
                  <span className="text-gray-300 text-xs font-mono">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No cookies found</p>
          )}
        </div>

        {/* Debug Logs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">📋 Debug Logs</h2>
            <button
              onClick={testFullFlow}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              🧪 Run Full Test
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            {logs.length > 0 ? (
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded ${
                      log.includes('✅') ? 'bg-green-900/20 text-green-300' :
                      log.includes('❌') ? 'bg-red-900/20 text-red-300' :
                      log.includes('⚠️') ? 'bg-yellow-900/20 text-yellow-300' :
                      'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No logs yet. Click "Run Full Test" to start.</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-blue-300 mb-4">📖 How to Use This Page</h2>
          <ol className="text-gray-300 space-y-2 list-decimal list-inside">
            <li>First, check if backend is connected (should show ✅)</li>
            <li>If you see "Tokens in URL Hash", click "Extract & Store Tokens"</li>
            <li>Click "Run Full Test" to validate everything</li>
            <li>If validation fails, click "Clear Tokens" and try logging in again</li>
            <li>Use "Go to Auth" to test the redirect flow</li>
          </ol>
        </div>

        {/* Current URL */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">🌐 Current URL Info</h2>
          <div className="space-y-2 font-mono text-sm">
            <div><span className="text-gray-400">Full URL:</span> <span className="text-gray-300">{typeof window !== 'undefined' ? window.location.href : ''}</span></div>
            <div><span className="text-gray-400">Pathname:</span> <span className="text-gray-300">{typeof window !== 'undefined' ? window.location.pathname : ''}</span></div>
            <div><span className="text-gray-400">Hash:</span> <span className="text-gray-300">{typeof window !== 'undefined' ? window.location.hash || '(empty)' : ''}</span></div>
            <div><span className="text-gray-400">Search:</span> <span className="text-gray-300">{typeof window !== 'undefined' ? window.location.search || '(empty)' : ''}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

