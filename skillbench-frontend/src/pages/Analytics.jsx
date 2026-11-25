import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { escrowApi, projectApi } from '../services/api';
import { formatMoney, sumBy } from '../utils/format';

function detectTrack(p) {
  const text = `${p.title || ''} ${p.description || ''}`.toLowerCase();
  if (/(flood|ml|data|model|prediction|analysis|dataset|research|seaborn|pandas|scikit)/.test(text)) {
    return 'Research / Data';
  }
  if (/(intern|training|portal|management|capstone|college|academic|kubernetes|diary)/.test(text)) {
    return 'Academic / Training';
  }
  return 'Build / Project';
}

function detectTag(p) {
  const text = `${p.title || ''} ${p.description || ''}`.toLowerCase();
  if (/(capstone|college|academic|report|annexure)/.test(text)) return 'Capstone';
  if (/(intern|training|diary|substring)/.test(text)) return 'Internship';
  if (/(ml|data|model|prediction|analysis|flood)/.test(text)) return 'ML / Data';
  return 'Full-Stack';
}

function readinessLabel(status) {
  if (status === 'COMPLETED') return 'Ready for Viva / Handover';
  if (status === 'IN_PROGRESS') return 'In Build · Docs Pending';
  return 'Not Started';
}

function BarRow({ label, display, value, total, tone, active, onClick }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div
      className="bar-row"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer', padding: '4px 6px', borderRadius: 8, background: active ? 'rgba(56, 189, 248, 0.08)' : undefined } : undefined}
    >
      <div className="top"><span>{label}</span><span>{display} · {pct}%</span></div>
      <div className="bar-track"><div className={`bar-fill fill-${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function lastSixMonths(projects) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-GB', { month: 'short' }), count: 0 });
  }
  projects.forEach((p) => {
    const d = new Date(p.createdAt);
    const slot = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (slot) slot.count += 1;
  });
  return months;
}

export default function Analytics() {
  const { user } = useAuth();
  const isClient = user.role === 'CLIENT_ADMIN';
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [trackFilter, setTrackFilter] = useState('ALL');

  const { data, loading, error, reload } = useApi(async () => {
    const [projects, escrows] = await Promise.all([projectApi.mine(), escrowApi.mine()]);
    return { projects: projects.data, escrows: escrows.data };
  });

  const projects = data?.projects ?? [];
  const escrows = data?.escrows ?? [];

  const filteredProjects = useMemo(() => {
    if (trackFilter === 'ALL') return projects;
    return projects.filter((p) => detectTrack(p) === trackFilter);
  }, [projects, trackFilter]);

  const totalProjects = filteredProjects.length;
  const completed = filteredProjects.filter((p) => p.status === 'COMPLETED').length;
  const completionRate = totalProjects ? Math.round((completed / totalProjects) * 100) : 0;
  const money = (status) => sumBy(escrows.filter((e) => e.status === status), (e) => e.amount);
  const moneyTotal = money('HELD') + money('RELEASED') + money('REFUNDED');
  const months = lastSixMonths(filteredProjects);
  const maxMonth = Math.max(1, ...months.map((m) => m.count));

  const statusRows = [
    { label: 'Open', status: 'OPEN', tone: 'sky' },
    { label: 'In progress', status: 'IN_PROGRESS', tone: 'amber' },
    { label: 'Completed', status: 'COMPLETED', tone: 'green' },
  ];

  const matchingProjects = useMemo(
    () => (selectedStatus ? filteredProjects.filter((p) => p.status === selectedStatus) : []),
    [filteredProjects, selectedStatus]
  );

  return (
    <div className="page">
      <PageHeader title="📈 Analytics" subtitle="Academic, training, and project progress summary." />

      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && projects.length === 0 && escrows.length === 0 && (
        <div className="card">
          <EmptyState icon="📈" title="Nothing to analyse yet" text={isClient ? 'Post a project and your numbers will show up here.' : 'Accept a project and your numbers will show up here.'} />
        </div>
      )}

      {data && (projects.length > 0 || escrows.length > 0) && (
        <>
          <div className="card" style={{ padding: '0.65rem 1rem', marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['ALL', 'Academic / Training', 'Research / Data', 'Build / Project'].map((t) => (
              <button
                key={t}
                type="button"
                className={`btn btn-sm ${trackFilter === t ? 'btn-primary' : 'btn-ghost'}`}
                style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                onClick={() => { setTrackFilter(t); setSelectedStatus(null); }}
              >
                {t === 'ALL' ? 'All Tracks' : t}
              </button>
            ))}
          </div>

          <div className="stat-grid">
            <StatCard label={isClient ? 'Projects Posted' : 'Projects / Modules'} value={totalProjects} tone="sky" />
            <StatCard label="Completion Rate" value={`${completionRate}%`} tone="green" hint={`${completed} of ${totalProjects} completed`} />
            <StatCard label={isClient ? 'Total Budget' : 'Total Value'} value={formatMoney(sumBy(filteredProjects, (p) => p.budget))} tone="indigo" />
            <StatCard label={isClient ? 'Paid Out' : 'Earned'} value={formatMoney(money('RELEASED'))} tone="green" />
          </div>

          <div className="chart-grid">
            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 className="section-title" style={{ margin: 0 }}>Projects by status</h3>
                {selectedStatus && (
                  <button type="button" className="btn btn-ghost btn-sm" style={{ height: 28, padding: '0 8px', fontSize: 12 }} onClick={() => setSelectedStatus(null)}>
                    Clear
                  </button>
                )}
              </div>
              {statusRows.map((r) => {
                const count = filteredProjects.filter((p) => p.status === r.status).length;
                return (
                  <BarRow
                    key={r.status}
                    label={r.label}
                    value={count}
                    total={totalProjects}
                    display={`${count}`}
                    tone={r.tone}
                    active={selectedStatus === r.status}
                    onClick={() => setSelectedStatus((prev) => (prev === r.status ? null : r.status))}
                  />
                );
              })}
              <div className="small muted" style={{ marginTop: 8 }}>Click a bar to view matching items.</div>
            </div>

            <div className="card card-pad">
              <h3 className="section-title">Deliverable readiness</h3>
              {filteredProjects.length === 0 ? (
                <p className="muted" style={{ fontSize: 14 }}>No items in this track.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredProjects.slice(0, 4).map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                      <div>
                        <span className="cell-title" style={{ fontSize: 13 }}>{p.title}</span>
                        <span className="badge" style={{ marginLeft: 8, fontSize: 11 }}>{detectTag(p)}</span>
                      </div>
                      <span className="small muted">{readinessLabel(p.status)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedStatus && (
            <div className="card card-pad" style={{ marginBottom: 16 }}>
              <h3 className="section-title">Filtered items ({matchingProjects.length})</h3>
              {matchingProjects.length === 0 ? (
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>No items in this status.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {matchingProjects.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                      <div>
                        <span className="cell-title">{p.title}</span>
                        <span className="small muted" style={{ marginLeft: 8 }}>· {detectTag(p)} · {readinessLabel(p.status)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="num">{formatMoney(p.budget)}</span>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="card card-pad">
            <h3 className="section-title">Activity in the last 6 months</h3>
            <div className="columns">
              {months.map((m) => (
                <div className="col" key={m.key}>
                  <span className="n">{m.count}</span>
                  <div className="bar" style={{ height: `${(m.count / maxMonth) * 100}%`, opacity: m.count ? 1 : 0.25 }} />
                  <span className="m">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}