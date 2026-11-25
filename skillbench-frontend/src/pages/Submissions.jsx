import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import ReviewModal from '../components/ReviewModal';
import StatusBadge from '../components/StatusBadge';
import SubmitWorkModal from '../components/SubmitWorkModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useApi from '../hooks/useApi';
import { projectApi, submissionApi } from '../services/api';
import { formatDateTime } from '../utils/format';

const ctrl = { height: 34, padding: '0 10px', fontSize: 13 };
const TABS = [
  ['ALL', 'All'],
  ['SUBMITTED', 'Pending'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Rejected'],
];

export default function Submissions() {
  const { user } = useAuth();
  const toast = useToast();
  const isClient = user.role === 'CLIENT_ADMIN';
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState(null);
  const [statusTab, setStatusTab] = useState('ALL');
  const [query, setQuery] = useState('');

  const { data, loading, error, reload } = useApi(async () => {
    const calls = [submissionApi.mine()];
    if (!isClient) calls.push(projectApi.mine());
    const [subs, projects] = await Promise.all(calls);
    return { submissions: subs.data, projects: projects ? projects.data : [], unsupported: Boolean(subs.unsupported) };
  }, [isClient]);

  const submissions = data?.submissions ?? [];
  const busyProjects = new Set(submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'APPROVED').map((s) => s.projectId));
  const eligible = (data?.projects ?? []).filter((p) => p.status === 'IN_PROGRESS' && !busyProjects.has(p.id));
  const pending = submissions.filter((s) => s.status === 'SUBMITTED').length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusTab !== 'ALL' && s.status !== statusTab) return false;
      if (!q) return true;
      return `${s.id} ${s.projectId} ${s.projectTitle || ''} ${s.message || ''} ${s.feedback || ''}`.toLowerCase().includes(q);
    });
  }, [submissions, statusTab, query]);

  return (
    <div className="page">
      <PageHeader
        title="📤 Submissions"
        subtitle={isClient ? 'Review the work developers hand in. Approve it before you release the payment.' : 'Hand in your work for the client to review.'}
      >
        {!isClient && (
          <button type="button" className="btn btn-primary" onClick={() => setSubmitting(true)} disabled={eligible.length === 0} title={eligible.length === 0 ? 'No project is ready for a new submission' : ''}>
            + Submit work
          </button>
        )}
        {isClient && pending > 0 && <span className="badge badge-amber">{pending} waiting for your review</span>}
      </PageHeader>

      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data?.unsupported && (
        <div className="card">
          <EmptyState icon="🛠️" title="Submissions need a backend update" text="Your project-service does not have the submissions endpoints yet. Add them (see the backend change list) and this page will work." />
        </div>
      )}

      {data && !data.unsupported && submissions.length === 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <EmptyState
            icon="📤"
            title="No submissions yet"
            text={isClient ? 'When a developer submits work on one of your projects it will show up here.' : 'Once you have accepted a project and done the work, submit it here.'}
            action={!isClient && <Link to="/dashboard/tasks" className="btn btn-ghost">View my tasks</Link>}
          />
        </div>
      )}

      {data && !data.unsupported && submissions.length > 0 && (
        <>
          <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {TABS.map(([id, label]) => (
                <button key={id} type="button" className={`btn btn-sm ${statusTab === id ? 'btn-primary' : 'btn-ghost'}`} style={ctrl} onClick={() => setStatusTab(id)}>
                  {label}
                </button>
              ))}
            </div>
            <input className="input" style={{ ...ctrl, width: 210 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search project or note..." />
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {visible.length === 0 ? (
              <EmptyState icon="🔍" title="No matching submissions" text="Try another search or reset the filter." />
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Work submitted</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      {isClient && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="cell-title">{s.projectTitle || `Project #${s.projectId}`}</div>
                          <div className="muted" style={{ fontSize: 12 }}>#SUB-{s.id}</div>
                        </td>
                        <td style={{ maxWidth: 360 }}>
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{s.message}</div>
                          {s.repoUrl && <a href={s.repoUrl} target="_blank" rel="noreferrer" className="link-sky">Open link ↗</a>}
                          {s.feedback && <div className="feedback"><strong>{s.status === 'REJECTED' ? 'Feedback:' : 'Note:'}</strong> {s.feedback}</div>}
                        </td>
                        <td><StatusBadge status={s.status} /></td>
                        <td className="muted">{formatDateTime(s.createdAt)}</td>
                        {isClient && (
                          <td>
                            {s.status === 'SUBMITTED' ? (
                              <div className="actions">
                                <button type="button" className="btn btn-success btn-sm" onClick={() => setReview({ submission: s, decision: 'APPROVED' })}>Approve</button>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => setReview({ submission: s, decision: 'REJECTED' })}>Request changes</button>
                              </div>
                            ) : s.status === 'APPROVED' ? (
                              <Link to="/dashboard/projects" className="btn btn-ghost btn-sm">Go to payment</Link>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {submitting && (
        <SubmitWorkModal
          projects={eligible}
          onClose={() => setSubmitting(false)}
          onSaved={() => {
            setSubmitting(false);
            toast.success('Work submitted. The client will review it.');
            reload();
          }}
        />
      )}

      {review && (
        <ReviewModal
          submission={review.submission}
          decision={review.decision}
          onClose={() => setReview(null)}
          onDone={(approved) => {
            setReview(null);
            toast.success(approved ? 'Work approved. You can now release the payment from My Projects.' : 'Feedback sent to the developer.');
            reload();
          }}
        />
      )}
    </div>
  );
}