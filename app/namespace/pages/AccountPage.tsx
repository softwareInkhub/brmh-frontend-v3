import React, { useEffect, useState } from 'react';
import { User, Hash, Tag, Edit3, CheckCircle, Globe, Key, List, X, Edit2, Trash2, Link as LinkIcon, Database } from 'lucide-react';

type Props = {
  account: any;
  namespace?: any;
  openEdit?: boolean;
  refreshSidePanelData?: () => Promise<void>;
};

export default function AccountPage({ account, namespace, openEdit, refreshSidePanelData }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [editAccount, setEditAccount] = useState<any>(account || {});
  const [saveMsg, setSaveMsg] = useState('');

  // Auto-open in edit mode when requested
  useEffect(() => {
    if (openEdit) {
      setEditMode(true);
    }
  }, [openEdit]);

  // Editable headers/variables helpers
  const updateHeaderAtIndex = (index: number, field: 'key' | 'value', value: string) => {
    setEditAccount((prev: any) => {
      const headers = Array.isArray(prev['namespace-account-header']) ? [...prev['namespace-account-header']] : [];
      const row = { ...(headers[index] || { key: '', value: '' }), [field]: value };
      headers[index] = row;
      return { ...prev, 'namespace-account-header': headers };
    });
  };

  const addHeaderRow = () => {
    setEditAccount((prev: any) => ({
      ...prev,
      'namespace-account-header': [
        ...(Array.isArray(prev['namespace-account-header']) ? prev['namespace-account-header'] : []),
        { key: '', value: '' }
      ]
    }));
  };

  const removeHeaderRow = (index: number) => {
    setEditAccount((prev: any) => {
      const headers = Array.isArray(prev['namespace-account-header']) ? [...prev['namespace-account-header']] : [];
      headers.splice(index, 1);
      return { ...prev, 'namespace-account-header': headers };
    });
  };

  const updateVariableAtIndex = (index: number, field: 'key' | 'value', value: string) => {
    setEditAccount((prev: any) => {
      const keyName = Array.isArray(prev['variables']) ? 'variables' : 'namespace-account-variables';
      const list = Array.isArray(prev[keyName]) ? [...prev[keyName]] : [];
      const row = { ...(list[index] || { key: '', value: '' }), [field]: value };
      list[index] = row;
      return { ...prev, [keyName]: list };
    });
  };

  const addVariableRow = () => {
    setEditAccount((prev: any) => {
      const keyName = Array.isArray(prev['variables']) ? 'variables' : 'namespace-account-variables';
      const list = Array.isArray(prev[keyName]) ? [...prev[keyName]] : [];
      list.push({ key: '', value: '' });
      return { ...prev, [keyName]: list };
    });
  };

  const removeVariableRow = (index: number) => {
    setEditAccount((prev: any) => {
      const keyName = Array.isArray(prev['variables']) ? 'variables' : 'namespace-account-variables';
      const list = Array.isArray(prev[keyName]) ? [...prev[keyName]] : [];
      list.splice(index, 1);
      return { ...prev, [keyName]: list };
    });
  };


  const handleInput = (field: string, value: any) => {
    setEditAccount((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg('');
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/accounts/${editAccount['namespace-account-id']}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editAccount),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update account');
      }

      const updatedAccount = await response.json();
      setEditAccount(updatedAccount);
      setSaveMsg('Account updated successfully!');
      
      // Refresh side panel data to show the updated account name
      if (refreshSidePanelData) {
        await refreshSidePanelData();
      }
      
      // Close edit mode after a short delay
      setTimeout(() => {
        setEditMode(false);
        setSaveMsg('');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating account:', error);
      setSaveMsg('Failed to update account. Please try again.');
    }
  };

  // Helper to render header variables if present
  const renderHeaderVars = (headers: any) => {
    if (!headers || typeof headers !== 'object') return <span className="italic text-gray-400 dark:text-gray-500">None</span>;
  return (
      <ul className="space-y-1 mt-1">
        {Object.entries(headers).map(([key, value]) => (
          <li key={key} className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Key size={12} className="text-blue-400 md:hidden" />
              <Key size={14} className="text-blue-400 hidden md:block" />
              <span className="font-mono text-gray-700 dark:text-gray-300 break-all">{key}</span>
            </div>
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs break-all">{String(value)}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Helper to render account variables if present
  const renderAccountVars = (variables: any) => {
    if (!variables || !Array.isArray(variables) || variables.length === 0) return <span className="italic text-gray-400 dark:text-gray-500">None</span>;
    return (
      <ul className="space-y-1 mt-1">
        {variables.map((variable: any, index: number) => (
          <li key={index} className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Key size={12} className="text-green-400 md:hidden" />
              <Key size={14} className="text-green-400 hidden md:block" />
              <span className="font-mono text-gray-700 dark:text-gray-300 break-all">{variable.key}</span>
            </div>
            <span className="bg-green-100 dark:bg-green-900/30 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs break-all">{String(variable.value)}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Helper to render table names if present
  const renderTableNames = (tableName: any) => {
    if (!tableName) return <span className="italic text-gray-400">No tables</span>;
    
    // Handle DynamoDB structure
    let tableNameMap: Record<string, string> = {};
    if (tableName.M) {
      // Extract from DynamoDB format
      tableNameMap = Object.fromEntries(
        Object.entries(tableName.M).map(([key, value]: [string, any]) => [
          key, 
          value.S || value
        ])
      );
    } else if (typeof tableName === 'object') {
      // Handle plain object format
      tableNameMap = tableName;
    }
    
    if (Object.keys(tableNameMap).length === 0) {
      return <span className="italic text-gray-400">No tables</span>;
    }
    
    return (
      <div className="space-y-2 mt-1">
        {Object.entries(tableNameMap).map(([methodName, tableNameValue]) => (
          <div key={methodName} className="flex items-start md:items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Database size={12} className="text-blue-400 md:hidden mt-0.5" />
            <Database size={14} className="text-blue-400 hidden md:block" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 break-all">{methodName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">{tableNameValue}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper to render account headers if present
  const renderAccountHeaders = (headers: any) => {
    if (!headers || !Array.isArray(headers) || headers.length === 0) return <span className="italic text-gray-400 dark:text-gray-500">None</span>;
    return (
      <ul className="space-y-1 mt-1">
        {headers.map((header: any, index: number) => (
          <li key={index} className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Key size={12} className="text-purple-400 md:hidden" />
              <Key size={14} className="text-purple-400 hidden md:block" />
              <span className="font-mono text-gray-700 dark:text-gray-300 break-all">{header.key}</span>
            </div>
            <span className="bg-purple-100 dark:bg-purple-900/30 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs break-all">{String(header.value)}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Pinterest OAuth redirect logic
  const handleOAuthRedirect = (account: any) => {
    console.log('🔗 Starting Pinterest OAuth redirect process...');
    console.log('📋 Account details:', {
      accountId: account['namespace-account-id'],
      accountName: account['namespace-account-name'],
      variables: account["variables"] || account["namespace-account-variables"]
    });

    const variables = (account["variables"] || account["namespace-account-variables"] || []);
    const clientId = variables.find((v: any) => v.key === 'client_id')?.value;
    const clientSecret = variables.find((v: any) => v.key === 'secret_key')?.value;
    const redirectUrl = variables.find((v: any) => v.key === 'redirect_uri')?.value;

    console.log('🔑 Extracted OAuth credentials:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUrl: !!redirectUrl,
      redirectUrl: redirectUrl
    });

    if (!clientId || !redirectUrl || !clientSecret) {
      console.error('❌ Missing required OAuth credentials:', {
        missingClientId: !clientId,
        missingClientSecret: !clientSecret,
        missingRedirectUrl: !redirectUrl
      });
      alert('Missing client_id, secret_key, or redirect_uri in account variables');
      return;
    }

    const scopes = ['boards:read', 'boards:write', 'pins:read', 'pins:write'];
    const authUrl = new URL('https://www.pinterest.com/oauth/');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUrl);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scopes.join(','));

    const accountDetails = {
      clientId,
      clientSecret,
      redirectUrl,
      accountId: account['namespace-account-id']
    };

    console.log('💾 Storing account details in sessionStorage:', {
      accountId: accountDetails.accountId,
      redirectUrl: accountDetails.redirectUrl,
      hasClientId: !!accountDetails.clientId,
      hasClientSecret: !!accountDetails.clientSecret
    });

    sessionStorage.setItem('pinterestAccountDetails', JSON.stringify(accountDetails));

    console.log('🌐 Redirecting to Pinterest OAuth URL:', authUrl.toString());
    console.log('📤 OAuth parameters:', {
      client_id: clientId.substring(0, 10) + '...',
      redirect_uri: redirectUrl,
      response_type: 'code',
      scope: scopes.join(',')
    });

    window.location.href = authUrl.toString();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/accounts/${editAccount['namespace-account-id']}`,
          { method: 'DELETE' }
        );
        if (!response.ok) throw new Error('Failed to delete account');
        
        // Refresh side panel data to remove the deleted account
        if (refreshSidePanelData) {
          await refreshSidePanelData();
        }
        
        alert('Account deleted!');
        // Close the tab or redirect
        window.close();
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account');
      }
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col h-full p-0 m-0">
      <div className="bg-white dark:bg-gray-900 p-4 md:p-8 flex flex-col gap-4 md:gap-6 w-full h-full m-0">
        {!editMode ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 md:gap-3">
                <User className="text-blue-500 md:hidden" size={20} />
                <User className="text-blue-500 hidden md:block" size={28} />
                <h2 className="text-lg md:text-2xl font-bold text-blue-700 dark:text-blue-400 tracking-tight">Account Details</h2>
              </div>
              <div className="flex gap-1 md:gap-2">
                <button
                  title="Link"
                  className="p-1.5 md:p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  onClick={() => handleOAuthRedirect(editAccount)}
                >
                  <LinkIcon size={16} className="md:hidden" />
                  <LinkIcon size={18} className="hidden md:block" />
                </button>
                <button
                  title="Edit"
                  className="p-1.5 md:p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  onClick={() => setEditMode(true)}
                >
                  <Edit2 size={16} className="md:hidden" />
                  <Edit2 size={18} className="hidden md:block" />
                </button>
                <button
                  title="Delete"
                  className="p-1.5 md:p-2 rounded-lg bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  onClick={handleDelete}
                >
                  <Trash2 size={16} className="md:hidden" />
                  <Trash2 size={18} className="hidden md:block" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1"><User size={14} className="text-blue-400 md:hidden" /><User size={16} className="text-blue-400 hidden md:block" /> Name</div>
                <div className="text-base md:text-lg font-semibold text-gray-900 dark:text-white break-words">{editAccount["namespace-account-name"] || ''}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1"><Hash size={14} className="text-purple-400 md:hidden" /><Hash size={16} className="text-purple-400 hidden md:block" /> ID</div>
                <div className="text-sm md:text-base font-mono text-gray-700 dark:text-gray-300 break-all">{editAccount["namespace-account-id"] || ''}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1"><Globe size={14} className="text-green-400 md:hidden" /><Globe size={16} className="text-green-400 hidden md:block" /> Namespace ID</div>
                <div className="text-sm md:text-base font-mono text-gray-700 dark:text-gray-300 break-all">{editAccount["namespace-id"] || (namespace && namespace["namespace-id"]) || <span className="italic text-gray-400 dark:text-gray-500">None</span>}</div>
              </div>
              {editAccount["namespace-account-url-override"] && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1"><Globe size={14} className="text-pink-400 md:hidden" /><Globe size={16} className="text-pink-400 hidden md:block" /> URL Override</div>
                  <div className="text-sm md:text-base text-gray-700 dark:text-gray-300 break-all">{editAccount["namespace-account-url-override"]}</div>
                </div>
              )}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1"><Tag size={14} className="text-yellow-400 md:hidden" /><Tag size={16} className="text-yellow-400 hidden md:block" /> Tags</div>
                <div className="flex flex-wrap gap-1 md:gap-2">
                  {Array.isArray(editAccount.tags) && editAccount.tags.length > 0 ? (
                    editAccount.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full text-xs font-semibold shadow">{tag}</span>
                    ))
                  ) : (
                    <span className="italic text-gray-400 dark:text-gray-500">No tags</span>
                  )}
                </div>
              </div>
              {editAccount["header-variables"] && (
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><List size={14} className="text-blue-400 md:hidden" /><List size={16} className="text-blue-400 hidden md:block" /> Header Variables</div>
                  {renderHeaderVars(editAccount["header-variables"])}
                </div>
              )}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Key size={14} className="text-purple-400 md:hidden" /><Key size={16} className="text-purple-400 hidden md:block" /> Account Headers</div>
                {renderAccountHeaders(editAccount["namespace-account-header"])}
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Key size={14} className="text-green-400 md:hidden" /><Key size={16} className="text-green-400 hidden md:block" /> Account Variables</div>
                {renderAccountVars(editAccount["variables"] || editAccount["namespace-account-variables"])}
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Database size={14} className="text-blue-400 md:hidden" /><Database size={16} className="text-blue-400 hidden md:block" /> Tables</div>
                {renderTableNames(editAccount.data?.M?.tableName || editAccount.tableName)}
              </div>
              <div className="md:col-span-2 flex items-center gap-2 mt-2">
                <CheckCircle size={16} className="text-green-500 dark:text-green-400 md:hidden" />
                <CheckCircle size={18} className="text-green-500 dark:text-green-400 hidden md:block" />
                <span className="text-green-700 dark:text-green-400 font-semibold text-sm md:text-base">Active</span>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4 md:gap-6 animate-fade-in">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <Edit3 className="text-blue-500 md:hidden" size={18} />
              <Edit3 className="text-blue-500 hidden md:block" size={24} />
              <h2 className="text-lg md:text-xl font-bold text-blue-700 dark:text-blue-400 tracking-tight">Edit Account</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-500 transition outline-none bg-blue-50 dark:bg-blue-900/20 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                  value={editAccount["namespace-account-name"] || ''}
                  onChange={e => handleInput("namespace-account-name", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">ID</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm md:text-base bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={editAccount["namespace-account-id"] || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Namespace ID</label>
                <input
                  type="text"
                  className="w-full border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-sm md:text-base bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-gray-100"
                  value={editAccount["namespace-id"] || (namespace && namespace["namespace-id"]) || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">URL Override</label>
                <input
                  type="text"
                  className="w-full border border-pink-200 dark:border-pink-800 rounded-lg px-3 py-2 text-sm md:text-base bg-pink-50 dark:bg-pink-900/20 text-gray-900 dark:text-gray-100"
                  value={editAccount["namespace-account-url-override"] || ''}
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  className="w-full border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 focus:border-yellow-400 dark:focus:border-yellow-500 transition outline-none bg-yellow-50 dark:bg-yellow-900/20 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                  value={Array.isArray(editAccount.tags) ? editAccount.tags.join(', ') : ''}
                  onChange={e => handleInput('tags', e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean))}
                />
              </div>
              {editAccount["header-variables"] && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Header Variables</label>
                  {renderHeaderVars(editAccount["header-variables"])}
                </div>
              )}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Account Headers</label>
                  <button type="button" className="text-xs text-blue-600 dark:text-blue-400 hover:underline" onClick={addHeaderRow}>+ Add Header</button>
                </div>
                <div className="space-y-2">
                  {(Array.isArray(editAccount['namespace-account-header']) ? editAccount['namespace-account-header'] : []).map((h: any, idx: number) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
                      <input
                        type="text"
                        placeholder="Key"
                        className="flex-1 min-w-0 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        value={h.key || ''}
                        onChange={e => updateHeaderAtIndex(idx, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        className="flex-1 min-w-0 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        value={h.value || ''}
                        onChange={e => updateHeaderAtIndex(idx, 'value', e.target.value)}
                      />
                      <button type="button" className="text-red-500 dark:text-red-400 px-2 py-1 self-end md:self-auto" onClick={() => removeHeaderRow(idx)}><X size={14} className="md:hidden" /><X size={16} className="hidden md:block" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Account Variables</label>
                  <button type="button" className="text-xs text-blue-600 dark:text-blue-400 hover:underline" onClick={addVariableRow}>+ Add Variable</button>
                </div>
                <div className="space-y-2">
                  {(Array.isArray(editAccount['variables']) ? editAccount['variables'] : (Array.isArray(editAccount['namespace-account-variables']) ? editAccount['namespace-account-variables'] : [])).map((v: any, idx: number) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
                      <input
                        type="text"
                        placeholder="Key"
                        className="flex-1 min-w-0 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        value={v.key || ''}
                        onChange={e => updateVariableAtIndex(idx, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        className="flex-1 min-w-0 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        value={v.value || ''}
                        onChange={e => updateVariableAtIndex(idx, 'value', e.target.value)}
                      />
                      <button type="button" className="text-red-500 dark:text-red-400 px-2 py-1 self-end md:self-auto" onClick={() => removeVariableRow(idx)}><X size={14} className="md:hidden" /><X size={16} className="hidden md:block" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 mt-4 md:mt-6">
              <button
                type="button"
                className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-4 md:px-6 py-2 font-semibold text-sm md:text-base hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 text-white rounded-lg px-4 md:px-6 py-2 font-bold text-sm md:text-base shadow-lg hover:from-blue-600 hover:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700 transition"
              >
                Save
              </button>
            </div>
            {saveMsg && <div className="text-green-600 dark:text-green-400 text-sm mt-2">{saveMsg}</div>}
          </form>
        )}
      </div>
    </div>
  );
} 