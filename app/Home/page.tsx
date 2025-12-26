'use client';

import React, { useState, Suspense } from 'react';
import NamespaceLibrarySidebar from '../components/NamespaceLibrarySidebar';
// import Navbar from '../components/Navbar';
import { LayoutGrid, List, Upload, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'apiHub' ? 'apiHub' : 'projects';
  const [activePanel, setActivePanel] = useState<'projects' | 'apiHub'>(initialTab);

  // Sync state with URL
  const setPanelAndUrl = (panel: 'projects' | 'apiHub') => {
    setActivePanel(panel);
    const url = panel === 'projects' ? '?tab=project' : '?tab=apiHub';
    router.replace(url, { scroll: false });
  };

  // Keep state in sync with URL changes (e.g. browser navigation)
  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'apiHub' && activePanel !== 'apiHub') setActivePanel('apiHub');
    if ((tab === 'project' || !tab) && activePanel !== 'projects') setActivePanel('projects');
  }, [searchParams, activePanel]);

  return (
    <div className="min-h-[100vh] bg-[#f7f8fa] dark:bg-gray-950 flex flex-col">
      {/* Navbar */}
      {/* <Navbar onMenuClick={() => {}} /> */}
      <div className="flex flex-1 h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <NamespaceLibrarySidebar 
          onApiHubClick={() => setPanelAndUrl('apiHub')} 
          onPersonalTeamClick={() => setPanelAndUrl('projects')} 
        />
        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-[#f7f8fa] dark:bg-gray-950 min-h-0">
          {activePanel === 'projects' && (
            <>
              {/* Team Header */}
              <div className="flex items-center gap-3 mb-2 pl-8 pr-8 pt-8">
                <span className="font-semibold text-lg text-gray-800 dark:text-white">Personal Team</span>
                <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold px-2 py-0.5 rounded">Team Owner</span>
              </div>
              {/* Tabs */}
              <div className="flex items-center gap-6 border-b dark:border-gray-800 mb-6 pl-8 pr-8">
                <button className="py-2 px-1 border-b-2 border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-400 font-semibold text-sm">Projects</button>
                <button className="py-2 px-1 text-gray-500 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400">Resources</button>
                <button className="py-2 px-1 text-gray-500 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400">Activities</button>
                <button className="py-2 px-1 text-gray-500 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400">Members</button>
                <button className="py-2 px-1 text-gray-500 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400">Plans</button>
                <button className="py-2 px-1 text-gray-500 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400">Settings</button>
              </div>
              {/* Project Card Grid */}
              <div className="flex items-center justify-between mb-4 pl-8 pr-8">
                <div className="flex gap-2">
                  <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><LayoutGrid className="w-5 h-5 text-gray-400 dark:text-gray-500" /></button>
                  <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><List className="w-5 h-5 text-gray-400 dark:text-gray-500" /></button>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"><Upload className="w-4 h-4" />Import Project</button>
                  <button className="px-3 py-1.5 rounded bg-purple-500 dark:bg-purple-600 text-white text-sm font-semibold flex items-center gap-1 hover:bg-purple-600 dark:hover:bg-purple-700"><Plus className="w-4 h-4" />New Project</button>
                </div>
              </div>
              {/* Project Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-8 pr-8">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow border dark:border-gray-800 p-6 flex flex-col items-center gap-3 w-64">
                  <div className="w-14 h-14 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-2">
                    <span className="text-3xl">📅</span>
                  </div>
                  <div className="font-semibold text-gray-800 dark:text-white text-base">My Project</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">HTTP</div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}