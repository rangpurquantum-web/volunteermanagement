const express = require('express');
const db = require('../db');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();
router.use(authenticate);

// GET /api/tasks?teamId=&assignedTo=&status=
router.get('/', async (req, res) => {
  const { teamId, assignedTo, status } = req.query;
  const conditions = [];
  const values = [];

  if (teamId) { values.push(teamId); conditions.push(`t.team_id = $${values.length}`); }
  if (assignedTo) { values.push(assignedTo); conditions.push(`t.assigned_to = $${values.length}`); }
  if (status) { values.push(status); conditions.push(`t.status = $${values.length}`); }

  // Quanteers only ever see their own tasks unless filtered explicitly by an org/team lead
  if (req.user.role === 'QUANTEER' && !assignedTo) {
    values.push(req.user.id);
    conditions.push(`t.assigned_to = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await db.query(
      `SELECT t.*, u.full_name AS assignee_name, tm.name AS team_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       LEFT JOIN teams tm ON tm.id = t.team_id
       ${where}
       ORDER BY t.due_date NULLS LAST, t.created_at DESC`,
      values
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks — Organizer or Ardenteer assigns a task
router.post('/', requireRole('ORGANIZER', 'ARDENTEER'), async (req, res) => {
  const { teamId, title, description, assignedTo, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const result = await db.query(
      `INSERT INTO tasks (team_id, title, description, assigned_to, assigned_by, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [teamId || null, title, description || null, assignedTo || null, req.user.id, dueDate || null]
    );
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id/status — assignee updates progress; leads can also update
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const task = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const isOwner = task.rows[0].assigned_to === req.user.id;
    const isLead = ['ORGANIZER', 'ARDENTEER'].includes(req.user.role);
    if (!isOwner && !isLead) {
      return res.status(403).json({ error: 'Not permitted to update this task' });
    }

    const result = await db.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    res.json({ task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id — Organizer or Ardenteer only
router.delete('/:id', requireRole('ORGANIZER', 'ARDENTEER'), async (req, res) => {
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
