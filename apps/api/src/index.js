require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const express = require('express');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use('/api', require('./routes/invoice'));

app.listen(3000, () => console.log('API running on :3000'));
