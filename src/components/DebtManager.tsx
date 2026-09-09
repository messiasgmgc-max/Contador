import React, { useState } from 'react';
import type {
  DebtItem, UserProfile, NewDebt, EditDebt, DebtStatus, WeekNumber, CycleWeek, MonthKey,
} from '../types/finance';
import { RecurrenceSelector } from './RecurrenceSelector';
import { inputCls, cancelCls, Field, Tag } from './ui';
import { formatBRL, formatBR, cycleWeekOf, currentMonthKey, todayISO } from '../lib/period';
import { Plus, Trash2, CreditCard, User, Repeat, Check, CircleCheck, Pencil, X } from 'lucide-react';

interface Props {
  debts: DebtItem[];
  users: UserProfile[];
  monthKey: MonthKey;
  defaultUserId?: string;
  selectedWeek: WeekNumber | 'ALL';
  onAddDebt: (item: NewDebt) => void | Promise<void>;
  onUpdateDebt: (id: string, patch: EditDebt) => void | Promise<void>;
  onPayInstallment: (id: string) => void;
  onDeleteDebt: (id: string) => void;
}

export const DebtManager: React.FC<Props> = ({
  debts, users, monthKey, defaultUserId, selectedWeek,
  onAddDebt, onUpdateDebt, onPayInstallment, onDeleteDebt,
}) => {
  const defaultDate = monthKey === currentMonthKey() ? todayISO() : `${monthKey}-01`;

  const [showForm, setShowForm] = useState(false);
  const [creditor, setCreditor] = useState('');
  const [description, setDescription] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [totalInstallments, setTotalInstallments] = useState('1');
  const [dueDate, setDueDate] = useState(defaultDate);
  const [userId, setUserId] = useState(defaultUserId ?? users[0]?.id ?? '');
  const [recurring, setRecurring] = useState(false);
  const [weeks, setWeeks] = useState<CycleWeek[]>([1]);
  const [months, setMonths] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<DebtStatus>('Pendente');

  // Ao trocar de mês, a data do formulário acompanha. Sem isto o lançamento
  // feito enquanto se olha outro mês nascia no mês de hoje e sumia da tela.
  const [formMonth, setFormMonth] = useState(monthKey);
  if (formMonth !== monthKey) {
    setFormMonth(monthKey);
    // Editando, a data é a do lançamento; trocar o mês não pode atropelá-la.
    if (!editingId) setDueDate(defaultDate);
  }

  const fecharForm = () => {
    setShowForm(false);
    setEditingId(null);
    setCreditor('');
    setDescription('');
    setInstallmentAmount('');
    setCurrentInstallment('1');
    setTotalInstallments('1');
    setStatus('Pendente');
    setRecurring(false);
    setDueDate(defaultDate);
  };

  const abrirNovo = () => {
    if (showForm && !editingId) { fecharForm(); return; }
    fecharForm();
    setShowForm(true);
  };

  const abrirEdicao = (item: DebtItem) => {
    setEditingId(item.id);
    setCreditor(item.creditor);
    setDescription(item.description);
    setInstallmentAmount(String(item.installmentAmount));
    setCurrentInstallment(String(item.currentInstallment));
    setTotalInstallments(String(item.totalInstallments));
    setDueDate(item.dueDate);
    setUserId(item.userId ?? '');
    setStatus(item.status);
    setRecurring(false);
    setShowForm(true);
  };

  const visible = selectedWeek === 'ALL' ? debts : debts.filter((d) => d.week === selectedWeek);
  const total = visible.reduce((a, d) => a + d.installmentAmount, 0);
  const pago = visible.filter((d) => d.status === 'Pago').reduce((a, d) => a + d.installmentAmount, 0);

  const toggleWeek = (w: CycleWeek) =>
    setWeeks((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort()));

  const parcelas = Math.max(1, parseInt(totalInstallments) || 1);
  const valorParcela = parseFloat(installmentAmount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditor.trim() || valorParcela <= 0) return;
    if (recurring && weeks.length === 0) return;

    const atual = Math.min(Math.max(1, parseInt(currentInstallment) || 1), parcelas);

    const base = {
      userId: userId || undefined,
      userName: users.find((u) => u.id === userId)?.name,
      creditor: creditor.trim(),
      description: description.trim() || 'Parcelamento',
      totalAmount: valorParcela * parcelas,
      installmentAmount: valorParcela,
      currentInstallment: atual,
      totalInstallments: parcelas,
      dueDate,
    };

    setSaving(true);
    try {
      if (editingId) {
        await onUpdateDebt(editingId, { ...base, status });
      } else {
        await onAddDebt({
          ...base,
          status: 'Pendente',
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
            <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Dívidas e parcelas</span>
            <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
              {visible.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ao quitar, a próxima parcela nasce no mês seguinte automaticamente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="text-xs bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl flex sm:block justify-between items-center">
            <span className="text-slate-500">Quitado / total:</span>
            <span className="ml-2 sm:ml-0 sm:block font-bold">
              <span className="text-slate-900">{formatBRL(pago)}</span>
              <span className="text-slate-400"> / {formatBRL(total)}</span>
            </span>
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova dívida</span>
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-4">
          {editingId && (
            <div className="flex items-center justify-between gap-2 -mb-1">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Editando esta dívida
              </span>
              <button type="button" onClick={fecharForm} title="Cancelar edição"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Credor">
              <input
                type="text" required autoFocus
                placeholder="Cartão Nubank, loja, empréstimo..."
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Descrição">
              <input
                type="text"
                placeholder="Parcela do iPhone"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Valor da parcela (R$)">
              <input
                type="number" step="0.01" min="0.01" required
                placeholder="300,00"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Vencimento">
              <input
                type="date" required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
              />
              {!recurring && (
                <span className="text-[10px] text-slate-500 mt-1 block">
                  cai na semana {cycleWeekOf(dueDate)}
                </span>
              )}
            </Field>

            <Field label="Parcela atual">
              <input
                type="number" min="1" max={parcelas}
                value={currentInstallment}
                onChange={(e) => setCurrentInstallment(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Total de parcelas">
              <input
                type="number" min="1"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                className={inputCls}
              />
            </Field>

            {editingId && (
              <Field label="Situação">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DebtStatus)}
                  className={inputCls}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Paga</option>
                  <option value="Atrasado">Atrasada</option>
                </select>
              </Field>
            )}

            {users.length > 1 && (
              <Field label="De quem é">
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
            )}
          </div>

          {valorParcela > 0 && (
            <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
              Total da dívida: <strong>{formatBRL(valorParcela * parcelas)}</strong>
              {' '}({parcelas}x de {formatBRL(valorParcela)})
            </p>
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

          <div className="flex justify-end gap-2">
            <button type="button" onClick={fecharForm} className={cancelCls}>Cancelar</button>
            <button
              type="submit"
              disabled={saving || (recurring && weeks.length === 0)}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-slate-100">
        {visible.map((item) => {
          const quitada = item.status === 'Pago';
          const ultima = item.currentInstallment >= item.totalInstallments;
          const progresso = Math.round((item.currentInstallment / item.totalInstallments) * 100);

          return (
            <div
              key={item.id}
              className={`py-3 px-2 rounded-xl space-y-2 ${quitada ? 'bg-slate-50/60' : 'hover:bg-slate-50'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-sm font-semibold ${quitada ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {item.creditor}
                    </span>
                    {item.userName && users.length > 1 && (
                      <Tag cls="bg-blue-50 text-blue-700 border-blue-200">
                        <User className="w-3 h-3" />{item.userName}
                      </Tag>
                    )}
                    <Tag cls="bg-slate-100 text-slate-600 border-slate-200">Sem. {item.week}</Tag>
                    <Tag cls={quitada
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'}>
                      {quitada ? 'quitada' : 'pendente'}
                    </Tag>
                    {item.seriesId && (
                      <Tag cls="bg-indigo-50 text-indigo-700 border-indigo-200">
                        <Repeat className="w-3 h-3" />recorrente
                      </Tag>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.description} · vence {formatBR(item.dueDate)}
                    {' '}· parcela {item.currentInstallment} de {item.totalInstallments}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="text-sm sm:text-base font-bold text-amber-700 whitespace-nowrap">
                    {formatBRL(item.installmentAmount)}
                  </span>

                  {!quitada && (
                    <button
                      onClick={() => onPayInstallment(item.id)}
                      title={ultima ? 'Quitar a última parcela' : 'Quitar e lançar a próxima no mês seguinte'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {ultima ? 'Quitar' : 'Pagar'}
                    </button>
                  )}

                  {quitada && (
                    <CircleCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}

                  <button
                    onClick={() => abrirEdicao(item)}
                    title="Editar valor, vencimento, parcelas..."
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteDebt(item.id)}
                    title="Excluir"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {item.totalInstallments > 1 && (
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${quitada ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${progresso}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            Nenhuma dívida neste período.
          </p>
        )}
      </div>
    </section>
  );
};
