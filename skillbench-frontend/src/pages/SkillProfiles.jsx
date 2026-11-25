import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import SkillsInput from '../components/SkillsInput';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useApi from '../hooks/useApi';
import { getErrorMessage, profileApi } from '../services/api';

const QUICK_SKILL_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'java-spring', label: 'Java / Spring' },
  { id: 'react-web', label: 'React / Web' },
  { id: 'ml-data', label: 'ML / Data' },
];

function matchesSkillFilter(dev, filterId) {
  if (filterId === 'all') return true;
  const skills = (dev.skills || []).map((s) => s.toLowerCase());
  const text = `${dev.headline || ''} ${dev.bio || ''} ${skills.join(' ')}`.toLowerCase();

  if (filterId === 'java-spring') {
    return text.includes('java') || text.includes('spring') || text.includes('microservice');
  }
  if (filterId === 'react-web') {
    return text.includes('react') || text.includes('vite') || text.includes('full-stack') || text.includes('fullstack');
  }
  if (filterId === 'ml-data') {
    return (
      text.includes('machine learning') ||
      text.includes('data') ||
      text.includes('python') ||
      text.includes('numpy') ||
      text.includes('ai')
    );
  }
  return true;
}

function getCompleteness(profile) {
  if (!profile) return { percent: 0, missing: [] };
  const checks = [
    { label: 'Headline', done: Boolean(profile.headline?.trim()) },
    { label: 'Bio', done: Boolean(profile.bio?.trim()) },
    { label: 'Skills', done: Array.isArray(profile.skills) && profile.skills.length > 0 },
    { label: 'Avatar', done: Boolean(profile.avatarUrl?.trim()) },
    { label: 'Education', done: Boolean(profile.education?.trim()) },
    { label: 'Experience', done: Boolean(profile.experience?.trim()) },
    { label: 'Portfolio', done: Boolean(profile.portfolioUrl?.trim()) },
    { label: 'LinkedIn', done: Boolean(profile.linkedinUrl?.trim()) },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);
  const missing = checks.filter((c) => !c.done).map((c) => c.label);
  return { percent, missing };
}

function SkillChips({ skills }) {
  if (!skills || skills.length === 0) return <span className="muted" style={{ fontSize: 13 }}>No skills added yet</span>;
  return (
    <div className="skill-list">
      {skills.map((s) => <span key={s} className="skill-chip">{s}</span>)}
    </div>
  );
}

export default function SkillProfiles() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const isDeveloper = user.role === 'VENDOR_DEVELOPER';
  const [query, setQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [editing, setEditing] = useState(false);
  const [inspectedDev, setInspectedDev] = useState(null);

  const [form, setForm] = useState({
    headline: '',
    bio: '',
    skills: [],
    avatarUrl: '',
    education: '',
    experience: '',
    portfolioUrl: '',
    linkedinUrl: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useApi(async () => {
    const calls = [profileApi.developers()];
    if (isDeveloper) calls.push(profileApi.me());
    const [developers, me] = await Promise.all(calls);
    return {
      developers: developers.data,
      me: me ? me.data : null,
      unsupported: Boolean(developers.unsupported),
    };
  }, [isDeveloper]);

  const me = data?.me;
  const completeness = useMemo(() => getCompleteness(me), [me]);

  const q = query.trim().toLowerCase();
  const developers = useMemo(() => {
    return (data?.developers ?? []).filter((d) => {
      if (!matchesSkillFilter(d, skillFilter)) return false;
      if (!q) return true;
      return (
        (d.name || '').toLowerCase().includes(q) ||
        (d.headline || '').toLowerCase().includes(q) ||
        (d.skills || []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [data?.developers, q, skillFilter]);

  useEffect(() => {
    if (!inspectedDev) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setInspectedDev(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inspectedDev]);

  const startEdit = () => {
    setForm({
      headline: me.headline || '',
      bio: me.bio || '',
      skills: me.skills || [],
      avatarUrl: me.avatarUrl || '',
      education: me.education || '',
      experience: me.experience || '',
      portfolioUrl: me.portfolioUrl || '',
      linkedinUrl: me.linkedinUrl || '',
    });
    setErrors({});
    setEditing(true);
  };

  // Function to handle image file selection from gallery
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((f) => ({ ...f, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const { data: updated } = await profileApi.update({
        name: me.name,
        headline: form.headline,
        bio: form.bio,
        skills: form.skills,
        avatarUrl: form.avatarUrl,
        education: form.education,
        experience: form.experience,
        portfolioUrl: form.portfolioUrl,
        linkedinUrl: form.linkedinUrl,
      });
      updateUser({ name: updated.name });
      toast.success('Profile saved.');
      setEditing(false);
      reload();
    } catch (err) {
      setErrors(err.response?.data?.fieldErrors || {});
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="🧠 Skill Profiles"
        subtitle={
          isDeveloper
            ? 'Show clients what you are good at, and see other developers.'
            : 'Find developers by name or skill.'
        }
      />

      {loading && !data && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data?.unsupported && (
        <div className="card">
          <EmptyState
            icon="🛠️"
            title="Skill profiles need a backend update"
            text="Your auth-service does not have the profile endpoints yet."
          />
        </div>
      )}

      {data && !data.unsupported && isDeveloper && me && (
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 className="section-title" style={{ margin: 0 }}>
                My profile
              </h3>
              <span
                className="small"
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                }}
              >
                {completeness.percent}% complete
              </span>
            </div>
            {!editing && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={startEdit}>
                Edit profile
              </button>
            )}
          </div>

          {/* Profile Completeness Progress Bar */}
          {!editing && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 999,
                  background: 'rgba(148, 163, 184, 0.18)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${completeness.percent}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: 'var(--primary, #38bdf8)',
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>
              {completeness.missing.length > 0 && (
                <div className="small muted" style={{ marginTop: 6 }}>
                  Tip — add {completeness.missing.slice(0, 3).join(', ')} to reach 100%.
                </div>
              )}
            </div>
          )}

          {!editing ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                {me.avatarUrl ? (
                  <img
                    src={me.avatarUrl}
                    alt={me.name}
                    style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="avatar"
                    style={{
                      width: 64,
                      height: 64,
                      fontSize: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {me.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{me.name}</div>
                  <div className="muted">
                    {me.headline || 'Add a headline so clients know what you do'}
                  </div>
                </div>
              </div>

              {me.education && (
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                  🎓 <strong>Education:</strong> {me.education}
                </div>
              )}
              {me.experience && (
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                  💼 <strong>Experience:</strong> {me.experience}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: 10 }}>
                {me.portfolioUrl && (
                  <div style={{ fontSize: 13 }}>
                    🌐{' '}
                    <a
                      href={me.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--primary)' }}
                    >
                      Portfolio / GitHub
                    </a>
                  </div>
                )}
                {me.linkedinUrl && (
                  <div style={{ fontSize: 13 }}>
                    🔗{' '}
                    <a
                      href={me.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--primary)' }}
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>

              <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 14 }}>
                {me.bio || 'Add a short bio.'}
              </p>
              <SkillChips skills={me.skills} />
            </>
          ) : (
            <form onSubmit={save} noValidate>
              <div className="field">
                <label className="label" htmlFor="sp-avatar">
                  Profile Picture
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {form.avatarUrl && (
                    <img
                      src={form.avatarUrl}
                      alt="Preview"
                      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  )}
                  <input
                    type="file"
                    id="sp-avatar"
                    accept="image/*"
                    className="input"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="sp-headline">
                  Headline
                </label>
                <input
                  id="sp-headline"
                  className={`input ${errors.headline ? 'invalid' : ''}`}
                  value={form.headline}
                  maxLength={100}
                  onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                  placeholder="e.g. Full-stack developer (Java + React)"
                />
                {errors.headline && <span className="field-error">{errors.headline}</span>}
              </div>
              <div className="field">
                <label className="label" htmlFor="sp-education">
                  Degree / Education
                </label>
                <input
                  id="sp-education"
                  className="input"
                  value={form.education}
                  maxLength={150}
                  onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))}
                  placeholder="e.g. B.Tech in Computer Science"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="sp-experience">
                  Experience / Work History
                </label>
                <input
                  id="sp-experience"
                  className="input"
                  value={form.experience}
                  maxLength={150}
                  onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                  placeholder="e.g. 2 Years Full-stack Experience"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="sp-portfolio">
                  Portfolio / GitHub URL
                </label>
                <input
                  id="sp-portfolio"
                  className="input"
                  value={form.portfolioUrl}
                  onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))}
                  placeholder="https://github.com/username"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="sp-linkedin">
                  LinkedIn Profile URL
                </label>
                <input
                  id="sp-linkedin"
                  className="input"
                  value={form.linkedinUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                  placeholder="https://www.linkedin.com/in/username"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="sp-bio">
                  Bio
                </label>
                <textarea
                  id="sp-bio"
                  className={`textarea ${errors.bio ? 'invalid' : ''}`}
                  value={form.bio}
                  maxLength={500}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="A few lines about your experience."
                />
                {errors.bio && <span className="field-error">{errors.bio}</span>}
              </div>
              <div className="field">
                <label className="label" htmlFor="sp-skills">
                  Skills
                </label>
                <SkillsInput
                  id="sp-skills"
                  value={form.skills}
                  onChange={(skills) => setForm((f) => ({ ...f, skills }))}
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {data && !data.unsupported && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 className="section-title" style={{ margin: 0, marginRight: 6 }}>
                Developers ({developers.length})
              </h3>
              {QUICK_SKILL_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`btn btn-sm ${skillFilter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setSkillFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <input
              className="input"
              style={{ maxWidth: 320 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or skill"
              aria-label="Search developers"
            />
          </div>

          {developers.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="🧠"
                title={data.developers.length === 0 ? 'No developers yet' : 'No match'}
                text={
                  data.developers.length === 0
                    ? 'Developers appear here after they register.'
                    : 'Try a different name, skill, or filter.'
                }
              />
            </div>
          ) : (
            <div className="dev-grid">
              {developers.map((d) => (
                <article
                  key={d.id}
                  className="card dev-card"
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setInspectedDev(d)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setInspectedDev(d);
                    }
                  }}
                >
                  <div
                    className="dev-top"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}
                  >
                    {d.avatarUrl ? (
                      <img
                        src={d.avatarUrl}
                        alt={d.name}
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="avatar"
                        aria-hidden="true"
                        style={{
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0 }}>
                        {d.name}
                        {d.id === user.userId && (
                          <span className="badge badge-sky" style={{ marginLeft: 8 }}>
                            You
                          </span>
                        )}
                      </h3>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {d.headline || 'Developer'}
                      </div>
                    </div>
                  </div>
                  {d.education && (
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>
                      🎓 {d.education}
                    </div>
                  )}
                  {d.experience && (
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>
                      💼 {d.experience}
                    </div>
                  )}

                  <div
                    style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: 6 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {d.portfolioUrl && (
                      <div style={{ fontSize: 12 }}>
                        🌐{' '}
                        <a
                          href={d.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--primary)' }}
                        >
                          Portfolio
                        </a>
                      </div>
                    )}
                    {d.linkedinUrl && (
                      <div style={{ fontSize: 12 }}>
                        🔗{' '}
                        <a
                          href={d.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--primary)' }}
                        >
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>

                  {d.bio && <p className="desc">{d.bio}</p>}
                  <SkillChips skills={d.skills} />
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Developer Detail Preview Modal */}
      {inspectedDev && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setInspectedDev(null)}
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
        >
          <div
            className="card modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {inspectedDev.avatarUrl ? (
                  <img
                    src={inspectedDev.avatarUrl}
                    alt={inspectedDev.name}
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="avatar"
                    style={{
                      width: 56,
                      height: 56,
                      fontSize: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {inspectedDev.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>
                    {inspectedDev.name}
                    {inspectedDev.id === user.userId && (
                      <span className="badge badge-sky" style={{ marginLeft: 8 }}>
                        You
                      </span>
                    )}
                  </h2>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {inspectedDev.headline || 'Developer'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setInspectedDev(null)}
                aria-label="Close developer modal"
              >
                ✕
              </button>
            </div>

            {inspectedDev.education && (
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                🎓 <strong>Education:</strong> {inspectedDev.education}
              </div>
            )}
            {inspectedDev.experience && (
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>
                💼 <strong>Experience:</strong> {inspectedDev.experience}
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
              {inspectedDev.portfolioUrl && (
                <a
                  href={inspectedDev.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: 'var(--primary)' }}
                >
                  🌐 Portfolio / GitHub
                </a>
              )}
              {inspectedDev.linkedinUrl && (
                <a
                  href={inspectedDev.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: 'var(--primary)' }}
                >
                  🔗 LinkedIn Profile
                </a>
              )}
            </div>

            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 14, whiteSpace: 'pre-line' }}>
              {inspectedDev.bio || 'No bio added yet.'}
            </p>

            <div style={{ marginBottom: 18 }}>
              <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
                Skills
              </div>
              <SkillChips skills={inspectedDev.skills} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setInspectedDev(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}