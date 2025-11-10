'use client';
import React, { useState, useEffect } from 'react';
import SidePanel from './components/SidePanel';
import UnifiedNamespace, { UnifiedNamespaceModalTrigger } from './components/UnifiedNamespace';
import Namespace from './components/Namespace';
import SchemaService from './components/SchemaService';
import Tables from './components/Tables';

import dynamic from 'next/dynamic';
import { NestedFieldsEditor, schemaToFields } from './components/SchemaService';
import { User, X, Plus, MoreHorizontal,  Zap, Box, FileText, GitBranch, Database, Sparkles, View, LayoutGrid, LayoutPanelLeft, Pin, PinOff, Globe, Search, Settings, Copy, Edit3, Trash2 } from 'lucide-react';
import AccountModal from './Modals/AccountModal';
import MethodModal from './components/MethodModal';
import NamespaceModal from './Modals/NamespaceModal';
import AccountPreviewModal from './Modals/AccountPreviewModal';
import MethodPreviewModal from './Modals/MethodPreviewModal';
import MethodTestModal from '../components/MethodTestModal';
import UnifiedSchemaModal from './Modals/UnifiedSchemaModal';
import SchemaPreviewModal from './Modals/SchemaPreviewModal';
import { useSidePanel } from "../components/SidePanelContext";
import { useNamespaceContext } from "../components/NamespaceContext";
import SchemaCreatePage from './pages/SchemaCreatePage';
import AllAccountPage from './pages/AllAccountPage';
import AllMethodPage from './pages/AllMethodPage';
import AccountPage from './pages/AccountPage';
import MethodPage from './pages/MethodPage';
import AllSchemaPage from './pages/AllSchemaPage';
import MethodTestPage from './pages/MethodTestPage';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AllWebhookPage from './pages/AllWebhookPage';
import WebhookPage from './pages/WebhookPage';
import AllLambdasPage from './pages/AllLambdasPage';
import LambdaPage from './pages/LambdaPage';




const SIDEBAR_WIDTH = 80; // px, w-20
const SIDEPANEL_WIDTH = 256; // px, w-64

const initialTabs = [
  { key: 'overview', label: 'Overview', pinned: false },
];

function fieldsToSchema(fields: any[]): Record<string, any> {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  for (const field of fields) {
    let type: any = field.type;
    if (field.allowNull) {
      type = [field.type, 'null'];
    }
    let property: any = { type };
    if (field.type === 'enum') {
      property = {
        type: field.allowNull ? ['string', 'null'] : 'string',
        enum: field.enumValues || []
      };
    } else if (field.type === 'object') {
      const nested = fieldsToSchema(field.fields || []);
      property = { ...property, ...nested };
    } else if (field.type === 'array') {
      if (field.itemType === 'object') {
        property.items = fieldsToSchema(field.itemFields || []);
      } else {
        property.items = { type: field.allowNull ? [field.itemType, 'null'] : field.itemType };
      }
    }
    properties[field.name] = property;
    if (field.required) {
      required.push(field.name);
    }
  }
  const schema: any = {
    type: 'object',
    properties
  };
  if (required.length > 0) {
    schema.required = required;
  }
  return schema;
}

function NamespacePage(props: React.PropsWithChildren<{}>) {
  const { isCollapsed, setIsCollapsed } = useSidePanel();
  const { setCurrentNamespace } = useNamespaceContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [tabs, setTabs] = useState(initialTabs);
  const [namespaceSearchQuery, setNamespaceSearchQuery] = useState('');
  const [namespaceViewMode, setNamespaceViewMode] = useState<'grid' | 'list'>('grid');
  const [secondaryTab, setSecondaryTab] = useState<'accounts' | 'methods' | 'schemas' | 'webhooks' | 'lambdas'>('accounts');
  const [secondarySearchQuery, setSecondarySearchQuery] = useState('');
  const [showSecondarySettings, setShowSecondarySettings] = useState(false);
  const [tertiarySidebarTop, setTertiarySidebarTop] = useState(116); // Default: navbar (64px) + tab bar (~52px)

  // Modal state for schema creation
  const [showModal, setShowModal] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [schemaName, setSchemaName] = useState('');
  const [jsonSchema, setJsonSchema] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [rawFields, setRawFields] = useState('');
  const [rawFieldsError, setRawFieldsError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [saveMessage, setSaveMessage] = useState('');

  // --- SidePanel and UnifiedNamespace shared state ---
  const [namespaces, setNamespaces] = useState<any[]>([]);
  const [schemas, setSchemas] = useState<any[]>([]);
  const [namespaceDetailsMap, setNamespaceDetailsMap] = useState<Record<string, { accounts: any[]; methods: any[] }>>({});
  const [sidePanelModal, setSidePanelModal] = useState<UnifiedNamespaceModalTrigger | null>(null);
  const [previewAccount, setPreviewAccount] = useState(null);
  const [previewMethod, setPreviewMethod] = useState(null);
  const [previewSchema, setPreviewSchema] = useState(null);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

  // New state for AccountModal and MethodModal
  const [accountModal, setAccountModal] = useState<{ isOpen: boolean; account: any | null }>({ isOpen: false, account: null });
  const [methodModal, setMethodModal] = useState<{ isOpen: boolean; method: any | null }>({ isOpen: false, method: null });
  const [namespaceModal, setNamespaceModal] = useState<{ isOpen: boolean; namespace: any | null }>({ isOpen: false, namespace: null });

  // New state for MethodTestModal
  const [testMethodModal, setTestMethodModal] = useState<{ isOpen: boolean; method: any | null }>({ isOpen: false, method: null });

  // New state for UnifiedSchemaModal
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  // Add state for all accounts/methods tabs
  const [allAccountsTabs, setAllAccountsTabs] = useState<{ key: string; namespace?: any; openCreate?: boolean; timestamp?: number }[]>([]);
  const [allMethodsTabs, setAllMethodsTabs] = useState<{ key: string; namespace?: any; openCreate?: boolean; timestamp?: number }[]>([]);

  // Add state for account/method tabs
  const [accountPageTabs, setAccountPageTabs] = useState<{ key: string; account: any; namespace: any; openEdit?: boolean }[]>([]);
  const [methodPageTabs, setMethodPageTabs] = useState<{ key: string; method: any; namespace: any; openEdit?: boolean }[]>([]);



  // Add state for schema page tabs
  const [schemaPageTabs, setSchemaPageTabs] = useState<{ key: string; schema?: any; mode: 'create' | 'preview' | 'edit'; initialSchemaName?: string; namespace?: any; methodId?: string; timestamp?: number }[]>([]);

  // Add state for all schemas tabs
  const [allSchemasTabs, setAllSchemasTabs] = useState<{ key: string; namespace?: any; openCreate?: boolean; timestamp?: number }[]>([]);

  // Add state for single namespace tabs
  const [singleNamespaceTabs, setSingleNamespaceTabs] = useState<{ key: string; namespace: any }[]>([]);

  // Add state for method test tabs
  const [methodTestTabs, setMethodTestTabs] = useState<{ key: string; method: any; namespace: any }[]>([]);



  // Add state for AI Agent Workspace


  // Add state for tab layout
  const [tabLayout, setTabLayout] = useState<'horizontal' | 'vertical'>('horizontal');

  // Add state for all webhooks tabs
  const [allWebhooksTabs, setAllWebhooksTabs] = useState<{ key: string; namespace?: any; openCreate?: boolean; timestamp?: number }[]>([]);

  // Add state for webhooks per namespace
  const [webhooksMap, setWebhooksMap] = useState<Record<string, any[]>>({});

  // Add state for webhookPage tabs
  const [webhookPageTabs, setWebhookPageTabs] = useState<{ key: string; webhook: any; namespace: any }[]>([]);
  
  // Add state for lambdas per namespace
  const [lambdasMap, setLambdasMap] = useState<Record<string, any[]>>({});
  
  // Add state for all lambdas tabs
  const [allLambdasTabs, setAllLambdasTabs] = useState<{ key: string; namespace?: any; openCreate?: boolean; timestamp?: number }[]>([]);
  
  // Add state for lambdaPage tabs
  const [lambdaPageTabs, setLambdaPageTabs] = useState<{ key: string; lambda: any; namespace: any }[]>([]);

  // Derive accounts and methods from namespaceDetailsMap for SidePanel
  const accounts = Object.fromEntries(
    Object.entries(namespaceDetailsMap).map(([nsId, v]) => [nsId, v.accounts])
  );
  const methods = Object.fromEntries(
    Object.entries(namespaceDetailsMap).map(([nsId, v]) => [nsId, v.methods])
  );

  // Extract fetchData function so it can be called manually
  const fetchData = async () => {
    console.log('Fetching namespaces and schemas...');
    
    try {
  // Fetch namespaces
      const namespacesRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/namespaces`);
      console.log('Namespaces response status:', namespacesRes.status);
      if (!namespacesRes.ok) {
        throw new Error(`HTTP error! status: ${namespacesRes.status}`);
      }
      const namespacesData = await namespacesRes.json();
      console.log('Namespaces data received:', namespacesData);
      // Fix: Handle both formats - direct array or wrapped in body
      const namespacesArray = Array.isArray(namespacesData) ? namespacesData : 
                             (namespacesData && Array.isArray(namespacesData.body) ? namespacesData.body : []);
      setNamespaces(namespacesArray);
      
      // Also refresh namespace details for all namespaces to update side panel
      console.log('Refreshing namespace details for side panel...');
      for (const namespace of namespacesArray) {
        if (namespace['namespace-id']) {
          await fetchNamespaceDetails(namespace['namespace-id']);
        }
      }
    } catch (error) {
      console.error('Error fetching namespaces:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        });
      } else {
        console.error('Unknown error type:', error);
      }
      setNamespaces([]);
    }

    try {
  // Fetch schemas
      const schemasRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/schema`);
      console.log('Schemas response status:', schemasRes.status);
      if (!schemasRes.ok) {
        throw new Error(`HTTP error! status: ${schemasRes.status}`);
      }
      const schemasData = await schemasRes.json();
      console.log('Schemas data received:', schemasData);
      // Fix: Handle both formats - direct array or wrapped in body
      const schemasArray = Array.isArray(schemasData) ? schemasData : 
                         (schemasData && Array.isArray(schemasData.body) ? schemasData.body : []);
      setSchemas(schemasArray);
    } catch (error) {
      console.error('Error fetching schemas:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        });
      } else {
        console.error('Unknown error type:', error);
      }
      setSchemas([]);
    }
  };

  // Fetch namespaces and schemas for SidePanel on mount
  useEffect(() => {
    const initialFetch = async () => {
      // Add a small delay to ensure backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchData();
    };
    initialFetch();
  }, []);

  // Hide body scrollbar on mount, restore on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Close secondary settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSecondarySettings && !target.closest('.relative')) {
        setShowSecondarySettings(false);
      }
    };

    if (showSecondarySettings) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSecondarySettings]);

  // Calculate tertiary sidebar top position dynamically
  useEffect(() => {
    const calculateTertiarySidebarTop = () => {
      if (typeof window !== 'undefined') {
        const tabBar = document.querySelector('.namespace-tab-bar');
        if (tabBar) {
          const rect = tabBar.getBoundingClientRect();
          setTertiarySidebarTop(rect.bottom);
        }
      }
    };

    calculateTertiarySidebarTop();
    window.addEventListener('resize', calculateTertiarySidebarTop);
    window.addEventListener('scroll', calculateTertiarySidebarTop);

    return () => {
      window.removeEventListener('resize', calculateTertiarySidebarTop);
      window.removeEventListener('scroll', calculateTertiarySidebarTop);
    };
  }, [activeTab]);

  // Disabled - We don't want separate tabs for accounts, methods, schemas
  // Everything should be shown within the namespace tab
  // useEffect(() => {
  //   const onOpenAllAccounts = (e: any) => { ... };
  //   const onOpenAllMethods = (e: any) => { ... };
  //   const onOpenCreateSchema = (e: any) => { ... };
  //   ...event listeners...
  // }, [namespaces, tabs]);

  // Fetch webhooks for a namespace
  const fetchNamespaceWebhooks = async (namespaceId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/webhooks/namespace/${namespaceId}`);
      if (!res.ok) throw new Error('Failed to fetch webhooks');
      const data = await res.json();
      setWebhooksMap(prev => ({ ...prev, [namespaceId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      setWebhooksMap(prev => ({ ...prev, [namespaceId]: [] }));
    }
  };

  // Fetch lambdas for a namespace
  const fetchNamespaceLambdas = async (namespaceId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/workspace/lambdas/${namespaceId}`);
      if (!res.ok) throw new Error('Failed to fetch lambdas');
      const data = await res.json();
      setLambdasMap(prev => ({ ...prev, [namespaceId]: Array.isArray(data.lambdas) ? data.lambdas : [] }));
    } catch (err) {
      setLambdasMap(prev => ({ ...prev, [namespaceId]: [] }));
    }
  };

  // Update fetchNamespaceDetails to also fetch webhooks and lambdas
  const fetchNamespaceDetails = async (namespaceId: string) => {
    try {
      const [accountsRes, methodsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/namespaces/${namespaceId}/accounts`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/namespaces/${namespaceId}/methods`)
      ]);
      const [accounts, methods] = await Promise.all([
        accountsRes.json(),
        methodsRes.json()
      ]);
      setNamespaceDetailsMap(prev => ({ ...prev, [namespaceId]: { accounts, methods } }));
      // Fetch webhooks and lambdas for this namespace
      fetchNamespaceWebhooks(namespaceId);
      fetchNamespaceLambdas(namespaceId);
    } catch (err) {
      // handle error
    }
  };

  // SidePanel handlers
  const handleSidePanelClick = (type: 'namespace' | 'account' | 'schema' | 'method', data: any) => {
    if (type === 'namespace') {
      setNamespaceModal({ isOpen: true, namespace: data });
    } else if (type === 'account') {
      // Set secondary tab to accounts and navigate to namespace tab
      const ns = namespaces.find(ns => ns['namespace-id'] === data['namespace-id']);
      if (ns) {
        setSecondaryTab('accounts');
        handleSidePanelAdd('singleNamespace', ns);
      }
    } else if (type === 'method') {
      // Set secondary tab to methods and navigate to namespace tab
      const ns = namespaces.find(ns => ns['namespace-id'] === data['namespace-id']);
      if (ns) {
        setSecondaryTab('methods');
        handleSidePanelAdd('singleNamespace', ns);
      }
      return;
    } else if (type === 'schema') {
      // Set secondary tab to schemas and navigate to namespace tab
      const ns = data.namespace || namespaces.find(ns => ns['namespace-id'] === data.namespaceId);
      if (ns) {
        setSecondaryTab('schemas');
        handleSidePanelAdd('singleNamespace', ns);
      }
      return;
    }
  };
  const handleSidePanelAdd = (type: string, parentData?: any) => {
    if (type === 'namespace') {
      setNamespaceModal({ isOpen: true, namespace: null });
    } else if (type === 'account') {
      // Open all accounts tab with create panel
      const ns = parentData || namespaces[0];
      const key = ns ? `allAccounts-${ns['namespace-id']}` : 'allAccounts';
      setSecondaryTab('accounts');
      // Don't add to tabs array (hidden from tab bar)
      setActiveTab(key);
      setAllAccountsTabs(prev => {
        const exists = prev.find(t => t.key === key);
        if (exists) {
          return prev.map(t => t.key === key ? { ...t, openCreate: true, timestamp: Date.now() } : t);
        }
        return [...prev, { key, namespace: ns, openCreate: true, timestamp: Date.now() }];
      });
      return;
    } else if (type === 'method') {
      // Open all methods tab with create panel
      const ns = parentData || namespaces[0];
      const key = ns ? `allMethods-${ns['namespace-id']}` : 'allMethods';
      setSecondaryTab('methods');
      // Don't add to tabs array (hidden from tab bar)
      setActiveTab(key);
      setAllMethodsTabs(prev => {
        const exists = prev.find(t => t.key === key);
        if (exists) {
          return prev.map(t => t.key === key ? { ...t, openCreate: true, timestamp: Date.now() } : t);
        }
        return [...prev, { key, namespace: ns, openCreate: true, timestamp: Date.now() }];
      });
      return;
    } else if (type === 'schema') {
      // Open schema creation page
      const ns = parentData || namespaces[0];
      const nsId = ns?.['namespace-id'] || '';
      const nsName = ns?.['namespace-name'] || '';
      const key = `schema-create-${nsId}`;
      setSecondaryTab('schemas');
      // Don't add to tabs array (hidden from tab bar)
      setActiveTab(key);
      setSchemaPageTabs(prev => {
        const exists = prev.find(t => t.key === key);
        if (exists) {
          return prev.map(t => t.key === key ? { ...t, mode: 'create', namespace: ns, timestamp: Date.now() } : t);
        }
        return [...prev, { key, mode: 'create', namespace: ns, timestamp: Date.now() }];
      });
      return;
    } else if (type === 'webhook') {
      // Open all webhooks tab with create panel
      const ns = parentData || namespaces[0];
      const key = ns ? `allWebhooks-${ns['namespace-id']}` : 'allWebhooks';
      setSecondaryTab('webhooks');
      // Don't add to tabs array (hidden from tab bar)
      setActiveTab(key);
      setAllWebhooksTabs(prev => {
        const exists = prev.find(t => t.key === key);
        if (exists) {
          return prev.map(t => t.key === key ? { ...t, openCreate: true, timestamp: Date.now() } : t);
        }
        return [...prev, { key, namespace: ns, openCreate: true, timestamp: Date.now() }];
      });
      return;
    } else if (type === 'lambda') {
      // Open all lambdas tab with create panel
      const ns = parentData || namespaces[0];
      const key = ns ? `allLambdas-${ns['namespace-id']}` : 'allLambdas';
      setSecondaryTab('lambdas');
      // Don't add to tabs array (hidden from tab bar)
      setActiveTab(key);
      setAllLambdasTabs(prev => {
        const exists = prev.find(t => t.key === key);
        if (exists) {
          return prev.map(t => t.key === key ? { ...t, openCreate: true, timestamp: Date.now() } : t);
        }
        return [...prev, { key, namespace: ns, openCreate: true, timestamp: Date.now() }];
      });
      return;
    } else if (type === 'allAccounts') {
      // Open All Accounts page directly
      if (parentData) {
        const key = `allAccounts-${parentData['namespace-id']}`;
        const namespaceTabKey = `namespace-${parentData['namespace-id']}`;
        
        if (!tabs.find(tab => tab.key === namespaceTabKey)) {
          setTabs([...tabs, { key: namespaceTabKey, label: parentData['namespace-name'], pinned: false }]);
        }
        
        setSecondaryTab('accounts');
        setActiveTab(key);
        setAllAccountsTabs(prev => {
          const exists = prev.find(t => t.key === key);
          if (exists) return prev;
          return [...prev, { key, namespace: parentData, openCreate: false }];
        });
        setCurrentNamespace(parentData);
      }
      return;
    } else if (type === 'allMethods') {
      // Open All Methods page directly
      if (parentData) {
        const key = `allMethods-${parentData['namespace-id']}`;
        const namespaceTabKey = `namespace-${parentData['namespace-id']}`;
        
        if (!tabs.find(tab => tab.key === namespaceTabKey)) {
          setTabs([...tabs, { key: namespaceTabKey, label: parentData['namespace-name'], pinned: false }]);
        }
        
        setSecondaryTab('methods');
        setActiveTab(key);
        setAllMethodsTabs(prev => {
          const exists = prev.find(t => t.key === key);
          if (exists) return prev;
          return [...prev, { key, namespace: parentData, openCreate: false }];
        });
        setCurrentNamespace(parentData);
      }
      return;
    } else if (type === 'accountPage' && parentData?.account) {
      const key = `accountPage-${parentData.account['namespace-account-id']}`;
      // Set secondary tab to accounts
      setSecondaryTab('accounts');
      // Set active tab to account page (will render but not show in tab bar)
      setActiveTab(key);
      setAccountPageTabs(prev => {
        if (prev.find(t => t.key === key)) return prev;
        return [...prev, { key, account: parentData.account, namespace: parentData.namespace }];
      });
      // Set current namespace context
      if (parentData.namespace) {
        setCurrentNamespace(parentData.namespace);
      }
      return;
    } else if (type === 'methodPage' && parentData?.method) {
      const key = `methodPage-${parentData.method['namespace-method-id']}`;
      // Set secondary tab to methods
      setSecondaryTab('methods');
      // Set active tab to method page (will render but not show in tab bar)
      setActiveTab(key);
      setMethodPageTabs(prev => {
        if (prev.find(t => t.key === key)) return prev;
        return [...prev, { key, method: parentData.method, namespace: parentData.namespace }];
      });
      // Set current namespace context
      if (parentData.namespace) {
        setCurrentNamespace(parentData.namespace);
      }
      return;
    } else if (type === 'allSchemas') {
      // Open All Schemas page directly
      if (parentData) {
        const key = `all-schemas-${parentData['namespace-id']}`;
        const namespaceTabKey = `namespace-${parentData['namespace-id']}`;
        
        if (!tabs.find(tab => tab.key === namespaceTabKey)) {
          setTabs([...tabs, { key: namespaceTabKey, label: parentData['namespace-name'], pinned: false }]);
        }
        
        setSecondaryTab('schemas');
        setActiveTab(key);
        setAllSchemasTabs(prev => {
          const exists = prev.find(t => t.key === key);
          if (exists) return prev;
          return [...prev, { key, namespace: parentData, openCreate: false }];
        });
        setCurrentNamespace(parentData);
      }
      return;
    } else if (type === 'singleNamespace') {
      console.log('Opening namespace - redirecting to All Accounts:', parentData);
      // Instead of opening SingleNamespacePage, directly open AllAccountPage
      const key = `allAccounts-${parentData['namespace-id']}`;
      
      // Add main namespace tab for tab bar display
      const namespaceTabKey = `namespace-${parentData['namespace-id']}`;
      if (!tabs.find(tab => tab.key === namespaceTabKey)) {
        setTabs([...tabs, { key: namespaceTabKey, label: parentData['namespace-name'], pinned: false }]);
      }
      
      // Set the All Accounts page as active
      setActiveTab(key);
      setAllAccountsTabs(prev => {
        const exists = prev.find(t => t.key === key);
        if (exists) return prev;
        return [...prev, { key, namespace: parentData, openCreate: false }];
      });
      
      // Set current namespace context
      console.log('Setting current namespace context:', parentData);
      setCurrentNamespace(parentData);
      // Set to accounts tab by default
      setSecondaryTab('accounts');
      return;
    } else if (type === 'allWebhooks') {
      // Open All Webhooks page directly
      if (parentData) {
        const key = `allWebhooks-${parentData['namespace-id']}`;
        const namespaceTabKey = `namespace-${parentData['namespace-id']}`;
        
        if (!tabs.find(tab => tab.key === namespaceTabKey)) {
          setTabs([...tabs, { key: namespaceTabKey, label: parentData['namespace-name'], pinned: false }]);
        }
        
        setSecondaryTab('webhooks');
        setActiveTab(key);
        setAllWebhooksTabs(prev => {
          const exists = prev.find(t => t.key === key);
          if (exists) return prev;
          return [...prev, { key, namespace: parentData, openCreate: false }];
        });
        setCurrentNamespace(parentData);
      }
      return;
    } else if (type === 'webhookPage' && parentData?.webhook) {
      const key = `webhookPage-${parentData.webhook['webhook-id']}`;
      // Set secondary tab to webhooks
      setSecondaryTab('webhooks');
      // Set active tab to webhook page (will render but not show in tab bar)
      setActiveTab(key);
      setWebhookPageTabs(prev => {
        if (prev.find(t => t.key === key)) return prev;
        return [...prev, { key, webhook: parentData.webhook, namespace: parentData.namespace }];
      });
      // Set current namespace context
      if (parentData.namespace) {
        setCurrentNamespace(parentData.namespace);
      }
      return;
    } else if (type === 'allLambdas') {
      // Open All Lambdas page directly
      if (parentData) {
        const key = `allLambdas-${parentData['namespace-id']}`;
        const namespaceTabKey = `namespace-${parentData['namespace-id']}`;
        
        if (!tabs.find(tab => tab.key === namespaceTabKey)) {
          setTabs([...tabs, { key: namespaceTabKey, label: parentData['namespace-name'], pinned: false }]);
        }
        
        setSecondaryTab('lambdas');
        setActiveTab(key);
        setAllLambdasTabs(prev => {
          const exists = prev.find(t => t.key === key);
          if (exists) return prev;
          return [...prev, { key, namespace: parentData, openCreate: false }];
        });
        setCurrentNamespace(parentData);
      }
      return;
    } else if (type === 'lambdaPage' && parentData?.lambda) {
      const key = `lambdaPage-${parentData.lambda.id}`;
      // Set secondary tab to lambdas
      setSecondaryTab('lambdas');
      // Set active tab to lambda page (will render but not show in tab bar)
      setActiveTab(key);
      setLambdaPageTabs(prev => {
        if (prev.find(t => t.key === key)) return prev;
        return [...prev, { key, lambda: parentData.lambda, namespace: parentData.namespace }];
      });
      // Set current namespace context
      if (parentData.namespace) {
        setCurrentNamespace(parentData.namespace);
      }
      return;
    }
  };

  // Function to open SingleNamespacePage tab
  const handleOpenNamespaceTab = (namespace: any) => {
    handleSidePanelAdd('singleNamespace', namespace);
  };

  // Filter function to show only namespace tabs in tab bar
  const shouldShowInTabBar = (tabKey: string) => {
    return tabKey === 'overview' || tabKey.startsWith('singleNamespace-') || tabKey.startsWith('namespace-');
  };

  // Helper function to get current namespace and determine if secondary tab bar should show
  const getCurrentNamespaceForSecondaryBar = () => {
    // Check if current tab is a singleNamespace tab
    if (activeTab.startsWith('singleNamespace-')) {
      return singleNamespaceTabs.find(t => t.key === activeTab)?.namespace;
    }
    
    // Check if current tab is an account page
    const accountTab = accountPageTabs.find(t => t.key === activeTab);
    if (accountTab) return accountTab.namespace;
    
    // Check if current tab is a method page
    const methodTab = methodPageTabs.find(t => t.key === activeTab);
    if (methodTab) return methodTab.namespace;
    
    // Check if current tab is a schema page
    const schemaTab = schemaPageTabs.find(t => t.key === activeTab);
    if (schemaTab) return schemaTab.namespace;
    
    // Check if current tab is a webhook page
    const webhookTab = webhookPageTabs.find(t => t.key === activeTab);
    if (webhookTab) return webhookTab.namespace;
    
    // Check if current tab is a lambda page
    const lambdaTab = lambdaPageTabs.find(t => t.key === activeTab);
    if (lambdaTab) return lambdaTab.namespace;
    
    // Check if current tab is an allAccounts tab
    const allAccountsTab = allAccountsTabs.find(t => t.key === activeTab);
    if (allAccountsTab) return allAccountsTab.namespace;
    
    // Check if current tab is an allMethods tab
    const allMethodsTab = allMethodsTabs.find(t => t.key === activeTab);
    if (allMethodsTab) return allMethodsTab.namespace;
    
    // Check if current tab is an allSchemas tab
    const allSchemasTab = allSchemasTabs.find(t => t.key === activeTab);
    if (allSchemasTab) return allSchemasTab.namespace;
    
    // Check if current tab is an allWebhooks tab
    const allWebhooksTab = allWebhooksTabs.find(t => t.key === activeTab);
    if (allWebhooksTab) return allWebhooksTab.namespace;
    
    // Check if current tab is an allLambdas tab
    const allLambdasTab = allLambdasTabs.find(t => t.key === activeTab);
    if (allLambdasTab) return allLambdasTab.namespace;
    
    // Check if current tab is a method test tab
    const methodTestTab = methodTestTabs.find(t => t.key === activeTab);
    if (methodTestTab) return methodTestTab.namespace;
    
    return null;
  };

  // Bidirectional sync
  useEffect(() => {
    setJsonSchema(JSON.stringify(fieldsToSchema(fields), null, 2));
    // eslint-disable-next-line
  }, [fields]);

  const handleValidate = async (fieldsArg: any[], jsonSchemaArg: string) => {
    setValidationResult(null);
    try {
      const parsed = JSON.parse(jsonSchemaArg);
      setJsonError(null);
      // Make API call to validate schema
      const response = await fetch('http://localhost:5000/schema/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schema: parsed })
      });
      if (!response.ok) {
        throw new Error('Validation failed');
      }
      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      console.error('Error validating schema:', error);
      setJsonError('Invalid JSON or validation failed');
      setValidationResult({ valid: false, message: 'Validation failed. Please check your schema.' });
    }
  };

  const handleSave = async (fieldsArg: any[], jsonSchemaArg: string) => {
    if (!schemaName.trim()) {
      setSaveMessage('Schema name is required.');
      return;
    }
    try {
      const parsed = JSON.parse(jsonSchemaArg);
      setJsonError(null);
      // Make API call to save schema
      const response = await fetch('http://localhost:5000/schema/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemaName: schemaName.trim(),
          schema: parsed
        })
      });
      if (!response.ok) {
        throw new Error('Failed to save schema');
      }
      const result = await response.json();
      if (result && (result.schemaId || result.id)) {
        setSaveMessage('Schema created successfully!');
        setShowModal(false);
        resetForm();
      } else {
        setSaveMessage(result?.error || 'Failed to save schema. Please try again.');
      }
    } catch (error) {
      console.error('Error saving schema:', error);
      setJsonError('Invalid JSON or save failed');
      setSaveMessage('Failed to save schema. Please try again.');
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonSchema(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      setJsonError(null);
      setFields(schemaToFields(parsed));
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  const resetForm = () => {
    setSchemaName('');
    setJsonSchema('{}');
    setFields([]);
    setJsonError(null);
    setRawFields('');
    setRawFieldsError(null);
    setCollapsedNodes(new Set());
    setValidationResult(null);
    setSaveMessage('');
  };

  // Function to open modal from LLMTerminal
  const openSchemaModal = (name: string, schema: any) => {
    setSchemaName(name);
    setJsonSchema(JSON.stringify(schema, null, 2));
    setFields(schemaToFields(schema));
    setShowModal(true);
  };

  // On mount, update from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('brhm-last-tab', activeTab);
    }
  }, [activeTab]);

 

  const handleSaveNamespace = async (namespaceData: any) => {
    try {
      const isEdit = !!namespaceData["namespace-id"];
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/namespaces/${namespaceData["namespace-id"]}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/namespaces`;
      const method = isEdit ? 'PUT' : 'POST';
      
      // Check if it's FormData (has icon) or regular object
      const isFormData = namespaceData instanceof FormData;
      
      const headers: Record<string, string> = {};
      let body: string | FormData;
      
      if (isFormData) {
        // Handle FormData for file upload
        body = namespaceData;
        // Don't set Content-Type header for FormData, let browser set it with boundary
        
        // Log FormData contents
        console.log('=== NAMESPACE CREATE/UPDATE REQUEST ===');
        console.log('URL:', url);
        console.log('Method:', method);
        console.log('Content-Type: multipart/form-data (auto-set by browser)');
        console.log('FormData contents:');
        for (let [key, value] of namespaceData.entries()) {
          if (key === 'icon') {
            console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes, ${value.type})` : value);
          } else {
            console.log(`${key}:`, value);
          }
        }
      } else {
        // Handle regular JSON data
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          "namespace-name": namespaceData["namespace-name"],
          "namespace-url": namespaceData["namespace-url"],
          "tags": namespaceData.tags || []
        });
        
        // Log JSON request
        console.log('=== NAMESPACE CREATE/UPDATE REQUEST ===');
        console.log('URL:', url);
        console.log('Method:', method);
        console.log('Headers:', headers);
        console.log('Body:', body);
      }

      console.log('Sending request...');
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      console.log('=== NAMESPACE CREATE/UPDATE RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Response Body:', errorText);
        throw new Error(`Failed to save namespace: ${response.status} ${response.statusText}`);
      }

      const savedNamespace = await response.json();
      console.log('Success Response Body:', savedNamespace);
      
      // Refresh all data from the server to ensure side panel is updated
      await fetchData();
      
      setNamespaceModal({ isOpen: false, namespace: null });
    } catch (error) {
      console.error('Error saving namespace:', error);
      throw error;
    }
  };

  const handleDeleteNamespace = async (namespace: any) => {
    if (!namespace || !namespace["namespace-id"]) return;
    if (!window.confirm('Are you sure you want to delete this namespace?')) return;
    try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/namespaces/${namespace["namespace-id"]}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete namespace');
      }
      setNamespaces(prev => prev.filter(ns => ns["namespace-id"] !== namespace["namespace-id"]));
      setNamespaceModal({ isOpen: false, namespace: null });
      // Optionally clear details
      setPreviewAccount(null);
      setPreviewMethod(null);
      setPreviewSchema(null);
    } catch (error) {
      alert('Failed to delete namespace');
      console.error('Error deleting namespace:', error);
    }
  };

  const handleAddTab = () => {
    const newKey = `tab-${tabs.length + 1}`;
    setTabs([...tabs, { key: newKey, label: 'New Tab', pinned: false }]);
    setActiveTab(newKey);
  };

  const handleCloseTab = (key: string) => {
    const tab = tabs.find(t => t.key === key);
    if (tab && tab.pinned) return; // Prevent closing pinned tabs
    const filteredTabs = tabs.filter(tab => tab.key !== key);
    setTabs(filteredTabs);
    
    // If closing a namespace- tab, also close all its associated All pages
    if (key.startsWith('namespace-')) {
      const namespaceId = key.replace('namespace-', '');
      setAllAccountsTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
      setAllMethodsTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
      setAllSchemasTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
      setAllWebhooksTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
      setAllLambdasTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
      setAccountPageTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
      setMethodPageTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
      setSchemaPageTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
      setWebhookPageTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
      setLambdaPageTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
      setMethodTestTabs(prev => prev.filter(t => t.namespace?.['namespace-id'] !== namespaceId));
    }
    
    if (activeTab === key) {
      setActiveTab('overview');
    }
    // Remove closed tab's state from all tab arrays
    setAllAccountsTabs(prev => prev.filter(t => t.key !== key));
    setAllMethodsTabs(prev => prev.filter(t => t.key !== key));
    setAccountPageTabs(prev => prev.filter(t => t.key !== key));
    setMethodPageTabs(prev => prev.filter(t => t.key !== key));
    setSchemaPageTabs(prev => prev.filter(t => t.key !== key));
  };

  // --- NewTabContent moved inside component to access handleOpenTab ---
  function handleOpenTab(type: string) {
    if (type === 'schema') {
      // Open a tab for schema creation
      const key = 'schema';
      const existingTab = tabs.find(tab => tab.key === key);
      if (existingTab) {
        setActiveTab(key);
        return;
      }
      // If on a placeholder tab, replace it
      if (activeTab === 'new' || activeTab.startsWith('tab-')) {
        setTabs(prevTabs => prevTabs.map(tab =>
          tab.key === activeTab
            ? { key, label: 'New Schema', pinned: false }
            : tab
        ));
        setActiveTab(key);
        return;
      }
      setTabs([...tabs, { key, label: 'New Schema', pinned: false }]);
      setActiveTab(key);
      return;
    }
    const key = type;
    // If current tab is a 'New Tab' (key === 'new' or starts with 'tab-'), replace it or activate existing
    if (activeTab === 'new' || activeTab.startsWith('tab-')) {
      const existingTab = tabs.find(tab => tab.key === key);
      if (existingTab) {
        // Remove the placeholder tab and activate the existing one
        setTabs(prevTabs => prevTabs.filter(tab => tab.key !== activeTab));
        setActiveTab(key);
        return;
      }
      // Otherwise, replace the placeholder tab
      setTabs(prevTabs => prevTabs.map(tab =>
        tab.key === activeTab
          ? { key, label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`, pinned: false }
          : tab
      ));
      setActiveTab(key);
      return;
    }
    // Otherwise, open a new tab if it doesn't exist
    const existingTab = tabs.find(tab => tab.key === key);
    if (existingTab) {
      setActiveTab(key);
      return;
    }
    setTabs([...tabs, { key, label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`, pinned: false }]);
    setActiveTab(key);
  }

  function NewTabContent({ onOpenTab }: { onOpenTab: (type: string) => void }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex gap-6 mb-8 flex-wrap justify-center">
          <div className="flex flex-col items-center bg-white rounded-xl shadow p-8 w-56 hover:shadow-lg transition cursor-pointer" onClick={() => onOpenTab('namespace')}>
            <Database size={40} className="text-blue-400 mb-4" />
            <div className="font-semibold text-gray-800">New Namespace</div>
          </div>
          <div className="flex flex-col items-center bg-white rounded-xl shadow p-8 w-56 hover:shadow-lg transition cursor-pointer" onClick={() => onOpenTab('endpoint')}>
            <GitBranch size={40} className="text-pink-400 mb-4" />
            <div className="font-semibold text-gray-800">New Endpoint</div>
          </div>
          <div className="flex flex-col items-center bg-white rounded-xl shadow p-8 w-56 hover:shadow-lg transition cursor-pointer" onClick={() => onOpenTab('schema')}>
            <Box size={40} className="text-purple-400 mb-4" />
            <div className="font-semibold text-gray-800">New Schema</div>
          </div>
          <div className="flex flex-col items-center bg-white rounded-xl shadow p-8 w-56 hover:shadow-lg transition cursor-pointer" onClick={() => onOpenTab('markdown')}>
            <FileText size={40} className="text-blue-400 mb-4" />
            <div className="font-semibold text-gray-800">New Markdown</div>
          </div>
          <div className="flex flex-col items-center bg-white rounded-xl shadow p-8 w-56 hover:shadow-lg transition cursor-pointer" onClick={() => onOpenTab('request')}>
            <Zap size={40} className="text-blue-300 mb-4" />
            <div className="font-semibold text-gray-800">New Request</div>
          </div>
          <div 
            className="flex flex-col items-center bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow p-8 w-56 hover:shadow-lg transition cursor-pointer text-white" 
            onClick={() => {
              const key = 'ai-agent';
              if (!tabs.find(tab => tab.key === key)) {
                setTabs([...tabs, { key, label: 'AI Agent', pinned: false }]);
              }
              setActiveTab(key);
      
            }}
          >
    

          </div>
        </div>
        <div className="mb-4">
          <button className="text-gray-600 text-sm font-medium px-4 py-2 rounded hover:bg-gray-100 transition flex items-center gap-1">
            More <span className="text-lg">&#9660;</span>
          </button>
        </div>
        <div className="bg-purple-100 text-purple-700 px-6 py-3 rounded-full shadow text-sm font-medium flex items-center gap-2">
          Support importing Swagger, Postman, cURL and more.
          <button className="ml-2 text-purple-700 font-bold">×</button>
        </div>
      </div>
    );
  }

  // Disabled - schema tabs should not be created separately
  const handleOpenSchemaTabFromTest = (schema: any, schemaName: any, namespace: any, methodId?: string) => {
    // Do nothing - schemas managed within namespace tab
  };



  return (
    <div className="relative h-full w-full overflow-hidden">

      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col h-full w-full overflow-hidden">
    <div className="bg-[#f7f8fa] h-screen overflow-hidden">
            <div className="flex h-screen overflow-hidden">
        {/* Mobile Overlay */}
        {!isCollapsed && (
          <div 
            className="md:hidden fixed inset-0  bg-opacity-50 z-20"
            onClick={() => setIsCollapsed(true)}
          />
        )}

        {/* SidePanel (responsive) */}
        <div
          className={`${isCollapsed ? 'hidden' : 'block'} md:block fixed md:relative top-0 left-0 h-screen bg-transparent z-30 overflow-auto transition-all duration-300 ease-in-out ${
            isCollapsed 
              ? 'w-0 min-w-0 max-w-0 opacity-0 -translate-x-full md:translate-x-0' 
              : 'w-80 md:w-64 min-w-80 md:min-w-64 max-w-80 md:max-w-64 opacity-100 translate-x-0'
          }`}
        >
          {!isCollapsed && (
            <SidePanel
              namespaces={namespaces}
              accounts={accounts}
              schemas={schemas}
              methods={methods}
              webhooks={webhooksMap}
              lambdas={lambdasMap}
              onItemClick={handleSidePanelClick}
              onAdd={handleSidePanelAdd}
              fetchNamespaceDetails={fetchNamespaceDetails}
              selectedSchemaId={selectedSchemaId}
              refreshData={fetchData}
              onEditSchema={schema => {
                setShowSchemaModal(true);
                setPreviewSchema(null);
                setSelectedSchemaId(schema.id);
              }}
              onDeleteSchema={async (schema) => {
                if (confirm('Are you sure you want to delete this schema?')) {
                  try {
                          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/schema/${schema.id}`, {
                      method: 'DELETE',
                    });
                    if (!response.ok) throw new Error('Failed to delete schema');
                    setSchemas(schemas => schemas.filter(s => s.id !== schema.id));
                    setPreviewSchema(null);
                    setSelectedSchemaId(null);
                  } catch (error) {
                    console.error('Error deleting schema:', error);
                    alert('Failed to delete schema');
                  }
                }
              }}
                            onDeleteNamespace={handleDeleteNamespace}
          />
          )}
        </div>
        {/* Main Content */}
        <div 
          className="min-h-0 overflow-y-auto no-scrollbar transition-all duration-200 md:ml-0"
          style={{ 
            width: isCollapsed ? 'calc(100vw - 80px)' : 'calc(100vw - 336px)',
            flexShrink: 0
          }}
        >
               
                
                {/* Namespace Bar */}
                

                {/* Tab Layout: Horizontal or Vertical */}
                {tabLayout === 'horizontal' ? (
                  <>
                    <div className="border-b bg-white px-2 md:px-4 py-2 overflow-x-auto whitespace-nowrap relative scrollbar-thin-x namespace-tab-bar">
                      <div className="flex items-center gap-1" style={{ minWidth: 'fit-content', width: 'fit-content', display: 'inline-flex' }}>
                        {/* Sticky container for view button and Overview tab */}
                        <div className="sticky left-0 z-10 bg-white flex items-center pr-2" style={{ boxShadow: '2px 0 4px -2px rgba(0,0,0,0.04)' }}>
                          <button
                            className="px-2 py-2 rounded-full transition-colors text-gray-500 hover:bg-gray-100"
                            title={`Switch to ${tabLayout === 'horizontal' ? 'Vertical' : 'Horizontal'} Tabs View`}
                            onClick={() => setTabLayout(tabLayout === 'horizontal' ? 'vertical' : 'horizontal')}
                          >
                            {tabLayout === 'horizontal' ? <LayoutPanelLeft size={16} /> : <LayoutGrid size={16} />}
                          </button>
                          {tabs.filter(tab => tab.key === 'overview').map(tab => (
                <div key={tab.key} className="flex items-center group">
                  <button
                    className={`px-2 md:px-4 py-2 text-xs md:text-sm rounded-t-lg transition
                      ${activeTab === tab.key ? 'font-medium text-gray-700 border-b-2 border-blue-600 bg-white' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                                onClick={() => {
                                  setActiveTab(tab.key);
                                  // Clear namespace context if switching to overview or non-namespace tabs
                                  if (tab.key === 'overview' || tab.key === 'namespace' || tab.key === 'schemaService' || tab.key === 'tables' || tab.key === 'unifiedNamespace') {
                                    setCurrentNamespace(null);
                                  }
                                }}
                  >
                                {tab.label}
                  </button>
                            </div>
                          ))}
                          {/* Pinned tabs (sticky) - Only show namespace tabs */}
                          {tabs.filter(tab => tab.pinned && tab.key !== 'overview' && shouldShowInTabBar(tab.key)).map(tab => (
                            <div key={tab.key} className="flex items-center group">
                              <button
                                className={`px-2 md:px-4 py-2 text-xs md:text-sm rounded-t-lg transition
                                  ${activeTab === tab.key ? 'font-medium text-blue-700 border-b-2 border-blue-600 bg-white' : 'text-gray-700 hover:bg-gray-100'}
                                `}
                                onClick={() => {
                                  setActiveTab(tab.key);
                                  // Clear namespace context if switching to overview or non-namespace tabs
                                  if (tab.key === 'overview' || tab.key === 'namespace' || tab.key === 'schemaService' || tab.key === 'tables' || tab.key === 'unifiedNamespace') {
                                    setCurrentNamespace(null);
                                  }
                                }}
                              >
                                {tab.label}
                              </button>
                              <button
                                className="ml-1 text-yellow-500 hover:text-yellow-700 text-xs px-1 focus:outline-none"
                                onClick={() => setTabs(tabs => tabs.map(t => t.key === tab.key ? { ...t, pinned: false } : t))}
                                title="Unpin tab"
                              >
                                <Pin size={16} fill="currentColor" />
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* Scrollable tabs except Overview and pinned - Only show namespace tabs */}
                        {tabs.filter(tab => !tab.pinned && tab.key !== 'overview' && shouldShowInTabBar(tab.key)).map(tab => (
                          <div key={tab.key} className="flex items-center group">
                            <button
                              className={`px-2 md:px-4 py-2 text-xs md:text-sm rounded-t-lg transition
                                ${activeTab === tab.key ? 'font-medium text-gray-700 border-b-2 border-blue-600 bg-white' : 'text-gray-700 hover:bg-gray-100'}
                              `}
                              onClick={() => {
                                setActiveTab(tab.key);
                                // Clear namespace context if switching to overview or non-namespace tabs
                                if (tab.key === 'overview' || tab.key === 'namespace' || tab.key === 'schemaService' || tab.key === 'tables' || tab.key === 'unifiedNamespace') {
                                  setCurrentNamespace(null);
                                }
                              }}
                            >
                              {tab.label}
                            </button>
                            <button
                              className="ml-1 text-gray-400 hover:text-yellow-500 text-xs px-1 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                              onClick={() => setTabs(tabs => tabs.map(t => t.key === tab.key ? { ...t, pinned: true } : t))}
                              title="Pin tab"
                            >
                              <PinOff size={16} />
                            </button>
                    <button
                      className="ml-1 text-gray-400 hover:text-red-500 text-xs px-1 focus:outline-none"
                      onClick={() => handleCloseTab(tab.key)}
                      title="Close tab"
                              disabled={tab.pinned}
                              style={tab.pinned ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                    >
                      ×
                    </button>
                </div>
              ))}
              <button className="px-2 py-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <MoreHorizontal size={16} />
              </button>
            </div>
                    </div>

                    {/* Tertiary Sidebar (Third Level Navigation) - Show for all namespace-related pages */}
                    {(() => {
                      const currentNamespace = getCurrentNamespaceForSecondaryBar();
                      if (!currentNamespace) return null;
                      
                      const nsAccounts = currentNamespace ? (namespaceDetailsMap[currentNamespace['namespace-id']]?.accounts || []) : [];
                      const nsMethods = currentNamespace ? (namespaceDetailsMap[currentNamespace['namespace-id']]?.methods || []) : [];
                      const nsSchemas = currentNamespace ? schemas.filter(s => s.namespaceId === currentNamespace['namespace-id']) : [];
                      const nsWebhooks = currentNamespace ? (webhooksMap[currentNamespace['namespace-id']] || []) : [];
                      const nsLambdas = currentNamespace ? (lambdasMap[currentNamespace['namespace-id']] || []) : [];

                      return (
                        <div className="fixed left-[336px] bottom-0 w-56 bg-white border-r border-gray-200 shadow-lg z-30 overflow-y-auto tertiary-sidebar"
                          style={{
                            top: `${tertiarySidebarTop}px`
                          }}
                        >
                          {/* Header Section */}
                          <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white sticky top-0 z-10">
                            <div className="flex items-center gap-2 mb-2">
                              {currentNamespace?.['icon-url'] ? (
                                <img
                                  src={currentNamespace['icon-url']}
                                  alt={currentNamespace['namespace-name']}
                                  className="w-8 h-8 rounded-lg object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <Database size={16} className="text-gray-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-gray-900 truncate">{currentNamespace?.['namespace-name']}</div>
                              </div>
                            </div>
                            
                            {/* Namespace URL */}
                            {currentNamespace?.['namespace-url'] && (
                              <a
                                href={currentNamespace['namespace-url']}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 group truncate"
                                title={currentNamespace['namespace-url']}
                              >
                                <Globe size={10} />
                                <span className="truncate group-hover:underline">{currentNamespace['namespace-url']}</span>
                              </a>
                            )}
                            
                            {/* Search Bar */}
                            <div className="relative mt-2">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <Search size={12} className="text-gray-400" />
                              </div>
                              <input
                                type="text"
                                placeholder="Search..."
                                value={secondarySearchQuery}
                                onChange={(e) => setSecondarySearchQuery(e.target.value)}
                                className="w-full pl-7 pr-7 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              />
                              {secondarySearchQuery && (
                                <button
                                  onClick={() => setSecondarySearchQuery('')}
                                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Navigation Items */}
                          <div className="py-2">
                            {/* Accounts */}
                            <button
                              onClick={() => {
                                setSecondaryTab('accounts');
                                const key = `allAccounts-${currentNamespace['namespace-id']}`;
                                setActiveTab(key);
                                setAllAccountsTabs(prev => {
                                  const exists = prev.find(t => t.key === key);
                                  if (exists) return prev;
                                  return [...prev, { key, namespace: currentNamespace, openCreate: false }];
                                });
                              }}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                                secondaryTab === 'accounts'
                                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 text-blue-700'
                                  : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                secondaryTab === 'accounts' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'
                              }`}>
                                <User size={16} />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm">Accounts</div>
                                <div className="text-xs text-gray-500">{nsAccounts.length} items</div>
                              </div>
                            </button>

                            {/* Methods */}
                            <button
                              onClick={() => {
                                setSecondaryTab('methods');
                                const key = `allMethods-${currentNamespace['namespace-id']}`;
                                setActiveTab(key);
                                setAllMethodsTabs(prev => {
                                  const exists = prev.find(t => t.key === key);
                                  if (exists) return prev;
                                  return [...prev, { key, namespace: currentNamespace, openCreate: false }];
                                });
                              }}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                                secondaryTab === 'methods'
                                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 text-green-700'
                                  : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                secondaryTab === 'methods' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600'
                              }`}>
                                <Zap size={16} />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm">Methods</div>
                                <div className="text-xs text-gray-500">{nsMethods.length} items</div>
                              </div>
                            </button>

                            {/* Schemas */}
                            <button
                              onClick={() => {
                                setSecondaryTab('schemas');
                                const key = `all-schemas-${currentNamespace['namespace-id']}`;
                                setActiveTab(key);
                                setAllSchemasTabs(prev => {
                                  const exists = prev.find(t => t.key === key);
                                  if (exists) return prev;
                                  return [...prev, { key, namespace: currentNamespace, openCreate: false }];
                                });
                              }}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                                secondaryTab === 'schemas'
                                  ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 text-purple-700'
                                  : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                secondaryTab === 'schemas' ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-600'
                              }`}>
                                <FileText size={16} />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm">Schemas</div>
                                <div className="text-xs text-gray-500">{nsSchemas.length} items</div>
                              </div>
                            </button>

                            {/* Webhooks */}
                            <button
                              onClick={() => {
                                setSecondaryTab('webhooks');
                                const key = `allWebhooks-${currentNamespace['namespace-id']}`;
                                setActiveTab(key);
                                setAllWebhooksTabs(prev => {
                                  const exists = prev.find(t => t.key === key);
                                  if (exists) return prev;
                                  return [...prev, { key, namespace: currentNamespace, openCreate: false }];
                                });
                              }}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                                secondaryTab === 'webhooks'
                                  ? 'bg-gradient-to-r from-pink-50 to-pink-100 border-l-4 border-pink-500 text-pink-700'
                                  : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                secondaryTab === 'webhooks' ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-600'
                              }`}>
                                <GitBranch size={16} />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm">Webhooks</div>
                                <div className="text-xs text-gray-500">{nsWebhooks.length} items</div>
                              </div>
                            </button>

                            {/* Lambdas */}
                            <button
                              onClick={() => {
                                setSecondaryTab('lambdas');
                                const key = `allLambdas-${currentNamespace['namespace-id']}`;
                                setActiveTab(key);
                                setAllLambdasTabs(prev => {
                                  const exists = prev.find(t => t.key === key);
                                  if (exists) return prev;
                                  return [...prev, { key, namespace: currentNamespace, openCreate: false }];
                                });
                              }}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                                secondaryTab === 'lambdas'
                                  ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 border-l-4 border-indigo-500 text-indigo-700'
                                  : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                secondaryTab === 'lambdas' ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600'
                              }`}>
                                <Box size={16} />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm">Lambdas</div>
                                <div className="text-xs text-gray-500">{nsLambdas.length} items</div>
                              </div>
                            </button>
                          </div>

                          {/* Settings Button at Bottom */}
                          <div className="px-4 py-3 border-t border-gray-200 mt-auto sticky bottom-0 bg-white">
                            <div className="relative">
                              <button
                                onClick={() => setShowSecondarySettings(!showSecondarySettings)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Settings size={16} />
                                <span>Namespace Settings</span>
                              </button>
                              
                              {/* Settings Dropdown Menu */}
                              {showSecondarySettings && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(currentNamespace?.['namespace-id'] || '');
                                      setShowSecondarySettings(false);
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
                                      setShowSecondarySettings(false);
                                      const event = new CustomEvent('edit-namespace', { detail: currentNamespace });
                                      window.dispatchEvent(event);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                  >
                                    <Edit3 size={14} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowSecondarySettings(false);
                                      const event = new CustomEvent('duplicate-namespace', { detail: currentNamespace });
                                      window.dispatchEvent(event);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left"
                                  >
                                    <Copy size={14} />
                                    Duplicate
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowSecondarySettings(false);
                                      const event = new CustomEvent('delete-namespace', { detail: currentNamespace });
                                      window.dispatchEvent(event);
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
                      );
                    })()}

                    {/* Main Tab Content with responsive padding - adjusted for tertiary sidebar */}
                    <div className={`pr-2 md:pr-8 pt-2 md:pt-4 transition-all duration-200`}
                      style={{
                        marginLeft: getCurrentNamespaceForSecondaryBar() ? '224px' : '0', // w-56 = 224px
                        width: getCurrentNamespaceForSecondaryBar() 
                          ? 'calc(100% - 224px)' 
                          : '100%'
                      }}
                    >
                      {activeTab === 'overview' && (
                        <UnifiedNamespace
                          externalModalTrigger={sidePanelModal}
                          onModalClose={() => setSidePanelModal(null)}
                          fetchNamespaceDetails={fetchNamespaceDetails}
                          namespaceDetailsMap={namespaceDetailsMap}
                          setNamespaceDetailsMap={setNamespaceDetailsMap}
                          refreshData={async () => {
                            // re-fetch all data
                            await fetchData();
                            setNamespaceDetailsMap({});
                          }}
                          onOpenNamespaceTab={handleOpenNamespaceTab}
                          onAddItem={handleSidePanelAdd}
                          onViewAccount={(account, ns) => {
                            handleSidePanelAdd('accountPage', { account, namespace: ns });
                          }}
                          onViewMethod={(method, ns) => {
                            handleSidePanelAdd('methodPage', { method, namespace: ns });
                          }}
                          onViewSchema={(schema, ns) => {
                            const key = `schemaPage-${schema.id}`;
                            setSecondaryTab('schemas');
                            setActiveTab(key);
                            setSchemaPageTabs(prev => {
                              if (prev.find(t => t.key === key)) return prev;
                              return [...prev, { key, schema, mode: 'edit', initialSchemaName: schema.schemaName, namespace: ns }];
                            });
                          }}
                        />
                      )}
                      {activeTab === 'namespace' && <Namespace />}
                      {activeTab === 'schemaService' && <SchemaService />}
                      {activeTab === 'tables' && <Tables />}
                      {activeTab === 'unifiedNamespace' && (
                        <UnifiedNamespace
                          externalModalTrigger={sidePanelModal}
                          onModalClose={() => setSidePanelModal(null)}
                          fetchNamespaceDetails={fetchNamespaceDetails}
                          namespaceDetailsMap={namespaceDetailsMap}
                          setNamespaceDetailsMap={setNamespaceDetailsMap}
                          refreshData={async () => {
                            // re-fetch all data
                            await fetchData();
                            setNamespaceDetailsMap({});
                          }}
                          onOpenNamespaceTab={handleOpenNamespaceTab}
                          onAddItem={handleSidePanelAdd}
                          onViewAccount={(account, ns) => {
                            handleSidePanelAdd('accountPage', { account, namespace: ns });
                          }}
                          onViewMethod={(method, ns) => {
                            handleSidePanelAdd('methodPage', { method, namespace: ns });
                          }}
                          onViewSchema={(schema, ns) => {
                            const key = `schemaPage-${schema.id}`;
                            setSecondaryTab('schemas');
                            setActiveTab(key);
                            setSchemaPageTabs(prev => {
                              if (prev.find(t => t.key === key)) return prev;
                              return [...prev, { key, schema, mode: 'edit', initialSchemaName: schema.schemaName, namespace: ns }];
                            });
                          }}
                        />
                      )}
                      {activeTab === 'schema' && <SchemaCreatePage 
                        onSchemaNameChange={name => {
                          setTabs(tabs => tabs.map(tab =>
                            tab.key === 'schema'
                              ? { ...tab, label: name.trim() ? name : 'New Schema', pinned: false }
                              : tab
                          ));
                        }}
                        onSuccess={async () => {
                          await fetchData(); // Refresh side panel when schema is created
                        }}
                      />}
                      {(activeTab === 'new' || activeTab.startsWith('tab-')) && (
                        <NewTabContent onOpenTab={handleOpenTab} />
                      )}
                      {allAccountsTabs.map(({ key, namespace, openCreate, timestamp }) => (
                        <div
                          key={key}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <AllAccountPage
                            namespace={namespace}
                            openCreate={!!openCreate}
                            timestamp={timestamp}
                            refreshSidePanelData={fetchData}
                            onViewAccount={(account, ns) => {
                              handleSidePanelAdd('accountPage', { account, namespace: ns });
                            }}
                          />
                        </div>
                      ))}
                      {allMethodsTabs.map(({ key, namespace, openCreate, timestamp }) => (
                        <div
                          key={key}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <AllMethodPage
                            namespace={namespace}
                            openCreate={!!openCreate}
                            timestamp={timestamp}
                            refreshSidePanelData={fetchData}
                            onViewMethod={(method, ns) => {
                              handleSidePanelAdd('methodPage', { method, namespace: ns });
                            }}
                          />
                        </div>
                      ))}
                      {accountPageTabs.map(({ key, account, namespace, openEdit }) => (
                        <div
                          key={key}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <AccountPage account={account} namespace={namespace} openEdit={openEdit} refreshSidePanelData={fetchData} />
                        </div>
                      ))}
                      {methodPageTabs.map(({ key, method, namespace, openEdit }) => (
                        <div
                          key={key}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <MethodPage
                            method={method}
                            namespace={namespace}
                            openEdit={openEdit}
                            refreshSidePanelData={fetchData}
                            onTest={(m, ns) => {
                              const testKey = `methodTest-${m['namespace-method-id']}`;
                              setActiveTab(testKey);
                              setMethodTestTabs(prev => {
                                if (prev.find(t => t.key === testKey)) return prev;
                                return [...prev, { key: testKey, method: m, namespace: ns }];
                              });
                            }}
                          />
                        </div>
                      ))}
                      {methodTestTabs.map(({ key, method, namespace }) => (
                        <div
                          key={key}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <MethodTestPage
                            method={method}
                            namespace={namespace}
                            onOpenSchemaTab={(schema, schemaName) => handleOpenSchemaTabFromTest(schema, schemaName, namespace, method['namespace-method-id'])}
                            refreshSidePanelData={fetchData}
                          />
                        </div>
                      ))}
                      {schemaPageTabs.map(({ key, schema, mode, initialSchemaName, namespace, methodId, timestamp }) => (
                        <div
                          key={`${key}-${timestamp || 0}`}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <SchemaCreatePage
                            initialSchema={schema}
                            initialSchemaName={initialSchemaName}
                            namespace={namespace}
                            mode={mode === 'create' ? 'create' : (mode === 'preview' ? 'preview' : 'edit')}
                            methodId={methodId}
                            onSuccess={async () => {
                              // Always refresh side panel for both create and edit operations
                              await fetchData();
                              
                              if (mode === 'create' && namespace?.['namespace-id']) {
                                await fetchNamespaceDetails(namespace['namespace-id']);
                                
                                // Navigate back to All Schemas tab and close create tab
                                const allSchemasTabKey = `all-schemas-${namespace['namespace-id']}`;
                                if (tabs.find(tab => tab.key === allSchemasTabKey)) {
                                  setActiveTab(allSchemasTabKey);
                                  // Close the create schema tab
                                  setTabs(prev => prev.filter(tab => tab.key !== key));
                                  setSchemaPageTabs(prev => prev.filter(tab => tab.key !== key));
                                }
                              }
                            }}
                          />
                        </div>
                      ))}
                      {allSchemasTabs.map(({ key, namespace, openCreate, timestamp }) => (
                        <div
                          key={key}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <AllSchemaPage
                            namespace={namespace}
                            openCreate={!!openCreate}
                            timestamp={timestamp}
                            refreshSidePanelData={fetchData}
                            onViewSchema={(schema, ns) => {
                              const tabKey = `schema-preview-${schema.id}`;
                              setActiveTab(tabKey);
                              setSchemaPageTabs(prev => {
                                if (prev.find(t => t.key === tabKey)) return prev;
                                return [...prev, { key: tabKey, schema: schema, mode: 'preview', initialSchemaName: schema.schemaName, namespace: ns }];
                              });
                            }}
                            onEditSchema={(schema, ns) => {
                              const tabKey = `schema-edit-${schema.id}`;
                              setSecondaryTab('schemas');
                              setActiveTab(tabKey);
                              setSchemaPageTabs(prev => {
                                if (prev.find(t => t.key === tabKey)) return prev;
                                return [...prev, { key: tabKey, schema: schema, mode: 'edit', initialSchemaName: schema.schemaName, namespace: ns }];
                              });
                            }}
                            onCreateNew={() => {
                              const tabKey = `schema-create-${namespace?.['namespace-id'] || 'new'}`;
                              setSecondaryTab('schemas');
                              setActiveTab(tabKey);
                              setSchemaPageTabs(prev => {
                                if (prev.find(t => t.key === tabKey)) return prev;
                                return [...prev, { key: tabKey, mode: 'create', namespace: namespace }];
                              });
                            }}
                          />
                        </div>
                      ))}
                      {/* SingleNamespacePage removed - using dedicated All pages instead */}
                      {allWebhooksTabs.map(({ key, namespace, openCreate, timestamp }) => (
                        <div
                          key={key}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <AllWebhookPage
                            namespace={namespace}
                            openCreate={!!openCreate}
                            timestamp={timestamp}
                            onViewWebhook={(webhook, ns) => {
                              // (Optional) Open single webhook tab here
                            }}
                          />
                        </div>
                      ))}
                      {webhookPageTabs.map(({ key, webhook, namespace }) => (
                        <div
                          key={key}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <WebhookPage webhook={webhook} namespace={namespace} />
                        </div>
                      ))}
                      {allLambdasTabs.map(({ key, namespace, openCreate, timestamp }) => (
                        <div
                          key={key}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <AllLambdasPage
                            namespace={namespace}
                            openCreate={!!openCreate}
                            timestamp={timestamp}
                            onViewLambda={(lambda, ns) => {
                              // (Optional) Open single lambda tab here
                            }}
                          />
                        </div>
                      ))}
                      {lambdaPageTabs.map(({ key, lambda, namespace }) => (
                        <div
                          key={key}
                          style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
                        >
                          <LambdaPage lambda={lambda} namespace={namespace} />
                        </div>
                      ))}

                    </div>
                  </>
                ) : (
                  <div className="flex w-full h-full">
                    {/* Vertical Tabs */}
                    <div className="flex flex-col border-r bg-white py-2 px-1 min-w-[160px] max-w-[220px] w-[18vw] overflow-y-auto scrollbar-thin-x max-h-[90vh]">
                      <button
                        className="mb-2 px-2 py-2 rounded-full bg-blue-100 text-blue-700 transition-colors"
                        title="Switch to Horizontal Tabs View"
                        onClick={() => setTabLayout('horizontal')}
                      >
                        <LayoutGrid size={18} />
              </button>
                      {tabs.filter(tab => shouldShowInTabBar(tab.key)).map(tab => (
                        <div key={tab.key} className="flex items-center group mb-1">
                          <button
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition
                              ${activeTab === tab.key ? 'font-medium text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'}
                            `}
                            onClick={() => {
                              setActiveTab(tab.key);
                            }}
                          >
                            {tab.label}
              </button>
                          {/* Pin/unpin logic for vertical view */}
                          {tab.key !== 'overview' && !tab.pinned && (
                            <button
                              className="ml-1 text-gray-400 hover:text-yellow-500 text-xs px-1 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                              onClick={() => setTabs(tabs => tabs.map(t => t.key === tab.key ? { ...t, pinned: true } : t))}
                              title="Pin tab"
                            >
                              <PinOff size={16} />
                            </button>
                          )}
                          {tab.key !== 'overview' && tab.pinned && (
                            <button
                              className="ml-1 text-yellow-500 hover:text-yellow-700 text-xs px-1 focus:outline-none"
                              onClick={() => setTabs(tabs => tabs.map(t => t.key === tab.key ? { ...t, pinned: false } : t))}
                              title="Unpin tab"
                            >
                              <Pin size={16} fill="currentColor" />
                            </button>
                          )}
                          {tab.key !== 'overview' && (
                            <button
                              className="ml-1 text-gray-400 hover:text-red-500 text-xs px-1 focus:outline-none"
                              onClick={() => handleCloseTab(tab.key)}
                              title="Close tab"
                              disabled={tab.pinned}
                              style={tab.pinned ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                            >
                              ×
                            </button>
                          )}
            </div>
                      ))}
          </div>
                    
                    {/* Tab Content with Secondary Tab Bar */}
                    <div className="flex-1 min-h-0 overflow-y-auto transition-all duration-200 pl-4 pr-8 pt-4 flex flex-col">
                      {/* Secondary Tab Bar for Vertical Layout - Only show for namespace tabs */}
                      {activeTab.startsWith('singleNamespace-') && (() => {
                        const currentNamespace = singleNamespaceTabs.find(t => t.key === activeTab)?.namespace;
                        const nsAccounts = currentNamespace ? (namespaceDetailsMap[currentNamespace['namespace-id']]?.accounts || []) : [];
                        const nsMethods = currentNamespace ? (namespaceDetailsMap[currentNamespace['namespace-id']]?.methods || []) : [];
                        const nsSchemas = currentNamespace ? schemas.filter(s => s.namespaceId === currentNamespace['namespace-id']) : [];
                        const nsWebhooks = currentNamespace ? (webhooksMap[currentNamespace['namespace-id']] || []) : [];
                        const nsLambdas = currentNamespace ? (lambdasMap[currentNamespace['namespace-id']] || []) : [];

                        return (
                          <div className="mb-4 bg-white rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
                            <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-thin-x">
                              <button
                                className={`px-3 md:px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                  secondaryTab === 'accounts' 
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                                onClick={() => setSecondaryTab('accounts')}
                              >
                                <User size={14} />
                                <span className="font-medium">Accounts</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${secondaryTab === 'accounts' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                                  {nsAccounts.length}
                                </span>
                              </button>
                              
                              <button
                                className={`px-3 md:px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                  secondaryTab === 'methods' 
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                                }`}
                                onClick={() => setSecondaryTab('methods')}
                              >
                                <Zap size={14} />
                                <span className="font-medium">Methods</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${secondaryTab === 'methods' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                                  {nsMethods.length}
                                </span>
                              </button>
                              
                              <button
                                className={`px-3 md:px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                  secondaryTab === 'schemas' 
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md' 
                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                                }`}
                                onClick={() => setSecondaryTab('schemas')}
                              >
                                <FileText size={14} />
                                <span className="font-medium">Schemas</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${secondaryTab === 'schemas' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                                  {nsSchemas.length}
                                </span>
                              </button>

                              <button
                                className={`px-3 md:px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                  secondaryTab === 'webhooks' 
                                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md' 
                                    : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700'
                                }`}
                                onClick={() => setSecondaryTab('webhooks')}
                              >
                                <GitBranch size={14} />
                                <span className="font-medium">Webhooks</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${secondaryTab === 'webhooks' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                                  {nsWebhooks.length}
                                </span>
                              </button>

                              <button
                                className={`px-3 md:px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                  secondaryTab === 'lambdas' 
                                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md' 
                                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                                }`}
                                onClick={() => setSecondaryTab('lambdas')}
                              >
                                <Box size={14} />
                                <span className="font-medium">Lambdas</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${secondaryTab === 'lambdas' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                                  {nsLambdas.length}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex-1 min-h-0">
            {activeTab === 'overview' && (
              <UnifiedNamespace
                externalModalTrigger={sidePanelModal}
                onModalClose={() => setSidePanelModal(null)}
                fetchNamespaceDetails={fetchNamespaceDetails}
                namespaceDetailsMap={namespaceDetailsMap}
                setNamespaceDetailsMap={setNamespaceDetailsMap}
                refreshData={() => {
                  // re-fetch all data
                  setNamespaceDetailsMap({});
                  // trigger fetchData in useEffect
                  setNamespaces([]);
                }}
                onOpenNamespaceTab={handleOpenNamespaceTab}
                onAddItem={handleSidePanelAdd}
              />
            )}
            {activeTab === 'namespace' && <Namespace />}
            {activeTab === 'schemaService' && <SchemaService />}
            {activeTab === 'tables' && <Tables />}
            {activeTab === 'unifiedNamespace' && (
              <UnifiedNamespace
                externalModalTrigger={sidePanelModal}
                onModalClose={() => setSidePanelModal(null)}
                fetchNamespaceDetails={fetchNamespaceDetails}
                namespaceDetailsMap={namespaceDetailsMap}
                setNamespaceDetailsMap={setNamespaceDetailsMap}
                refreshData={() => {
                  // re-fetch all data
                  setNamespaceDetailsMap({});
                  // trigger fetchData in useEffect
                  setNamespaces([]);
                }}
                onOpenNamespaceTab={handleOpenNamespaceTab}
                onAddItem={handleSidePanelAdd}
              />
            )}
            {activeTab === 'schema' && <SchemaCreatePage 
              onSchemaNameChange={name => {
                setTabs(tabs => tabs.map(tab =>
                  tab.key === 'schema'
                    ? { ...tab, label: name.trim() ? name : 'New Schema', pinned: false }
                    : tab
                ));
              }}
              onSuccess={async () => {
                await fetchData(); // Refresh side panel when schema is created
              }}
            />}
            {(activeTab === 'new' || activeTab.startsWith('tab-')) && (
              <NewTabContent onOpenTab={handleOpenTab} />
            )}
                      {allAccountsTabs.map(({ key, namespace, openCreate, timestamp }) => (
              <div
                key={key}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <AllAccountPage
                  namespace={namespace}
                  openCreate={!!openCreate}
                  timestamp={timestamp}
                  refreshSidePanelData={fetchData}
                  onViewAccount={(account, ns) => {
                    handleSidePanelAdd('accountPage', { account, namespace: ns });
                  }}
                />
              </div>
            ))}
                      {allMethodsTabs.map(({ key, namespace, openCreate, timestamp }) => (
              <div
                key={key}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <AllMethodPage
                  namespace={namespace}
                  openCreate={!!openCreate}
                  timestamp={timestamp}
                  refreshSidePanelData={fetchData}
                  onViewMethod={(method, ns) => {
                    handleSidePanelAdd('methodPage', { method, namespace: ns });
                  }}
                />
              </div>
            ))}
            {accountPageTabs.map(({ key, account, namespace, openEdit }) => (
              <div
                key={key}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <AccountPage account={account} namespace={namespace} openEdit={openEdit} refreshSidePanelData={fetchData} />
              </div>
            ))}
            {methodPageTabs.map(({ key, method, namespace }) => (
              <div
                key={key}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <MethodPage
                  method={method}
                  namespace={namespace}
                  refreshSidePanelData={fetchData}
                  onTest={(m, ns) => {
                    const testKey = `methodTest-${m['namespace-method-id']}`;
                    setActiveTab(testKey);
                    setMethodTestTabs(prev => {
                      if (prev.find(t => t.key === testKey)) return prev;
                      return [...prev, { key: testKey, method: m, namespace: ns }];
                    });
                  }}
                />
              </div>
            ))}
            {methodTestTabs.map(({ key, method, namespace }) => (
              <div
                key={key}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <MethodTestPage
                  method={method}
                  namespace={namespace}
                  onOpenSchemaTab={(schema, schemaName) => handleOpenSchemaTabFromTest(schema, schemaName, namespace, method['namespace-method-id'])}
                  refreshSidePanelData={fetchData}
                />
              </div>
            ))}
            {schemaPageTabs.map(({ key, schema, mode, initialSchemaName, namespace, methodId, timestamp }) => (
              <div
                key={`${key}-${timestamp || 0}`}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <SchemaCreatePage
                  initialSchema={schema}
                  initialSchemaName={initialSchemaName}
                  namespace={namespace}
                  mode={mode === 'create' ? 'create' : (mode === 'preview' ? 'preview' : 'edit')}
                  methodId={methodId}
                  onSuccess={async () => {
                    // Always refresh side panel for both create and edit operations
                    await fetchData();
                    
                    if (mode === 'create' && namespace?.['namespace-id']) {
                      await fetchNamespaceDetails(namespace['namespace-id']);
                      
                      // Navigate back to All Schemas tab and close create tab
                      const allSchemasTabKey = `all-schemas-${namespace['namespace-id']}`;
                      if (tabs.find(tab => tab.key === allSchemasTabKey)) {
                        setActiveTab(allSchemasTabKey);
                        // Close the create schema tab
                        setTabs(prev => prev.filter(tab => tab.key !== key));
                        setSchemaPageTabs(prev => prev.filter(tab => tab.key !== key));
                      }
                    }
                  }}
                />
              </div>
            ))}
            {allSchemasTabs.map(({ key, namespace, openCreate, timestamp }) => (
              <div
                key={key}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <AllSchemaPage
                  namespace={namespace}
                  openCreate={!!openCreate}
                  timestamp={timestamp}
                  refreshSidePanelData={fetchData}
                  onViewSchema={(schema, ns) => {
                    const tabKey = `schema-preview-${schema.id}`;
                    if (!tabs.find(tab => tab.key === tabKey)) {
                                setTabs([...tabs, { key: tabKey, label: schema.schemaName || 'Schema Preview', pinned: false }]);
                    }
                    setActiveTab(tabKey);
                    setSchemaPageTabs(prev => {
                      if (prev.find(t => t.key === tabKey)) return prev;
                      return [...prev, { key: tabKey, schema: schema, mode: 'preview', initialSchemaName: schema.schemaName, namespace: ns }];
                    });
                  }}
                  onEditSchema={(schema, ns) => {
                    const tabKey = `schema-edit-${schema.id}`;
                    if (!tabs.find(tab => tab.key === tabKey)) {
                      setTabs([...tabs, { key: tabKey, label: `Edit: ${schema.schemaName}`, pinned: false }]);
                    }
                    setActiveTab(tabKey);
                    setSchemaPageTabs(prev => {
                      if (prev.find(t => t.key === tabKey)) return prev;
                      return [...prev, { key: tabKey, schema: schema, mode: 'edit', initialSchemaName: schema.schemaName, namespace: ns }];
                    });
                  }}
                  onCreateNew={() => {
                    const tabKey = `schema-create-${namespace?.['namespace-id'] || 'new'}`;
                    if (!tabs.find(tab => tab.key === tabKey)) {
                      setTabs([...tabs, { key: tabKey, label: 'New Schema', pinned: false }]);
                    }
                    setActiveTab(tabKey);
                    setSchemaPageTabs(prev => {
                      if (prev.find(t => t.key === tabKey)) return prev;
                      return [...prev, { key: tabKey, mode: 'create', namespace: namespace }];
                    });
                  }}
                />
              </div>
            ))}
            {/* SingleNamespacePage removed - using dedicated All pages instead */}
            {allWebhooksTabs.map(({ key, namespace, openCreate, timestamp }) => (
              <div
                key={key}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <AllWebhookPage
                  namespace={namespace}
                  openCreate={!!openCreate}
                  timestamp={timestamp}
                  onViewWebhook={(webhook, ns) => {
                    // (Optional) Open single webhook tab here
                  }}
                />
              </div>
            ))}
            {webhookPageTabs.map(({ key, webhook, namespace }) => (
              <div
                key={key}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <WebhookPage webhook={webhook} namespace={namespace} />
              </div>
            ))}
            {allLambdasTabs.map(({ key, namespace, openCreate, timestamp }) => (
              <div
                key={key}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <AllLambdasPage
                  namespace={namespace}
                  openCreate={!!openCreate}
                  timestamp={timestamp}
                  onViewLambda={(lambda, ns) => {
                    // (Optional) Open single lambda tab here
                  }}
                />
              </div>
            ))}
            {lambdaPageTabs.map(({ key, lambda, namespace }) => (
              <div
                key={key}
                style={{ display: activeTab === key ? 'block' : 'none', width: '100%', height: '100%' }}
              >
                <LambdaPage lambda={lambda} namespace={namespace} />
              </div>
            ))}
            {activeTab !== 'overview' &&
              activeTab !== 'namespace' &&
              activeTab !== 'schemaService' &&
              activeTab !== 'tables' &&
              activeTab !== 'unifiedNamespace' &&
              activeTab !== 'new' &&
              !activeTab.startsWith('tab-') && (
                <div className="text-gray-400 text-center py-20 text-lg">This is the <span className="font-semibold">{tabs.find(t => t.key === activeTab)?.label}</span> tab.</div>
            )}
                      </div>
                    </div>
                  </div>
                )}

          <SchemaPreviewModal
            open={!!previewSchema}
            onClose={() => setPreviewSchema(null)}
            schema={previewSchema}
            onEdit={schema => {
              setShowSchemaModal(true);
              setPreviewSchema(null);
            }}
            onDelete={async (schema) => {
              if (confirm('Are you sure you want to delete this schema?')) {
                try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/schema/${schema.id}`, {
                    method: 'DELETE',
                  });
                  if (!response.ok) throw new Error('Failed to delete schema');
                  setSchemas(schemas => schemas.filter(s => s.id !== schema.id));
                  setPreviewSchema(null);
                } catch (error) {
                  console.error('Error deleting schema:', error);
                  alert('Failed to delete schema');
                }
              }
            }}
          />
          <MethodPreviewModal
            isOpen={!!previewMethod}
            onClose={() => setPreviewMethod(null)}
            method={previewMethod}
            onEdit={method => {
              setMethodModal({ isOpen: true, method });
              setPreviewMethod(null);
            }}
            onTest={method => {
              setTestMethodModal({ isOpen: true, method });
              setPreviewMethod(null);
            }}
          />
          {previewAccount && (
            <div 
              className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setPreviewAccount(null)}
            >
              <div className="bg-white rounded-xl p-4 sm:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="text-blue-600" size={16} />
                    </div>
                    <h3 className="text-base sm:text-xl font-semibold truncate">{previewAccount["namespace-account-name"]}</h3>
                  </div>
                  <button
                    onClick={() => setPreviewAccount(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">ID</p>
                    <p className="text-xs sm:text-sm font-mono break-all">{previewAccount["namespace-account-id"]}</p>
                  </div>
                  {previewAccount["namespace-account-url-override"] && (
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">URL Override</p>
                      <p className="text-xs sm:text-sm font-mono break-all">{previewAccount["namespace-account-url-override"]}</p>
                    </div>
                  )}
                </div>
                {/* Add more account details as needed */}
              </div>
            </div>
          )}
              </div>
        </div>
      </div>

          <AccountModal
            isOpen={accountModal.isOpen}
            onClose={() => setAccountModal({ isOpen: false, account: null })}
            account={accountModal.account}
            namespaceId={namespaces[0]?.["namespace-id"] || ''}
            refreshNamespaceDetails={async () => {
              await fetchNamespaceDetails(namespaces[0]?.["namespace-id"]);
              await fetchData(); // Also refresh side panel
            }}
          />

          <MethodModal
            isOpen={methodModal.isOpen}
            onClose={() => setMethodModal({ isOpen: false, method: null })}
            method={methodModal.method}
            namespaceId={namespaces[0]?.["namespace-id"]}
            refreshNamespaceDetails={async () => {
              await fetchNamespaceDetails(namespaces[0]?.["namespace-id"]);
              await fetchData(); // Also refresh side panel
            }}
          />
     
      <NamespaceModal
        isOpen={namespaceModal.isOpen}
        onClose={() => setNamespaceModal({ isOpen: false, namespace: null })}
        onSave={handleSaveNamespace}
        namespace={namespaceModal.namespace}
      />

      <AccountPreviewModal
        isOpen={!!previewAccount}
        onClose={() => setPreviewAccount(null)}
        account={previewAccount}
        onEdit={account => {
              setAccountModal({ isOpen: true, account });
          setPreviewAccount(null);
        }}
        onDelete={async (account) => {
          if (confirm('Are you sure you want to delete this account?')) {
            try {
                  const response = await fetch(`/unified/accounts/${account["namespace-account-id"]}`, {
                method: 'DELETE',
              });
              if (!response.ok) throw new Error('Failed to delete account');
              await fetchNamespaceDetails(namespaces[0]?.["namespace-id"]);
              setPreviewAccount(null);
            } catch (error) {
              console.error('Error deleting account:', error);
              alert('Failed to delete account');
            }
          }
        }}
      />

      <MethodTestModal
        isOpen={testMethodModal.isOpen}
        onClose={() => setTestMethodModal({ isOpen: false, method: null })}
        namespaceId={testMethodModal.method?.['namespace-id'] || ''}
        methodName={testMethodModal.method?.['namespace-method-name'] || ''}
        methodType={testMethodModal.method?.['namespace-method-type'] || ''}
        namespaceMethodUrlOverride={testMethodModal.method?.['namespace-method-url-override'] || ''}
        saveData={!!testMethodModal.method?.['save-data']}
        methodId={testMethodModal.method?.['namespace-method-id'] || ''}
      />

      <UnifiedSchemaModal
        showModal={showSchemaModal}
        setShowModal={setShowSchemaModal}
        onSuccess={() => setShowSchemaModal(false)}
      />

      <SchemaPreviewModal
        open={!!previewSchema}
        onClose={() => setPreviewSchema(null)}
        schema={previewSchema}
        onEdit={schema => {
          setShowSchemaModal(true);
          setPreviewSchema(null);
        }}
        onDelete={async (schema) => {
          if (confirm('Are you sure you want to delete this schema?')) {
            try {
                  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/schema/${schema.id}`, {
                method: 'DELETE',
              });
              if (!response.ok) throw new Error('Failed to delete schema');
              setSchemas(schemas => schemas.filter(s => s.id !== schema.id));
              setPreviewSchema(null);
            } catch (error) {
              console.error('Error deleting schema:', error);
              alert('Failed to delete schema');
            }
          }
        }}
      />
        </div>
      </DndProvider>
    </div>
  );
}

export default NamespacePage;

/* Add this to the bottom of the file or in a global CSS file if not already present */
/* Custom scrollbar for tab bar */
<style jsx global>{`
  .scrollbar-thin::-webkit-scrollbar {
    height: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
`}</style>