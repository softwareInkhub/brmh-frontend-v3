import React from 'react';

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Select a Namespace
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Choose a namespace to manage your APIs and data
          </p>
        </div>

        {/* Namespace Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {namespaces.map(ns => (
            <button
              key={ns.id}
              className="group relative p-4 md:p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left"
              onClick={() => onSelect && onSelect(ns)}
            >
              {/* Namespace Icon */}
              <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-lg md:text-xl">
                  {ns.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Namespace Name */}
              <h3 className="text-sm md:text-base font-semibold text-gray-900 text-center group-hover:text-blue-600 transition-colors duration-200 capitalize">
                {ns.name}
              </h3>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-xl bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
            </button>
          ))}
        </div>

        {/* Empty State (if no namespaces) */}
        {namespaces.length === 0 && (
          <div className="text-center py-12 md:py-16">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No Namespaces Found</h3>
            <p className="text-sm md:text-base text-gray-500">Create your first namespace to get started</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 md:mt-12 text-center">
          <button className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base font-medium">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Namespace
          </button>
        </div>
      </div>
    </div>
  );
} 