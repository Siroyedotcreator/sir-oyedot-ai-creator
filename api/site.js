import {readContent} from '../lib/site-store.js';
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'Method not allowed'}))}
  try{const content=await readContent();res.statusCode=200;res.end(JSON.stringify(content))}
  catch{res.statusCode=503;res.end(JSON.stringify({error:'Content temporarily unavailable'}))}
}
