import React, { useState, useMemo } from 'react';
import type {
  IncomeItem, UserProfile, NewIncome, EditIncome, IncomeCategory, WeekNumber, CycleWeek, MonthKey,
} from '../types/finance';
import { RecurrenceSelector } from './RecurrenceSelector';
import { INCOME_CATEGORIES, INCOME_LABEL } from './expenseCategories';
import { formatBRL, formatBR, cycleWeekOf, currentMonthKey, todayISO } from '../lib/period';
import { openGoogleCalendar } from '../lib/calendar';
import {
  Plus, Check, Trash2, Calendar, ArrowUpRight, User, Repeat, Pencil, X,
  Wallet, CheckCircle2, Clock, Filter, Sparkles
} from 'lucide-react';
import { inputCls, cancelCls, Field, Tag } from './ui';

interface Props {
  incomes: IncomeItem[];
  users: UserProfile[];
  monthKey: MonthKey;
  defaultUserId?: string;
  selectedWeek: WeekNumber | 'ALL';
  onAddIncome: (item: NewIncome) => void | Promise<void>;
  onUpdateIncome: (id: string, patch: EditIncome) => void | Promise<void>;
  onToggleReceived: (id: string) => void;
  onDeleteIncome: (id: string) => void;
}

export const IncomeManager: React.FC<Props> = ({
  incomes, users, monthKey, defaultUserId, selectedWeek,
  onAddIncome, onUpdateIncome, onToggleReceived, onDeleteIncome,
}) => {
  const defaultDate = monthKey === currentMonthKey() ? todayISO() : `${monthKey}-01`;

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState(defaultDate);
  const [category, setCategory] = useState<IncomeCategory>('Salario');
  const [userId, setUserId] = useState(defaultUserId ?? users[0]?.id ?? '');
  const [recurring, setRecurring] = useState(false);
  const [weeks, setWeeks] = useState<CycleWeek[]>([1, 2, 3]);
  const [months, setMonths] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recebido, setRecebido] = useState(false);

  // Filtros internos da página própria
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECEIVED' | 'PENDING'>('ALL');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('ALL');

  const [formMonth, setFormMonth] = useState(monthKey);
  if (formMonth !== monthKey) {
    setFormMonth(monthKey);
    if (!editingId) setExpectedDate(defaultDate);
  }

  const fecharForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDescription('');
    setAmount('');
    setRecurring(false);
    setRecebido(false);
    setExpectedDate(defaultDate);
  };

  const abrirNovo = () => {
    if (showForm && !editingId) { fecharForm(); return; }
    setEditingId(null);
    setDescription('');
    setAmount('');
    setRecurring(false);
    setRecebido(false);
    setExpectedDate(defaultDate);
    setShowForm(true);
  };

  const abrirEdicao = (item: IncomeItem) => {
    setEditingId(item.id);
    setDescription(item.description);
    setAmount(String(item.amount));
    setExpectedDate(item.expectedDate);
    setCategory(item.category);
    setUserId(item.userId ?? '');
    setRecebido(item.received);
    setRecurring(false);
    setShowForm(true);
  };

  // Filtragem
  const visible = useMemo(() => {
    return incomes.filter((i) => {
      if (selectedWeek !== 'ALL' && i.week !== selectedWeek) return false;
      if (statusFilter === 'RECEIVED' && !i.received) return false;
      if (statusFilter === 'PENDING' && i.received) return false;
      if (selectedCatFilter !== 'ALL' && i.category !== selectedCatFilter) return false;
      return true;
    });
  }, [incomes, selectedWeek, statusFilter, selectedCatFilter]);

  const total = incomes.reduce((a, i) => a + i.amount, 0);
  const received = incomes.filter((i) => i.received).reduce((a, i) => a + i.amount, 0);
  const pending = total - received;
  const pctRealizado = total > 0 ? Math.round((received / total) * 100) : 0;

  // Breakdown por categoria
  const catBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of incomes) {
      map.set(i.category, (map.get(i.category) ?? 0) + i.amount);
    }
    return [...map.entries()].map(([cat, val]) => ({
      cat: cat as IncomeCategory,
      val,
      pct: total > 0 ? Math.round((val / total) * 100) : 0
    })).sort((a, b) => b.val - a.val);
  }, [incomes, total]);

  const toggleWeek = (w: CycleWeek) =>
    setWeeks((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!description.trim() || !Number.isFinite(value) || value < 0) return;
    if (recurring && weeks.length === 0) return;

    const base = {
      userId: userId || undefined,
      userName: users.find((u) => u.id === userId)?.name,
      description: description.trim(),
      amount: value,
      expectedDate,
      category,
    };

    setSaving(true);
    try {
      if (editingId) {
        await onUpdateIncome(editingId, { ...base, received: recebido });
      } else {
        await onAddIncome({
          ...base,
          received: recebido,
          recurrence: recurring ? { weeks, months } : undefined,
        });
      }
      fecharForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header Autônomo Pierre Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121b16] via-[#101413] to-[#0a0f0d] border border-emerald-500/20 p-6 sm:p-8 shadow-2xl">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#ccff00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                Módulo de Receitas & Entradas
              </span>
              <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#ccff00]" />
                {incomes.length} lançamentos
              </span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Recebimentos Previstos
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-lg">
                Gerencie salários, adiantamentos, diárias e rendas extras. Acompanhe em tempo real o que já entrou na conta bancária e o que ainda está por vir.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black text-black bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 cursor-pointer transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>Novo Recebimento</span>
          </button>
        </div>

        {/* Tiles Métricas Exclusivas de Receita */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="uppercase font-mono text-[10px]">Total Estimado</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {formatBRL(total)}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Previsão bruta para o mês</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="uppercase font-mono text-[10px] text-emerald-400 font-bold">Já em Conta ({pctRealizado}%)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {formatBRL(received)}
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${pctRealizado}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="uppercase font-mono text-[10px] text-amber-400 font-bold">Ainda a Cair</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {formatBRL(pending)}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Aguardando confirmação bancária</p>
          </div>
        </div>
      </div>

      {/* Formulário de Cadastro/Edição Moderno */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-[#14141d] border border-emerald-500/30 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {editingId ? 'Editar Entrada de Receita' : 'Cadastrar Novo Recebimento'}
                </h4>
                <span className="text-[11px] text-zinc-400">Preencha o valor e a data prevista</span>
              </div>
            </div>
            <button
              type="button"
              onClick={fecharForm}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Descrição da Renda">
              <input
                type="text" required autoFocus
                placeholder="Salário, adiantamento, freela..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Valor (R$)">
              <input
                type="number" step="0.01" min="0.01" required
                placeholder="1.500,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label={recurring ? 'Data do 1º recebimento' : 'Data do crédito'}>
              <input
                type="date" required
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className={inputCls}
              />
              {!recurring && (
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  Semana {cycleWeekOf(expectedDate)} calculada
                </span>
              )}
            </Field>

            <Field label="Categoria">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                className={inputCls}
              >
                {INCOME_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#181822] text-white">{INCOME_LABEL[c]}</option>
                ))}
              </select>
            </Field>

            {users.length > 1 && (
              <Field label="Titular / Responsável">
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
                  {users.map((u) => <option key={u.id} value={u.id} className="bg-[#181822] text-white">{u.name}</option>)}
                </select>
              </Field>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-200 cursor-pointer select-none">
              <input
                type="checkbox" checked={recebido}
                onChange={(e) => setRecebido(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#ccff00] focus:ring-[#ccff00]"
              />
              <span>Dinheiro já disponível na conta bancária (confirmar recebimento)</span>
            </label>
          </div>

          {!editingId && (
            <RecurrenceSelector
              enabled={recurring}
              onToggle={setRecurring}
              weeks={weeks}
              onToggleWeek={toggleWeek}
              months={months}
              onChangeMonths={setMonths}
              accent="emerald"
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button type="button" onClick={fecharForm} className={cancelCls}>Cancelar</button>
            <button
              type="submit"
              disabled={saving || (recurring && weeks.length === 0)}
              className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-black text-black bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-50 cursor-pointer transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
            >
              {saving ? 'Gravando no Banco...' : editingId ? 'Salvar Alterações' : 'Confirmar Recebimento'}
            </button>
          </div>
        </form>
      )}

      {/* Categorias & Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#14141b] border border-white/5 p-4 rounded-3xl">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs text-zinc-500 font-mono flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-white text-black'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({incomes.length})
          </button>
          <button
            onClick={() => setStatusFilter('RECEIVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'RECEIVED'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            Caídos em Conta
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-black'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            A Receber
          </button>
        </div>

        {catBreakdown.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCatFilter('ALL')}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold cursor-pointer transition-all ${
                selectedCatFilter === 'ALL'
                  ? 'bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/40'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Todas Categorias
            </button>
            {catBreakdown.map((c) => (
              <button
                key={c.cat}
                onClick={() => setSelectedCatFilter(c.cat)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold cursor-pointer transition-all ${
                  selectedCatFilter === c.cat
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {INCOME_LABEL[c.cat]} ({c.pct}%)
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Recebimentos em Cartões Elegantes */}
      <div className="space-y-3">
        {visible.map((item) => (
          <div
            key={item.id}
            className={`group rounded-3xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              item.received
                ? 'bg-[#14141b]/90 border-white/5 hover:border-emerald-500/30'
                : 'bg-[#181824] border-white/10 hover:border-[#ccff00]/30 shadow-lg'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <button
                onClick={() => onToggleReceived(item.id)}
                title={item.received ? 'Marcar como não recebido' : 'Confirmar recebimento em conta'}
                className={`w-9 h-9 shrink-0 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${
                  item.received
                    ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'border-white/20 bg-white/5 hover:border-emerald-400 text-transparent hover:text-emerald-400'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </button>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-base font-bold tracking-tight ${item.received ? 'text-zinc-200' : 'text-white'}`}>
                    {item.description}
                  </span>
                  <Tag cls="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold">
                    {INCOME_LABEL[item.category] ?? item.category}
                  </Tag>
                  <Tag cls="bg-white/5 text-zinc-400 border-white/10 font-mono">
                    Semana {item.week}
                  </Tag>
                  {item.userName && users.length > 1 && (
                    <Tag cls="bg-white/5 text-zinc-300 border-white/10">
                      <User className="w-3 h-3" />{item.userName}
                    </Tag>
                  )}
                  {item.seriesId && (
                    <Tag cls="bg-purple-500/10 text-purple-400 border-purple-500/20">
                      <Repeat className="w-3 h-3" />Recorrente
                    </Tag>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>Previsão: <strong className="text-zinc-300 font-mono">{formatBR(item.expectedDate)}</strong></span>
                  <span>•</span>
                  {item.received ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado na conta
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Pendente de cair
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0 border-t sm:border-0 border-white/5 pt-2 sm:pt-0">
              <div className="text-right">
                <span className="text-base sm:text-xl font-black text-emerald-400 font-mono block">
                  + {formatBRL(item.amount)}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono uppercase">
                  {item.received ? 'Lançado' : 'Aguardando'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openGoogleCalendar({
                    title: `Recebimento: ${item.description} (${formatBRL(item.amount)})`,
                    description: `Entrada no Fluxo Financeiro.\nDescrição: ${item.description}\nCategoria: ${INCOME_LABEL[item.category] ?? item.category}\nValor: ${formatBRL(item.amount)}\nSituação: ${item.received ? 'Recebido' : 'Pendente'}`,
                    startDate: item.expectedDate,
                  })}
                  title="Sincronizar com Google Agenda"
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => abrirEdicao(item)}
                  title="Editar Lançamento"
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteIncome(item.id)}
                  title="Excluir"
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-[#14141b] border border-white/5 space-y-2">
            <Wallet className="w-10 h-10 text-zinc-600 mx-auto stroke-[1.5]" />
            <h4 className="text-sm font-bold text-white">Nenhum recebimento encontrado</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Não há lançamentos de renda para os filtros selecionados neste mês. Toque em "Novo Recebimento" para cadastrar salários ou rendas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
