import { useState } from 'react';

const MAX_SKILLS = 15;

// Type a skill and press Enter (or comma) to add it. Click × on a chip to remove it.
export default function SkillsInput({ value, onChange, id }) {
  const [draft, setDraft] = useState('');

  const add = (raw) => {
    const skill = raw.replace(/,/g, ' ').trim().replace(/\s+/g, ' ').slice(0, 30);
    if (!skill) return;
    const exists = value.some((s) => s.toLowerCase() === skill.toLowerCase());
    if (!exists && value.length < MAX_SKILLS) onChange([...value, skill]);
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      {value.length > 0 && (
        <div className="skill-list" style={{ marginBottom: 10 }}>
          {value.map((skill) => (
            <span key={skill} className="skill-chip">
              {skill}
              <button type="button" onClick={() => onChange(value.filter((s) => s !== skill))} aria-label={`Remove ${skill}`}>×</button>
            </span>
          ))}
        </div>
      )}
      <input
        id={id}
        className="input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => add(draft)}
        maxLength={30}
        disabled={value.length >= MAX_SKILLS}
        placeholder={value.length >= MAX_SKILLS ? 'Maximum 15 skills' : 'Type a skill and press Enter (e.g. Spring Boot)'}
      />
      <span className="field-hint">{value.length}/{MAX_SKILLS} skills</span>
    </div>
  );
}
