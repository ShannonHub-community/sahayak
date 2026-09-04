import React from 'react';
import { useLedger } from '../context/LedgerContext';
import { Database, Search, ArrowUpRight, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Home, Truck, Users, Package } from 'lucide-react';

export const CenterPanelResourceMatrix = () => {
  const {
    inventory,
    activeCategory,
    setActiveCategory,
    inventoryStatusFilter,
    setInventoryStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedSector,
    lastUpdatedInventoryId
  } = useLedger();

  const categories = [
    { id: 'All', label: 'All Resources', icon: Layers },
    { id: 'Personnel', label: 'Personnel', icon: Users },
    { id: 'Fleet', label: 'Fleet', icon: Truck },
    { id: 'Supplies', label: 'Supplies', icon: Package },
    { id: 'Infrastructure', label: 'Infrastructure', icon: Home }
  ];

  // Filter inventory — guard against undefined fields so bad data never crashes the table
  const filteredInventory = (inventory || []).filter(item => {
    if (!item) return false;
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesStatus = inventoryStatusFilter === 'All' || item.status === inventoryStatusFilter;
    const matchesSector = selectedSector === 'All Sectors' || (item.location || '').includes(selectedSector);
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSector && matchesSearch;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-base tracking-wide text-white">
                Live Resource Inventory
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[11px] px-2 py-0.5 rounded border border-emerald-500/30">
                ACTIVE LEDGER
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Real-time resource deployment & occupancy matrix
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search matrix items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-slate-100 text-xs pl-8 pr-3 py-1.5 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Category Tabs (Required exact categories: Personnel, Fleet, Supplies, Infrastructure) */}
      <div className="bg-slate-100 border-b border-slate-200 p-2 flex items-center justify-between overflow-x-auto gap-1">
        <div className="flex items-center space-x-1 min-w-max">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1 text-xs shrink-0 pl-2">
          <span className="text-slate-500 text-[11px] font-semibold uppercase">Status:</span>
          {['All', 'Available', 'Deployed', 'Depleted'].map(st => (
            <button
              key={st}
              onClick={() => setInventoryStatusFilter(st)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                inventoryStatusFilter === st
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table View */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
              <th className="py-2.5 px-3">Resource Name</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-right">Available</th>
              <th className="py-2.5 px-3 text-right">Deployed</th>
              <th className="py-2.5 px-3">Capacity / Stock Metrics</th>
              <th className="py-2.5 px-3">Location</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  No resources match the selected criteria.
                </td>
              </tr>
            ) : (
              (filteredInventory || []).map((item) => {
                const isShelter = item.category === 'Infrastructure' || item.capacity;
                const isUpdated = item.id === lastUpdatedInventoryId;
                const total = item.total ?? 0;
                const available = item.available ?? 0;
                const deployed = item.deployed ?? 0;
                const occupancy = item.occupancy ?? item.currentOccupancy ?? 0;
                const capacity = item.capacity ?? 1; // avoid division by zero
                const occupancyPercent = isShelter ? Math.round((occupancy / capacity) * 100) : 0;

                const isDepleted = item.status === 'Depleted' || available <= 15;
                const isDeployedHeavy = deployed > available;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isUpdated ? 'highlight-updated bg-emerald-50/60' : ''
                    }`}
                  >
                    {/* Resource Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {item.name}
                        </span>
                        {isUpdated && (
                          <span className="bg-emerald-600 text-white font-extrabold text-[9px] px-1.5 py-0.2 rounded animate-bounce">
                            +100 ADDED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3">
                      <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                      {item.total ? item.total.toLocaleString() : '0'}
                    </td>

                    {/* Available */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {item.available ? item.available.toLocaleString() : '0'}
                    </td>

                    {/* Deployed */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-blue-700">
                      {item.deployed ? item.deployed.toLocaleString() : '0'}
                    </td>

                    {/* Capacity vs Occupancy for Shelters or Stock Bar for Supplies */}
                    <td className="py-2.5 px-3 min-w-[160px]">
                      {isShelter ? (
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-600 mb-0.5 font-semibold">
                            <span>Occupancy: {occupancy}/{capacity}</span>
                            <span className={occupancyPercent > 80 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                              {occupancyPercent}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all ${
                                occupancyPercent > 85
                                  ? 'bg-rose-500'
                                  : occupancyPercent > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${occupancyPercent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                            <span>Avail ratio: {total > 0 ? Math.round((available / total) * 100) : 0}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full ${
                                available < 20 ? 'bg-rose-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${total > 0 ? Math.min(100, Math.round((available / total) * 100)) : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {item.location}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md inline-block border ${
                          item.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'Deployed'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Ledger Summary */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-slate-700">
          Showing {filteredInventory.length} of {inventory.length} matrix entries
        </span>
        <span className="text-[11px]">
          Last synchronized: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
