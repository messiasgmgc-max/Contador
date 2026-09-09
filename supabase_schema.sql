-- ==============================================================================
-- FLUXO FINANCEIRO — SCHEMA v2
-- Supabase / PostgreSQL 15+
--
-- Este script é IDEMPOTENTE e MIGRA um banco v1 existente sem perder dados.
-- Rode inteiro no SQL Editor do Supabase. Pode rodar mais de uma vez.
--
-- O que mudou em relação à v1:
--   1. Corrigido o erro de sintaxe em finance_expenses.user_id (faltava o tipo UUID)
--   2. cycle_week virou COLUNA GERADA a partir da data — não existe mais campo
--      manual "Semana Referência" e é impossível ele ficar errado
--   3. Novo reference_month (também gerado) — sem isso, lançamentos de meses
--      diferentes caíam na mesma "semana 1" e eram somados juntos
--   4. Senha de perfil saiu de avatar_color ("cor:::senha" em texto puro) para a
--      coluna própria password_hash (SHA-256 gerado no cliente, salgado com o
--      ID do perfil — o app aceita os formatos antigos e regrava no primeiro
--      login bem-sucedido, então ninguém fica trancado para fora)
--   5. series_id agrupa lançamentos recorrentes criados de uma vez
--   6. View de resumo agora separa PREVISTO de REALIZADO e é por mês
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. FUNÇÕES DE PERÍODO
-- Semana do mês a partir da data: dias 1-7 => 1, 8-14 => 2, 15-21 => 3, 22+ => 4.
-- IMMUTABLE é obrigatório para poder ser usada em coluna gerada.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_cycle_week(d DATE)
RETURNS INT
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT LEAST(4, ((EXTRACT(DAY FROM d)::INT - 1) / 7) + 1);
$$;

CREATE OR REPLACE FUNCTION public.fn_reference_month(d DATE)
RETURNS DATE
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT make_date(EXTRACT(YEAR FROM d)::INT, EXTRACT(MONTH FROM d)::INT, 1);
$$;

-- ==============================================================================
-- 2. PERFIS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.finance_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT 'blue',
    password_hash TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.finance_users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Migrar senhas antigas guardadas como "cor:::senha" dentro de avatar_color.
-- A senha antiga estava em texto puro; ela é movida como está e o app a
-- substitui pelo hash no primeiro login bem-sucedido.
DO $$
BEGIN
    UPDATE public.finance_users
       SET password_hash = split_part(avatar_color, ':::', 2),
           avatar_color  = split_part(avatar_color, ':::', 1)
     WHERE avatar_color LIKE '%:::%'
       AND password_hash IS NULL;

    -- Qualquer resíduo de ":::" que tenha sobrado na cor
    UPDATE public.finance_users
       SET avatar_color = split_part(avatar_color, ':::', 1)
     WHERE avatar_color LIKE '%:::%';
END $$;

-- ==============================================================================
-- 3. TABELAS DE LANÇAMENTO
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.finance_incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.finance_users(id) ON DELETE SET NULL,
    user_name TEXT,
    series_id UUID,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    expected_date DATE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Salario'
        CHECK (category IN ('Salario','Adiantamento','Vale','Comissao','Diaria','Extra','Outro')),
    received BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.finance_debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.finance_users(id) ON DELETE SET NULL,
    user_name TEXT,
    series_id UUID,
    creditor TEXT NOT NULL,
    description TEXT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    installment_amount NUMERIC(12, 2) NOT NULL CHECK (installment_amount > 0),
    current_installment INT NOT NULL DEFAULT 1 CHECK (current_installment >= 1),
    total_installments INT NOT NULL DEFAULT 1,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente'
        CHECK (status IN ('Pendente','Pago','Atrasado')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Na v1 esta tabela tinha "user_id REFERENCES ..." SEM o tipo UUID, o que faz o
-- CREATE TABLE falhar. Aqui está corrigido.
CREATE TABLE IF NOT EXISTS public.finance_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.finance_users(id) ON DELETE SET NULL,
    user_name TEXT,
    series_id UUID,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL DEFAULT 'Outros'
        CHECK (category IN ('Alimentacao','Moradia','Transporte','Lazer','Saude','Servicos','Outros')),
    is_fixed BOOLEAN NOT NULL DEFAULT FALSE,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Colunas novas em bancos que já existiam
ALTER TABLE public.finance_incomes  ADD COLUMN IF NOT EXISTS series_id UUID;
ALTER TABLE public.finance_debts    ADD COLUMN IF NOT EXISTS series_id UUID;
ALTER TABLE public.finance_expenses ADD COLUMN IF NOT EXISTS series_id UUID;
ALTER TABLE public.finance_incomes  ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.finance_debts    ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.finance_expenses ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Garantir o tipo/FK de user_id em finance_expenses caso a tabela tenha sido
-- criada por um caminho torto (o CREATE da v1 não rodava)
DO $$
DECLARE
    col_type TEXT;
BEGIN
    SELECT data_type INTO col_type
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'finance_expenses' AND column_name = 'user_id';

    IF col_type IS NULL THEN
        ALTER TABLE public.finance_expenses ADD COLUMN user_id UUID;
    ELSIF col_type <> 'uuid' THEN
        ALTER TABLE public.finance_expenses
            ALTER COLUMN user_id TYPE UUID USING NULLIF(user_id::TEXT, '')::UUID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
         WHERE table_schema = 'public'
           AND table_name = 'finance_expenses'
           AND constraint_name = 'finance_expenses_user_id_fkey'
    ) THEN
        ALTER TABLE public.finance_expenses
            ADD CONSTRAINT finance_expenses_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.finance_users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==============================================================================
-- 4. RECUPERAR O VÍNCULO DE USUÁRIO ESCONDIDO NA DESCRIÇÃO
-- A v1 gravava user_id = NULL e enfiava " [Nome]" no texto da descrição.
-- Aqui o vínculo é reconstruído de verdade e as tags saem do texto.
-- ==============================================================================

DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id, name FROM public.finance_users LOOP
        UPDATE public.finance_incomes
           SET user_id = u.id, user_name = u.name
         WHERE user_id IS NULL AND description LIKE '%[' || u.name || ']%';

        UPDATE public.finance_expenses
           SET user_id = u.id, user_name = u.name
         WHERE user_id IS NULL AND description LIKE '%[' || u.name || ']%';

        UPDATE public.finance_debts
           SET user_id = u.id, user_name = u.name
         WHERE user_id IS NULL
           AND (COALESCE(description,'') || ' ' || creditor) LIKE '%[' || u.name || ']%';
    END LOOP;

    -- Limpar as tags " [Nome]", " [Todo Mês]" e " [Sem. N]" do texto visível
    UPDATE public.finance_incomes
       SET description = BTRIM(REGEXP_REPLACE(description, '\s*\[[^\]]*\]', '', 'g'))
     WHERE description ~ '\[[^\]]*\]';

    UPDATE public.finance_expenses
       SET description = BTRIM(REGEXP_REPLACE(description, '\s*\[[^\]]*\]', '', 'g'))
     WHERE description ~ '\[[^\]]*\]';

    UPDATE public.finance_debts
       SET description = BTRIM(REGEXP_REPLACE(COALESCE(description,''), '\s*\[[^\]]*\]', '', 'g'))
     WHERE description ~ '\[[^\]]*\]';
END $$;

-- Descrição não pode ficar vazia depois da limpeza
UPDATE public.finance_incomes  SET description = 'Recebimento'  WHERE COALESCE(BTRIM(description), '') = '';
UPDATE public.finance_expenses SET description = 'Gasto'        WHERE COALESCE(BTRIM(description), '') = '';
UPDATE public.finance_debts    SET description = 'Parcelamento' WHERE COALESCE(BTRIM(description), '') = '';

-- ==============================================================================
-- 5. COLUNAS GERADAS: cycle_week E reference_month
-- O campo manual "Semana Referência" deixa de existir. O banco calcula.
-- ==============================================================================

DO $$
DECLARE
    t RECORD;
    is_gen TEXT;
BEGIN
    FOR t IN
        SELECT * FROM (VALUES
            ('finance_incomes',  'expected_date'),
            ('finance_debts',    'due_date'),
            ('finance_expenses', 'date')
        ) AS x(tbl, datecol)
    LOOP
        -- cycle_week
        SELECT is_generated INTO is_gen
          FROM information_schema.columns
         WHERE table_schema='public' AND table_name=t.tbl AND column_name='cycle_week';

        IF is_gen IS NULL THEN
            EXECUTE format(
                'ALTER TABLE public.%I ADD COLUMN cycle_week INT GENERATED ALWAYS AS (public.fn_cycle_week(%I)) STORED',
                t.tbl, t.datecol);
        ELSIF is_gen <> 'ALWAYS' THEN
            -- coluna manual da v1: derruba e recria como gerada
            EXECUTE format('ALTER TABLE public.%I DROP COLUMN cycle_week', t.tbl);
            EXECUTE format(
                'ALTER TABLE public.%I ADD COLUMN cycle_week INT GENERATED ALWAYS AS (public.fn_cycle_week(%I)) STORED',
                t.tbl, t.datecol);
        END IF;

        -- reference_month
        SELECT is_generated INTO is_gen
          FROM information_schema.columns
         WHERE table_schema='public' AND table_name=t.tbl AND column_name='reference_month';

        IF is_gen IS NULL THEN
            EXECUTE format(
                'ALTER TABLE public.%I ADD COLUMN reference_month DATE GENERATED ALWAYS AS (public.fn_reference_month(%I)) STORED',
                t.tbl, t.datecol);
        ELSIF is_gen <> 'ALWAYS' THEN
            EXECUTE format('ALTER TABLE public.%I DROP COLUMN reference_month', t.tbl);
            EXECUTE format(
                'ALTER TABLE public.%I ADD COLUMN reference_month DATE GENERATED ALWAYS AS (public.fn_reference_month(%I)) STORED',
                t.tbl, t.datecol);
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 6. ÍNDICES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_incomes_month  ON public.finance_incomes(reference_month, cycle_week);
CREATE INDEX IF NOT EXISTS idx_debts_month    ON public.finance_debts(reference_month, cycle_week);
CREATE INDEX IF NOT EXISTS idx_expenses_month ON public.finance_expenses(reference_month, cycle_week);
CREATE INDEX IF NOT EXISTS idx_expenses_date  ON public.finance_expenses(date);
CREATE INDEX IF NOT EXISTS idx_incomes_user   ON public.finance_incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user     ON public.finance_debts(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user  ON public.finance_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_series  ON public.finance_incomes(series_id);
CREATE INDEX IF NOT EXISTS idx_debts_series    ON public.finance_debts(series_id);
CREATE INDEX IF NOT EXISTS idx_expenses_series ON public.finance_expenses(series_id);

-- O app filtra por perfil E por mês ao mesmo tempo; um índice por coluna
-- isolada não cobre esse par.
CREATE INDEX IF NOT EXISTS idx_incomes_user_month  ON public.finance_incomes(user_id, reference_month);
CREATE INDEX IF NOT EXISTS idx_debts_user_month    ON public.finance_debts(user_id, reference_month);
CREATE INDEX IF NOT EXISTS idx_expenses_user_month ON public.finance_expenses(user_id, reference_month);

-- ==============================================================================
-- 6b. updated_at QUE REALMENTE ATUALIZA
-- As três tabelas tinham a coluna, mas nada a tocava: todo registro ficava com
-- a data da criação para sempre. Agora um gatilho a mantém em dia.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := TIMEZONE('utc', NOW());
    RETURN NEW;
END $$;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['finance_incomes','finance_debts','finance_expenses'] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_updated_at ON public.%I', t);
        EXECUTE format(
            'CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON public.%I '
            'FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at()', t);
    END LOOP;
END $$;

-- ==============================================================================
-- 7. VIEW DE RESUMO — POR MÊS E POR SEMANA, PREVISTO x REALIZADO
-- A v1 somava tudo de todos os meses na mesma semana e chamava de "saldo" o
-- previsto menos as saídas. Aqui saldo_realizado = recebido - efetivamente pago.
-- ==============================================================================

DROP VIEW IF EXISTS public.v_finance_weekly_summary;

CREATE OR REPLACE VIEW public.v_finance_monthly_summary AS
WITH base AS (
    SELECT reference_month, cycle_week, user_id,
           amount AS income_planned,
           CASE WHEN received THEN amount ELSE 0 END AS income_actual,
           0::NUMERIC AS debt_planned,  0::NUMERIC AS debt_actual,
           0::NUMERIC AS expense_planned, 0::NUMERIC AS expense_actual
      FROM public.finance_incomes
    UNION ALL
    SELECT reference_month, cycle_week, user_id,
           0, 0,
           CASE WHEN status <> 'Pago' THEN installment_amount ELSE 0 END,
           CASE WHEN status =  'Pago' THEN installment_amount ELSE 0 END,
           0, 0
      FROM public.finance_debts
    UNION ALL
    SELECT reference_month, cycle_week, user_id,
           0, 0, 0, 0,
           amount,
           CASE WHEN paid THEN amount ELSE 0 END
      FROM public.finance_expenses
)
SELECT
    reference_month,
    cycle_week,
    user_id,
    SUM(income_planned)                                   AS total_income_planned,
    SUM(income_actual)                                    AS total_income_actual,
    SUM(debt_planned + debt_actual)                       AS total_debts,
    SUM(expense_planned)                                  AS total_expenses,
    SUM(debt_planned + debt_actual + expense_planned)     AS total_outgoing,
    SUM(income_planned) - SUM(debt_planned + debt_actual + expense_planned) AS balance_planned,
    SUM(income_actual)  - SUM(debt_actual + expense_actual)                 AS balance_actual
  FROM base
 GROUP BY reference_month, cycle_week, user_id;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY
--
-- ATENÇÃO — LEIA ANTES DE PUBLICAR O APP:
-- As políticas abaixo liberam leitura e escrita para a chave anônima, que vai
-- embutida no bundle do site, do .exe e do APK. Quem extrair a chave lê e
-- escreve as finanças de TODOS os perfis. Isso é aceitável enquanto o app roda
-- só na sua máquina; NÃO é aceitável se você distribuir o instalador.
--
-- Para fechar isso de verdade é preciso trocar o login por perfil pelo
-- Supabase Auth. O script pronto está em supabase_rls_hardening.sql.
-- ==============================================================================

ALTER TABLE public.finance_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_incomes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_debts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acesso_total_users"    ON public.finance_users;
DROP POLICY IF EXISTS "acesso_total_incomes"  ON public.finance_incomes;
DROP POLICY IF EXISTS "acesso_total_debts"    ON public.finance_debts;
DROP POLICY IF EXISTS "acesso_total_expenses" ON public.finance_expenses;
-- nomes antigos da v1
DROP POLICY IF EXISTS "Acesso total aos usuarios"     ON public.finance_users;
DROP POLICY IF EXISTS "Acesso total aos recebimentos" ON public.finance_incomes;
DROP POLICY IF EXISTS "Acesso total às dívidas"       ON public.finance_debts;
DROP POLICY IF EXISTS "Acesso total às despesas"      ON public.finance_expenses;

CREATE POLICY "acesso_total_users"    ON public.finance_users    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_incomes"  ON public.finance_incomes  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_debts"    ON public.finance_debts    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_expenses" ON public.finance_expenses FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 9. PERFIL PADRÃO
-- Sem dados de demonstração: eles poluiriam suas finanças reais.
-- ==============================================================================

INSERT INTO public.finance_users (name, avatar_color, is_default)
SELECT 'Meu Perfil', 'blue', TRUE
 WHERE NOT EXISTS (SELECT 1 FROM public.finance_users);
