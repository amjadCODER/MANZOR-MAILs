import Image from 'next/image';
import Link from 'next/link';
import { emailAccounts } from '../lib/emailAccounts';
import AuthBar from '../components/AuthBar';

export default function HomePage() {
  const totalUnread = emailAccounts.reduce((sum, account) => sum + account.unread, 0);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-top">
          <div className="brand-lockup">
            <div className="logo-glow">
              <Image src="/manzor-tech-logo.png" alt="MANZOR TECH" width={74} height={74} priority />
            </div>
            <div>
              <p className="eyebrow">MANZOR TECH</p>
              <h1>MANZOR Mail</h1>
              <p className="hero-subtitle">إدارة بريد الجمعيات من منصة واحدة، بشكل منظم ومريح.</p>
            </div>
          </div>

          <div className="hero-actions">
            <AuthBar compact />
            <Link href="/live" className="primary-btn">Live Gmail</Link>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Accounts</span>
            <strong>{emailAccounts.length}</strong>
          </div>
          <div className="stat-card">
            <span>Unread</span>
            <strong>{totalUnread}</strong>
          </div>
          <div className="stat-card">
            <span>Status</span>
            <strong>Ready</strong>
          </div>
        </div>
      </section>

      <section className="section-head">
        <div>
          <p className="eyebrow">Organization Accounts</p>
          <h2>حسابات البريد</h2>
        </div>
        <p>اختاري أي جمعية لفتح صندوق الوارد الخاص ببريدها داخل MANZOR Mail.</p>
      </section>

      <section className="accounts-grid">
        {emailAccounts.map((account) => (
          <Link href={`/mail/${account.id}`} key={account.id} className={`account-card ${account.accent}`}>
            <div className="card-topline">
              <span className="mail-dot" />
              <span className="updated">{account.updatedAt}</span>
            </div>
            <h3>{account.organizationName}</h3>
            <p className="email-address" dir="ltr">{account.email}</p>
            <p className="message-preview">{account.lastMessage}</p>
            <div className="card-footerline">
              <span>{account.unread} غير مقروء</span>
              <span className="open-chip">Open Inbox</span>
            </div>
          </Link>
        ))}
      </section>

      <footer className="footer">Powered by منظور تيك</footer>
    </main>
  );
}
