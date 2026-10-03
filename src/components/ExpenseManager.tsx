import React, { useState, useMemo } from 'react';
import type {
  ExpenseItem, UserProfile, NewExpense, EditExpense, ExpenseCategory, WeekNumber, CycleWeek, MonthKey,
} from '../types/finance';
import { RecurrenceSelector } from './RecurrenceSelector';
import { EXPENSE_CATEGORIES, CATEGORY_LABEL, categoryIcon } from './expenseCategories';
import { inputCls, cancelCls, Field, Tag } from './ui';
import { formatBRL, formatBR, cycleWeekOf, currentMonthKey, todayISO } from '../lib/period';
import { openGoogleCalendar } from '../lib/calendar';
import {
  Plus, Check, Trash2, ShoppingBag, User, Repeat, Filter, X, Pencil, Calendar, CreditCard,
  CheckCircle2, Clock, Sparkles
} from 'lucide-react';

interface Props {
  expenses: ExpenseItem[];
  users: UserProfile[];
  monthKey: MonthKey;
  defaultUserId?: string;
  selectedWeek: WeekNumber | 'ALL';
  onAddExpense: (item: NewExpense) => void | Promise<void>;
  onUpdateExpense: (id: string, patch: EditExpense) => void | Promise<void>;
  onTogglePaid: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpenseManager: React.FC<Props> = ({
  expenses, users, monthKey, defaultUserId, selectedWeek,
  onAddExpense, onUpdateExpense, onTogglePaid, onDeleteExpense,
}) => {
  const defaultDate = monthKey === currentMonthKey() ? todayISO() : `${monthKey}-01`;

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [category, setCategory] = useState<ExpenseCategory>('Alimentacao');
  const [userId, setUserId] = useState(defaultUserId ?? users[0]?.id ?? '');
  const [isFixed, setIsFixed] = useState(false);
  const [isCard, setIsCard] = useState(false);
  const [cardName, setCardName] = useState('Pierre Black');
  const [installments, setInstallments] = useState('1');
  const [paidNow, setPaidNow] = useState(true);
  const [recurring, setRecurring] = useState(false);
  const [weeks, setWeeks] = useState<CycleWeek[]>([1, 2, 3, 4]);
  const [months, setMonths] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtros internos da página própria
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'TODAS'>('TODAS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [onlyCard, setOnlyCard] = useState(false);
  const [onlyFixed, setOnlyFixed] = useState(false);

  const [formMonth, setFormMonth] = useState(monthKey);
  if (formMonth !== monthKey) {
    setFormMonth(monthKey);
    if (!editingId) setDate(defaultDate);
  }

  const fecharForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDescription('');
    setAmount('');
    setIsCard(false);
    setCardName('Pierre Black');
    setInstallments('1');
    setRecurring(false);
    setIsFixed(false);
    setPaidNow(true);
    setDate(defaultDate);
  };

  const abrirNovo = () => {
    if (showForm && !editingId) { fecharForm(); return; }
    fecharForm();
    setShowForm(true);
  };

  const abrirEdicao = (item: ExpenseItem) => {
    setEditingId(item.id);
    setDescription(item.description);
    setAmount(String(item.amount));
    setDate(item.date);
    setCategory(item.category);
    setUserId(item.userId ?? '');
    setIsFixed(item.isFixed);
    setIsCard(Boolean(item.isCard));
    setCardName(item.cardName ?? 'Pierre Black');
    setInstallments(String(item.installments ?? 1));
    setPaidNow(item.paid);
    setRecurring(false);
    setShowForm(true);
  };

  // Filtragem
  const visible = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedWeek !== 'ALL' && e.week !== selectedWeek) return false;
      if (filterCategory !== 'TODAS' && e.category !== filterCategory) return false;
      if (statusFilter === 'PAID' && !e.paid) return false;
      if (statusFilter === 'UNPAID' && e.paid) return false;
      if (onlyCard && !e.isCard) return false;
      if (onlyFixed && !e.isFixed) return false;
      return true;
    });
  }, [expenses, selectedWeek, filterCategory, statusFilter, onlyCard, onlyFixed]);

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const paid = expenses.filter((e) => e.paid).reduce((a, e) => a + e.amount, 0);
  const pending = total - paid;
  const pctPago = total > 0 ? Math.round((paid / total) * 100) : 0;

  // Categorias presentes para o filtro rápido
  const categoryBreakdown = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return [...map.entries()].map(([cat, totalCat]) => ({
      cat,
      total: totalCat,
      pct: total > 0 ? Math.round((totalCat / total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [expenses, total]);

  const toggleWeek = (w: CycleWeek) =>
    setWeeks((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!description.trim() || !Number.isFinite(value) || value <= 0) return;
    if (recurring && weeks.length === 0) return;

    const base = {
      userId: userId || undefined,
      userName: users.find((u) => u.id === userId)?.name,
      description: description.trim(),
      amount: value,
      date,
      category,
      isFixed,
      isCard,
      cardName: isCard ? cardName : undefined,
      installments: isCard ? Math.max(1, parseInt(installments) || 1) : 1,
    };

    setSaving(true);
    try {
      if (editingId) {
        await onUpdateExpense(editingId, { ...base, paid: paidNow });
      } else {
        await onAddExpense({
          ...base,
          paid: recurring ? false : paidNow,
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d1215] via-[#140e10] to-[#0d080a] border border-rose-500/20 p-6 sm:p-8 shadow-2xl">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                Módulo de Gastos & Despesas
              </span>
              <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                {expenses.length} despesas registradas
              </span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Controle de Gastos & Saídas
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-lg">
                Monitore despesas fixas, alimentação, transporte e gastos do dia a dia com marcação rápida de pagamento e categorização instantânea.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black text-black bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 cursor-pointer transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>Novo Gasto</span>
          </button>
        </div>

        {/* Tiles Métricas Exclusivas de Gastos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="uppercase font-mono text-[10px]">Total de Gastos</span>
              <ShoppingBag className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {formatBRL(total)}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Despesas totais do mês</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-rose-500/20 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="uppercase font-mono text-[10px] text-emerald-400 font-bold">Já Pago ({pctPago}%)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {formatBRL(paid)}
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${pctPago}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="uppercase font-mono text-[10px] text-amber-400 font-bold">Pendente de Pagamento</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {formatBRL(pending)}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Contas a liquidar</p>
          </div>
        </div>
      </div>

      {/* Formulário de Cadastro/Edição Moderno */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-[#14141d] border border-rose-500/30 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {editingId ? 'Editar Despesa' : 'Cadastrar Novo Gasto'}
                </h4>
                <span className="text-[11px] text-zinc-400">Preencha o valor, data e categoria</span>
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
            <Field label="Descrição">
              <input
                type="text" required autoFocus
                placeholder="Mercado, combustível, almoço..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Valor (R$)">
              <input
                type="number" step="0.01" min="0.01" required
                placeholder="150,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label={recurring ? 'Data do 1º lançamento' : 'Data do gasto'}>
              <input
                type="date" required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
              {!recurring && (
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  Semana {cycleWeekOf(date)} calculada
                </span>
              )}
            </Field>

            <Field label="Categoria">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className={inputCls}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#181822] text-white">{CATEGORY_LABEL[c]}</option>
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

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox" checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#ccff00] focus:ring-[#ccff00]"
              />
              Conta fixa mensal (aluguel, condomínio, internet)
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer select-none bg-white/[0.03] px-2.5 py-1 rounded-xl border border-white/5">
              <input
                type="checkbox" checked={isCard}
                onChange={(e) => setIsCard(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#ccff00] focus:ring-[#ccff00]"
              />
              <span className="flex items-center gap-1.5 text-white">
                <CreditCard className="w-3.5 h-3.5 text-[#ccff00]" />
                Pago no Cartão de Crédito
              </span>
            </label>

            {(!recurring || editingId) && (
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox" checked={paidNow}
                  onChange={(e) => setPaidNow(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#ccff00] focus:ring-[#ccff00]"
                />
                Já foi pago / Débito efetuado
              </label>
            )}
          </div>

          {isCard && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-zinc-950 to-[#14141d] border border-[#ccff00]/30 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
              <Field label="Nome do Cartão">
                <input
                  type="text"
                  placeholder="Pierre Black, Nubank, Inter..."
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Parcelas no Cartão (Ex: 1x, 3x, 10x)">
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          {!editingId && (
            <RecurrenceSelector
              enabled={recurring}
              onToggle={setRecurring}
              weeks={weeks}
              onToggleWeek={toggleWeek}
              months={months}
              onChangeMonths={setMonths}
              accent="rose"
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button type="button" onClick={fecharForm} className={cancelCls}>Cancelar</button>
            <button
              type="submit"
              disabled={saving || (recurring && weeks.length === 0)}
              className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-black text-black bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-50 cursor-pointer transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
            >
              {saving ? 'Gravando no Banco...' : editingId ? 'Salvar Alterações' : 'Confirmar Gasto'}
            </button>
          </div>
        </form>
      )}

      {/* Filtros Rápidos & Chips por Categoria */}
      <div className="space-y-3 bg-[#14141b] border border-white/5 p-4 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs text-zinc-500 font-mono flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Estado:
            </span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({expenses.length})
            </button>
            <button
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'UNPAID'
                  ? 'bg-amber-500 text-black'
                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              A Pagar
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              Já Pagos
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyCard((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                onlyCard
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              💳 Só Cartão
            </button>
            <button
              onClick={() => setOnlyFixed((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                onlyFixed
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Contas Fixas
            </button>
          </div>
        </div>

        {/* Chips de Categoria */}
        {categoryBreakdown.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-white/5">
            <button
              onClick={() => setFilterCategory('TODAS')}
              className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === 'TODAS'
                  ? 'bg-[#ccff00] text-black shadow-xs'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Todas ({categoryBreakdown.length})
            </button>
            {categoryBreakdown.map((c) => (
              <button
                key={c.cat}
                onClick={() => setFilterCategory(c.cat)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterCategory === c.cat
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <span>{categoryIcon(c.cat)}</span>
                <span>{CATEGORY_LABEL[c.cat]}</span>
                <span className="font-mono text-[10px] opacity-75">({c.pct}%)</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Gastos em Cartões Elegantes */}
      <div className="space-y-3">
        {visible.map((item) => (
          <div
            key={item.id}
            className={`group rounded-3xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              item.paid
                ? 'bg-[#14141b]/90 border-white/5 opacity-80 hover:opacity-100 hover:border-emerald-500/30'
                : 'bg-[#181824] border-white/10 hover:border-rose-500/30 shadow-lg'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <button
                onClick={() => onTogglePaid(item.id)}
                title={item.paid ? 'Marcar como não pago' : 'Marcar como pago'}
                className={`w-9 h-9 shrink-0 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${
                  item.paid
                    ? 'bg-rose-500 border-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'border-white/20 bg-white/5 hover:border-rose-400 text-transparent hover:text-rose-400'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </button>

              <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {categoryIcon(item.category)}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-base font-bold tracking-tight ${item.paid ? 'text-zinc-400 line-through' : 'text-white'}`}>
                    {item.description}
                  </span>
                  <Tag cls="bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold">
                    {CATEGORY_LABEL[item.category] ?? item.category}
                  </Tag>
                  {item.isCard && (
                    <Tag cls="bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/30 font-mono">
                      <CreditCard className="w-3 h-3" />
                      {item.cardName || 'Cartão'} {item.installments && item.installments > 1 ? `(${item.installments}x)` : ''}
                    </Tag>
                  )}
                  {item.isFixed && (
                    <Tag cls="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold">Fixa</Tag>
                  )}
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
                  <span>Data: <strong className="text-zinc-300 font-mono">{formatBR(item.date)}</strong></span>
                  <span>•</span>
                  {item.paid ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> A pagar
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0 border-t sm:border-0 border-white/5 pt-2 sm:pt-0">
              <div className="text-right">
                <span className={`text-base sm:text-xl font-black font-mono block ${item.paid ? 'text-zinc-400' : 'text-rose-400'}`}>
                  − {formatBRL(item.amount)}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono uppercase">
                  {item.paid ? 'Liquidado' : 'Aberto'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openGoogleCalendar({
                    title: `Conta: ${item.description} (${formatBRL(item.amount)})`,
                    description: `Despesa no Fluxo Financeiro.\nDescrição: ${item.description}\nCategoria: ${CATEGORY_LABEL[item.category]}\nValor: ${formatBRL(item.amount)}\nSituação: ${item.paid ? 'Pago' : 'Pendente'}`,
                    startDate: item.date,
                  })}
                  title="Sincronizar com Google Agenda"
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => abrirEdicao(item)}
                  title="Editar Despesa"
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteExpense(item.id)}
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
            <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto stroke-[1.5]" />
            <h4 className="text-sm font-bold text-white">Nenhum gasto encontrado</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Não há despesas para os filtros selecionados neste mês. Toque em "Novo Gasto" para cadastrar saídas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
