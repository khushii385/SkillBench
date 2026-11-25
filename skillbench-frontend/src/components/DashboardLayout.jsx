import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleLabel } from '../utils/format';

const COMMON_TAIL = [
  { to: '/dashboard/submissions', label: 'Submissions', icon: '📤' },
  { to: '/dashboard/skills', label: 'Skill Profiles', icon: '🧠' },
  { to: '/dashboard/wallet', icon: '💳' },
  { to: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { to: '/dashboard/api-tester', label: 'API Tester', icon: '🧪' },
  { to: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

function navFor(role) {
  const dashboard = { to: '/dashboard', label: 'Dashboard', icon: '📊', end: true };
  if (role === 'CLIENT_ADMIN') {
    return [
      dashboard,
      { to: '/dashboard/projects', label: 'My Projects', icon: '📁' },
      ...COMMON_TAIL.map((i) => (i.to.endsWith('wallet') ? { ...i, label: 'Escrow & Payments' } : i)),
    ];
  }
  return [
    dashboard,
    { to: '/dashboard/find-work', label: 'Find Projects', icon: '🔎' },
    { to: '/dashboard/tasks', label: 'My Assigned Tasks', icon: '📋' },
    ...COMMON_TAIL.map((i) => (i.to.endsWith('wallet') ? { ...i, label: 'Wallet & Earnings' } : i)),
  ];
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div>
          <NavLink to="/" className="brand">⚡ SkillBench</NavLink>
          <nav className="nav" aria-label="Main">
            {navFor(user.role).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-user">
          <div className="who">Signed in as {roleLabel(user.role)}</div>
          <div className="email">{user.email}</div>
          <button type="button" className="btn btn-danger btn-sm btn-block" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <div className="main">
        <div className="mobile-bar">
          <span className="brand" style={{ margin: 0 }}>⚡ SkillBench</span>
          <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
