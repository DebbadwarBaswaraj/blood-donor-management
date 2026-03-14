const express = require('express');
const db = require('../db');
const router = express.Router();

// Get all available donors with dynamic availability check
router.get('/', async (req, res) => {
    try {
        // Automatically set availability to 'Available' if next_available_date is past
        await db.execute("UPDATE donors SET availability = 'Available' WHERE next_available_date IS NOT NULL AND next_available_date <= CURDATE() AND availability = 'Not Available'");

        const [donors] = await db.execute(`
            SELECT d.*, u.username, u.email 
            FROM donors d 
            JOIN users u ON d.user_id = u.id 
            WHERE u.role = 'Donor'
        `);
        res.json(donors);
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// ── Gender-aware Donor Dashboard endpoint ─────────────────────────────
// Supports /dashboard (via query ?userId=X)
router.get('/dashboard', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    return handleDashboard(userId, res);
});

// Supports /dashboard/:userId
router.get('/dashboard/:userId', async (req, res) => {
    const { userId } = req.params;
    return handleDashboard(userId, res);
});

async function handleDashboard(userId, res) {
    try {
        // 1. Fetch donor profile
        const [donorRows] = await db.execute(
            `SELECT d.*, u.username, u.email 
             FROM donors d 
             JOIN users u ON d.user_id = u.id 
             WHERE d.user_id = ?`, [userId]
        );
        if (donorRows.length === 0) {
            return res.status(404).json({ error: 'Donor profile not found' });
        }
        const donor = donorRows[0];

        // 2. Sync from donation history to be robust
        const [historyRows] = await db.execute(
            'SELECT MAX(donation_date) as last_date, COUNT(*) as total FROM donations WHERE donor_id = ?',
            [donor.donor_id]
        );
        const lastDonationFromHistory = historyRows[0].last_date;
        const donationCount = historyRows[0].total;

        // Update the donors table if history is more accurate
        if (donationCount !== (donor.donation_count || 0)) {
            await db.execute('UPDATE donors SET donation_count = ? WHERE donor_id = ?', [donationCount, donor.donor_id]);
        }

        // 3. Gender-based waiting period (60 for Male, 90 for Female)
        const gender = (donor.gender || 'Male').trim();
        const waitDays = (gender.toLowerCase() === 'female') ? 90 : 60;

        // 4. Calculate Eligibility
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let eligibilityStatus = 'Eligible';
        let nextAvailableDateStr = 'Available Now';
        let rawLastDate = lastDonationFromHistory || donor.last_donation_date;

        if (rawLastDate) {
            const lastDate = new Date(rawLastDate);
            lastDate.setHours(0, 0, 0, 0);

            const nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + waitDays);
            
            const nextDateStr = nextDate.toISOString().split('T')[0];

            if (today < nextDate) {
                eligibilityStatus = 'Not Eligible';
                nextAvailableDateStr = nextDateStr;
            }
        }

        // Return exact structure requested by user
        res.json({
            donation_count: donationCount,
            gender: gender,
            last_donation_date: rawLastDate ? new Date(rawLastDate).toISOString().split('T')[0] : null,
            next_available_date: nextAvailableDateStr,
            eligibility_status: eligibilityStatus
        });

    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch donor dashboard: ' + err.message });
    }
}



// Search donors with AI Smart Recommendation Scoring
router.get('/search', async (req, res) => {
    try {
        await db.execute("UPDATE donors SET availability = 'Available' WHERE next_available_date IS NOT NULL AND next_available_date <= CURDATE() AND availability = 'Not Available'");

        const { blood_group, bloodGroup, city, availability } = req.query;
        let query = `
            SELECT d.*, u.username, u.email 
            FROM donors d 
            JOIN users u ON d.user_id = u.id 
            WHERE u.role = 'Donor'
        `;
        
        const [donors] = await db.execute(query);
        const searchBg = blood_group || bloodGroup;
        const searchCity = city ? city.toLowerCase().trim() : '';
        const searchAvail = availability;

        // Calculate AI Recommendation Score
        const rankedDonors = donors.map(donor => {
            let score = 0;

            // 1. Blood group match
            if (searchBg && donor.blood_group === searchBg) {
                score += 50;
            }

            // 2. Location match
            if (searchCity && donor.city) {
                const donorCity = donor.city.toLowerCase().trim();
                if (donorCity === searchCity) {
                    score += 30;
                } else if (donorCity.includes(searchCity) || searchCity.includes(donorCity)) {
                    score += 10;
                }
            }

            // 3. Donor availability
            if (donor.availability === 'Available') {
                score += 20;
            } else {
                score -= 10;
            }
            
            // If they explicitly requested a specific availability status, maybe bump the score slightly more
            if (searchAvail && donor.availability === searchAvail) {
                score += 10;
            }

            // 4. Last donation date (Eligibility)
            let isEligible = true;
            if (donor.next_available_date) {
                const today = new Date();
                today.setHours(0,0,0,0);
                const nextDate = new Date(donor.next_available_date);
                if (nextDate > today) isEligible = false;
            }
            
            if (isEligible) {
                score += 10;
            } else {
                score -= 20; // Donated recently
            }

            return { ...donor, recommendationScore: score };
        });

        // 5. Sort descending
        rankedDonors.sort((a, b) => b.recommendationScore - a.recommendationScore);

        res.json(rankedDonors);
    } catch (err) {
        res.status(500).json({ error: 'Search failed: ' + err.message });
    }
});

// Update donation date
router.put('/:userId/donate', async (req, res) => {
    try {
        const { userId } = req.params;
        const { donationDate } = req.body;

        if (!donationDate) {
            return res.status(400).json({ error: 'Donation date is required' });
        }

        // Get donor_id, gender, and current count for this user
        const [donorRows] = await db.execute('SELECT donor_id, full_name, gender, donation_count FROM donors WHERE user_id = ?', [userId]);
        if (donorRows.length === 0) {
            return res.status(404).json({ error: 'Donor profile not found' });
        }
        const donor = donorRows[0];
        const donorId = donor.donor_id;
        const gender = (donor.gender || 'Male').trim().toLowerCase();
        const currentCount = donor.donation_count || 0;

        const dateObj = new Date(donationDate);
        // Gender-aware eligibility: 60 days for Male, 90 days for Female
        if (gender === 'female') {
            dateObj.setDate(dateObj.getDate() + 90);
        } else {
            dateObj.setDate(dateObj.getDate() + 60);
        }
        const nextAvailable = dateObj.toISOString().split('T')[0];

        // Start a transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Update donor status and increment donation_count
            await connection.execute(
                "UPDATE donors SET last_donation_date = ?, next_available_date = ?, donation_count = ?, availability = 'Not Available' WHERE donor_id = ?",
                [donationDate, nextAvailable, currentCount + 1, donorId]
            );

            // 2. Insert into donations history
            const { hospitalName = 'General Hospital', units = 1, notes = '' } = req.body;
            await connection.execute(
                "INSERT INTO donations (donor_id, hospital_name, donation_date, units_donated, notes) VALUES (?, ?, ?, ?, ?)",
                [donorId, hospitalName, donationDate, units, notes]
            );

            await connection.commit();
            res.json({ message: 'Donation recorded successfully', nextAvailable, newCount: currentCount + 1 });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to record donation: ' + err.message });
    }
});

// Update Donor Availability Status (Admin/Self)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { availability } = req.body;
        
        if (!['Available', 'Not Available'].includes(availability)) {
            return res.status(400).json({ error: 'Invalid availability status.' });
        }

        await db.execute('UPDATE donors SET availability = ? WHERE donor_id = ?', [availability, id]);
        res.json({ message: 'Donor status updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status: ' + err.message });
    }
});

// Delete Donor (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Start transaction in case we need to delete dependencies
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Unlink donor from user, delete donor profile
            // If deleting donor, we should normally restrict deleting if there's history,
            // or we delete history first.
            await connection.execute('DELETE FROM appointments WHERE donor_id = ?', [id]);
            await connection.execute('DELETE FROM donations WHERE donor_id = ?', [id]);
            await connection.execute('DELETE FROM donors WHERE donor_id = ?', [id]);
            
            await connection.commit();
            res.json({ message: 'Donor deleted successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete donor: ' + err.message });
    }
});

module.exports = router;
