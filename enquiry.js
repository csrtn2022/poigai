const el=id=>document.getElementById(id),form=el('form');
const roles=['donor','diaspora','foundation','ngo','corporate','technical','proponent','owner','other'];
const projectIds=['general','D01','D02','D03'],intents=['brief','assessment','diligence','conversation'];
const params=new URLSearchParams(location.search);
// District briefs carry only a public location label into the optional enquiry.
if(params.has('location')&&el('location')){el('location').value=params.get('location').trim().slice(0,200);const optional=document.querySelector('.d-optional');if(optional)optional.open=true;}
if(roles.includes(params.get('role')))el('type').value=params.get('role');
if(projectIds.includes(params.get('project')))el('project').value=params.get('project');
if(intents.includes(params.get('intent')))el('intent').value=params.get('intent');
let online=false,busy=false,requestId='',fingerprint='';
const feedback=text=>{el('msg').textContent=text;};
const data=()=>({stakeholderType:el('type').value,name:el('name').value.trim(),organisation:el('org').value.trim(),email:el('email').value.trim(),projectId:el('project').value,location:el('location').value.trim(),interest:`Request: ${el('intent').selectedOptions[0].textContent}\nCountry / jurisdiction: ${el('country').value.trim()||'Not specified'}\n\n${el('interest').value.trim()}`,consent:el('enquiry-consent').checked});
function draft(d){
 const text=`POIGAI enquiry\n\nStakeholder: ${el('type').selectedOptions[0].textContent}\nName: ${d.name}\nOrganisation/community: ${d.organisation||'Not specified / individual'}\nEmail: ${d.email}\nProject: ${el('project').selectedOptions[0].textContent}\nLocation: ${d.location||'To discuss'}\n\n${d.interest}\n\nI agree to POIGAI using these details to respond to this enquiry.\nPrepared at www.poigai.com; enquiry only, with no financial or partnership commitment.`;
 el('enquiry-draft').value=text;
 el('email-draft').href='mailto:contact@poigai.com?subject='+encodeURIComponent('POIGAI enquiry — '+d.projectId)+'&body='+encodeURIComponent(text);
 el('draft-panel').hidden=false;
}
function availability(){
 el('enquiry-submit').textContent=online?'Submit enquiry ↗':'Prepare email enquiry ↗';
 el('enquiry-availability').textContent=online?'Online enquiry submission is available. No account is required.':'Email enquiry: prepare your message here, then send it from your email app.';
 el('enquiry-method').textContent=online?'Submission saves your enquiry for POIGAI review and returns a reference. Keep that reference. This is not a funding application or a donation.':'Nothing is sent by this button. Review the draft, open your email app and press Send.';
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!form.reportValidity())return;const d=data();draft(d);
 if(!online){feedback('Step 1 of 2: your draft is ready; nothing has been sent. Step 2: open the email draft or copy the text, then press Send in your email app.');el('msg').focus();return;}
 const next=JSON.stringify(d);if(next!==fingerprint){requestId=crypto.randomUUID();fingerprint=next;}
 busy=true;el('enquiry-submit').disabled=true;form.setAttribute('aria-busy','true');feedback('Saving your enquiry…');
 try{
  const res=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...d,requestId}),signal:AbortSignal.timeout(15000)});
  const result=await res.json();
  if(!res.ok)throw Error(result.error||'Unable to confirm submission.');
  if(typeof result.reference!=='string'||!/^PG-[a-f0-9-]{36}$/i.test(result.reference))throw Error('Unable to confirm a submission reference.');
  feedback(`Enquiry received. Reference: ${result.reference}. Keep this reference. POIGAI can review your interest and clarify possible next steps. A response time is not yet committed. No payment, grant or partnership is agreed.`);
  el('draft-panel').hidden=true;
 }catch(error){
  feedback(`${error.name==='TimeoutError'?'The connection timed out.':error.message} Submission has not been confirmed. Retry with the same details or use the email draft below. If you also email, mention that an online enquiry may already exist.`);
 }finally{busy=false;el('enquiry-submit').disabled=false;form.removeAttribute('aria-busy');el('msg').focus();}
});
el('copy-enquiry').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(el('enquiry-draft').value);feedback('Enquiry copied; it has not been sent. Paste it into an email to contact@poigai.com, review it and press Send.');}
 catch{el('enquiry-draft').focus();el('enquiry-draft').select();feedback('Select and copy the enquiry text, then email contact@poigai.com. Nothing has been sent by copying.');}
});
fetch('/api/enquiries/status',{cache:'no-store',signal:AbortSignal.timeout(6000)}).then(r=>r.ok?r.json():{}).then(status=>{online=status.available===true&&location.protocol==='https:';availability();}).catch(()=>{online=false;availability();});
