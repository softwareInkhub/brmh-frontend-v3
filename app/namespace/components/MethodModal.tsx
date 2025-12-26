"use client"
import React, { useState, useEffect } from 'react';
import { X, Terminal } from 'lucide-react';

interface KeyValuePair {
  key: string;
  value: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

interface Method {
  "namespace-method-id": string;
  "namespace-method-name": string;
  "namespace-method-type": string;
  "namespace-method-url-override"?: string;
  "namespace-method-queryParams": KeyValuePair[];
  "namespace-method-header": KeyValuePair[];
  "save-data": boolean;
  "isInitialized": boolean;
  tags: string[];
  "sample-request"?: Record<string, unknown>;
  "sample-response"?: Record<string, unknown>;
  "request-schema"?: Record<string, unknown>;
  "response-schema"?: Record<string, unknown>;
}

interface MethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  method?: Method | null;
  namespaceId: string;
  refreshNamespaceDetails: () => Promise<void>;
}

const MethodModal: React.FC<MethodModalProps> = ({ isOpen, onClose, method, namespaceId, refreshNamespaceDetails }) => {
  const [form, setForm] = useState<Partial<Method>>({
    "namespace-method-name": '',
    "namespace-method-type": 'GET',
    "namespace-method-url-override": '',
    "namespace-method-queryParams": [],
    "namespace-method-header": [],
    "save-data": false,
    "isInitialized": false,
    tags: [],
    ...method
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      "namespace-method-name": '',
      "namespace-method-type": 'GET',
      "namespace-method-url-override": '',
      "namespace-method-queryParams": [],
      "namespace-method-header": [],
      "save-data": false,
      "isInitialized": false,
      tags: [],
      ...method
    });
  }, [method]);

  const handleSave = async () => {
    if (!form["namespace-method-name"]) {
      setError('Method name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const isEdit = !!form["namespace-method-id"];
      const url = isEdit
        ? `${API_BASE_URL}/unified/methods/${form["namespace-method-id"]}`
        : `${API_BASE_URL}/unified/namespaces/${namespaceId}/methods`;

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
        throw new Error('Failed to save method');
      }

      const savedMethod = await response.json();
      await refreshNamespaceDetails();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save method');
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
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center border-2 border-blue-200 dark:border-blue-800">
              <Terminal className="text-blue-700 dark:text-blue-400" size={18} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {method ? 'Edit Method' : 'Create Method'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors border border-gray-200 dark:border-gray-700"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              Method Name *
            </label>
            <input
              type="text"
              value={form["namespace-method-name"]}
              onChange={e => setForm(f => ({ ...f, "namespace-method-name": e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              Method Type *
            </label>
            <select
              value={form["namespace-method-type"]}
              onChange={e => setForm(f => ({ ...f, "namespace-method-type": e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              URL Override
            </label>
            <input
              type="text"
              value={form["namespace-method-url-override"]}
              onChange={e => setForm(f => ({ ...f, "namespace-method-url-override": e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200">
                Query Parameters
              </label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, "namespace-method-queryParams": [...(f["namespace-method-queryParams"] || []), { key: '', value: '' }] }))}
                className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                + Add Query Parameter
              </button>
            </div>
            <div className="space-y-2">
              {form["namespace-method-queryParams"]?.map((param, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={param.key}
                    onChange={e => {
                      const updated = [...(form["namespace-method-queryParams"] || [])];
                      updated[index] = { ...param, key: e.target.value };
                      setForm(f => ({ ...f, "namespace-method-queryParams": updated }));
                    }}
                    className="flex-1 px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={param.value}
                    onChange={e => {
                      const updated = [...(form["namespace-method-queryParams"] || [])];
                      updated[index] = { ...param, value: e.target.value };
                      setForm(f => ({ ...f, "namespace-method-queryParams": updated }));
                    }}
                    className="flex-1 px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (form["namespace-method-queryParams"] || []).filter((_, i) => i !== index);
                      setForm(f => ({ ...f, "namespace-method-queryParams": updated }));
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
                Headers
              </label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, "namespace-method-header": [...(f["namespace-method-header"] || []), { key: '', value: '' }] }))}
                className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                + Add Header
              </button>
            </div>
            <div className="space-y-2">
              {form["namespace-method-header"]?.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={header.key}
                    onChange={e => {
                      const updated = [...(form["namespace-method-header"] || [])];
                      updated[index] = { ...header, key: e.target.value };
                      setForm(f => ({ ...f, "namespace-method-header": updated }));
                    }}
                    className="flex-1 px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={header.value}
                    onChange={e => {
                      const updated = [...(form["namespace-method-header"] || [])];
                      updated[index] = { ...header, value: e.target.value };
                      setForm(f => ({ ...f, "namespace-method-header": updated }));
                    }}
                    className="flex-1 px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (form["namespace-method-header"] || []).filter((_, i) => i !== index);
                      setForm(f => ({ ...f, "namespace-method-header": updated }));
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

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="save-data"
              checked={form["save-data"]}
              onChange={e => setForm(f => ({ ...f, "save-data": e.target.checked }))}
              className="w-5 h-5 rounded border-2 border-gray-400 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
            />
            <label htmlFor="save-data" className="text-sm font-semibold text-gray-900 dark:text-gray-200">
              Save Data
            </label>
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
            className={`px-5 py-2.5 font-semibold rounded-lg text-white ${method ? 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600' : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'}`}
            disabled={loading}
          >
            {loading ? 'Saving...' : method ? 'Update Method' : 'Create Method'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MethodModal; 