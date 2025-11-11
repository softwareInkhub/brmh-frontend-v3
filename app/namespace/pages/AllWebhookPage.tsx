import React, { useState, useEffect, useRef } from 'react';
import { Plus, Eye, X, Edit2, Trash2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

interface AllWebhookPageProps {
  namespace: any;
  onViewWebhook: (webhook: any, namespace: any) => void;
  openCreate?: boolean;
  timestamp?: number;
}

const AllWebhookPage: React.FC<AllWebhookPageProps> = ({ namespace, onViewWebhook, openCreate = false, timestamp }) => {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidePanel, setSidePanel] = useState<'create' | { webhook: any } | null>(null);
  const [sidePanelWidth, setSidePanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelTopPosition, setPanelTopPosition] = useState(0); // Panel top position in pixels
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createData, setCreateData] = useState<any>({
    'webhook-name': '',
    'post-exec-url': '',
    'method-id': '',
    'account-id': '',
    'status': 'active',
    'tags': [],
    'tableName': '',
    'pre-exec-url': '',
  });
  const [createMsg, setCreateMsg] = useState('');
  const [methods, setMethods] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    const fetchWebhooks = async () => {
      setLoading(true);
      try {
        const nsId = namespace ? namespace['namespace-id'] : '';
        const res = await fetch(`${API_BASE_URL}/unified/webhooks/namespace/${nsId}`);
        const data = await res.json();
        setWebhooks(Array.isArray(data) ? data : []);
      } catch {
        setWebhooks([]);
      }
      setLoading(false);
    };
    if (namespace) fetchWebhooks();
  }, [namespace]);

  useEffect(() => {
    // Fetch methods and accounts for dropdowns
    const fetchDropdowns = async () => {
      if (!namespace) return;
      try {
        const nsId = namespace['namespace-id'];
        const [methodsRes, accountsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/unified/namespaces/${nsId}/methods`),
          fetch(`${API_BASE_URL}/unified/namespaces/${nsId}/accounts`)
        ]);
        const methodsData = await methodsRes.json();
        const accountsData = await accountsRes.json();
        console.log('Methods API response:', methodsData);
        console.log('Accounts API response:', accountsData);
        setMethods(Array.isArray(methodsData) ? methodsData : (methodsData && Array.isArray(methodsData.body) ? methodsData.body : []));
        setAccounts(Array.isArray(accountsData) ? accountsData : (accountsData && Array.isArray(accountsData.body) ? accountsData.body : []));
      } catch {
        setMethods([]);
        setAccounts([]);
      }
    };
    if (sidePanel === 'create') fetchDropdowns();
  }, [sidePanel, namespace]);

  // Handle mouse events for resizing
  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const minWidth = 320;
      const maxWidth = 700;
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, minWidth), maxWidth);
      setSidePanelWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Auto-open create panel when requested
  useEffect(() => {
    if (openCreate) {
      setSidePanel('create');
      // Calculate panel top position from namespace tab bar
      if (typeof window !== 'undefined') {
        const tabBar = document.querySelector('.namespace-tab-bar');
        if (tabBar) {
          const rect = tabBar.getBoundingClientRect();
          setPanelTopPosition(rect.bottom);
        }
      }
    }
  }, [openCreate, timestamp]); // timestamp ensures re-trigger even if openCreate stays true

  // Calculate panel top position on window resize/scroll
  useEffect(() => {
    const calculatePanelTop = () => {
      if (typeof window !== 'undefined' && sidePanel) {
        const tabBar = document.querySelector('.namespace-tab-bar');
        if (tabBar) {
          const rect = tabBar.getBoundingClientRect();
          setPanelTopPosition(rect.bottom);
        }
      }
    };

    calculatePanelTop();
    window.addEventListener('resize', calculatePanelTop);
    window.addEventListener('scroll', calculatePanelTop);
    
    return () => {
      window.removeEventListener('resize', calculatePanelTop);
      window.removeEventListener('scroll', calculatePanelTop);
    };
  }, [sidePanel]);

  const handleCreateInput = (field: string, value: any) => {
    setCreateData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (webhook: any) => {
    if (!window.confirm(`Are you sure you want to delete the webhook "${webhook['webhook-name']}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/unified/webhooks/${webhook['webhook-id']}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Webhook deleted successfully!');
        // Refresh webhooks list
        const nsId = namespace ? namespace['namespace-id'] : '';
        const res2 = await fetch(`${API_BASE_URL}/unified/webhooks/namespace/${nsId}`);
        const data2 = await res2.json();
        setWebhooks(Array.isArray(data2) ? data2 : []);
      } else {
        alert('Failed to delete webhook.');
      }
    } catch (error) {
      console.error('Delete webhook error:', error);
      alert('Failed to delete webhook.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg('');
    if (!createData['webhook-name'] || !createData['tableName']) {
      setCreateMsg('Webhook Name and Table Name are required.');
      return;
    }
    try {
      const nsId = namespace ? namespace['namespace-id'] : '';
      const body = {
        ...createData,
        'namespace-id': nsId,
        tags: Array.isArray(createData.tags) ? createData.tags : (typeof createData.tags === 'string' ? createData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
      };
      const res = await fetch(`${API_BASE_URL}/unified/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setCreateMsg('Webhook created successfully!');
        setSidePanel(null);
        setCreateData({
          'webhook-name': '',
          'post-exec-url': '',
          'method-id': '',
          'account-id': '',
          'status': 'active',
          'tags': [],
          'tableName': '',
          'pre-exec-url': '',
        });
        // Refresh webhooks
        const nsId = namespace ? namespace['namespace-id'] : '';
        const res2 = await fetch(`${API_BASE_URL}/unified/webhooks/namespace/${nsId}`);
        const data2 = await res2.json();
        setWebhooks(Array.isArray(data2) ? data2 : []);
      } else {
        setCreateMsg('Failed to create webhook.');
      }
    } catch {
      setCreateMsg('Failed to create webhook.');
    }
  };

  const renderSidePanel = () => {
    if (sidePanel === 'create') {
      return (
        <>
          <div className="mb-4 text-lg font-bold text-pink-700 text-center">
            {namespace?.['namespace-name']}
          </div>
          <form onSubmit={handleCreate} className="flex flex-col gap-4 h-full p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-pink-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mr-2">→</span>
                Create Webhook
              </h3>
              <button type="button" onClick={() => setSidePanel(null)} className="text-gray-400 hover:text-gray-700"><X size={22} /></button>
            </div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Webhook Name *</label>
            <input
              type="text"
              className="w-full border border-pink-200 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition outline-none bg-pink-50 placeholder-gray-400"
              value={createData['webhook-name']}
              onChange={e => handleCreateInput('webhook-name', e.target.value)}
              required
            />
            <label className="block text-xs font-medium text-gray-700 mb-1">Post Exec URL</label>
            <input
              type="text"
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none bg-blue-50 placeholder-gray-400"
              value={createData['post-exec-url']}
              onChange={e => handleCreateInput('post-exec-url', e.target.value)}
            />
            <label className="block text-xs font-medium text-gray-700 mb-1">Pre Exec URL</label>
            <input
              type="text"
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none bg-blue-50 placeholder-gray-400"
              value={createData['pre-exec-url']}
              onChange={e => handleCreateInput('pre-exec-url', e.target.value)}
            />
            <label className="block text-xs font-medium text-gray-700 mb-1">Table Name *</label>
            <input
              type="text"
              className="w-full border border-purple-200 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition outline-none bg-purple-50 placeholder-gray-400"
              value={createData['tableName']}
              onChange={e => handleCreateInput('tableName', e.target.value)}
              required
            />
            <label className="block text-xs font-medium text-gray-700 mb-1">Method</label>
            <select
              className="w-full border border-green-200 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-green-400 focus:border-green-400 transition outline-none bg-green-50"
              value={createData['method-id']}
              onChange={e => handleCreateInput('method-id', e.target.value)}
            >
              <option value="">Select Method</option>
              {methods.map((m: any) => (
                <option key={m['namespace-method-id']} value={m['namespace-method-id']}>
                  {m['namespace-method-name']}
                </option>
              ))}
            </select>
            <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
            <select
              className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition outline-none bg-yellow-50"
              value={createData['account-id']}
              onChange={e => handleCreateInput('account-id', e.target.value)}
            >
              <option value="">Select Account</option>
              {accounts.map((a: any) => (
                <option key={a['namespace-account-id']} value={a['namespace-account-id']}>
                  {a['namespace-account-name']}
                </option>
              ))}
            </select>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition outline-none bg-gray-50"
              value={createData['status']}
              onChange={e => handleCreateInput('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              className="w-full border border-pink-200 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition outline-none bg-pink-50 placeholder-gray-400"
              value={Array.isArray(createData.tags) ? createData.tags.join(', ') : createData.tags}
              onChange={e => handleCreateInput('tags', e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                className="bg-gray-200 text-gray-700 rounded-lg px-6 py-2 font-semibold text-base hover:bg-gray-300 transition"
                onClick={() => setSidePanel(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg px-6 py-2 font-bold text-base shadow-lg hover:from-pink-600 hover:to-purple-600 transition"
              >
                Create Webhook
              </button>
            </div>
            {createMsg && <div className="text-green-600 text-sm mt-2">{createMsg}</div>}
          </form>
        </>
      );
    }
    if (sidePanel && typeof sidePanel === 'object' && sidePanel.webhook) {
      const wh = sidePanel.webhook;
      return (
        <>
          <div key={wh['webhook-id']} className="flex flex-col h-full p-8 relative" style={{ minHeight: '100vh' }}>
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
              <h3 className="text-lg font-bold text-pink-700">{wh['webhook-name']}</h3>
              <div className="flex items-center gap-1">
                <button
                  title="Open in Tab"
                  className="px-2 py-1 rounded-md bg-pink-50 hover:bg-pink-100 text-pink-700 font-medium text-[10px] border border-pink-200 transition-all"
                  onClick={() => { if (typeof onViewWebhook === 'function') onViewWebhook(wh, namespace); setSidePanel(null); }}
                >
                  Open in Tab
                </button>
                <button
                  title="Edit"
                  className="p-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // Open in tab with edit mode
                    if (typeof onViewWebhook === 'function') {
                      onViewWebhook({ ...wh, __openEdit: true }, namespace);
                    }
                    setSidePanel(null);
                  }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  title="Delete"
                  className="p-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                  onClick={() => handleDelete(wh)}
                >
                  <Trash2 size={14} />
                </button>
                <button 
                  type="button" 
                  onClick={() => setSidePanel(null)} 
                  className="text-gray-400 hover:text-gray-700 ml-1"
                >
                  <X size={22} />
                </button>
              </div>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <div><span className="font-semibold text-gray-500">ID:</span> <span className="font-mono text-gray-700 break-all">{wh['webhook-id']}</span></div>
              <div><span className="font-semibold text-gray-500">Post Exec URL:</span> <span className="text-gray-700">{wh['post-exec-url']}</span></div>
              <div><span className="font-semibold text-gray-500">Pre Exec URL:</span> <span className="text-gray-700">{wh['pre-exec-url']}</span></div>
              <div><span className="font-semibold text-gray-500">Status:</span> <span className="text-gray-700">{wh['status']}</span></div>
              <div><span className="font-semibold text-gray-500">Tags:</span> {Array.isArray(wh.tags) && wh.tags.length > 0 ? wh.tags.map((tag: string, idx: number) => <span key={idx} className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs font-semibold shadow ml-1">{tag}</span>) : <span className="italic text-gray-400">No tags</span>}</div>
              <div><span className="font-semibold text-gray-500">Method ID:</span> <span className="text-gray-700">{wh['method-id']}</span></div>
              <div><span className="font-semibold text-gray-500">Account ID:</span> <span className="text-gray-700">{wh['account-id']}</span></div>
              <div><span className="font-semibold text-gray-500">Table Name:</span> <span className="text-gray-700">{wh['tableName'] || wh['table-name']}</span></div>
              <div><span className="font-semibold text-gray-500">Namespace ID:</span> <span className="text-gray-700">{wh['namespace-id']}</span></div>
            </div>
          </div>
        </>
      );
    }
    return null;
  };

  const filteredWebhooks = webhooks.filter(wh => 
    (wh['webhook-name'] || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      className="p-4 flex relative transition-all duration-300"
      style={{
        width: sidePanel ? `calc(100% - ${sidePanelWidth}px)` : '100%'
      }}
    >
      <div className="flex-1 pr-0 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">All Webhooks</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              className="inline-flex items-center justify-center gap-1 md:gap-2 bg-pink-600 hover:bg-pink-700 text-white px-2 md:px-4 py-1.5 md:py-2 rounded shadow whitespace-nowrap text-sm md:text-base flex-shrink-0"
              onClick={() => setSidePanel('create')}
            >
              <Plus size={14} className="md:hidden" />
              <Plus size={18} className="hidden md:block" />
              <span className="hidden sm:inline">Create Webhook</span><span className="sm:hidden">Create</span>
            </button>
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Search webhooks..."
                className="pl-8 pr-3 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 w-full text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 rounded text-sm ${viewMode === 'grid' ? 'bg-pink-100 text-pink-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Grid view"
              >
                ▦
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-pink-100 text-pink-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="List view"
              >
                ≡
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div>Loading...</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredWebhooks.length === 0 && <div className="text-gray-400">No webhooks found.</div>}
            {filteredWebhooks.map((wh, idx) => (
              <div 
                key={wh['webhook-id'] || idx} 
                className="group relative rounded-xl border border-gray-200 bg-white px-3 md:px-4 py-3 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => setSidePanel({ webhook: wh })}
                title="Click to view webhook details"
              >
                {/* actions */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-pink-600 bg-transparent"
                    title="View"
                    onClick={(e) => { e.stopPropagation(); setSidePanel({ webhook: wh }); }}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-blue-600 bg-transparent"
                    title="Edit"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (typeof onViewWebhook === 'function') {
                        onViewWebhook({ ...wh, __openEdit: true }, namespace);
                      }
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-red-600 bg-transparent"
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(wh); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3 pr-14">
                  <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center border border-pink-100">
                    <span className="text-pink-600 text-xl">🔗</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate">{wh['webhook-name']}</div>
                    <div className="text-xs text-gray-500 truncate">{wh['post-exec-url'] || 'No URL'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y">
              {filteredWebhooks.length === 0 && <div className="p-4 text-gray-400">No webhooks found.</div>}
              {filteredWebhooks.map((wh, idx) => (
                <div 
                  key={wh['webhook-id'] || idx}
                  className="flex items-center gap-3 px-3 md:px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSidePanel({ webhook: wh })}
                >
                  <div className="w-8 h-8 rounded bg-pink-50 flex items-center justify-center border border-pink-100">
                    <span className="text-xs font-bold text-pink-600">W</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{wh['webhook-name']}</div>
                    <div className="text-xs text-gray-500 truncate">{wh['post-exec-url'] || 'No URL'}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button className="text-pink-600 hover:text-pink-800 p-1" title="View" onClick={(e) => { e.stopPropagation(); setSidePanel({ webhook: wh }); }}>
                      <Eye size={16} />
                    </button>
                    <button className="text-blue-600 hover:text-blue-800 p-1" title="Edit" onClick={(e) => { 
                      e.stopPropagation(); 
                      if (typeof onViewWebhook === 'function') {
                        onViewWebhook({ ...wh, __openEdit: true }, namespace);
                      }
                    }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-800 p-1" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(wh); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Side Panel with draggable resizer */}
      {sidePanel && (
        <div
          ref={panelRef}
          className={`method-details-panel fixed right-0 bg-white border-l border-gray-200 z-50 transition-transform duration-300 flex flex-col`}
          style={{ 
            top: `${panelTopPosition}px`,
            bottom: '40px',
            width: sidePanel ? sidePanelWidth : 0, 
            transform: sidePanel ? 'translateX(0)' : `translateX(${sidePanelWidth}px)`, 
            borderTopLeftRadius: 0, 
            borderBottomLeftRadius: 0, 
            overflow: 'auto' 
          }}
        >
          {/* Draggable resizer */}
          <div
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', zIndex: 10 }}
            onMouseDown={() => setIsResizing(true)}
          >
            <div style={{ width: 4, height: 48, background: '#e5e7eb', borderRadius: 2, margin: 'auto', marginTop: 24 }} />
          </div>
          <div style={{ marginLeft: 16, flex: 1, minWidth: 0 }}>{renderSidePanel()}</div>
        </div>
      )}
    </div>
  );
};

export default AllWebhookPage; 