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
