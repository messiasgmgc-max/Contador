/**
 * Utilitários para Google Agenda e Calendários (.ics)
 */

export interface CalendarEventData {
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  location?: string;
}

/**
 * Formata YYYY-MM-DD para o formato compactado do Google Calendar (YYYYMMDD)
 */
function toGCalDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

/**
 * Gera URL direta para criar evento no Google Calendar (Web ou App nativo no celular)
 */
export function buildGoogleCalendarUrl(event: CalendarEventData): string {
  const start = toGCalDate(event.startDate);
  const [y, m, d] = event.startDate.split('-').map(Number);
  const nextDay = new Date(y, m - 1, d + 1);
  const endY = nextDay.getFullYear();
  const endM = String(nextDay.getMonth() + 1).padStart(2, '0');
  const endD = String(nextDay.getDate()).padStart(2, '0');
  const end = `${endY}${endM}${endD}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    dates: `${start}/${end}`,
  });

  if (event.location) {
    params.set('location', event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Abre diretamente o Google Agenda em nova aba ou app móvel
 */
export function openGoogleCalendar(event: CalendarEventData): void {
  const url = buildGoogleCalendarUrl(event);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Gera e baixa um arquivo universal .ics com múltiplos eventos (para Google Agenda, Apple, Outlook)
 * Compatível com Web, Celular (Android/iOS) e Desktop
 */
export async function downloadIcsFile(filename: string, events: CalendarEventData[]): Promise<void> {
  if (events.length === 0) return;

  const ics: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fluxo Financeiro//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const evt of events) {
    const start = toGCalDate(evt.startDate);
    const [y, m, d] = evt.startDate.split('-').map(Number);
    const nextDay = new Date(y, m - 1, d + 1);
    const endY = nextDay.getFullYear();
    const endM = String(nextDay.getMonth() + 1).padStart(2, '0');
    const endD = String(nextDay.getDate()).padStart(2, '0');
    const end = `${endY}${endM}${endD}`;
    const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@fluxofinanceiro.app`;

    ics.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${start}T000000Z`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${evt.title.replace(/[,;\n\r]/g, ' ')}`,
      `DESCRIPTION:${evt.description.replace(/[\n\r]+/g, ' \\n ')}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Lembrete de Vencimento: ${evt.title}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  ics.push('END:VCALENDAR');
  const icsContent = ics.join('\r\n');
  const cleanFilename = filename.endsWith('.ics') ? filename : `${filename}.ics`;

  // No celular, se o Web Share API com arquivos for suportado, permite abrir direto no Google Agenda
  try {
    const file = new File([icsContent], cleanFilename, { type: 'text/calendar' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Vencimentos do Mês - Fluxo Financeiro',
        text: 'Importe os vencimentos do mês no seu Google Agenda ou calendário do celular.',
      });
      return;
    }
  } catch {
    // Se o usuário cancelar ou o Web Share falhar, continua para o download clássico
  }

  // Fallback para download via Blob URL
  try {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFilename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch {
    // Fallback para Data URI
    const encoded = encodeURIComponent(icsContent);
    window.open(`data:text/calendar;charset=utf-8,${encoded}`, '_blank');
  }
}

