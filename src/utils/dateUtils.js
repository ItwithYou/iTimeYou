/**
 * Shared date utilities for the app.
 * All user-facing dates use dd-mm-yyyy format.
 */

/** Get today's date as YYYY-MM-DD (for min attributes) */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/** Get current datetime-local string (for min on datetime-local inputs) */
export function getNowDatetimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

/** Format YYYY-MM-DD → dd-mm-yyyy */
export function formatDateDMY(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('T')[0].split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/** Format datetime-local → dd-mm-yyyy HH:mm */
export function formatDateTimeDMY(datetimeLocal) {
  if (!datetimeLocal) return '';
  const [datePart, timePart] = datetimeLocal.split('T');
  const formatted = formatDateDMY(datePart);
  return timePart ? `${formatted} ${timePart}` : formatted;
}

/** Check if a date string (YYYY-MM-DD) is in the past */
export function isDateInPast(isoDate) {
  if (!isoDate) return false;
  const today = getTodayISO();
  return isoDate < today;
}

/** Check if a datetime-local string is in the past */
export function isDateTimeInPast(datetimeLocal) {
  if (!datetimeLocal) return false;
  return new Date(datetimeLocal) < new Date();
}