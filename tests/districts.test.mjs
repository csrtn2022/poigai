import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import worker from '../server/worker.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=JSON.parse(read('knowledge/districts/data.json'));
const bank=JSON.parse(read('knowledge/data.json'));
test('all 144 current districts have distinct practical profiles, evidence routes and boundary caveats',()=>{
 assert.equal(data.districts.length,144);assert.equal(new Set(data.districts.map(d=>d.id)).size,144);
 for(const [code,count]of Object.entries({TN:38,KL:14,KA:31,AP:28,TS:33})){assert.equal(data.districts.filter(d=>d.stateCode===code).length,count);assert.equal(data.states[code].expected,count);assert(new URL(data.states[code].directory));assert(new URL(data.states[code].evidence));}
 for(const d of data.districts){assert(d.context&&d.question&&d.boundaryNote&&d.status);assert.equal(new Set(d.priorities).size,3);for(const k of d.priorities){assert(data.problemTypes[k]);assert(bank.issues.some(i=>i.id===data.problemTypes[k].issue));}if(d.districtUrl)assert(new URL(d.districtUrl));}
 assert(data.districts.some(d=>d.name==='Markapuram'));assert(data.districts.some(d=>d.name==='Polavaram'));assert(data.districts.some(d=>d.name==='Bengaluru South'&&d.aliases.join(' ').includes('Ramanagara')));
});
test('public routes serve every district deliverable while all links and build copies remain valid',async()=>{
 for(const file of ['index.html','data.json','districts.css','districts.js','district-register.csv','district-knowledge-bank.md']){assert.equal(read('knowledge/districts/'+file),read('dist/knowledge/districts/'+file));let served=false;const r=await worker.fetch(new Request('https://www.poigai.com/knowledge/districts/'+file),{ASSETS:{fetch:()=>{served=true;return new Response('public');}}});assert.equal(r.status,200);assert(served);}
 const html=read('knowledge/districts/index.html');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const d of data.districts)assert(ids.includes(d.id));
 for(const m of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)){if(!m[1].startsWith('/'))continue;const path=m[1].split('?')[0];assert(existsSync(new URL('..'+path+(path.endsWith('/')?'index.html':''),import.meta.url)),path);}
 assert(html.includes('not 144 completed risk assessments'));assert(html.includes('No severity ranking'));assert(read('knowledge/index.html').includes('/knowledge/districts/'));assert(read('sitemap.xml').includes('https://www.poigai.com/knowledge/districts/'));
});
function el(textContent=''){return{textContent,value:'',hidden:false,disabled:false,open:false,dataset:{},events:{},options:[],classList:{contains:()=>false},addEventListener(k,f){this.events[k]=f;},scrollIntoView(){this.scrolled=true;}};}
test('district filters support state counts, old names, district selection, share links and printing only the selection',()=>{
 const nodes=Object.fromEntries(['district-query','district-state','district-select','district-problem','district-count','district-empty','district-filters','district-print'].map(id=>['#'+id,el()]));
 const cards=data.districts.map(d=>{const e=el(d.name+' '+d.context+' '+d.question+' '+d.priorities.map(k=>data.problemTypes[k].title).join(' '));e.id=d.id;e.dataset={state:d.stateCode,problems:d.priorities.join(' '),aliases:d.aliases.join(' ')};e.detail=el();e.querySelector=()=>e.detail;e.classList.contains=k=>k==='district';return e;});
 const groups=Object.keys(data.states).map(code=>{const e=el();e.id='state-'+code;e.dataset.state=code;e.classList.contains=k=>k==='state-group';return e;});
 nodes['#district-state'].options=['',...Object.keys(data.states)].map(value=>({value,dataset:{}}));nodes['#district-select'].options=[{value:'',dataset:{}},...cards.map(c=>({value:c.id,dataset:{state:c.dataset.state}}))];nodes['#district-problem'].options=['',...Object.keys(data.problemTypes)].map(value=>({value,dataset:{}}));
 const events={};const ctx={document:{querySelector:s=>nodes[s],querySelectorAll:s=>s==='.district'?cards:groups,getElementById:id=>[...cards,...groups].find(c=>c.id===id)},window:{addEventListener:(k,f)=>events[k]=f,print(){}},location:{href:'https://www.poigai.com/knowledge/districts/',search:'',hash:''},history:{replaceState(){}},URL,URLSearchParams};
 vm.runInNewContext(read('knowledge/districts/districts.js'),ctx);
 nodes['#district-state'].value='AP';nodes['#district-state'].events.change();assert.equal(cards.filter(c=>!c.hidden).length,28);assert.equal(groups.filter(g=>!g.hidden).length,1);
 nodes['#district-filters'].events.reset();nodes['#district-query'].value='Ramanagara';nodes['#district-query'].events.input();assert.deepEqual(cards.filter(c=>!c.hidden).map(c=>c.id),['ka-bengaluru-south']);
 nodes['#district-select'].value='ap-markapuram';nodes['#district-select'].events.change();assert.equal(nodes['#district-state'].value,'AP');assert.equal(cards.filter(c=>!c.hidden).length,1);assert(cards.find(c=>c.id==='ap-markapuram').detail.open);
 nodes['#district-state'].value='TS';nodes['#district-state'].events.change();assert.equal(nodes['#district-select'].value,'');assert.equal(cards.filter(c=>!c.hidden).length,33);
 nodes['#district-query'].value='impossible term';nodes['#district-query'].events.input();assert.equal(nodes['#district-empty'].hidden,false);
 ctx.location.hash='#tn-ramanathapuram';events.hashchange();assert.equal(cards.filter(c=>!c.hidden).length,1);assert.equal(nodes['#district-state'].value,'TN');assert(cards.find(c=>c.id==='tn-ramanathapuram').detail.open);
 events.beforeprint();assert.equal(cards.find(c=>c.id==='kl-wayanad').detail.open,false);events.afterprint();
 nodes['#district-filters'].events.reset();assert.equal(cards.filter(c=>!c.hidden).length,144);assert(cards.every(c=>!c.detail.open));
});
