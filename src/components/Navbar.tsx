 import React from 'react';
import { Sparkles, MessageCircle, ShieldCheck } from 'lucide-react';


interface NavbarProps {
  onOpenQuote: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuote }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#050507]/80 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo Placeholder Area */}
        <div className="flex items-center gap-3">
          {/* Logo Box (Pronto para substituir por imagem futuramente) */}
          <div className="relative group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9d174d] via-[#d926a9] to-[#f472b6] p-[1.5px] shadow-[0_0_20px_rgba(217,38,169,0.35)] transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-[#0d0914] rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#f472b6] animate-pulse" />
              </div>
            </div>
            {/* Tag para indicar preenchimento de logo */}
            <span className="hidden group-hover:block absolute -bottom-6 left-0 bg-neutral-900 border border-fuchsia-500/30 text-[10px] text-fuchsia-300 px-2 py-0.5 rounded whitespace-nowrap">
              Espaço da Logo
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-['SF_Pro_Display']">
                Astro <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e879f9] to-[#d926a9]">Geek</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-500/30 px-2 py-0.5 rounded-full">
                Apple Store
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Celulares e Informática
            </p>
          </div>
        </div>

        {/* Quick Highlights / Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
          <a href="#catalogo" className="hover:text-fuchsia-400 transition-colors">
            Catálogo iPhones
          </a>
          <a href="#garantia" className="hover:text-fuchsia-400 transition-colors flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-fuchsia-400" />
            Garantia & Procedência
          </a>
          <a href="#diferenciais" className="hover:text-fuchsia-400 transition-colors">
            Por que a Astro Geek?
          </a>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenQuote}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#d926a9] to-[#a21caf] hover:from-[#c026d3] hover:to-[#86198f] shadow-[0_0_20px_rgba(217,38,169,0.4)] hover:shadow-[0_0_28px_rgba(217,38,169,0.6)] transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Fazer Orçamento</span>
          </button>
        </div>

      </div>
    </header>
  );
};
