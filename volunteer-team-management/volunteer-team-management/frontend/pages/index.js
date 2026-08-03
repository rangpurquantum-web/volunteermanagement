import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSession } from '../lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getSession() ? '/dashboard' : '/login');
  }, []);

  return null;
}
