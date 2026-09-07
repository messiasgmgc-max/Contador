import { useState } from 'react';
import { useFinance } from './hooks/useFinance';
import { CycleTimeline } from './components/CycleTimeline';
import { CashflowSummary } from './components/CashflowSummary';
import { IncomeManager } from './components/IncomeManager';
import { DebtManager } from './components/DebtManager';
import { ExpenseManager } from './components/ExpenseManager';
import { UserManager } from './components/UserManager';
import { LoginScreen } from './components/LoginScreen';
import type { WeekNumber, UserProfile } from './types/finance';
import { 
  Wallet, 
  ArrowUpRight, 
  CreditCard, 
  ShoppingBag, 
  Layers,
  RefreshCw,
  Calendar,
  LogOut
} from 'lucide-react';

function App() {
  const { 
    users,
    activeUserId,
    setActiveUserId,
    addUser,
    deleteUser,
    cycle, 
    setCycle, 
    incomes, 
    debts, 
    expenses, 
    weeks, 
    summary, 
    isLoading,
    isSyncing, 
    isSupabaseConnected, 
    reloadFromSupabase, 
    actions 
  } = useFinance();

  // Usuário autenticado na sessão atual (in-memory)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'geral' | 'receitas' | 'dividas' | 'gastos'>('geral');

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveUserId(user.id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveUserId('ALL');
  };

  // Se o usuário ainda não logou, mostra a tela de login/criação de conta
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onSelectUser={handleLogin}
        onCreateUser={addUser}
        isLoading={isLoading}
      />
    );
  }

  const handleWeekSelection = (week: WeekNumber) => {
    if (selectedWeek === week) {
      setSelectedWeek('ALL');
    } else {
      setSelectedWeek(week);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Inter',-apple-system,BlinkMacSystemFont,sans-serif] selection:bg-blue-600 selection:text-white pb-24">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900">
                  Fluxo <span className="text-blue-600">Financeiro</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  100% Online
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-[180px] sm:max-w-none">
                Conectado como: <strong className="text-slate-800">{currentUser.name}</strong>
              </p>
            </div>
          </div>

          {/* Status de Conexão Supabase, Semana & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-700 font-semibold hidden sm:inline">
                {isSyncing ? 'Atualizando...' : isSupabaseConnected ? 'Supabase Online' : 'Erro de Conexão'}
              </span>
              <button
                onClick={() => reloadFromSupabase()}
                title="Sincronizar com Supabase"
                className="text-slate-400 hover:text-blue-600 active:text-blue-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-600 font-medium hidden sm:inline">Semana:</span>
              <select
                value={cycle.currentWeek}
                onChange={(e) => setCycle({ ...cycle, currentWeek: Number(e.target.value) as WeekNumber })}
                className="bg-transparent text-blue-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value={1}>Sem. 1</option>
                <option value={2}>Sem. 2</option>
                <option value={3}>Sem. 3</option>
                <option value={4}>Sem. 4</option>
              </select>
            </div>

            {/* Botão Sair / Trocar de Conta */}
            <button
              onClick={handleLogout}
              title="Trocar de Conta / Sair"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trocar</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Resumo de Caixa Geral */}
        <CashflowSummary summary={summary} />

        {/* Linha do Tempo e Visão Semanal */}
        <CycleTimeline
          weeks={weeks}
          currentWeek={cycle.currentWeek}
          selectedWeek={selectedWeek}
          onSelectWeek={handleWeekSelection}
        />

        {/* Seletor e Gestão de Usuários / Contas Compartilhadas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Visualização de Contas
              </h2>
              <p className="text-xs text-slate-400">
                Alterne entre ver as finanças de todos juntos ou de uma pessoa específica
              </p>
            </div>
            <UserManager
              users={users}
              activeUserId={activeUserId}
              onSelectUser={setActiveUserId}
              onAddUser={addUser}
              onDeleteUser={deleteUser}
            />
          </div>
        </div>

        {/* Barra de Filtro e Abas no Desktop / Tablet */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setActiveTab('geral')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'geral'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => setActiveTab('receitas')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'receitas'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Recebimentos ({incomes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('dividas')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'dividas'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Dívidas ({debts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gastos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'gastos'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Gastos ({expenses.length})</span>
            </button>
          </div>

          {/* Tag de filtro ativo */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
            <span className="text-xs text-slate-500">Filtrando:</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              {selectedWeek === 'ALL' ? 'Todas as Semanas' : `Semana ${selectedWeek}`}
            </span>
            {selectedWeek !== 'ALL' && (
              <button
                onClick={() => setSelectedWeek('ALL')}
                className="text-xs text-slate-500 hover:text-blue-600 font-medium underline ml-1 cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'geral' && (
          <div className="space-y-6 sm:space-y-8">
            <IncomeManager
              incomes={incomes}
              users={users}
              onAddIncome={actions.addIncome}
              onToggleReceived={actions.toggleIncomeReceived}
              onDeleteIncome={actions.deleteIncome}
              selectedWeek={selectedWeek}
            />

            <DebtManager
              debts={debts}
              users={users}
              onAddDebt={actions.addDebt}
              onPayInstallment={actions.payDebtInstallment}
              onDeleteDebt={actions.deleteDebt}
              selectedWeek={selectedWeek}
            />

            <ExpenseManager
              expenses={expenses}
              users={users}
              onAddExpense={actions.addExpense}
              onTogglePaid={actions.toggleExpensePaid}
              onDeleteExpense={actions.deleteExpense}
              selectedWeek={selectedWeek}
            />
          </div>
        )}

        {activeTab === 'receitas' && (
          <IncomeManager
            incomes={incomes}
            users={users}
            onAddIncome={actions.addIncome}
            onToggleReceived={actions.toggleIncomeReceived}
            onDeleteIncome={actions.deleteIncome}
            selectedWeek={selectedWeek}
          />
        )}

        {activeTab === 'dividas' && (
          <DebtManager
            debts={debts}
            users={users}
            onAddDebt={actions.addDebt}
            onPayInstallment={actions.payDebtInstallment}
            onDeleteDebt={actions.deleteDebt}
            selectedWeek={selectedWeek}
          />
        )}

        {activeTab === 'gastos' && (
          <ExpenseManager
            expenses={expenses}
            users={users}
            onAddExpense={actions.addExpense}
            onTogglePaid={actions.toggleExpensePaid}
            onDeleteExpense={actions.deleteExpense}
            selectedWeek={selectedWeek}
          />
        )}

      </main>

      {/* Barra de Navegação Inferior Fixa para Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'geral' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('receitas')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'receitas' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <ArrowUpRight className="w-5 h-5" />
          <span>Receitas</span>
        </button>

        <button
          onClick={() => setActiveTab('dividas')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'dividas' ? 'text-amber-600 font-bold' : 'text-slate-500'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Dívidas</span>
        </button>

        <button
          onClick={() => setActiveTab('gastos')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'gastos' ? 'text-rose-600 font-bold' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Gastos</span>
        </button>
      </div>

    </div>
  );
}

export default App;
