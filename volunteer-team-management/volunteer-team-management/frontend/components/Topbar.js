import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearSession, getSession } from '../lib/api';

export default function Topbar() {
  const router = useRouter();
  const session = typeof window !== 'undefined' ? getSession() : null;

  function logout() {
    clearSession();
    router.push('/login');
  }

  return (
    <div className="topbar">
      <Link href="/dashboard" className="brand">Volunteer Team Management</Link>
      <div>
        <Link href="/teams">Teams</Link>
        <Link href="/tasks">Tasks</Link>
        <Link href="/meetings">Meetings</Link>
        <Link href="/announcements">Announcements</Link>
        {session ? (
          <a onClick={logout} style={{ cursor: 'pointer' }}>Logout ({session.user.role})</a>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </div>
  );
}
