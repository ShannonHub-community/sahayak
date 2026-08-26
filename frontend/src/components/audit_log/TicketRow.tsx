import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import { Ticket } from './types';

interface TicketRowProps {
  row: any;
  onRevertClick: (ticket: Ticket) => void;
}

export const TicketRow: React.FC<TicketRowProps> = ({ row, onRevertClick }) => {
  const ticket = row.original;
  
  // Revert is only allowed when status is 'given' or 'in_progress'
  const canRevert = ticket.status === 'given' || ticket.status === 'in_progress';

  return (
    <tr className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${row.getIsExpanded() ? 'bg-blue-50/30' : ''}`}>
      {row.getVisibleCells().map((cell: any) => {
        // We might want to render specific actions in the last column
        if (cell.column.id === 'actions') {
          return (
            <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex justify-end items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canRevert) {
                      onRevertClick(ticket);
                    }
                  }}
                  disabled={!canRevert}
                  className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm ${
                    canRevert 
                      ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500' 
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                  title={canRevert ? 'Revert Order' : 'Cannot revert this order'}
                >
                  <Undo2 className="w-3 h-3 mr-1" /> Revert
                </button>
                <button
                  onClick={row.getToggleExpandedHandler()}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {row.getIsExpanded() ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
            </td>
          );
        }

        return (
          <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
};
