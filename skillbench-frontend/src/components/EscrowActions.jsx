import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { escrowApi, getErrorMessage } from '../services/api';
import { formatMoney } from '../utils/format';

// What each button does. `amount` is already formatted.
const ACTIONS = {
  fund: {
    title: 'Fund escrow',
    confirm: 'Fund escrow',
    tone: 'primary',
    message: (amount) => `${amount} will be held in escrow. The developer sees it is secured, and you decide when to release it or refund it.`,
    call: (projectId) => escrowApi.create(projectId),
    done: 'Escrow funded. The payment is now held securely.',
  },
  release: {
    title: 'Release payment',
    confirm: 'Release payment',
    tone: 'success',
    message: (amount) => `Release ${amount} to the developer? The project will be marked as completed. This cannot be undone.`,
    call: (projectId) => escrowApi.release(projectId),
    done: 'Payment released. The project is now completed.',
  },
  refund: {
    title: 'Refund payment',
    confirm: 'Refund payment',
    tone: 'danger',
    message: (amount) => `Refund ${amount} back to you? The developer will not receive this payment. This cannot be undone.`,
    call: (projectId) => escrowApi.refund(projectId),
    done: 'Payment refunded.',
  },
};

// Shows the right buttons for a project/escrow pair (client only).
//  - project in progress, no escrow yet  -> Fund escrow
//  - escrow held                         -> Release (only after the work is approved) / Refund
export default function EscrowActions({ projectId, projectStatus, budget, escrow, onDone, canRelease = true }) {
  const toast = useToast();
  const [current, setCurrent] = useState(null);
  const [busy, setBusy] = useState(false);

  const canFund = projectStatus === 'IN_PROGRESS' && !escrow;
  const canSettle = escrow?.status === 'HELD';
  if (!canFund && !canSettle) return <span className="muted">—</span>;

  const amount = formatMoney(escrow ? escrow.amount : budget);
  const action = current ? ACTIONS[current] : null;

  const run = async () => {
    setBusy(true);
    try {
      await action.call(projectId);
      toast.success(action.done);
      setCurrent(null);
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setCurrent(null);
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="actions">
        {canFund && <button type="button" className="btn btn-primary btn-sm" onClick={() => setCurrent('fund')}>Fund escrow</button>}
        {canSettle && (
          <>
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={() => setCurrent('release')}
              disabled={!canRelease}
              title={canRelease ? 'Release the payment to the developer' : 'Approve the developer\'s submitted work first (Submissions page)'}
            >
              Release
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setCurrent('refund')}>Refund</button>
          </>
        )}
      </div>

      {action && (
        <ConfirmDialog
          title={action.title}
          message={action.message(amount)}
          confirmLabel={action.confirm}
          tone={action.tone}
          busy={busy}
          onConfirm={run}
          onCancel={() => setCurrent(null)}
        />
      )}
    </>
  );
}
