import React, { useState, useMemo } from 'react';
import type {
  DebtItem, UserProfile, NewDebt, EditDebt, DebtStatus, WeekNumber, MonthKey,
} from '../types/finance';
import { inputCls, cancelCls, Field, Tag } from './ui';
import { formatBRL, formatBR, cycleWeekOf, currentMonthKey, todayISO } from '../lib/period';
import { openGoogleCalendar } from '../lib/calendar';
import {
  Plus, Trash2, CreditCard, User, Check, Pencil, X, Calendar,
  CheckCircle2, Clock, Filter, AlertTriangle, Layers
} from 'lucide-react';

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

  // Filtros internos da página própria
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'DELAYED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CARD' | 'LOAN'>('ALL');

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

  // Filtragem
  const visible = useMemo(() => {
    return debts.filter((d) => {
      if (selectedWeek !== 'ALL' && d.week !== selectedWeek) return false;
      if (statusFilter === 'PAID' && d.status !== 'Pago') return false;
      if (statusFilter === 'PENDING' && d.status !== 'Pendente') return false;
      if (statusFilter === 'DELAYED' && d.status !== 'Atrasado') return false;
      if (typeFilter === 'CARD' && !d.isCard && !d.creditor.toLowerCase().includes('cartão') && !d.creditor.toLowerCase().includes('cartao')) return false;
      if (typeFilter === 'LOAN' && (d.isCard || d.creditor.toLowerCase().includes('cartão') || d.creditor.toLowerCase().includes('cartao'))) return false;
      return true;
    });
  }, [debts, selectedWeek, statusFilter, typeFilter]);

  const total = debts.reduce((a, d) => a + d.installmentAmount, 0);
  const pago = debts.filter((d) => d.status === 'Pago').reduce((a, d) => a + d.installmentAmount, 0);
  const atrasado = debts.filter((d) => d.status === 'Atrasado').reduce((a, d) => a + d.installmentAmount, 0);
  const pendente = total - pago;
  const pctQuitado = total > 0 ? Math.round((pago / total) * 100) : 0;

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
    <div className="space-y-6">
      {/* Hero Header Autônomo Pierre Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c160e] via-[#14120e] to-[#0c0a08] border border-amber-500/20 p-6 sm:p-8 shadow-2xl">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                Módulo de Dívidas & Financiamentos
              </span>
              <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                {debts.length} parcelas ativas
              </span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Gestão de Dívidas & Parcelas
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-lg">
                Controle empréstimos, carnês, boletos e compromissos parcelados de longo prazo com cálculo automático de parcelas restantes e juros.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black text-black bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 cursor-pointer transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>Nova Dívida</span>
          </button>
        </div>

        {/* Tiles Métricas Exclusivas de Dívidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="uppercase font-mono text-[10px]">Total de Parcelas</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {formatBRL(total)}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Compromisso total do mês</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="uppercase font-mono text-[10px] text-emerald-400 font-bold">Já Quitado ({pctQuitado}%)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {formatBRL(pago)}
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${pctQuitado}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="uppercase font-mono text-[10px] text-amber-400 font-bold">
                {atrasado > 0 ? 'Pendente + Atrasado' : 'A Vencer'}
              </span>
              {atrasado > 0 ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono ${atrasado > 0 ? 'text-rose-400' : 'text-amber-400'}`}>
              {formatBRL(pendente)}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              {atrasado > 0 ? `${formatBRL(atrasado)} vencidos!` : 'Aguardando vencimento'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de Cadastro/Edição Moderno */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-[#14141d] border border-amber-500/30 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {editingId ? 'Editar Parcela de Dívida' : 'Cadastrar Nova Dívida / Financiamento'}
                </h4>
                <span className="text-[11px] text-zinc-400">Preencha o credor, valor e número de parcelas</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Credor / Banco / Instituição">
              <input
                type="text" required autoFocus
                placeholder="Ex: Nubank, Banco Inter, Santander..."
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Identificação / Descrição">
              <input
                type="text"
                placeholder="Ex: Financiamento Carro, Reforma, Empréstimo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Valor da Parcela (R$)">
              <input
                type="number" step="0.01" min="0.01" required
                placeholder="350,00"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Parcela Atual">
              <input
                type="number" min="1" max={parcelas}
                value={currentInstallment}
                onChange={(e) => setCurrentInstallment(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Total de Parcelas">
              <input
                type="number" min="1"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Data de Vencimento desta Parcela">
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
              <Field label="Titular / Responsável">
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
              className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-black text-black bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-50 cursor-pointer transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
            >
              {saving ? 'Gravando no Banco...' : editingId ? 'Salvar Alterações' : 'Confirmar Dívida'}
            </button>
          </div>
        </form>
      )}

      {/* Filtros Rápidos */}
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
            Todas ({debts.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-black'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            A Vencer
          </button>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'PAID'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            Quitadas
          </button>
          <button
            onClick={() => setStatusFilter('DELAYED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'DELAYED'
                ? 'bg-rose-500 text-white'
                : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            Atrasadas
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-all ${
              typeFilter === 'ALL' ? 'bg-[#ccff00]/20 text-[#ccff00]' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Todos Tipos
          </button>
          <button
            onClick={() => setTypeFilter('LOAN')}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-all ${
              typeFilter === 'LOAN' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Só Empréstimos/Boletos
          </button>
          <button
            onClick={() => setTypeFilter('CARD')}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-all ${
              typeFilter === 'CARD' ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            💳 Fatura Cartão
          </button>
        </div>
      </div>

      {/* Lista de Dívidas em Cartões Elegantes */}
      <div className="space-y-3">
        {visible.map((item) => {
          const isPago = item.status === 'Pago';
          const isAtrasado = item.status === 'Atrasado';

          return (
            <div
              key={item.id}
              className={`group rounded-3xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isPago
                  ? 'bg-[#14141b]/90 border-white/5 opacity-80 hover:opacity-100 hover:border-emerald-500/30'
                  : isAtrasado
                  ? 'bg-[#1e1315] border-rose-500/40 shadow-lg'
                  : 'bg-[#181824] border-white/10 hover:border-amber-500/30 shadow-lg'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <button
                  onClick={() => onPayInstallment(item.id)}
                  title={isPago ? 'Marcar como não quitado' : 'Marcar parcela como quitada'}
                  className={`w-9 h-9 shrink-0 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${
                    isPago
                      ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : isAtrasado
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                      : 'border-white/20 bg-white/5 hover:border-amber-400 text-transparent hover:text-amber-400'
                  }`}
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                </button>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-base font-bold tracking-tight ${isPago ? 'text-zinc-400 line-through' : 'text-white'}`}>
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
                    <Tag cls="bg-amber-500/10 text-amber-400 border-amber-500/20 font-mono font-bold">
                      Parcela {item.currentInstallment}/{item.totalInstallments}
                    </Tag>
                    <Tag cls="bg-white/5 text-zinc-400 border-white/10 font-mono">
                      Semana {item.week}
                    </Tag>
                    {item.userName && users.length > 1 && (
                      <Tag cls="bg-white/5 text-zinc-300 border-white/10">
                        <User className="w-3 h-3" />{item.userName}
                      </Tag>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>Vencimento: <strong className="text-zinc-300 font-mono">{formatBR(item.dueDate)}</strong></span>
                    <span>•</span>
                    <span>Total contratado: <strong className="text-zinc-300 font-mono">{formatBRL(item.totalAmount)}</strong></span>
                    <span>•</span>
                    {isPago ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Quitado
                      </span>
                    ) : isAtrasado ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Atrasado!
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Pendente de pagamento
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0 border-t sm:border-0 border-white/5 pt-2 sm:pt-0">
                <div className="text-right">
                  <span className={`text-base sm:text-xl font-black font-mono block ${isPago ? 'text-zinc-400' : 'text-amber-400'}`}>
                    − {formatBRL(item.installmentAmount)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase">
                    {item.totalInstallments > 1 ? `${item.totalInstallments - item.currentInstallment} parcelas restam` : 'Parcela única'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openGoogleCalendar({
                      title: `Parcela: ${item.creditor} (${item.currentInstallment}/${item.totalInstallments})`,
                      description: `Vencimento de dívida no Fluxo Financeiro.\nCredor: ${item.creditor}\nValor: ${formatBRL(item.installmentAmount)}\nSituação: ${item.status}`,
                      startDate: item.dueDate,
                    })}
                    title="Sincronizar com Google Agenda"
                    className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => abrirEdicao(item)}
                    title="Editar Parcela"
                    className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteDebt(item.id)}
                    title="Excluir"
                    className="p-2.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-[#14141b] border border-white/5 space-y-2">
            <CreditCard className="w-10 h-10 text-zinc-600 mx-auto stroke-[1.5]" />
            <h4 className="text-sm font-bold text-white">Nenhuma dívida encontrada</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Não há parcelas ou dívidas para os filtros selecionados neste mês. Toque em "Nova Dívida" para registrar parcelamentos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
