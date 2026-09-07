 import React from 'react';
import { Sparkles, Shield, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

interface HeroProps {
  onExploreCatalog: () => void;
  onOpenQuote: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreCatalog, onOpenQuote }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Background glow effects - Magenta/Purple hue */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-[#d926a9]/20 via-[#a21caf]/15 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-[#9d174d]/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-950/40 backdrop-blur-md text-fuchsia-300 text-xs font-medium shadow-[0_0_15px_rgba(217,38,169,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Astro Geek Celulares e Informática</span>
            <span className="w-1 h-1 rounded-full bg-fuchsia-400" />
            <span className="text-white/90">Especialistas em Apple</span>
          </div>

          {/* Heading with Apple Typography feel */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            O seu próximo <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
              iPhone está na
            </span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f472b6] via-[#e879f9] to-[#d926a9] drop-shadow-[0_0_35px_rgba(217,38,169,0.4)]">
              Astro Geek.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-neutral-400 font-normal max-w-2xl mx-auto leading-relaxed">
            Modelos novos lacrados e seminovos com laudo técnico rigoroso, bateria saudável, nota, procedência e garantia total de até 1 ano.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onExploreCatalog}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-semibold text-white bg-gradient-to-r from-[#d926a9] via-[#c026d3] to-[#9333ea] hover:opacity-95 shadow-[0_0_30px_rgba(217,38,169,0.45)] hover:shadow-[0_0_40px_rgba(217,38,169,0.65)] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Ver Catálogo e Preços</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onOpenQuote}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-medium text-neutral-200 bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 hover:border-fuchsia-500/40 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Solicitar Orçamento Personalizado</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-t border-white/10 mt-10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Shield className="w-5 h-5 text-fuchsia-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Garantia Completa</p>
                <p className="text-[11px] text-neutral-400">Até 1 ano de cobertura</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Zap className="w-5 h-5 text-fuchsia-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Pronta Entrega</p>
                <p className="text-[11px] text-neutral-400">Envio e retirada rápida</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <CheckCircle2 className="w-5 h-5 text-fuchsia-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">100% Originais</p>
                <p className="text-[11px] text-neutral-400">Peças genuínas Apple</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Sparkles className="w-5 h-5 text-fuchsia-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Aceitamos Seu Usado</p>
                <p className="text-[11px] text-neutral-400">Como entrada na troca</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
