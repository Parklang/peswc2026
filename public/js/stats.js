let chartInstances = {};

async function loadStats() {
  const el = document.getElementById('page-stats');
  el.innerHTML = `
    <div class="page-header">
      <h1>THỐNG KÊ</h1>
      <p>Số liệu thống kê toàn giải</p>
    </div>
    <div class="stat-grid" id="overviewStats">
      <div class="loading"><div class="spinner"></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-title">Vua Phá Lưới</div>
        <div id="scorersList"><div class="loading"><div class="spinner"></div></div></div>
      </div>
      <div class="card">
        <div class="card-title">Kiến Tạo Nhiều Nhất</div>
        <div id="assistersList"><div class="loading"><div class="spinner"></div></div></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
      <div class="card">
        <div class="card-title">Bàn Thắng Theo Đội</div>
        <div class="chart-wrapper"><canvas id="goalsChart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">Kỷ Luật</div>
        <div class="chart-wrapper"><canvas id="disciplineChart"></canvas></div>
      </div>
    </div>
  `;

  const [overview, scorers, assisters, teamStats, discipline] = await Promise.all([
    api('/stats/overview'),
    api('/stats/scorers'),
    api('/stats/assisters'),
    api('/stats/teams'),
    api('/stats/discipline'),
  ]);

  // Overview stats
  if (overview) {
    document.getElementById('overviewStats').innerHTML = `
      <div class="stat-card gold"><div class="stat-number">${overview.totalMatches}</div><div class="stat-label">Trận đã đấu</div><i class="fa-solid fa-futbol stat-icon"></i></div>
      <div class="stat-card red"><div class="stat-number">${overview.totalGoals}</div><div class="stat-label">Tổng bàn thắng</div><i class="fa-solid fa-bullseye stat-icon"></i></div>
      <div class="stat-card blue"><div class="stat-number">${overview.avgGoals}</div><div class="stat-label">TB bàn/trận</div><i class="fa-solid fa-chart-line stat-icon"></i></div>
      <div class="stat-card green"><div class="stat-number">${overview.totalYellow}</div><div class="stat-label">Thẻ vàng</div><i class="fa-solid fa-square stat-icon" style="color:#ffd700"></i></div>
    `;
  }

  // Scorers
  const maxGoals = scorers?.[0]?.goals || 1;
  document.getElementById('scorersList').innerHTML = scorers && scorers.length
    ? `<table class="scorers-table"><tbody>${scorers.slice(0,10).map((p, i) => `
      <tr>
        <td><div class="rank-badge rank-${i<3?i+1:'other'}">${i+1}</div></td>
        <td><div style="font-weight:600">${p.name}</div><div style="font-size:11px;color:var(--text2)">${flagImg(p.flag, 16)} ${p.team_name}</div></td>
        <td><div class="goals-bar"><div class="bar-fill" style="width:${(p.goals/maxGoals)*120}px"></div><span class="goals-num">${p.goals}</span></div></td>
      </tr>`).join('')}</tbody></table>`
    : '<div class="empty-state" style="padding:20px"><i class="fa-solid fa-futbol"></i>Chưa có dữ liệu</div>';

  const maxAssists = assisters?.[0]?.assists || 1;
  document.getElementById('assistersList').innerHTML = assisters && assisters.length
    ? `<table class="scorers-table"><tbody>${assisters.slice(0,10).map((p, i) => `
      <tr>
        <td><div class="rank-badge rank-${i<3?i+1:'other'}">${i+1}</div></td>
        <td><div style="font-weight:600">${p.name}</div><div style="font-size:11px;color:var(--text2)">${flagImg(p.flag, 16)} ${p.team_name}</div></td>
        <td><div class="goals-bar"><div class="bar-fill" style="width:${(p.assists/maxAssists)*120}px;background:linear-gradient(90deg,var(--blue),var(--green))"></div><span class="goals-num" style="color:var(--blue)">${p.assists}</span></div></td>
      </tr>`).join('')}</tbody></table>`
    : '<div class="empty-state" style="padding:20px"><i class="fa-solid fa-handshake"></i>Chưa có dữ liệu</div>';

  // Charts
  if (chartInstances.goals) chartInstances.goals.destroy();
  if (chartInstances.discipline) chartInstances.discipline.destroy();

  const top10Teams = (teamStats || []).slice(0, 10);
  if (top10Teams.length) {
    chartInstances.goals = new Chart(document.getElementById('goalsChart'), {
      type: 'bar',
      data: {
        labels: top10Teams.map(t => t.flag + ' ' + t.code),
        datasets: [
          { label: 'Bàn thắng', data: top10Teams.map(t => t.gf), backgroundColor: 'rgba(245,166,35,0.8)', borderRadius: 6 },
          { label: 'Bàn thua', data: top10Teams.map(t => t.ga), backgroundColor: 'rgba(230,57,70,0.6)', borderRadius: 6 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8892a4', font: { family: 'Inter' } } } }, scales: { x: { ticks: { color: '#8892a4' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#8892a4' }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
    });
  } else {
    document.getElementById('goalsChart').parentElement.innerHTML = '<div class="empty-state" style="padding:30px"><i class="fa-solid fa-chart-bar"></i>Chưa có dữ liệu</div>';
  }

  const top6Discipline = (discipline || []).slice(0, 6);
  if (top6Discipline.length) {
    chartInstances.discipline = new Chart(document.getElementById('disciplineChart'), {
      type: 'doughnut',
      data: {
        labels: ['Thẻ vàng', 'Thẻ đỏ'],
        datasets: [{ data: [top6Discipline.reduce((s,t)=>s+t.yellow_cards,0), top6Discipline.reduce((s,t)=>s+t.red_cards,0)], backgroundColor: ['rgba(255,215,0,0.8)', 'rgba(230,57,70,0.8)'], borderColor: 'var(--card)', borderWidth: 3 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8892a4', font: { family: 'Inter' } } } } }
    });
  } else {
    document.getElementById('disciplineChart').parentElement.innerHTML = '<div class="empty-state" style="padding:30px"><i class="fa-solid fa-square"></i>Chưa có dữ liệu</div>';
  }
}
