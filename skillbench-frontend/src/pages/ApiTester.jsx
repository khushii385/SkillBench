import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import api, { GATEWAY_URL } from '../services/api';

const PRESETS = [
  { label: 'GET open projects', method: 'GET', url: '/api/projects' },
  { label: 'GET my projects', method: 'GET', url: '/api/projects/my-projects' },
  { label: 'GET my escrows', method: 'GET', url: '/api/escrows/my' },
  {
    label: 'POST create project',
    method: 'POST',
    url: '/api/projects',
    body: { title: 'Sample project', description: 'Created from the API tester', budget: 1000, deadline: '' },
  },
];

function formatBytes(n) {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

// Sends real requests to the gateway with your current token attached
export default function ApiTester() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('/api/projects');
  const [body, setBody] = useState('');
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  const usePreset = (p) => {
    setMethod(p.method);
    setUrl(p.url);
    setBody(p.body ? JSON.stringify(p.body, null, 2) : '');
    setResult(null);
  };

  const send = async () => {
    let data;
    if (body.trim() && method !== 'GET') {
      try {
        data = JSON.parse(body);
      } catch {
        setResult({ error: 'The request body is not valid JSON.' });
        return;
      }
    }
    setSending(true);
    setResult(null);
    const started = performance.now();
    try {
      const res = await api.request({
        baseURL: GATEWAY_URL,
        url,
        method,
        data,
        validateStatus: () => true, // show 4xx / 5xx responses instead of throwing
      });
      const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
      setResult({ status: res.status, statusText: res.statusText, ms: Math.round(performance.now() - started), size: new Blob([text || '']).size, text: text || '(empty response)' });
    } catch {
      setResult({ error: `Could not reach ${GATEWAY_URL}. Make sure the API gateway is running.` });
    } finally {
      setSending(false);
    }
  };

  const ok = result?.status >= 200 && result?.status < 300;

  return (
    <div className="page">
      <PageHeader title="🧪 API Tester" subtitle="Send requests to the gateway. Your login token is attached automatically." />

      <div className="chips" aria-label="Quick requests">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="chip" onClick={() => usePreset(p)}>{p.label}</button>
        ))}
      </div>

      <div className="chart-grid" style={{ alignItems: 'start' }}>
        <div className="card card-pad">
          <h3 className="section-title" style={{ color: 'var(--sky)' }}>Request</h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <select className="select" style={{ width: 120 }} value={method} onChange={(e) => setMethod(e.target.value)} aria-label="HTTP method">
              {['GET', 'POST', 'PUT', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
            </select>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Endpoint path" placeholder="/api/projects" />
          </div>
          <p className="field-hint" style={{ marginBottom: 14 }}>Sent to {GATEWAY_URL}{url}</p>

          {method !== 'GET' && (
            <div className="field">
              <label className="label" htmlFor="tester-body">JSON body</label>
              <textarea id="tester-body" className="textarea code" style={{ minHeight: 180 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder='{ "key": "value" }' spellCheck={false} />
            </div>
          )}

          <button type="button" className="btn btn-primary" onClick={send} disabled={sending || !url.trim()}>
            {sending ? 'Sending…' : 'Send request'}
          </button>
        </div>

        <div className="card card-pad">
          <h3 className="section-title" style={{ color: 'var(--sky)' }}>Response</h3>
          {!result && <p className="muted" style={{ fontSize: 14 }}>{sending ? 'Waiting for the server…' : 'Send a request to see the response here.'}</p>}
          {result?.error && <div className="alert alert-error">{result.error}</div>}
          {result?.status && (
            <>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <span className={`badge ${ok ? 'badge-green' : 'badge-red'}`}>{result.status} {result.statusText}</span>
                <span className="muted" style={{ fontSize: 13 }}>{result.ms} ms · {formatBytes(result.size)}</span>
              </div>
              <pre className="code">{result.text}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
