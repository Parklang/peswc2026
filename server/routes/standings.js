const express = require('express');
const router = express.Router();
const { find, findOne, count } = require('../database');

async function calcStandings(groupId) {
  const teams = await find('teams', { group_id: groupId });
  const matches = await find('matches', { group_id: groupId, stage: 'group', status: 'finished' });

  const table = {};
  teams.forEach(t => {
    table[t._id] = { team_id: t._id, name: t.name, code: t.code, flag: t.flag, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, gd:0, points:0 };
  });

  matches.forEach(m => {
    if (m.home_score === null || m.away_score === null) return;
    const h = table[m.home_team_id], a = table[m.away_team_id];
    if (!h || !a) return;
    h.played++; a.played++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score) { h.won++; h.points += 3; a.lost++; }
    else if (m.home_score < m.away_score) { a.won++; a.points += 3; h.lost++; }
    else { h.drawn++; h.points++; a.drawn++; a.points++; }
  });

  return Object.values(table).map(t => ({ ...t, gd: t.gf - t.ga }))
    .sort((a,b) => b.points-a.points || b.gd-a.gd || b.gf-a.gf || a.name.localeCompare(b.name));
}

router.get('/', async (req, res) => {
  try {
    const groups = await find('groups');
    groups.sort((a,b) => a.name.localeCompare(b.name));
    const result = await Promise.all(groups.map(async g => ({ group: g, standings: await calcStandings(g._id) })));
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/group/:groupId', async (req, res) => {
  try {
    const group = await findOne('groups', { _id: req.params.groupId });
    if (!group) return res.status(404).json({ error: 'Not found' });
    res.json({ group, standings: await calcStandings(group._id) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/qualified', async (req, res) => {
  try {
    const unfinished = await count('matches', { stage: 'group', status: { $ne: 'finished' } });
    const groups = await find('groups');
    groups.sort((a,b) => a.name.localeCompare(b.name));

    const firstPlace = [], secondPlace = [], thirdPlace = [];
    for (const g of groups) {
      const standings = await calcStandings(g._id);
      if (standings[0]) firstPlace.push({ ...standings[0], group: g.name });
      if (standings[1]) secondPlace.push({ ...standings[1], group: g.name });
      if (standings[2]) thirdPlace.push({ ...standings[2], group: g.name });
    }
    const best8Third = [...thirdPlace].sort((a,b) => b.points-a.points || b.gd-a.gd || b.gf-a.gf).slice(0,8);
    res.json({ complete: unfinished === 0, firstPlace, secondPlace, thirdPlace: best8Third });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = { router, calcStandings };
