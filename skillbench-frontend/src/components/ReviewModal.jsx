import { useState } from 'react';
import Modal from './Modal';
import { getErrorMessage, submissionApi } from '../services/api';

// decision: 'APPROVED' or 'REJECTED'
export default function ReviewModal({ submission, decision, onClose, onDone }) {
  const approving = decision === 'APPROVED';
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!approving && !feedback.trim()) {
      setError('Please tell the developer what needs to change.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await submissionApi.review(submission.id, { decision, feedback: feedback.trim() || null });
      onDone(approving);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={approving ? 'Approve this work' : 'Request changes'}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="review-form" className={`btn ${approving ? 'btn-success' : 'btn-danger'}`} disabled={saving}>
            {saving ? 'Saving…' : approving ? 'Approve' : 'Send feedback'}
          </button>
        </>
      }
    >
      <form id="review-form" onSubmit={handleSubmit} noValidate>
        <p style={{ marginBottom: 14 }}>
          {approving
            ? `Approve the work on "${submission.projectTitle}"? You can then release the payment from My Projects.`
            : `The developer will see your feedback for "${submission.projectTitle}" and can submit again.`}
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label className="label" htmlFor="rv-feedback">{approving ? 'Note for the developer (optional)' : 'What needs to change?'}</label>
          <textarea id="rv-feedback" className="textarea" value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={1000} />
        </div>
      </form>
    </Modal>
  );
}
