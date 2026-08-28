"use client";

import React, { useState } from 'react';
import { useResourceStore } from './useResourceStore';
import { ResourceCategory, ResourceSubtype, ResourceSource } from './types';
import { X, PackagePlus } from 'lucide-react';

interface AddStockModalProps {
  onClose: () => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ onClose }) => {
  const addResource = useResourceStore(state => state.addResource);
  const [category, setCategory] = useState<ResourceCategory>('ration');
  const [subtype, setSubtype] = useState<string>('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(100);
  const [zoneName, setZoneName] = useState('');
  const [source, setSource] = useState<ResourceSource>('government');
  const [capacity, setCapacity] = useState<number | undefined>();
  const [occupancy, setOccupancy] = useState<number | undefined>();
  const [challanNumber, setChallanNumber] = useState('');
  const [issuingDepot, setIssuingDepot] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addResource({
      category,
      subtype: subtype as unknown as ResourceSubtype,
      name,
      quantity,
      status: 'available',
      location: { lat: 18.98, lng: 73.11, zoneName },
      source,
      capacity: category === 'shelter_object' ? capacity : null,
      occupancy: category === 'shelter_object' ? occupancy : null,
      challan_number: source === 'government' ? challanNumber : null,
      issuing_depot: source === 'government' ? issuingDepot : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-100">
            <PackagePlus className="w-5 h-5 text-zinc-300" /> Govt Depot Inward
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all duration-150">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Item Name</label>
            <input required type="text" className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 5L Water Bottles" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-300">Category</label>
              <select className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none" value={category} onChange={(e) => setCategory(e.target.value as ResourceCategory)}>
                <option value="personnel" className="bg-zinc-900 text-zinc-100">Personnel</option>
                <option value="ration" className="bg-zinc-900 text-zinc-100">Ration</option>
                <option value="medical_equipment" className="bg-zinc-900 text-zinc-100">Medical Equipment</option>
                <option value="vehicle" className="bg-zinc-900 text-zinc-100">Vehicle</option>
                <option value="shelter_object" className="bg-zinc-900 text-zinc-100">Shelter Object</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-300">Subtype</label>
              <input required type="text" className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none" value={subtype} onChange={(e) => setSubtype(e.target.value)} placeholder="Subtype" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-300">Quantity</label>
              <input required type="number" className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none font-mono" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-300">Source</label>
              <select className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none" value={source} onChange={(e) => setSource(e.target.value as ResourceSource)}>
                <option value="government" className="bg-zinc-900 text-zinc-100">Government</option>
                <option value="donation" className="bg-zinc-900 text-zinc-100">Donation</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Zone / Location Name</label>
            <input required type="text" className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none" value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="e.g. Sector 4 Warehouse" />
          </div>

          {source === 'government' && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-800/50 rounded border border-zinc-700 mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">Challan Ref Number</label>
                <input required type="text" className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none font-mono" value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} placeholder="e.g. MH-RAI-2026-081" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">Issuing Depot</label>
                <input required type="text" className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none" value={issuingDepot} onChange={(e) => setIssuingDepot(e.target.value)} placeholder="e.g. Panvel Central Depot" />
              </div>
            </div>
          )}

          {category === 'shelter_object' && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-800/50 rounded border border-zinc-700 mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">Capacity</label>
                <input type="number" className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none font-mono" value={capacity || ''} onChange={(e) => setCapacity(Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">Occupancy</label>
                <input type="number" className="p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-400 outline-none font-mono" value={occupancy || ''} onChange={(e) => setOccupancy(Number(e.target.value))} />
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-900 dark:hover:bg-white transition-all duration-150">Save Stock</button>
          </div>
        </form>
      </div>
    </div>
  );
};
