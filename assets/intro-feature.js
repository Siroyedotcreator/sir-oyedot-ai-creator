/* Render a verified, owner-selected YouTube introduction above the homepage hero. */
(async()=>{'use strict';
const section=document.getElementById('introduction');
const target=document.getElementById('intro-feature-player');
if(!section||!target)return;
try{
 const response=await fetch('/api/site',{cache:'no-store'});
 if(!response.ok)throw Error('CMS unavailable');
 const content=await response.json();
 const url=String(content.introVideoUrl||'https://youtu.be/1NOMySzeacs').trim();
 if(!url)return;
 const u=new URL(url);
 if(u.protocol!=='https:'||!['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname))return;
 const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname.startsWith('/shorts/')?u.pathname.split('/')[2]:u.searchParams.get('v');
 if(!/^[A-Za-z0-9_-]{11}$/.test(id||''))return;
 const button=document.createElement('button');
 button.type='button';button.className='intro-play-button';
 button.setAttribute('aria-label','Play the official introduction video');
 const poster=document.createElement('img');
 poster.src='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
 poster.alt='Official Sir Oyedot AI Creator introductory video';
 poster.width=640;poster.height=360;poster.decoding='async';
 const label=document.createElement('span');label.className='intro-play-label';label.textContent='▶ Watch the introduction';
 button.append(poster,label);
 button.addEventListener('click',()=>{
   const frame=document.createElement('iframe');
   frame.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&playsinline=1&rel=0';
   frame.title='Sir Oyedot AI Creator official introduction';
   frame.allow='accelerometer; autoplay; encrypted-media; picture-in-picture; web-share';
   frame.allowFullscreen=true;
   frame.referrerPolicy='strict-origin-when-cross-origin';
   target.replaceChildren(frame);
 },{once:true});
 target.replaceChildren(button);
 section.hidden=false;
}catch{ /* Fall back to the verified official introduction if the CMS is unavailable. */
 const button=document.createElement('button');button.type='button';button.className='intro-play-button';button.setAttribute('aria-label','Play the official introduction video');
 const poster=document.createElement('img');poster.src='https://i.ytimg.com/vi/1NOMySzeacs/hqdefault.jpg';poster.alt='Official Sir Oyedot AI Creator introductory video';poster.width=640;poster.height=360;poster.decoding='async';
 const label=document.createElement('span');label.className='intro-play-label';label.textContent='▶ Watch the introduction';button.append(poster,label);
 button.addEventListener('click',()=>{const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/1NOMySzeacs?autoplay=1&playsinline=1&rel=0';frame.title='Sir Oyedot AI Creator official introduction';frame.allow='accelerometer; autoplay; encrypted-media; picture-in-picture; web-share';frame.allowFullscreen=true;target.replaceChildren(frame);},{once:true});target.replaceChildren(button);section.hidden=false;
}
})();
