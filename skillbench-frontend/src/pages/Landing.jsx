import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BackgroundFX from '../components/BackgroundFX';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

// ---------- The one animated moment: money moving through an escrow ----------
function EscrowFlow() {
  return (
    <div className="flow" role="img" aria-label="Animation: the client funds the escrow, the escrow holds the payment, then releases it to the developer.">
      <div className="flow-track" />
      <div className="flow-coin" />

      <div className="flow-node n-client">
        <div className="flow-icon">👤</div>
        <span>Client</span>
      </div>
      <div className="flow-node n-escrow">
        <div className="flow-icon">🔒</div>
        <span>Escrow</span>
      </div>
      <div className="flow-node n-dev">
        <div className="flow-icon">💻</div>
        <span>Developer</span>
      </div>

      <div className="flow-status">
        <span className="chip-a">Project posted, waiting for funds</span>
        <span className="chip-b">Payment held in escrow</span>
        <span className="chip-c">Client approves the work</span>
        <span className="chip-d">Payment released to developer</span>
      </div>
    </div>
  );
}

// Lights up a step once it scrolls into view
function useInView() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

function Step({ number, title, text }) {
  const [ref, seen] = useInView();
  return (
    <li ref={ref} className={`step ${seen ? 'on' : ''}`}>
      <div className="step-dot">{number}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </li>
  );
}

const STEPS = [
  { title: 'Post a project', text: 'The client sets a title, a budget and an optional deadline. Developers can see it straight away.' },
  { title: 'A developer accepts', text: 'One developer takes the project and it moves to In progress.' },
  { title: 'Fund the escrow', text: 'The client puts the project budget into escrow. The developer can see the payment is secured before doing the work.' },
  { title: 'Submit and review the work', text: 'The developer hands in the work. The client approves it, or asks for changes with feedback.' },
  { title: 'Release or refund', text: 'Once the work is approved the client releases the payment and the project is marked completed. If it does not work out, the client can refund instead.' },
];

const CLIENT_POINTS = [
  'Post projects with a budget and deadline',
  'Browse developers by skill before you decide',
  'Approve submitted work before any money moves',
  'Hold the payment in escrow, then release or refund it',
  'See spending and project activity in Analytics',
];
const DEV_POINTS = [
  'Browse open projects and accept the ones you want',
  'Build a skill profile so clients can find you',
  'See that the payment is secured before you start',
  'Submit work and get clear feedback from the client',
  'Track what you have earned and what is still in escrow',
];

// ---------- How the system is built (matches the real backend) ----------
function Architecture() {
  return (
    <svg className="arch" viewBox="0 0 800 300" role="img" aria-label="Architecture: React app calls the API gateway, which checks the JWT and routes to the auth, project and escrow services, all backed by MySQL.">
      <g className="arch-lines">
        <path d="M150 150 H230" />
        <path d="M390 150 C445 150 445 50 500 50" />
        <path d="M390 150 H500" />
        <path d="M390 150 C445 150 445 250 500 250" />
        <path d="M650 50 C675 50 675 150 700 150" />
        <path d="M650 150 H700" />
        <path d="M650 250 C675 250 675 150 700 150" />
      </g>
      <g className="arch-box">
        <rect x="20" y="115" width="130" height="70" rx="14" />
        <rect x="230" y="105" width="160" height="90" rx="14" className="hot" />
        <rect x="500" y="20" width="150" height="60" rx="12" />
        <rect x="500" y="120" width="150" height="60" rx="12" />
        <rect x="500" y="220" width="150" height="60" rx="12" />
        <rect x="700" y="115" width="80" height="70" rx="14" />
      </g>
      <g className="arch-text">
        <text x="85" y="145" textAnchor="middle" className="t1">React app</text>
        <text x="85" y="166" textAnchor="middle" className="t2">:5173</text>
        <text x="310" y="145" textAnchor="middle" className="t1">API Gateway</text>
        <text x="310" y="166" textAnchor="middle" className="t2">checks the JWT</text>
        <text x="310" y="183" textAnchor="middle" className="t2">:8080</text>
        <text x="575" y="46" textAnchor="middle" className="t1">Auth service</text>
        <text x="575" y="65" textAnchor="middle" className="t2">:8081</text>
        <text x="575" y="146" textAnchor="middle" className="t1">Project service</text>
        <text x="575" y="165" textAnchor="middle" className="t2">:8082</text>
        <text x="575" y="246" textAnchor="middle" className="t1">Escrow service</text>
        <text x="575" y="265" textAnchor="middle" className="t2">:8083</text>
        <text x="740" y="155" textAnchor="middle" className="t1">MySQL</text>
        <text x="740" y="175" textAnchor="middle" className="t2">skillbench</text>
      </g>
    </svg>
  );
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="lp">
      <header className="lp-nav">
        <Link to="/" className="brand" style={{ margin: 0 }}>⚡ SkillBench</Link>
        <nav className="lp-links" aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#built">How it is built</a>
        </nav>
        <div className="lp-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>
      </header>

      <section className="lp-hero">
        <BackgroundFX />
        <div className="lp-hero-copy">
          <span className="pill rise" style={{ '--i': 0 }}>Escrow-protected hiring</span>
          <h1>
            <span className="rise" style={{ '--i': 1 }}>Pay for the work,</span>
            <span className="rise grad-text" style={{ '--i': 2 }}>not the promise.</span>
          </h1>
          <p className="rise" style={{ '--i': 3 }}>
            SkillBench holds the client&apos;s payment in escrow while a developer does the work. Developers know the money is there. Clients decide when it is released.
          </p>
          <div className="lp-cta-row rise" style={{ '--i': 4 }}>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary" style={{ padding: '14px 24px' }}>Go to dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary" style={{ padding: '14px 24px' }}>Create a free account</Link>
                <Link to="/login" className="btn btn-ghost" style={{ padding: '14px 24px' }}>Sign in</Link>
              </>
            )}
          </div>
        </div>
        <div className="lp-hero-art rise" style={{ '--i': 3 }}>
          <EscrowFlow />
        </div>
      </section>

      <section id="how" className="lp-section">
        <div className="lp-head">
          <h2>From first post to final payment</h2>
          <p>Five steps. The money only moves when the client has approved the work.</p>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => <Step key={s.title} number={i + 1} {...s} />)}
        </ol>
      </section>

      <section id="features" className="lp-section">
        <div className="lp-head">
          <h2>Built for both sides of the table</h2>
        </div>
        <div className="lp-two">
          <div className="card card-pad">
            <h3>If you hire</h3>
            <ul className="ticks">{CLIENT_POINTS.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div className="card card-pad">
            <h3>If you build</h3>
            <ul className="ticks">{DEV_POINTS.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
      </section>

      <section id="built" className="lp-section">
        <div className="lp-head">
          <h2>Real microservices underneath</h2>
          <p>Every request goes through one gateway that checks your login token, then reaches the service that owns that job.</p>
        </div>
        <div className="card card-pad"><Architecture /></div>
      </section>

      <section className="lp-final">
        <h2>Ready to try it?</h2>
        <p>Create an account as a client or a developer and run a project end to end.</p>
        <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary" style={{ padding: '14px 28px' }}>
          {user ? 'Go to dashboard' : 'Create your account'}
        </Link>
      </section>

      <footer className="lp-foot">
        <span>⚡ SkillBench</span>
        <span className="muted">© 2026 SkillBench</span>
      </footer>
    </div>
  );
}
