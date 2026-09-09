import React from 'react';
import type { MonthSummary } from '../types/finance';
import { formatBRL } from '../lib/period';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard, TrendingUp } from 'lucide-react';

/**
 * Dois saldos, lado a lado e nomeados:
 *   PREVISTO = tudo que está cadastrado no mês, pago ou não
 *   REAL     = o que entrou de verdade menos o que saiu de verdade
 * A v1 só tinha o previsto e o chamava de "Saldo Livre", o que dava a impressão
 * de ter dinheiro que ainda não tinha caído.
 */

interface Props {
  summary: MonthSummary;
}

export const CashflowSummary: React.FC<Props> = ({ summary }) => {
  const realOk = summary.balanceActual >= 0;
  const planOk = summary.balancePlanned >= 0;

  const pctRecebido = summary.incomePlanned > 0
    ? Math.round((summary.incomeActual / summary.incomePlanned) * 100)
    : 0;
  const pctPago = summary.outgoing > 0
    ? Math.round((summary.outgoingPaid / summary.outgoing) * 100)
    : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Saldo real em destaque — é o número que decide se dá pra gastar hoje */}
      <div className={`rounded-2xl border p-4 sm:p-6 ${realOk ? 'bg-blue-50/60 border-blue-200' : 'bg-rose-50 border-rose-200'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                Saldo real
              </span>
              <span className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                recebido − pago
              </span>
            </div>
            <div className={`text-2xl sm:text-4xl font-black tracking-tight mt-1 ${realOk ? 'text-blue-700' : 'text-rose-600'}`}>
              {formatBRL(summary.balanceActual)}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-1">
              Entrou {formatBRL(summary.incomeActual)} · saiu {formatBRL(summary.outgoingPaid)}
            </p>
          </div>

          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white border border-blue-200 flex items-center justify-center shadow-xs shrink-0">
            <Wallet className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/80 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-600">Se tudo se confirmar:</span>
            <strong className={planOk ? 'text-slate-900' : 'text-rose-600'}>
              {formatBRL(summary.balancePlanned)}
            </strong>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-600">
            {pctRecebido}% dos recebimentos caíram · {pctPago}% das contas pagas
          </div>
        </div>
      </div>

      {/* Composição do mês */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card
          label="Recebimentos"
          value={formatBRL(summary.incomePlanned)}
          foot={`${formatBRL(summary.incomeActual)} já caiu`}
          icon={<ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border-emerald-200"
        />
        <Card
          label="Gastos"
          value={formatBRL(summary.expenses)}
          foot={`${formatBRL(summary.expensesPaid)} pago`}
          icon={<ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />}
          iconBg="bg-rose-50 border-rose-200"
          valueClass="text-rose-600"
        />
        <Card
          label="Dívidas"
          value={formatBRL(summary.debts)}
          foot={`${formatBRL(summary.debtsPaid)} quitado`}
          icon={<CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />}
          iconBg="bg-amber-50 border-amber-200"
        />
      </div>
    </div>
  );
};

const Card: React.FC<{
  label: string; value: string; foot: string;
  icon: React.ReactNode; iconBg: string; valueClass?: string;
}> = ({ label, value, foot, icon, iconBg, valueClass = 'text-slate-900' }) => (
  <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-3 sm:p-5 space-y-1">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
        {label}
      </span>
      <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
    <div className={`text-sm sm:text-2xl font-black tracking-tight truncate ${valueClass}`}>
      {value}
    </div>
    <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{foot}</p>
  </div>
);
