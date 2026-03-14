const mysql = require('mysql2');
const path = require('path');

// Load .env only in development; Render provides variables directly in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Enable SSL for production if provided; most cloud databases require it
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false // Common for self-signed certs in dev-cloud environments
    } : undefined
});

module.exports = pool.promise();
