const cards=[...document.querySelectorAll('.issue')];
const search=document.querySelector('#search'),state=document.querySelector('#state'),theme=document.querySelector('#theme');
const normalize=s=>s.normalize('NFKC').toLocaleLowerCase().trim();
function applyFilters(){
 const terms=normalize(search.value).split(/\s+/).filter(Boolean);
 let count=0;
 for(const card of cards){const text=normalize(card.textContent);card.hidden=!(terms.every(t=>text.includes(t))&&(!state.value||card.dataset.states.split('|').includes(state.value))&&(!theme.value||card.dataset.theme===theme.value));if(!card.hidden)count++;}
 document.querySelector('#count').textContent=`Showing ${count} of ${cards.length} issue briefs`;
 document.querySelector('#empty').hidden=count!==0;
 const url=new URL(location.href);for(const [key,value]of [['q',search.value],['state',state.value],['theme',theme.value]]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}history.replaceState(null,'',url);
}
const params=new URLSearchParams(location.search);search.value=params.get('q')||'';
for(const [control,key]of [[state,'state'],[theme,'theme']]){if([...control.options].some(o=>o.value===params.get(key)))control.value=params.get(key);}
for(const control of [search,state,theme])control.addEventListener('input',applyFilters);
document.querySelector('#filters').addEventListener('submit',e=>e.preventDefault());
document.querySelector('#filters').addEventListener('reset',()=>{search.value=state.value=theme.value='';applyFilters();});
const sources=[...document.querySelectorAll('.source')],sourceSearch=document.querySelector('#source-search');
sourceSearch.addEventListener('input',()=>{const terms=normalize(sourceSearch.value).split(/\s+/).filter(Boolean);let count=0;for(const source of sources){source.hidden=!terms.every(t=>normalize(source.textContent).includes(t));if(!source.hidden)count++;}document.querySelector('#source-count').textContent=`Showing ${count} of ${sources.length} sources`;document.querySelector('#source-empty').hidden=!!count;});
function followHash(){const id=decodeURIComponent(location.hash.slice(1));const target=document.getElementById(id);if(!target)return;if(target.classList.contains('source')){sourceSearch.value='';sourceSearch.dispatchEvent(new Event('input'));}if(target.classList.contains('issue')){if(target.hidden){search.value=state.value=theme.value='';applyFilters();}target.querySelector('details').open=true;}target.scrollIntoView({block:'start'});}
window.addEventListener('hashchange',followHash);applyFilters();if(location.hash)followHash();
let printState=[];
window.addEventListener('beforeprint',()=>{printState=[...document.querySelectorAll('details')].map(d=>[d,d.open]);for(const [d]of printState)d.open=true;});
window.addEventListener('afterprint',()=>{for(const [d,open]of printState)d.open=open;});
document.querySelector('#print').addEventListener('click',()=>window.print());
