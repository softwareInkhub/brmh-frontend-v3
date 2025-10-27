import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Send, File, Folder, Play, Database, Code, X, Upload, FileText, Image, Archive, Cloud, Download, RefreshCw } from 'lucide-react';
import { useDrop } from 'react-dnd';
import { useNamespaceContext } from '../../components/NamespaceContext';
import APIMethodCreationAgent from './APIMethodCreationAgent';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: string;
  files?: UploadedFile[];
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  url?: string;
  original?: File;
}

interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: ProjectFile[];
  content?: string;
}

interface AIAgentWorkspaceProps {
  namespace?: any;
  onClose: () => void;
}

interface WorkspaceState {
  files: any[];
  schemas: any[];
  apis: any[];
  projectType: string;
  lastGenerated?: string;
}

// Helper function to get error suggestions based on error type
const getErrorSuggestions = (errorType: string): string => {
  switch (errorType) {
    case 'invalid_request':
      return `**Suggestions:**
• Check if the AI service API key is properly configured
• Verify the request format is correct
• Try again in a few moments (rate limiting)
• Contact support if the issue persists`;
    case 'authentication_error':
      return `**Suggestions:**
• Verify the AI service API key is valid and active
• Check if the API key has the necessary permissions
• Ensure the API key hasn't expired`;
    case 'rate_limit_error':
      return `**Suggestions:**
• Wait a few moments before trying again
• Consider upgrading your API plan if you need higher limits
• Try breaking down large requests into smaller ones`;
    case 'server_error':
      return `**Suggestions:**
• The AI service may be temporarily unavailable
• Try again in a few minutes
• Check the service status page for updates`;
    default:
      return `**Suggestions:**
• Try again in a few moments
• Check your internet connection
• Contact support if the issue persists`;
  }
};

const AIAgentWorkspace: React.FC<AIAgentWorkspaceProps> = ({ namespace, onClose }) => {
  const { currentNamespace, setCurrentNamespace } = useNamespaceContext();
  // When context switches via drop, reflect it locally so effects use new namespace
  const [localNamespace, setLocalNamespace] = useState<any>(namespace || currentNamespace);
  useEffect(() => {
    setLocalNamespace(namespace || currentNamespace);
  }, [namespace, currentNamespace]);
  
  // State for multiple dropped namespaces
  const [droppedNamespaces, setDroppedNamespaces] = useState<any[]>([]);
  
  // State for collapsible generated code
  const [showGeneratedCode, setShowGeneratedCode] = useState(false);
  
  // State for resizable workspace
  const [workspaceWidth, setWorkspaceWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  console.log('AIAgentWorkspace rendered with props:', { namespace, onClose });
  // Force rebuild to ensure latest changes are applied
  
  // Add useEffect to log namespace changes
  useEffect(() => {
    console.log('Namespace changed:', namespace);
  }, [namespace]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setDragStartX(e.clientX);
    setDragStartWidth(workspaceWidth);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const deltaX = e.clientX - dragStartX;
    const newWidth = Math.max(400, Math.min(900, dragStartWidth - deltaX));
    setWorkspaceWidth(newWidth);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Add event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, dragStartX, dragStartWidth]);
  // 1. Change activeTab state to use 'lambda' instead of 'api'
  const [activeTab, setActiveTab] = useState<'chat' | 'console' | 'lambda' | 'schema' | 'api' | 'files' | 'deployment' | 'web-scraping'>('lambda');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI development assistant. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Namespace autocomplete state
  const [showNamespaceSuggestions, setShowNamespaceSuggestions] = useState(false);
  const [namespaceSuggestions, setNamespaceSuggestions] = useState<any[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [atSymbolPosition, setAtSymbolPosition] = useState(-1);
  
  // Fetch namespaces for autocomplete
  const [availableNamespaces, setAvailableNamespaces] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchNamespaces = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/unified/namespaces`);
        if (response.ok) {
          const data = await response.json();
          setAvailableNamespaces(data);
        }
      } catch (error) {
        console.error('Failed to fetch namespaces for autocomplete:', error);
      }
    };
    
    fetchNamespaces();
  }, []);
  
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => [
    {
      id: '1',
      name: 'api',
      type: 'folder',
      path: '/api',
      children: [
        { id: '2', name: 'users.js', type: 'file', path: '/api/users.js' },
        { id: '3', name: 'auth.js', type: 'file', path: '/api/auth.js' }
      ]
    },
    {
      id: '4',
      name: 'models',
      type: 'folder',
      path: '/models',
      children: [
        { id: '5', name: 'User.js', type: 'file', path: '/models/User.js' }
      ]
    },
    { id: '6', name: 'package.json', type: 'file', path: '/package.json' },
    { id: '7', name: 'README.md', type: 'file', path: '/README.md' }
  ]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [pendingSchemaSelection, setPendingSchemaSelection] = useState<{
    prompt: string;
    candidates: Array<{ id?: string; name?: string; schemaName?: string; namespaceId?: string; schema?: any }>;
  } | null>(null);

  // Helper: list schemas from backend, trying multiple endpoints for compatibility
  const listSchemas = async (nsId?: string | null): Promise<any[]> => {
    if (!nsId) return [];
    const endpoints: string[] = [
      `${API_BASE_URL}/unified/schema?namespaceId=${encodeURIComponent(nsId)}`,
      `${API_BASE_URL}/unified/schemas?namespaceId=${encodeURIComponent(nsId)}`,
      `${API_BASE_URL}/unified/schema/list?namespaceId=${encodeURIComponent(nsId)}`
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
          if (Array.isArray((data || {}).items)) return (data as any).items;
        }
      } catch {}
    }
    return [];
  };

  // Helper: get schemas from ALL namespaces in context
  const getAllSchemasFromContext = async (): Promise<{namespace: any, schemas: any[]}[]> => {
    const allNamespaces = [localNamespace, ...droppedNamespaces].filter(Boolean);
    const results = await Promise.all(
      allNamespaces.map(async (ns) => {
        const schemas = await listSchemas(ns['namespace-id'] || ns.id);
        return {
          namespace: ns,
          schemas: schemas
        };
      })
    );
    return results;
  };
  const [schemas, setSchemas] = useState<any[]>([]);
  const [rawSchemas, setRawSchemas] = useState<{ id: string; content: string }[]>([]);
  const [showRawSchema, setShowRawSchema] = useState<{ [key: number]: boolean }>({});
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [isTerminalLoading, setIsTerminalLoading] = useState(true);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [apiTestResults, setApiTestResults] = useState<{ [key: string]: any }>({});
  const [apiTestLoading, setApiTestLoading] = useState<{ [key: string]: boolean }>({});
  const [apiTestInput, setApiTestInput] = useState<{ [key: string]: string }>({});
  const [savingApi, setSavingApi] = useState<{ [key: string]: boolean }>({});
  const [savingSchema, setSavingSchema] = useState<{ [key: string]: boolean }>({});
  // Memory service state
  const [sessionId, setSessionId] = useState<string>('');
  const [userId] = useState<string>('default-user');
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
    files: [],
    schemas: [],
    apis: [],
    projectType: 'nodejs',
    lastGenerated: undefined
  });
  // 2. Add state for Lambda functions and Lambda creation form
  const [lambdaFunctions, setLambdaFunctions] = useState<any[]>([]);
  const [lambdaForm, setLambdaForm] = useState({
    functionName: '',
    runtime: 'nodejs18.x',
    handler: 'index.handler',
    memory: 128,
    timeout: 3,
    environment: '',
    description: '',
  });
  // Add state for deployed API Gateway URLs
  const [deployedEndpoints, setDeployedEndpoints] = useState<Array<{
    functionName: string;
    apiGatewayUrl: string;
    functionArn: string;
    deployedAt: Date;
  }>>([]);
  const [isCreatingLambda, setIsCreatingLambda] = useState(false);
  const [lambdaError, setLambdaError] = useState('');
  // Add state for live schema preview and streaming
  const [liveSchema, setLiveSchema] = useState('');
  const [isStreamingSchema, setIsStreamingSchema] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [schemaEditPrompt, setSchemaEditPrompt] = useState('');
  const [isEditingSchema, setIsEditingSchema] = useState(false);
  // Add state for schema names
  const [schemaNames, setSchemaNames] = useState<{ [id: string]: string }>({});
  
  // Add state for Lambda saving functionality
  const [isSavingLambda, setIsSavingLambda] = useState(false);
  const [savedLambdas, setSavedLambdas] = useState<Array<{
    id: string;
    functionName: string;
    apiGatewayUrl: string;
    functionArn: string;
    description: string;
    code: string;
    runtime: string;
    handler: string;
    memory: number;
    timeout: number;
    environment: string;
    savedAt: Date;
    namespaceId: string;
  }>>([]);

  // Add state for API endpoints
  const [apiEndpoints, setApiEndpoints] = useState<any[]>([]);
  
  // File upload and drag-drop state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragDropSchemas, setDragDropSchemas] = useState<any[]>([]);
  const [droppedSchemas, setDroppedSchemas] = useState<any[]>([]);
  // Lambda tab UI additions
  // 1. Add state for lambdaPrompt and generatedLambdaCode
  // Run Project functionality
  const [isRunningProject, setIsRunningProject] = useState(false);
  const [isSavingToS3, setIsSavingToS3] = useState(false);
  const [lambdaPrompt, setLambdaPrompt] = useState('');
  const [generatedLambdaCode, setGeneratedLambdaCode] = useState('');
  
  
  // Web Scraping state
  const [selectedService, setSelectedService] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [supportedServices, setSupportedServices] = useState<Array<{key: string, name: string, type: string, description?: string}>>([
    { key: 'shopify', name: 'Shopify', type: 'known-service' },
    { key: 'stripe', name: 'Stripe', type: 'known-service' },
    { key: 'github', name: 'GitHub', type: 'known-service' },
    { key: 'google', name: 'Google APIs', type: 'known-service' },
    { key: 'custom-url', name: 'Custom URL', type: 'custom-url', description: 'Enter any URL to scrape APIs, schemas, and documentation' }
  ]);
  const [scrapeOptions, setScrapeOptions] = useState({
    apis: true,
    schemas: true,
    documentation: true,
    followLinks: true
  });
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [showAllScrapedData, setShowAllScrapedData] = useState(false);
  

  const [scrapingLog, setScrapingLog] = useState<{message: any, type: string, timestamp: string}[]>([]);
  

  
  // Debug: Track generatedLambdaCode changes
  useEffect(() => {
    console.log('[Lambda Debug] generatedLambdaCode updated:', generatedLambdaCode);
    console.log('[Lambda Debug] generatedLambdaCode length:', generatedLambdaCode.length);
  }, [generatedLambdaCode]);

  // Debug: Track activeTab changes
  useEffect(() => {
    console.log('[Tab Debug] activeTab changed to:', activeTab);
  }, [activeTab]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Use centralized constant so it always matches env
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  const router = useRouter();

  // Simple intent detection for namespace generation in general context
  const isNamespaceGenerationIntent = (message: string) => {
    const lower = message.toLowerCase();
    const actionWords = ['create', 'generate', 'build', 'make', 'new'];
    const targetWords = ['namespace', 'project', 'system', 'app', 'application'];
    const keywords = [
      'create namespace', 'generate namespace', 'build namespace', 'make namespace', 'new namespace',
      'create project', 'generate project', 'build project', 'make project', 'new project'
    ];
    if (keywords.some(k => lower.includes(k))) return true;
    return actionWords.some(a => lower.includes(a)) && targetWords.some(t => lower.includes(t));
  };

  async function generateNamespaceSmart(userMessage: string) {
    try {
      setConsoleOutput(prev => [...prev, '🧠 Smart namespace generation starting...']);
      const form = new FormData();
      form.append('prompt', userMessage);
      // Optional: add BRD/HLD/LLD from future UI fields; for now leave blank

      // Attach uploaded files when original is available; fallback to content for text
      for (const f of uploadedFiles) {
        if (f.original) {
          form.append('files', f.original, f.name);
        } else if (f.content && (f.type.startsWith('text/') || f.type === 'application/json' || f.type === 'text/markdown')) {
          const blob = new Blob([f.content], { type: f.type || 'text/plain' });
          form.append('files', new (File as any)([blob], f.name, { type: f.type || 'text/plain' }));
        }
      }

      const resp = await fetch(`${API_BASE_URL}/ai-agent/generate-namespace-smart`, {
        method: 'POST',
        body: form
      });

      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to generate namespace');
      }

      setConsoleOutput(prev => [...prev, `✅ Namespace created: ${data.namespaceId}`]);
      addMessage({ role: 'assistant', content: `✅ Created namespace: ${data.namespaceId}` });
      // Navigate to namespace page
      try {
        router.push('/namespace');
      } catch {}
    } catch (err: any) {
      console.error('Smart generation error:', err);
      setConsoleOutput(prev => [...prev, `❌ Smart generation failed: ${err?.message || 'Unknown error'}`]);
      addMessage({ role: 'assistant', content: `❌ Smart generation failed: ${err?.message || 'Unknown error'}` });
    }
  }

  // File upload and drag-drop functions
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const newFiles: UploadedFile[] = [];
    const schemaFiles: any[] = [];
    
    try {
      for (const file of Array.from(files)) {
        try {
          const fileId = `file-${Date.now()}-${Math.random()}`;
          let content = '';
          
          // Read file content based on type
          if (file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/javascript') {
            content = await file.text();
            
            // Check if this is a schema file
            if (file.name.endsWith('.json') || content.includes('"properties"') || content.includes('"type"')) {
              try {
                const schemaData = JSON.parse(content);
                schemaFiles.push({
                  name: file.name.replace('.json', ''),
                  type: 'JSON',
                  content: schemaData,
                  originalFile: file.name
                });
              } catch (e) {
                console.warn('Could not parse as schema:', file.name);
              }
            }
          } else if (file.type.startsWith('image/')) {
            // For images, create a data URL
            const reader = new FileReader();
            content = await new Promise((resolve, reject) => {
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }
          
          const uploadedFile: UploadedFile = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            content
          };
          
          newFiles.push(uploadedFile);
        } catch (error) {
          console.error('Error processing file:', file.name, error);
        }
      }
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Add message with uploaded files
      if (newFiles.length > 0) {
        addMessage({
          role: 'user',
          content: `Uploaded ${newFiles.length} file(s): ${newFiles.map(f => f.name).join(', ')}${schemaFiles.length > 0 ? `\n\n📋 Detected ${schemaFiles.length} schema file(s): ${schemaFiles.map(s => s.name).join(', ')}` : ''}`,
          files: newFiles
        });
        
        // If schemas were detected, offer to generate Lambda function
        if (schemaFiles.length > 0) {
          setTimeout(() => {
            addMessage({
              role: 'assistant',
              content: `🎯 I detected ${schemaFiles.length} schema file(s) in your upload!\n\n**Available Actions:**\n• Type "generate lambda function" to create a Lambda using these schemas\n• Type "analyze schemas" to see detailed schema information\n• Type "combine schemas" to merge multiple schemas\n\n**Detected Schemas:**\n${schemaFiles.map((s, i) => `${i + 1}. **${s.name}** (${s.type})`).join('\n')}`
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error in file upload:', error);
    } finally {
      setIsUploading(false);
    }
  };


  // Recursively collect files when a directory is dropped (webkit)
  const collectFilesFromItems = async (items: DataTransferItemList): Promise<File[]> => {
    const collected: File[] = [];
    const readEntry = (entry: any, pathPrefix = ''): Promise<void> => {
      return new Promise((resolve) => {
        if (!entry) return resolve();
        if (entry.isFile) {
          entry.file((file: File) => {
            // Preserve folder structure in path within name (optional)
            const namedFile = new (File as any)([file], pathPrefix ? `${pathPrefix}/${file.name}` : file.name, { type: file.type, lastModified: file.lastModified });
            collected.push(namedFile);
            resolve();
          });
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          reader.readEntries(async (entries: any[]) => {
            for (const child of entries) {
              await readEntry(child, pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    };

    const pending: Promise<void>[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'file') {
        const entry = (it as any).webkitGetAsEntry ? (it as any).webkitGetAsEntry() : null;
        if (entry) {
          pending.push(readEntry(entry));
          } else {
          const f = it.getAsFile();
          if (f) collected.push(f);
        }
      }
    }
    await Promise.all(pending);
    return collected;
  };



  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };


  const handleSchemaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const schemaData = e.dataTransfer.getData('application/json');
      if (schemaData) {
        try {
          let schema: any;
          if (typeof schemaData === 'string') {
            const trimmed = schemaData.trim();
            if (trimmed && trimmed !== '[object Object]') {
              try {
                schema = JSON.parse(trimmed);
              } catch {
                // Not valid JSON string; ignore
                schema = null;
              }
            }
          } else if (typeof (schemaData as any) === 'object') {
            schema = schemaData;
          }
          
          if (!schema || typeof schema !== 'object') return;
          
          const schemaWithSource = { ...schema, source: 'workspace' };
          setDroppedSchemas(prev => [...prev, schemaWithSource]);
          
          addMessage({
            role: 'user',
            content: `Added schema context from workspace: ${schema.schemaName || schema.name || 'Unknown Schema'}`
          });
        } catch (parseError) {
          console.error('Error parsing schema data:', parseError);
        }
      }
    } catch (error) {
      console.error('Error processing dropped schema:', error);
    }
  };

  const removeDroppedSchema = (schemaId: string) => {
    setDroppedSchemas(prev => prev.filter(s => s.id !== schemaId));
  };

  // React-DnD drop functionality for schemas from sidebar
  const [{ isOver: isSidebarSchemaDropOver }, sidebarSchemaDropRef] = useDrop({
    accept: 'SCHEMA',
    drop: (item: { type: string; data: any }) => {
      if (item.type === 'SCHEMA') {
        const schema = { ...item.data, source: 'sidebar' };
        setDroppedSchemas(prev => [...prev, schema]);
        addMessage({ role: 'user', content: `Added schema context from sidebar: ${schema.schemaName || schema.name || 'Unknown Schema'}` });
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });


  // React-DnD drop functionality for namespaces and schemas to add to context
  const [{ isNamespaceDropOver, isSchemaDropOver }, namespaceDropRef] = useDrop({
    accept: ['namespace', 'SCHEMA'],
    drop: (item: any) => {
      try {
        console.log('Drop item received:', item);
        
        // Handle namespace drops - check for namespace properties
        if (item.namespace || item['namespace-id'] || item['namespace-name']) {
          const droppedNs = item.namespace || item;
          if (droppedNs && (droppedNs['namespace-id'] || droppedNs.id)) {
            // Check if namespace is already in the list
            const isAlreadyAdded = droppedNamespaces.some(ns => 
              (ns['namespace-id'] || ns.id) === (droppedNs['namespace-id'] || droppedNs.id)
            );
            
            if (!isAlreadyAdded) {
              setDroppedNamespaces(prev => [...prev, droppedNs]);
              setConsoleOutput(prev => [...prev, `📁 Added namespace to context: ${droppedNs['namespace-name'] || droppedNs.name || droppedNs.id}`]);
              addMessage({ 
                role: 'assistant', 
                content: `Added namespace "${droppedNs['namespace-name'] || droppedNs.name}" to context. You now have ${droppedNamespaces.length + 1} namespace(s) in context.` 
              });
            } else {
              setConsoleOutput(prev => [...prev, `⚠️ Namespace "${droppedNs['namespace-name'] || droppedNs.name}" is already in context`]);
              addMessage({ 
                role: 'assistant', 
                content: `Namespace "${droppedNs['namespace-name'] || droppedNs.name}" is already in context.` 
              });
            }
          } else {
            setConsoleOutput(prev => [...prev, '⚠️ Dropped item is not a valid namespace']);
          }
        }
        // Handle schema drops
        else if (item.type === 'SCHEMA' || item.schemaName || item.name) {
          const schema = { ...item.data || item, source: 'workspace' };
          setDroppedSchemas(prev => [...prev, schema]);
          setConsoleOutput(prev => [...prev, `📋 Added schema context: ${schema.schemaName || schema.name || 'Unknown Schema'}`]);
        addMessage({
          role: 'user',
            content: `Added schema context from namespace: ${schema.schemaName || schema.name || 'Unknown Schema'}`
        });
        } else {
          setConsoleOutput(prev => [...prev, `⚠️ Unknown drop item type: ${JSON.stringify(item)}`]);
        }
      } catch (e: any) {
        setConsoleOutput(prev => [...prev, `❌ Error adding item: ${e?.message || 'Unknown error'}`]);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      isNamespaceDropOver: monitor.getItemType() === 'namespace' && monitor.isOver(),
      isSchemaDropOver: monitor.getItemType() === 'SCHEMA' && monitor.isOver()
    })
  });


  // Function to get namespace resources and context
  const getNamespaceContext = async (namespaceId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/unified/schema?namespaceId=${namespaceId}`);
      if (!response.ok) throw new Error('Failed to fetch namespace schemas');
      const schemas = await response.json();
      
      // Get namespace details
      const namespaceResponse = await fetch(`${API_BASE_URL}/unified/namespace/${namespaceId}`);
      const namespaceDetails = namespaceResponse.ok ? await namespaceResponse.json() : null;
      
      return {
        schemas: schemas || [],
        namespace: namespaceDetails,
        totalSchemas: schemas?.length || 0
      };
    } catch (error) {
      console.error('Error fetching namespace context:', error);
      return { schemas: [], namespace: null, totalSchemas: 0 };
    }
  };

  // Load available schemas for drag-drop functionality
  const loadAvailableSchemas = async () => {
    if (!localNamespace?.['namespace-id']) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/unified/schema?namespaceId=${localNamespace?.['namespace-id'] || ''}`);
      if (response.ok) {
        const schemas = await response.json();
        setDragDropSchemas(schemas);
        console.log('[Drag-Drop] Loaded schemas for drag-drop:', schemas.length);
      }
    } catch (error) {
      console.error('Error loading schemas for drag-drop:', error);
    }
  };

  // Web Scraping functions
  const loadSupportedServices = async () => {
    try {
      console.log('Loading supported services from:', `${API_BASE_URL}/web-scraping/supported-services`);
      const response = await fetch(`${API_BASE_URL}/web-scraping/supported-services`);
      if (response.ok) {
        const data = await response.json();
        console.log('Supported services loaded:', data.services);
        setSupportedServices(data.services || []);
      } else {
        console.error('Failed to load supported services:', response.status);
      }
    } catch (error) {
      console.error('Error loading supported services:', error);
    }
  };

  const addScrapingLog = (message: any, type = 'info') => {
    setScrapingLog(prev => [...prev, {
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handlePreviewScrape = async () => {
    if (!selectedService) return;
    
    const serviceToScrape = selectedService === 'custom-url' ? customUrl : selectedService;
    if (selectedService === 'custom-url' && !customUrl) {
      addScrapingLog('Please enter a valid URL', 'error');
      return;
    }
    
    setIsScraping(true);
    addScrapingLog(`Starting preview scrape for ${serviceToScrape}...`, 'info');
    
    try {
      const response = await fetch(`${API_BASE_URL}/web-scraping/scrape-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: serviceToScrape,
          options: scrapeOptions
        })
      });

      if (response.ok) {
        const data = await response.json();
        setScrapedData(data.data);
        addScrapingLog(`Preview completed: ${data.summary.apis} APIs, ${data.summary.schemas} schemas, ${data.summary.documentation} docs`, 'success');
      } else {
        const error = await response.json();
        console.error('Preview failed:', error);
        addScrapingLog(`Preview failed: ${error.error}`, 'error');
      }
    } catch (error) {
      addScrapingLog(`Preview error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setIsScraping(false);
    }
  };

  const handleScrapeAndSave = async () => {
    if (!selectedService || !localNamespace?.['namespace-id']) return;
    
    const serviceToScrape = selectedService === 'custom-url' ? customUrl : selectedService;
    if (selectedService === 'custom-url' && !customUrl) {
      addScrapingLog('Please enter a valid URL', 'error');
      return;
    }
    
    setIsScraping(true);
    addScrapingLog(`Starting scrape and save for ${serviceToScrape}...`, 'info');
    
    try {
      const response = await fetch(`${API_BASE_URL}/web-scraping/scrape-and-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: serviceToScrape,
          namespaceId: localNamespace?.['namespace-id'] || '',
          options: scrapeOptions
        })
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  addScrapingLog('Scraping and saving completed!', 'success');
                  break;
                } else if (data !== '') {
                  try {
                    const parsed = JSON.parse(data);
                    addScrapingLog(parsed.message, parsed.type || 'info');
                    
                                         if (parsed.type === 'success' && parsed.summary) {
                       const serviceName = selectedService === 'custom-url' ? customUrl : selectedService;
                       addMessage({
                         role: 'assistant',
                         content: `✅ Successfully scraped and saved data from ${serviceName}!

📊 **Summary:**
• APIs: ${parsed.summary.apis}
• Schemas: ${parsed.summary.schemas}
• Documentation: ${parsed.summary.documentation}

🎉 All data has been saved to your namespace library and is now available for use in your projects!`
                       });
                     }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }
              }
            }
          }
        }
      } else {
        const error = await response.json();
        addScrapingLog(`Scrape and save failed: ${error.error}`, 'error');
      }
    } catch (error) {
      addScrapingLog(`Scrape and save error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setIsScraping(false);
    }
  };

  // Initialize terminal only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTerminalLoading(false);
      setIsTerminalReady(true);
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load supported services when component mounts
  useEffect(() => {
    loadSupportedServices();
  }, []);

  // Load file tree and workspace state when namespace changes
  useEffect(() => {
    if (localNamespace?.['namespace-id']) {
      refreshFileTree();
      loadWorkspaceState();
      loadAvailableSchemas(); // Load schemas for drag-drop functionality
      
      // Add a welcome message with context if workspace state exists
      setTimeout(() => {
        if (workspaceState && workspaceState.schemas && workspaceState.apis && (workspaceState.schemas.length > 0 || workspaceState.apis.length > 0)) {
          addMessage({
            role: 'assistant',
            content: `Welcome back! I can see you have ${workspaceState.schemas.length} schemas and ${workspaceState.apis.length} APIs in your workspace. I'll help you continue building on your previous work.`
          });
        }
      }, 1000);
    }
  }, [localNamespace?.['namespace-id'], workspaceState]);

  // Initialize session and load history when component mounts
  useEffect(() => {
    if (localNamespace?.['namespace-id']) {
      const newSessionId = `${userId}-ai-agent-workspace-${Date.now()}`;
      setSessionId(newSessionId);
      
      // Load chat history and workspace state after a short delay
      setTimeout(() => {
        loadChatHistory();
      }, 100);
    }
  }, [localNamespace?.['namespace-id'], userId]);

  useEffect(() => {
    if (localNamespace?.['namespace-id'] && sessionId) {
      // Clear generated schemas for this session/namespace on mount/refresh
      fetch(`${process.env.NEXT_PUBLIC_API_BACKEND_URL}/ai-agent/clear-generated-schemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, namespaceId: localNamespace?.['namespace-id'] || '' })
      });
    }
  }, [localNamespace?.['namespace-id'], sessionId]);



  const getNowId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Memory service functions
  const loadWorkspaceState = async () => {
    if (!sessionId || !localNamespace?.['namespace-id']) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/ai-agent/get-workspace-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, namespaceId: localNamespace?.['namespace-id'] || '' })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.workspaceState) {
          setWorkspaceState(data.workspaceState);
          // Do NOT restore schemas from workspace state
          setApiEndpoints(data.workspaceState.apis || []);
        }
      }
    } catch (error) {
      console.error('Error loading workspace state:', error);
    }
  };

  const saveWorkspaceState = async () => {
    if (!sessionId || !localNamespace?.['namespace-id']) return;
    
    const currentState: WorkspaceState = {
      files: [], // No longer tracking generated files
      schemas,
      apis: apiEndpoints,
      projectType: 'nodejs', // No longer tracking project type
      lastGenerated: new Date().toISOString()
    };
    
    try {
      await fetch(`${API_BASE_URL}/ai-agent/save-workspace-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          namespaceId: localNamespace?.['namespace-id'] || '',
          workspaceState: currentState
        })
      });
      
      setWorkspaceState(currentState);
    } catch (error) {
      console.error('Error saving workspace state:', error);
    }
  };

  const loadChatHistory = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/ai-agent/chat-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId, limit: 50 })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.history && data.history.length > 0) {
          const historyMessages = data.history.map((msg: any) => ({
            id: getNowId(),
            role: msg.Role === 'user' ? 'user' : 'assistant',
            content: msg.Content,
            timestamp: new Date(msg.Timestamp)
          }));
          setMessages(prev => [...prev, ...historyMessages]);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const clearChatHistory = async () => {
    if (!sessionId) return;
    
    try {
      await fetch(`${API_BASE_URL}/ai-agent/clear-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your AI development assistant. I can help you:

• Design and generate API schemas
• Write and test code
• Create database models
• Set up authentication
• Run tests and debug issues
• Manage your project structure

What would you like to work on today?`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: getNowId(),
      timestamp: new Date()
    };
    console.log('[Frontend] 📝 Adding message:', newMessage);
    setMessages(prev => {
      const updated = [...prev, newMessage];
      console.log('[Frontend] 📋 Messages updated:', { oldCount: prev.length, newCount: updated.length });
      return updated;
    });
  };

  // Test function to debug chat UI
  // Function to handle Lambda generation using the dedicated endpoint
  const handleLambdaGeneration = async (message: string, selectedSchema: any = null) => {
    try {
      setConsoleOutput(prev => [...prev, `🔄 Generating Lambda function...`]);
        
        const response = await fetch(`${API_BASE_URL}/ai-agent/lambda-codegen`, {
          method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          originalMessage: message,
          namespace: localNamespace?.['namespace-id'],
          allNamespaces: [localNamespace, ...droppedNamespaces].filter(Boolean),
          selectedSchema: selectedSchema,
          functionName: (lambdaForm.functionName && lambdaForm.functionName.trim()) 
            ? lambdaForm.functionName.trim() 
            : (selectedSchema ? `${selectedSchema.schemaName || selectedSchema.name}Handler` : 'GeneratedHandler'),
          runtime: 'nodejs18.x',
          handler: 'index.handler',
          memory: 256,
          timeout: 30,
          environment: null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

          const reader = response.body?.getReader();
      if (!reader) {
        // Fallback for non-streaming responses
        try {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            if (data?.code) {
              setGeneratedLambdaCode(data.code);
              setActiveTab('lambda');
              return;
            }
          } catch {}
          // Try to extract code fences
          const match = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
          if (match && match[1]) {
            setGeneratedLambdaCode(match[1]);
            setActiveTab('lambda');
            return;
          }
          throw new Error('No response body reader available');
        } catch (e) {
          throw new Error('No response body reader available');
        }
      }

            let generatedCode = '';
      let functionName = (lambdaForm.functionName && lambdaForm.functionName.trim()) 
        ? lambdaForm.functionName.trim() 
        : (selectedSchema ? `${selectedSchema.schemaName || selectedSchema.name}Handler` : 'GeneratedHandler');
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
            const dataContent = line.slice(6);
            
            if (dataContent.trim() === '[DONE]' || dataContent.trim().includes('[DONE]')) {
              break;
            }

            try {
              const data = JSON.parse(dataContent);
              // Handle lambda streaming payloads
              if (data.route === 'lambda') {
                setActiveTab('lambda');
                if (data.type === 'lambda_code_chunk' && data.content) {
                  generatedCode += data.content;
                  continue;
                }
                if ((data.type === 'lambda_code_complete' || data.type === 'lambda_code') && data.code) {
                  generatedCode += data.code; // final code payload
                  continue;
                }
              }
              // Fallback: accumulate generic content field
              if (data.content) {
                generatedCode += data.content;
              }
              // Additional fallback: check for code in different fields
              if (data.code) {
                generatedCode += data.code;
              }
              if (data.message) {
                generatedCode += data.message;
                      }
                    } catch (e) {
              console.log('Failed to parse streaming data:', e);
              // Try to extract code from raw content
              if (dataContent.includes('```')) {
                const match = dataContent.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
                if (match && match[1]) {
                  generatedCode += match[1];
                    }
                  }
                }
              }
            }
          }

      if (generatedCode && generatedCode.trim()) {
        // Set the generated Lambda code in the Lambda tab's code box
        setGeneratedLambdaCode(generatedCode);
        
        // Also generate Lambda function structure and add to project files
        generateLambdaFileStructure(generatedCode, functionName, 'nodejs18.x');
        
        // Switch to Lambda tab to show the generated code
        setActiveTab('lambda');
        
        // Add success message to chat
        addMessage({
          role: 'assistant',
          content: `✅ Generated Lambda function: **${functionName}**\n\nCheck the Lambda tab to see the generated code!`
        });
        
        setConsoleOutput(prev => [...prev, `✅ Lambda function generated: ${functionName}`]);
        } else {
        console.log('Debug: generatedCode is empty or whitespace:', generatedCode);
        setConsoleOutput(prev => [...prev, `⚠️ No Lambda code was generated. Raw response: ${generatedCode}`]);
          
        // Add helpful message to user
          addMessage({
            role: 'assistant',
          content: `⚠️ No Lambda code was generated. Please try:\n\n• Being more specific about what you want to build\n• Including the programming language (Node.js, Python, etc.)\n• Describing the function's purpose clearly\n\nExample: "Create a Node.js Lambda function that processes user data and saves it to DynamoDB"`
          });
        }
      } catch (error) {
      console.error('Error in schema Lambda generation:', error);
      setConsoleOutput(prev => [...prev, `❌ Error generating Lambda: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        
        addMessage({
          role: 'assistant',
        content: `❌ Failed to generate Lambda function: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Function to handle document generation (BRD/HLD/LLD)
  const handleDocumentGeneration = async (message: string) => {
    try {
      setConsoleOutput(prev => [...prev, `📄 Generating documents from namespace context...`]);
      
      // Parse document types from message
      const lowerMessage = message.toLowerCase();
      const documentTypes = [];
      
      if (lowerMessage.includes('brd') || 
          lowerMessage.includes('business requirements') || 
          lowerMessage.includes('business requirement') ||
          lowerMessage.includes('requirements document') ||
          lowerMessage.includes('requirements doc')) {
        documentTypes.push('brd');
      }
      if (lowerMessage.includes('hld') || 
          lowerMessage.includes('high level design') ||
          lowerMessage.includes('high-level design') ||
          lowerMessage.includes('high level') ||
          lowerMessage.includes('system design') ||
          lowerMessage.includes('architecture')) {
        documentTypes.push('hld');
      }
      if (lowerMessage.includes('lld') || 
          lowerMessage.includes('low level design') ||
          lowerMessage.includes('low-level design') ||
          lowerMessage.includes('low level') ||
          lowerMessage.includes('detailed design') ||
          lowerMessage.includes('technical design')) {
        documentTypes.push('lld');
      }
      
      // If no specific types mentioned, generate all
      if (documentTypes.length === 0) {
        documentTypes.push('brd', 'hld', 'lld');
      }
      
      const response = await fetch(`${API_BASE_URL}/ai-agent/generate-documents`, {
          method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          namespaceId: namespace?.['namespace-id'],
          documentTypes: documentTypes,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.documents) {
        setConsoleOutput(prev => [...prev, `✅ Generated ${Object.keys(result.documents).length} documents`]);
        
        // Create downloadable files for each document
        const documentFiles: Array<{name: string, content: string, type: string, id: string, size: number}> = [];
        for (const [docType, docContent] of Object.entries(result.documents)) {
          const fileName = `${namespace?.['namespace-name'] || 'namespace'}_${docType.toUpperCase()}.json`;
          const fileContent = JSON.stringify(docContent, null, 2);
          
          documentFiles.push({
            name: fileName,
            content: fileContent,
            type: 'application/json',
            id: getNowId(),
            size: fileContent.length
          });
        }
        
        // Add files to uploaded files for download
        setUploadedFiles(prev => [...prev, ...documentFiles]);
        
        // Create download links and show in chat
        const downloadLinks = documentFiles.map(file => 
          `[📄 Download ${file.name}](#download:${file.name})`
        ).join('\n');
        
        addMessage({
          role: 'assistant',
          content: `📋 **Generated Documents for ${namespace?.['namespace-name']}:**\n\n${downloadLinks}\n\n**Available Documents:**\n${Object.keys(result.documents).map(doc => `• **${doc.toUpperCase()}** - ${result.documents[doc].type || 'Document'}`).join('\n')}\n\n💡 **Tip:** Click the download links above to save the documents to your computer.`
        });
        
        setConsoleOutput(prev => [...prev, `📄 Documents ready for download: ${Object.keys(result.documents).join(', ')}`]);
                        } else {
        throw new Error(result.error || 'Failed to generate documents');
      }
    } catch (error) {
      console.error('Error in document generation:', error);
      setConsoleOutput(prev => [...prev, `❌ Error generating documents: ${error instanceof Error ? error.message : 'Unknown error'}`]);
                        
                        addMessage({
                          role: 'assistant',
        content: `❌ Failed to generate documents: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Function to handle document generation from prompt (creates namespace first)
  const handleDocumentGenerationFromPrompt = async (message: string) => {
    try {
      setConsoleOutput(prev => [...prev, `📄 Creating namespace and generating documents from: ${message}`]);
      
      // Parse document types from message
      const lowerMessage = message.toLowerCase();
      const documentTypes = [];
      
      if (lowerMessage.includes('brd') || 
          lowerMessage.includes('business requirements') || 
          lowerMessage.includes('business requirement') ||
          lowerMessage.includes('requirements document') ||
          lowerMessage.includes('requirements doc')) {
        documentTypes.push('brd');
      }
      if (lowerMessage.includes('hld') || 
          lowerMessage.includes('high level design') ||
          lowerMessage.includes('high-level design') ||
          lowerMessage.includes('high level') ||
          lowerMessage.includes('system design') ||
          lowerMessage.includes('architecture')) {
        documentTypes.push('hld');
      }
      if (lowerMessage.includes('lld') || 
          lowerMessage.includes('low level design') ||
          lowerMessage.includes('low-level design') ||
          lowerMessage.includes('low level') ||
          lowerMessage.includes('detailed design') ||
          lowerMessage.includes('technical design')) {
        documentTypes.push('lld');
      }
      
      // If no specific types mentioned, generate all
      if (documentTypes.length === 0) {
        documentTypes.push('brd', 'hld', 'lld');
      }
      
      // First, create a namespace from the prompt
      addMessage({
        role: 'assistant',
        content: `🚀 I'll create a namespace for your project and then generate the requested documents. This may take a moment...`
      });
      
      const namespaceResponse = await fetch(`${API_BASE_URL}/ai-agent/generate-namespace-smart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          brd: '',
          hld: '',
          lld: ''
        })
      });

      if (!namespaceResponse.ok) {
        throw new Error(`Failed to create namespace: ${namespaceResponse.status}`);
      }

      const namespaceResult = await namespaceResponse.json();
      
      if (!namespaceResult.success || !namespaceResult.namespaceId) {
        throw new Error(namespaceResult.error || 'Failed to create namespace');
      }
      
      setConsoleOutput(prev => [...prev, `✅ Created namespace: ${namespaceResult.namespaceId}`]);
      
      // Now generate documents from the created namespace
      const documentResponse = await fetch(`${API_BASE_URL}/ai-agent/generate-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          namespaceId: namespaceResult.namespaceId,
          documentTypes: documentTypes,
          format: 'json'
        })
      });

      if (!documentResponse.ok) {
        throw new Error(`Failed to generate documents: ${documentResponse.status}`);
      }

      const documentResult = await documentResponse.json();
      
      if (documentResult.success && documentResult.documents) {
        setConsoleOutput(prev => [...prev, `✅ Generated ${Object.keys(documentResult.documents).length} documents`]);
        
        // Create downloadable files for each document
        const documentFiles: Array<{name: string, content: string, type: string, id: string, size: number}> = [];
        for (const [docType, docContent] of Object.entries(documentResult.documents)) {
          const fileName = `project_${docType.toUpperCase()}.json`;
          const fileContent = JSON.stringify(docContent, null, 2);
          
          documentFiles.push({
            name: fileName,
            content: fileContent,
            type: 'application/json',
            id: getNowId(),
            size: fileContent.length
          });
        }
        
        // Add files to uploaded files for download
        setUploadedFiles(prev => [...prev, ...documentFiles]);
        
        // Create download links and show in chat
        const downloadLinks = documentFiles.map(file => 
          `[📄 Download ${file.name}](#download:${file.name})`
        ).join('\n');
          
          addMessage({
            role: 'assistant',
          content: `📋 **Generated Documents for your project:**\n\n${downloadLinks}\n\n**Available Documents:**\n${Object.keys(documentResult.documents).map(doc => `• **${doc.toUpperCase()}** - ${documentResult.documents[doc].type || 'Document'}`).join('\n')}\n\n💡 **Tip:** Click the download links above to save the documents to your computer.\n\n🎯 **Namespace Created:** You can view and manage the generated namespace [here](/namespace/${namespaceResult.namespaceId}).`
          });
        
        setConsoleOutput(prev => [...prev, `📄 Documents ready for download: ${Object.keys(documentResult.documents).join(', ')}`]);
      } else {
        throw new Error(documentResult.error || 'Failed to generate documents');
        }
      } catch (error) {
      console.error('Error in document generation from prompt:', error);
      setConsoleOutput(prev => [...prev, `❌ Error generating documents: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        
        addMessage({
          role: 'assistant',
        content: `❌ Failed to generate documents: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Handle pending schema selection by name or natural language
    if (pendingSchemaSelection) {
      const reply = userMessage.trim().toLowerCase();
      const candidates = pendingSchemaSelection.candidates;
      const match = candidates.find(c => {
        const n1 = (c.schemaName || c.name || '').toLowerCase();
        // support phrasing like "use X", "select X", "schema X"
        return n1 && (reply === n1 || reply.includes(n1) || /use\s+/.test(reply) || /select\s+/.test(reply));
      });
      if (match) {
        setPendingSchemaSelection(null);
        const chosenName = match.schemaName || match.name || 'Selected Schema';
        setConsoleOutput(prev => [...prev, `✅ Selected schema: ${chosenName}`]);
        addMessage({ role: 'assistant', content: `Using schema: ${chosenName}` });
        const schemaObj = match.schema || match;
        await handleLambdaGeneration(pendingSchemaSelection.prompt, schemaObj);
      return;
      }
      addMessage({ role: 'assistant', content: 'I did not recognize that schema name. Please reply with the exact schema name as shown in the list (e.g., "Use Users").' });
      return;
    }
    
    // Debug: Log the message being processed
    console.log('[Frontend] 🎯 Processing message:', userMessage);
    console.log('[Frontend] 🔍 Current messages count:', messages.length);
    console.log('[Frontend] 🏠 Current namespace:', localNamespace?.['namespace-id']);
    
    // Add user message to chat
        addMessage({
      role: 'user',
      content: userMessage
    });

    // Add console output for message processing
    setConsoleOutput(prev => [...prev, `👤 User message: ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`]);
    
    // If no namespace context and intent is namespace generation, call smart endpoint
    if (!localNamespace?.['namespace-id'] && isNamespaceGenerationIntent(userMessage)) {
      await generateNamespaceSmart(userMessage);
        return;
      }
      
    // If user explicitly asks to generate a lambda, call dedicated endpoint directly
    const lowerUM = userMessage.toLowerCase();
    const lambdaIntent =
      /generate\s+lambda/.test(lowerUM) ||
      /generate\s+a\s+lambda/.test(lowerUM) ||
      /create\s+lambda/.test(lowerUM) ||
      /lambda\s+(function|handler)/.test(lowerUM) ||
      /make\s+.*lambda/.test(lowerUM);
    if (lambdaIntent) {
      // If a schema was dropped, use that; else prompt user with available schemas
      const dropped = droppedSchemas && droppedSchemas.length > 0 ? droppedSchemas[0] : null;
      if (dropped) {
        await handleLambdaGeneration(userMessage, dropped);
        return;
      }

      // Fetch available schemas from ALL namespaces in context
      try {
        const allNamespaces = [localNamespace, ...droppedNamespaces].filter(Boolean);
        if (allNamespaces.length === 0) {
          addMessage({ role: 'assistant', content: 'No namespaces in context. Please open the AI Agent within a namespace or drag and drop namespaces to add them to context.' });
          return;
        }

        const allSchemasData = await getAllSchemasFromContext();
        const allSchemas = allSchemasData.flatMap(data => 
          data.schemas.map(schema => ({
            ...schema,
            namespaceName: data.namespace['namespace-name'] || data.namespace.name,
            namespaceId: data.namespace['namespace-id'] || data.namespace.id
          }))
        );

        if (allSchemas.length > 0) {
          // Group schemas by namespace for better display
          let response = `Available schemas from all namespaces in context:\n\n`;
          allSchemasData.forEach((data, index) => {
            if (data.schemas.length > 0) {
              response += `**${data.namespace['namespace-name'] || data.namespace.name}** (${data.schemas.length} schema${data.schemas.length > 1 ? 's' : ''}):\n`;
              data.schemas.forEach((s: any) => {
                response += `• ${s.schemaName || s.name}\n`;
              });
              response += `\n`;
            }
          });
          response += `Reply with: "Use <SchemaName>" or just the schema name.`;

          addMessage({ role: 'assistant', content: response });
          setConsoleOutput(prev => [...prev, `📋 Listed ${allSchemas.length} schema(s) from ${allNamespaces.length} namespace(s)`]);
          setPendingSchemaSelection({ prompt: userMessage, candidates: allSchemas });
          return;
        } else {
          addMessage({ role: 'assistant', content: 'No schemas available in any of the namespaces in context. Please create schemas first or upload them, then ask again.' });
          return;
        }
      } catch (e: any) {
        setConsoleOutput(prev => [...prev, `❌ Failed to list schemas: ${e?.message || 'Unknown error'}`]);
        addMessage({ role: 'assistant', content: 'I could not fetch schemas. Please try again.' });
        return;
      }
    }

    // Check for document generation intent (BRD/HLD/LLD)
    const documentIntent = 
      /generate\s+(brd|hld|lld|business\s+requirements|high\s+level\s+design|low\s+level\s+design)/.test(lowerUM) ||
      /create\s+(brd|hld|lld|business\s+requirements|high\s+level\s+design|low\s+level\s+design)/.test(lowerUM) ||
      /make\s+(brd|hld|lld|business\s+requirements|high\s+level\s+design|low\s+level\s+design)/.test(lowerUM) ||
      /give\s+me\s+(brd|hld|lld|business\s+requirements|high\s+level\s+design|low\s+level\s+design)/.test(lowerUM) ||
      /can\s+you\s+(give|provide|create|generate)\s+.*?(brd|hld|lld|business\s+requirements|high\s+level\s+design|low\s+level\s+design)/.test(lowerUM) ||
      /i\s+need\s+(brd|hld|lld|business\s+requirements|high\s+level\s+design|low\s+level\s+design)/.test(lowerUM) ||
      /i\s+want\s+(brd|hld|lld|business\s+requirements|high\s+level\s+design|low\s+level\s+design)/.test(lowerUM) ||
      /show\s+me\s+(brd|hld|lld|business\s+requirements|high\s+level\s+design|low\s+level\s+design)/.test(lowerUM) ||
      /documentation/.test(lowerUM) ||
      /document/.test(lowerUM) ||
      /specification/.test(lowerUM) ||
      /requirements/.test(lowerUM) ||
      /design\s+document/.test(lowerUM) ||
      // More flexible patterns for common phrases
      /(brd|hld|lld|business\s+requirements|high\s+level\s+design|low\s+level\s+design)\s+(for|of|about)/.test(lowerUM) ||
      /(give|provide|create|generate|make|show|need|want)\s+.*?(brd|hld|lld|business\s+requirements|high\s+level\s+design|low\s+level\s+design)/.test(lowerUM);

    // Check for namespace context questions
    const namespaceContextIntent = 
      /what.*namespace/.test(lowerUM) ||
      /tell.*namespace/.test(lowerUM) ||
      /show.*namespace/.test(lowerUM) ||
      /list.*namespace/.test(lowerUM) ||
      /namespace.*resources/.test(lowerUM) ||
      /namespace.*context/.test(lowerUM) ||
      /namespace.*schemas/.test(lowerUM) ||
      /what.*schemas/.test(lowerUM) ||
      /list.*schemas/.test(lowerUM) ||
      /show.*schemas/.test(lowerUM);
    
    // Debug logging for document intent detection
    console.log('[Frontend] 🔍 Intent detection:', {
            message: userMessage,
      lowerMessage: lowerUM,
      documentIntent: documentIntent,
      namespaceContextIntent: namespaceContextIntent,
      namespace: namespace?.['namespace-id']
    });
    
    if (documentIntent) {
      console.log('[Frontend] 🎯 Document generation intent detected!');
      setConsoleOutput(prev => [...prev, `🎯 Document generation intent detected: ${userMessage}`]);
      
      if (namespace?.['namespace-id']) {
        // Generate documents from existing namespace
        console.log('[Frontend] 📄 Generating documents from existing namespace');
        await handleDocumentGeneration(userMessage);
        return;
      } else {
        // Generate documents by creating a namespace first
        console.log('[Frontend] 📄 Generating documents by creating namespace first');
        await handleDocumentGenerationFromPrompt(userMessage);
        return;
      }
    }

    // Note: Namespace context questions are now handled by the backend LLM
    // with full context including allNamespaces, schemas, methods, webhooks, etc.

    // Check if user wants to generate Lambda with uploaded schemas
    const hasUploadedSchemas = uploadedFiles.some(file => 
      file.name.endsWith('.json') && file.content && 
      (file.content.includes('"properties"') || file.content.includes('"type"'))
    );
    
    if (hasUploadedSchemas && (userMessage.toLowerCase().includes('generate lambda') || userMessage.toLowerCase().includes('lambda function'))) {
      // Extract schema data from uploaded files
      const schemas = uploadedFiles
        .filter(file => file.name.endsWith('.json') && file.content)
        .map(file => {
          try {
            const schemaData = JSON.parse(file.content || '{}');
            return {
              name: file.name.replace('.json', ''),
              type: 'JSON',
              content: schemaData,
              originalFile: file.name
            };
                    } catch (e) {
            return null;
          }
        })
        .filter(Boolean);
      
      if (schemas.length > 0) {
        await handleLambdaGeneration(userMessage, schemas[0]); // Use first schema for now
        return;
      }
    }
    
    // Check if this might be a schema-related request
    const lowerMessage = userMessage.toLowerCase();
    // Robust intent detection for tab switching (less strict than generation)
    const schemaKeywords = ['schema', 'json', 'model', 'structure', 'format'];
    const lambdaKeywords = ['lambda', 'function', 'handler', 'aws lambda', 'serverless'];
    const apiKeywords = ['api', 'endpoint', 'route', 'rest', 'http', 'get', 'post', 'put', 'delete'];
    
    const hasSchemaKeyword = schemaKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasLambdaKeyword = lambdaKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasApiKeyword = apiKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Only switch tabs for clear intent, not casual mentions
    const isQuestion = lowerMessage.includes('?') || lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why');
    const isCasualMention = lowerMessage.includes('about') || lowerMessage.includes('regarding') || lowerMessage.includes('concerning');
    
    if (hasApiKeyword && !isQuestion && !isCasualMention) {
      setConsoleOutput(prev => [...prev, `🔍 Detected API-related request`]);
      setActiveTab('api');
    } else if (hasSchemaKeyword && !isQuestion && !isCasualMention) {
      setConsoleOutput(prev => [...prev, `🔍 Detected schema-related request`]);
      setActiveTab('schema');
    } else if (hasLambdaKeyword && !isQuestion && !isCasualMention) {
      setConsoleOutput(prev => [...prev, `🔍 Detected lambda-related request`]);
      setActiveTab('lambda');
    }

    try {
      await handleStreamingResponse(userMessage);
      } catch (error) {
      console.error('Error handling streaming response:', error);
      setConsoleOutput(prev => [...prev, `❌ Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      
        addMessage({
          role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleStreamingResponse = async (userMessage: string, currentSchema: any = null) => {
    setIsStreamingSchema(false);
    setLiveSchema('');
    let assistantMessage = '';
    let actions: any[] = [];
    let lastAssistantMessageId: string | null = null;

    console.log('[Frontend] Processing message:', userMessage);

    try {
      setConsoleOutput(prev => [...prev, `💬 Processing message: ${userMessage}`]);
        
        const requestBody = {
      message: userMessage,
        namespace: localNamespace?.['namespace-id'] || null, // Pass null for general context to enable namespace generation
        allNamespaces: [localNamespace, ...droppedNamespaces].filter(Boolean), // Pass all namespaces in context
        history: messages.slice(-10), // Send last 10 messages for context
        schema: currentSchema || (schemas.length > 0 ? schemas[0].schema : null),
        uploadedSchemas: droppedSchemas // Pass dropped schemas for lambda generation
      };
      
      console.log('[Frontend Debug] 🚀 Making backend request to:', `${API_BASE_URL}/ai-agent/stream`);
      console.log('[Frontend Debug] 📤 Request body:', requestBody);
      console.log('[Frontend Debug] 🌐 API_BASE_URL:', API_BASE_URL);
      console.log('[Frontend Debug] 📁 allNamespaces being sent:', requestBody.allNamespaces?.length || 0, 'namespaces');
        
        const response = await fetch(`${API_BASE_URL}/ai-agent/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

      console.log('[Frontend Debug] 📥 Response status:', response.status);
      console.log('[Frontend Debug] ✅ Response ok:', response.ok);
      console.log('[Frontend Debug] 📋 Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
        setConsoleOutput(prev => [...prev, `✅ Connected to backend, starting streaming...`]);
    const reader = response.body?.getReader();
          if (reader) {
    let chunkCount = 0;
    
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunkCount++;
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
                    const dataContent = line.slice(6);
                    
                    console.log('[Frontend Debug] Processing data line:', { line, dataContent });
                    
                    // Handle [DONE] signal - not JSON (trim whitespace and check for variations)
                    const trimmedContent = dataContent.trim();
                    if (trimmedContent === '[DONE]' || trimmedContent.includes('[DONE]')) {
                      console.log('[Frontend Debug] ✅ Received [DONE] signal - streaming complete');
                      break;
                    }
                    
                    try {
                      const data = JSON.parse(dataContent);
                      console.log('[Frontend Debug] 🔍 PARSED DATA:', {
                        route: data.route,
                        type: data.type,
                        content: data.content?.substring(0, 100),
                        fullData: data
                      });
                      
                  // Handle actions (can come from any route)
                  if (data.actions) {
                        console.log('[Frontend] 📋 Received actions:', {
                          route: data.route,
                          type: data.type,
                          actionCount: data.actions.length,
                          actions: data.actions
                        });
                actions = data.actions;
                        setConsoleOutput(prev => [...prev, `📋 Received ${data.actions.length} action(s) from AI agent (route: ${data.route})`]);
              }
              
              if (data.route === 'schema') {
                    // Handle schema-specific messages - stream JSON schema content live
                    console.log('[Frontend Debug] ⚠️ SCHEMA ROUTE MESSAGE:', data);
                    console.log('[Frontend Debug] ⚠️ Type:', data.type, 'Content:', data.content?.substring(0, 200));
                        if (data.type === 'live_schema') {
                      // Stream JSON schema content progressively in the live box
                      console.log('[Frontend Debug] ✅ Adding to live schema box:', data.content?.substring(0, 100));
                      if (data.content) {
                  setLiveSchema(prev => prev + data.content);
                  setIsStreamingSchema(true);
                        setConsoleOutput(prev => [...prev, `🔄 Live schema streaming...`]);
                          }
                        } else if (data.type === 'live_schema_complete') {
                          // Handle final live schema update and close the live generation window
                      console.log('[Frontend Debug] ✅ Schema generation completed');
                          setIsStreamingSchema(false);
                          setConsoleOutput(prev => [...prev, `✅ Live schema generation completed`]);
                  } else {
                      console.log('[Frontend Debug] ⚠️ UNEXPECTED MESSAGE TYPE IN SCHEMA ROUTE:', data.type, data.content?.substring(0, 100));
                        }
                      } else if (data.route === 'lambda') {
                        // Handle Lambda code generation responses
                        console.log('[Frontend Debug] ✅ LAMBDA ROUTE MESSAGE:', {
                          type: data.type,
                          schemaName: data.schemaName,
                          hasCode: !!data.code,
                          codeLength: data.code?.length || 0
                        });

                        // Streamed chunk updates
                        if (data.type === 'lambda_code_chunk' && data.content) {
                          console.log('[Frontend Debug] ✅ Processing lambda_code_chunk:', data.content);
                          console.log('[Frontend Debug] ✅ Switching to lambda tab');
                          setActiveTab('lambda');
                          setGeneratedLambdaCode(prev => {
                            const newCode = (prev || '') + data.content;
                            console.log('[Frontend Debug] ✅ Updated generatedLambdaCode length:', newCode.length);
                            console.log('[Frontend Debug] ✅ Current generatedLambdaCode:', newCode.substring(0, 100) + '...');
                            return newCode;
                          });
                          continue; // Continue processing more chunks instead of returning
                        }

                        // Final completion payload with full code
                        if (data.type === 'lambda_code_complete' && data.code) {
                          console.log('[Frontend Debug] ✅ Processing lambda_code_complete:', data.code.length, 'chars');
                          setActiveTab('lambda');
                          setGeneratedLambdaCode(data.code);
                          try {
                            generateLambdaFileStructure(data.code, (data.schemaName || 'Generated') + 'Handler', 'nodejs18.x');
                          } catch (e) {
                            console.warn('Failed to generate lambda file structure:', e);
                          }
                          continue; // Continue processing instead of returning
                        }

                        // Backward-compatible single-shot payload
                        if (data.type === 'lambda_code' && data.code) {
                          setActiveTab('lambda');
                          setGeneratedLambdaCode(data.code);
                          try {
                            generateLambdaFileStructure(data.code, data.schemaName + 'Handler', 'nodejs18.x');
                          } catch (e) {
                            console.warn('Failed to generate lambda file structure:', e);
                          }
                          addMessage({
                            role: 'assistant',
                            content: `✅ Generated Lambda function${data.schemaName ? ` for schema: **${data.schemaName}**` : ''}.\n\nCheck the Lambda tab to see the generated code!`
                          });
                          setConsoleOutput(prev => [...prev, `✅ Lambda function generated${data.schemaName ? ` for schema: ${data.schemaName}` : ''}`]);
                          continue; // Continue processing instead of returning
                        }
                      } else if (data.route === 'chat') {
                        // Handle chat route messages - could be chat content or actions
                        console.log('[Frontend Debug] ✅ CHAT ROUTE MESSAGE:', {
                          type: data.type,
                          content: data.content?.substring(0, 100),
                          hasContent: !!data.content,
                          contentLength: data.content?.length || 0,
                          hasActions: !!data.actions
                        });
                        
                        // Handle namespace generation completion
                        if (data.type === 'namespace_generated') {
                          console.log('[Frontend Debug] ✅ Namespace generated:', data.namespaceId);
                          
                          // Add the success message to chat
                          addMessage({
                            role: 'assistant',
                            content: data.content
                          });
                          
                          // Show success notification
                          setConsoleOutput(prev => [...prev, `✅ Complete namespace generated: ${data.namespaceData.namespace['namespace-name']}`]);
                          
                          // Optionally redirect to the new namespace or show a success modal
                          // You can add navigation logic here if needed
                          
                          continue;
                        }
                        
                        if (data.type === 'chat' && data.content) {
                          // This is actual chat content to display
                          console.log('[Frontend Debug] 📝 ADDING TO ASSISTANT MESSAGE:', {
                            currentLength: assistantMessage.length,
                            newContent: data.content,
                            newLength: data.content.length
                          });
                          
                          assistantMessage += data.content;
                          
                          // If this is the first chunk, add a new assistant message
                          if (!lastAssistantMessageId) {
                            lastAssistantMessageId = getNowId();
                            console.log('[Frontend Debug] 🆕 CREATING NEW ASSISTANT MESSAGE:', {
                              id: lastAssistantMessageId,
                              content: assistantMessage,
                              messageCount: messages.length + 1
                            });
                            
                            addMessage({
                              role: 'assistant',
                              content: assistantMessage
                            });
                          } else {
                            // Update the existing assistant message
                            console.log('[Frontend Debug] 🔄 UPDATING EXISTING MESSAGE:', {
                              messageId: lastAssistantMessageId,
                              newContent: assistantMessage
                            });
                            
                            setMessages(prev => {
                              const updatedMessages = prev.map(msg => 
                                msg.id === lastAssistantMessageId 
                                  ? { ...msg, content: assistantMessage }
                                  : msg
                              );
                              console.log('[Frontend Debug] 📋 UPDATED MESSAGES ARRAY:', {
                                messageCount: updatedMessages.length,
                                updatedMessage: updatedMessages.find(m => m.id === lastAssistantMessageId)
                              });
                              return updatedMessages;
                            });
                          }
                        } else if (data.type === 'actions') {
                          // This is an actions message with route 'chat' - not an error, just actions
                          console.log('[Frontend Debug] ✅ CHAT ROUTE ACTIONS:', {
                            actionCount: data.actions?.length || 0,
                            actions: data.actions
                          });
                  } else {
                          // This might be an unexpected message type
                          console.log('[Frontend Debug] ⚠️ UNEXPECTED CHAT ROUTE MESSAGE TYPE:', {
                            type: data.type,
                            hasContent: !!data.content,
                            hasActions: !!data.actions,
                            data: data
                          });
                        }
                      }
                    } catch (e) {
                      console.log('[Frontend Debug] Failed to parse streaming data:', {
                        error: e instanceof Error ? e.message : String(e),
                        dataContent: dataContent,
                        line: line
                      });
                    }
              }
            }
          }
        }
      } else {
        const errorText = await response.text();
        console.error('[Frontend Debug] Backend error:', errorText);
        setConsoleOutput(prev => [...prev, `❌ Backend error: ${response.status} - ${errorText}`]);
        }
      } catch (error) {
      console.error('[Frontend Debug] Error:', error);
      setConsoleOutput(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }

    // Process any actions received
    if (actions && actions.length > 0) {
      for (const action of actions) {
        console.log('[Frontend] Processing action:', action);
        
        if (action.type === 'generate_schema' && action.status === 'complete') {
          const schemaData = action.data;
          if (schemaData) {
        const newSchema = {
              id: getNowId(),
              schemaName: `Generated Schema ${schemas.length + 1}`,
          schema: schemaData,
              content: schemaData,
              saved: false,
          timestamp: new Date()
        };
        setSchemas(prev => [...prev, newSchema]);
            setSchemaNames(prev => ({ ...prev, [newSchema.id]: newSchema.schemaName }));
              setLiveSchema('');
              setIsStreamingSchema(false);
            setConsoleOutput(prev => [...prev, `✅ Schema generated and added to Schema tab`]);
          }
        } else if (action.type === 'edit_schema' && action.status === 'complete') {
          const schemaData = action.data;
          if (schemaData) {
            // Update the existing schema
            setSchemas(prev => prev.map(schema => 
              schema.id === currentSchema?.id 
                ? { ...schema, schema: schemaData, content: schemaData, saved: false }
                : schema
            ));
                setLiveSchema('');
                setIsStreamingSchema(false);
            setConsoleOutput(prev => [...prev, `✅ Schema edited and updated in Schema tab`]);
          }
        } else if (action.type === 'error' && action.status === 'failed') {
          // Handle error actions with better user messaging
          console.log('[Frontend] Processing error action:', action);
          
          let errorMessage = action.message || 'An unknown error occurred';
          let errorType = action.errorType || 'unknown_error';
          
          // Add user-friendly error message to chat
          addMessage({
            role: 'assistant',
            content: `❌ **Error**: ${errorMessage}\n\n${getErrorSuggestions(errorType)}`
          });
          setConsoleOutput(prev => [...prev, `❌ Error: ${errorMessage} (Type: ${errorType})`]);
        }
      }
    }
  };

  const refreshFileTree = async () => {
    if (!localNamespace?.['namespace-id']) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/code-generation/files/${localNamespace?.['namespace-id'] || ''}`);
      if (response.ok) {
        const data = await response.json();
        if (data.files) {
          // Convert flat file list to tree structure
          const fileTree: ProjectFile[] = [];
          const fileMap = new Map<string, ProjectFile>();
          
          data.files.forEach((file: any) => {
            const pathParts = file.path.split('/');
            const fileName = pathParts[pathParts.length - 1];
            
            const projectFile: ProjectFile = {
              id: file.path,
              name: fileName,
              type: file.type,
              path: file.path,
              children: file.type === 'directory' ? [] : undefined
            };
            
            if (file.type === 'file') {
              fileMap.set(file.path, projectFile);
            } else {
              fileMap.set(file.path, projectFile);
            }
          });
          
          // Build tree structure
          data.files.forEach((file: any) => {
            const pathParts = file.path.split('/');
            if (pathParts.length === 1) {
              // Root level file/folder
              fileTree.push(fileMap.get(file.path)!);
            } else {
              // Nested file/folder
              const parentPath = pathParts.slice(0, -1).join('/');
              const parent = fileMap.get(parentPath);
              if (parent && parent.children) {
                parent.children.push(fileMap.get(file.path)!);
              }
            }
          });
          
          setProjectFiles(fileTree);
        }
      }
    } catch (error) {
      const err = error as Error;
      setConsoleOutput((prev) => [...prev, `❌ Error: ${err.message}`]);
    }
  };

  const readFileContent = async (filePath: string) => {
    if (!localNamespace?.['namespace-id']) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/code-generation/files/${localNamespace?.['namespace-id'] || ''}/${encodeURIComponent(filePath)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setFileContent(data.content);
          return data.content;
        }
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
    return null;
  };

  const routeOutputToTab = (output: any, type: string) => {
    switch (type) {
      case 'schema':
        const newSchema = {
          id: Date.now().toString(),
          name: 'Generated Schema',
          schemaName: 'Generated Schema',
          schema: output,
          content: output,
          saved: false,
          timestamp: new Date()
        };
        setSchemas(prev => [...prev, newSchema]);
        setSchemaNames(prev => ({ ...prev, [newSchema.id]: newSchema.schemaName }));
        setRawSchemas(prev => [...prev, { id: newSchema.id, content: output }]);
        setActiveTab('schema');
        // Removed auto-save to backend for session-only schemas
        break;
        
      case 'api':
        try {
          const apiData = JSON.parse(output);
          
          // Check if this is an OpenAPI spec (has paths object)
          if (apiData.paths && typeof apiData.paths === 'object') {
            console.log('🔍 Parsing OpenAPI spec in routeOutputToTab:', apiData);
            // Parse OpenAPI spec and extract endpoints
            const endpoints = [];
            for (const path in apiData.paths) {
              for (const method in apiData.paths[path]) {
                const endpoint = {
                  path,
                  method: method.toUpperCase(),
                  summary: apiData.paths[path][method].summary || '',
                  description: apiData.paths[path][method].description || '',
                  operation: apiData.paths[path][method]
                };
                endpoints.push(endpoint);
                console.log('📡 Extracted endpoint in routeOutputToTab:', endpoint);
              }
            }
            const newApi = {
              id: Date.now().toString(),
              name: apiData.info?.title || 'Generated API',
              openApi: apiData, // store the full spec for Swagger UI etc.
              endpoints,
              timestamp: new Date()
            };
            setApiEndpoints(prev => [...prev, newApi]);
            setActiveTab('api');
            // Auto-save workspace state when API is added
            setTimeout(() => saveWorkspaceState(), 500);
          } else if (apiData.endpoints || Array.isArray(apiData)) {
            // Handle direct endpoints array format
            const endpoints = Array.isArray(apiData) ? apiData : apiData.endpoints;
            const newApi = {
              id: Date.now().toString(),
              name: 'Generated API',
              endpoints,
              timestamp: new Date()
            };
            setApiEndpoints(prev => [...prev, newApi]);
            setActiveTab('api');
            // Auto-save workspace state when API is added
            setTimeout(() => saveWorkspaceState(), 500);
          }
        } catch (error) {
          console.error('Error parsing API output:', error);
        }
        break;
        
      case 'test':
        setConsoleOutput(prev => [...prev, output]);
        setActiveTab('console');
        break;
        
              case 'file':
          refreshFileTree();
          setActiveTab('files');
          break;
        
        case 'project':
          refreshFileTree();
          setActiveTab('files');
          break;
        
        case 'codegen':
          generateBackendCode();
          break;
        
      default:
        // Just show in chat
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle namespace autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputMessage(value);
    
    // Check for @ symbol
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if there's a space or newline before @ (meaning it's a new mention)
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        
        // Filter namespaces based on query
        const filtered = availableNamespaces.filter(ns => 
          ns['namespace-name']?.toLowerCase().includes(query.toLowerCase())
        );
        
        setNamespaceSuggestions(filtered);
        setShowNamespaceSuggestions(filtered.length > 0);
        setAtSymbolPosition(lastAtIndex);
        setSelectedSuggestionIndex(0);
      } else {
        setShowNamespaceSuggestions(false);
      }
    } else {
      setShowNamespaceSuggestions(false);
    }
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showNamespaceSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < namespaceSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : namespaceSuggestions.length - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectNamespace(namespaceSuggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowNamespaceSuggestions(false);
      }
    }
  };

  // Select a namespace from suggestions
  const selectNamespace = (namespace: any) => {
    if (!namespace) return;
    
    // Remove the @ symbol and query from input
    const beforeAt = inputMessage.substring(0, atSymbolPosition);
    const afterQuery = inputMessage.substring(atSymbolPosition + 1 + 
      inputMessage.substring(atSymbolPosition + 1).split(' ')[0].length
    );
    
    const newMessage = `${beforeAt}${afterQuery}`;
    setInputMessage(newMessage);
    setShowNamespaceSuggestions(false);
    
    // Add the namespace to context as a chip
    if (!droppedNamespaces.find(ns => ns['namespace-id'] === namespace['namespace-id'])) {
      setDroppedNamespaces(prev => [...prev, namespace]);
    }
  };

  const renderFileTree = (files: ProjectFile[], level = 0) => (
    <div className="space-y-1">
      {files.map(file => (
        <div key={file.id}>
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 ${
              selectedFile?.id === file.id ? 'bg-blue-100' : ''
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={async () => {
              setSelectedFile(file);
              if (file.type === 'file' && localNamespace?.['namespace-id']) {
                // Load actual file content
                try {
                  const response = await fetch(`${API_BASE_URL}/code-generation/files/${localNamespace?.['namespace-id'] || ''}/${encodeURIComponent(file.path)}`);
                  
                  if (response.ok) {
                    const data = await response.json();
                    if (data.content) {
                      setFileContent(data.content);
                    } else {
                      setFileContent('// Error loading file content');
                    }
                  }
                } catch (error) {
                  console.error('Error reading file:', error);
                  setFileContent('// Error loading file content');
                }
              }
            }}
          >
            {file.type === 'folder' ? <Folder size={14} /> : <File size={14} />}
            <span className="text-sm">{file.name}</span>
          </div>
          {file.children && renderFileTree(file.children, level + 1)}
        </div>
      ))}
    </div>
  );

  // API Testing logic
  const handleApiTest = async (endpoint: any, index: string) => {
    setApiTestLoading((prev) => ({ ...prev, [index]: true }));
    setApiTestResults((prev) => ({ ...prev, [index]: null }));
    try {
      // Ensure we have valid endpoint data
      if (!endpoint.path || !endpoint.method) {
        throw new Error('Invalid endpoint: missing path or method');
      }
      
      // Find the API that contains this endpoint
      const api = apiEndpoints.find(api => 
        api.endpoints.some((ep: any) => ep.path === endpoint.path && ep.method === endpoint.method)
      );
      
      let url = endpoint.path;
      const method = endpoint.method.split(',')[0].trim().toUpperCase();
      
      // If this is a dynamic API, use the dynamic API endpoint
      if (api?.openApi?.apiId) {
        // Remove leading slash if present
        const cleanPath = endpoint.path.startsWith('/') ? endpoint.path.slice(1) : endpoint.path;
        // Construct the URL
        let url;
        if (api.openApi && api.openApi.apiId) {
          url = `${API_BASE_URL}/dynamic-api/${api.openApi.apiId}/${cleanPath}`;
        } else {
          url = endpoint.path.startsWith('http') ? endpoint.path : `${API_BASE_URL}${endpoint.path}`;
        }
        console.log(`[API Test] Using dynamic API endpoint: ${url}`);
      } else {
        // Fallback to direct URL
        url = endpoint.path.startsWith('http') ? endpoint.path : `http://localhost:5001${endpoint.path}`;
        console.log(`[API Test] Using fallback endpoint: ${url}`);
      }
      
      let res;
      if (method === 'GET') {
        res = await fetch(url);
      } else {
        res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: apiTestInput[index] || '{}',
        });
      }
      
      const data = await res.json();
      setApiTestResults((prev) => ({ ...prev, [index]: data }));
    } catch (e) {
      const err = e as Error;
      setApiTestResults((prev) => ({ ...prev, [index]: { error: err.message } }));
    } finally {
      setApiTestLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleSaveApiToNamespace = async (apiData: any) => {
    if (!localNamespace?.['namespace-id'] || !apiData.canSaveToNamespace) {
      console.warn('Cannot save API: missing namespace or save not allowed');
      return;
    }

    setSavingApi((prev) => ({ ...prev, [apiData.apiId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/save-api-to-namespace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespaceId: localNamespace?.['namespace-id'] || '',
          apiData: apiData
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API saved successfully:', result);
        
        // Update the API data to show it's saved
        setApiEndpoints(prev => prev.map(api => 
          api.openApi?.apiId === apiData.apiId 
            ? { ...api, saved: true, savedAt: new Date().toISOString() }
            : api
        ));
        
        // Add success message
        addMessage({
          role: 'assistant',
          content: `✅ API "${apiData.info?.title || 'Generated API'}" has been saved to namespace "${apiData.namespaceName}". You can now access it from the namespace's API tab.`
        });
      } else {
        throw new Error('Failed to save API');
      }
    } catch (error) {
      console.error('Error saving API:', error);
      addMessage({
        role: 'assistant',
        content: `❌ Failed to save API: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSavingApi((prev) => ({ ...prev, [apiData.apiId]: false }));
    }
  };

  const handleSaveSchemaToNamespace = async (schemaData: any) => {
    setSavingSchema((prev) => ({ ...prev, [schemaData.id || 'schema']: true }));
    try {
      setConsoleOutput(prev => [...prev, `💾 Saving schema to namespace...`]);
      setConsoleOutput(prev => [...prev, `📋 Schema name: ${schemaData.name || 'Unnamed Schema'}`]);
      
      const response = await fetch(`${API_BASE_URL}/save-schema-to-namespace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespaceId: namespace?.['namespace-id'],
          schemaData: {
            name: schemaData.name || 'Generated Schema',
            schema: schemaData.schema,
            namespaceId: namespace?.['namespace-id'] || '',
            url: schemaData.url || '',
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setConsoleOutput(prev => [...prev, `✅ Schema saved successfully!`]);
        setConsoleOutput(prev => [...prev, `📁 Saved to namespace: ${namespace?.['namespace-name'] || 'Unknown'}`]);
        setConsoleOutput(prev => [...prev, `🆔 Namespace ID: ${namespace?.['namespace-id'] || 'Unknown'}`]);
        
        // Show success message
        addMessage({
          role: 'assistant',
          content: `✅ Schema "${schemaData.name || 'Generated Schema'}" has been saved to namespace "${schemaData.namespaceName}". You can now access it from the namespace's Schema tab.`
        });
      } else {
        setConsoleOutput(prev => [...prev, `❌ Failed to save schema: ${response.status}`]);
        throw new Error(`Failed to save schema: ${response.status}`);
      }
    } catch (error) {
      setConsoleOutput(prev => [...prev, `❌ Error saving schema: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      console.error('Error saving schema to namespace:', error);
    } finally {
      setSavingSchema((prev) => ({ ...prev, [schemaData.id || 'schema']: false }));
    }
  };

  const generateBackendCode = async () => {
    console.log('🔍 Generate button clicked!');
    console.log('Namespace:', namespace);
    console.log('Project name:', projectName);
    console.log('Project type:', projectType);
    console.log('Schemas:', schemas);
    console.log('APIs:', apiEndpoints);
    
    if (!namespace?.['namespace-id']) {
      console.log('❌ No namespace ID');
      setConsoleOutput(prev => [...prev, '❌ No namespace ID found']);
      return;
    }
    
    if (!projectName.trim()) {
      console.log('❌ No project name');
      setConsoleOutput(prev => [...prev, '❌ Please enter a project name']);
      return;
    }
    
    // Get current workspace schemas and APIs
    const currentSchemas = schemas.map(s => s.schema);
    const currentApis = apiEndpoints;
    
    console.log('Current schemas:', currentSchemas);
    console.log('Current APIs:', currentApis);
    
    if (currentSchemas.length === 0 && currentApis.length === 0) {
      console.log('❌ No schemas or APIs');
      setConsoleOutput(prev => [...prev, '❌ Please generate at least one schema or API first using the AI agent']);
      return;
    }
    
    try {
      setIsGenerating(true);
      setConsoleOutput(prev => [...prev, `🔄 Generating ${projectType.toUpperCase()} backend code for "${projectName}"...`]);
      setConsoleOutput(prev => [...prev, `📊 Using ${currentSchemas.length} schemas and ${currentApis.length} APIs from workspace`]);
      
      const requestBody = {
        namespaceId: localNamespace?.['namespace-id'] || '',
        schemas: currentSchemas,
        apis: currentApis,
        projectType,
        namespaceName: projectName
      };
      
      console.log('🌐 Making request to:', `${API_BASE_URL}/code-generation/generate-backend`);
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/code-generation/generate-backend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log(' Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Response data:', data);
        
        if (data.success) {
          setConsoleOutput(prev => [...prev, `✅ Generated ${data.files.length} files successfully!`]);
          data.files.forEach((file: any) => {
            setConsoleOutput(prev => [...prev, `📄 Created: ${file.path}`]);
          });
          
          // Add to generation history
          const generationRecord = {
            id: Date.now(),
            projectName,
            projectType,
            filesCount: data.files.length,
            timestamp: new Date(),
            files: data.files
          };
          setGenerationHistory(prev => [generationRecord, ...prev]);
          
          // Refresh file tree to show new files
          await refreshFileTree();
          setActiveTab('files');
          
          setConsoleOutput(prev => [...prev, `🚀 ${projectType.toUpperCase()} project "${projectName}" is ready! Check the Files tab.`]);
        } else {
          setConsoleOutput(prev => [...prev, `❌ Code generation failed: ${data.error}`]);
        }
      } else {
        setConsoleOutput(prev => [...prev, `❌ Code generation failed with status: ${response.status}`]);
      }
    } catch (error) {
      const err = error as Error;
      console.error('❌ Fetch error:', err);
      setConsoleOutput(prev => [...prev, `❌ Error generating code: ${err.message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  // State for saved items
  const [savedApis, setSavedApis] = useState<any[]>([]);
  const [savedFiles, setSavedFiles] = useState<ProjectFile[]>([]);

  // Code generation state
  const [projectType, setProjectType] = useState<'nodejs' | 'python'>('nodejs');
  const [projectName, setProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<any[]>([]);







  // Place function declarations before their first usage
  function generateLambdaFileStructure(lambdaCode: string, functionName: string, runtime: string) {
    console.log('generateLambdaFileStructure called with:', { lambdaCode, functionName, runtime });
    setConsoleOutput(prev => [...prev, `📁 Creating Lambda function structure for: ${functionName}`]);
    
    // Determine file extension based on runtime
    let fileExtension = 'js';
    if (runtime.includes('python')) {
      fileExtension = 'py';
    } else if (runtime.includes('java')) {
      fileExtension = 'java';
    } else if (runtime.includes('go')) {
      fileExtension = 'go';
    }
    
    setConsoleOutput(prev => [...prev, `📄 File extension: ${fileExtension}`]);
    
    // Create the main lambda function file
    const lambdaFileName = `index.${fileExtension}`;
    const lambdaFilePath = `/lambdas/${functionName}/${lambdaFileName}`;
    
    setConsoleOutput(prev => [...prev, `📝 Creating main file: ${lambdaFileName}`]);
    
    // Detect imports in the Lambda code for Node.js lambdas
    let packageJsonContent = '';
    if (runtime.includes('nodejs')) {
      const dependencies: { [key: string]: string } = {};
      
      // Dynamic import detection - parse the code for any require() or import statements
      const importRegex = /(?:require|import)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      const es6ImportRegex = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"`]([^'"`]+)['"`]/g;
      
      let match;
      const detectedImports = new Set<string>();
      
      // Find require() statements
      while ((match = importRegex.exec(lambdaCode)) !== null) {
        const packageName = match[1];
        if (packageName && !packageName.startsWith('.') && !packageName.startsWith('/')) {
          detectedImports.add(packageName);
        }
      }
      
      // Find ES6 import statements
      while ((match = es6ImportRegex.exec(lambdaCode)) !== null) {
        const packageName = match[1];
        if (packageName && !packageName.startsWith('.') && !packageName.startsWith('/')) {
          detectedImports.add(packageName);
        }
      }
      
      // Add detected packages to dependencies with appropriate versions
      detectedImports.forEach(packageName => {
        // Map common packages to their latest stable versions
        const versionMap: { [key: string]: string } = {
          'aws-sdk': '^2.1531.0',
          '@aws-sdk/client-dynamodb': '^3.540.0',
          '@aws-sdk/lib-dynamodb': '^3.540.0',
          '@aws-sdk/client-s3': '^3.540.0',
          '@aws-sdk/client-lambda': '^3.540.0',
          '@aws-sdk/client-sqs': '^3.540.0',
          '@aws-sdk/client-sns': '^3.540.0',
          '@aws-sdk/client-cloudwatch': '^3.540.0',
          'axios': '^1.6.0',
          'lodash': '^4.17.21',
          'moment': '^2.29.4',
          'uuid': '^9.0.1',
          'crypto': '^1.0.1',
          'fs': '^0.0.1-security',
          'path': '^0.12.7',
          'querystring': '^0.2.1',
          'url': '^0.11.3',
          'util': '^0.12.5',
          'zlib': '^1.0.5',
          'stream': '^0.0.2',
          'buffer': '^6.0.3',
          'events': '^3.3.0',
          'http': '^0.0.1-security',
          'https': '^1.0.0',
          'net': '^1.0.2',
          'tls': '^0.0.1',
          'child_process': '^1.0.2',
          'cluster': '^0.7.7',
          'dgram': '^1.0.1',
          'dns': '^0.2.2',
          'domain': '^0.0.1',
          'os': '^0.1.2',
          'punycode': '^2.3.1',
          'readline': '^1.3.0',
          'repl': '^0.1.4',
          'string_decoder': '^1.3.0',
          'sys': '^0.0.1',
          'timers': '^0.1.1',
          'tty': '^1.0.1',
          'v8': '^0.1.0',
          'vm': '^0.1.0'
        };
        
        // Skip built-in Node.js modules
        const builtInModules = [
          'fs', 'path', 'crypto', 'querystring', 'url', 'util', 'zlib', 
          'stream', 'buffer', 'events', 'http', 'https', 'net', 'tls',
          'child_process', 'cluster', 'dgram', 'dns', 'domain', 'os',
          'punycode', 'readline', 'repl', 'string_decoder', 'sys',
          'timers', 'tty', 'vm', 'zlib'
        ];
        
        if (!builtInModules.includes(packageName)) {
          const version = versionMap[packageName] || '^1.0.0'; // Default to latest version
          dependencies[packageName] = version;
          setConsoleOutput(prev => [...prev, `📦 Detected import: ${packageName} (${version})`]);
        }
      });
      
      // Create package.json with detected dependencies
      packageJsonContent = JSON.stringify({
        name: functionName,
        version: "1.0.0",
        description: `AWS Lambda function: ${functionName}`,
        main: "index.js",
        scripts: {
          test: "echo \"Error: no test specified\" && exit 1"
        },
        dependencies: dependencies,
        devDependencies: {},
        keywords: ["aws", "lambda"],
        author: "",
        license: "ISC"
      }, null, 2);
      
      if (Object.keys(dependencies).length > 0) {
        setConsoleOutput(prev => [...prev, `📦 Created package.json with dependencies: ${Object.keys(dependencies).join(', ')}`]);
      } else {
        setConsoleOutput(prev => [...prev, `📦 Created package.json with no external dependencies`]);
      }
    }
    
    // Create the file structure
    const newFiles: ProjectFile[] = [
      {
        id: `lambda-${functionName}-${Date.now()}`,
        name: functionName,
        type: 'folder',
        path: `/lambdas/${functionName}`,
        children: [
          {
            id: `lambda-${functionName}-main-${Date.now()}`,
            name: lambdaFileName,
            type: 'file',
            path: lambdaFilePath,
            content: lambdaCode
          }
        ]
      }
    ];
    
    // Add package.json for Node.js lambdas
    if (packageJsonContent) {
      newFiles[0].children!.push({
        id: `lambda-${functionName}-package-${Date.now()}`,
        name: 'package.json',
        type: 'file',
        path: `/lambdas/${functionName}/package.json`,
        content: packageJsonContent
      });
    }
    
    // Add README.md
    const readmeContent = `# ${functionName}

This is an AWS Lambda function generated by the AI Agent Workspace.

## Runtime
${runtime}

## Handler
${lambdaForm.handler}

## Memory
${lambdaForm.memory} MB

## Timeout
${lambdaForm.timeout} seconds

## Environment Variables
${lambdaForm.environment || 'None'}

## Deployment
This function can be deployed to AWS Lambda using the AWS CLI or AWS Console.

## Local Testing
To test locally, you can use AWS SAM or the AWS Lambda runtime interface emulator.
`;
    
    newFiles[0].children!.push({
      id: `lambda-${functionName}-readme-${Date.now()}`,
      name: 'README.md',
      type: 'file',
      path: `/lambdas/${functionName}/README.md`,
      content: readmeContent
    });
    
    setConsoleOutput(prev => [...prev, `📖 Creating README.md with function documentation`]);
    
    // Update the project files state
    setProjectFiles(prev => {
      // Check if the lambda folder already exists
      const existingLambdaFolder = prev.find(file => 
        file.type === 'folder' && file.name === functionName && file.path === `/lambdas/${functionName}`
      );
      
      if (existingLambdaFolder) {
        // Update existing folder
        setConsoleOutput(prev => [...prev, `🔄 Updating existing Lambda folder: ${functionName}`]);
        return prev.map(file => {
          if (file.id === existingLambdaFolder.id) {
            return {
              ...file,
              children: newFiles[0].children
            };
          }
          return file;
        });
      } else {
        // Add new folder
        setConsoleOutput(prev => [...prev, `✨ Creating new Lambda folder: ${functionName}`]);
        return [...prev, ...newFiles];
      }
    });
    
    setConsoleOutput(prev => [...prev, `✅ Lambda function structure created successfully!`]);
    setConsoleOutput(prev => [...prev, `📂 Files created:`]);
    newFiles[0].children!.forEach(file => {
      setConsoleOutput(prev => [...prev, `   - ${file.name}`]);
    });
    
    console.log(`Created Lambda function structure for ${functionName}`);
  }

  function runProject() {
    console.log('Run Project button clicked!');
    setConsoleOutput(prev => [...prev, '🚀 Starting project deployment...']);
    setIsRunningProject(true);
    setIsDeploying(true);
    
    // Debug: Log current project files structure
    console.log('Current project files:', projectFiles);
    setConsoleOutput(prev => [...prev, `📁 Scanning project files (${projectFiles.length} root items)...`]);
    
    // Find Lambda functions in the project files
    const lambdaFunctions = findLambdaFunctions();
    
    console.log('Found Lambda functions:', lambdaFunctions);
    
    if (lambdaFunctions.length === 0) {
      setConsoleOutput(prev => [...prev, '❌ No Lambda functions found in the project files.']);
      setConsoleOutput(prev => [...prev, '💡 Generate a Lambda function first using the Lambda tab.']);
      setConsoleOutput(prev => [...prev, '🔍 Debug: Available files:']);
      projectFiles.forEach(file => {
        setConsoleOutput(prev => [...prev, `   - ${file.name} (${file.type})`]);
      });
      setIsRunningProject(false);
      setIsDeploying(false);
      return;
    }
    
    setConsoleOutput(prev => [...prev, `📦 Found ${lambdaFunctions.length} Lambda function(s) to deploy:`]);
    lambdaFunctions.forEach(func => {
      setConsoleOutput(prev => [...prev, `   - ${func.name} (${func.runtime})`]);
    });
    
    // Deploy each Lambda function
    deployLambdaFunctions(lambdaFunctions).finally(() => {
      setIsRunningProject(false);
      setIsDeploying(false);
    });
  }

  function findLambdaFunctions(): Array<{name: string, path: string, code: string, runtime: string, handler: string, memory: number, timeout: number, dependencies?: any}> {
    const lambdaFunctions: Array<{name: string, path: string, code: string, runtime: string, handler: string, memory: number, timeout: number, dependencies?: any}> = [];
    
    // Helper function to recursively search for Lambda functions
    function searchForLambdaFunctions(files: ProjectFile[]): void {
      files.forEach(file => {
        if (file.type === 'folder') {
          // Check if this folder contains Lambda function files
          const hasLambdaFiles = file.children?.some(child => 
            child.type === 'file' && (
              child.name === 'index.js' || 
              child.name === 'index.py' || 
              child.name === 'index.java' || 
              child.name === 'main.go'
            )
          );
          
          if (hasLambdaFiles) {
            // This folder contains Lambda function files
            const mainFile = file.children?.find(child => 
              child.type === 'file' && (
                child.name === 'index.js' || 
                child.name === 'index.py' || 
                child.name === 'index.java' || 
                child.name === 'main.go'
              )
            );
            
            if (mainFile && mainFile.content) {
              // Determine runtime based on file extension
              let runtime = 'nodejs18.x';
              let handler = 'index.handler';
              
              if (mainFile.name.endsWith('.py')) {
                runtime = 'python3.9';
                handler = 'index.lambda_handler';
              } else if (mainFile.name.endsWith('.java')) {
                runtime = 'java11';
                handler = 'com.example.Handler::handleRequest';
              } else if (mainFile.name.endsWith('.go')) {
                runtime = 'provided.al2';
                handler = 'bootstrap';
              }
              
              // Extract dependencies from package.json if it exists
              let dependencies = {};
              const packageJsonFile = file.children?.find(child => 
                child.type === 'file' && child.name === 'package.json'
              );
              
              if (packageJsonFile && packageJsonFile.content) {
                try {
                  const packageJson = JSON.parse(packageJsonFile.content);
                  dependencies = packageJson.dependencies || {};
                  console.log(`Found dependencies for ${file.name}:`, dependencies);
                } catch (error) {
                  console.error(`Error parsing package.json for ${file.name}:`, error);
                }
              }
              
              lambdaFunctions.push({
                name: file.name,
                path: file.path,
                code: mainFile.content,
                runtime: runtime,
                handler: handler,
                memory: 128,
                timeout: 30,
                dependencies: dependencies
              });
            }
          }
          
          // Recursively search in children
          if (file.children) {
            searchForLambdaFunctions(file.children);
          }
        }
      });
    }
    
    searchForLambdaFunctions(projectFiles);
    return lambdaFunctions;
  }

  async function deployLambdaFunctions(functions: Array<{name: string, path: string, code: string, runtime: string, handler: string, memory: number, timeout: number, dependencies?: any}>) {
    setConsoleOutput(prev => [...prev, '🌐 Connecting to AWS Lambda deployment service...']);
    
    for (let i = 0; i < functions.length; i++) {
      const func = functions[i];
      const nameToDeploy = (lambdaForm.functionName && lambdaForm.functionName.trim())
        ? lambdaForm.functionName.trim()
        : func.name;
      
      setConsoleOutput(prev => [...prev, `📦 Deploying Lambda function: ${nameToDeploy}`]);
      setConsoleOutput(prev => [...prev, `   Runtime: ${func.runtime}`]);
      setConsoleOutput(prev => [...prev, `   Handler: ${func.handler}`]);
      setConsoleOutput(prev => [...prev, `   Memory: ${func.memory} MB`]);
      setConsoleOutput(prev => [...prev, `   Timeout: ${func.timeout} seconds`]);
      
      try {
        // Use mock deployment for now to avoid AWS role issues
        const deployPayload = {
          functionName: nameToDeploy,
          code: func.code,
          runtime: func.runtime,
          handler: func.handler,
          memorySize: func.memory,
          timeout: func.timeout,
          dependencies: func.dependencies || {},
          environment: lambdaForm.environment || '',
          createApiGateway: true
        };
        
        console.log('Deploying with payload:', deployPayload);
        setConsoleOutput(prev => [...prev, `🔧 Debug: Sending deployment request for real deployment`]);
        if (Object.keys(func.dependencies || {}).length > 0) {
          setConsoleOutput(prev => [...prev, `📦 Dependencies detected: ${Object.keys(func.dependencies || {}).join(', ')}`]);
        }
        
        const deployResponse = await fetch(`${API_BASE_URL}/lambda/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deployPayload)
        });
        
        console.log('Deploy response status:', deployResponse.status);
        
        let deployResult: any = null;
        if (!deployResponse.ok) {
          // If retryable from backend, try once
          if (deployResponse.status === 503) {
            setConsoleOutput(prev => [...prev, '⏳ Transient AWS error (503). Retrying once...']);
            await new Promise(r => setTimeout(r, 1200));
            const retryResp = await fetch(`${API_BASE_URL}/lambda/deploy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(deployPayload)
            });
            if (!retryResp.ok) {
              let errTxt;
              try { const jd = await retryResp.json(); errTxt = jd.details || jd.error || `HTTP ${retryResp.status}`; } catch { errTxt = await retryResp.text(); }
              console.error('Deploy retry error:', errTxt);
              throw new Error(`Deployment failed: ${errTxt}`);
            }
            const retryData = await retryResp.json();
            if (retryData) {
              deployResult = retryData;
              console.log('Deploy result:', deployResult);
              if (deployResult.success) {
                setConsoleOutput(prev => [...prev, `✅ Successfully deployed: ${func.name}`]);
                setConsoleOutput(prev => [...prev, `   Function ARN: ${deployResult.functionArn}`]);
                setConsoleOutput(prev => [...prev, `   Code Size: ${deployResult.codeSize} bytes`]);
                if (deployResult.apiGatewayUrl) {
                  setConsoleOutput(prev => [...prev, `✅ API Gateway created automatically!`]);
                  setConsoleOutput(prev => [...prev, `🌐 API Gateway URL: ${deployResult.apiGatewayUrl}`]);
                  setConsoleOutput(prev => [...prev, `   Endpoint: ${deployResult.apiGatewayUrl}/${deployResult.functionName || func.name}`]);
                }
                // continue to summary below
                // intentionally fall-through
              }
            }
          }
          let errorText;
          try {
            const errorData = await deployResponse.json();
            errorText = errorData.details || errorData.error || `HTTP ${deployResponse.status}`;
          } catch (e) {
            errorText = await deployResponse.text();
          }
          console.error('Deploy error response:', errorText);
          throw new Error(`Deployment failed: ${errorText}`);
        }
        
        if (!deployResult) {
          deployResult = await deployResponse.json();
        }
        console.log('Deploy result:', deployResult);
        
          if (deployResult && deployResult.success) {
          setConsoleOutput(prev => [...prev, `✅ Successfully deployed: ${func.name}`]);
          setConsoleOutput(prev => [...prev, `   Function ARN: ${deployResult.functionArn}`]);
          setConsoleOutput(prev => [...prev, `   Code Size: ${deployResult.codeSize} bytes`]);
          
          // API Gateway is now created automatically during deployment
          if (deployResult.apiGatewayUrl) {
            setConsoleOutput(prev => [...prev, `✅ API Gateway created automatically!`]);
            setConsoleOutput(prev => [...prev, `🌐 API Gateway URL: ${deployResult.apiGatewayUrl}`]);
              setConsoleOutput(prev => [...prev, `   Endpoint: ${deployResult.apiGatewayUrl}/${deployResult.functionName || func.name}`]);
            setConsoleOutput(prev => [...prev, `   API ID: ${deployResult.apiId}`]);
            
            // Store the deployed endpoint for display
            setDeployedEndpoints(prev => [...prev, {
              functionName: deployResult.functionName || func.name,
              apiGatewayUrl: `${deployResult.apiGatewayUrl}/${deployResult.functionName || func.name}`,
              functionArn: deployResult.functionArn,
              deployedAt: new Date()
            }]);
            
            // Add success message to chat
            addMessage({
              role: 'assistant',
              content: `✅ Lambda function "${deployResult.functionName || func.name}" deployed successfully!\n\n🌐 **API Gateway URL:** ${deployResult.apiGatewayUrl}/${deployResult.functionName || func.name}\n\nYou can now invoke your function via HTTP POST requests to this endpoint.`
            });
          } else if (deployResult.apiGatewayError) {
            setConsoleOutput(prev => [...prev, `❌ API Gateway creation failed: ${deployResult.apiGatewayError}`]);
            setConsoleOutput(prev => [...prev, `   Lambda function deployed but no API Gateway trigger created`]);
            setConsoleOutput(prev => [...prev, `   You can manually create an API Gateway trigger in the AWS Console`]);
            
            // Add warning message to chat
            addMessage({
              role: 'assistant',
              content: `⚠️ Lambda function "${func.name}" deployed successfully, but API Gateway creation failed.\n\n**Error:** ${deployResult.apiGatewayError}\n\nYou can manually create an API Gateway trigger in the AWS Console or try deploying again.`
            });
          } else {
            setConsoleOutput(prev => [...prev, `⚠️ API Gateway creation was skipped or failed`]);
            setConsoleOutput(prev => [...prev, `   Using Function URL as fallback`]);
            
            addMessage({
              role: 'assistant',
              content: `✅ Lambda function "${func.name}" deployed successfully!\n\n⚠️ API Gateway was not created. You can invoke the function directly via AWS Lambda.`
            });
          }
          
          // Test the deployed function
          setConsoleOutput(prev => [...prev, `🧪 Testing deployed function: ${func.name}`]);
          
          const testPayload = {
            functionName: deployResult.functionName || func.name,
            payload: {
              test: true,
              message: 'Hello from AI Agent Workspace!',
              timestamp: new Date().toISOString()
            }
          };
          
          console.log('Testing function with payload:', testPayload);
          setConsoleOutput(prev => [...prev, `🔧 Debug: Testing function: ${func.name}`]);
          
          // Test via API Gateway (should always be available now)
          let testResponse;
          if (deployResult.apiGatewayUrl) {
              const apiUrl = `${deployResult.apiGatewayUrl}/${deployResult.functionName || func.name}`;
            setConsoleOutput(prev => [...prev, `🧪 Testing via API Gateway: ${apiUrl}`]);
            testResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(testPayload.payload)
            });
          } else {
            // Fallback to direct invoke if API Gateway creation failed
            setConsoleOutput(prev => [...prev, `🧪 Testing via direct invoke (API Gateway unavailable)`]);
            testResponse = await fetch(`${API_BASE_URL}/lambda/invoke`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(testPayload)
            });
          }
          
          console.log('Test response status:', testResponse.status);
          
          if (testResponse.ok) {
            const testResult = await testResponse.json();
            console.log('Test result:', testResult);
            setConsoleOutput(prev => [...prev, `✅ Function test successful:`]);
            setConsoleOutput(prev => [...prev, `   Status Code: ${testResult.statusCode}`]);
            setConsoleOutput(prev => [...prev, `   Response: ${JSON.stringify(testResult.payload, null, 2)}`]);
            
            if (testResult.logResult) {
              setConsoleOutput(prev => [...prev, `📋 CloudWatch Logs:`]);
              setConsoleOutput(prev => [...prev, testResult.logResult]);
            }
          } else {
            const errorText = await testResponse.text();
            console.error('Test error response:', errorText);
            setConsoleOutput(prev => [...prev, `❌ Function test failed: ${testResponse.status}`]);
            setConsoleOutput(prev => [...prev, `   Error: ${errorText}`]);
          }
          
          setConsoleOutput(prev => [...prev, `🧹 Cleaned up temp files for: ${func.name}`]);
        } else {
          setConsoleOutput(prev => [...prev, `❌ Deployment failed for: ${func.name}`]);
        }
      } catch (error) {
        setConsoleOutput(prev => [...prev, `❌ Error deploying ${func.name}: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
    }
    
    setConsoleOutput(prev => [...prev, '🎉 Project deployment completed!']);
    setConsoleOutput(prev => [...prev, '💡 You can now invoke your Lambda functions from the AWS Console or via API Gateway.']);
    
    // Display deployment summary
    setConsoleOutput(prev => [...prev, '📋 Deployment Summary:']);
    setConsoleOutput(prev => [...prev, '==================']);
    
    // Collect all API Gateway URLs for the summary
    const apiGatewayUrls: Array<{ functionName: string; url: string }> = [];

    // Include any previously stored successful endpoints
    if (deployedEndpoints && deployedEndpoints.length > 0) {
      deployedEndpoints.forEach(ep => {
        apiGatewayUrls.push({ functionName: ep.functionName, url: ep.apiGatewayUrl });
      });
    }
    
    setConsoleOutput(prev => [...prev, '==================']);
    
    if (apiGatewayUrls.length > 0) {
      setConsoleOutput(prev => [...prev, '🌐 API Gateway Endpoints:']);
      apiGatewayUrls.forEach(({ functionName, url }) => {
        setConsoleOutput(prev => [...prev, `   ${functionName}: ${url}`]);
      });
      setConsoleOutput(prev => [...prev, '🚀 Your Lambda functions are now live and accessible via API Gateway!']);
      
      // Add comprehensive summary to chat
      addMessage({
        role: 'assistant',
        content: `🎉 **Deployment Complete!**\n\n✅ Successfully deployed ${lambdaFunctions.length} Lambda function(s)\n\n🌐 **API Gateway Endpoints:**\n${apiGatewayUrls.map(({ functionName, url }) => `• **${functionName}:** \`${url}\``).join('\n')}\n\n💡 **Usage:** Send HTTP POST requests to these endpoints to invoke your Lambda functions.\n\n📋 **Example:**\n\`\`\`bash\ncurl -X POST ${apiGatewayUrls[0].url} \\\n  -H "Content-Type: application/json" \\\n  -d '{"key": "value"}'\n\`\`\``
      });
    } else {
      setConsoleOutput(prev => [...prev, '⚠️ No API Gateway URLs available']);
      addMessage({
        role: 'assistant',
        content: `✅ Lambda functions deployed successfully, but API Gateway creation failed.\n\nYou can still invoke the functions directly via AWS Lambda console or CLI.`
      });
    }
  }

  async function saveFilesToS3() {
    if (projectFiles.length === 0) {
      alert('No files to save to S3');
      return;
    }

    try {
      setIsSavingToS3(true);
      setConsoleOutput(prev => [...prev, '☁️ Saving project files to S3 cloud bucket...']);
      
      // Create a zip file using JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Helper function to add files to zip recursively
      let fileCount = 0;
      function addFilesToZip(files: ProjectFile[], zipFolder: any) {
        files.forEach(file => {
          if (file.type === 'file' && file.content) {
            // Remove leading slash from path
            const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
            zipFolder.file(filePath, file.content);
            fileCount++;
          } else if (file.type === 'folder' && file.children) {
            // Create folder in zip
            const folderPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
            const folder = zipFolder.folder(folderPath);
            if (folder) {
              addFilesToZip(file.children, folder);
            }
          }
        });
      }
      
      // Add all files to zip
      setConsoleOutput(prev => [...prev, '📁 Adding files to ZIP archive...']);
      addFilesToZip(projectFiles, zip);
      setConsoleOutput(prev => [...prev, `✅ Added ${fileCount} file(s) to archive`]);
      
      setConsoleOutput(prev => [...prev, '📝 Generating ZIP file...']);
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Convert blob to base64 for sending to backend
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
      });
      reader.readAsDataURL(zipBlob);
      const base64Data = await base64Promise;
      
      // Send to backend for S3 upload
      setConsoleOutput(prev => [...prev, '🚀 Uploading to S3...']);
      
      const response = await fetch(`${API_BASE_URL}/workspace/save-files-to-s3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespaceId: namespace?.['namespace-id'],
          projectName: namespace?.['namespace-name'] || 'unnamed-project',
          zipData: base64Data,
          fileCount: fileCount,
          files: projectFiles.map(file => ({
            name: file.name,
            path: file.path,
            type: file.type
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Files] S3 save result:', result);
        
        setConsoleOutput(prev => [...prev, `✅ Files saved to S3 successfully!`]);
        setConsoleOutput(prev => [...prev, `📁 S3 Bucket: ${result.bucket}`]);
        setConsoleOutput(prev => [...prev, `🔗 S3 Key: ${result.s3Key}`]);
        setConsoleOutput(prev => [...prev, `📊 Files saved: ${result.filesSaved}`]);
        
        if (result.metadataId) {
          setConsoleOutput(prev => [...prev, `💾 Metadata saved to DynamoDB: ${result.metadataId}`]);
        }
        
        addMessage({
          role: 'assistant',
          content: `✅ Project files saved to S3 cloud bucket successfully!

📁 **S3 Location:** ${result.s3Url}
📊 **Files Saved:** ${result.filesSaved}
💾 **Metadata ID:** ${result.metadataId || 'N/A'}

Your files are now safely stored in the cloud and can be accessed anytime.`
        });
      } else {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('[Files] Error saving to S3:', error);
      setConsoleOutput(prev => [...prev, `❌ Failed to save files to S3: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      
      addMessage({
        role: 'assistant',
        content: `❌ Failed to save project files to S3: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSavingToS3(false);
    }
  }

  async function downloadProjectFiles() {
    if (projectFiles.length === 0) {
      alert('No files to download');
      return;
    }

    try {
      setIsDownloading(true);
      setConsoleOutput(prev => [...prev, '📦 Preparing project files for download...']);
      
      // Create a zip file using JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Helper function to add files to zip recursively
      let fileCount = 0;
      function addFilesToZip(files: ProjectFile[], zipFolder: any) {
        files.forEach(file => {
          if (file.type === 'file' && file.content) {
            // Remove leading slash from path
            const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
            zipFolder.file(filePath, file.content);
            fileCount++;
          } else if (file.type === 'folder' && file.children) {
            // Create folder in zip
            const folderPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
            const folder = zipFolder.folder(folderPath);
            if (folder) {
              addFilesToZip(file.children, folder);
            }
          }
        });
      }
      
      // Add all files to zip
      setConsoleOutput(prev => [...prev, '📁 Adding files to ZIP archive...']);
      addFilesToZip(projectFiles, zip);
      setConsoleOutput(prev => [...prev, `✅ Added ${fileCount} file(s) to archive`]);
      
      setConsoleOutput(prev => [...prev, '📝 Generating ZIP file...']);
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-agent-project-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setConsoleOutput(prev => [...prev, '✅ Project files downloaded successfully!']);
      setConsoleOutput(prev => [...prev, `📁 File: ai-agent-project-${Date.now()}.zip`]);
      
    } catch (error) {
      console.error('Error downloading project files:', error);
      setConsoleOutput(prev => [...prev, `❌ Error downloading project files: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsDownloading(false);
    }
  }

  // Function to download individual files
  const downloadFile = (fileName: string, content: string, mimeType: string = 'application/json') => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setConsoleOutput(prev => [...prev, `📥 Downloaded: ${fileName}`]);
    } catch (error) {
      console.error('Error downloading file:', error);
      setConsoleOutput(prev => [...prev, `❌ Error downloading ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  async function saveLambdaToNamespace() {
    if (!generatedLambdaCode || !lambdaForm.functionName) {
      alert('Please generate Lambda code and provide a function name first');
      return;
    }

    try {
      setIsSavingLambda(true);
      setConsoleOutput(prev => [...prev, '💾 Saving Lambda function to namespace library...']);
      
      // Generate a unique ID for this Lambda
      const lambdaId = `lambda-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create Lambda metadata
      const lambdaData = {
        id: lambdaId,
        functionName: lambdaForm.functionName,
        apiGatewayUrl: '', // Will be populated after deployment
        functionArn: '', // Will be populated after deployment
        description: lambdaForm.description || `Lambda function: ${lambdaForm.functionName}`,
        code: generatedLambdaCode,
        runtime: lambdaForm.runtime,
        handler: lambdaForm.handler,
        memory: lambdaForm.memory,
        timeout: lambdaForm.timeout,
        environment: lambdaForm.environment,
        savedAt: new Date(),
        namespaceId: namespace?.['namespace-id'] || 'unknown'
      };
      
      // Save to backend
      const response = await fetch(`${API_BASE_URL}/workspace/save-lambda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespaceId: namespace?.['namespace-id'],
          lambdaData: lambdaData
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Lambda] Save result:', result);
        
        // Add to local state
        setSavedLambdas(prev => [...prev, lambdaData]);
        
        setConsoleOutput(prev => [...prev, `✅ Lambda function saved to namespace library!`]);
        setConsoleOutput(prev => [...prev, `📝 Function Name: ${lambdaForm.functionName}`]);
        setConsoleOutput(prev => [...prev, `🆔 Lambda ID: ${lambdaId}`]);
        setConsoleOutput(prev => [...prev, `💾 Saved to namespace: ${namespace?.['namespace-name'] || 'Unknown'}`]);
        
        addMessage({
          role: 'assistant',
          content: `✅ Lambda function saved to namespace library!

📝 **Function Name:** ${lambdaForm.functionName}
🆔 **Lambda ID:** ${lambdaId}
💾 **Namespace:** ${namespace?.['namespace-name'] || 'Unknown'}

🚀 **Next Steps:** 
• Deploy the function to get the API Gateway URL
• The function is now available in your namespace library for future use`
        });
      } else {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('[Lambda] Error saving to namespace:', error);
      setConsoleOutput(prev => [...prev, `❌ Error saving Lambda to namespace: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      
      addMessage({
        role: 'assistant',
        content: `❌ Error saving Lambda function to namespace: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSavingLambda(false);
    }
  };

  return (
    <div 
      ref={namespaceDropRef as any}
      className={`fixed top-0 right-0 h-full flex flex-col bg-white shadow-2xl border-l border-gray-200 z-[60] pointer-events-auto transform transition-all duration-500 ease-out animate-slide-in-right ${
        isNamespaceDropOver ? 'bg-blue-50 border-2 border-blue-400' : 
        isSchemaDropOver ? 'bg-purple-50 border-2 border-purple-400' : ''
      }`}
      style={{ 
        width: `${workspaceWidth}px`,
        maxWidth: `${workspaceWidth}px`
      }}
    >
      {/* Resize Handle */}
      <div 
        className={`absolute left-0 top-0 h-full w-1 cursor-ew-resize hover:bg-blue-400 transition-colors z-10 ${isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-300'}`}
        onMouseDown={handleResizeStart}
        title="Drag to resize workspace width"
      >
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-blue-400 rounded-r opacity-0 hover:opacity-100 transition-opacity"></div>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">AI Assistant</h2>
            <div className="text-sm text-gray-500">
              {(localNamespace || droppedNamespaces.length > 0) ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium">Working with:</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {(localNamespace ? 1 : 0) + droppedNamespaces.length} Namespace(s)
                  </span>
                  </div>
                  {localNamespace && (
                    <div className="text-xs text-gray-600 ml-2">
                      • {localNamespace['namespace-name']} (current)
                    </div>
                  )}
                  {droppedNamespaces.map((ns, index) => (
                    <div key={ns['namespace-id'] || ns.id || index} className="text-xs text-gray-600 ml-2">
                      • {ns['namespace-name'] || ns.name || 'Unknown Namespace'}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <span>General Development</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Namespace Generation Mode
                  </span>
                </span>
              )}
              {sessionId && (
                <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Memory Active
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-white px-4 pt-2">
        <button
          onClick={() => setActiveTab('lambda')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === 'lambda'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Code size={16} /> Lambda
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === 'api'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Database size={16} /> API
        </button>
        <button
          onClick={() => setActiveTab('web-scraping')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === 'web-scraping'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={16} /> Web Scraping
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === 'files'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Folder size={16} /> Files
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === 'schema'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Database size={16} /> Schema
        </button>
        <button
          onClick={() => setActiveTab('deployment')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === 'deployment'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Play size={16} /> Deployment
        </button>
        <button
          onClick={() => setActiveTab('console')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === 'console'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Play size={16} /> Console
        </button>
      </div>

      {/* Generated Code Dropdown */}
      {generatedLambdaCode && (
        <div className="border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Generated Code</h3>
            <button
              onClick={() => setShowGeneratedCode(!showGeneratedCode)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showGeneratedCode ? 'Hide' : 'Show'}
            </button>
          </div>
          {showGeneratedCode && (
            <div className="p-4 bg-gray-50 max-h-64 overflow-y-auto">
            <div className="mb-4">
                <h4 className="font-medium text-sm mb-2">Lambda Code:</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {generatedLambdaCode}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

        {/* Main Content Area - Takes remaining space */}
        <div className={`flex-1 overflow-auto p-4 bg-[#f8f9fb] ${activeTab === 'lambda' ? 'hidden' : ''}`}>
        {activeTab === 'lambda' && (
          <div className="h-full overflow-y-auto hidden">
            <h3 className="font-medium text-lg mb-2">Lambda Code Generation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Generate AWS Lambda function code using AI. Describe what you want to build and get ready-to-use code.
            </p>
            
            {/* Lambda Code Display */}
                {generatedLambdaCode && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Generated Lambda Code</h4>
                  <div className="flex gap-2">
                  <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLambdaCode);
                        setConsoleOutput(prev => [...prev, '📋 Lambda code copied to clipboard']);
                      }}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Copy Code
                  </button>
                    <button
                      onClick={() => setGeneratedLambdaCode('')}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Clear
                    </button>
              </div>
                </div>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{generatedLambdaCode}</pre>
            </div>
          </div>
        )}
            
          </div>
        )}
        
        {activeTab === 'api' && (
          <div className="h-full overflow-y-auto">
            <h3 className="font-medium text-lg mb-2">API Method Creation & Management</h3>
              <p className="text-sm text-gray-600 mb-4">
              Create reusable API methods from API Gateway URLs with OpenAPI specifications. 
              Generate methods that can be overridden with different URLs and saved to your namespace.
                <br />
              <span className="text-blue-600 font-medium">💡 Tip:</span> Use deployed Lambda endpoints or any API Gateway URL to create methods!
            </p>
            
            {/* API Method Creation Agent */}
            <APIMethodCreationAgent 
              namespace={localNamespace}
              deployedEndpoints={deployedEndpoints}
              onMethodCreated={(method) => {
                console.log('New method created:', method);
                // Optionally refresh namespace data or show success message
              }}
            />
          </div>
        )}
        {activeTab === 'web-scraping' && (
          <div className="h-full overflow-y-auto">
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Web Scraping Agent</h3>
              <p className="text-sm text-gray-600 mb-4">
                Automatically scrape APIs, schemas, and documentation from popular services like Shopify, Pinterest, Google, Stripe, and GitHub.
                <br />
                <span className="text-blue-600 font-medium">💡 Tip:</span> Select a service and click "Scrape & Save" to import everything into your namespace!
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">Instructions:</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Select a service from the dropdown below</li>
                  <li>• Choose what to scrape (APIs, Schemas, Documentation)</li>
                  <li>• Click "Preview" to see what will be scraped</li>
                  <li>• Click "Scrape & Save" to import everything to your namespace</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-4">Service Selection</h4>
              
              {/* Debug info */}
              <div className="text-xs text-gray-500 mb-2">
                Debug: selectedService = "{selectedService}", customUrl = "{customUrl}", supportedServices count = {supportedServices.length}
                <br />
                Should show custom URL input: {selectedService === 'custom-url' ? 'YES' : 'NO'}
                <br />
                <button 
                  onClick={() => {
                    console.log('Test button clicked');
                    setSelectedService('custom-url');
                    setCustomUrl('https://example.com');
                  }}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                >
                  Test: Set Custom URL
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service or URL</label>
                  <select 
                    value={selectedService} 
                    onChange={(e) => {
                      console.log('Service selection changed:', e.target.value);
                      setSelectedService(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  >
                    <option value="">Select a service or enter custom URL...</option>
                    {supportedServices.map(service => (
                      <option key={service.key} value={service.key}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  
                  {selectedService === 'custom-url' && (
                    <input
                      type="url"
                      placeholder="Enter any URL (e.g., https://api.example.com/docs)"
                      value={customUrl}
                      onChange={(e) => {
                        console.log('Custom URL input changed:', e.target.value);
                        setCustomUrl(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={scrapeOptions.apis} 
                        onChange={(e) => setScrapeOptions(prev => ({ ...prev, apis: e.target.checked }))}
                        className="mr-2"
                      />
                      Scrape APIs
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={scrapeOptions.schemas} 
                        onChange={(e) => setScrapeOptions(prev => ({ ...prev, schemas: e.target.checked }))}
                        className="mr-2"
                      />
                      Scrape Schemas
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={scrapeOptions.documentation} 
                        onChange={(e) => setScrapeOptions(prev => ({ ...prev, documentation: e.target.checked }))}
                        className="mr-2"
                      />
                      Scrape Documentation
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={scrapeOptions.followLinks} 
                        onChange={(e) => setScrapeOptions(prev => ({ ...prev, followLinks: e.target.checked }))}
                        className="mr-2"
                      />
                      Follow Links (find more content)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handlePreviewScrape}
                  disabled={!selectedService || isScraping}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScraping ? 'Scraping...' : 'Preview'}
                </button>
                <button
                  onClick={handleScrapeAndSave}
                  disabled={!selectedService || isScraping}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScraping ? 'Scraping...' : 'Scrape & Save'}
                </button>
              </div>
            </div>
            

            
            {scrapedData && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Scraped Data Preview</h4>
                  <button
                    onClick={() => setShowAllScrapedData(true)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View All Data
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <h5 className="font-medium text-blue-800">APIs</h5>
                    <p className="text-2xl font-bold text-blue-600">{scrapedData.apis?.length || 0}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <h5 className="font-medium text-green-800">Schemas</h5>
                    <p className="text-2xl font-bold text-green-600">{scrapedData.schemas?.length || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <h5 className="font-medium text-purple-800">Documentation</h5>
                    <p className="text-2xl font-bold text-purple-600">{scrapedData.documentation?.length || 0}</p>
                  </div>
                </div>
                
                {/* Detailed Data Display */}
                <div className="space-y-4">
                  {/* APIs Section */}
                  {scrapedData.apis && scrapedData.apis.length > 0 && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                        <span>🔗</span>
                        APIs ({scrapedData.apis.length})
                      </h5>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {scrapedData.apis.slice(0, 10).map((api: any, index: number) => (
                          <div key={index} className="bg-white p-3 rounded border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-blue-700">{api.name || api.endpoint}</h6>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {api.format || 'API'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{api.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="bg-gray-100 px-2 py-1 rounded">{api.method || 'GET'}</span>
                              <span className="truncate">{api.url}</span>
                            </div>
                            {api.openapiSpec && (
                              <details className="mt-2">
                                <summary className="text-xs text-blue-600 cursor-pointer">View OpenAPI Spec</summary>
                                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                  {JSON.stringify(api.openapiSpec, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                        {scrapedData.apis.length > 10 && (
                          <div className="text-center text-sm text-gray-500">
                            ... and {scrapedData.apis.length - 10} more APIs
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Schemas Section */}
                  {scrapedData.schemas && scrapedData.schemas.length > 0 && (
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <h5 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                        <span>📋</span>
                        Schemas ({scrapedData.schemas.length})
                      </h5>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {scrapedData.schemas.slice(0, 5).map((schema: any, index: number) => (
                          <div key={index} className="bg-white p-3 rounded border border-green-100">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-green-700">{schema.name}</h6>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                {schema.format || 'JSON'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{schema.description}</p>
                            {schema.schema && (
                              <details className="mt-2">
                                <summary className="text-xs text-green-600 cursor-pointer">View JSON Schema</summary>
                                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                  {JSON.stringify(schema.schema, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                        {scrapedData.schemas.length > 5 && (
                          <div className="text-center text-sm text-gray-500">
                            ... and {scrapedData.schemas.length - 5} more schemas
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Documentation Section */}
                  {scrapedData.documentation && scrapedData.documentation.length > 0 && (
                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                      <h5 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                        <span>📚</span>
                        Documentation ({scrapedData.documentation.length})
                      </h5>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {scrapedData.documentation.slice(0, 5).map((doc: any, index: number) => (
                          <div key={index} className="bg-white p-3 rounded border border-purple-100">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-purple-700">{doc.title}</h6>
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {doc.format || 'PDF'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{doc.content}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Section {doc.section}</span>
                              {doc.url && (
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" 
                                   className="text-purple-600 hover:underline">
                                  View Source
                                </a>
                              )}
                            </div>
                            {doc.data && doc.contentType && (
                              <details className="mt-2">
                                <summary className="text-xs text-purple-600 cursor-pointer">View Document Data</summary>
                                <div className="text-xs bg-gray-100 p-2 rounded mt-1">
                                  <p><strong>Content Type:</strong> {doc.contentType}</p>
                                  <p><strong>Data Size:</strong> {Math.round(doc.data.length / 1024)} KB</p>
                                  <p><strong>Format:</strong> {doc.format}</p>
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                        {scrapedData.documentation.length > 5 && (
                          <div className="text-center text-sm text-gray-500">
                            ... and {scrapedData.documentation.length - 5} more documents
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Errors Section */}
                  {scrapedData.errors && scrapedData.errors.length > 0 && (
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <h5 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                        <span>⚠️</span>
                        Errors ({scrapedData.errors.length})
                      </h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {scrapedData.errors.map((error: string, index: number) => (
                          <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">Scraping Log</h4>
              <div className="bg-gray-100 p-3 rounded text-xs overflow-y-auto max-h-40">
                {scrapingLog.length > 0 ? (
                  scrapingLog.map((log, index) => (
                    <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
                      {log.timestamp}: {log.message}
                    </div>
                  ))
                ) : (
                  'No scraping activity yet...'
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'schema' && (
          <div className="h-full overflow-y-auto">
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Schema Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use the chat below to generate and manage schemas. The AI will create schemas based on your descriptions.
                <br />
                <span className="text-blue-600 font-medium">💡 Tip:</span> Drag any schema below to the chat area to provide context for your AI conversations!
              </p>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Generated Schemas</h4>
                {isStreamingSchema && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-600">Live</span>
                  </div>
                )}
                {Object.values(savingSchema).some(Boolean) && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Saving</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <span className="text-sm text-gray-600">
                  {schemas.length > 0 ? 'Schema generated' : 'No schema generated yet'}
                </span>
              </div>
            </div>
            
            {/* Live Streaming Preview */}
            {isStreamingSchema && (
              <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-700">Live Schema Generation</span>
                </div>
                <pre className="text-sm overflow-x-auto bg-white p-3 rounded border">
                  {liveSchema || 'Waiting for schema...'}
                </pre>
              </div>
            )}
            
            {schemas.length === 0 ? (
              <div className="text-gray-500">No schemas generated yet...</div>
            ) : (
              <div className="space-y-4">
                {schemas.map((schema: any, index: number) => (
                  <div 
                    key={schema.id} 
                    className={`border border-gray-200 rounded-lg p-4 ${isEditingSchema && index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-white'} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-gray-400">
                          <span className="text-xs">📋</span>
                        </div>
                        <h4 className="font-medium">{schema.schemaName || schema.name || 'Unnamed Schema'}</h4>
                        {schema.edited && (
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">Edited</span>
                        )}
                        {!schema.saved && (
                          <>
                            <input
                              type="text"
                              className="border rounded px-2 py-1 text-xs mr-2"
                              placeholder="Schema Name"
                              value={schemaNames[schema.id] || ''}
                              onChange={e => setSchemaNames(prev => ({ ...prev, [schema.id]: e.target.value }))}
                              style={{ minWidth: 120 }}
                            />
                            <button
                              onClick={async () => {
                                setSavingSchema((prev) => ({ ...prev, [schema.id]: true }));
                                try {
                                  setConsoleOutput(prev => [...prev, `💾 Saving schema "${schemaNames[schema.id] || schema.schemaName || schema.name || 'Unnamed Schema'}" to namespace...`]);
                                  
                                  const payload = {
                                    namespaceId: namespace?.['namespace-id'],
                                    schemaName: schemaNames[schema.id] || schema.schemaName || schema.name || 'Unnamed Schema',
                                    schemaType: schema.schemaType || (schema.schema && schema.schema.type) || 'object',
                                    schema: schema.schema,
                                    isArray: schema.isArray || false,
                                    originalType: schema.originalType || (schema.schema && schema.schema.type) || 'object',
                                    url: schema.url || '',
                                  };
                                  
                                  const response = await fetch(`${API_BASE_URL}/save-schema-to-namespace`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload)
                                  });
                                  
                                  if (response.ok) {
                                    const result = await response.json();
                                    setConsoleOutput(prev => [...prev, `✅ Schema saved successfully! Schema ID: ${result.schemaId}`]);
                                    
                                    // Update the schemas list to mark as saved
                                    setSchemas(prev => prev.map(s => s.id === schema.id ? { 
                                      ...s, 
                                      saved: true, 
                                      schemaName: payload.schemaName,
                                      schemaId: result.schemaId 
                                    } : s));
                                    
                                    // Refresh the saved schemas list for the Lambda dropdown
                                    try {
                                      const schemasResponse = await fetch(`/unified/schema?namespaceId=${namespace?.['namespace-id']}`);
                                      if (schemasResponse.ok) {
                                        const updatedSchemas = await schemasResponse.json();
                                        setSchemas(updatedSchemas);
                                        setConsoleOutput(prev => [...prev, `🔄 Updated saved schemas list (${updatedSchemas.length} schemas available)`]);
                                      }
                                    } catch (refreshError) {
                                      console.error('Error refreshing schemas:', refreshError);
                                      setConsoleOutput(prev => [...prev, `⚠️ Warning: Could not refresh schemas list automatically`]);
                                    }
                                    
                                    // Dispatch event to refresh other components
                                    if (typeof window !== 'undefined' && window.dispatchEvent) {
                                      window.dispatchEvent(new CustomEvent('refresh-unified-namespace'));
                                    }
                                    
                                    setConsoleOutput(prev => [...prev, `📋 Schema "${payload.schemaName}" is now available in your namespace!`]);
                                  } else {
                                    const errorData = await response.json();
                                    setConsoleOutput(prev => [...prev, `❌ Failed to save schema: ${errorData.error || 'Unknown error'}`]);
                                  }
                                } catch (error) {
                                  console.error('Error saving schema:', error);
                                  setConsoleOutput(prev => [...prev, `❌ Error saving schema: ${error instanceof Error ? error.message : 'Unknown error'}`]);
                                } finally {
                                  setSavingSchema((prev) => ({ ...prev, [schema.id]: false }));
                                }
                              }}
                              disabled={savingSchema[schema.id] || !(schemaNames[schema.id] && schemaNames[schema.id].trim())}
                              className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                            >
                              {savingSchema[schema.id] ? 'Saving...' : 'Save to Namespace'}
                            </button>
                          </>
                        )}
                        {schema.saved && (
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Saved</span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowRawSchema(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        {showRawSchema[index] ? 'Hide Raw' : 'Show Raw'}
                      </button>
                    </div>
                    {showRawSchema[index] ? (
                      <pre className="text-sm overflow-x-auto">
                        {(rawSchemas.find(r => r.id === schema.id)?.content) || JSON.stringify(schema.schema, null, 2)}
                      </pre>
                    ) : (
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(schema.schema, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'files' && (
          <div className="h-full flex">
            {/* File Tree Panel */}
            <div className="w-1/3 border-r border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Files</h3>
                <div className="flex gap-2">
                  <button
                    onClick={saveFilesToS3}
                    disabled={projectFiles.length === 0 || isSavingToS3}
                    className={`p-2 rounded-lg transition-colors ${
                      projectFiles.length === 0 || isSavingToS3
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                    title={isSavingToS3 ? 'Saving to S3...' : 'Save all project files to S3 cloud bucket'}
                  >
                    <Cloud className="w-4 h-4" />
                  </button>
                  <button
                    onClick={downloadProjectFiles}
                    disabled={projectFiles.length === 0 || isDownloading}
                    className={`p-2 rounded-lg transition-colors ${
                      projectFiles.length === 0 || isDownloading
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    title={isDownloading ? 'Downloading...' : 'Download all project files as ZIP'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={refreshFileTree}
                    className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    title="Refresh file tree"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                {projectFiles.length === 0 ? (
                  <div className="text-gray-500 text-sm">No files found...</div>
                ) : (
                  renderFileTree(projectFiles)
                )}
              </div>
            </div>
            
            {/* File Content Panel */}
            <div className="flex-1 p-4">
              {selectedFile ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">{selectedFile.name}</h3>
                    <span className="text-sm text-gray-500">{selectedFile.path}</span>
                  </div>
                  <div className="flex-1 overflow-auto bg-gray-900 text-green-400 font-mono text-sm rounded-lg p-4">
                    {selectedFile.content || fileContent ? (
                      <pre className="whitespace-pre-wrap">{selectedFile.content || fileContent}</pre>
                    ) : (
                      <div className="text-gray-500">Select a file to view its content...</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Folder size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Select a file from the tree to view its content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'deployment' && (
          <div className="h-full overflow-y-auto">
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Deployment Configuration</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure Lambda function deployment settings and deploy your project.
              </p>
            </div>
            
            {/* Deployed Endpoints Section */}
            {deployedEndpoints.length > 0 && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">🌐 Deployed API Gateway Endpoints</h4>
                <div className="space-y-3">
                  {deployedEndpoints.map((endpoint, index) => (
                    <div key={index} className="bg-white border border-green-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-700">{endpoint.functionName}</span>
                        <span className="text-xs text-green-600">
                          {endpoint.deployedAt.toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">API Gateway URL:</span>
                          <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs break-all">
                            {endpoint.apiGatewayUrl}
                          </code>
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Function ARN:</span>
                          <span className="ml-2 break-all">{endpoint.functionArn}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(endpoint.apiGatewayUrl);
                            setConsoleOutput(prev => [...prev, `📋 Copied API Gateway URL to clipboard: ${endpoint.apiGatewayUrl}`]);
                          }}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Copy URL
                        </button>
                        <button
                          onClick={() => {
                            const testUrl = endpoint.apiGatewayUrl;
                            setConsoleOutput(prev => [...prev, `🧪 Testing endpoint: ${testUrl}`]);
                            fetch(testUrl, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ test: true, message: 'Hello from deployment tab!' })
                            })
                              .then(res => res.json())
                              .then(data => {
                                setConsoleOutput(prev => [...prev, `✅ Test successful: ${JSON.stringify(data)}`]);
                              })
                              .catch(err => {
                                setConsoleOutput(prev => [...prev, `❌ Test failed: ${err.message}`]);
                              });
                          }}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Test Endpoint
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Lambda Configuration</h4>
                

                
                <div>
                  <label className="block font-semibold mb-1">Function Name</label>
                  <input
                    className="w-full border rounded px-2 py-1 mb-2"
                    value={lambdaForm.functionName}
                    onChange={e => setLambdaForm(f => ({ ...f, functionName: e.target.value }))}
                    placeholder="handler.js"
                    required
                  />
                </div>
                
                <div>
                  <label className="block font-semibold mb-1">Runtime</label>
                  <select
                    className="w-full border rounded px-2 py-1 mb-2"
                    value={lambdaForm.runtime}
                    onChange={e => setLambdaForm(f => ({ ...f, runtime: e.target.value }))}
                  >
                    <option value="nodejs18.x">Node.js 18.x</option>
                    <option value="nodejs20.x">Node.js 20.x</option>
                    <option value="python3.12">Python 3.12</option>
                    <option value="python3.11">Python 3.11</option>
                    <option value="python3.10">Python 3.10</option>
                    <option value="java21">Java 21</option>
                    <option value="java17">Java 17</option>
                    <option value="java11">Java 11</option>
                    <option value="dotnet8">.NET 8</option>
                    <option value="dotnet6">.NET 6</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-semibold mb-1">Handler</label>
                  <input
                    className="w-full border rounded px-2 py-1 mb-2"
                    value={lambdaForm.handler}
                    onChange={e => setLambdaForm(f => ({ ...f, handler: e.target.value }))}
                    placeholder="index.handler"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Resource Configuration</h4>
                
                <div>
                  <label className="block font-semibold mb-1">Memory (MB)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1 mb-2"
                    value={lambdaForm.memory}
                    min={128}
                    max={10240}
                    onChange={e => setLambdaForm(f => ({ ...f, memory: Number(e.target.value) }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block font-semibold mb-1">Timeout (seconds)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1 mb-2"
                    value={lambdaForm.timeout}
                    min={1}
                    max={900}
                    onChange={e => setLambdaForm(f => ({ ...f, timeout: Number(e.target.value) }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block font-semibold mb-1">Environment Variables (JSON)</label>
                  <textarea
                    className="w-full border rounded px-2 py-1 mb-2 font-mono"
                    value={lambdaForm.environment}
                    onChange={e => setLambdaForm(f => ({ ...f, environment: e.target.value }))}
                    placeholder='{"KEY":"VALUE"}'
                    rows={3}
                  />
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={runProject}
                    disabled={isRunningProject}
                    className={`w-full px-4 py-2 text-sm rounded ${
                      isRunningProject 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    {isRunningProject ? 'Deploying...' : 'Deploy Project'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'console' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Console Output</h3>
                {isDeploying && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Deploying</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConsoleOutput([])}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-b-lg">
              {consoleOutput.length === 0 ? (
                <div className="text-gray-500">No console output yet...</div>
              ) : (
                consoleOutput.map((output: string, index: number) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-400">$ </span>
                    {output}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>


      {/* Chat Messages Area - Show only for lambda tab */}
      {activeTab === 'lambda' && (
      <div 
          ref={sidebarSchemaDropRef as any}
        className={`flex-1 overflow-y-auto p-4 space-y-4 bg-white transition-colors ${
            isSidebarSchemaDropOver ? 'bg-purple-50 border-2 border-dashed border-purple-300' : ''
        }`}
      >
        {activeTab === 'lambda' && isSidebarSchemaDropOver && (
          <div className="text-center py-8 text-purple-600 font-medium">
            Drop schema here to add context
          </div>
        )}
        
        {/* Namespace Generation Mode Hint */}
        {activeTab === 'lambda' && !namespace && messages.length === 0 && !isSidebarSchemaDropOver && (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🚀 Namespace Generation Mode</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create complete namespaces from scratch! Describe what you want to build and I'll generate:
              </p>
              <div className="text-left text-xs text-gray-500 space-y-1">
                <div>• <strong>Schemas</strong> - Data models and structures</div>
                <div>• <strong>API Methods</strong> - REST endpoints</div>
                <div>• <strong>Account Types</strong> - Authentication systems</div>
                <div>• <strong>Webhooks</strong> - Event integrations</div>
                <div>• <strong>Lambda Functions</strong> - Serverless logic</div>
              </div>
              <div className="mt-4 p-3 bg-white rounded border border-blue-100">
                <p className="text-xs text-gray-600 font-medium mb-1">Try prompts like:</p>
                <p className="text-xs text-blue-600">"Create a complete e-commerce system"</p>
                <p className="text-xs text-blue-600">"Generate a social media platform namespace"</p>
                <p className="text-xs text-blue-600">"Build a project management tool"</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Code Generation Tips - Only show for Lambda tab */}
        {activeTab === 'lambda' && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Code Generation Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Describe the function's purpose clearly</li>
              <li>• Specify the programming language (Node.js, Python, etc.)</li>
              <li>• Mention any AWS services you want to integrate with</li>
              <li>• Include error handling requirements</li>
            </ul>
          </div>
        )}
        
        {activeTab === 'lambda' && messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div 
                className="whitespace-pre-wrap"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#download:')) {
                    e.preventDefault();
                    const fileName = target.getAttribute('href')?.replace('#download:', '');
                    if (fileName) {
                      const file = uploadedFiles.find(f => f.name === fileName);
                      if (file && file.content) {
                        downloadFile(file.name, file.content, file.type);
                      }
                    }
                  }
                }}
                dangerouslySetInnerHTML={{
                  __html: message.content.replace(
                    /\[📄 Download ([^\]]+)\]\(#download:([^)]+)\)/g,
                    '<a href="#download:$2" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">📄 Download $1</a>'
                  )
                }}
              />
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      )}

      {/* File Upload and Context Area */}
      {activeTab === 'lambda' && (uploadedFiles.length > 0 || droppedSchemas.length > 0) && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-3">
            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">📎 Uploaded Files</h4>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      {file.type.startsWith('image/') ? (
                        <Image className="w-4 h-4 text-blue-500" />
                      ) : file.type.includes('json') ? (
                        <FileText className="w-4 h-4 text-green-500" />
                      ) : file.type.includes('zip') || file.type.includes('tar') ? (
                        <Archive className="w-4 h-4 text-orange-500" />
                      ) : (
                        <File className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="truncate max-w-32">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        onClick={() => removeUploadedFile(file.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dropped Schemas */}
            {droppedSchemas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  📋 Schema Context ({droppedSchemas.length} schema{droppedSchemas.length !== 1 ? 's' : ''})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {droppedSchemas.map((schema) => (
                    <div
                      key={schema.id}
                      className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <Database className="w-4 h-4 text-purple-500" />
                      <span className="truncate max-w-32">
                        {schema.schemaName || schema.name || 'Unknown Schema'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {schema.source === 'sidebar' ? '(from sidebar)' : '(from workspace)'}
                      </span>
                      <button
                        onClick={() => removeDroppedSchema(schema.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Scraped Data Modal */}
      {showAllScrapedData && scrapedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-6xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">All Scraped Data - {scrapedData.service}</h3>
              <button
                onClick={() => setShowAllScrapedData(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto h-full">
              <div className="space-y-6">
                {/* APIs Section */}
                {scrapedData.apis && scrapedData.apis.length > 0 && (
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h4 className="font-medium text-blue-800 mb-4 flex items-center gap-2">
                      <span>🔗</span>
                      All APIs ({scrapedData.apis.length})
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {scrapedData.apis.map((api: any, index: number) => (
                        <div key={index} className="bg-white p-4 rounded border border-blue-100">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-blue-700">{api.name || api.endpoint}</h5>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {api.format || 'API'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{api.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <span className="bg-gray-100 px-2 py-1 rounded">{api.method || 'GET'}</span>
                            <span className="truncate">{api.url}</span>
                          </div>
                          {api.openapiSpec && (
                            <details className="mt-2">
                              <summary className="text-sm text-blue-600 cursor-pointer font-medium">View OpenAPI Specification</summary>
                              <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-x-auto max-h-40">
                                {JSON.stringify(api.openapiSpec, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Schemas Section */}
                {scrapedData.schemas && scrapedData.schemas.length > 0 && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h4 className="font-medium text-green-800 mb-4 flex items-center gap-2">
                      <span>📋</span>
                      All Schemas ({scrapedData.schemas.length})
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {scrapedData.schemas.map((schema: any, index: number) => (
                        <div key={index} className="bg-white p-4 rounded border border-green-100">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-green-700">{schema.name}</h5>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {schema.format || 'JSON'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{schema.description}</p>
                          {schema.schema && (
                            <details className="mt-2">
                              <summary className="text-sm text-green-600 cursor-pointer font-medium">View JSON Schema</summary>
                              <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-x-auto max-h-40">
                                {JSON.stringify(schema.schema, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Documentation Section */}
                {scrapedData.documentation && scrapedData.documentation.length > 0 && (
                  <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <h4 className="font-medium text-purple-800 mb-4 flex items-center gap-2">
                      <span>📚</span>
                      All Documentation ({scrapedData.documentation.length})
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {scrapedData.documentation.map((doc: any, index: number) => (
                        <div key={index} className="bg-white p-4 rounded border border-purple-100">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-purple-700">{doc.title}</h5>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {doc.format || 'PDF'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{doc.content}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <span>Section {doc.section}</span>
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" 
                                 className="text-purple-600 hover:underline">
                                View Source
                              </a>
                            )}
                          </div>
                          {doc.data && doc.contentType && (
                            <details className="mt-2">
                              <summary className="text-sm text-purple-600 cursor-pointer font-medium">View Document Data</summary>
                              <div className="text-xs bg-gray-100 p-3 rounded mt-2">
                                <p><strong>Content Type:</strong> {doc.contentType}</p>
                                <p><strong>Data Size:</strong> {Math.round(doc.data.length / 1024)} KB</p>
                                <p><strong>Format:</strong> {doc.format}</p>
                                <p><strong>Base64 Data:</strong></p>
                                <pre className="text-xs overflow-x-auto max-h-20 mt-1">
                                  {doc.data.substring(0, 200)}...
                                </pre>
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Errors Section */}
                {scrapedData.errors && scrapedData.errors.length > 0 && (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h4 className="font-medium text-red-800 mb-4 flex items-center gap-2">
                      <span>⚠️</span>
                      All Errors ({scrapedData.errors.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {scrapedData.errors.map((error: string, index: number) => (
                        <div key={index} className="text-sm text-red-700 bg-red-100 p-3 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Chat Input - Always at bottom */}
      <div className="border-t border-gray-200 p-4 bg-white relative">
        {/* Selected Namespace Chips */}
        {droppedNamespaces.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {droppedNamespaces.map((ns, index) => (
                  <div
                    key={ns['namespace-id'] || index}
                    className="inline-flex items-center gap-1.5 bg-blue-100/80 text-blue-700 px-2 py-1 rounded-full text-xs font-medium border border-blue-200"
                  >
                    <span>@{ns['namespace-name']}</span>
                    <button
                      onClick={() => {
                        setDroppedNamespaces(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      title="Remove namespace"
                    >
                      <X className="w-3 h-3 text-blue-600" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setDroppedNamespaces([]);
                  addMessage({ 
                    role: 'assistant', 
                    content: 'Cleared all dropped namespaces from context.' 
                  });
                }}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onKeyDown={handleKeyDown}
              placeholder={namespace ? "Type your message... (Upload files or drag schemas for context)" : "Type your message... (Try: 'Create a namespace for...' to generate a new project)"}
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              disabled={isLoading}
            />
            
            {/* Namespace Suggestions Dropdown */}
            {showNamespaceSuggestions && namespaceSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                {namespaceSuggestions.map((ns, index) => (
                  <div
                    key={ns['namespace-id']}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                      index === selectedSuggestionIndex 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => selectNamespace(ns)}
                  >
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                      <Database className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{ns['namespace-name']}</div>
                      {ns['namespace-url'] && (
                        <div className="text-xs text-gray-500 truncate">{ns['namespace-url']}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAgentWorkspace;

                                                          
                                                          