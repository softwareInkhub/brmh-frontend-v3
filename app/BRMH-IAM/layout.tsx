import React from 'react';

export default function BRMHIAMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {children}
    </div>
  );
}

