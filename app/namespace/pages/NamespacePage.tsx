'use client';

import React from 'react';
import { Card } from '../../components/ui/card';
import {
  Database,
  Plus,
  GitBranch,
  CheckCircle2,
  Settings,
  FolderPlus,
  Search,
  Grid3x3,
  List
} from 'lucide-react';

type Namespace = { id: string; name: string };
type Props = { onSelect?: (ns: Namespace) => void };

const namespaces = [
  { id: 'ns1', name: 'pinterest' },
  { id: 'ns2', name: 'shopify' },
  { id: 'ns3', name: 'project management' },
  { id: 'ns4', name: 'whapi' },
  { id: 'ns5', name: 'aws' },
];

export default function NamespacePage({ onSelect }: Props) {
  return (
    <div
      className="space-y-4 px-2 md:px-8 pt-4 md:pt-8 pb-24 bg-white dark:bg-gray-950 min-h-screen"
      style={{ maxWidth: '100%', boxSizing: 'border-box' }}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
            Select a Namespace
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Choose a namespace to manage unified APIs, data pipelines, and downstream services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Grid3x3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <List className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
            <Plus className="w-4 h-4" />
            Add Namespace
          </button>
        </div>
      </div>

      {/* Namespace Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 items-stretch">
        {namespaces.map(ns => (
          <button
            key={ns.id}
            className="h-full min-h-[140px] group relative p-4 md:p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-left hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200"
            onClick={() => onSelect && onSelect(ns)}
          >
            {/* Namespace Icon */}
            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 mb-3 md:mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 dark:group-hover:from-blue-500 dark:group-hover:to-indigo-500 transition-colors duration-200">
              <span className="text-white font-semibold text-lg md:text-xl">
                {ns.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Namespace Name */}
            <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors duration-200 capitalize">
              {ns.name}
            </h3>
            <p className="mt-1 text-[11px] md:text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              Unified integration surface for the {ns.name} domain.
            </p>
          </button>
        ))}
      </div>

      {/* Empty State (if no namespaces) */}
      {namespaces.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderPlus className="w-8 h-8 md:w-10 md:h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Namespaces Found
          </h3>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
            Create your first namespace to start orchestrating integrations.
          </p>
        </div>
      )}

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-stretch">
        <button className="group h-full min-h-[96px] p-3 md:p-4 bg-white/95 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
              <Plus className="w-4 h-4 md:w-5 md:h-5 text-blue-500 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                Create Namespace
              </h3>
              <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
                New unified integration surface
              </p>
            </div>
          </div>
        </button>

        <button className="group h-full min-h-[96px] p-3 md:p-4 bg-white/95 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500 transition-all text-left">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-purple-50 dark:bg-purple-900/40 rounded-lg">
              <GitBranch className="w-4 h-4 md:w-5 md:h-5 text-purple-500 dark:text-purple-300" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                View Mappings
              </h3>
              <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
                Inspect namespace field mappings
              </p>
            </div>
          </div>
        </button>

        <button className="group h-full min-h-[96px] p-3 md:p-4 bg-white/95 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md hover:border-green-400 dark:hover:border-green-500 transition-all text-left">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-green-50 dark:bg-green-900/40 rounded-lg">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 dark:text-green-300" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                Test Namespace
              </h3>
              <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
                Run smoke tests against endpoints
              </p>
            </div>
          </div>
        </button>

        <button className="group h-full min-h-[96px] p-3 md:p-4 bg-white/95 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg">
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 dark:text-indigo-300" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                Namespace Settings
              </h3>
              <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
                Configure limits and defaults
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}