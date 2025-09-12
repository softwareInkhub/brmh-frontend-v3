import React, { useEffect, useState } from 'react';
import { User, Hash, Tag, Edit3, CheckCircle, Globe, Key, List, X, Edit2, Trash2, Link as LinkIcon, Database } from 'lucide-react';

type Props = {
  account: any;
  namespace?: any;
  openEdit?: boolean;
};

export default function AccountPage({ account, namespace, openEdit }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [editAccount, setEditAccount] = useState<any>(account || {});
  const [saveMsg, setSaveMsg] = useState('');
  const [tableValidationErrors, setTableValidationErrors] = useState<Record<string, string>>({});
  const [validatingTables, setValidatingTables] = useState<Record<string, boolean>>({});
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [newTableEntry, setNewTableEntry] = useState<{methodName: string, tableName: string}>({methodName: '', tableName: ''});
  const [showAddTableForm, setShowAddTableForm] = useState(false);

  // Auto-open in edit mode when requested
  useEffect(() => {
    if (openEdit) {
      setEditMode(true);
    }
  }, [openEdit]);

  // Fetch available methods for the namespace
  useEffect(() => {
    const fetchMethods = async () => {
      if (editAccount['namespace-id']) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/unified/namespaces/${editAccount['namespace-id']}/methods`
          );
          if (response.ok) {
            const methods = await response.json();
            setAvailableMethods(methods);
          }
        } catch (error) {
          console.error('Failed to fetch methods:', error);
        }
      }
    };

    if (editMode) {
      fetchMethods();
    }
  }, [editMode, editAccount['namespace-id']]);

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

  // Table name editing helpers
  const updateTableName = (methodName: string, newTableName: string) => {
    setEditAccount((prev: any) => {
      console.log('=== UPDATE TABLE NAME DEBUG ===');
      console.log('Method name:', methodName);
      console.log('New table name:', newTableName);
      console.log('Previous account data:', prev);
      
      // Try multiple possible locations for tableName
      let currentTableName = prev.tableName || prev.data?.M?.tableName || {};
      
      // Handle DynamoDB format
      if (currentTableName && currentTableName.M) {
        currentTableName = Object.fromEntries(
          Object.entries(currentTableName.M).map(([key, value]: [string, any]) => [
            key, 
            value.S || value
          ])
        );
      }
      
      const tableNameMap = typeof currentTableName === 'object' ? { ...currentTableName } : {};
      tableNameMap[methodName] = newTableName;
      
      console.log('Updated table name map:', tableNameMap);
      
      // Update the account with the new table name map
      const updatedAccount = {
        ...prev,
        tableName: tableNameMap
      };
      
      console.log('Updated account:', updatedAccount);
      console.log('=== END UPDATE TABLE NAME DEBUG ===');
      
      return updatedAccount;
    });
  };

  const validateTableName = async (tableName: string, methodName: string) => {
    if (!tableName.trim()) {
      setTableValidationErrors(prev => ({ ...prev, [methodName]: '' }));
      return;
    }

    setValidatingTables(prev => ({ ...prev, [methodName]: true }));
    setTableValidationErrors(prev => ({ ...prev, [methodName]: '' }));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/unified/validate-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: tableName.trim() })
      });

      const result = await response.json();
      
      if (response.ok && result.exists) {
        setTableValidationErrors(prev => ({ ...prev, [methodName]: '' }));
      } else {
        setTableValidationErrors(prev => ({ 
          ...prev, 
          [methodName]: result.error || 'Table does not exist in DynamoDB' 
        }));
      }
    } catch (error) {
      setTableValidationErrors(prev => ({ 
        ...prev, 
        [methodName]: 'Failed to validate table name' 
      }));
    } finally {
      setValidatingTables(prev => ({ ...prev, [methodName]: false }));
    }
  };

  // Helper functions for new table entries
  const addNewTableEntry = () => {
    if (!newTableEntry.methodName || !newTableEntry.tableName) {
      return;
    }

    console.log('=== ADD NEW TABLE ENTRY DEBUG ===');
    console.log('New table entry:', newTableEntry);

    setEditAccount((prev: any) => {
      // Try multiple possible locations for tableName
      let currentTableName = prev.tableName || prev.data?.M?.tableName || {};
      
      // Handle DynamoDB format
      if (currentTableName && currentTableName.M) {
        currentTableName = Object.fromEntries(
          Object.entries(currentTableName.M).map(([key, value]: [string, any]) => [
            key, 
            value.S || value
          ])
        );
      }
      
      const tableNameMap = typeof currentTableName === 'object' ? { ...currentTableName } : {};
      tableNameMap[newTableEntry.methodName] = newTableEntry.tableName;
      
      console.log('Updated table name map:', tableNameMap);
      
      // Update the account with the new table name map
      const updatedAccount = {
        ...prev,
        tableName: tableNameMap
      };
      
      console.log('Updated account:', updatedAccount);
      console.log('=== END ADD NEW TABLE ENTRY DEBUG ===');
      
      return updatedAccount;
    });

    // Reset form
    setNewTableEntry({ methodName: '', tableName: '' });
    setShowAddTableForm(false);
  };

  const removeTableEntry = (methodName: string) => {
    setEditAccount((prev: any) => {
      // Try multiple possible locations for tableName
      let currentTableName = prev.tableName || prev.data?.M?.tableName || {};
      
      // Handle DynamoDB format
      if (currentTableName && currentTableName.M) {
        currentTableName = Object.fromEntries(
          Object.entries(currentTableName.M).map(([key, value]: [string, any]) => [
            key, 
            value.S || value
          ])
        );
      }
      
      const tableNameMap = typeof currentTableName === 'object' ? { ...currentTableName } : {};
      delete tableNameMap[methodName];
      
      return {
        ...prev,
        tableName: tableNameMap
      };
    });

    // Clear validation errors for removed entry
    setTableValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[methodName];
      return newErrors;
    });
  };

  const getAvailableMethodsForSelection = () => {
    let currentTableName = editAccount.tableName || editAccount.data?.M?.tableName || {};
    
    // Handle DynamoDB format
    if (currentTableName && currentTableName.M) {
      currentTableName = Object.fromEntries(
        Object.entries(currentTableName.M).map(([key, value]: [string, any]) => [
          key, 
          value.S || value
        ])
      );
    }
    
    const tableNameMap = typeof currentTableName === 'object' ? currentTableName : {};
    const existingMethodNames = Object.keys(tableNameMap);
    
    return availableMethods.filter(method => 
      !existingMethodNames.includes(method['namespace-method-name'])
    );
  };


  const handleInput = (field: string, value: any) => {
    setEditAccount((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg('');

    // Check if there are any table validation errors
    const hasValidationErrors = Object.values(tableValidationErrors).some(error => error !== '');
    if (hasValidationErrors) {
      setSaveMsg('Please fix table validation errors before saving.');
      return;
    }

    // Check if any tables are still being validated
    const isStillValidating = Object.values(validatingTables).some(validating => validating);
    if (isStillValidating) {
      setSaveMsg('Please wait for table validation to complete.');
      return;
    }

    // Check if there's an incomplete new table entry
    if (showAddTableForm && (newTableEntry.methodName || newTableEntry.tableName)) {
      setSaveMsg('Please complete or cancel the new table entry before saving.');
      return;
    }

    try {
      console.log('=== SAVE ACCOUNT DEBUG ===');
      console.log('Account data being saved:', editAccount);
      console.log('Table names in account:', editAccount.tableName);
      console.log('Account ID:', editAccount['namespace-account-id']);
      console.log('Account name:', editAccount['namespace-account-name']);
      console.log('Full JSON being sent:', JSON.stringify(editAccount, null, 2));
      console.log('=== END SAVE ACCOUNT DEBUG ===');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/unified/accounts/${editAccount['namespace-account-id']}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editAccount)
        }
      );

      if (response.ok) {
        setSaveMsg('Account updated successfully!');
        setEditMode(false);
        // Clear validation errors and form state
        setTableValidationErrors({});
        setValidatingTables({});
        setShowAddTableForm(false);
        setNewTableEntry({ methodName: '', tableName: '' });
      } else {
        const errorData = await response.json();
        setSaveMsg(`Failed to update account: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      setSaveMsg('Failed to update account. Please try again.');
      console.error('Save error:', error);
    }
  };

  // Helper to render header variables if present
  const renderHeaderVars = (headers: any) => {
    if (!headers || typeof headers !== 'object') return <span className="italic text-gray-400">None</span>;
  return (
      <ul className="space-y-1 mt-1">
        {Object.entries(headers).map(([key, value]) => (
          <li key={key} className="flex items-center gap-2 text-xs">
            <Key size={14} className="text-blue-400" />
            <span className="font-mono text-gray-700">{key}</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded ml-2">{String(value)}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Helper to render account variables if present
  const renderAccountVars = (variables: any) => {
    if (!variables || !Array.isArray(variables) || variables.length === 0) return <span className="italic text-gray-400">None</span>;
    return (
      <ul className="space-y-1 mt-1">
        {variables.map((variable: any, index: number) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            <Key size={14} className="text-green-400" />
            <span className="font-mono text-gray-700">{variable.key}</span>
            <span className="bg-green-100 text-gray-700 px-2 py-0.5 rounded ml-2">{String(variable.value)}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Helper to render table names if present
  const renderTableNames = (tableName: any, isEditMode: boolean = false) => {
    // Handle DynamoDB structure
    let tableNameMap: Record<string, string> = {};
    if (tableName && tableName.M) {
      // Extract from DynamoDB format
      tableNameMap = Object.fromEntries(
        Object.entries(tableName.M).map(([key, value]: [string, any]) => [
          key, 
          value.S || value
        ])
      );
    } else if (tableName && typeof tableName === 'object') {
      // Handle plain object format
      tableNameMap = tableName;
    }
    
    const hasTables = Object.keys(tableNameMap).length > 0;
    const availableMethods = getAvailableMethodsForSelection();
    
    return (
      <div className="space-y-2 mt-1">
        {hasTables ? (
          Object.entries(tableNameMap).map(([methodName, tableNameValue]) => (
            <div key={methodName} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Database size={14} className="text-blue-400" />
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-700">{methodName}</div>
                {isEditMode ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className={`text-xs font-mono border rounded px-2 py-1 flex-1 ${
                          tableValidationErrors[methodName] 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300 bg-white'
                        }`}
                        value={tableNameValue || ''}
                        onChange={(e) => updateTableName(methodName, e.target.value)}
                        onBlur={(e) => validateTableName(e.target.value, methodName)}
                        placeholder="Enter table name"
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 p-1"
                        onClick={() => removeTableEntry(methodName)}
                        title="Remove table entry"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {validatingTables[methodName] && (
                      <div className="text-xs text-blue-600">Validating...</div>
                    )}
                    {tableValidationErrors[methodName] && (
                      <div className="text-xs text-red-600">{tableValidationErrors[methodName]}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 font-mono">{tableNameValue}</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-400 italic">No tables configured</div>
        )}
        
        {isEditMode && (
          <div className="border-t pt-2">
            {!showAddTableForm ? (
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                onClick={() => setShowAddTableForm(true)}
                disabled={availableMethods.length === 0}
              >
                <Database size={12} />
                + Add Table Entry
                {availableMethods.length === 0 && (
                  <span className="text-gray-400">(No methods available)</span>
                )}
              </button>
            ) : (
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-medium text-blue-700 mb-2">Add New Table Entry</div>
                <div className="space-y-2">
                  <select
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    value={newTableEntry.methodName}
                    onChange={(e) => setNewTableEntry(prev => ({ ...prev, methodName: e.target.value }))}
                  >
                    <option value="">Select Method</option>
                    {availableMethods.map((method) => (
                      <option key={method['namespace-method-id']} value={method['namespace-method-name']}>
                        {method['namespace-method-name']}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    placeholder="Enter table name"
                    value={newTableEntry.tableName}
                    onChange={(e) => setNewTableEntry(prev => ({ ...prev, tableName: e.target.value }))}
                    onBlur={(e) => {
                      if (newTableEntry.methodName && e.target.value) {
                        validateTableName(e.target.value, newTableEntry.methodName);
                      }
                    }}
                  />
                  {newTableEntry.methodName && tableValidationErrors[newTableEntry.methodName] && (
                    <div className="text-xs text-red-600">{tableValidationErrors[newTableEntry.methodName]}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      onClick={addNewTableEntry}
                      disabled={!newTableEntry.methodName || !newTableEntry.tableName || !!tableValidationErrors[newTableEntry.methodName]}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                      onClick={() => {
                        setShowAddTableForm(false);
                        setNewTableEntry({ methodName: '', tableName: '' });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper to render account headers if present
  const renderAccountHeaders = (headers: any) => {
    if (!headers || !Array.isArray(headers) || headers.length === 0) return <span className="italic text-gray-400">None</span>;
    return (
      <ul className="space-y-1 mt-1">
        {headers.map((header: any, index: number) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            <Key size={14} className="text-purple-400" />
            <span className="font-mono text-gray-700">{header.key}</span>
            <span className="bg-purple-100 text-gray-700 px-2 py-0.5 rounded ml-2">{String(header.value)}</span>
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
        // Optionally: close tab or show a message
        alert('Account deleted!');
        // window.location.reload();
      } catch (error) {
        alert('Failed to delete account');
      }
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br flex flex-col h-full p-0 m-0">
      <div className="bg-white p-8 flex flex-col gap-6 w-full h-full m-0">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-2">
         
          <button
            title="Link"
            className="p-2 rounded-lg bg-gray-100 text-blue-700 hover:bg-blue-50 transition-colors"
            onClick={() => handleOAuthRedirect(editAccount)}
          >
            <LinkIcon size={18} />
          </button>
          <button
            title="Edit"
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={() => setEditMode(true)}
          >
            <Edit2 size={18} />
          </button>
          <button
            title="Delete"
            className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            onClick={handleDelete}
          >
            <Trash2 size={18} />
          </button>
        </div>
        {!editMode ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <User className="text-blue-500" size={28} />
              <h2 className="text-2xl font-bold text-blue-700 tracking-tight">Account Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><User size={16} className="text-blue-400" /> Name</div>
                <div className="text-lg font-semibold text-gray-900">{editAccount["namespace-account-name"] || ''}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Hash size={16} className="text-purple-400" /> ID</div>
                <div className="text-base font-mono text-gray-700">{editAccount["namespace-account-id"] || ''}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Globe size={16} className="text-green-400" /> Namespace ID</div>
                <div className="text-base font-mono text-gray-700">{editAccount["namespace-id"] || (namespace && namespace["namespace-id"]) || <span className="italic text-gray-400">None</span>}</div>
              </div>
              {editAccount["namespace-account-url-override"] && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Globe size={16} className="text-pink-400" /> URL Override</div>
                  <div className="text-base text-gray-700">{editAccount["namespace-account-url-override"]}</div>
                </div>
              )}
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Tag size={16} className="text-yellow-400" /> Tags</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(editAccount.tags) && editAccount.tags.length > 0 ? (
                    editAccount.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-semibold shadow">{tag}</span>
                    ))
                  ) : (
                    <span className="italic text-gray-400">No tags</span>
                  )}
                </div>
              </div>
              {editAccount["header-variables"] && (
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><List size={16} className="text-blue-400" /> Header Variables</div>
                  {renderHeaderVars(editAccount["header-variables"])}
                </div>
              )}
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Key size={16} className="text-purple-400" /> Account Headers</div>
                {renderAccountHeaders(editAccount["namespace-account-header"])}
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Key size={16} className="text-green-400" /> Account Variables</div>
                {renderAccountVars(editAccount["variables"] || editAccount["namespace-account-variables"])}
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Database size={16} className="text-blue-400" /> Tables</div>
                {renderTableNames(editAccount.data?.M?.tableName || editAccount.tableName, false)}
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 mt-2">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-green-700 font-semibold">Active</span>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <Edit3 className="text-blue-500" size={24} />
              <h2 className="text-xl font-bold text-blue-700 tracking-tight">Edit Account</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none bg-blue-50 placeholder-gray-400"
                  value={editAccount["namespace-account-name"] || ''}
                  onChange={e => handleInput("namespace-account-name", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ID</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base bg-gray-100"
                  value={editAccount["namespace-account-id"] || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Namespace ID</label>
                <input
                  type="text"
                  className="w-full border border-green-200 rounded-lg px-3 py-2 text-base bg-green-50"
                  value={editAccount["namespace-id"] || (namespace && namespace["namespace-id"]) || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL Override</label>
                <input
                  type="text"
                  className="w-full border border-pink-200 rounded-lg px-3 py-2 text-base bg-pink-50"
                  value={editAccount["namespace-account-url-override"] || ''}
                  readOnly
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition outline-none bg-yellow-50 placeholder-gray-400"
                  value={Array.isArray(editAccount.tags) ? editAccount.tags.join(', ') : ''}
                  onChange={e => handleInput('tags', e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean))}
                />
              </div>
              {editAccount["header-variables"] && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Header Variables</label>
                  {renderHeaderVars(editAccount["header-variables"])}
                </div>
              )}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Account Headers</label>
                  <button type="button" className="text-xs text-blue-600 hover:underline" onClick={addHeaderRow}>+ Add Header</button>
                </div>
                <div className="space-y-2">
                  {(Array.isArray(editAccount['namespace-account-header']) ? editAccount['namespace-account-header'] : []).map((h: any, idx: number) => (
                    <div key={idx} className="flex flex-wrap gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Key"
                        className="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1 text-sm"
                        value={h.key || ''}
                        onChange={e => updateHeaderAtIndex(idx, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        className="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1 text-sm"
                        value={h.value || ''}
                        onChange={e => updateHeaderAtIndex(idx, 'value', e.target.value)}
                      />
                      <button type="button" className="text-red-500 px-2" onClick={() => removeHeaderRow(idx)}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Account Variables</label>
                  <button type="button" className="text-xs text-blue-600 hover:underline" onClick={addVariableRow}>+ Add Variable</button>
                </div>
                <div className="space-y-2">
                  {(Array.isArray(editAccount['variables']) ? editAccount['variables'] : (Array.isArray(editAccount['namespace-account-variables']) ? editAccount['namespace-account-variables'] : [])).map((v: any, idx: number) => (
                    <div key={idx} className="flex flex-wrap gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Key"
                        className="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1 text-sm"
                        value={v.key || ''}
                        onChange={e => updateVariableAtIndex(idx, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        className="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1 text-sm"
                        value={v.value || ''}
                        onChange={e => updateVariableAtIndex(idx, 'value', e.target.value)}
                      />
                      <button type="button" className="text-red-500 px-2" onClick={() => removeVariableRow(idx)}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Table Names</label>
                  <span className="text-xs text-gray-500">Edit table names for each method</span>
                </div>
                {renderTableNames(editAccount.data?.M?.tableName || editAccount.tableName, true)}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                className="bg-gray-200 text-gray-700 rounded-lg px-6 py-2 font-semibold text-base hover:bg-gray-300 transition"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg px-6 py-2 font-bold text-base shadow-lg hover:from-blue-600 hover:to-purple-600 transition"
              >
                Save
              </button>
            </div>
            {saveMsg && <div className="text-green-600 text-sm mt-2">{saveMsg}</div>}
          </form>
        )}
      </div>
    </div>
  );
} 