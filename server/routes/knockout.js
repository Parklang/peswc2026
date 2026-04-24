const express = require('express');
const router = express.Router();
const { find, findOne, insert, remove, count } = require('../database');
const { calcStandings } = require('./standings');

async function enrichMatch(m) {
  const [ht, at] = await Promise.all([
    m.home_team_id ? findOne('teams', { _id: m.home_team_id }) : null,
    m.away_team_id ? findOne('teams', { _id: m.away_team_id }) : null,
  ]);
  return { ...m, home_name: ht?.name, home_code: ht?.code, home_flag: ht?.flag, away_name: at?.name, away_code: at?.code, away_flag: at?.flag };
}

// GET bracket
router.get('/bracket', async (req, res) => {
  try {
    const matches = await find('matches', { stage: { $ne: 'group' } });
    matches.sort((a,b) => {
      const order = ['r32','r16','qf','sf','final','third'];
      return (order.indexOf(a.knockout_round||a.stage) - order.indexOf(b.knockout_round||b.stage)) || (a.bracket_slot||0)-(b.bracket_slot||0);
    });
    const enriched = await Promise.all(matches.map(enrichMatch));
    res.json(enriched);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST perform draw
router.post('/draw', async (req, res) => {
  try {
    const existing = await count('matches', { stage: 'r32' });
    if (existing > 0) return res.status(400).json({ error: 'Bốc thăm đã được thực hiện. Hãy reset trước.' });

    const groups = await find('groups');
    groups.sort((a,b) => a.name.localeCompare(b.name));

    const firstPlace = [], secondPlace = [], thirdPlace = [];
    for (const g of groups) {
      const standings = await calcStandings(g._id);
      if (standings[0]) firstPlace.push({ ...standings[0], group: g.name });
      if (standings[1]) secondPlace.push({ ...standings[1], group: g.name });
      if (standings[2]) thirdPlace.push({ ...standings[2], group: g.name });
    }
    const best8Third = [...thirdPlace].sort((a,b) => b.points-a.points||b.gd-a.gd||b.gf-a.gf).slice(0,8);

    if (firstPlace.length < 12 || secondPlace.length < 12 || best8Third.length < 8) {
      return res.status(400).json({ error: 'Chưa đủ dữ liệu. Đảm bảo tất cả trận vòng bảng đã kết thúc.' });
    }

    const shuffle = arr => [...arr].sort(() => Math.random()-0.5);
    const allTeams = shuffle([...firstPlace, ...secondPlace, ...best8Third]);

    const venues = await find('venues');
    const baseDate = new Date('2026-07-01');
    const result = [];

    for (let i = 0; i < 16; i++) {
      const home = allTeams[i*2], away = allTeams[i*2+1];
      if (!home || !away) continue;
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + Math.floor(i/4));
      const venueId = venues[i % venues.length]?._id;
      await insert('matches', {
        home_team_id: home.team_id, away_team_id: away.team_id,
        stage: 'r32', match_date: d.toISOString().split('T')[0], venue_id: venueId,
        status: 'scheduled', knockout_round: 'r32', bracket_slot: i+1,
        group_id: null, home_score: null, away_score: null, home_penalties: null, away_penalties: null
      });
      result.push({ slot: i+1, home: home.name, away: away.name });
    }

    res.json({ success: true, matches: result });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST reset draw
router.post('/draw/reset', async (req, res) => {
  try {
    await remove('matches', { stage: { $ne: 'group' } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET all teams
router.get('/teams', async (req, res) => {
  try {
    const teams = await find('teams');
    res.json(teams.sort((a,b) => a.name.localeCompare(b.name)));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET/POST players
router.get('/players', async (req, res) => {
  try {
    const { team_id } = req.query;
    const q = team_id ? { team_id } : {};
    const players = await find('players', q);
    players.sort((a,b) => a.name.localeCompare(b.name));
    const enriched = await Promise.all(players.map(async p => {
      const t = await findOne('teams', { _id: p.team_id });
      return { ...p, team_name: t?.name, team_code: t?.code };
    }));
    res.json(enriched);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/players', async (req, res) => {
  try {
    const { team_id, name, position, jersey_number } = req.body;
    const doc = await insert('players', { team_id, name, position, jersey_number: jersey_number ? +jersey_number : null });
    res.json({ id: doc._id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
