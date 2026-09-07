 import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, RefreshCcw } from 'lucide-react';
import { IPHONES_DATA } from '../data/iphones';
import type { IPhoneModel } from '../data/iphones';


interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProduct?: {
    product: IPhoneModel;
    storage: string;
    color: string;
  } | null;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  preselectedProduct,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(
    preselectedProduct?.product.id || IPHONES_DATA[0].id
  );
  const [selectedStorage, setSelectedStorage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'troca'>('pix');
  const [hasTradeIn, setHasTradeIn] = useState<boolean>(false);
  const [tradeInModel, setTradeInModel] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerCity, setCustomerCity] = useState<string>('');

  const currentProduct = IPHONES_DATA.find((p) => p.id === selectedModelId) || IPHONES_DATA[0];

  useEffect(() => {
    if (preselectedProduct) {
      setSelectedModelId(preselectedProduct.product.id);
      setSelectedStorage(preselectedProduct.storage);
      setSelectedColor(preselectedProduct.color);
    } else if (currentProduct) {
      setSelectedStorage(currentProduct.storageOptions[0].size);
      setSelectedColor(currentProduct.colors[0].name);
    }
  }, [preselectedProduct, isOpen]);

  // Sync default options when model changes manually
  const handleModelChange = (id: string) => {
    setSelectedModelId(id);
    const prod = IPHONES_DATA.find((p) => p.id === id);
    if (prod) {
      setSelectedStorage(prod.storageOptions[0].size);
      setSelectedColor(prod.colors[0].name);
    }
  };

  if (!isOpen) return null;

  const handleSendToWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();

    const currentStorageObj = currentProduct.storageOptions.find((s) => s.size === selectedStorage) || currentProduct.storageOptions[0];
    const estimatedPrice = currentStorageObj.price.toLocaleString('pt-BR');

    const paymentText =
      paymentMethod === 'pix'
        ? 'À vista no PIX (com desconto)'
        : paymentMethod === 'cartao'
        ? 'Cartão de Crédito (Parcelado)'
        : 'Entrada com Aparelho Usado + Saldo';

    const tradeInText = hasTradeIn && tradeInModel.trim()
      ? `\n*Aparelho para troca (Trade-in):* ${tradeInModel.trim()}`
      : '';

    const clientGreeting = customerName.trim() ? `Olá, me chamo *${customerName.trim()}*` : 'Olá';
    const cityText = customerCity.trim() ? ` sou de *${customerCity.trim()}* e` : '';

    const message = `${clientGreeting},${cityText} gostaria de solicitar um orçamento na *Astro Geek Celulares e Informática*!
    
📱 *Modelo de Interesse:* ${currentProduct.name}
📦 *Capacidade:* ${selectedStorage}
🎨 *Cor preferida:* ${selectedColor}
🏷️ *Condição:* ${currentProduct.condition}
💰 *Valor de referência:* R$ ${estimatedPrice}
💳 *Pretensão de Pagamento:* ${paymentText}${tradeInText}

Podem me passar a disponibilidade imediata e as condições para fecharmos?`;

    // WhatsApp url
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=5511999999999&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-[#0f0c18] border border-fuchsia-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(217,38,169,0.3)] my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#d926a9] to-[#9333ea] flex items-center justify-center shadow-[0_0_15px_rgba(217,38,169,0.5)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Orçamento Astro Geek
            </h2>
            <p className="text-xs text-fuchsia-300">
              Personalize o iPhone e receba a melhor proposta no WhatsApp
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSendToWhatsApp} className="space-y-4">
          
          {/* Seletor de Modelo */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
              Escolha o Modelo de iPhone:
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full bg-[#171424] border border-white/10 focus:border-[#d926a9] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors cursor-pointer"
            >
              {IPHONES_DATA.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.condition}) - A partir de R$ {item.startingPrice.toLocaleString('pt-BR')}
                </option>
              ))}
            </select>
          </div>

          {/* Capacidade e Cor em Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Capacidade:
              </label>
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="w-full bg-[#171424] border border-white/10 focus:border-[#d926a9] rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition-colors"
              >
                {currentProduct.storageOptions.map((s) => (
                  <option key={s.size} value={s.size}>
                    {s.size} - R$ {s.price.toLocaleString('pt-BR')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Cor Preferida:
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full bg-[#171424] border border-white/10 focus:border-[#d926a9] rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition-colors"
              >
                {currentProduct.colors.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
              Forma de Pagamento Pretendida:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer text-center ${
                  paymentMethod === 'pix'
                    ? 'bg-fuchsia-950/70 border-fuchsia-500 text-fuchsia-200'
                    : 'bg-[#171424] border-white/10 text-neutral-400 hover:border-white/20'
                }`}
              >
                PIX à vista
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cartao')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer text-center ${
                  paymentMethod === 'cartao'
                    ? 'bg-fuchsia-950/70 border-fuchsia-500 text-fuchsia-200'
                    : 'bg-[#171424] border-white/10 text-neutral-400 hover:border-white/20'
                }`}
              >
                Até 18x Cartão
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('troca');
                  setHasTradeIn(true);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer text-center ${
                  paymentMethod === 'troca'
                    ? 'bg-fuchsia-950/70 border-fuchsia-500 text-fuchsia-200'
                    : 'bg-[#171424] border-white/10 text-neutral-400 hover:border-white/20'
                }`}
              >
                Com Troca
              </button>
            </div>
          </div>

          {/* Opção de Aparelho na Troca (Trade-in) */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-200 flex items-center gap-1.5">
                <RefreshCcw className="w-3.5 h-3.5 text-fuchsia-400" />
                Deseja dar seu iPhone atual como entrada?
              </span>
              <input
                type="checkbox"
                checked={hasTradeIn}
                onChange={(e) => setHasTradeIn(e.target.checked)}
                className="w-4 h-4 accent-[#d926a9] rounded cursor-pointer"
              />
            </div>
            {hasTradeIn && (
              <input
                type="text"
                value={tradeInModel}
                onChange={(e) => setTradeInModel(e.target.value)}
                placeholder="Ex: iPhone 12 128GB Saúde 84% com caixa..."
                className="w-full bg-[#171424] border border-white/10 focus:border-[#d926a9] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            )}
          </div>

          {/* Dados do Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Seu Nome:
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Como prefere ser chamado"
                className="w-full bg-[#171424] border border-white/10 focus:border-[#d926a9] rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Sua Cidade/Região:
              </label>
              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="Ex: São Paulo - SP"
                className="w-full bg-[#171424] border border-white/10 focus:border-[#d926a9] rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#d926a9] via-[#c026d3] to-[#9333ea] hover:opacity-95 shadow-[0_0_25px_rgba(217,38,169,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Orçamento Direto no WhatsApp</span>
            </button>
            <p className="text-[11px] text-center text-neutral-500 mt-2">
              Atendimento ágil de segunda a sábado por especialistas Apple.
            </p>
          </div>

        </form>

      </div>
    </div>
  );
};
