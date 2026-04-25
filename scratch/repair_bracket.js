const { models, find, update, insert, findOne } = require('../server/database');

async function fix() {
  try {
    const matches = await find('matches', { stage: { $ne: 'group' }, status: 'finished' });
    console.log(`Found ${matches.length} finished knockout matches`);

    for (const m of matches) {
      const homeWin = (m.home_score > m.away_score) || (m.home_penalties && m.home_penalties > m.away_penalties);
      const winnerId = homeWin ? m.home_team_id : m.away_team_id;
      const loserId = homeWin ? m.away_team_id : m.home_team_id;

      let nextRound = null;
      let nextSlot = Math.ceil(m.bracket_slot / 2);
      let side = m.bracket_slot % 2 === 1 ? 'home_team_id' : 'away_team_id';

      if (m.stage === 'r32') nextRound = 'r16';
      else if (m.stage === 'r16') nextRound = 'qf';
      else if (m.stage === 'qf') nextRound = 'sf';
      else if (m.stage === 'sf') {
        // Final & Third place
        for (const target of [{r:'final', id: winnerId}, {r:'third', id: loserId}]) {
          let tm = await findOne('matches', { knockout_round: target.r, bracket_slot: 1 });
          if (!tm) {
            console.log(`Creating ${target.r}`);
            tm = await insert('matches', { home_team_id: null, away_team_id: null, stage: target.r, status: 'scheduled', knockout_round: target.r, bracket_slot: 1, match_date: '2026-07-19' });
          }
          await update('matches', { _id: tm._id }, { $set: { [side]: target.id } });
        }
        continue;
      }

      if (nextRound) {
        let nm = await findOne('matches', { knockout_round: nextRound, bracket_slot: nextSlot });
        if (!nm) {
          console.log(`Creating ${nextRound} slot ${nextSlot}`);
          nm = await insert('matches', { home_team_id: null, away_team_id: null, stage: nextRound, status: 'scheduled', knockout_round: nextRound, bracket_slot: nextSlot, match_date: '2026-07-10' });
        }
        await update('matches', { _id: nm._id }, { $set: { [side]: winnerId } });
      }
    }
    console.log('✅ Repair complete!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

fix();
