import {enquiries} from './enquiries.js';
import {adminApi} from './admin.js';
const encoder=new TextEncoder();
const COOKIE='__Host-poigai_session';
const TYPES=new Set(['ngo','corporate','technical','proponent']);
const GENERIC='If the address is eligible, an email will arrive with the next step. Check your spam folder too.';
const headers={
 'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 'Content-Security-Policy':"default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'",
 'Strict-Transport-Security':'max-age=31536000',
 'Permissions-Policy':'camera=(), microphone=(), geolocation=()'
};
class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
const now=()=>Math.floor(Date.now()/1000);
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const hash=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
async function mac(value,pepper){const key=await crypto.subtle.importKey('raw',encoder.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));}
export async function passwordHash(password,pepper,salt=random()){
 const key=await crypto.subtle.importKey('raw',await mac(password,pepper),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256);
 return `v1$${salt}$${hex(bits)}`;
}
function equal(a,b){if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0;}
export async function passwordMatches(password,stored,pepper){const [version,salt]=stored.split('$');return version==='v1'&&equal(await passwordHash(password,pepper,salt),stored);}
function passwordCheck(value){if(typeof value!=='string'||value.length<12||value.length>128)throw new HttpError(400,'Use a password between 12 and 128 characters.');}
function emailCheck(value){if(typeof value!=='string'||value.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(value.trim()))throw new HttpError(400,'Enter a valid email address.');return value.trim().toLowerCase();}
function textCheck(value,label,max){if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new HttpError(400,`Enter ${label} (maximum ${max} characters).`);return value.trim();}
function configured(env){return env.AUTH_ENABLED==='true'&&env.DB&&(env.RESEND_API_KEY||env.BREVO_API_KEY)&&env.AUTH_PEPPER?.length>=32&&env.APP_ORIGIN==='https://www.poigai.com';}
async function body(request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'Send JSON data.');const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Missing request.');let size=0,chunks=[];for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();throw new HttpError(413,'Request is too large.');}chunks.push(value);}try{const data=JSON.parse(new TextDecoder().decode(await new Blob(chunks).arrayBuffer()));if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw new HttpError(400,'Invalid request.');}}
async function limit(env,key,max,window){const time=now();const row=await env.DB.prepare(`INSERT INTO auth_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN expires_at<=? THEN 1 ELSE hits+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING hits`).bind(key,time+window,time,time,time+window).first();if(row.hits>max)throw new HttpError(429,'Too many attempts. Please try again later.');}
async function userForSession(request,env){const cookie=request.headers.get('cookie')||'';const value=cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!value||!/^[a-f0-9]{64}$/.test(value))return null;return env.DB.prepare(`SELECT u.* FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.status='active' AND u.email_verified_at IS NOT NULL`).bind(await hash(value),now()).first();}
const publicUser=u=>({name:u.name,email:u.email,organisation:u.organisation,stakeholderType:u.stakeholder_type,emailVerified:!!u.email_verified_at,organisationStatus:'Not reviewed'});
async function sendToken(env,user,purpose){
 const token=random(),digest=await hash(token),time=now();
 await env.DB.batch([env.DB.prepare('DELETE FROM auth_tokens WHERE user_id=? AND purpose=?').bind(user.id,purpose),env.DB.prepare('INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at,created_at) VALUES(?,?,?,?,?)').bind(digest,user.id,purpose,time+(purpose==='reset'?1800:86400),time)]);
 const link=`${env.APP_ORIGIN}/account/#${purpose}=${token}`;
 const subject=purpose==='reset'?'Reset your POIGAI password':'Verify your POIGAI email';
 try{const message=`${subject}\n\n${link}\n\nThis link expires in ${purpose==='reset'?'30 minutes':'24 hours'} and can be used once. If you did not request it, ignore this email.\n\nPOIGAI | Climate Action & Impact Stewardship`;const useBrevo=!!env.BREVO_API_KEY;const response=await fetch(useBrevo?'https://api.brevo.com/v3/smtp/email':'https://api.resend.com/emails',{method:'POST',headers:useBrevo?{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json'}:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(useBrevo?{sender:{name:'POIGAI',email:'contact@poigai.com'},to:[{email:user.email}],subject,textContent:message}:{from:'POIGAI <contact@poigai.com>',to:[user.email],subject,text:message})});if(!response.ok)throw Error();}catch{await env.DB.prepare('DELETE FROM auth_tokens WHERE token_hash=?').bind(digest).run();throw new HttpError(503,'Email delivery is temporarily unavailable. Please try again later.');}
}
async function api(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/api/auth/status'&&request.method==='GET')return json({available:!!configured(env)});
 if(!configured(env))throw new HttpError(503,'Stakeholder accounts are being prepared. Please return soon or contact contact@poigai.com.');
 if(path==='/api/auth/me'&&request.method==='GET'){const user=await userForSession(request,env);return user?json({user:publicUser(user)}):json({error:'Please sign in.'},401);}
 if(request.method!=='POST')throw new HttpError(405,'Method not allowed.');
 if(request.headers.get('origin')!==env.APP_ORIGIN)throw new HttpError(403,'Please use the official POIGAI website.');
 const ip=request.headers.get('cf-connecting-ip')||'local';
 await limit(env,'ip:'+await hash(ip),60,600);
 const data=await body(request);
 if(path==='/api/auth/register'){
  const email=emailCheck(data.email),name=textCheck(data.name,'your name',100),organisation=textCheck(data.organisation,'your organisation or community',200);
  if(!TYPES.has(data.stakeholderType)||data.consent!==true)throw new HttpError(400,'Select your stakeholder type and confirm account data consent.');
  passwordCheck(data.password);await limit(env,'email:'+await hash(email),5,900);
  const password=await passwordHash(data.password,env.AUTH_PEPPER);
  const id=crypto.randomUUID(),time=now();
  await env.DB.prepare('INSERT INTO auth_users(id,email,name,organisation,stakeholder_type,password_hash,consent_at,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING').bind(id,email,name,organisation,data.stakeholderType,password,time,time).run();
  const user=await env.DB.prepare('SELECT * FROM auth_users WHERE email=?').bind(email).first();
  // Existing accounts are never overwritten by an unauthenticated registration.
  if(user?.id===id)await sendToken(env,user,'verify');
  return json({message:GENERIC},202);
 }
 if(path==='/api/auth/login'){
  const email=emailCheck(data.email);passwordCheck(data.password);await limit(env,'login:'+await hash(email),10,900);
  const user=await env.DB.prepare('SELECT * FROM auth_users WHERE email=?').bind(email).first();
  const dummy='v1$'+('0'.repeat(64))+'$'+('0'.repeat(64));
  const valid=await passwordMatches(data.password,user?.password_hash||dummy,env.AUTH_PEPPER);
  if(!valid||!user||user.status!=='active')throw new HttpError(401,'Email or password is incorrect.');
  if(!user.email_verified_at)throw new HttpError(403,'Verify your email before signing in. You can request a fresh verification email.');
  const token=random(),time=now();await env.DB.batch([env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=? AND expires_at<=?').bind(user.id,time),env.DB.prepare('INSERT INTO auth_sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await hash(token),user.id,time+28800,time)]);
  return json({user:publicUser(user)},200,{'Set-Cookie':`${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=28800`});
 }
 if(path==='/api/auth/forgot'||path==='/api/auth/resend'){
  const email=emailCheck(data.email);await limit(env,'email:'+await hash(email),5,900);
  const user=await env.DB.prepare('SELECT * FROM auth_users WHERE email=?').bind(email).first();
  if(user?.status==='active'&&(path.endsWith('forgot')||!user.email_verified_at))await sendToken(env,user,path.endsWith('forgot')?'reset':'verify');
  return json({message:GENERIC},202);
 }
 if(path==='/api/auth/verify'||path==='/api/auth/reset'){
  if(typeof data.token!=='string'||!/^[a-f0-9]{64}$/.test(data.token))throw new HttpError(400,'This link is invalid or expired. Request a new email.');
  const purpose=path.endsWith('reset')?'reset':'verify';
  let password;if(purpose==='reset'){passwordCheck(data.password);password=await passwordHash(data.password,env.AUTH_PEPPER);}
  const digest=await hash(data.token),time=now();
  // DELETE RETURNING makes consuming each token atomic, including concurrent requests.
  const token=await env.DB.prepare('DELETE FROM auth_tokens WHERE token_hash=? AND purpose=? AND expires_at>? RETURNING user_id').bind(digest,purpose,time).first();
  if(!token)throw new HttpError(400,'This link is invalid or expired. Request a new email.');
  if(purpose==='verify')await env.DB.prepare("UPDATE auth_users SET email_verified_at=? WHERE id=? AND status='active'").bind(time,token.user_id).run();
  else await env.DB.batch([env.DB.prepare("UPDATE auth_users SET password_hash=? WHERE id=? AND status='active'").bind(password,token.user_id),env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(token.user_id),env.DB.prepare('DELETE FROM auth_tokens WHERE user_id=?').bind(token.user_id)]);
  return json({message:purpose==='verify'?'Email verified. You can now sign in.':'Password updated. Please sign in with your new password.'});
 }
 if(path==='/api/auth/logout'){
  const cookie=request.headers.get('cookie')||'',token=cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if(token)await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await hash(token)).run();
  return json({message:'You are signed out.'},200,{'Set-Cookie':`${COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`});
 }
 throw new HttpError(404,'Not found.');
}
let cleanupAt=0;
async function cleanup(env){
 const time=now();
 await env.DB.batch(['auth_tokens','auth_sessions','auth_limits'].map(table=>env.DB.prepare(`DELETE FROM ${table} WHERE expires_at<=?`).bind(time)));
}
const PUBLIC_PATHS=new Set(['/knowledge','/knowledge/','/knowledge/index.html','/knowledge/knowledge.css','/knowledge/knowledge.js','/knowledge/data.json','/knowledge/knowledge-bank.md','/knowledge/sources.csv','/partners','/partners/','/partners/index.html','/donors.css','/funders','/funders/','/funders/index.html','/funders/funders.js','/trust','/trust/','/trust/index.html','/funders/briefs/print.js','/funders/briefs/d01','/funders/briefs/d01/','/funders/briefs/d01/index.html','/funders/briefs/d02','/funders/briefs/d02/','/funders/briefs/d02/index.html','/funders/briefs/d03','/funders/briefs/d03/','/funders/briefs/d03/index.html','/','/index.html','/styles.css','/theme.css','/assets/climate/water.svg','/assets/climate/heat.svg','/assets/climate/agriculture.svg','/assets/climate/south-india.svg','/script.js','/enquiry.js','/robots.txt','/sitemap.xml','/assets/poigai-social.png','/assets/poigai-symbol.svg','/account','/account/','/account/index','/account/index.html','/account/account.css','/account/account.js','/projects','/projects/','/projects/index','/projects/index.html','/projects/projects.css','/projects/projects.js']);
export default {
 async fetch(request,env,context){try{
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/')){
   const response=url.pathname.startsWith('/api/admin/')?await adminApi(request,env,passwordMatches):url.pathname.startsWith('/api/enquiries')?await enquiries(request,env):await api(request,env);
   if(env.DB&&context?.waitUntil&&now()-cleanupAt>3600){cleanupAt=now();context.waitUntil(cleanup(env).catch(()=>{}));}
   return response;
  }
  if(!PUBLIC_PATHS.has(url.pathname) && !url.pathname.startsWith('/admin/'))return new Response('Not found',{status:404,headers:{...headers,'Content-Type':'text/plain; charset=utf-8'}});
  // One canonical origin keeps host-only sessions and email links consistent.
  if(url.hostname==='poigai.com'&&url.pathname.startsWith('/account'))return Response.redirect('https://www.poigai.com'+url.pathname+url.search,308);
  const response=await env.ASSETS.fetch(request),out=new Response(response.body,response);
  for(const [key,value]of Object.entries(headers))if(key!=='Content-Type'&&key!=='Cache-Control')out.headers.set(key,value);
  if(url.pathname.startsWith('/account'))out.headers.set('Cache-Control','no-store');
  return out;
 }catch(error){return json({error:error instanceof HttpError?error.message:'The service is temporarily unavailable. Please try again later.'},error instanceof HttpError?error.status:503,error.status===429?{'Retry-After':'900'}:{});}}
};
