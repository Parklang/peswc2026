const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    await seed().catch(console.error);
  })
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

// Helpers
const find = async (col, q = {}) => await models[col].find(q).lean();
const findOne = async (col, q) => await models[col].findOne(q).lean();
const insert = async (col, doc) => { const n = new models[col](doc); return await n.save(); };
const update = async (col, q, u) => await models[col].updateMany(q, u.$set || u);
const remove = async (col, q) => await models[col].deleteMany(q);
const count = async (col, q = {}) => await models[col].countDocuments(q);

async function seed() {
  const n = await count('groups');
  if (n > 0) return;

  console.log('🌱 Đang nạp bảng đấu chính thức vào MongoDB...');

  const groupNames = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const groupDocs = [];
  for (const name of groupNames) { groupDocs.push(await insert('groups', { name })); }
  const groupMap = {};
  groupDocs.forEach(g => { groupMap[g.name] = g._id; });

  const venueList = [
    { name:'MetLife Stadium', city:'New York/NJ', country:'USA' },
    { name:'Azteca', city:'Mexico City', country:'Mexico' },
    { name:'BC Place', city:'Vancouver', country:'Canada' }
  ];
  const vDocs = [];
  for (const v of venueList) { vDocs.push(await insert('venues', v)); }

  const teamList = [
    // Bảng A
    { name:'Mexico', code:'MEX', group:'A', flag:'mx' }, { name:'Nam Phi', code:'RSA', group:'A', flag:'za' },
    { name:'Hàn Quốc', code:'KOR', group:'A', flag:'kr' }, { name:'Séc', code:'CZE', group:'A', flag:'cz' },
    // Bảng B
    { name:'Canada', code:'CAN', group:'B', flag:'ca' }, { name:'Bosnia', code:'BIH', group:'B', flag:'ba' },
    { name:'Qatar', code:'QAT', group:'B', flag:'qa' }, { name:'Thụy Sĩ', code:'SUI', group:'B', flag:'ch' },
    // Bảng C
    { name:'Brasil', code:'BRA', group:'C', flag:'br' }, { name:'Maroc', code:'MAR', group:'C', flag:'ma' },
    { name:'Haiti', code:'HAI', group:'C', flag:'ht' }, { name:'Scotland', code:'SCO', group:'C', flag:'gb-sct' },
    // Bảng D
    { name:'Hoa Kỳ', code:'USA', group:'D', flag:'us' }, { name:'Paraguay', code:'PAR', group:'D', flag:'py' },
    { name:'Úc', code:'AUS', group:'D', flag:'au' }, { name:'Thổ Nhĩ Kỳ', code:'TUR', group:'D', flag:'tr' },
    // Bảng E
    { name:'Đức', code:'GER', group:'E', flag:'de' }, { name:'Curaçao', code:'CUW', group:'E', flag:'cw' },
    { name:'Bờ Biển Ngà', code:'CIV', group:'E', flag:'ci' }, { name:'Ecuador', code:'ECU', group:'E', flag:'ec' },
    // Bảng F
    { name:'Hà Lan', code:'NED', group:'F', flag:'nl' }, { name:'Nhật Bản', code:'JPN', group:'F', flag:'jp' },
    { name:'Thụy Điển', code:'SWE', group:'F', flag:'se' }, { name:'Tunisia', code:'TUN', group:'F', flag:'tn' },
    // Bảng G
    { name:'Bỉ', code:'BEL', group:'G', flag:'be' }, { name:'Ai Cập', code:'EGY', group:'G', flag:'eg' },
    { name:'Iran', code:'IRN', group:'G', flag:'ir' }, { name:'New Zealand', code:'NZL', group:'G', flag:'nz' },
    // Bảng H
    { name:'Tây Ban Nha', code:'ESP', group:'H', flag:'es' }, { name:'Cabo Verde', code:'CPV', group:'H', flag:'cv' },
    { name:'Ả Rập Xê Út', code:'KSA', group:'H', flag:'sa' }, { name:'Uruguay', code:'URU', group:'H', flag:'uy' },
    // Bảng I
    { name:'Pháp', code:'FRA', group:'I', flag:'fr' }, { name:'Sénégal', code:'SEN', group:'I', flag:'sn' },
    { name:'Iraq', code:'IRQ', group:'I', flag:'iq' }, { name:'Na Uy', code:'NOR', group:'I', flag:'no' },
    // Bảng J
    { name:'Argentina', code:'ARG', group:'J', flag:'ar' }, { name:'Algérie', code:'ALG', group:'J', flag:'dz' },
    { name:'Áo', code:'AUT', group:'J', flag:'at' }, { name:'Jordan', code:'JOR', group:'J', flag:'jo' },
    // Bảng K
    { name:'Bồ Đào Nha', code:'POR', group:'K', flag:'pt' }, { name:'CHDC Congo', code:'COD', group:'K', flag:'cd' },
    { name:'Uzbekistan', code:'UZB', group:'K', flag:'uz' }, { name:'Colombia', code:'COL', group:'K', flag:'co' },
    // Bảng L
    { name:'Anh', code:'ENG', group:'L', flag:'gb-eng' }, { name:'Croatia', code:'CRO', group:'L', flag:'hr' },
    { name:'Ghana', code:'GHA', group:'L', flag:'gh' }, { name:'Panama', code:'PAN', group:'L', flag:'pa' },
  ];

  const teamDocs = [];
  for (const t of teamList) { teamDocs.push(await insert('teams', { ...t, group_id: groupMap[t.group] })); }
  
  const teamsByGroup = {};
  teamDocs.forEach(t => { 
    if(!teamsByGroup[t.group]) teamsByGroup[t.group] = [];
    teamsByGroup[t.group].push(t);
  });

  const baseDate = new Date('2026-06-11');
  for (const gName of groupNames) {
    const ts = teamsByGroup[gName];
    const pairs = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];
    for (let i = 0; i < pairs.length; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + (groupNames.indexOf(gName) * 2) + Math.floor(i/2));
      await insert('matches', {
        home_team_id: ts[pairs[i][0]]._id, away_team_id: ts[pairs[i][1]]._id,
        group_id: groupMap[gName], stage: 'group', status: 'scheduled',
        match_date: d.toISOString().split('T')[0], venue_id: vDocs[i % vDocs.length]._id
      });
    }
  }
  console.log('✅ Đã nạp xong 48 đội và 104 trận đấu!');
}

module.exports = { models, find, findOne, insert, update, remove, count, seed };
