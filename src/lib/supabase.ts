import { createClient } from '@supabase/supabase-js';

/**
 * A URL e a chave vêm SEMPRE do .env — não existe mais valor chumbado aqui.
 * O arquivo antigo trazia a chave do projeto escrita no código, o que a
 * colocava no histórico do git além do bundle. Se você ainda não rotacionou
 * essa chave no painel do Supabase, rotacione: ela está no histórico.
 *
 * Copie .env.example para .env e preencha os dois valores.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltam VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY. ' +
    'Copie o .env.example para .env, preencha com os dados do seu projeto ' +
    'no Supabase e rode o build de novo.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
