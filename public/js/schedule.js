async function loadSchedule() {
  const el = document.getElementById('page-schedule');
  el.innerHTML = `
    <div class="page-header">
      <h1>LỊCH THI ĐẤU</h1>
      <p>World Cup 2026 — USA · Canada · Mexico</p>
    </div>
    <div class="filter-bar">
      <button class="filter-btn active" data-stage="all">Tất cả</button>
      <button class="filter-btn" data-stage="group">Vòng bảng</button>
      <button class="filter-btn" data-stage="r32">Vòng 32</button>
      <button class="filter-btn" data-stage="r16">Tứ kết</button>
      <button class="filter-btn" data-stage="qf">Bán kết</button>
      <button class="filter-btn" data-stage="sf">Chung kết</button>
      <select class="filter-select" id="groupFilter">
        <option value="">Tất cả bảng</option>
      </select>
    </div>
    <div id="scheduleList"><div class="loading"><div class="spinner"></div> Đang tải...</div></div>
  `;

  // Populate group filter
  const groups = await api('/groups');
  if (groups) {
    const sel = document.getElementById('groupFilter');
    groups.forEach(g => sel.innerHTML += `<option value="${g.id}">Bảng ${g.name}</option>`);
  }

  let activeStage = 'all';
  let activeGroup = '';

  async function renderSchedule() {
    const params = new URLSearchParams();
    if (activeStage !== 'all') params.set('stage', activeStage);
    if (activeGroup) params.set('group_id', activeGroup);
    const matches = await api('/matches?' + params.toString());
    const list = document.getElementById('scheduleList');
    if (!matches || !matches.length) {
      list.innerHTML = `<div class="empty-state"><i class="fa-regular fa-calendar-xmark"></i>Không có trận đấu nào</div>`;
      return;
    }
    const byDate = groupByDate(matches);
    list.innerHTML = Object.entries(byDate).map(([date, ms]) => `
      <div class="date-group-title"><i class="fa-solid fa-calendar-day"></i> ${formatDate(date)}</div>
      <div class="matches-list">
        ${ms.map(m => `
          <div class="match-card" onclick="navigate('results')">
            <div class="match-team">
              ${flagImg(m.home_flag, 28)}
              <span>${m.home_name || 'TBD'}</span>
            </div>
            <div class="match-score">
              ${scoreDisplay(m)}
              <div class="match-meta">
                ${m.group_name ? `Bảng ${m.group_name} · ` : ''}${statusBadge(m.status)}
              </div>
              <div class="match-meta">${m.venue_city || ''}</div>
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

  el.querySelectorAll('[data-stage]').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('[data-stage]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStage = btn.dataset.stage;
      renderSchedule();
    });
  });
  document.getElementById('groupFilter').addEventListener('change', e => {
    activeGroup = e.target.value;
    renderSchedule();
  });

  renderSchedule();
}
