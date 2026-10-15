const menu=document.querySelector('.menu'),nav=document.querySelector('#nav');
if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}));}
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
const form=document.querySelector('#form');
if(form)form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const v=id=>document.querySelector(id).value;const subject=encodeURIComponent('POIGAI enquiry — '+v('#type'));const body=encodeURIComponent('Enquiry type: '+v('#type')+'\nName: '+v('#name')+'\nOrganisation: '+v('#org')+'\nEmail: '+v('#email')+'\n\nInterest:\n'+v('#interest')+'\n\nDraft prepared on the POIGAI website preview.');const m=document.querySelector('#msg');m.textContent='Your enquiry draft is ready. Before launch, configure POIGAI’s official email or a secure form service to receive submissions. ';const a=document.createElement('a');a.href='mailto:?subject='+subject+'&body='+body;a.textContent='Open email draft ↗';a.className='under';m.appendChild(a);});
