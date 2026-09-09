import React, { useState } from 'react';
import type {
  IncomeItem, UserProfile, NewIncome, EditIncome, IncomeCategory, WeekNumber, CycleWeek, MonthKey,
} from '../types/finance';
import { RecurrenceSelector } from './RecurrenceSelector';
import { INCOME_CATEGORIES, INCOME_LABEL } from './expenseCategories';
import { formatBRL, formatBR, cycleWeekOf, currentMonthKey, todayISO } from '../lib/period';
import { Plus, Check, Trash2, Calendar, ArrowUpRight, User, Repeat, Pencil, X } from 'lucide-react';
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
  // Dentro do mês corrente a data padrão é hoje; em outro mês, o dia 1 dele.
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

  // Ao trocar de mês, a data do formulário acompanha. Sem isto o lançamento
  // feito enquanto se olha outro mês nascia no mês de hoje e sumia da tela.
  const [formMonth, setFormMonth] = useState(monthKey);
  if (formMonth !== monthKey) {
    setFormMonth(monthKey);
    // Editando, a data é a do lançamento; trocar o mês não pode atropelá-la.
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

  const visible = selectedWeek === 'ALL' ? incomes : incomes.filter((i) => i.week === selectedWeek);
  const total = visible.reduce((a, i) => a + i.amount, 0);
  const received = visible.filter((i) => i.received).reduce((a, i) => a + i.amount, 0);

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
          received: false,
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
            <ArrowUpRight className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Recebimentos</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              {visible.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            A semana é calculada pela data — não precisa informar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="text-xs bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl flex sm:block justify-between items-center">
            <span className="text-slate-500">Caiu / previsto:</span>
            <span className="ml-2 sm:ml-0 sm:block font-bold">
              <span className="text-emerald-600">{formatBRL(received)}</span>
              <span className="text-slate-400"> / {formatBRL(total)}</span>
            </span>
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
          {editingId && (
            <div className="flex items-center justify-between gap-2 -mb-1">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Editando este recebimento
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
                placeholder="Salário, freela, comissão..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Valor (R$)">
              <input
                type="number" step="0.01" min="0" required
                placeholder="1200,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label={recurring ? 'Data do 1º lançamento' : 'Data prevista'}>
              <input
                type="date" required
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className={inputCls}
              />
              {!recurring && (
                <span className="text-[10px] text-slate-500 mt-1 block">
                  cai na semana {cycleWeekOf(expectedDate)}
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
                  <option key={c} value={c}>{INCOME_LABEL[c]}</option>
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

          {editingId && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox" checked={recebido}
                onChange={(e) => setRecebido(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              Já caiu na conta
            </label>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={fecharForm} className={cancelCls}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || (recurring && weeks.length === 0)}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-slate-100">
        {visible.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 px-2 rounded-xl gap-2 ${
              item.received ? 'bg-slate-50/60' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <button
                onClick={() => onToggleReceived(item.id)}
                title={item.received ? 'Marcar como não recebido' : 'Marcar como recebido'}
                className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center cursor-pointer ${
                  item.received
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 hover:border-emerald-500 text-transparent'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-sm font-semibold ${item.received ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {item.description}
                  </span>
                  {item.userName && users.length > 1 && (
                    <Tag cls="bg-blue-50 text-blue-700 border-blue-200">
                      <User className="w-3 h-3" />{item.userName}
                    </Tag>
                  )}
                  <Tag cls="bg-slate-100 text-slate-600 border-slate-200">Sem. {item.week}</Tag>
                  {item.seriesId && (
                    <Tag cls="bg-indigo-50 text-indigo-700 border-indigo-200">
                      <Repeat className="w-3 h-3" />recorrente
                    </Tag>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{formatBR(item.expectedDate)}</span>
                  <span>· {INCOME_LABEL[item.category]}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pl-10 sm:pl-0">
              <span className="text-sm sm:text-base font-bold text-emerald-600 whitespace-nowrap">
                + {formatBRL(item.amount)}
              </span>
              <button
                onClick={() => abrirEdicao(item)}
                title="Editar valor, data, categoria..."
                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteIncome(item.id)}
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
            Nenhum recebimento neste período.
          </p>
        )}
      </div>
    </section>
  );
};
