'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function LoginForm() {
  const [code, setCode] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const router = useRouter();
  async function submit(e) { e.preventDefault(); setLoading(true); setError(''); const r = await fetch('/api/access/login', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ code }) }); const d = await r.json(); setLoading(false); if (!r.ok) return setError(d.error || 'تعذر الدخول'); router.replace('/'); router.refresh(); }
  return <form className="login-form" onSubmit={submit}><label>رمز الدخول</label><input autoFocus inputMode="numeric" type="password" value={code} onChange={e=>setCode(e.target.value)} placeholder="ادخل رمز الدخول" /><button disabled={loading}>{loading ? 'جاري التحقق' : 'دخول'}</button>{error && <p className="error">{error}</p>}</form>;
}
