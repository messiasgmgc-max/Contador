import React, { useState } from 'react';
import type { UserProfile } from '../types/finance';
import { UserPlus, Users, Trash2, X, Check } from 'lucide-react';

interface UserManagerProps {
  users: UserProfile[];
  activeUserId: string;
  onSelectUser: (id: string) => void;
  onAddUser: (name: string, color: string) => void;
  onDeleteUser: (id: string) => void;
}

const COLOR_OPTIONS = [
  { name: 'Azul', value: 'blue', bg: 'bg-blue-600' },
  { name: 'Roxo', value: 'purple', bg: 'bg-purple-600' },
  { name: 'Verde', value: 'emerald', bg: 'bg-emerald-600' },
  { name: 'Laranja', value: 'amber', bg: 'bg-amber-600' },
  { name: 'Rosa', value: 'rose', bg: 'bg-rose-600' },
];

export const UserManager: React.FC<UserManagerProps> = ({
  users,
  activeUserId,
  onSelectUser,
  onAddUser,
  onDeleteUser,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddUser(name.trim(), selectedColor);
    setName('');
    setShowModal(false);
  };

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'emerald': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'amber': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rose': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
      {/* Botão Todos / Conjunto */}
      <button
        onClick={() => onSelectUser('ALL')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
          activeUserId === 'ALL'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        <span>Todos ({users.length})</span>
      </button>

      {/* Botões para cada pessoa cadastrada */}
      {users.map((u) => {
        const isSelected = activeUserId === u.id;
        return (
          <button
            key={u.id}
            onClick={() => onSelectUser(u.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />
            <span>{u.name}</span>
          </button>
        );
      })}

      {/* Botão para Gerenciar / Criar Pessoa */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        title="Adicionar ou Gerenciar Contas"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Nova Conta</span>
      </button>

      {/* Modal Simples de Criação e Gestão de Contas */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Gerenciar Pessoas & Contas
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário Simples */}
            <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Criar Nova Conta / Membro
              </span>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nome da Pessoa ou Identificador:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João, Maria, Empresa..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Cor de Identificação:
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center cursor-pointer transition-transform ${
                        selectedColor === c.value ? 'scale-110 ring-2 ring-offset-2 ring-slate-800' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={c.name}
                    >
                      {selectedColor === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  Adicionar Membro
                </button>
              </div>
            </form>

            {/* Lista de Membros Atuais */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">
                Contas Cadastradas ({users.length}):
              </span>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getBadgeStyle(u.avatarColor)}`}>
                        {u.name}
                      </span>
                      {u.isDefault && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          (Padrão)
                        </span>
                      )}
                    </div>

                    {!u.isDefault && (
                      <button
                        onClick={() => onDeleteUser(u.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Remover Membro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};