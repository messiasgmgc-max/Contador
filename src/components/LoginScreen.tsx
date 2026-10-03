import React, { useState } from 'react';
import type { UserProfile } from '../types/finance';
import { verifyPassword } from '../lib/hash';
import { UserPlus, LogIn, Shield, Users, Check, Edit3, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  users: UserProfile[];
  onSelectUser: (user: UserProfile, typedPassword?: string) => void;
  onCreateUser: (name: string, color: string, password?: string) => Promise<UserProfile | null>;
  onUpdateUser?: (id: string, name: string, password?: string) => Promise<boolean>;
  isLoading: boolean;
}

const COLOR_OPTIONS = [
  { name: 'Neon', value: 'lime', bg: 'bg-[#ccff00]' },
  { name: 'Roxo', value: 'purple', bg: 'bg-purple-600' },
  { name: 'Verde', value: 'emerald', bg: 'bg-emerald-600' },
  { name: 'Laranja', value: 'amber', bg: 'bg-amber-600' },
  { name: 'Rosa', value: 'rose', bg: 'bg-rose-600' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onSelectUser,
  onCreateUser,
  onUpdateUser,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'create'>('select');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedColor, setSelectedColor] = useState('lime');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Edição rápida de nome/senha na lista
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Desafio de senha para entrar
  const [selectedUserForAuth, setSelectedUserForAuth] = useState<UserProfile | null>(null);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);

  const handleSelectUser = (user: UserProfile) => {
    if (user.passwordHash) {
      setSelectedUserForAuth(user);
      setAuthPassword('');
      setAuthError('');
    } else {
      onSelectUser(user);
    }
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAuth) return;

    if (verifyPassword(selectedUserForAuth, authPassword)) {
      onSelectUser(selectedUserForAuth, authPassword);
      setSelectedUserForAuth(null);
      setAuthPassword('');
    } else {
      setAuthError('Senha incorreta. Tente novamente.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const created = await onCreateUser(name.trim(), selectedColor, password.trim() || undefined);
      if (created) {
        onSelectUser(created);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao criar conta no banco online.');
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case 'purple': return 'bg-purple-600 text-white';
      case 'emerald': return 'bg-emerald-600 text-white';
      case 'amber': return 'bg-amber-600 text-white';
      case 'rose': return 'bg-rose-600 text-white';
      case 'blue': return 'bg-blue-600 text-white';
      default: return 'bg-[#ccff00] text-black font-black';
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#ccff00] selection:text-black">
      {/* Background Glows estilo Pierre */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ccff00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header com Logo Fluxo Financeiro */}
      <div className="text-center space-y-3 mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#161622] to-black border border-white/10 shadow-2xl relative group">
          <span className="text-2xl font-black italic tracking-widest text-zinc-100 group-hover:text-[#ccff00] transition-colors">
            F
          </span>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#ccff00] border-2 border-black" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Fluxo <span className="text-[#ccff00] font-sans font-light">Financeiro</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xs mx-auto">
            Uma inteligência que traz clareza para o seu dinheiro.
          </p>
        </div>
      </div>

      {/* Card Principal */}
      <div className="w-full max-w-md bg-[#14141b] rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative z-10 backdrop-blur-xl">
        
        {/* Tabs de Seleção / Criação */}
        <div className="flex border-b border-white/5 bg-black/40">
          <button
            type="button"
            onClick={() => setActiveTab('select')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'select'
                ? 'border-[#ccff00] text-[#ccff00] bg-white/[0.02]'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Acessar Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'border-[#ccff00] text-[#ccff00] bg-white/[0.02]'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-400 font-medium">
                Carregando contas do Supabase...
              </p>
            </div>
          ) : activeTab === 'select' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Selecione quem está acessando:
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {users.length} conta{users.length === 1 ? '' : 's'}
                </span>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-8 px-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                  <Users className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-300">Nenhuma conta encontrada</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Crie sua primeira conta para começar a gerenciar suas finanças.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#ccff00] hover:bg-[#b8e600] text-black rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Criar Conta Agora
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-white/5 hover:border-[#ccff00]/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all text-left group"
                    >
                      {editingUserId === u.id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nome do perfil"
                            className="bg-[#181822] border border-[#ccff00] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <input
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="Nova senha (vazio para manter)"
                            className="bg-[#181822] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!editName.trim() || !onUpdateUser) return;
                                await onUpdateUser(u.id, editName.trim(), editPassword.trim() || undefined);
                                setEditingUserId(null);
                                setEditPassword('');
                              }}
                              className="px-3 py-1.5 bg-[#ccff00] text-black rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUserId(null);
                                setEditPassword('');
                              }}
                              className="px-2.5 py-1.5 bg-white/5 text-zinc-400 rounded-xl text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSelectUser(u)}
                            className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                          >
                            <div className={`w-10 h-10 rounded-xl ${getBadgeStyle(u.avatarColor)} flex items-center justify-center font-bold text-base shadow-xs shrink-0 relative`}>
                              {u.name.charAt(0).toUpperCase()}
                              {u.passwordHash && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black/80 rounded-full border border-white/20 flex items-center justify-center text-amber-400">
                                  <Lock className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-white group-hover:text-[#ccff00] transition-colors block truncate">
                                {u.name}
                              </span>
                              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                {u.passwordHash ? 'Protegido por senha' : 'Acesso livre'}
                              </span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditName(u.name);
                              setEditPassword('');
                            }}
                            title="Editar conta"
                            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                  Nome do Perfil:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Claudia, Ivan, Guilherme..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#181822] border border-white/10 focus:border-[#ccff00] rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                  Senha de Acesso (Opcional):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Defina uma senha ou PIN (opcional)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#181822] border border-white/10 focus:border-[#ccff00] rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Se definir senha, ela será exigida sempre ao logar neste perfil.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-2">
                  Cor do Perfil:
                </label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center cursor-pointer transition-all ${
                        selectedColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedColor === c.value && <Check className="w-4 h-4 text-black font-black" />}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="w-full py-3 rounded-2xl bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
              >
                {submitting ? 'Salvando no Supabase...' : 'Cadastrar Perfil e Entrar'}
              </button>
            </form>
          )}
        </div>

        {/* Modal de Senha */}
        {selectedUserForAuth && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#14141b] rounded-3xl border border-white/10 shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ccff00] text-black font-black mb-3 shadow-[0_0_15px_rgba(204,255,0,0.25)]">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">
                  Perfil Protegido
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Digite a senha para acessar a conta <strong className="text-white font-bold">{selectedUserForAuth.name}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyPassword} className="space-y-3">
                <div className="relative">
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Digite sua senha..."
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      setAuthError('');
                    }}
                    className="w-full bg-[#181822] border border-white/10 focus:border-[#ccff00] rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {authError && (
                  <p className="text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-2xl text-center">
                    {authError}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserForAuth(null);
                      setAuthPassword('');
                      setAuthError('');
                    }}
                    className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-2xl text-xs font-black text-black bg-[#ccff00] hover:bg-[#b8e600] cursor-pointer"
                  >
                    Entrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-black/40 border-t border-white/5 p-3.5 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5 font-mono">
          <Shield className="w-3.5 h-3.5 text-[#ccff00]" />
          <span>Sincronização Online Segura · Pierre Ecosystem</span>
        </div>

      </div>
    </div>
  );
};
