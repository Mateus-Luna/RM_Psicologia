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
