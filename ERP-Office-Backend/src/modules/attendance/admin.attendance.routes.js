const router = require('express').Router();
const { pool } = require('../../config/db');
const { authMiddleware, adminMiddleware } = require('../../middlewares/auth');
const { Parser } = require('@json2csv/plainjs');

// Admin daily dashboard
// GET /api/admin/attendance/dashboard/today
router.get('/dashboard/today', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usersWithAttendance = await pool.query(
      `SELECT
          u.id,
          u.name,
          u.employee_id,
          u.role,
          CASE WHEN a.check_in_at IS NOT NULL THEN TRUE ELSE FALSE END AS checked_in,
          a.status,
          a.check_in_at,
          a.check_out_at  -- Added check_out_at to the selection
       FROM
          users u
       LEFT JOIN
          attendance a ON u.id = a.user_id AND (a.check_in_at AT TIME ZONE 'UTC')::date = $1
       WHERE
          u.active = TRUE`,
      [today]
    );
    res.json(usersWithAttendance.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Admin route to approve attendance
// POST /api/admin/attendance/:id/approve
router.post('/:id/approve', [authMiddleware, adminMiddleware], async (req, res) => {
  const attendanceId = req.params.id;
  const adminId = req.user.id;
  try {
    const result = await pool.query('UPDATE attendance SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 RETURNING *', ['APPROVED', adminId, attendanceId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Attendance record not found.' });
    }
    res.json({ message: 'Attendance approved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin attendance reports
// GET /api/admin/attendance?from&to&employeeId
router.get('/', [authMiddleware, adminMiddleware], async (req, res) => {
  const { from, to, employeeId } = req.query;
  try {
    let query = `
      SELECT a.id, u.name, u.employee_id, u.role, a.check_in_at, a.check_out_at, a.status
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.check_in_at::date BETWEEN $1 AND $2
    `;
    const params = [from, to];
    if (employeeId) {
      query += ` AND u.employee_id = $3`;
      params.push(employeeId);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin export reports to CSV
// GET /api/admin/attendance/export.csv?from&to&employeeId
router.get('/export.csv', [authMiddleware, adminMiddleware], async (req, res) => {
  const { from, to, employeeId } = req.query;
  try {
    let query = `
      SELECT a.id, u.name, u.employee_id, u.role, a.check_in_at, a.check_out_at, a.status
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.check_in_at::date BETWEEN $1 AND $2
    `;
    const params = [from, to];
    if (employeeId) {
      query += ` AND u.employee_id = $3`;
      params.push(employeeId);
    }
    const result = await pool.query(query, params);
    
    const parser = new Parser();
    const csv = parser.parse(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('attendance_report.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;