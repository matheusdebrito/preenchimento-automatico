import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const base = await readFile(join(here, 'e2e-service-matrix.mjs'), 'utf8');
let code = base;
const replacements = [
  ["'ANA CLARA SOUZA'", "'ANA CAROLINA GONCALVES DE ALMEIDA'"],
  ["'PAULO SOARES'", "'PAULO HENRIQUE DOS SANTOS OLIVEIRA'"],
  ["'CARLA MENDES'", "'CARLA BEATRIZ DE ALBUQUERQUE MONTEIRO'"],
  ["address:'RUA DAS FLORES'", "address:'AVENIDA PROFESSOR JOSE AUGUSTO DE OLIVEIRA'"],
  ["fulladdress:'RUA DAS FLORES 120 NITEROI RJ'", "fulladdress:'AVENIDA PROFESSOR JOSE AUGUSTO DE OLIVEIRA 1250 BLOCO B APARTAMENTO 305 RIO DE JANEIRO RJ'"],
  ["streetnumber:'120'", "streetnumber:'1250'"],
  ["apartment:'CASA'", "apartment:'APT 305'"],
  ["neighborhood:'CENTRO'", "neighborhood:'JARDIM DAS AMERICAS'"],
  ["city:'NITEROI'", "city:'RIO DE JANEIRO'"],
  ["birthplace:'NITEROI'", "birthplace:'SAO JOSE DOS CAMPOS'"],
  ["observations:'DOCUMENTO PARA CONFERENCIA'", "observations:'DOCUMENTO FICTICIO PARA VERIFICACAO DE CAMPOS DE TEXTO LONGO'"],
  ["lossdescription:'PERDA DURANTE VIAGEM'", "lossdescription:'EXTRAVIO DO DOCUMENTO DURANTE DESLOCAMENTO ENTRE MUNICIPIOS'"],
  ["requestpurpose:'SOLICITACAO DE SERVICO'", "requestpurpose:'REQUERIMENTO DE INSCRICAO E ATUALIZACAO DE DADOS DE EMBARCACAO'"],
  ["if(k==='vessel.name')return 'VENTO SUL';", "if(k==='vessel.name')return 'NOSSA SENHORA DOS NAVEGANTES';"],
];
for (const [from,to] of replacements) {
  if (!code.includes(from)) throw Error('Regression in source test runner: ' + from);
  code = code.replace(from,to);
}
// Cover every distinct PDF version across services; retain at least one flow
// for each service. The full 184-case matrix remains recorded separately.
const marker = 'const stats={services:matrix.length,';
if (!code.includes(marker)) throw Error('Unexpected browser matrix structure');
code = code.replace(marker, `
const auditedVersions = new Set();
for (const service of matrix) {
  const picked = [];
  for (const scenario of service.selected) {
    if (picked.length === 0 ||
        scenario.formVersionIds.some((id) => !auditedVersions.has(id))) {
      picked.push(scenario);
      for (const id of scenario.formVersionIds) auditedVersions.add(id);
    }
  }
  service.selected = picked;
}
console.log('SELECTED PDF VERSIONS: ' + [...auditedVersions].join(','));
` + marker);
// On a rejected overflow, preserve the failure as evidence and reduce only
// that specific field for the next attempt, allowing us to inspect the PDF
// output of every other field without hiding the original limitation.
const oldGeneration = `      await page.getByRole('button',{name:'Confirmar e gerar formulários'}).click();
      const proceed=page.getByRole('button',{name:'Continuar mesmo assim'});
      if(await proceed.count())await proceed.click();
      await page.getByRole('heading',{name:'Formulários gerados'}).waitFor({timeout:26000});`;
const newGeneration = `      row.adjustments=[];
      let generated=false;
      for (let retry=0;retry<14;retry++) {
        const responsePromise=page.waitForResponse(r =>
          (r.url().endsWith('/generate') && r.request().method()==='POST') ||
          (r.url().endsWith('/review') && r.request().method()==='PATCH' && r.status()>=400),
          {timeout:30000});
        await page.getByRole('button',{name:'Confirmar e gerar formulários'}).click();
        const proceed=page.getByRole('button',{name:'Continuar mesmo assim'});
        if(await proceed.count())await proceed.click();
        const response=await responsePromise;
        if(response.ok()) {
          await page.getByRole('heading',{name:'Formulários gerados'}).waitFor({timeout:26000});
          generated=true;
          break;
        }
        const issue=await response.json().catch(()=>({}));
        const fieldId=issue.fieldId;
        if(!fieldId || !['text_overflow','text_too_long'].includes(issue.fieldReason??issue.reason)) {
          throw Error('Unexpected generation error '+JSON.stringify(issue));
        }
        throw Error('Realistic field overflow without modification: '+fieldId+' '+JSON.stringify(issue));

      }
      if(!generated)throw Error('Could not generate PDF after field-length adjustments');`;
if (!code.includes(oldGeneration)) throw Error('Browser generation flow changed');
code=code.replace(oldGeneration,newGeneration);
await writeFile(join(here, 'e2e-service-matrix-realistic.mjs'), code);
console.log('Prepared browser matrix with realistic-length synthetic data');
