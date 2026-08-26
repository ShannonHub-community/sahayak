import React from 'react';
import { useAuditLogStore } from './useAuditLogStore';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import { TicketStatus } from './types';

export const AuditLogFilterBar: React.FC = () => {
  const { filters, setFilters, tickets } = useAuditLogStore();

  const DEPARTMENTS = ['all', 'NDRF', 'Civil Defense', 'Public Works', 'Health Department', 'Flood Monitoring Cell'];
  const TYPES = ['all', 'Evacuation', 'Resource Dispatch', 'Infrastructure Protection', 'Medical', 'Flood Warning'];
  const STATUSES: { value: TicketStatus | 'all', label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'given', label: 'Given' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'proceeded', label: 'Proceeded' },
    { value: 'reverted', label: 'Reverted' }
  ];

  const pendingInquiriesCount = tickets.reduce((count, ticket) => {
    return count + (ticket.inquiries?.filter(inq => inq.status === 'awaiting_response' || inq.status === 'overdue').length || 0);
  }, 0);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white border border-slate-200 p-4 rounded-md shadow-sm">
      {/* Search Input */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by order name or officer..."
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center text-sm text-slate-600">
          <Filter className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Filters:</span>
        </div>
        
        {/* Department Filter */}
        <select
          value={filters.department}
          onChange={(e) => setFilters({ department: e.target.value })}
          className="pl-3 pr-8 py-2 border border-slate-300 bg-white text-slate-800 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
        >
          {DEPARTMENTS.map(dept => (
            <option key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => setFilters({ type: e.target.value })}
          className="pl-3 pr-8 py-2 border border-slate-300 bg-white text-slate-800 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
        >
          {TYPES.map(type => (
            <option key={type} value={type}>{type === 'all' ? 'All Types' : type}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value as TicketStatus | 'all' })}
          className="pl-3 pr-8 py-2 border border-slate-300 bg-white text-slate-800 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
        >
          {STATUSES.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        {/* Live Counter Pill */}
        {pendingInquiriesCount > 0 && (
          <div className="flex items-center px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-600 ml-auto">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            {pendingInquiriesCount} Actionable {pendingInquiriesCount === 1 ? 'Inquiry' : 'Inquiries'}
          </div>
        )}
      </div>
    </div>
  );
};
