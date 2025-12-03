// TradesList.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Edit2, Trash2, TrendingUp, TrendingDown, Eye, Copy, X } from 'lucide-react';
import { Database } from '../../lib/database.types';

type Trade = Database['public']['Tables']['trades']['Row'];
type Account = Database['public']['Tables']['accounts']['Row'];

interface TradesListProps {
  trades: Trade[];
  accounts: Account[];
  onEdit: (trade: Trade) => void;
  onDelete: (tradeId: string) => void;
}

type PopoverPos = {
  top: number;
  left: number;
  placement: 'right' | 'left';
};

export default function TradesList({ trades, accounts, onEdit, onDelete }: TradesListProps) {
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [closingNoteId, setClosingNoteId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPos | null>(null);

  // refs
  const tdRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const closeTimers = useRef<Record<string, number | null>>({});
  const POPOVER_WIDTH = 320; // w-80
  const POPOVER_MARGIN = 8;
  const CLOSE_DELAY = 100; // ms debounce for closing
  const ANIM_DURATION = 150; // ms animation duration

  // helpers
  const getAccountName = (accountId: string) =>
    accounts.find(a => a.id === accountId)?.name || 'Unknown';

  const formatCurrency = (value: number | null) =>
    value === null
      ? '-'
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(value);

  const formatDate = (dateString: string | null) =>
    !dateString
      ? '-'
      : new Date(dateString).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

  const copyToClipboard = async (text: string | null | undefined) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  // compute popover position for given td
  const computePopoverPosition = (tradeId: string) => {
    const td = tdRefs.current[tradeId];
    if (!td) {
      setPopoverPos(null);
      return;
    }
    const rect = td.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right + POPOVER_MARGIN;
    let placement: PopoverPos['placement'] = 'right';

    if (left + POPOVER_WIDTH > vw - POPOVER_MARGIN) {
      left = rect.left - POPOVER_WIDTH - POPOVER_MARGIN;
      placement = 'left';
    }

    // top aligned roughly to td top; clamp
    const approxHeight = 220;
    let top = rect.top;
    if (top + approxHeight > vh - POPOVER_MARGIN) {
      top = Math.max(POPOVER_MARGIN, vh - approxHeight - POPOVER_MARGIN);
    }

    setPopoverPos({ top: Math.max(POPOVER_MARGIN, top), left: Math.max(POPOVER_MARGIN, left), placement });
  };

  // open popover (cancel any close timers)
  const openPopover = (tradeId: string) => {
    const t = closeTimers.current[tradeId];
    if (t) {
      window.clearTimeout(t);
      closeTimers.current[tradeId] = null;
    }
    setClosingNoteId(null);
    setOpenNoteId(tradeId);
    computePopoverPosition(tradeId);
  };

  // schedule close with debounce + start exit animation
  const scheduleClosePopover = (tradeId: string) => {
    const existing = closeTimers.current[tradeId];
    if (existing) window.clearTimeout(existing);

    setClosingNoteId(tradeId);

    closeTimers.current[tradeId] = window.setTimeout(() => {
      setTimeout(() => {
        setOpenNoteId((prev) => (prev === tradeId ? null : prev));
        setClosingNoteId((prev) => (prev === tradeId ? null : prev));
      }, ANIM_DURATION);
      closeTimers.current[tradeId] = null;
    }, CLOSE_DELAY);
  };

  // cancel scheduled close (on re-enter)
  const cancelScheduledClose = (tradeId: string) => {
    const t = closeTimers.current[tradeId];
    if (t) {
      window.clearTimeout(t);
      closeTimers.current[tradeId] = null;
    }
    setClosingNoteId(null);
  };

  useEffect(() => {
    return () => {
      Object.values(closeTimers.current).forEach((t) => {
        if (t) window.clearTimeout(t);
      });
    };
  }, []);

  // recompute popover pos on resize/scroll when open
  useEffect(() => {
    if (!openNoteId) {
      setPopoverPos(null);
      return;
    }
    const handler = () => {
      if (openNoteId) computePopoverPosition(openNoteId);
    };
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [openNoteId]);

  // render portal popover
  const renderPopoverPortal = (trade: Trade, note: string) => {
    if (!openNoteId || !popoverPos) return null;
    if (openNoteId !== String(trade.id) && closingNoteId !== String(trade.id)) return null;

    const isClosing = closingNoteId === String(trade.id);
    const style: React.CSSProperties = {
      position: 'fixed',
      top: popoverPos.top,
      left: popoverPos.left,
      width: POPOVER_WIDTH,
      zIndex: 9999,
    };

    const popoverStyle: React.CSSProperties = {
      transition: `opacity ${ANIM_DURATION}ms ease, transform ${ANIM_DURATION}ms ease`,
      opacity: isClosing ? 0 : 1,
      transform: isClosing ? 'translateY(6px) scale(.995)' : 'translateY(0) scale(1)',
    };

    const popover = (
      <div
        id={`note-popover-${trade.id}`}
        role="dialog"
        aria-label="Trade notes"
        onMouseEnter={() => {
          cancelScheduledClose(String(trade.id));
          openPopover(String(trade.id));
        }}
        onMouseLeave={() => {
          scheduleClosePopover(String(trade.id));
        }}
        style={style}
      >
        <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-3 text-sm text-slate-900 dark:text-white" style={popoverStyle}>
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes</div>
            <button
              type="button"
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => {
                setClosingNoteId(String(trade.id));
                setTimeout(() => {
                  setOpenNoteId((prev) => (prev === String(trade.id) ? null : prev));
                  setClosingNoteId((prev) => (prev === String(trade.id) ? null : prev));
                }, ANIM_DURATION);
              }}
              aria-label="Close notes"
            >
              <X className="w-3 h-3 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          <div className="mt-2 text-sm leading-relaxed max-h-40 overflow-auto whitespace-pre-wrap text-slate-700 dark:text-slate-200">
            {note}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(note)}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>
      </div>
    );

    return ReactDOM.createPortal(popover, document.body);
  };

  // Empty state
  if (trades.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-12 border border-slate-200 dark:border-slate-700 text-center">
        <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No trades yet</h3>
        <p className="text-slate-600 dark:text-slate-400">Start by adding your first trade</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Symbol</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Direction</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Quantity</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Entry</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Exit</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">P&L</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date</th>

              {/* Center the header for Notes */}
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Notes</th>

              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {trades.map((trade) => {
              const note = trade.notes ?? '';
              const hasNote = !!note.trim();

              return (
                <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-white">{trade.symbol}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{getAccountName(trade.account_id)}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{trade.instrument_type}</span>
                  </td>

                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trade.direction === 'long' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {trade.direction === 'long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {trade.direction}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right text-sm text-slate-900 dark:text-white">
                    {trade.quantity}
                    {trade.leverage && <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({trade.leverage}x)</span>}
                  </td>

                  <td className="px-4 py-4 text-right text-sm text-slate-900 dark:text-white">${trade.entry_price.toFixed(2)}</td>

                  <td className="px-4 py-4 text-right text-sm text-slate-900 dark:text-white">{trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}</td>

                  <td className="px-4 py-4 text-right">
                    <span className={`font-semibold ${(trade.profit_loss ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(trade.profit_loss)}
                    </span>
                    {trade.profit_loss_percent !== null && <div className="text-xs text-slate-500 dark:text-slate-400">{trade.profit_loss_percent.toFixed(2)}%</div>}
                  </td>

                  <td className="px-4 py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${trade.status === 'open' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {trade.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(trade.entry_timestamp)}</td>

                  {/* NOTES TD: centered content */}
                  <td
                    className="px-4 py-4 text-center relative"
                    ref={(el) => {
                      tdRefs.current[String(trade.id)] = el;
                    }}
                    onMouseEnter={() => {
                      if (hasNote) openPopover(String(trade.id));
                    }}
                    onMouseLeave={() => {
                      if (hasNote) scheduleClosePopover(String(trade.id));
                    }}
                  >
                    {hasNote ? (
                      <>
                        <button
                          className="inline-flex items-center justify-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="View notes"
                          aria-expanded={openNoteId === String(trade.id)}
                          onClick={() => {
                            if (openNoteId === String(trade.id)) {
                              // trigger close animation then unmount
                              setClosingNoteId(String(trade.id));
                              setTimeout(() => {
                                setOpenNoteId(null);
                                setClosingNoteId(null);
                              }, ANIM_DURATION);
                            } else {
                              openPopover(String(trade.id));
                            }
                          }}
                        >
                          <Eye className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>

                        {(openNoteId === String(trade.id) || closingNoteId === String(trade.id)) &&
                          renderPopoverPortal(trade, note)}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onEdit(trade)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(trade.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
