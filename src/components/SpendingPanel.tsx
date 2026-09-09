import React from 'react';
import type { ExpenseCategory } from '../types/finance';
import { formatBRL, cycleWeekOf, todayISO, formatBR } from '../lib/period';
import { CalendarClock, CalendarRange, CalendarDays } from 'lucide-react';
import { CATEGORY_LABEL, CATEGORY_COLOR } from './expenseCategories';

/**
 * Controle de gasto diário, semanal e mensal — junto com a quebra por
 * categoria. Era o que faltava para saber quanto já foi embora hoje.
 *
 * Os três números são sempre relativos à data REAL de hoje, não ao mês que
 * estiver selecionado na tela: "quanto gastei hoje" não muda quando você navega
 * para dezembro. A quebra por categoria, sim, é do mês selecionado.
 */

interface Props {
  spending: { hoje: number; semana: number; mes: number };
  byCategory: { category: string; total: number }[];
  monthLabelText: string;
}

export const SpendingPanel: React.FC<Props> = ({ spending, byCategory, monthLabelText }) => {
  const hoje = todayISO();
  const semanaAtual = cycleWeekOf(hoje);
  const maior = byCategory[0]?.total ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Diário / semanal / mensal */}
      <div className="lg:col-span-2 grid grid-cols-3 gap-3 sm:gap-4">
        <Tile
          icon={<CalendarClock className="w-4 h-4 text-rose-600" />}
          label="Hoje"
          sub={formatBR(hoje)}
          value={spending.hoje}
        />
        <Tile
          icon={<CalendarRange className="w-4 h-4 text-amber-600" />}
          label="Esta semana"
          sub={`semana ${semanaAtual} do mês`}
          value={spending.semana}
        />
        <Tile
          icon={<CalendarDays className="w-4 h-4 text-blue-600" />}
          label="Este mês"
          sub="acumulado"
          value={spending.mes}
        />
      </div>

      {/* Por categoria */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Por categoria
          </span>
          <span className="text-[10px] text-slate-400 capitalize truncate">{monthLabelText}</span>
        </div>

        {byCategory.length === 0 && (
          <p className="text-xs text-slate-400 py-4 text-center">Nenhum gasto neste mês.</p>
        )}

        <div className="space-y-2">
          {byCategory.map(({ category, total }) => (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium truncate">
                  {CATEGORY_LABEL[category as ExpenseCategory] ?? category}
                </span>
                <span className="font-bold text-slate-900 shrink-0 ml-2">{formatBRL(total)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${CATEGORY_COLOR[category as ExpenseCategory] ?? 'bg-slate-400'}`}
                  style={{ width: maior > 0 ? `${Math.max(4, (total / maior) * 100)}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Tile: React.FC<{ icon: React.ReactNode; label: string; sub: string; value: number }> = ({
  icon, label, sub, value,
}) => (
  <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-3 sm:p-5 space-y-1">
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
        {label}
      </span>
    </div>
    <div className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight truncate">
      {formatBRL(value)}
    </div>
    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{sub}</p>
  </div>
);
