import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorState from '../components/ErrorState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useApi from '../hooks/useApi';
import { getErrorMessage, profileApi } from '../services/api';
import { formatDateTime, roleLabel } from '../utils/format';

export default function Settings() {
  const { user, expiresAt, logout, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const { data: loaded, loading, error, reload } = useApi(async () => {
    const res = await profileApi.me();
    return { me: res.data, unsupported: Boolean(res.unsupported) };
  });
  // Old backend without /auth/me: show what we already know from the login
  const unsupported = loaded?.unsupported ?? false;
  const me = unsupported
    ? { userId: user.userId, name: user.name, email: user.email, role: user.role, headline: null, bio: null, skills: [] }
    : loaded?.me;

  const [name, setName] = useState(null);          // null = not edited yet, show the saved name
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const shownName = name ?? me?.name ?? user.name;

  const saveName = async (e) => {
    e.preventDefault();
    setNameError('');
    if (shownName.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    setSavingName(true);
    try {
      // The profile endpoint replaces the whole profile, so send the other fields back unchanged
      const { data } = await profileApi.update({ name: shownName.trim(), headline: me.headline, bio: me.bio, skills: me.skills });
      updateUser({ name: data.name });
      setName(null);
      toast.success('Name updated.');
      reload();
    } catch (err) {
      setNameError(getErrorMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pw.next.length < 8) return setPwError('New password must be at least 8 characters');
    if (pw.next !== pw.confirm) return setPwError('The new passwords do not match');
    setSavingPw(true);
    try {
      await profileApi.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      toast.success('Password changed.');
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page">
      <PageHeader title="⚙️ Settings" subtitle="Your account and sign-in details." />

      {loading && !loaded && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {me && (
        <div style={{ display: 'grid', gap: 20, maxWidth: 680 }}>
          <div className="card card-pad">
            <h3 className="section-title">Account</h3>
            <div className="kv" style={{ marginBottom: 18 }}>
              <div className="k">Email</div><div className="v">{me.email}</div>
              <div className="k">Role</div><div className="v">{roleLabel(me.role)}</div>
              <div className="k">User ID</div><div className="v">#{me.userId}</div>
              <div className="k">Session expires</div><div className="v">{formatDateTime(expiresAt)}</div>
            </div>

            {!unsupported && <form onSubmit={saveName} noValidate>
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="label" htmlFor="st-name">Display name</label>
                <input id="st-name" className={`input ${nameError ? 'invalid' : ''}`} value={shownName} onChange={(e) => setName(e.target.value)} maxLength={100} />
                {nameError && <span className="field-error">{nameError}</span>}
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={savingName || shownName.trim() === me.name}>{savingName ? 'Saving…' : 'Save name'}</button>
            </form>}
          </div>

          {!unsupported && <div className="card card-pad">
            <h3 className="section-title">Change password</h3>
            {pwError && <div className="alert alert-error">{pwError}</div>}
            <form onSubmit={savePassword} noValidate>
              <div className="field">
                <label className="label" htmlFor="pw-current">Current password</label>
                <input id="pw-current" type="password" className="input" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
              </div>
              <div className="row-2">
                <div className="field">
                  <label className="label" htmlFor="pw-next">New password</label>
                  <input id="pw-next" type="password" className="input" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="At least 8 characters" />
                </div>
                <div className="field">
                  <label className="label" htmlFor="pw-confirm">Confirm new password</label>
                  <input id="pw-confirm" type="password" className="input" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={savingPw || !pw.current || !pw.next}>{savingPw ? 'Saving…' : 'Change password'}</button>
            </form>
          </div>}

          <div className="card card-pad">
            <h3 className="section-title">Session</h3>
            <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>Signing out removes your session from this browser.</p>
            <button type="button" className="btn btn-danger" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}
