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
  // "Semana atual" só faz sentido quando você está olhando o mês corrente.
  const currentWeek = monthKey === currentMonthKey() ? cycleWeekOf(todayISO()) : null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
            <span>Semanas do mês</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500">
            A semana sai da data do lançamento. Toque para filtrar.
          </p>
        </div>

        {selectedWeek !== 'ALL' && (
          <button
            onClick={() => onSelectWeek(selectedWeek)}
            className="text-xs px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold cursor-pointer shrink-0"
          >
            Ver todas
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
              className={`text-left rounded-2xl p-3 sm:p-4 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              } ${vazia ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-900">Semana {w.week}</span>
                  <span className="block text-[10px] text-slate-400">dias {w.range}</span>
                </div>
                {isCurrent && (
                  <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    atual
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <Row
                  icon={<ArrowUpCircle className="w-3 h-3 text-emerald-600 shrink-0" />}
                  value={formatBRL(w.incomePlanned)}
                  cls="text-slate-900"
                />
                <Row
                  icon={<ArrowDownCircle className="w-3 h-3 text-rose-600 shrink-0" />}
                  value={`− ${formatBRL(w.outgoing)}`}
                  cls="text-rose-600"
                />
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0">Saldo</span>
                  <span className={`text-xs font-extrabold truncate ${positivo ? 'text-emerald-600' : 'text-rose-600'}`}>
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
    {icon}
    <span className={`font-bold truncate ${cls}`}>{value}</span>
  </div>
);
