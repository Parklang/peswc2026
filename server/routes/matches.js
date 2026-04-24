const express = require('express');
const router = express.Router();
const { db, find, findOne, insert, update, remove } = require('../database');

// Enrich match with team/venue info
async function enrichMatch(m) {
  if (!m) return null;
  const homeId = m.home_team_id?.toString();
  const awayId = m.away_team_id?.toString();
  const venueId = m.venue_id?.toString();
  const groupId = m.group_id?.toString();

  const [ht, at, venue, group] = await Promise.all([
    homeId ? findOne('teams', { _id: homeId }) : null,
    awayId ? findOne('teams', { _id: awayId }) : null,
    venueId ? findOne('venues', { _id: venueId }) : null,
    groupId ? findOne('groups', { _id: groupId }) : null,
  ]);

  return {
    ...m,
    id: m._id.toString(),
    home_team_id: homeId,
    away_team_id: awayId,
    venue_id: venueId,
    group_id: groupId,
    home_name: ht?.name || '?', home_code: ht?.code || '???', home_flag: ht?.flag,
    away_name: at?.name || '?', away_code: at?.code || '???', away_flag: at?.flag,
    group_name: group?.name,
    venue_name: venue?.name, venue_city: venue?.city
  };
}

// GET all matches
router.get('/', async (req, res) => {
  try {
    const { stage, group_id, team_id, status, date } = req.query;
    let q = {};
    if (stage)    q.stage    = stage;
    if (group_id) q.group_id = group_id;
    if (status)   q.status   = status;

    let matches = await find('matches', q);

    if (date) matches = matches.filter(m => m.match_date && m.match_date.startsWith(date));
    if (team_id) matches = matches.filter(m => m.home_team_id?.toString() === team_id || m.away_team_id?.toString() === team_id);

    matches.sort((a,b) => (a.match_date||'').localeCompare(b.match_date||''));
    const enriched = await Promise.all(matches.map(enrichMatch));
    res.json(enriched);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET single match with events
router.get('/:id', async (req, res) => {
  try {
    const m = await findOne('matches', { _id: req.params.id });
    if (!m) return res.status(404).json({ error: 'Not found' });
    const em = await enrichMatch(m);
    const rawEvents = await find('events', { match_id: m._id });
    rawEvents.sort((a,b) => (a.minute||0) - (b.minute||0));
    const events = await Promise.all(rawEvents.map(async e => {
      const player = e.player_id ? await findOne('players', { _id: e.player_id }) : null;
      const team   = e.team_id   ? await findOne('teams',   { _id: e.team_id })   : null;
      return { ...e, player_name: player?.name, team_name: team?.name, team_code: team?.code };
    }));
    res.json({ ...em, events });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT update result
router.put('/:id/result', async (req, res) => {
  try {
    const { home_score, away_score, home_penalties, away_penalties, status } = req.body;
    await update('matches', { _id: req.params.id }, { $set: { home_score, away_score, home_penalties: home_penalties??null, away_penalties: away_penalties??null, status: status||'finished' } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT update status
router.put('/:id/status', async (req, res) => {
  try {
    await update('matches', { _id: req.params.id }, { $set: { status: req.body.status } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST add event
router.post('/:id/events', async (req, res) => {
  try {
    const { player_id, team_id, event_type, minute, extra_minute } = req.body;
    const doc = await insert('events', { match_id: req.params.id, player_id: player_id||null, team_id, event_type, minute: +minute, extra_minute: extra_minute||null });
    res.json({ id: doc._id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE event
router.delete('/events/:eventId', async (req, res) => {
  try {
    await remove('events', { _id: req.params.eventId });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST create knockout match
router.post('/knockout', async (req, res) => {
  try {
    const { home_team_id, away_team_id, stage, match_date, venue_id, knockout_round, bracket_slot } = req.body;
    const doc = await insert('matches', { home_team_id, away_team_id, stage, match_date, venue_id, status:'scheduled', knockout_round, bracket_slot, group_id:null, home_score:null, away_score:null, home_penalties:null, away_penalties:null });
    res.json({ id: doc._id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
