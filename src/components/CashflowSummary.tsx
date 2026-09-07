import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard } from 'lucide-react';

interface CashflowSummaryProps {
  summary: {
    totalCycleIncome: number;
    totalCycleDebts: number;
    totalCycleExpenses: number;
    totalCycleOutgoing: number;
    netCycleBalance: number;
  };
}

export const CashflowSummary: React.FC<CashflowSummaryProps> = ({ summary }) => {
  const isHealthy = summary.netCycleBalance >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Previsto a Receber */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-1 sm:space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Recebimentos</span>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
          R$ {summary.totalCycleIncome.toLocaleString('pt-BR')}
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">
          Entradas cadastradas para o período
        </p>
      </div>

      {/* Total de Saídas (Gastos + Dívidas) */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-1 sm:space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Despesas</span>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-rose-600 tracking-tight">
          R$ {summary.totalCycleExpenses.toLocaleString('pt-BR')}
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">
          Contas fixas e despesas diárias
        </p>
      </div>

      {/* Total de Parcelas e Dívidas */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-3.5 sm:p-5 space-y-1 sm:space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Dívidas</span>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
          R$ {summary.totalCycleDebts.toLocaleString('pt-BR')}
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">
          Parcelas a quitar
        </p>
      </div>

      {/* Saldo Líquido do Ciclo */}
      <div className={`rounded-2xl border shadow-xs p-3.5 sm:p-5 space-y-1 sm:space-y-2 relative overflow-hidden ${
        isHealthy
          ? 'bg-blue-50/60 border-blue-200'
          : 'bg-rose-50 border-rose-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider truncate">Saldo Livre</span>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center shadow-xs shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
        </div>
        <div className={`text-lg sm:text-2xl font-black tracking-tight ${isHealthy ? 'text-blue-700' : 'text-rose-600'}`}>
          {summary.netCycleBalance >= 0 ? '+' : ''} R$ {summary.netCycleBalance.toLocaleString('pt-BR')}
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium hidden sm:block">
          {isHealthy ? 'Sobra livre após pagar gastos e dívidas' : 'Atenção: saídas superam os ganhos!'}
        </p>
      </div>
    </div>
  );
};
