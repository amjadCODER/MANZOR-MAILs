import Image from 'next/image';
import Link from 'next/link';
import { getAccountById, getMessagesByAccountId, emailAccounts } from '../../../lib/emailAccounts';

export function generateStaticParams() {
  return emailAccounts.map((account) => ({ id: account.id }));
}

export default function InboxPage({ params }) {
  const account = getAccountById(params.id);
  const messages = getMessagesByAccountId(params.id);
  const activeMessage = messages[0];

  return (
    <main className="mail-shell">
      <aside className="mail-sidebar glass-panel">
        <Link href="/" className="mini-brand">
          <Image src="/manzor-tech-logo.png" alt="MANZOR TECH" width={46} height={46} />
          <div>
            <strong>MANZOR Mail</strong>
            <span>Powered by منظور تيك</span>
          </div>
        </Link>

        <button className="compose-btn">+ Compose</button>

        <nav className="folders">
          <a className="folder active"><span>📥</span> Inbox</a>
          <a className="folder"><span>📤</span> Sent</a>
          <a className="folder"><span>📝</span> Drafts</a>
          <a className="folder"><span>⭐</span> Starred</a>
          <a className="folder"><span>🛡️</span> Spam</a>
          <a className="folder"><span>🗑️</span> Trash</a>
        </nav>

        <div className="sidebar-account">
          <span>Current Account</span>
          <strong>{account.organizationName}</strong>
          <small dir="ltr">{account.email}</small>
        </div>
      </aside>

      <section className="inbox-panel glass-panel">
        <header className="mail-topbar">
          <div>
            <p className="eyebrow">Inbox</p>
            <h1>{account.organizationName}</h1>
            <p className="email-address" dir="ltr">{account.email}</p>
          </div>
          <div className="topbar-actions">
            <input className="search-input" placeholder="Search mail..." />
            <button className="icon-btn">🔔</button>
            <button className="avatar-btn">MT</button>
          </div>
        </header>

        <div className="mail-layout">
          <div className="message-list">
            {messages.map((message) => (
              <article key={message.id} className={`message-row ${message.unread ? 'unread' : ''}`}>
                <div className="message-meta">
                  <span className="sender">{message.sender}</span>
                  <span className="date">{message.date}</span>
                </div>
                <h3>{message.subject}</h3>
                <p>{message.preview}</p>
                <div className="message-tags">
                  <span>{message.tag}</span>
                  {message.attachments > 0 && <span>📎 {message.attachments}</span>}
                </div>
              </article>
            ))}
          </div>

          <article className="reader-panel">
            <div className="reader-head">
              <span className="pill">{activeMessage.tag}</span>
              <span>{activeMessage.date}</span>
            </div>
            <h2>{activeMessage.subject}</h2>
            <div className="sender-box">
              <div className="sender-avatar">{activeMessage.sender.slice(0, 1)}</div>
              <div>
                <strong>{activeMessage.sender}</strong>
                <p dir="ltr">{activeMessage.from}</p>
              </div>
            </div>
            <p className="reader-body">{activeMessage.body}</p>
            <div className="reply-box">
              <textarea placeholder="Write a reply..." />
              <div className="reply-actions">
                <button className="soft-btn">Save Draft</button>
                <button className="primary-btn">Send Reply</button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <footer className="mail-footer">Powered by منظور تيك</footer>
    </main>
  );
}
