'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  onClick?: () => void;
  hidden?: boolean; // If true, won't display in UI but path will be used in URL
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  updateUrl: boolean;
  setUpdateUrl: (update: boolean) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [updateUrl, setUpdateUrl] = useState(true);

  // Update browser URL when breadcrumbs change
  useEffect(() => {
    if (typeof window === 'undefined' || !updateUrl) return;

    try {
      if (breadcrumbs.length === 0) {
        window.history.replaceState({}, '', '/');
        return;
      }

      // Build URL path from breadcrumbs
      const pathParts = breadcrumbs
        .filter(b => b.path) // Only include breadcrumbs with path
        .map(b => b.path);
      
      if (pathParts.length > 0) {
        const newPath = `/${pathParts.join('/')}`;
        window.history.replaceState({}, '', newPath);
      }
    } catch (error) {
      console.error('Error updating URL:', error);
    }
  }, [breadcrumbs, updateUrl]);

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs, updateUrl, setUpdateUrl }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}

