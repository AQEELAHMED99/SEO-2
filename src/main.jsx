import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, BadgeCheck, Check,
  ChevronDown, ChevronUp, CircleAlert, CircleCheck, Clock3, Code2, ExternalLink,
  Gauge, Globe2, Image, Info, LoaderCircle, LockKeyhole, Menu, Monitor,
  RotateCw, Search, Server, Settings2, ShieldCheck, Smartphone, Sparkles,
  WandSparkles, X, Zap,
} from 'lucide-react';
import './styles.css';

const sample = {
  url: 'https://northstarstudio.com',
  mobile: { score: 78, metrics: { lcp: '2.6 s', fcp: '1.3 s', cls: '0.04', tbt: '180 ms', si: '3.1 s', tti: '4.2 s' } },
  desktop: { score: 96, metrics: { lcp: '1.1 s', fcp: '0.7 s', cls: '0.01', tbt: '40 ms', si: '1.0 s', tti: '1.4 s' } },
  categories: [
    { title: 'Caching & compression', icon: Server, tint: 'blue', rows: [
      { title: 'Use efficient cache lifetimes', description: 'Serve static assets with a longer cache policy.', status: 'fail', tutorial: true },
      { title: 'Enable text compression', description: 'Text resources are served with Brotli compression.', status: 'pass', tutorial: true },
    ] },
    { title: 'CSS optimization', icon: Code2, tint: 'violet', rows: [
      { title: 'Minify CSS', description: 'Your stylesheets are minified.', status: 'pass', tutorial: true },
      { title: 'Remove unused CSS', description: 'Potential savings of 24 KiB.', status: 'pass', tutorial: true },
      { title: 'Eliminate render-blocking resources', description: 'Potential savings of 340 ms.', status: 'warn', tutorial: true },
    ] },
    { title: 'Image delivery', icon: Image, tint: 'orange', rows: [
      { title: 'Serve images in next-gen formats', description: 'Potential savings of 186 KiB.', status: 'fail', tutorial: true },
      { title: 'Properly size images', description: 'Image dimensions are close to their rendered size.', status: 'pass', tutorial: true },
    ] },
    { title: 'Best practices & SEO', icon: ShieldCheck, tint: 'green', rows: [
      { title: 'Use HTTPS', description: 'The page is served securely over HTTPS.', status: 'pass', tutorial: false },
      { title: 'Document has a meta description', description: 'A concise summary is available for search results.', status: 'pass', tutorial: false },
    ] },
  ],
};

const auditGroups = [
  { title: 'Caching & compression', icon: Server, tint: 'blue', ids: ['uses-long-cache-ttl', 'uses-text-compression'] },
  { title: 'CSS optimization', icon: Code2, tint: 'violet', ids: ['unminified-css', 'unused-css-rules', 'render-blocking-resources'] },
  { title: 'Image delivery', icon: Image, tint: 'orange', ids: ['modern-image-formats', 'uses-optimized-images', 'uses-responsive-images', 'unsized-images'] },
  { title: 'JavaScript', icon: Activity, tint: 'pink', ids: ['unminified-javascript', 'unused-javascript', 'legacy-javascript', 'bootup-time'] },
  { title: 'Best practices & SEO', icon: ShieldCheck, tint: 'green', ids: ['is-on-https', 'viewport', 'meta-description', 'document-title', 'link-text'] },
];

function scoreTone(score) {
  if (score >= 90) return 'good';
  if (score >= 50) return 'needs-work';
  return 'poor';
}

function normalizeMetric(value, unit) {
  if (value === undefined || value === null) return '—';
  if (unit === 'ms') return `${Math.round(value)} ms`;
  if (unit === 's') return `${(value / 1000).toFixed(1)} s`;
  if (unit === 'cls') return Number(value).toFixed(2);
  return String(value);
}

function parseResult(payload, url, strategy) {
  const lighthouse = payload.lighthouseResult;
  const score = Math.round((lighthouse?.categories?.performance?.score ?? 0) * 100);
  const categories = lighthouse?.categories || {};
  const audits = lighthouse?.audits || {};
  const metrics = {
    lcp: audits['largest-contentful-paint']?.numericValue,
    fcp: audits['first-contentful-paint']?.numericValue,
    cls: audits['cumulative-layout-shift']?.numericValue,
    tbt: audits['total-blocking-time']?.numericValue,
    si: audits['speed-index']?.numericValue,
    tti: audits['interactive']?.numericValue,
  };
  const groups = auditGroups.map((group) => ({
    ...group,
    rows: group.ids
      .map((id) => audits[id])
      .filter((audit) => audit && audit.scoreDisplayMode !== 'notApplicable' && audit.scoreDisplayMode !== 'manual')
      .map((audit) => ({
        title: audit.title,
        description: audit.displayValue || audit.description?.replace(/\[.*?\]\(.*?\)/g, '').slice(0, 170) || 'Review this recommendation to improve your page.',
        status: audit.score === null ? 'info' : audit.score >= 0.9 ? 'pass' : audit.score >= 0.5 ? 'warn' : 'fail',
        tutorial: true,
      })),
  })).filter((group) => group.rows.length);
  const categoryScore = (name) => categories[name]?.score == null ? '—' : Math.round(categories[name].score * 100);
  return {
    url, score, metrics, categories: groups, strategy,
    accessibility: categoryScore('accessibility'),
    bestPractices: categoryScore('best-practices'),
    seo: categoryScore('seo'),
    field: payload.loadingExperience || payload.originLoadingExperience || null,
  };
}

async function runPageSpeed(url, strategy, apiKey) {
  const query = new URLSearchParams({ url, strategy, category: 'PERFORMANCE' });
  ['ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'].forEach((category) => query.append('category', category));
  if (apiKey) query.set('key', apiKey);
  const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${query}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `PageSpeed Insights returned an error (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return parseResult(payload, url, strategy);
}

function ScoreRing({ score, size = 'large' }) {
  const tone = scoreTone(score);
  return <div className={`score-ring ${tone} ${size}`} style={{ '--score': `${score * 3.6}deg` }} aria-label={`Performance score ${score}`}>
    <div className="score-ring-inner"><strong>{score}</strong><span>Performance</span></div>
  </div>;
}

function MetricCard({ code, title, value, status }) {
  const label = status === 'good' ? 'Good' : status === 'needs-improvement' ? 'Needs improvement' : status === 'poor' ? 'Poor' : 'Lab data';
  return <div className="metric-card">
    <div className="metric-top"><span className="metric-code">{code}</span><span className={`metric-dot ${status || 'neutral'}`} title={label} /></div>
    <strong className="metric-value">{value}</strong>
    <span className="metric-title">{title}</span>
  </div>;
}

function metricStatus(code, value) {
  if (value === '—') return 'neutral';
  const numeric = parseFloat(value);
  const good = { LCP: 2.5, FCP: 1.8, CLS: 0.1, TBT: 200, TTI: 3.8, SI: 3.4 }[code];
  const poor = { LCP: 4, FCP: 3, CLS: 0.25, TBT: 600, TTI: 7.3, SI: 5.8 }[code];
  if (numeric <= good) return 'good';
  if (numeric <= poor) return 'needs-improvement';
  return 'poor';
}

function getMetricCards(metrics) {
  const defs = [
    ['LCP', 'Largest Contentful Paint', metrics.lcp, 's'], ['FCP', 'First Contentful Paint', metrics.fcp, 's'],
    ['CLS', 'Cumulative Layout Shift', metrics.cls, 'cls'], ['TBT', 'Total Blocking Time', metrics.tbt, 'ms'],
    ['TTI', 'Time to Interactive', metrics.tti, 's'], ['SI', 'Speed Index', metrics.si, 's'],
  ];
  return defs.map(([code, title, value, unit]) => {
    const formatted = value === undefined ? '—' : normalizeMetric(value, unit);
    return { code, title, value: formatted, status: metricStatus(code, formatted) };
  });
}

function StatusIcon({ status }) {
  if (status === 'pass') return <span className="audit-status pass"><CircleCheck size={18} strokeWidth={2.2} /></span>;
  if (status === 'warn') return <span className="audit-status warn"><Info size={17} strokeWidth={2.1} /></span>;
  if (status === 'info') return <span className="audit-status info"><Info size={17} strokeWidth={2.1} /></span>;
  return <span className="audit-status fail"><X size={18} strokeWidth={2.5} /></span>;
}

function AuditGroup({ group }) {
  const [open, setOpen] = useState(true);
  const Icon = group.icon;
  const passed = group.rows.filter((r) => r.status === 'pass').length;
  const count = group.rows.length;
  const progress = count ? (passed / count) * 100 : 0;
  return <section className="audit-group">
    <button className={`audit-group-head ${group.tint}`} onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="audit-group-icon"><Icon size={18} /></span>
      <span className="audit-group-name">{group.title}</span>
      <span className="audit-group-progress"><span>{passed}/{count} passed</span><span className="progress-track"><i style={{ width: `${progress}%` }} /></span></span>
      {open ? <ChevronUp size={17} className="chevron" /> : <ChevronDown size={17} className="chevron" />}
    </button>
    {open && <div className="audit-rows">{group.rows.map((row, index) => <div className={`audit-row ${row.status}`} key={`${row.title}-${index}`}>
      <StatusIcon status={row.status} />
      <div className="audit-copy"><div className="audit-title-line"><strong>{row.title}</strong>{row.tutorial && <a className="tutorial-link" href="https://web.dev/explore/learn-core-web-vitals" target="_blank" rel="noreferrer">↗ Learn more</a>}</div>
        <p>{row.description}</p></div>
      <span className={`result-pill ${row.status}`}>{row.status === 'pass' ? <><Check size={13} /> Passed</> : row.status === 'warn' ? 'Review' : row.status === 'info' ? 'Info' : <><X size={13} /> Fix</>}</span>
    </div>)}</div>}
  </section>;
}

function App() {
  const [url, setUrl] = useState(sample.url);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState({ mobile: sample.mobile, desktop: sample.desktop, categories: sample.categories, preview: true, url: sample.url });
  const [error, setError] = useState('');
  const [activeDevice, setActiveDevice] = useState('mobile');
  const [activeTab, setActiveTab] = useState('performance');
  const [toast, setToast] = useState('');

  const reportUrl = report.url || sample.url;
  const activeReport = report[activeDevice] || report.mobile;
  const metrics = activeReport.metrics || {};
  const metricCards = useMemo(() => {
    if (report.preview) {
      const data = activeDevice === 'mobile'
        ? { ...metrics, inp: metrics.inp }
        : { ...metrics, inp: metrics.inp };
      return [
        { code: 'LCP', title: 'Largest Contentful Paint', value: data.lcp, status: metricStatus('LCP', data.lcp) },
        { code: 'FCP', title: 'First Contentful Paint', value: data.fcp, status: metricStatus('FCP', data.fcp) },
        { code: 'CLS', title: 'Cumulative Layout Shift', value: data.cls, status: metricStatus('CLS', data.cls) },
        { code: 'TBT', title: 'Total Blocking Time', value: data.tbt, status: metricStatus('TBT', data.tbt) },
        { code: 'SI', title: 'Speed Index', value: data.si, status: metricStatus('SI', data.si) },
          { code: 'TTI', title: 'Time to Interactive', value: data.tti, status: metricStatus('TTI', data.tti) },
      ];
    }
    return getMetricCards(metrics);
  }, [report.preview, metrics, activeDevice]);

  async function handleRun(event) {
    event?.preventDefault();
    setError('');
    let parsed;
    try {
      parsed = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) throw new Error('Please enter a valid website address, like example.com.');
    } catch {
      setError('Enter a valid website address, such as example.com.');
      return;
    }
    const cleanUrl = parsed.href.replace(/\/$/, '');
    setUrl(cleanUrl);
    setIsRunning(true);
    try {
      const [mobile, desktop] = await Promise.all([
        runPageSpeed(cleanUrl, 'mobile', apiKey.trim()),
        runPageSpeed(cleanUrl, 'desktop', apiKey.trim()),
      ]);
      setReport({ mobile, desktop, categories: mobile.categories, preview: false, url: cleanUrl });
      setActiveTab('performance');
      setToast('Audit complete');
      window.setTimeout(() => setToast(''), 2600);
    } catch (err) {
      if (err.status === 403 || /API key|permission|accessNotConfigured/i.test(err.message)) {
        setShowKey(true);
        setError('Google requires a PageSpeed Insights API key for this request. Add your key below and run the audit again.');
      } else if (/Failed to fetch|NetworkError/i.test(err.message)) {
        setError('Could not reach Google PageSpeed Insights. Check your connection and try again.');
      } else {
        setError(err.message || 'The audit could not be completed. Please try again.');
      }
    } finally {
      setIsRunning(false);
    }
  }

  function exportReport() {
    window.print();
  }

  function openGoogle() {
    window.open(`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(reportUrl)}`, '_blank', 'noopener,noreferrer');
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="PageSpeed Audit home"><span className="brand-mark"><Gauge size={20} strokeWidth={2.5} /></span><span className="brand-name">pulse<span>speed</span></span><span className="brand-divider" /><span className="brand-caption">WEB PERFORMANCE</span></a>
      <nav className="top-nav"><a href="#report">Overview</a><a href="#recommendations">Recommendations</a><a href="https://developers.google.com/speed/docs/insights/v5/about" target="_blank" rel="noreferrer">About PSI <ArrowUpRight size={13} /></a></nav>
      <button className="export-top" onClick={exportReport}><ArrowDownToLine size={16} /> Export report</button>
    </header>

    <main id="top">
      <section className="intro wrap">
        <div className="intro-copy"><div className="eyebrow"><span className="eyebrow-dot" /> A clearer picture of your website</div>
          <h1>Speed that feels<br /><span>as good as it looks.</span></h1>
          <p>Run a Google PageSpeed audit and turn performance data into your next best move.</p>
        </div>
        <div className="intro-aside"><div className="aside-icon"><Zap size={19} fill="currentColor" /></div><div><strong>Better experiences start here.</strong><span>One quick audit. A clearer path to fast.</span></div></div>
      </section>

      <section className="search-card wrap" aria-label="Run a website audit">
        <form onSubmit={handleRun} className="search-form">
          <label className="url-field"><Globe2 size={19} /><input aria-label="Website URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter a website URL" /><button type="button" className="clear-input" onClick={() => setUrl('')} title="Clear URL"><X size={16} /></button></label>
          <button className="run-button" type="submit" disabled={isRunning}>{isRunning ? <><LoaderCircle className="spin" size={18} /> Running audit…</> : <><Zap size={18} /> Test speed <ArrowRight size={16} /></>}</button>
          <button type="button" className="rerun-button" onClick={() => handleRun()} disabled={isRunning} title="Run again"><RotateCw size={17} /><span>Re-test</span></button>
        </form>
        <div className="search-foot"><span className="search-foot-note"><LockKeyhole size={13} /> Your URL is only used to request a PageSpeed report.</span>
          <button className="key-toggle" onClick={() => setShowKey(!showKey)}><Settings2 size={14} /> {apiKey ? 'API key added' : 'API key'} {showKey ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
        </div>
        {showKey && <div className="key-panel"><div><strong>Google PageSpeed Insights API key</strong><span>Create a key in Google Cloud and enable the PageSpeed Insights API. It stays in this tab only.</span></div><input aria-label="Google API key" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste API key" /><a href="https://developers.google.com/speed/docs/insights/v5/get-started" target="_blank" rel="noreferrer">Setup guide <ExternalLink size={12} /></a></div>}
        {error && <div className="error-message"><CircleAlert size={17} /><span>{error}</span><button onClick={() => setShowKey(true)}>API settings <ArrowRight size={14} /></button></div>}
      </section>

      <section className="report wrap" id="report">
        <div className="report-heading"><div><div className="report-title-row"><h2>Your performance report</h2>{report.preview && <span className="preview-tag"><Sparkles size={12} /> PREVIEW</span>}</div>
          <div className="report-meta"><span className="report-domain"><Globe2 size={14} />{reportUrl.replace(/^https?:\/\//, '')}</span><span className="meta-sep">·</span><span>{report.preview ? 'Example data' : 'Just now'}</span></div></div>
          <div className="report-actions"><button className="text-action" onClick={openGoogle}><span>Open in PageSpeed Insights</span><ExternalLink size={14} /></button><button className="icon-action" onClick={exportReport} title="Export report"><ArrowDownToLine size={17} /></button></div>
        </div>

        <div className="device-tabs" role="tablist" aria-label="Choose device report">
          <button className={activeDevice === 'mobile' ? 'selected' : ''} role="tab" aria-selected={activeDevice === 'mobile'} onClick={() => setActiveDevice('mobile')}><Smartphone size={16} /> Mobile <span className="tab-score">{report.mobile.score}</span></button>
          <button className={activeDevice === 'desktop' ? 'selected' : ''} role="tab" aria-selected={activeDevice === 'desktop'} onClick={() => setActiveDevice('desktop')}><Monitor size={16} /> Desktop <span className="tab-score">{report.desktop.score}</span></button>
          <span className="tab-divider" />
          <span className="device-hint">{activeDevice === 'mobile' ? 'Simulated mid-tier mobile device' : 'Emulated desktop device'}</span>
        </div>

        <div className="score-overview">
          <div className="score-main"><div className="score-main-label"><span className="tiny-gauge"><Gauge size={15} /></span> PERFORMANCE SCORE</div><ScoreRing score={activeReport.score} />
            <div className={`score-caption ${scoreTone(activeReport.score)}`}><span className="caption-dot" />{activeReport.score >= 90 ? 'Good' : activeReport.score >= 50 ? 'Needs improvement' : 'Poor'}<span className="caption-range">{activeReport.score >= 90 ? '90–100' : activeReport.score >= 50 ? '50–89' : '0–49'}</span></div>
          </div>
          <div className="score-side"><div className="score-side-top"><div><span className="section-kicker">LIGHTHOUSE LAB DATA</span><h3>Core Web Vitals & key metrics</h3></div><button className="info-button" title="Lab data is collected in Lighthouse's controlled test environment. Field data, when available, reflects real-user experience over 28 days."><Info size={16} /></button></div>
            <div className="metric-grid">{metricCards.map((metric) => <MetricCard key={metric.code} {...metric} />)}</div>
            {!report.preview && !activeReport.field && <div className="field-note"><Info size={14} /> No CrUX field data available yet. Values above are from this Lighthouse lab run.</div>}
            {!report.preview && activeReport.field && <div className="field-note"><Info size={14} /> CrUX real-user data is available for this URL over the past 28 days ({activeReport.field.overall_category?.toLowerCase() || 'experience recorded'}).</div>}
            {report.preview && <div className="field-note"><Info size={14} /> Preview values are illustrative. Run an audit for live Lighthouse data.</div>}
          </div>
        </div>

        <div className="category-strip"><div className="category-label"><span className="section-kicker">LIGHTHOUSE CATEGORIES</span><span className="category-sub">See how your page performs across key areas</span></div>
          {[
            ['Accessibility', report.preview ? 94 : report.accessibility ?? '—', 'blue'],
            ['Best practices', report.preview ? 100 : report.bestPractices ?? '—', 'violet'],
            ['SEO', report.preview ? 91 : report.seo ?? '—', 'orange'],
          ].map(([label, value, color]) => <div className="category-score" key={label}><span>{label}</span><strong className={value === '—' ? 'unset' : scoreTone(value)}>{value}</strong><i className={color} style={value !== '—' ? {width: `${value}%`} : {width: '0%'}} /></div>)}
        </div>

        <div className="recommendations-heading" id="recommendations"><div><span className="section-kicker">YOUR NEXT MOVES</span><h3>Opportunities & diagnostics</h3></div><span className="recommendations-hint"><WandSparkles size={15} /> Prioritized recommendations</span></div>
        <div className="audit-list">{report.categories.map((group, index) => <AuditGroup key={`${group.title}-${index}`} group={group} />)}</div>
        <div className="report-footer"><span><Info size={14} /> Performance scores can change with network conditions and test environment.</span><a href="https://pagespeed.web.dev/" target="_blank" rel="noreferrer">Powered by Google PageSpeed Insights <ArrowUpRight size={13} /></a></div>
      </section>

      <footer className="site-footer wrap"><a className="footer-brand" href="#top"><Gauge size={16} /> pulsespeed</a><span>Made for a faster web.</span><span className="footer-dot" /> <span>Powered by Google PageSpeed Insights</span></footer>
    </main>
    {toast && <div className="toast"><BadgeCheck size={17} /> {toast}</div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
