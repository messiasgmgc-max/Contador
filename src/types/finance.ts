export type WeekNumber = number;

export type RecurrenceFrequency = 'none' | 'monthly' | 'weekly' | 'custom_weeks';

export interface UserProfile {
  id: string;
  name: string;
  avatarColor: string; // Ex: 'blue', 'purple', 'emerald', 'amber', 'rose'
  isDefault?: boolean;
  passwordHash?: string;
}

export interface IncomeItem {
  id: string;
  userId?: string;
  userName?: string;
  description: string;
  amount: number;
  expectedDate: string; // YYYY-MM-DD
  week: number; // 1, 2, 3, 4, etc. ou semana livre
  category: 'Salario' | 'Adiantamento' | 'Vale' | 'Comissao' | 'Diaria' | 'Extra' | 'Outro';
  received: boolean;
  isRecurring?: boolean;
  recurrence?: RecurrenceFrequency;
  customWeeks?: number[];
}

export interface DebtItem {
  id: string;
  userId?: string;
  userName?: string;
  creditor: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  currentInstallment: number;
  totalInstallments: number;
  dueDate: string; // YYYY-MM-DD
  week: number;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  isRecurring?: boolean;
  recurrence?: RecurrenceFrequency;
  customWeeks?: number[];
}

export interface ExpenseItem {
  id: string;
  userId?: string;
  userName?: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  week: number;
  category: 'Alimentacao' | 'Moradia' | 'Transporte' | 'Lazer' | 'Saude' | 'Servicos' | 'Outros';
  isFixed: boolean;
  paid: boolean;
  isRecurring?: boolean;
  recurrence?: RecurrenceFrequency;
  customWeeks?: number[];
}




