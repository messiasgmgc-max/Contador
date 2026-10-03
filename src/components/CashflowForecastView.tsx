import React, { useState } from 'react';
import type { CashflowForecastResult } from '../lib/financeEngine';
import { formatBRL } from '../lib/period';
import {
  TrendingUp, AlertCircle,
  Calendar, CheckCircle, Clock
} from 'lucide-react';

interface Props {
  forecast: CashflowForecastResult;
  currentCash: number;
}

export const CashflowForecastView: React.FC<Props> = ({ forecast, currentCash }) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const activeDay = forecast.timeline.find((t) => t.date === selectedDay) || forecast.timeline[forecast.timeline.length - 1];

  // Identificar ponto mínimo e máximo do saldo para dimensionar o gráfico
  const balances = forecast.timeline.map((t) => t.closingBalance);
  const minBal = Math.min(...balances, 0);
  const maxBal = Math.max(...balances, 100);
  const range = maxBal - minBal || 1;

  // Gerar caminho SVG para a linha temporal de fluxo
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 20;
  const paddingY = 30;

  const points = forecast.timeline.map((item, index) => {
    const x = paddingX + (index / (forecast.timeline.length - 1 || 1)) * (svgWidth - 2 * paddingX);
    const normalizedY = (item.closingBalance - minBal) / range;
    const y = svgHeight - paddingY - normalizedY * (svgHeight - 2 * paddingY);
    return { x, y, item };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`
    : '';

  return (
    <div className="space-y-6">
      {/* Banner Principal com Alerta Preditivo (Estilo Mobills / Organizze) */}
      <div className="rounded-3xl bg-gradient-to-br from-[#161622] via-[#121217] to-black border border-white/10 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 font-mono">
                Fluxo de Caixa Preditivo
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">Simulação Diária</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Previsão de Caixa até o Fim do Ciclo
            </h2>
            <p className="text-xs text-zinc-400 max-w-md">
              Calculamos a evolução dia a dia com base em todas as suas receitas previstas, despesas fixas e parcelas de dívidas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 min-w-[150px]">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Saldo Atual em Caixa</span>
              <span className="text-xl font-black text-white font-mono">{formatBRL(currentCash)}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 min-w-[150px]">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Previsão Fim do Mês</span>
              <span className={`text-xl font-black font-mono ${forecast.predictedEndOfMonthBalance >= 0 ? 'text-[#ccff00]' : 'text-rose-400'}`}>
                {formatBRL(forecast.predictedEndOfMonthBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Alerta Preditivo de Risco de Déficit */}
        {forecast.riskOfDeficit && (
          <div className="mt-5 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Alerta de Risco: Caixa Negativo Previsto</h4>
              <p className="text-xs text-rose-400/90 mt-0.5">
                Em <strong>{forecast.lowestProjectedBalance?.date}</strong> seu saldo projetado atinge a mínima de{' '}
                <strong>{formatBRL(forecast.lowestProjectedBalance?.amount || 0)}</strong>. Reajuste datas de vencimento ou adie compras não essenciais.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico Interativo de Linha Temporal */}
      <div className="rounded-3xl bg-[#14141b] border border-white/5 p-5 sm:p-7 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#ccff00]" />
            <h3 className="text-base font-bold text-white">Curva de Evolução Financeira</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Passe o mouse ou toque nos pontos</span>
        </div>

        <div className="w-full overflow-x-auto no-scrollbar py-2">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 sm:h-64 overflow-visible">
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ccff00" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ccff00" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Linha zero de referência */}
            {minBal < 0 && (
              <line
                x1={paddingX}
                y1={svgHeight - paddingY - ((0 - minBal) / range) * (svgHeight - 2 * paddingY)}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY - ((0 - minBal) / range) * (svgHeight - 2 * paddingY)}
                stroke="rgba(244, 63, 94, 0.4)"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
            )}

            {/* Área sombreada */}
            <path d={areaD} fill="url(#curveGradient)" />

            {/* Linha principal de tendência */}
            <path
              d={pathD}
              fill="none"
              stroke="#ccff00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pontos interativos */}
            {points.map((pt, i) => {
              const isSelected = selectedDay === pt.item.date;
              const hasEvents = pt.item.events.length > 0;

              return (
                <g key={pt.item.date} onClick={() => setSelectedDay(pt.item.date)} className="cursor-pointer">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 6 : hasEvents ? 4 : 2.5}
                    className={`transition-all ${
                      isSelected
                        ? 'fill-white stroke-4 stroke-[#ccff00]'
                        : hasEvents
                        ? 'fill-[#ccff00] hover:scale-125'
                        : 'fill-zinc-600'
                    }`}
                  />
                  {/* Etiquetas de data a cada 5 dias */}
                  {i % 5 === 0 && (
                    <text
                      x={pt.x}
                      y={svgHeight - 8}
                      textAnchor="middle"
                      className="text-[9px] fill-zinc-500 font-mono"
                    >
                      {pt.item.dayLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detalhes do Dia Selecionado */}
        {activeDay && (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#ccff00]" />
                <span className="text-xs font-bold text-white">Eventos de {activeDay.date}</span>
                {activeDay.isProjected && (
                  <span className="text-[10px] text-zinc-500 font-mono bg-white/5 px-2 py-0.5 rounded-full">
                    Previsão Futura
                  </span>
                )}
              </div>
              <div className="text-xs font-mono">
                <span className="text-zinc-500">Saldo Fechamento: </span>
                <strong className={`font-bold ${activeDay.closingBalance >= 0 ? 'text-[#ccff00]' : 'text-rose-400'}`}>
                  {formatBRL(activeDay.closingBalance)}
                </strong>
              </div>
            </div>

            {activeDay.events.length > 0 ? (
              <div className="divide-y divide-white/5">
                {activeDay.events.map((ev, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {ev.paidOrReceived ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      <span className="text-zinc-300 font-medium">{ev.description}</span>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        ev.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {ev.type === 'income' ? '+' : '−'} {formatBRL(ev.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-2">
                Nenhum vencimento ou entrada agendada para este dia.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
