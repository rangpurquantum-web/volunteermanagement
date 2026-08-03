import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Topbar from '../../components/Topbar';
import { api, getSession } from '../../lib/api';

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];

export default function Tasks() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', teamId: '', assignedTo: '', dueDate: '' });
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
      const data = await api.getTasks();
      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createTask({
        title: form.title,
        description: form.description,
        teamId: form.teamId || null,
        assignedTo: form.assignedTo ? Number(form.assignedTo) : null,
        dueDate: form.dueDate || null,
      });
      setForm({ title: '', description: '', teamId: '', assignedTo: '', dueDate: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(taskId, status) {
    try {
      await api.updateTaskStatus(taskId, status);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!session) return null;
  const canAssign = ['ORGANIZER', 'ARDENTEER'].includes(session.user.role);

  return (
    <div>
      <Topbar />
      <div className="container">
        <h2>টাস্কসমূহ</h2>
        {error && <div className="error">{error}</div>}

        {canAssign && (
          <div className="card">
            <h3>নতুন টাস্ক অ্যাসাইন করুন</h3>
            <form onSubmit={handleCreate}>
              <label>শিরোনাম</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <label>বিবরণ</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <label>টিম</label>
              <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
                <option value="">— নির্বাচন করুন —</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <label>Assigned User ID</label>
              <input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
              <label>শেষ তারিখ</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              <button className="btn" type="submit">টাস্ক তৈরি করুন</button>
            </form>
          </div>
        )}

        {tasks.map((t) => (
          <div key={t.id} className="card">
            <h3>{t.title}</h3>
            <p className="muted">{t.description}</p>
            <p className="muted">
              টিম: {t.team_name || '—'} · দায়িত্বে: {t.assignee_name || '—'} · শেষ তারিখ: {t.due_date || '—'}
            </p>
            <label>স্ট্যাটাস</label>
            <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
