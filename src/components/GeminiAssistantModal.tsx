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
import { Bot, Send, Sparkles, Key, Check, X, Loader2 } from 'lucide-react';
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
      text: `Olá, ${financialContext.currentUser.name}! Sou sua inteligência pessoal financeira. Como posso ajudar com seus lançamentos ou orçamento de ${financialContext.monthKey}?`,
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
    if (loading) return;
    setLoading(true);

    const prompt = 'Faça um diagnóstico rápido e realista do meu mês atual. Aponte se estou no lucro ou prejuízo, quais são meus maiores pontos de atenção e uma dica prática de economia para esta semana.';
    const userMsg: Message = { id: String(Date.now()), sender: 'user', text: '📊 Diagnosticar minha saúde financeira deste mês' };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await askGemini(prompt, financialContext, apiKey);
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), sender: 'gemini', text: response },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), sender: 'gemini', text: `⚠️ ${err.message || 'Erro ao consultar Gemini.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    const userMsg: Message = { id: String(Date.now()), sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // 1. Tentar detectar se o usuário está pedindo para cadastrar algo
      const isRecordRequest = /(gastei|comprei|paguei|recebi|entrou|anota|registra|despesa|receita|divida)/i.test(query);
      let parsedTx: ExtractedTransaction | null = null;

      if (isRecordRequest) {
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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col h-[90vh] max-h-[700px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Topo do Assistente */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black tracking-tight">Gemini Financeiro</h3>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">3.6 Flash</span>
              </div>
              <p className="text-xs text-white/80">Inteligência Pessoal integrada ao seu caixa</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowConfig(!showConfig)}
              title="Configurar Chave Gemini"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Fechar"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Painel de Configuração de Chave API */}
        {showConfig && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSaveApiKey} className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
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
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {savingKey ? 'Salvando...' : 'Salvar no Supabase'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Você pode obter uma chave gratuita no site <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">aistudio.google.com</a>.
              </p>
              {saveStatus && (
                <div className={`p-2 rounded-xl text-xs font-semibold ${
                  saveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {saveStatus.message}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Botões Rápidos */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Diagnosticar meu mês</span>
          </button>
          <button
            onClick={() => setInput('Quanto ainda posso gastar esta semana sem ficar no vermelho?')}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shadow-xs"
          >
            Qual meu limite desta semana?
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
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/80 whitespace-pre-wrap'
                }`}>
                  <div>{m.text}</div>

                  {m.actionPreview && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-600">
                        {m.actionPreview.type.toUpperCase()}: {formatBRL(m.actionPreview.amount)}
                      </span>
                      <button
                        onClick={() => handleConfirmAction(m.actionPreview!, m.id)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar Cadastro</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Gemini pensando com seus dados...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Envio */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Pergunte algo ou diga: 'Comprei 45 reais de comida hoje'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center cursor-pointer shadow-md transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
