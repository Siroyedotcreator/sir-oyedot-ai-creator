const $=id=>document.getElementById(id),api=(action,options={})=>fetch('/api/admin?action='+action,{credentials:'same-origin',...options}).then(async r=>{const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'Request failed');return data});
const status=message=>{$('status').textContent=message};
const addVideo=url=>{const row=document.createElement('div');row.className='video-row';const input=document.createElement('input');input.type='url';input.placeholder='https://www.tiktok.com/... or https://youtube.com/...';input.value=url||'';input.setAttribute('aria-label','Video link');const remove=document.createElement('button');remove.className='button danger';remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove video');remove.onclick=()=>row.remove();row.append(input,remove);$('videos').append(row)};
async function load(){status('Loading website content...');try{const data=await api('content');const c=data.content;$('announcement').value=c.announcement||'';$('about').value=c.about||'';$('whatsapp').value=c.whatsapp||'';$('videos').replaceChildren();(c.videos||[]).forEach(v=>addVideo(v.url));status('Ready. Edit your content and select Save.')}catch(e){status(e.message)}}
async function init(){try{await api('session');$('login').classList.add('hidden');$('dashboard').classList.remove('hidden');await load()}catch{status('Sign in to continue.')}}
$('login-form').addEventListener('submit',async e=>{e.preventDefault();status('Signing in...');try{await api('login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('password').value})});$('password').value='';await init()}catch(e){status(e.message)}});
$('add-video').onclick=()=>addVideo('');
$('reload').onclick=load;
$('save').onclick=async()=>{const videos=[...$('videos').querySelectorAll('input')].map(x=>x.value.trim()).filter(Boolean).map(url=>({url}));const content={announcement:$('announcement').value,about:$('about').value,whatsapp:$('whatsapp').value,videos};status('Publishing your website changes...');$('save').disabled=true;try{const r=await api('content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content})});status(r.message)}catch(e){status(e.message)}finally{$('save').disabled=false}};
$('change-form').addEventListener('submit',async e=>{
e.preventDefault();status('Changing password...');
try{const response=await api('change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({current:$('current-password').value,next:$('new-password').value})});$('current-password').value='';$('new-password').value='';$('dashboard').classList.add('hidden');$('login').classList.remove('hidden');status(response.message)}
catch(error){status(error.message)}
});
$('logout').onclick=async()=>{await api('logout',{method:'POST'}).catch(()=>{});$('dashboard').classList.add('hidden');$('login').classList.remove('hidden');status('Signed out.')};init();
