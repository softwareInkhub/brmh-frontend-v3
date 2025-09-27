"use client";
import React, { useEffect, useState } from 'react'
import { Bell, Settings, Zap, FileText, Send, List, Info } from 'lucide-react'

type TabKey = 'overview' | 'config' | 'triggers' | 'templates' | 'test' | 'logs'

const Page = () => {
  const [active, setActive] = useState<TabKey>('overview')
  const [apiBase, setApiBase] = useState<string>(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001')
  const [saving, setSaving] = useState(false)

  // Config form
  const [connName, setConnName] = useState('default')
  const [connToken, setConnToken] = useState('')
  const [connBaseUrl, setConnBaseUrl] = useState('https://gate.whapi.cloud')
  const [connTestMode, setConnTestMode] = useState(true)
  const [connections, setConnections] = useState<any[]>([])

  // Trigger form
  const [triggers, setTriggers] = useState<any[]>([])
  const [trigName, setTrigName] = useState('Namespace Created Alert')
  const [trigEvent, setTrigEvent] = useState('namespace_created')
  const [trigTo, setTrigTo] = useState('10000000000')
  const [trigTemplate, setTrigTemplate] = useState("Namespace created at {{event.data.response.timestamp}}")
  const [trigConnectionId, setTrigConnectionId] = useState<string>('')
  const [filterMethod, setFilterMethod] = useState<string>('')
  const [filterTableName, setFilterTableName] = useState<string>('')
  const [filterPathContains, setFilterPathContains] = useState<string>('')

  // Logs
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Simple local persistence for selected tab
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('notif.activeTab') as TabKey | null : null
    if (saved) setActive(saved)
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('notif.activeTab', active)
  }, [active])

  async function fetchConnections() {
    try {
      const res = await fetch(`${apiBase}/notify/connections`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.items) setConnections(data.items)
      if (data?.items?.[0]?.id) setTrigConnectionId(data.items[0].id)
    } catch {}
  }

  async function fetchTriggers() {
    try {
      const res = await fetch(`${apiBase}/notify/triggers`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.items) setTriggers(data.items)
    } catch {}
  }

  async function fetchLogs() {
    setLoadingLogs(true)
    try {
      const res = await fetch(`${apiBase}/notify/logs`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.items) setLogs(data.items)
    } catch {}
    setLoadingLogs(false)
  }

  useEffect(() => {
    fetchConnections()
    fetchTriggers()
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      alert('Connection saved')
    } catch (e: any) {
      alert(e.message || 'Failed to save connection')
    }
    setSaving(false)
  }

  async function saveTrigger() {
    if (!trigConnectionId) return alert('Please select a connection')
    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/notify/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trigName,
          eventType: trigEvent,
          connectionId: trigConnectionId,
          action: { type: 'whapi', to: trigTo, textTemplate: trigTemplate },
          filters: {
            method: filterMethod || undefined,
            tableName: filterTableName || undefined,
            pathContains: filterPathContains || undefined
          },
          active: true
        })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to save trigger')
      await fetchTriggers()
      alert('Trigger saved')
    } catch (e: any) {
      alert(e.message || 'Failed to save trigger')
    }
    setSaving(false)
  }

  async function testFire(eventType: string) {
    const payload = { eventType, event: { method: 'POST', path: '/unified/namespaces', resource: 'unified_api', data: { response: { id: 'ns-123', timestamp: new Date().toISOString() } } } }
    console.log('[Frontend] Test fire request:', payload)
    try {
      const res = await fetch(`${apiBase}/notify/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      console.log('[Frontend] Test fire response:', { status: res.status, data })
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Test fire failed')
      await fetchLogs()
      alert('Test event fired')
    } catch (e: any) {
      console.error('[Frontend] Test fire error:', e)
      alert(e.message || 'Test fire failed')
    }
  }

  const NavItem = ({ id, label, icon }: { id: TabKey, label: string, icon: React.ReactNode }) => (
    <button
      className={`group w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 relative ${active === id ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
      onClick={() => setActive(id)}
    >
      <span className={`absolute left-0 top-0 h-full w-1 rounded-r ${active === id ? 'bg-blue-500' : 'bg-transparent group-hover:bg-gray-200'}`} />
      <span className={`${active === id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )

  return (
    <div className="p-0">
      <div className="flex gap-0">
        {/* Child Sidebar */}
        <aside className="w-64 shrink-0 bg-white border-r border-gray-200 rounded-none p-0 h-screen sticky top-0 overflow-hidden">
        
          {/* Search */}
          <div className="px-3 py-3 border-b">
            <input className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="Search..." />
          </div>
          {/* Sections */}
          <div className="px-2 py-2 text-xs font-semibold text-gray-500">Sections</div>
          <nav className="flex flex-col gap-1 px-2">
            <NavItem id="overview" label="Overview" icon={<Info size={16} />} />
            <NavItem id="config" label="WHAPI Config" icon={<Settings size={16} />} />
            <NavItem id="triggers" label="Triggers" icon={<Zap size={16} />} />
            <NavItem id="templates" label="Templates" icon={<FileText size={16} />} />
            <NavItem id="test" label="Test Send" icon={<Send size={16} />} />
            <NavItem id="logs" label="Logs" icon={<List size={16} />} />
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Notification Service</h1>
            <p className="text-sm text-gray-500">Configure WHAPI, define triggers, and test WhatsApp notifications.</p>
          </div>

          {active === 'overview' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">Overview</h2>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Use WHAPI to send WhatsApp messages for key events.</li>
                <li>Attach triggers to events like namespace, method, and account creation.</li>
                <li>Manage templates and test messages before enabling in production.</li>
              </ul>
            </section>
          )}

          {active === 'config' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">WHAPI Configuration</h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Connection Name</label>
                  <input value={connName} onChange={e=>setConnName(e.target.value)} className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. default" />
                </div>
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <label className="text-sm text-gray-600">WHAPI Token</label>
                  <input value={connToken} onChange={e=>setConnToken(e.target.value)} className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="Enter WHAPI token" />
                </div>
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Base URL</label>
                  <input value={connBaseUrl} onChange={e=>setConnBaseUrl(e.target.value)} className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="https://gate.whapi.cloud" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input id="tm" type="checkbox" checked={connTestMode} onChange={e=>setConnTestMode(e.target.checked)} className="accent-blue-600 h-4 w-4" />
                <label htmlFor="tm" className="text-sm text-gray-600">Test Mode (do not call WHAPI)</label>
              </div>
              <div className="flex gap-2">
                <button disabled={saving} onClick={saveConnection} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
                <button onClick={fetchConnections} className="px-4 py-2 border rounded-md">Refresh</button>
              </div>
              <div className="border rounded-md">
                <div className="px-3 py-2 text-sm text-gray-500">Saved Connections</div>
                <div className="divide-y max-h-56 overflow-auto">
                  {connections.map((c) => (
                    <div key={c.id} className="px-3 py-2 text-sm flex items-center justify-between">
                      <div className="truncate">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.id}</div>
                      </div>
                      <button onClick={()=>setTrigConnectionId(c.id)} className={`text-xs px-2 py-1 border rounded ${trigConnectionId===c.id ? 'bg-blue-50 border-blue-300' : ''}`}>Use</button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {active === 'triggers' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">Triggers</h2>
              <p className="text-sm text-gray-500">Create triggers that fire on backend events and send messages via WHAPI.</p>

              <div className="space-y-6">
                <div className="border rounded-md p-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Event</label>
                      <select value={trigEvent} onChange={e=>setTrigEvent(e.target.value)} className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option value="namespace_created">Namespace Created</option>
                        <option value="namespace_updated">Namespace Updated</option>
                        <option value="namespace_deleted">Namespace Deleted</option>
                        <option value="crud_create">CRUD Create</option>
                        <option value="crud_update">CRUD Update</option>
                        <option value="crud_delete">CRUD Delete</option>
                        <option value="crud_read">CRUD Read</option>
                      </select>
                    </div>
                    <div className="lg:col-span-5 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Recipient</label>
                      <input value={trigTo} onChange={e=>setTrigTo(e.target.value)} className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. 911234567890 or group-id@chat.whatsapp.com" />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Connection</label>
                      <select value={trigConnectionId} onChange={e=>setTrigConnectionId(e.target.value)} className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option value="">Select connection</option>
                        {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-4 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Filter: HTTP Method</label>
                      <input value={filterMethod} onChange={e=>setFilterMethod(e.target.value)} className="border rounded-md px-3 py-2" placeholder="e.g. POST, PUT" />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Filter: Table Name</label>
                      <input value={filterTableName} onChange={e=>setFilterTableName(e.target.value)} className="border rounded-md px-3 py-2" placeholder="e.g. shopify-orders" />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Filter: Path Contains</label>
                      <input value={filterPathContains} onChange={e=>setFilterPathContains(e.target.value)} className="border rounded-md px-3 py-2" placeholder="e.g. /unified/namespaces" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Trigger Name</label>
                    <input value={trigName} onChange={e=>setTrigName(e.target.value)} className="border rounded-md px-3 py-2" placeholder="My Trigger" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Message Template</label>
                    <textarea value={trigTemplate} onChange={e=>setTrigTemplate(e.target.value)} className="border rounded-md px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="Message template using {{trigger}} and {{event}} context" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={()=>testFire(trigEvent)} className="px-4 py-2 border rounded-md">Test Fire</button>
                    <button disabled={saving} onClick={saveTrigger} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60">{saving ? 'Saving...' : 'Save Trigger'}</button>
                  </div>
                </div>

                {/* Method Created */}
                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="accent-blue-600 h-4 w-4" />
                      <span className="font-medium">On Method Created</span>
                    </label>
                    <span className="text-xs text-gray-500">Event: method.created</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Recipient Type</label>
                      <select className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option>Number</option>
                        <option>Group</option>
                      </select>
                    </div>
                    <div className="lg:col-span-7 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Recipient</label>
                      <input className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. +911234567890 or group-id@chat.whatsapp.com" />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Method</label>
                      <select className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option>Send Text</option>
                        <option>Send Template</option>
                        <option>Send Media</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Message Template</label>
                    <textarea className="border rounded-md px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. New method '{{name}}' added to namespace {{namespace}}." />
                  </div>
                </div>

                {/* Account Created */}
                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="accent-blue-600 h-4 w-4" />
                      <span className="font-medium">On Account Created</span>
                    </label>
                    <span className="text-xs text-gray-500">Event: account.created</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Recipient Type</label>
                      <select className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option>Number</option>
                        <option>Group</option>
                      </select>
                    </div>
                    <div className="lg:col-span-7 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Recipient</label>
                      <input className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. +911234567890 or group-id@chat.whatsapp.com" />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Method</label>
                      <select className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option>Send Text</option>
                        <option>Send Template</option>
                        <option>Send Media</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Message Template</label>
                    <textarea className="border rounded-md px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. New account '{{name}}' connected to namespace {{namespace}}." />
                  </div>
                </div>
              </div>

              <div className="border rounded-md">
                <div className="px-3 py-2 text-sm text-gray-500">Existing Triggers</div>
                <div className="divide-y max-h-64 overflow-auto">
                  {triggers.map(t => (
                    <div key={t.id} className="px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate">{t.name}</div>
                        <span className="text-xs text-gray-500">{t.eventType}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">to: {t.action?.to} • conn: {t.connectionId}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {active === 'templates' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4 space-y-3">
                  <h3 className="font-medium">Template List</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center justify-between">
                      <span>Namespace Created</span>
                      <button className="text-xs px-2 py-1 border rounded">Edit</button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Method Created</span>
                      <button className="text-xs px-2 py-1 border rounded">Edit</button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Account Created</span>
                      <button className="text-xs px-2 py-1 border rounded">Edit</button>
                    </li>
                  </ul>
                </div>
                <div className="border rounded-md p-4 space-y-3">
                  <h3 className="font-medium">Editor</h3>
                  <div className="flex flex-col gap-2">
                    <input className="border rounded-md px-3 py-2" placeholder="Template Name" />
                    <textarea className="border rounded-md px-3 py-2 min-h-[140px]" placeholder="Message with variables like {{name}} and {{namespace}}" />
                    <div className="flex gap-2 justify-end">
                      <button className="px-4 py-2 border rounded-md">Reset</button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Template</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {active === 'test' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">Test Send</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">Saved Connections</div>
                  <div className="border rounded-md divide-y max-h-64 overflow-auto">
                    {connections.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No connections found.</div>}
                    {connections.map(c => (
                      <div key={c.id} className="px-3 py-2 text-sm">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500 truncate">{c.id}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">Saved Triggers</div>
                  <div className="border rounded-md divide-y max-h-64 overflow-auto">
                    {triggers.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No triggers found.</div>}
                    {triggers.map(t => (
                      <div key={t.id} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.name}</div>
                          <div className="text-xs text-gray-500 truncate">event: {t.eventType} • to: {t.action?.to}</div>
                        </div>
                        <button onClick={()=>testFire(t.eventType)} className="text-xs px-2 py-1 border rounded">Test</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Tests send a synthetic payload to the backend `/notify/test` for the selected event type and your active triggers will execute (in test mode if your connection is test mode).</div>
              </div>
            </section>
          )}

          {active === 'logs' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">Delivery Logs</h2>
              <div className="flex items-center gap-2">
                <button onClick={fetchLogs} className="px-3 py-1 border rounded text-sm">Refresh</button>
                {loadingLogs && <span className="text-xs text-gray-500">Loading...</span>}
              </div>
              <div className="border rounded-md divide-y max-h-[480px] overflow-auto">
                {logs.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">No logs yet. Messages and response statuses will appear here.</div>
                )}
                {logs.map((l: any) => (
                  <div key={l.id} className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{l.kind}</div>
                      <div className={`text-xs ${l.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{l.status || 'ok'}</div>
                    </div>
                    <div className="text-xs text-gray-500">{l.createdAt}</div>
                    {l.eventType && <div className="text-xs">event: {l.eventType}</div>}
                    {l.triggerId && <div className="text-xs">trigger: {l.triggerId}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default Page