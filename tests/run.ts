/**
 * Testes das regras que o app não pode errar: cálculo da semana, do mês, do
 * hash de senha e da expansão de recorrência.
 *
 * Roda sem instalar nada:  npm test
 *
 * A checagem mais importante é a de paridade: a semana calculada aqui tem que
 * ser a mesma que o Postgres calcula em public.fn_cycle_week. Se as duas
 * divergirem, o lançamento aparece numa semana na tela e em outra no banco.
 */

import {
  cycleWeekOf, monthKeyOf, monthEnd, shiftMonth, weekRangeLabel,
  matchesScope, formatBR, formatBRL, todayISO, currentMonthKey,
} from '../src/lib/period.ts';
import { sha256, hashPassword, profileHash, verifyPassword, needsRehash } from '../src/lib/hash.ts';
import { expandRecurrence, dateForWeek, addMonthsToDate } from '../src/lib/recurrence.ts';
import type { CycleWeek } from '../src/types/finance.ts';

let passed = 0;
let failed = 0;

function eq(got: unknown, want: unknown, label: string) {
  if (String(got) === String(want)) {
    passed++;
  } else {
    failed++;
    console.log(`  ✗ ${label}\n      obtido:   ${got}\n      esperado: ${want}`);
  }
}

function group(name: string, fn: () => void) {
  console.log(`\n${name}`);
  const before = failed;
  fn();
  if (failed === before) console.log('  ok');
}

group('SHA-256 — vetores oficiais', () => {
  eq(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'string vazia');
  eq(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'abc');
  eq(sha256('The quick brown fox jumps over the lazy dog'),
     'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592', 'pangrama');
  eq(sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
     '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1', 'bloco duplo');
  eq(/^[0-9a-f]{64}$/.test(sha256('Cacá — acentuado')), 'true', 'aceita UTF-8');
  eq(sha256('a'.repeat(1000)) === sha256('a'.repeat(1000)), 'true', 'determinístico');
});

group('Senha de perfil', () => {
  const guilherme = { id: 'u-1', name: 'Guilherme' };
  const caca = { id: 'u-2', name: 'Cacá' };

  const h = profileHash(guilherme, '1234');
  eq(verifyPassword({ ...guilherme, passwordHash: h }, '1234'), 'true', 'senha correta entra');
  eq(verifyPassword({ ...guilherme, passwordHash: h }, '4321'), 'false', 'senha errada não entra');
  eq(profileHash(guilherme, '1234') === profileHash(caca, '1234'), 'false',
     'mesmo PIN em perfis diferentes gera hashes diferentes');

  // O sal é o id, então renomear o perfil NÃO invalida a senha — era o bug que
  // trancava a pessoa para fora depois de trocar o nome da conta.
  eq(verifyPassword({ id: 'u-1', name: 'Gui', passwordHash: h }, '1234'), 'true',
     'renomear o perfil não derruba a senha');

  // Formato antigo: hash salgado com o nome
  const antigo = hashPassword('Guilherme', '1234');
  eq(verifyPassword({ ...guilherme, passwordHash: antigo }, '1234'), 'true', 'aceita hash salgado com o nome');
  eq(needsRehash({ ...guilherme, passwordHash: antigo }, '1234'), 'true', 'hash antigo pede regravação');
  eq(needsRehash({ ...guilherme, passwordHash: h }, '1234'), 'false', 'hash atual não pede regravação');

  // Formato mais antigo ainda: texto puro
  eq(verifyPassword({ ...guilherme, passwordHash: '1234' }, '1234'), 'true', 'aceita senha legada em texto puro');
  eq(needsRehash({ ...guilherme, passwordHash: '1234' }, '1234'), 'true', 'texto puro pede regravação');

  eq(verifyPassword({ id: 'u-3', name: 'Qualquer' }, ''), 'true', 'perfil sem senha entra direto');
});

group('Semana do mês', () => {
  const casos: [string, CycleWeek][] = [
    ['2026-01-01', 1], ['2026-01-07', 1],
    ['2026-01-08', 2], ['2026-01-14', 2],
    ['2026-01-15', 3], ['2026-01-21', 3],
    ['2026-01-22', 4], ['2026-01-28', 4], ['2026-01-31', 4],
    ['2026-02-28', 4], ['2024-02-29', 4],
  ];
  for (const [d, w] of casos) eq(cycleWeekOf(d), w, d);
});

group('Mês de referência e navegação', () => {
  eq(monthKeyOf('2026-03-14'), '2026-03', 'extrai o mês');
  eq(shiftMonth('2026-01', -1), '2025-12', 'volta o ano');
  eq(shiftMonth('2026-12', 1), '2027-01', 'avança o ano');
  eq(shiftMonth('2026-03', -14), '2025-01', 'salto grande para trás');
  eq(monthEnd('2026-02'), '2026-02-28', 'fevereiro comum');
  eq(monthEnd('2024-02'), '2024-02-29', 'fevereiro bissexto');
  eq(monthEnd('2026-04'), '2026-04-30', 'mês de 30 dias');
  eq(weekRangeLabel('2026-01', 1), '01 a 07', 'faixa da semana 1');
  eq(weekRangeLabel('2026-02', 4), '22 a 28', 'semana 4 vai até o fim do mês');
  eq(/^\d{4}-\d{2}-\d{2}$/.test(todayISO()), 'true', 'hoje em formato ISO');
  eq(currentMonthKey(), monthKeyOf(todayISO()), 'mês corrente coerente com hoje');
});

group('Formatação sem deslocamento de fuso', () => {
  // Em UTC-3, new Date('2026-01-05') volta 04/01. Por isso o parsing é na string.
  eq(formatBR('2026-01-01'), '01/01/2026', 'primeiro dia do ano');
  eq(formatBR('2026-12-31'), '31/12/2026', 'último dia do ano');
  eq(formatBRL(1234.5).replace(/ /g, ' '), 'R$ 1.234,50', 'moeda com 2 casas');
  eq(formatBRL(-80).replace(/ /g, ' '), '-R$ 80,00', 'valor negativo');
});

group('Escopo diário / semanal / mensal', () => {
  eq(matchesScope('2026-03-10', 'dia', '2026-03-10'), 'true', 'hoje conta no dia');
  eq(matchesScope('2026-03-09', 'dia', '2026-03-10'), 'false', 'ontem não conta no dia');
  eq(matchesScope('2026-03-09', 'semana', '2026-03-10'), 'true', 'mesma semana conta');
  eq(matchesScope('2026-03-15', 'semana', '2026-03-10'), 'false', 'semana seguinte não conta');
  eq(matchesScope('2026-03-31', 'mes', '2026-03-10'), 'true', 'mesmo mês conta');
  eq(matchesScope('2026-04-01', 'mes', '2026-03-10'), 'false', 'mês seguinte não conta');
  eq(matchesScope('2025-03-10', 'mes', '2026-03-10'), 'false',
     'mesmo mês de OUTRO ANO não conta — era o bug da v1');
});

group('Recorrência', () => {
  eq(expandRecurrence('2026-03-14'), '2026-03-14', 'sem recorrência gera só a própria data');

  const tresPorMes = expandRecurrence('2026-03-05', { weeks: [1, 2, 3], months: 1 });
  eq(tresPorMes.join(' '), '2026-03-05 2026-03-12 2026-03-19', '3x no mês');
  eq(tresPorMes.map(cycleWeekOf).join(''), '123', 'caem nas semanas 1, 2 e 3');

  const quatroPorMes = expandRecurrence('2026-01-02', { weeks: [1, 2, 3, 4], months: 3 });
  eq(quatroPorMes.length, 12, '4x por mês durante 3 meses = 12 lançamentos');
  eq([...new Set(quatroPorMes.map(monthKeyOf))].join(' '), '2026-01 2026-02 2026-03', 'espalha por 3 meses');
  eq(quatroPorMes.map(cycleWeekOf).join(''), '123412341234', 'semanas corretas em todos os meses');

  eq(expandRecurrence('2026-11-30', { weeks: [4], months: 3 }).join(' '),
     '2026-11-30 2026-12-30 2027-01-30', 'atravessa a virada do ano');
  eq(expandRecurrence('2026-01-29', { weeks: [4], months: 2 }).join(' '),
     '2026-01-29 2026-02-28', 'dia 29 vira 28 em fevereiro comum');

  eq(dateForWeek('2026-01', 4, '2026-01-31'), '2026-01-31', 'preserva o dia escolhido');
  eq(dateForWeek('2026-01', 2, '2026-01-31'), '2026-01-10', 'reposiciona quando o dia não é da semana');

  eq(expandRecurrence('2026-03-05', { weeks: [2, 2, 1], months: 1 }).join(' '),
     '2026-03-05 2026-03-12', 'semana repetida não duplica lançamento');
  eq(expandRecurrence('2026-03-05', { weeks: [1], months: 0 }).length, 1, 'months = 0 vira 1');
  eq(expandRecurrence('2026-03-05', { weeks: [], months: 5 }).join(' '), '2026-03-05',
     'sem semanas escolhidas, cai no comportamento simples');
});

group('Próxima parcela', () => {
  eq(addMonthsToDate('2026-01-31', 1), '2026-02-28', '31/jan vira 28/fev');
  eq(addMonthsToDate('2024-01-31', 1), '2024-02-29', '31/jan vira 29/fev em ano bissexto');
  eq(addMonthsToDate('2026-12-15', 1), '2027-01-15', 'vira o ano');
  eq(addMonthsToDate('2026-03-10', 1), '2026-04-10', 'mês normal');
  eq(cycleWeekOf(addMonthsToDate('2026-01-31', 1)), 4, 'a parcela seguinte continua na semana 4');
});

console.log(
  failed === 0
    ? `\n✅ ${passed} verificações passaram\n`
    : `\n❌ ${failed} falha(s) em ${passed + failed} verificações\n`,
);
process.exit(failed === 0 ? 0 : 1);
