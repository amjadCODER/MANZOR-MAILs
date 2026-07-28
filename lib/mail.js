import { listGoogle, getGoogle, sendGoogle } from './providers/google';
import { listMicrosoft, getMicrosoft, sendMicrosoft } from './providers/microsoft';
import { listZoho, getZoho, sendZoho } from './providers/zoho';
import { listImap, getImap, sendImap } from './providers/imap';
export function listMessages(a){return a.provider==='GOOGLE'?listGoogle(a):a.provider==='MICROSOFT'?listMicrosoft(a):a.provider==='ZOHO'?listZoho(a):listImap(a)}
export function getMessage(a,id){return a.provider==='GOOGLE'?getGoogle(a,id):a.provider==='MICROSOFT'?getMicrosoft(a,id):a.provider==='ZOHO'?getZoho(a,id):getImap(a,id)}
export function sendMessage(a,p){return a.provider==='GOOGLE'?sendGoogle(a,p):a.provider==='MICROSOFT'?sendMicrosoft(a,p):a.provider==='ZOHO'?sendZoho(a,p):sendImap(a,p)}
