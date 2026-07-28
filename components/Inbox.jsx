'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function Inbox({ id }) {
  const [account, setAccount] = useState(null);
  const [messages, setMessages] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compose, setCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({ to: '', subject: '', body: '' });

  const previews = useMemo(() => images.map((file) => ({ file, url: URL.createObjectURL(file) })), [images]);

  useEffect(() => () => previews.forEach((item) => URL.revokeObjectURL(item.url)), [previews]);

  async function json(response) {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر تنفيذ الطلب');
    return data;
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const stamp = Date.now();
      const [accountData, messageData] = await Promise.all([
        fetch(`/api/accounts/${id}?v=${stamp}`, { cache: 'no-store' }).then(json),
        fetch(`/api/accounts/${id}/messages?v=${stamp}`, { cache: 'no-store' }).then(json)
      ]);
      setAccount(accountData.account);
      setMessages(messageData.messages || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function open(message) {
    setActive({ ...message, loading: true });
    setError('');
    try {
      const response = await fetch(`/api/accounts/${id}/messages?messageId=${encodeURIComponent(message.id)}&v=${Date.now()}`, { cache: 'no-store' });
      const data = await json(response);
      setActive(data.message);
    } catch (requestError) {
      setError(requestError.message);
      setActive(null);
    }
  }

  function closeCompose() {
    setCompose(false);
    setImages([]);
  }

  async function send(event) {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const payload = new FormData();
      payload.set('to', form.to);
      payload.set('subject', form.subject);
      payload.set('body', form.body);
      images.forEach((image) => payload.append('images', image));
      await fetch(`/api/accounts/${id}/send`, { method: 'POST', body: payload, cache: 'no-store' }).then(json);
      closeCompose();
      setForm({ to: '', subject: '', body: '' });
      window.alert('تم ارسال الرسالة');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  }

  function selectImages(event) {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 3) {
      setError('الحد الاقصى 3 صور');
      event.target.value = '';
      return;
    }
    const total = selected.reduce((sum, file) => sum + file.size, 0);
    if (total > 4 * 1024 * 1024) {
      setError('الحجم الاجمالي للصور يجب ألا يتجاوز 4 ميجابايت');
      event.target.value = '';
      return;
    }
    setImages(selected);
  }

  const replyAddress = (active?.from || '').match(/<([^>]+)>/)?.[1] || active?.from || '';

  return (
    <main className="mail-page">
      <aside className="mail-side">
        <Link href="/" className="back">الرجوع للحسابات</Link>
        <div className="side-account">
          <h2>{account?.organizationName || 'البريد'}</h2>
          <p dir="ltr">{account?.email}</p>
        </div>
        <button className="button primary full" onClick={() => setCompose(true)}>رسالة جديدة</button>
        <button className="nav-item active">الوارد</button>
        <button className="nav-item" onClick={load}>تحديث الرسائل</button>
      </aside>

      <section className="mail-main">
        <header className="mail-head"><div><h1>الوارد</h1><p>{messages.length} رسالة</p></div></header>
        {error && <div className="error banner">{error}</div>}
        {loading ? <div className="empty">جاري تحميل البريد</div> : (
          <div className="message-layout">
            <div className="message-list">
              {messages.length === 0 ? <div className="empty small">ما فيه رسائل</div> : messages.map((message) => (
                <button key={message.id} className={`message-row ${message.unread ? 'unread' : ''} ${active?.id === message.id ? 'selected' : ''}`} onClick={() => open(message)}>
                  <div><strong>{message.from || 'مرسل غير معروف'}</strong><time>{message.date ? new Date(message.date).toLocaleDateString('ar-SA') : ''}</time></div>
                  <h3>{message.subject}</h3>
                  <p>{message.snippet}</p>
                </button>
              ))}
            </div>

            <article className="reader">
              {active ? active.loading ? <div className="empty small">جاري فتح الرسالة</div> : (
                <>
                  <div className="reader-meta"><span>{active.from}</span><time>{active.date ? new Date(active.date).toLocaleString('ar-SA') : ''}</time></div>
                  <h2>{active.subject}</h2>
                  {active.html ? (
                    <iframe
                      key={active.id}
                      className="email-frame"
                      title={active.subject || 'محتوى الرسالة'}
                      srcDoc={active.html}
                      sandbox="allow-popups allow-popups-to-escape-sandbox"
                      referrerPolicy="no-referrer"
                    />
                  ) : <div className="reader-body">{active.text || active.snippet}</div>}
                  {active.attachments?.length > 0 && (
                    <div className="attachment-summary">المرفقات: {active.attachments.map((item) => item.filename).join('، ')}</div>
                  )}
                  <button className="button ghost" onClick={() => {
                    setForm({ to: replyAddress, subject: `رد: ${active.subject}`, body: '' });
                    setCompose(true);
                  }}>رد</button>
                </>
              ) : <div className="empty small">اختر رسالة لعرضها</div>}
            </article>
          </div>
        )}
      </section>

      {compose && (
        <div className="modal">
          <form className="compose" onSubmit={send}>
            <div className="compose-head"><h2>رسالة جديدة</h2><button type="button" onClick={closeCompose}>×</button></div>
            <label>الى</label>
            <input type="email" dir="ltr" value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} required />
            <label>العنوان</label>
            <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required />
            <label>الرسالة</label>
            <textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} required />
            <label className="image-picker">
              <span>ارفاق صور</span>
              <small>حتى 3 صور وبحجم اجمالي 4 ميجابايت</small>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={selectImages} />
            </label>
            {previews.length > 0 && <div className="image-previews">{previews.map((item) => <img key={`${item.file.name}-${item.file.lastModified}`} src={item.url} alt={item.file.name} />)}</div>}
            <button className="button primary" disabled={sending}>{sending ? 'جاري الارسال' : 'ارسال'}</button>
          </form>
        </div>
      )}
    </main>
  );
}
