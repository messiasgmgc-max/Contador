 import React, { useState } from 'react';
import type { IPhoneModel } from '../data/iphones';
import { Cpu, Maximize2, Check, MessageSquarePlus } from 'lucide-react';


interface ProductCardProps {
  product: IPhoneModel;
  onSelectForQuote: (product: IPhoneModel, selectedStorage: string, selectedColor: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectForQuote }) => {
  const [selectedStorage, setSelectedStorage] = useState(product.storageOptions[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  return (
    <div className="group relative rounded-3xl bg-[#0c0a14] border border-white/10 hover:border-fuchsia-500/40 transition-all duration-500 overflow-hidden flex flex-col justify-between hover:shadow-[0_0_30px_rgba(217,38,169,0.18)]">
      
      {/* Top badges & Tagline */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full border ${
            product.condition === 'Novo Lacrado'
              ? 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-500/30'
              : 'bg-neutral-800/80 text-neutral-300 border-white/10'
          }`}>
            {product.condition}
          </span>

          {product.badge && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-[#d926a9] to-[#9333ea] text-white shadow-sm">
              {product.badge}
            </span>
          )}
        </div>

        <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-fuchsia-200 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-neutral-400 line-clamp-2 mt-1 min-h-[32px]">
          {product.tagline}
        </p>
      </div>

      {/* Product Image Stage */}
      <div className="relative h-56 w-full flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fuchsia-950/10 to-transparent pointer-events-none" />
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Product Customizer & Specs */}
      <div className="p-6 pt-2 space-y-4">
        
        {/* Colors Preview */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
            <span>Cor selecionada:</span>
            <span className="text-white font-medium">{selectedColor.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {product.colors.map((color) => {
              const isSelected = selectedColor.name === color.name;
              return (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                    isSelected ? 'ring-2 ring-[#d926a9] ring-offset-2 ring-offset-[#0c0a14] scale-110' : 'border-white/20 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {isSelected && <Check className="w-3 h-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Storage Selection */}
        <div>
          <span className="text-[11px] text-neutral-400 block mb-1.5">Capacidade:</span>
          <div className="grid grid-cols-3 gap-1.5">
            {product.storageOptions.map((opt) => {
              const isSelected = selectedStorage.size === opt.size;
              return (
                <button
                  key={opt.size}
                  onClick={() => setSelectedStorage(opt)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border text-center ${
                    isSelected
                      ? 'bg-fuchsia-950/60 border-fuchsia-500/60 text-fuchsia-200 shadow-[0_0_12px_rgba(217,38,169,0.25)]'
                      : 'bg-neutral-900/60 border-white/5 text-neutral-400 hover:border-white/20'
                  }`}
                >
                  {opt.size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Specs mini badges */}
        <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
            <span className="truncate">{product.specs.chip}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
            <span className="truncate">{product.specs.screen}</span>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">A partir de ou à vista</span>
            <div className="text-xl font-bold text-white tracking-tight">
              R$ {selectedStorage.price.toLocaleString('pt-BR')}
            </div>
          </div>

          <button
            onClick={() => onSelectForQuote(product, selectedStorage.size, selectedColor.name)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#d926a9] to-[#a21caf] hover:from-[#c026d3] hover:to-[#9333ea] shadow-[0_0_15px_rgba(217,38,169,0.3)] hover:shadow-[0_0_22px_rgba(217,38,169,0.5)] transition-all active:scale-95 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Orçar</span>
          </button>
        </div>

      </div>

    </div>
  );
};
