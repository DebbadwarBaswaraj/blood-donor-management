const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [donorsCount] = await db.execute('SELECT COUNT(*) as total FROM donors');
        const [usersCount] = await db.execute('SELECT COUNT(*) as total FROM users');
        const [hospitalsCount] = await db.execute('SELECT COUNT(*) as total FROM hospitals');
        const [requestsCount] = await db.execute('SELECT COUNT(*) as total FROM emergency_requests');
        const [appointmentsCount] = await db.execute('SELECT COUNT(*) as total FROM appointments');
        const [bloodDist] = await db.execute('SELECT blood_group, COUNT(*) as count FROM donors GROUP BY blood_group');

        res.json({
            totalDonors: donorsCount[0].total,
            totalUsers: usersCount[0].total,
            totalHospitals: hospitalsCount[0].total,
            totalRequests: requestsCount[0].total,
            totalAppointments: appointmentsCount[0].total,
            bloodGroupDistribution: bloodDist
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats: ' + err.message });
    }
});

module.exports = router;
