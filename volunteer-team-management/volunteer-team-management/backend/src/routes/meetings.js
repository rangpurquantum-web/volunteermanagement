const express = require('express');
const db = require('../db');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();
router.use(authenticate);

// GET /api/meetings?teamId=
router.get('/', async (req, res) => {
  const { teamId } = req.query;
  const where = teamId ? 'WHERE m.team_id = $1' : '';
  const values = teamId ? [teamId] : [];

  try {
    const result = await db.query(
      `SELECT m.*, t.name AS team_name
       FROM meetings m LEFT JOIN teams t ON t.id = m.team_id
       ${where} ORDER BY m.scheduled_at DESC`,
      values
    );
    res.json({ meetings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// POST /api/meetings — Organizer or Ardenteer
router.post('/', requireRole('ORGANIZER', 'ARDENTEER'), async (req, res) => {
  const { teamId, title, agenda, scheduledAt, location } = req.body;
  if (!title || !scheduledAt) return res.status(400).json({ error: 'title and scheduledAt are required' });

  try {
    const result = await db.query(
      `INSERT INTO meetings (team_id, title, agenda, scheduled_at, location, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [teamId || null, title, agenda || null, scheduledAt, location || null, req.user.id]
    );
    res.status(201).json({ meeting: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// GET /api/meetings/:id — detail with notes + attendance
router.get('/:id', async (req, res) => {
  try {
    const meeting = await db.query('SELECT * FROM meetings WHERE id = $1', [req.params.id]);
    if (meeting.rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });

    const notes = await db.query(
      `SELECT n.*, u.full_name AS author_name FROM meeting_notes n
       JOIN users u ON u.id = n.created_by WHERE n.meeting_id = $1 ORDER BY n.created_at`,
      [req.params.id]
    );
    const attendance = await db.query(
      `SELECT a.*, u.full_name FROM meeting_attendance a
       JOIN users u ON u.id = a.user_id WHERE a.meeting_id = $1`,
      [req.params.id]
    );

    res.json({ meeting: meeting.rows[0], notes: notes.rows, attendance: attendance.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// POST /api/meetings/:id/notes — record a decision/minute
router.post('/:id/notes', requireRole('ORGANIZER', 'ARDENTEER'), async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  try {
    const result = await db.query(
      `INSERT INTO meeting_notes (meeting_id, content, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, content, req.user.id]
    );
    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// PUT /api/meetings/:id/attendance — bulk mark attendance
router.put('/:id/attendance', requireRole('ORGANIZER', 'ARDENTEER'), async (req, res) => {
  const { records } = req.body; // [{ userId, status }]
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records array is required' });

  try {
    const results = [];
    for (const r of records) {
      const result = await db.query(
        `INSERT INTO meeting_attendance (meeting_id, user_id, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (meeting_id, user_id) DO UPDATE SET status = EXCLUDED.status
         RETURNING *`,
        [req.params.id, r.userId, r.status]
      );
      results.push(result.rows[0]);
    }
    res.json({ attendance: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

module.exports = router;
