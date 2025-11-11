"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Database, RefreshCw, ChevronDown, ChevronRight, Search, Code, Table, Grid, List as ListIcon, Users, Terminal, X, Info, UserPlus, FilePlus, Globe, User, Edit2, Key, MoreVertical, Zap } from "react-feather";
import { FileCode } from 'lucide-react';
import UnifiedSchemaModal from '../Modals/UnifiedSchemaModal';
import MethodTestModal from '@/app/components/MethodTestModal';
import SchemaPreviewModal from '../Modals/SchemaPreviewModal';

import CreateDataModal from '../Modals/CreateDataModal';
import NamespaceModal from '../Modals/NamespaceModal';
import { useSidePanel } from "@/app/components/SidePanelContext";
import { useAIAgent } from "@/app/components/AIAgentContext";
import { toast } from 'react-hot-toast';

// --- Types ---
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

interface UnifiedNamespace {
  "namespace-id": string;
  "namespace-name": string;
  "namespace-url": string;
  "icon-url"?: string;
  tags?: string[];
}

interface UnifiedSchema {
  id: string;
  schemaName: string;
  schema: any;
  isArray?: boolean;
  originalType?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// --- MethodPreviewModal ---
interface MethodPreviewModalProps {
  method: Method;
  onClose: () => void;
  onEdit: (method: Method) => void;
  onDelete: (method: Method) => void;
  onTest: (method: Method) => void;
  onTable?: (method: Method, tableName: string) => Promise<void>;
}

const MethodPreviewModal: React.FC<MethodPreviewModalProps> = ({ method, onClose, onEdit, onDelete, onTest, onTable }) => {
  const [showWebhookForm, setShowWebhookForm] = React.useState(false);
  const [webhookRoute, setWebhookRoute] = React.useState('');
  const [webhookTable, setWebhookTable] = React.useState('');
  const [webhookLoading, setWebhookLoading] = React.useState(false);
  const [webhookError, setWebhookError] = React.useState('');

  const handleAddWebhook = () => {
    setWebhookLoading(true);
    setTimeout(() => {
      setWebhookLoading(false);
      setShowWebhookForm(false);
      setWebhookRoute('');
      setWebhookTable('');
    }, 1000);
  };

  return (
    <div 
      className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full mr-2 ${
              method["namespace-method-type"] === 'GET' ? 'bg-green-100 text-green-700' :
              method["namespace-method-type"] === 'POST' ? 'bg-blue-100 text-blue-700' :
              method["namespace-method-type"] === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
              method["namespace-method-type"] === 'DELETE' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {method["namespace-method-type"]}
            </span>
            <h2 className="text-lg font-semibold text-gray-900">{method["namespace-method-name"]}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {/* ID and URL Override */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">ID</div>
            <div className="text-xs font-mono break-all">{method["namespace-method-id"]}</div>
          </div>
          {method["namespace-method-url-override"] && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">URL Override</div>
              <div className="text-xs font-mono break-all">{method["namespace-method-url-override"]}</div>
            </div>
          )}
        </div>
        {/* Query Parameters */}
        {method["namespace-method-queryParams"] && method["namespace-method-queryParams"].length > 0 && (
          <div className="mb-2">
            <div className="text-sm font-medium text-gray-700 mb-1">Query Parameters</div>
            <div className="flex flex-wrap gap-2">
              {method["namespace-method-queryParams"].map((param, idx) => (
                <div key={`${method["namespace-method-id"]}-param-${param.key}-${idx}`} className="bg-gray-50 rounded-lg px-4 py-2 flex gap-6 min-w-[120px]">
                  <span className="text-xs font-medium text-gray-700">{param.key}</span>
                  <span className="text-xs text-gray-500">{param.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Tags */}
        {method.tags && method.tags.length > 0 && (
          <div className="mb-2">
            <div className="text-sm font-medium text-gray-700 mb-1">Tags</div>
            <div className="flex flex-wrap gap-2">
              {method.tags.map((tag, idx) => (
                <span key={`${method["namespace-method-id"]}-detail-tag-${tag}-${idx}`} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">{tag}</span>
              ))}
            </div>
          </div>
        )}
        {/* Save Data */}
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v4" /></svg>
            Save Data:
          </span>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${method["save-data"] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{method["save-data"] ? 'Yes' : 'No'}</span>
        </div>
        <hr className="my-4" />
        {/* Webhooks Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">Webhooks</span>
            {!showWebhookForm ? (
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                onClick={() => setShowWebhookForm(true)}
              >
                <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V4a2 2 0 1 0-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" /></svg>
                Register Webhook
              </button>
            ) : (
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                onClick={() => setShowWebhookForm(false)}
              >
                <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V4a2 2 0 1 0-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" /></svg>
                Cancel
              </button>
            )}
          </div>
          {showWebhookForm ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route *</label>
                  <input
                    type="text"
                    value={webhookRoute}
                    onChange={e => setWebhookRoute(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter webhook route"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table Name *</label>
                  <input
                    type="text"
                    value={webhookTable}
                    onChange={e => setWebhookTable(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter table name"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddWebhook}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    disabled={webhookLoading}
                  >
                    Add Webhook
                  </button>
                </div>
              </div>
              {webhookError && <div className="text-red-500 text-xs mt-2">{webhookError}</div>}
            </div>
          ) : null}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">No webhooks registered for this method.</div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            title="Test Method"
            className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            onClick={() => onTest(method)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" /></svg>
          </button>
          <button title="Initialize Table" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
            <Database size={18} />
          </button>
          <button title="Edit Method" onClick={() => { onEdit(method); onClose(); }} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Edit2 size={18} />
          </button>
          <button title="Delete Method" onClick={() => { onDelete(method); onClose(); }} className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Move handleOAuthRedirect above the component so it is in scope
function handleOAuthRedirect(
  account: Account,
  selectedNamespace: UnifiedNamespace | null,
  API_BASE_URL: string,
  fetchNamespaceDetails: (id: string) => void
) {
  const variables = account.variables || [];
  const clientId = variables.find((v: KeyValuePair) => v.key === 'client_id')?.value;
  const clientSecret = variables.find((v: KeyValuePair) => v.key === 'secret_key')?.value;
  const redirectUrl = variables.find((v: KeyValuePair) => v.key === 'redirect_uri')?.value;
  if (!clientId || !redirectUrl || !clientSecret) {
    alert('Missing client_id, secret_key, or redirect_uri in account variables');
    return;
  }
  const scopes = ['boards:read', 'boards:write', 'pins:read', 'pins:write'];
  const authUrl = new URL('https://www.pinterest.com/oauth/');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUrl);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes.join(','));
  sessionStorage.setItem('pinterestAccountDetails', JSON.stringify({ clientId, clientSecret, redirectUrl, accountId: account['namespace-account-id'], selectedNamespaceId: selectedNamespace?.['namespace-id'] }));
  window.location.href = authUrl.toString();
}

// Add at the top, after imports
export type UnifiedNamespaceModalType = 'namespace' | 'schema' | 'account' | 'method';
export interface UnifiedNamespaceModalTrigger {
  type: UnifiedNamespaceModalType;
  data: any;
}

// In the component props
export interface UnifiedNamespaceProps {
  externalModalTrigger?: UnifiedNamespaceModalTrigger | null;
  onModalClose?: () => void;
  fetchNamespaceDetails: (namespaceId: string) => Promise<void>;
  namespaceDetailsMap: Record<string, { accounts: any[]; methods: any[] }>;
  setNamespaceDetailsMap: React.Dispatch<React.SetStateAction<Record<string, { accounts: any[]; methods: any[] }>>>;
  refreshData: () => void;
  onViewAccount?: (account: any, ns?: any) => void;
  onViewMethod?: (method: any, ns?: any) => void;
  onViewSchema?: (schema: any, ns?: any) => void;
  onOpenNamespaceTab?: (namespace: any) => void;
  onAddItem?: (type: string, parentData?: any) => void;
}

const UnifiedNamespace: React.FC<UnifiedNamespaceProps> = ({ externalModalTrigger, onModalClose, fetchNamespaceDetails, namespaceDetailsMap, setNamespaceDetailsMap, refreshData, onViewAccount, onViewMethod, onViewSchema, onOpenNamespaceTab, onAddItem }) => {
  const { isCollapsed } = useSidePanel();
  const { panelWidth, isOpen: aiAgentIsOpen } = useAIAgent();
  
  // State for responsive behavior
  const [shouldHideActionButtons, setShouldHideActionButtons] = useState(false);
  
  // Calculate available width for namespace cards
  useEffect(() => {
    const calculateAvailableWidth = () => {
      const availableWidth = aiAgentIsOpen 
        ? window.innerWidth - panelWidth - (isCollapsed ? 80 : 336) 
        : window.innerWidth - (isCollapsed ? 80 : 336);
      setShouldHideActionButtons(availableWidth < 1200);
    };
    
    calculateAvailableWidth();
    window.addEventListener('resize', calculateAvailableWidth);
    
    return () => window.removeEventListener('resize', calculateAvailableWidth);
  }, [aiAgentIsOpen, panelWidth, isCollapsed]);
  
  // --- State ---
  const [namespaces, setNamespaces] = useState<UnifiedNamespace[]>([]);
  const [schemas, setSchemas] = useState<UnifiedSchema[]>([]);
  const [loading, setLoading] = useState({ namespaces: false, schemas: false });
  const [error, setError] = useState<{ namespaces: string | null; schemas: string | null }>({ namespaces: null, schemas: null });
  const [search, setSearch] = useState({ text: '', type: 'all' as 'all' | 'namespace' | 'schema' });
  const [showModal, setShowModal] = useState<{ type: 'namespace' | 'schema' | null; data: any }>({ type: null, data: null });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandedNamespace, setExpandedNamespace] = useState<string | null>(null);
  const [namespaceDetails, setNamespaceDetails] = useState<{ accounts: Account[]; methods: Method[] }>({ accounts: [], methods: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNamespace, setSelectedNamespace] = useState<UnifiedNamespace | null>(null);
  const [selectedNamespaceId, setSelectedNamespaceId] = useState<string | null>(null);
  const [floatingNamespaceDetails, setFloatingNamespaceDetails] = useState<UnifiedNamespace | null>(null);
  const [showFloatingDetails, setShowFloatingDetails] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    accounts: false,
    methods: false,
    schemas: false,
    webhooks: false,
    lambdas: false
  });
  const [panelHeight, setPanelHeight] = useState(60); // Height as percentage of viewport
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragAnimationFrame, setDragAnimationFrame] = useState<number | null>(null);
  const [isPanelAnimating, setIsPanelAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [panelTopPosition, setPanelTopPosition] = useState(100); // Panel top position in pixels
  const [showUnifiedSchemaModal, setShowUnifiedSchemaModal] = useState(false);
  const [expandedNamespaceId, setExpandedNamespaceId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // --- Form State ---
  const [namespaceForm, setNamespaceForm] = useState({
    "namespace-name": '',
    "namespace-url": '',
    tags: [] as string[],
  });

  const [schemaForm, setSchemaForm] = useState({
    schemaName: '',
    schema: {},
    isArray: false,
    originalType: 'object',
  });
  const [jsonSchema, setJsonSchema] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Add modal state for account
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState<{
    "namespace-account-name": string;
    "namespace-account-url-override": string;
    tags: string[];
    "namespace-account-header": any[];
    variables: any[];
  }>({
    "namespace-account-name": '',
    "namespace-account-url-override": '',
    tags: [],
    "namespace-account-header": [],
    variables: [],
  });
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');

  // Add modal state for method
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [methodForm, setMethodForm] = useState<{
    "namespace-method-name": string;
    "namespace-method-type": string;
    "namespace-method-url-override": string;
    tags: string[];
    "namespace-method-queryParams": any[];
    "namespace-method-header": any[];
    "save-data": boolean;
    "isInitialized": boolean;
    "sample-request": string;
    "sample-response": string;
    "request-schema": string;
    "response-schema": string;
  }>(
    {
      "namespace-method-name": '',
      "namespace-method-type": 'GET',
      "namespace-method-url-override": '',
      tags: [],
      "namespace-method-queryParams": [],
      "namespace-method-header": [],
      "save-data": false,
      "isInitialized": false,
      "sample-request": '',
      "sample-response": '',
      "request-schema": '',
      "response-schema": '',
    }
  );
  const [methodLoading, setMethodLoading] = useState(false);
  const [methodError, setMethodError] = useState('');



  // Add state for proper NamespaceModal
  const [showNamespaceModal, setShowNamespaceModal] = useState(false);
  const [editingNamespace, setEditingNamespace] = useState<any>(null);

  // Add state for MethodTestModal
  const [isMethodTestModalOpen, setIsMethodTestModalOpen] = useState(false);
  const [testingMethod, setTestingMethod] = useState<Method | null>(null);

  // Schema preview and actions state
  const [previewSchema, setPreviewSchema] = useState<any | null>(null);
  const [showTableNameModal, setShowTableNameModal] = useState(false);
  const [pendingTableSchema, setPendingTableSchema] = useState<any>(null);
  const [tableNameInput, setTableNameInput] = useState('');
  const [tableNameError, setTableNameError] = useState('');
  const [showDataModal, setShowDataModal] = useState(false);
  const [dataFormSchema, setDataFormSchema] = useState<any>(null);
  const [dataForm, setDataForm] = useState<any>({});
  const [dataTableName, setDataTableName] = useState('');
  const [tableMetaStatusById, setTableMetaStatusById] = useState<{ [metaId: string]: string }>({});

  // Add state for schema modal namespace context
  const [schemaModalNamespace, setSchemaModalNamespace] = useState<any>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [namespaceToDelete, setNamespaceToDelete] = useState<UnifiedNamespace | null>(null);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading({ namespaces: true, schemas: true });
    setError({ namespaces: null, schemas: null });

    // Fetch namespaces
    try {
      const nsRes = await fetch(`${API_BASE_URL}/unified/namespaces`);
      if (!nsRes.ok) throw new Error('Failed to fetch namespaces');
      const nsData = await nsRes.json();
      setNamespaces(nsData);
    } catch (err: any) {
      setError(prev => ({ ...prev, namespaces: err.message || 'Failed to fetch namespaces' }));
      setNamespaces([]);
    } finally {
      setLoading(prev => ({ ...prev, namespaces: false }));
    }

    // Fetch schemas
    try {
      const schemaRes = await fetch(`${API_BASE_URL}/unified/schema`);
      if (!schemaRes.ok) throw new Error('Failed to fetch schemas');
      const schemaData = await schemaRes.json();
      setSchemas(Array.isArray(schemaData) ? schemaData : []);
    } catch (err: any) {
      setError(prev => ({ ...prev, schemas: err.message || 'Failed to fetch schemas' }));
      setSchemas([]);
    } finally {
      setLoading(prev => ({ ...prev, schemas: false }));
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Control body scroll when floating panel is open
  useEffect(() => {
    if (showFloatingDetails) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // Restore normal scrolling
      document.body.style.overflow = '';
    }

    // Cleanup function to ensure overflow is reset when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFloatingDetails]);

  useEffect(() => {
    const handler = () => { fetchData(); };
    window.addEventListener('refresh-unified-namespace', handler);
    return () => window.removeEventListener('refresh-unified-namespace', handler);
  }, [fetchData]);

  // Calculate panel top position on window resize
  useEffect(() => {
    const calculatePanelTop = () => {
      if (typeof window !== 'undefined' && showFloatingDetails) {
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
  }, [showFloatingDetails]);

  // --- Handlers ---
  const handleNamespaceSave = async (namespaceData: any) => {
    try {
      const isEdit = !!editingNamespace;
      const url = isEdit
        ? `${API_BASE_URL}/unified/namespaces/${editingNamespace["namespace-id"]}`
        : `${API_BASE_URL}/unified/namespaces`;
      const method = isEdit ? 'PUT' : 'POST';
      
      // Check if it's FormData (has icon) or regular object
      const isFormData = namespaceData instanceof FormData;
      
      const headers: Record<string, string> = {};
      let body: string | FormData;
      
      if (isFormData) {
        body = namespaceData;
        // Don't set Content-Type header for FormData, let browser set it with boundary
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          "namespace-name": namespaceData["namespace-name"],
          "namespace-url": namespaceData["namespace-url"],
          "tags": namespaceData.tags || []
        });
      }

      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error('Failed to save namespace');
      }

      setShowNamespaceModal(false);
      setEditingNamespace(null);
      fetchData();
      toast.success(isEdit ? 'Namespace updated successfully!' : 'Namespace created successfully!');
    } catch (error: any) {
      console.error('Error saving namespace:', error);
      toast.error(error.message || 'Failed to save namespace');
    }
  };

  const handleSchemaSave = async () => {
    try {
      if (!schemaForm.schemaName) {
        setError(prev => ({ ...prev, schemas: 'Schema name is required' }));
        return;
      }

      let parsedSchema;
      try {
        parsedSchema = JSON.parse(jsonSchema);
        setJsonError(null);
      } catch {
        setJsonError('Invalid JSON');
        return;
      }

      const method = showModal.data ? 'PUT' : 'POST';
      const url = showModal.data
        ? `${API_BASE_URL}/unified/schema/${showModal.data.id}`
        : `${API_BASE_URL}/unified/schema`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...schemaForm, schema: parsedSchema }),
      });

      if (!res.ok) throw new Error('Failed to save schema');
      setShowModal({ type: null, data: null });
      setSchemaForm({ schemaName: '', schema: {}, isArray: false, originalType: 'object' });
      setJsonSchema('{}');
      fetchData();
    } catch (err: any) {
      setError(prev => ({ ...prev, schemas: err.message }));
    }
  };

  const handleDelete = async (type: 'namespace' | 'schema', id: string) => {
    if (type === 'namespace') {
      // For namespace deletion, use the modal
      const namespace = namespaces.find(ns => ns["namespace-id"] === id);
      if (namespace) {
        setNamespaceToDelete(namespace);
        setShowDeleteModal(true);
        setDeleteConfirmText('');
      }
      return;
    }
    
    // For schema deletion, keep the simple confirm
    if (!window.confirm(`Delete this ${type}?`)) return;
    try {
      const url = `${API_BASE_URL}/unified/schema/${id}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete ${type}`);
      fetchData();
    } catch (err: any) {
      setError(prev => ({ ...prev, [type + 's']: err.message }));
    }
  };

  const deleteNamespace = async () => {
    // Validate confirmation text
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    if (!namespaceToDelete) return;

    try {
      setIsDeleting(true);
      
      const res = await fetch(`${API_BASE_URL}/unified/namespaces/${namespaceToDelete["namespace-id"]}`, {
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
          // Silent error - use text fallback
        }
        
        const successMessage = `✅ Namespace deleted successfully!\n\n` +
          `Deleted:\n` +
          `• ${result?.deletedCounts?.accounts || 0} accounts\n` +
          `• ${result?.deletedCounts?.methods || 0} methods\n` +
          `• ${result?.deletedCounts?.schemas || 0} schemas`;
        
        alert(successMessage);
        setShowDeleteModal(false);
        setDeleteConfirmText('');
        setNamespaceToDelete(null);
        setIsDeleting(false);
        fetchData(); // Refresh the data
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

  const handleValidateSchema = async () => {
    setIsValidating(true);
    setValidationResult(null);
    try {
      let parsedSchema;
      try {
        parsedSchema = JSON.parse(jsonSchema);
        setJsonError(null);
      } catch {
        setJsonError('Invalid JSON');
        setIsValidating(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/unified/schema/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema: parsedSchema }),
      });

      const result = await res.json();
      setValidationResult(result);
    } catch (err: any) {
      setValidationResult({ error: err.message });
    } finally {
      setIsValidating(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNamespaceClick = async (ns: UnifiedNamespace) => {
    // Set floating namespace details
    setFloatingNamespaceDetails(ns);
    setSelectedNamespaceId(ns["namespace-id"]);
    setSelectedNamespace(ns);
    
    // Calculate panel top position from namespace tab bar
    if (typeof window !== 'undefined') {
      const tabBar = document.querySelector('.namespace-tab-bar');
      if (tabBar) {
        const rect = tabBar.getBoundingClientRect();
        setPanelTopPosition(rect.bottom);
      }
    }
    
    // Start opening animation
    setIsPanelAnimating(true);
    setShowFloatingDetails(true);
    
    // Show content after panel animation starts
    setTimeout(() => {
      setShowContent(true);
    }, 200);
    
    // Load namespace details if not already loaded
    if (!namespaceDetailsMap[ns["namespace-id"]]) {
      setLoadingDetails(true);
      try {
        const [accountsRes, methodsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/unified/namespaces/${ns["namespace-id"]}/accounts`),
          fetch(`${API_BASE_URL}/unified/namespaces/${ns["namespace-id"]}/methods`)
        ]);
        const [accountsData, methodsData] = await Promise.all([
          accountsRes.json(),
          methodsRes.json()
        ]);
        
        // Ensure accounts and methods are always arrays
        const accounts = Array.isArray(accountsData) ? accountsData : 
                        (accountsData?.body && Array.isArray(accountsData.body)) ? accountsData.body : [];
        const methods = Array.isArray(methodsData) ? methodsData : 
                       (methodsData?.body && Array.isArray(methodsData.body)) ? methodsData.body : [];
        
        setNamespaceDetailsMap(prev => ({ ...prev, [ns["namespace-id"]]: { accounts, methods } }));
      } catch (err) {
        setError(prev => ({ ...prev, namespaces: 'Failed to fetch namespace details' }));
        // Set empty arrays on error to prevent future errors
        setNamespaceDetailsMap(prev => ({ ...prev, [ns["namespace-id"]]: { accounts: [], methods: [] } }));
      } finally {
        setLoadingDetails(false);
      }
    }
    
    // End animation after a short delay
    setTimeout(() => {
      setIsPanelAnimating(false);
    }, 500);
  };

  const closeFloatingDetails = () => {
    // Start closing animation
    setIsPanelAnimating(true);
    setShowContent(false);
    
    // Close after animation completes
    setTimeout(() => {
      setShowFloatingDetails(false);
      setFloatingNamespaceDetails(null);
      setSelectedNamespace(null);
      setSelectedNamespaceId(null);
      setPanelHeight(60); // Reset to default height
      setIsPanelAnimating(false);
    }, 300);
  };

  const handleSidePanelAdd = (type: string, parentData?: any) => {
    // If parent handler is available, use it and close namespace detail panel
    if (onAddItem) {
      onAddItem(type, parentData);
      closeFloatingDetails(); // Close the namespace detail panel
      return;
    }
    
    // Fallback to local modals (shouldn't happen if prop is passed correctly)
    if (type === 'account') {
      setShowAccountModal(true);
    } else if (type === 'method') {
      setShowMethodModal(true);
    } else if (type === 'schema') {
      setShowModal({ type: 'schema', data: null });
    } else if (type === 'webhook') {
      alert('Webhook creation coming soon!');
    }
  };

  const toggleSectionCollapse = (section: 'accounts' | 'methods' | 'schemas' | 'webhooks' | 'lambdas') => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Drag functionality for resizing panel
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    e.preventDefault();
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Cancel previous animation frame if it exists
    if (dragAnimationFrame) {
      cancelAnimationFrame(dragAnimationFrame);
    }
    
    // Use requestAnimationFrame for smoother updates
    const frame = requestAnimationFrame(() => {
      const viewportHeight = window.innerHeight;
      const deltaY = dragStartY - e.clientY;
      const deltaHeight = (deltaY / viewportHeight) * 100;
      const newHeight = panelHeight + deltaHeight;
      
      // Constrain height between 30% and 80% of viewport
      const constrainedHeight = Math.min(Math.max(newHeight, 30), 80);
      setPanelHeight(constrainedHeight);
      setDragStartY(e.clientY); // Update start position for next move
    });
    
    setDragAnimationFrame(frame);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragStartY(0);
    
    // Cancel any pending animation frame
    if (dragAnimationFrame) {
      cancelAnimationFrame(dragAnimationFrame);
      setDragAnimationFrame(null);
    }
  };

  // Add event listeners for drag functionality
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Clean up any pending animation frame
      if (dragAnimationFrame) {
        cancelAnimationFrame(dragAnimationFrame);
        setDragAnimationFrame(null);
      }
    };
  }, [isDragging]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedNamespace(null);
    setNamespaceDetails({ accounts: [], methods: [] });
  };

  // --- Filtered Data ---
  const filteredNamespaces = namespaces
    .filter(ns =>
    search.type !== 'schema' && (
      search.text === '' ||
        (ns["namespace-name"] || '').toLowerCase().includes(search.text.toLowerCase()) ||
        (ns["namespace-url"] || '').toLowerCase().includes(search.text.toLowerCase()) ||
        ns.tags?.some(tag => tag?.toLowerCase()?.includes(search.text.toLowerCase()))
    )
    )
    .sort((a, b) => {
      const nameA = (a["namespace-name"] || '').toLowerCase();
      const nameB = (b["namespace-name"] || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const filteredSchemas = schemas
    .filter(s =>
    search.type !== 'namespace' && (
      search.text === '' ||
        (s.schemaName || '').toLowerCase().includes(search.text.toLowerCase()) ||
        (s.originalType || '').toLowerCase().includes(search.text.toLowerCase())
    )
    )
    .sort((a, b) => {
      const nameA = (a.schemaName || '').toLowerCase();
      const nameB = (b.schemaName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

  // Handler to open modal for add/edit
  const handleAddAccount = () => {
    setEditingAccount(null);
    setAccountForm({
      "namespace-account-name": '',
      "namespace-account-url-override": '',
      tags: [],
      "namespace-account-header": [],
      variables: [],
    });
    setShowAccountModal(true);
  };
  const handleEditAccount = (account: any) => {
    setEditingAccount(account);
    setAccountForm(account);
    setShowAccountModal(true);
  };

  // Handler to save account
  const handleSaveAccount = async () => {
    if (!selectedNamespace) return;
    setAccountLoading(true);
    setAccountError('');
    try {
      const method = editingAccount ? 'PUT' : 'POST';
      const url = editingAccount
        ? `${API_BASE_URL}/unified/accounts/${editingAccount["namespace-account-id"]}`
        : `${API_BASE_URL}/unified/namespaces/${selectedNamespace["namespace-id"]}/accounts`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm),
      });
      if (!res.ok) throw new Error('Failed to save account');
      setShowAccountModal(false);
      fetchNamespaceDetails(selectedNamespace["namespace-id"]);
    } catch (err: any) {
      setAccountError(err.message);
    } finally {
      setAccountLoading(false);
    }
  };

  // Handler to delete account
  const handleDeleteAccount = async (account: any) => {
    if (!selectedNamespace) return;
    if (!window.confirm('Delete this account?')) return;
    setAccountLoading(true);
    setAccountError('');
    try {
      const url = `${API_BASE_URL}/unified/accounts/${account["namespace-account-id"]}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete account');
      fetchNamespaceDetails(selectedNamespace["namespace-id"]);
    } catch (err: any) {
      setAccountError(err.message);
    } finally {
      setAccountLoading(false);
    }
  };

  // Handler to open modal for add/edit
  const handleAddMethod = () => {
    setEditingMethod(null);
    setMethodForm({
      "namespace-method-name": '',
      "namespace-method-type": 'GET',
      "namespace-method-url-override": '',
      tags: [],
      "namespace-method-queryParams": [],
      "namespace-method-header": [],
      "save-data": false,
      "isInitialized": false,
      "sample-request": '',
      "sample-response": '',
      "request-schema": '',
      "response-schema": '',
    });
    setShowMethodModal(true);
  };
  const handleEditMethod = (method: any) => {
    setEditingMethod(method);
    setMethodForm(method);
    setShowMethodModal(true);
  };

  // Handler to save method
  const handleSaveMethod = async () => {
    if (!selectedNamespace) return;
    setMethodLoading(true);
    setMethodError('');
    try {
      const method = editingMethod ? 'PUT' : 'POST';
      const url = editingMethod
        ? `${API_BASE_URL}/unified/methods/${editingMethod["namespace-method-id"]}`
        : `${API_BASE_URL}/unified/namespaces/${selectedNamespace["namespace-id"]}/methods`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(methodForm),
      });
      if (!res.ok) throw new Error('Failed to save method');
      setShowMethodModal(false);
      fetchNamespaceDetails(selectedNamespace["namespace-id"]);
    } catch (err: any) {
      setMethodError(err.message);
    } finally {
      setMethodLoading(false);
    }
  };

  // Handler to delete method
  const handleDeleteMethod = async (method: any) => {
    if (!selectedNamespace) return;
    if (!window.confirm('Delete this method?')) return;
    setMethodLoading(true);
    setMethodError('');
    try {
      const url = `${API_BASE_URL}/unified/methods/${method["namespace-method-id"]}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete method');
      fetchNamespaceDetails(selectedNamespace["namespace-id"]);
    } catch (err: any) {
      setMethodError(err.message);
    } finally {
      setMethodLoading(false);
    }
  };



  // Handler to open MethodTestModal
  const handleTestMethod = (method: Method) => {
    setTestingMethod(method);
    setIsMethodTestModalOpen(true);
  };

  // Add effect to open modals from external trigger
  useEffect(() => {
    if (externalModalTrigger) {
      if (externalModalTrigger.type === 'namespace') {
        setShowModal({ type: 'namespace', data: externalModalTrigger.data });
      } else if (externalModalTrigger.type === 'schema') {
        setShowModal({ type: 'schema', data: externalModalTrigger.data });
      } else if (externalModalTrigger.type === 'account') {
        setEditingAccount(externalModalTrigger.data);
        setAccountForm(externalModalTrigger.data);
        setShowAccountModal(true);
      } else if (externalModalTrigger.type === 'method') {
        setEditingMethod(externalModalTrigger.data);
        setMethodForm(externalModalTrigger.data);
        setShowMethodModal(true);
      }
    }
  }, [externalModalTrigger]);

  // When closing any modal, call onModalClose if provided
  const closeAllModals = () => {
    setShowModal({ type: null, data: null });
    setShowAccountModal(false);
    setShowMethodModal(false);
    if (onModalClose) onModalClose();
  };

  // --- UI ---
  useEffect(() => {
    if (showModal.type === 'namespace') {
      if (showModal.data) {
        setNamespaceForm({
          "namespace-name": showModal.data["namespace-name"] || '',
          "namespace-url": showModal.data["namespace-url"] || '',
          tags: showModal.data.tags || [],
        });
      } else {
        setNamespaceForm({
          "namespace-name": '',
          "namespace-url": '',
          tags: [],
        });
      }
    }
  }, [showModal]);

  return (
    <div 
      className={`p-0 ${!isDragging ? 'transition-all duration-300 ease-out' : ''} ${isCollapsed ? 'ml-0' : 'ml-0'}`}
      onClick={(e) => {
        // Clear selection when clicking on the background
        if (e.target === e.currentTarget) {
          setSelectedNamespaceId(null);
          setSelectedNamespace(null);
        }
      }}
    >
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 via-white to-indigo-50 border-b border-gray-200 py-4">
        <div className="max-w-full mx-auto px-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left Section - Title */}
        <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <Database className="text-white" size={20} />
          </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  Namespaces
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filteredNamespaces.length}
                  </span>
                </h2>
                <p className="text-xs text-gray-500">Manage your API namespaces</p>
        </div>
            </div>
            
            {/* Right Section - Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
                  placeholder="Search namespaces..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64 text-sm transition-all"
              value={search.text}
              onChange={e => setSearch(prev => ({ ...prev, text: e.target.value }))}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="List View"
            >
              <ListIcon size={16} />
            </button>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={() => fetchData()}
                disabled={loading.namespaces}
                className={`p-2 rounded-lg border transition-all ${
                  loading.namespaces 
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 shadow-sm'
                }`}
                title="Refresh Namespaces"
              >
                <RefreshCw 
                  size={16} 
                  className={loading.namespaces ? 'animate-spin' : ''}
                />
              </button>
              
              {/* Add Namespace Button */}
            <button
              onClick={() => { setEditingNamespace(null); setShowNamespaceModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
                <Plus size={16} />
                <span>Add Namespace</span>
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`space-y-4 max-w-full mx-auto px-3 pb-24 ${viewMode === 'grid' ? 'bg-gray-50' : ''}`}>
        {/* Namespaces Section */}
        <div>
          
          {error.namespaces && (
            <div className="text-red-500 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              ❌ {error.namespaces}
            </div>
          )}
          {error.schemas && (
            <div className="text-orange-600 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
              ⚠️ {error.schemas}
            </div>
          )}

          <div className={viewMode === 'grid' ? 'grid gap-3' : 'space-y-2'}
               style={viewMode === 'grid' ? {
                 gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))'
               } : {}}>
            {filteredNamespaces.map((ns, idx) => {
              return (
              <React.Fragment key={ns["namespace-id"]}>
                <div
                  className={`rounded-lg cursor-pointer transition-all duration-200 group ${
                    viewMode === 'grid' 
                      ? 'flex flex-col items-center justify-center gap-2 p-2 hover:scale-105 relative' 
                      : 'bg-white border border-gray-200 flex items-center gap-3 p-4 hover:shadow-md'
                  } ${
                    viewMode === 'grid' && selectedNamespaceId === ns["namespace-id"] 
                      ? 'scale-110' 
                      : viewMode === 'list' && selectedNamespaceId === ns["namespace-id"]
                      ? 'ring-2 ring-blue-500 border-blue-300' 
                        : viewMode === 'list' && expandedNamespaceId === ns["namespace-id"]
                        ? 'ring-2 ring-green-500 border-green-300' 
                          : viewMode === 'list'
                            ? 'hover:border-gray-300'
                            : ''
                  }`}
                  onClick={() => handleNamespaceClick(ns)}
                  onMouseEnter={() => {
                    if (!namespaceDetailsMap[ns["namespace-id"]]) {
                      fetchNamespaceDetails(ns["namespace-id"]);
                    }
                  }}
                >
                  {/* Grid View Action Buttons - Top Right Corner */}
                  {viewMode === 'grid' && !shouldHideActionButtons && (
                    <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingNamespace(ns); setShowNamespaceModal(true); }}
                        className="p-1.5 bg-white hover:bg-blue-50 rounded-lg transition-colors shadow-md border border-blue-200"
                        title="Edit"
                      >
                        <Edit size={12} className="text-blue-600" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete('namespace', ns["namespace-id"]); }}
                        className="p-1.5 bg-white hover:bg-red-50 rounded-lg transition-colors shadow-md border border-red-200"
                        title="Delete"
                      >
                        <Trash2 size={12} className="text-red-600" />
                      </button>
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className={`flex-shrink-0 flex items-center justify-center ${viewMode === 'grid' ? 'w-12 h-12' : 'w-8 h-8'}`}>
                    {ns["icon-url"] ? (
                      <img 
                        src={ns["icon-url"]} 
                        alt={`${ns["namespace-name"]} icon`}
                        className={`rounded-lg object-cover ${viewMode === 'grid' ? 'w-12 h-12' : 'w-8 h-8'}`}
                        onLoad={(e) => {
                          e.currentTarget.classList.remove('opacity-0');
                          e.currentTarget.classList.add('opacity-100');
                        }}
                        onError={(e) => {
                          // Silently handle error - show placeholder
                          e.currentTarget.style.display = 'none';
                          const skeleton = e.currentTarget.nextElementSibling as HTMLElement;
                          if (skeleton) skeleton.classList.remove('hidden');
                        }}
                        loading="lazy"
                      />
                    ) : null}
                    <div className={`rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${viewMode === 'grid' ? 'w-12 h-12' : 'w-8 h-8'} ${ns["icon-url"] ? 'hidden' : ''}`}>
                      <div className={`font-bold text-gray-400 ${viewMode === 'grid' ? 'text-xl' : 'text-sm'}`}>
                        {ns["namespace-name"]?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Name */}
                  <div className={viewMode === 'grid' ? 'w-full text-center px-1' : 'flex-1 min-w-0'}>
                    <h4 className={`font-medium text-gray-900 truncate ${viewMode === 'grid' ? 'text-xs leading-tight' : 'text-sm'}`} title={ns["namespace-name"]}>{ns["namespace-name"]}</h4>
                  </div>

                  {/* List Mode Extra Content */}
                    {viewMode === 'list' && (
                    <>
                        {ns["namespace-url"] && (
                          <a 
                            href={ns["namespace-url"]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 truncate flex items-center gap-1 text-xs max-w-[280px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                          <Globe size={12} />
                            <span className="truncate group-hover:underline">{ns["namespace-url"]}</span>
                          </a>
                        )}
                      {Array.isArray(ns.tags) && ns.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {ns.tags.slice(0, 3).map((tag: string, index: number) => (
                              <span key={`${ns["namespace-id"]}-list-tag-${tag}-${index}`} className="px-2 py-0.5 bg-gray-50 text-gray-700 text-[11px] rounded-full border border-gray-200">
                                {tag}
                              </span>
                            ))}
                            {ns.tags.length > 3 && (
                              <span key={`${ns["namespace-id"]}-more`} className="px-2 py-0.5 bg-gray-50 text-gray-700 text-[11px] rounded-full border border-gray-200">
                                +{ns.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      <div className="flex items-center gap-2 ml-auto">
                          <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] text-gray-700">
                            Accounts {namespaceDetailsMap[ns["namespace-id"]]?.accounts?.length ?? '—'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] text-gray-700">
                            Methods {namespaceDetailsMap[ns["namespace-id"]]?.methods?.length ?? '—'}
                          </span>
                        </div>
                    </>
                        )}

                  {/* Action Buttons - Only in List Mode */}
                  {viewMode === 'list' && !shouldHideActionButtons && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); setEditingNamespace(ns); setShowNamespaceModal(true); }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete('namespace', ns["namespace-id"]); }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  )}
                </div>
              </React.Fragment>
            );
            })}
          </div>
                      </div>
      </div>

      {/* Right Side Namespace Details Panel */}
      {showFloatingDetails && floatingNamespaceDetails && (
        <>
          {/* Backdrop - Light overlay */}
          <div 
            className="fixed inset-0 bg-black/5 z-40"
            onClick={closeFloatingDetails}
            style={{ top: `${panelTopPosition}px` }}
          />
          
          {/* Right Side Panel - Fixed to viewport, aligned with tab bar */}
          <div className={`fixed right-0 z-50 bg-white border-l border-gray-200 shadow-2xl ${!isDragging ? 'transition-all duration-300 ease-out' : ''}`} 
               style={{
                 top: `${panelTopPosition}px`,
                 bottom: '0px',
                 width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100vw' : '600px',
                 maxWidth: '100vw',
                 transform: isPanelAnimating && !showContent ? 'translateX(100%)' : 'translateX(0)',
                 opacity: isPanelAnimating && !showContent ? '0' : '1'
               }}>
            
            {/* Header */}
            <div className={`flex items-start md:items-center justify-between p-3 md:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-500 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1 min-w-0">
                {/* Namespace Icon */}
                <button
                  onClick={() => onOpenNamespaceTab && onOpenNamespaceTab(floatingNamespaceDetails)}
                  className="hover:scale-105 transition-transform duration-200 flex-shrink-0"
                  title="Open in tab"
                >
                  {floatingNamespaceDetails["icon-url"] ? (
                    <img 
                      src={floatingNamespaceDetails["icon-url"]} 
                      alt={floatingNamespaceDetails["namespace-name"]}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Database className="w-5 h-5 md:w-7 md:h-7 text-white" />
                    </div>
                  )}
                </button>
                
                {/* Namespace Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{floatingNamespaceDetails["namespace-name"]}</h2>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs md:text-sm text-gray-600 mt-1">
                    {floatingNamespaceDetails["namespace-url"] && (
                      <a 
                        href={floatingNamespaceDetails["namespace-url"]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 truncate flex items-center gap-1 group"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe size={14} />
                        <span className="truncate group-hover:underline">{floatingNamespaceDetails["namespace-url"]}</span>
                      </a>
                    )}
                    {namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]] && (
                      <div className="flex items-center gap-2 md:gap-4">
                        <span className="hidden md:inline">•</span>
                        <span>{namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]].accounts.length} accounts</span>
                        <span className="hidden md:inline">•</span>
                        <span>{namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]].methods.length} methods</span>
                              </div>
                    )}
                    {floatingNamespaceDetails.tags && floatingNamespaceDetails.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 md:mt-0">
                        <span className="hidden md:inline">•</span>
                        <div className="flex items-center gap-1 flex-wrap">
                            {floatingNamespaceDetails.tags.slice(0, 2).map((tag: string, index: number) => (
                            <span key={`${floatingNamespaceDetails["namespace-id"]}-tag-${tag}-${index}`} className="px-2 py-1 bg-white text-gray-700 rounded-full text-xs border border-blue-200">
                              {tag}
                            </span>
                          ))}
                          {floatingNamespaceDetails.tags.length > 2 && (
                            <span key="floating-namespace-more" className="text-xs text-gray-500">+{floatingNamespaceDetails.tags.length - 2}</span>
                          )}
                        </div>
                    </div>
                    )}
                      </div>
                        </div>
                    </div>
              
              {/* Close Button */}
              <button
                onClick={closeFloatingDetails}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/70 rounded-lg transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
                              </div>
            
            {/* Content */}
            <div className={`p-3 md:p-4 overflow-y-auto ${!isDragging ? 'transition-all duration-300 ease-out' : ''} transition-all duration-500 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ height: 'calc(100vh - ' + panelTopPosition + 'px - 100px)' }}>
              {loadingDetails && !namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]] ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading namespace details...</p>
                            </div>
                        </div>
              ) : (
                <div className="space-y-4">
                  {/* Accounts Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <button 
                        onClick={() => toggleSectionCollapse('accounts')}
                        className="flex items-center gap-2 text-base md:text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                      >
                        {collapsedSections.accounts ? (
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        )}
                        <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        <span className="hidden sm:inline">Accounts ({namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]]?.accounts?.length || 0})</span>
                        <span className="sm:hidden">({namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]]?.accounts?.length || 0})</span>
                      </button>
                      <button 
                        onClick={() => handleSidePanelAdd('account', floatingNamespaceDetails)}
                        className="px-2 md:px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm flex items-center gap-1"
                      >
                        <UserPlus size={12} className="md:hidden" />
                        <UserPlus size={14} className="hidden md:block" />
                        <span className="hidden sm:inline">Add Account</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    </div>
                    
                    {!collapsedSections.accounts && (
                      <>
                        {!namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]]?.accounts?.length ? (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>No accounts found</p>
                      </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]]?.accounts?.map(account => (
                              <div 
                                key={account["namespace-account-id"]} 
                                className="p-2 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
                                onClick={() => onViewAccount && onViewAccount(account, floatingNamespaceDetails)}
                                title="Click to view account details"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-blue-200 flex-shrink-0">
                                    <User className="w-3 h-3 text-blue-600" />
                            </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate text-xs">{account["namespace-account-name"]}</h4>
                                    <p className="text-[10px] text-gray-500 truncate">{account["namespace-account-url-override"]}</p>
                                  </div>
                                </div>
                                {account.tags && account.tags.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {account.tags.slice(0, 1).map((tag: string, index: number) => (
                                      <span key={`${account["namespace-account-id"]}-tag-${tag}-${index}`} className="px-1.5 py-0.5 bg-white text-blue-700 rounded-full text-[10px]">
                                        {tag}
                                      </span>
                                    ))}
                                    {account.tags.length > 1 && (
                                      <span key={`${account["namespace-account-id"]}-more`} className="px-1.5 py-0.5 bg-white text-blue-700 rounded-full text-[10px]">+{account.tags.length - 1}</span>
                                  )}
                                </div>
                                )}
                              </div>
                      ))}
                    </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Methods Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                  <button
                        onClick={() => toggleSectionCollapse('methods')}
                        className="flex items-center gap-2 text-base md:text-lg font-semibold text-gray-800 hover:text-green-600 transition-colors"
                      >
                        {collapsedSections.methods ? (
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                        )}
                        <Terminal className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                        <span className="hidden sm:inline">Methods ({namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]]?.methods?.length || 0})</span>
                        <span className="sm:hidden">({namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]]?.methods?.length || 0})</span>
                      </button>
                      <button
                        onClick={() => handleSidePanelAdd('method', floatingNamespaceDetails)}
                        className="px-2 md:px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs md:text-sm flex items-center gap-1"
                      >
                        <Plus size={12} className="md:hidden" />
                        <Plus size={14} className="hidden md:block" />
                        <span className="hidden sm:inline">Add Method</span>
                        <span className="sm:hidden">Add</span>
                  </button>
                              </div>
                    
                    {!collapsedSections.methods && (
                      <>
                        {!namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]]?.methods?.length ? (
                      <div className="text-center py-8 text-gray-500">
                        <Terminal className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No methods found</p>
                            </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {namespaceDetailsMap[floatingNamespaceDetails["namespace-id"]]?.methods?.map(method => (
                          <div 
                            key={method["namespace-method-id"]} 
                            className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md hover:border-green-400 transition-all cursor-pointer"
                            onClick={() => onViewMethod && onViewMethod(method, floatingNamespaceDetails)}
                            title="Click to view method details"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                                <Terminal className="w-3 h-3 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate text-xs">{method["namespace-method-name"]}</h4>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                    method["namespace-method-type"] === 'GET' ? 'bg-green-100 text-green-700' :
                                    method["namespace-method-type"] === 'POST' ? 'bg-blue-100 text-blue-700' :
                                    method["namespace-method-type"] === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                                    method["namespace-method-type"] === 'DELETE' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {method["namespace-method-type"]}
                                  </span>
                            </div>
                          </div>
                            </div>
                            {method.tags && method.tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {method.tags.slice(0, 1).map((tag: string, index: number) => (
                                  <span key={`${method["namespace-method-id"]}-tag-${tag}-${index}`} className="px-1.5 py-0.5 bg-white text-gray-700 rounded-full text-[10px]">
                                    {tag}
                                  </span>
                                ))}
                                {method.tags.length > 1 && (
                                  <span key={`${method["namespace-method-id"]}-more`} className="px-1.5 py-0.5 bg-white text-gray-700 rounded-full text-[10px]">+{method.tags.length - 1}</span>
                                )}
                </div>
                            )}
                        </div>
                      ))}
                    </div>
                        )}
                      </>
          )}
                  </div>
                  
                  {/* Schemas Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                  <button
                        onClick={() => toggleSectionCollapse('schemas')}
                        className="flex items-center gap-2 text-base md:text-lg font-semibold text-gray-800 hover:text-purple-600 transition-colors"
                      >
                        {collapsedSections.schemas ? (
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                        )}
                        <FileCode className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                        <span className="hidden sm:inline">Schemas ({schemas.filter(s => s.namespaceId === floatingNamespaceDetails["namespace-id"]).length})</span>
                        <span className="sm:hidden">({schemas.filter(s => s.namespaceId === floatingNamespaceDetails["namespace-id"]).length})</span>
                      </button>
                      <button 
                        onClick={() => handleSidePanelAdd('schema', floatingNamespaceDetails)}
                        className="px-2 md:px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs md:text-sm flex items-center gap-1"
                      >
                        <FilePlus size={12} className="md:hidden" />
                        <FilePlus size={14} className="hidden md:block" />
                        <span className="hidden sm:inline">Add Schema</span>
                        <span className="sm:hidden">Add</span>
                  </button>
                </div>
                    
                    {!collapsedSections.schemas && (
                      <>
                        {!schemas.filter(s => s.namespaceId === floatingNamespaceDetails["namespace-id"]).length ? (
                          <div className="text-center py-8 text-gray-500">
                            <FileCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>No schemas found</p>
                              </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {schemas.filter(s => s.namespaceId === floatingNamespaceDetails["namespace-id"]).map(schema => (
                              <div 
                                key={schema.id} 
                                className="p-2 bg-purple-50 rounded-lg border border-purple-200 hover:shadow-md hover:border-purple-400 transition-all cursor-pointer"
                                onClick={() => onViewSchema && onViewSchema(schema, floatingNamespaceDetails)}
                                title="Click to view schema details"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-purple-200 flex-shrink-0">
                                    <FileCode className="w-3 h-3 text-purple-600" />
                              </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate text-xs">{schema.schemaName}</h4>
                                    <p className="text-[10px] text-gray-500 truncate">{schema.originalType || 'object'}</p>
                            </div>
                          </div>
                                {schema.tags && schema.tags.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {schema.tags.slice(0, 1).map((tag: string, index: number) => (
                                      <span key={`${schema.id}-tag-${tag}-${index}`} className="px-1.5 py-0.5 bg-white text-purple-700 rounded-full text-[10px]">
                                        {tag}
                                      </span>
                                    ))}
                                    {schema.tags.length > 1 && (
                                      <span className="text-[10px] text-gray-500">+{schema.tags.length - 1}</span>
                                    )}
                </div>
                                )}
          </div>
                            ))}
            </div>
                        )}
                      </>
          )}
        </div>
                  
                  {/* Webhooks Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <button 
                        onClick={() => toggleSectionCollapse('webhooks')}
                        className="flex items-center gap-2 text-base md:text-lg font-semibold text-gray-800 hover:text-orange-600 transition-colors"
                      >
                        {collapsedSections.webhooks ? (
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                        )}
                        <Globe className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                        <span className="hidden sm:inline">Webhooks (0)</span>
                        <span className="sm:hidden">(0)</span>
                      </button>
                      <button 
                        onClick={() => handleSidePanelAdd('webhook', floatingNamespaceDetails)}
                        className="px-2 md:px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs md:text-sm flex items-center gap-1"
                      >
                        <Globe size={12} className="md:hidden" />
                        <Globe size={14} className="hidden md:block" />
                        <span className="hidden sm:inline">Add Webhook</span>
                        <span className="sm:hidden">Add</span>
                      </button>
      </div>
                    
                    {!collapsedSections.webhooks && (
                      <div className="text-center py-8 text-gray-500">
                        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No webhooks configured</p>
                        <p className="text-xs mt-1">Webhooks will appear here when configured for this namespace</p>
                      </div>
                    )}
                  </div>

                  {/* Lambdas Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <button 
                        onClick={() => toggleSectionCollapse('lambdas')}
                        className="flex items-center gap-2 text-base md:text-lg font-semibold text-gray-800 hover:text-indigo-600 transition-colors"
                      >
                        {collapsedSections.lambdas ? (
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                        )}
                        <Zap className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                        <span className="hidden sm:inline">Lambdas (0)</span>
                        <span className="sm:hidden">(0)</span>
                      </button>
                      <button 
                        onClick={() => handleSidePanelAdd('lambda', floatingNamespaceDetails)}
                        className="px-2 md:px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs md:text-sm flex items-center gap-1"
                      >
                        <Plus size={12} className="md:hidden" />
                        <Plus size={14} className="hidden md:block" />
                        <span className="hidden sm:inline">Add Lambda</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    </div>
                    
                    {!collapsedSections.lambdas && (
                      <div className="text-center py-8 text-gray-500">
                        <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No lambdas configured</p>
                        <p className="text-xs mt-1">Lambda functions will appear here when created for this namespace</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Schema Preview Modal */}
      <SchemaPreviewModal
        open={!!previewSchema}
        onClose={() => setPreviewSchema(null)}
        schema={previewSchema}
        onEdit={schema => {
          setShowModal({ type: 'schema', data: schema });
          setPreviewSchema(null);
        }}
        onDelete={schema => { handleDelete('schema', schema.id); setPreviewSchema(null); }}
      />
      {/* Extra actions: Create Table & Create Data */}
      {previewSchema && (
        <div className="flex gap-2 mt-4 justify-end">
          <button
            className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
            onClick={() => { setTableNameInput(previewSchema?.schemaName || ''); setTableNameError(''); setShowTableNameModal(true); }}
          >
            Create Table
          </button>
          <button
            className="p-2 rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition"
            onClick={() => { setDataFormSchema(previewSchema?.schema); setDataTableName(previewSchema?.tableName || previewSchema?.schemaName); setDataForm({}); setShowDataModal(true); }}
          >
            Create Data
          </button>
        </div>
      )}

      {/* Table Name Modal */}
      {showTableNameModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10 border border-gray-200">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowTableNameModal(false)}
            >✕</button>
            <h2 className="text-lg font-semibold mb-4">Create Table for Schema</h2>
            <label className="block text-sm font-medium mb-2">Table Name</label>
            <input
              className="border border-gray-300 p-2 rounded-lg w-full mb-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none bg-gray-50 placeholder-gray-400"
              value={tableNameInput}
              onChange={e => setTableNameInput(e.target.value)}
              placeholder="Enter table name"
              autoFocus
            />
            {tableNameError && <div className="text-xs text-red-600 mb-2">{tableNameError}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold"
                onClick={() => setShowTableNameModal(false)}
              >Cancel</button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                onClick={async () => {
                  if (!tableNameInput.trim()) {
                    setTableNameError('Table name is required.');
                    return;
                  }
                  setTableNameError('');
                  try {
                    const res = await fetch(`${API_BASE_URL}/unified/schema/table`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ schemaId: pendingTableSchema.id, tableName: tableNameInput.trim() })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert('Table created successfully!');
                      setShowTableNameModal(false);
                    } else {
                      setTableNameError(data.error || 'Failed to create table.');
                    }
                  } catch (err) {
                    setTableNameError('Failed to create table: ' + err);
                  }
                }}
              >Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Data Modal */}
      {showDataModal && dataFormSchema && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col relative z-10 max-h-[95vh] border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold">Create Data for {dataTableName}</h2>
              <button className="text-gray-500 hover:text-gray-700 text-xl" onClick={() => setShowDataModal(false)}>✕</button>
            </div>
            {/* Main content */}
            <div className="flex-1 flex min-h-0">
              {/* Schema view */}
              <div className="w-1/2 border-r bg-gray-50 p-4 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 64px - 64px)' }}>
                <div className="font-semibold text-sm mb-2">Schema</div>
                <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto">{JSON.stringify(dataFormSchema, null, 2)}</pre>
              </div>
              {/* Data form */}
              <div className="w-1/2 p-4 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 64px - 64px)' }}>
                {/* You can use a DynamicForm component here if available */}
                <div className="text-gray-400 text-xs">Data form goes here (implement as needed)</div>
              </div>
            </div>
            {/* Sticky action bar */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t sticky bottom-0 bg-white rounded-b-2xl z-10">
              <button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold shadow-sm transition"
                onClick={() => setShowDataModal(false)}
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NamespaceModal
        isOpen={showNamespaceModal}
        onClose={() => { setShowNamespaceModal(false); setEditingNamespace(null); }}
        onSave={handleNamespaceSave}
        namespace={editingNamespace}
      />

      <UnifiedSchemaModal
        showModal={showUnifiedSchemaModal}
        setShowModal={setShowUnifiedSchemaModal}
        onSuccess={refreshData}
        namespace={schemaModalNamespace}
      />

      {/* Account Modal */}
      {showAccountModal && (
        <div 
          className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAccountModal(false)}
        >
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">
              {editingAccount ? 'Edit Account' : 'Create Account'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={accountForm["namespace-account-name"]}
                  onChange={e => setAccountForm(f => ({ ...f, "namespace-account-name": e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Override
                </label>
                <input
                  type="text"
                  value={accountForm["namespace-account-url-override"]}
                  onChange={e => setAccountForm(f => ({ ...f, "namespace-account-url-override": e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Headers
                  </label>
                  <button
                    type="button"
                    onClick={() => setAccountForm(f => ({ ...f, "namespace-account-header": [...f["namespace-account-header"], { key: '', value: '' }] }))}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Header
                  </button>
                </div>
                <div className="space-y-2">
                  {accountForm["namespace-account-header"].map((header, index) => (
                    <div key={header.key ? `header-${header.key}` : `header-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={header.key}
                        onChange={e => {
                          const updated = [...accountForm["namespace-account-header"]];
                          updated[index] = { ...header, key: e.target.value };
                          setAccountForm(f => ({ ...f, "namespace-account-header": updated }));
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={header.value}
                        onChange={e => {
                          const updated = [...accountForm["namespace-account-header"]];
                          updated[index] = { ...header, value: e.target.value };
                          setAccountForm(f => ({ ...f, "namespace-account-header": updated }));
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = accountForm["namespace-account-header"].filter((_, i) => i !== index);
                          setAccountForm(f => ({ ...f, "namespace-account-header": updated }));
                        }}
                        className="px-2 py-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Variables
                  </label>
                  <button
                    type="button"
                    onClick={() => setAccountForm(f => ({ ...f, variables: [...f.variables, { key: '', value: '' }] }))}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Variable
                  </button>
                </div>
                <div className="space-y-2">
                  {accountForm.variables.map((variable, index) => (
                    <div key={variable.key ? `var-${variable.key}` : `var-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={variable.key}
                        onChange={e => {
                          const updated = [...accountForm.variables];
                          updated[index] = { ...variable, key: e.target.value };
                          setAccountForm(f => ({ ...f, variables: updated }));
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={variable.value}
                        onChange={e => {
                          const updated = [...accountForm.variables];
                          updated[index] = { ...variable, value: e.target.value };
                          setAccountForm(f => ({ ...f, variables: updated }));
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = accountForm.variables.filter((_, i) => i !== index);
                          setAccountForm(f => ({ ...f, variables: updated }));
                        }}
                        className="px-2 py-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={accountForm.tags.join(', ')}
                  onChange={e => setAccountForm(f => ({ ...f, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAccountModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAccount}
                className={`px-4 py-2 ${editingAccount ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg`}
                disabled={accountLoading}
              >
                {editingAccount ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Method Modal */}
      {showMethodModal && (
        <div 
          className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowMethodModal(false)}
        >
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">
              {editingMethod ? 'Edit Method' : 'Create Method'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Method Name *
                </label>
                <input
                  type="text"
                  value={methodForm["namespace-method-name"]}
                  onChange={e => setMethodForm(f => ({ ...f, "namespace-method-name": e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Method Type *
                </label>
                <select
                  value={methodForm["namespace-method-type"]}
                  onChange={e => setMethodForm(f => ({ ...f, "namespace-method-type": e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Override
                </label>
                <input
                  type="text"
                  value={methodForm["namespace-method-url-override"]}
                  onChange={e => setMethodForm(f => ({ ...f, "namespace-method-url-override": e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Query Parameters
                  </label>
                  <button
                    type="button"
                    onClick={() => setMethodForm(f => ({ ...f, "namespace-method-queryParams": [...f["namespace-method-queryParams"], { key: '', value: '' }] }))}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Query Parameter
                  </button>
                </div>
                <div className="space-y-2">
                  {methodForm["namespace-method-queryParams"].map((param, index) => (
                    <div key={param.key ? `param-${param.key}` : `param-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={param.key}
                        onChange={e => {
                          const updated = [...methodForm["namespace-method-queryParams"]];
                          updated[index] = { ...param, key: e.target.value };
                          setMethodForm(f => ({ ...f, "namespace-method-queryParams": updated }));
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={param.value}
                        onChange={e => {
                          const updated = [...methodForm["namespace-method-queryParams"]];
                          updated[index] = { ...param, value: e.target.value };
                          setMethodForm(f => ({ ...f, "namespace-method-queryParams": updated }));
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = methodForm["namespace-method-queryParams"].filter((_, i) => i !== index);
                          setMethodForm(f => ({ ...f, "namespace-method-queryParams": updated }));
                        }}
                        className="px-2 py-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Headers
                  </label>
                  <button
                    type="button"
                    onClick={() => setMethodForm(f => ({ ...f, "namespace-method-header": [...f["namespace-method-header"], { key: '', value: '' }] }))}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Header
                  </button>
                </div>
                <div className="space-y-2">
                  {methodForm["namespace-method-header"].map((header, index) => (
                    <div key={header.key ? `header-${header.key}` : `header-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={header.key}
                        onChange={e => {
                          const updated = [...methodForm["namespace-method-header"]];
                          updated[index] = { ...header, key: e.target.value };
                          setMethodForm(f => ({ ...f, "namespace-method-header": updated }));
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={header.value}
                        onChange={e => {
                          const updated = [...methodForm["namespace-method-header"]];
                          updated[index] = { ...header, value: e.target.value };
                          setMethodForm(f => ({ ...f, "namespace-method-header": updated }));
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = methodForm["namespace-method-header"].filter((_, i) => i !== index);
                          setMethodForm(f => ({ ...f, "namespace-method-header": updated }));
                        }}
                        className="px-2 py-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={methodForm.tags.join(', ')}
                  onChange={e => setMethodForm(f => ({ ...f, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="save-data-edit"
                  checked={methodForm["save-data"]}
                  onChange={e => setMethodForm(f => ({ ...f, "save-data": e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="save-data-edit" className="text-sm text-gray-700">
                  Save Data
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMethodModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMethod}
                className={`px-4 py-2 ${editingMethod ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg`}
                disabled={methodLoading}
              >
                {editingMethod ? 'Update Method' : 'Create Method'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Method Test Modal */}
      {testingMethod && (
        <MethodTestModal
          isOpen={isMethodTestModalOpen}
          onClose={() => setIsMethodTestModalOpen(false)}
          namespaceId={selectedNamespace?.['namespace-id'] || ''}
          methodName={testingMethod['namespace-method-name']}
          methodType={testingMethod['namespace-method-type']}
          namespaceMethodUrlOverride={testingMethod['namespace-method-url-override'] || ''}
          saveData={!!testingMethod['save-data']}
          methodId={testingMethod['namespace-method-id']}
        />
      )}



      <CreateDataModal
        open={showDataModal && !!dataFormSchema}
        onClose={() => setShowDataModal(false)}
        schema={dataFormSchema}
        tableName={dataTableName}
        onSuccess={() => { setShowDataModal(false); }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && namespaceToDelete && (
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
                  setNamespaceToDelete(null);
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
                      <span><strong>Namespace:</strong> "{namespaceToDelete["namespace-name"]}"</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      <span>All <strong>accounts</strong> associated with this namespace</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      <span>All <strong>methods</strong> associated with this namespace</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      <span>All <strong>schemas</strong> associated with this namespace</span>
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
                  setNamespaceToDelete(null);
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
};

export default UnifiedNamespace; 

/* Bottom sliding namespace details animations */
<style jsx global>{`
  @keyframes slideUpFromBottom {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideDownToBottom {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(100%);
    }
  }
  
  .bottom-slide-up {
    animation: slideUpFromBottom 0.4s ease-out;
  }
  
  .bottom-slide-down {
    animation: slideDownToBottom 0.3s ease-in;
  }
`}</style> 