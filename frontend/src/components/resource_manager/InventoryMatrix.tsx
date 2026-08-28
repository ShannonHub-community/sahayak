"use client";

import React, { useState } from 'react';
import { useResourceStore } from './useResourceStore';
import { Search, Plus } from 'lucide-react';
import { ShelterProgressBar } from './ShelterProgressBar';
import { AddStockModal } from './AddStockModal';

const CATEGORIES = ['All', 'Personnel', 'Ration Supply', 'Medical Equipment', 'Vehicles', 'Shelter Objects'];
const STATUSES = ['All Statuses', 'Available', 'Assigned', 'In Transit', 'Depleted', 'Maintenance'];

export const InventoryMatrix: React.FC = () => {
  const { resources, searchQuery, categoryFilter, statusFilter, setSearchQuery, setSelectedCategory, setSelectedStatus } = useResourceStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subtype.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.zoneName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCategory = true;
    if (categoryFilter !== 'All') {
      const catMap: Record<string, string> = {
        'Personnel': 'personnel',
        'Ration Supply': 'ration',
        'Medical Equipment': 'medical_equipment',
        'Vehicles': 'vehicle',
        'Shelter Objects': 'shelter_object'
      };
      matchesCategory = r.category === catMap[categoryFilter];
    }

    let matchesStatus = true;
    if (statusFilter !== 'All Statuses') {
      matchesStatus = r.status.toLowerCase().replace(' ', '_') === statusFilter.toLowerCase().replace(' ', '_');
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-950/70 text-emerald-300 border-emerald-600/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-600/80 border';
      case 'assigned': return 'bg-blue-950/70 text-blue-300 border-blue-600/80 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-600/80 border';
      case 'in_transit': return 'bg-amber-950/70 text-amber-300 border-amber-600/80 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-600/80 border';
      case 'depleted': return 'bg-rose-950/70 text-rose-300 border-rose-600/80 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-600/80 border';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600 border';
    }
  };

  const getSourceBadge = (source: string) => {
    if (source === 'government') return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
    return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800';
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search items, subtypes, or zones..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all duration-150"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-400 transition-all duration-150"
              value={statusFilter}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {STATUSES.map(s => <option key={s} value={s} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{s}</option>)}
            </select>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded hover:bg-zinc-900 dark:hover:bg-white transition-all duration-150 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Stock
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-150 ${categoryFilter === cat ? 'bg-zinc-800 text-white border-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200' : 'bg-transparent text-zinc-600 border-zinc-300 hover:bg-zinc-100 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-800'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-100 dark:bg-zinc-900 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-sm">Item & Subtype</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-sm">Category</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-sm">Source</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-sm">Qty</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-sm">Status</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-sm">Location</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-sm">Details / Capacity</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-200 dark:divide-zinc-800/50 text-zinc-900 dark:text-zinc-100">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No resources found matching your criteria.</td>
                </tr>
              ) : (
                filteredResources.map(res => (
                  <React.Fragment key={res.id}>
                    <tr onClick={() => setExpandedRowId(expandedRowId === res.id ? null : res.id)} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-150 group cursor-pointer">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {res.name}
                          {res.quantity === 0 && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-600/80">
                              ● DEPLETED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">{res.subtype}</div>
                      </td>
                      <td className="px-4 py-3 capitalize text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{res.category.replace('_', ' ')}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSourceBadge(res.source)}`}>
                          {res.source === 'government' ? 'Govt Stock' : 'Verified Donation'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100">{res.quantity}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusBadge(res.status)}`}>
                          {res.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{res.location.zoneName}</td>
                      <td className="px-4 py-3 min-w-[200px]">
                        {res.category === 'shelter_object' && res.capacity != null && res.occupancy != null ? (
                          <ShelterProgressBar capacity={res.capacity} occupancy={res.occupancy} />
                        ) : (
                          <div className="text-xs text-zinc-700 dark:text-zinc-300">
                            {res.assigned_to ? `Assigned to: ${res.assigned_to}` : '—'}
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedRowId === res.id && (
                      <tr className="bg-zinc-50 dark:bg-zinc-900/80">
                        <td colSpan={7} className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                          <div className="grid grid-cols-3 gap-6 text-xs">
                            <div>
                              <span className="font-semibold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider block mb-1">GPS Coordinates</span>
                              <span className="text-zinc-900 dark:text-zinc-100 font-mono">{res.location.lat.toFixed(4)}°N, {res.location.lng.toFixed(4)}°E</span>
                            </div>
                            <div>
                              <span className="font-semibold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider block mb-1">Assigned To</span>
                              <span className="text-zinc-900 dark:text-zinc-100">{res.assigned_to || '— Unassigned'}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider block mb-1">Timestamps</span>
                              <span className="text-zinc-800 dark:text-zinc-300 block font-mono">Created: {new Date(res.created_at).toLocaleString()}</span>
                              <span className="text-zinc-800 dark:text-zinc-300 block font-mono">Updated: {new Date(res.updated_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && <AddStockModal onClose={() => setIsAddModalOpen(false)} />}
    </>
  );
};
