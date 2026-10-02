import React from 'react';
import type { WeekSummary, WeekNumber, MonthKey } from '../types/finance';
import { formatBRL, cycleWeekOf, todayISO, currentMonthKey } from '../lib/period';
import { Calendar, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface Props {
  weeks: WeekSummary[];
  monthKey: MonthKey;
  selectedWeek: WeekNumber | 'ALL';
  onSelectWeek: (w: WeekNumber) => void;
}

export const CycleTimeline: React.FC<Props> = ({ weeks, monthKey, selectedWeek, onSelectWeek }) => {
  const currentWeek = monthKey === currentMonthKey() ? cycleWeekOf(todayISO()) : null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#ccff00] shrink-0" />
            <span>Semanas do Mês</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500">
            A semana é calculada automaticamente da data. Toque para filtrar.
          </p>
        </div>

        {selectedWeek !== 'ALL' && (
          <button
            onClick={() => onSelectWeek(selectedWeek)}
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold cursor-pointer shrink-0 transition-all"
          >
            Ver todas as semanas
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {weeks.map((w) => {
          const isCurrent = w.week === currentWeek;
          const isSelected = selectedWeek === w.week;
          const vazia = w.incomePlanned === 0 && w.outgoing === 0;
          const positivo = w.balancePlanned >= 0;

          return (
            <button
              key={w.week}
              onClick={() => onSelectWeek(w.week)}
              className={`text-left rounded-3xl p-3.5 sm:p-4.5 border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-[#ccff00] bg-[#1a1a24] shadow-[0_0_15px_rgba(204,255,0,0.12)] ring-1 ring-[#ccff00]'
                  : 'bg-[#14141b] border-white/5 hover:border-white/15'
              } ${vazia ? 'opacity-40 hover:opacity-80' : ''}`}
            >
              {/* Glow sutil na semana atual */}
              {isCurrent && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ccff00]/10 rounded-full blur-xl pointer-events-none" />
              )}

              <div className="flex items-center justify-between gap-1 mb-2.5">
                <div className="min-w-0">
                  <span className="text-sm font-extrabold text-white">Semana {w.week}</span>
                  <span className="block text-[10px] text-zinc-500 font-mono">dias {w.range}</span>
                </div>
                {isCurrent && (
                  <span className="text-[9px] bg-[#ccff00] text-black font-black px-2 py-0.5 rounded-full shrink-0 tracking-wider uppercase">
                    Atual
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <Row
                  icon={<ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  value={formatBRL(w.incomePlanned)}
                  cls="text-zinc-200"
                />
                <Row
                  icon={<ArrowDownCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                  value={`− ${formatBRL(w.outgoing)}`}
                  cls="text-rose-400"
                />
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider shrink-0">Saldo</span>
                  <span className={`text-xs font-black truncate ${positivo ? 'text-[#ccff00]' : 'text-rose-400'}`}>
                    {formatBRL(w.balancePlanned)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Row: React.FC<{ icon: React.ReactNode; value: string; cls: string }> = ({ icon, value, cls }) => (
  <div className="flex items-center justify-between gap-1 text-[11px]">
    <div className="flex items-center gap-1">
      {icon}
    </div>
    <span className={`font-mono font-bold truncate ${cls}`}>{value}</span>
  </div>
);
