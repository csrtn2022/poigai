const el=id=>document.getElementById(id),form=el('form');
const roles=['ngo','corporate','technical','proponent','owner','other'],projectIds=['general','D01','D02','D03'];
const params=new URLSearchParams(location.search);if(roles.includes(params.get('role')))el('type').value=params.get('role');if(projectIds.includes(params.get('project')))el('project').value=params.get('project');
let online=false,busy=false,requestId='',fingerprint='';
const feedback=text=>{el('msg').textContent=text;};
const data=()=>({stakeholderType:el('type').value,name:el('name').value.trim(),organisation:el('org').value.trim(),email:el('email').value.trim(),projectId:el('project').value,location:el('location').value.trim(),interest:el('interest').value.trim(),consent:el('enquiry-consent').checked});
function draft(d){
 const text=`POIGAI enquiry\n\nStakeholder: ${el('type').selectedOptions[0].textContent}\nName: ${d.name}\nOrganisation/community: ${d.organisation}\nEmail: ${d.email}\nProject: ${el('project').selectedOptions[0].textContent}\nLocation: ${d.location||'To discuss'}\n\n${d.interest}\n\nI agree to POIGAI using these details to respond to this enquiry.\nPrepared at www.poigai.com; enquiry only, with no funding or partnership commitment.`;
 el('enquiry-draft').value=text;el('email-draft').href='mailto:contact@poigai.com?subject='+encodeURIComponent('POIGAI enquiry — '+d.projectId)+'&body='+encodeURIComponent(text);el('draft-panel').hidden=false;
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!form.reportValidity())return;const d=data();draft(d);
 if(!online){feedback('Your draft is ready. Nothing has been sent. Open your email draft or copy the text below, review it and press Send in your email application.');el('msg').focus();return;}
 const next=JSON.stringify(d);if(next!==fingerprint){requestId=crypto.randomUUID();fingerprint=next;}
 busy=true;el('enquiry-submit').disabled=true;feedback('Saving your enquiry…');
 try{const res=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...d,requestId})});const result=await res.json();if(!res.ok)throw Error(result.error||'Unable to confirm submission.');feedback(`${result.message} Reference: ${result.reference}`);el('draft-panel').hidden=true;}
 catch(error){feedback(`${error.message} Submission has not been confirmed. You can retry with the same details, or use the email draft below. If you email after a retry, mention that an online enquiry may also exist.`);}
 finally{busy=false;el('enquiry-submit').disabled=false;el('msg').focus();}
});
el('copy-enquiry').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(el('enquiry-draft').value);feedback('Enquiry copied. Paste it into an email to contact@poigai.com, review it and press Send.');}catch{el('enquiry-draft').focus();el('enquiry-draft').select();feedback('Select and copy the enquiry text, then email contact@poigai.com.');}});
fetch('/api/enquiries/status',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(status=>{online=status.available===true&&location.origin==='https://www.poigai.com';if(online){el('enquiry-submit').textContent='Submit enquiry ↗';el('enquiry-availability').textContent='Online enquiry submission is available. No account is required.';el('enquiry-method').textContent='Submitting saves your details for POIGAI review and returns a reference. It does not create an account, submit a funding application or guarantee a response date.';}}).catch(()=>{});
