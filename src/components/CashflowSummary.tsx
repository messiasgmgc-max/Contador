import React from 'react';
import type { MonthSummary } from '../types/finance';
import { formatBRL } from '../lib/period';
import { ArrowUpRight, ArrowDownRight, CreditCard, ShieldCheck } from 'lucide-react';

interface Props {
  summary: MonthSummary;
  userName?: string;
  onOpenCardDetails?: () => void;
}

export const CashflowSummary: React.FC<Props> = ({ summary, userName = 'Usuário' }) => {
  const realOk = summary.balanceActual >= 0;
  const totalIn = summary.incomePlanned || 1;
  const pctRealizado = Math.min(100, Math.max(0, Math.round((summary.incomeActual / totalIn) * 100)));
  const pctGasto = Math.min(100, Math.max(0, Math.round((summary.outgoingPaid / (summary.outgoing || 1)) * 100)));

  return (
    <div className="space-y-4">
      {/* Pierre Premium Card & Balance */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16161d] via-[#121217] to-[#0c0c10] border border-white/10 p-5 sm:p-7 shadow-2xl">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#ccff00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30">
                Saldo Real em Caixa
              </span>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Atualizado
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-5xl font-black tracking-tight ${realOk ? 'text-white' : 'text-rose-400'}`}>
                {formatBRL(summary.balanceActual)}
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              Recebido: <span className="text-emerald-400 font-semibold">{formatBRL(summary.incomeActual)}</span> · Pago: <span className="text-rose-400 font-semibold">{formatBRL(summary.outgoingPaid)}</span>
            </p>
          </div>

          {/* Cartão de Crédito Físico Estilo Pierre Mastercard Black */}
          <div className="w-full sm:w-72 h-44 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/15 p-4 shadow-xl flex flex-col justify-between relative group hover:border-[#ccff00]/40 transition-all shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-black tracking-widest uppercase italic text-zinc-200">
                  Pierre
                </span>
                <span className="block text-[9px] text-[#ccff00] font-mono font-semibold tracking-wider">
                  FLUXO PRO
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-rose-500/80 -mr-2" />
                <div className="w-6 h-6 rounded-full bg-amber-500/80" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest">
                Saldo Projetado
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {formatBRL(summary.balancePlanned)}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span className="tracking-widest">•••• 6123</span>
              <span className="text-zinc-300 font-sans font-medium">{userName}</span>
            </div>
          </div>
        </div>

        {/* Barra de Progresso Realizado */}
        <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-400">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span>Recebimentos caídos</span>
              <span className="font-bold text-zinc-200">{pctRealizado}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#ccff00] transition-all"
                style={{ width: `${pctRealizado}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span>Contas quitadas</span>
              <span className="font-bold text-zinc-200">{pctGasto}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-500 transition-all"
                style={{ width: `${pctGasto}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid com os 3 cards secundários em visual Dark Glass */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <GlassCard
          label="Entradas Previstas"
          value={formatBRL(summary.incomePlanned)}
          sub={`${formatBRL(summary.incomeActual)} já caíram`}
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-400" />}
          iconBg="bg-emerald-500/10 border-emerald-500/20"
        />
        <GlassCard
          label="Gastos Previstos"
          value={formatBRL(summary.expenses)}
          sub={`${formatBRL(summary.expensesPaid)} pagos`}
          icon={<ArrowDownRight className="w-4 h-4 text-rose-400" />}
          iconBg="bg-rose-500/10 border-rose-500/20"
          valueColor="text-rose-400"
        />
        <GlassCard
          label="Dívidas & Parcelas"
          value={formatBRL(summary.debts)}
          sub={`${formatBRL(summary.debtsPaid)} quitadas`}
          icon={<CreditCard className="w-4 h-4 text-amber-400" />}
          iconBg="bg-amber-500/10 border-amber-500/20"
          valueColor="text-amber-400"
        />
      </div>
    </div>
  );
};

const GlassCard: React.FC<{
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}> = ({ label, value, sub, icon, iconBg, valueColor = 'text-white' }) => (
  <div className="rounded-2xl bg-[#14141b] border border-white/5 p-3.5 sm:p-5 space-y-1.5 hover:border-white/15 transition-all">
    <div className="flex items-center justify-between gap-1">
      <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider truncate">
        {label}
      </span>
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${iconBg} border flex items-center justify-center shrink-0`}>
        {icon}
      </div>
    </div>
    <div className={`text-sm sm:text-xl font-black tracking-tight truncate ${valueColor}`}>
      {value}
    </div>
    <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate">{sub}</p>
  </div>
);
