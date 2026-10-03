import React, { useState } from 'react';
import type { DebtItem, UserProfile, NewDebt, EditDebt, MonthKey, WeekNumber } from '../types/finance';
import { inputCls, cancelCls, Field, Tag } from './ui';
import { formatBRL, formatBR, cycleWeekOf, currentMonthKey, todayISO } from '../lib/period';
import { openGoogleCalendar } from '../lib/calendar';
import {
  CreditCard, Check, Trash2, Pencil, Calendar,
  RefreshCw, Layers, ShieldCheck
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

type CardPurchaseType = 'plano' | 'compra_mes' | 'parcelada';

export const CardManager: React.FC<Props> = ({
  debts,
  users,
  monthKey,
  defaultUserId,
  selectedWeek,
  onAddDebt,
  onUpdateDebt,
  onPayInstallment,
  onDeleteDebt,
}) => {
  const defaultDate = monthKey === currentMonthKey() ? todayISO() : `${monthKey}-01`;

  // Identificar todas as dívidas que pertencem a Cartão
  const cardDebts = debts.filter((d) => d.isCard || d.creditor.toLowerCase().includes('cartão') || d.creditor.toLowerCase().includes('cartao'));

  const [showForm, setShowForm] = useState(false);
  const [purchaseType, setPurchaseType] = useState<CardPurchaseType>('compra_mes');
  const [cardName, setCardName] = useState('Cartão de Crédito');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState('1');
  const [dueDate, setDueDate] = useState(defaultDate);
  const [userId, setUserId] = useState(defaultUserId ?? users[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtro interno
  const [typeFilter, setTypeFilter] = useState<CardPurchaseType | 'ALL'>('ALL');

  const visible = cardDebts.filter((d) => {
    if (selectedWeek !== 'ALL' && d.week !== selectedWeek) return false;
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'plano' && d.cardType !== 'plano') return false;
      if (typeFilter === 'compra_mes' && d.cardType !== 'compra_mes' && d.totalInstallments !== 1) return false;
      if (typeFilter === 'parcelada' && d.cardType !== 'parcelada' && d.totalInstallments <= 1) return false;
    }
    return true;
  });

  const totalFatura = visible.reduce((a, d) => a + d.installmentAmount, 0);
  const totalPago = visible.filter((d) => d.status === 'Pago').reduce((a, d) => a + d.installmentAmount, 0);
  const totalPendente = totalFatura - totalPago;

  const fecharForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDescription('');
    setAmount('');
    setInstallments('1');
    setDueDate(defaultDate);
    setPurchaseType('compra_mes');
  };

  const abrirNovo = (tipo: CardPurchaseType = 'compra_mes') => {
    setPurchaseType(tipo);
    if (tipo === 'plano') {
      setInstallments('12'); // Cria recorrência anual por padrão
    } else if (tipo === 'compra_mes') {
      setInstallments('1');
    } else {
      setInstallments('3');
    }
    setShowForm(true);
  };

  const abrirEdicao = (item: DebtItem) => {
    setEditingId(item.id);
    setCardName(item.cardName ?? item.creditor);
    setDescription(item.description);
    setAmount(String(item.installmentAmount));
    setInstallments(String(item.totalInstallments));
    setDueDate(item.dueDate);
    setUserId(item.userId ?? '');
    setPurchaseType(item.cardType ?? (item.totalInstallments > 1 ? 'parcelada' : 'compra_mes'));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!description.trim() || !Number.isFinite(val) || val <= 0) return;

    const numParcelas = purchaseType === 'compra_mes' ? 1 : Math.max(1, parseInt(installments) || 1);
    const cName = cardName.trim() || 'Cartão de Crédito';

    const baseData: NewDebt = {
      userId: userId || undefined,
      userName: users.find((u) => u.id === userId)?.name,
      creditor: cName,
      description: description.trim(),
      totalAmount: val * numParcelas,
      installmentAmount: val,
      currentInstallment: 1,
      totalInstallments: numParcelas,
      dueDate,
      status: 'Pendente',
      isCard: true,
      cardName: cName,
      cardType: purchaseType,
      recurrence: numParcelas > 1 ? { weeks: [cycleWeekOf(dueDate)], months: numParcelas } : undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await onUpdateDebt(editingId, {
          userId: baseData.userId,
          userName: baseData.userName,
          creditor: baseData.creditor,
          description: baseData.description,
          totalAmount: baseData.totalAmount,
          installmentAmount: baseData.installmentAmount,
          currentInstallment: 1,
          totalInstallments: baseData.totalInstallments,
          dueDate: baseData.dueDate,
          status: 'Pendente',
          isCard: true,
          cardName: cName,
          cardType: purchaseType,
        });
      } else {
        await onAddDebt(baseData);
      }
      fecharForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual do Cartão Físico Luxury Dark + Informações da Fatura */}
      <div className="rounded-3xl bg-gradient-to-r from-zinc-950 via-[#14141d] to-[#0c0c10] border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        {/* Glow suave */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#ccff00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Informações da Fatura & Resumo */}
        <div className="space-y-3 z-10 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 font-mono">
              Fatura & Cartões
            </span>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Integrado a Dívidas
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gestão de Cartão de Crédito
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-md">
              Cadastre assinaturas mensais, compras do mês e compras parceladas. Tudo é automaticamente computado como <strong>Dívida do Cartão</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Fatura do Mês</span>
              <span className="text-lg font-black text-white font-mono">
                {formatBRL(totalFatura)}
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Já Pago</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {formatBRL(totalPago)}
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Pendente</span>
              <span className="text-lg font-black text-amber-400 font-mono">
                {formatBRL(totalPendente)}
              </span>
            </div>
          </div>
        </div>

        {/* O Cartão de Crédito Físico (Mastercard Black Style) */}
        <div className="w-full sm:w-80 h-48 rounded-2xl bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border border-white/20 p-5 shadow-2xl flex flex-col justify-between relative shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-black tracking-widest uppercase italic text-zinc-100">
                FLUXO CARD
              </span>
              <span className="block text-[9px] text-[#ccff00] font-mono font-bold tracking-widest mt-0.5">
                BLACK EDITION
              </span>
            </div>
            {/* Logos de bandeira */}
            <div className="flex items-center">
              <div className="w-7 h-7 rounded-full bg-rose-500/85 -mr-2.5 shadow-sm" />
              <div className="w-7 h-7 rounded-full bg-amber-500/85 shadow-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest">
              Total Fatura
            </span>
            <div className="text-2xl font-black text-white tracking-tight font-mono">
              {formatBRL(totalFatura)}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span className="tracking-widest">•••• •••• •••• 8842</span>
            <span className="text-zinc-200 font-sans font-semibold truncate max-w-[120px]">
              {users.find((u) => u.id === (defaultUserId ?? userId))?.name ?? 'Titular'}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Botões de Ação para Cadastrar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => abrirNovo('plano')}
          className="p-4 rounded-3xl bg-[#14141b] border border-white/10 hover:border-purple-500/40 text-left transition-all hover:bg-white/[0.02] cursor-pointer group space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-4 h-4" />
            </span>
            <span className="text-[10px] text-purple-400 uppercase font-mono font-bold">Mensalidade</span>
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-purple-300">
            + Plano / Assinatura
          </h4>
          <p className="text-[11px] text-zinc-400">
            Netflix, Spotify, iCloud, academia cobrados todo mês no cartão.
          </p>
        </button>

        <button
          onClick={() => abrirNovo('compra_mes')}
          className="p-4 rounded-3xl bg-[#14141b] border border-white/10 hover:border-emerald-500/40 text-left transition-all hover:bg-white/[0.02] cursor-pointer group space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Check className="w-4 h-4" />
            </span>
            <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">À Vista 1x</span>
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-emerald-300">
            + Compra do Mês
          </h4>
          <p className="text-[11px] text-zinc-400">
            Compras de 1 parcela na fatura corrente sem desdobramento.
          </p>
        </button>

        <button
          onClick={() => abrirNovo('parcelada')}
          className="p-4 rounded-3xl bg-[#14141b] border border-white/10 hover:border-[#ccff00]/40 text-left transition-all hover:bg-white/[0.02] cursor-pointer group space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-[10px] text-[#ccff00] uppercase font-mono font-bold">Parcelado</span>
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-[#ccff00]">
            + Compra Parcelada
          </h4>
          <p className="text-[11px] text-zinc-400">
            Compras em 2x, 3x, 10x que geram parcelas futuras nas dívidas.
          </p>
        </button>
      </div>

      {/* Formulário de Cadastro / Edição */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-[#181822] border border-white/15 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#ccff00]" />
              {editingId ? 'Editar Lançamento do Cartão' : `Cadastrar: ${
                purchaseType === 'plano' ? 'Plano / Assinatura Mensal' :
                purchaseType === 'compra_mes' ? 'Compra à Vista no Cartão' :
                'Compra Parcelada no Cartão'
              }`}
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/20 px-2 py-0.5 rounded-full font-bold">
                Entra como Dívida do Cartão
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Nome do Cartão / Banco">
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Ex: Nubank, Inter, Mastercard Black"
                className={inputCls}
              />
            </Field>

            <Field label="Descrição da Compra / Serviço">
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={purchaseType === 'plano' ? 'Ex: Netflix, Spotify, Academia' : 'Ex: Celular, Tênis, Mercado'}
                className={inputCls}
              />
            </Field>

            <Field label={purchaseType === 'parcelada' ? 'Valor de cada Parcela (R$)' : 'Valor (R$)'}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className={inputCls}
              />
            </Field>

            {purchaseType !== 'compra_mes' && (
              <Field label={purchaseType === 'plano' ? 'Meses de vigência' : 'Total de Parcelas'}>
                <input
                  type="number"
                  min="1"
                  max="72"
                  required
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className={inputCls}
                />
              </Field>
            )}

            <Field label="Data de Vencimento da Fatura">
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
              />
            </Field>

            {users.length > 1 && (
              <Field label="Quem comprou">
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className={inputCls}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#181822] text-white">
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
            <button type="button" onClick={fecharForm} className={cancelCls}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-black bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-50 cursor-pointer transition-all"
            >
              {saving ? 'Gravando...' : editingId ? 'Salvar Alterações' : 'Confirmar no Cartão'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Compras do Cartão */}
      <div className="bg-[#14141b] rounded-3xl border border-white/5 shadow-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Lançamentos da Fatura</span>
            <span className="text-xs bg-white/5 text-zinc-400 font-mono px-2 py-0.5 rounded-full border border-white/10">
              {visible.length}
            </span>
          </div>

          {/* Filtro por tipo */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['ALL', 'plano', 'compra_mes', 'parcelada'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  typeFilter === t
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white'
                }`}
              >
                {t === 'ALL' ? 'Todos' : t === 'plano' ? 'Planos / Assinaturas' : t === 'compra_mes' ? 'Compras do Mês' : 'Parceladas'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {visible.map((item) => {
            const isPago = item.status === 'Pago';
            const isAtrasado = item.status === 'Atrasado';

            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-3 rounded-2xl gap-2 transition-all ${
                  isPago ? 'bg-white/[0.01] opacity-75' : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <button
                    onClick={() => onPayInstallment(item.id)}
                    title={isPago ? 'Fatura/parcela quitada' : 'Quitar esta parcela da fatura'}
                    className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                      isPago
                        ? 'bg-emerald-500 border-emerald-500 text-black font-bold shadow-xs'
                        : isAtrasado
                        ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                        : 'border-white/20 hover:border-[#ccff00] text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-sm font-bold ${isPago ? 'text-zinc-500 line-through' : 'text-white'}`}>
                        {item.description}
                      </span>

                      <Tag cls="bg-purple-500/15 text-purple-300 border-purple-500/30 font-semibold">
                        <CreditCard className="w-3 h-3 text-purple-400" />
                        {item.creditor}
                      </Tag>

                      {item.cardType === 'plano' ? (
                        <Tag cls="bg-blue-500/10 text-blue-400 border-blue-500/20 font-mono">
                          Assinatura
                        </Tag>
                      ) : item.totalInstallments > 1 ? (
                        <Tag cls="bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20 font-mono">
                          {item.currentInstallment}/{item.totalInstallments}x
                        </Tag>
                      ) : (
                        <Tag cls="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono">
                          1x à vista
                        </Tag>
                      )}

                      {item.userName && users.length > 1 && (
                        <Tag cls="bg-white/5 text-zinc-300 border-white/10">
                          {item.userName}
                        </Tag>
                      )}
                    </div>

                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      Vencimento {formatBR(item.dueDate)} · Total: {formatBRL(item.totalAmount)}
                      {isPago ? (
                        <span className="text-emerald-400 font-semibold"> · quitado na fatura</span>
                      ) : isAtrasado ? (
                        <span className="text-rose-400 font-semibold"> · fatura vencida</span>
                      ) : (
                        <span className="text-amber-400 font-semibold"> · na fatura aberta</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pl-10 sm:pl-0">
                  <span className="text-sm sm:text-base font-black text-white font-mono whitespace-nowrap">
                    {formatBRL(item.installmentAmount)}
                  </span>

                  <button
                    onClick={() => openGoogleCalendar({
                      title: `Fatura Cartão: ${item.description}`,
                      description: `Vencimento de compra no cartão no Fluxo Financeiro.\nItem: ${item.description}\nCartão: ${item.creditor}\nValor: ${formatBRL(item.installmentAmount)}`,
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
            <div className="text-center py-10 space-y-2">
              <CreditCard className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-400 font-medium">
                Nenhum lançamento no cartão neste mês.
              </p>
              <p className="text-xs text-zinc-500">
                Use os botões acima para adicionar assinaturas, compras à vista ou parceladas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
