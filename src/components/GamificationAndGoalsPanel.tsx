import React, { useState } from 'react';
import type { UserGamification, FinancialGoal } from '../types/finance';
import { formatBRL } from '../lib/period';
import {
  Flame, Trophy, Target, Award,
  Sparkles, CheckCircle2, Plus, X
} from 'lucide-react';
import { inputCls, cancelCls, Field } from './ui';

interface Props {
  gamification: UserGamification;
  goals: FinancialGoal[];
  onAddGoal: (goal: Omit<FinancialGoal, 'id' | 'completed'>) => void;
  onUpdateGoalProgress: (goalId: string, addedAmount: number) => void;
}

export const GamificationAndGoalsPanel: React.FC<Props> = ({
  gamification,
  goals,
  onAddGoal,
  onUpdateGoalProgress,
}) => {
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [goalCategory, setGoalCategory] = useState('Viagem');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetAmount);
    if (!goalTitle.trim() || !Number.isFinite(val) || val <= 0) return;

    onAddGoal({
      title: goalTitle.trim(),
      targetAmount: val,
      currentAmount: 0,
      targetDate,
      category: goalCategory,
    });

    setShowGoalModal(false);
    setGoalTitle('');
    setTargetAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal de Gamificação (Fortune City Style) */}
      <div className="rounded-3xl bg-gradient-to-r from-[#181824] via-[#12121c] to-black border border-white/10 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 font-mono">
                Gamificação Financeira
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">Nível {gamification.level} Construtor</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Sua Cidade Financeira</span>
              <span className="text-xl">🏙️</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-md">
              Mantenha o hábito de registrar entradas e saídas todos os dias para aumentar sua sequência de dias (streak) e desbloquear conquistas.
            </p>
          </div>

          {/* Placar de Streaks e Pontos */}
          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-[#0b0b0f] border border-[#ccff00]/30 flex flex-col items-center justify-center min-w-[110px] shadow-lg">
              <div className="flex items-center gap-1 text-amber-400">
                <Flame className="w-5 h-5 fill-amber-400" />
                <span className="text-2xl font-black font-mono text-white">{gamification.streakDays}</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono uppercase mt-0.5">Dias Seguidos</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0b0b0f] border border-white/10 flex flex-col items-center justify-center min-w-[110px] shadow-lg">
              <div className="flex items-center gap-1 text-[#ccff00]">
                <Trophy className="w-5 h-5" />
                <span className="text-2xl font-black font-mono text-white">{gamification.points}</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono uppercase mt-0.5">Pontos XP</span>
            </div>
          </div>
        </div>

        {/* Conquistas Desbloqueáveis (Badges) */}
        <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
            Conquistas Desbloqueadas:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {gamification.achievements.map((ach) => {
              const isUnlocked = Boolean(ach.unlockedAt);
              return (
                <div
                  key={ach.id}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                    isUnlocked
                      ? 'bg-white/[0.03] border-[#ccff00]/30 text-white'
                      : 'bg-white/[0.01] border-white/5 opacity-40 text-zinc-500'
                  }`}
                >
                  <span className="text-xl shrink-0">{ach.icon}</span>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold truncate">{ach.title}</h5>
                    <p className="text-[10px] text-zinc-500 truncate">{ach.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seção de Metas Financeiras (Mobills / Organizze) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#ccff00]" />
            <h3 className="text-base sm:text-lg font-black text-white">Metas & Reservas</h3>
            <span className="text-xs bg-white/5 text-zinc-400 font-mono px-2 py-0.5 rounded-full border border-white/10">
              {goals.length}
            </span>
          </div>

          <button
            onClick={() => setShowGoalModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 text-black text-xs font-black cursor-pointer transition-all shadow-[0_0_15px_rgba(204,255,0,0.15)]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>
        </div>

        {/* Grid de Metas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
            const isFinished = pct >= 100;

            return (
              <div
                key={g.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between space-y-3 transition-all bg-[#14141b] ${
                  isFinished ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00]">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{g.title}</h4>
                      <span className="text-[10px] text-zinc-400 font-mono">{g.category}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isFinished
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/5 text-zinc-400 border-white/10'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-zinc-400">Progresso:</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {formatBRL(g.currentAmount)} / {formatBRL(g.targetAmount)}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isFinished ? 'bg-emerald-400' : 'bg-[#ccff00]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] text-zinc-500 font-mono">Atingir até {g.targetDate}</span>
                  {!isFinished && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onUpdateGoalProgress(g.id, 50)}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[#ccff00] text-[10px] font-mono font-bold cursor-pointer"
                      >
                        +50
                      </button>
                      <button
                        onClick={() => onUpdateGoalProgress(g.id, 200)}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[#ccff00] text-[10px] font-mono font-bold cursor-pointer"
                      >
                        +200
                      </button>
                    </div>
                  )}
                  {isFinished && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Concluída!
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {goals.length === 0 && (
            <div className="col-span-full py-10 text-center rounded-3xl bg-[#14141b] border border-white/5 space-y-2">
              <Target className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-400 font-medium">Nenhuma meta ativa no momento.</p>
              <p className="text-xs text-zinc-500">Crie metas para viagens, reserva de emergência ou compras futuras.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Adicionar Meta */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14141b] rounded-3xl border border-white/10 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ccff00]" />
                Nova Meta Financeira
              </h4>
              <button onClick={() => setShowGoalModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <Field label="Nome da Meta">
                <input
                  type="text"
                  required
                  placeholder="Ex: Reserva de Emergência, iPhone 16, Viagem"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Valor Alvo (R$)">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="Ex: 5000,00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Data Alvo">
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Categoria da Meta">
                <select
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                  className={inputCls}
                >
                  <option value="Reserva">Reserva de Emergência</option>
                  <option value="Viagem">Viagem & Lazer</option>
                  <option value="Bem">Carro / Imóvel / Eletrônico</option>
                  <option value="Investimento">Investimentos</option>
                  <option value="Outro">Outro</option>
                </select>
              </Field>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button type="button" onClick={() => setShowGoalModal(false)} className={cancelCls}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-black bg-[#ccff00] hover:bg-[#b8e600] cursor-pointer"
                >
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
