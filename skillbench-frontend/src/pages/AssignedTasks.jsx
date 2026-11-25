import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import useApi from '../hooks/useApi';
import { escrowApi, projectApi, submissionApi } from '../services/api';
import { formatDate, formatMoney } from '../utils/format';

const ctrlStyle = { height: 34, padding: '0 10px', fontSize: 13 };

function paymentCell(project, escrow) {
  if (!escrow) {
    return project.status === 'COMPLETED'
      ? <span className="muted">—</span>
      : <span className="muted">Waiting for the client to fund escrow</span>;
  }
  return <StatusBadge status={escrow.status} />;
}

function daysLeft(deadline) {
  if (!deadline) return null;
  const d = Math.ceil((new Date(deadline) - Date.now()) / 86400000);
  return Number.isNaN(d) ? null : d;
}

export default function AssignedTasks() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('default');

  const { data, loading, error, reload } = useApi(async () => {
    const [projects, escrows, submissions] = await Promise.all([
      projectApi.mine(),
      escrowApi.mine(),
      submissionApi.mine(),
    ]);
    return {
      projects: projects.data,
      escrows: escrows.data,
      submissions: submissions.data,
      submissionsOn: !submissions.unsupported,
    };
  });

  const projects = data?.projects ?? [];
  const submissionsOn = data?.submissionsOn ?? false;
  const escrowByProject = useMemo(
    () => Object.fromEntries((data?.escrows ?? []).map((e) => [e.projectId, e])),
    [data?.escrows]
  );
  const latestSubmission = useMemo(() => {
    const map = {};
    (data?.submissions ?? []).forEach((s) => {
      if (!map[s.projectId]) map[s.projectId] = s;
    });
    return map;
  }, [data?.submissions]);

  const needsAction = (p) =>
    p.status !== 'COMPLETED' &&
    (latestSubmission[p.id]?.status === 'REJECTED' ||
      (p.status === 'IN_PROGRESS' && (!submissionsOn || !latestSubmission[p.id])));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter((p) => {
      if (tab === 'in-progress' && p.status !== 'IN_PROGRESS') return false;
      if (tab === 'completed' && p.status !== 'COMPLETED') return false;
      if (tab === 'action' && !needsAction(p)) return false;
      if (!q) return true;
      return `${p.id} ${p.title} ${p.description || ''}`.toLowerCase().includes(q);
    });
    if (sort === 'budget') return [...list].sort((a, b) => Number(b.budget || 0) - Number(a.budget || 0));
    if (sort === 'deadline') {
      return [...list].sort(
        (a, b) =>
          (a.deadline ? new Date(a.deadline).getTime() : Infinity) -
          (b.deadline ? new Date(b.deadline).getTime() : Infinity)
      );
    }
    return list;
  }, [projects, query, tab, sort, latestSubmission, submissionsOn]);

  const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);

  return (
    <div className="page">
      <PageHeader title="📋 My Assigned Tasks" subtitle="Projects you accepted, and whether the payment is secured." />

      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && projects.length === 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <EmptyState
            icon="📋"
            title="No tasks yet"
            text="Accept an open project and it will show up here."
            action={<Link to="/dashboard/find-work" className="btn btn-primary">Find projects</Link>}
          />
        </div>
      )}

      {data && projects.length > 0 && (
        <>
          <div className="project-grid" style={{ marginBottom: 14 }}>
            <div className="card" style={{ padding: '0.85rem 1rem' }}>
              <div className="small">Total Tasks</div>
              <strong>{projects.length}</strong>
            </div>
            <div className="card" style={{ padding: '0.85rem 1rem' }}>
              <div className="small">Action Needed</div>
              <strong>{projects.filter(needsAction).length}</strong>
            </div>
            <div className="card" style={{ padding: '0.85rem 1rem' }}>
              <div className="small">Total Budget</div>
              <div className="budget">{formatMoney(totalBudget)}</div>
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '0.75rem 1rem',
              marginBottom: 14,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                ['all', 'All'],
                ['action', 'Action Needed'],
                ['in-progress', 'In Progress'],
                ['completed', 'Completed'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`btn btn-sm ${tab === id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ height: 34, padding: '0 12px', fontSize: 13 }}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                className="input"
                style={{ ...ctrlStyle, width: 200 }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search task..."
              />
              <select
                className="input"
                style={{ ...ctrlStyle, width: 'auto' }}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="default">Sort: Default</option>
                <option value="deadline">Deadline: Soonest</option>
                <option value="budget">Budget: High to Low</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {visible.length === 0 ? (
              <EmptyState icon="🔍" title="No matching tasks" text="Try another search or filter." />
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Project</th>
                      <th>Budget</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      {submissionsOn && <th>Work</th>}
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((p) => {
                      const rem = p.status !== 'COMPLETED' ? daysLeft(p.deadline) : null;
                      const sub = latestSubmission[p.id];
                      return (
                        <tr key={p.id}>
                          <td className="id">#SB-{p.id}</td>
                          <td>
                            <div className="cell-title">{p.title}</div>
                            <div className="cell-sub">{p.description}</div>
                          </td>
                          <td className="num">{formatMoney(p.budget)}</td>
                          <td className="muted">
                            {formatDate(p.deadline)}
                            {rem !== null && rem <= 5 && (
                              <div className="small" style={{ color: '#fcd34d' }}>
                                {rem <= 0 ? 'Due / Overdue' : `${rem}d left`}
                              </div>
                            )}
                          </td>
                          <td><StatusBadge status={p.status} /></td>
                          {submissionsOn && (
                            <td>
                              {sub ? (
                                <StatusBadge status={sub.status} />
                              ) : p.status === 'IN_PROGRESS' ? (
                                <Link to="/dashboard/submissions" className="btn btn-ghost btn-sm">Submit work</Link>
                              ) : (
                                <span className="muted">—</span>
                              )}
                              {sub?.status === 'REJECTED' && (
                                <Link to="/dashboard/submissions" className="link-sky" style={{ display: 'block', marginTop: 6 }}>
                                  See feedback
                                </Link>
                              )}
                            </td>
                          )}
                          <td>{paymentCell(p, escrowByProject[p.id])}</td>
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
    </div>
  );
}