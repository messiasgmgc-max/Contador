import type { CycleWeek, MonthKey } from '../lib/period.ts';

export type { CycleWeek, MonthKey };

/**
 * Semana do ciclo. É SEMPRE derivada da data — no banco por coluna gerada, no
 * app por cycleWeekOf(). Nunca vem de um campo digitado.
 */
export type WeekNumber = CycleWeek;

/** Recorrência dentro do mês: em quais semanas o lançamento acontece. */
export interface Recurrence {
  /** Semanas do mês em que o lançamento se repete. Ex: [1,2,3] para 3x/mês. */
  weeks: CycleWeek[];
  /** Por quantos meses seguidos criar (1 = só o mês escolhido). */
  months: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarColor: string; // 'blue' | 'purple' | 'emerald' | 'amber' | 'rose'
  isDefault?: boolean;
  /** SHA-256 salgado com o nome do perfil. Ausente = perfil sem tranca. */
  passwordHash?: string;
}

/** Campos comuns a todo lançamento. */
interface BaseEntry {
  id: string;
  userId?: string;
  userName?: string;
  /** Agrupa as linhas criadas de uma vez por uma recorrência. */
  seriesId?: string;
  /** Derivado da data pelo banco. Somente leitura. */
  week: WeekNumber;
  /** Derivado da data pelo banco: 'YYYY-MM'. Somente leitura. */
  referenceMonth: MonthKey;
}

export type IncomeCategory =
  | 'Salario' | 'Adiantamento' | 'Vale' | 'Comissao' | 'Diaria' | 'Extra' | 'Outro';

export type ExpenseCategory =
  | 'Alimentacao' | 'Moradia' | 'Transporte' | 'Lazer' | 'Saude' | 'Servicos' | 'Outros';

export type DebtStatus = 'Pendente' | 'Pago' | 'Atrasado';

export interface IncomeItem extends BaseEntry {
  description: string;
  amount: number;
  expectedDate: string; // YYYY-MM-DD
  category: IncomeCategory;
  received: boolean;
}

export interface DebtItem extends BaseEntry {
  creditor: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  currentInstallment: number;
  totalInstallments: number;
  dueDate: string; // YYYY-MM-DD
  status: DebtStatus;
}

export interface ExpenseItem extends BaseEntry {
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  isFixed: boolean;
  paid: boolean;
}

/**
 * O que um formulário envia. Sem `week`, sem `referenceMonth`, sem `id`:
 * tudo isso é derivado ou gerado.
 */
export type NewIncome = Omit<IncomeItem, 'id' | 'week' | 'referenceMonth' | 'seriesId'> & {
  recurrence?: Recurrence;
};
export type NewDebt = Omit<DebtItem, 'id' | 'week' | 'referenceMonth' | 'seriesId'> & {
  recurrence?: Recurrence;
};
export type NewExpense = Omit<ExpenseItem, 'id' | 'week' | 'referenceMonth' | 'seriesId'> & {
  recurrence?: Recurrence;
};

/** Totais de uma semana do mês selecionado. */
export interface WeekSummary {
  week: WeekNumber;
  range: string;
  incomePlanned: number;
  incomeActual: number;
  debts: number;
  expenses: number;
  outgoing: number;
  balancePlanned: number;
  balanceActual: number;
}

/** Totais do mês selecionado. */
export interface MonthSummary {
  incomePlanned: number;
  incomeActual: number;
  debts: number;
  debtsPaid: number;
  expenses: number;
  expensesPaid: number;
  outgoing: number;
  outgoingPaid: number;
  /** Previsto: tudo que está cadastrado, pago ou não. */
  balancePlanned: number;
  /** Real: o que entrou de verdade menos o que saiu de verdade. */
  balanceActual: number;
}
