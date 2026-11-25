const BUBBLES = [
  { left: '8%', size: 34, duration: 14, delay: 0 },
  { left: '22%', size: 20, duration: 18, delay: 3 },
  { left: '38%', size: 46, duration: 22, delay: 1 },
  { left: '58%', size: 24, duration: 16, delay: 5 },
  { left: '74%', size: 38, duration: 20, delay: 2 },
  { left: '90%', size: 28, duration: 17, delay: 6 },
];

export default function BackgroundFX() {
  return (
    <div className="bg-fx" aria-hidden="true">
      <div className="glow-bg-1" />
      <div className="glow-bg-2" />
      {BUBBLES.map((b) => (
        <div
          key={b.left}
          className="floating-balloon"
          style={{ left: b.left, width: b.size, height: b.size, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s` }}
        />
      ))}
    </div>
  );
}
