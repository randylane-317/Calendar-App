require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const { initWebPush } = require('./services/push');
const { startScheduler } = require('./services/scheduler');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',   require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/push',   require('./routes/push'));

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

initWebPush();
startScheduler();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
