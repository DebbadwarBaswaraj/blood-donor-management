const express = require('express');
const db = require('../db');
const router = express.Router();

// Get notifications (matching requests) for a donor
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Get user's blood group
        const [donors] = await db.execute('SELECT blood_group FROM donors WHERE user_id = ?', [userId]);
        if (donors.length === 0) {
            return res.json([]); // Not a donor
        }
        const bloodGroup = donors[0].blood_group;

        // Get matching requests from last 7 days
        const [requests] = await db.execute(
            'SELECT * FROM emergency_requests WHERE blood_group_needed = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC',
            [bloodGroup]
        );
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notifications: ' + err.message });
    }
});

module.exports = router;
