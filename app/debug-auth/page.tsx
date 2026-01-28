'use client';

import { useState, useEffect } from 'react';

// 🔧 Utility helpers
const isBrowser = typeof window !== 'undefined';

const getLocation = () => {
  if (!isBrowser)
    return { href: '', hash: '', pathname: '', search: '', origin: '', hostname: '' };
  const { href, hash, pathname, search, origin, hostname } = window.location;
  return { href, hash, pathname, search, origin, hostname };
};

const parseHashTokens = (hash: string) => {
  if (!hash.startsWith('#')) return {};
  const params = new URLSearchParams(hash.substring(1));
  return {
    access_token: params.get('access_token'),
    id_token: params.get('id_token'),
    refresh_token: params.get('refresh_token'),
  };
};

const getLocalTokens = () => {
  if (!isBrowser) return {};
  const keys = [
    'access_token',
    'accessToken',
    'id_token',
    'idToken',
    'refresh_token',
    'refreshToken',
    'user_id',
    'user_email',
  ];
  return Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)]));
};

const getCookies = () => {
  if (!isBrowser || !document.cookie) return {};
  return document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value)
      acc[key] = value.substring(0, 50) + (value.length > 50 ? '...' : '');
    return acc;
  }, {} as Record<string, string>);
};

export default function DebugAuthPage() {
  const [tokens, setTokens] = useState<Record<string, string | null>>({});
  const [hashTokens, setHashTokens] = useState<Record<string, string | null>>({});
  const [cookies, setCookies] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<string>('checking...');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentHash, setCurrentHash] = useState<string>('');

  // 🌐 Dynamic backend URL
  const { hostname } = getLocation();
  const isProduction =
    hostname.includes('brmh.in') && !hostname.includes('localhost');
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (isProduction ? 'https://auth.brmh.in' : 'http://localhost:5001');

  // 🧾 Logging utility
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs((prev) => [logMessage, ...prev]);
  };

  useEffect(() => {
    if (isBrowser) {
      const { hash } = getLocation();
      setCurrentHash(hash);
      loadAllData();
    }
  }, []);

  const loadAllData = () => {
    addLog('🔍 Loading authentication debug data...');

    // URL Hash Tokens
    if (isBrowser) {
      const { hash } = getLocation();
      if (hash) {
        const parsed = parseHashTokens(hash);
        const shortTokens: Record<string, string | null> = {};
        for (const [k, v] of Object.entries(parsed)) {
          shortTokens[k] = v ? v.substring(0, 50) + '...' : null;
        }
        setHashTokens(shortTokens);
        addLog(`✅ Hash tokens extracted: ${Object.keys(parsed).filter((k) => parsed[k as keyof typeof parsed]).join(', ')}`);
      } else {
        addLog('ℹ️ No URL hash present');
      }
    }

    // Local Storage Tokens
    const localTokens = getLocalTokens();
    setTokens(localTokens);
    const hasTokens = !!(localTokens.access_token || localTokens.accessToken);
    addLog(`💾 localStorage tokens: ${hasTokens ? 'FOUND' : 'NOT FOUND'}`);
    if (hasTokens) {
      addLog(`   - access_token: ${localTokens.access_token?.substring(0, 30)}...`);
      addLog(`   - user_email: ${localTokens.user_email}`);
      addLog(`   - user_id: ${localTokens.user_id}`);
    }

    // Cookies
    const cookieData = getCookies();
    setCookies(cookieData);
    addLog(`🍪 Cookies: ${Object.keys(cookieData).length} found`);

    // Backend
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
    const localTokens = getLocalTokens();
    const token = localTokens.access_token || localTokens.accessToken;

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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();
      setValidationResult({ status: response.status, data });

      if (response.ok)
        addLog(`✅ Token validation successful: ${JSON.stringify(data)}`);
      else
        addLog(`❌ Token validation failed (${response.status}): ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`❌ Token validation error: ${error}`);
      setValidationResult({ error: String(error) });
    }
  };

  const extractHashTokens = () => {
    if (!isBrowser) return addLog('⚠️ No browser environment');

    const { hash, pathname } = getLocation();
    if (!hash) return addLog('⚠️ No URL hash to extract');

    addLog('🔓 Extracting tokens from URL hash...');
    const parsed = parseHashTokens(hash);

    if (parsed.access_token) {
      localStorage.setItem('access_token', parsed.access_token);
      localStorage.setItem('accessToken', parsed.access_token);
      addLog('✅ Stored access_token from hash');
    }
    if (parsed.id_token) {
      localStorage.setItem('id_token', parsed.id_token);
      localStorage.setItem('idToken', parsed.id_token);
      try {
        const payload = JSON.parse(atob(parsed.id_token.split('.')[1]));
        if (payload.sub) localStorage.setItem('user_id', payload.sub);
        if (payload.email) localStorage.setItem('user_email', payload.email);
        addLog(`✅ Stored id_token and user info: ${payload.email}`);
      } catch (e) {
        addLog(`⚠️ Could not extract user info: ${e}`);
      }
    }
    if (parsed.refresh_token) {
      localStorage.setItem('refresh_token', parsed.refresh_token);
      localStorage.setItem('refreshToken', parsed.refresh_token);
      addLog('✅ Stored refresh_token from hash');
    }

    window.history.replaceState(null, '', pathname);
    setCurrentHash('');
    addLog('🧹 Cleared URL hash');
    loadAllData();
  };

  const clearAllTokens = () => {
    addLog('🗑️ Clearing all tokens...');
    if (isBrowser) {
      localStorage.clear();
      sessionStorage.clear();
    }
    addLog('✅ All tokens cleared');
    loadAllData();
  };

  const redirectToAuth = () => {
    const currentUrl = 'http://localhost:3000/';
    const authUrl = `https://auth.brmh.in/login?next=${encodeURIComponent(currentUrl)}`;
    addLog(`🔀 Redirecting to: ${authUrl}`);
    window.location.href = authUrl;
  };

  const testFullFlow = async () => {
    addLog('🧪 Starting full authentication flow test...');
    await testBackend();

    const localTokens = getLocalTokens();
    const hasTokens = !!(localTokens.access_token || localTokens.accessToken);
    addLog(`   Tokens: ${hasTokens ? '✅ Found' : '❌ Missing'}`);

    if (hasTokens) await validateToken();
    else addLog('Skipped validation — no tokens found.');

    addLog('🎉 Test complete! Check results above.');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            🔐 Auth Debug Dashboard
          </h1>
          <p className="text-gray-400">
            Comprehensive authentication debugging for localhost:3000
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={loadAllData} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors">🔄 Refresh Data</button>
          <button onClick={validateToken} className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors">✅ Validate Token</button>
          <button onClick={clearAllTokens} className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors">🗑️ Clear Tokens</button>
          <button onClick={redirectToAuth} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors">🔐 Go to Auth</button>
        </div>

        {/* Backend & Token Validation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Backend Status</h2>
            <p className={backendStatus.includes('✅') ? 'text-green-400' : 'text-red-400'}>{backendStatus}</p>
            <p className="text-gray-400 text-sm mt-2">URL: {API_BASE_URL}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Token Validation</h2>
            {validationResult ? (
              <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto max-h-40">
                {JSON.stringify(validationResult, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-400">Click "Validate Token" to test</p>
            )}
          </div>
        </div>

        {/* URL Hash Tokens */}
        {currentHash && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-yellow-500">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">
              ⚠️ Tokens in URL Hash Detected!
            </h2>
            <button onClick={extractHashTokens} className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              📥 Extract & Store Tokens from Hash
            </button>
            <div className="mt-4 bg-gray-900 p-4 rounded">
              <p className="text-gray-400 text-sm font-mono break-all">{currentHash}</p>
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
              {Object.entries(cookies).map(([k, v]) => (
                <div key={k} className="bg-gray-900 p-3 rounded flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{k}:</span>
                  <span className="text-gray-300 text-xs font-mono">{v}</span>
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
            <button onClick={testFullFlow} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
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
                      log.includes('✅')
                        ? 'bg-green-900/20 text-green-300'
                        : log.includes('❌')
                        ? 'bg-red-900/20 text-red-300'
                        : log.includes('⚠️')
                        ? 'bg-yellow-900/20 text-yellow-300'
                        : 'bg-gray-800 text-gray-300'
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
      </div>
    </div>
  );
}
