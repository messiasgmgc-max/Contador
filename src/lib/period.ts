/**
 * Cálculo de período.
 *
 * A semana de referência NUNCA é digitada: ela sai da data. As funções aqui são
 * o espelho exato de public.fn_cycle_week e public.fn_reference_month no banco
 * (ver supabase_schema.sql), para que o app e o Postgres nunca discordem.
 *
 * Datas trafegam sempre como string 'YYYY-MM-DD'. Nada de `new Date(iso)` para
 * fazer conta: em UTC-3 isso volta um dia para trás e joga o lançamento na
 * semana errada. Todo o parsing aqui é feito em cima da string.
 */

export type MonthKey = string; // 'YYYY-MM'
export type CycleWeek = 1 | 2 | 3 | 4;

/** Quebra 'YYYY-MM-DD' em números, sem passar por Date. */
export function parseISO(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m, day: d };
}

/** Semana do mês: dias 1-7 => 1, 8-14 => 2, 15-21 => 3, 22 em diante => 4. */
export function cycleWeekOf(iso: string): CycleWeek {
  const { day } = parseISO(iso);
  const week = Math.floor((day - 1) / 7) + 1;
  return Math.min(4, week) as CycleWeek;
}

/** Mês de referência de uma data: '2026-03-14' => '2026-03'. */
export function monthKeyOf(iso: string): MonthKey {
  return iso.slice(0, 7);
}

/** Primeiro dia do mês como 'YYYY-MM-DD' — formato que o Postgres espera. */
export function monthStart(key: MonthKey): string {
  return `${key}-01`;
}

/** Último dia do mês como 'YYYY-MM-DD'. */
export function monthEnd(key: MonthKey): string {
  const [y, m] = key.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${key}-${String(last).padStart(2, '0')}`;
}

/** Data de hoje no fuso local, como 'YYYY-MM-DD'. */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf(todayISO());
}

/** Anda n meses a partir de uma chave de mês (n pode ser negativo). */
export function shiftMonth(key: MonthKey, n: number): MonthKey {
  const [y, m] = key.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** '2026-03' => 'Março de 2026'. */
export function monthLabel(key: MonthKey): string {
  const [y, m] = key.split('-').map(Number);
  return `${MESES[m - 1]} de ${y}`;
}

/** '2026-03' => 'mar/26', para caber em botão. */
export function monthLabelShort(key: MonthKey): string {
  const [y, m] = key.split('-').map(Number);
  return `${MESES[m - 1].slice(0, 3).toLowerCase()}/${String(y).slice(2)}`;
}

/** Faixa de dias coberta por uma semana do ciclo, para exibir no cabeçalho. */
export function weekRangeLabel(key: MonthKey, week: CycleWeek): string {
  const first = (week - 1) * 7 + 1;
  const lastDay = Number(monthEnd(key).slice(-2));
  const last = week === 4 ? lastDay : Math.min(week * 7, lastDay);
  return `${String(first).padStart(2, '0')} a ${String(last).padStart(2, '0')}`;
}

/** '2026-03-14' => '14/03/2026', sem passar por Date. */
export function formatBR(iso: string): string {
  const { year, month, day } = parseISO(iso);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

/** Formata em real, sempre com dois decimais. */
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Granularidade do painel de gastos. */
export type PeriodScope = 'dia' | 'semana' | 'mes';

/** Um item entra no escopo escolhido, tomando `hoje` como referência. */
export function matchesScope(itemISO: string, scope: PeriodScope, hoje = todayISO()): boolean {
  switch (scope) {
    case 'dia':
      return itemISO === hoje;
    case 'semana':
      return monthKeyOf(itemISO) === monthKeyOf(hoje) && cycleWeekOf(itemISO) === cycleWeekOf(hoje);
    case 'mes':
      return monthKeyOf(itemISO) === monthKeyOf(hoje);
  }
}
