// backend/src/modules/tasks/tasks.routes.js

const router = require('express').Router();
const { pool } = require('../../config/db');
const { authMiddleware } = require('../../middlewares/auth'); // Import authMiddleware

// GET all tasks for the logged-in user
// GET /api/tasks
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id; // Get user ID from the JWT
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST a new task
// POST /api/tasks
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id; // Get user ID from the JWT
  const { title, description, dueDate, category, priority } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, due_date, category, priority, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, dueDate, category, priority, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding task:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT to toggle task completion
// PUT /api/tasks/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id; // Get user ID from the JWT
  const { completed } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [completed, taskId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found or you do not have permission.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error toggling task completion:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a task
// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id; // Get user ID from the JWT
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [taskId, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found or you do not have permission.' });
    }
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
