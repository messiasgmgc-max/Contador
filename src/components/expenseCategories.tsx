import React from 'react';
import type { ExpenseCategory, IncomeCategory } from '../types/finance';
import { ShoppingBag, Home, Car, Coffee, HeartPulse, Zap, MoreHorizontal } from 'lucide-react';

/** Rótulos e cores das categorias, num lugar só, para não divergirem entre telas. */

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Alimentacao', 'Moradia', 'Transporte', 'Lazer', 'Saude', 'Servicos', 'Outros',
];

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  Alimentacao: 'Alimentação',
  Moradia: 'Moradia',
  Transporte: 'Transporte',
  Lazer: 'Lazer',
  Saude: 'Saúde',
  Servicos: 'Serviços',
  Outros: 'Outros',
};

export const CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  Alimentacao: 'bg-orange-500',
  Moradia: 'bg-blue-500',
  Transporte: 'bg-amber-500',
  Lazer: 'bg-purple-500',
  Saude: 'bg-rose-500',
  Servicos: 'bg-cyan-500',
  Outros: 'bg-slate-400',
};

export function categoryIcon(cat: ExpenseCategory): React.ReactNode {
  const cls = 'w-4 h-4';
  switch (cat) {
    case 'Alimentacao': return <ShoppingBag className={`${cls} text-orange-600`} />;
    case 'Moradia': return <Home className={`${cls} text-blue-600`} />;
    case 'Transporte': return <Car className={`${cls} text-amber-600`} />;
    case 'Lazer': return <Coffee className={`${cls} text-purple-600`} />;
    case 'Saude': return <HeartPulse className={`${cls} text-rose-600`} />;
    case 'Servicos': return <Zap className={`${cls} text-cyan-600`} />;
    default: return <MoreHorizontal className={`${cls} text-slate-500`} />;
  }
}

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salario', 'Adiantamento', 'Vale', 'Comissao', 'Diaria', 'Extra', 'Outro',
];

export const INCOME_LABEL: Record<IncomeCategory, string> = {
  Salario: 'Salário',
  Adiantamento: 'Adiantamento',
  Vale: 'Vale',
  Comissao: 'Comissão',
  Diaria: 'Diária',
  Extra: 'Extra',
  Outro: 'Outro',
};
