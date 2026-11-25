import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import { useToast } from '../context/ToastContext';
import useApi from '../hooks/useApi';
import { getErrorMessage, projectApi } from '../services/api';
import { formatDate, formatMoney } from '../utils/format';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ai-ml', label: 'AI / ML / NLP' },
  { id: 'data', label: 'Data & Analytics' },
  { id: 'microservices', label: 'Microservices / Spring' },
  { id: 'backend', label: 'Backend / APIs' },
  { id: 'frontend', label: 'Frontend / UI' },
  { id: 'devops', label: 'DevOps / Cloud' },
];

const CORE_MATCH_TERMS = [
  'spring',
  'microservice',
  'microservices',
  'react',
  'full-stack',
  'fullstack',
  'java',
  'api',
];

function hasWordOrPhrase(text, keyword) {
  if (!text) return false;
  if (keyword.length <= 3 && !keyword.includes('/')) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  }
  return text.includes(keyword);
}

function matchesFilter(project, filterId) {
  if (filterId === 'all') return true;
  const text = `${project.title || ''} ${project.description || ''}`.toLowerCase();

  switch (filterId) {
    case 'ai-ml':
      return (
        hasWordOrPhrase(text, 'ai') ||
        hasWordOrPhrase(text, 'ml') ||
        text.includes('machine learning') ||
        hasWordOrPhrase(text, 'nlp') ||
        text.includes('deep learning') ||
        text.includes('prediction') ||
        text.includes('model')
      );
    case 'data':
      return (
        text.includes('data') ||
        text.includes('analytics') ||
        text.includes('churn') ||
        text.includes('pandas') ||
        text.includes('numpy') ||
        text.includes('visualization')
      );
    case 'microservices':
      return (
        text.includes('microservice') ||
        text.includes('spring') ||
        text.includes('distributed') ||
        text.includes('gateway')
      );
    case 'backend':
      return (
        text.includes('backend') ||
        hasWordOrPhrase(text, 'api') ||
        text.includes('rest') ||
        text.includes('database') ||
        hasWordOrPhrase(text, 'sql') ||
        text.includes('auth')
      );
    case 'frontend':
      return (
        text.includes('frontend') ||
        text.includes('react') ||
        hasWordOrPhrase(text, 'ui') ||
        text.includes('full-stack') ||
        text.includes('fullstack') ||
        text.includes('web app')
      );
    case 'devops':
      return (
        text.includes('docker') ||
        text.includes('kubernetes') ||
        text.includes('ci/cd') ||
        text.includes('cloud') ||
        text.includes('deploy')
      );
    default:
      return true;
  }
}

function getDueBadge(deadline) {
  if (!deadline) return null;
  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) return null;
  const daysLeft = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return 'Due today';
  if (daysLeft <= 5) return `${daysLeft}d left`;
  return null;
}

function isStackMatch(project) {
  const text = `${project.title || ''} ${project.description || ''}`.toLowerCase();
  return CORE_MATCH_TERMS.some((term) => hasWordOrPhrase(text, term));
}

// Developer page: browse open projects, filter/sort, preview details, and accept one
export default function FindWork() {
  const toast = useToast();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [accepting, setAccepting] = useState(false);

  // Search, filter & sort state
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const { data, loading, error, reload } = useApi(async () => (await projectApi.open()).data);
  const projects = data ?? [];

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = projects.filter((p) => {
      if (!matchesFilter(p, activeFilter)) return false;
      if (!q) return true;
      const haystack = `${p.title || ''} ${p.description || ''}`.toLowerCase();
      return haystack.includes(q);
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'budget-desc') {
        return Number(b.budget || 0) - Number(a.budget || 0);
      }
      if (sortBy === 'deadline-asc') {
        const da = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [projects, search, activeFilter, sortBy]);

  // Close modal on Escape key
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !accepting) setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, accepting]);

  const handleAccept = async () => {
    if (!selected || accepting) return;
    setAccepting(true);
    try {
      await projectApi.accept(selected.id);
      toast.success('Project accepted. You can find it in My Assigned Tasks.');
      setSelected(null);
      navigate('/dashboard/tasks');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSelected(null);
      reload();
    } finally {
      setAccepting(false);
    }
  };

  const deliverables = Array.isArray(selected?.deliverables)
    ? selected.deliverables
    : typeof selected?.deliverables === 'string' && selected.deliverables.trim()
      ? selected.deliverables
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const hasActiveControls = search.trim() !== '' || activeFilter !== 'all';
  const selectedDueBadge = selected ? getDueBadge(selected.deadline) : null;
  const selectedMatched = selected ? isStackMatch(selected) : false;

  return (
    <div className="page">
      <PageHeader
        title="🔎 Find Projects"
        subtitle="Open projects posted by clients. Click any project to inspect full details before accepting."
      />

      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && projects.length === 0 && (
        <div className="card">
          <EmptyState
            icon="🔎"
            title="No open projects right now"
            text="New projects show up here as soon as clients post them."
            action={
              <button type="button" className="btn btn-ghost" onClick={reload}>
                Refresh
              </button>
            }
          />
        </div>
      )}

      {projects.length > 0 && (
        <>
          {/* Search, Filter Chips & Sort Bar */}
          <div
            className="card"
            style={{
              marginBottom: '1rem',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.5rem',
                flex: '1 1 320px',
              }}
            >
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by title or stack..."
                aria-label="Search projects"
                style={{
                  minWidth: '210px',
                  flex: '1 1 210px',
                  padding: '0.45rem 0.7rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: 'inherit',
                }}
              />

              {FILTERS.map((f) => {
                const isActive = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveFilter(f.id)}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="small">
                {filteredProjects.length} of {projects.length}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort projects"
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: 'inherit',
                }}
              >
                <option value="newest">Sort: Newest</option>
                <option value="budget-desc">Budget: High to Low</option>
                <option value="deadline-asc">Deadline: Soonest</option>
              </select>

              {hasActiveControls && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSearch('');
                    setActiveFilter('all');
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="🧩"
                title="No matching projects"
                text="Try another keyword or clear your active filter."
                action={
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setSearch('');
                      setActiveFilter('all');
                    }}
                  >
                    Reset filters
                  </button>
                }
              />
            </div>
          ) : (
            <div className="project-grid">
              {filteredProjects.map((p) => {
                const dueBadge = getDueBadge(p.deadline);
                const matched = isStackMatch(p);

                return (
                  <article
                    key={p.id}
                    className="card project-card"
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(p)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelected(p);
                      }
                    }}
                  >
                    {(dueBadge || matched) && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.4rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {matched && (
                          <span
                            className="small"
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: '#7dd3fc',
                            }}
                          >
                            Stack Match
                          </span>
                        )}
                        {dueBadge && (
                          <span
                            className="small"
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              border: '1px solid rgba(251, 191, 36, 0.35)',
                              color: '#fcd34d',
                            }}
                          >
                            {dueBadge}
                          </span>
                        )}
                      </div>
                    )}

                    <h3>{p.title}</h3>
                    <p className="desc">{p.description}</p>
                    <div className="meta">
                      <div>
                        <div className="budget">{formatMoney(p.budget)}</div>
                        <div className="small">
                          {p.deadline ? `Due ${formatDate(p.deadline)}` : 'No deadline'} · Posted{' '}
                          {formatDate(p.createdAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(p);
                        }}
                      >
                        Accept
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {selected && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => !accepting && setSelected(null)}
        >
          <div
            className="card modal-card"
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div className="small" style={{ marginBottom: '0.35rem' }}>
                  Project #{selected.id} · project-service &amp; escrow-service
                </div>
                {(selectedMatched || selectedDueBadge) && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      marginBottom: '0.45rem',
                    }}
                  >
                    {selectedMatched && (
                      <span
                        className="small"
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          color: '#7dd3fc',
                        }}
                      >
                        Stack Match
                      </span>
                    )}
                    {selectedDueBadge && (
                      <span
                        className="small"
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          border: '1px solid rgba(251, 191, 36, 0.35)',
                          color: '#fcd34d',
                        }}
                      >
                        {selectedDueBadge}
                      </span>
                    )}
                  </div>
                )}
                <h2 id="project-modal-title" style={{ margin: 0 }}>
                  {selected.title}
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={accepting}
                onClick={() => setSelected(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Full Description */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="small" style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                Full Description
              </div>
              <p className="desc" style={{ margin: 0, whiteSpace: 'pre-line', maxHeight: 'none' }}>
                {selected.description || 'No additional description provided.'}
              </p>
            </div>

            {/* Deliverables */}
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.9rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
              }}
            >
              <div className="small" style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                Deliverables &amp; Submission Scope
              </div>
              {deliverables.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }} className="small">
                  {deliverables.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small" style={{ margin: 0 }}>
                  Deliver the complete solution and submit your work via <strong>Submissions</strong>{' '}
                  before the deadline. Once accepted, other developers will no longer see this project.
                </p>
              )}
            </div>

            {/* Service & Escrow Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                <div className="small">Escrow Budget (escrow-service)</div>
                <div className="budget" style={{ marginTop: '0.25rem' }}>
                  {formatMoney(selected.budget)}
                </div>
                <div className="small" style={{ marginTop: '0.2rem' }}>
                  Status: {selected.escrowStatus || 'Escrow Protected'}
                </div>
              </div>

              <div
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                <div className="small">Schedule (project-service)</div>
                <div className="small" style={{ marginTop: '0.35rem' }}>
                  Posted: {formatDate(selected.createdAt)}
                </div>
                <div className="small" style={{ marginTop: '0.2rem' }}>
                  Deadline: {selected.deadline ? formatDate(selected.deadline) : 'No deadline'}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.65rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                disabled={accepting}
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={accepting}
                onClick={handleAccept}
              >
                {accepting ? 'Accepting...' : 'Accept project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}