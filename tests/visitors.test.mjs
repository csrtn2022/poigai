import test from 'node:test';
import assert from 'node:assert/strict';
import {recordVisitor,visitorMonth,visitorStats} from '../server/visitors.js';
function database(){const rows=new Set();return {rows,prepare(sql){let args=[];return {bind(...v){args=v;return this},async run(){rows.add(args.join(':'))},async first(){if(sql.includes('COUNT'))return {n:[...rows].filter(v=>v.startsWith(args[0]+':')).length};return {started_at:'2026-10-16T00:00:00Z'}}}}}}
const req=(ip='203.0.113.10',ua='Mozilla/5.0',path='/')=>new Request('https://www.poigai.com'+path,{headers:{'cf-connecting-ip':ip,'user-agent':ua,accept:'text/html'}});
test('month uses India boundary; visits deduplicate without storing raw IP and rotate monthly',async()=>{
 assert.equal(visitorMonth(new Date('2026-10-31T18:30:00Z')),'2026-11');
 const DB=database(),env={DB,AUTH_PEPPER:'test-pepper-only'};
 for(let i=0;i<2;i++)await recordVisitor(req(),env,new Date('2026-10-16'));
 assert.equal(DB.rows.size,1);assert.equal([...DB.rows][0].includes('203.0.113.10'),false);
 await recordVisitor(req('203.0.113.11'),env,new Date('2026-10-16'));
 assert.equal((await visitorStats(env,new Date('2026-10-16'))).count,2);
 await recordVisitor(req(),env,new Date('2026-11-01'));
 assert.equal((await visitorStats(env,new Date('2026-11-01'))).count,1);
});
test('bots, private workspaces, assets, missing IP and prefetch do not enter counter',async()=>{
 const DB=database(),env={DB,AUTH_PEPPER:'test-pepper-only'};
 for(const r of [req(undefined,'Googlebot'),req(undefined,'Mozilla/5.0','/admin/'),req(undefined,'Mozilla/5.0','/workspace/'),new Request('https://www.poigai.com/styles.css'),new Request('https://www.poigai.com/',{headers:{accept:'text/html'}}),new Request(req(),{headers:{...Object.fromEntries(req().headers),'sec-purpose':'prefetch'}})])await recordVisitor(r,env);
 assert.equal(DB.rows.size,0);
 assert.equal((await visitorStats({DB:{prepare(){throw Error('not migrated')}}})).count,null);
});
