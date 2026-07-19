import Link from 'next/link';
import NewAccountForm from '../../../components/NewAccountForm';
export default function NewAccountPage(){return <main className="app-shell"><div className="section-head"><div><p className="eyebrow">Mail Connection</p><h2>اضافة بريد جمعية</h2><p>يدعم Outlook وMicrosoft 365 وYahoo وZoho وGoDaddy واي مزود يقدم IMAP وSMTP</p></div><Link href="/" className="soft-btn">رجوع</Link></div><NewAccountForm/></main>}
