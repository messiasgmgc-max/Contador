import React from 'react';
import type { CycleWeek } from '../types/finance';
import { Repeat, Calendar } from 'lucide-react';

/**
 * Recorrência no formato que o caso real pede: "isso cai em quais semanas do
 * mês, e por quantos meses". É assim que se cadastra um recebimento 3x/mês e
 * outro 4x/mês sem digitar semana nenhuma na mão.
 */

interface Props {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  weeks: CycleWeek[];
  onToggleWeek: (w: CycleWeek) => void;
  months: number;
  onChangeMonths: (n: number) => void;
  accent?: 'blue' | 'rose' | 'emerald';
}

const MONTH_OPTIONS = [1, 3, 6, 12];

export const RecurrenceSelector: React.FC<Props> = ({
  enabled, onToggle, weeks, onToggleWeek, months, onChangeMonths, accent = 'blue',
}) => {
  const active = (on: boolean) => {
    if (!on) return 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50';
    if (accent === 'rose') return 'bg-rose-600 border-rose-600 text-white shadow-xs';
    if (accent === 'emerald') return 'bg-emerald-600 border-emerald-600 text-white shadow-xs';
    return 'bg-blue-600 border-blue-600 text-white shadow-xs';
  };

  const total = weeks.length * Math.max(1, months);

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white/80 space-y-3">
      <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300"
        />
        <span className="flex items-center gap-1.5">
          <Repeat className="w-3.5 h-3.5 text-slate-500" />
          Repetir em semanas do mês
        </span>
      </label>

      {enabled && (
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Em quais semanas?
              </span>
              <span className="text-[11px] text-slate-500 shrink-0">
                {weeks.length}x por mês
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {([1, 2, 3, 4] as CycleWeek[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onToggleWeek(w)}
                  className={'py-2 px-1 rounded-xl text-xs border transition-all cursor-pointer flex flex-col items-center gap-0.5 ' + active(weeks.includes(w))}
                >
                  <span className="font-bold">Sem. {w}</span>
                  <span className="text-[10px] opacity-80">
                    {w === 4 ? 'dia 22+' : `dia ${(w - 1) * 7 + 1}-${w * 7}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700">Por quantos meses?</span>
            <div className="flex flex-wrap gap-2">
              {MONTH_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChangeMonths(n)}
                  className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ' + active(months === n)}
                >
                  {n === 1 ? 'Só este mês' : `${n} meses`}
                </button>
              ))}
            </div>
          </div>

          {weeks.length === 0 ? (
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              Escolha pelo menos uma semana.
            </p>
          ) : (
            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              Serão criados <strong>{total} lançamentos</strong>: {weeks.length} por mês,
              {' '}durante {months === 1 ? '1 mês' : `${months} meses`}. A data exata de cada um
              sai do dia que você escolheu acima.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
