'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronRight, 
  FolderOpen, 
  Workflow, 
  Layout, 
  Database, 
  FileText, 
  Plus,
  Search,
  Settings,
  Star,
  Clock,
  Trash2,
  Edit,
  Eye,
  Download,
  Share2
} from 'lucide-react'

interface Namespace {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  documents: {
    workflows: number
    wireframes: number
    schemas: number
    documentation: number
  }
}

interface DocsSidebarProps {
  namespaces: Namespace[]
  selectedNamespace: string
  onNamespaceSelect: (namespaceId: string) => void
  onCreateDocument: (type: 'workflow' | 'wireframe' | 'schema' | 'documentation') => void
  onSearch: (query: string) => void
}

export default function DocsSidebar({ 
  namespaces, 
  selectedNamespace, 
  onNamespaceSelect, 
  onCreateDocument,
  onSearch 
}: DocsSidebarProps) {
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'all' | 'recent' | 'favorites'>('all')

  const toggleNamespace = (namespaceId: string) => {
    const newExpanded = new Set(expandedNamespaces)
    if (newExpanded.has(namespaceId)) {
      newExpanded.delete(namespaceId)
    } else {
      newExpanded.add(namespaceId)
    }
    setExpandedNamespaces(newExpanded)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch(query)
  }

  const filteredNamespaces = namespaces.filter(namespace =>
    namespace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    namespace.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'workflow': return <Workflow className="w-4 h-4" />
      case 'wireframe': return <Layout className="w-4 h-4" />
      case 'schema': return <Database className="w-4 h-4" />
      case 'documentation': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'workflow': return 'text-blue-600 dark:text-blue-400'
      case 'wireframe': return 'text-purple-600 dark:text-purple-400'
      case 'schema': return 'text-green-600 dark:text-green-400'
      case 'documentation': return 'text-orange-600 dark:text-orange-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Documentation</h2>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search namespaces and documents..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* View Mode Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { id: 'all', label: 'All', icon: FolderOpen },
            { id: 'recent', label: 'Recent', icon: Clock },
            { id: 'favorites', label: 'Favorites', icon: Star }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === mode.id
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <mode.icon className="w-3 h-3" />
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Create</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { type: 'workflow', label: 'Workflow', icon: Workflow, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
            { type: 'wireframe', label: 'Wireframe', icon: Layout, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
            { type: 'schema', label: 'Schema', icon: Database, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
            { type: 'documentation', label: 'Document', icon: FileText, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' }
          ].map((docType) => (
            <button
              key={docType.type}
              onClick={() => onCreateDocument(docType.type as any)}
              className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className={`p-1 rounded ${docType.color}`}>
                <docType.icon className="w-3 h-3" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{docType.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Namespaces List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Namespaces</h3>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="space-y-1">
            {filteredNamespaces.map((namespace) => (
              <div key={namespace.id} className="space-y-1">
                {/* Namespace Header */}
                <button
                  onClick={() => toggleNamespace(namespace.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    selectedNamespace === namespace.id
                      ? 'bg-primary-50 dark:bg-blue-900/30 border border-primary-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {expandedNamespaces.has(namespace.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                    <FolderOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{namespace.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{namespace.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {namespace.documents.workflows + namespace.documents.wireframes + 
                       namespace.documents.schemas + namespace.documents.documentation}
                    </span>
                  </div>
                </button>

                {/* Namespace Documents */}
                {expandedNamespaces.has(namespace.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-6 space-y-1"
                  >
                    {[
                      { type: 'workflow', count: namespace.documents.workflows },
                      { type: 'wireframe', count: namespace.documents.wireframes },
                      { type: 'schema', count: namespace.documents.schemas },
                      { type: 'documentation', count: namespace.documents.documentation }
                                         ].map((docType) => (
                       <button
                         key={docType.type}
                         onClick={() => onCreateDocument(docType.type as any)}
                         className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                       >
                        <div className="flex items-center space-x-2">
                          <div className={`${getDocumentColor(docType.type)}`}>
                            {getDocumentIcon(docType.type)}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {docType.type}s
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{docType.count}</span>
                          <div className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <Plus className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {filteredNamespaces.length === 0 && (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {searchQuery ? 'No namespaces found' : 'No namespaces yet'}
              </p>
              {!searchQuery && (
                <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                  Create your first namespace
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {filteredNamespaces.length} namespace{filteredNamespaces.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center space-x-1">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Import">
              <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Export">
              <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
