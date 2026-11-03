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
  ["apartment:'CASA'", "apartment:'BLOCO B APARTAMENTO 305'"],
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
await writeFile(join(here, 'e2e-service-matrix-realistic.mjs'), code);
console.log('Prepared browser matrix with realistic-length synthetic data');
