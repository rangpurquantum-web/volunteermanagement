import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Topbar from '../../components/Topbar';
import { api, getSession } from '../../lib/api';

export default function Meetings() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ title: '', agenda: '', scheduledAt: '', location: '', teamId: '' });
  const [noteDrafts, setNoteDrafts] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
    load();
    api.getTeams().then((d) => setTeams(d.teams)).catch(() => {});
  }, []);

  async function load() {
    try {
      const data = await api.getMeetings();
      setMeetings(data.meetings);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createMeeting({ ...form, teamId: form.teamId || null });
      setForm({ title: '', agenda: '', scheduledAt: '', location: '', teamId: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddNote(meetingId) {
    const content = noteDrafts[meetingId];
    if (!content) return;
    try {
      await api.addMeetingNote(meetingId, content);
      setNoteDrafts({ ...noteDrafts, [meetingId]: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!session) return null;
  const canManage = ['ORGANIZER', 'ARDENTEER'].includes(session.user.role);

  return (
    <div>
      <Topbar />
      <div className="container">
        <h2>মিটিং</h2>
        {error && <div className="error">{error}</div>}

        {canManage && (
          <div className="card">
            <h3>নতুন মিটিং শিডিউল করুন</h3>
            <form onSubmit={handleCreate}>
              <label>শিরোনাম</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <label>এজেন্ডা</label>
              <textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={2} />
              <label>টিম</label>
              <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
                <option value="">— সকল / নির্দিষ্ট নয় —</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <label>তারিখ ও সময়</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
              <label>স্থান</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <button className="btn" type="submit">মিটিং তৈরি করুন</button>
            </form>
          </div>
        )}

        {meetings.map((m) => (
          <div key={m.id} className="card">
            <h3>{m.title}</h3>
            <p className="muted">
              {new Date(m.scheduled_at).toLocaleString('bn-BD')} · {m.location || 'স্থান নির্ধারিত নয়'} · {m.status}
            </p>
            <p>{m.agenda}</p>

            {canManage && (
              <div style={{ marginTop: 10 }}>
                <label>সিদ্ধান্ত / নোট যুক্ত করুন</label>
                <textarea
                  rows={2}
                  value={noteDrafts[m.id] || ''}
                  onChange={(e) => setNoteDrafts({ ...noteDrafts, [m.id]: e.target.value })}
                />
                <button className="btn secondary" onClick={() => handleAddNote(m.id)}>নোট যুক্ত করুন</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
