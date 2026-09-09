import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  IncomeItem, DebtItem, ExpenseItem, UserProfile,
  NewIncome, NewDebt, NewExpense,
  WeekSummary, MonthSummary, CycleWeek, MonthKey,
} from '../types/finance';
import { supabase } from '../lib/supabase';
import { profileHash, needsRehash } from '../lib/hash';
import {
  cycleWeekOf, monthKeyOf, currentMonthKey, todayISO,
  weekRangeLabel, matchesScope, type PeriodScope,
} from '../lib/period';
import { expandRecurrence, addMonthsToDate, uuid } from '../lib/recurrence';

/**
 * cycle_week e reference_month são COLUNAS GERADAS no Postgres. Se forem
 * enviadas num insert o banco recusa a linha inteira, então elas nunca entram
 * no payload — só são lidas de volta.
 */

export function useFinance() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>('ALL');
  const [monthKey, setMonthKey] = useState<MonthKey>(currentMonthKey());

  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------- carga ---

  const loadFromSupabase = useCallback(async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const [uRes, iRes, dRes, eRes] = await Promise.all([
        supabase.from('finance_users').select('*').order('created_at', { ascending: true }),
        supabase.from('finance_incomes').select('*').order('expected_date', { ascending: true }),
        supabase.from('finance_debts').select('*').order('due_date', { ascending: true }),
        supabase.from('finance_expenses').select('*').order('date', { ascending: true }),
      ]);

      const firstError = uRes.error || iRes.error || dRes.error || eRes.error;
      if (firstError) throw firstError;

      const loadedUsers: UserProfile[] = (uRes.data ?? []).map((u) => ({
        id: u.id,
        name: u.name,
        avatarColor: String(u.avatar_color ?? 'blue').split(':::')[0] || 'blue',
        passwordHash: u.password_hash ?? undefined,
        isDefault: u.is_default,
      }));
      setUsers(loadedUsers);

      const nameOf = (id: string | null) => loadedUsers.find((u) => u.id === id)?.name;

      setIncomes((iRes.data ?? []).map((d): IncomeItem => ({
        id: d.id,
        userId: d.user_id ?? undefined,
        userName: nameOf(d.user_id) ?? d.user_name ?? undefined,
        seriesId: d.series_id ?? undefined,
        description: d.description,
        amount: Number(d.amount),
        expectedDate: d.expected_date,
        week: (d.cycle_week ?? cycleWeekOf(d.expected_date)) as CycleWeek,
        referenceMonth: monthKeyOf(d.expected_date),
        category: d.category,
        received: d.received,
      })));

      setDebts((dRes.data ?? []).map((d): DebtItem => ({
        id: d.id,
        userId: d.user_id ?? undefined,
        userName: nameOf(d.user_id) ?? d.user_name ?? undefined,
        seriesId: d.series_id ?? undefined,
        creditor: d.creditor,
        description: d.description ?? '',
        totalAmount: Number(d.total_amount ?? 0),
        installmentAmount: Number(d.installment_amount),
        currentInstallment: d.current_installment,
        totalInstallments: d.total_installments,
        dueDate: d.due_date,
        week: (d.cycle_week ?? cycleWeekOf(d.due_date)) as CycleWeek,
        referenceMonth: monthKeyOf(d.due_date),
        status: d.status,
      })));

      setExpenses((eRes.data ?? []).map((d): ExpenseItem => ({
        id: d.id,
        userId: d.user_id ?? undefined,
        userName: nameOf(d.user_id) ?? d.user_name ?? undefined,
        seriesId: d.series_id ?? undefined,
        description: d.description,
        amount: Number(d.amount),
        date: d.date,
        week: (d.cycle_week ?? cycleWeekOf(d.date)) as CycleWeek,
        referenceMonth: monthKeyOf(d.date),
        category: d.category,
        isFixed: d.is_fixed,
        paid: d.paid,
      })));

      setIsSupabaseConnected(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Falha ao carregar do Supabase:', err);
      setIsSupabaseConnected(false);
      setErrorMessage(msg);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadFromSupabase(); }, [loadFromSupabase]);

  // ------------------------------------------------------------- filtros ---

  const byUser = useCallback(
    <T extends { userId?: string }>(list: T[]) =>
      activeUserId === 'ALL' ? list : list.filter((x) => x.userId === activeUserId),
    [activeUserId],
  );

  /** Do usuário ativo, em QUALQUER mês. Base dos painéis de hoje/semana. */
  const userIncomes = useMemo(() => byUser(incomes), [incomes, byUser]);
  const userDebts = useMemo(() => byUser(debts), [debts, byUser]);
  const userExpenses = useMemo(() => byUser(expenses), [expenses, byUser]);

  /** Do usuário ativo, SÓ no mês selecionado. É o que as abas mostram. */
  const monthIncomes = useMemo(
    () => userIncomes.filter((i) => i.referenceMonth === monthKey), [userIncomes, monthKey]);
  const monthDebts = useMemo(
    () => userDebts.filter((d) => d.referenceMonth === monthKey), [userDebts, monthKey]);
  const monthExpenses = useMemo(
    () => userExpenses.filter((e) => e.referenceMonth === monthKey), [userExpenses, monthKey]);

  /** Meses que têm algum lançamento, para o navegador de mês. */
  const availableMonths = useMemo(() => {
    const set = new Set<MonthKey>([currentMonthKey(), monthKey]);
    for (const i of userIncomes) set.add(i.referenceMonth);
    for (const d of userDebts) set.add(d.referenceMonth);
    for (const e of userExpenses) set.add(e.referenceMonth);
    return [...set].sort();
  }, [userIncomes, userDebts, userExpenses, monthKey]);

  // -------------------------------------------------------------- totais ---

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

  const summary = useMemo<MonthSummary>(() => {
    const incomePlanned = sum(monthIncomes.map((i) => i.amount));
    const incomeActual = sum(monthIncomes.filter((i) => i.received).map((i) => i.amount));
    const debtsTotal = sum(monthDebts.map((d) => d.installmentAmount));
    const debtsPaid = sum(monthDebts.filter((d) => d.status === 'Pago').map((d) => d.installmentAmount));
    const expensesTotal = sum(monthExpenses.map((e) => e.amount));
    const expensesPaid = sum(monthExpenses.filter((e) => e.paid).map((e) => e.amount));

    return {
      incomePlanned,
      incomeActual,
      debts: debtsTotal,
      debtsPaid,
      expenses: expensesTotal,
      expensesPaid,
      outgoing: debtsTotal + expensesTotal,
      outgoingPaid: debtsPaid + expensesPaid,
      balancePlanned: incomePlanned - (debtsTotal + expensesTotal),
      // O saldo que importa: entrou de verdade menos saiu de verdade.
      balanceActual: incomeActual - (debtsPaid + expensesPaid),
    };
  }, [monthIncomes, monthDebts, monthExpenses]);

  const weeks = useMemo<WeekSummary[]>(() =>
    ([1, 2, 3, 4] as CycleWeek[]).map((w) => {
      const wi = monthIncomes.filter((i) => i.week === w);
      const wd = monthDebts.filter((d) => d.week === w);
      const we = monthExpenses.filter((e) => e.week === w);

      const incomePlanned = sum(wi.map((i) => i.amount));
      const incomeActual = sum(wi.filter((i) => i.received).map((i) => i.amount));
      const debtsTotal = sum(wd.map((d) => d.installmentAmount));
      const expensesTotal = sum(we.map((e) => e.amount));
      const paid = sum(wd.filter((d) => d.status === 'Pago').map((d) => d.installmentAmount))
                 + sum(we.filter((e) => e.paid).map((e) => e.amount));

      return {
        week: w,
        range: weekRangeLabel(monthKey, w),
        incomePlanned,
        incomeActual,
        debts: debtsTotal,
        expenses: expensesTotal,
        outgoing: debtsTotal + expensesTotal,
        balancePlanned: incomePlanned - (debtsTotal + expensesTotal),
        balanceActual: incomeActual - paid,
      };
    }), [monthIncomes, monthDebts, monthExpenses, monthKey]);

  /** Gasto de hoje, da semana corrente e do mês corrente — sempre em cima da data real. */
  const spending = useMemo(() => {
    const hoje = todayISO();
    const total = (scope: PeriodScope) =>
      sum(userExpenses.filter((e) => matchesScope(e.date, scope, hoje)).map((e) => e.amount));
    return { hoje: total('dia'), semana: total('semana'), mes: total('mes') };
  }, [userExpenses]);

  /** Total por categoria no mês selecionado, maior primeiro. */
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthExpenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return [...map.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses]);

  // ------------------------------------------------------------- perfis ----

  const addUser = async (name: string, avatarColor = 'blue', password?: string): Promise<UserProfile | null> => {
    const clean = name.trim();
    // A linha nasce sem senha porque o sal do hash é o id, que só existe depois
    // do insert. Com a linha criada, a senha é gravada num segundo passo.
    const { data, error } = await supabase
      .from('finance_users')
      .insert([{
        name: clean,
        avatar_color: avatarColor,
        password_hash: null,
        is_default: users.length === 0,
      }])
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    const created: UserProfile = {
      id: data.id,
      name: data.name,
      avatarColor: String(data.avatar_color ?? 'blue').split(':::')[0] || 'blue',
      passwordHash: undefined,
      isDefault: data.is_default,
    };

    if (password) {
      const hash = profileHash(created, password);
      const { error: pwErr } = await supabase
        .from('finance_users').update({ password_hash: hash }).eq('id', created.id);
      if (pwErr) console.error('Perfil criado, mas a senha não foi gravada:', pwErr);
      else created.passwordHash = hash;
    }

    setUsers((prev) => [...prev, created]);
    return created;
  };

  const updateUser = async (id: string, name: string, password?: string): Promise<boolean> => {
    const existing = users.find((u) => u.id === id);
    if (!existing) return false;
    const clean = name.trim();

    // password undefined = manter o que já existe; '' = remover a tranca
    let hash: string | null;
    if (password === undefined) hash = existing.passwordHash ?? null;
    else if (password === '') hash = null;
    else hash = profileHash({ id, name: clean }, password);

    const { error } = await supabase
      .from('finance_users')
      .update({ name: clean, avatar_color: existing.avatarColor, password_hash: hash })
      .eq('id', id);

    if (error) { console.error('Erro ao atualizar perfil:', error); return false; }

    setUsers((prev) => prev.map((u) =>
      u.id === id ? { ...u, name: clean, passwordHash: hash ?? undefined } : u));
    return true;
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('finance_users').delete().eq('id', id);
    if (error) { console.error('Erro ao excluir perfil:', error); return; }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (activeUserId === id) setActiveUserId('ALL');
  };

  /**
   * Regrava em hash uma senha que ainda estava em texto puro (formato antigo).
   * Chamado depois de um login válido, sem incomodar o usuário.
   */
  const upgradePasswordIfLegacy = async (user: UserProfile, typed: string) => {
    if (!needsRehash(user, typed)) return;
    const hash = profileHash(user, typed);
    const { error } = await supabase.from('finance_users').update({ password_hash: hash }).eq('id', user.id);
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, passwordHash: hash } : u)));
    }
  };

  // -------------------------------------------------------------- ações ----

  const addIncome = async (item: NewIncome) => {
    const user = users.find((u) => u.id === item.userId);
    const dates = expandRecurrence(item.expectedDate, item.recurrence);
    const seriesId = dates.length > 1 ? uuid() : null;

    const rows = dates.map((expected_date) => ({
      user_id: item.userId ?? null,
      user_name: user?.name ?? item.userName ?? null,
      series_id: seriesId,
      description: item.description.trim(),
      amount: item.amount,
      expected_date,
      category: item.category,
      received: item.received,
    }));

    const { data, error } = await supabase.from('finance_incomes').insert(rows).select();
    if (error) { setErrorMessage(error.message); console.error(error); return; }

    setIncomes((prev) => [...prev, ...(data ?? []).map((d): IncomeItem => ({
      id: d.id,
      userId: d.user_id ?? undefined,
      userName: user?.name ?? item.userName,
      seriesId: d.series_id ?? undefined,
      description: d.description,
      amount: Number(d.amount),
      expectedDate: d.expected_date,
      week: (d.cycle_week ?? cycleWeekOf(d.expected_date)) as CycleWeek,
      referenceMonth: monthKeyOf(d.expected_date),
      category: d.category,
      received: d.received,
    }))]);
  };

  const toggleIncomeReceived = async (id: string) => {
    const target = incomes.find((i) => i.id === id);
    if (!target) return;
    const received = !target.received;
    const { error } = await supabase.from('finance_incomes').update({ received }).eq('id', id);
    if (error) { setErrorMessage(error.message); return; }
    setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, received } : i)));
  };

  const deleteIncome = async (id: string) => {
    const { error } = await supabase.from('finance_incomes').delete().eq('id', id);
    if (error) { setErrorMessage(error.message); return; }
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  const addDebt = async (item: NewDebt) => {
    const user = users.find((u) => u.id === item.userId);
    const dates = expandRecurrence(item.dueDate, item.recurrence);
    const seriesId = dates.length > 1 ? uuid() : null;

    const rows = dates.map((due_date) => ({
      user_id: item.userId ?? null,
      user_name: user?.name ?? item.userName ?? null,
      series_id: seriesId,
      creditor: item.creditor.trim(),
      description: (item.description || 'Parcelamento').trim(),
      total_amount: item.totalAmount,
      installment_amount: item.installmentAmount,
      current_installment: item.currentInstallment,
      total_installments: item.totalInstallments,
      due_date,
      status: item.status,
    }));

    const { data, error } = await supabase.from('finance_debts').insert(rows).select();
    if (error) { setErrorMessage(error.message); console.error(error); return; }

    setDebts((prev) => [...prev, ...(data ?? []).map((d): DebtItem => ({
      id: d.id,
      userId: d.user_id ?? undefined,
      userName: user?.name ?? item.userName,
      seriesId: d.series_id ?? undefined,
      creditor: d.creditor,
      description: d.description ?? '',
      totalAmount: Number(d.total_amount ?? 0),
      installmentAmount: Number(d.installment_amount),
      currentInstallment: d.current_installment,
      totalInstallments: d.total_installments,
      dueDate: d.due_date,
      week: (d.cycle_week ?? cycleWeekOf(d.due_date)) as CycleWeek,
      referenceMonth: monthKeyOf(d.due_date),
      status: d.status,
    }))]);
  };

  /**
   * Quitar a parcela do mês.
   *
   * A v1 só incrementava um contador na mesma linha, então a dívida ficava presa
   * no mesmo mês para sempre. Aqui a parcela paga é fechada e a próxima nasce no
   * mês seguinte, que é como um parcelamento se comporta de verdade.
   */
  const payDebtInstallment = async (id: string) => {
    const target = debts.find((d) => d.id === id);
    if (!target || target.status === 'Pago') return;

    const { error } = await supabase.from('finance_debts').update({ status: 'Pago' }).eq('id', id);
    if (error) { setErrorMessage(error.message); return; }
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'Pago' as const } : d)));

    if (target.currentInstallment >= target.totalInstallments) return;

    // Numa dívida criada por recorrência as parcelas dos meses seguintes já
    // existem. Sem esta guarda, quitar a do mês criava uma linha duplicada em
    // cima da que já estava lá.
    const nextDue = addMonthsToDate(target.dueDate, 1);
    const jaExiste = debts.some((d) =>
      d.id !== target.id &&
      d.dueDate === nextDue &&
      d.creditor === target.creditor &&
      d.installmentAmount === target.installmentAmount &&
      (d.userId ?? null) === (target.userId ?? null));
    if (jaExiste) return;

    const next = {
      user_id: target.userId ?? null,
      user_name: target.userName ?? null,
      series_id: target.seriesId ?? null,
      creditor: target.creditor,
      description: target.description,
      total_amount: target.totalAmount,
      installment_amount: target.installmentAmount,
      current_installment: target.currentInstallment + 1,
      total_installments: target.totalInstallments,
      due_date: nextDue,
      status: 'Pendente' as const,
    };

    const { data, error: insErr } = await supabase.from('finance_debts').insert([next]).select().single();
    if (insErr || !data) { console.error('Erro ao criar a próxima parcela:', insErr); return; }

    setDebts((prev) => [...prev, {
      id: data.id,
      userId: data.user_id ?? undefined,
      userName: target.userName,
      seriesId: data.series_id ?? undefined,
      creditor: data.creditor,
      description: data.description ?? '',
      totalAmount: Number(data.total_amount ?? 0),
      installmentAmount: Number(data.installment_amount),
      currentInstallment: data.current_installment,
      totalInstallments: data.total_installments,
      dueDate: data.due_date,
      week: (data.cycle_week ?? cycleWeekOf(data.due_date)) as CycleWeek,
      referenceMonth: monthKeyOf(data.due_date),
      status: data.status,
    }]);
  };

  const deleteDebt = async (id: string) => {
    const { error } = await supabase.from('finance_debts').delete().eq('id', id);
    if (error) { setErrorMessage(error.message); return; }
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const addExpense = async (item: NewExpense) => {
    const user = users.find((u) => u.id === item.userId);
    const dates = expandRecurrence(item.date, item.recurrence);
    const seriesId = dates.length > 1 ? uuid() : null;

    const rows = dates.map((date) => ({
      user_id: item.userId ?? null,
      user_name: user?.name ?? item.userName ?? null,
      series_id: seriesId,
      description: item.description.trim(),
      amount: item.amount,
      date,
      category: item.category,
      is_fixed: item.isFixed,
      paid: item.paid,
    }));

    const { data, error } = await supabase.from('finance_expenses').insert(rows).select();
    if (error) { setErrorMessage(error.message); console.error(error); return; }

    setExpenses((prev) => [...prev, ...(data ?? []).map((d): ExpenseItem => ({
      id: d.id,
      userId: d.user_id ?? undefined,
      userName: user?.name ?? item.userName,
      seriesId: d.series_id ?? undefined,
      description: d.description,
      amount: Number(d.amount),
      date: d.date,
      week: (d.cycle_week ?? cycleWeekOf(d.date)) as CycleWeek,
      referenceMonth: monthKeyOf(d.date),
      category: d.category,
      isFixed: d.is_fixed,
      paid: d.paid,
    }))]);
  };

  const toggleExpensePaid = async (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;
    const paid = !target.paid;
    const { error } = await supabase.from('finance_expenses').update({ paid }).eq('id', id);
    if (error) { setErrorMessage(error.message); return; }
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, paid } : e)));
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('finance_expenses').delete().eq('id', id);
    if (error) { setErrorMessage(error.message); return; }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  /** Apaga de uma vez todas as linhas criadas por uma mesma recorrência. */
  const deleteSeries = async (
    table: 'finance_incomes' | 'finance_debts' | 'finance_expenses',
    seriesId: string,
  ) => {
    const { error } = await supabase.from(table).delete().eq('series_id', seriesId);
    if (error) { setErrorMessage(error.message); return; }
    if (table === 'finance_incomes') setIncomes((p) => p.filter((x) => x.seriesId !== seriesId));
    if (table === 'finance_debts') setDebts((p) => p.filter((x) => x.seriesId !== seriesId));
    if (table === 'finance_expenses') setExpenses((p) => p.filter((x) => x.seriesId !== seriesId));
  };

  return {
    users,
    activeUserId,
    setActiveUserId,
    addUser,
    updateUser,
    deleteUser,
    upgradePasswordIfLegacy,

    monthKey,
    setMonthKey,
    availableMonths,

    incomes: monthIncomes,
    debts: monthDebts,
    expenses: monthExpenses,
    allIncomes: incomes,
    allDebts: debts,
    allExpenses: expenses,

    weeks,
    summary,
    spending,
    expensesByCategory,

    isLoading,
    isSyncing,
    isSupabaseConnected,
    errorMessage,
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
      deleteSeries,
    },
  };
}
