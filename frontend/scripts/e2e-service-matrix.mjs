
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const BASE = 'http://127.0.0.1:8080', OUT = resolve('browser-matrix-results');
await mkdir(OUT, {recursive:true});
const errors=[], results=[], versions=new Set();
const clean = value => String(value).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0,85);
async function request(path, body) {
  const response=await fetch(BASE+path, body === undefined ? {} : {
    method:'POST',headers:{'Content-Type':'application/json','Origin':BASE},body:JSON.stringify(body)
  });
  return {status:response.status, body:await response.json().catch(()=>({}))};
}
const visible=(q,a)=>(q.conditions||[]).every(r=>r.equals!==undefined?a[r.questionId]===r.equals:(r.oneOf||[]).includes(a[r.questionId]));
function enumerate(s) {
  const entries=[];
  const visit=(idx,a)=>{
    if(idx===s.questions.length){entries.push({...a});return;}
    const q=s.questions[idx];
    if(!visible(q,a)){visit(idx+1,a);return;}
    for(const val of q.options.filter(v=>!(q.unavailableOptions||[]).includes(v)))
      visit(idx+1,{...a,[q.id]:val});
  };
  visit(0,{});
  return entries;
}
function tokens(s,one){
  const a=one.answers, keys=Object.keys(a).sort(), out=new Set(['forms:'+one.formVersionIds.join(',')]);
  for(const k of keys)out.add('option:'+k+'='+a[k]);
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)
    out.add('pair:'+keys[i]+'='+a[keys[i]]+'&'+keys[j]+'='+a[keys[j]]);
  for(const q of s.questions.filter(q=>(q.conditions||[]).length))out.add('visibility:'+q.id+'='+visible(q,a));
  return out;
}
function cover(cases){
  const uncovered=new Set(cases.flatMap(c=>[...c.tokens])), todo=[...cases], selected=[];
  const tokenCount=uncovered.size;
  while(uncovered.size){
    let winner, best=0;
    for(const c of todo){const n=[...c.tokens].filter(t=>uncovered.has(t)).length;if(n>best){winner=c;best=n;}}
    if(!winner)throw Error('Coverage algorithm incomplete');
    selected.push(winner);for(const token of winner.tokens)uncovered.delete(token);
    todo.splice(todo.indexOf(winner),1);
  }
  return {selected, tokenCount};
}
function fixture(field) {
  const k=field.id.toLowerCase(), suf=k.split('.').at(-1);
  const person=k.startsWith('coowner.')?'CARLA MENDES':k.startsWith('seller.')?'PAULO SOARES':'ANA CLARA SOUZA';
  if(field.valueKind==='date'||/^(issuedate|birthdate|lossdate|sal edate|keeldate|launchdate)$/.test(suf))return '18/06/2026';
  const bySuffix={
    fullname:person,cpf:k.startsWith('seller.')?'111.444.777-35':'529.982.247-25',
    identity:'12345678',issuer:'SSP',issuerstate:'RJ',nationality:'BRASILEIRA',
    birthplace:'NITEROI',address:'RUA DAS FLORES',fulladdress:'RUA DAS FLORES 120 NITEROI RJ',
    streetnumber:'120',apartment:'CASA',neighborhood:'CENTRO',city:'NITEROI',state:'RJ',
    citystate:'NITEROI RJ',postalcode:'24020-031',mobile:'21987654321',phone:'2132221234',
    fax:'2132221234',email:'qa@example.invalid',registration:'RJ123456',hullid:'BRABC12345',
    year:'2020',capacity:'4',capacitypersons:'4',length:'6,50',motorbrand:'YAMAHA',
    motorpower:'90 HP',motorserial:'6H5123456',cirnumber:'1234567',documentnumber:'CIR123456',
    authorityname:'CPRJ',requestauthority:'CPRJ',place:'NITEROI',
    lossdescription:'PERDA DURANTE VIAGEM',observations:'DOCUMENTO PARA CONFERENCIA',
    requestpurpose:'SOLICITACAO DE SERVICO',notes:'DADOS FICTICIOS',date:'18/06/2026',
  };
  if(k==='vessel.name')return 'VENTO SUL';
  if(suf==='name')return person;
  return bySuffix[suf]??null;
}
const listing=await request('/api/services');
assert.equal(listing.status,200);
assert.equal(listing.body.services.length,18);
const matrix=[];
for(const service of listing.body.services){
  const combinations=enumerate(service), quoteCases=[];
  assert(combinations.length>0&&combinations.length<20000,'Cardinality unusual: '+service.id);
  for(let i=0;i<combinations.length;i+=12){
    const batch=await Promise.all(combinations.slice(i,i+12).map(async answers=>{
      const response=await request('/api/services/'+service.id+'/quote',{answers});
      return {answers,response};
    }));
    for(const {answers,response} of batch){
      if(response.status!==200 || !response.body.service?.formVersionIds?.length){
        errors.push({stage:'quote',service:service.id,answers,status:response.status});continue;
      }
      const v=response.body.service;
      quoteCases.push({answers,formVersionIds:v.formVersionIds,reviewFields:v.reviewFields,reviewForms:v.reviewForms,
        tokens:tokens(service,{answers,formVersionIds:v.formVersionIds})});
    }
  }
  const chosen=cover(quoteCases);
  matrix.push({id:service.id,title:service.title,questions:service.questions,
    totalCombinations:combinations.length,quoteValid:quoteCases.length,
    invalidQuotes:combinations.length-quoteCases.length,pairwiseTokens:chosen.tokenCount,
    selected:chosen.selected.map((c,i)=>({...c,tokens:[...c.tokens],caseId:clean(service.id)+'-'+String(i+1).padStart(2,'0')}))});
}
const stats={services:matrix.length,
  combinations:matrix.reduce((x,s)=>x+s.totalCombinations,0),
  validQuotes:matrix.reduce((x,s)=>x+s.quoteValid,0),
  browserCases:matrix.reduce((x,s)=>x+s.selected.length,0),
  quoteErrors:errors.length};
const md=['# Matriz de testes E2E','',
 'Dados fictícios plausíveis, sem uso da OpenAI, cadastro real ou documentos de terceiros.','','## Resumo',
 '| Serviço | Combinações permitidas | Quotes válidos | Casos Chrome |',
 '| --- | ---: | ---: | ---: |',
 ...matrix.map(s=>'| '+s.title+' | '+s.totalCombinations+' | '+s.quoteValid+' | '+s.selected.length+' |'),
 '','## Cenários no navegador',
 ...matrix.flatMap(s=>['','### '+s.title,...s.selected.map(c=>'- '+c.caseId+': '+JSON.stringify(c.answers)+' -> '+c.formVersionIds.join(', '))]),
 '','## Método e limites',
 'Enumeração exaustiva de condições e alternativas habilitadas via /quote; testes no Chrome selecionados por cobertura pairwise e assinatura dos formulários.',
 'Não significa testar no navegador todo o produto cartesiano nem homologar imagens reais ou extração pela OpenAI.'].join('\n');
await writeFile(join(OUT,'MATRIZ_TESTES.md'),md);
await writeFile(join(OUT,'MATRIZ_TESTES.json'),JSON.stringify({stats,services:matrix},null,2));
console.log('MATRIX '+JSON.stringify(stats));
let browser,page;
try{
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true,locale:'pt-BR'});
  page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push({stage:'pageerror',detail:e.message}));
  page.on('response',r=>{if(r.status()>=500)errors.push({stage:'server500',detail:r.status()+' '+r.url()});});
  await page.goto(BASE+'/entrar?modo=cadastro');
  await page.locator('input[name="name"]').fill('ANA CLARA SOUZA TESTE');
  await page.locator('input[name="tel"]').fill('21999998888');
  await page.locator('input[name="email"]').fill('qa.matriz@example.invalid');
  await page.locator('#auth-password').fill('SenhaFicticiaUnica2026!');
  await page.locator('#auth-confirmation').fill('SenhaFicticiaUnica2026!');
  await page.getByRole('button',{name:'Criar conta',exact:true}).click();
  await page.waitForURL('**/minha-conta');
  let index=0;
  for(const service of matrix)for(const c of service.selected){
    index++;
    const row={caseId:c.caseId,service:service.id,answers:c.answers,expected:c.formVersionIds,downloaded:[],fields:0,status:'PENDING'};
    try{
      await page.goto(BASE+'/preencher-real/'+service.id);
      await page.getByRole('heading',{name:'Dados do serviço'}).waitFor();
      for(const q of service.questions){
        if(!Object.hasOwn(c.answers,q.id))continue;
        const select=page.locator('label.field').filter({hasText:q.label}).locator('select');
        assert.equal(await select.count(),1,'Select not found: '+q.id);
        await select.selectOption(c.answers[q.id]);
      }
      await page.getByRole('button',{name:'Ver formulários e continuar'}).click();
      await page.getByRole('heading',{name:'Documentos para preenchimento automático (opcionais)'}).waitFor();
      assert.equal(await page.locator('.live-output-forms li').count(),c.formVersionIds.length);
      await page.getByRole('button',{name:'Continuar sem anexos — preencher manualmente'}).click();
      await page.getByRole('heading',{name:'Preencha e confira os formulários'}).waitFor();
      const expand=page.getByRole('button',{name:'Abrir todos'});
      if(await expand.count())await expand.click();
      for(const field of c.reviewFields){
        const value=fixture(field);if(!value)continue;
        const input=page.locator('input[id$="-'+field.id+'"]:visible').first();
        if(!await input.count())continue;
        await input.fill(value);row.fields++;
      }
      assert(row.fields>0,'No synthetic realistic fields were used');
      await page.getByRole('button',{name:'Confirmar e gerar formulários'}).click();
      const proceed=page.getByRole('button',{name:'Continuar mesmo assim'});
      if(await proceed.count())await proceed.click();
      await page.getByRole('heading',{name:'Formulários gerados'}).waitFor({timeout:26000});
      await page.getByText(/nenhum crédito de análise foi consumido/i).waitFor();
      assert.equal(await page.locator('a[download][href*="/api/jobs/"]').count(),c.formVersionIds.length);
      for(const version of c.formVersionIds){
        const link=page.locator('a[download][href$="/'+version+'"]');
        assert.equal(await link.count(),1,'Missing PDF '+version);
        const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);
        const target=join(OUT,'temp-'+clean(version)+'.pdf');
        await download.saveAs(target);
        const bytes=await readFile(target);
        assert(bytes.length>1000&&bytes.subarray(0,5).toString()==='%PDF-','Invalid PDF '+version);
        row.downloaded.push({version,bytes:bytes.length});
        if(!versions.has(version)){
          versions.add(version);
          await writeFile(join(OUT,'sample-'+clean(version)+'.pdf'),bytes);
        }
        await unlink(target);
      }
      if(c===service.selected[0]){
        await page.screenshot({path:join(OUT,'desktop-'+clean(service.id)+'.png'),fullPage:true});
        await page.setViewportSize({width:375,height:812});
        assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3)),'Mobile horizontal overflow');
        await page.screenshot({path:join(OUT,'mobile-'+clean(service.id)+'.png'),fullPage:true});
        await page.setViewportSize({width:1280,height:800});
      }
      const balance=await page.request.get(BASE+'/api/credits/balance');
      assert.equal(balance.status(),200);
      assert.equal((await balance.json()).balance,0,'Unexpected credit debit');
      row.status='PASS';
      console.log('PASS '+index+'/'+stats.browserCases+' '+c.caseId+' '+row.fields+' fields '+row.downloaded.length+' PDFs');
    }catch(e){
      row.status='FAIL';row.error=String(e?.stack??e);
      errors.push({stage:'browser',caseId:c.caseId,detail:row.error});
      if(errors.filter(x=>x.stage==='browser').length<=8)await page.screenshot({path:join(OUT,'failure-'+clean(c.caseId)+'.png'),fullPage:true}).catch(()=>{});
      console.error('FAIL '+c.caseId+' '+String(e.message).slice(0,380));
    }finally{
      results.push(row);
      // A second case for the same service must not reuse a GENERATED job from sessionStorage.
      // Close through the actual user control, which also deletes temporary documents.
      const finish=page.getByRole('button',{name:'Encerrar e apagar PDFs (sem novo débito)'});
      const cancel=page.getByRole('button',{name:'Cancelar e apagar documentos temporários'});
      if(await finish.count()){
        await finish.click().catch(()=>{});
        await page.getByRole('heading',{name:'Dados do serviço'}).waitFor({timeout:8000}).catch(()=>{});
      } else if(await cancel.count()){
        await cancel.click().catch(()=>{});
        await page.getByRole('heading',{name:'Dados do serviço'}).waitFor({timeout:8000}).catch(()=>{});
      }
      await page.goto(BASE+'/').catch(()=>{});
    }
  }
}catch(e){errors.push({stage:'runner',detail:String(e?.stack??e)});console.error('FATAL '+e);}
finally{if(browser)await browser.close();}
const summary={...stats,passed:results.filter(r=>r.status==='PASS').length,
  failed:results.filter(r=>r.status!=='PASS').length,uniqueGeneratedForms:[...versions].sort(),errors:errors.length};
await writeFile(join(OUT,'RESULTADOS.json'),JSON.stringify({summary,results,errors},null,2));
await writeFile(join(OUT,'RESULTADOS.md'),[
  '# Resultado da matriz E2E', '',
  'Passaram '+summary.passed+' de '+stats.browserCases+' cenários selecionados. Quotes '+stats.validQuotes+' de '+stats.combinations+'.',
  'Anexos gerados: '+summary.uniqueGeneratedForms.join(', '), '',
  ...results.map(r=>'- ['+(r.status==='PASS'?'x':' ')+'] '+r.caseId+' '+r.status+' ('+r.fields+' campos; '+r.downloaded.length+' PDFs)'),
  '','## Falhas',...(errors.length?errors.map(e=>'- '+JSON.stringify(e).slice(0,400)):['Nenhuma'])
].join('\n'));
console.log('FINAL '+JSON.stringify(summary));
if(errors.length || summary.passed!==stats.browserCases)process.exitCode=1;
