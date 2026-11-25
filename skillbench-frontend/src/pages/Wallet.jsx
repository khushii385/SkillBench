import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import EscrowActions from '../components/EscrowActions';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { escrowApi, projectApi, submissionApi } from '../services/api';
import { formatDateTime, formatMoney, sumBy } from '../utils/format';

const ctrl = { height: 34, padding: '0 10px', fontSize: 13 };
const TABS = [
  ['ALL', 'All'],
  ['HELD', 'Held'],
  ['RELEASED', 'Released'],
  ['REFUNDED', 'Refunded'],
];

export default function Wallet() {
  const { user } = useAuth();
  const isClient = user.role === 'CLIENT_ADMIN';
  const [statusTab, setStatusTab] = useState('ALL');
  const [query, setQuery] = useState('');

  const { data, loading, error, reload } = useApi(async () => {
    const [escrows, projects, submissions] = await Promise.all([escrowApi.mine(), projectApi.mine(), submissionApi.mine()]);
    return { escrows: escrows.data, projects: projects.data, submissions: submissions.data, submissionsOn: !submissions.unsupported };
  });

  const escrows = data?.escrows ?? [];
  const projectById = Object.fromEntries((data?.projects ?? []).map((p) => [p.id, p]));
  const submissionsOn = data?.submissionsOn ?? false;
  const approved = new Set((data?.submissions ?? []).filter((s) => s.status === 'APPROVED').map((s) => s.projectId));
  const total = (status) => sumBy(escrows.filter((e) => e.status === status), (e) => e.amount);
  const countOf = (status) => escrows.filter((e) => e.status === status).length;

  const releasedCount = countOf('RELEASED');
  const releaseRate = escrows.length > 0 ? Math.round((releasedCount / escrows.length) * 100) : 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return escrows.filter((e) => {
      if (statusTab !== 'ALL' && e.status !== statusTab) return false;
      if (!q) return true;
      const title = projectById[e.projectId]?.title || '';
      return `#esc-${e.id} ${e.id} ${e.projectId} ${title}`.toLowerCase().includes(q);
    });
  }, [escrows, statusTab, query, projectById]);

  return (
    <div className="page">
      <PageHeader
        title={isClient ? '💳 Escrow & Payments' : '💳 Wallet & Earnings'}
        subtitle={isClient ? 'Payments you have funded, and what is still held for each project.' : 'What you have earned and what is secured in escrow for your projects.'}
      />

      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <>
          <div className="stat-grid">
            {isClient ? (
              <>
                <StatCard label="Held in Escrow" value={formatMoney(total('HELD'))} tone="amber" hint={`${countOf('HELD')} payment(s) waiting for you`} />
                <StatCard label="Paid to Developers" value={formatMoney(total('RELEASED'))} tone="green" hint={`${releasedCount} released (${releaseRate}%)`} />
                <StatCard label="Refunded" value={formatMoney(total('REFUNDED'))} tone="red" hint={`${countOf('REFUNDED')} refunded`} />
              </>
            ) : (
              <>
                <StatCard label="Total Earned" value={formatMoney(total('RELEASED'))} tone="green" hint={`${releasedCount} received (${releaseRate}% release rate)`} />
                <StatCard label="Secured in Escrow" value={formatMoney(total('HELD'))} tone="amber" hint="Released when the client approves" />
                <StatCard label="Refunded to Client" value={formatMoney(total('REFUNDED'))} tone="red" hint={`${countOf('REFUNDED')} refunded`} />
              </>
            )}
          </div>

          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <h3 className="section-title" style={{ margin: 0 }}>Payment history</h3>
              {escrows.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {TABS.map(([id, label]) => (
                    <button key={id} type="button" className={`btn btn-sm ${statusTab === id ? 'btn-primary' : 'btn-ghost'}`} style={ctrl} onClick={() => setStatusTab(id)}>
                      {label}
                    </button>
                  ))}
                  <input className="input" style={{ ...ctrl, width: 190 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ID or project..." />
                </div>
              )}
            </div>

            {escrows.length === 0 ? (
              <EmptyState
                icon="💳"
                title="No payments yet"
                text={isClient ? 'Once a developer accepts your project, fund the escrow from My Projects.' : 'Payments appear here once a client funds the escrow for a project you accepted.'}
              />
            ) : visible.length === 0 ? (
              <EmptyState icon="🔍" title="No matching payments" text="Try another search or reset the filter." />
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Project</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Last updated</th>
                      {isClient && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((e) => {
                      const project = projectById[e.projectId];
                      return (
                        <tr key={e.id}>
                          <td className="id">#ESC-{e.id}</td>
                          <td className="cell-title">{project ? project.title : `Project #${e.projectId}`}</td>
                          <td className="num">{formatMoney(e.amount)}</td>
                          <td><StatusBadge status={e.status} /></td>
                          <td className="muted">{formatDateTime(e.updatedAt)}</td>
                          {isClient && (
                            <td>
                              <EscrowActions projectId={e.projectId} projectStatus={project?.status} budget={e.amount} escrow={e} canRelease={!submissionsOn || approved.has(e.projectId)} onDone={reload} />
                            </td>
                          )}
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