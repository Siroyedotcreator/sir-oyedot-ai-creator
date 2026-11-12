import {get,put} from '@vercel/blob';
const pathname='site-content/site.json';
export const initialSite={
 announcement:'',
 about:"I'm Oyedotun Opeyemi Stephen, professionally known as Sir Oyedot AI Creator, a Nigerian AI video creator and cinematic storyteller.",
 whatsapp:'2347066461764',
 videos:[
  {url:'https://vt.tiktok.com/ZSpHVS4vu/'},
  {url:'https://vt.tiktok.com/ZSpHV5UvT/'},
  {url:'https://vt.tiktok.com/ZSpHVy2nY/'},
  {url:'https://www.tiktok.com/@siroyedotaicreator/video/7697542340881157398'},
  {url:'https://www.youtube.com/shorts/fnJ_W3EyECg'},
  {url:'https://www.youtube.com/shorts/wGtDsP1L7aE'}
 ]
};
export async function readBlobJSON(path){
  const result=await get(path,{access:'public'});
  if(!result || result.statusCode===404)return null;
  if(result.statusCode!==200 || !result.stream)throw Error('Content storage unavailable');
  return JSON.parse(await new Response(result.stream).text());
}
export async function writeBlobJSON(path,content){
  return put(path,JSON.stringify(content,null,2),{
    access:'public',addRandomSuffix:false,allowOverwrite:true,
    contentType:'application/json',cacheControlMaxAge:60
  });
}
export function validateSite(input){
  if(!input || typeof input!=='object')throw Error('Invalid content');
  const clean=v=>typeof v==='string'?v.trim():'';
  const announcement=clean(input.announcement).slice(0,240);
  const about=clean(input.about).slice(0,1200);
  const whatsapp=clean(input.whatsapp).replace(/\D/g,'');
  if(whatsapp && !/^[1-9]\d{7,14}$/.test(whatsapp))throw Error('Use international WhatsApp number format, starting with country code');
  if(!Array.isArray(input.videos) || input.videos.length>30)throw Error('A maximum of 30 video links is supported');
  const videos=input.videos.map((video,i)=>{
    const url=clean(video?.url);
    if(url.length>500)throw Error('Video link is too long');
    let parsed;
    try{parsed=new URL(url)}catch{throw Error('Invalid video link '+(i+1))}
    if(parsed.protocol!=='https:' || !/(^|\.)tiktok\.com$|(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(parsed.hostname))
      throw Error('Use a TikTok or YouTube HTTPS URL at position '+(i+1));
    return {url};
  });
  return {announcement,about,whatsapp,videos};
}
export async function readContent(){
  const content=await readBlobJSON(pathname);
  return content ? validateSite(content) : initialSite;
}
export async function writeContent(content){return writeBlobJSON(pathname,validateSite(content));}
