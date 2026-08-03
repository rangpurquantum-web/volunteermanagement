import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Topbar from '../../components/Topbar';
import { api, getSession } from '../../lib/api';

export default function TeamDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [session, setSession] = useState(null);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [userId, setUserId] = useState('');
  const [isLead, setIsLead] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
  }, []);

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    try {
      const data = await api.getTeam(id);
      setTeam(data.team);
      setMembers(data.members);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    setError('');
    try {
      await api.addTeamMember(id, { userId: Number(userId), isLead });
      setUserId('');
      setIsLead(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!session || !team) return null;
  const canManage = ['ORGANIZER', 'ARDENTEER'].includes(session.user.role);

  return (
    <div>
      <Topbar />
      <div className="container">
        <h2>{team.name}</h2>
        <p className="muted">{team.description}</p>
        {error && <div className="error">{error}</div>}

        <div className="card">
          <h3>সদস্যগণ</h3>
          {members.map((m) => (
            <div key={m.id} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
              {m.full_name} <span className="badge">{m.role}</span>
              {m.is_lead && <span className="badge ardenteer"> Lead</span>}
            </div>
          ))}
        </div>

        {canManage && (
          <div className="card">
            <h3>সদস্য যুক্ত করুন (User ID দিয়ে)</h3>
            <form onSubmit={handleAddMember}>
              <label>User ID</label>
              <input value={userId} onChange={(e) => setUserId(e.target.value)} required />
              <label>
                <input type="checkbox" style={{ width: 'auto', marginRight: 6 }}
                  checked={isLead} onChange={(e) => setIsLead(e.target.checked)} />
                এই টিমের Ardenteer লিড
              </label>
              <button className="btn" type="submit">যুক্ত করুন</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
