'use client';
import { useEffect, useState } from 'react'; import Link from 'next/link'; import Image from 'next/image'; import { useRouter } from 'next/navigation';
const names={GOOGLE:'Google',MICROSOFT:'Microsoft',ZOHO:'Zoho',IMAP_SMTP:'بريد مخصص'};
export default function Dashboard(){ const [accounts,setAccounts]=useState([]); const [loading,setLoading]=useState(true); const router=useRouter();
 useEffect(()=>{fetch('/api/accounts').then(r=>r.json()).then(d=>setAccounts(d.accounts||[])).finally(()=>setLoading(false))},[]);
 async function logout(){await fetch('/api/access/logout',{method:'POST'});router.replace('/login');router.refresh()}
 return <main className="shell"><header className="topbar"><div className="brand"><Image src="/manzor-tech-logo.png" alt="منظور" width={54} height={54}/><div><strong>MANZOR Mail</strong><span>بريد الجمعيات</span></div></div><div className="top-actions"><Link className="button primary" href="/accounts/new">اضافة بريد</Link><button className="button ghost" onClick={logout}>قفل النظام</button></div></header>
 <section className="page-title"><div><h1>حسابات البريد</h1><p>اضغط على حساب الجمعية لفتح الوارد والارسال منه مباشرة</p></div></section>
 {loading ? <div className="empty">جاري تحميل الحسابات</div> : accounts.length===0 ? <div className="empty"><h2>ما فيه حسابات مضافة</h2><p>اضف اول بريد وراح يظهر هنا تلقائيا</p><Link className="button primary" href="/accounts/new">اضافة بريد</Link></div> : <section className="accounts-grid">{accounts.map(a=><Link href={`/mail/${a.id}`} className="account-card" key={a.id}><div className="account-head"><span className="provider">{names[a.provider]||a.provider}</span><span className={`status ${a.connectionStatus==='CONNECTED'?'ok':''}`}></span></div><h2>{a.organizationName}</h2><p dir="ltr">{a.email}</p><div className="open-line"><span>فتح البريد</span><b>←</b></div></Link>)}</section>}
 <footer>منظور تيك</footer></main> }
