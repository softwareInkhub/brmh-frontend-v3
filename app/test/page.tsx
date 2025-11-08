'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Square, Download, Trash2, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, FileText, Activity, ChevronDown, ChevronUp, Copy, Search, X, Filter, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

interface TestResult {
  namespaceId: string;
  namespaceName: string;
  accountId?: string;
  accountName?: string;
  methodId: string;
  methodName: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  statusCode?: number;
  error?: string;
  responseTime?: number;
  timestamp: string;
  response?: any;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  queryParams?: Record<string, string>;
}

interface TestState {
  isRunning: boolean;
  currentNamespaceIndex: number;
  currentNamespaceId?: string;
  currentNamespaceName?: string;
  currentAccountIndex: number;
  currentMethodIndex: number;
  results: TestResult[];
  startTime?: string;
  endTime?: string;
}

export default function TestPage() {
  const [namespaces, setNamespaces] = useState<any[]>([]);
  const [testState, setTestState] = useState<TestState>({
    isRunning: false,
    currentNamespaceIndex: 0,
    currentAccountIndex: 0,
    currentMethodIndex: 0,
    results: []
  });
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNamespaces, setSelectedNamespaces] = useState<Set<string>>(new Set());
  const [showNamespaceSelector, setShowNamespaceSelector] = useState(false);
  const [namespaceSearchQuery, setNamespaceSearchQuery] = useState<string>('');

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('namespaceTestState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setTestState(parsed);
      } catch (e) {
        console.error('Failed to load saved test state:', e);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (testState.results.length > 0 || testState.isRunning) {
      localStorage.setItem('namespaceTestState', JSON.stringify(testState));
    }
  }, [testState]);

  // Fetch all namespaces
  const fetchNamespaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/unified/namespaces`);
      const data = await res.json();
      const fetchedNamespaces = Array.isArray(data) ? data : [];
      setNamespaces(fetchedNamespaces);
      
      // Only auto-select all if there's no saved selection in localStorage
      const saved = localStorage.getItem('selectedNamespaces');
      if (!saved && fetchedNamespaces.length > 0) {
        setSelectedNamespaces(new Set(fetchedNamespaces.map((ns: any) => ns['namespace-id'])));
      }
    } catch (err) {
      console.error('Error fetching namespaces:', err);
      toast.error('Failed to fetch namespaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNamespaces();
  }, []);

  // Load selected namespaces from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedNamespaces');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedNamespaces(new Set(parsed));
        }
      } catch (e) {
        console.error('Failed to load selected namespaces:', e);
      }
    }
  }, []);

  // Save selected namespaces to localStorage
  useEffect(() => {
    if (selectedNamespaces.size > 0) {
      localStorage.setItem('selectedNamespaces', JSON.stringify(Array.from(selectedNamespaces)));
    }
  }, [selectedNamespaces]);

  // Test a single method with an account
  const testMethod = async (
    namespace: any,
    account: any | null,
    method: any
  ): Promise<TestResult> => {
    const startTime = Date.now();
    const result: TestResult = {
      namespaceId: namespace['namespace-id'],
      namespaceName: namespace['namespace-name'],
      methodId: method['namespace-method-id'],
      methodName: method['namespace-method-name'],
      status: 'running',
      timestamp: new Date().toISOString()
    };

    if (account) {
      result.accountId = account['namespace-account-id'];
      result.accountName = account['namespace-account-name'];
    }

    try {
      // If no account, we need to handle it differently
      // The executeNamespace requires accountId, so we'll skip testing if no account
      if (!account) {
        return {
          ...result,
          status: 'skipped',
          error: 'No account available for this method'
        };
      }

      // Build request details from method and account
      const methodUrl = method['namespace-method-url-override'] || method.url || '';
      const methodType = method['namespace-method-type'] || 'GET';
      const methodHeaders = method['namespace-method-header'] || {};
      const methodQueryParams = method['namespace-method-queryParams'] || {};
      const methodBody = method['namespace-method-body'] || {};

      // Convert method headers from array format to object if needed
      let finalHeaders: Record<string, string> = {};
      if (Array.isArray(methodHeaders)) {
        methodHeaders.forEach((h: any) => {
          if (h.key && h.value) {
            finalHeaders[h.key] = h.value;
          }
        });
      } else if (typeof methodHeaders === 'object') {
        finalHeaders = { ...methodHeaders };
      }

      // Convert account headers
      if (account['namespace-account-header'] && Array.isArray(account['namespace-account-header'])) {
        account['namespace-account-header'].forEach((h: any) => {
          if (h.key && h.value) {
            finalHeaders[h.key] = h.value;
          }
        });
      }

      // Convert query params from array format to object if needed
      let finalQueryParams: Record<string, string> = {};
      if (Array.isArray(methodQueryParams)) {
        methodQueryParams.forEach((p: any) => {
          if (p.key && p.value) {
            finalQueryParams[p.key] = p.value;
          }
        });
      } else if (typeof methodQueryParams === 'object') {
        finalQueryParams = { ...methodQueryParams };
      }

      // Build full URL - handle slashes properly to avoid double slashes
      let fullUrl = methodUrl;
      if (account['namespace-account-url-override']) {
        let baseUrl = account['namespace-account-url-override'];
        // Remove trailing slash from base URL
        baseUrl = baseUrl.replace(/\/+$/, '');
        
        if (methodUrl) {
          // Remove leading slash from method URL
          const cleanMethodUrl = methodUrl.replace(/^\/+/, '');
          // Combine with single slash
          fullUrl = `${baseUrl}/${cleanMethodUrl}`;
        } else {
          fullUrl = baseUrl;
        }
      } else if (methodUrl) {
        // If no account URL, ensure method URL starts with / if it's a relative path
        if (!methodUrl.startsWith('http://') && !methodUrl.startsWith('https://')) {
          fullUrl = methodUrl.startsWith('/') ? methodUrl : `/${methodUrl}`;
        }
      }

      // Add query params to URL
      if (Object.keys(finalQueryParams).length > 0 && fullUrl) {
        try {
          // Only add query params if we have a valid URL
          if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
            const urlObj = new URL(fullUrl);
            Object.entries(finalQueryParams).forEach(([key, value]) => {
              if (key && value) {
                urlObj.searchParams.append(key, value.toString());
              }
            });
            fullUrl = urlObj.toString();
          } else {
            // If not a full URL, append query params manually
            const params = new URLSearchParams();
            Object.entries(finalQueryParams).forEach(([key, value]) => {
              if (key && value) {
                params.append(key, value.toString());
              }
            });
            const queryString = params.toString();
            fullUrl = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryString}`;
          }
        } catch (e) {
          // If URL parsing fails, append query params manually
          const params = new URLSearchParams();
          Object.entries(finalQueryParams).forEach(([key, value]) => {
            if (key && value) {
              params.append(key, value.toString());
            }
          });
          const queryString = params.toString();
          fullUrl = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryString}`;
        }
      }

      // Store request details
      result.requestUrl = fullUrl;
      result.requestMethod = methodType;
      result.requestHeaders = finalHeaders;
      result.requestBody = Object.keys(methodBody).length > 0 ? methodBody : undefined;
      result.queryParams = Object.keys(finalQueryParams).length > 0 ? finalQueryParams : undefined;

      // Build request body matching MethodTestPage format (sends full URL, headers, queryParams)
      // This is more reliable than using executeType: 'namespace' which constructs from IDs
      const requestBody: any = {
        method: methodType,
        url: fullUrl,
        namespaceAccountId: account['namespace-account-id'],
        queryParams: finalQueryParams,
        headers: finalHeaders,
        saveData: false
      };

      // Add body if method supports it (POST, PUT, PATCH)
      if (methodBody && Object.keys(methodBody).length > 0 && ['POST', 'PUT', 'PATCH'].includes(methodType.toUpperCase())) {
        requestBody.body = methodBody;
      }

      const response = await fetch(`${API_BASE_URL}/unified/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current?.signal
      });

      const responseTime = Date.now() - startTime;
      let data: any;
      let actualStatusCode = response.status;
      
      try {
        data = await response.json();
        
        // The execute endpoint returns the actual API response status in the body
        // Check if response contains status from the actual API call
        if (data?.status !== undefined) {
          // If data.status exists, that's the actual API response status
          actualStatusCode = data.status;
        } else if (data?.statusCode !== undefined) {
          actualStatusCode = data.statusCode;
        }
        
        // Update URL if response contains the actual URL used (from metadata)
        if (data?.metadata?.url) {
          result.requestUrl = data.metadata.url;
        } else if (data?.url) {
          result.requestUrl = data.url;
        }
      } catch (e) {
        // If response is not JSON, get as text
        const text = await response.text();
        data = { raw: text, error: 'Failed to parse response as JSON' };
      }

      // Determine success/error based on actual status code
      result.status = actualStatusCode >= 200 && actualStatusCode < 300 ? 'success' : 'error';
      result.statusCode = actualStatusCode;
      result.responseTime = responseTime;
      result.response = data;

      if (actualStatusCode >= 400) {
        result.error = data?.error || data?.message || `HTTP ${actualStatusCode}`;
      }
    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      result.status = 'error';
      result.error = err.message || 'Network error';
      result.responseTime = responseTime;
    }

    return result;
  };

  // Main test runner
  const runTests = useCallback(async () => {
    // Get current selected namespaces from state (avoid closure issues)
    const currentSelected = selectedNamespaces;
    
    if (namespaces.length === 0) {
      toast.error('No namespaces found');
      return;
    }

    if (currentSelected.size === 0) {
      toast.error('Please select at least one namespace to test');
      return;
    }

    // Filter namespaces to only test selected ones
    const namespacesToTest = namespaces.filter((ns: any) => 
      currentSelected.has(ns['namespace-id'])
    );
    
    console.log('Testing namespaces:', {
      total: namespaces.length,
      selected: currentSelected.size,
      selectedIds: Array.from(currentSelected),
      toTest: namespacesToTest.length,
      toTestNames: namespacesToTest.map((ns: any) => ns['namespace-name'])
    });

    if (namespacesToTest.length === 0) {
      toast.error('No namespaces selected for testing');
      return;
    }

    abortControllerRef.current = new AbortController();
    const results: TestResult[] = [];
    const startTime = new Date().toISOString();

    setTestState(prev => ({
      ...prev,
      isRunning: true,
      startTime,
      results: []
    }));

    try {
      for (let nsIdx = 0; nsIdx < namespacesToTest.length; nsIdx++) {
        const namespace = namespacesToTest[nsIdx];
        
        // Check if we should continue from saved state
        if (nsIdx < testState.currentNamespaceIndex) {
          continue;
        }

        setTestState(prev => ({
          ...prev,
          currentNamespaceIndex: nsIdx,
          currentNamespaceId: namespace['namespace-id'],
          currentNamespaceName: namespace['namespace-name'],
          currentAccountIndex: 0,
          currentMethodIndex: 0
        }));

        // Fetch accounts and methods for this namespace
        let accounts: any[] = [];
        let methods: any[] = [];

        try {
          const [accRes, methRes] = await Promise.all([
            fetch(`${API_BASE_URL}/unified/namespaces/${namespace['namespace-id']}/accounts`),
            fetch(`${API_BASE_URL}/unified/namespaces/${namespace['namespace-id']}/methods`)
          ]);

          accounts = await accRes.json();
          methods = await methRes.json();

          if (!Array.isArray(accounts)) accounts = [];
          if (!Array.isArray(methods)) methods = [];
        } catch (err) {
          console.error(`Error fetching data for namespace ${namespace['namespace-name']}:`, err);
          continue;
        }

        // If no accounts, test methods without accounts
        if (accounts.length === 0) {
          for (let methIdx = 0; methIdx < methods.length; methIdx++) {
            if (abortControllerRef.current?.signal.aborted) break;

            const method = methods[methIdx];
            setTestState(prev => ({
              ...prev,
              currentMethodIndex: methIdx
            }));

            const result = await testMethod(namespace, null, method);
            results.push(result);

            setTestState(prev => ({
              ...prev,
              results: [...results]
            }));

            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          // Test each method with each account
          for (let accIdx = 0; accIdx < accounts.length; accIdx++) {
            if (abortControllerRef.current?.signal.aborted) break;

            const account = accounts[accIdx];
            setTestState(prev => ({
              ...prev,
              currentAccountIndex: accIdx
            }));

            for (let methIdx = 0; methIdx < methods.length; methIdx++) {
              if (abortControllerRef.current?.signal.aborted) break;

              const method = methods[methIdx];
              setTestState(prev => ({
                ...prev,
                currentMethodIndex: methIdx
              }));

              const result = await testMethod(namespace, account, method);
              results.push(result);

              setTestState(prev => ({
                ...prev,
                results: [...results]
              }));

              // Small delay to prevent overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Test error:', err);
        toast.error('Test execution failed');
      }
    } finally {
      const endTime = new Date().toISOString();
      setTestState(prev => ({
        ...prev,
        isRunning: false,
        endTime,
        currentNamespaceIndex: 0,
        currentAccountIndex: 0,
        currentMethodIndex: 0
      }));
      abortControllerRef.current = null;
    }
  }, [namespaces, selectedNamespaces, testState.currentNamespaceIndex]);

  const startTests = () => {
    runTests();
  };

  const stopTests = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setTestState(prev => ({
      ...prev,
      isRunning: false
    }));
    toast.success('Tests stopped');
  };

  const clearResults = () => {
    if (confirm('Are you sure you want to clear all test results?')) {
      setTestState({
        isRunning: false,
        currentNamespaceIndex: 0,
        currentAccountIndex: 0,
        currentMethodIndex: 0,
        results: []
      });
      localStorage.removeItem('namespaceTestState');
      toast.success('Results cleared');
    }
  };

  const exportResults = () => {
    const exportData = {
      testRun: {
        startTime: testState.startTime,
        endTime: testState.endTime || new Date().toISOString(),
        totalTests: testState.results.length,
        passed: testState.results.filter(r => r.status === 'success').length,
        failed: testState.results.filter(r => r.status === 'error').length,
        skipped: testState.results.filter(r => r.status === 'skipped').length
      },
      results: testState.results
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namespace-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Results exported');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status'], statusCode?: number) => {
    if (status === 'success') {
      if (statusCode && statusCode >= 200 && statusCode < 300) {
        return 'bg-green-50 border-green-200';
      }
      return 'bg-blue-50 border-blue-200';
    }
    if (status === 'error') return 'bg-red-50 border-red-200';
    if (status === 'running') return 'bg-blue-50 border-blue-300';
    return 'bg-gray-50 border-gray-200';
  };

  // Get current namespace from test state (which stores the actual namespace being tested)
  const currentNamespace = testState.currentNamespaceName 
    ? { 'namespace-name': testState.currentNamespaceName, 'namespace-id': testState.currentNamespaceId }
    : null;
  const totalTests = namespaces.reduce((total, ns) => {
    // This is approximate - we'd need to fetch all accounts/methods to get exact count
    return total + 1; // Simplified
  }, 0);

  // Filter results based on search query
  const filteredResults = testState.results.filter(result => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Check if query contains comma (multiple search terms)
    if (query.includes(',')) {
      const terms = query.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      if (terms.length === 0) return true;
      
      // For comma-separated search, prioritize specific field matching
      if (terms.length >= 3) {
        // Three terms: namespace, account, method
        const firstTerm = terms[0];
        const secondTerm = terms[1];
        const thirdTerm = terms[2];
        
        // Primary match: first term matches namespace, second term matches account, third term matches method
        const namespaceAccountMethodMatch = 
          result.namespaceName?.toLowerCase().includes(firstTerm) &&
          result.accountName?.toLowerCase().includes(secondTerm) &&
          result.methodName?.toLowerCase().includes(thirdTerm);
        
        if (namespaceAccountMethodMatch) return true;
        
        // Fallback: check if all terms match anywhere in the result
        const allTermsMatch = terms.every(term => {
          return result.namespaceName?.toLowerCase().includes(term) ||
                 result.accountName?.toLowerCase().includes(term) ||
                 result.methodName?.toLowerCase().includes(term) ||
                 result.requestUrl?.toLowerCase().includes(term);
        });
        
        return allTermsMatch;
      } else if (terms.length >= 2) {
        // Two terms: namespace, account
        const firstTerm = terms[0];
        const secondTerm = terms[1];
        
        // Primary match: first term matches namespace, second term matches account
        const namespaceAccountMatch = 
          result.namespaceName?.toLowerCase().includes(firstTerm) &&
          result.accountName?.toLowerCase().includes(secondTerm);
        
        if (namespaceAccountMatch) return true;
        
        // Fallback: check if all terms match anywhere in the result
        const allTermsMatch = terms.every(term => {
          return result.namespaceName?.toLowerCase().includes(term) ||
                 result.accountName?.toLowerCase().includes(term) ||
                 result.methodName?.toLowerCase().includes(term) ||
                 result.requestUrl?.toLowerCase().includes(term);
        });
        
        return allTermsMatch;
      } else {
        // Single term after comma (edge case)
        const term = terms[0];
        return result.namespaceName?.toLowerCase().includes(term) ||
               result.accountName?.toLowerCase().includes(term) ||
               result.methodName?.toLowerCase().includes(term) ||
               result.requestUrl?.toLowerCase().includes(term);
      }
    }
    
    // Single term search (OR logic across all fields)
    const namespaceMatch = result.namespaceName?.toLowerCase().includes(query);
    const accountMatch = result.accountName?.toLowerCase().includes(query);
    const methodMatch = result.methodName?.toLowerCase().includes(query);
    const urlMatch = result.requestUrl?.toLowerCase().includes(query);
    
    return namespaceMatch || accountMatch || methodMatch || urlMatch;
  });

  const stats = {
    total: testState.results.length,
    passed: testState.results.filter(r => r.status === 'success').length,
    failed: testState.results.filter(r => r.status === 'error').length,
    skipped: testState.results.filter(r => r.status === 'skipped').length,
    running: testState.results.filter(r => r.status === 'running').length,
    filtered: filteredResults.length
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              Namespace Testing Framework
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Test all namespaces, accounts, and methods automatically
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNamespaceSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              title="Select namespaces to test"
            >
              <Filter className="h-4 w-4" />
              Select Namespaces
              {selectedNamespaces.size > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">
                  {selectedNamespaces.size}
                </span>
              )}
            </button>
            {testState.isRunning ? (
              <button
                onClick={stopTests}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="h-4 w-4" />
                Stop Testing
              </button>
            ) : (
              <button
                onClick={startTests}
                disabled={loading || namespaces.length === 0 || selectedNamespaces.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" />
                Start Testing
              </button>
            )}
            {testState.results.length > 0 && (
              <>
                <button
                  onClick={exportResults}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export JSON
                </button>
                <button
                  onClick={clearResults}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar with Search */}
      {testState.results.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Stats on the left */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-700">Total:</div>
                <div className="px-2 py-1 bg-gray-100 rounded text-sm font-semibold">{stats.total}</div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <div className="text-sm font-medium text-gray-700">Passed:</div>
                <div className="px-2 py-1 bg-green-100 rounded text-sm font-semibold text-green-700">{stats.passed}</div>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div className="text-sm font-medium text-gray-700">Failed:</div>
                <div className="px-2 py-1 bg-red-100 rounded text-sm font-semibold text-red-700">{stats.failed}</div>
              </div>
              {stats.skipped > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <div className="text-sm font-medium text-gray-700">Skipped:</div>
                  <div className="px-2 py-1 bg-yellow-100 rounded text-sm font-semibold text-yellow-700">{stats.skipped}</div>
                </div>
              )}
              {stats.running > 0 && (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                  <div className="text-sm font-medium text-gray-700">Running:</div>
                  <div className="px-2 py-1 bg-blue-100 rounded text-sm font-semibold text-blue-700">{stats.running}</div>
                </div>
              )}
              {testState.isRunning && currentNamespace && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Testing:</span>
                  <span className="font-semibold text-gray-900">{currentNamespace['namespace-name']}</span>
                </div>
              )}
            </div>

            {/* Search on the right */}
            <div className="flex items-center gap-3">
              {searchQuery && (
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  Showing <span className="font-semibold text-gray-900">{stats.filtered}</span> of <span className="font-semibold text-gray-900">{stats.total}</span>
                </div>
              )}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by namespace, account, method, or URL..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {testState.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No test results yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Click "Start Testing" to begin testing all namespaces, accounts, and methods
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No results found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  No test results match your search query: <span className="font-semibold text-gray-700">"{searchQuery}"</span>
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredResults.map((result, filteredIndex) => {
                // Find the original index in the full results array for expansion tracking
                const originalResultIndex = testState.results.findIndex(r => 
                  r.namespaceId === result.namespaceId &&
                  r.methodId === result.methodId &&
                  r.accountId === result.accountId &&
                  r.timestamp === result.timestamp
                );
                const isExpanded = expandedCards.has(originalResultIndex);
                const hasRequestDetails = result.requestUrl || result.requestMethod || result.requestHeaders || result.requestBody || result.queryParams;
              
              return (
                <div
                  key={`${result.namespaceId}-${result.accountId || 'no-account'}-${result.methodId}-${result.timestamp}`}
                  className={`border rounded-lg transition-all ${getStatusColor(result.status, result.statusCode)}`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{result.namespaceName}</span>
                              {result.accountName && (
                                <>
                                  <span className="text-gray-400">/</span>
                                  <span className="text-gray-700">{result.accountName}</span>
                                </>
                              )}
                              <span className="text-gray-400">/</span>
                              <span className="text-gray-700">{result.methodName}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                              {result.statusCode && (
                                <span className={`px-2 py-0.5 rounded font-medium ${
                                  result.statusCode >= 200 && result.statusCode < 300
                                    ? 'bg-green-100 text-green-700'
                                    : result.statusCode >= 400
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  Status: {result.statusCode}
                                </span>
                              )}
                              {result.status === 'skipped' && (
                                <span className="px-2 py-0.5 rounded font-medium bg-yellow-100 text-yellow-700">
                                  Skipped
                                </span>
                              )}
                              {result.responseTime && (
                                <span>Response Time: {result.responseTime}ms</span>
                              )}
                              <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                            </div>
                            {result.error && (
                              <div className={`mt-2 text-sm px-2 py-1 rounded ${
                                result.status === 'skipped' 
                                  ? 'text-yellow-700 bg-yellow-50' 
                                  : 'text-red-600 bg-red-50'
                              }`}>
                                {result.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {hasRequestDetails && (
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedCards);
                            if (isExpanded) {
                              newExpanded.delete(originalResultIndex);
                            } else {
                              newExpanded.add(originalResultIndex);
                            }
                            setExpandedCards(newExpanded);
                          }}
                          className="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          title={isExpanded ? "Hide request details" : "Show request details"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Request Details */}
                  {isExpanded && hasRequestDetails && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
                      {/* Method and URL */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-700 uppercase">Request</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {result.requestMethod && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {result.requestMethod}
                            </span>
                          )}
                          {result.requestUrl && (
                            <span className="text-xs text-gray-700 font-mono break-all bg-white px-2 py-1 rounded border border-gray-200">
                              {result.requestUrl}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Query Parameters */}
                      {result.queryParams && Object.keys(result.queryParams).length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-700 uppercase">Query Parameters</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(result.queryParams, null, 2));
                                toast.success('Query params copied to clipboard');
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Copy query params"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                            {JSON.stringify(result.queryParams, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Headers */}
                      {result.requestHeaders && Object.keys(result.requestHeaders).length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-700 uppercase">Headers</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(result.requestHeaders, null, 2));
                                toast.success('Headers copied to clipboard');
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Copy headers"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto max-h-40 overflow-y-auto">
                            {JSON.stringify(result.requestHeaders, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Request Body */}
                      {result.requestBody && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-700 uppercase">Request Body</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(result.requestBody, null, 2));
                                toast.success('Request body copied to clipboard');
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Copy request body"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto max-h-60 overflow-y-auto">
                            {JSON.stringify(result.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Response */}
                      {result.response && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-700 uppercase">Response</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(result.response, null, 2));
                                toast.success('Response copied to clipboard');
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Copy response"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto max-h-60 overflow-y-auto">
                            {JSON.stringify(result.response, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
              })
            )}
          </div>
        )}
      </div>

      {/* Namespace Selector Modal */}
      {showNamespaceSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => {
          setShowNamespaceSelector(false);
          setNamespaceSearchQuery('');
        }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Select Namespaces to Test</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Choose which namespaces to include in the test run
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNamespaceSelector(false);
                  setNamespaceSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Get filtered namespaces based on search
                    const filtered = namespaceSearchQuery.trim()
                      ? namespaces.filter((ns: any) => {
                          const query = namespaceSearchQuery.toLowerCase();
                          return ns['namespace-name']?.toLowerCase().includes(query) ||
                                 ns['namespace-id']?.toLowerCase().includes(query);
                        })
                      : namespaces;
                    
                    const filteredIds = new Set(filtered.map((ns: any) => ns['namespace-id']));
                    const allFilteredSelected = filtered.every((ns: any) => 
                      selectedNamespaces.has(ns['namespace-id'])
                    );
                    
                    const newSelected = new Set(selectedNamespaces);
                    if (allFilteredSelected) {
                      // Deselect all filtered
                      filteredIds.forEach(id => newSelected.delete(id));
                    } else {
                      // Select all filtered
                      filteredIds.forEach(id => newSelected.add(id));
                    }
                    setSelectedNamespaces(newSelected);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {(() => {
                    const filtered = namespaceSearchQuery.trim()
                      ? namespaces.filter((ns: any) => {
                          const query = namespaceSearchQuery.toLowerCase();
                          return ns['namespace-name']?.toLowerCase().includes(query) ||
                                 ns['namespace-id']?.toLowerCase().includes(query);
                        })
                      : namespaces;
                    const allFilteredSelected = filtered.every((ns: any) => 
                      selectedNamespaces.has(ns['namespace-id'])
                    );
                    return allFilteredSelected ? 'Deselect All' : 'Select All';
                  })()}
                </button>
                <span className="text-sm text-gray-500">
                  ({selectedNamespaces.size} of {namespaces.length} selected)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={namespaceSearchQuery}
                    onChange={(e) => setNamespaceSearchQuery(e.target.value)}
                    placeholder="Search namespaces..."
                    className="pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {namespaceSearchQuery && (
                    <button
                      onClick={() => setNamespaceSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {namespaces.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No namespaces found
                </div>
              ) : (() => {
                // Filter namespaces based on search query
                const filteredNamespaces = namespaces.filter((ns: any) => {
                  if (!namespaceSearchQuery.trim()) return true;
                  const query = namespaceSearchQuery.toLowerCase();
                  const nameMatch = ns['namespace-name']?.toLowerCase().includes(query);
                  const idMatch = ns['namespace-id']?.toLowerCase().includes(query);
                  return nameMatch || idMatch;
                });

                if (filteredNamespaces.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      No namespaces match "{namespaceSearchQuery}"
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {filteredNamespaces.map((namespace: any) => {
                    const namespaceId = namespace['namespace-id'];
                    const isSelected = selectedNamespaces.has(namespaceId);
                    
                    return (
                      <div
                        key={namespaceId}
                        onClick={() => {
                          const newSelected = new Set(selectedNamespaces);
                          if (isSelected) {
                            newSelected.delete(namespaceId);
                          } else {
                            newSelected.add(namespaceId);
                          }
                          setSelectedNamespaces(newSelected);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {namespace['namespace-name'] || 'Unnamed Namespace'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            ID: {namespaceId}
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowNamespaceSelector(false);
                  setNamespaceSearchQuery('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedNamespaces.size === 0) {
                    toast.error('Please select at least one namespace');
                    return;
                  }
                  setShowNamespaceSelector(false);
                  setNamespaceSearchQuery('');
                  toast.success(`${selectedNamespaces.size} namespace(s) selected for testing`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply ({selectedNamespaces.size} selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

