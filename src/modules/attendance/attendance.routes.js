// backend/src/modules/attendance/attendance.routes.js

const router = require('express').Router();
const { pool } = require('../../config/db');
const { authMiddleware } = require('../../middlewares/auth');

// Employee attendance check-in route
// POST /api/attendance/check-in
router.post('/check-in', authMiddleware, async (req, res) => {
  const { id } = req.user;
  try {
    await pool.query('INSERT INTO attendance (user_id, check_in_at, status) VALUES ($1, NOW(), $2)', [id, 'PENDING']);
    res.status(201).json({ message: 'Check-in recorded successfully.' });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'You have already checked in today.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/attendance/check-out - Mark attendance as checked out

router.post('/check-out', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    try {
        const result = await pool.query(
            'UPDATE attendance SET check_out_at = NOW() WHERE user_id = $1 AND check_in_at::date = $2 RETURNING *',
            [userId, today]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Check-in record for today not found.' });
        }
        
        // Extract the updated row from the query result
        const updatedRecord = result.rows[0];

        // Send a success message along with the updated record, which includes the check-out time
        res.json({ 
            message: 'Check-out successful.',
            checkOutTime: updatedRecord.check_out_at // Use the check-out time returned from the database
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Employee personal attendance history route
// GET /api/attendance/me?from&to

// router.get('/me', authMiddleware, async (req, res) => {
//   const { from, to } = req.query;
//   const userId = req.user.id;

//   try {
//     const result = await pool.query(
//       'SELECT check_in_at, status, approved_at FROM attendance WHERE user_id = $1 AND check_in_at::date BETWEEN $2 AND $3 ORDER BY check_in_at DESC',
//       [userId, from, to]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

router.get("/me", authMiddleware, async (req, res) => {
  const { from, to } = req.query;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT check_in_at, check_out_at, status, approved_at
       FROM attendance
       WHERE user_id = $1
         AND check_in_at::date BETWEEN $2 AND $3
       ORDER BY check_in_at DESC`,
      [userId, from, to]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;