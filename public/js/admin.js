let adminMatches = [];

async function loadAdmin() {
  const el = document.getElementById('page-admin');
  el.innerHTML = `
    <div class="page-header">
      <h1>ADMIN PANEL</h1>
      <p>Quản lý kết quả và sự kiện trận đấu</p>
    </div>
    <div class="admin-grid">
      <!-- Left: Match selector + result entry -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-title">Chọn Trận Đấu</div>
          <div class="form-group">
            <label class="form-label">Lọc theo trạng thái</label>
            <div class="status-toggle" style="margin-bottom:10px">
              <button class="filter-btn active" onclick="filterAdminMatches('all',this)">Tất cả</button>
              <button class="filter-btn" onclick="filterAdminMatches('scheduled',this)">Sắp đấu</button>
              <button class="filter-btn" onclick="filterAdminMatches('live',this)">Live</button>
              <button class="filter-btn" onclick="filterAdminMatches('finished',this)">Kết thúc</button>
            </div>
            <select class="form-select" id="matchSelector" size="10" style="height:220px"></select>
          </div>
          <button class="btn-primary" onclick="selectMatch()">Chọn Trận →</button>
        </div>

        <div class="card" id="playerSection" style="display:none">
          <div class="card-title">Thêm Cầu Thủ</div>
          <div class="form-group">
            <label class="form-label">Đội</label>
            <select class="form-select" id="playerTeam"></select>
          </div>
          <div class="form-group">
            <label class="form-label">Tên cầu thủ</label>
            <input class="form-input" id="playerName" placeholder="Nguyễn Văn A" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="form-group">
              <label class="form-label">Vị trí</label>
              <select class="form-select" id="playerPos">
                <option>GK</option><option>DF</option><option>MF</option><option>FW</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Số áo</label>
              <input class="form-input" id="playerNumber" type="number" placeholder="9" />
            </div>
          </div>
          <button class="btn-primary" onclick="addPlayer()">+ Thêm Cầu Thủ</button>
        </div>
      </div>

      <!-- Right: Edit form -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card" id="matchEditCard">
          <div class="card-title">Chi Tiết Trận Đấu</div>
          <div id="selectedMatchInfo" style="color:var(--text2);font-size:13px">Chọn một trận đấu để chỉnh sửa</div>
        </div>
        <div class="card" id="eventCard" style="display:none">
          <div class="card-title">Sự Kiện Trận Đấu</div>
          <div id="currentEvents" class="events-list"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="form-group">
              <label class="form-label">Loại sự kiện</label>
              <select class="form-select" id="eventType">
                <option value="goal">⚽ Bàn thắng</option>
                <option value="penalty_goal">⚽ Penalty</option>
                <option value="own_goal">⚽ Phản lưới</option>
                <option value="assist">🎯 Kiến tạo</option>
                <option value="yellow_card">🟨 Thẻ vàng</option>
                <option value="red_card">🟥 Thẻ đỏ</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Phút</label>
              <input class="form-input" id="eventMinute" type="number" placeholder="45" min="1" max="120" />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="form-group">
              <label class="form-label">Đội</label>
              <select class="form-select" id="eventTeam" onchange="loadEventPlayers()"></select>
            </div>
            <div class="form-group">
              <label class="form-label">Cầu thủ</label>
              <select class="form-select" id="eventPlayer"><option value="">-- Chọn cầu thủ --</option></select>
            </div>
          </div>
          <button class="btn-primary" onclick="addEvent()">+ Thêm Sự Kiện</button>
        </div>
      </div>
    </div>
  `;

  await refreshAdminMatches();
}

let selectedMatchId = null;

async function refreshAdminMatches(statusFilter = 'all') {
  const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
  adminMatches = await api('/matches' + params) || [];
  const sel = document.getElementById('matchSelector');
  if (!sel) return;
  sel.innerHTML = adminMatches.map(m =>
    `<option value="${m.id}">[Bảng ${m.group_name||m.knockout_round||'KO'}] ${m.home_name} vs ${m.away_name} — ${formatDate(m.match_date)} (${m.status})</option>`
  ).join('');
}

function filterAdminMatches(status, btn) {
  document.querySelectorAll('#page-admin .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  refreshAdminMatches(status);
}

async function selectMatch() {
  const sel = document.getElementById('matchSelector');
  if (!sel.value) return;
  selectedMatchId = sel.value;
  const m = await api('/matches/' + selectedMatchId);
  if (!m) return;

  document.getElementById('playerSection').style.display = 'block';
  document.getElementById('eventCard').style.display = 'block';

  // Populate player section teams
  const pTeam = document.getElementById('playerTeam');
  pTeam.innerHTML = `<option value="${m.home_team_id}">${m.home_code} - ${m.home_name}</option><option value="${m.away_team_id}">${m.away_code} - ${m.away_name}</option>`;

  // Event team selector
  const eTeam = document.getElementById('eventTeam');
  eTeam.innerHTML = `<option value="${m.home_team_id}">${m.home_code} - ${m.home_name}</option><option value="${m.away_team_id}">${m.away_code} - ${m.away_name}</option>`;
  await loadEventPlayers();

  // Match edit card
  document.getElementById('matchEditCard').innerHTML = `
    <div class="card-title">✏️ ${m.home_name} vs ${m.away_name}</div>
    <p style="font-size:12px;color:var(--text2);margin-bottom:16px">${m.group_name ? `Bảng ${m.group_name}` : ''} · ${formatDate(m.match_date)}</p>
    <div class="form-group">
      <label class="form-label">Trạng thái</label>
      <div class="status-toggle">
        <button class="status-btn ${m.status==='scheduled'?'active-scheduled':''}" onclick="setStatus('scheduled',this)">Sắp đấu</button>
        <button class="status-btn ${m.status==='live'?'active-live':''}" onclick="setStatus('live',this)">🔴 Live</button>
        <button class="status-btn ${m.status==='finished'?'active-finished':''}" onclick="setStatus('finished',this)">✓ Kết thúc</button>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tỉ Số</label>
      <div class="score-inputs">
        <input class="form-input" id="homeScore" type="number" min="0" value="${m.home_score??''}" placeholder="${m.home_name}" style="text-align:center;font-size:20px;font-weight:700" />
        <span class="score-sep">:</span>
        <input class="form-input" id="awayScore" type="number" min="0" value="${m.away_score??''}" placeholder="${m.away_name}" style="text-align:center;font-size:20px;font-weight:700" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Penalty (nếu có)</label>
      <div class="score-inputs">
        <input class="form-input" id="homePen" type="number" min="0" value="${m.home_penalties??''}" placeholder="—" style="text-align:center" />
        <span class="score-sep">—</span>
        <input class="form-input" id="awayPen" type="number" min="0" value="${m.away_penalties??''}" placeholder="—" style="text-align:center" />
      </div>
    </div>
    <button class="btn-primary" onclick="saveResult()">💾 Lưu Kết Quả</button>
  `;

  // Load events
  await refreshEvents(m);
}

let currentMatchStatus = '';
function setStatus(status, btn) {
  document.querySelectorAll('.status-btn').forEach(b => b.className = 'status-btn');
  btn.classList.add('active-' + status);
  currentMatchStatus = status;
}

async function saveResult() {
  if (!selectedMatchId) return;
  const home_score = document.getElementById('homeScore').value;
  const away_score = document.getElementById('awayScore').value;
  const home_penalties = document.getElementById('homePen').value;
  const away_penalties = document.getElementById('awayPen').value;
  const result = await api('/matches/' + selectedMatchId + '/result', {
    method: 'PUT',
    body: { home_score: home_score !== '' ? +home_score : null, away_score: away_score !== '' ? +away_score : null, home_penalties: home_penalties !== '' ? +home_penalties : null, away_penalties: away_penalties !== '' ? +away_penalties : null, status: currentMatchStatus || 'finished' }
  });
  if (result?.success) showToast('✅ Đã lưu kết quả!', 'success');
  else showToast('❌ Lỗi lưu kết quả', 'error');
}

async function refreshEvents(m) {
  const events = m.events || [];
  const eventIcons = { goal:'⚽', penalty_goal:'⚽(P)', own_goal:'⚽🔴', assist:'🎯', yellow_card:'🟨', red_card:'🟥' };
  document.getElementById('currentEvents').innerHTML = events.length
    ? events.map(e => `
        <div class="event-item">
          <span class="event-icon">${eventIcons[e.event_type]||'•'}</span>
          <span>${e.minute}'</span>
          <span>${e.player_name || 'Unk'}</span>
          <span style="color:var(--text2);font-size:11px">(${e.team_name})</span>
          <button class="event-delete" onclick="deleteEvent(${e.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      `).join('')
    : '<p style="font-size:12px;color:var(--text2)">Chưa có sự kiện</p>';
}

async function loadEventPlayers() {
  const teamId = document.getElementById('eventTeam')?.value;
  if (!teamId) return;
  const players = await api('/knockout/players?team_id=' + teamId);
  const sel = document.getElementById('eventPlayer');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Chọn cầu thủ --</option>' + (players||[]).map(p => `<option value="${p.id}">${p.jersey_number ? '#'+p.jersey_number+' ':''} ${p.name}</option>`).join('');
}

async function addEvent() {
  if (!selectedMatchId) return;
  const event_type = document.getElementById('eventType').value;
  const minute = document.getElementById('eventMinute').value;
  const team_id = document.getElementById('eventTeam').value;
  const player_id = document.getElementById('eventPlayer').value;
  if (!minute || !team_id) { showToast('Nhập đủ thông tin sự kiện!', 'error'); return; }
  const result = await api('/matches/' + selectedMatchId + '/events', { method: 'POST', body: { event_type, minute: +minute, team_id, player_id: player_id ? player_id : null } });
  if (result?.id) {
    showToast('✅ Đã thêm sự kiện!', 'success');
    const m = await api('/matches/' + selectedMatchId);
    if (m) refreshEvents(m);
  }
}

async function deleteEvent(eventId) {
  await api('/matches/events/' + eventId, { method: 'DELETE' });
  showToast('Đã xóa sự kiện', 'success');
  const m = await api('/matches/' + selectedMatchId);
  if (m) refreshEvents(m);
}

async function addPlayer() {
  const team_id = document.getElementById('playerTeam').value;
  const name = document.getElementById('playerName').value.trim();
  const position = document.getElementById('playerPos').value;
  const jersey_number = document.getElementById('playerNumber').value;
  if (!name) { showToast('Nhập tên cầu thủ!', 'error'); return; }
  const result = await api('/knockout/players', { method: 'POST', body: { team_id, name, position, jersey_number: jersey_number ? +jersey_number : null } });
  if (result?.id) {
    showToast('✅ Đã thêm cầu thủ ' + name, 'success');
    document.getElementById('playerName').value = '';
    document.getElementById('playerNumber').value = '';
    await loadEventPlayers();
  }
}
