import { useState } from 'react';
import Modal from './Modal';
import { getErrorMessage, projectApi } from '../services/api';

function todayLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// project = existing project to edit; omit it to create a new one
export default function ProjectFormModal({ project, onClose, onSaved }) {
  const editing = Boolean(project);
  const [form, setForm] = useState({
    title: project?.title ?? '',
    description: project?.description ?? '',
    budget: project?.budget ?? '',
    deadline: project?.deadline ?? '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const local = {};
    if (!form.title.trim()) local.title = 'Title is required';
    if (!form.description.trim()) local.description = 'Description is required';
    if (!(Number(form.budget) >= 1)) local.budget = 'Budget must be at least 1';
    if (form.deadline && form.deadline < todayLocal()) local.deadline = 'Deadline cannot be in the past';
    setErrors(local);
    if (Object.keys(local).length) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      budget: Number(form.budget),
      deadline: form.deadline || null,
    };

    setSaving(true);
    try {
      const res = editing ? await projectApi.update(project.id, payload) : await projectApi.create(payload);
      onSaved(res.data, editing);
    } catch (err) {
      setError(getErrorMessage(err));
      setErrors(err.response?.data?.fieldErrors || {});
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? 'Edit project' : 'Post a new project'}
      onClose={saving ? () => {} : onClose}
      width={540}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="project-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Post project'}
          </button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label className="label" htmlFor="pf-title">Title</label>
          <input id="pf-title" className={`input ${errors.title ? 'invalid' : ''}`} value={form.title} onChange={set('title')} maxLength={150} placeholder="e.g. Build a booking website" />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="pf-desc">Description</label>
          <textarea id="pf-desc" className={`textarea ${errors.description ? 'invalid' : ''}`} value={form.description} onChange={set('description')} maxLength={2000} placeholder="What needs to be built, and what does done look like?" />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </div>

        <div className="row-2">
          <div className="field">
            <label className="label" htmlFor="pf-budget">Budget</label>
            <input id="pf-budget" type="number" min="1" step="0.01" className={`input ${errors.budget ? 'invalid' : ''}`} value={form.budget} onChange={set('budget')} placeholder="5000" />
            {errors.budget && <span className="field-error">{errors.budget}</span>}
          </div>
          <div className="field">
            <label className="label" htmlFor="pf-deadline">Deadline (optional)</label>
            <input id="pf-deadline" type="date" min={todayLocal()} className={`input ${errors.deadline ? 'invalid' : ''}`} value={form.deadline} onChange={set('deadline')} />
            {errors.deadline && <span className="field-error">{errors.deadline}</span>}
          </div>
        </div>
      </form>
    </Modal>
  );
}
