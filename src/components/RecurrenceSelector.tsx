import React from 'react';
import type { RecurrenceFrequency } from '../types/finance';
import { Repeat, Calendar } from 'lucide-react';

interface RecurrenceSelectorProps {
  isRecurring: boolean;
  onToggleRecurring: (recurring: boolean) => void;
  recurrence: RecurrenceFrequency;
  onChangeRecurrence: (freq: RecurrenceFrequency) => void;
  selectedWeeks: number[];
  onToggleWeek: (week: number) => void;
  accentColor?: 'blue' | 'rose' | 'emerald';
}

export const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
  isRecurring,
  onToggleRecurring,
  recurrence,
  onChangeRecurrence,
  selectedWeeks,
  onToggleWeek,
  accentColor = 'blue',
}) => {
  const getCheckboxBg = () => {
    switch (accentColor) {
      case 'rose': return 'text-rose-600 focus:ring-rose-500';
      case 'emerald': return 'text-emerald-600 focus:ring-emerald-500';
      default: return 'text-blue-600 focus:ring-blue-500';
    }
  };

  const getActiveTabStyle = (active: boolean) => {
    if (!active) return 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50';
    switch (accentColor) {
      case 'rose': return 'bg-rose-600 border-rose-600 text-white shadow-xs';
      case 'emerald': return 'bg-emerald-600 border-emerald-600 text-white shadow-xs';
      default: return 'bg-blue-600 border-blue-600 text-white shadow-xs';
    }
  };

  const getWeekButtonStyle = (active: boolean) => {
    if (!active) return 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
    switch (accentColor) {
      case 'rose': return 'bg-rose-600 border-rose-600 text-white font-bold shadow-xs scale-105';
      case 'emerald': return 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs scale-105';
      default: return 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs scale-105';
    }
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white/80 space-y-3">
      
      {/* Checkbox Ativar Recorrência */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onToggleRecurring(e.target.checked)}
            className={`w-4 h-4 rounded border-slate-300 ${getCheckboxBg()}`}
          />
          <span className="flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-slate-500" />
            Tornar Recorrente (Repetir todo mês ou em semanas específicas)
          </span>
        </label>
      </div>

      {isRecurring && (
        <div className="pt-2 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
          
          {/* Opções de Modo de Recorrência */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeRecurrence('monthly')}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ' + getActiveTabStyle(recurrence === 'monthly')}
            >
              📅 Todo Mês (Todas as 4 semanas)
            </button>

            <button
              type="button"
              onClick={() => onChangeRecurrence('custom_weeks')}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ' + getActiveTabStyle(recurrence === 'custom_weeks')}
            >
              🎯 Semanas Específicas
            </button>
          </div>

          {/* Seletor de Semanas Específicas */}
          {recurrence === 'custom_weeks' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Selecione as semanas em que haverá esse lançamento:
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedWeeks.length} semana(s)
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[1, 2, 3, 4].map((wk) => {
                  const isSelected = selectedWeeks.includes(wk);
                  return (
                    <button
                      key={wk}
                      type="button"
                      onClick={() => onToggleWeek(wk)}
                      className={'py-2 px-1 rounded-xl text-xs border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ' + getWeekButtonStyle(isSelected)}
                    >
                      <span className="font-bold">Sem. {wk}</span>
                      <span className="text-[10px] opacity-80">
                        {isSelected ? '✓ Ativa' : 'Desativada'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 italic mt-1">
                Exemplo: Você pode marcar apenas Sem. 1 e Sem. 3, ou as 3 primeiras semanas e a última não.
              </p>
            </div>
          )}

          {recurrence === 'monthly' && (
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              Será lançado em todas as 4 semanas do mês com o valor integral definido.
            </p>
          )}

        </div>
      )}

    </div>
  );
};
