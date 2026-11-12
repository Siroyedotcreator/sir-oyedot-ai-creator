/* Public CMS content. Static HTML remains the fallback when the database is unconfigured or unavailable. */
(() => {
  'use strict';
  const config = window.SIR_OYEDOT_CMS || {};
  const base = String(config.url || '').replace(/\/+$/, '');
  const key = String(config.publishableKey || '');
  if (!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(base) || !key.startsWith('sb_publishable_')) return;

  const getData = async (table, query) => {
    const response = await fetch(base + '/rest/v1/' + table + '?' + query, {
      headers: {'apikey': key, 'Accept':'application/json'}, cache:'no-store'
    });
    if (!response.ok) throw new Error('CMS fetch unavailable (' + response.status + ')');
    return response.json();
  };
  const safeLink = (input) => {
    if (!input || !String(input).trim()) return null;
    try {
      const url = new URL(input, window.location.href);
      return url.protocol === 'https:' || (url.protocol === 'http:' && url.origin === window.location.origin) ? url.href : null;
    } catch { return null; }
  };
  const elt = (tag, cls, content) => {
    const el = document.createElement(tag);
    if(cls) el.className = cls;
    if(content !== undefined) el.textContent = String(content);
    return el;
  };
  const externalLink = (href, content, cls) => {
    const a=elt('a', cls, content);
    const safe=safeLink(href);
    if(!safe)return null;
    a.href=safe;
    a.target='_blank';
    a.rel='noopener noreferrer';
    return a;
  };
  const updateSettings = async () => {
    const data = await getData('site_settings','select=announcement,whatsapp_number,contact_email&id=eq.1');
    const settings=data[0];
    if(!settings) return;
    const phone=String(settings.whatsapp_number || '').replace(/\D/g,'');
    if(/^[1-9]\d{7,14}$/.test(phone)) {
      document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
        link.href='https://wa.me/'+phone;
        if(link.classList.contains('contact-card')) {
          const strong=link.querySelector('strong');
          if(strong) strong.textContent='+'+phone+' ↗';
        } else if(link.closest('.footer-social')) {
          link.textContent='WhatsApp · +'+phone+' ↗';
        }
      });
    }
    const email=String(settings.contact_email || '').trim();
    if(email && email.includes('@') && email.includes('.') && !/\s/.test(email)) {
      const grid=document.querySelector('.contact-grid');
      if(grid && !grid.querySelector('.cms-email-card')) {
        const link=elt('a','contact-card cms-email-card');
        link.href='mailto:'+email;
        link.append(elt('span','contact-index','07'),elt('h2','','Email'),elt('p','','For projects, collaboration requests and enquiries.'),elt('strong','',email+' ↗'));
        grid.append(link);
      }
    }
    const text=String(settings.announcement || '').trim();
    if(text && document.querySelector('.marquee-band')) {
      const note=elt('aside','cms-announcement');
      const inner=elt('div','shell cms-announcement-inner');
      inner.append(elt('span','cms-announcement-label','FROM THE STUDIO'),elt('p','',text));
      note.appendChild(inner);
      document.querySelector('.marquee-band').insertAdjacentElement('beforebegin',note);
    }
  };
  const renderVideo = item => {
    const card=elt('article','clip-card');
    const preview=elt('div','clip-preview');
    const url=safeLink(item.url);
    if(!url)return null;
    const platform=String(item.platform);
    if(platform === 'youtube') {
      preview.classList.add('youtube-preview','youtube-preview-card');
      const button=elt('button','youtube-launch');
      button.type='button';
      button.setAttribute('aria-label','Play '+item.title);
      const id=(new URL(url)).pathname.match(/(?:\/shorts\/|\/watch\/|\/embed\/)([A-Za-z0-9_-]{11})/)?.[1] ||
        (new URL(url)).searchParams.get('v');
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
        const img=elt('img');
        img.src=safeLink(item.poster_url) || ('https://i.ytimg.com/vi/'+id+'/hqdefault.jpg');
        img.alt='Preview for '+item.title;
        img.loading='lazy';
        button.append(img,elt('span','clip-platform-stamp','YOUTUBE SHORT'));
        const play=elt('span','clip-glyph youtube-glyph','▶');play.setAttribute('aria-hidden','true');button.append(play);
        button.append(elt('span','clip-preview-footer','PLAY THE VIDEO ↗'));
        button.addEventListener('click',()=>{
          const frame=elt('iframe');
          frame.src='https://www.youtube-nocookie.com/embed/'+id+'?rel=0&autoplay=1&playsinline=1';
          frame.title=item.title;frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
          preview.replaceChildren(frame);
        },{once:true});
        preview.append(button);
      } else {
        const a=externalLink(url,'Watch on YouTube ↗','clip-preview');return a?card:null;
      }
    } else {
      preview.classList.add('tiktok-preview','tiktok-preview-1');
      const link=externalLink(url,undefined,'cms-tiktok-link');
      if(!link)return null;
      link.setAttribute('aria-label','Open '+item.title+' on TikTok');
      link.append(elt('span','clip-platform-stamp','TIKTOK'),elt('span','clip-glyph','▶'),elt('span','clip-preview-wordmark','WATCH THE FILM.'));
      link.append(elt('span','clip-preview-footer','OPEN ORIGINAL VIDEO ↗'));
      preview.append(link);
    }
    const meta=elt('div','clip-meta');const details=elt('div');
    details.append(elt('span','small-label','CREATOR VIDEO · '+platform.toUpperCase()),elt('h3','',item.title));
    meta.appendChild(details);
    const open=externalLink(url,platform==='youtube'?'Watch on YouTube ↗':'Watch on TikTok ↗','clip-external');
    if(open)meta.append(open);
    card.append(preview,meta);
    return card;
  };
  const updateVideos=async()=>{
    const grid=document.querySelector('.curated-video-grid');
    if(!grid)return;
    const data=await getData('video_items','select=id,platform,title,url,poster_url,sort_order&published=eq.true&order=sort_order.asc,id.asc');
    const cards=data.map(renderVideo).filter(Boolean);
    if(!cards.length){grid.replaceChildren(elt('p','cms-empty','No videos published yet.'));return;}
    grid.replaceChildren(...cards);
    const count=document.querySelector('.curated-video-count strong');
    if(count)count.textContent=String(cards.length).padStart(2,'0');
  };
  const renderProject=(item,index)=>{
    const row=elt('article','project-row');if(item.slug)row.id=item.slug;
    const art=elt('div','project-art '+(['history','wildlife','commercial'].includes(item.art_style)?item.art_style:'history'));
    const number=elt('span','project-num',String(index+1).padStart(2,'0'));
    const words=elt('span','project-art-word',item.art_text);words.style.whiteSpace='pre-line';art.append(number,words);
    const copy=elt('div','project-copy');
    copy.append(elt('span','small-label',item.label),elt('h2','',item.title),elt('p','',item.summary));
    if(item.note)copy.append(elt('p','subtle',item.note));
    if(item.link_url){const link=externalLink(item.link_url,(item.link_label||'Watch the work')+' ↗','text-link');if(link)copy.append(link);}
    row.append(art,copy);return row;
  };
  const updateProjects=async()=>{
    const list=document.querySelector('.project-list');if(!list)return;
    const data=await getData('project_items','select=slug,label,title,summary,note,link_url,link_label,art_text,art_style,sort_order&published=eq.true&order=sort_order.asc,id.asc');
    if(!data.length){list.replaceChildren(elt('p','cms-empty','No projects published yet.'));return;}
    list.replaceChildren(...data.map(renderProject));
  };
  Promise.allSettled([updateSettings(),updateVideos(),updateProjects()]);
})();