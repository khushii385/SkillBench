import Modal from './Modal';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', tone = 'primary', busy, onConfirm, onCancel }) {
  const toneClass = tone === 'danger' ? 'btn-danger' : tone === 'success' ? 'btn-success' : 'btn-primary';
  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onCancel}
      width={440}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={`btn ${toneClass}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
