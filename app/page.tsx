'use client';

import React, { useState } from 'react';
import { Card } from './components/ui/card';
import {
  Users,
  Database,
  Play,
  Cloud,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Webhook,
  Code,
  Activity,
  CircleDot,
  UserPlus,
  Shield,
  Key,
  Settings,
  Globe,
  Link as LinkIcon,
  Clock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

type TabType = 'active' | 'history' | 'settings';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('active');

  // Example data - replace with real data from your API
  const stats = {
    activeNamespaces: 24,
    totalExecutions: 1289,
    activeWebhooks: 18,
    activeClients: 45,
    userStats: {
      totalUsers: 1250,
      activeToday: 180,
      pendingInvites: 12,
      recentLogins: 45
    },
    awsServices: {
      lambda: 12,
      dynamodb: 8,
      s3: 15,
      sns: 5
    },
    recentExecutions: [
      { id: 'exec-123', status: 'completed', timestamp: '2024-03-15T10:30:00Z' },
      { id: 'exec-124', status: 'in-progress', timestamp: '2024-03-15T10:28:00Z' },
      { id: 'exec-125', status: 'error', timestamp: '2024-03-15T10:25:00Z' }
    ],
    recentUsers: [
      { id: 'usr-1', name: 'John Doe', status: 'active', lastLogin: '2024-03-15T10:30:00Z', apps: ['App1', 'App2'] },
      { id: 'usr-2', name: 'Jane Smith', status: 'inactive', lastLogin: '2024-03-14T15:20:00Z', apps: ['App3'] },
      { id: 'usr-3', name: 'Mike Johnson', status: 'pending', lastLogin: null, apps: [] }
    ],
    webhooks: {
      active: [
        { id: 'wh-1', name: 'Order Processing', url: 'https://api.example.com/orders', status: 'active', lastTriggered: '2024-03-15T10:30:00Z', successRate: '98%' },
        { id: 'wh-2', name: 'User Signup', url: 'https://api.example.com/users', status: 'active', lastTriggered: '2024-03-15T09:45:00Z', successRate: '100%' },
        { id: 'wh-3', name: 'Payment Gateway', url: 'https://api.example.com/payments', status: 'inactive', lastTriggered: '2024-03-14T15:20:00Z', successRate: '95%' }
      ],
      history: [
        { id: 'evt-1', webhook: 'Order Processing', status: 'success', timestamp: '2024-03-15T10:30:00Z', responseTime: '245ms' },
        { id: 'evt-2', webhook: 'User Signup', status: 'failed', timestamp: '2024-03-15T09:45:00Z', responseTime: '502ms' },
        { id: 'evt-3', webhook: 'Payment Gateway', status: 'success', timestamp: '2024-03-14T15:20:00Z', responseTime: '189ms' }
      ]
    }
  };

  return (
    <div
      className="space-y-4 px-2 md:px-8 pt-4 md:pt-8 pb-24 bg-white dark:bg-gray-950 min-h-screen"
      style={{ maxWidth: '100%', boxSizing: 'border-box' }}
    >
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
          Monitor your platform&apos;s performance and metrics
        </p>
      </div>

      {/* Key Metrics Grid - 2x2 layout */}
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <Card className="p-3 hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Active Namespaces</p>
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {stats.activeNamespaces}
              </h3>
            </div>
            <div className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Database className="w-4 h-4 md:w-5 md:h-5 text-green-500 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-[10px] md:text-xs text-green-600 dark:text-green-400">
            <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
            <span>12% increase</span>
          </div>
        </Card>

        <Card className="p-3 hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Total Executions</p>
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {stats.totalExecutions}
              </h3>
            </div>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Play className="w-4 h-4 md:w-5 md:h-5 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-[10px] md:text-xs text-blue-600 dark:text-blue-400">
            <Activity className="w-3 h-3 md:w-4 md:h-4" />
            <span className="ml-1">Active now</span>
          </div>
        </Card>

        <Card className="p-3 hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Active Webhooks</p>
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {stats.activeWebhooks}
              </h3>
            </div>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Webhook className="w-4 h-4 md:w-5 md:h-5 text-purple-500 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-[10px] md:text-xs text-purple-600 dark:text-purple-400">
            <Bell className="w-3 h-3 md:w-4 md:h-4" />
            <span className="ml-1">All operational</span>
          </div>
        </Card>

        <Card className="p-3 hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Active Clients</p>
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {stats.activeClients}
              </h3>
            </div>
            <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-orange-500 dark:text-orange-400" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-[10px] md:text-xs text-orange-600 dark:text-orange-400">
            <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
            <span>8 new this week</span>
          </div>
        </Card>
      </div>

      {/* User Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* User Stats */}
        <Card className="p-4 md:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                User Management
              </h2>
            </div>
            <Link
              href="/users"
              className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Manage Users
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Total Users</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {stats.userStats.totalUsers}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500 dark:text-green-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Active Today</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {stats.userStats.activeToday}
              </p>
            </div>


            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Recent Logins</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {stats.userStats.recentLogins}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {stats.recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-500'
                        : user.status === 'inactive'
                        ? 'bg-gray-400 dark:bg-gray-500'
                        : 'bg-yellow-500'
                    }`}
                  />
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {user.apps.length} apps
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString('en-GB')
                      : 'Never'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Authentication Controls */}
        <Card className="p-4 md:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                Authentication Controls
              </h2>
            </div>
            <Link
              href="/auth-settings"
              className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Settings
            </Link>
          </div>

          <div className="space-y-3">
            <Link href="/users/sso" className="block">
              <div className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      SSO Configuration
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Manage single sign-on settings
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </div>
            </Link>

            <Link href="/users/api-keys" className="block">
              <div className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                     <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      API Keys
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Manage authentication tokens
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </div>
            </Link>

            <Link href="/users/roles" className="block">
              <div className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Role Management
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Configure user roles and permissions
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </div>
            </Link>

            <Link href="/users/audit" className="block">
              <div className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Audit Logs
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      View authentication activity
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Webhook Management Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/40">
                <Webhook className="w-5 h-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Webhook Management
                </h2>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Monitor delivery, inspect history, and configure global webhook behavior
                </p>
              </div>
            </div>
            <Link
              href="/webhooks/new"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 dark:bg-purple-700 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-purple-400"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              New Webhook
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 rounded-lg bg-gray-50 dark:bg-gray-900/70 p-1 gap-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/70'
              }`}
            >
              Active Webhooks
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/70'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/70'
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 md:px-6 py-4">
          {activeTab === 'active' && (
            <div className="grid gap-3">
              {stats.webhooks.active.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-2 sm:mb-0">
                    <div
                      className={`p-2 rounded-lg ${
                        webhook.status === 'active' ? 'bg-green-100' : 'bg-gray-200'
                      }`}
                    >
                      <Webhook
                        className={`w-4 h-4 ${
                          webhook.status === 'active' ? 'text-green-600' : 'text-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {webhook.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {webhook.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      Last: {new Date(webhook.lastTriggered).toLocaleTimeString('en-GB')}
                    </span>
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                      <Activity className="w-3 h-3 mr-1" />
                      {webhook.successRate} success
                    </span>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
              <div className="hidden md:grid grid-cols-4 gap-2 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
                <div>WEBHOOK</div>
                <div>STATUS</div>
                <div>TIME</div>
                <div>RESPONSE</div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {stats.webhooks.history.map((event) => (
                  <div
                    key={event.id}
                    className="grid grid-cols-1 md:grid-cols-4 gap-2 px-4 py-3 text-xs md:text-sm bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="text-gray-900 dark:text-white font-medium text-xs md:text-sm">
                      <span className="md:hidden text-gray-500 dark:text-gray-400 mr-2">
                        Webhook:
                      </span>
                      {event.webhook}
                    </div>
                    <div>
                      <span className="md:hidden text-gray-500 dark:text-gray-400 mr-2">Status:</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                          event.status === 'success'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">
                      <span className="md:hidden text-gray-500 dark:text-gray-400 mr-2">
                        Time:
                      </span>
                      {new Date(event.timestamp).toLocaleString('en-GB', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">
                      <span className="md:hidden text-gray-500 dark:text-gray-400 mr-2">
                        Response:
                      </span>
                      {event.responseTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid gap-4 md:gap-6">
              <Card className="p-4 md:p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Global Delivery
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Control how your webhooks behave across all namespaces and integrations.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-800 dark:text-gray-100">
                          Retry Failed Webhooks
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Automatically retry 5xx and network failures with backoff.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-800 dark:text-gray-100">
                          Timeout Duration
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          How long to wait for a webhook endpoint before failing.
                        </span>
                      </div>
                    </div>
                    <select className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      <option>30 seconds</option>
                      <option>1 minute</option>
                      <option>5 minutes</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Security
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Enforce transport security and select the default authentication strategy.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-800 dark:text-gray-100">
                          HTTPS Only
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Block any webhook targets that are not served over TLS.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-800 dark:text-gray-100">
                          Authentication
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Default auth method used when creating new webhook configs.
                        </span>
                      </div>
                    </div>
                    <select className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      <option>Basic Auth</option>
                      <option>Bearer Token</option>
                      <option>API Key</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* AWS Services & Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* AWS Services Overview */}
        <Card className="p-4 md:p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">AWS Services</h2>
            <Link
              href="/aws-services"
              className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/40">
                  <Cloud className="w-5 h-5 md:w-6 md:h-6 text-blue-500 dark:text-blue-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-100">
                    Lambda Functions
                  </span>
                  <span className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400">
                    Active compute workloads
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                  {stats.awsServices.lambda}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] md:text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  <CircleDot className="w-3 h-3" />
                  Healthy
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/40">
                  <Database className="w-5 h-5 md:w-6 md:h-6 text-purple-500 dark:text-purple-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-100">
                    DynamoDB Tables
                  </span>
                  <span className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400">
                    Primary data stores
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                  {stats.awsServices.dynamodb}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] md:text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  <CircleDot className="w-3 h-3" />
                  Online
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/40">
                  <Code className="w-5 h-5 md:w-6 md:h-6 text-orange-500 dark:text-orange-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-100">
                    S3 Buckets
                  </span>
                  <span className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400">
                    Object storage endpoints
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                  {stats.awsServices.s3}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] md:text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  <CircleDot className="w-3 h-3" />
                  Available
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Executions */}
        <Card className="p-4 md:p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Recent Executions</h2>
            <Link
              href="/executions"
              className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3 md:space-y-4">
            {stats.recentExecutions.map((execution) => (
              <div
                key={execution.id}
                className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div
                    className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${
                      execution.status === 'completed'
                        ? 'bg-emerald-500'
                        : execution.status === 'in-progress'
                        ? 'bg-blue-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      {execution.id}
                    </span>
                    <span className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400">
                      {new Date(execution.timestamp).toLocaleTimeString('en-GB')}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] md:text-xs font-semibold ${
                    execution.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : execution.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {execution.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-stretch">
        <Link href="/users" className="group">
          <Card className="h-full min-h-[96px] p-3 md:p-4 bg-white/95 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all group-hover:border-indigo-400">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 dark:text-indigo-300" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">User Management</h3>
                <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
                  Manage users
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/namespace" className="group">
          <Card className="h-full min-h-[96px] p-3 md:p-4 bg-white/95 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all group-hover:border-blue-400">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
                <Database className="w-4 h-4 md:w-5 md:h-5 text-blue-500 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">Manage Namespaces</h3>
                <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
                  Configure namespaces
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/executions" className="group">
          <Card className="h-full min-h-[96px] p-3 md:p-4 bg-white/95 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all group-hover:border-green-400">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-50 dark:bg-green-900/40 rounded-lg">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-green-500 dark:text-green-300" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">View Executions</h3>
                <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
                  Monitor pipeline
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/aws-services" className="group">
          <Card className="h-full min-h-[96px] p-3 md:p-4 bg-white/95 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all group-hover:border-purple-400">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-purple-50 dark:bg-purple-900/40 rounded-lg">
                <Cloud className="w-4 h-4 md:w-5 md:h-5 text-purple-500 dark:text-purple-300" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">AWS Services</h3>
                <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
                  Manage resources
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}