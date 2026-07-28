import Link from 'next/link'; import NewAccountForm from '../../../components/NewAccountForm';
export default function Page(){return <main className="shell narrow"><header className="simple-head"><div><h1>اضافة بريد</h1><p>اربط البريد مرة واحدة واحفظه باسم الجمعية</p></div><Link className="button ghost" href="/">رجوع</Link></header><NewAccountForm/></main>}
