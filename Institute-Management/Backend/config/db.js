const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initial Connection Check
pool.connect()
    .then(client => {
        console.log('Connected to Neon PostgreSQL successfully!');
        client.release();
    })
    .catch(err => {
        console.error('Database Connection Failed:', err.message);
        process.exit(1);
    });

module.exports = pool;