export default function ErrorState({ message, onRetry }) {
  return (
    <div className="card card-pad" style={{ textAlign: 'center' }}>
      <div className="alert alert-error" style={{ display: 'inline-block', marginBottom: 14 }}>{message}</div>
      {onRetry && (
        <div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>Try again</button>
        </div>
      )}
    </div>
  );
}
