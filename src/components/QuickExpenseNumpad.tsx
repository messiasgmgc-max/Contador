import React, { useState } from 'react';
import type { ExpenseCategory, NewExpense } from '../types/finance';
import { EXPENSE_CATEGORIES, CATEGORY_LABEL, categoryIcon } from './expenseCategories';
import { todayISO, formatBRL } from '../lib/period';
import { Zap, Check, CreditCard, Sparkles, Delete } from 'lucide-react';

interface Props {
  onAddExpense: (item: NewExpense) => Promise<void> | void;
  defaultUserId?: string;
  userName?: string;
  onOpenFullForm?: () => void;
}

export const QuickExpenseNumpad: React.FC<Props> = ({
  onAddExpense,
  defaultUserId,
  userName,
}) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Alimentacao');
  const [isCard, setIsCard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<{ desc: string; amount: number } | null>(null);

  const numpadDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', ','];

  const handleDigit = (digit: string) => {
    if (digit === ',') {
      if (!displayValue.includes(',')) {
        setDisplayValue((prev) => prev + ',');
      }
      return;
    }

    if (displayValue === '0' && digit !== '00') {
      setDisplayValue(digit);
    } else {
      // Máximo de 2 casas decimais após a vírgula
      if (displayValue.includes(',')) {
        const parts = displayValue.split(',');
        if (parts[1]?.length >= 2) return;
      }
      setDisplayValue((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (displayValue.length <= 1) {
      setDisplayValue('0');
    } else {
      setDisplayValue((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setDisplayValue('0');
    setDescription('');
  };

  const parseCurrentValue = (): number => {
    const sanitized = displayValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(sanitized) || 0;
  };

  const handleQuickSubmit = async () => {
    const val = parseCurrentValue();
    if (val <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    const desc = description.trim() || `${CATEGORY_LABEL[category]}`;

    try {
      await onAddExpense({
        userId: defaultUserId,
        userName,
        description: desc,
        amount: val,
        date: todayISO(),
        category,
        isFixed: false,
        paid: true,
        isCard,
        cardName: isCard ? 'Cartão de Crédito' : undefined,
      });

      setLastSaved({ desc, amount: val });
      handleClear();
      setTimeout(() => setLastSaved(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const numVal = parseCurrentValue();

  return (
    <div className="rounded-3xl bg-[#14141b] border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Lançamento Rápido</h3>
            <span className="text-[10px] text-zinc-400 font-mono">Registro em 1-clique sem fricção</span>
          </div>
        </div>

        {/* Alternador Dinheiro / Cartão */}
        <button
          type="button"
          onClick={() => setIsCard(!isCard)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
            isCard
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-xs'
              : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{isCard ? 'No Cartão' : 'À Vista'}</span>
        </button>
      </div>

      {/* Visor de Valor Gigante */}
      <div className="p-4 rounded-2xl bg-[#0b0b0f] border border-white/5 flex items-baseline justify-between">
        <span className="text-xs text-zinc-500 font-mono uppercase">Total R$</span>
        <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
          {displayValue}
        </div>
      </div>

      {/* Descrição rápida inline */}
      <input
        type="text"
        placeholder={`Nota rápida (opcional, padrão: ${CATEGORY_LABEL[category]})`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-[#181822] border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ccff00]"
      />

      {/* Tags de Categorias em 1-Clique (Monefy style) */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-zinc-400 font-mono uppercase">Escolha a categoria:</span>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          {EXPENSE_CATEGORIES.map((c) => {
            const isSelected = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`p-2 rounded-2xl border flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#ccff00]/15 border-[#ccff00] text-white scale-105 shadow-sm'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {categoryIcon(c)}
                <span className="truncate max-w-full text-[9px]">{CATEGORY_LABEL[c]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Teclado Numérico Inline Rápido */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {numpadDigits.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 border border-white/5 text-base font-bold text-white font-mono cursor-pointer transition-all"
          >
            {d}
          </button>
        ))}
      </div>

      {/* Botões de Ação (Backspace, Limpar e Confirmar) */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleBackspace}
          className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold font-mono cursor-pointer flex items-center justify-center gap-1"
        >
          <Delete className="w-4 h-4" />
          <span>Apagar</span>
        </button>

        <button
          type="button"
          disabled={numVal <= 0 || isSubmitting}
          onClick={handleQuickSubmit}
          className="flex-[2] py-3 rounded-2xl bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 text-black text-xs font-black uppercase tracking-wider cursor-pointer transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.2)]"
        >
          {isSubmitting ? (
            <span>Salvando...</span>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Lançar {numVal > 0 ? formatBRL(numVal) : ''}</span>
            </>
          )}
        </button>
      </div>

      {/* Toast Feedback de Salvo */}
      {lastSaved && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-center text-xs text-emerald-400 font-semibold animate-in fade-in flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Lançamento registrado: {lastSaved.desc} ({formatBRL(lastSaved.amount)})</span>
        </div>
      )}
    </div>
  );
};
