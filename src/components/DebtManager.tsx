import React, { useState } from 'react';
import type {
  DebtItem, UserProfile, NewDebt, EditDebt, DebtStatus, WeekNumber, MonthKey,
} from '../types/finance';
import { inputCls, cancelCls, Field, Tag } from './ui';
import { formatBRL, formatBR, cycleWeekOf, currentMonthKey, todayISO } from '../lib/period';
import { openGoogleCalendar } from '../lib/calendar';
import { Plus, Trash2, CreditCard, User, Check, Pencil, X, Calendar } from 'lucide-react';

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
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<DebtStatus>('Pendente');

  const [formMonth, setFormMonth] = useState(monthKey);
  if (formMonth !== monthKey) {
    setFormMonth(monthKey);
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
    setShowForm(true);
  };

  const visible = selectedWeek === 'ALL' ? debts : debts.filter((d) => d.week === selectedWeek);
  const total = visible.reduce((a, d) => a + d.installmentAmount, 0);
  const pago = visible.filter((d) => d.status === 'Pago').reduce((a, d) => a + d.installmentAmount, 0);

  const parcelas = Math.max(1, parseInt(totalInstallments) || 1);
  const valorParcela = parseFloat(installmentAmount) || 0;
  const atual = Math.min(Math.max(1, parseInt(currentInstallment) || 1), parcelas);
  const parcelasRestantes = parcelas - atual + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditor.trim() || valorParcela <= 0) return;

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
          status,
          recurrence: parcelasRestantes > 1 ? { weeks: [cycleWeekOf(dueDate)], months: parcelasRestantes } : undefined,
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
            <CreditCard className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Dívidas & Financiamentos</span>
            <span className="text-xs bg-amber-500/10 text-amber-400 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
              {visible.length}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cartões, empréstimos e carnês parcelados mês a mês.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="text-xs bg-white/[0.03] sm:bg-transparent p-2.5 sm:p-0 rounded-2xl flex sm:block justify-between items-center border border-white/5 sm:border-0">
            <span className="text-zinc-500">Quitado / Total:</span>
            <span className="ml-2 sm:ml-0 sm:block font-bold">
              <span className="text-white font-mono">{formatBRL(pago)}</span>
              <span className="text-zinc-500 font-mono"> / {formatBRL(total)}</span>
            </span>
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-black bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 cursor-pointer transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Dívida</span>
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-2xl bg-[#181822] border border-white/10 space-y-4">
          {editingId && (
            <div className="flex items-center justify-between gap-2 -mb-1">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Editando esta parcela
              </span>
              <button type="button" onClick={fecharForm} title="Cancelar edição"
                className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Credor / Banco">
              <input
                type="text" required autoFocus
                placeholder="Nubank, Inter, Empréstimo..."
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Identificação">
              <input
                type="text"
                placeholder="Ex: Celular, Carro, Reforma..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Valor da parcela (R$)">
              <input
                type="number" step="0.01" min="0.01" required
                placeholder="350,00"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                className={inputCls}
              />
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

            <Field label="Vencimento desta parcela">
              <input
                type="date" required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
              />
              <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                Semana {cycleWeekOf(dueDate)} calculada
              </span>
            </Field>

            {users.length > 1 && (
              <Field label="De quem é">
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
                  {users.map((u) => <option key={u.id} value={u.id} className="bg-[#181822] text-white">{u.name}</option>)}
                </select>
              </Field>
            )}

            {editingId && (
              <Field label="Situação">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DebtStatus)}
                  className={inputCls}
                >
                  <option value="Pendente" className="bg-[#181822] text-white">Pendente</option>
                  <option value="Pago" className="bg-[#181822] text-white">Pago</option>
                  <option value="Atrasado" className="bg-[#181822] text-white">Atrasado</option>
                </select>
              </Field>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button type="button" onClick={fecharForm} className={cancelCls}>Cancelar</button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-black bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-50 cursor-pointer transition-all"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Confirmar Dívida'}
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-white/5">
        {visible.map((item) => {
          const isPago = item.status === 'Pago';
          const isAtrasado = item.status === 'Atrasado';

          return (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 px-3 rounded-2xl gap-2 transition-all ${
                isPago ? 'bg-white/[0.01] opacity-75' : 'hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <button
                  onClick={() => onPayInstallment(item.id)}
                  title={isPago ? 'Parcela quitada' : 'Pagar esta parcela'}
                  className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                    isPago
                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                      : isAtrasado
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                      : 'border-white/20 hover:border-amber-400 text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-sm font-bold ${isPago ? 'text-zinc-500 line-through' : 'text-white'}`}>
                      {item.creditor}
                    </span>
                    {item.isCard && (
                      <Tag cls="bg-purple-500/15 text-purple-300 border-purple-500/30 font-semibold">
                        <CreditCard className="w-3 h-3 text-purple-400" />
                        {item.cardType === 'plano' ? 'Plano / Assinatura' : item.cardType === 'compra_mes' ? 'Compra do Mês' : 'Dívida do Cartão'}
                      </Tag>
                    )}
                    {item.description && item.description !== 'Parcelamento' && (
                      <span className="text-xs text-zinc-400">· {item.description}</span>
                    )}
                    {item.userName && users.length > 1 && (
                      <Tag cls="bg-white/5 text-zinc-300 border-white/10">
                        <User className="w-3 h-3" />{item.userName}
                      </Tag>
                    )}
                    <Tag cls="bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20 font-mono">
                      {item.currentInstallment}/{item.totalInstallments}
                    </Tag>
                    <Tag cls="bg-white/5 text-zinc-400 border-white/10 font-mono">Sem. {item.week}</Tag>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Vencimento {formatBR(item.dueDate)} · Total: {formatBRL(item.totalAmount)}
                    {isPago ? (
                      <span className="text-emerald-400 font-semibold"> · quitado</span>
                    ) : isAtrasado ? (
                      <span className="text-rose-400 font-semibold"> · atrasado</span>
                    ) : (
                      <span className="text-amber-400 font-semibold"> · pendente</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pl-10 sm:pl-0">
                <span className="text-sm sm:text-base font-black text-amber-400 font-mono whitespace-nowrap">
                  − {formatBRL(item.installmentAmount)}
                </span>
                <button
                  onClick={() => openGoogleCalendar({
                    title: `Parcela: ${item.creditor} (${item.currentInstallment}/${item.totalInstallments})`,
                    description: `Vencimento de parcela no Fluxo Financeiro.\nCredor: ${item.creditor}\nValor: ${formatBRL(item.installmentAmount)}\nSituação: ${item.status}`,
                    startDate: item.dueDate,
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
                  onClick={() => onDeleteDebt(item.id)}
                  title="Excluir"
                  className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-8 font-medium">
            Nenhuma dívida registrada para este mês.
          </p>
        )}
      </div>
    </section>
  );
};
