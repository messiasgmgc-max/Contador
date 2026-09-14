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
import { LoginScreen } from './components/LoginScreen';
import { inputCls, cancelCls, Field } from './components/ui';
import { monthLabel } from './lib/period';
import type { WeekNumber, UserProfile } from './types/finance';
import {
  Wallet, ArrowUpRight, CreditCard, ShoppingBag, Layers,
  RefreshCw, LogOut, Edit3, TriangleAlert, Calendar, Sparkles, Download, ArrowDownCircle
} from 'lucide-react';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { CalendarExportModal } from './components/CalendarExportModal';
import { type CalendarEventData } from './lib/calendar';
import type { ExtractedTransaction } from './lib/gemini';
import { checkForAppUpdates, type UpdateInfo } from './lib/updater';

type Tab = 'geral' | 'receitas' | 'dividas' | 'gastos';

function App() {
  const {
    users, setActiveUserId, addUser, updateUser, upgradePasswordIfLegacy,
    monthKey, setMonthKey, availableMonths,
    incomes, debts, expenses, weeks, summary, spending, expensesByCategory,
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

  // Mantém o filtro de usuário e a cópia local do perfil em dia
  useEffect(() => {
    if (!currentUser) return;
    setActiveUserId(currentUser.id);

    // Perfil excluído (por aqui ou por outro aparelho): a sessão salva no
    // localStorage apontava para um id que não existe mais e a tela ficava
    // presa num perfil fantasma, sem lançamento nenhum.
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

  // Checa se há atualização recente no GitHub
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
    // Ao logar, verifica se há commit mais recente
    void checkUpdate();
  };

  useEffect(() => {
    // Se o usuário já estava logado pela sessão, verifica na abertura
    if (currentUser) {
      void checkUpdate();
    }
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

  const tabs: { id: Tab; label: string; count?: number; icon: ReactNode; color: string }[] = [
    { id: 'geral', label: 'Visão geral', icon: <Layers className="w-3.5 h-3.5" />, color: 'bg-blue-600' },
    { id: 'receitas', label: 'Recebimentos', count: incomes.length, icon: <ArrowUpRight className="w-3.5 h-3.5" />, color: 'bg-emerald-600' },
    { id: 'dividas', label: 'Dívidas', count: debts.length, icon: <CreditCard className="w-3.5 h-3.5" />, color: 'bg-amber-600' },
    { id: 'gastos', label: 'Gastos', count: expenses.length, icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'bg-rose-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Inter',-apple-system,BlinkMacSystemFont,sans-serif] selection:bg-blue-600 selection:text-white pb-24 sm:pb-8">

      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-xl font-extrabold tracking-tight block truncate">
                Fluxo <span className="text-blue-600">Financeiro</span>
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <strong className="text-slate-900 font-bold truncate">{currentUser.name}</strong>
                <button
                  onClick={() => { setEditName(currentUser.name); setShowEdit(true); }}
                  title="Editar conta"
                  className="p-0.5 rounded text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowGemini(true)}
              title="Assistente Financeiro Gemini"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">IA Financeira</span>
            </button>

            <button
              onClick={() => void reloadFromSupabase()}
              title={isSupabaseConnected ? 'Sincronizar' : 'Sem conexão — tentar de novo'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs cursor-pointer hover:bg-slate-200"
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-slate-700 font-semibold hidden md:inline">
                {isSyncing ? 'Atualizando...' : isSupabaseConnected ? 'Online' : 'Sem conexão'}
              </span>
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              title="Trocar de conta"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trocar</span>
            </button>
          </div>
        </div>
      </header>

      {showEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-600" /> Configurações da conta
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
                <p className="text-[10px] text-slate-400 mt-1">
                  Tranca local para separar os perfis neste aparelho. Não protege os
                  dados no servidor — veja o README.
                </p>
              </Field>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowEdit(false)} className={cancelCls}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 space-y-6 sm:space-y-8">

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2.5">
            <TriangleAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-rose-800">Erro ao falar com o Supabase</p>
              <p className="text-[11px] text-rose-700 break-words">{errorMessage}</p>
            </div>
          </div>
        )}

        {availableUpdate && (
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-950">Nova atualização disponível!</span>
                  <span className="text-[10px] bg-indigo-200/60 text-indigo-800 font-mono px-1.5 py-0.5 rounded font-bold">
                    {availableUpdate.latestCommitShort}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800 truncate mt-0.5">
                  "{availableUpdate.commitMessage}"
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Mudanças no código estrutural prontas para atualizar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setAvailableUpdate(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                Depois
              </button>

              <button
                onClick={() => {
                  window.location.reload();
                }}
                title="Recarregar aplicação para puxar o código mais recente"
                className="px-3 py-1.5 rounded-xl border border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold cursor-pointer transition-all"
              >
                Atualizar Código
              </button>

              <a
                href={availableUpdate.apkDownloadUrl}
                download="FluxoFinanceiro.apk"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar APK</span>
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <MonthNavigator monthKey={monthKey} availableMonths={availableMonths} onChange={setMonthKey} />
          
          <button
            onClick={handleExportMonthToCalendar}
            title="Exportar todos os vencimentos e contas do mês para o Google Agenda (.ics)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Sincronizar Mês na Agenda</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm text-slate-400">Carregando seus dados...</div>
        ) : (
          <>
            <CashflowSummary summary={summary} />

            <SpendingPanel
              spending={spending}
              byCategory={expensesByCategory}
              monthLabelText={monthLabel(monthKey)}
            />

            <CycleTimeline
              weeks={weeks}
              monthKey={monthKey}
              selectedWeek={selectedWeek}
              onSelectWeek={toggleWeek}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === t.id
                        ? `${t.color} text-white`
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}{t.count !== undefined ? ` (${t.count})` : ''}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Filtro:</span>
                <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {selectedWeek === 'ALL' ? 'mês inteiro' : `semana ${selectedWeek}`}
                </span>
                {selectedWeek !== 'ALL' && (
                  <button
                    onClick={() => setSelectedWeek('ALL')}
                    className="text-slate-500 hover:text-blue-600 underline cursor-pointer"
                  >
                    limpar
                  </button>
                )}
              </div>
            </div>

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

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[11px] transition-colors ${
              activeTab === t.id ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            {t.icon}
            <span>{t.label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          onClick={() => setShowGemini(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[11px] text-indigo-600 font-bold"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>IA</span>
        </button>
      </nav>

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
