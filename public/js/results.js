async function loadResults() {
  const el = document.getElementById('page-results');
  el.innerHTML = `
    <div class="page-header">
      <h1>KẾT QUẢ</h1>
      <p>Các trận đấu đã hoàn thành</p>
    </div>
    <div class="filter-bar">
      <button class="filter-btn active" data-status="all">Tất cả</button>
      <button class="filter-btn" data-status="finished">Đã kết thúc</button>
      <button class="filter-btn" data-status="live">Đang diễn ra</button>
      <button class="filter-btn" data-status="scheduled">Sắp diễn ra</button>
    </div>
    <div id="resultsList"><div class="loading"><div class="spinner"></div> Đang tải...</div></div>
    <!-- Match Detail Modal -->
    <div id="matchModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;max-width:520px;width:100%;padding:24px;position:relative;max-height:80vh;overflow-y:auto;">
        <button onclick="document.getElementById('matchModal').style.display='none'" style="position:absolute;top:16px;right:16px;background:none;border:none;color:var(--text2);font-size:18px;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
        <div id="matchModalContent"></div>
      </div>
    </div>
  `;
  document.getElementById('matchModal').style.display = 'none';

  let activeStatus = 'all';

  async function renderResults() {
    const params = new URLSearchParams();
    if (activeStatus !== 'all') params.set('status', activeStatus);
    const matches = await api('/matches?' + params.toString());
    const list = document.getElementById('resultsList');
    if (!matches || !matches.length) {
      list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-futbol"></i>Chưa có kết quả nào</div>`;
      return;
    }
    const byDate = groupByDate(matches);
    list.innerHTML = Object.entries(byDate).map(([date, ms]) => `
      <div class="date-group-title"><i class="fa-solid fa-calendar-day"></i> ${formatDate(date)}</div>
      <div class="matches-list">
        ${ms.map(m => `
          <div class="match-card" onclick="showMatchDetail(${m.id||m._id})">
            <div class="match-team">
              ${flagImg(m.home_flag, 28)}
              <span>${m.home_name || 'TBD'}</span>
            </div>
            <div class="match-score">
              ${scoreDisplay(m)}
              <div class="match-meta">${m.group_name ? `Bảng ${m.group_name} · ` : ''}${statusBadge(m.status)}</div>
              <div class="match-meta">${m.venue_name || ''}</div>
            </div>
            <div class="match-team away">
              <span>${m.away_name || 'TBD'}</span>
              ${flagImg(m.away_flag, 28)}
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  el.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('[data-status]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatus = btn.dataset.status;
      renderResults();
    });
  });

  renderResults();
}

async function showMatchDetail(matchId) {
  const m = await api('/matches/' + matchId);
  if (!m) return;
  const modal = document.getElementById('matchModal');
  const content = document.getElementById('matchModalContent');

  const eventHtml = m.events && m.events.length ? m.events.map(e => {
    const icons = { goal:'⚽', yellow_card:'🟨', red_card:'🟥', assist:'🎯', own_goal:'⚽🔴', penalty_goal:'⚽(P)' };
    const isHome = e.team_id === m.home_team_id;
    return `
      <div class="event-item" style="justify-content:${isHome ? 'flex-start' : 'flex-end'}">
        ${isHome ? `<span>${e.minute}'</span><span class="event-icon">${icons[e.event_type]||'•'}</span><span>${e.player_name || 'Unknown'}</span>` 
                 : `<span>${e.player_name || 'Unknown'}</span><span class="event-icon">${icons[e.event_type]||'•'}</span><span>${e.minute}'</span>`}
      </div>`;
  }).join('') : '<p style="color:var(--text2);font-size:13px;text-align:center">Chưa có sự kiện nào</p>';

  content.innerHTML = `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:12px;color:var(--text2);margin-bottom:8px">${m.group_name ? `Bảng ${m.group_name}` : m.knockout_round || ''} · ${formatDate(m.match_date)}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:8px">
        <div style="text-align:center">${flagImg(m.home_flag, 48)}<div style="font-weight:700;margin-top:4px">${m.home_name}</div></div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:48px;color:var(--text)">${m.home_score ?? '–'} - ${m.away_score ?? '–'}</div>
        <div style="text-align:center">${flagImg(m.away_flag, 48)}<div style="font-weight:700;margin-top:4px">${m.away_name}</div></div>
      </div>
      ${statusBadge(m.status)}
      <div style="font-size:12px;color:var(--text2);margin-top:6px">${m.venue_name ? m.venue_name + ', ' + m.venue_city : ''}</div>
    </div>
    <div class="card-title">Sự kiện trận đấu</div>
    <div>${eventHtml}</div>
  `;
  modal.style.display = 'flex';
}
