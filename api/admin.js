import crypto from 'node:crypto';
import {readContent,writeContent,readBlobJSON,writeBlobJSON} from '../lib/site-store.js';
const cookieName='oyedot_admin';
const authPath='site-content/owner-auth.json';
const json=(res,code,body)=>{
  res.statusCode=code;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(body));
};
const b64=text=>Buffer.from(text).toString('base64url');
const sign=text=>crypto.createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update(text).digest('base64url');
const eq=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y)};
const sameOrigin=req=>{
  let u;try{u=new URL(req.headers.origin||'');}catch{return false;}
  const host=req.headers['x-forwarded-host']||req.headers.host;
  return u.protocol==='https:'&&u.host===host;
};
const loggedIn=req=>{
  const cookies=Object.fromEntries((req.headers.cookie||'').split(';').map(s=>{const i=s.indexOf('=');return i<0?[]:[s.slice(0,i).trim(),s.slice(i+1)]}).filter(x=>x.length===2));
  const [body,mac,...rest]=String(cookies[cookieName]||'').split('.');
  if(!body||!mac||rest.length||!eq(mac,sign(body)))return false;
  try{const claims=JSON.parse(Buffer.from(body,'base64url').toString());return claims.role==='owner'&&Number.isFinite(claims.exp)&&claims.exp>Date.now();}catch{return false;}
};
const setSession=res=>{
  const payload=b64(JSON.stringify({role:'owner',exp:Date.now()+8*60*60*1000}));
  res.setHeader('Set-Cookie',cookieName+'='+payload+'.'+sign(payload)+'; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800');
};
const clearSession=res=>res.setHeader('Set-Cookie',cookieName+'=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0');
const digest=(password,salt)=>crypto.createHmac('sha256',process.env.ADMIN_SESSION_SECRET)
  .update(salt+':'+password).digest('hex');
async function correctPassword(password){
  const record=await readBlobJSON(authPath);
  if(record && record.salt && record.hash)
    return eq(digest(password,String(record.salt)),String(record.hash));
  return eq(crypto.createHash('sha256').update(password).digest('hex'),
    crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex'));
}
export default async function handler(req,res){
  if(!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET || !process.env.BLOB_READ_WRITE_TOKEN)
    return json(res,503,{error:'Dashboard security has not been configured'});
  const action=String(req.query?.action||'');
  if(req.method==='POST'&&!sameOrigin(req))return json(res,403,{error:'Invalid request origin'});
  if(action==='login'&&req.method==='POST'){
    const password=typeof req.body?.password==='string'?req.body.password:'';
    if(password.length>256)return json(res,401,{error:'Incorrect password'});
    try{
      if(!await correctPassword(password))return json(res,401,{error:'Incorrect password'});
      setSession(res);
      return json(res,200,{ok:true});
    }catch{return json(res,503,{error:'Unable to verify login at the moment'});}
  }
  if(action==='logout'&&req.method==='POST'){clearSession(res);return json(res,200,{ok:true});}
  if(!loggedIn(req))return json(res,401,{error:'Please sign in'});
  if(action==='session'&&req.method==='GET')return json(res,200,{ok:true});
  if(action==='content'&&req.method==='GET'){
    try{return json(res,200,{content:await readContent()})}
    catch{return json(res,502,{error:'Unable to load saved website content'})}
  }
  if(action==='content'&&req.method==='POST'){
    try{
      if(JSON.stringify(req.body||{}).length>40000)return json(res,413,{error:'Content too large'});
      await writeContent(req.body?.content);
      return json(res,200,{ok:true,message:'Published. The website may take up to one minute to show your update.'});
    }catch(e){return json(res,400,{error:e.message||'Unable to publish changes'})}
  }
  if(action==='change-password'&&req.method==='POST'){
    const current=String(req.body?.current||''),next=String(req.body?.next||'');
    if(next.length<16||next.length>128)return json(res,400,{error:'Use a password of at least 16 characters'});
    try{
      if(!await correctPassword(current))return json(res,401,{error:'Current password incorrect'});
      const salt=crypto.randomBytes(20).toString('hex');
      await writeBlobJSON(authPath,{salt,hash:digest(next,salt),updatedAt:new Date().toISOString()});
      clearSession(res);
      return json(res,200,{ok:true,message:'Password changed. Sign in with the new password.'});
    }catch{return json(res,502,{error:'Could not change password'})}
  }
  return json(res,404,{error:'Not found'});
}
