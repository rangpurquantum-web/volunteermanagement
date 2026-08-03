import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Topbar from '../../components/Topbar';
import { api, getSession } from '../../lib/api';

export default function Teams() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [teams, setTeams] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
    load();
  }, []);

  async function load() {
    try {
      const data = await api.getTeams();
      setTeams(data.teams);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createTeam({ name, description });
      setName('');
      setDescription('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!session) return null;

  return (
    <div>
      <Topbar />
      <div className="container">
        <h2>টিমসমূহ</h2>
        {error && <div className="error">{error}</div>}

        {session.user.role === 'ORGANIZER' && (
          <div className="card">
            <h3>নতুন টিম তৈরি করুন</h3>
            <form onSubmit={handleCreate}>
              <label>টিমের নাম</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
              <label>বিবরণ</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              <button className="btn" type="submit">টিম তৈরি করুন</button>
            </form>
          </div>
        )}

        {teams.map((t) => (
          <div key={t.id} className="card">
            <h3><a href={`/teams/${t.id}`}>{t.name}</a></h3>
            <p className="muted">{t.description || 'কোনো বিবরণ নেই'}</p>
            <p className="muted">নেতৃত্ব: {t.lead_name || 'নির্ধারিত নয়'} · {t.member_count} জন সদস্য</p>
          </div>
        ))}
      </div>
    </div>
  );
}
