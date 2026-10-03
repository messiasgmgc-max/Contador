import type {
  IncomeItem,
  DebtItem,
  ExpenseItem,
  BudgetEnvelope,
  CashflowForecastDay,
  UserGamification,
  MonthKey,
} from '../types/finance';
import { parseISO, todayISO, monthStart, monthEnd } from './period';

/**
 * ==============================================================================
 * 1. ZERO-BASED BUDGETING (YNAB Engine)
 * "Give every dollar a job"
 * ==============================================================================
 */

export interface ZeroBudgetCalculation {
  totalIncomeAvailable: number; // Renda prevista total do mês
  totalAllocated: number;       // Total já dividido em envelopes
  toAssign: number;             // Saldo livre a ser atribuído (deve chegar a R$ 0,00)
  isBalanced: boolean;          // true quando toAssign === 0
  envelopesWithStatus: (BudgetEnvelope & {
    remaining: number;          // Saldo restante no envelope
    percentUsed: number;        // % gasta
    isOverspent: boolean;       // Estourou o envelope
    recommendedAdjustment: number; // Sugestão para cobrir o estouro
  })[];
  totalOverspent: number;
}

export function calculateZeroBasedBudget(
  incomes: IncomeItem[],
  expenses: ExpenseItem[],
  envelopes: BudgetEnvelope[]
): ZeroBudgetCalculation {
  const totalIncomeAvailable = incomes.reduce((acc, i) => acc + i.amount, 0);

  // Mapear gastos reais por categoria
  const spentByCategory = new Map<string, number>();
  for (const exp of expenses) {
    const key = exp.category;
    spentByCategory.set(key, (spentByCategory.get(key) ?? 0) + exp.amount);
  }

  let totalAllocated = 0;
  let totalOverspent = 0;

  const envelopesWithStatus = envelopes.map((env) => {
    const spent = spentByCategory.get(env.category) ?? env.spentAmount ?? 0;
    const remaining = env.allocatedAmount - spent;
    const percentUsed = env.allocatedAmount > 0 ? Math.round((spent / env.allocatedAmount) * 100) : (spent > 0 ? 100 : 0);
    const isOverspent = remaining < 0;
    const recommendedAdjustment = isOverspent ? Math.abs(remaining) : 0;

    totalAllocated += env.allocatedAmount;
    if (isOverspent) totalOverspent += Math.abs(remaining);

    return {
      ...env,
      spentAmount: spent,
      remaining,
      percentUsed,
      isOverspent,
      recommendedAdjustment,
    };
  });

  const toAssign = totalIncomeAvailable - totalAllocated;

  return {
    totalIncomeAvailable,
    totalAllocated,
    toAssign,
    isBalanced: Math.abs(toAssign) < 0.01,
    envelopesWithStatus,
    totalOverspent,
  };
}

/**
 * ==============================================================================
 * 2. PROJEÇÃO DE FLUXO DE CAIXA FUTURO & PREDICTIVE ALERT (Mobills / Organizze)
 * ==============================================================================
 */

export interface CashflowForecastResult {
  timeline: CashflowForecastDay[];
  lowestProjectedBalance: { amount: number; date: string } | null;
  riskOfDeficit: boolean;
  predictedEndOfMonthBalance: number;
  burnRatePerDay: number;
}

export function generateCashflowForecast(
  monthKey: MonthKey,
  initialCash: number,
  incomes: IncomeItem[],
  debts: DebtItem[],
  expenses: ExpenseItem[]
): CashflowForecastResult {
  const startDate = monthStart(monthKey);
  const endDate = monthEnd(monthKey);
  const { year, month } = parseISO(startDate);
  const totalDays = parseISO(endDate).day;
  const today = todayISO();

  // Indexar lançamentos por dia
  const dayEvents = new Map<string, CashflowForecastDay['events']>();
  const addEvent = (d: string, item: CashflowForecastDay['events'][0]) => {
    if (!dayEvents.has(d)) dayEvents.set(d, []);
    dayEvents.get(d)!.push(item);
  };

  for (const inc of incomes) {
    addEvent(inc.expectedDate, {
      type: 'income',
      description: inc.description,
      amount: inc.amount,
      paidOrReceived: inc.received,
    });
  }

  for (const deb of debts) {
    addEvent(deb.dueDate, {
      type: 'debt',
      description: `${deb.creditor} (${deb.currentInstallment}/${deb.totalInstallments})`,
      amount: deb.installmentAmount,
      paidOrReceived: deb.status === 'Pago',
    });
  }

  for (const exp of expenses) {
    addEvent(exp.date, {
      type: 'expense',
      description: exp.description,
      amount: exp.amount,
      paidOrReceived: exp.paid,
    });
  }

  const timeline: CashflowForecastDay[] = [];
  let runningBalance = initialCash;
  let lowestBal: { amount: number; date: string } | null = null;
  let totalOutgoing = 0;

  for (let d = 1; d <= totalDays; d++) {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const events = dayEvents.get(dayStr) ?? [];

    const inflow = events.filter((e) => e.type === 'income').reduce((a, b) => a + b.amount, 0);
    const outflow = events.filter((e) => e.type !== 'income').reduce((a, b) => a + b.amount, 0);

    totalOutgoing += outflow;

    const startingBalance = runningBalance;
    runningBalance = runningBalance + inflow - outflow;
    const closingBalance = runningBalance;

    if (!lowestBal || closingBalance < lowestBal.amount) {
      lowestBal = { amount: closingBalance, date: dayStr };
    }

    timeline.push({
      date: dayStr,
      dayLabel: `${d}/${month}`,
      startingBalance,
      inflow,
      outflow,
      closingBalance,
      isProjected: dayStr >= today,
      events,
    });
  }

  const burnRatePerDay = totalDays > 0 ? totalOutgoing / totalDays : 0;
  const predictedEndOfMonthBalance = timeline.length > 0 ? timeline[timeline.length - 1].closingBalance : 0;

  return {
    timeline,
    lowestProjectedBalance: lowestBal,
    riskOfDeficit: lowestBal !== null && lowestBal.amount < 0,
    predictedEndOfMonthBalance,
    burnRatePerDay,
  };
}

/**
 * ==============================================================================
 * 3. GAMIFICAÇÃO & STREAKS DE HÁBITOS (Fortune City)
 * ==============================================================================
 */

const GAMIFICATION_STORAGE_KEY = 'finance_gamification_state';

export function loadLocalGamification(): UserGamification {
  try {
    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  return {
    streakDays: 1,
    lastActiveDate: todayISO(),
    points: 150,
    level: 1,
    achievements: [
      {
        id: 'first_record',
        title: 'Primeiro Tijolo',
        description: 'Registrou uma transação com sucesso.',
        unlockedAt: todayISO(),
        icon: '🧱',
      },
      {
        id: 'streak_3',
        title: 'Mestre da Consistência',
        description: 'Registrou transações por 3 dias seguidos.',
        icon: '🔥',
      },
      {
        id: 'zero_budget',
        title: 'Orçamento Blindado',
        description: 'Alocou todo o orçamento sem deixar centavos sobrando.',
        icon: '🛡️',
      },
      {
        id: 'blue_month',
        title: 'Mês no Azul',
        description: 'Fechou o mês com saldo positivo.',
        icon: '💎',
      },
    ],
  };
}

export function recordActivityStreak(current: UserGamification): UserGamification {
  const today = todayISO();
  if (current.lastActiveDate === today) {
    return current; // já contabilizado hoje
  }

  const { year: y1, month: m1, day: d1 } = parseISO(today);
  const { year: y2, month: m2, day: d2 } = parseISO(current.lastActiveDate);

  const dtToday = new Date(y1, m1 - 1, d1).getTime();
  const dtLast = new Date(y2, m2 - 1, d2).getTime();
  const diffDays = Math.round((dtToday - dtLast) / (1000 * 60 * 60 * 24));

  let newStreak = current.streakDays;
  if (diffDays === 1) {
    newStreak += 1;
  } else if (diffDays > 1) {
    newStreak = 1; // quebrou a sequência
  }

  const newPoints = current.points + 20;
  const newLevel = Math.floor(newPoints / 100) + 1;

  const updated: UserGamification = {
    ...current,
    streakDays: newStreak,
    lastActiveDate: today,
    points: newPoints,
    level: newLevel,
    achievements: current.achievements.map((ach) => {
      if (ach.id === 'streak_3' && newStreak >= 3 && !ach.unlockedAt) {
        return { ...ach, unlockedAt: today };
      }
      return ach;
    }),
  };

  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return updated;
}
