import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import worker from '../server/worker.js';
const fileChrome="<link rel=\"stylesheet\" href=\"/site-chrome.css?v=20261016-logo-v3\"><script src=\"/site-chrome.js?v=20261016-logo-v3\" defer></script>";
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=JSON.parse(read('knowledge/data.json'));
test('knowledge claims remain traceable and publish with matching downloadable data',async()=>{
 const ids=new Set(data.sources.map(s=>s.id));assert.equal(ids.size,data.sources.length);
 for(const source of data.sources){assert.equal(new URL(source.url).protocol,'https:');for(const field of ['publisher','year','type','review','note','checked'])assert(source[field],source.id+' '+field);}
 const html=read('knowledge/index.html');const htmlIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(htmlIds).size,htmlIds.length);
 for(const issue of data.issues){assert(issue.sources.length);for(const id of issue.sources)assert(ids.has(id));for(const field of ['baseline','measure','owner','gap'])assert(issue[field]);assert(html.includes('id="'+issue.id+'"'));}
 for(const file of ['index.html','knowledge.css','knowledge.js','data.json','knowledge-bank.md','sources.csv']){assert.equal(read('knowledge/'+file),read('dist/knowledge/'+file).replace(fileChrome,''));let served=false;const response=await worker.fetch(new Request('https://www.poigai.com/knowledge/'+file),{ASSETS:{fetch:()=>{served=true;return new Response('public');}}});assert.equal(response.status,200);assert(served);}
 for(const match of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)){const target=match[1];if(!target.startsWith('/'))continue;const path=target.endsWith('/')?target+'index.html':target;assert(existsSync(new URL('..'+path,import.meta.url)),target);}
 assert(html.includes('not a review of every study'));assert(html.includes('Review depth:'));assert(html.includes('POIGAI planning synthesis'));
});
function element(textContent=''){return{textContent,value:'',hidden:false,open:false,dataset:{},events:{},options:[],classList:{contains:()=>false},addEventListener(type,fn){this.events[type]=fn;},dispatchEvent(e){this.events[e.type]?.(e);},scrollIntoView(){this.scrolled=true;}};}
test('search combines place, issue and keywords; reset, empty states, source lookup and shared anchors work',()=>{
 const nodes=Object.fromEntries(['search','state','theme','count','empty','filters','source-search','source-count','source-empty','print'].map(id=>['#'+id,element()]));
 const cards=data.issues.map(i=>{const el=element(JSON.stringify(i));el.id=i.id;el.dataset={states:i.states.join('|'),theme:i.theme};el.details=element();el.querySelector=()=>el.details;el.classList.contains=c=>c==='issue';return el;});
 const sources=data.sources.map(s=>{const el=element(JSON.stringify(s));el.id=s.id;el.classList.contains=c=>c==='source';return el;});
 for(const [key,values]of [['state',data.issues.flatMap(i=>i.states)],['theme',data.issues.map(i=>i.theme)]])nodes['#'+key].options=[...new Set(['',...values])].map(value=>({value}));
 const events={};const context={document:{querySelector:s=>nodes[s],querySelectorAll:s=>s==='.issue'?cards:s==='.source'?sources:cards.map(c=>c.details),getElementById:id=>[...cards,...sources].find(c=>c.id===id)},window:{addEventListener:(k,fn)=>events[k]=fn,print(){}},location:{href:'https://www.poigai.com/knowledge/',search:'',hash:''},history:{replaceState(){}},URL,URLSearchParams,Event};
 vm.runInNewContext(read('knowledge/knowledge.js'),context);
 nodes['#search'].value='Wayanad';nodes['#state'].value='Kerala';nodes['#theme'].value='Floods';nodes['#search'].events.input();assert.deepEqual(cards.filter(c=>!c.hidden).map(c=>c.id),['K05']);
 nodes['#state'].value='Puducherry';nodes['#state'].events.input();assert.equal(cards.filter(c=>!c.hidden).length,0);assert.equal(nodes['#empty'].hidden,false);
 nodes['#filters'].events.reset();assert.equal(cards.filter(c=>!c.hidden).length,data.issues.length);
 nodes['#source-search'].value='ICAR';nodes['#source-search'].events.input();assert(sources.filter(s=>!s.hidden).length>1);assert(sources.filter(s=>!s.hidden).length<data.sources.length);
 nodes['#search'].value='no matching phrase';nodes['#search'].events.input();context.location.hash='#K12';events.hashchange();assert.equal(cards.find(c=>c.id==='K12').hidden,false);assert.equal(cards.find(c=>c.id==='K12').details.open,true);
 events.beforeprint();assert(cards.every(c=>c.details.open));events.afterprint();assert.equal(cards.find(c=>c.id==='K01').details.open,false);
});
