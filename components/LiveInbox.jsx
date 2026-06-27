'use client';

import { useEffect, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

export default function LiveInbox() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState([]);
  const [active, setActive] = useState(null);
  const [messageBody, setMessageBody] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;

    async function loadMessages() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/gmail/messages');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load Gmail messages');
        setMessages(data.messages || []);
        setActive(data.messages?.[0] || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [session]);

  useEffect(() => {
    if (!active?.id || !session) return;

    async function loadMessage() {
      setMessageBody(null);
      try {
        const response = await fetch(`/api/gmail/messages/${active.id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to open message');
        setMessageBody(data.message);
      } catch (err) {
        setError(err.message);
      }
    }

    loadMessage();
  }, [active, session]);

  const selectedMessage = useMemo(() => messageBody || active, [messageBody, active]);

  if (status === 'loading') {
    return <div className="live-empty glass-panel">Loading session...</div>;
  }

  if (!session) {
    return (
      <section className="live-empty glass-panel">
        <p className="eyebrow">Google Connection</p>
        <h1>Connect Gmail</h1>
        <p>اربطي حساب Google لعرض الوارد الحقيقي داخل MANZOR Mail.</p>
        <button className="primary-btn" onClick={() => signIn('google', { callbackUrl: '/live' })}>
          Continue with Google
        </button>
      </section>
    );
  }

  return (
    <section className="live-inbox glass-panel">
      <header className="mail-topbar live-topbar">
        <div>
          <p className="eyebrow">Live Gmail Inbox</p>
          <h1>الوارد الحقيقي</h1>
          <p className="email-address" dir="ltr">{session.user?.email}</p>
        </div>
        <input className="search-input" placeholder="Search live inbox..." />
      </header>

      {error && <div className="error-box">{error}</div>}
      {loading && <div className="live-empty">Loading Gmail messages...</div>}

      {!loading && (
        <div className="mail-layout">
          <div className="message-list">
            {messages.length === 0 && <div className="live-empty">No messages found.</div>}
            {messages.map((message) => (
              <button
                key={message.id}
                className={`message-row message-button ${active?.id === message.id ? 'active' : ''} ${message.unread ? 'unread' : ''}`}
                onClick={() => setActive(message)}
              >
                <div className="message-meta">
                  <span className="sender">{message.from || 'Unknown sender'}</span>
                  <span className="date">{message.date ? new Date(message.date).toLocaleDateString() : ''}</span>
                </div>
                <h3>{message.subject}</h3>
                <p>{message.snippet}</p>
                <div className="message-tags">
                  {message.unread && <span>Unread</span>}
                  <span>Gmail API</span>
                </div>
              </button>
            ))}
          </div>

          <article className="reader-panel">
            {selectedMessage ? (
              <>
                <div className="reader-head">
                  <span className="pill">Gmail</span>
                  <span>{selectedMessage.date ? new Date(selectedMessage.date).toLocaleString() : ''}</span>
                </div>
                <h2>{selectedMessage.subject}</h2>
                <div className="sender-box">
                  <div className="sender-avatar">{(selectedMessage.from || '?').slice(0, 1)}</div>
                  <div>
                    <strong>{selectedMessage.from}</strong>
                    <p>{selectedMessage.to ? `To: ${selectedMessage.to}` : 'Connected Gmail account'}</p>
                  </div>
                </div>
                <p className="reader-body">{selectedMessage.body || selectedMessage.snippet || 'Opening message...'}</p>
              </>
            ) : (
              <div className="live-empty">Select a message to preview it.</div>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
