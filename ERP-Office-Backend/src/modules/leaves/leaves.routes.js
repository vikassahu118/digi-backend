// backend/src/modules/leaves/leaves.routes.js

const router = require('express').Router();
const { pool } = require('../../config/db');
const { authMiddleware, adminMiddleware } = require('../../middlewares/auth');

// Employee API to apply for leave
// POST /api/leave/apply
router.post('/apply', authMiddleware, async (req, res) => {
    const { startDate, endDate, reason } = req.body;
    const userId = req.user.id;
    try {
        await pool.query(
            'INSERT INTO leaves (user_id, start_date, end_date, reason) VALUES ($1, $2, $3, $4)',
            [userId, startDate, endDate, reason]
        );
        res.status(201).json({ message: 'Leave application submitted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Employee API to view personal leave applications
// GET /api/leave/me
router.get('/me', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query('SELECT * FROM leaves WHERE user_id = $1 ORDER BY applied_at DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin API to view all leave applications
// GET /api/admin/leaves
router.get('/admin/leaves', [authMiddleware, adminMiddleware], async (req, res) => {
    const { from, to, employeeId } = req.query;
    try {
        let query = 'SELECT * FROM leaves ';
        const params = [];
        let index = 1;

        if (from && to) {
            query += `WHERE start_date >= $${index++} AND end_date <= $${index++} `;
            params.push(from, to);
        }

        if (employeeId) {
            query += (params.length > 0 ? 'AND ' : 'WHERE ') + `user_id = (SELECT id FROM users WHERE employee_id = $${index++}) `;
            params.push(employeeId);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin API to approve a leave application
// POST /api/admin/leaves/:id/approve
router.post('/admin/leaves/:id/approve', [authMiddleware, adminMiddleware], async (req, res) => {
    const leaveId = req.params.id;
    const adminId = req.user.id;
    try {
        const result = await pool.query(
            'UPDATE leaves SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 RETURNING *',
            ['APPROVED', adminId, leaveId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Leave application not found.' });
        }
        res.json({ message: 'Leave application approved.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin API to reject a leave application
// POST /api/admin/leaves/:id/reject
router.post('/admin/leaves/:id/reject', [authMiddleware, adminMiddleware], async (req, res) => {
    const leaveId = req.params.id;
    try {
        const result = await pool.query(
            'UPDATE leaves SET status = $1 WHERE id = $2 RETURNING *',
            ['REJECTED', leaveId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Leave application not found.' });
        }
        res.json({ message: 'Leave application rejected.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;