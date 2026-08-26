import React, { useMemo, useState } from 'react';
import {
  useTable,
  createCoreRowModel,
  createExpandedRowModel,
  createSortedRowModel,
  flexRender,
  SortingState
} from '@tanstack/react-table';
import { useAuditLogStore } from './useAuditLogStore';
import { Ticket } from './types';
import { TicketDetailPanel } from './TicketDetailPanel';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight, Undo2 } from 'lucide-react';

export const AuditLogTable: React.FC = () => {
  const { tickets, filters, openRevertModal } = useAuditLogStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Dark Mode Status Badge Component
  const StatusBadge = ({ status }: { status: Ticket['status'] }) => {
    switch (status) {
      case 'proceeded':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 capitalize">{status.replace('_', ' ')}</span>;
      case 'given':
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 capitalize">{status.replace('_', ' ')}</span>;
      case 'reverted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700 capitalize">{status.replace('_', ' ')}</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 capitalize">{(status as string).replace('_', ' ')}</span>;
    }
  };

  const columns = useMemo<any[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: (info: any) => {
          const isExpanded = expandedRows[info.row.id];
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedRows(prev => ({ ...prev, [info.row.id]: !prev[info.row.id] }));
              }}
              style={{ cursor: 'pointer' }}
              className="text-slate-400 hover:text-slate-600"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          );
        },
      },
      {
        accessorKey: 'order_name',
        header: 'Order Name & Source',
        cell: (info: any) => (
          <div>
            <div className="font-semibold text-slate-800">{info.getValue()}</div>
            <div className="text-xs text-slate-500 capitalize mt-1">Source: {info.row.original.source.replace('_', ' ')}</div>
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Timestamp',
        cell: (info: any) => (
          <span className="text-sm text-slate-600 whitespace-nowrap">
            {new Date(info.getValue()).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: (info: any) => <span className="text-sm text-slate-700">{info.getValue()}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info: any) => <StatusBadge status={info.getValue()} />,
      },
      {
        accessorKey: 'issued_by',
        header: 'Issued By',
        cell: (info: any) => <span className="text-sm text-slate-700">{info.getValue()}</span>,
      },
      {
        accessorKey: 'executed_by',
        header: 'Executed By',
        cell: (info: any) => <span className="text-sm text-slate-700">{info.getValue()}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info: any) => {
          const ticket = info.row.original;
          const isRevertible = ticket.status === 'given' || ticket.status === 'in_progress';
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isRevertible) openRevertModal(ticket);
              }}
              disabled={!isRevertible}
              className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium transition-colors ${
                isRevertible 
                  ? 'text-blue-600 hover:text-blue-800' 
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Revert &rarr;</span>
            </button>
          );
        },
      },
    ],
    [openRevertModal]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const searchMatch = !filters.search || 
        ticket.order_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        ticket.id.toLowerCase().includes(filters.search.toLowerCase());
      
      const deptMatch = filters.department === 'all' || ticket.department === filters.department;
      const typeMatch = filters.type === 'all' || ticket.type === filters.type;
      const statusMatch = filters.status === 'all' || ticket.status === filters.status;
      
      return searchMatch && deptMatch && typeMatch && statusMatch;
    });
  }, [tickets, filters]);

  const ReactTableHook = (useTable as any);
  
  const table = ReactTableHook({
    data: filteredTickets,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: (createCoreRowModel as any)(),
    getSortedRowModel: (createSortedRowModel as any)(),
    getExpandedRowModel: (createExpandedRowModel as any)(),
    getRowCanExpand: () => true,
  });

  const isLoading = tickets.length === 0;

  return (
    <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-md shadow-sm">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-[#1f2f46]">
              {table.getHeaderGroups().map((headerGroup: any) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800"
                    >
                      <div 
                        className={`flex items-center space-x-1 ${header.column.getCanSort?.() ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                        onClick={header.column.getCanSort?.() && header.column.getToggleSortingHandler ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {header.column.getCanSort?.() && (
                          <span className="text-slate-500">
                            {{
                              asc: <ArrowUp className="w-3 h-3 ml-1" />,
                              desc: <ArrowDown className="w-3 h-3 ml-1" />,
                            }[header.column.getIsSorted?.() as string] ?? <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" />}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-4"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-100 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-5 bg-slate-200 rounded-full w-20"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right"><div className="h-8 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-500">
                    No tickets found matching the criteria.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row: any) => (
                  <React.Fragment key={row.id}>
                    <tr 
                      className={`hover:bg-slate-50 transition-colors ${expandedRows[row.id] ? 'bg-slate-50' : ''}`}
                      onClick={() => setExpandedRows(prev => ({ ...prev, [row.id]: !prev[row.id] }))}
                    >
                      {(row.getVisibleCells?.() ?? row.getAllCells()).map((cell: any) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {expandedRows[row.id] && (
                      <tr>
                        <td colSpan={(row.getVisibleCells?.() ?? row.getAllCells()).length} className="p-0 border-b border-slate-200 bg-slate-50/50">
                          <TicketDetailPanel ticket={row.original} />
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
    </div>
  );
};
