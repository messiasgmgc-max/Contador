import React, { useState } from 'react';
import type {
  ExpenseItem, UserProfile, NewExpense, EditExpense, ExpenseCategory, WeekNumber, CycleWeek, MonthKey,
} from '../types/finance';
import { RecurrenceSelector } from './RecurrenceSelector';
import { EXPENSE_CATEGORIES, CATEGORY_LABEL, categoryIcon } from './expenseCategories';
import { inputCls, cancelCls, Field, Tag } from './ui';
import { formatBRL, formatBR, cycleWeekOf, currentMonthKey, todayISO } from '../lib/period';
import { Plus, Check, Trash2, ShoppingBag, User, Repeat, Filter, X, Pencil } from 'lucide-react';

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

  // Ao trocar de mês, a data do formulário acompanha. Sem isto o lançamento
  // feito enquanto se olha outro mês nascia no mês de hoje e sumia da tela.
  const [formMonth, setFormMonth] = useState(monthKey);
  if (formMonth !== monthKey) {
    setFormMonth(monthKey);
    // Editando, a data é a do lançamento; trocar o mês não pode atropelá-la.
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

  // Categorias que realmente aparecem no mês, para não mostrar chip vazio
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
          // Gasto do dia a dia normalmente já saiu do bolso; conta futura, não.
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
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Gastos</span>
            <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full border border-rose-200">
              {visible.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Contas fixas e gasto do dia a dia. A semana sai da data.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="text-xs bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl flex sm:block justify-between items-center">
            <span className="text-slate-500">Pago / total:</span>
            <span className="ml-2 sm:ml-0 sm:block font-bold">
              <span className="text-slate-900">{formatBRL(paid)}</span>
              <span className="text-slate-400"> / {formatBRL(total)}</span>
            </span>
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo gasto</span>
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-4">
          {editingId && (
            <div className="flex items-center justify-between gap-2 -mb-1">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Editando este gasto
              </span>
              <button type="button" onClick={fecharForm} title="Cancelar edição"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Descrição">
              <input
                type="text" required autoFocus
                placeholder="Mercado, gasolina, conta de luz..."
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
                <span className="text-[10px] text-slate-500 mt-1 block">
                  cai na semana {cycleWeekOf(date)}
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
                  <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                ))}
              </select>
            </Field>

            {users.length > 1 && (
              <Field label="De quem é">
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox" checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              Conta fixa
            </label>

            {(!recurring || editingId) && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox" checked={paidNow}
                  onChange={(e) => setPaidNow(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
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

          <div className="flex justify-end gap-2">
            <button type="button" onClick={fecharForm} className={cancelCls}>Cancelar</button>
            <button
              type="submit"
              disabled={saving || (recurring && weeks.length === 0)}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {/* Filtro por categoria */}
      {expenses.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Chip active={filterCategory === 'TODAS'} onClick={() => setFilterCategory('TODAS')}>
            Todas
          </Chip>
          {presentCategories.map((c) => (
            <Chip key={c} active={filterCategory === c} onClick={() => setFilterCategory(c)}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
          <span className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />
          <Chip active={onlyUnpaid} onClick={() => setOnlyUnpaid((v) => !v)}>
            Só não pagos
          </Chip>
          {hasFilter && (
            <button
              onClick={() => { setFilterCategory('TODAS'); setOnlyUnpaid(false); }}
              className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 shrink-0 cursor-pointer px-1"
            >
              <X className="w-3 h-3" /> limpar
            </button>
          )}
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {visible.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 px-2 rounded-xl gap-2 ${
              item.paid ? 'bg-slate-50/60' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <button
                onClick={() => onTogglePaid(item.id)}
                title={item.paid ? 'Marcar como não pago' : 'Marcar como pago'}
                className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center cursor-pointer ${
                  item.paid
                    ? 'bg-slate-700 border-slate-700 text-white'
                    : 'border-slate-300 hover:border-rose-500 text-transparent'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>

              <span className="shrink-0">{categoryIcon(item.category)}</span>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-sm font-semibold ${item.paid ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {item.description}
                  </span>
                  {item.userName && users.length > 1 && (
                    <Tag cls="bg-blue-50 text-blue-700 border-blue-200">
                      <User className="w-3 h-3" />{item.userName}
                    </Tag>
                  )}
                  <Tag cls="bg-slate-100 text-slate-600 border-slate-200">Sem. {item.week}</Tag>
                  {item.isFixed && (
                    <Tag cls="bg-cyan-50 text-cyan-700 border-cyan-200">fixa</Tag>
                  )}
                  {item.seriesId && (
                    <Tag cls="bg-indigo-50 text-indigo-700 border-indigo-200">
                      <Repeat className="w-3 h-3" />recorrente
                    </Tag>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {formatBR(item.date)} · {CATEGORY_LABEL[item.category]}
                  {!item.paid && <span className="text-amber-600 font-semibold"> · a pagar</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pl-10 sm:pl-0">
              <span className="text-sm sm:text-base font-bold text-rose-600 whitespace-nowrap">
                − {formatBRL(item.amount)}
              </span>
              <button
                onClick={() => abrirEdicao(item)}
                title="Editar valor, data, categoria..."
                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteExpense(item.id)}
                title="Excluir"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            {expenses.length === 0
              ? 'Nenhum gasto neste mês.'
              : 'Nenhum gasto com esses filtros.'}
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
    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
      active
        ? 'bg-rose-600 border-rose-600 text-white'
        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
    }`}
  >
    {children}
  </button>
);
