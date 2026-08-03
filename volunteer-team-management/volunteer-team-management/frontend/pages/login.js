import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api, saveSession } from '../lib/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      saveSession(data.token, data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 60 }}>
      <h2>লগইন করুন</h2>
      <div className="card">
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>ইমেইল</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>পাসওয়ার্ড</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'লগইন হচ্ছে...' : 'লগইন'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 12 }}>
          অ্যাকাউন্ট নেই? <Link href="/register">রেজিস্টার করুন</Link>
        </p>
      </div>
    </div>
  );
}
