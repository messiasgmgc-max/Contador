import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const EXPECTED_KEY = process.env.JARVIS_API_KEY || 'jarvis_secret_key_2026';

const supabase = createClient(supabaseUrl, supabaseKey);

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

      if (action === 'summary') {
        const { data: summaryData } = await supabase
          .from('v_finance_monthly_summary')
          .select('*')
          .eq('reference_month', refMonth)
          .eq('user_id', userId);

        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
        const { data: urgentDebts } = await supabase
          .from('finance_debts')
          .select('*')
          .eq('user_id', userId)
          .neq('status', 'Pago')
          .lte('due_date', nextWeek)
          .order('due_date', { ascending: true });

        // Consolidação dos totais do mês
        let totalIncomePlanned = 0;
        let totalIncomeActual = 0;
        let totalDebts = 0;
        let totalExpenses = 0;
        let totalExpensesPaid = 0;
        let totalDebtsPaid = 0;
        let balancePlanned = 0;
        let balanceActual = 0;

        const weeksDetail: Record<number, any> = { 1: null, 2: null, 3: null, 4: null };

        if (summaryData && summaryData.length > 0) {
          for (const s of summaryData) {
            totalIncomePlanned += Number(s.total_income_planned || 0);
            totalIncomeActual += Number(s.total_income_actual || 0);
            totalDebts += Number(s.total_debts || 0);
            totalExpenses += Number(s.total_expenses || 0);
            balancePlanned += Number(s.balance_planned || 0);
            balanceActual += Number(s.balance_actual || 0);
            if (s.cycle_week && s.cycle_week >= 1 && s.cycle_week <= 4) {
              weeksDetail[s.cycle_week] = s;
            }
          }
        }

        // Busca dados específicos para despesas pagas e dívidas pagas caso queira granular
        const { data: monthExpenses } = await supabase
          .from('finance_expenses')
          .select('amount, paid')
          .eq('user_id', userId)
          .eq('reference_month', refMonth);

        if (monthExpenses) {
          totalExpensesPaid = monthExpenses.filter(e => e.paid).reduce((acc, e) => acc + Number(e.amount), 0);
        }

        const { data: monthDebts } = await supabase
          .from('finance_debts')
          .select('installment_amount, status')
          .eq('user_id', userId)
          .eq('reference_month', refMonth);

        if (monthDebts) {
          totalDebtsPaid = monthDebts.filter(d => d.status === 'Pago').reduce((acc, d) => acc + Number(d.installment_amount), 0);
        }

        return res.status(200).json({
          ok: true,
          month: currentMonth,
          user: users?.find(u => u.id === userId)?.name || defaultUser.name,
          user_id: userId,
          totals: {
            total_income_planned: totalIncomePlanned,
            total_income_actual: totalIncomeActual,
            total_expenses: totalExpenses,
            total_expenses_paid: totalExpensesPaid,
            total_debts: totalDebts,
            total_debts_paid: totalDebtsPaid,
            balance_planned: balancePlanned,
            balance_actual: balanceActual,
          },
          weeks: weeksDetail,
          summary_by_week: summaryData || [],
          urgent_debts: urgentDebts || [],
        });
      }

      if (action === 'incomes') {
        const { data, error } = await supabase
          .from('finance_incomes')
          .select('*')
          .eq('user_id', userId)
          .eq('reference_month', refMonth)
          .order('expected_date', { ascending: true });
        if (error) throw error;
        return res.status(200).json({ ok: true, incomes: data || [] });
      }

      if (action === 'expenses') {
        let q = supabase
          .from('finance_expenses')
          .select('*')
          .eq('user_id', userId)
          .eq('reference_month', refMonth);

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

      if (action === 'add_expense') {
        const { data, error } = await supabase.from('finance_expenses').insert([{
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
        }]).select();
        if (error) throw error;
        return res.status(201).json({ ok: true, item: data?.[0] });
      }

      if (action === 'add_income') {
        const { data, error } = await supabase.from('finance_incomes').insert([{
          user_id: userId,
          user_name: userName,
          description: body.description,
          amount: body.amount,
          expected_date: body.date || body.expected_date || new Date().toISOString().slice(0, 10),
          category: body.category || 'Salario',
          received: body.received ?? false,
        }]).select();
        if (error) throw error;
        return res.status(201).json({ ok: true, item: data?.[0] });
      }

      if (action === 'add_debt') {
        const currentInst = Number(body.current_installment || 1);
        const totalInst = Number(body.total_installments || 1);
        const instAmount = Number(body.installment_amount || body.amount || 0);
        const totAmount = Number(body.total_amount || (instAmount * totalInst));

        const { data, error } = await supabase.from('finance_debts').insert([{
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
        }]).select();
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
