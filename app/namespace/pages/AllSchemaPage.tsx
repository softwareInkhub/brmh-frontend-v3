import React, { useEffect, useState } from 'react';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';





export default function AllSchemaPage({ namespace, onViewSchema, onEditSchema, openCreate = false, onCreateNew, refreshSidePanelData, timestamp }: { namespace?: any, onViewSchema?: (schema: any, ns?: any) => void, onEditSchema?: (schema: any, ns?: any) => void, openCreate?: boolean, onCreateNew?: () => void, refreshSidePanelData?: () => Promise<void>, timestamp?: number }) {
  const [schemas, setSchemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchSchemas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/unified/schema`);
      const data = await res.json();
      setSchemas(Array.isArray(data)
        ? (namespace
            ? data.filter((s: any) => s.namespaceId === namespace['namespace-id'])
            : data)
        : []);
    } catch (err) {
      setSchemas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemas();
  }, [namespace]);

  const handleDelete = async (schemaId: string) => {
    if (!confirm('Are you sure you want to delete this schema?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/unified/schema/${schemaId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove the deleted schema from the state
        setSchemas(prevSchemas => prevSchemas.filter(s => s.id !== schemaId));
        
        // Refresh side panel data to remove the deleted schema
        if (refreshSidePanelData) {
          await refreshSidePanelData();
        }
      } else {
        const error = await res.json();
        alert(`Failed to delete schema: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to delete schema. Please try again.');
    }
  };

  const filteredSchemas = schemas.filter(schema => 
    (schema.schemaName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">All Schemas</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            className="inline-flex items-center justify-center gap-1 md:gap-2 bg-purple-600 hover:bg-purple-700 text-white px-2 md:px-4 py-1.5 md:py-2 rounded shadow whitespace-nowrap text-sm md:text-base flex-shrink-0"
            onClick={() => {
              if (typeof onCreateNew === 'function') onCreateNew();
            }}
          >
            <Plus size={14} className="md:hidden" />
            <Plus size={18} className="hidden md:block" />
            <span className="hidden sm:inline">Create Schema</span><span className="sm:hidden">Create</span>
          </button>
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search schemas..."
              className="pl-8 pr-3 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded text-sm ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Grid view"
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="List view"
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div>Loading...</div>
      ) : viewMode === 'grid' ? (
        <div className="flex flex-wrap gap-4">
          {filteredSchemas.map(schema => (
            <div
              key={schema.id}
              className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2 min-w-0 bg-white shadow-sm hover:shadow-md hover:border-purple-400 transition-all cursor-pointer"
              style={{ width: '260px', margin: '0' }}
              onClick={() => onViewSchema && onViewSchema(schema, namespace)}
              title="Click to view schema details"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-base font-semibold text-gray-900 truncate">{schema.schemaName}</span>
                <div className="flex gap-2">
                  <button 
                    className="text-blue-600 hover:text-blue-800 p-1" 
                    title="View" 
                    onClick={(e) => { e.stopPropagation(); onViewSchema && onViewSchema(schema, namespace); }}
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    className="text-green-600 hover:text-green-800 p-1" 
                    title="Edit"
                    onClick={(e) => { e.stopPropagation(); onEditSchema && onEditSchema(schema, namespace); }}
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-800 p-1" 
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(schema.id); }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y">
            {filteredSchemas.map(schema => (
              <div key={schema.id} className="flex items-center gap-3 px-3 md:px-4 py-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => onViewSchema && onViewSchema(schema, namespace)}
              >
                <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center border border-purple-100">
                  <span className="text-xs font-bold text-purple-600">S</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">{schema.schemaName}</div>
                  <div className="text-xs text-gray-500">Schema ID: {schema.id}</div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button className="text-green-600 hover:text-green-800 p-1" title="Edit" onClick={(e) => { e.stopPropagation(); onEditSchema && onEditSchema(schema, namespace); }}><Edit size={16} /></button>
                  <button className="text-red-600 hover:text-red-800 p-1" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(schema.id); }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 