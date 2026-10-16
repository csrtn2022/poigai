import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import worker from '../server/worker.js';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('all donor pages, briefs and shared assets pass the public runtime allowlist',async()=>{
 const paths=['/','/funders/','/trust/','/partners/','/funders/briefs/d01/','/funders/briefs/d02/','/funders/briefs/d03/','/donors.css','/funders/funders.js','/funders/briefs/print.js'];
 for(const path of paths){let called=false;const response=await worker.fetch(new Request('https://www.poigai.com'+path),{ASSETS:{fetch:()=>{called=true;return new Response('asset');}}});assert.equal(response.status,200,path);assert(called,path);}
});
test('public briefs remain concepts and link to current full readiness records',()=>{
 for(const id of ['d01','d02','d03']){const html=read('funders/briefs/'+id+'/index.html');assert(html.includes('CONCEPT · NOT READY FOR FUNDING REVIEW'));assert(html.includes('/projects/#'+id.toUpperCase()));assert(html.includes('No amount or unit-cost-to-impact claim'));assert(html.includes('https://www.poigai.com/funders/briefs/'+id+'/'));}
 assert(read('trust/index.html').includes('No completed POIGAI demonstrator or measured project outcome is claimed.'));
});
test('published pages have local navigable routes; source and build contain the same deliverables',()=>{
 const pages=['index.html','funders/index.html','trust/index.html','partners/index.html',...['d01','d02','d03'].map(id=>'funders/briefs/'+id+'/index.html')];
 for(const page of pages){const html=read(page);const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].length,ids.size,page+' duplicate ids');
 for(const m of html.matchAll(/(?:href|src)="([^"?]+)(?:\?[^"#]*)?(?:#[^"]*)?"/g)){let target=m[1].split('#')[0];if(!target||/^(https?:|mailto:)/.test(target))continue;target=target.startsWith('/')?target.slice(1):target;const file=target.endsWith('/')?target+'index.html':target;assert(existsSync(new URL(file||'index.html',root)),`${page}: ${target}`);}
 const built=read('dist/'+page);const chrome='<link rel="stylesheet" href="/site-chrome.css?v=20261016-footer-v5"><script src="/site-chrome.js?v=20261016-footer-v5" defer></script>';assert(built.includes(chrome),page+' shared site chrome missing');assert.equal(built.replace(chrome,''),html,page+' build drift');}
});
