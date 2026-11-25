import { useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import EscrowActions from '../components/EscrowActions';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import ProjectFormModal from '../components/ProjectFormModal';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import useApi from '../hooks/useApi';
import { escrowApi, getErrorMessage, projectApi, submissionApi } from '../services/api';
import { formatDate, formatMoney } from '../utils/format';

const FILTERS = [
  ['ALL', 'All'],
  ['OPEN', 'Open'],
  ['IN_PROGRESS', 'In progress'],
  ['COMPLETED', 'Completed'],
];

// Client page: post, edit and delete projects, then fund / release / refund the escrow
export default function MyProjects() {
  const toast = useToast();
  const [filter, setFilter] = useState('ALL');
  const [formFor, setFormFor] = useState(undefined); // undefined = closed, null = new, object = edit
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useApi(async () => {
    const [projects, escrows, submissions] = await Promise.all([projectApi.mine(), escrowApi.mine(), submissionApi.mine()]);
    return { projects: projects.data, escrows: escrows.data, submissions: submissions.data, submissionsOn: !submissions.unsupported };
  });

  const projects = data?.projects ?? [];
  const escrowByProject = Object.fromEntries((data?.escrows ?? []).map((e) => [e.projectId, e]));
  const submissions = data?.submissions ?? [];
  const submissionsOn = data?.submissionsOn ?? false;   // false = backend has no submissions yet, release is not gated
  const approved = new Set(submissions.filter((s) => s.status === 'APPROVED').map((s) => s.projectId));
  const awaiting = new Set(submissions.filter((s) => s.status === 'SUBMITTED').map((s) => s.projectId));
  const visible = filter === 'ALL' ? projects : projects.filter((p) => p.status === filter);
  const countOf = (key) => (key === 'ALL' ? projects.length : projects.filter((p) => p.status === key).length);

  const handleSaved = (_project, wasEdit) => {
    setFormFor(undefined);
    toast.success(wasEdit ? 'Project updated.' : 'Project posted. Developers can now see it.');
    reload();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectApi.remove(toDelete.id);
      toast.success('Project deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setToDelete(null);
      reload();
    }
  };

  return (
    <div className="page">
      <PageHeader title="📁 My Projects" subtitle="Post projects, follow their progress and manage the escrow payment.">
        <button type="button" className="btn btn-primary" onClick={() => setFormFor(null)}>+ New project</button>
      </PageHeader>

      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <>
          <div className="tabs" role="tablist">
            {FILTERS.map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={filter === key} className={`tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
                {label}<span className="count">{countOf(key)}</span>
              </button>
            ))}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {visible.length === 0 ? (
              <EmptyState
                icon="📁"
                title={projects.length === 0 ? 'No projects yet' : 'Nothing in this view'}
                text={projects.length === 0 ? 'Post your first project and developers can start accepting it.' : 'Try another filter.'}
                action={projects.length === 0 && <button type="button" className="btn btn-primary" onClick={() => setFormFor(null)}>Post a project</button>}
              />
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Budget</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th>Escrow</th>
                      <th>Developer</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((p) => {
                      const escrow = escrowByProject[p.id];
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="cell-title">{p.title}</div>
                            <div className="cell-sub">{p.description}</div>
                          </td>
                          <td className="num">{formatMoney(p.budget)}</td>
                          <td className="muted">{formatDate(p.deadline)}</td>
                          <td><StatusBadge status={p.status} /></td>
                          <td><StatusBadge status={escrow?.status} /></td>
                          <td className="muted">{p.assignedVendorId ? `Developer #${p.assignedVendorId}` : 'Not assigned'}</td>
                          <td>
                            {p.status === 'OPEN' ? (
                              <div className="actions">
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFormFor(p)}>Edit</button>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(p)}>Delete</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                                {awaiting.has(p.id) && <Link to="/dashboard/submissions" className="btn btn-primary btn-sm">Review work</Link>}
                                <EscrowActions projectId={p.id} projectStatus={p.status} budget={p.budget} escrow={escrow} canRelease={!submissionsOn || approved.has(p.id)} onDone={reload} />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {formFor !== undefined && (
        <ProjectFormModal project={formFor || undefined} onClose={() => setFormFor(undefined)} onSaved={handleSaved} />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete project"
          message={`Delete "${toDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete project"
          tone="danger"
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
