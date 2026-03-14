const express = require('express');
const db = require('../db');
const router = express.Router();

// Get donation history for a specific user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get donor_id first
        const [donorRows] = await db.execute('SELECT donor_id FROM donors WHERE user_id = ?', [userId]);
        if (donorRows.length === 0) {
            return res.status(404).json({ error: 'Donor profile not found' });
        }
        const donorId = donorRows[0].donor_id;

        // Get history
        const [history] = await db.execute(
            'SELECT * FROM donations WHERE donor_id = ? ORDER BY donation_date DESC',
            [donorId]
        );

        // Calculate Stats & Badges
        const totalDonations = history.length;
        const totalUnits = history.reduce((sum, d) => sum + d.units_donated, 0);
        
        const badges = [];
        if (totalDonations >= 1) badges.push({ id: 'first_drop', name: 'First Drop', icon: '💧', desc: 'Completed first donation' });
        if (totalDonations >= 5) badges.push({ id: 'silver_donor', name: 'Silver Donor', icon: '🥈', desc: '5+ successful donations' });
        if (totalDonations >= 10) badges.push({ id: 'gold_donor', name: 'Gold Donor', icon: '🥇', desc: '10+ successful donations' });
        if (totalDonations >= 20) badges.push({ id: 'life_saver', name: 'Life Saver', icon: '🦸', desc: '20+ donations' });

        res.json({
            history,
            summary: {
                totalDonations,
                totalUnits
            },
            badges
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history: ' + err.message });
    }
});

module.exports = router;
