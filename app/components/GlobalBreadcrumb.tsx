'use client';
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useBreadcrumb } from './BreadcrumbContext';

export default function GlobalBreadcrumb() {
  const { breadcrumbs } = useBreadcrumb();

  // Filter out hidden breadcrumbs for display
  const visibleBreadcrumbs = breadcrumbs.filter(b => !b.hidden);
  
  // Don't show if no visible breadcrumbs
  if (visibleBreadcrumbs.length === 0) return null;

  return (
    <div className="breadcrumb-nav bg-gray-50 border-b border-gray-200 px-4 py-2.5 sticky top-0 z-40 w-full">
      <div className="flex items-center gap-2 text-sm">
        {visibleBreadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight size={14} className="text-gray-400" />
            )}
            {crumb.onClick ? (
              <button
                onClick={crumb.onClick}
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-gray-700 font-medium">
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

