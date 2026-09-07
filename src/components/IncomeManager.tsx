import React, { useState } from 'react';
import type { IncomeItem, UserProfile, RecurrenceFrequency } from '../types/finance';
import { RecurrenceSelector } from './RecurrenceSelector';
import { Plus, Check, Trash2, Calendar, ArrowUpRight, User, Repeat } from 'lucide-react';

interface IncomeManagerProps {
  incomes: IncomeItem[];
  users?: UserProfile[];
  onAddIncome: (item: Omit<IncomeItem, 'id'>) => void;
  onToggleReceived: (id: string) => void;
  onDeleteIncome: (id: string) => void;
  selectedWeek: number | 'ALL';
}

export const IncomeManager: React.FC<IncomeManagerProps> = ({
  incomes,
  users = [],
  onAddIncome,
  onToggleReceived,
  onDeleteIncome,
  selectedWeek,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [week, setWeek] = useState(1);
  const [category, setCategory] = useState<IncomeItem['category']>('Salario');
  const [userId, setUserId] = useState<string>(users[0]?.id || '');

  // Estados de Recorrência
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('monthly');
  const [customWeeks, setCustomWeeks] = useState<number[]>([1, 2, 3]);

  const handleToggleWeek = (wk: number) => {
    setCustomWeeks((prev) =>
      prev.includes(wk) ? prev.filter((w) => w !== wk) : [...prev, wk].sort()
    );
  };

  const filteredIncomes = selectedWeek === 'ALL'
    ? incomes
    : incomes.filter((i) => i.week === selectedWeek);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const selectedUser = users.find((u) => u.id === userId);

    onAddIncome({
      userId: userId || undefined,
      userName: selectedUser?.name,
      description,
      amount: parseFloat(amount),
      expectedDate,
      week,
      category,
      received: false,
      isRecurring,
      recurrence: isRecurring ? recurrence : 'none',
      customWeeks: isRecurring && recurrence === 'custom_weeks' ? customWeeks : undefined,
    });

    setDescription('');
    setAmount('');
    setIsRecurring(false);
    setShowAddForm(false);
  };

  const totalFiltered = filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalReceived = filteredIncomes.filter(i => i.received).reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="w-6 h-6 text-blue-600" />
              <span>Recebimentos Semanais & Rendas</span>
            </h3>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              {filteredIncomes.length} cadastrados
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lance cada valor que você vai receber na semana ou configure recebimentos recorrentes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="text-left sm:text-right flex sm:block justify-between items-center bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Recebido / Total:</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 ml-2 sm:ml-0">
              <span className="text-emerald-600 font-extrabold">R$ {totalReceived.toLocaleString('pt-BR')}</span> / R$ {totalFiltered.toLocaleString('pt-BR')}
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Recebimento</span>
          </button>
        </div>
      </div>

      {/* Formulário Novo Recebimento */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4">
          <h4 className="text-sm font-bold text-blue-900">
            Cadastrar Novo Recebimento
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Descrição:</label>
              <input
                type="text"
                required
                placeholder="Ex: Salário semanal, freela, comissão..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Valor (R$):</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="1200.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            {users.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Vincular a Pessoa:</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm cursor-pointer"
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Categoria:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncomeItem['category'])}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm cursor-pointer"
              >
                <option value="Salario">Salário</option>
                <option value="Adiantamento">Adiantamento</option>
                <option value="Vale">Vale</option>
                <option value="Comissao">Comissão</option>
                <option value="Diaria">Diária</option>
                <option value="Extra">Extra</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Data de Início/Vencimento:</label>
              <input
                type="date"
                required
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            {!isRecurring && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Semana Referência:</label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={week}
                  onChange={(e) => setWeek(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Componente de Recorrência */}
          <RecurrenceSelector
            isRecurring={isRecurring}
            onToggleRecurring={setIsRecurring}
            recurrence={recurrence}
            onChangeRecurrence={setRecurrence}
            selectedWeeks={customWeeks}
            onToggleWeek={handleToggleWeek}
            accentColor="blue"
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
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm"
            >
              {isRecurring ? 'Salvar Lançamentos Recorrentes' : 'Salvar Recebimento'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Recebimentos */}
      <div className="divide-y divide-slate-100">
        {filteredIncomes.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-3 rounded-xl transition-colors gap-3 ${
              item.received ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <button
                onClick={() => onToggleReceived(item.id)}
                title={item.received ? 'Marcar como pendente' : 'Marcar como recebido'}
                className={`w-7 h-7 mt-0.5 sm:mt-0 shrink-0 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  item.received
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 hover:border-blue-500 text-transparent'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-base font-semibold truncate ${item.received ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {item.description}
                  </span>
                  {item.userName && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1 shrink-0">
                      <User className="w-3 h-3" />
                      {item.userName}
                    </span>
                  )}
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium shrink-0">
                    Semana {item.week}
                  </span>
                  {item.isRecurring && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold flex items-center gap-1 shrink-0">
                      <Repeat className="w-3 h-3" />
                      Recorrente
                    </span>
                  )}
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    item.received ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {item.received ? 'Recebido' : 'Aguardando'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(item.expectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                  {item.category && (
                    <span>• {item.category}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pl-10 sm:pl-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className="text-base sm:text-lg font-bold text-emerald-600">
                + R$ {item.amount.toLocaleString('pt-BR')}
              </span>
              <button
                onClick={() => onDeleteIncome(item.id)}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredIncomes.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            Nenhum recebimento cadastrado.
          </p>
        )}
      </div>
    </div>
  );
};
