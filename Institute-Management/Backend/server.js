const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const initDb = require('./config/initDb');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => res.json({ status: 'Server healthy' }));

const PORT = process.env.PORT || 5000;

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
    });
});