// Change the currency symbol here and it updates everywhere.
export const CURRENCY = '$';

export function formatMoney(value) {
  const n = Number(value ?? 0);
  return `${CURRENCY}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toDate(value) {
  if (!value) return null;
  // "2030-12-31" (LocalDate) should be read as a local date, not UTC
  const d = new Date(typeof value === 'string' && value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value) {
  const d = toDate(value);
  return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function formatDateTime(value) {
  const d = toDate(value);
  return d
    ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
}

const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  HELD: 'Held in escrow',
  RELEASED: 'Released',
  REFUNDED: 'Refunded',
  SUBMITTED: 'Awaiting review',
  APPROVED: 'Approved',
  REJECTED: 'Changes requested',
};
export const statusLabel = (s) => STATUS_LABELS[s] || s;

export const roleLabel = (r) =>
  r === 'CLIENT_ADMIN' ? 'Client' : r === 'VENDOR_DEVELOPER' ? 'Developer' : r || '';

export const sumBy = (list, pick) => list.reduce((total, item) => total + Number(pick(item) || 0), 0);
