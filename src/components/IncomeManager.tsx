import React, { useState } from 'react';
import type {
  IncomeItem, UserProfile, NewIncome, EditIncome, IncomeCategory, WeekNumber, CycleWeek, MonthKey,
} from '../types/finance';
import { RecurrenceSelector } from './RecurrenceSelector';
import { INCOME_CATEGORIES, INCOME_LABEL } from './expenseCategories';
import { formatBRL, formatBR, cycleWeekOf, currentMonthKey, todayISO } from '../lib/period';
import { openGoogleCalendar } from '../lib/calendar';
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
    <section className="bg-[#14141b] rounded-3xl border border-white/5 shadow-2xl p-4 sm:p-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Recebimentos & Rendas</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
              {visible.length}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Salários, comissões, vales e diárias calculados por data.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="text-xs bg-white/[0.03] sm:bg-transparent p-2.5 sm:p-0 rounded-2xl flex sm:block justify-between items-center border border-white/5 sm:border-0">
            <span className="text-zinc-500">Caiu / Total:</span>
            <span className="ml-2 sm:ml-0 sm:block font-bold">
              <span className="text-white font-mono">{formatBRL(received)}</span>
              <span className="text-zinc-500 font-mono"> / {formatBRL(total)}</span>
            </span>
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-black bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 cursor-pointer transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Recebimento</span>
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-2xl bg-[#181822] border border-white/10 space-y-4">
          {editingId && (
            <div className="flex items-center justify-between gap-2 -mb-1">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Editando este recebimento
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
                placeholder="Salário quinzena, diária, bônus..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Valor (R$)">
              <input
                type="number" step="0.01" min="0" required
                placeholder="1.200,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label={recurring ? 'Data do 1º recebimento' : 'Data prevista'}>
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
              <Field label="De quem é">
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
                  {users.map((u) => <option key={u.id} value={u.id} className="bg-[#181822] text-white">{u.name}</option>)}
                </select>
              </Field>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox" checked={recebido}
                onChange={(e) => setRecebido(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#ccff00] focus:ring-[#ccff00]"
              />
              Já caiu na conta
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
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-black bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-50 cursor-pointer transition-all"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Confirmar Recebimento'}
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-white/5">
        {visible.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 px-3 rounded-2xl gap-2 transition-all ${
              item.received ? 'bg-white/[0.01]' : 'hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <button
                onClick={() => onToggleReceived(item.id)}
                title={item.received ? 'Marcar como não recebido' : 'Marcar como recebido'}
                className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                  item.received
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                    : 'border-white/20 hover:border-emerald-400 text-transparent'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-white">
                    {item.description}
                  </span>
                  {item.userName && users.length > 1 && (
                    <Tag cls="bg-white/5 text-zinc-300 border-white/10">
                      <User className="w-3 h-3" />{item.userName}
                    </Tag>
                  )}
                  <Tag cls="bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20 font-mono">Sem. {item.week}</Tag>
                  {item.seriesId && (
                    <Tag cls="bg-purple-500/10 text-purple-400 border-purple-500/20">
                      <Repeat className="w-3 h-3" />Recorrente
                    </Tag>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Previsão {formatBR(item.expectedDate)} · {INCOME_LABEL[item.category] ?? item.category}
                  {item.received ? (
                    <span className="text-emerald-400 font-semibold"> · em conta</span>
                  ) : (
                    <span className="text-amber-400 font-semibold"> · a receber</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pl-10 sm:pl-0">
              <span className="text-sm sm:text-base font-black text-emerald-400 font-mono whitespace-nowrap">
                + {formatBRL(item.amount)}
              </span>
              <button
                onClick={() => openGoogleCalendar({
                  title: `Recebimento: ${item.description} (${formatBRL(item.amount)})`,
                  description: `Entrada prevista no Fluxo Financeiro.\nDescrição: ${item.description}\nCategoria: ${INCOME_LABEL[item.category] ?? item.category}\nValor: ${formatBRL(item.amount)}\nSituação: ${item.received ? 'Recebido' : 'Pendente'}`,
                  startDate: item.expectedDate,
                })}
                title="Adicionar à Google Agenda"
                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => abrirEdicao(item)}
                title="Editar"
                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteIncome(item.id)}
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
            Nenhum recebimento registrado neste período.
          </p>
        )}
      </div>
    </section>
  );
};
