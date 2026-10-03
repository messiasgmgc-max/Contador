import { useState, useEffect } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useFinance } from './hooks/useFinance';
import { CycleTimeline } from './components/CycleTimeline';
import { CashflowSummary } from './components/CashflowSummary';
import { MonthNavigator } from './components/MonthNavigator';
import { SpendingPanel } from './components/SpendingPanel';
import { IncomeManager } from './components/IncomeManager';
import { DebtManager } from './components/DebtManager';
import { ExpenseManager } from './components/ExpenseManager';
import { CardManager } from './components/CardManager';
import { ZeroBasedBudgetingView } from './components/ZeroBasedBudgetingView';
import { QuickExpenseNumpad } from './components/QuickExpenseNumpad';
import { GamificationAndGoalsPanel } from './components/GamificationAndGoalsPanel';
import { CashflowForecastView } from './components/CashflowForecastView';
import { LoginScreen } from './components/LoginScreen';
import { inputCls, cancelCls, Field } from './components/ui';
import { monthLabel, formatBRL } from './lib/period';
import type { WeekNumber, UserProfile } from './types/finance';
import {
  ArrowUpRight, CreditCard, ShoppingBag, Layers,
  RefreshCw, LogOut, Edit3, TriangleAlert, Calendar, Sparkles, Download, ArrowDownCircle,
  PieChart, TrendingUp, Trophy, Zap
} from 'lucide-react';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { CalendarExportModal } from './components/CalendarExportModal';
import { type CalendarEventData } from './lib/calendar';
import type { ExtractedTransaction } from './lib/gemini';
import { checkForAppUpdates, type UpdateInfo } from './lib/updater';

type Tab = 'geral' | 'cartao' | 'envelopes' | 'previsao' | 'metas' | 'receitas' | 'dividas' | 'gastos';

function App() {
  const {
    users, setActiveUserId, addUser, updateUser, upgradePasswordIfLegacy,
    monthKey, setMonthKey, availableMonths,
    incomes, debts, expenses, weeks, summary, spending, expensesByCategory,
    zeroBudget, cashflowForecast, setEnvelopes, goals, addGoal, updateGoalProgress, gamification,
    isLoading, isSyncing, isSupabaseConnected, errorMessage,
    reloadFromSupabase, actions,
  } = useFinance();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('finance_session_user');
      return saved ? (JSON.parse(saved) as UserProfile) : null;
    } catch {
      return null;
    }
  });

  const [selectedWeek, setSelectedWeek] = useState<WeekNumber | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<Tab>('geral');
  const [showEdit, setShowEdit] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showQuickNumpad, setShowQuickNumpad] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventData[]>([]);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const handleExportMonthToCalendar = () => {
    const events: CalendarEventData[] = [];

    for (const d of debts) {
      if (d.status !== 'Pago') {
        events.push({
          title: `Pagar: ${d.creditor} (${d.currentInstallment}/${d.totalInstallments})`,
          description: `Vencimento da parcela de ${d.creditor}. Valor: R$ ${d.installmentAmount.toFixed(2)}.`,
          startDate: d.dueDate,
        });
      }
    }

    for (const inc of incomes) {
      if (!inc.received) {
        events.push({
          title: `Receber: ${inc.description}`,
          description: `Previsão de recebimento (${inc.category}). Valor: R$ ${inc.amount.toFixed(2)}.`,
          startDate: inc.expectedDate,
        });
      }
    }

    for (const exp of expenses) {
      if (!exp.paid) {
        events.push({
          title: `Gasto: ${exp.description}`,
          description: `Gasto previsto (${exp.category}). Valor: R$ ${exp.amount.toFixed(2)}.`,
          startDate: exp.date,
        });
      }
    }

    setCalendarEvents(events);
    setShowCalendarModal(true);
  };

  const handleExecuteGeminiTransaction = async (tx: ExtractedTransaction) => {
    if (!currentUser) return;
    if (tx.type === 'receita') {
      await actions.addIncome({
        userId: currentUser.id,
        userName: currentUser.name,
        description: tx.description,
        amount: tx.amount,
        expectedDate: tx.date,
        category: (tx.category as any) || 'Outro',
        received: false,
      });
    } else if (tx.type === 'divida') {
      const installments = tx.installments || 1;
      await actions.addDebt({
        userId: currentUser.id,
        userName: currentUser.name,
        creditor: tx.creditor || tx.description,
        description: tx.description,
        totalAmount: tx.amount * installments,
        installmentAmount: tx.amount,
        currentInstallment: 1,
        totalInstallments: installments,
        dueDate: tx.date,
        status: 'Pendente',
      });
    } else {
      await actions.addExpense({
        userId: currentUser.id,
        userName: currentUser.name,
        description: tx.description,
        amount: tx.amount,
        date: tx.date,
        category: (tx.category as any) || 'Outros',
        isFixed: false,
        paid: false,
      });
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    setActiveUserId(currentUser.id);

    if (!isLoading && users.length > 0 && !users.some((u) => u.id === currentUser.id)) {
      setCurrentUser(null);
      setActiveUserId('ALL');
      localStorage.removeItem('finance_session_user');
      return;
    }

    const fresh = users.find((u) => u.id === currentUser.id);
    if (fresh && (fresh.name !== currentUser.name || fresh.passwordHash !== currentUser.passwordHash)) {
      setCurrentUser(fresh);
      localStorage.setItem('finance_session_user', JSON.stringify(fresh));
    }
  }, [currentUser, users, isLoading, setActiveUserId]);

  const [availableUpdate, setAvailableUpdate] = useState<UpdateInfo | null>(null);

  const checkUpdate = async () => {
    const info = await checkForAppUpdates();
    if (info && info.hasUpdate) {
      setAvailableUpdate(info);
    }
  };

  const handleLogin = (user: UserProfile, typedPassword?: string) => {
    setCurrentUser(user);
    setActiveUserId(user.id);
    localStorage.setItem('finance_session_user', JSON.stringify(user));
    if (typedPassword) void upgradePasswordIfLegacy(user, typedPassword);
    void checkUpdate();
  };

  useEffect(() => {
    if (currentUser) {
      void checkUpdate();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowQuickNumpad((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveUserId('ALL');
    localStorage.removeItem('finance_session_user');
  };

  const handleUpdateAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editName.trim()) return;
    const ok = await updateUser(
      currentUser.id,
      editName.trim(),
      editPassword.trim() ? editPassword.trim() : undefined,
    );
    if (ok) {
      setShowEdit(false);
      setEditPassword('');
    }
  };

  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onSelectUser={handleLogin}
        onCreateUser={addUser}
        onUpdateUser={updateUser}
        isLoading={isLoading}
      />
    );
  }

  const toggleWeek = (w: WeekNumber) => setSelectedWeek((prev) => (prev === w ? 'ALL' : w));

  const managerProps = {
    users,
    monthKey,
    defaultUserId: currentUser.id,
    selectedWeek,
  };

  const cardDebts = debts.filter((d) => d.isCard || d.creditor.toLowerCase().includes('cartão') || d.creditor.toLowerCase().includes('cartao'));

  const tabs: { id: Tab; label: string; count?: number; icon: ReactNode }[] = [
    { id: 'geral', label: 'Visão Geral', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'receitas', label: 'Receitas', count: incomes.length, icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'dividas', label: 'Dívidas', count: debts.length, icon: <CreditCard className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'gastos', label: 'Gastos', count: expenses.length, icon: <ShoppingBag className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'cartao', label: 'Cartão', count: cardDebts.length, icon: <CreditCard className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'envelopes', label: 'Envelopes (YNAB)', icon: <PieChart className="w-3.5 h-3.5 text-[#ccff00]" /> },
    { id: 'previsao', label: 'Previsão Fluxo', icon: <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'metas', label: 'Metas & Hábitos', icon: <Trophy className="w-3.5 h-3.5 text-amber-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-slate-100 font-['Inter',-apple-system,BlinkMacSystemFont,sans-serif] selection:bg-[#ccff00] selection:text-black pb-28 sm:pb-12">

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0b0b0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          {/* Logo & Usuário */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#161622] to-black border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
              <span className="text-base sm:text-lg font-black italic tracking-widest text-[#ccff00]">
                F
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-lg font-black tracking-tight block truncate text-white">
                  Fluxo <span className="text-[#ccff00] font-light">Financeiro</span>
                </span>
                <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-wider bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 px-2 py-0.2 rounded-full font-mono">
                  Online
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <strong className="text-white font-medium truncate">{currentUser.name}</strong>
                <button
                  onClick={() => { setEditName(currentUser.name); setShowEdit(true); }}
                  title="Editar conta"
                  className="p-0.5 rounded text-zinc-500 hover:text-white cursor-pointer shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions (Lançamento Rápido, Assistente IA, Sync, Logout) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowQuickNumpad(true)}
              title="Lançamento Rápido (Ctrl + K)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-bold border border-white/15 cursor-pointer transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-[#ccff00]" />
              <span className="hidden sm:inline">Lançar Rápido</span>
              <kbd className="hidden md:inline text-[9px] bg-black/40 text-zinc-400 font-mono px-1.5 py-0.5 rounded border border-white/10">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setShowGemini(true)}
              title="Assistente Financeiro IA"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#ccff00] hover:bg-[#b8e600] active:scale-95 text-black text-xs font-black shadow-[0_0_15px_rgba(204,255,0,0.25)] cursor-pointer transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-black fill-black" />
              <span className="hidden sm:inline">Assistente IA</span>
            </button>

            <button
              onClick={() => void reloadFromSupabase()}
              title={isSupabaseConnected ? 'Sincronizar' : 'Sem conexão — tentar de novo'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs cursor-pointer hover:bg-white/10 text-zinc-300"
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-[#ccff00] shadow-[0_0_8px_#ccff00]' : 'bg-rose-500'}`} />
              <span className="font-semibold hidden md:inline">
                {isSyncing ? 'Atualizando...' : isSupabaseConnected ? 'Online' : 'Offline'}
              </span>
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isSyncing ? 'animate-spin text-[#ccff00]' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              title="Trocar de conta"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 text-xs font-semibold cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Configuração do Perfil */}
      {showEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14141b] rounded-3xl border border-white/10 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-white">
              <Edit3 className="w-4 h-4 text-[#ccff00]" /> Configurações da Conta
            </h3>

            <form onSubmit={handleUpdateAccount} className="space-y-3">
              <Field label="Nome do perfil">
                <input
                  type="text" required value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Senha de acesso">
                <input
                  type="password"
                  placeholder={currentUser.passwordHash ? 'Nova senha (vazio mantém a atual)' : 'Definir uma senha ou PIN'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className={inputCls}
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Tranca local para separar os perfis no aparelho.
                </p>
              </Field>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button type="button" onClick={() => setShowEdit(false)} className={cancelCls}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-2xl text-xs font-black text-black bg-[#ccff00] hover:bg-[#b8e600] cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {errorMessage && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 flex items-start gap-2.5">
            <TriangleAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-rose-300">Erro ao sincronizar com o Supabase</p>
              <p className="text-[11px] text-rose-400 break-words">{errorMessage}</p>
            </div>
          </div>
        )}

        {availableUpdate && (
          <div className="rounded-3xl border border-[#ccff00]/30 bg-gradient-to-r from-[#181824] to-[#121217] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-[#ccff00] text-black font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Nova atualização disponível!</span>
                  <span className="text-[10px] bg-[#ccff00]/20 text-[#ccff00] font-mono px-1.5 py-0.5 rounded font-bold">
                    {availableUpdate.latestCommitShort}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  "{availableUpdate.commitMessage}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setAvailableUpdate(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white font-medium cursor-pointer"
              >
                Depois
              </button>

              <button
                onClick={() => { window.location.reload(); }}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Atualizar Código
              </button>

              <a
                href={availableUpdate.apkDownloadUrl}
                download="FluxoFinanceiro.apk"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-black shadow-xs cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar APK</span>
              </a>
            </div>
          </div>
        )}

        {/* Barra Superior de Mês & Agenda */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <MonthNavigator monthKey={monthKey} availableMonths={availableMonths} onChange={setMonthKey} />
          
          <button
            onClick={handleExportMonthToCalendar}
            title="Exportar todos os vencimentos e contas do mês para o Google Agenda (.ics)"
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-white/10 bg-[#16161e] hover:bg-white/10 text-zinc-300 text-xs font-bold cursor-pointer shadow-xs self-start sm:self-auto transition-all"
          >
            <Calendar className="w-4 h-4 text-[#ccff00]" />
            <span>Sincronizar Agenda (.ics)</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm text-zinc-500">
            Carregando inteligência financeira...
          </div>
        ) : (
          <>
            {/* Saldo Real e Métricas de Balanço apenas na Visão Geral */}
            {activeTab === 'geral' && (
              <CashflowSummary
                summary={summary}
                onNavigateTab={(tab) => {
                  setShowQuickNumpad(false);
                  setActiveTab(tab);
                }}
              />
            )}

            {/* Quando estiver na Visão Geral, exibe os painéis analíticos */}
            {activeTab === 'geral' && (
              <>
                {/* Painel de Gastos com Donut Circular e Heatmap */}
                <SpendingPanel
                  spending={spending}
                  byCategory={expensesByCategory}
                  monthLabelText={monthLabel(monthKey)}
                />

                {/* Linha do Tempo e Semanas do Mês */}
                <CycleTimeline
                  weeks={weeks}
                  monthKey={monthKey}
                  selectedWeek={selectedWeek}
                  onSelectWeek={toggleWeek}
                />
              </>
            )}

            {/* Seletor de Abas / Páginas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setShowQuickNumpad(false);
                      setActiveTab(t.id);
                    }}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === t.id
                        ? 'bg-white text-black shadow-lg shadow-white/5'
                        : 'bg-[#14141b] border border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}{t.count !== undefined ? ` (${t.count})` : ''}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Filtro ativo:</span>
                <span className="font-bold text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/20 px-2.5 py-1 rounded-xl font-mono">
                  {selectedWeek === 'ALL' ? 'Mês Inteiro' : `Semana ${selectedWeek}`}
                </span>
                {selectedWeek !== 'ALL' && (
                  <button
                    onClick={() => setSelectedWeek('ALL')}
                    className="text-zinc-500 hover:text-white underline cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Páginas Dedicadas */}
            {activeTab === 'envelopes' && (
              <ZeroBasedBudgetingView
                budget={zeroBudget}
                onSaveEnvelopes={setEnvelopes}
              />
            )}

            {activeTab === 'previsao' && (
              <CashflowForecastView
                forecast={cashflowForecast}
                currentCash={summary.balanceActual}
              />
            )}

            {activeTab === 'metas' && (
              <GamificationAndGoalsPanel
                gamification={gamification}
                goals={goals}
                onAddGoal={addGoal}
                onUpdateGoalProgress={updateGoalProgress}
              />
            )}

            {activeTab === 'cartao' && (
              <CardManager
                {...managerProps}
                debts={debts}
                onAddDebt={actions.addDebt}
                onUpdateDebt={actions.updateDebt}
                onPayInstallment={actions.payDebtInstallment}
                onDeleteDebt={actions.deleteDebt}
              />
            )}

            {activeTab === 'receitas' && (
              <IncomeManager
                {...managerProps}
                incomes={incomes}
                onAddIncome={actions.addIncome}
                onUpdateIncome={actions.updateIncome}
                onToggleReceived={actions.toggleIncomeReceived}
                onDeleteIncome={actions.deleteIncome}
              />
            )}

            {activeTab === 'dividas' && (
              <DebtManager
                {...managerProps}
                debts={debts}
                onAddDebt={actions.addDebt}
                onUpdateDebt={actions.updateDebt}
                onPayInstallment={actions.payDebtInstallment}
                onDeleteDebt={actions.deleteDebt}
              />
            )}

            {activeTab === 'gastos' && (
              <ExpenseManager
                {...managerProps}
                expenses={expenses}
                onAddExpense={actions.addExpense}
                onUpdateExpense={actions.updateExpense}
                onTogglePaid={actions.toggleExpensePaid}
                onDeleteExpense={actions.deleteExpense}
              />
            )}

            {/* Na aba Geral, exibe resumo rápido com atalhos para cada área */}
            {activeTab === 'geral' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-[#14141b] border border-white/5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      Últimas Receitas
                    </h3>
                    <button
                      onClick={() => setActiveTab('receitas')}
                      className="text-xs font-bold text-[#ccff00] hover:underline cursor-pointer"
                    >
                      Abrir Receitas →
                    </button>
                  </div>
                  {incomes.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma receita cadastrada neste mês.</p>
                  ) : (
                    <div className="space-y-2">
                      {incomes.slice(0, 4).map((inc) => (
                        <div key={inc.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{inc.description}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">{inc.category}</p>
                          </div>
                          <span className="font-bold text-emerald-400 font-mono ml-2 shrink-0">
                            +{formatBRL(inc.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl bg-[#14141b] border border-white/5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-rose-400" />
                      Últimos Gastos
                    </h3>
                    <button
                      onClick={() => setActiveTab('gastos')}
                      className="text-xs font-bold text-[#ccff00] hover:underline cursor-pointer"
                    >
                      Abrir Gastos →
                    </button>
                  </div>
                  {expenses.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">Nenhum gasto cadastrado neste mês.</p>
                  ) : (
                    <div className="space-y-2">
                      {expenses.slice(0, 4).map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{exp.description}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">{exp.category}</p>
                          </div>
                          <span className="font-bold text-rose-400 font-mono ml-2 shrink-0">
                            -{formatBRL(exp.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl bg-[#14141b] border border-white/5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      Dívidas & Parcelas
                    </h3>
                    <button
                      onClick={() => setActiveTab('dividas')}
                      className="text-xs font-bold text-[#ccff00] hover:underline cursor-pointer"
                    >
                      Abrir Dívidas →
                    </button>
                  </div>
                  {debts.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma dívida cadastrada neste mês.</p>
                  ) : (
                    <div className="space-y-2">
                      {debts.slice(0, 3).map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{d.creditor}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">Parcela {d.currentInstallment}/{d.totalInstallments}</p>
                          </div>
                          <span className="font-bold text-amber-400 font-mono ml-2 shrink-0">
                            {formatBRL(d.installmentAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl bg-[#14141b] border border-white/5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      Cartão de Crédito
                    </h3>
                    <button
                      onClick={() => setActiveTab('cartao')}
                      className="text-xs font-bold text-[#ccff00] hover:underline cursor-pointer"
                    >
                      Abrir Cartão →
                    </button>
                  </div>
                  {cardDebts.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma despesa de cartão neste mês.</p>
                  ) : (
                    <div className="space-y-2">
                      {cardDebts.slice(0, 3).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{c.description || c.creditor}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">{c.cardName || 'Cartão'} • {c.currentInstallment}/{c.totalInstallments}</p>
                          </div>
                          <span className="font-bold text-purple-400 font-mono ml-2 shrink-0">
                            {formatBRL(c.installmentAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Lançamento Rápido (Estilo Monefy / Notion) */}
      {showQuickNumpad && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickNumpad(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-md my-auto">
            <QuickExpenseNumpad
              defaultUserId={currentUser.id}
              userName={currentUser.name}
              onClose={() => setShowQuickNumpad(false)}
              onAddExpense={async (item) => {
                await actions.addExpense(item);
                setShowQuickNumpad(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Bottom Nav para Mobile */}
      <nav className="sm:hidden fixed bottom-3 left-2 right-2 z-40 bg-[#14141d]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-1.5 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        {tabs.slice(0, 5).map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setShowQuickNumpad(false); // Garante que o numpad fecha ao trocar de aba
                setActiveTab(t.id);
              }}
              className={`flex-1 py-1.5 px-1 rounded-2xl flex flex-col items-center gap-0.5 text-[9px] uppercase font-bold tracking-tight transition-all cursor-pointer ${
                isActive
                  ? 'bg-white/10 text-[#ccff00] shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
                {t.icon}
              </div>
              <span className="truncate max-w-[50px] leading-tight">{t.label.split(' ')[0]}</span>
            </button>
          );
        })}

        {/* Botão Central de Ação Rápida */}
        <button
          onClick={() => setShowQuickNumpad(true)}
          title="Lançamento Rápido"
          className="py-1 px-2.5 mx-0.5 rounded-2xl bg-[#ccff00] text-black flex flex-col items-center gap-0.5 text-[9px] font-black uppercase tracking-tight shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95 cursor-pointer shrink-0 transition-transform"
        >
          <Zap className="w-4 h-4 text-black fill-black" />
          <span>Lançar</span>
        </button>

        {/* Botão IA */}
        <button
          onClick={() => {
            setShowQuickNumpad(false);
            setShowGemini(true);
          }}
          title="Assistente IA"
          className="flex-1 py-1.5 px-1 rounded-2xl flex flex-col items-center gap-0.5 text-[9px] uppercase font-black tracking-tight text-[#ccff00] hover:bg-white/5 cursor-pointer transition-all"
        >
          <div className="w-5 h-5 rounded-full bg-[#ccff00] text-black flex items-center justify-center text-[10px] font-black shadow-xs">
            <Sparkles className="w-3 h-3 text-black fill-black" />
          </div>
          <span>IA</span>
        </button>
      </nav>

      {/* Modais */}
      {showGemini && (
        <GeminiAssistantModal
          isOpen={showGemini}
          onClose={() => setShowGemini(false)}
          financialContext={{
            currentUser,
            monthKey,
            summary: {
              totalIncome: summary.incomePlanned,
              totalDebts: summary.debts,
              totalExpenses: summary.expenses,
              totalOutgoing: summary.outgoing,
              netBalance: summary.balancePlanned,
            },
            incomes,
            debts,
            expenses,
          }}
          onExecuteTransaction={handleExecuteGeminiTransaction}
        />
      )}

      {showCalendarModal && (
        <CalendarExportModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          monthKey={monthKey}
          events={calendarEvents}
        />
      )}
    </div>
  );
}

export default App;
