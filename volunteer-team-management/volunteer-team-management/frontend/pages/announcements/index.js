import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Topbar from '../../components/Topbar';
import { api, getSession } from '../../lib/api';

export default function Announcements() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
    load();
  }, []);

  async function load() {
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data.announcements);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createAnnouncement(form);
      setForm({ title: '', content: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!session) return null;
  const canPost = ['ORGANIZER', 'ARDENTEER'].includes(session.user.role);

  return (
    <div>
      <Topbar />
      <div className="container">
        <h2>ঘোষণা</h2>
        <p className="muted">শুধুমাত্র Organizer এবং Ardenteer প্রাইমারি ঘোষণা পোস্ট করতে পারবেন। Quanteer থ্রেডে রিপ্লাই দিতে পারবেন।</p>
        {error && <div className="error">{error}</div>}

        {canPost && (
          <div className="card">
            <h3>নতুন ঘোষণা</h3>
            <form onSubmit={handleCreate}>
              <label>শিরোনাম</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <label>বিস্তারিত</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} required />
              <button className="btn" type="submit">পোস্ট করুন</button>
            </form>
          </div>
        )}

        {announcements.map((a) => (
          <div key={a.id} className="card">
            <h3><a href={`/announcements/${a.id}`}>{a.title}</a></h3>
            <p className="muted">{a.author_name} · {new Date(a.created_at).toLocaleDateString('bn-BD')} · {a.reply_count} রিপ্লাই</p>
          </div>
        ))}
      </div>
    </div>
  );
}
