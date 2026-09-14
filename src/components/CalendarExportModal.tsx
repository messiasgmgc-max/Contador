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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Topo */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Sincronizar com Google Agenda
              </h3>
              <p className="text-[11px] text-slate-500">
                {events.length} contas e previsões encontradas em {monthKey}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Botão de Download em Lote (.ics) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <button
            onClick={handleDownload}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-all ${
              downloaded
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{downloaded ? '✓ Arquivo .ics Baixado na pasta Downloads!' : 'Baixar Arquivo Completo da Agenda (.ics)'}</span>
          </button>
          <div className="mt-2.5 p-2 rounded-xl bg-blue-50/60 border border-blue-200/60 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-blue-900">
              📁 O arquivo é salvo na sua pasta <strong>Downloads</strong> (ou nos downloads do navegador/celular).
            </p>
            <p className="text-[10px] text-slate-500">
              Para ver os eventos no seu calendário, abra o gerenciador de arquivos/downloads do seu celular e clique no arquivo <strong>financeiro-{monthKey}.ics</strong>. O app do Google Agenda abrirá perguntando onde adicionar todos os eventos de uma vez só!
            </p>
          </div>
        </div>

        {/* Lista de Vencimentos do Mês */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold mb-2">
            <span>Vencimentos e compromissos do mês</span>
            <span>{events.length} pendentes</span>
          </div>

          {events.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              Nenhuma conta ou pendência para agendar neste mês.
            </div>
          ) : (
            events.map((evt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs flex items-center justify-between gap-3 transition-all"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {evt.title}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded">
                      {formatBR(evt.startDate)}
                    </span>
                    <span className="truncate">{evt.description.split('\n')[0]}</span>
                  </div>
                </div>

                <button
                  onClick={() => openGoogleCalendar(evt)}
                  title="Abrir no Google Agenda"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] shrink-0 cursor-pointer transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};