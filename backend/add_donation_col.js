const mysql = require('mysql2/promise');

async function addCol() {
    const config = {
        host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
        user: '4Wjck5EzKvQMVJh.root',
        password: 'rhgEqQTdbN73wMqw',
        database: 'test',
        port: 4000,
        ssl: { rejectUnauthorized: false }
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('--- Adding donation_count to donors table ---');
        
        // 1. Add the column
        try {
            await connection.execute('ALTER TABLE donors ADD COLUMN donation_count INT DEFAULT 0');
            console.log('SUCCESS: donation_count column added.');
        } catch (e) {
            console.log('NOTICE: Column might already exist:', e.message);
        }

        // 2. Initialize existing rows to 0 if null
        await connection.execute('UPDATE donors SET donation_count = 0 WHERE donation_count IS NULL');
        console.log('SUCCESS: Initialized counts to 0.');

        await connection.end();
        console.log('DONE!');
    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

addCol();
