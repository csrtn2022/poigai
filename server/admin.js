const COOKIE='__Host-poigai_admin';
const h={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...h,...extra}});
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');
const expiry=()=>Math.floor(Date.now()/1000);
function enabled(env){return env.ADMIN_ENABLED==='true'&&env.DB&&env.AUTH_PEPPER?.length>=32&&env.APP_ORIGIN==='https://www.poigai.com';}
async function session(request,env){const token=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;return env.DB.prepare("SELECT a.id,a.email,a.display_name FROM admin_sessions s JOIN admin_users a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>? AND a.status='active'").bind(await digest(token),expiry()).first();}
export async function adminApi(request,env,passwordMatches,passwordHash){
 const path=new URL(request.url).pathname;
 if(path==='/api/admin/status'&&request.method==='GET')return json({available:enabled(env)});

 if(!enabled(env))return json({error:'Administrator access is not activated.'},503);
 if(path==='/api/admin/request-activation'&&request.method==='POST'){
  if(request.headers.get('origin')!==env.APP_ORIGIN)return json({error:'Invalid origin.'},403);
  const t=expiry();
  const limiter=await env.DB.prepare("INSERT INTO auth_limits(key,hits,expires_at) VALUES('admin:owner-invite',1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN expires_at<=? THEN 1 ELSE hits+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING hits").bind(t+86400,t,t,t+86400).first();
  if(limiter.hits>3)return json({error:'Invitation limit reached. Try again tomorrow.'},429,{'Retry-After':'86400'});
  const owner=await env.DB.prepare("SELECT id,email FROM admin_users WHERE id='Admin' AND email='contact@poigai.com' AND status='pending' AND password_hash IS NULL").first();
  if(!owner)return json({error:'Activation not available.'},409);
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  await env.DB.batch([env.DB.prepare('DELETE FROM admin_activation_tokens WHERE admin_id=?').bind(owner.id),env.DB.prepare('INSERT INTO admin_activation_tokens(token_hash,admin_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await digest(token),owner.id,t+1800,t)]);
  const link=env.APP_ORIGIN+'/admin/#activate='+token;
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:'POIGAI <contact@poigai.com>',to:[owner.email],subject:'Activate your POIGAI administrator account',text:'Your owner-only POIGAI admin activation link (valid 30 minutes, single use):\n\n'+link+'\n\nDo not forward this link. If you did not request it, ignore this email.'})});
  if(!response.ok){await env.DB.prepare('DELETE FROM admin_activation_tokens WHERE token_hash=?').bind(await digest(token)).run();return json({error:'Mail delivery failed.'},503);}
  return json({message:'Activation email submitted to the fixed owner inbox.'},202);
 }
 if(path==='/api/admin/activate'&&request.method==='POST'){
  if(request.headers.get('origin')!==env.APP_ORIGIN)return json({error:'Invalid origin.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required.'},415);
  const raw=await request.text();if(raw.length>4096)return json({error:'Too large.'},413);
  let data;try{data=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
  if(typeof data.token!=='string'||!/^[a-f0-9]{64}$/.test(data.token)||typeof data.password!=='string'||data.password.length<12||data.password.length>128)return json({error:'Invalid or expired activation link or password.'},400);
  const hash=await passwordHash(data.password,env.AUTH_PEPPER),t=expiry();
  const used=await env.DB.prepare("DELETE FROM admin_activation_tokens WHERE token_hash=? AND expires_at>? RETURNING admin_id").bind(await digest(data.token),t).first();
  if(!used)return json({error:'Activation link expired or already used.'},400);
  const updated=await env.DB.prepare("UPDATE admin_users SET password_hash=?,status='active',activated_at=? WHERE id=? AND status='pending' AND password_hash IS NULL").bind(hash,t,used.admin_id).run();
  if(updated.meta.changes!==1)return json({error:'Activation unavailable.'},409);
  return json({message:'Administrator account activated. You can sign in.'});
 }

 if(path==='/api/admin/me'&&request.method==='GET'){const a=await session(request,env);return a?json({admin:a}):json({error:'Sign in required.'},401);}
 if(path==='/api/admin/login'&&request.method==='POST'){
  if(request.headers.get('origin')!==env.APP_ORIGIN)return json({error:'Invalid origin.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required.'},415);
  const raw=await request.text();if(raw.length>4096)return json({error:'Request too large.'},413);
  let data;try{data=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
  if(typeof data.email!=='string'||typeof data.password!=='string'||data.password.length>128)return json({error:'Invalid credentials.'},401);
  const email=data.email.trim().toLowerCase();if(email.length>254||!email.includes('@'))return json({error:'Invalid credentials.'},401);
  const ip=request.headers.get('cf-connecting-ip')||'local';const key='admin:'+await digest(email+':'+ip);const t=expiry();
  const counter=await env.DB.prepare('INSERT INTO auth_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN expires_at<=? THEN 1 ELSE hits+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING hits').bind(key,t+900,t,t,t+900).first();
  if(counter.hits>5)return json({error:'Too many login attempts.'},429,{'Retry-After':'900'});
  const admin=await env.DB.prepare("SELECT * FROM admin_users WHERE email=? AND status='active' AND password_hash IS NOT NULL").bind(email).first();
  if(!admin||!(await passwordMatches(data.password,admin.password_hash,env.AUTH_PEPPER)))return json({error:'Invalid credentials.'},401);
  const bytes=crypto.getRandomValues(new Uint8Array(32));const token=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
  await env.DB.prepare('INSERT INTO admin_sessions(token_hash,admin_id,created_at,expires_at) VALUES(?,?,?,?)').bind(await digest(token),admin.id,t,t+3600).run();
  return json({admin:{id:admin.id,email:admin.email,display_name:admin.display_name}},200,{'Set-Cookie':`${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=3600`});
 }
 if(path==='/api/admin/logout'&&request.method==='POST'){
  if(request.headers.get('origin')!==env.APP_ORIGIN)return json({error:'Invalid origin.'},403);
  const token=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if(token&&/^[a-f0-9]{64}$/.test(token))await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await digest(token)).run();
  return json({message:'Signed out.'},200,{'Set-Cookie':`${COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`});
 }
 const admin=await session(request,env);if(!admin)return json({error:'Administrator authentication required.'},401);
 if(path==='/api/admin/impact-review'&&request.method==='GET'){
  const [organisations,proposals]=await Promise.all([
   env.DB.prepare("SELECT id,name,kind,state,district,verification_status,public_consent,public_approved_at,created_at FROM impact_organisations ORDER BY updated_at DESC LIMIT 100").all(),
   env.DB.prepare("SELECT p.id,p.title,p.state,p.district,p.issue,p.stage,p.budget_inr,o.name organisation FROM impact_proposals p JOIN impact_organisations o ON o.id=p.organisation_id ORDER BY p.updated_at DESC LIMIT 100").all()
  ]);
  const [milestones,metrics]=await Promise.all([env.DB.prepare("SELECT m.id,m.title,m.status,m.evidence_note,m.proposal_id,p.title project FROM impact_milestones m JOIN impact_proposals p ON p.id=m.proposal_id ORDER BY m.updated_at DESC LIMIT 100").all(),env.DB.prepare("SELECT i.id,i.indicator,i.unit,i.observed,i.verification,i.proposal_id,p.title project FROM impact_metrics i JOIN impact_proposals p ON p.id=i.proposal_id ORDER BY i.updated_at DESC LIMIT 100").all()]);
  return json({organisations:organisations.results,proposals:proposals.results,milestones:milestones.results,metrics:metrics.results});
 }
 if(path==='/api/admin/impact-verify'&&request.method==='POST'){
  if(request.headers.get('origin')!==env.APP_ORIGIN)return json({error:'Invalid origin.'},403);
  const raw=await request.text();if(raw.length>2048)return json({error:'Too large.'},413);
  let data;try{data=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
  if(typeof data?.id!=='string'||!/^[a-f0-9-]{36}$/.test(data.id)||typeof data.reason!=='string'||data.reason.trim().length<12||data.reason.length>1000)return json({error:'Record and independent verification rationale required.'},400);
  const isMilestone=data.kind==='milestone',isMetric=data.kind==='metric';
  if(!isMilestone&&!isMetric)return json({error:'Invalid record type.'},400);
  const status=isMilestone?(data.status==='verified'?'verified':data.status==='rejected'?'rejected':null):(data.status==='verified'?'verified':data.status==='reviewed'?'reviewed':null);
  if(!status)return json({error:'Invalid verification status.'},400);
  const stmt=isMilestone?"UPDATE impact_milestones SET status=?,updated_at=? WHERE id=? AND status='submitted'":"UPDATE impact_metrics SET verification=?,updated_at=? WHERE id=? AND verification IN ('unverified','reviewed')";
  const result=await env.DB.prepare(stmt).bind(status,expiry(),data.id).run();
  if(result.meta?.changes!==1)return json({error:'Record cannot be verified in its current state.'},409);
  await env.DB.prepare('INSERT INTO impact_audit(id,actor_type,actor_id,record_type,record_id,action,occurred_at,details) VALUES(?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'administrator',admin.id,data.kind,data.id,'verification:'+status,expiry(),data.reason.trim()).run();
  return json({message:'Independent review decision recorded.'});
 }
 if(path==='/api/admin/impact-decision'&&request.method==='POST'){
  if(request.headers.get('origin')!==env.APP_ORIGIN)return json({error:'Invalid origin.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required.'},415);
  const raw=await request.text();if(raw.length>2048)return json({error:'Too large.'},413);
  let data;try{data=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
  if(!data||typeof data.id!=='string'||!/^[a-f0-9-]{36}$/.test(data.id))return json({error:'Invalid record.'},400);
  const t=expiry();
  const reason=typeof data.reason==='string'?data.reason.trim():'';
  if(reason.length<12||reason.length>1000)return json({error:'Provide a review rationale (12–1000 characters).'},400);
  if(data.kind==='organisation'){
   if(!['needs_info','verified','rejected'].includes(data.status)||typeof data.publicApproved!=='boolean')return json({error:'Invalid decision.'},400);
   const found=await env.DB.prepare('SELECT id,public_consent,verification_status FROM impact_organisations WHERE id=?').bind(data.id).first();
   if(!found)return json({error:'Record not found.'},404);
   if(data.publicApproved&&!found.public_consent)return json({error:'Explicit organisation publication consent required.'},409);
   const approved=data.status==='verified'&&data.publicApproved?t:null;
   await env.DB.prepare('UPDATE impact_organisations SET verification_status=?,public_approved_at=?,updated_at=? WHERE id=?').bind(data.status,approved,t,data.id).run();
  }else if(data.kind==='proposal'){
   if(!['needs_info','under_review','eligible_for_matching','declined','contracted','in_delivery','completed'].includes(data.status))return json({error:'Invalid decision.'},400);
   const p=await env.DB.prepare("SELECT p.stage,o.verification_status FROM impact_proposals p JOIN impact_organisations o ON o.id=p.organisation_id WHERE p.id=?").bind(data.id).first();
   if(!p)return json({error:'Record not found.'},404);
   const transitions={submitted:['needs_info','under_review','declined'],needs_info:['under_review','declined'],under_review:['needs_info','eligible_for_matching','declined'],eligible_for_matching:['under_review','contracted','declined'],contracted:['in_delivery'],in_delivery:['completed']};
   if(!transitions[p.stage]?.includes(data.status))return json({error:'Invalid project stage transition.'},409);
   if(['contracted','in_delivery','completed'].includes(data.status)&&!/^reference:[A-Za-z0-9 _./#:-]{8,}/.test(reason))return json({error:'Contracting or delivery requires a documented reference: ... review note.'},409);
   if(data.status==='completed'){
    const verified=await env.DB.prepare("SELECT COUNT(*) n FROM impact_milestones WHERE proposal_id=? AND status='verified'").bind(data.id).first();
    if(!verified?.n)return json({error:'At least one independently verified milestone is required before completion.'},409);
   }
   if(['eligible_for_matching','contracted','in_delivery','completed'].includes(data.status)&&p.verification_status!=='verified')return json({error:'Organisation verification required.'},409);
   await env.DB.prepare('UPDATE impact_proposals SET stage=?,updated_at=? WHERE id=?').bind(data.status,t,data.id).run();
  }else return json({error:'Invalid record type.'},400);
  await env.DB.prepare('INSERT INTO impact_audit(id,actor_type,actor_id,record_type,record_id,action,occurred_at,details) VALUES(?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'administrator',admin.id,data.kind,data.id,'status:'+data.status,t,reason).run();
  return json({message:'Decision saved with audit entry.'});
 }
 if(request.method!=='GET')return json({error:'Method not allowed.'},405);
 if(path==='/api/admin/summary'){
  const [u,q]=await Promise.all([env.DB.prepare('SELECT COUNT(*) n FROM auth_users').first(),env.DB.prepare('SELECT COUNT(*) n FROM enquiries').first()]);return json({adminId:admin.id,stakeholders:u.n,enquiries:q.n});
 }
 if(path==='/api/admin/enquiries'){
  const rows=await env.DB.prepare('SELECT id,stakeholder_type,name,organisation,email,project_id,location,interest,consent_at,created_at FROM enquiries ORDER BY created_at DESC LIMIT 50').all();return json({enquiries:rows.results});
 }
 if(path==='/api/admin/stakeholders'){
  const rows=await env.DB.prepare('SELECT id,email,name,organisation,stakeholder_type,email_verified_at,status,created_at FROM auth_users ORDER BY created_at DESC LIMIT 50').all();return json({stakeholders:rows.results});
 }
 return json({error:'Not found.'},404);
}
