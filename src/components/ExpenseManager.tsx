import React, { useState } from 'react';
import type {
  ExpenseItem, UserProfile, NewExpense, EditExpense, ExpenseCategory, WeekNumber, CycleWeek, MonthKey,
} from '../types/finance';
import { RecurrenceSelector } from './RecurrenceSelector';
import { EXPENSE_CATEGORIES, CATEGORY_LABEL, categoryIcon } from './expenseCategories';
import { inputCls, cancelCls, Field, Tag } from './ui';
import { formatBRL, formatBR, cycleWeekOf, currentMonthKey, todayISO } from '../lib/period';
import { openGoogleCalendar } from '../lib/calendar';
import { Plus, Check, Trash2, ShoppingBag, User, Repeat, Filter, X, Pencil, Calendar } from 'lucide-react';

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
  const [paidNow, setPaidNow] = useState(true);
  const [recurring, setRecurring] = useState(false);
  const [weeks, setWeeks] = useState<CycleWeek[]>([1, 2, 3, 4]);
  const [months, setMonths] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    setPaidNow(item.paid);
    setRecurring(false);
    setShowForm(true);
  };

  // Filtros da lista
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'TODAS'>('TODAS');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);

  const visible = expenses.filter((e) => {
    if (selectedWeek !== 'ALL' && e.week !== selectedWeek) return false;
    if (filterCategory !== 'TODAS' && e.category !== filterCategory) return false;
    if (onlyUnpaid && e.paid) return false;
    return true;
  });

  const total = visible.reduce((a, e) => a + e.amount, 0);
  const paid = visible.filter((e) => e.paid).reduce((a, e) => a + e.amount, 0);

  const presentCategories = EXPENSE_CATEGORIES.filter((c) => expenses.some((e) => e.category === c));
  const hasFilter = filterCategory !== 'TODAS' || onlyUnpaid;

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
    <section className="bg-[#14141b] rounded-3xl border border-white/5 shadow-2xl p-4 sm:p-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-400 shrink-0" />
            <span>Controle de Gastos</span>
            <span className="text-xs bg-rose-500/10 text-rose-400 font-mono font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
              {visible.length}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Despesas fixas e do dia a dia vinculadas por data e semana.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="text-xs bg-white/[0.03] sm:bg-transparent p-2.5 sm:p-0 rounded-2xl flex sm:block justify-between items-center border border-white/5 sm:border-0">
            <span className="text-zinc-500">Pago / Total:</span>
            <span className="ml-2 sm:ml-0 sm:block font-bold">
              <span className="text-white font-mono">{formatBRL(paid)}</span>
              <span className="text-zinc-500 font-mono"> / {formatBRL(total)}</span>
            </span>
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-black bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 cursor-pointer transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Gasto</span>
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-2xl bg-[#181822] border border-white/10 space-y-4">
          {editingId && (
            <div className="flex items-center justify-between gap-2 -mb-1">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Editando este lançamento
              </span>
              <button type="button" onClick={fecharForm} title="Cancelar edição"
                className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Descrição">
              <input
                type="text" required autoFocus
                placeholder="Mercado, combustível, luz..."
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
              <Field label="De quem é">
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
                  {users.map((u) => <option key={u.id} value={u.id} className="bg-[#181822] text-white">{u.name}</option>)}
                </select>
              </Field>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox" checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#ccff00] focus:ring-[#ccff00]"
              />
              Conta fixa mensal
            </label>

            {(!recurring || editingId) && (
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox" checked={paidNow}
                  onChange={(e) => setPaidNow(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#ccff00] focus:ring-[#ccff00]"
                />
                Já foi pago
              </label>
            )}
          </div>

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
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-black bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-50 cursor-pointer transition-all"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Confirmar Gasto'}
            </button>
          </div>
        </form>
      )}

      {/* Filtro por categoria */}
      {expenses.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <Chip active={filterCategory === 'TODAS'} onClick={() => setFilterCategory('TODAS')}>
            Todas
          </Chip>
          {presentCategories.map((c) => (
            <Chip key={c} active={filterCategory === c} onClick={() => setFilterCategory(c)}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
          <span className="w-px h-5 bg-white/10 shrink-0 mx-0.5" />
          <Chip active={onlyUnpaid} onClick={() => setOnlyUnpaid((v) => !v)}>
            Só não pagos
          </Chip>
          {hasFilter && (
            <button
              onClick={() => { setFilterCategory('TODAS'); setOnlyUnpaid(false); }}
              className="text-[11px] text-zinc-500 hover:text-white flex items-center gap-1 shrink-0 cursor-pointer px-1"
            >
              <X className="w-3 h-3" /> Limpar
            </button>
          )}
        </div>
      )}

      <div className="divide-y divide-white/5">
        {visible.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 px-3 rounded-2xl gap-2 transition-all ${
              item.paid ? 'bg-white/[0.01] opacity-75' : 'hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <button
                onClick={() => onTogglePaid(item.id)}
                title={item.paid ? 'Marcar como não pago' : 'Marcar como pago'}
                className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                  item.paid
                    ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                    : 'border-white/20 hover:border-rose-400 text-transparent'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>

              <span className="shrink-0 p-2 rounded-xl bg-white/5">{categoryIcon(item.category)}</span>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-sm font-bold ${item.paid ? 'text-zinc-500 line-through' : 'text-white'}`}>
                    {item.description}
                  </span>
                  {item.userName && users.length > 1 && (
                    <Tag cls="bg-white/5 text-zinc-300 border-white/10">
                      <User className="w-3 h-3" />{item.userName}
                    </Tag>
                  )}
                  <Tag cls="bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20 font-mono">Sem. {item.week}</Tag>
                  {item.isFixed && (
                    <Tag cls="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Fixa</Tag>
                  )}
                  {item.seriesId && (
                    <Tag cls="bg-purple-500/10 text-purple-400 border-purple-500/20">
                      <Repeat className="w-3 h-3" />Recorrente
                    </Tag>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {formatBR(item.date)} · {CATEGORY_LABEL[item.category]}
                  {!item.paid && <span className="text-amber-400 font-semibold"> · a pagar</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pl-10 sm:pl-0">
              <span className="text-sm sm:text-base font-black text-rose-400 font-mono whitespace-nowrap">
                − {formatBRL(item.amount)}
              </span>
              <button
                onClick={() => openGoogleCalendar({
                  title: `Conta: ${item.description} (${formatBRL(item.amount)})`,
                  description: `Despesa no Fluxo Financeiro.\nDescrição: ${item.description}\nCategoria: ${CATEGORY_LABEL[item.category]}\nValor: ${formatBRL(item.amount)}\nSituação: ${item.paid ? 'Pago' : 'Pendente'}`,
                  startDate: item.date,
                })}
                title="Adicionar à Google Agenda"
                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => abrirEdicao(item)}
                title="Editar valor, data, categoria..."
                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteExpense(item.id)}
                title="Excluir"
                className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-8 font-medium">
            {expenses.length === 0
              ? 'Nenhum gasto registrado neste mês.'
              : 'Nenhum gasto encontrado com esses filtros.'}
          </p>
        )}
      </div>
    </section>
  );
};

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active, onClick, children,
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
      active
        ? 'bg-[#ccff00] border-[#ccff00] text-black shadow-xs'
        : 'bg-[#181822] border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
    }`}
  >
    {children}
  </button>
);
