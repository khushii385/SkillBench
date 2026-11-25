import { useState } from 'react';
import Modal from './Modal';
import { getErrorMessage, submissionApi } from '../services/api';

// projects = the developer's projects that can receive a submission right now
export default function SubmitWorkModal({ projects, onClose, onSaved }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [message, setMessage] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const local = {};
    if (!message.trim()) local.message = 'Please describe the work you are submitting';
    if (repoUrl.trim() && !/^https?:\/\/\S+$/.test(repoUrl.trim())) local.repoUrl = 'Link must start with http:// or https://';
    setErrors(local);
    if (Object.keys(local).length) return;

    setSaving(true);
    try {
      const { data } = await submissionApi.create(projectId, { message: message.trim(), repoUrl: repoUrl.trim() || null });
      onSaved(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setErrors(err.response?.data?.fieldErrors || {});
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Submit your work"
      onClose={saving ? () => {} : onClose}
      width={540}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="submit-form" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting…' : 'Submit for review'}</button>
        </>
      }
    >
      <form id="submit-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label className="label" htmlFor="sw-project">Project</label>
          <select id="sw-project" className="select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="sw-message">What did you build?</label>
          <textarea id="sw-message" className={`textarea ${errors.message ? 'invalid' : ''}`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} placeholder="Describe what is done and how the client can check it." />
          {errors.message && <span className="field-error">{errors.message}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="sw-link">Link (optional)</label>
          <input id="sw-link" className={`input ${errors.repoUrl ? 'invalid' : ''}`} value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/you/project" />
          {errors.repoUrl && <span className="field-error">{errors.repoUrl}</span>}
        </div>
      </form>
    </Modal>
  );
}
