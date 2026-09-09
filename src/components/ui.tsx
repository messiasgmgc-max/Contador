import React from 'react';

/** Peças de formulário e rótulo reaproveitadas pelos três gerenciadores. */

export const inputCls =
  'w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none shadow-xs';

export const cancelCls =
  'px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer';

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
    {children}
  </div>
);

export const Tag: React.FC<{ cls: string; children: React.ReactNode }> = ({ cls, children }) => (
  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold flex items-center gap-1 shrink-0 ${cls}`}>
    {children}
  </span>
);
