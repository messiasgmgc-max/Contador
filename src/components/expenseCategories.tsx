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
  Moradia: 'bg-violet-500',
  Transporte: 'bg-amber-400',
  Lazer: 'bg-pink-500',
  Saude: 'bg-emerald-400',
  Servicos: 'bg-cyan-400',
  Outros: 'bg-zinc-500',
};

export function categoryIcon(cat: ExpenseCategory): React.ReactNode {
  const cls = 'w-4 h-4';
  switch (cat) {
    case 'Alimentacao': return <ShoppingBag className={`${cls} text-orange-400`} />;
    case 'Moradia': return <Home className={`${cls} text-violet-400`} />;
    case 'Transporte': return <Car className={`${cls} text-amber-400`} />;
    case 'Lazer': return <Coffee className={`${cls} text-pink-400`} />;
    case 'Saude': return <HeartPulse className={`${cls} text-emerald-400`} />;
    case 'Servicos': return <Zap className={`${cls} text-cyan-400`} />;
    default: return <MoreHorizontal className={`${cls} text-zinc-400`} />;
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
