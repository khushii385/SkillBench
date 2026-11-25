import { Link } from 'react-router-dom';
import BackgroundFX from './BackgroundFX';

export default function AuthShell({ title, titleAccent, subtitle, card }) {
  return (
    <div className="auth">
      <BackgroundFX />
      <div className="auth-copy">
        <Link to="/" className="back">← Back to home</Link>
        <div><span className="pill">⚡ SkillBench</span></div>
        <h1>
          {title}
          <br />
          <span className="grad-text">{titleAccent}</span>
        </h1>
        <p>{subtitle}</p>
      </div>
      <div className="auth-card">{card}</div>
    </div>
  );
}
