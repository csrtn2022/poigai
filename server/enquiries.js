const response=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const origin='https://www.poigai.com';
async function ready(env){
 if(env.ENQUIRIES_ENABLED!=='true'||!env.DB)return false;
 try{const tables=await env.DB.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table' AND name IN ('enquiries','auth_limits')").first();return tables?.n===2;}catch{return false;}
}
export async function enquiries(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/api/enquiries/status'&&request.method==='GET')return response({available:await ready(env)});
 if(path!=='/api/enquiries')return response({error:'Not found.'},404);
 if(request.method!=='POST')return response({error:'Method not allowed.'},405,{'Allow':'POST'});
 if(request.headers.get('origin')!==origin)return response({error:'Please use www.poigai.com to submit your enquiry.'},403);
 if(!await ready(env))return response({error:'Online submission is unavailable. Use the email or copy option below.'},503);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return response({error:'Send JSON data.'},415);
 let data;
 try{
  const reader=request.body?.getReader();if(!reader)throw Error();let size=0,chunks=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();return response({error:'Enquiry is too long.'},413);}chunks.push(value);}
  data=JSON.parse(await new Blob(chunks).text());
 }catch{return response({error:'Invalid enquiry.'},400);}
 const clean=(key,max)=>typeof data?.[key]==='string'?data[key].trim().slice(0,max+1):'';
 const name=clean('name',100),organisation=clean('organisation',200),email=clean('email',254).toLowerCase(),stakeholderType=clean('stakeholderType',30),projectId=clean('projectId',10),location=clean('location',200),interest=clean('interest',2500),requestId=clean('requestId',36);
 if(!name||name.length>100||organisation.length>200||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!['donor','diaspora','foundation','ngo','corporate','technical','proponent','owner','other'].includes(stakeholderType)||!['general','D01','D02','D03'].includes(projectId)||location.length>200||!interest||interest.length>2500||data.consent!==true||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))return response({error:'Check your details and confirm enquiry data consent.'},400);
 const payloadHash=await digest(JSON.stringify([name,organisation,email,stakeholderType,projectId,location,interest]));
 const time=Math.floor(Date.now()/1000);
 // Rate-limit retries too; public references never permit reading stored enquiries.
 for(const [key,max,window]of [['enquiry:ip:'+await digest(request.headers.get('cf-connecting-ip')||'local'),10,900],['enquiry:email:'+await digest(email),5,3600]]){
  const limit=await env.DB.prepare('INSERT INTO auth_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN expires_at<=? THEN 1 ELSE hits+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING hits').bind(key,time+window,time,time,time+window).first();
  if(limit.hits>max)return response({error:'Too many attempts. Please try again in one hour or email contact@poigai.com.'},429,{'Retry-After':'3600'});
 }
 const id='PG-'+crypto.randomUUID();
 await env.DB.prepare('INSERT INTO enquiries(id,request_id,payload_hash,stakeholder_type,name,organisation,email,project_id,location,interest,consent_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_id) DO NOTHING').bind(id,requestId,payloadHash,stakeholderType,name,organisation,email,projectId,location,interest,time,time).run();
 const saved=await env.DB.prepare('SELECT id,payload_hash FROM enquiries WHERE request_id=?').bind(requestId).first();
 if(saved.payload_hash!==payloadHash)return response({error:'This request reference was already used. Reload before preparing a new enquiry.'},409);
 return response({reference:saved.id,message:'Your enquiry has been saved for POIGAI review. Keep this reference. This is not a project approval or funding commitment.'},201);
}
