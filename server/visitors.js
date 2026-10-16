// Monthly network-based estimate: no cookies, raw IPs, browsing history or user agents stored.
export function visitorMonth(date=new Date()) {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit'}).formatToParts(date);
 return parts.find(p=>p.type==='year').value+'-'+parts.find(p=>p.type==='month').value;
}
export async function recordVisitor(request,env,date=new Date()) {
 if(!env.DB||!env.AUTH_PEPPER||request.method!=='GET')return;
 const url=new URL(request.url),ip=request.headers.get('cf-connecting-ip');
 if(!['www.poigai.com','poigai.com'].includes(url.hostname)||!ip)return;
 if(request.headers.get('sec-purpose')?.includes('prefetch')||request.headers.get('purpose')==='prefetch')return;
 if(/bot|crawler|spider|headless|curl|wget|monitor|uptime/i.test(request.headers.get('user-agent')||''))return;
 if(!request.headers.get('accept')?.includes('text/html'))return;
 if(/^\/(?:admin|account|workspace)(?:\/|$)/.test(url.pathname))return;
 const month=visitorMonth(date),encoder=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',encoder.encode(env.AUTH_PEPPER),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=await crypto.subtle.sign('HMAC',key,encoder.encode('poigai-visitors:'+month+':'+ip));
 const id=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 await env.DB.prepare('INSERT OR IGNORE INTO visitor_monthly(month,visitor_hash) VALUES(?,?)').bind(month,id).run();
}
export async function visitorStats(env,date=new Date()) {
 try {
 const month=visitorMonth(date);
 const [count,meta]=await Promise.all([
 env.DB.prepare('SELECT COUNT(*) n FROM visitor_monthly WHERE month=?').bind(month).first(),
 env.DB.prepare("SELECT started_at FROM visitor_tracking WHERE id=1").first()
 ]);
 return {count:count?.n??0,month,startedAt:meta?.started_at??null};
 }catch{return {count:null,month:visitorMonth(date),startedAt:null};}
}
