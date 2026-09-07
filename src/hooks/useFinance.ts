import { useState, useEffect, useCallback } from 'react';
import type { IncomeItem, DebtItem, ExpenseItem, UserProfile } from '../types/finance';
import { supabase } from '../lib/supabase';

export function useFinance() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>('ALL');
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);
  const [currentWeek, setCurrentWeek] = useState<number>(1);

  // Carregar dados 100% online do Supabase
  const loadFromSupabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Usuários
      const { data: userData, error: userErr } = await supabase
        .from('finance_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!userErr && userData) {
        const mappedUsers: UserProfile[] = userData.map((u: any) => ({
          id: u.id,
          name: u.name,
          avatarColor: u.avatar_color || 'blue',
          isDefault: u.is_default,
        }));
        setUsers(mappedUsers);
      }

      // 2. Recebimentos
      const { data: incData, error: incErr } = await supabase
        .from('finance_incomes')
        .select('*')
        .order('expected_date', { ascending: true });

      if (!incErr && incData) {
        const mapped: IncomeItem[] = incData.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          description: d.description,
          amount: Number(d.amount),
          expectedDate: d.expected_date,
          week: d.cycle_week || 1,
          category: d.category,
          received: d.received,
          isRecurring: d.description?.includes('[Recorrente]') || d.description?.includes('[Todo Mês]'),
        }));
        setIncomes(mapped);
      }

      // 3. Dívidas
      const { data: debtData, error: debtErr } = await supabase
        .from('finance_debts')
        .select('*')
        .order('due_date', { ascending: true });

      if (!debtErr && debtData) {
        const mapped: DebtItem[] = debtData.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          creditor: d.creditor,
          description: d.description || '',
          totalAmount: Number(d.total_amount || 0),
          installmentAmount: Number(d.installment_amount),
          currentInstallment: d.current_installment,
          totalInstallments: d.total_installments,
          dueDate: d.due_date,
          week: d.cycle_week || 1,
          status: d.status,
          isRecurring: d.description?.includes('[Recorrente]') || d.description?.includes('[Todo Mês]'),
        }));
        setDebts(mapped);
      }

      // 4. Despesas
      const { data: expData, error: expErr } = await supabase
        .from('finance_expenses')
        .select('*')
        .order('date', { ascending: true });

      if (!expErr && expData) {
        const mapped: ExpenseItem[] = expData.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          description: d.description,
          amount: Number(d.amount),
          date: d.date,
          week: d.cycle_week || 1,
          category: d.category,
          isFixed: d.is_fixed,
          paid: d.paid,
          isRecurring: d.is_fixed || d.description?.includes('[Recorrente]') || d.description?.includes('[Todo Mês]'),
        }));
        setExpenses(mapped);
      }

      setIsSupabaseConnected(true);
    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err);
      setIsSupabaseConnected(false);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.removeItem('clean_users');
    localStorage.removeItem('clean_incomes');
    localStorage.removeItem('clean_debts');
    localStorage.removeItem('clean_expenses');
    localStorage.removeItem('finance_users');
    localStorage.removeItem('finance_incomes');
    localStorage.removeItem('finance_debts');
    localStorage.removeItem('finance_expenses');

    loadFromSupabase();
  }, [loadFromSupabase]);

  // Criar Usuário diretamente no Supabase
  const addUser = async (name: string, avatarColor: string = 'blue'): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('finance_users')
        .insert([{ name, avatar_color: avatarColor, is_default: users.length === 0 }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar usuário:', error);
        throw error;
      }

      if (data) {
        const newUser: UserProfile = {
          id: data.id,
          name: data.name,
          avatarColor: data.avatar_color || avatarColor,
          isDefault: data.is_default,
        };
        setUsers((prev) => [...prev, newUser]);
        return newUser;
      }
      return null;
    } catch (e) {
      console.error('Erro em addUser:', e);
      throw e;
    }
  };

  // Deletar Usuário diretamente no Supabase
  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from('finance_users').delete().eq('id', id);
      if (!error) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        if (activeUserId === id) setActiveUserId('ALL');
      }
    } catch (e) {
      console.error('Erro em deleteUser:', e);
    }
  };

  // Atualizar/Editar Nome do Usuário no Supabase
  const updateUser = async (id: string, name: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('finance_users')
        .update({ name: name.trim() })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        return false;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, name: name.trim() } : u))
      );
      return true;
    } catch (e) {
      console.error('Erro em updateUser:', e);
      return false;
    }
  };

  // Filtragem conforme o usuário selecionado no painel
  const displayedIncomes = activeUserId === 'ALL'
    ? incomes
    : incomes.filter((i) => i.userId === activeUserId);

  const displayedDebts = activeUserId === 'ALL'
    ? debts
    : debts.filter((d) => d.userId === activeUserId);

  const displayedExpenses = activeUserId === 'ALL'
    ? expenses
    : expenses.filter((e) => e.userId === activeUserId);

  const totalIncome = displayedIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalReceived = displayedIncomes.filter((i) => i.received).reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebts = displayedDebts.reduce((acc, curr) => acc + curr.installmentAmount, 0);
  const totalExpenses = displayedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutgoing = totalDebts + totalExpenses;
  const netBalance = totalIncome - totalOutgoing;

  const weeks = [1, 2, 3, 4].map((w) => {
    const weekIncomes = displayedIncomes.filter((i) => i.week === w);
    const weekExpenses = displayedExpenses.filter((e) => e.week === w);
    const weekDebts = displayedDebts.filter((d) => d.week === w);

    const weekTotalIncome = weekIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const weekReceived = weekIncomes.filter((i) => i.received).reduce((acc, curr) => acc + curr.amount, 0);
    const weekTotalExpenses = weekExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const weekTotalDebts = weekDebts.reduce((acc, curr) => acc + curr.installmentAmount, 0);
    const weekTotalOutgoing = weekTotalExpenses + weekTotalDebts;

    return {
      week: w,
      hasIncome: weekTotalIncome > 0,
      totalIncome: weekTotalIncome,
      receivedIncome: weekReceived,
      totalDebts: weekTotalDebts,
      totalExpenses: weekTotalExpenses,
      totalOutgoing: weekTotalOutgoing,
      balance: weekTotalIncome - weekTotalOutgoing,
    };
  });

  // Ações de Incomes com suporte a Recorrência (todo mês ou semanas específicas)
  const addIncome = async (item: Omit<IncomeItem, 'id'>) => {
    const user = users.find((u) => u.id === item.userId);
    const targetWeeks: number[] = item.isRecurring
      ? item.recurrence === 'monthly'
        ? [1, 2, 3, 4]
        : (item.customWeeks && item.customWeeks.length > 0 ? item.customWeeks : [item.week])
      : [item.week];

    const recordsToInsert = targetWeeks.map((wk) => {
      const recLabel = item.isRecurring
        ? item.recurrence === 'monthly' ? ' [Todo Mês]' : ` [Sem. ${wk}]`
        : '';
      const userTag = user?.name ? ` [${user.name}]` : (item.userName ? ` [${item.userName}]` : '');
      return {
        user_id: null,
        description: `${item.description}${userTag}${recLabel}`,
        amount: item.amount,
        expected_date: item.expectedDate,
        cycle_week: wk,
        category: item.category,
        received: item.received,
      };
    });

    try {
      const { data, error } = await supabase
        .from('finance_incomes')
        .insert(recordsToInsert)
        .select();

      if (error) {
        console.error('Erro ao adicionar receita(s):', error);
        return;
      }

      if (data) {
        const newItems: IncomeItem[] = data.map((d: any) => ({
          id: d.id,
          userId: item.userId || d.user_id,
          userName: user?.name || item.userName,
          description: d.description,
          amount: Number(d.amount),
          expectedDate: d.expected_date,
          week: d.cycle_week,
          category: d.category,
          received: d.received,
          isRecurring: item.isRecurring,
        }));
        setIncomes((prev) => [...prev, ...newItems]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleIncomeReceived = async (id: string) => {
    const target = incomes.find((i) => i.id === id);
    if (!target) return;
    const newStatus = !target.received;

    try {
      const { error } = await supabase.from('finance_incomes').update({ received: newStatus }).eq('id', id);
      if (!error) {
        setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, received: newStatus } : i)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      const { error } = await supabase.from('finance_incomes').delete().eq('id', id);
      if (!error) {
        setIncomes((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ações de Debts com suporte a Recorrência
  const addDebt = async (item: Omit<DebtItem, 'id'>) => {
    const user = users.find((u) => u.id === item.userId);
    const targetWeeks: number[] = item.isRecurring
      ? item.recurrence === 'monthly'
        ? [1, 2, 3, 4]
        : (item.customWeeks && item.customWeeks.length > 0 ? item.customWeeks : [item.week])
      : [item.week];

    const recordsToInsert = targetWeeks.map((wk) => {
      const recLabel = item.isRecurring
        ? item.recurrence === 'monthly' ? ' [Todo Mês]' : ` [Sem. ${wk}]`
        : '';
      const userTag = user?.name ? ` [${user.name}]` : (item.userName ? ` [${item.userName}]` : '');
      return {
        user_id: null,
        creditor: item.creditor,
        description: `${item.description || 'Parcelamento'}${userTag}${recLabel}`,
        total_amount: item.totalAmount,
        installment_amount: item.installmentAmount,
        current_installment: item.currentInstallment,
        total_installments: item.totalInstallments,
        due_date: item.dueDate,
        cycle_week: wk,
        status: item.status,
      };
    });

    try {
      const { data, error } = await supabase
        .from('finance_debts')
        .insert(recordsToInsert)
        .select();

      if (error) {
        console.error('Erro ao adicionar dívida(s):', error);
        return;
      }

      if (data) {
        const newItems: DebtItem[] = data.map((d: any) => ({
          id: d.id,
          userId: item.userId || d.user_id,
          userName: user?.name || item.userName,
          creditor: d.creditor,
          description: d.description || '',
          totalAmount: Number(d.total_amount || 0),
          installmentAmount: Number(d.installment_amount),
          currentInstallment: d.current_installment,
          totalInstallments: d.total_installments,
          dueDate: d.due_date,
          week: d.cycle_week,
          status: d.status,
          isRecurring: item.isRecurring,
        }));
        setDebts((prev) => [...prev, ...newItems]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const payDebtInstallment = async (id: string) => {
    const target = debts.find((d) => d.id === id);
    if (!target) return;

    const nextInstallment = target.currentInstallment + 1;
    const isCompleted = nextInstallment > target.totalInstallments;

    try {
      const { error } = await supabase
        .from('finance_debts')
        .update({
          current_installment: isCompleted ? target.totalInstallments : nextInstallment,
          status: isCompleted ? 'Pago' : 'Pendente',
        })
        .eq('id', id);

      if (!error) {
        setDebts((prev) =>
          prev.map((d) =>
            d.id === id
              ? {
                  ...d,
                  currentInstallment: isCompleted ? d.totalInstallments : nextInstallment,
                  status: isCompleted ? 'Pago' : 'Pendente',
                }
              : d
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      const { error } = await supabase.from('finance_debts').delete().eq('id', id);
      if (!error) {
        setDebts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ações de Expenses com suporte a Recorrência
  const addExpense = async (item: Omit<ExpenseItem, 'id'>) => {
    const user = users.find((u) => u.id === item.userId);
    const targetWeeks: number[] = item.isRecurring
      ? item.recurrence === 'monthly'
        ? [1, 2, 3, 4]
        : (item.customWeeks && item.customWeeks.length > 0 ? item.customWeeks : [item.week])
      : [item.week];

    const recordsToInsert = targetWeeks.map((wk) => {
      const recLabel = item.isRecurring
        ? item.recurrence === 'monthly' ? ' [Todo Mês]' : ` [Sem. ${wk}]`
        : '';
      const userTag = user?.name ? ` [${user.name}]` : (item.userName ? ` [${item.userName}]` : '');
      return {
        user_id: null,
        description: `${item.description}${userTag}${recLabel}`,
        amount: item.amount,
        date: item.date,
        cycle_week: wk,
        category: item.category,
        is_fixed: item.isFixed || item.isRecurring,
        paid: item.paid,
      };
    });

    try {
      const { data, error } = await supabase
        .from('finance_expenses')
        .insert(recordsToInsert)
        .select();

      if (error) {
        console.error('Erro ao adicionar despesa(s):', error);
        return;
      }

      if (data) {
        const newItems: ExpenseItem[] = data.map((d: any) => ({
          id: d.id,
          userId: item.userId || d.user_id,
          userName: user?.name || item.userName,
          description: d.description,
          amount: Number(d.amount),
          date: d.date,
          week: d.cycle_week,
          category: d.category,
          isFixed: d.is_fixed,
          paid: d.paid,
          isRecurring: item.isRecurring,
        }));
        setExpenses((prev) => [...prev, ...newItems]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleExpensePaid = async (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;
    const newStatus = !target.paid;

    try {
      const { error } = await supabase.from('finance_expenses').update({ paid: newStatus }).eq('id', id);
      if (!error) {
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, paid: newStatus } : e)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('finance_expenses').delete().eq('id', id);
      if (!error) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return {
    users,
    activeUserId,
    setActiveUserId,
    addUser,
    updateUser,
    deleteUser,
    cycle: { currentWeek },
    setCycle: (c: { currentWeek: number }) => setCurrentWeek(c.currentWeek),
    incomes: displayedIncomes,
    allIncomes: incomes,
    debts: displayedDebts,
    allDebts: debts,
    expenses: displayedExpenses,
    allExpenses: expenses,
    weeks,
    summary: {
      totalCycleIncome: totalIncome,
      totalIncome,
      totalReceived,
      totalCycleDebts: totalDebts,
      totalDebts,
      totalCycleExpenses: totalExpenses,
      totalExpenses,
      totalCycleOutgoing: totalOutgoing,
      totalOutgoing,
      netCycleBalance: netBalance,
      netBalance,
    },
    isLoading,
    isSyncing,
    isSupabaseConnected,
    reloadFromSupabase: loadFromSupabase,
    actions: {
      addIncome,
      toggleIncomeReceived,
      deleteIncome,
      addDebt,
      payDebtInstallment,
      deleteDebt,
      addExpense,
      toggleExpensePaid,
      deleteExpense,
    },
  };
}
