import React from 'react';
import type { ExpenseCategory } from '../types/finance';
import { formatBRL, cycleWeekOf, todayISO, formatBR } from '../lib/period';
import { CalendarRange, CalendarDays, Flame, Activity } from 'lucide-react';
import { CATEGORY_LABEL } from './expenseCategories';

interface Props {
  spending: { hoje: number; semana: number; mes: number };
  byCategory: { category: string; total: number }[];
  monthLabelText: string;
}

export const SpendingPanel: React.FC<Props> = ({ spending, byCategory, monthLabelText }) => {
  const hoje = todayISO();
  const semanaAtual = cycleWeekOf(hoje);
  const totalMes = byCategory.reduce((acc, c) => acc + c.total, 0);

  // Calcular proporções circulares (como na imagem 3: anel de categorias 5 mil)
  const angles: { category: string; total: number; pct: number; strokeColor: string; dashOffset: number; dashArray: number }[] = [];
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12
  let currentOffset = 0;

  const colorPalette = ['#ff8a00', '#7928ca', '#0070f3', '#ccff00', '#ff0080', '#00dfd8'];

  byCategory.forEach((item, index) => {
    const pct = totalMes > 0 ? item.total / totalMes : 0;
    const dashLength = pct * circumference;
    angles.push({
      category: item.category,
      total: item.total,
      pct: Math.round(pct * 100),
      strokeColor: colorPalette[index % colorPalette.length],
      dashArray: dashLength,
      dashOffset: currentOffset,
    });
    currentOffset += dashLength;
  });

  // Heatmap GitHub / Pierre dots (imagem 2: matriz de gastos no mês)
  const daysInMonth = Array.from({ length: 28 }, (_, i) => {
    const intensity = (i * 7) % 5;
    return {
      day: i + 1,
      active: intensity > 2,
      isHigh: intensity === 4,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Coluna Esquerda: Tiles de Métricas de Gasto */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <SpendingTile
            icon={<Flame className="w-4 h-4 text-[#ccff00]" />}
            label="Hoje"
            sub={formatBR(hoje)}
            value={spending.hoje}
            highlight
          />
          <SpendingTile
            icon={<CalendarRange className="w-4 h-4 text-amber-400" />}
            label="Semana"
            sub={`Semana ${semanaAtual}`}
            value={spending.semana}
          />
          <SpendingTile
            icon={<CalendarDays className="w-4 h-4 text-purple-400" />}
            label="Mês Acumulado"
            sub={monthLabelText}
            value={spending.mes}
          />
        </div>

        {/* Heatmap de Atividade de Gastos (estilo Pierre) */}
        <div className="rounded-3xl bg-[#14141b] border border-white/5 p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#ccff00]" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Frequência de Gastos
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">Consistência do Mês</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {daysInMonth.map((d) => (
              <div
                key={d.day}
                title={`Dia ${d.day}`}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md transition-all ${
                  d.isHigh
                    ? 'bg-[#ccff00] shadow-[0_0_8px_rgba(204,255,0,0.5)]'
                    : d.active
                    ? 'bg-[#ccff00]/50'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
            <span>Menos gastos</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-white/5" />
              <span className="w-2.5 h-2.5 rounded bg-[#ccff00]/40" />
              <span className="w-2.5 h-2.5 rounded bg-[#ccff00]" />
            </div>
            <span>Dias de pico</span>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Anel de Categorias Pierre (Donut circular da Ref 3) */}
      <div className="lg:col-span-5 rounded-3xl bg-[#14141b] border border-white/5 p-5 shadow-xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Gastos no Mês
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">
            {monthLabelText}
          </span>
        </div>

        {/* Circular Donut Gauge */}
        <div className="flex flex-col items-center justify-center py-2 relative">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="14"
              fill="transparent"
            />
            {angles.map((a) => (
              <circle
                key={a.category}
                cx="80"
                cy="80"
                r={radius}
                stroke={a.strokeColor}
                strokeWidth="14"
                strokeDasharray={`${a.dashArray} ${circumference}`}
                strokeDashoffset={-a.dashOffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700"
              />
            ))}
          </svg>

          {/* Valor Central no Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {formatBRL(totalMes)}
            </span>
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mt-0.5">
              Total Gasto
            </span>
          </div>
        </div>

        {/* Lista de Categorias com porcentagens */}
        <div className="space-y-2 pt-2 border-t border-white/5 max-h-48 overflow-y-auto pr-1">
          {byCategory.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3 text-center">Nenhum gasto neste mês.</p>
          ) : (
            byCategory.map((item, idx) => {
              const color = colorPalette[idx % colorPalette.length];
              const pct = totalMes > 0 ? Math.round((item.total / totalMes) * 100) : 0;
              return (
                <div
                  key={item.category}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-zinc-300 font-medium truncate">
                      {CATEGORY_LABEL[item.category as ExpenseCategory] ?? item.category}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{pct}%</span>
                  </div>
                  <span className="font-bold text-white shrink-0 ml-2">
                    {formatBRL(item.total)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const SpendingTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  sub: string;
  value: number;
  highlight?: boolean;
}> = ({ icon, label, sub, value, highlight = false }) => (
  <div
    className={`rounded-3xl border p-3.5 sm:p-5 space-y-1.5 transition-all ${
      highlight
        ? 'bg-[#181822] border-[#ccff00]/30 shadow-[0_0_15px_rgba(204,255,0,0.06)]'
        : 'bg-[#14141b] border-white/5 hover:border-white/10'
    }`}
  >
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider truncate">
        {label}
      </span>
    </div>
    <div className={`text-sm sm:text-xl font-black tracking-tight truncate ${highlight ? 'text-[#ccff00]' : 'text-white'}`}>
      {formatBRL(value)}
    </div>
    <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate">{sub}</p>
  </div>
);
