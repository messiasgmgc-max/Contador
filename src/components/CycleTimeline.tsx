import React from 'react';
import type { WeekNumber } from '../types/finance';
import { Calendar, ArrowDownCircle, ArrowUpCircle, CheckCircle2 } from 'lucide-react';

interface WeekData {
  week: WeekNumber;
  hasIncome: boolean;
  totalIncome: number;
  receivedIncome: number;
  totalDebts: number;
  totalExpenses: number;
  totalOutgoing: number;
  balance: number;
}

interface CycleTimelineProps {
  weeks: WeekData[];
  currentWeek: WeekNumber;
  onSelectWeek: (week: WeekNumber) => void;
  selectedWeek: WeekNumber | 'ALL';
}

export const CycleTimeline: React.FC<CycleTimelineProps> = ({
  weeks,
  currentWeek,
  onSelectWeek,
  selectedWeek,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Visão Semanal</span>
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            Toque em uma semana para filtrar todas as despesas e receitas.
          </p>
        </div>

        {selectedWeek !== 'ALL' && (
          <button
            onClick={() => onSelectWeek(selectedWeek)}
            className="text-xs px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold cursor-pointer shadow-xs active:bg-blue-100"
          >
            Ver Todas
          </button>
        )}
      </div>

      {/* Grid das Semanas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {weeks.map((w) => {
          const isCurrent = w.week === currentWeek;
          const isSelected = selectedWeek === w.week;
          const isPositive = w.balance >= 0;

          return (
            <div
              key={w.week}
              onClick={() => onSelectWeek(w.week)}
              className={`rounded-2xl p-3.5 sm:p-5 border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs hover:shadow'
              }`}
            >
              {/* Badge Semana Atual */}
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    Semana {w.week}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] sm:text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.2 rounded-full">
                      Atual
                    </span>
                  )}
                </div>

                {w.totalIncome > 0 && (
                  <span className="text-[9px] sm:text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Recebe
                  </span>
                )}
              </div>

              {/* Valores da Semana */}
              <div className="space-y-1.5 sm:space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ArrowUpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                    <span className="hidden sm:inline">Entradas:</span>
                  </span>
                  <span className="font-bold text-slate-900">
                    R$ {w.totalIncome.toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ArrowDownCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 shrink-0" />
                    <span className="hidden sm:inline">Saídas:</span>
                  </span>
                  <span className="font-semibold text-rose-600">
                    - R$ {w.totalOutgoing.toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-600">Saldo:</span>
                  <span className={`text-xs sm:text-sm font-extrabold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? '+' : ''} R$ {w.balance.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
