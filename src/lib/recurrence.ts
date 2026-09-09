import type { Recurrence, CycleWeek, MonthKey } from '../types/finance.ts';
import { monthKeyOf, monthEnd, shiftMonth } from './period.ts';

/**
 * Expansão de lançamentos recorrentes.
 *
 * A recorrência aqui é "em quais semanas do mês isso acontece, por quantos
 * meses" — que é o caso real de quem recebe 3x ou 4x por mês. Cada ocorrência
 * vira uma linha própria com data própria; a semana e o mês são derivados dessa
 * data pelo banco, nunca digitados.
 */

/**
 * Data da ocorrência na semana `week` do mês `month`, ancorada em `anchorISO`.
 *
 * Regra: o dia que a pessoa escolheu é preservado sempre que ele já cair na
 * semana pedida — quem digitou "30" espera ver 30, não 23. Só quando o dia não
 * pertence àquela semana é que ele é reposicionado, mantendo a mesma posição
 * dentro da semana (1º dia da semana, 2º dia, etc.).
 */
export function dateForWeek(month: MonthKey, week: CycleWeek, anchorISO: string): string {
  const anchorDay = Number(anchorISO.slice(-2));
  const lastDay = Number(monthEnd(month).slice(-2));

  // 1ª tentativa: o próprio dia escolhido, cortado se o mês for mais curto
  const preferred = Math.min(anchorDay, lastDay);
  if (Math.min(4, Math.floor((preferred - 1) / 7) + 1) === week) {
    return `${month}-${String(preferred).padStart(2, '0')}`;
  }

  // 2ª: mesma posição dentro da semana pedida
  const dayInWeek = ((anchorDay - 1) % 7) + 1; // 1..7
  const day = Math.min((week - 1) * 7 + dayInWeek, lastDay);
  return `${month}-${String(day).padStart(2, '0')}`;
}

/** Todas as datas que uma recorrência deve gerar, a partir da data base. */
export function expandRecurrence(baseISO: string, rec?: Recurrence): string[] {
  if (!rec || rec.weeks.length === 0) return [baseISO];

  const startMonth = monthKeyOf(baseISO);
  const months = Math.max(1, Math.floor(rec.months));
  const weeks = [...new Set(rec.weeks)].sort((a, b) => a - b);
  const out: string[] = [];

  for (let m = 0; m < months; m++) {
    const key = shiftMonth(startMonth, m);
    for (const w of weeks) out.push(dateForWeek(key, w, baseISO));
  }
  return out;
}

/** Mesmo dia, n meses adiante; corta para o último dia quando o mês é curto. */
export function addMonthsToDate(iso: string, n: number): string {
  const day = Number(iso.slice(-2));
  const key = shiftMonth(monthKeyOf(iso), n);
  const lastDay = Number(monthEnd(key).slice(-2));
  return `${key}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

/** UUID v4, com fallback para contextos sem crypto.randomUUID. */
export function uuid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
