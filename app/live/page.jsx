import Image from 'next/image';
import Link from 'next/link';
import AuthBar from '../../components/AuthBar';
import LiveInbox from '../../components/LiveInbox';

export default function LivePage() {
  return (
    <main className="mail-shell live-shell">
      <aside className="mail-sidebar glass-panel">
        <Link href="/" className="mini-brand">
          <Image src="/manzor-tech-logo.png" alt="MANZOR TECH" width={46} height={46} />
          <div>
            <strong>MANZOR Mail</strong>
            <span>Powered by منظور تيك</span>
          </div>
        </Link>

        <AuthBar compact />

        <nav className="folders">
          <a className="folder active"><span>📥</span> Live Inbox</a>
          <a className="folder"><span>📤</span> Sent</a>
          <a className="folder"><span>📝</span> Drafts</a>
          <a className="folder"><span>⭐</span> Starred</a>
          <a className="folder"><span>🛡️</span> Spam</a>
          <a className="folder"><span>🗑️</span> Trash</a>
        </nav>

        <div className="sidebar-account">
          <span>Status</span>
          <strong>Google OAuth Ready</strong>
          <small>Gmail API connection</small>
        </div>
      </aside>

      <LiveInbox />

      <footer className="mail-footer">Powered by منظور تيك</footer>
    </main>
  );
}
