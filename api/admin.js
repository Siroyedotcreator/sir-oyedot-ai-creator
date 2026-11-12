import crypto from 'node:crypto';

const REPO = 'Siroyedotcreator/sir-oyedot-ai-creator';
const FILE = 'data/site.json';
const cookieName = 'oyedot_admin';
const json = (res,status,body) => { res.statusCode=status; res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(body)); };
const b64 = input => Buffer.from(input).toString('base64url');
const sign = value => crypto.createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update(value).digest('base64url');
const constantEqual = (a,b) => { const x=Buffer.from(String(a));const y=Buffer.from(String(b));return x.length===y.length && crypto.timingSafeEqual(x,y); };
const validSession = req => {
  if (!process.env.ADMIN_SESSION_SECRET) return false;
  const cookies = Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')));
  const raw=cookies[cookieName]||'';
  const parts=raw.split('.');
  if(parts.length!==2 || !constantEqual(parts[1],sign(parts[0]))) return false;
  try { const data=JSON.parse(Buffer.from(parts[0],'base64url').toString());return data.role==='owner' && data.exp>Date.now(); } catch { return false; }
};
const sameOrigin = req => {
  const origin=req.headers.origin;
  if(!origin)return false;
  try { const o=new URL(origin); const host=req.headers['x-forwarded-host']||req.headers.host;return o.protocol==='https:'&&o.host===host; }catch{return false;}
};
const github = async (method,path,body) => {
  const response=await fetch('https://api.github.com/repos/'+REPO+'/contents/'+path,{
    method,headers:{Authorization:'Bearer '+process.env.GITHUB_CONTENT_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'sir-oyedot-admin','Content-Type':'application/json'},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('GitHub request failed ('+response.status+')');
  return result;
};
const clean = value => typeof value==='string' ? value.trim().slice(0,1200):'';
const isUrl = value => {try {const u=new URL(value);return u.protocol==='https:';}catch{return false;}};
function validate(input){
  if(!input || typeof input!=='object')throw Error('Invalid content');
  const site={
    announcement:clean(input.announcement).slice(0,240),
    about:clean(input.about),
    whatsapp:clean(input.whatsapp).replace(/[^0-9]/g,'').slice(0,15),
    videos:[]
  };
  if(site.whatsapp && !/^[1-9]\d{7,14}$/.test(site.whatsapp))throw Error('WhatsApp number must use international format, such as 234...');
  if(!Array.isArray(input.videos) || input.videos.length>30)throw Error('Maximum 30 videos');
  site.videos=input.videos.map((v,i)=>{
    const url=clean(v?.url).slice(0,500);
    if(!isUrl(url) || !/(\.|^)(tiktok\.com|youtube\.com|youtu\.be)$/.test(new URL(url).hostname))throw Error('Invalid video link at position '+(i+1));
    return {url};
  });
  return site;
}
export default async function handler(req,res){
  if(!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET || !process.env.GITHUB_CONTENT_TOKEN)
    return json(res,503,{error:'Admin setup required: configure environment variables in Vercel.'});
  if(req.method==='POST' && !sameOrigin(req))return json(res,403,{error:'Invalid request origin'});
  const action=String(req.query?.action||'');
  if(action==='login' && req.method==='POST'){
    const password=String(req.body?.password||'').slice(0,300);
    if(!constantEqual(password,process.env.ADMIN_PASSWORD))return json(res,401,{error:'Incorrect password'});
    const token=b64(JSON.stringify({role:'owner',exp:Date.now()+8*60*60*1000}));
    res.setHeader('Set-Cookie',cookieName+'='+token+'.'+sign(token)+'; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800');
    return json(res,200,{ok:true});
  }
  if(action==='logout' && req.method==='POST'){
    res.setHeader('Set-Cookie',cookieName+'=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0');
    return json(res,200,{ok:true});
  }
  if(!validSession(req))return json(res,401,{error:'Please sign in'});
  if(action==='session' && req.method==='GET')return json(res,200,{ok:true});
  if(action==='content' && req.method==='GET'){
    try{
      const file=await github('GET',FILE);
      return json(res,200,{content:JSON.parse(Buffer.from(file.content,'base64').toString()),sha:file.sha});
    }catch{return json(res,502,{error:'Unable to load site content'});}
  }
  if(action==='content' && req.method==='POST'){
    try{
      const content=validate(req.body?.content);
      const current=await github('GET',FILE);
      await github('PUT',FILE,{message:'Update website content from owner dashboard',content:Buffer.from(JSON.stringify(content,null,2)+'\n').toString('base64'),sha:current.sha,branch:'main'});
      return json(res,200,{ok:true,message:'Saved to GitHub. Vercel will redeploy shortly.'});
    }catch(e){return json(res,400,{error:e.message||'Unable to save content'});}
  }
  return json(res,404,{error:'Not found'});
}
