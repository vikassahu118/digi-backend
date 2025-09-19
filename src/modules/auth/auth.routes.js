// src/modules/auth/auth.routes.js

const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../../config/db');
const { comparePassword, hashPassword } = require('../../utils/bcrypt'); // Assuming hashPassword is exported
const { generateToken } = require('../../utils/jwt');
const { sendPasswordResetEmail } = require('../../utils/mailer');

// User Login
router.post('/login', async (req, res) => {
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
});

// Request a password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rowCount > 0) {
      const user = userResult.rows[0];

      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await pool.query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3',
        [hashedToken, tokenExpiry, email]
      );

      // Send the actual email
      await sendPasswordResetEmail(user.email, resetToken);
    }

    // Always send a generic success message to prevent email enumeration
    res.json({ message: 'If a user with that email exists, a password reset link has been sent.' });

  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset the password with a token
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [hashedToken]
    );

    if (userResult.rowCount === 0) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    const user = userResult.rows[0];
    const newPasswordHash = await hashPassword(password);

    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [newPasswordHash, user.id]
    );

    res.json({ message: 'Password has been reset successfully.' });

  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
