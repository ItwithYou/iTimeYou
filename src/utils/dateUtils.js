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

/**
 * Smart format for service_when strings.
 * Handles: "2025-04-15", "2025-04-15T10:00", "2025-04-15 · 09:00 - 10:00", or already formatted.
 * Always converts the date portion to dd-mm-yyyy.
 */
export function formatServiceWhen(serviceWhen) {
  if (!serviceWhen) return '';
  const str = serviceWhen.trim();

  // Already in dd-mm-yyyy format? Return as-is.
  if (/^\d{2}-\d{2}-\d{4}/.test(str)) return str;

  // Has separator like "2025-04-15 · 09:00 - 10:00"
  const separatorMatch = str.match(/^(\d{4}-\d{2}-\d{2})\s*·\s*(.+)$/);
  if (separatorMatch) {
    return `${formatDateDMY(separatorMatch[1])} · ${separatorMatch[2]}`;
  }

  // ISO datetime "2025-04-15T10:00"
  if (str.includes('T')) {
    return formatDateTimeDMY(str);
  }

  // Plain date "2025-04-15"
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return formatDateDMY(str);
  }

  // Fallback: return original
  return str;
}

/**
 * Format an ISO timestamp to dd-mm-yyyy HH:mm
 */
export function formatTimestampDMY(isoTimestamp) {
  if (!isoTimestamp) return '';
  const d = new Date(isoTimestamp);
  if (isNaN(d.getTime())) return isoTimestamp;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${mins}`;
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