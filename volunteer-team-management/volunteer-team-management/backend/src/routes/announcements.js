const express = require('express');
const db = require('../db');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();
router.use(authenticate);

// GET /api/announcements?teamId=
router.get('/', async (req, res) => {
  const { teamId } = req.query;
  const where = teamId ? 'WHERE a.team_id = $1' : '';
  const values = teamId ? [teamId] : [];

  try {
    const result = await db.query(
      `SELECT a.*, u.full_name AS author_name,
              (SELECT COUNT(*) FROM announcement_replies r WHERE r.announcement_id = a.id) AS reply_count
       FROM announcements a JOIN users u ON u.id = a.created_by
       ${where} ORDER BY a.created_at DESC`,
      values
    );
    res.json({ announcements: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// POST /api/announcements — primary post: Organizer or Ardenteer only
router.post('/', requireRole('ORGANIZER', 'ARDENTEER'), async (req, res) => {
  const { teamId, title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content are required' });

  try {
    const result = await db.query(
      `INSERT INTO announcements (team_id, title, content, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [teamId || null, title, content, req.user.id]
    );
    res.status(201).json({ announcement: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// GET /api/announcements/:id — with full threaded replies
router.get('/:id', async (req, res) => {
  try {
    const announcement = await db.query(
      `SELECT a.*, u.full_name AS author_name FROM announcements a
       JOIN users u ON u.id = a.created_by WHERE a.id = $1`,
      [req.params.id]
    );
    if (announcement.rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });

    const replies = await db.query(
      `SELECT r.*, u.full_name AS author_name FROM announcement_replies r
       JOIN users u ON u.id = r.created_by
       WHERE r.announcement_id = $1 ORDER BY r.created_at`,
      [req.params.id]
    );

    res.json({ announcement: announcement.rows[0], replies: replies.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// POST /api/announcements/:id/replies — any role, incl. Quanteer (threaded discussion)
router.post('/:id/replies', async (req, res) => {
  const { content, parentReplyId } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  try {
    const result = await db.query(
      `INSERT INTO announcement_replies (announcement_id, parent_reply_id, content, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, parentReplyId || null, content, req.user.id]
    );
    res.status(201).json({ reply: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

module.exports = router;
