import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';

interface KeyValuePair {
  key: string;
  value: string;
}

interface Account {
  "namespace-account-id": string;
  "namespace-account-name": string;
  "namespace-account-url-override"?: string;
  "namespace-account-header": KeyValuePair[];
  variables: KeyValuePair[];
  tags: string[];
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null;
  namespaceId: string;
  refreshNamespaceDetails: () => Promise<void>;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, account, namespaceId, refreshNamespaceDetails }) => {
  const [form, setForm] = useState<Partial<Account>>({
    "namespace-account-name": '',
    "namespace-account-url-override": '',
    "namespace-account-header": [],
    variables: [],
    tags: [],
    ...account
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  useEffect(() => {
    setForm({
      "namespace-account-name": '',
      "namespace-account-url-override": '',
      "namespace-account-header": [],
      variables: [],
      tags: [],
      ...account
    });
  }, [account]);

  const handleSave = async () => {
    if (!form["namespace-account-name"]) {
      setError('Account name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const isEdit = !!form["namespace-account-id"];
      const url = isEdit
        ? `${API_BASE_URL}/unified/accounts/${form["namespace-account-id"]}`
        : `${API_BASE_URL}/unified/namespaces/${namespaceId}/accounts`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          "namespace-id": namespaceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save account');
      }

      await refreshNamespaceDetails();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-blue-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl border-2 border-gray-300 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <User className="text-blue-600 dark:text-blue-400" size={18} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {account ? 'Edit Account' : 'Create Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors border border-gray-300 dark:border-gray-700"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={form["namespace-account-name"]}
              onChange={e => setForm(f => ({ ...f, "namespace-account-name": e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              URL Override
            </label>
            <input
              type="text"
              value={form["namespace-account-url-override"]}
              onChange={e => setForm(f => ({ ...f, "namespace-account-url-override": e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200">
                Headers
              </label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, "namespace-account-header": [...(f["namespace-account-header"] || []), { key: '', value: '' }] }))}
                className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                + Add Header
              </button>
            </div>
            <div className="space-y-2">
              {form["namespace-account-header"]?.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={header.key}
                    onChange={e => {
                      const updated = [...(form["namespace-account-header"] || [])];
                      updated[index] = { ...header, key: e.target.value };
                      setForm(f => ({ ...f, "namespace-account-header": updated }));
                    }}
                    className="flex-1 px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={header.value}
                    onChange={e => {
                      const updated = [...(form["namespace-account-header"] || [])];
                      updated[index] = { ...header, value: e.target.value };
                      setForm(f => ({ ...f, "namespace-account-header": updated }));
                    }}
                    className="flex-1 px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (form["namespace-account-header"] || []).filter((_, i) => i !== index);
                      setForm(f => ({ ...f, "namespace-account-header": updated }));
                    }}
                    className="px-3 py-2 text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 font-bold text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200">
                Variables
              </label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, variables: [...(f.variables || []), { key: '', value: '' }] }))}
                className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                + Add Variable
              </button>
            </div>
            <div className="space-y-2">
              {form.variables?.map((variable, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={variable.key}
                    onChange={e => {
                      const updated = [...(form.variables || [])];
                      updated[index] = { ...variable, key: e.target.value };
                      setForm(f => ({ ...f, variables: updated }));
                    }}
                    className="flex-1 px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={variable.value}
                    onChange={e => {
                      const updated = [...(form.variables || [])];
                      updated[index] = { ...variable, value: e.target.value };
                      setForm(f => ({ ...f, variables: updated }));
                    }}
                    className="flex-1 px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (form.variables || []).filter((_, i) => i !== index);
                      setForm(f => ({ ...f, variables: updated }));
                    }}
                    className="px-3 py-2 text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 font-bold text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={form.tags?.join(', ')}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) }))}
              className="w-full px-4 py-2.5 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium"
            />
          </div>
        </div>

        {error && <div className="mt-4 p-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg border-2 border-red-200 dark:border-red-800">{error}</div>}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-5 py-2.5 font-semibold rounded-lg text-white ${account ? 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600' : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'}`}
            disabled={loading}
          >
            {loading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountModal; 