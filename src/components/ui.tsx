import React from 'react';

/** Peças de formulário e rótulo com estilo Pierre (Dark Luxury, bordas sutis e foco neon). */

export const inputCls =
  'w-full bg-[#18181f] border border-white/10 focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/40 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-all shadow-inner';

export const cancelCls =
  'px-4 py-2.5 rounded-2xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer';

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-zinc-400 block mb-1.5">{label}</label>
    {children}
  </div>
);

export const Tag: React.FC<{ cls: string; children: React.ReactNode }> = ({ cls, children }) => (
  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 shrink-0 ${cls}`}>
    {children}
  </span>
);
