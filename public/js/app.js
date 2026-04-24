// ============== ROUTER ==============
const pages = ['schedule','results','standings','stats','knockout','admin'];
let currentPage = 'schedule';

function navigate(page) {
  if (!pages.includes(page)) page = 'schedule';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  currentPage = page;
  window.location.hash = page;

  const loaders = {
    schedule: loadSchedule,
    results: loadResults,
    standings: loadStandings,
    stats: loadStats,
    knockout: loadKnockout,
    admin: loadAdmin,
  };
  if (loaders[page]) loaders[page]();

  // close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigate(item.dataset.page);
  });
});

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ============== API HELPER ==============
async function api(path, options = {}) {
  try {
    const res = await fetch('/api' + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    return await res.json();
  } catch(e) {
    console.error('API error:', e);
    return null;
  }
}

// ============== TOAST ==============
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ============== UTILS ==============
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    live: '<span class="match-badge badge-live">🔴 LIVE</span>',
    finished: '<span class="match-badge badge-finished">✓ KT</span>',
    scheduled: '<span class="match-badge badge-scheduled">Sắp diễn ra</span>'
  };
  return map[status] || '';
}

function scoreDisplay(m) {
  if (m.status === 'scheduled') return `<div class="score-box scheduled">${formatTime(m.match_date)}</div>`;
  const pen = (m.home_penalties !== null) ? `<div style="font-size:11px;color:var(--text2)">(${m.home_penalties} - ${m.away_penalties}) PEN</div>` : '';
  return `<div class="score-box ${m.status}">${m.home_score} - ${m.away_score}</div>${pen}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '--:--';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function flagImg(code, size = 24) {
  if (!code) return '<span style="font-size:20px">🏳</span>';
  return `<img src="https://flagcdn.com/w40/${code.toLowerCase()}.png" width="${size}" height="${Math.round(size*0.67)}" style="border-radius:2px;object-fit:cover;vertical-align:middle" onerror="this.style.display='none'" alt="${code}" />`;
}

function groupByDate(matches) {
  const groups = {};
  matches.forEach(m => {
    const date = m.match_date ? m.match_date.split('T')[0].slice(0, 10) : 'TBD';
    if (!groups[date]) groups[date] = [];
    groups[date].push(m);
  });
  return groups;
}

// Init
const hash = window.location.hash.replace('#', '');
navigate(pages.includes(hash) ? hash : 'schedule');
