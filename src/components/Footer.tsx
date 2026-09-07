import React from 'react';
import { Sparkles, Phone, ShieldCheck, Clock, Camera } from 'lucide-react';


export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#07050d] border-t border-white/10 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/5">
          
          {/* Brand & Logo space */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9d174d] via-[#d926a9] to-[#f472b6] p-[1.5px] shadow-[0_0_15px_rgba(217,38,169,0.35)]">
                <div className="w-full h-full bg-[#0d0914] rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#f472b6]" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Astro <span className="text-[#e879f9]">Geek</span>
                </span>
                <p className="text-[10px] text-neutral-400">Celulares e Informática</p>
              </div>
            </div>
            
            <p className="text-xs text-neutral-400 leading-relaxed">
              Sua referência e autoridade em iPhones novos e seminovos selecionados. Garantia, transparência e pós-venda que você confia.
            </p>

            <div className="p-2.5 rounded-xl border border-dashed border-fuchsia-500/30 bg-fuchsia-950/20 text-[11px] text-fuchsia-300">
              * Local para inserir a logo oficial da Astro Geek
            </div>
          </div>

          {/* Procedência & Garantia */}
          <div className="space-y-3" id="garantia">
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase text-fuchsia-400">
              Garantia & Qualidade
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>Garantia de 3 meses a 1 ano</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>Baterias em excelente saúde</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>Aparelhos 100% testados e homologados</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>Nota e procedência assegurada</span>
              </li>
            </ul>
          </div>

          {/* Atendimento & Horários */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase text-fuchsia-400">
              Atendimento
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>Segunda a Sexta: 09h às 19h</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>Sábados: 09h às 16h</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>Suporte consultivo via WhatsApp</span>
              </li>
            </ul>
          </div>

          {/* Localização & Redes */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase text-fuchsia-400">
              Conecte-se
            </h4>
            <p className="text-xs text-neutral-400">
              Siga nosso perfil para novidades diárias de estoque, unboxings e ofertas relâmpago.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 hover:border-fuchsia-500/40 text-neutral-300 hover:text-white text-xs transition-colors"
              >
                <Camera className="w-4 h-4 text-fuchsia-400" />
                <span>@astrogeek</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} Astro Geek Celulares e Informática. Todos os direitos reservados.</p>
          <p className="text-[11px] text-neutral-600">
            Apple, iPhone e os logotipos Apple são marcas registradas da Apple Inc.
          </p>
        </div>

      </div>
    </footer>
  );
};
