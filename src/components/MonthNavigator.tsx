import React from 'react';
import type { MonthKey } from '../types/finance';
import { monthLabel, monthLabelShort, shiftMonth, currentMonthKey } from '../lib/period';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

/**
 * Navegação por mês. Sem isto o app soma janeiro com março na mesma "semana 1",
 * que era o comportamento da v1.
 */

interface Props {
  monthKey: MonthKey;
  availableMonths: MonthKey[];
  onChange: (m: MonthKey) => void;
}

export const MonthNavigator: React.FC<Props> = ({ monthKey, availableMonths, onChange }) => {
  const hoje = currentMonthKey();
  const isCurrent = monthKey === hoje;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(shiftMonth(monthKey, -1))}
          title="Mês anterior"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="min-w-0 px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
            <h2 className="text-base sm:text-xl font-bold text-slate-900 capitalize truncate">
              {monthLabel(monthKey)}
            </h2>
            {isCurrent && (
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                mês atual
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onChange(shiftMonth(monthKey, 1))}
          title="Próximo mês"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {!isCurrent && (
          <button
            onClick={() => onChange(hoje)}
            className="text-xs px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold cursor-pointer shrink-0"
          >
            Hoje
          </button>
        )}
      </div>

      {availableMonths.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {availableMonths.map((m) => (
            <button
              key={m}
              onClick={() => onChange(m)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                m === monthKey
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {monthLabelShort(m)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
