export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="card page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
