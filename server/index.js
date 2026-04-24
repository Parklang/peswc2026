const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Init DB + seed
const { seed } = require('./database');
seed().catch(console.error);

// Routes
app.use('/api/groups',    require('./routes/groups'));
app.use('/api/matches',   require('./routes/matches'));
app.use('/api/standings', require('./routes/standings').router);
app.use('/api/stats',     require('./routes/stats'));
app.use('/api/knockout',  require('./routes/knockout'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌍 World Cup 2026 Manager → http://localhost:${PORT}\n`);
});
