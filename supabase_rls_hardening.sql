-- ==============================================================================
-- FLUXO FINANCEIRO — FECHAMENTO DE SEGURANÇA (opcional, exige decisão)
--
-- NÃO RODE ISTO SEM LER. Ele quebra o login atual de propósito.
--
-- PROBLEMA QUE ELE RESOLVE
-- O app usa a chave anônima do Supabase, que vai embutida no bundle do site, do
-- .exe e do APK. Com as políticas permissivas do schema padrão, qualquer pessoa
-- que extraia essa chave do instalador lê e escreve as finanças de todos os
-- perfis. A "senha de perfil" não protege nada: ela é conferida no navegador,
-- não no banco.
--
-- O QUE MUDA
-- O acesso passa a exigir um usuário autenticado pelo Supabase Auth, e cada
-- pessoa só enxerga os próprios lançamentos. Em troca:
--   - o login por "escolher um perfil na lista" deixa de existir; vira e-mail
--     e senha de verdade
--   - cada perfil precisa virar um usuário no Supabase Auth
--   - finance_users.id passa a ser o auth.uid() da pessoa
--   - compartilhar lançamentos entre você e a Cacá deixa de ser automático e
--     precisa de uma tabela de compartilhamento (incluída no final)
--
-- PASSO A PASSO
--   1. Crie os usuários em Authentication > Users no painel do Supabase
--   2. Rode o bloco 1 para reapontar os perfis existentes para esses auth.uid()
--   3. Rode o bloco 2 para trocar as políticas
--   4. Troque a tela de login do app por Supabase Auth (signInWithPassword)
-- ==============================================================================


-- ------------------------------------------------------------------------------
-- BLOCO 1 — Reapontar perfis existentes para contas do Supabase Auth
-- Preencha o de-para e rode. Repita uma linha por pessoa.
-- ------------------------------------------------------------------------------
/*
DO $$
DECLARE
    de_para JSONB := '[
      {"perfil": "Guilherme", "email": "guilherme@exemplo.com"},
      {"perfil": "Cacá",      "email": "caca@exemplo.com"}
    ]';
    item JSONB;
    novo_id UUID;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(de_para) LOOP
        SELECT id INTO novo_id FROM auth.users WHERE email = item->>'email';

        IF novo_id IS NULL THEN
            RAISE EXCEPTION 'Nenhum usuário no Auth com o e-mail %', item->>'email';
        END IF;

        -- Os lançamentos seguem o perfil por causa do ON DELETE SET NULL, então
        -- a troca de id é feita em cascata manual.
        UPDATE public.finance_users SET id = novo_id WHERE name = item->>'perfil';
    END LOOP;
END $$;
*/


-- ------------------------------------------------------------------------------
-- BLOCO 2 — Políticas reais: cada um enxerga o que é seu
-- ------------------------------------------------------------------------------
/*
-- Tabela de compartilhamento: quem pode ver os lançamentos de quem.
CREATE TABLE IF NOT EXISTS public.finance_shares (
    owner_id  UUID NOT NULL REFERENCES public.finance_users(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.finance_users(id) ON DELETE CASCADE,
    can_write BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (owner_id, viewer_id)
);
ALTER TABLE public.finance_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shares_proprios" ON public.finance_shares
    FOR ALL USING (owner_id = auth.uid() OR viewer_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Quem eu posso LER: eu mesmo + quem me compartilhou
CREATE OR REPLACE FUNCTION public.fn_pode_ler(dono UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $fn$
    SELECT dono = auth.uid()
        OR EXISTS (SELECT 1 FROM public.finance_shares s
                    WHERE s.owner_id = dono AND s.viewer_id = auth.uid());
$fn$;

-- Quem eu posso ESCREVER: eu mesmo + quem me deu permissão de escrita
CREATE OR REPLACE FUNCTION public.fn_pode_escrever(dono UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $fn$
    SELECT dono = auth.uid()
        OR EXISTS (SELECT 1 FROM public.finance_shares s
                    WHERE s.owner_id = dono AND s.viewer_id = auth.uid() AND s.can_write);
$fn$;

-- Derruba o acesso aberto
DROP POLICY IF EXISTS "acesso_total_users"    ON public.finance_users;
DROP POLICY IF EXISTS "acesso_total_incomes"  ON public.finance_incomes;
DROP POLICY IF EXISTS "acesso_total_debts"    ON public.finance_debts;
DROP POLICY IF EXISTS "acesso_total_expenses" ON public.finance_expenses;

CREATE POLICY "perfil_proprio" ON public.finance_users
    FOR ALL USING (id = auth.uid() OR public.fn_pode_ler(id))
    WITH CHECK (id = auth.uid());

CREATE POLICY "incomes_proprios" ON public.finance_incomes
    FOR ALL USING (public.fn_pode_ler(user_id))
    WITH CHECK (public.fn_pode_escrever(user_id));

CREATE POLICY "debts_proprios" ON public.finance_debts
    FOR ALL USING (public.fn_pode_ler(user_id))
    WITH CHECK (public.fn_pode_escrever(user_id));

CREATE POLICY "expenses_proprios" ON public.finance_expenses
    FOR ALL USING (public.fn_pode_ler(user_id))
    WITH CHECK (public.fn_pode_escrever(user_id));

-- Sem isso, um lançamento com user_id NULL ficaria invisível para todo mundo.
ALTER TABLE public.finance_incomes  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.finance_debts    ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.finance_expenses ALTER COLUMN user_id SET NOT NULL;

-- Compartilhamento mútuo entre os dois perfis (ajuste os nomes)
INSERT INTO public.finance_shares (owner_id, viewer_id, can_write)
SELECT a.id, b.id, TRUE FROM public.finance_users a, public.finance_users b
 WHERE a.id <> b.id
ON CONFLICT DO NOTHING;

-- A coluna password_hash deixa de ter função: a senha passa a ser do Auth.
ALTER TABLE public.finance_users DROP COLUMN IF EXISTS password_hash;
*/
