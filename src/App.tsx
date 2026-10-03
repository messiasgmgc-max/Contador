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
import { monthLabel } from './lib/period';
import type { WeekNumber, UserProfile } from './types/finance';
import {
  ArrowUpRight, CreditCard, ShoppingBag, Layers,
  RefreshCw, LogOut, Edit3, TriangleAlert, Calendar, Sparkles, Download, ArrowDownCircle,
  PieChart, TrendingUp, Trophy, Zap, X
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
    { id: 'envelopes', label: 'Envelopes (YNAB)', icon: <PieChart className="w-3.5 h-3.5 text-[#ccff00]" /> },
    { id: 'previsao', label: 'Previsão Fluxo', icon: <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'metas', label: 'Metas & Hábitos', icon: <Trophy className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'cartao', label: 'Cartão de Crédito', count: cardDebts.length, icon: <CreditCard className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'receitas', label: 'Receitas', count: incomes.length, icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'dividas', label: 'Dívidas', count: debts.length, icon: <CreditCard className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'gastos', label: 'Gastos', count: expenses.length, icon: <ShoppingBag className="w-3.5 h-3.5 text-rose-400" /> },
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
            {/* Saldo Real e Métricas de Balanço */}
            <CashflowSummary
              summary={summary}
            />

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

            {/* Seletor de Abas Estilo Pierre Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div className="hidden sm:flex items-center gap-2 overflow-x-auto no-scrollbar">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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

            {(activeTab === 'geral' || activeTab === 'receitas') && (
              <IncomeManager
                {...managerProps}
                incomes={incomes}
                onAddIncome={actions.addIncome}
                onUpdateIncome={actions.updateIncome}
                onToggleReceived={actions.toggleIncomeReceived}
                onDeleteIncome={actions.deleteIncome}
              />
            )}

            {(activeTab === 'geral' || activeTab === 'dividas') && (
              <DebtManager
                {...managerProps}
                debts={debts}
                onAddDebt={actions.addDebt}
                onUpdateDebt={actions.updateDebt}
                onPayInstallment={actions.payDebtInstallment}
                onDeleteDebt={actions.deleteDebt}
              />
            )}

            {(activeTab === 'geral' || activeTab === 'gastos') && (
              <ExpenseManager
                {...managerProps}
                expenses={expenses}
                onAddExpense={actions.addExpense}
                onUpdateExpense={actions.updateExpense}
                onTogglePaid={actions.toggleExpensePaid}
                onDeleteExpense={actions.deleteExpense}
              />
            )}
          </>
        )}
      </main>

      {/* Modal de Lançamento Rápido (Estilo Monefy / Notion) */}
      {showQuickNumpad && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowQuickNumpad(false)}
              className="absolute -top-11 right-0 text-zinc-400 hover:text-white p-2 cursor-pointer flex items-center gap-1 text-xs font-mono"
            >
              <span>ESC</span>
              <X className="w-4 h-4" />
            </button>
            <QuickExpenseNumpad
              defaultUserId={currentUser.id}
              userName={currentUser.name}
              onAddExpense={async (item) => {
                await actions.addExpense(item);
                setShowQuickNumpad(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Bottom Nav para Mobile */}
      <nav className="sm:hidden fixed bottom-4 left-3 right-3 z-50 bg-[#161620]/95 backdrop-blur-xl border border-white/10 rounded-3xl px-2 py-2 flex items-center justify-between shadow-2xl overflow-x-auto no-scrollbar">
        {tabs.slice(0, 5).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-2xl text-[9px] uppercase font-bold tracking-wider transition-all shrink-0 ${
              activeTab === t.id ? 'text-[#ccff00] scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.icon}
            <span className="truncate max-w-[48px]">{t.label.split(' ')[0]}</span>
          </button>
        ))}

        {/* Botão Rápido Numpad */}
        <button
          onClick={() => setShowQuickNumpad(true)}
          className="flex flex-col items-center gap-1 py-1 px-1.5 rounded-2xl text-[9px] uppercase font-black tracking-wider text-white shrink-0"
        >
          <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 text-[#ccff00] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span>Lançar</span>
        </button>

        {/* Botão IA */}
        <button
          onClick={() => setShowGemini(true)}
          className="flex flex-col items-center gap-1 py-1 px-1.5 rounded-2xl text-[9px] uppercase font-black tracking-wider text-[#ccff00] shrink-0"
        >
          <div className="w-6 h-6 rounded-full bg-[#ccff00] text-black flex items-center justify-center text-[10px] font-black">
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
