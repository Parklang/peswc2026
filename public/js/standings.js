async function loadStandings() {
  const el = document.getElementById('page-standings');
  el.innerHTML = `
    <div class="page-header">
      <h1>BẢNG XẾP HẠNG</h1>
      <p>Thứ hạng các đội trong vòng bảng</p>
    </div>
    <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
      <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2)"><span style="width:12px;height:12px;background:var(--green);border-radius:2px;display:inline-block"></span> Đi tiếp trực tiếp</span>
      <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2)"><span style="width:12px;height:12px;background:var(--accent);border-radius:2px;display:inline-block"></span> Có thể đi tiếp (hạng 3)</span>
    </div>
    <div id="standingsGrid" class="standings-grid">
      <div class="loading"><div class="spinner"></div> Đang tải...</div>
    </div>
  `;

  const data = await api('/standings');
  if (!data) return;

  const grid = document.getElementById('standingsGrid');
  grid.innerHTML = data.map(({ group, standings }) => `
    <div class="card">
      <div class="card-title">Bảng ${group.name}</div>
      <table class="standings-table">
        <thead>
          <tr>
            <th>#</th><th>Đội</th><th>Tr</th><th>T</th><th>H</th><th>B</th><th>BT</th><th>BTH</th><th>HS</th><th>Đ</th>
          </tr>
        </thead>
        <tbody>
          ${standings.map((t, i) => {
            const rowClass = i === 0 || i === 1 ? 'qualify-direct' : i === 2 ? 'qualify-third' : 'eliminated';
            return `
            <tr class="${rowClass}">
              <td><span class="team-pos">${i+1}</span></td>
              <td>
                <div class="team-cell">
                  ${flagImg(t.flag, 20)}
                  <span style="font-weight:600">${t.name}</span>
                  <span style="font-size:11px;color:var(--text2)">${t.code}</span>
                </div>
              </td>
              <td>${t.played}</td>
              <td>${t.won}</td>
              <td>${t.drawn}</td>
              <td>${t.lost}</td>
              <td>${t.gf}</td>
              <td>${t.ga}</td>
              <td style="color:${t.gd>0?'var(--green)':t.gd<0?'var(--accent2)':'var(--text2)'}">${t.gd>0?'+':''}${t.gd}</td>
              <td class="pts-cell">${t.points}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}
