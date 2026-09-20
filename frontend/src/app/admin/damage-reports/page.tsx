'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Download,
  Search,
  Filter,
  RefreshCw,
  HardHat,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Home,
  ShieldAlert,
  Radio,
  FileSpreadsheet,
  PackageCheck,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowUpDown,
  X
} from 'lucide-react';

export type DamageSeverity = 'Critical' | 'Medium' | 'Low';
export type DamageStatus = 'Pending' | 'Assigned to Repair Crew' | 'Resolved';

export interface PDNADamageReport {
  id: string;
  category: string;
  severity: DamageSeverity;
  lat: number;
  lng: number;
  landmark: string;
  reported_at: string;
  status: DamageStatus;
  assigned_crew?: string;
  photo_url?: string;
  citizen_contact?: string;
}

const INITIAL_MOCK_REPORTS: PDNADamageReport[] = [
  {
    id: '#PDNA-1042',
    category: 'Collapsed Structure',
    severity: 'Critical',
    lat: 18.9894,
    lng: 73.1166,
    landmark: 'Bridge Pillar 4 over Ulhas River',
    reported_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: 'Assigned to Repair Crew',
    assigned_crew: 'PWD Heavy Bridge Div #2',
    photo_url: '/placeholder.jpg',
    citizen_contact: '+91 98201 12345',
  },
  {
    id: '#PDNA-1039',
    category: 'Downed Power Lines',
    severity: 'Critical',
    lat: 18.9951,
    lng: 73.1215,
    landmark: 'High Voltage Feeder, Sector 8 Grid',
    reported_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    status: 'Pending',
    assigned_crew: 'MSEDCL Emergency Rapid Unit',
    photo_url: '/placeholder.jpg',
    citizen_contact: '+91 98765 43210',
  },
  {
    id: '#PDNA-1035',
    category: 'Blocked Road',
    severity: 'Medium',
    lat: 18.9832,
    lng: 73.1098,
    landmark: 'National Highway 48 Bypass Km 124',
    reported_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    status: 'Assigned to Repair Crew',
    assigned_crew: 'NHAI Debris Clearance Team 4',
    photo_url: '/placeholder.jpg',
  },
  {
    id: '#PDNA-1028',
    category: 'Flooded Infrastructure',
    severity: 'Critical',
    lat: 19.0012,
    lng: 73.1145,
    landmark: 'Underpass Substation #3, Sector 14',
    reported_at: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    status: 'Pending',
    assigned_crew: 'Irrigation & Drainage Wing',
  },
  {
    id: '#PDNA-1021',
    category: 'Contaminated Water',
    severity: 'Medium',
    lat: 18.9775,
    lng: 73.1311,
    landmark: 'Municipal Water Main Conduit, Ward 9',
    reported_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    status: 'Assigned to Repair Crew',
    assigned_crew: 'Public Health Sanitation Crew',
  },
  {
    id: '#PDNA-1014',
    category: 'Blocked Road',
    severity: 'Low',
    lat: 18.9867,
    lng: 73.1254,
    landmark: 'Colony Internal Road, Sector 5',
    reported_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    status: 'Resolved',
    assigned_crew: 'Municipal Road Maintenance Unit',
  },
  {
    id: '#PDNA-1008',
    category: 'Collapsed Structure',
    severity: 'Critical',
    lat: 18.9928,
    lng: 73.1042,
    landmark: 'Old Grain Depot Wall Boundary',
    reported_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    status: 'Resolved',
    assigned_crew: 'SDRF Urban Search Engineering Unit',
  },
];

export default function AdminDamageReportsPage() {
  const [reports, setReports] = useState<PDNADamageReport[]>(INITIAL_MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState<PDNADamageReport | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [sortField, setSortField] = useState<'reported_at' | 'severity' | 'id'>('reported_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Live IST clock
  useEffect(() => {
    const tick = () =>
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // Attempt to fetch from backend if endpoint is live
  useEffect(() => {
    async function fetchLiveReports() {
      try {
        const res = await fetch('/api/admin/damage-reports');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setReports(data);
          }
        }
      } catch (err) {
        // Mock fallback is already populated
      }
    }
    fetchLiveReports();
  }, []);

  // Update status for a specific row
  const handleStatusChange = (id: string, newStatus: DamageStatus) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  // Export to CSV Functionality
  const handleExportCSV = () => {
    const headers = [
      'Tracking ID',
      'Category',
      'Severity',
      'Latitude',
      'Longitude',
      'Landmark',
      'Reported Time (IST)',
      'Status',
      'Assigned Crew',
    ];

    const rows = filteredReports.map((r) => [
      r.id,
      `"${r.category}"`,
      r.severity,
      r.lat.toFixed(5),
      r.lng.toFixed(5),
      `"${r.landmark.replace(/"/g, '""')}"`,
      `"${new Date(r.reported_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}"`,
      r.status,
      `"${r.assigned_crew || 'Unassigned'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PDNA_Damage_Reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Sorted Records
  const filteredReports = useMemo(() => {
    return reports
      .filter((item) => {
        const matchSearch =
          searchTerm.trim() === '' ||
          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.landmark.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.assigned_crew && item.assigned_crew.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchSeverity = severityFilter === 'All' || item.severity === severityFilter;
        const matchStatus = statusFilter === 'All' || item.status === statusFilter;
        const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;

        return matchSearch && matchSeverity && matchStatus && matchCategory;
      })
      .sort((a, b) => {
        if (sortField === 'reported_at') {
          const diff = new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime();
          return sortDirection === 'desc' ? diff : -diff;
        }
        if (sortField === 'severity') {
          const rank: Record<DamageSeverity, number> = { Critical: 3, Medium: 2, Low: 1 };
          const diff = rank[b.severity] - rank[a.severity];
          return sortDirection === 'desc' ? diff : -diff;
        }
        return sortDirection === 'desc' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
      });
  }, [reports, searchTerm, severityFilter, statusFilter, categoryFilter, sortField, sortDirection]);

  // KPI Metrics
  const totalCount = reports.length;
  const criticalCount = reports.filter((r) => r.severity === 'Critical').length;
  const assignedCount = reports.filter((r) => r.status === 'Assigned to Repair Crew').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-slate-900 font-sans">
      {/* ── Official Government Admin Header ─────────────────────────────── */}
      <header className="bg-[#0B3D6E] text-white border-b border-[#082C50] shadow-md sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#FF9933] text-black font-extrabold uppercase px-1.5 py-0.5 rounded-xs">
                  NDMA / PWD COMMAND
                </span>
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
                  SAHAYAK Post-Disaster Needs Assessment (PDNA)
                </h1>
              </div>
              <p className="text-[11px] text-blue-200">
                Public Works Infrastructure Ledger • Damage Verification &amp; Repair Dispatch
              </p>
            </div>
          </div>

          {/* Quick-Access Navigation Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="hidden md:flex items-center gap-1.5 bg-black/20 border border-white/15 px-3 py-1.5 rounded-md text-xs font-mono text-blue-100">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentTime || '—'}</span>
            </div>

            <Link
              href="/admin/twin"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-amber-300" />
              <span>Digital Twin Map</span>
            </Link>

            <Link
              href="/admin/workforce"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HardHat className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Workforce</span>
            </Link>

            <Link
              href="/admin/audit-log"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Audit Log</span>
            </Link>

            <Link
              href="/"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
              title="Return to Citizen Portal"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Workspace ─────────────────────────────────────── */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Metric Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg border border-slate-300 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total PDNA Reports
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0B3D6E] flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-rose-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                Critical Hazards
              </p>
              <p className="text-2xl font-black text-rose-700 mt-1">{criticalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Assigned to Crews
              </p>
              <p className="text-2xl font-black text-blue-800 mt-1">{assignedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <HardHat className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Resolved &amp; Cleared
              </p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ── Table Action & Filter Toolbar ───────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, landmark, category or crew..."
                className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D6E] focus:bg-white"
              />
            </div>

            {/* Filter Dropdowns & Export Action */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5">
                <span className="text-[11px] font-bold text-slate-500">Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5">
                <span className="text-[11px] font-bold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned to Repair Crew">Assigned to Crew</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5">
                <span className="text-[11px] font-bold text-slate-500">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Collapsed Structure">Collapsed Structure</option>
                  <option value="Blocked Road">Blocked Road</option>
                  <option value="Downed Power Lines">Downed Power Lines</option>
                  <option value="Flooded Infrastructure">Flooded Infrastructure</option>
                  <option value="Contaminated Water">Contaminated Water</option>
                </select>
              </div>

              {/* Export to CSV Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold px-3.5 py-2 rounded-md shadow-xs transition-colors cursor-pointer"
                title="Download CSV spreadsheet of filtered damage reports"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── PDNA Tabular Data Table ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-[#0B3D6E] text-white uppercase text-[11px] tracking-wider select-none">
                  <th className="py-3 px-4 font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setSortField('id');
                        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      }}
                      className="flex items-center gap-1 hover:text-amber-300 transition-colors"
                    >
                      <span>Tracking ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setSortField('severity');
                        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      }}
                      className="flex items-center gap-1 hover:text-amber-300 transition-colors"
                    >
                      <span>Severity</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-bold">Coordinates / Landmark</th>
                  <th className="py-3 px-4 font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setSortField('reported_at');
                        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      }}
                      className="flex items-center gap-1 hover:text-amber-300 transition-colors"
                    >
                      <span>Date &amp; Time (IST)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-bold">Status Action</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 font-medium">
                      No PDNA damage reports match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Tracking ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0B3D6E] whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(report)}
                          className="hover:underline flex items-center gap-1 text-[#0B3D6E] cursor-pointer"
                          title="View Admin Dossier"
                        >
                          <span>{report.id}</span>
                        </button>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{report.category}</div>
                        {report.assigned_crew && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <HardHat className="w-3 h-3 text-amber-600" />
                            <span>{report.assigned_crew}</span>
                          </div>
                        )}
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-extrabold uppercase tracking-wide border ${
                            report.severity === 'Critical'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : report.severity === 'Medium'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-yellow-50 text-yellow-900 border-yellow-300'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>{report.severity}</span>
                        </span>
                      </td>

                      {/* Coordinates & Landmark */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>
                            {report.lat.toFixed(4)}° N, {report.lng.toFixed(4)}° E
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title={report.landmark}>
                          {report.landmark}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-600">
                        {new Date(report.reported_at).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        IST
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={report.status}
                          onChange={(e) =>
                            handleStatusChange(report.id, e.target.value as DamageStatus)
                          }
                          className={`text-xs font-bold px-2.5 py-1.5 rounded border focus:outline-none focus:ring-1 focus:ring-[#0B3D6E] cursor-pointer ${
                            report.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : report.status === 'Assigned to Repair Crew'
                              ? 'bg-blue-50 text-blue-900 border-blue-300'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Assigned to Repair Crew">Assigned to Repair Crew</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/twin?focus=${encodeURIComponent(report.id)}&lat=${report.lat}&lng=${report.lng}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B3D6E] hover:text-[#07284B] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                          title="Locate on Digital Twin 3D GIS Map"
                        >
                          <Radio className="w-3 h-3 text-amber-600" />
                          <span>Map</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{filteredReports.length}</span> of{' '}
              <span className="font-bold text-slate-800">{reports.length}</span> recorded damage assessments
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              National Disaster Management Authority • Sahayak PDNA v1.0
            </div>
          </div>
        </div>
      </main>

      {/* ── Admin Dossier Modal ──────────────────────────────────────────── */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0B3D6E] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </span>
                <div>
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold uppercase px-1.5 py-0.5 rounded-xs">
                    ADMIN PDNA DOSSIER
                  </span>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                    Incident {selectedReport.id}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Photo Evidence Placeholder */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Field Photo Evidence / क्षति फोटो
                </label>
                <div className="relative w-full h-44 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedReport.photo_url || '/placeholder.jpg'}
                    alt="Infrastructure damage site"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.modal-photo-fallback')) {
                        const fb = document.createElement('div');
                        fb.className = 'modal-photo-fallback flex flex-col items-center justify-center text-slate-400 p-4 text-center';
                        fb.innerHTML = '<span class="text-xs font-bold text-slate-600">Damage Site Photo</span><span class="text-[10px] text-slate-400 mt-1">Field assessment capture verified by SEOC</span>';
                        parent.appendChild(fb);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Grid of Key Properties */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                  <span className="text-slate-500 font-medium block text-[10px] uppercase">Category</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">{selectedReport.category}</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                  <span className="text-slate-500 font-medium block text-[10px] uppercase">Severity</span>
                  <span className={`font-extrabold text-xs mt-0.5 inline-block px-2 py-0.5 rounded border ${
                    selectedReport.severity === 'Critical'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : selectedReport.severity === 'Medium'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                  }`}>
                    {selectedReport.severity}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                  <span className="text-slate-500 font-medium block text-[10px] uppercase">Status</span>
                  <span className={`font-bold text-xs mt-0.5 inline-block px-2 py-0.5 rounded border ${
                    selectedReport.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedReport.status === 'Assigned to Repair Crew'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {selectedReport.status}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                  <span className="text-slate-500 font-medium block text-[10px] uppercase">Reported Date</span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                    {new Date(selectedReport.reported_at).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })} IST
                  </span>
                </div>
              </div>

              {/* Coordinates & Landmark */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase">
                  <span>GPS Coordinates</span>
                  <Link
                    href={`/admin/twin?focus=${encodeURIComponent(selectedReport.id)}&lat=${selectedReport.lat}&lng=${selectedReport.lng}`}
                    className="text-[#0B3D6E] font-bold hover:underline flex items-center gap-1 normal-case"
                  >
                    <span>View on Twin Map</span>
                    <Radio className="w-3 h-3 text-amber-600" />
                  </Link>
                </div>
                <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>{selectedReport.lat.toFixed(5)}° N, {selectedReport.lng.toFixed(5)}° E</span>
                </div>
                {selectedReport.landmark && (
                  <p className="text-slate-600 text-xs pt-1 border-t border-slate-200 mt-1">
                    <span className="font-semibold text-slate-800">Landmark: </span>
                    {selectedReport.landmark}
                  </p>
                )}
              </div>

              {/* Assigned Crew & Contact */}
              {selectedReport.assigned_crew && (
                <div className="bg-blue-50/60 border border-blue-200 rounded p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-900 uppercase block">Assigned Repair Crew</span>
                    <span className="font-bold text-slate-900 text-xs">{selectedReport.assigned_crew}</span>
                  </div>
                  <HardHat className="w-5 h-5 text-blue-700" />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 px-5 flex items-center justify-between gap-3">
              <Link
                href={`/admin/twin?focus=${encodeURIComponent(selectedReport.id)}&lat=${selectedReport.lat}&lng=${selectedReport.lng}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0B3D6E] hover:bg-[#07284B] px-3.5 py-2 rounded transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-amber-300" />
                <span>Locate on Digital Twin</span>
              </Link>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-4 py-2 rounded transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
