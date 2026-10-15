const h={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const j=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:h});
const now=()=>Math.floor(Date.now()/1000);
const clean=(s,max=500)=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=max?s.trim():null;
const role=['ngo','funder','technical','community'];
const families=['water','heat','flood','agriculture','coasts','biodiversity','energy','waste','other'];
const impacts=['people','livestock','trees','lakes','farms','heat','flood','energy','other'];
const stages=['draft','submitted','needs_info','under_review','eligible_for_matching','declined','contracted','in_delivery','completed'];
const rows=async(stmt,...args)=>(await stmt.bind(...args).all()).results;
const audit=(env,actor,recordType,recordId,action)=>env.DB.prepare('INSERT INTO impact_audit(id,actor_type,actor_id,record_type,record_id,action,occurred_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'stakeholder',actor,recordType,recordId,action,now()).run();
const owner=async(env,userId)=>env.DB.prepare('SELECT * FROM impact_organisations WHERE owner_user_id=?').bind(userId).first();
const project=async(env,orgId,id)=>env.DB.prepare('SELECT * FROM impact_proposals WHERE organisation_id=? AND id=?').bind(orgId,id).first();
export async function impactApi(req,env,getUser){
 const path=new URL(req.url).pathname;
 if(path==='/api/impact/directory'&&req.method==='GET'){
  const params=new URL(req.url).searchParams;
  const kind=params.get('kind')||'',state=params.get('state')||'';
  const result=await rows(env.DB.prepare("SELECT id,name,kind,state,district,description,website,updated_at FROM impact_organisations WHERE public_consent=1 AND verification_status='verified' AND public_approved_at IS NOT NULL AND (?='' OR kind=?) AND (?='' OR state=?) ORDER BY name LIMIT 100"),kind,kind,state,state);
  return j({organisations:result,disclaimer:'Opted-in verified profiles only; listing is not government or POIGAI funding endorsement.'});
 }
 const user=await getUser(req,env);
 if(!user)return j({error:'Sign in to a verified stakeholder account.'},401);
 const organisation=await owner(env,user.id);
 const org=organisation;
 if(path==='/api/impact/my'&&req.method==='GET'){
  const org=organisation;
  const projects=org?await rows(env.DB.prepare('SELECT * FROM impact_proposals WHERE organisation_id=? ORDER BY updated_at DESC LIMIT 100'),org.id):[];
  return j({organisation:org,projects});
 }
 if(path==='/api/impact/preferences'&&req.method==='GET'){
  if(!org||org.kind!=='funder')return j({error:'Funder organisation profile required.'},403);
  const preferences=await env.DB.prepare('SELECT * FROM impact_funder_preferences WHERE organisation_id=?').bind(org.id).first();
  return j({preferences});
 }
 if(path==='/api/impact/matches'&&req.method==='GET'){
  if(!org)return j({matches:[],note:'Create an organisation profile before seeking partnerships.'});
  if(org.kind==='funder'){
   const pref=await env.DB.prepare('SELECT * FROM impact_funder_preferences WHERE organisation_id=?').bind(org.id).first();
   if(org.verification_status!=='verified'||!pref?.matching_consent)return j({matches:[],note:'Matching requires verified funder status and explicit interest-profile consent.'});
   const matches=await rows(env.DB.prepare("SELECT p.id,p.title,p.state,p.district,p.issue_family,p.impact_category,p.budget_inr FROM impact_proposals p JOIN impact_organisations o ON o.id=p.organisation_id WHERE p.stage='eligible_for_matching' AND p.match_consent=1 AND o.verification_status='verified' AND (?='' OR p.state=?) AND (?='any' OR p.issue_family=?) AND (?='any' OR p.impact_category=?) AND (?=0 OR p.budget_inr>=?) AND (?=0 OR p.budget_inr<=?) ORDER BY p.updated_at DESC LIMIT 50"),pref.state,pref.state,pref.issue_family,pref.issue_family,pref.impact_category,pref.impact_category,pref.min_budget_inr,pref.min_budget_inr,pref.max_budget_inr,pref.max_budget_inr);
   return j({matches,note:'Private preliminary suitability screening only; no applicant contacts, approval or funding commitment disclosed.'});
  }
  const matches=await rows(env.DB.prepare("SELECT id,name,kind,state,district,description,website FROM impact_organisations WHERE public_consent=1 AND public_approved_at IS NOT NULL AND verification_status='verified' AND owner_user_id<>? AND kind='funder' AND (state=? OR state='Pan-India') ORDER BY name LIMIT 30"),user.id,org.state);
  return j({matches,note:'Opted-in public funder profiles only. Geographic discovery does not establish funding interest.'});
 }
 if(path==='/api/impact/detail'&&req.method==='GET'){
  const requested=new URL(req.url).searchParams.get('id');
  if(!org||!requested)return j({error:'Project unavailable.'},404);
  const p=await project(env,org.id,requested);if(!p)return j({error:'Project unavailable.'},404);
  const [milestones,metrics]=await Promise.all([
   rows(env.DB.prepare('SELECT id,title,due_date,status,evidence_note,updated_at FROM impact_milestones WHERE proposal_id=? ORDER BY updated_at DESC LIMIT 100'),p.id),
   rows(env.DB.prepare('SELECT id,indicator,unit,baseline,target,observed,verification,updated_at FROM impact_metrics WHERE proposal_id=? ORDER BY updated_at DESC LIMIT 100'),p.id)
  ]);
  return j({project:p,milestones,metrics});
 }
 if(req.method!=='POST')return j({error:'Method not allowed.'},405);
 if(req.headers.get('origin')!=='https://www.poigai.com')return j({error:'Invalid origin.'},403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return j({error:'JSON required.'},415);
 const raw=await req.text();if(raw.length>8192)return j({error:'Request too large.'},413);
 let data;try{data=JSON.parse(raw);}catch{return j({error:'Invalid JSON.'},400)}
 if(!data||typeof data!=='object'||Array.isArray(data))return j({error:'Invalid request.'},400);
 const time=now();
 if(path==='/api/impact/preferences'){
  if(!org||org.kind!=='funder')return j({error:'Funder profile required.'},403);
  const state=typeof data.state==='string'?data.state.trim().slice(0,100):'';
  const issue=clean(data.issueFamily,30),impact=clean(data.impactCategory,30),min=Number(data.minBudget||0),max=Number(data.maxBudget||0);
  if((issue!=='any'&&!families.includes(issue))||(impact!=='any'&&!impacts.includes(impact))||!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||min<0||max<0||(max>0&&min>max))return j({error:'Invalid funder preferences.'},400);
  await env.DB.prepare("INSERT INTO impact_funder_preferences(organisation_id,state,issue_family,impact_category,min_budget_inr,max_budget_inr,matching_consent,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(organisation_id) DO UPDATE SET state=excluded.state,issue_family=excluded.issue_family,impact_category=excluded.impact_category,min_budget_inr=excluded.min_budget_inr,max_budget_inr=excluded.max_budget_inr,matching_consent=excluded.matching_consent,updated_at=excluded.updated_at").bind(org.id,state,issue,impact,min,max,data.consent===true?1:0,time).run();
  await audit(env,user.id,'funder_preferences',org.id,'preferences_changed');
  return j({message:'Private matching preferences saved.'});
 }
 if(path==='/api/impact/match-consent'){
  if(!org||org.kind==='funder'||typeof data.consent!=='boolean')return j({error:'Implementer consent required.'},403);
  const id=clean(data.id,80),p=id?await project(env,org.id,id):null;
  if(!p)return j({error:'Project not found.'},404);
  if(!['draft','submitted','needs_info','under_review','eligible_for_matching'].includes(p.stage))return j({error:'Project stage prevents consent changes.'},409);
  await env.DB.prepare('UPDATE impact_proposals SET match_consent=?,updated_at=? WHERE id=? AND organisation_id=?').bind(data.consent?1:0,time,id,org.id).run();
  await audit(env,user.id,'proposal',id,data.consent?'matching_opt_in':'matching_opt_out');
  return j({message:data.consent?'Matching consent recorded; eligibility review is still required.':'Matching consent withdrawn.'});
 }
 if(path==='/api/impact/organisation'){
  const name=clean(data.name,150),kind=clean(data.kind,20),state=clean(data.state,100),district=clean(data.district,100),description=clean(data.description,1000),registration=typeof data.registration==='string'?data.registration.slice(0,120):'',website=typeof data.website==='string'?data.website.slice(0,250):'';
  if(!name||!role.includes(kind)||!state||!district||!description)return j({error:'Complete the organisation fields.'},400);
  if(website&&(!/^https:\/\//.test(website)||website.includes('@')))return j({error:'Use a public HTTPS organisation website.'},400);
  if(!org){
   const id=crypto.randomUUID();
   await env.DB.prepare('INSERT INTO impact_organisations(id,owner_user_id,name,kind,state,district,registration_reference,description,website,public_consent,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,user.id,name,kind,state,district,registration,description,website,data.publicConsent===true?1:0,time,time).run();
   await audit(env,user.id,'organisation',id,'created');
  }else{
   await env.DB.prepare("UPDATE impact_organisations SET name=?,kind=?,state=?,district=?,registration_reference=?,description=?,website=?,public_consent=?,verification_status='pending',public_approved_at=NULL,updated_at=? WHERE id=? AND owner_user_id=?").bind(name,kind,state,district,registration,description,website,data.publicConsent===true?1:0,time,org.id,user.id).run();
   await audit(env,user.id,'organisation',org.id,'resubmitted_for_review');
  }
  return j({message:'Saved privately. Public listing requires consent and independent admin verification.'},201);
 }
 if(!org)return j({error:'Create your organisation profile first.'},409);
 if(path==='/api/impact/proposal'){
  const title=clean(data.title,160),state=clean(data.state,100),district=clean(data.district,100),issue=clean(data.issue,120),beneficiaries=clean(data.beneficiaries,350),need=clean(data.need,1400),strategy=clean(data.strategy,1400),baseline=clean(data.baseline,900),maintenance=clean(data.maintenance,900);
  const budget=data.budget===null||data.budget===''?null:Number(data.budget);
  if(!title||!state||!district||!issue||!beneficiaries||!need||!strategy||!baseline||!maintenance||(budget!==null&&(!Number.isSafeInteger(budget)||budget<0||budget>1e12)))return j({error:'Complete the project requirements and use a valid budget.'},400);
  const id=crypto.randomUUID();
  await env.DB.prepare('INSERT INTO impact_proposals(id,organisation_id,title,state,district,issue,beneficiaries,need,strategy,baseline,budget_inr,maintenance_plan,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,org.id,title,state,district,issue,beneficiaries,need,strategy,baseline,budget,maintenance,time,time).run();
  await audit(env,user.id,'proposal',id,'draft_created');
  return j({message:'Private project draft created.',id},201);
 }
 const id=clean(data.id,80),p=id?await project(env,org.id,id):null;
 if(!p)return j({error:'Proposal not found.'},404);
 if(path==='/api/impact/submit'){
  if(!['draft','needs_info'].includes(p.stage))return j({error:'Only drafts or information requests can be submitted.'},409);
  await env.DB.prepare("UPDATE impact_proposals SET stage='submitted',updated_at=? WHERE id=? AND organisation_id=?").bind(time,id,org.id).run();
  await audit(env,user.id,'proposal',id,'submitted');
  return j({message:'Submitted for review. This is not a funding approval.'});
 }
 if(path==='/api/impact/milestone'){
  if(!['contracted','in_delivery'].includes(p.stage))return j({error:'Milestones open only after separately approved contracting.'},403);
  const title=clean(data.title,160),note=clean(data.note,1000);
  if(!title||!note)return j({error:'Milestone title and evidence note required.'},400);
  const mid=crypto.randomUUID();await env.DB.prepare("INSERT INTO impact_milestones(id,proposal_id,title,status,evidence_note,updated_at) VALUES(?,? ,?,'submitted',?,?)").bind(mid,id,title,note,time).run();
  await audit(env,user.id,'milestone',mid,'evidence_submitted');
  return j({message:'Milestone evidence submitted for independent verification.'},201);
 }
 if(path==='/api/impact/metric'){
  if(!['contracted','in_delivery'].includes(p.stage))return j({error:'Metrics open only for contracted projects.'},403);
  const indicator=clean(data.indicator,120),unit=clean(data.unit,50),n=Number(data.observed);
  if(!indicator||!unit||!Number.isFinite(n)||Math.abs(n)>1e12)return j({error:'Valid indicator, unit and observation required.'},400);
  const mid=crypto.randomUUID();await env.DB.prepare("INSERT INTO impact_metrics(id,proposal_id,indicator,unit,observed,verification,updated_at) VALUES(?,?,?,?,?,'unverified',?)").bind(mid,id,indicator,unit,n,time).run();
  await audit(env,user.id,'metric',mid,'observation_submitted');
  return j({message:'Observation saved unverified.'},201);
 }
 return j({error:'Not found.'},404);
}
