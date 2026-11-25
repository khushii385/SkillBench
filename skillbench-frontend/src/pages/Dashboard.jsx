import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { escrowApi, projectApi, submissionApi } from '../services/api';
import { formatDate, formatMoney, sumBy } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const isClient = user.role === 'CLIENT_ADMIN';

  const { data, loading, error, reload } = useApi(async () => {
    const calls = [projectApi.mine(), escrowApi.mine(), submissionApi.mine()];
    if (!isClient) calls.push(projectApi.open());
    const [projects, escrows, submissions, open] = await Promise.all(calls);
    return { projects: projects.data, escrows: escrows.data, submissions: submissions.data, submissionsOn: !submissions.unsupported, open: open ? open.data : [] };
  }, [isClient]);

  const projects = data?.projects ?? [];
  const escrows = data?.escrows ?? [];
  const count = (status) => projects.filter((p) => p.status === status).length;
  const pendingReviews = (data?.submissions ?? []).filter((s) => s.status === 'SUBMITTED').length;
  const held = sumBy(escrows.filter((e) => e.status === 'HELD'), (e) => e.amount);
  const released = sumBy(escrows.filter((e) => e.status === 'RELEASED'), (e) => e.amount);

  return (
    <div className="page">
      <div className="card page-head">
        <div>
          <h1>Welcome back, {user.name} 👋</h1>
          <p>
            {isClient
              ? 'Here is where your projects and escrow payments stand.'
              : 'Here is your work and what you have earned so far.'}
          </p>
        </div>
      </div>

      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <>
          <div className="stat-grid">
            {isClient ? (
              <>
                <StatCard label="Total Projects" value={projects.length} tone="sky" />
                <StatCard label="Open" value={count('OPEN')} tone="sky" hint="Waiting for a developer" />
                <StatCard label="In Progress" value={count('IN_PROGRESS')} tone="amber" />
                <StatCard label="Completed" value={count('COMPLETED')} tone="green" />
                {data.submissionsOn && <StatCard label="Pending Reviews" value={pendingReviews} tone="amber" hint="Work waiting for your approval" />}
                <StatCard label="Held in Escrow" value={formatMoney(held)} tone="amber" />
              </>
            ) : (
              <>
                <StatCard label="My Assigned Tasks" value={projects.length} tone="sky" />
                <StatCard label="Open Projects" value={data.open.length} tone="indigo" hint="Available to accept" />
                {data.submissionsOn && <StatCard label="Pending Reviews" value={pendingReviews} tone="amber" hint="Your work waiting for the client" />}
                <StatCard label="Total Earned" value={formatMoney(released)} tone="green" />
                <StatCard label="Secured in Escrow" value={formatMoney(held)} tone="amber" hint="Paid when the client releases" />
              </>
            )}
          </div>

          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 className="section-title" style={{ margin: 0 }}>{isClient ? 'Recent projects' : 'Recent tasks'}</h3>
              <Link to={isClient ? '/dashboard/projects' : '/dashboard/tasks'} className="btn btn-ghost btn-sm">View all</Link>
            </div>

            {projects.length === 0 ? (
              <EmptyState
                icon={isClient ? '📁' : '🔎'}
                title={isClient ? 'No projects yet' : 'No tasks yet'}
                text={isClient ? 'Post your first project and developers can start accepting it.' : 'Browse open projects and accept one to get started.'}
                action={
                  <Link to={isClient ? '/dashboard/projects' : '/dashboard/find-work'} className="btn btn-primary">
                    {isClient ? 'Post a project' : 'Find projects'}
                  </Link>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.slice(0, 5).map((p) => (
                      <tr key={p.id}>
                        <td><div className="cell-title">{p.title}</div></td>
                        <td className="num">{formatMoney(p.budget)}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td className="muted">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))}
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
