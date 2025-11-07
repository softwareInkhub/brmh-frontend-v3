'use client'
import React, { useEffect, useState } from 'react';
import { Database, Globe, FileCode, Terminal, User, Link2, Copy, MoreVertical, Trash2, Search, Play, Copy as CopyIcon, Edit3, Settings } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function SingleNamespacePage({ namespaceId, initialNamespace, refreshSidePanelData, onViewAccount, onViewMethod, onViewSchema, onTestMethod }: { namespaceId: string, initialNamespace?: any, refreshSidePanelData?: () => Promise<void>, onViewAccount?: (account: any, ns?: any) => void, onViewMethod?: (method: any, ns?: any) => void, onViewSchema?: (schema: any, ns?: any) => void, onTestMethod?: (method: any, ns?: any) => void }) {
  const [namespace, setNamespace] = useState<any>(initialNamespace || null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [schemas, setSchemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'methods' | 'schemas'>('accounts');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateNamespaceName, setDuplicateNamespaceName] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Filter data based on search query
  const filteredAccounts = accounts.filter(acc => 
    acc['namespace-account-name']?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredMethods = methods.filter(m => 
    m['namespace-method-name']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m['namespace-method-type']?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredSchemas = schemas.filter(s => 
    s.schemaName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeBadgeClasses = (t: string) => {
    switch ((t || '').toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-700 border border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border border-red-200';
      case 'PATCH': return 'bg-purple-100 text-purple-700 border border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const deleteItem = async (type: 'account' | 'method' | 'schema', id: string) => {
    try {
      let url = '';
      if (type === 'account') {
        url = `${API_BASE_URL}/unified/accounts/${id}`;
      } else if (type === 'method') {
        url = `${API_BASE_URL}/unified/methods/${id}`;
      } else if (type === 'schema') {
        url = `${API_BASE_URL}/unified/schema/${id}`;
      }
      
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        // Refresh the data
        if (type === 'account') {
          setAccounts(prev => prev.filter(acc => acc['namespace-account-id'] !== id));
        } else if (type === 'method') {
          setMethods(prev => prev.filter(method => method['namespace-method-id'] !== id));
        } else if (type === 'schema') {
          setSchemas(prev => prev.filter(schema => schema.id !== id));
        }
        
        // Refresh side panel data to remove the deleted item
        if (refreshSidePanelData) {
          await refreshSidePanelData();
        }
      } else {
        console.error(`Failed to delete ${type}`);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
    setOpenMenus({});
  };

  const duplicateItem = async (type: 'account' | 'method' | 'schema', id: string, name: string) => {
    try {
      console.log(`🔄 Duplicating ${type}:`, { id, name });
      
      if (!id) {
        console.error(`❌ ${type} ID is undefined or empty`);
        return;
      }
      
      let url = '';
      if (type === 'account') {
        url = `${API_BASE_URL}/unified/accounts/${id}/duplicate`;
      } else if (type === 'method') {
        url = `${API_BASE_URL}/unified/methods/${id}/duplicate`;
      } else if (type === 'schema') {
        url = `${API_BASE_URL}/unified/schema/${id}/duplicate`;
      }
      
      const newName = `${name} (Copy)`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log(`Successfully duplicated ${type}:`, result);
        
        // Refresh the data to show the new duplicated item
        if (type === 'account') {
          const accRes = await fetch(`${API_BASE_URL}/unified/namespaces/${namespaceId}/accounts`);
          const accData = await accRes.json();
          setAccounts(Array.isArray(accData) ? accData : []);
          
          // Refresh side panel data to show the new account
          if (refreshSidePanelData) {
            await refreshSidePanelData();
          }
        } else if (type === 'method') {
          const methRes = await fetch(`${API_BASE_URL}/unified/namespaces/${namespaceId}/methods`);
          const methData = await methRes.json();
          setMethods(Array.isArray(methData) ? methData : []);
          
          // Refresh side panel data to show the new method
          if (refreshSidePanelData) {
            await refreshSidePanelData();
          }
        } else if (type === 'schema') {
          const schRes = await fetch(`${API_BASE_URL}/unified/schema`);
          const schData = await schRes.json();
          setSchemas(Array.isArray(schData) 
            ? schData.filter((s: any) => s.namespaceId === namespaceId)
            : []);
          
          // Refresh side panel data to show the new schema
          if (refreshSidePanelData) {
            await refreshSidePanelData();
          }
        }
      } else {
        console.error(`Failed to duplicate ${type}`);
      }
    } catch (error) {
      console.error(`Error duplicating ${type}:`, error);
    }
    setOpenMenus({});
  };

  const openDuplicateModal = () => {
    const defaultName = `${namespace?.['namespace-name']} (Copy)`;
    setDuplicateNamespaceName(defaultName);
    setShowDuplicateModal(true);
    setOpenMenus({});
  };

  const duplicateNamespace = async () => {
    if (!duplicateNamespaceName.trim()) {
      alert('Please enter a name for the duplicated namespace');
      return;
    }

    try {
      setIsDuplicating(true);
      console.log(`🔄 Duplicating namespace:`, namespaceId);
      
      const res = await fetch(`${API_BASE_URL}/unified/namespaces/${namespaceId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName: duplicateNamespaceName }),
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log(`Successfully duplicated namespace:`, result);
        
        const successMessage = `✅ Namespace duplicated successfully!\n\n` +
          `New Namespace: "${duplicateNamespaceName}"\n` +
          `New ID: ${result.namespace.namespaceId}\n\n` +
          `Duplicated:\n` +
          `• ${result.duplicatedAccounts || 0} accounts\n` +
          `• ${result.duplicatedMethods || 0} methods\n` +
          `• ${result.duplicatedSchemas || 0} schemas`;
        
        alert(successMessage);
        setShowDuplicateModal(false);
        setDuplicateNamespaceName('');
        setIsDuplicating(false);
        
        // Refresh side panel data to show the new namespace
        if (refreshSidePanelData) {
          await refreshSidePanelData();
        }
      } else {
        console.error(`Failed to duplicate namespace`);
        alert('Failed to duplicate namespace');
        setIsDuplicating(false);
      }
    } catch (error) {
      console.error(`Error duplicating namespace:`, error);
      alert('Error duplicating namespace');
      setIsDuplicating(false);
    }
  };

  const deleteNamespace = async () => {
    // Validate confirmation text
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    try {
      setIsDeleting(true);
      console.log(`🗑️ Deleting namespace:`, namespaceId);
      
      const res = await fetch(`${API_BASE_URL}/unified/namespaces/${namespaceId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        let result = null;
        try {
          const text = await res.text();
          if (text) {
            result = JSON.parse(text);
          }
        } catch (parseError) {
          console.warn('Could not parse response as JSON:', parseError);
        }
        
        console.log(`Successfully deleted namespace:`, result);
        
        const successMessage = `✅ Namespace deleted successfully!\n\n` +
          `Deleted:\n` +
          `• ${result?.deletedCounts?.accounts || 0} accounts\n` +
          `• ${result?.deletedCounts?.methods || 0} methods\n` +
          `• ${result?.deletedCounts?.schemas || 0} schemas`;
        
        alert(successMessage);
        setShowDeleteModal(false);
        setDeleteConfirmText('');
        window.close();
      } else {
        console.error(`Failed to delete namespace`);
        alert('Failed to delete namespace');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error(`Error deleting namespace:`, error);
      alert('Error deleting namespace');
      setIsDeleting(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmText('');
    setOpenMenus({});
  };

  const editNamespace = () => {
    // For now, we'll just show an alert. In a real implementation, this would open a modal or form
    alert('Edit namespace functionality - This would open an edit form/modal');
    setOpenMenus({});
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside any menu
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-dropdown') && !target.closest('.menu-button')) {
        setOpenMenus({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchNamespace = async () => {
      setLoading(true);
      if (!namespaceId) {
        console.error('No namespaceId provided!');
        setAccounts([]);
        setMethods([]);
        setSchemas([]);
        setLoading(false);
        return;
      }
      try {
        if (!initialNamespace) {
          const nsRes = await fetch(`${API_BASE_URL}/unified/namespaces/${namespaceId}`);
          const ns = await nsRes.json();
          if (ns && Object.keys(ns).length > 0) {
            setNamespace(ns);
          }
          // else, keep the initialNamespace
        }
        console.log('Fetching accounts for namespaceId:', namespaceId);
        const accRes = await fetch(`${API_BASE_URL}/unified/namespaces/${namespaceId}/accounts`);
        const accData = await accRes.json();
        console.log('Accounts:', accData);
        setAccounts(Array.isArray(accData) ? accData : []);

        console.log('Fetching methods for namespaceId:', namespaceId);
        const methRes = await fetch(`${API_BASE_URL}/unified/namespaces/${namespaceId}/methods`);
        const methData = await methRes.json();
        console.log('Methods:', methData);
        setMethods(Array.isArray(methData) ? methData : []);

        console.log('Fetching schemas for namespaceId:', namespaceId);
        const schRes = await fetch(`${API_BASE_URL}/unified/schema`);
        const schData = await schRes.json();
        console.log('Schemas:', schData);
        setSchemas(Array.isArray(schData) 
          ? schData.filter((s: any) => s.namespaceId === namespaceId)
          : []);
      } catch (err) {
        // do not overwrite namespace if initialNamespace exists
        if (!initialNamespace) setNamespace(null);
        setAccounts([]);
        setMethods([]);
        setSchemas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNamespace();
  }, [namespaceId, initialNamespace]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!namespace || Object.keys(namespace).length === 0) return <div className="p-8">Namespace not found.</div>;

  return (
    <div className="pt-4 px-4 md:p-8 w-full bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          {/* Namespace Info */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {namespace['icon-url'] ? (
                <img
                  src={namespace['icon-url']}
                  alt={`${namespace['namespace-name']} icon`}
                  className="w-10 h-10 rounded-lg object-cover shadow-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Database size={18} className="text-blue-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{namespace['namespace-name']}</h2>
              {namespace['namespace-url'] && (
                <a 
                  href={namespace['namespace-url']} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 truncate mt-0.5 flex items-center gap-1 group"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe size={12} />
                  <span className="truncate group-hover:underline">{namespace['namespace-url']}</span>
                </a>
              )}
            </div>
            {/* Settings Button */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('namespace-actions')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Namespace actions"
              >
                <Settings size={18} />
              </button>
              {openMenus['namespace-actions'] && (
                <div className="menu-dropdown absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(namespace['namespace-id']);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <Copy size={14} />
                    Copy ID
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      editNamespace();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <Edit3 size={14} />
                    Edit 
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDuplicateModal();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left"
                  >
                    <CopyIcon size={14} />
                    Duplicate 
                  </button>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     openDeleteModal();
                   }}
                   className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                 >
                   <Trash2 size={14} />
                   Delete 
                 </button>
                </div>
              )}
            </div>
          </div>


          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search accounts, methods, schemas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="flex items-center gap-4 justify-between">
            {/* Icon and Title */}
            <div className="min-w-0 flex items-center gap-4">
              <div className="flex-shrink-0">
                {namespace['icon-url'] ? (
                  <img
                    src={namespace['icon-url']}
                    alt={`${namespace['namespace-name']} icon`}
                    className="w-12 h-12 rounded-lg object-cover shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Database size={20} className="text-blue-600" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 truncate">{namespace['namespace-name']}</h2>
                {namespace['namespace-url'] && (
                  <a 
                    href={namespace['namespace-url']} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 truncate mt-1 flex items-center gap-1 group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe size={14} />
                    <span className="truncate group-hover:underline">{namespace['namespace-url']}</span>
                  </a>
                )}
              </div>
            </div>
            
            {/* Search Box and Namespace Actions */}
            <div className="flex items-center gap-4">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search accounts, methods, schemas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Namespace Actions */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu('namespace-actions')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Namespace actions"
                >
                  <Settings size={18} />
                </button>
                {openMenus['namespace-actions'] && (
                  <div className="menu-dropdown absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(namespace['namespace-id']);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <Copy size={14} />
                      Copy ID
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editNamespace();
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <Edit3 size={14} />
                      Edit 
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDuplicateModal();
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left"
                    >
                      <CopyIcon size={14} />
                      Duplicate 
                    </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       openDeleteModal();
                     }}
                     className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                   >
                     <Trash2 size={14} />
                     Delete 
                   </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-t-lg transition-colors ${activeTab === 'accounts' ? 'bg-white border border-b-white border-gray-200 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('accounts')}
          >
            Accounts <span className="text-xs text-gray-500">({filteredAccounts.length})</span>
          </button>
          <button
            className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-t-lg transition-colors ${activeTab === 'methods' ? 'bg-white border border-b-white border-gray-200 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('methods')}
          >
            Methods <span className="text-xs text-gray-500">({filteredMethods.length})</span>
          </button>
          <button
            className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-t-lg transition-colors ${activeTab === 'schemas' ? 'bg-white border border-b-white border-gray-200 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('schemas')}
          >
            Schemas <span className="text-xs text-gray-500">({filteredSchemas.length})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Accounts Card */}
        {activeTab === 'accounts' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 flex flex-col shadow-sm h-[50vh] md:h-[66vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
            Accounts <span className="text-xs text-gray-500 font-normal">({filteredAccounts.length}/{accounts.length})</span>
            </h3>
            <button
              onClick={() => {
                // Ask parent to open All Accounts tab for this namespace
                // We can't directly open tabs here, but parent passes onViewAccount for items.
                // We'll dispatch a custom event the parent page listens to.
                const event = new CustomEvent('open-all-accounts-tab', { detail: { namespaceId } });
                window.dispatchEvent(event);
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            >Add Account</button>
          </div>
          <div className="mt-1 flex-1 min-h-0 overflow-y-auto pr-1">
            {filteredAccounts.length === 0 ? (
              <div className="text-gray-400">{searchQuery ? 'No accounts match your search.' : 'No accounts found.'}</div>
            ) : (
                             <ul className="space-y-2">
               {filteredAccounts.map((acc: any, idx: number) => (
                <li key={acc['namespace-account-id'] || idx} className="relative group">
                  <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition"
                       onClick={() => onViewAccount && onViewAccount(acc, namespace)}
                  >
                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center"><User size={14} className="text-blue-600"/></div>
                    <div className="min-w-0 flex-1">
                      <span className="block font-medium text-gray-800 leading-tight">{acc['namespace-account-name']}</span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(`account-${acc['namespace-account-id']}`);
                        }}
                        className="menu-button p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {openMenus[`account-${acc['namespace-account-id']}`] && (
                        <div className="menu-dropdown absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Use the DynamoDB id for duplication API
                              duplicateItem('account', acc.id, acc['namespace-account-name']);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left"
                          >
                            <CopyIcon size={14} />
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem('account', acc['namespace-account-id']);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              </ul>
            )}
          </div>
        </div>
        )}
        {/* Methods Card */}
        {activeTab === 'methods' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 flex flex-col shadow-sm h-[50vh] md:h-[66vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            Methods <span className="text-xs text-gray-500 font-normal">({filteredMethods.length}/{methods.length})</span>
            </h3>
            <button
              onClick={() => {
                const event = new CustomEvent('open-all-methods-tab', { detail: { namespaceId } });
                window.dispatchEvent(event);
              }}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
            >Add Method</button>
          </div>
          <div className="mt-1 flex-1 min-h-0 overflow-y-auto pr-1">
            {filteredMethods.length === 0 ? (
              <div className="text-gray-400">{searchQuery ? 'No methods match your search.' : 'No methods found.'}</div>
            ) : (
                             <ul className="space-y-2">
               {filteredMethods.map((m: any, idx: number) => (
                <li key={m['namespace-method-id'] || idx} className="relative group">
                  <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-green-300 hover:bg-green-50/40 transition"
                       onClick={() => onViewMethod && onViewMethod(m, namespace)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center"><Terminal size={14} className="text-green-600"/></div>
                      <span className="font-medium text-gray-800 truncate">{m['namespace-method-name']}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${typeBadgeClasses(m['namespace-method-type'])}`}>{m['namespace-method-type']}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTestMethod && onTestMethod(m, namespace);
                        }}
                        className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                        title="Test method"
                        aria-label="Test method"
                      >
                        <Play size={14} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(`method-${m['namespace-method-id']}`);
                          }}
                          className="menu-button p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {openMenus[`method-${m['namespace-method-id']}`] && (
                          <div className="menu-dropdown absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Method object for duplication:', m);
                                // Use the DynamoDB id for duplication API
                                duplicateItem('method', m.id, m['namespace-method-name']);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left"
                            >
                              <CopyIcon size={14} />
                              Duplicate
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem('method', m['namespace-method-id']);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              </ul>
            )}
          </div>
        </div>
        )}
        {/* Schemas Card */}
        {activeTab === 'schemas' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 flex flex-col shadow-sm h-[50vh] md:h-[66vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900">
            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full"></span>
            Schemas <span className="text-xs text-gray-500 font-normal">({filteredSchemas.length}/{schemas.length})</span>
            </h3>
            <button
              onClick={() => {
                const event = new CustomEvent('open-create-schema-tab', { detail: { namespaceId } });
                window.dispatchEvent(event);
              }}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
            >Add Schema</button>
          </div>
          <div className="mt-1 flex-1 min-h-0 overflow-y-auto pr-1">
            {filteredSchemas.length === 0 ? (
              <div className="text-gray-400">{searchQuery ? 'No schemas match your search.' : 'No schemas found.'}</div>
            ) : (
                             <ul className="space-y-2">
               {filteredSchemas.map((s: any, idx: number) => (
                <li key={s.id || idx} className="relative group">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-purple-300 hover:bg-purple-50/40 transition"
                       onClick={() => onViewSchema && onViewSchema(s, namespace)}
                  >
                    <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center"><FileCode size={14} className="text-purple-600"/></div>
                    <span className="font-medium text-gray-800 flex-1">{s.schemaName}</span>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(`schema-${s.id}`);
                        }}
                        className="menu-button p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {openMenus[`schema-${s.id}`] && (
                        <div className="menu-dropdown absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateItem('schema', s.id, s.schemaName);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left"
                          >
                            <CopyIcon size={14} />
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem('schema', s.id);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              </ul>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Delete Namespace</h2>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isDeleting}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 mb-2">⚠️ WARNING: This will permanently delete:</p>
                  <ul className="space-y-1 text-sm text-red-800">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      <span><strong>Namespace:</strong> "{namespace?.['namespace-name']}"</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      <span><strong>{accounts?.length || 0}</strong> Account{(accounts?.length || 0) !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      <span><strong>{methods?.length || 0}</strong> Method{(methods?.length || 0) !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      <span><strong>{schemas?.length || 0}</strong> Schema{(schemas?.length || 0) !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      <span>All associated <strong>files and data</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To confirm, type <span className="font-mono font-bold text-red-600">DELETE</span> in the box below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                disabled={isDeleting}
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={deleteNamespace}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  deleteConfirmText === 'DELETE' && !isDeleting
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isDeleting ? 'Deleting...' : 'Delete Namespace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Confirmation Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <CopyIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Duplicate Namespace</h2>
                <p className="text-sm text-gray-600">Create a copy of this namespace</p>
              </div>
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateNamespaceName('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isDuplicating}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-2">ℹ️ This will duplicate:</p>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span><strong>Namespace:</strong> "{namespace?.['namespace-name']}"</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span><strong>{accounts?.length || 0}</strong> Account{(accounts?.length || 0) !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span><strong>{methods?.length || 0}</strong> Method{(methods?.length || 0) !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span><strong>{schemas?.length || 0}</strong> Schema{(schemas?.length || 0) !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span>All associated <strong>files and data</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Namespace Name:
              </label>
              <input
                type="text"
                value={duplicateNamespaceName}
                onChange={(e) => setDuplicateNamespaceName(e.target.value)}
                placeholder="Enter a name for the duplicated namespace"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={isDuplicating}
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateNamespaceName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isDuplicating}
              >
                Cancel
              </button>
              <button
                onClick={duplicateNamespace}
                disabled={!duplicateNamespaceName.trim() || isDuplicating}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  duplicateNamespaceName.trim() && !isDuplicating
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isDuplicating ? 'Duplicating...' : 'Duplicate Namespace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicating Loading Indicator - Bottom Left */}
      {isDuplicating && (
        <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-blue-200 rounded-full"></div>
              <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent absolute top-0 left-0 animate-spin"></div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Duplicating Namespace</p>
              <p className="text-sm text-gray-600">Please wait, copying all data...</p>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs text-gray-500">
            <p>• Duplicating namespace...</p>
            <p>• Copying accounts...</p>
            <p>• Copying methods...</p>
            <p>• Copying schemas...</p>
            <p>• Creating relationships...</p>
          </div>
        </div>
      )}

      {/* Loading Indicator - Bottom Left */}
      {isDeleting && (
        <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-red-200 rounded-full"></div>
              <div className="w-10 h-10 border-4 border-red-600 rounded-full border-t-transparent absolute top-0 left-0 animate-spin"></div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Deleting Namespace</p>
              <p className="text-sm text-gray-600">Please wait, removing all data...</p>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs text-gray-500">
            <p>• Deleting accounts...</p>
            <p>• Deleting methods...</p>
            <p>• Deleting schemas...</p>
            <p>• Cleaning up files...</p>
          </div>
        </div>
      )}
    </div>
  );
} 