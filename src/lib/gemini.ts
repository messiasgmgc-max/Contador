/**
 * Integração com Google Gemini para Assistente Financeiro Pessoal
 * Modelos suportados: gemini-2.5-flash, gemini-1.5-flash
 */

import type { UserProfile, IncomeItem, DebtItem, ExpenseItem } from '../types/finance';
import { formatBRL } from './period';

import { supabase } from './supabase';

const STORAGE_KEY = 'finance_gemini_api_key';
export const GEMINI_MODEL = 'gemini-3.6-flash';

export function getStoredGeminiApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
}

export function setStoredGeminiApiKey(key: string): void {
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
}

/**
 * Carrega a chave do Gemini salva nas configurações globais do Supabase
 */
export async function loadGeminiApiKeyFromCloud(): Promise<string> {
  try {
    const { data } = await supabase
      .from('finance_settings')
      .select('value')
      .eq('key', 'gemini_api_key')
      .maybeSingle();

    if (data?.value) {
      setStoredGeminiApiKey(data.value);
      return data.value;
    }
  } catch {
    // Se a tabela não existir, tenta carregar de users ou mantém o local
  }
  return getStoredGeminiApiKey();
}

/**
 * Salva a chave do Gemini no Supabase para sincronizar entre todos os aparelhos
 */
export async function saveGeminiApiKeyToCloud(key: string): Promise<void> {
  setStoredGeminiApiKey(key);
  try {
    await supabase
      .from('finance_settings')
      .upsert({ key: 'gemini_api_key', value: key.trim() }, { onConflict: 'key' });
  } catch (err) {
    console.warn('Não foi possível salvar a chave no finance_settings do Supabase:', err);
  }
}

export interface FinancialContext {
  currentUser: UserProfile;
  monthKey: string;
  summary: {
    totalIncome: number;
    totalDebts: number;
    totalExpenses: number;
    totalOutgoing: number;
    netBalance: number;
  };
  incomes: IncomeItem[];
  debts: DebtItem[];
  expenses: ExpenseItem[];
}

export interface ExtractedTransaction {
  type: 'receita' | 'divida' | 'gasto';
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category?: string;
  creditor?: string;
  installments?: number;
}

/**
 * Monta o resumo em texto para servir de contexto para o Gemini
 */
function buildContextPrompt(ctx: FinancialContext): string {
  const pendingDebts = ctx.debts.filter(d => d.status !== 'Pago');
  const pendingDebtsTotal = pendingDebts.reduce((acc, d) => acc + d.installmentAmount, 0);

  const debtsList = pendingDebts.slice(0, 10).map(d => 
    `- ${d.creditor}: ${formatBRL(d.installmentAmount)} (venc: ${d.dueDate}, parcela ${d.currentInstallment}/${d.totalInstallments})`
  ).join('\n');

  const incomesList = ctx.incomes.slice(0, 8).map(i =>
    `- ${i.description}: ${formatBRL(i.amount)} (${i.expectedDate}, ${i.received ? 'recebido' : 'a receber'})`
  ).join('\n');

  const expensesList = ctx.expenses.slice(0, 8).map(e =>
    `- ${e.description} (${e.category}): ${formatBRL(e.amount)} (${e.date})`
  ).join('\n');

  const today = new Date().toISOString().split('T')[0];

  return `
Você é o assistente financeiro pessoal de ${ctx.currentUser.name} no aplicativo Fluxo Financeiro.
Você é direto, amigável, motivador e realista. Responda em português do Brasil de forma clara e objetiva.

DADOS ATUAIS DO MÊS (${ctx.monthKey}):
- Total de Receitas: ${formatBRL(ctx.summary.totalIncome)}
- Total de Despesas e Contas: ${formatBRL(ctx.summary.totalExpenses)}
- Total de Dívidas do mês: ${formatBRL(ctx.summary.totalDebts)} (Pendentes a pagar: ${formatBRL(pendingDebtsTotal)})
- Total de Saídas (Despesas + Dívidas): ${formatBRL(ctx.summary.totalOutgoing)}
- Saldo Líquido Previsto: ${formatBRL(ctx.summary.netBalance)}

ALGUMAS RECEITAS REGISTRADAS:
${incomesList || 'Nenhuma receita registrada'}

ALGUMAS DÍVIDAS PENDENTES:
${debtsList || 'Nenhuma dívida pendente'}

ALGUMAS DESPESAS:
${expensesList || 'Nenhuma despesa registrada'}

HOJE É: ${today}.
Ajude ${ctx.currentUser.name} com análises rápidas, identificação de semanas com aperto financeiro, dicas para economizar e esclarecimento de dúvidas sobre os lançamentos.
`;
}

/**
 * Chamada à API do Gemini via fetch direto (sem dependências pesadas)
 */
export async function askGemini(prompt: string, ctx: FinancialContext, apiKey?: string): Promise<string> {
  const key = apiKey || getStoredGeminiApiKey();
  if (!key) {
    throw new Error('Chave de API do Gemini não configurada. Insira sua chave para conversar com a inteligência.');
  }

  const systemInstruction = buildContextPrompt(ctx);
  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    }
  };

  const callModel = async (model: string) => {
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  let response = await callModel(GEMINI_MODEL);

  // Fallback caso o modelo especificado não esteja disponível na conta/região
  if (!response.ok && (response.status === 404 || response.status === 400)) {
    response = await callModel('gemini-2.5-flash');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData?.error?.message || `Erro ${response.status}: ${response.statusText}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Nenhuma resposta retornada pelo Gemini.');
  }

  return text;
}

/**
 * Pede ao Gemini para analisar a frase e extrair dados de uma transação financeira para inserção automática
 */
export async function parseTransactionWithGemini(
  text: string,
  ctx: FinancialContext,
  apiKey?: string
): Promise<ExtractedTransaction | null> {
  const key = apiKey || getStoredGeminiApiKey();
  if (!key) throw new Error('Chave de API do Gemini necessária.');

  const today = new Date().toISOString().split('T')[0];
  const prompt = `
Analise a mensagem do usuário e extraia se é um GASTO, RECEITA ou DÍVIDA.
Hoje é dia ${today}.
Mês atual de trabalho: ${ctx.monthKey}.

Retorne APENAS um objeto JSON válido (sem markdown, sem \`\`\`json) no seguinte formato:
{
  "type": "receita" | "divida" | "gasto",
  "description": "Nome conciso",
  "amount": 50.00,
  "date": "YYYY-MM-DD",
  "category": "Alimentacao" | "Moradia" | "Transporte" | "Lazer" | "Saude" | "Servicos" | "Outros" | "Salario" | "Extra",
  "creditor": "Nome do credor ou banco (somente se type for divida)",
  "installments": 1
}

Mensagem do usuário: "${text}"
`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
  };

  const callModel = async (model: string) => {
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  let response = await callModel(GEMINI_MODEL);
  if (!response.ok && (response.status === 404 || response.status === 400)) {
    response = await callModel('gemini-2.5-flash');
  }

  if (!response.ok) return null;
  const data = await response.json();
  const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) return null;

  try {
    return JSON.parse(rawJson) as ExtractedTransaction;
  } catch {
    return null;
  }
}

