import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

// This runner intentionally refuses to target any non-local instance.
// It never uploads documents or invokes the OpenAI analysis pathway.
const BASE = 'http://127.0.0.1:8080';
const OUT = resolve('stress-results');
const [action, sessionsFile, sqlFile] = process.argv.slice(2);
const USER_COUNT = 130;
await mkdir(OUT, { recursive: true });

if (action === 'seed') {
  if (!sessionsFile || !sqlFile) throw new Error('Usage: seed <sessions-file> <sql-file>');
  const sessions=[], sql=['BEGIN;'];
  for (let i=0;i<USER_COUNT;i++) {
    const id=randomUUID(), token=randomBytes(32).toString('base64url');
    const email='loadtest-'+id+'@example.invalid';
    const digest=createHash('sha256').update(token).digest('hex');
    sessions.push({token});
    sql.push("INSERT INTO app_users(id,email,password_hash,full_name,cellphone) VALUES ("+
      "'"+id+"','"+email+"','LOAD_TEST_NO_LOGIN','Pessoa Ficticia de Carga','5521999998888');");
    sql.push("INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES ("+
      "'"+digest+"','"+id+"',now()+interval '2 hours');");
  }
  sql.push('COMMIT;');
  await writeFile(sessionsFile,JSON.stringify(sessions),{mode:0o600});
  await writeFile(sqlFile,sql.join('\n')+'\n',{mode:0o600});
  console.log('Created '+USER_COUNT+' isolated user sessions; raw tokens never enter artifacts');
  process.exit(0);
}
if (action !== 'run' || !sessionsFile) throw Error('Usage: run <sessions-file>');
const users=JSON.parse(await readFile(sessionsFile,'utf8'));
assert.equal(users.length,USER_COUNT);

const fail=[], measurements=[], steps={};
const pct=(values,p)=>values.length?values[Math.min(values.length-1,Math.max(0,Math.ceil(values.length*p/100)-1))]:null;
function aggregate(records) {
  const lat=records.map(r=>r.ms).sort((a,b)=>a-b), statuses={};
  for(const x of records)statuses[x.status]=(statuses[x.status]||0)+1;
  return {requests:records.length,p50_ms:pct(lat,50),p95_ms:pct(lat,95),p99_ms:pct(lat,99),
    max_ms:lat.at(-1)??null,statuses};
}
function round(v){return Math.round(v*10)/10;}
async function request(path,{method='GET',user=null,body,timeout=15000,asBytes=false}={}) {
  const start=performance.now();
  const headers={'Origin':BASE};
  if (body !== undefined) headers['Content-Type']='application/json';
  if (user) headers.Cookie='pa_session='+user.token;
  let response,code=0,parsed=null,err=null,bytes=0;
  try {
    response=await fetch(BASE+path,{method,headers,
      ...(body!==undefined?{body:JSON.stringify(body)}:{}),
      signal:AbortSignal.timeout(timeout)});
    code=response.status;
    if(asBytes){bytes=(await response.arrayBuffer()).byteLength;}
    else parsed=await response.json().catch(()=>null);
  } catch(e){err=e.name+': '+e.message;}
  return {status:code,body:parsed,bytes,ms:round(performance.now()-start),error:err};
}
const quoteBody={answers:{}};
const counts=[1,10,25,50,100];
async function concurrent(N, countPerWorker, task) {
  const results=[];
  const start=performance.now();
  await Promise.all(Array.from({length:N},(_,worker)=>async function(){
    for(let n=0;n<countPerWorker;n++)results.push(await task(worker,n));
  }()).map(fn=>fn));
  return {records:results,seconds:(performance.now()-start)/1000};
}

const before=await request('/api/services');
assert.equal(before.status,200,'Service catalog unavailable');
const svc=before.body.services.find(s=>s.id==='revalidacao-cir-aquaviario');
assert(svc,'Expected service not present');
console.log('START load on isolated 127.0.0.1 with '+users.length+' distinct authenticated identities');
for(const count of counts) {
  const stage=await concurrent(count,3,async(worker,iteration)=>{
    const actor=users[worker];
    const result=await request(iteration%2===0?'/api/services':'/api/services/revalidacao-cir-aquaviario/quote',{
      method:iteration%2===0?'GET':'POST',
      ...(iteration%2?{body:quoteBody}:{}),user:actor});
    return {status:result.status,ms:result.ms,error:result.error};
  });
  const metrics={kind:'catalog_quotes',users:count,...aggregate(stage.records),
    req_per_sec:round(stage.records.length/stage.seconds)};
  measurements.push(metrics);
  if(metrics.statuses[200]!==metrics.requests)fail.push('catalog quote unexpected status users='+count+' '+JSON.stringify(metrics.statuses));
  console.log('READ '+JSON.stringify(metrics));
}

// Hold 100 distinct active users for 20 seconds with a paced realistic read/quote mix.
// This is not 100 continuously outstanding HTTP requests; it measures sustained activity.
const sustainedStart=performance.now(), sustainedRecords=[];
await Promise.all(users.slice(0,100).map(async (actor,idx)=>{
  let i=0;
  while(performance.now()-sustainedStart<20_000){
    const quote=(i++ % 2)===1;
    const response=await request(quote?'/api/services/revalidacao-cir-aquaviario/quote':'/api/services',{
      method:quote?'POST':'GET',
      ...(quote?{body:quoteBody}:{}),user:actor,timeout:15000});
    sustainedRecords.push({ms:response.ms,status:response.status,error:response.error});
    await new Promise(resolve=>setTimeout(resolve,750+(idx%5)*50));
  }
}));
const sustained={kind:'catalog_soak',users:100,
  duration_seconds:round((performance.now()-sustainedStart)/1000),
  ...aggregate(sustainedRecords)};
sustained.req_per_sec=round(sustained.requests/sustained.duration_seconds);
measurements.push(sustained);
if(sustained.statuses[200]!==sustained.requests)fail.push('Sustained catalog traffic unexpected status: '+JSON.stringify(sustained.statuses));
console.log('SOAK '+JSON.stringify(sustained));

// Requests start together; keep accepted jobs alive until all create attempts settle.
// This deliberately measures the global active-job ceiling under a simultaneous burst.
const fixture={
  'person.fullName':'ANA CLARA SOUZA',
  'person.cpf':'529.982.247-25',
  'person.address':'RUA DAS FLORES',
  'person.streetNumber':'120',
  'person.neighborhood':'CENTRO',
  'person.city':'NITEROI',
  'person.state':'RJ',
  'person.postalCode':'24020-031',
  'person.phone':'2132221234',
  'process.date':'18/06/2026',
  'process.place':'NITEROI',
};
const allowedFields=new Set(svc.reviewFields.map(f=>f.id));
const values=Object.fromEntries(Object.entries(fixture).filter(([field])=>allowedFields.has(field)));

for(const count of [1,2,3,5,10,25,50,100]) {
  const start=performance.now();
  const attempts=await Promise.all(Array.from({length:count},(_,idx)=>
    request('/api/jobs',{method:'POST',user:users[idx],body:{serviceId:svc.id,answers:{}}})
      .then(res=>({...res,idx}))));
  const accepted=attempts.filter(r=>r.status===201&&r.body?.id);
  const rejected=attempts.filter(r=>r.status===503&&r.body?.error==='capacity_exceeded');
  const unexpected=attempts.filter(r=>!accepted.includes(r)&&!rejected.includes(r));
  const result={
    kind:'job_create_burst',users:count,created:accepted.length,
    capacity_rejected:rejected.length,unexpected:unexpected.length,
    create_p50_ms:pct(attempts.map(x=>x.ms).sort((a,b)=>a-b),50),
    create_p95_ms:pct(attempts.map(x=>x.ms).sort((a,b)=>a-b),95),
    create_p99_ms:pct(attempts.map(x=>x.ms).sort((a,b)=>a-b),99),
    create_elapsed_ms:round(performance.now()-start),
  };
  if(unexpected.length)fail.push('Unexpected create response at '+count+' users: '+unexpected.slice(0,4).map(x=>({status:x.status,error:x.error,code:x.body?.error})).map(JSON.stringify).join(' '));
  if(accepted.length>100)fail.push('Global job limit bypassed at users='+count+' accepted='+accepted.length);
  const full=[];
  // Separate admission from processing: preserve 100 open jobs, execute two at a time.
  for(let batch=0;batch<accepted.length;batch+=2){
  const completed=await Promise.all(accepted.slice(batch,batch+2).map(async item=>{
    const actor=users[item.idx],id=item.body.id;
    const trace=[];
    const call=async(name,path,opts={})=>{
      const response=await request(path,{user:actor,...opts,timeout:22000});
      trace.push({name,status:response.status,ms:response.ms,error:response.error});
      return response;
    };
    try {
      const extraction=await call('extract','/api/jobs/'+id+'/extract',{method:'POST',body:{}});
      if(extraction.status!==200)throw Error('extract status '+extraction.status+' '+JSON.stringify(extraction.body));
      const review=await call('review','/api/jobs/'+id+'/review',{method:'PATCH',body:{confirmed:true,values}});
      if(review.status!==200)throw Error('review status '+review.status+' '+JSON.stringify(review.body));
      const generated=await call('generate','/api/jobs/'+id+'/generate',{method:'POST',body:{}});
      if(generated.status!==200||!generated.body?.downloads?.length)throw Error('generate status '+generated.status+' '+JSON.stringify(generated.body));
      for(const version of generated.body.downloads) {
        const download=await call('download','/api/jobs/'+id+'/download/'+encodeURIComponent(version),{asBytes:true});
        if(download.status!==200 || download.bytes<1000)throw Error('download invalid '+version+' status '+download.status+' bytes '+download.bytes);
      }
    }catch(e){trace.push({name:'flow_failure',error:String(e.message)});}
    finally{
      // Download delivery bookkeeping can briefly hold the job lock. Cleanup retries
      // do not count toward the measured generate/download latency.
      let removed=false;
      for(let retry=0;retry<20;retry++){
        const del=await call('cleanup','/api/jobs/'+id,{method:'DELETE'});
        if(del.status===200||del.status===404){removed=true;break;}
        await new Promise(resolve=>setTimeout(resolve,150));
      }
      if(!removed)trace.push({name:'cleanup_failure',error:'Unable to remove job'});
    }
    return trace;
  }));
  full.push(...completed);
  }
  result.fullFlows=full.length;
  result.completedFlows=full.filter(trace=>!trace.some(t=>t.name==='flow_failure'||t.name==='cleanup_failure')).length;
  const generation=full.flatMap(traces=>traces.filter(x=>x.name==='generate'));
  const downloads=full.flatMap(traces=>traces.filter(x=>x.name==='download'));
  result.generate_p95_ms=pct(generation.map(x=>x.ms).sort((a,b)=>a-b),95);
  result.download_p95_ms=pct(downloads.map(x=>x.ms).sort((a,b)=>a-b),95);
  result.downloads=downloads.length;
  measurements.push(result);
  if(result.completedFlows!==result.fullFlows)fail.push('PDF flow failed users='+count+' '+JSON.stringify(full.filter(t=>t.some(x=>x.error)).slice(0,2)));
  console.log('JOBS '+JSON.stringify(result));
}

const health=await request('/api/services');
if(health.status!==200)fail.push('Service unavailable after test');
const response={date:new Date().toISOString(),environment:'GitHub-hosted runner, Docker Compose single instance, PostgreSQL 17',
  scope:'catalog, quotes, authenticated job creation, manual review, 2 PDF generation/downloads; no AI/no upload/no billing',
  distinctUsers:USER_COUNT,expectedGlobalJobLimit:100,maxHeavyOperations:2,fixtureFieldCount:Object.keys(values).length,
  measurements,failures:fail,healthAfter:health.status};
await writeFile(join(OUT,'RESULTADOS_ESTRESSE.json'),JSON.stringify(response,null,2));
const lines=[
 '# Teste de carga com múltiplos usuários','',
 '**Ambiente:** runner GitHub Actions, PostgreSQL + API + frontend em Docker Compose, somente localhost.',
 'Sem OpenAI, documentos reais, cobrança, alterações de produção ou carga externa.',
 '',
 'Usuários distintos simulados: '+USER_COUNT+'. Campos sintéticos usados por formulário: '+Object.keys(values).length+'.',
 '',
 '## Consulta ao catálogo e cotação',
 '| Usuários concorrentes | Requisições | Req/s | p50 (ms) | p95 (ms) | p99 (ms) | HTTP 200 |',
 '|---:|---:|---:|---:|---:|---:|---:|',
 ...measurements.filter(m=>m.kind==='catalog_quotes').map(m=>'| '+m.users+' | '+m.requests+' | '+m.req_per_sec+' | '+m.p50_ms+' | '+m.p95_ms+' | '+m.p99_ms+' | '+(m.statuses[200]||0)+' |'),
 '',
 '## Carga sustentada (100 usuários, aproximadamente 20 s)',
 '| Usuários ativos | Duração (s) | Requisições | Req/s | p50 (ms) | p95 (ms) | p99 (ms) | HTTP 200 |',
 '|---:|---:|---:|---:|---:|---:|---:|---:|',
 ...measurements.filter(m=>m.kind==='catalog_soak').map(m=>'| '+m.users+' | '+m.duration_seconds+' | '+m.requests+' | '+m.req_per_sec+' | '+m.p50_ms+' | '+m.p95_ms+' | '+m.p99_ms+' | '+(m.statuses[200]||0)+' |'),
 '',
 '## Criação de processos e PDFs',
 '| Usuários simultâneos | Criados | Recusados por capacidade | Outras falhas | Fluxos PDF completos | p95 criação (ms) | p95 geração (ms) |',
 '|---:|---:|---:|---:|---:|---:|---:|',
 ...measurements.filter(m=>m.kind==='job_create_burst').map(m=>'| '+m.users+' | '+m.created+' | '+m.capacity_rejected+' | '+m.unexpected+' | '+m.completedFlows+'/'+m.fullFlows+' | '+m.create_p95_ms+' | '+m.generate_p95_ms+' |'),
 '',
 '## Interpretação',
 '- **Capacidade funcional** é medida separadamente de latência: HTTP 503 capacity_exceeded é uma recusa intencional decorrente de limite de processos ativos.',
 '- Cada usuário concorrente tem sua própria sessão de teste persistida no PostgreSQL; nenhum login real é executado durante a carga.',
 '- O runner não replica características de CPU, RAM, rede ou provedores externos de uma VPS de produção.',
 '- Apenas a jornada **sem upload e sem OpenAI** é testada; o OCR real, a cobrança e a escala distribuída continuam não homologados.',
 '',
 '## Anomalias',
 ...(fail.length?fail.map(x=>'- '+x):['Nenhuma falha inesperada capturada.']),
];
await writeFile(join(OUT,'RELATORIO_ESTRESSE.md'),lines.join('\n'));
console.log('FINAL '+JSON.stringify({users:USER_COUNT,stages:measurements.length,failures:fail.length,healthAfter:health.status}));
if(fail.length)process.exitCode=1;
