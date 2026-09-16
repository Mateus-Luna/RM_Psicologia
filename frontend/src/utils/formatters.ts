/**
 * Formats a date string (YYYY-MM-DD or ISO 8601) to DD/MM/YYYY
 * without triggering timezone shifts.
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  const clean = dateString.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
}

/**
 * Extracts YYYY-MM-DD format suitable for HTML5 <input type="date">
 */
export function toInputDate(dateString?: string | null): string {
  if (!dateString) return '';
  return dateString.split('T')[0];
}

/**
 * Formats CPF with standard Brazilian mask 000.000.000-00
 */
export function formatCPF(value?: string | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Strips non-digits from CPF
 */
export function cleanCPF(value?: string | null): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Formats phone numbers to (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export function formatPhone(value?: string | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Strips non-digits from phone
 */
export function cleanPhone(value?: string | null): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Formats an ISO date-time string to Brazilian DD/MM/YYYY às HH:mm format
 */
export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

/**
 * Extracts HH:mm format suitable for HTML5 <input type="time">
 */
export function toInputTime(dateString?: string | null): string {
  if (!dateString) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '09:00';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '09:00';
  }
}

/**
 * Combines YYYY-MM-DD and HH:mm into an ISO 8601 string
 */
export function combineDateAndTime(date: string, time?: string): string {
  const safeTime = time && time.trim() ? time.trim() : '09:00';
  const localDate = new Date(`${date}T${safeTime}:00`);
  return localDate.toISOString();
}

/**
 * Extracts time in HH:mm format from an ISO string or date
 */
export function formatTime(dateString?: string | null): string {
  if (!dateString) return '--:--';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      // Fallback: extract from string if formatted as T...
      const match = dateString.match(/T(\d{2}):(\d{2})/);
      if (match) return `${match[1]}:${match[2]}`;
      return '--:--';
    }
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '--:--';
  }
}

/**
 * Formats a time range (e.g., "14:00 - 15:00")
 */
export function formatTimeRange(
  startAt?: string | null,
  endAt?: string | null,
): string {
  if (!startAt) return '--:--';
  const start = formatTime(startAt);
  if (!endAt) return start;
  const end = formatTime(endAt);
  return `${start} - ${end}`;
}

/**
 * Returns formatted month and year (e.g. "Setembro 2026")
 */
export function formatMonthYear(year: number, monthZeroIndexed: number): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${months[monthZeroIndexed]} ${year}`;
}

/**
 * Returns full date text in Portuguese (e.g. "Quarta-feira, 16 de setembro de 2026")
 */
export function formatDateFullDescription(dateString: string): string {
  try {
    const d = new Date(`${dateString}T12:00:00`);
    if (isNaN(d.getTime())) return formatDate(dateString);

    const weekdays = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    const months = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ];

    const weekday = weekdays[d.getDay()];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${weekday}, ${day} de ${month} de ${year}`;
  } catch {
    return formatDate(dateString);
  }
}

/**
 * Returns human-readable label for recurrenceId
 */
export function getRecurrenceLabel(recurrenceId?: string | null): string | null {
  if (!recurrenceId) return null;
  if (recurrenceId.includes('weekly') || recurrenceId.includes('semanal'))
    return 'Semanal';
  if (recurrenceId.includes('biweekly') || recurrenceId.includes('quinzenal'))
    return 'Quinzenal';
  if (
    recurrenceId.includes('every_three_weeks') ||
    recurrenceId.includes('3_semanas')
  )
    return 'A cada 3 semanas';
  if (recurrenceId.includes('monthly') || recurrenceId.includes('mensal'))
    return 'Mensal';
  return 'Recorrente';
}

/**
 * Generates an array of future startAt/endAt pairs for a recurrence series
 */
export function generateRecurrenceOccurrences(
  startDate: string, // YYYY-MM-DD
  startTime: string, // HH:mm
  endTime: string, // HH:mm
  frequency: string,
  count: number = 12,
): Array<{ startAt: string; endAt: string }> {
  if (frequency === 'none' || count <= 1) {
    return [
      {
        startAt: combineDateAndTime(startDate, startTime),
        endAt: combineDateAndTime(startDate, endTime),
      },
    ];
  }

  const occurrences: Array<{ startAt: string; endAt: string }> = [];
  const [year, month, day] = startDate.split('-').map(Number);

  for (let i = 0; i < count; i++) {
    const d = new Date(year, month - 1, day);

    if (frequency === 'weekly' || frequency === 'semanal') {
      d.setDate(d.getDate() + i * 7);
    } else if (frequency === 'biweekly' || frequency === 'quinzenal') {
      d.setDate(d.getDate() + i * 14);
    } else if (
      frequency === 'every_three_weeks' ||
      frequency === '3_semanas'
    ) {
      d.setDate(d.getDate() + i * 21);
    } else if (frequency === 'monthly' || frequency === 'mensal') {
      d.setMonth(d.getMonth() + i);
    }

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayStr}`;

    occurrences.push({
      startAt: combineDateAndTime(dateStr, startTime),
      endAt: combineDateAndTime(dateStr, endTime),
    });
  }

  return occurrences;
}

