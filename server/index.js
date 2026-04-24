const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
const publicPath = path.resolve(__dirname, '..', 'public');
app.use(express.static(publicPath));

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
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌍 World Cup 2026 Manager → http://localhost:${PORT}\n`);
});
