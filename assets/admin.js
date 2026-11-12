/* Sir Oyedot Creator Studio
   No service_role or Supabase secret keys belong in browser code.
   Authentication via Supabase Auth; authorization enforced by Postgres RLS.
*/
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const config = window.SIR_OYEDOT_CMS || {};
  const base = String(config.url || '').replace(/\/+$/, '');
  const key = String(config.publishableKey || '');
  const configured = /^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(base) && key.startsWith('sb_publishable_');
  const STORE = 'sir_oyedot_creator_studio_session';
  const state = {session:null,videos:[],projects:[],settings:null,tab:'overview'};
  const staticHeaders = () => ({apikey:key,'Content-Type':'application/json','Accept':'application/json'});

  const feedback = (message, isError=false, login=false) => {
    const el = $(login?'login-feedback':'workspace-feedback');
    if(!el) return;
    el.textContent=message || '';
    el.classList.toggle('error',!!isError);
  };
  const errorMessage = (json, fallback) => json?.msg || json?.message || json?.error_description || json?.error || fallback;
  const readJSON = async response => {
    const text=await response.text();
    try { return text ? JSON.parse(text) : null; } catch { return {message:text.slice(0,200)}; }
  };
  const persist = () => {
    if(state.session) sessionStorage.setItem(STORE,JSON.stringify(state.session));
    else sessionStorage.removeItem(STORE);
  };
  const tokenPayload = token => {
    try {
      const raw=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      return JSON.parse(atob(raw));
    } catch { return null; }
  };
  const adoptSession = payload => {
    const expiresAt=Math.floor(Date.now()/1000)+Number(payload.expires_in || 3600);
    state.session={access_token:payload.access_token,refresh_token:payload.refresh_token,expires_at:expiresAt};
    persist();
  };
  const signIn = async (email,password) => {
    const response=await fetch(base+'/auth/v1/token?grant_type=password',{
      method:'POST',headers:staticHeaders(),body:JSON.stringify({email,password})
    });
    const data=await readJSON(response);
    if(!response.ok || !data?.access_token)throw new Error(errorMessage(data,'Sign-in failed'));
    adoptSession(data);
    await checkAdminAndOpen();
  };
  const logout = async (message) => {
    const token=state.session?.access_token;
    state.session=null;persist();
    if(token) {
      fetch(base+'/auth/v1/logout',{method:'POST',headers:{...staticHeaders(),Authorization:'Bearer '+token}}).catch(()=>{});
    }
    $('workspace').hidden=true;
    $('logout').hidden=true;
    $('login-panel').hidden=false;
    if(message)feedback(message,true,true);
  };
  const freshToken = async () => {
    if(!state.session)throw new Error('Sign in first');
    if(state.session.expires_at > Math.floor(Date.now()/1000)+45)return state.session.access_token;
    const response=await fetch(base+'/auth/v1/token?grant_type=refresh_token',{
      method:'POST',headers:staticHeaders(),body:JSON.stringify({refresh_token:state.session.refresh_token})
    });
    const data=await readJSON(response);
    if(!response.ok || !data?.access_token) { state.session=null;persist();throw new Error('Session expired. Please sign in again.'); }
    adoptSession(data);
    return state.session.access_token;
  };
  const authorizedFetch = async(path,options={}) => {
    const access=await freshToken();
    const response=await fetch(base+path,{
      method:options.method || 'GET',
      headers:{...staticHeaders(),Authorization:'Bearer '+access,...options.headers},
      ...(options.body!==undefined ? {body:JSON.stringify(options.body)} : {})
    });
    const data=await readJSON(response);
    if(!response.ok) {
      if(response.status===401)throw new Error('Your login expired. Please sign in again.');
      throw new Error(errorMessage(data,'Request failed ('+response.status+')'));
    }
    return data;
  };
  const api = async(path,options={}) => authorizedFetch('/rest/v1/'+path,options);
  const request = async (method,table,payload,id) => {
    const route=table+(id ? '?id=eq.'+encodeURIComponent(id):'');
    return api(route,{method,body:payload,headers:{Prefer:'return=representation'}});
  };
  const checkAdminAndOpen = async() => {
    const user=await authorizedFetch('/auth/v1/user');
    if(!user?.id)throw new Error('Could not verify your account.');
    const admin=await api('admin_users?select=user_id&user_id=eq.'+encodeURIComponent(user.id));
    if(!Array.isArray(admin) || !admin.length) {
      await logout('This account is not authorized as a site administrator.');
      return;
    }
    $('login-panel').hidden=true;
    $('setup-panel').hidden=true;
    $('workspace').hidden=false;
    $('logout').hidden=false;
    await loadAll();
  };
  const showTab = tab => {
    if(!['overview','videos','projects','settings'].includes(tab))return;
    state.tab=tab;
    document.querySelectorAll('[data-tab]').forEach(button=>{
      const active=button.getAttribute('data-tab')===tab;
      if(button.classList.contains('side-button')) {
        button.classList.toggle('active',active);
        if(active)button.setAttribute('aria-current','page');
        else button.removeAttribute('aria-current');
      }
    });
    document.querySelectorAll('#workspace .panel').forEach(panel=>panel.hidden=(panel.id!=='tab-'+tab));
    const labels={
      overview:['Studio overview','Everything that powers your published portfolio.'],
      videos:['Video library','Manage your TikTok and YouTube videos.'],
      projects:['Creative projects','Manage the stories featured on your website.'],
      settings:['Site settings','Update contact information and your homepage announcement.']
    };
    $('view-title').textContent=labels[tab][0];$('view-description').textContent=labels[tab][1];
    feedback('');
  };
  const make = (tag,cls,text) => {
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=String(text);
    return el;
  };
  const badge = published => make('span','status'+(published?'':' draft'),published?'Published':'Draft');
  const form = id => $(id);
  const value=(id,name)=>String(form(id).elements.namedItem(name)?.value || '').trim();
  const numberValue=(id,name)=>Number(value(id,name)||100);
  const checked=(id,name)=>!!form(id).elements.namedItem(name)?.checked;
  const resetVideo = () => {
    form('video-form').reset();
    form('video-form').elements.namedItem('id').value='';
    $('video-form-title').textContent='Add a video';
  };
  const resetProject = () => {
    form('project-form').reset();
    form('project-form').elements.namedItem('id').value='';
    form('project-form').elements.namedItem('slug').readOnly=false;
    $('project-form-title').textContent='Add a project';
  };
  const fill = (formId, data, names) => {
    const f=form(formId);
    for(const name of names) {
      const element=f.elements.namedItem(name);
      if(!element)continue;
      if(element.type==='checkbox')element.checked=!!data[name];
      else element.value=data[name]===null || data[name]===undefined?'':String(data[name]);
    }
    f.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  };
  const renderItems = (items,containerId,kind) => {
    const container=$(containerId);
    container.replaceChildren();
    if(!items.length){container.append(make('p','muted-note','No '+kind+' yet. Use the form above to add one.'));return;}
    items.forEach(item=>{
      const row=make('article','list-item');
      const content=make('div');
      content.append(make('span','item-label',kind==='video'?item.platform.toUpperCase()+' / '+item.sort_order:item.label+' / '+item.sort_order));
      content.append(make('h3','',item.title));
      const meta=make('p','',kind==='video'?item.url:(item.slug+' · '+item.summary.slice(0,125)));
      content.append(meta,badge(item.published));
      const controls=make('div','item-actions');
      const edit=make('button','','Edit'); edit.type='button';
      edit.addEventListener('click',()=> {
        showTab(kind==='video'?'videos':'projects');
        if(kind==='video'){
          $('video-form-title').textContent='Edit video';
          fill('video-form',item,['id','platform','title','url','poster_url','sort_order','published']);
        } else {
          $('project-form-title').textContent='Edit project';
          fill('project-form',item,['id','slug','label','title','summary','note','link_url','link_label','art_text','art_style','sort_order','published']);
          form('project-form').elements.namedItem('slug').readOnly=true;
        }
      });
      const remove=make('button','danger','Delete');remove.type='button';
      remove.setAttribute('aria-label','Delete '+item.title);
      remove.addEventListener('click',async()=>{
        if(!window.confirm('Permanently delete "'+item.title+'"? This cannot be undone.'))return;
        try {
          await request('DELETE',kind==='video'?'video_items':'project_items',undefined,item.id);
          feedback(item.title+' deleted.');
          if(kind==='video')resetVideo();else resetProject();
          await loadAll();
        } catch(err){feedback(err.message,true);}
      });
      controls.append(edit,remove);
      row.append(content,controls);
      container.append(row);
    });
  };
  const loadAll=async()=>{
    feedback('Loading your content...');
    const [videos,projects,settings] = await Promise.all([
      api('video_items?select=*&order=sort_order.asc,id.asc'),
      api('project_items?select=*&order=sort_order.asc,id.asc'),
      api('site_settings?select=*&id=eq.1')
    ]);
    state.videos=Array.isArray(videos)?videos:[];
    state.projects=Array.isArray(projects)?projects:[];
    state.settings=Array.isArray(settings)?settings[0]:null;
    $('stat-videos').textContent=state.videos.length;
    $('stat-published').textContent=state.videos.filter(x=>x.published).length;
    $('stat-projects').textContent=state.projects.length;
    renderItems(state.videos,'video-list','video');
    renderItems(state.projects,'project-list','project');
    if(state.settings){
      const form=$('settings-form');
      ['announcement','whatsapp_number','contact_email'].forEach(field=>{
        form.elements.namedItem(field).value=state.settings[field] || '';
      });
    }
    feedback('');
  };
  const validateHttps = (url,required=false) => {
    if(!url && !required)return '';
    try {const u=new URL(url);if(u.protocol==='https:')return u.href;} catch{}
    throw new Error('Use a valid https:// link'+(required?' (required)':'')+'.');
  };
  form('login-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const button=e.currentTarget.querySelector('button[type=submit]');
    button.disabled=true;
    feedback('Signing in...',false,true);
    try {
      await signIn(value('login-form','email'),value('login-form','password'));
      form('login-form').elements.namedItem('password').value='';
      feedback('',false,true);
    } catch(err){
      feedback(err.message,true,true);
      if(state.session && $('workspace').hidden) {state.session=null;persist();}
    } finally{button.disabled=false;}
  });
  form('video-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const button=e.currentTarget.querySelector('button[type=submit]');button.disabled=true;
    try{
      const id=value('video-form','id');
      const payload={platform:value('video-form','platform'),title:value('video-form','title'),
        url:validateHttps(value('video-form','url'),true),
        poster_url:validateHttps(value('video-form','poster_url')),
        sort_order:numberValue('video-form','sort_order'),
        published:checked('video-form','published')};
      const result=await request(id?'PATCH':'POST','video_items',payload,id);
      if(!Array.isArray(result)||!result.length)throw new Error('No row was updated. Check your admin permissions.');
      resetVideo();await loadAll();feedback('Video saved and ready on your website.');
    }catch(err){feedback(err.message,true);}finally{button.disabled=false;}
  });
  form('project-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const button=e.currentTarget.querySelector('button[type=submit]');button.disabled=true;
    try{
      const id=value('project-form','id');
      const slug=value('project-form','slug');
      if(!/^[a-z0-9-]+$/.test(slug))throw new Error('Use only lower-case letters, numbers and hyphens in the slug.');
      const payload={label:value('project-form','label'),title:value('project-form','title'),
        summary:value('project-form','summary'),note:value('project-form','note'),
        link_url:validateHttps(value('project-form','link_url')),
        link_label:value('project-form','link_label')||'Watch the work',
        art_text:value('project-form','art_text'),
        art_style:value('project-form','art_style'),
        sort_order:numberValue('project-form','sort_order'),
        published:checked('project-form','published')};
      if(!id)payload.slug=slug;
      const result=await request(id?'PATCH':'POST','project_items',payload,id);
      if(!Array.isArray(result)||!result.length)throw new Error('No row was updated. Check your admin permissions.');
      resetProject();await loadAll();feedback('Project saved and ready on your website.');
    }catch(err){feedback(err.message,true);}finally{button.disabled=false;}
  });
  form('settings-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const button=e.currentTarget.querySelector('button[type=submit]');button.disabled=true;
    try{
      const number=value('settings-form','whatsapp_number').replace(/[\s()+-]/g,'');
      if(number && !/^[1-9][0-9]{7,14}$/.test(number))throw new Error('WhatsApp must be an international number using digits only.');
      const result=await request('PATCH','site_settings',{
        announcement:value('settings-form','announcement'),
        whatsapp_number:number,
        contact_email:value('settings-form','contact_email')
      },1);
      if(!Array.isArray(result)||!result.length)throw new Error('Settings were not saved. Check your admin permissions.');
      await loadAll();feedback('Website settings saved successfully.');
    }catch(err){feedback(err.message,true);}finally{button.disabled=false;}
  });
  document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
    showTab(button.getAttribute('data-tab'));
    if(button.closest('.quick-actions'))window.scrollTo({top:0,behavior:'smooth'});
  }));
  $('new-video').addEventListener('click',()=>{resetVideo();form('video-form').scrollIntoView({behavior:'smooth'});});
  $('new-project').addEventListener('click',()=>{resetProject();form('project-form').scrollIntoView({behavior:'smooth'});});
  $('cancel-video').addEventListener('click',resetVideo);
  $('cancel-project').addEventListener('click',resetProject);
  $('logout').addEventListener('click',()=>logout());
  if(!configured){
    $('setup-panel').hidden=false;
    $('login-panel').hidden=true;
  } else {
    $('setup-panel').hidden=true;
    $('login-panel').hidden=false;
    try {
      const stored=JSON.parse(sessionStorage.getItem(STORE)||'null');
      if(stored?.access_token && stored?.refresh_token && stored?.expires_at) state.session=stored;
    } catch {sessionStorage.removeItem(STORE);}
    if(state.session)checkAdminAndOpen().catch(err=>logout(err.message));
  }
})();
