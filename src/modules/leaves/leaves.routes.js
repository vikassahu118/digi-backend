// backend/src/modules/leaves/leaves.routes.js

const router = require('express').Router();
const { pool } = require('../../config/db');
const { authMiddleware, adminMiddleware } = require('../../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/leave_documents');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Employee API to apply for leave
// POST /api/leaves/apply
router.post('/apply', authMiddleware, upload.single('document'), async (req, res) => {
    const { startDate, endDate, reason } = req.body;
    const userId = req.user.id;
    const documentPath = req.file ? req.file.path : null;

    try {
        await pool.query(
            'INSERT INTO leaves (user_id, start_date, end_date, reason, status, document_path) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, startDate, endDate, reason, 'PENDING', documentPath]
        );
        res.status(201).json({ message: 'Leave application submitted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Employee API to view personal leave applications
// GET /api/leaves/me
router.get('/me', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query('SELECT * FROM leaves WHERE user_id = $1 ORDER BY id DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin API to view all leave applications
// GET /api/leaves/admin
router.get('/admin', [authMiddleware, adminMiddleware], async (req, res) => {
    const { from, to, employeeId } = req.query;
    try {
        let query = `
            SELECT l.*, u.name AS employee_name, u.employee_id, u.email AS employee_email
            FROM leaves l
            JOIN users u ON l.user_id = u.id
        `;
        const params = [];
        const conditions = [];
        let index = 1;

        if (from) {
            conditions.push(`l.start_date >= $${index++}`);
            params.push(from);
        }
        if (to) {
            conditions.push(`l.end_date <= $${index++}`);
            params.push(to);
        }
        if (employeeId) {
            const userResult = await pool.query('SELECT id FROM users WHERE employee_id = $1', [employeeId]);
            if (userResult.rowCount > 0) {
                const userId = userResult.rows[0].id;
                conditions.push(`l.user_id = $${index++}`);
                params.push(userId);
            }
        }
        
        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }
        
        query += ` ORDER BY l.id DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin API to approve or reject a leave application
// PUT /api/leaves/admin/:id/status
router.put('/admin/:id/status', [authMiddleware, adminMiddleware], async (req, res) => {
    const leaveId = req.params.id;
    const { status } = req.body;
    const adminId = req.user.id;

    if (status !== 'APPROVED' && status !== 'REJECTED') {
        return res.status(400).json({ error: 'Invalid status provided. Must be APPROVED or REJECTED.' });
    }

    try {
        const result = await pool.query(
            'UPDATE leaves SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 RETURNING *',
            [status, adminId, leaveId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Leave request not found.' });
        }

        res.json({ message: `Leave request ${status.toLowerCase()} successfully.`, leave: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;