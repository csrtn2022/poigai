const districts=[...document.querySelectorAll('.district')],groups=[...document.querySelectorAll('.state-group')];
const q=document.querySelector('#district-query'),state=document.querySelector('#district-state'),select=document.querySelector('#district-select'),problem=document.querySelector('#district-problem');
const normalize=s=>s.normalize('NFKC').toLocaleLowerCase().trim();
function filterDistricts(){
 let count=0;const terms=normalize(q.value).split(/\s+/).filter(Boolean);
 for(const card of districts){const haystack=normalize(card.textContent+' '+card.dataset.aliases);card.hidden=!(terms.every(t=>haystack.includes(t))&&(!state.value||card.dataset.state===state.value)&&(!select.value||card.id===select.value)&&(!problem.value||card.dataset.problems.split(' ').includes(problem.value)));if(!card.hidden){count++;if(select.value)card.querySelector('details').open=true;}}
 for(const group of groups)group.hidden=!districts.some(c=>!c.hidden&&c.dataset.state===group.dataset.state);
 for(const option of select.options){const mismatch=!!(state.value&&option.dataset.state&&option.dataset.state!==state.value);option.hidden=mismatch;option.disabled=mismatch;}
 document.querySelector('#district-count').textContent=`Showing ${count} of ${districts.length} district profiles`;
 document.querySelector('#district-empty').hidden=count!==0;
 const url=new URL(location.href);for(const [key,value]of [['q',q.value],['state',state.value],['district',select.value],['problem',problem.value]]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}history.replaceState(null,'',url);
}
const params=new URLSearchParams(location.search);q.value=params.get('q')||'';for(const [control,key]of [[state,'state'],[select,'district'],[problem,'problem']])if([...control.options].some(o=>o.value===params.get(key)))control.value=params.get(key);
if(select.value){const selected=districts.find(c=>c.id===select.value);if(selected)state.value=selected.dataset.state;}
q.addEventListener('input',filterDistricts);problem.addEventListener('change',filterDistricts);
state.addEventListener('change',()=>{if(select.value&&districts.find(c=>c.id===select.value)?.dataset.state!==state.value)select.value='';filterDistricts();});
select.addEventListener('change',()=>{if(select.value){state.value=districts.find(c=>c.id===select.value).dataset.state;q.value='';problem.value='';}filterDistricts();});
document.querySelector('#district-filters').addEventListener('submit',e=>e.preventDefault());
document.querySelector('#district-filters').addEventListener('reset',()=>{q.value=state.value=select.value=problem.value='';for(const d of districts)d.querySelector('details').open=false;filterDistricts();});
function revealHash(){const id=decodeURIComponent(location.hash.slice(1));const target=document.getElementById(id);if(!target)return;if(target.classList.contains('district')){q.value=problem.value='';state.value=target.dataset.state;select.value=target.id;filterDistricts();target.querySelector('details').open=true;}else if(target.classList.contains('state-group')){q.value=select.value=problem.value='';state.value=target.dataset.state;filterDistricts();}target.scrollIntoView({block:'start'});}
window.addEventListener('hashchange',revealHash);filterDistricts();if(location.hash)revealHash();
let printState=[];window.addEventListener('beforeprint',()=>{printState=districts.filter(d=>!d.hidden).map(d=>[d.querySelector('details'),d.querySelector('details').open]);for(const [detail]of printState)detail.open=true;});window.addEventListener('afterprint',()=>{for(const [detail,open]of printState)detail.open=open;});document.querySelector('#district-print').addEventListener('click',()=>window.print());
