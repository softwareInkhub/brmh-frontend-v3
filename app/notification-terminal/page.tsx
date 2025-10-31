"use client";
import React, { useEffect, useState, useRef } from 'react'
import { 
  Terminal, Settings, Zap, FileText, Send, List, Activity, 
  Filter, Database, Clock, Play, Pause, RefreshCw, Download,
  Search, Plus, Code, AlertCircle, CheckCircle, XCircle,
  ChevronRight, ChevronDown, Box, Layers, GitBranch, Users,
  MessageSquare, Globe
} from 'lucide-react'

type TabKey = 'dashboard' | 'connections' | 'triggers' | 'crud-triggers' | 'templates' | 'test' | 'logs' | 'analytics'

const Page = () => {
  const [active, setActive] = useState<TabKey>('dashboard')
  const [apiBase] = useState<string>(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001')
  
  // UI state
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Connection state
  const [connName, setConnName] = useState('default')
  const [connToken, setConnToken] = useState('')
  const [connBaseUrl, setConnBaseUrl] = useState('https://gate.whapi.cloud')
  const [connTestMode, setConnTestMode] = useState(true)
  const [connections, setConnections] = useState<any[]>([])
  
  // Trigger state
  const [triggers, setTriggers] = useState<any[]>([])
  const [trigName, setTrigName] = useState('Namespace Created Alert')
  const [trigEvent, setTrigEvent] = useState('namespace_created')
  const [trigTo, setTrigTo] = useState('10000000000')
  const [countryCode, setCountryCode] = useState('91')
  const [phoneNumber, setPhoneNumber] = useState('10000000000')
  const [trigTemplate, setTrigTemplate] = useState("Namespace created at {{event.data.response.timestamp}}")
  const [trigConnectionId, setTrigConnectionId] = useState<string>('')
  
  // Filter state
  const [filterMethod, setFilterMethod] = useState<string>('')
  const [filterTableName, setFilterTableName] = useState<string>('')
  const [filterPathContains, setFilterPathContains] = useState<string>('')
  
  // Trigger types
  const [triggerType, setTriggerType] = useState<'users' | 'community' | 'group'>('users')
  const [contactMode, setContactMode] = useState<'manual' | 'contact'>('manual')
  
  // WHAPI data
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [communities, setCommunities] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<string>('')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [subgroups, setSubgroups] = useState<any[]>([])
  const [loadingCommunities, setLoadingCommunities] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingSubgroups, setLoadingSubgroups] = useState(false)
  
  // Namespace state
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([])
  const [availableNamespaces, setAvailableNamespaces] = useState<any[]>([])
  const [loadingNamespaces, setLoadingNamespaces] = useState(false)
  const [customTag, setCustomTag] = useState<string>('')
  
  // Logs state
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logNamespaceFilter, setLogNamespaceFilter] = useState<string>('')
  
  // CRUD triggers state
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('')
  
  // Stats
  const [liveStats, setLiveStats] = useState({
    totalTriggers: 0,
    activeTriggers: 0,
    successRate: 100,
    avgResponseTime: 0,
    last24h: 0
  })

  const logsEndRef = useRef<HTMLDivElement>(null)

  // Fetch functions
  async function fetchConnections() {
    try {
      const res = await fetch(`${apiBase}/notify/connections`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.items) {
        setConnections(data.items)
        if (data.items[0]?.id) setTrigConnectionId(data.items[0].id)
      }
    } catch (e) {
      console.error('Failed to fetch connections:', e)
    }
  }

  async function fetchTriggers() {
    try {
      const res = await fetch(`${apiBase}/notify/triggers`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.items) {
        setTriggers(data.items)
        updateStats(data.items)
      }
    } catch (e) {
      console.error('Failed to fetch triggers:', e)
    }
  }

  async function fetchLogs(namespaceFilter?: string) {
    setLoadingLogs(true)
    try {
      const url = namespaceFilter 
        ? `${apiBase}/notify/logs?namespace=${encodeURIComponent(namespaceFilter)}`
        : `${apiBase}/notify/logs`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      if (data?.items) setLogs(data.items)
    } catch (e) {
      console.error('Failed to fetch logs:', e)
    }
    setLoadingLogs(false)
  }

  async function fetchTables() {
    try {
      const res = await fetch(`${apiBase}/dynamodb/tables`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.tables) setTables(data.tables)
    } catch (e) {
      console.error('Failed to fetch tables:', e)
    }
  }

  async function fetchContacts(connectionId: string) {
    if (!connectionId) return
    setLoadingContacts(true)
    try {
      const res = await fetch(`${apiBase}/notify/contacts/${connectionId}`, { cache: 'no-store' })
      const data = await res.json()
      
      let contactsList = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        if (responseData.contacts && Array.isArray(responseData.contacts)) {
          contactsList = responseData.contacts
        } else if (responseData.data && Array.isArray(responseData.data)) {
          contactsList = responseData.data
        } else if (Array.isArray(responseData)) {
          contactsList = responseData
        }
      }
      
      const validContacts = contactsList.filter((contact: any) => 
        contact && contact.id && contact.id !== '0' && 
        (contact.pushname || contact.name || contact.display_name)
      )
      
      setContacts(validContacts)
    } catch (e) {
      console.error('Failed to fetch contacts:', e)
    }
    setLoadingContacts(false)
  }

  async function fetchCommunities(connectionId: string) {
    if (!connectionId) return
    setLoadingCommunities(true)
    try {
      const res = await fetch(`${apiBase}/notify/communities/${connectionId}`, { cache: 'no-store' })
      const data = await res.json()
      
      let communities = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        if (responseData.announceGroupInfo) {
          communities.push(responseData.announceGroupInfo)
        }
        if (responseData.otherGroups && Array.isArray(responseData.otherGroups)) {
          communities.push(...responseData.otherGroups)
        }
        if (communities.length === 0) {
          if (responseData.communities && Array.isArray(responseData.communities)) {
            communities = responseData.communities
          } else if (Array.isArray(responseData)) {
            communities = responseData
          }
        }
      }
      
      setCommunities(Array.isArray(communities) ? communities : [])
    } catch (e) {
      console.error('Failed to fetch communities:', e)
    }
    setLoadingCommunities(false)
  }

  async function fetchGroups(connectionId: string) {
    if (!connectionId) return
    setLoadingGroups(true)
    try {
      const res = await fetch(`${apiBase}/notify/groups/${connectionId}`, { cache: 'no-store' })
      const data = await res.json()
      
      let groups = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        if (responseData.announceGroupInfo) {
          groups.push(responseData.announceGroupInfo)
        }
        if (responseData.otherGroups && Array.isArray(responseData.otherGroups)) {
          groups.push(...responseData.otherGroups)
        }
        if (groups.length === 0) {
          if (responseData.groups && Array.isArray(responseData.groups)) {
            groups = responseData.groups
          } else if (Array.isArray(responseData)) {
            groups = responseData
          }
        }
      }
      
      setGroups(Array.isArray(groups) ? groups : [])
    } catch (e) {
      console.error('Failed to fetch groups:', e)
    }
    setLoadingGroups(false)
  }

  async function fetchSubgroups(connectionId: string, communityId: string) {
    if (!connectionId || !communityId) return
    setLoadingSubgroups(true)
    try {
      const res = await fetch(`${apiBase}/notify/communities/${connectionId}/${communityId}/subgroups`, { cache: 'no-store' })
      const data = await res.json()
      
      let subgroups = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        if (responseData.announceGroupInfo) {
          subgroups.push({ ...responseData.announceGroupInfo, type: 'announcement' })
        }
        if (responseData.otherGroups && Array.isArray(responseData.otherGroups)) {
          subgroups.push(...responseData.otherGroups.map((group: any) => ({ ...group, type: 'subgroup' })))
        }
        if (subgroups.length === 0 && responseData.subgroups && Array.isArray(responseData.subgroups)) {
          subgroups = responseData.subgroups.map((group: any) => ({ ...group, type: 'subgroup' }))
        }
      }
      
      setSubgroups(Array.isArray(subgroups) ? subgroups : [])
    } catch (e) {
      console.error('Failed to fetch subgroups:', e)
    }
    setLoadingSubgroups(false)
  }

  async function fetchNamespaces() {
    setLoadingNamespaces(true)
    try {
      const res = await fetch(`${apiBase}/unified/namespaces`, { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data)) {
        const formattedNamespaces = data.map(ns => ({
          id: ns['namespace-id'],
          name: ns['namespace-name']
        }))
        setAvailableNamespaces(formattedNamespaces)
      }
    } catch (e) {
      console.error('Failed to fetch namespaces:', e)
    }
    setLoadingNamespaces(false)
  }

  async function testConnection(connectionId: string) {
    if (!connectionId) return
    try {
      const res = await fetch(`${apiBase}/notify/test/${connectionId}`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.success) {
        alert('✅ Connection test successful!')
      } else {
        alert('❌ Connection test failed: ' + (data?.error || 'Unknown error'))
      }
    } catch (e) {
      alert('❌ Connection test failed: ' + (e as Error).message)
    }
  }

  function updateStats(triggersList: any[]) {
    const active = triggersList.filter(t => t.active !== false).length
    setLiveStats({
      totalTriggers: triggersList.length,
      activeTriggers: active,
      successRate: 95.5,
      avgResponseTime: 145,
      last24h: logs.length
    })
  }

  useEffect(() => {
    fetchConnections()
    fetchTriggers()
    fetchLogs()
    fetchTables()
    fetchNamespaces()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs()
        fetchTriggers()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    if (contactMode === 'manual') {
      setTrigTo(countryCode + phoneNumber)
    }
  }, [countryCode, phoneNumber, contactMode])

  useEffect(() => {
    if (contactMode === 'contact' && selectedContact) {
      setTrigTo(selectedContact)
    }
  }, [selectedContact, contactMode])

  useEffect(() => {
    if (trigConnectionId) {
      if (triggerType === 'community') {
        fetchCommunities(trigConnectionId)
      } else if (triggerType === 'group') {
        fetchGroups(trigConnectionId)
      } else if (contactMode === 'contact') {
        fetchContacts(trigConnectionId)
      }
    }
  }, [trigConnectionId, triggerType, contactMode])

  useEffect(() => {
    if (trigConnectionId && selectedCommunity) {
      fetchSubgroups(trigConnectionId, selectedCommunity)
    }
  }, [trigConnectionId, selectedCommunity])

  async function saveConnection() {
    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/notify/connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: connName, token: connToken, baseUrl: connBaseUrl, testMode: connTestMode })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to save connection')
      await fetchConnections()
      alert('✅ Connection saved successfully')
    } catch (e: any) {
      alert('❌ ' + (e.message || 'Failed to save connection'))
    }
    setSaving(false)
  }

  async function saveTrigger() {
    if (!trigConnectionId) return alert('Please select a connection')
    
    let action: any = {}
    
    switch (triggerType) {
      case 'users':
        if (!trigTo) return alert('Please enter recipient for users trigger')
        action = { type: 'whapi_message', to: trigTo, textTemplate: trigTemplate }
        break
      case 'community':
        if (!selectedCommunity) return alert('Please select a community')
        if (selectedGroups.length === 0) return alert('Please select at least one subgroup')
        action = { type: 'whapi_community', communityId: selectedCommunity, groupIds: selectedGroups, messageTemplate: trigTemplate }
        break
      case 'group':
        if (selectedGroups.length === 0) return alert('Please select at least one group')
        action = { type: 'whapi_group', groupIds: selectedGroups, messageTemplate: trigTemplate }
        break
    }
    
    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/notify/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trigName,
          eventType: trigEvent,
          connectionId: trigConnectionId,
          action,
          filters: {
            method: filterMethod || undefined,
            tableName: filterTableName || undefined,
            pathContains: filterPathContains || undefined
          },
          namespaceTags: selectedNamespaces,
          active: true
        })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to save trigger')
      await fetchTriggers()
      alert('✅ Trigger saved successfully')
    } catch (e: any) {
      alert('❌ ' + (e.message || 'Failed to save trigger'))
    }
    setSaving(false)
  }

  async function testFire(eventType: string) {
    let action: any = {}
    
    switch (triggerType) {
      case 'users':
        action = { type: 'whapi_message', to: trigTo, textTemplate: trigTemplate }
        break
      case 'community':
        action = { type: 'whapi_community', communityId: selectedCommunity, groupIds: selectedGroups, messageTemplate: trigTemplate }
        break
      case 'group':
        action = { type: 'whapi_group', groupIds: selectedGroups, messageTemplate: trigTemplate }
        break
    }

    const tempTrigger = {
      id: 'temp-test-trigger',
      name: 'Test Trigger',
      eventType: eventType,
      connectionId: trigConnectionId,
      action: action,
      filters: {
        method: filterMethod || undefined,
        tableName: filterTableName || undefined,
        pathContains: filterPathContains || undefined
      },
      namespaceTags: selectedNamespaces,
      active: true
    }

    try {
      const res = await fetch(`${apiBase}/notify/temp-test-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: tempTrigger,
          event: {
            type: eventType,
            method: 'POST',
            path: '/unified/namespaces',
            resource: 'unified_api',
            data: { response: { id: 'ns-123', timestamp: new Date().toISOString() } }
          }
        })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Test fire failed')
      await fetchLogs()
      alert('✅ Test event fired successfully')
    } catch (e: any) {
      alert('❌ ' + (e.message || 'Test fire failed'))
    }
  }

  async function testSpecificTrigger(triggerId: string) {
    try {
      const res = await fetch(`${apiBase}/notify/${triggerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            type: trigEvent,
            method: 'POST',
            path: '/unified/namespaces',
            resource: 'unified_api',
            data: { response: { id: 'ns-123', timestamp: new Date().toISOString() } }
          }
        })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Trigger test failed')
      await fetchLogs()
      alert('✅ Trigger test fired successfully')
    } catch (e: any) {
      alert('❌ ' + (e.message || 'Trigger test failed'))
    }
  }

  // Terminal UI Components
  const StatCard = ({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
          <div className="text-xl font-semibold text-gray-900">{value}</div>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </div>
  )

  const LogLine = ({ log }: { log: any }) => {
    const levelColors = {
      info: 'text-blue-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      ok: 'text-green-600'
    }
    
    const level = log.status || log.level || 'info'
    
    return (
      <div className="px-4 py-2 text-xs hover:bg-gray-50 border-b border-gray-100 transition-colors">
        <span className="text-gray-400">[{new Date(log.createdAt || log.timestamp).toLocaleTimeString()}]</span>
        {' '}
        <span className={levelColors[level as keyof typeof levelColors]}>[{level.toUpperCase()}]</span>
        {' '}
        <span className="text-gray-600">{log.kind || log.operation}</span>
        {' › '}
        <span className="text-gray-900">{log.eventType || log.table || 'N/A'}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal size={24} className="text-gray-900" />
            <h1 className="text-lg font-semibold text-gray-900">BRMH Notification System</h1>
            <span className="text-xs text-gray-500 px-2 py-1 border border-gray-200 rounded">v2.0.0</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-gray-600">SYSTEM ONLINE</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 border rounded transition-colors ${autoRefresh ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                onClick={() => {
                  fetchConnections()
                  fetchTriggers()
                  fetchLogs()
                }}
                className="p-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded transition-colors"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <div className="p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="search..."
                className="w-full bg-gray-50 border border-gray-200 rounded pl-9 pr-3 py-2 text-xs text-gray-900 focus:border-gray-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <nav className="px-2 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'connections', label: 'Connections', icon: GitBranch },
              { id: 'triggers', label: 'Triggers', icon: Zap },
              { id: 'crud-triggers', label: 'CRUD Triggers', icon: Database },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'test', label: 'Test & Fire', icon: Send },
              { id: 'logs', label: 'Event Logs', icon: List },
              { id: 'analytics', label: 'Analytics', icon: Activity }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id as TabKey)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs transition-all ${
                  active === id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="px-3 py-4 border-t border-gray-200 mt-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">System Status</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Active Triggers</span>
                <span className="text-xs font-semibold text-gray-900">{liveStats.activeTriggers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Success Rate</span>
                <span className="text-xs font-semibold text-green-600">{liveStats.successRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Response Time</span>
                <span className="text-xs font-semibold text-gray-900">{liveStats.avgResponseTime}ms</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50">
          {/* Dashboard */}
          {active === 'dashboard' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">System Dashboard</h2>
                <p className="text-sm text-gray-600">Monitor your notification system in real-time</p>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total Triggers" value={liveStats.totalTriggers} icon={<Zap size={20} />} />
                <StatCard label="Active Connections" value={connections.length} icon={<GitBranch size={20} />} />
                <StatCard label="Success Rate" value={`${liveStats.successRate}%`} icon={<CheckCircle size={20} />} />
                <StatCard label="Events (24h)" value={liveStats.last24h} icon={<Activity size={20} />} />
              </div>

              {/* Real-time Activity */}
              <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Real-Time Activity Monitor</h3>
                </div>
                <div className="h-[400px] overflow-y-auto">
                  {logs.slice(-50).reverse().map(log => (
                    <LogLine key={log.id} log={log} />
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <button onClick={() => setActive('triggers')} className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <Plus size={14} />
                  New Trigger
                </button>
                <button onClick={() => setActive('connections')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <GitBranch size={14} />
                  Manage Connections
                </button>
              </div>
            </div>
          )}

          {/* Connections */}
          {active === 'connections' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">WHAPI Connections</h2>
                <p className="text-sm text-gray-600">Manage your WhatsApp API connections</p>
              </div>

              <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Add New Connection</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Connection Name</label>
                    <input value={connName} onChange={e=>setConnName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" placeholder="e.g. production-whapi" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Base URL</label>
                    <input value={connBaseUrl} onChange={e=>setConnBaseUrl(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" placeholder="https://gate.whapi.cloud" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">WHAPI Token</label>
                  <input value={connToken} onChange={e=>setConnToken(e.target.value)} type="password" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" placeholder="Enter your WHAPI token" />
                </div>
                
                <div className="flex items-center gap-2">
                  <input id="tm" type="checkbox" checked={connTestMode} onChange={e=>setConnTestMode(e.target.checked)} className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900" />
                  <label htmlFor="tm" className="text-sm text-gray-600">Test Mode (do not send actual messages)</label>
                </div>
                
                <div className="flex gap-2">
                  <button disabled={saving} onClick={saveConnection} className="px-4 py-2 bg-gray-900 text-white rounded text-sm disabled:opacity-60 hover:bg-gray-800 transition-colors">
                    {saving ? 'Saving...' : 'Save Connection'}
                  </button>
                  <button onClick={fetchConnections} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">
                    Refresh
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Saved Connections ({connections.length})</h3>
                </div>
                <div className="divide-y">
                  {connections.map((c) => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{c.id}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {c.testMode ? '🧪 Test Mode' : '✅ Live Mode'} • {c.baseUrl}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>testConnection(c.id)} className="text-xs px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                          Test
                        </button>
                        <button onClick={()=>setTrigConnectionId(c.id)} className={`text-xs px-3 py-1.5 rounded transition-colors ${trigConnectionId===c.id ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                          {trigConnectionId===c.id ? 'Selected' : 'Use'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {connections.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No connections yet. Create your first connection above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Triggers */}
          {active === 'triggers' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Notification Triggers</h2>
                <p className="text-sm text-gray-600">Create and manage event-driven triggers</p>
              </div>

              <div className="bg-white border border-gray-200 rounded p-6 space-y-6">
                <h3 className="text-sm font-semibold text-gray-900">Create New Trigger</h3>
                
                {/* Trigger Type Selection */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Trigger Type</label>
                    <select value={triggerType} onChange={e=>setTriggerType(e.target.value as any)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none">
                      <option value="users">Users (Direct Message)</option>
                      <option value="community">Community (Subgroups)</option>
                      <option value="group">Group (WhatsApp Groups)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Event Type</label>
                    <select value={trigEvent} onChange={e=>setTrigEvent(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none">
                      <option value="none">None (Manual Only)</option>
                      <option value="namespace_created">Namespace Created</option>
                      <option value="namespace_updated">Namespace Updated</option>
                      <option value="namespace_deleted">Namespace Deleted</option>
                      <option value="crud_create">CRUD Create</option>
                      <option value="crud_update">CRUD Update</option>
                      <option value="crud_delete">CRUD Delete</option>
                      <option value="crud_read">CRUD Read</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Connection</label>
                    <select value={trigConnectionId} onChange={e=>setTrigConnectionId(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none">
                      <option value="">Select connection</option>
                      {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Recipient Configuration */}
                {triggerType === 'users' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-700 font-medium">Recipient Type:</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" value="manual" checked={contactMode === 'manual'} onChange={e => setContactMode('manual')} className="text-gray-900 focus:ring-gray-900" />
                          <span className="text-sm text-gray-700">Manual Entry</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" value="contact" checked={contactMode === 'contact'} onChange={e => setContactMode('contact')} className="text-gray-900 focus:ring-gray-900" />
                          <span className="text-sm text-gray-700">From Contacts</span>
                        </label>
                      </div>
                    </div>

                    {contactMode === 'manual' && (
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Country Code</label>
                          <select value={countryCode} onChange={e=>setCountryCode(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none">
                            <option value="91">+91 (India)</option>
                            <option value="1">+1 (USA/Canada)</option>
                            <option value="44">+44 (UK)</option>
                            <option value="971">+971 (UAE)</option>
                            <option value="966">+966 (Saudi Arabia)</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs text-gray-600 mb-1">Phone Number</label>
                          <input value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" placeholder="e.g. 9876543210" />
                        </div>
                      </div>
                    )}

                    {contactMode === 'contact' && (
                      <div className="flex gap-2">
                        <select value={selectedContact} onChange={e=>setSelectedContact(e.target.value)} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" disabled={loadingContacts || !trigConnectionId}>
                          <option value="">Select a contact{contacts.length > 0 ? ` (${contacts.length} found)` : ''}</option>
                          {contacts.map(contact => (
                            <option key={contact.id} value={contact.id}>
                              {contact.pushname || contact.name || contact.display_name} ({contact.id})
                            </option>
                          ))}
                        </select>
                        <button onClick={() => fetchContacts(trigConnectionId)} disabled={!trigConnectionId || loadingContacts} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                          {loadingContacts ? '...' : 'Refresh'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {triggerType === 'community' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Community</label>
                        <div className="flex gap-2">
                          <select value={selectedCommunity} onChange={e=>setSelectedCommunity(e.target.value)} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" disabled={loadingCommunities}>
                            <option value="">Select community</option>
                            {communities.map(c => (
                              <option key={c.id} value={c.id}>{c.title || c.name || c.id}</option>
                            ))}
                          </select>
                          <button onClick={() => fetchCommunities(trigConnectionId)} disabled={!trigConnectionId || loadingCommunities} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                            {loadingCommunities ? '...' : 'Refresh'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Subgroups {selectedGroups.length > 0 && <span className="text-green-600">• {selectedGroups.length} selected</span>}
                        </label>
                        <div className="flex gap-2">
                          <select value="" onChange={e => { if (e.target.value && !selectedGroups.includes(e.target.value)) { setSelectedGroups([...selectedGroups, e.target.value]) }}} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" disabled={loadingSubgroups || !selectedCommunity}>
                            <option value="">Select subgroup to add...</option>
                            {subgroups.filter(sg => !selectedGroups.includes(sg.id)).map(sg => (
                              <option key={sg.id} value={sg.id}>
                                {sg.type === 'announcement' ? '📢 ' : '💬 '}{sg.title || sg.name || sg.id}
                              </option>
                            ))}
                          </select>
                          <button onClick={() => fetchSubgroups(trigConnectionId, selectedCommunity)} disabled={!trigConnectionId || !selectedCommunity || loadingSubgroups} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                            {loadingSubgroups ? '...' : 'Refresh'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {selectedGroups.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedGroups.map(groupId => {
                          const group = subgroups.find(sg => sg.id === groupId)
                          return (
                            <span key={groupId} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {group?.type === 'announcement' ? '📢' : '💬'}
                              {group?.title || group?.name || groupId}
                              <button onClick={() => setSelectedGroups(selectedGroups.filter(id => id !== groupId))} className="text-green-600 hover:text-green-800">×</button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {triggerType === 'group' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex gap-2">
                      <select value={selectedGroups[0] || ''} onChange={e=>setSelectedGroups(e.target.value ? [e.target.value] : [])} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" disabled={loadingGroups}>
                        <option value="">Select group</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.title || g.name || g.id}</option>
                        ))}
                      </select>
                      <button onClick={() => fetchGroups(trigConnectionId)} disabled={!trigConnectionId || loadingGroups} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                        {loadingGroups ? '...' : 'Refresh'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Filter: HTTP Method</label>
                    <input value={filterMethod} onChange={e=>setFilterMethod(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" placeholder="e.g. POST, PUT" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Filter: Table Name</label>
                    <input value={filterTableName} onChange={e=>setFilterTableName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" placeholder="e.g. shopify-orders" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Filter: Path Contains</label>
                    <input value={filterPathContains} onChange={e=>setFilterPathContains(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" placeholder="e.g. /unified/namespaces" />
                  </div>
                </div>

                {/* Namespace Tags */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Namespace Tags {selectedNamespaces.length > 0 && <span className="text-gray-900">({selectedNamespaces.length} selected)</span>}
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select value="" onChange={e => { if (e.target.value && !selectedNamespaces.includes(e.target.value)) { setSelectedNamespaces([...selectedNamespaces, e.target.value]) }}} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" disabled={loadingNamespaces}>
                        <option value="">Select namespace...</option>
                        {availableNamespaces.filter(ns => !selectedNamespaces.includes(ns.id)).map(ns => (
                          <option key={ns.id} value={ns.id}>{ns.name || ns.id}</option>
                        ))}
                      </select>
                      <button onClick={fetchNamespaces} disabled={loadingNamespaces} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                        {loadingNamespaces ? '...' : 'Refresh'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input value={customTag} onChange={e => setCustomTag(e.target.value)} placeholder="Or enter custom tag..." className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" onKeyPress={e => { if (e.key === 'Enter' && customTag.trim() && !selectedNamespaces.includes(customTag.trim())) { setSelectedNamespaces([...selectedNamespaces, customTag.trim()]); setCustomTag('') }}} />
                      <button onClick={() => { if (customTag.trim() && !selectedNamespaces.includes(customTag.trim())) { setSelectedNamespaces([...selectedNamespaces, customTag.trim()]); setCustomTag('') }}} disabled={!customTag.trim() || selectedNamespaces.includes(customTag.trim())} className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
                        Add
                      </button>
                    </div>
                    {selectedNamespaces.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedNamespaces.map(tag => {
                          const ns = availableNamespaces.find(n => n.id === tag)
                          return (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {ns?.name || tag}
                              <button onClick={() => setSelectedNamespaces(selectedNamespaces.filter(t => t !== tag))} className="text-blue-600 hover:text-blue-800">×</button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trigger Name & Template */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Trigger Name</label>
                  <input value={trigName} onChange={e=>setTrigName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" placeholder="My Trigger" />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Message Template</label>
                  <textarea value={trigTemplate} onChange={e=>setTrigTemplate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm min-h-[100px] focus:border-gray-900 focus:outline-none" placeholder="Message template using {{trigger}} and {{event}} context" />
                  <div className="text-xs text-gray-500 mt-1">
                    Available variables: {'{'}{'{'} event.type {'}'}{'}'}, {'{'}{'{'} event.tableName {'}'}{'}'}, {'{'}{'{'} event.data.body {'}'}{'}'}, {'{'}{'{'} trigger.name {'}'}{'}'}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  <button onClick={() => testFire(trigEvent)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">
                    Test Fire
                  </button>
                  <button disabled={saving} onClick={saveTrigger} className="px-4 py-2 bg-gray-900 text-white rounded text-sm disabled:opacity-60 hover:bg-gray-800 transition-colors">
                    {saving ? 'Saving...' : 'Save Trigger'}
                  </button>
                </div>
              </div>

              {/* Existing Triggers List */}
              <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Existing Triggers ({triggers.length})</h3>
                </div>
                <div className="divide-y">
                  {triggers.map(t => (
                    <div key={t.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{t.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Event: {t.eventType} • Type: {t.action?.type || 'whapi'}
                            {t.action?.type === 'whapi_message' && ` • To: ${t.action?.to}`}
                            {t.action?.type === 'whapi_community' && ` • Community: ${t.action?.communityId} • Groups: ${t.action?.groupIds?.length || 0}`}
                            {t.action?.type === 'whapi_group' && ` • Groups: ${t.action?.groupIds?.length || 0}`}
                          </div>
                          {t.namespaceTags && t.namespaceTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {t.namespaceTags.map((tag: string) => (
                                <span key={tag} className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${t.active === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {t.active === false ? 'Inactive' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {triggers.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No triggers yet. Create your first trigger above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CRUD Triggers */}
          {active === 'crud-triggers' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">CRUD Operation Triggers</h2>
                <p className="text-sm text-gray-600">Monitor and trigger on database operations</p>
              </div>
              
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Select Table</label>
                  <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none">
                    <option value="">-- Select DynamoDB Table --</option>
                    {tables.map(table => (
                      <option key={table} value={table}>{table}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={() => fetchTables()} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <RefreshCw size={14} />
                    Refresh Tables
                  </button>
                </div>
              </div>

              {selectedTable && (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900">Configure: {selectedTable}</h3>
                  </div>
                  
                  <div className="p-6 grid grid-cols-2 gap-6">
                    {['CREATE', 'READ', 'UPDATE', 'DELETE'].map(op => (
                      <div key={op} className="border border-gray-200 rounded p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Code size={16} className="text-gray-900" />
                            <span className="text-sm font-semibold text-gray-900">{op}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                          </label>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Connection</label>
                            <select className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none">
                              <option>Select connection...</option>
                              {connections.map(conn => (
                                <option key={conn.id} value={conn.id}>{conn.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Recipient</label>
                            <input placeholder="Phone number or group ID" className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none" />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Template</label>
                            <textarea rows={3} placeholder={`${op} operation on ${selectedTable}`} className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none resize-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 px-4 py-3 flex justify-end gap-3 bg-gray-50">
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-white transition-colors">
                      Test Configuration
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 transition-colors">
                      Save & Deploy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test & Fire */}
          {active === 'test' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Test & Fire Triggers</h2>
                <p className="text-sm text-gray-600">Test your triggers manually</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900">Saved Connections</h3>
                  </div>
                  <div className="divide-y max-h-96 overflow-auto">
                    {connections.map(c => (
                      <div key={c.id} className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{c.id}</div>
                        <div className="text-xs text-gray-400 mt-1">{c.testMode ? '🧪 Test Mode' : '✅ Live'}</div>
                      </div>
                    ))}
                    {connections.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">No connections found.</div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900">Saved Triggers</h3>
                  </div>
                  <div className="divide-y max-h-96 overflow-auto">
                    {triggers.map(t => (
                      <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{t.name}</div>
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {t.eventType} • {t.action?.type || 'whapi'}
                          </div>
                          <div className="text-xs text-blue-600 mt-1 truncate">{t.id}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={()=>testSpecificTrigger(t.id)} className="text-xs px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                            Test
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(`${apiBase}/notify/${t.id}`); alert('URL copied!'); }} className="text-xs px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors">
                            Copy URL
                          </button>
                        </div>
                      </div>
                    ))}
                    {triggers.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">No triggers found.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs */}
          {active === 'logs' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Event Logs</h2>
                  <p className="text-sm text-gray-600">Monitor all notification events</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={logNamespaceFilter} onChange={e => { setLogNamespaceFilter(e.target.value); fetchLogs(e.target.value || undefined); }} className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none">
                    <option value="">All Namespaces</option>
                    {availableNamespaces.map(ns => (
                      <option key={ns.id} value={ns.id}>{ns.name || ns.id}</option>
                    ))}
                  </select>
                  <button onClick={() => fetchLogs(logNamespaceFilter || undefined)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">
                    Refresh
                  </button>
                  {loadingLogs && <span className="text-xs text-gray-500">Loading...</span>}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Activity Log ({logs.length})</h3>
                </div>
                <div className="divide-y max-h-[600px] overflow-auto">
                  {logs.map(l => (
                    <div key={l.id} className="px-4 py-3 text-sm hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{l.kind}</div>
                        <div className={`text-xs ${l.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                          {l.status || 'ok'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{l.createdAt}</div>
                      {l.eventType && <div className="text-xs text-gray-600 mt-1">Event: {l.eventType}</div>}
                      {l.triggerId && <div className="text-xs text-gray-600">Trigger: {l.triggerId}</div>}
                      {l.namespaceTags && l.namespaceTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {l.namespaceTags.map((tag: string) => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No logs yet. Events will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Templates */}
          {active === 'templates' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Message Templates</h2>
                <p className="text-sm text-gray-600">Manage reusable message templates</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Template Library</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-700">Order Created</span>
                      <button className="text-xs px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-white transition-colors">Edit</button>
                    </div>
                    <div className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-700">Namespace Updated</span>
                      <button className="text-xs px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-white transition-colors">Edit</button>
                    </div>
                    <div className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-700">Error Alert</span>
                      <button className="text-xs px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-white transition-colors">Edit</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Template Editor</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Template Name</label>
                      <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" placeholder="My Template" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Message</label>
                      <textarea className="w-full border border-gray-300 rounded px-3 py-2 text-sm min-h-[140px] focus:border-gray-900 focus:outline-none" placeholder="Message with variables like {{name}} and {{namespace}}" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">Reset</button>
                      <button className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 transition-colors">Save Template</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics */}
          {active === 'analytics' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">System Analytics</h2>
                <p className="text-sm text-gray-600">Performance metrics and insights</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Success Rate" value="95.5%" icon={<CheckCircle size={20} />} />
                <StatCard label="Avg Response Time" value="145ms" icon={<Clock size={20} />} />
                <StatCard label="Total Events" value={logs.length} icon={<Activity size={20} />} />
              </div>

              <div className="bg-white border border-gray-200 rounded p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Event Distribution</h3>
                <div className="text-sm text-gray-500">Analytics charts coming soon...</div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}

export default Page
