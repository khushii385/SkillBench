import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { authApi, getErrorMessage } from '../services/api';

const ROLES = [
  { value: 'CLIENT_ADMIN', title: 'Client', text: 'I post projects and hire developers' },
  { value: 'VENDOR_DEVELOPER', title: 'Developer', text: 'I take projects and get paid' },
];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CLIENT_ADMIN' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const local = {};
    if (form.name.trim().length < 2) local.name = 'Name must be at least 2 characters';
    if (form.password.length < 8) local.password = 'Password must be at least 8 characters';
    setErrors(local);
    if (Object.keys(local).length) return;

    setLoading(true);
    try {
      const { data } = await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your account. Please try again.'));
      setErrors(err.response?.data?.fieldErrors || {});
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <>
      <h2>Create your account</h2>
      <p className="sub">It takes less than a minute.</p>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <span className="label" id="role-label">I am a</span>
          <div className="role-pick" role="radiogroup" aria-labelledby="role-label">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={form.role === r.value}
                className={`role-opt ${form.role === r.value ? 'on' : ''}`}
                onClick={() => setForm((f) => ({ ...f, role: r.value }))}
              >
                <strong>{r.title}</strong>
                <span>{r.text}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className={`input ${errors.name ? 'invalid' : ''}`} value={form.name} onChange={set('name')} placeholder="Your name" autoComplete="name" required />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="reg-email">Email address</label>
          <input id="reg-email" type="email" className={`input ${errors.email ? 'invalid' : ''}`} value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" required />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="reg-password">Password</label>
          <input id="reg-password" type="password" className={`input ${errors.password ? 'invalid' : ''}`} value={form.password} onChange={set('password')} placeholder="At least 8 characters" autoComplete="new-password" required />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: 14 }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </>
  );

  return (
    <AuthShell
      title="Start with a project."
      titleAccent="Pay when it's done."
      subtitle="Clients fund an escrow, developers see the payment is secured, and money moves only when the work is approved."
      card={card}
    />
  );
}
