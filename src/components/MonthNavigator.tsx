import React from 'react';
import type { MonthKey } from '../types/finance';
import { monthLabel, shiftMonth, currentMonthKey } from '../lib/period';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface Props {
  monthKey: MonthKey;
  availableMonths: MonthKey[];
  onChange: (m: MonthKey) => void;
}

export const MonthNavigator: React.FC<Props> = ({ monthKey, onChange }) => {
  const hoje = currentMonthKey();
  const isCurrent = monthKey === hoje;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(shiftMonth(monthKey, -1))}
        title="Mês anterior"
        className="w-9 h-9 rounded-2xl border border-white/10 bg-[#16161e] hover:bg-white/10 text-zinc-300 flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#16161e] border border-white/10">
        <CalendarDays className="w-4 h-4 text-[#ccff00] shrink-0" />
        <h2 className="text-sm sm:text-base font-extrabold text-white capitalize tracking-tight">
          {monthLabel(monthKey)}
        </h2>
        {isCurrent && (
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 px-2 py-0.5 rounded-full shrink-0">
            Atual
          </span>
        )}
      </div>

      <button
        onClick={() => onChange(shiftMonth(monthKey, 1))}
        title="Próximo mês"
        className="w-9 h-9 rounded-2xl border border-white/10 bg-[#16161e] hover:bg-white/10 text-zinc-300 flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrent && (
        <button
          onClick={() => onChange(hoje)}
          className="text-xs px-3 py-1.5 rounded-2xl border border-[#ccff00]/40 bg-[#ccff00]/10 text-[#ccff00] font-bold cursor-pointer shrink-0 hover:bg-[#ccff00]/20 transition-all"
        >
          Voltar a Hoje
        </button>
      )}
    </div>
  );
};
