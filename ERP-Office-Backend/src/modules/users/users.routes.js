// backend/src/modules/users/users.routes.js

const router = require('express').Router();
const { pool } = require('../../config/db');
const { authMiddleware, adminMiddleware } = require('../../middlewares/auth');
const { hashPassword } = require('../../utils/bcrypt');

// Employee self-service route to get profile basics
// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT name, employee_id, role, email, phone, department, salary, date_hired, address FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin routes for employee management
// POST /api/admin/users - Add employee
router.post('/admin/users', [authMiddleware, adminMiddleware], async (req, res) => {
  const { employeeId, name, role, password, email, phone, department, salary, date_hired, address } = req.body;
  try {
    const password_hash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (employee_id, name, role, password_hash, email, phone, department, salary, date_hired, address, active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE) 
       RETURNING *`,
      [employeeId, name, role, password_hash, email, phone, department, salary, date_hired, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Employee with this ID or email already exists.' });
    }
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/admin/users/:id - Edit employee
router.put('/admin/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  const userId = req.params.id;
  const { name, role, password, active, email, phone, department, salary, date_hired, address } = req.body;
  try {
    let query = 'UPDATE users SET ';
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      query += `name = $${paramIndex++}, `;
      params.push(name);
    }
    if (role !== undefined) {
      query += `role = $${paramIndex++}, `;
      params.push(role);
    }
    if (password !== undefined) {
      const password_hash = await hashPassword(password);
      query += `password_hash = $${paramIndex++}, `;
      params.push(password_hash);
    }
    if (active !== undefined) {
      query += `active = $${paramIndex++}, `;
      params.push(active);
    }
    if (email !== undefined) {
      query += `email = $${paramIndex++}, `;
      params.push(email);
    }
    if (phone !== undefined) {
      query += `phone = $${paramIndex++}, `;
      params.push(phone);
    }
    if (department !== undefined) {
      query += `department = $${paramIndex++}, `;
      params.push(department);
    }
    if (salary !== undefined) {
      query += `salary = $${paramIndex++}, `;
      params.push(salary);
    }
    if (date_hired !== undefined) {
      query += `date_hired = $${paramIndex++}, `;
      params.push(date_hired);
    }
    if (address !== undefined) {
      query += `address = $${paramIndex++}, `;
      params.push(address);
    }

    if (params.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update.' });
    }

    query = query.slice(0, -2);
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(userId);

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/admin/users/:id - Remove employee
router.delete('/admin/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  const userId = req.params.id;
  try {
    // Correctly handle dependent records to avoid foreign key violation errors
    await pool.query('DELETE FROM attendance WHERE user_id = $1', [userId]);

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Admin API to get all users
// GET /api/admin/users
router.get('/admin', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const result = await pool.query('SELECT id, employee_id, name, role, email, phone, department, salary, date_hired, address, active, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
