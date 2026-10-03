import React, { useState } from 'react';
import type { BudgetEnvelope } from '../types/finance';
import type { ZeroBudgetCalculation } from '../lib/financeEngine';
import { formatBRL } from '../lib/period';
import { EXPENSE_CATEGORIES, CATEGORY_LABEL, categoryIcon } from './expenseCategories';
import {
  ShieldCheck, AlertTriangle, ArrowRight,
  TrendingDown, Plus, X, Layers
} from 'lucide-react';
import { inputCls, cancelCls, Field } from './ui';

interface Props {
  budget: ZeroBudgetCalculation;
  onSaveEnvelopes: (envelopes: BudgetEnvelope[]) => void | Promise<void>;
}

export const ZeroBasedBudgetingView: React.FC<Props> = ({ budget, onSaveEnvelopes }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState(EXPENSE_CATEGORIES[0]);
  const [customName, setCustomName] = useState('');
  const [allocatedVal, setAllocatedVal] = useState('');

  const handleQuickAssign = (envelopeId: string, amountToAdd: number) => {
    const updated = budget.envelopesWithStatus.map((env) => {
      if (env.id === envelopeId) {
        return {
          id: env.id,
          userId: env.userId,
          monthKey: env.monthKey,
          category: env.category,
          name: env.name,
          allocatedAmount: Math.max(0, env.allocatedAmount + amountToAdd),
          spentAmount: env.spentAmount,
        };
      }
      return {
        id: env.id,
        userId: env.userId,
        monthKey: env.monthKey,
        category: env.category,
        name: env.name,
        allocatedAmount: env.allocatedAmount,
        spentAmount: env.spentAmount,
      };
    });
    void onSaveEnvelopes(updated);
  };

  const handleCreateEnvelope = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(allocatedVal);
    if (!Number.isFinite(val) || val <= 0) return;

    const newEnv: BudgetEnvelope = {
      id: `env_${Date.now()}`,
      monthKey: budget.envelopesWithStatus[0]?.monthKey || '2026-03',
      category: selectedCat,
      name: customName.trim() || CATEGORY_LABEL[selectedCat],
      allocatedAmount: val,
      spentAmount: 0,
    };

    const existing = budget.envelopesWithStatus.map((e) => ({
      id: e.id,
      userId: e.userId,
      monthKey: e.monthKey,
      category: e.category,
      name: e.name,
      allocatedAmount: e.allocatedAmount,
      spentAmount: e.spentAmount,
    }));

    void onSaveEnvelopes([...existing, newEnv]);
    setShowAddModal(false);
    setCustomName('');
    setAllocatedVal('');
  };

  const toAssign = budget.toAssign;
  const isZeroBalanced = budget.isBalanced;
  const isOverAllocated = toAssign < -0.01;

  return (
    <div className="space-y-6">
      {/* Banner Principal YNAB Zero-Based Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#161622] via-[#121217] to-black border border-white/10 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 font-mono">
                Metodologia YNAB · Zero-Based
              </span>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Dê um trabalho para cada centavo
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Orçamento por Envelopes
            </h2>
            <p className="text-xs text-zinc-400 max-w-lg">
              Todo o dinheiro ganho neste mês é distribuído em tetos específicos. Se uma categoria estourar,
              transfira de outro envelope para manter o equilíbrio zero.
            </p>
          </div>

          {/* O Indicador Central "A Atribuir" (To Be Assigned) */}
          <div className="flex items-center gap-3">
            <div
              className={`p-5 rounded-3xl border flex flex-col justify-center min-w-[220px] transition-all shadow-xl ${
                isZeroBalanced
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isOverAllocated
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse'
                  : 'bg-[#ccff00]/10 border-[#ccff00]/30 text-white'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider font-mono text-zinc-400">
                {isZeroBalanced ? '✓ Orçamento Perfeito' : isOverAllocated ? '⚠️ Orçamento Estourado' : 'Disponível para Alocar'}
              </span>
              <span className={`text-2xl sm:text-3xl font-black tracking-tight font-mono mt-1 ${isZeroBalanced ? 'text-emerald-400' : isOverAllocated ? 'text-rose-400' : 'text-[#ccff00]'}`}>
                {formatBRL(Math.abs(toAssign))}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1">
                {isZeroBalanced
                  ? 'Todo o seu salário tem destino definido!'
                  : isOverAllocated
                  ? `Você alocou ${formatBRL(Math.abs(toAssign))} a mais do que ganha`
                  : 'Distribua o restante nos envelopes abaixo'}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Progresso de Alocação */}
        <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">
              Total Renda: <strong className="text-white font-mono">{formatBRL(budget.totalIncomeAvailable)}</strong>
            </span>
            <span className="text-zinc-400">
              Alocado em Envelopes: <strong className="text-[#ccff00] font-mono">{formatBRL(budget.totalAllocated)}</strong>
            </span>
          </div>

          <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
            <div
              className={`h-full transition-all ${isOverAllocated ? 'bg-rose-500' : 'bg-[#ccff00]'}`}
              style={{
                width: `${Math.min(100, Math.max(0, budget.totalIncomeAvailable > 0 ? (budget.totalAllocated / budget.totalIncomeAvailable) * 100 : 0))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Alerta de Estouro Dinâmico (YNAB Auto-Recalculate) */}
      {budget.totalOverspent > 0 && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-300">
                Atenção: Houve estouro de envelope no valor total de {formatBRL(budget.totalOverspent)}
              </h4>
              <p className="text-xs text-rose-400/90 mt-0.5">
                Para não prejudicar seu saldo final, reajuste o envelope ou remaneje saldo de outro teto com folga.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botão de Adicionar Envelope + Título */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#ccff00]" />
          <span>Seus Envelopes</span>
          <span className="text-xs bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
            {budget.envelopesWithStatus.length}
          </span>
        </h3>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 text-black text-xs font-black cursor-pointer transition-all shadow-[0_0_15px_rgba(204,255,0,0.15)]"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Envelope</span>
        </button>
      </div>

      {/* Grid de Envelopes YNAB */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {budget.envelopesWithStatus.map((env) => {
          const isDanger = env.isOverspent;
          const isFull = env.percentUsed >= 85 && !isDanger;

          return (
            <div
              key={env.id}
              className={`rounded-3xl border p-4 sm:p-5 flex flex-col justify-between transition-all bg-[#14141b] ${
                isDanger
                  ? 'border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                  : isFull
                  ? 'border-amber-500/30'
                  : 'border-white/5 hover:border-white/15'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      {categoryIcon(env.category as any)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{env.name}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {(CATEGORY_LABEL as Record<string, string>)[env.category] || env.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isDanger
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : isFull
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {env.percentUsed}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-400 uppercase font-mono">Restante no Envelope</span>
                    <span
                      className={`text-lg sm:text-xl font-black font-mono tracking-tight ${
                        isDanger ? 'text-rose-400' : 'text-white'
                      }`}
                    >
                      {formatBRL(env.remaining)}
                    </span>
                  </div>

                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isDanger ? 'bg-rose-500' : isFull ? 'bg-amber-400' : 'bg-[#ccff00]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, env.percentUsed))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-zinc-500 pt-1 font-mono">
                    <span>Gasto: {formatBRL(env.spentAmount)}</span>
                    <span>Teto: {formatBRL(env.allocatedAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Botões Rápidos de Conciliação e Ajuste */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">Ajuste rápido:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleQuickAssign(env.id, -50)}
                    disabled={env.allocatedAmount <= 50}
                    title="Diminuir R$ 50 do envelope"
                    className="px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] font-mono font-bold cursor-pointer disabled:opacity-30"
                  >
                    -50
                  </button>
                  <button
                    onClick={() => handleQuickAssign(env.id, 50)}
                    title="Adicionar R$ 50 ao envelope"
                    className="px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[#ccff00] text-[10px] font-mono font-bold cursor-pointer"
                  >
                    +50
                  </button>
                  {isDanger && (
                    <button
                      onClick={() => handleQuickAssign(env.id, env.recommendedAdjustment)}
                      title="Cobrir estouro automaticamente"
                      className="flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold cursor-pointer hover:bg-rose-500/30"
                    >
                      Cobrir
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para criar novo envelope */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14141b] rounded-3xl border border-white/10 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#ccff00]" />
                Criar Envelope de Gastos
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEnvelope} className="space-y-3">
              <Field label="Categoria Vinculada">
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value as any)}
                  className={inputCls}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#181822] text-white">
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nome Personalizado (opcional)">
                <input
                  type="text"
                  placeholder="Ex: Mercado do Mês, Gasolina, Reserva"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Teto de Orçamento (R$)">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="Ex: 800,00"
                  value={allocatedVal}
                  onChange={(e) => setAllocatedVal(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button type="button" onClick={() => setShowAddModal(false)} className={cancelCls}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-black bg-[#ccff00] hover:bg-[#b8e600] cursor-pointer"
                >
                  Criar Envelope
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
