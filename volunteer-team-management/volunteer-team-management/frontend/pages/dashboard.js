import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Topbar from '../components/Topbar';
import { api, getSession } from '../lib/api';

const ROLE_LABEL = { ORGANIZER: 'অর্গানাইজার', ARDENTEER: 'আরডেনটিয়ার', QUANTEER: 'কোয়ানটিয়ার' };

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    setSession(s);
    load();
  }, []);

  async function load() {
    try {
      const [t, a] = await Promise.all([api.getTasks(), api.getAnnouncements()]);
      setTasks(t.tasks.slice(0, 5));
      setAnnouncements(a.announcements.slice(0, 5));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!session) return null;

  return (
    <div>
      <Topbar />
      <div className="container">
        <h2>স্বাগতম, {session.user.fullName} 👋</h2>
        <span className={`badge ${session.user.role.toLowerCase()}`}>{ROLE_LABEL[session.user.role]}</span>

        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}

        <div className="card" style={{ marginTop: 20 }}>
          <h3>{session.user.role === 'QUANTEER' ? 'আপনার সাম্প্রতিক টাস্ক' : 'সাম্প্রতিক টাস্কসমূহ'}</h3>
          {tasks.length === 0 && <p className="muted">কোনো টাস্ক নেই।</p>}
          {tasks.map((t) => (
            <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <strong>{t.title}</strong> — <span className="muted">{t.status}</span>
              {t.team_name && <span className="muted"> · {t.team_name}</span>}
            </div>
          ))}
        </div>

        <div className="card">
          <h3>সাম্প্রতিক ঘোষণা</h3>
          {announcements.length === 0 && <p className="muted">কোনো ঘোষণা নেই।</p>}
          {announcements.map((a) => (
            <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <strong>{a.title}</strong>
              <div className="muted">{a.author_name} · {a.reply_count} রিপ্লাই</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
