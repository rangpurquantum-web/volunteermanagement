import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api } from '../lib/api';

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // New sign-ups default to QUANTEER; an Organizer promotes users to
      // ARDENTEER/ORGANIZER later from the Teams screen.
      await api.register(form);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 60 }}>
      <h2>রেজিস্ট্রেশন (Quanteer)</h2>
      <div className="card">
        {error && <div className="error">{error}</div>}
        {success && <p className="muted">সফল! লগইন পেজে নিয়ে যাচ্ছি...</p>}
        <form onSubmit={handleSubmit}>
          <label>পূর্ণ নাম</label>
          <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
          <label>ইমেইল</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          <label>ফোন</label>
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          <label>পাসওয়ার্ড</label>
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'তৈরি হচ্ছে...' : 'রেজিস্টার করুন'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 12 }}>
          আগে থেকেই অ্যাকাউন্ট আছে? <Link href="/login">লগইন করুন</Link>
        </p>
      </div>
    </div>
  );
}
