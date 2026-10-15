const menu=document.querySelector('.menu'),nav=document.querySelector('#nav');
if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');menu.focus();}});document.addEventListener('click',e=>{if(nav.classList.contains('open')&&!nav.contains(e.target)&&!menu.contains(e.target)){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}});}
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
const sections=[...document.querySelectorAll('main section[id],main .belief[id]')];
const railLinks=[...document.querySelectorAll('.rail-link')];
if('IntersectionObserver' in window&&sections.length&&railLinks.length){
 const observer=new IntersectionObserver(entries=>{
  const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(!visible)return;
  railLinks.forEach(link=>{const active=link.getAttribute('href')==='#'+visible.target.id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 },{rootMargin:'-20% 0px -55% 0px',threshold:[0,.15,.35,.6]});
 sections.forEach(section=>observer.observe(section));
}
