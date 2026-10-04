import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const EXPECTED_KEY = process.env.JARVIS_API_KEY || 'jarvis_secret_key_2026';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para obter resumo consolidado de um mês para um usuário
async function fetchMonthSummary(monthStr: string, userId: string) {
  const refMonth = `${monthStr}-01`;

  const { data: summaryData } = await supabase
    .from('v_finance_monthly_summary')
    .select('*')
    .eq('reference_month', refMonth)
    .eq('user_id', userId);

  // Semanas sempre com valores numéricos zerados por padrão
  const weeksDetail: Record<number, any> = {
    1: { cycle_week: 1, total_income_planned: 0, total_income_actual: 0, total_debts: 0, total_expenses: 0, balance_planned: 0, balance_actual: 0 },
    2: { cycle_week: 2, total_income_planned: 0, total_income_actual: 0, total_debts: 0, total_expenses: 0, balance_planned: 0, balance_actual: 0 },
    3: { cycle_week: 3, total_income_planned: 0, total_income_actual: 0, total_debts: 0, total_expenses: 0, balance_planned: 0, balance_actual: 0 },
    4: { cycle_week: 4, total_income_planned: 0, total_income_actual: 0, total_debts: 0, total_expenses: 0, balance_planned: 0, balance_actual: 0 },
  };

  let totalIncomePlanned = 0;
  let totalIncomeActual = 0;
  let totalDebts = 0;
  let totalExpenses = 0;

  if (summaryData && summaryData.length > 0) {
    for (const s of summaryData) {
      totalIncomePlanned += Number(s.total_income_planned || 0);
      totalIncomeActual += Number(s.total_income_actual || 0);
      totalDebts += Number(s.total_debts || 0);
      totalExpenses += Number(s.total_expenses || 0);

      const cw = Number(s.cycle_week);
      if (cw >= 1 && cw <= 4) {
        weeksDetail[cw] = {
          cycle_week: cw,
          total_income_planned: Number(s.total_income_planned || 0),
          total_income_actual: Number(s.total_income_actual || 0),
          total_debts: Number(s.total_debts || 0),
          total_expenses: Number(s.total_expenses || 0),
          balance_planned: Number(s.balance_planned || 0),
          balance_actual: Number(s.balance_actual || 0),
        };
      }
    }
  }

  // Despesas do mês
  const { data: monthExpenses } = await supabase
    .from('finance_expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('reference_month', refMonth)
    .order('date', { ascending: false });

  const expensesList = monthExpenses || [];
  const totalExpensesPaid = expensesList.filter(e => e.paid).reduce((acc, e) => acc + Number(e.amount || 0), 0);

  // Agrupamento de gastos por categoria
  const catMap = new Map<string, number>();
  for (const e of expensesList) {
    const cat = e.category || 'Outros';
    catMap.set(cat, (catMap.get(cat) || 0) + Number(e.amount || 0));
  }
  const expensesByCategory = Array.from(catMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Number(((amount / totalExpenses) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Dívidas do mês de referência
  const { data: monthDebtsData } = await supabase
    .from('finance_debts')
    .select('*')
    .eq('user_id', userId)
    .eq('reference_month', refMonth)
    .order('due_date', { ascending: true });

  const debtsList = monthDebtsData || [];
  const totalDebtsPaid = debtsList.filter(d => d.status === 'Pago').reduce((acc, d) => acc + Number(d.installment_amount || 0), 0);

  // Receitas pendentes e totais de receita do mês
  const { data: monthIncomesData } = await supabase
    .from('finance_incomes')
    .select('*')
    .eq('user_id', userId)
    .eq('reference_month', refMonth)
    .order('expected_date', { ascending: true });

  const incomesList = monthIncomesData || [];
  const pendingIncomes = incomesList.filter(i => !i.received);
  const totalIncomePending = pendingIncomes.reduce((acc, i) => acc + Number(i.amount || 0), 0);

  // Dívidas urgentes (próximos 7 dias para visualização rápida)
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const { data: urgentDebts } = await supabase
    .from('finance_debts')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'Pago')
    .lte('due_date', nextWeek)
    .order('due_date', { ascending: true });

  // 1. Saldo de Meses Anteriores (previousBalance)
  const [pastIncomesRes, pastDebtsRes, pastExpensesRes] = await Promise.all([
    supabase
      .from('finance_incomes')
      .select('amount')
      .eq('user_id', userId)
      .lt('reference_month', refMonth)
      .eq('received', true),
    supabase
      .from('finance_debts')
      .select('installment_amount')
      .eq('user_id', userId)
      .lt('reference_month', refMonth)
      .eq('status', 'Pago'),
    supabase
      .from('finance_expenses')
      .select('amount')
      .eq('user_id', userId)
      .lt('reference_month', refMonth)
      .eq('paid', true),
  ]);

  const pastIncomeTotal = (pastIncomesRes.data || []).reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const pastDebtsTotal = (pastDebtsRes.data || []).reduce((acc, d) => acc + Number(d.installment_amount || 0), 0);
  const pastExpensesTotal = (pastExpensesRes.data || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const previousBalance = pastIncomeTotal - (pastDebtsTotal + pastExpensesTotal);

  // 2. Saldos do mês e acumulados
  const monthBalanceActual = totalIncomeActual - (totalDebtsPaid + totalExpensesPaid);
  const monthBalancePlanned = totalIncomePlanned - (totalDebts + totalExpenses);
  const cumulativeBalanceActual = previousBalance + monthBalanceActual;
  const cumulativeBalancePlanned = previousBalance + monthBalancePlanned;

  return {
    month: monthStr,
    totals: {
      previous_balance: previousBalance,
      total_income_planned: totalIncomePlanned,
      total_income_actual: totalIncomeActual,
      total_income_pending: totalIncomePending,
      total_expenses: totalExpenses,
      total_expenses_paid: totalExpensesPaid,
      total_debts: totalDebts,
      total_debts_paid: totalDebtsPaid,
      month_balance_planned: monthBalancePlanned,
      month_balance_actual: monthBalanceActual,
      balance_planned: cumulativeBalancePlanned,
      balance_actual: cumulativeBalanceActual,
    },
    weeks: weeksDetail,
    summary_by_week: summaryData || [],
    month_debts: debtsList,
    urgent_debts: urgentDebts || [],
    expenses_by_category: expensesByCategory,
    pending_incomes: pendingIncomes,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-jarvis-key, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientKey = req.headers['x-jarvis-key'] || (req.headers.authorization || '').replace('Bearer ', '');
  if (EXPECTED_KEY && clientKey !== EXPECTED_KEY) {
    return res.status(401).json({ error: 'Chave do JARVIS não autorizada' });
  }

  try {
    // Descobre o usuário padrão
    const { data: users } = await supabase.from('finance_users').select('id, name, is_default');
    const defaultUser = users?.find(u => u.is_default) || users?.[0] || { id: '00000000-0000-0000-0000-000000000001', name: 'Meu Perfil' };

    if (req.method === 'GET') {
      const action = String(req.query.action || 'summary');
      const now = new Date();
      const currentMonth = req.query.month ? String(req.query.month) : now.toISOString().slice(0, 7);
      const refMonth = `${currentMonth}-01`;
      const userId = req.query.user_id ? String(req.query.user_id) : defaultUser.id;
      const userName = users?.find(u => u.id === userId)?.name || defaultUser.name;

      if (action === 'summary') {
        const summaryResult = await fetchMonthSummary(currentMonth, userId);
        return res.status(200).json({
          ok: true,
          user: userName,
          user_id: userId,
          ...summaryResult,
        });
      }

      if (action === 'compare') {
        const monthA = req.query.month ? String(req.query.month) : currentMonth;
        const monthB = req.query.compare_to ? String(req.query.compare_to) : (() => {
          // Mês anterior por padrão
          const [y, m] = monthA.split('-').map(Number);
          const prev = new Date(Date.UTC(y, m - 2, 1));
          return prev.toISOString().slice(0, 7);
        })();

        const [dataA, dataB] = await Promise.all([
          fetchMonthSummary(monthA, userId),
          fetchMonthSummary(monthB, userId),
        ]);

        const variation = {
          total_income_planned: dataA.totals.total_income_planned - dataB.totals.total_income_planned,
          total_income_actual: dataA.totals.total_income_actual - dataB.totals.total_income_actual,
          total_expenses: dataA.totals.total_expenses - dataB.totals.total_expenses,
          total_expenses_paid: dataA.totals.total_expenses_paid - dataB.totals.total_expenses_paid,
          total_debts: dataA.totals.total_debts - dataB.totals.total_debts,
          total_debts_paid: dataA.totals.total_debts_paid - dataB.totals.total_debts_paid,
          balance_actual: dataA.totals.balance_actual - dataB.totals.balance_actual,
          balance_planned: dataA.totals.balance_planned - dataB.totals.balance_planned,
        };

        return res.status(200).json({
          ok: true,
          user: userName,
          user_id: userId,
          month_a: dataA,
          month_b: dataB,
          variation,
        });
      }

      if (action === 'incomes') {
        let q = supabase
          .from('finance_incomes')
          .select('*')
          .eq('user_id', userId);

        if (req.query.month) {
          q = q.eq('reference_month', refMonth);
        }

        const { data, error } = await q.order('expected_date', { ascending: true });
        if (error) throw error;
        return res.status(200).json({ ok: true, incomes: data || [] });
      }

      if (action === 'expenses') {
        let q = supabase
          .from('finance_expenses')
          .select('*')
          .eq('user_id', userId);

        if (req.query.month) {
          q = q.eq('reference_month', refMonth);
        }

        if (req.query.category) {
          q = q.eq('category', String(req.query.category));
        }

        const { data, error } = await q.order('date', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ ok: true, expenses: data || [] });
      }

      if (action === 'debts') {
        const statusFilter = req.query.status ? String(req.query.status) : 'Pendente';
        let q = supabase.from('finance_debts').select('*').eq('user_id', userId);

        if (req.query.month) {
          q = q.eq('reference_month', refMonth);
        }

        if (statusFilter.toLowerCase() !== 'todas') {
          q = q.eq('status', statusFilter);
        }

        const { data, error } = await q.order('due_date', { ascending: true });
        if (error) throw error;
        return res.status(200).json({ ok: true, debts: data || [] });
      }

      if (action === 'envelopes') {
        const { data, error } = await supabase
          .from('finance_envelopes')
          .select('*')
          .eq('user_id', userId)
          .eq('month_key', currentMonth);
        if (error) throw error;
        return res.status(200).json({ ok: true, envelopes: data || [] });
      }
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const action = body.action;
      const userId = body.user_id || defaultUser.id;
      const userName = users?.find(u => u.id === userId)?.name || defaultUser.name;

      // Helper para montar payload sem colunas geradas
      const buildPayload = (raw: Record<string, any>) => {
        const p: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          if (v !== undefined && k !== 'reference_month' && k !== 'cycle_week') {
            p[k] = v;
          }
        }
        return p;
      };

      if (action === 'add_expense') {
        const insertData = buildPayload({
          user_id: userId,
          user_name: userName,
          description: body.description,
          amount: body.amount,
          date: body.date || new Date().toISOString().slice(0, 10),
          category: body.category || 'Outros',
          is_fixed: body.is_fixed ?? false,
          paid: body.paid ?? true,
          is_card: body.is_card ?? false,
          card_name: body.card_name || null,
          installments: body.installments || 1,
        });

        const { data, error } = await supabase.from('finance_expenses').insert([insertData]).select();
        if (error) throw error;
        return res.status(201).json({ ok: true, item: data?.[0] });
      }

      if (action === 'add_income') {
        const insertData = buildPayload({
          user_id: userId,
          user_name: userName,
          description: body.description,
          amount: body.amount,
          expected_date: body.expected_date || body.date || new Date().toISOString().slice(0, 10),
          category: body.category || 'Salario',
          received: body.received ?? false,
        });

        const { data, error } = await supabase.from('finance_incomes').insert([insertData]).select();
        if (error) throw error;
        return res.status(201).json({ ok: true, item: data?.[0] });
      }

      if (action === 'add_debt') {
        const currentInst = Number(body.current_installment || 1);
        const totalInst = Number(body.total_installments || 1);
        const instAmount = Number(body.installment_amount || body.amount || 0);
        const totAmount = Number(body.total_amount || (instAmount * totalInst));

        const insertData = buildPayload({
          user_id: userId,
          user_name: userName,
          creditor: body.creditor,
          description: body.description || `Parcela ${currentInst}/${totalInst}`,
          installment_amount: instAmount,
          total_amount: totAmount,
          current_installment: currentInst,
          total_installments: totalInst,
          due_date: body.due_date || body.date || new Date().toISOString().slice(0, 10),
          status: body.status || 'Pendente',
          is_card: body.is_card ?? false,
          card_name: body.card_name || null,
        });

        const { data, error } = await supabase.from('finance_debts').insert([insertData]).select();
        if (error) throw error;
        return res.status(201).json({ ok: true, item: data?.[0] });
      }

      if (action === 'pay_debt') {
        if (!body.id) {
          return res.status(400).json({ error: 'ID da dívida é obrigatório' });
        }
        const { data, error } = await supabase
          .from('finance_debts')
          .update({ status: 'Pago' })
          .eq('id', body.id)
          .select();
        if (error) throw error;
        return res.status(200).json({ ok: true, item: data?.[0] });
      }

      if (action === 'allocate_envelope') {
        const monthKey = body.month_key || body.month || new Date().toISOString().slice(0, 7);
        const category = body.category || 'Outros';
        const name = body.name || category;
        const allocatedAmount = Number(body.allocated_amount || body.amount || 0);

        // Verifica se já existe envelope
        const { data: existing } = await supabase
          .from('finance_envelopes')
          .select('id')
          .eq('user_id', userId)
          .eq('month_key', monthKey)
          .eq('category', category)
          .maybeSingle();

        if (existing?.id) {
          const { data, error } = await supabase
            .from('finance_envelopes')
            .update({ allocated_amount: allocatedAmount, name })
            .eq('id', existing.id)
            .select();
          if (error) throw error;
          return res.status(200).json({ ok: true, item: data?.[0] });
        } else {
          const { data, error } = await supabase
            .from('finance_envelopes')
            .insert([{
              user_id: userId,
              month_key: monthKey,
              category,
              name,
              allocated_amount: allocatedAmount,
            }])
            .select();
          if (error) throw error;
          return res.status(201).json({ ok: true, item: data?.[0] });
        }
      }
    }

    return res.status(400).json({ error: 'Ação não suportada' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
}
