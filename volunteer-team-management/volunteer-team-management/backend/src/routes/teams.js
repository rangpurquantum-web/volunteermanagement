const express = require('express');
const db = require('../db');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();
router.use(authenticate);

// GET /api/teams — list all teams (with lead + member count)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.id, t.name, t.description, t.created_at,
             (SELECT COUNT(*) FROM team_members m WHERE m.team_id = t.id) AS member_count,
             (SELECT u.full_name FROM team_members m
                JOIN users u ON u.id = m.user_id
                WHERE m.team_id = t.id AND m.is_lead = TRUE LIMIT 1) AS lead_name
      FROM teams t
      ORDER BY t.created_at DESC
    `);
    res.json({ teams: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST /api/teams — Organizer only
router.post('/', requireRole('ORGANIZER'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const result = await db.query(
      `INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [name, description || null, req.user.id]
    );
    res.status(201).json({ team: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// GET /api/teams/:id — team detail with members
router.get('/:id', async (req, res) => {
  try {
    const team = await db.query('SELECT * FROM teams WHERE id = $1', [req.params.id]);
    if (team.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

    const members = await db.query(
      `SELECT u.id, u.full_name, u.email, u.role, m.is_lead
       FROM team_members m JOIN users u ON u.id = m.user_id
       WHERE m.team_id = $1 ORDER BY m.is_lead DESC, u.full_name`,
      [req.params.id]
    );

    res.json({ team: team.rows[0], members: members.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// POST /api/teams/:id/members — Organizer or the Ardenteer leading this team
router.post('/:id/members', requireRole('ORGANIZER', 'ARDENTEER'), async (req, res) => {
  const { userId, isLead } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const result = await db.query(
      `INSERT INTO team_members (team_id, user_id, is_lead)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, user_id) DO UPDATE SET is_lead = EXCLUDED.is_lead
       RETURNING *`,
      [req.params.id, userId, !!isLead]
    );
    res.status(201).json({ membership: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// DELETE /api/teams/:id/members/:userId
router.delete('/:id/members/:userId', requireRole('ORGANIZER', 'ARDENTEER'), async (req, res) => {
  try {
    await db.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [
      req.params.id,
      req.params.userId,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
