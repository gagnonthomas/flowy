/**
 * Validate and normalize date strings entered manually.
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a date string (YYYY-MM-DD).
 * Returns the cleaned date or null if invalid.
 */
export function validateDate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Already valid format
  if (DATE_REGEX.test(trimmed)) {
    return isRealDate(trimmed) ? trimmed : null;
  }

  // Try common formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return isRealDate(normalized) ? normalized : null;
  }

  // Try: YYYY/MM/DD
  const isoSlash = trimmed.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/);
  if (isoSlash) {
    const [, year, month, day] = isoSlash;
    const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return isRealDate(normalized) ? normalized : null;
  }

  return null;
}

/**
 * Check if a YYYY-MM-DD string is a real calendar date.
 */
function isRealDate(ds: string): boolean {
  const [y, m, d] = ds.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * Validate a time string (HH:MM).
 * Returns the cleaned time or null if invalid.
 */
export function validateTime(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // HH:MM or H:MM
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format a date input as the user types (auto-add dashes).
 * Returns the formatted string for controlled input.
 */
export function formatDateInput(text: string): string {
  // Remove non-digits
  const digits = text.replace(/[^\d]/g, '');

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

/**
 * Format a time input as the user types (auto-add colon).
 */
export function formatTimeInput(text: string): string {
  const digits = text.replace(/[^\d]/g, '');

  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}
