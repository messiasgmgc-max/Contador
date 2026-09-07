 import React, { useState } from 'react';
import type { ExpenseItem, WeekNumber, UserProfile, RecurrenceFrequency } from '../types/finance';
import { Plus, Check, Trash2, Calendar, ShoppingBag, Home, Car, Coffee, HeartPulse, Zap, MoreHorizontal, User, Repeat } from 'lucide-react';
import { RecurrenceSelector } from './RecurrenceSelector';

interface ExpenseManagerProps {
  expenses: ExpenseItem[];
  users?: UserProfile[];
  onAddExpense: (item: Omit<ExpenseItem, 'id'>) => void;
  onTogglePaid: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  selectedWeek: WeekNumber | 'ALL';
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  expenses,
  users = [],
  onAddExpense,
  onTogglePaid,
  onDeleteExpense,
  selectedWeek,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [week, setWeek] = useState(1);
  const [category, setCategory] = useState<ExpenseItem['category']>('Alimentacao');
  const [userId, setUserId] = useState<string>(users[0]?.id || '');
  const [isFixed, setIsFixed] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('monthly');
  const [customWeeks, setCustomWeeks] = useState<number[]>([1, 2, 3]);

  const handleToggleWeek = (w: number) => {
    setCustomWeeks((prev) =>
      prev.includes(w) ? prev.filter((item) => item !== w) : [...prev, w].sort()
    );
  };

  const filteredExpenses = selectedWeek === 'ALL'
    ? expenses
    : expenses.filter((e) => e.week === selectedWeek);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const selectedUser = users.find((u) => u.id === userId);

    onAddExpense({
      userId: userId || undefined,
      userName: selectedUser?.name,
      description,
      amount: parseFloat(amount),
      date,
      week,
      category,
      isFixed: isFixed || isRecurring,
      paid: false,
      isRecurring,
      recurrence: isRecurring ? recurrence : 'none',
      customWeeks: isRecurring && recurrence === 'custom_weeks' ? customWeeks : undefined,
    });

    setDescription('');
    setAmount('');
    setIsRecurring(false);
    setIsFixed(false);
    setShowAddForm(false);
  };

  const getCategoryIcon = (cat: ExpenseItem['category']) => {
    switch (cat) {
      case 'Alimentacao': return <ShoppingBag className="w-4 h-4 text-orange-600" />;
      case 'Moradia': return <Home className="w-4 h-4 text-blue-600" />;
      case 'Transporte': return <Car className="w-4 h-4 text-amber-600" />;
      case 'Lazer': return <Coffee className="w-4 h-4 text-purple-600" />;
      case 'Saude': return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case 'Servicos': return <Zap className="w-4 h-4 text-amber-500" />;
      default: return <MoreHorizontal className="w-4 h-4 text-slate-500" />;
    }
  };

  const totalFiltered = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = filteredExpenses.filter((e) => e.paid).reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <span>Controle de Gastos & Despesas</span>
            </h3>
            <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              {filteredExpenses.length} lançamentos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lançamento de contas fixas e gastos do dia a dia por semana e data.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="text-left sm:text-right flex sm:block justify-between items-center bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Pago / Total:</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 ml-2 sm:ml-0">
              R$ {totalPaid.toLocaleString('pt-BR')} <span className="text-slate-400 text-xs">/ R$ {totalFiltered.toLocaleString('pt-BR')}</span>
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Gasto</span>
          </button>
        </div>
      </div>

      {/* Form Novo Gasto */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-blue-200 space-y-4 animate-in fade-in duration-200">
          <h4 className="text-sm font-bold uppercase tracking-wider text-blue-700">
            Adicionar Novo Gasto ou Despesa Fixa
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Descrição:</label>
              <input
                type="text"
                required
                placeholder="Ex: Mercado, Conta de Luz, Combustível..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Valor (R$):</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="150.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            {users.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Vincular a Pessoa:</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none cursor-pointer shadow-sm"
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
                onChange={(e) => setCategory(e.target.value as ExpenseItem['category'])}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none cursor-pointer shadow-sm"
              >
                <option value="Alimentacao">Alimentação / Mercado</option>
                <option value="Moradia">Moradia / Aluguel</option>
                <option value="Transporte">Transporte / Combustível</option>
                <option value="Servicos">Luz / Água / Internet</option>
                <option value="Saude">Saúde / Farmácia</option>
                <option value="Lazer">Lazer / Restaurantes</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Data:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Semana Referência:</label>
              <select
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none cursor-pointer shadow-sm"
              >
                <option value={1}>Semana 1</option>
                <option value={2}>Semana 2</option>
                <option value={3}>Semana 3</option>
                <option value={4}>Semana 4</option>
              </select>
            </div>
          </div>

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
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              Salvar Gasto
            </button>
          </div>
        </form>
      )}

      {/* Lista de Gastos */}
      <div className="space-y-2">
        {filteredExpenses.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
              item.paid
                ? 'bg-slate-50 border-slate-200 opacity-60'
                : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <button
                onClick={() => onTogglePaid(item.id)}
                title={item.paid ? 'Marcar como pendente' : 'Marcar como pago'}
                className={`w-7 h-7 mt-0.5 sm:mt-0 shrink-0 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  item.paid
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 hover:border-blue-500 text-transparent'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="p-1.5 rounded-md bg-slate-100 shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <span className={`text-base font-semibold truncate ${item.paid ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {item.description}
                  </span>
                  {item.userName && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1 shrink-0">
                      <User className="w-3 h-3" />
                      {item.userName}
                    </span>
                  )}
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-medium shrink-0">
                    Semana {item.week}
                  </span>
                  {(item.isRecurring || item.isFixed) && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1 shrink-0">
                      <Repeat className="w-3 h-3" />
                      {item.isRecurring ? 'Recorrente' : 'Fixo'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Data: {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <span>• {item.category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pl-10 sm:pl-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className="text-base sm:text-lg font-bold text-slate-900">
                - R$ {item.amount.toLocaleString('pt-BR')}
              </span>
              <button
                onClick={() => onDeleteExpense(item.id)}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer"
                title="Excluir gasto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredExpenses.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">
            Nenhum gasto registrado para esta visualização.
          </p>
        )}
      </div>
    </div>
  );
};
