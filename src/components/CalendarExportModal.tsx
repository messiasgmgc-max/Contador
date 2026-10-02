import React from 'react';
import type { CalendarEventData } from '../lib/calendar';
import { openGoogleCalendar, downloadIcsFile } from '../lib/calendar';
import { Calendar, Download, ExternalLink, X } from 'lucide-react';
import { formatBR } from '../lib/period';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
  events: CalendarEventData[];
}

export const CalendarExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  monthKey,
  events,
}) => {
  const [downloaded, setDownloaded] = React.useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    void downloadIcsFile(`financeiro-${monthKey}`, events);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#121217] rounded-3xl border border-white/10 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Topo */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-[#161622]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#ccff00] text-black font-black flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Sincronizar com Google Agenda
              </h3>
              <p className="text-[11px] text-zinc-400">
                {events.length} vencimentos identificados em {monthKey}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Botão de Download em Lote (.ics) */}
        <div className="p-4 bg-black/30 border-b border-white/5">
          <button
            onClick={handleDownload}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md cursor-pointer transition-all ${
              downloaded
                ? 'bg-emerald-500 text-black'
                : 'bg-[#ccff00] hover:bg-[#b8e600] text-black'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{downloaded ? '✓ Arquivo .ics Baixado nos Downloads!' : 'Baixar Arquivo Completo da Agenda (.ics)'}</span>
          </button>
          <div className="mt-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-200">
              📁 O arquivo é salvo na sua pasta <strong>Downloads</strong>.
            </p>
            <p className="text-[10px] text-zinc-500">
              Abra o arquivo <strong>financeiro-{monthKey}.ics</strong> no celular ou PC para adicionar todos os eventos de uma vez só à sua agenda!
            </p>
          </div>
        </div>

        {/* Lista de Vencimentos do Mês */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-400 font-semibold mb-2">
            <span>Compromissos agendados</span>
            <span className="font-mono">{events.length} itens</span>
          </div>

          {events.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              Nenhuma conta ou pendência para agendar neste mês.
            </div>
          ) : (
            events.map((evt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl border border-white/5 bg-[#181822] hover:border-white/15 flex items-center justify-between gap-3 transition-all"
              >
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">
                    {evt.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <span className="bg-[#ccff00]/10 text-[#ccff00] font-mono font-bold px-1.5 py-0.5 rounded">
                      {formatBR(evt.startDate)}
                    </span>
                    <span className="truncate">{evt.description.split('\n')[0]}</span>
                  </div>
                </div>

                <button
                  onClick={() => openGoogleCalendar(evt)}
                  title="Abrir no Google Agenda"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] shrink-0 cursor-pointer transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>Google</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-[#161622] border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};