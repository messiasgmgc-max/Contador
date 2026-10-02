import React, { useState, useEffect, useRef } from 'react';
import type { FinancialContext } from '../lib/gemini';
import {
  askGemini,
  parseTransactionWithGemini,
  getStoredGeminiApiKey,
  saveGeminiApiKeyToCloud,
  loadGeminiApiKeyFromCloud,
  type ExtractedTransaction
} from '../lib/gemini';
import { formatBRL } from '../lib/period';
import { Send, Sparkles, Key, Check, X, Loader2 } from 'lucide-react';
import { inputCls } from './ui';

interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  actionPreview?: ExtractedTransaction;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  financialContext: FinancialContext;
  onExecuteTransaction: (tx: ExtractedTransaction) => Promise<void>;
}

export const GeminiAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  financialContext,
  onExecuteTransaction,
}) => {
  const [apiKey, setApiKey] = useState(getStoredGeminiApiKey());
  const [showConfig, setShowConfig] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: `Olá, ${financialContext.currentUser.name}! Sou Megamen, seu agente e inteligência financeira pessoal. Como posso ajudar com seus lançamentos ou orçamento de ${financialContext.monthKey}?`,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      void loadGeminiApiKeyFromCloud().then((k) => {
        if (k) setApiKey(k);
      });
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    setSaveStatus(null);
    const res = await saveGeminiApiKeyToCloud(apiKey);
    setSavingKey(false);
    if (res.success) {
      setSaveStatus({ type: 'success', message: 'Chave salva com sucesso no Supabase!' });
      setTimeout(() => setShowConfig(false), 1500);
    } else {
      setSaveStatus({
        type: 'error',
        message: `Salva localmente, mas falhou no Supabase: ${res.error}. Rode o SQL de finance_settings.`
      });
    }
  };

  const handleDiagnose = async () => {
    const prompt = 'Faça um diagnóstico rápido do meu fluxo financeiro deste mês: onde estão os maiores gastos, se o saldo está saudável e 2 recomendações práticas.';
    setInput('');
    setMessages((prev) => [...prev, { id: String(Date.now()), sender: 'user', text: prompt }]);
    setLoading(true);
    try {
      const response = await askGemini(prompt, financialContext, apiKey);
      setMessages((prev) => [...prev, { id: String(Date.now() + 1), sender: 'gemini', text: response }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), sender: 'gemini', text: `⚠️ ${err.message || 'Erro ao conectar ao Gemini.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { id: String(Date.now()), sender: 'user', text: query }]);
    setLoading(true);

    try {
      const lower = query.toLowerCase();
      const isAction =
        lower.includes('comprei') ||
        lower.includes('gastei') ||
        lower.includes('paguei') ||
        lower.includes('recebi') ||
        lower.includes('ganhei') ||
        lower.includes('anotar') ||
        lower.includes('adicionar') ||
        lower.includes('lançar') ||
        lower.includes('devo') ||
        lower.includes('parcela');

      let parsedTx: ExtractedTransaction | null = null;
      if (isAction) {
        parsedTx = await parseTransactionWithGemini(query, financialContext, apiKey).catch(() => null);
      }

      if (parsedTx && parsedTx.amount > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: 'gemini',
            text: `Entendi que você deseja registrar um(a) **${parsedTx!.type.toUpperCase()}**: "${parsedTx!.description}" no valor de **${formatBRL(parsedTx!.amount)}** com data em **${parsedTx!.date}** (${parsedTx!.category || 'Geral'}). Confirme o lançamento abaixo:`,
            actionPreview: parsedTx!,
          },
        ]);
      } else {
        const response = await askGemini(query, financialContext, apiKey);
        setMessages((prev) => [
          ...prev,
          { id: String(Date.now() + 1), sender: 'gemini', text: response },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), sender: 'gemini', text: `⚠️ ${err.message || 'Erro ao conectar ao Gemini.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (tx: ExtractedTransaction, msgId: string) => {
    setLoading(true);
    try {
      await onExecuteTransaction(tx);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, text: `${m.text}\n\n✅ **Lançamento adicionado ao banco com sucesso!**`, actionPreview: undefined }
            : m
        )
      );
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#121217] rounded-3xl border border-white/10 shadow-2xl max-w-lg w-full flex flex-col h-[90vh] max-h-[720px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Topo do Assistente com Megamen (Referência 4) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#181824] via-[#121218] to-black border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ccff00] text-black font-black flex items-center justify-center text-sm shadow-[0_0_15px_rgba(204,255,0,0.3)]">
              🐱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">Megamen AI</h3>
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 px-2 py-0.2 rounded-full">
                  Agêntico Ativo
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Escudo contra gastos e inteligência financeira</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowConfig(!showConfig)}
              title="Configurar Chave Gemini"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Fechar"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Painel de Configuração de Chave API */}
        {showConfig && (
          <div className="p-4 bg-[#181822] border-b border-white/5 animate-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSaveApiKey} className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Chave de API do Google Gemini:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Cole sua API Key do Google AI Studio..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={inputCls}
                />
                <button
                  type="submit"
                  disabled={savingKey}
                  className="px-4 py-2 rounded-2xl bg-[#ccff00] text-black font-black text-xs hover:bg-[#b8e600] cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {savingKey ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Obtenha uma chave gratuita em <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[#ccff00] underline">aistudio.google.com</a>.
              </p>
              {saveStatus && (
                <div className={`p-2 rounded-xl text-xs font-semibold ${
                  saveStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {saveStatus.message}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Botões Rápidos */}
        <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#ccff00]/40 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ccff00]" />
            <span>Diagnosticar meu mês</span>
          </button>
          <button
            onClick={() => setInput('Quanto ainda posso gastar esta semana sem ficar no vermelho?')}
            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#ccff00]/40 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
          >
            Limite desta semana
          </button>
        </div>

        {/* Histórico de Mensagens */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-[#ccff00] text-black font-black flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    🐱
                  </div>
                )}
                <div className={`max-w-[85%] rounded-3xl px-4 py-3 leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-[#ccff00] text-black font-medium rounded-br-xs'
                    : 'bg-[#181822] text-zinc-200 rounded-bl-xs border border-white/5 whitespace-pre-wrap'
                }`}>
                  <div>{m.text}</div>

                  {m.actionPreview && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#ccff00]">
                        {m.actionPreview.type.toUpperCase()}: {formatBRL(m.actionPreview.amount)}
                      </span>
                      <button
                        onClick={() => handleConfirmAction(m.actionPreview!, m.id)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs py-1">
              <Loader2 className="w-4 h-4 animate-spin text-[#ccff00]" />
              <span>Megamen pensando com seus dados...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Envio */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-[#14141b] border-t border-white/5 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Pergunte ao Megamen ou diga: 'Comprei 45 de lanche hoje'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-[#181822] border border-white/10 focus:border-[#ccff00] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-2xl bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-40 text-black flex items-center justify-center cursor-pointer shadow-md transition-all shrink-0 font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
