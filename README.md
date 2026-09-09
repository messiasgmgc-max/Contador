# Fluxo Financeiro

Controle financeiro pessoal e compartilhado, organizado por **mês** e por
**semana do mês**. Web, desktop (Windows) e Android a partir do mesmo código.

Stack: React 19 + TypeScript + Vite · Tailwind 4 · Supabase (PostgreSQL) ·
Electron · Capacitor.

---

## Começando

```bash
cp .env.example .env      # preencha com a URL e a chave do seu projeto Supabase
npm install
npm run dev
```

No painel do Supabase, abra o **SQL Editor** e rode `supabase_schema.sql`
inteiro. Ele é idempotente e migra um banco antigo sem perder dados — pode rodar
mais de uma vez sem medo.

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checa os tipos e gera o `dist/` |
| `npm test` | roda os testes das regras de data, senha e recorrência |
| `npm run lint` | oxlint |
| `npm run desktop:build` | empacota o `.exe` (Windows) |
| `npm run mobile:sync` | build + sincroniza o projeto Android |

---

## A regra mais importante: a data manda

**Semana e mês nunca são digitados.** Os dois saem da data do lançamento, em dois
lugares que precisam concordar:

- No banco, `cycle_week` e `reference_month` são **colunas geradas**
  (`public.fn_cycle_week` e `public.fn_reference_month`). Não dá para gravar um
  valor errado nelas nem por SQL direto.
- No app, `src/lib/period.ts` faz a mesma conta para mostrar na tela antes de
  salvar.

As semanas são: dias 1–7 → semana 1, 8–14 → 2, 15–21 → 3, 22 até o fim → 4.
Quem recebe 3x por mês simplesmente não tem lançamento numa das semanas.

`npm test` compara as duas implementações; se elas divergirem, o teste quebra.

---

## Estrutura

```
src/
  lib/
    period.ts       semana, mês, faixas de período, formatação (espelho do SQL)
    recurrence.ts   expansão de lançamentos recorrentes
    hash.ts         SHA-256 da senha de perfil
    supabase.ts     cliente, configurado só por .env
  types/finance.ts  contratos de dados
  hooks/useFinance.ts   carga, filtros por mês/usuário, totais e ações
  components/       telas
tests/run.ts        testes das regras acima
supabase_schema.sql            schema + migração (rode este)
supabase_rls_hardening.sql     fechamento de segurança (opcional, leia antes)
```

---

## Segurança — leia antes de distribuir o instalador

O app usa a **chave anônima** do Supabase. Ela vai embutida no bundle do site, do
`.exe` e do APK: qualquer pessoa que abra o instalador consegue extraí-la. Com as
políticas de RLS padrão (`USING (true)`), quem tiver essa chave **lê e escreve as
finanças de todos os perfis** direto pela API, sem passar pelo app.

A senha de perfil **não** resolve isso. Ela é conferida no dispositivo, não no
banco: serve para separar os perfis em uso normal, não para proteger os dados.

- Enquanto o app roda só nas suas máquinas: o risco é baixo, pode seguir assim.
- Se você for distribuir o instalador para outras pessoas: rode
  `supabase_rls_hardening.sql`. Ele troca o login por perfil pelo Supabase Auth e
  faz cada pessoa enxergar só o que é dela. O arquivo explica o passo a passo e
  o que muda no app.

A chave que estava escrita direto em `src/lib/supabase.ts` foi removida, mas ela
continua no histórico do git. **Rotacione essa chave** no painel do Supabase.

---

## Notas de implementação

- **Carga completa.** `useFinance` traz todos os lançamentos de uma vez e filtra
  o mês em memória, o que deixa a navegação entre meses instantânea. Para o
  volume de um controle pessoal isso é folgado; se um dia passar de alguns
  milhares de linhas, vale trocar por consulta com `.eq('reference_month', ...)`.
- **Parcelamento.** Ao quitar uma parcela, ela é fechada e a próxima é criada no
  mês seguinte, com o dia cortado para o fim do mês quando necessário
  (31/jan → 28/fev).
- **Recorrência.** Cada ocorrência é uma linha própria, agrupada por `series_id`.
  Não existe "lançamento virtual" calculado na hora: o que está no banco é o que
  aparece.
- **Fuso.** Datas são strings `YYYY-MM-DD` do começo ao fim. Nada de
  `new Date('2026-01-05')` para fazer conta — em UTC−3 isso volta um dia e joga o
  lançamento na semana errada.
