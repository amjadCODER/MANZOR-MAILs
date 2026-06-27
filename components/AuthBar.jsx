'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AuthBar({ compact = false }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <span className="auth-status">Loading...</span>;
  }

  if (!session) {
    return (
      <button className={compact ? 'soft-btn auth-button' : 'primary-btn auth-button'} onClick={() => signIn('google', { callbackUrl: '/live' })}>
        Connect Google
      </button>
    );
  }

  return (
    <div className="auth-bar">
      <Link href="/live" className="soft-btn auth-link">Live Inbox</Link>
      <div className="auth-user">
        <span>Connected</span>
        <strong>{session.user?.email}</strong>
      </div>
      <button className="soft-btn auth-button" onClick={() => signOut({ callbackUrl: '/' })}>
        Sign out
      </button>
    </div>
  );
}
