const mysql = require('mysql2/promise');

async function checkDatabases() {
    const config = {
        host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
        user: '4Wjck5EzKvQMVJh.root',
        password: 'rhgEqQTdbN73wMqw',
        port: 4000,
        ssl: {
            rejectUnauthorized: false
        }
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('--- Checking available databases ---');
        const [rows] = await connection.query('SHOW DATABASES');
        console.log('Databases:', rows.map(r => r.Database).join(', '));
        await connection.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkDatabases();
