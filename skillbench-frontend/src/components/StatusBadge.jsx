import { statusLabel } from '../utils/format';

const TONE = {
  OPEN: 'sky',
  IN_PROGRESS: 'amber',
  COMPLETED: 'green',
  HELD: 'amber',
  RELEASED: 'green',
  REFUNDED: 'red',
  SUBMITTED: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
};

export default function StatusBadge({ status }) {
  if (!status) return <span className="muted">—</span>;
  return <span className={`badge badge-${TONE[status] || 'gray'}`}>● {statusLabel(status)}</span>;
}
