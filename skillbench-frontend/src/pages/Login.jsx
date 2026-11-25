import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { authApi, getErrorMessage } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login({ email: email.trim(), password });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not sign in. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <>
      <h2>Welcome back</h2>
      <p className="sub">Sign in to manage your projects and payments.</p>

      {params.get('expired') && !error && (
        <div className="alert alert-info">Your session expired. Please sign in again.</div>
      )}
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label" htmlFor="email">Email address</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: 14 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">
        New to SkillBench? <Link to="/register">Create an account</Link>
      </p>
    </>
  );

  return (
    <AuthShell
      title="Hire with confidence."
      titleAccent="Get paid on time."
      subtitle="Projects, developers and escrow payments in one place. Sign in to pick up where you left off."
      card={card}
    />
  );
}
