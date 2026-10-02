import React from 'react';
import type { CycleWeek } from '../types/finance';
import { Repeat, Calendar } from 'lucide-react';

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
  enabled, onToggle, weeks, onToggleWeek, months, onChangeMonths,
}) => {
  const active = (on: boolean) => {
    if (!on) return 'bg-[#181822] border-white/10 text-zinc-400 hover:text-white hover:border-white/20';
    return 'bg-[#ccff00] border-[#ccff00] text-black font-black shadow-[0_0_12px_rgba(204,255,0,0.3)]';
  };

  const total = weeks.length * Math.max(1, months);

  return (
    <div className="p-4 rounded-2xl border border-white/10 bg-[#16161f] space-y-3">
      <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-zinc-200 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#ccff00] focus:ring-[#ccff00]"
        />
        <span className="flex items-center gap-1.5">
          <Repeat className="w-3.5 h-3.5 text-[#ccff00]" />
          Repetir em semanas do mês (Multi-frequência)
        </span>
      </label>

      {enabled && (
        <div className="pt-3 border-t border-white/5 space-y-3">
          <div className="bg-[#111116] p-3 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Em quais semanas?
              </span>
              <span className="text-[11px] font-mono text-[#ccff00] shrink-0">
                {weeks.length}x por mês
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {([1, 2, 3, 4] as CycleWeek[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onToggleWeek(w)}
                  className={'py-2.5 px-1 rounded-xl text-xs border transition-all cursor-pointer flex flex-col items-center gap-0.5 ' + active(weeks.includes(w))}
                >
                  <span className="font-bold">Sem. {w}</span>
                  <span className="text-[10px] opacity-75 font-mono">
                    {w === 4 ? 'dia 22+' : `dias ${(w - 1) * 7 + 1}-${w * 7}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 block">
              Repetir por quantos meses?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MONTH_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeMonths(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    months === m
                      ? 'bg-white/15 border-white text-white'
                      : 'bg-[#181822] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {m === 1 ? '1 mês' : `${m} meses`}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              Total de {total} lançamento{total > 1 ? 's' : ''} gerados automaticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
