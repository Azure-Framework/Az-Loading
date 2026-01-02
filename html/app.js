const $ = (id) => document.getElementById(id);

const fmtMoney = (n) => {
  const num = Number(n || 0);
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const setProgress = (pct, label) => {
  pct = Math.max(0, Math.min(100, pct));
  $('progressFill').style.width = pct.toFixed(0) + '%';
  $('progressPct').textContent = pct.toFixed(0) + '%';
  if (label) $('progressLabel').textContent = label;
};

const setStatus = (t) => $('statusText').textContent = t;

const setStats = (p) => {
  // ✅ DO NOT touch #serverName or #subtitle here.
  // Branding comes ONLY from config.js via applyConfig()

  skeletonOff();

  tweenNumber($('statChars'), p.characters ?? 0, (n)=>Math.round(n).toString());
  tweenNumber($('statCash'),  p.cash ?? 0, (n)=>fmtMoney(Math.round(n)));
  tweenNumber($('statBank'),  p.bank ?? 0, (n)=>fmtMoney(Math.round(n)));
  tweenNumber($('statJail'),  p.jailRecords ?? 0, (n)=>Math.round(n).toString());
  tweenNumber($('statBiz'),   p.businesses ?? 0, (n)=>Math.round(n).toString());
  tweenNumber($('statVeh'),   p.vehicles ?? 0, (n)=>Math.round(n).toString());

  const list = $('bizList');
  list.innerHTML = '';

  const rows = Array.isArray(p.businessesPreview) ? p.businessesPreview : [];
  const max = Number((CFG.ui || {}).maxBusinessesPreview ?? 6);
  const take = rows.slice(0, Math.max(0, max));

  if (!take.length) {
    const empty = document.createElement('div');
    empty.className = 'list-empty muted';
    empty.textContent = (CFG.text || {}).emptyList || 'No businesses found.';
    list.appendChild(empty);
    return;
  }

  for (const r of take) {
    const item = document.createElement('div');
    item.className = 'list-item';

    const top = document.createElement('div');
    top.className = 'li-top';

    const left = document.createElement('div');
    left.innerHTML =
      `<div class="li-name">${escapeHtml(r.name || 'Business')}</div>
       <div class="li-type">${escapeHtml(r.type || '—')}</div>`;

    const badge = document.createElement('div');
    badge.className = 'li-badge';
    badge.textContent = (Number(r.is_open) === 1) ? 'OPEN' : 'CLOSED';

    top.appendChild(left);
    top.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'li-meta';
    meta.innerHTML = `<div>Balance: $${fmtMoney(r.balance)}</div><div>DB-linked</div>`;

    item.appendChild(top);
    item.appendChild(meta);
    list.appendChild(item);
  }
};


const showError = (msg) => {
  $('errorBox').classList.remove('hidden');
  $('errorMsg').textContent = msg || 'Unknown error';
};

const hideError = () => $('errorBox').classList.add('hidden');

const escapeHtml = (s) => String(s ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

// Fake progress (FiveM load events will bump it)
let fakePct = 0;
let fakeTimer = setInterval(() => {
  fakePct = Math.min(92, fakePct + (fakePct < 60 ? 2.5 : 1.1));
  setProgress(fakePct, fakePct < 20 ? 'Initializing…' : fakePct < 55 ? 'Loading assets…' : 'Almost ready…');
}, 250);

// Clock
setInterval(() => {
  const d = new Date();
  $('clock').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}, 500);

// ✅ Hybrid: try file fetch, but ALSO accept Lua push messages
let gotStats = false;
let gotLua = false;

async function fetchStatsOnce() {
  try {
    const url = `stats.json?ts=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data && data.ok) {
      gotStats = true;
      clearInterval(fakeTimer);
      hideError();
      setStatus('Server stats loaded ✅');
      setProgress(100, 'Stats loaded — entering…');
      setStats(data);
    }
  } catch (e) {
    // Don't spam; just show a tiny hint once. Lua push will still fix it later.
    showError(`stats.json not readable yet (${String(e.message || e)}) — waiting for Lua sync…`);
  }
}

// Poll a few times early
let fetchTries = 0;
const fetchTimer = setInterval(() => {
  fetchTries++;
  if (gotStats || fetchTries > 10) { clearInterval(fetchTimer); return; }
  fetchStatsOnce();
}, 700);

fetchStatsOnce();

// Accept both object messages and string JSON
window.addEventListener('message', (e) => {
  let data = e.data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { /* ignore */ }
  }
  data = data || {};

  // FiveM load events
  if (data.eventName && typeof data.eventName === 'string') {
    if (data.eventName === 'startInitFunctionOrder') setStatus('Initializing…');
    if (data.eventName === 'initFunctionInvoking') {
      if (!gotStats) setStatus('Loading…');
      if (typeof data.eventData === 'object' && data.eventData.name) {
        $('progressLabel').textContent = String(data.eventData.name);
      }
      setProgress(Math.min(97, fakePct + 1.5));
    }
    if (data.eventName === 'endInitFunction') setStatus('Finalizing…');
  }

  // Lua pushed messages
  if (data.action === 'hello') {
    gotLua = true;
    hideError();
    setStatus('Lua linked — waiting for network…');
  }

  if (data.action === 'status') {
    gotLua = true;
    hideError();
    if (!gotStats) setStatus(String(data.text || 'Loading…'));
  }

  if (data.action === 'stats') {
    const p = data.payload || {};
    gotStats = true;
    clearInterval(fakeTimer);
    hideError();
    setStatus('Server stats loaded ✅');
    setProgress(100, 'Stats loaded — entering…');
    setStats(p);
  }
});

// Initial UI state
setStatus('Waiting for server stats…');
setProgress(0, 'Initializing…');
