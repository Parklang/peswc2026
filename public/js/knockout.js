async function loadKnockout() {
  const el = document.getElementById('page-knockout');
  el.innerHTML = `
    <div class="page-header">
      <h1>NHÁNH ĐẤU & BỐC THĂM</h1>
      <p>Vòng knock-out World Cup 2026</p>
    </div>
    <div class="draw-actions">
      <button class="draw-btn" id="drawBtn" onclick="performDraw()">
        <i class="fa-solid fa-shuffle"></i> BỐC THĂM VÒNG 32
      </button>
      <button class="reset-btn" onclick="resetDraw()">
        <i class="fa-solid fa-rotate-left"></i> Reset Bốc Thăm
      </button>
      <div id="drawStatus" style="font-size:13px;color:var(--text2)"></div>
    </div>

    <div id="qualifiedSection" style="margin-bottom:28px"></div>
    <div id="bracketSection"></div>
  `;

  await renderQualified();
  await renderBracket();
}

async function renderQualified() {
  const qualified = await api('/standings/qualified');
  const el = document.getElementById('qualifiedSection');
  if (!qualified) return;

  if (!qualified.complete) {
    el.innerHTML = `
      <div class="card" style="border-color:rgba(245,166,35,0.3)">
        <div class="card-title">⚠️ Vòng bảng chưa kết thúc</div>
        <p style="font-size:13px;color:var(--text2)">Cần hoàn thành tất cả trận vòng bảng trước khi bốc thăm. Dưới đây là tình trạng hiện tại:</p>
      </div>`;
    document.getElementById('drawBtn').disabled = true;
    document.getElementById('drawStatus').textContent = 'Hoàn thành vòng bảng để bốc thăm';
    return;
  }

  document.getElementById('drawBtn').disabled = false;
  const all = [
    ...qualified.firstPlace.map(t => ({...t, src:'🥇 Nhất bảng '+t.group})),
    ...qualified.secondPlace.map(t => ({...t, src:'🥈 Nhì bảng '+t.group})),
    ...qualified.thirdPlace.map(t => ({...t, src:'🥉 Hạng 3 tốt nhất'}))
  ];

  el.innerHTML = `
    <div class="card">
      <div class="card-title">✅ 32 đội vào vòng 32 — Vòng bảng hoàn thành</div>
      <div class="qualified-grid">
        ${all.map(t => `
          <div class="qualified-card draw-reveal">
            <div class="q-flag">${flagImg(t.flag, 32)}</div>
            <div class="q-name">${t.name}</div>
            <div class="q-source">${t.src}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function renderBracket() {
  const matches = await api('/knockout/bracket');
  const el = document.getElementById('bracketSection');

  if (!matches || !matches.length) {
    el.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <i class="fa-solid fa-sitemap"></i>
          <p>Bốc thăm để tạo sơ đồ nhánh đấu</p>
        </div>
      </div>`;
    return;
  }

  const roundOrder = ['r32','r16','qf','sf','final','third'];
  const roundNames = { r32:'Vòng 32', r16:'Vòng 16', qf:'Tứ Kết', sf:'Bán Kết', final:'Chung Kết', third:'Tranh Hạng Ba' };
  const byRound = {};
  matches.forEach(m => {
    const r = m.knockout_round || m.stage;
    if (!byRound[r]) byRound[r] = [];
    byRound[r].push(m);
  });

  const rounds = roundOrder.filter(r => byRound[r]);

  el.innerHTML = `
    <div class="card">
      <div class="card-title">Sơ Đồ Nhánh Đấu</div>
      <div class="bracket-container">
        <div class="bracket">
          ${rounds.map(r => `
            <div class="bracket-round">
              <div class="bracket-round-title">${roundNames[r] || r.toUpperCase()}</div>
              <div class="bracket-matches">
                ${byRound[r].map(m => bracketMatchHTML(m)).join('<div class="bracket-spacer"></div>')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function bracketMatchHTML(m) {
  const homeWin = m.status === 'finished' && (m.home_score > m.away_score || m.home_penalties > m.away_penalties);
  const awayWin = m.status === 'finished' && (m.away_score > m.home_score || m.away_penalties > m.home_penalties);
  return `
    <div class="bracket-match">
      <div class="bracket-team ${m.status==='finished'?(homeWin?'winner':'loser'):''}">
        ${flagImg(m.home_flag, 20)}
        <span class="${!m.home_name?'tbd-team':''}">${m.home_name||'TBD'}</span>
        ${m.status!=='scheduled' ? `<span class="bracket-score">${m.home_score??''}</span>` : ''}
      </div>
      <div class="bracket-team ${m.status==='finished'?(awayWin?'winner':'loser'):''}">
        ${flagImg(m.away_flag, 20)}
        <span class="${!m.away_name?'tbd-team':''}">${m.away_name||'TBD'}</span>
        ${m.status!=='scheduled' ? `<span class="bracket-score">${m.away_score??''}</span>` : ''}
      </div>
    </div>
  `;
}

async function performDraw() {
  const btn = document.getElementById('drawBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang bốc thăm...';

  const result = await api('/knockout/draw', { method: 'POST' });
  if (result && result.success) {
    showToast('🎉 Bốc thăm thành công! ' + result.matches.length + ' cặp đấu đã được tạo.', 'success');
    await renderBracket();
  } else {
    showToast(result?.error || 'Lỗi bốc thăm!', 'error');
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-shuffle"></i> BỐC THĂM VÒNG 32';
}

async function resetDraw() {
  if (!confirm('Reset toàn bộ nhánh đấu knock-out?')) return;
  const result = await api('/knockout/draw/reset', { method: 'POST' });
  if (result && result.success) {
    showToast('Đã reset nhánh đấu', 'success');
    document.getElementById('drawBtn').disabled = false;
    await renderBracket();
  }
}
