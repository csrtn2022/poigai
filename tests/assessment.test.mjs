import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {calculate} from '../knowledge/assessment/calculator.js';
import worker from '../server/worker.js';
const fileChrome="<link rel=\"stylesheet\" href=\"/site-chrome.css?v=20261016-ripple-fix2\"><script src=\"/site-chrome.js?v=20261016-ripple-fix2\" defer></script>";
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('cost scenarios keep unknown costs unpriced and reject invalid ranges',()=>{
 assert.deepEqual(calculate([{quantity:'10',low:'160000',high:'160000'},{quantity:'',low:'',high:''}]),{low:1600000,high:1600000,priced:1,unpriced:1,errors:[]});
 assert.equal(calculate([{quantity:'2.5',low:'100',high:'120'}]).high,300);
 for(const row of [{quantity:'1',low:'',high:'10'},{quantity:'1',low:'20',high:'10'},{quantity:'-1',low:'10',high:'20'},{quantity:'1e308',low:'10',high:'20'}])assert.equal(calculate([row]).errors.length,1);
 assert.equal(calculate([{quantity:'0',low:'0',high:'0'}]).priced,1);
});
test('assessment records distinguish screening counts from unmeasured actual impacts',()=>{
 const d=JSON.parse(read('knowledge/assessment/data.json'));assert.equal(d.profiles.length,144);assert.equal(d.problems.length,20);
 for(const p of d.profiles){assert.equal(p.screeningProblems.length,new Set(p.screeningProblems).size);assert(p.screeningProblems.length>3);for(const id of p.screeningProblems)assert(d.problems.some(q=>q.id===id));for(const k of ['verifiedProblemCount','affectedPeople','livestock','trees','lakes','estimatedCostINR'])assert.equal(p[k],null);}
 for(const p of d.problems)for(const id of p.indicators)assert(d.indicators.some(i=>i.id===id));
 assert.equal(d.benchmarks[0].geography,'Telangana');assert.equal(d.benchmarks[0].year,'2025–26');
 assert.equal(read('knowledge/assessment/problem-register.csv').trim().split('\n').length,1+d.profiles.reduce((n,p)=>n+p.screeningProblems.length,0));
});
test('assessment page, calculator and downloads are public with matching build copies',async()=>{
 for(const f of ['index.html','assessment.css','assessment.js','calculator.js','data.json','problem-register.csv','impact-template.csv']){const path='knowledge/assessment/'+f;assert.equal(read(path),read('dist/'+path).replace(fileChrome,''));let served=false;const r=await worker.fetch(new Request('https://www.poigai.com/'+path),{ASSETS:{fetch:()=>{served=true;return new Response('public');}}});assert.equal(r.status,200);assert(served);}
 const html=read('knowledge/assessment/index.html');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 for(const m of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)){if(!m[1].startsWith('/'))continue;const path=m[1].split('?')[0];assert(existsSync(new URL('..'+path+(path.endsWith('/')?'index.html':''),import.meta.url)),path);}
 assert(read('knowledge/districts/index.html').includes('/knowledge/assessment/#tn-ramanathapuram'));
});
