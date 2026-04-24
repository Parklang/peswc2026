const express = require('express');
const router = express.Router();
const { find, findOne } = require('../database');

router.get('/', async (req, res) => {
  try {
    const groups = await find('groups');
    groups.sort((a,b) => a.name.localeCompare(b.name));
    const result = await Promise.all(groups.map(async g => {
      const teams = await find('teams', { group_id: g._id });
      teams.sort((a,b) => a.name.localeCompare(b.name));
      return { ...g, teams };
    }));
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const group = await findOne('groups', { _id: req.params.id });
    if (!group) return res.status(404).json({ error: 'Not found' });
    const teams = await find('teams', { group_id: group._id });
    res.json({ ...group, teams });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
