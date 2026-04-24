const express = require('express');
const router = express.Router();
const { find, findOne, count } = require('../database');

router.get('/overview', async (req, res) => {
  try {
    const totalMatches = await count('matches', { status: 'finished' });
    const goalEvents = await find('events', { event_type: { $in: ['goal','penalty_goal'] } });
    const yellowEvents = await find('events', { event_type: 'yellow_card' });
    const redEvents = await find('events', { event_type: 'red_card' });
    const totalGoals = goalEvents.length;
    const avgGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : 0;
    res.json({ totalMatches, totalGoals, avgGoals, totalYellow: yellowEvents.length, totalRed: redEvents.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/scorers', async (req, res) => {
  try {
    const goals = await find('events', { event_type: { $in: ['goal','penalty_goal'] } });
    const playerGoals = {};
    for (const g of goals) {
      if (!g.player_id) continue;
      if (!playerGoals[g.player_id]) {
        const p = await findOne('players', { _id: g.player_id });
        const t = g.team_id ? await findOne('teams', { _id: g.team_id }) : null;
        playerGoals[g.player_id] = { id: g.player_id, name: p?.name||'Unknown', team_name: t?.name, team_code: t?.code, flag: t?.flag, goals: 0 };
      }
      playerGoals[g.player_id].goals++;
    }
    res.json(Object.values(playerGoals).sort((a,b) => b.goals-a.goals).slice(0,20));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/assisters', async (req, res) => {
  try {
    const assists = await find('events', { event_type: 'assist' });
    const playerAssists = {};
    for (const a of assists) {
      if (!a.player_id) continue;
      if (!playerAssists[a.player_id]) {
        const p = await findOne('players', { _id: a.player_id });
        const t = a.team_id ? await findOne('teams', { _id: a.team_id }) : null;
        playerAssists[a.player_id] = { id: a.player_id, name: p?.name||'Unknown', team_name: t?.name, flag: t?.flag, assists: 0 };
      }
      playerAssists[a.player_id].assists++;
    }
    res.json(Object.values(playerAssists).sort((a,b) => b.assists-a.assists).slice(0,20));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/teams', async (req, res) => {
  try {
    const teams = await find('teams');
    const result = await Promise.all(teams.map(async team => {
      const matches = await find('matches', { status: 'finished' });
      const teamMatches = matches.filter(m => m.home_team_id === team._id || m.away_team_id === team._id);
      let played=0,won=0,drawn=0,lost=0,gf=0,ga=0;
      teamMatches.forEach(m => {
        if (m.home_score === null) return;
        played++;
        const isHome = m.home_team_id === team._id;
        const my = isHome ? m.home_score : m.away_score;
        const opp = isHome ? m.away_score : m.home_score;
        gf+=my; ga+=opp;
        if (my>opp) won++; else if(my<opp) lost++; else drawn++;
      });
      const yellowCards = (await find('events', { team_id: team._id, event_type: 'yellow_card' })).length;
      const redCards    = (await find('events', { team_id: team._id, event_type: 'red_card' })).length;
      return { ...team, played, won, drawn, lost, gf, ga, gd:gf-ga, yellow_cards:yellowCards, red_cards:redCards };
    }));
    res.json(result.filter(t=>t.played>0).sort((a,b)=>b.gf-a.gf));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/discipline', async (req, res) => {
  try {
    const teams = await find('teams');
    const result = await Promise.all(teams.map(async t => {
      const yellow = (await find('events', { team_id: t._id, event_type: 'yellow_card' })).length;
      const red    = (await find('events', { team_id: t._id, event_type: 'red_card' })).length;
      return { team_name: t.name, code: t.code, flag: t.flag, yellow_cards: yellow, red_cards: red };
    }));
    res.json(result.filter(t=>t.yellow_cards+t.red_cards>0).sort((a,b)=>b.red_cards-a.red_cards||b.yellow_cards-a.yellow_cards));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
