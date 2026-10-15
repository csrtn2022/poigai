import test from 'node:test';
import assert from 'node:assert/strict';
import {impactApi} from '../server/impact.js';
import worker from '../server/worker.js';
const request=(path,method='GET',body,origin='https://www.poigai.com')=>new Request('https://www.poigai.com'+path,{method,headers:body?{'Content-Type':'application/json',Origin:origin}:{},body:body?JSON.stringify(body):undefined});
function fakeDB(organisation=null,proposal=null){
 const sql=[];
 return {sql,prepare(query){const statement={bind(...params){statement.params=params;return statement},async first(){sql.push({query,params:statement.params});if(query.includes('FROM impact_organisations WHERE owner_user_id='))return organisation;if(query.includes('FROM impact_proposals WHERE organisation_id=? AND id=?'))return proposal;return null},async all(){sql.push({query,params:statement.params});return {results:[]}},async run(){sql.push({query,params:statement.params});return {success:true}}};return statement}};
}
test('impact private operations require verified account; public directory exposes only approved opt-in profiles',async()=>{
 const db=fakeDB(),env={DB:db};const unavailable=await impactApi(request('/api/impact/my'),env,async()=>null);
 assert.equal(unavailable.status,401);
 const directory=await impactApi(request('/api/impact/directory'),env,async()=>null);
 assert.equal(directory.status,200);
 assert.deepEqual((await directory.json()).organisations,[]);
 assert.match(db.sql[0].query,/public_consent=1.*verification_status='verified'.*public_approved_at IS NOT NULL/);
});
test('partner proposal creation stays tied to owner and rejects cross-origin writes',async()=>{
 const db=fakeDB({id:'org-1',kind:'ngo',state:'Tamil Nadu'}),env={DB:db};
 const wrong=await impactApi(request('/api/impact/proposal','POST',{title:'x'},'https://another.example'),env,async()=>({id:'user-1'}));
 assert.equal(wrong.status,403);
 const invalid=await impactApi(request('/api/impact/proposal','POST',{title:'Only title'}),env,async()=>({id:'user-1'}));
 assert.equal(invalid.status,400);
 assert.equal(db.sql.some(x=>x.query.startsWith('INSERT INTO impact_proposals')),false);
});
test('partner cannot enter delivery or report milestones without separately contracted project',async()=>{
 const db=fakeDB({id:'org-1',kind:'ngo',state:'Tamil Nadu'},{id:'p-1',stage:'submitted'});
 const r=await impactApi(request('/api/impact/milestone','POST',{id:'p-1',title:'work',note:'Evidence submitted'}),{DB:db},async()=>({id:'user-1'}));
 assert.equal(r.status,403);
 assert.equal(db.sql.some(x=>x.query.startsWith('INSERT INTO impact_milestones')),false);
});
test('worker routes public directory without authenticated stakeholder account',async()=>{
 const db=fakeDB();const res=await worker.fetch(request('/api/impact/directory'),{DB:db});
 assert.equal(res.status,200);
});
