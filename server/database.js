const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schemas
const GroupSchema = new mongoose.Schema({ name: String });
const TeamSchema = new mongoose.Schema({
  name: String, code: String, group: String, confederation: String, flag: String,
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
});
const VenueSchema = new mongoose.Schema({ name: String, city: String, country: String, capacity: Number });
const MatchSchema = new mongoose.Schema({
  home_team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  away_team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  stage: String, match_date: String, venue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  home_score: Number, away_score: Number, home_penalties: Number, away_penalties: Number,
  status: String, knockout_round: String, bracket_slot: Number
});
const PlayerSchema = new mongoose.Schema({ team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, name: String, position: String, jersey_number: Number });
const EventSchema = new mongoose.Schema({
  match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  event_type: String, minute: Number, extra_minute: Number
});

// Models
const models = {
  groups:  mongoose.model('Group', GroupSchema),
  teams:   mongoose.model('Team', TeamSchema),
  venues:  mongoose.model('Venue', VenueSchema),
  matches: mongoose.model('Match', MatchSchema),
  players: mongoose.model('Player', PlayerSchema),
  events:  mongoose.model('Event', EventSchema),
};

// Promisify-compatible helpers (keeping same signature for existing routes)
const find = async (col, q = {}) => {
  return await models[col].find(q).lean();
};

const findOne = async (col, q) => {
  return await models[col].findOne(q).lean();
};

const insert = async (col, doc) => {
  const newDoc = new models[col](doc);
  return await newDoc.save();
};

const update = async (col, q, u) => {
  // Handle $set vs direct update
  const updateData = u.$set || u;
  return await models[col].updateMany(q, updateData);
};

const remove = async (col, q) => {
  return await models[col].deleteMany(q);
};

const count = async (col, q = {}) => {
  return await models[col].countDocuments(q);
};

async function seed() {
  const n = await count('groups');
  if (n > 0) return;

  console.log('🌱 Seeding MongoDB database...');

  // Groups A-L
  const groupNames = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const groupDocs = [];
  for (const name of groupNames) {
    groupDocs.push(await insert('groups', { name }));
  }
  const groupMap = {};
  groupDocs.forEach(g => { groupMap[g.name] = g._id; });

  // Venues
  const venueList = [
    { name:'MetLife Stadium', city:'New York/NJ', country:'USA', capacity:82500 },
    { name:'AT&T Stadium', city:'Dallas', country:'USA', capacity:80000 },
    { name:'SoFi Stadium', city:'Los Angeles', country:'USA', capacity:70240 },
    { name:'Hard Rock Stadium', city:'Miami', country:'USA', capacity:65326 },
    { name:"Levi's Stadium", city:'San Francisco', country:'USA', capacity:68500 },
    { name:'Gillette Stadium', city:'Boston', country:'USA', capacity:65878 },
    { name:'Empower Field', city:'Denver', country:'USA', capacity:76125 },
    { name:'NRG Stadium', city:'Houston', country:'USA', capacity:72220 },
    { name:'Allegiant Stadium', city:'Las Vegas', country:'USA', capacity:65000 },
    { name:'Estadio Azteca', city:'Mexico City', country:'Mexico', capacity:87523 },
    { name:'Estadio Akron', city:'Guadalajara', country:'Mexico', capacity:49850 },
    { name:'Estadio BBVA', city:'Monterrey', country:'Mexico', capacity:53500 },
    { name:'BC Place', city:'Vancouver', country:'Canada', capacity:54500 },
    { name:'BMO Field', city:'Toronto', country:'Canada', capacity:45736 },
    { name:'Commonwealth Stadium', city:'Edmonton', country:'Canada', capacity:56302 },
    { name:'Stade Olympique', city:'Montreal', country:'Canada', capacity:56000 },
  ];
  const venueDocs = [];
  for (const v of venueList) {
    venueDocs.push(await insert('venues', v));
  }
  const vIds = venueDocs.map(v => v._id);

  // Teams
  const teamList = [
    { name:'Mexico', code:'MEX', group:'A', confederation:'CONCACAF', flag:'mx' },
    { name:'Ecuador', code:'ECU', group:'A', confederation:'CONMEBOL', flag:'ec' },
    { name:'Serbia', code:'SRB', group:'A', confederation:'UEFA', flag:'rs' },
    { name:'Nigeria', code:'NGA', group:'A', confederation:'CAF', flag:'ng' },
    { name:'United States', code:'USA', group:'B', confederation:'CONCACAF', flag:'us' },
    { name:'Panama', code:'PAN', group:'B', confederation:'CONCACAF', flag:'pa' },
    { name:'Germany', code:'GER', group:'B', confederation:'UEFA', flag:'de' },
    { name:'Morocco', code:'MAR', group:'B', confederation:'CAF', flag:'ma' },
    { name:'Canada', code:'CAN', group:'C', confederation:'CONCACAF', flag:'ca' },
    { name:'Honduras', code:'HON', group:'C', confederation:'CONCACAF', flag:'hn' },
    { name:'France', code:'FRA', group:'C', confederation:'UEFA', flag:'fr' },
    { name:'Japan', code:'JPN', group:'C', confederation:'AFC', flag:'jp' },
    { name:'Argentina', code:'ARG', group:'D', confederation:'CONMEBOL', flag:'ar' },
    { name:'Spain', code:'ESP', group:'D', confederation:'UEFA', flag:'es' },
    { name:'Jamaica', code:'JAM', group:'D', confederation:'CONCACAF', flag:'jm' },
    { name:'South Africa', code:'RSA', group:'D', confederation:'CAF', flag:'za' },
    { name:'Brazil', code:'BRA', group:'E', confederation:'CONMEBOL', flag:'br' },
    { name:'England', code:'ENG', group:'E', confederation:'UEFA', flag:'gb-eng' },
    { name:'Costa Rica', code:'CRC', group:'E', confederation:'CONCACAF', flag:'cr' },
    { name:'Ivory Coast', code:'CIV', group:'E', confederation:'CAF', flag:'ci' },
    { name:'Colombia', code:'COL', group:'F', confederation:'CONMEBOL', flag:'co' },
    { name:'Netherlands', code:'NED', group:'F', confederation:'UEFA', flag:'nl' },
    { name:'Egypt', code:'EGY', group:'F', confederation:'CAF', flag:'eg' },
    { name:'South Korea', code:'KOR', group:'F', confederation:'AFC', flag:'kr' },
    { name:'Uruguay', code:'URU', group:'G', confederation:'CONMEBOL', flag:'uy' },
    { name:'Italy', code:'ITA', group:'G', confederation:'UEFA', flag:'it' },
    { name:'Senegal', code:'SEN', group:'G', confederation:'CAF', flag:'sn' },
    { name:'Saudi Arabia', code:'KSA', group:'G', confederation:'AFC', flag:'sa' },
    { name:'Venezuela', code:'VEN', group:'H', confederation:'CONMEBOL', flag:'ve' },
    { name:'Belgium', code:'BEL', group:'H', confederation:'UEFA', flag:'be' },
    { name:'Ghana', code:'GHA', group:'H', confederation:'CAF', flag:'gh' },
    { name:'Australia', code:'AUS', group:'H', confederation:'AFC', flag:'au' },
    { name:'Portugal', code:'POR', group:'I', confederation:'UEFA', flag:'pt' },
    { name:'Croatia', code:'CRO', group:'I', confederation:'UEFA', flag:'hr' },
    { name:'Cameroon', code:'CMR', group:'I', confederation:'CAF', flag:'cm' },
    { name:'Iran', code:'IRN', group:'I', confederation:'AFC', flag:'ir' },
    { name:'Chile', code:'CHI', group:'J', confederation:'CONMEBOL', flag:'cl' },
    { name:'Switzerland', code:'SUI', group:'J', confederation:'UEFA', flag:'ch' },
    { name:'Mali', code:'MLI', group:'J', confederation:'CAF', flag:'ml' },
    { name:'Jordan', code:'JOR', group:'J', confederation:'AFC', flag:'jo' },
    { name:'Turkey', code:'TUR', group:'K', confederation:'UEFA', flag:'tr' },
    { name:'Poland', code:'POL', group:'K', confederation:'UEFA', flag:'pl' },
    { name:'Niger', code:'NIR', group:'K', confederation:'CAF', flag:'ne' },
    { name:'Uzbekistan', code:'UZB', group:'K', confederation:'AFC', flag:'uz' },
    { name:'Denmark', code:'DEN', group:'L', confederation:'UEFA', flag:'dk' },
    { name:'Austria', code:'AUT', group:'L', confederation:'UEFA', flag:'at' },
    { name:'Hungary', code:'HUN', group:'L', confederation:'UEFA', flag:'hu' },
    { name:'New Zealand', code:'NZL', group:'L', confederation:'OFC', flag:'nz' },
  ];

  const teamDocs = [];
  for (const t of teamList) {
    teamDocs.push(await insert('teams', { ...t, group_id: groupMap[t.group] }));
  }
  const teamMap = {};
  teamDocs.forEach(t => { teamMap[t.code] = t._id; });

  // Group stage matches
  const matchups = [
    {h:'MEX',a:'SRB',g:'A',date:'2026-06-11',vi:9},{h:'ECU',a:'NGA',g:'A',date:'2026-06-11',vi:10},
    {h:'MEX',a:'ECU',g:'A',date:'2026-06-15',vi:11},{h:'SRB',a:'NGA',g:'A',date:'2026-06-15',vi:9},
    {h:'MEX',a:'NGA',g:'A',date:'2026-06-19',vi:10},{h:'ECU',a:'SRB',g:'A',date:'2026-06-19',vi:11},
    {h:'USA',a:'PAN',g:'B',date:'2026-06-12',vi:0},{h:'GER',a:'MAR',g:'B',date:'2026-06-12',vi:1},
    {h:'USA',a:'GER',g:'B',date:'2026-06-16',vi:2},{h:'PAN',a:'MAR',g:'B',date:'2026-06-16',vi:0},
    {h:'USA',a:'MAR',g:'B',date:'2026-06-20',vi:1},{h:'GER',a:'PAN',g:'B',date:'2026-06-20',vi:2},
    {h:'CAN',a:'HON',g:'C',date:'2026-06-12',vi:12},{h:'FRA',a:'JPN',g:'C',date:'2026-06-12',vi:13},
    {h:'CAN',a:'FRA',g:'C',date:'2026-06-16',vi:12},{h:'HON',a:'JPN',g:'C',date:'2026-06-16',vi:13},
    {h:'CAN',a:'JPN',g:'C',date:'2026-06-20',vi:12},{h:'FRA',a:'HON',g:'C',date:'2026-06-20',vi:13},
    {h:'ARG',a:'RSA',g:'D',date:'2026-06-13',vi:3},{h:'ESP',a:'JAM',g:'D',date:'2026-06-13',vi:4},
    {h:'ARG',a:'ESP',g:'D',date:'2026-06-17',vi:5},{h:'JAM',a:'RSA',g:'D',date:'2026-06-17',vi:3},
    {h:'ARG',a:'JAM',g:'D',date:'2026-06-21',vi:4},{h:'ESP',a:'RSA',g:'D',date:'2026-06-21',vi:5},
    {h:'BRA',a:'CRC',g:'E',date:'2026-06-13',vi:6},{h:'ENG',a:'CIV',g:'E',date:'2026-06-13',vi:7},
    {h:'BRA',a:'ENG',g:'E',date:'2026-06-17',vi:8},{h:'CRC',a:'CIV',g:'E',date:'2026-06-17',vi:6},
    {h:'BRA',a:'CIV',g:'E',date:'2026-06-21',vi:7},{h:'ENG',a:'CRC',g:'E',date:'2026-06-21',vi:8},
    {h:'COL',a:'EGY',g:'F',date:'2026-06-14',vi:0},{h:'NED',a:'KOR',g:'F',date:'2026-06-14',vi:1},
    {h:'COL',a:'NED',g:'F',date:'2026-06-18',vi:2},{h:'EGY',a:'KOR',g:'F',date:'2026-06-18',vi:0},
    {h:'COL',a:'KOR',g:'F',date:'2026-06-22',vi:1},{h:'NED',a:'EGY',g:'F',date:'2026-06-22',vi:2},
    {h:'URU',a:'SEN',g:'G',date:'2026-06-14',vi:3},{h:'ITA',a:'KSA',g:'G',date:'2026-06-14',vi:4},
    {h:'URU',a:'ITA',g:'G',date:'2026-06-18',vi:5},{h:'SEN',a:'KSA',g:'G',date:'2026-06-18',vi:3},
    {h:'URU',a:'KSA',g:'G',date:'2026-06-22',vi:4},{h:'ITA',a:'SEN',g:'G',date:'2026-06-22',vi:5},
    {h:'VEN',a:'GHA',g:'H',date:'2026-06-15',vi:6},{h:'BEL',a:'AUS',g:'H',date:'2026-06-15',vi:7},
    {h:'VEN',a:'BEL',g:'H',date:'2026-06-19',vi:8},{h:'GHA',a:'AUS',g:'H',date:'2026-06-19',vi:6},
    {h:'VEN',a:'AUS',g:'H',date:'2026-06-23',vi:7},{h:'BEL',a:'GHA',g:'H',date:'2026-06-23',vi:8},
    {h:'POR',a:'CMR',g:'I',date:'2026-06-15',vi:9},{h:'CRO',a:'IRN',g:'I',date:'2026-06-15',vi:10},
    {h:'POR',a:'CRO',g:'I',date:'2026-06-19',vi:11},{h:'CMR',a:'IRN',g:'I',date:'2026-06-19',vi:9},
    {h:'POR',a:'IRN',g:'I',date:'2026-06-23',vi:10},{h:'CRO',a:'CMR',g:'I',date:'2026-06-23',vi:11},
    {h:'CHI',a:'JOR',g:'J',date:'2026-06-16',vi:0},{h:'SUI',a:'MLI',g:'J',date:'2026-06-16',vi:1},
    {h:'CHI',a:'SUI',g:'J',date:'2026-06-20',vi:2},{h:'JOR',a:'MLI',g:'J',date:'2026-06-20',vi:0},
    {h:'CHI',a:'MLI',g:'J',date:'2026-06-24',vi:1},{h:'SUI',a:'JOR',g:'J',date:'2026-06-24',vi:2},
    {h:'TUR',a:'NIR',g:'K',date:'2026-06-16',vi:3},{h:'POL',a:'UZB',g:'K',date:'2026-06-16',vi:4},
    {h:'TUR',a:'POL',g:'K',date:'2026-06-20',vi:5},{h:'UZB',a:'NIR',g:'K',date:'2026-06-20',vi:3},
    {h:'TUR',a:'UZB',g:'K',date:'2026-06-24',vi:4},{h:'POL',a:'NIR',g:'K',date:'2026-06-24',vi:5},
    {h:'DEN',a:'HUN',g:'L',date:'2026-06-17',vi:12},{h:'AUT',a:'NZL',g:'L',date:'2026-06-17',vi:13},
    {h:'DEN',a:'AUT',g:'L',date:'2026-06-21',vi:14},{h:'HUN',a:'NZL',g:'L',date:'2026-06-21',vi:12},
    {h:'DEN',a:'NZL',g:'L',date:'2026-06-25',vi:13},{h:'AUT',a:'HUN',g:'L',date:'2026-06-25',vi:14},
  ];

  for (const m of matchups) {
    await insert('matches', {
      home_team_id: teamMap[m.h],
      away_team_id: teamMap[m.a],
      group_id: groupMap[m.g],
      stage: 'group',
      match_date: m.date,
      venue_id: vIds[m.vi] || vIds[0],
      home_score: null, away_score: null,
      home_penalties: null, away_penalties: null,
      status: 'scheduled',
      knockout_round: null,
      bracket_slot: null
    });
  }

  console.log('✅ MongoDB database seeded!');
}

module.exports = { models, find, findOne, insert, update, remove, count, seed };
