// backend/src/modules/auth/auth.controller.js

const { pool } = require('../../config/db');
const { comparePassword } = require('../../utils/bcrypt');
const { generateToken } = require('../../utils/jwt');

const loginUser = async (req, res) => {
  const { employeeId, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE employee_id = $1', [employeeId]);
    const user = result.rows[0];

    if (!user || !(await comparePassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken({ id: user.id, role: user.role });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const logoutUser = (req, res) => {
  // For JWT-based authentication, logout is typically handled client-side by deleting the token.
  // This endpoint can be used to blacklist tokens if necessary, but is often optional.
  res.status(200).json({ message: 'Logged out successfully.' });
};

module.exports = {
  loginUser,
  logoutUser,
};