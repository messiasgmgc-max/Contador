import React, { useState } from 'react';
import type { UserProfile } from '../types/finance';
import { Wallet, UserPlus, LogIn, Shield, Users, Check, Sparkles, Edit3 } from 'lucide-react';

interface LoginScreenProps {
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onCreateUser: (name: string, color: string) => Promise<UserProfile | null>;
  onUpdateUser?: (id: string, name: string) => Promise<boolean>;
  isLoading: boolean;
}

const COLOR_OPTIONS = [
  { name: 'Azul', value: 'blue', bg: 'bg-blue-600' },
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
  const [selectedColor, setSelectedColor] = useState('blue');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const created = await onCreateUser(name.trim(), selectedColor);
      if (created) {
        onSelectUser(created);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao criar conta no banco online.');
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case 'purple': return 'bg-purple-600';
      case 'emerald': return 'bg-emerald-600';
      case 'amber': return 'bg-amber-600';
      case 'rose': return 'bg-rose-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white font-['Inter',-apple-system,BlinkMacSystemFont,sans-serif]">
      
      {/* Card Central */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Topo do Login */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 mb-4">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Fluxo <span className="text-blue-400">Financeiro</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestão compartilhada 100% online no Supabase
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Banco de Dados Online Ativo</span>
          </div>
        </div>

        {/* Abas Entrar / Criar */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab('select')}
            className={`flex-1 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'select'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar com Minha Conta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar Nova Conta</span>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                Carregando contas do Supabase...
              </p>
            </div>
          ) : activeTab === 'select' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Selecione quem está acessando:
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {users.length} conta{users.length === 1 ? '' : 's'} cadastrada{users.length === 1 ? '' : 's'}
                </span>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Nenhuma conta encontrada</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Crie sua primeira conta para começar a gerenciar suas finanças.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
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
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left group shadow-xs"
                    >
                      {editingUserId === u.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-white border border-blue-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!editName.trim() || !onUpdateUser) return;
                              await onUpdateUser(u.id, editName.trim());
                              setEditingUserId(null);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onSelectUser(u)}
                            className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                          >
                            <div className={`w-10 h-10 rounded-xl ${getBadgeStyle(u.avatarColor)} text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {u.name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {u.isDefault ? 'Perfil Principal' : 'Conta Compartilhada'}
                              </p>
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {onUpdateUser && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingUserId(u.id);
                                  setEditName(u.name);
                                }}
                                title="Editar nome desta conta"
                                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onSelectUser(u)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all cursor-pointer"
                            >
                              <span>Entrar</span>
                              <LogIn className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Nome ou Apelido da Conta:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ivan, Esposa, Sócio..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Escolha uma cor de perfil:
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center cursor-pointer transition-transform ${
                        selectedColor === c.value ? 'scale-110 ring-2 ring-offset-2 ring-slate-900' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.name}
                    >
                      {selectedColor === c.value && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando no Supabase...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Cadastrar Conta e Entrar</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="bg-slate-50 border-t border-slate-200 p-3.5 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Sincronização 100% online sem conflitos de cache local</span>
        </div>

      </div>

    </div>
  );
};
