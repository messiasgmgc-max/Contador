 import React, { useState } from 'react';
import type { DebtItem, UserProfile, RecurrenceFrequency } from '../types/finance';
import { Plus, Trash2, CreditCard, User, Repeat } from 'lucide-react';
import { RecurrenceSelector } from './RecurrenceSelector';

interface DebtManagerProps {
  debts: DebtItem[];
  users?: UserProfile[];
  onAddDebt: (item: Omit<DebtItem, 'id'>) => void;
  onPayInstallment: (id: string) => void;
  onDeleteDebt: (id: string) => void;
  selectedWeek: number | 'ALL';
}

export const DebtManager: React.FC<DebtManagerProps> = ({
  debts,
  users = [],
  onAddDebt,
  onPayInstallment,
  onDeleteDebt,
  selectedWeek,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [creditor, setCreditor] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [totalInstallments, setTotalInstallments] = useState('1');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [week, setWeek] = useState(1);
  const [userId, setUserId] = useState<string>(users[0]?.id || '');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('monthly');
  const [customWeeks, setCustomWeeks] = useState<number[]>([1, 2, 3]);

  const handleToggleWeek = (w: number) => {
    setCustomWeeks((prev) =>
      prev.includes(w) ? prev.filter((item) => item !== w) : [...prev, w].sort()
    );
  };

  const filteredDebts = selectedWeek === 'ALL'
    ? debts
    : debts.filter((d) => d.week === selectedWeek);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditor || !installmentAmount) return;

    const selectedUser = users.find((u) => u.id === userId);

    onAddDebt({
      userId: userId || undefined,
      userName: selectedUser?.name,
      creditor,
      description: description || 'Parcelamento',
      totalAmount: parseFloat(totalAmount) || (parseFloat(installmentAmount) * parseInt(totalInstallments)),
      installmentAmount: parseFloat(installmentAmount),
      currentInstallment: parseInt(currentInstallment) || 1,
      totalInstallments: parseInt(totalInstallments) || 1,
      dueDate,
      week,
      status: 'Pendente',
      isRecurring,
      recurrence: isRecurring ? recurrence : 'none',
      customWeeks: isRecurring && recurrence === 'custom_weeks' ? customWeeks : undefined,
    });

    setCreditor('');
    setDescription('');
    setTotalAmount('');
    setInstallmentAmount('');
    setIsRecurring(false);
    setShowAddForm(false);
  };

  const totalInstallmentInPeriod = filteredDebts.reduce((acc, curr) => acc + curr.installmentAmount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-rose-600" />
              <span>Dívidas & Contas a Pagar</span>
            </h3>
            <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2.5 py-0.5 rounded-full border border-rose-200">
              {filteredDebts.length} cadastradas
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Controle de cartões, empréstimos e parcelamentos organizados por semana.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="text-left sm:text-right flex sm:block justify-between items-center bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Total das Parcelas:</span>
            <span className="text-sm sm:text-base font-extrabold text-rose-600 ml-2 sm:ml-0">
              R$ {totalInstallmentInPeriod.toLocaleString('pt-BR')}
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-colors shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Dívida</span>
          </button>
        </div>
      </div>

      {/* Form Nova Dívida */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-4">
          <h4 className="text-sm font-bold text-rose-900">
            Cadastrar Nova Dívida ou Parcela
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Credor / Cartão:</label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank, Cartão, Banco..."
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-rose-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Descrição:</label>
              <input
                type="text"
                placeholder="Ex: Parcela celular, empréstimo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-rose-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Valor da Parcela (R$):</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="250.00"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-rose-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Semana Referência:</label>
              <input
                type="number"
                min="1"
                max="52"
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 focus:border-rose-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Parcela Atual:</label>
              <input
                type="number"
                min="1"
                value={currentInstallment}
                onChange={(e) => setCurrentInstallment(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-rose-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            {users.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Vincular a Pessoa:</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-rose-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Total de Parcelas:</label>
              <input
                type="number"
                min="1"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-rose-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Vencimento:</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-rose-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          <RecurrenceSelector
            isRecurring={isRecurring}
            onToggleRecurring={setIsRecurring}
            recurrence={recurrence}
            onChangeRecurrence={setRecurrence}
            selectedWeeks={customWeeks}
            onToggleWeek={handleToggleWeek}
            accentColor="rose"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-sm"
            >
              Salvar Dívida
            </button>
          </div>
        </form>
      )}

      {/* Lista de Dívidas */}
      <div className="divide-y divide-slate-100">
        {filteredDebts.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-3 rounded-xl hover:bg-slate-50 transition-colors gap-3"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-rose-600" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-slate-900">
                    {item.creditor}
                  </span>
                  {item.userName && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1 shrink-0">
                      <User className="w-3 h-3" />
                      {item.userName}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    • {item.description}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                    Semana {item.week}
                  </span>
                  {item.isRecurring && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1 shrink-0">
                      <Repeat className="w-3 h-3" />
                      Recorrente
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                  <span>
                    Parcela <strong className="text-slate-800">{item.currentInstallment}</strong> de <strong className="text-slate-800">{item.totalInstallments}</strong>
                  </span>
                  <span>• Vencimento: {new Date(item.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  {item.totalAmount > 0 && (
                    <span>• Restante total: R$ {(item.installmentAmount * (item.totalInstallments - item.currentInstallment + 1)).toLocaleString('pt-BR')}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Parcela:</span>
                <span className="text-base sm:text-lg font-bold text-rose-600">
                  R$ {item.installmentAmount.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPayInstallment(item.id)}
                  className="px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200 transition-colors cursor-pointer"
                  title="Avançar uma parcela paga"
                >
                  Pagar Parcela
                </button>
                <button
                  onClick={() => onDeleteDebt(item.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredDebts.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            Nenhuma dívida cadastrada.
          </p>
        )}
      </div>
    </div>
  );
};
