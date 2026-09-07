 -- ==============================================================================
-- SISTEMA DE CONTROLE FINANCEIRO MULTIUSUÁRIO / COMPARTILHADO
-- Script SQL para Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis / Contas de Usuários (Para compartilhamento em família / sócios)
CREATE TABLE IF NOT EXISTS public.finance_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT 'blue',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Inserir usuário principal padrão caso não exista
INSERT INTO public.finance_users (id, name, avatar_color, is_default)
VALUES ('00000000-0000-0000-0000-000000000001', 'Meu Perfil', 'blue', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Tabela de Recebimentos / Rendas Periódicas
CREATE TABLE IF NOT EXISTS public.finance_incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.finance_users(id) ON DELETE SET NULL,
    user_name TEXT,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    expected_date DATE NOT NULL,
    cycle_week INT NOT NULL DEFAULT 1,
    category TEXT NOT NULL CHECK (category IN ('Salario', 'Adiantamento', 'Vale', 'Comissao', 'Diaria', 'Extra', 'Outro')) DEFAULT 'Salario',
    received BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Tabela de Dívidas & Parcelamentos
CREATE TABLE IF NOT EXISTS public.finance_debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.finance_users(id) ON DELETE SET NULL,
    user_name TEXT,
    creditor TEXT NOT NULL,
    description TEXT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    installment_amount NUMERIC(12, 2) NOT NULL CHECK (installment_amount > 0),
    current_installment INT NOT NULL DEFAULT 1 CHECK (current_installment >= 1),
    total_installments INT NOT NULL DEFAULT 1 CHECK (total_installments >= current_installment),
    due_date DATE NOT NULL,
    cycle_week INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN ('Pendente', 'Pago', 'Atrasado')) DEFAULT 'Pendente',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Tabela de Despesas & Gastos (Fixos e Diários)
CREATE TABLE IF NOT EXISTS public.finance_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id REFERENCES public.finance_users(id) ON DELETE SET NULL,
    user_name TEXT,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    cycle_week INT NOT NULL DEFAULT 1,
    category TEXT NOT NULL CHECK (category IN ('Alimentacao', 'Moradia', 'Transporte', 'Lazer', 'Saude', 'Servicos', 'Outros')) DEFAULT 'Outros',
    is_fixed BOOLEAN NOT NULL DEFAULT FALSE,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- 6. Índices para Otimização de Consultas por Semana e Data
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_incomes_cycle_week ON public.finance_incomes(cycle_week, expected_date);
CREATE INDEX IF NOT EXISTS idx_debts_cycle_week ON public.finance_debts(cycle_week, due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_cycle_week ON public.finance_expenses(cycle_week, date);
CREATE INDEX IF NOT EXISTS idx_incomes_user ON public.finance_incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user ON public.finance_debts(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON public.finance_expenses(user_id);

-- ==============================================================================
-- 7. View Inteligente: Resumo Periódico por Semana
-- ==============================================================================
CREATE OR REPLACE VIEW public.v_finance_weekly_summary AS
WITH weeks AS (
    SELECT generate_series(1, 4) AS week_num
),
incomes_agg AS (
    SELECT cycle_week, COALESCE(SUM(amount), 0) AS total_income, COALESCE(SUM(CASE WHEN received THEN amount ELSE 0 END), 0) AS received_income
    FROM public.finance_incomes
    GROUP BY cycle_week
),
debts_agg AS (
    SELECT cycle_week, COALESCE(SUM(installment_amount), 0) AS total_debts
    FROM public.finance_debts
    WHERE status != 'Pago'
    GROUP BY cycle_week
),
expenses_agg AS (
    SELECT cycle_week, COALESCE(SUM(amount), 0) AS total_expenses, COALESCE(SUM(CASE WHEN paid THEN amount ELSE 0 END), 0) AS paid_expenses
    FROM public.finance_expenses
    GROUP BY cycle_week
)
SELECT
    w.week_num,
    CASE WHEN w.week_num <= 3 THEN TRUE ELSE FALSE END AS has_regular_income,
    COALESCE(i.total_income, 0) AS total_income,
    COALESCE(i.received_income, 0) AS received_income,
    COALESCE(d.total_debts, 0) AS total_debts,
    COALESCE(e.total_expenses, 0) AS total_expenses,
    COALESCE(d.total_debts, 0) + COALESCE(e.total_expenses, 0) AS total_outgoing,
    COALESCE(i.total_income, 0) - (COALESCE(d.total_debts, 0) + COALESCE(e.total_expenses, 0)) AS net_balance
FROM weeks w
LEFT JOIN incomes_agg i ON w.week_num = i.cycle_week
LEFT JOIN debts_agg d ON w.week_num = d.cycle_week
LEFT JOIN expenses_agg e ON w.week_num = e.cycle_week
ORDER BY w.week_num;

-- ==============================================================================
-- 8. Row Level Security (RLS) & Políticas de Acesso
-- ==============================================================================
ALTER TABLE public.finance_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir uso direto / anônimo (anon) ou autenticado (authenticated)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Acesso total aos usuarios" ON public.finance_users;
    CREATE POLICY "Acesso total aos usuarios" ON public.finance_users
        FOR ALL USING (true);

    DROP POLICY IF EXISTS "Acesso total aos recebimentos" ON public.finance_incomes;
    CREATE POLICY "Acesso total aos recebimentos" ON public.finance_incomes
        FOR ALL USING (true);

    DROP POLICY IF EXISTS "Acesso total às dívidas" ON public.finance_debts;
    CREATE POLICY "Acesso total às dívidas" ON public.finance_debts
        FOR ALL USING (true);

    DROP POLICY IF EXISTS "Acesso total às despesas" ON public.finance_expenses;
    CREATE POLICY "Acesso total às despesas" ON public.finance_expenses
        FOR ALL USING (true);
END $$;

-- ==============================================================================
-- 9. Dados Iniciais de Demonstração (Seed)
-- ==============================================================================
INSERT INTO public.finance_users (id, name, avatar_color, is_default) VALUES
('00000000-0000-0000-0000-000000000001', 'Meu Perfil', 'blue', true),
('00000000-0000-0000-0000-000000000002', 'Esposa / Parceiro(a)', 'purple', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.finance_incomes (user_id, user_name, description, amount, expected_date, cycle_week, category, received) VALUES
('00000000-0000-0000-0000-000000000001', 'Meu Perfil', '1º Recebimento da Semana', 1400.00, CURRENT_DATE + INTERVAL '1 day', 1, 'Salario', true),
('00000000-0000-0000-0000-000000000002', 'Esposa / Parceiro(a)', 'Renda Extra / Vendas', 850.00, CURRENT_DATE + INTERVAL '5 days', 1, 'Extra', false)
ON CONFLICT DO NOTHING;

INSERT INTO public.finance_debts (user_id, user_name, creditor, description, total_amount, installment_amount, current_installment, total_installments, due_date, cycle_week, status) VALUES
('00000000-0000-0000-0000-000000000001', 'Meu Perfil', 'Cartão Nubank', 'Parcela Smartphone', 1200.00, 300.00, 2, 4, CURRENT_DATE + INTERVAL '4 days', 1, 'Pendente')
ON CONFLICT DO NOTHING;

INSERT INTO public.finance_expenses (user_id, user_name, description, amount, date, cycle_week, category, is_fixed, paid) VALUES
('00000000-0000-0000-0000-000000000001', 'Meu Perfil', 'Supermercado da Semana', 450.00, CURRENT_DATE + INTERVAL '2 days', 1, 'Alimentacao', false, false),
('00000000-0000-0000-0000-000000000002', 'Esposa / Parceiro(a)', 'Internet & Contas', 180.00, CURRENT_DATE + INTERVAL '7 days', 2, 'Servicos', true, false)
ON CONFLICT DO NOTHING;

