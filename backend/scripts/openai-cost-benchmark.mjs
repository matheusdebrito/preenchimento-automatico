import { randomUUID } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { performance } from 'node:perf_hooks';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { extractDocumentsWithOneContingency } from '../dist/modules/jobs/openai-document-extractor.js';

const execFile = promisify(execFileCallback);
const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini-2026-03-17';
const pricing = {
  'gpt-5.4-mini-2026-03-17': { input: 0.75, cachedInput: 0.075, output: 4.50 },
  'gpt-5.4-nano-2026-03-17': { input: 0.20, cachedInput: 0.020, output: 1.25 },
};
const rates = pricing[model];
if (!rates) throw new Error('Unsupported test model; choose the approved mini or nano snapshot.');
if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY GitHub Actions secret.');
const maxExternalCalls = 10; // Five test cases; one primary + at most one contingency each.
const maxEstimatedUsd = 0.15; // Soft guard based on observed token usage, not a billing guarantee.
const reportsPath = resolve(process.env.BENCH_REPORT_DIR || 'openai-cost-results');
const working = await mkdtemp(join(tmpdir(), 'pa-ai-cost-'));
await mkdir(reportsPath, { recursive: true });

const normalized = (value) => String(value).normalize('NFC').replace(/\s+/g, ' ').trim().toUpperCase();
const field = (id, label, options = {}) => ({
  id, label, valueKind: options.kind || 'text',
  ...(options.validation ? { validationRuleId: options.validation } : {}),
  required: false,
});
const fName = field('person.fullName', 'Nome completo');
const fCpf = field('person.cpf', 'CPF', { validation: 'cpf' });
const rgFields = [
  fName, fCpf,
  field('person.identity', 'Numero do RG'),
  field('person.issuer', 'Orgao emissor'),
  field('person.issuerState', 'UF do orgao emissor'),
];
const tieFields = [
  field('vessel.registration', 'Numero de inscricao da embarcacao'),
  field('vessel.name', 'Nome da embarcacao'),
  field('vessel.motorBrand', 'Marca do motor'),
  field('vessel.motorSerial', 'Numero de serie do motor'),
];
const chaFields = [
  fName, fCpf,
  field('amateur.chaNumber', 'Numero da CHA'),
  field('amateur.category', 'Categoria de amador'),
  field('amateur.chaIssueDate', 'Data de emissao da CHA', { kind: 'date' }),
];
const cirFields = [
  fName,
  field('aquaviario.cirNumber', 'Numero da CIR'),
  field('aquaviario.category', 'Categoria profissional'),
];

const syntheticDocuments = [
  {
    name: 'rg',
    heading: 'REGISTRO GERAL (RG) - AMOSTRA SINTETICA',
    pages: [[
      ['NOME COMPLETO', 'ANA CLARA SOUZA'],
      ['CPF', '529.982.247-25'],
      ['REGISTRO GERAL', '12.345.678-9'],
      ['ORGAO EXPEDIDOR', 'SSP/RJ'],
    ]],
    type: 'identity',
    kind: 'png',
    allowedFields: rgFields,
    expected: {
      'person.fullName': 'ANA CLARA SOUZA',
      'person.cpf': '529.982.247-25',
      'person.identity': '12.345.678-9',
      'person.issuer': 'SSP',
      'person.issuerState': 'RJ',
    },
  },
  {
    name: 'tie',
    heading: 'TITULO DE INSCRICAO DE EMBARCACAO (TIE) - SINTETICO',
    pages: [
      [
        ['NUMERO DE INSCRICAO', '441M20200001'],
        ['NOME DA EMBARCACAO', 'ESTRELA DO MAR'],
      ],
      [
        ['IDENTIFICACAO DO MOTOR', 'DADOS DE TESTE'],
        ['MARCA DO MOTOR', 'YAMAHA'],
        ['NUMERO DE SERIE DO MOTOR', 'MTR12345678'],
      ],
    ],
    type: 'tie',
    kind: 'pdf',
    allowedFields: tieFields,
    expected: {
      'vessel.registration': '441M20200001',
      'vessel.name': 'ESTRELA DO MAR',
      'vessel.motorBrand': 'YAMAHA',
      'vessel.motorSerial': 'MTR12345678',
    },
  },
  {
    name: 'cha',
    heading: 'CARTEIRA DE HABILITACAO DE AMADOR (CHA) - SINTETICA',
    pages: [[
      ['NOME DO TITULAR', 'ANA CLARA SOUZA'],
      ['CPF', '529.982.247-25'],
      ['NUMERO DE INSCRICAO CHA', 'CHA123456'],
      ['CATEGORIA DE AMADOR', 'ARRAIS-AMADOR'],
      ['DATA DE EMISSAO', '15/04/2025'],
    ]],
    type: 'cha',
    kind: 'pdf',
    allowedFields: chaFields,
    expected: {
      'person.fullName': 'ANA CLARA SOUZA',
      'person.cpf': '529.982.247-25',
      'amateur.chaNumber': 'CHA123456',
      'amateur.category': 'ARRAIS-AMADOR',
      'amateur.chaIssueDate': '15/04/2025',
    },
  },
  {
    name: 'cir',
    heading: 'CADERNETA DE INSCRICAO E REGISTRO (CIR) - SINTETICA',
    pages: [[
      ['NOME DO TITULAR', 'ANA CLARA SOUZA'],
      ['NUMERO DA CIR', 'CIR1234567'],
      ['CATEGORIA PROFISSIONAL', 'MARINHEIRO AUXILIAR DE CONVES'],
    ]],
    type: 'cir',
    kind: 'pdf',
    allowedFields: cirFields,
    expected: {
      'person.fullName': 'ANA CLARA SOUZA',
      'aquaviario.cirNumber': 'CIR1234567',
      'aquaviario.category': 'MARINHEIRO AUXILIAR DE CONVES',
    },
  },
];

async function generateSyntheticPdf(definition, path) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (const [pageIndex, rows] of definition.pages.entries()) {
    const page = pdf.addPage([595, 842]);
    page.drawText('DOCUMENTO 100% FICTICIO - NAO UTILIZAR COMO IDENTIFICACAO', {
      x: 38, y: 793, font: bold, size: 10, color: rgb(0.76, 0.12, 0.12),
    });
    page.drawText(definition.heading, {
      x: 38, y: 740, font: bold, size: 14, color: rgb(0.05, 0.12, 0.23),
      maxWidth: 530,
    });
    page.drawText('Pagina ' + (pageIndex + 1) + ' de ' + definition.pages.length, {
      x: 38, y: 716, font: regular, size: 10,
    });
    let y = 670;
    for (const [label, value] of rows) {
      page.drawText(label, { x: 42, y, font: bold, size: 11 });
      page.drawText(value, { x: 42, y: y - 21, font: regular, size: 14 });
      y -= 78;
    }
    page.drawText('Dados artificiais para teste de extracao e custo da API', {
      x: 38, y: 42, font: regular, size: 10,
    });
  }
  await writeFile(path, await pdf.save());
}

const files = new Map();
const calls = [];
const scenarios = [];
let externalCalls = 0;
let totalEstimatedUsd = 0;

function costForUsage(usage) {
  if (!usage) return null;
  const input = Number(usage.input_tokens);
  const output = Number(usage.output_tokens);
  const cached = Number(usage.input_tokens_details?.cached_tokens || 0);
  if (!Number.isSafeInteger(input) || !Number.isSafeInteger(output) ||
    !Number.isSafeInteger(cached) || cached < 0 || cached > input) return null;
  return {
    inputTokens: input,
    cachedInputTokens: cached,
    outputTokens: output,
    estimatedUsd: ((input - cached) * rates.input +
      cached * rates.cachedInput + output * rates.output) / 1_000_000,
  };
}

async function meteredFetch(url, options) {
  if (url !== 'https://api.openai.com/v1/responses') {
    throw new Error('Only the OpenAI Responses API is permitted.');
  }
  if (externalCalls >= maxExternalCalls || totalEstimatedUsd >= maxEstimatedUsd) {
    throw new Error('Benchmark call-count or observed-cost guard reached.');
  }
  externalCalls++;
  const started = performance.now();
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    calls.push({ sequence: externalCalls, status: 'network_error', elapsedMs: Math.round(performance.now() - started) });
    throw new Error('OpenAI request failed to reach the service.');
  }
  const body = await response.clone().json().catch(() => null);
  const usage = costForUsage(body?.usage);
  const estimatedUsd = usage?.estimatedUsd ?? 0;
  totalEstimatedUsd += estimatedUsd;
  calls.push({
    sequence: externalCalls,
    status: response.status,
    elapsedMs: Math.round(performance.now() - started),
    ...usage,
  });
  return response;
}

let fatal = null;
try {
  for (const definition of syntheticDocuments) {
    const sourcePdf = join(working, definition.name + '.pdf');
    await generateSyntheticPdf(definition, sourcePdf);
    let path = sourcePdf;
    if (definition.kind === 'png') {
      const output = join(working, definition.name);
      await execFile('pdftoppm', ['-f', '1', '-l', '1', '-r', '135', '-singlefile',
        '-png', sourcePdf, output], { timeout: 25_000 });
      path = output + '.png';
    }
    const info = await stat(path);
    files.set(definition.name, {
      definition,
      document: {
        id: randomUUID(), requirementId: definition.name, path,
        kind: definition.kind, size: info.size,
      },
    });
  }

  const testCases = [
    { id: 'rg_png', documentNames: ['rg'], fields: rgFields },
    { id: 'tie_2page_pdf', documentNames: ['tie'], fields: tieFields },
    { id: 'cha_pdf', documentNames: ['cha'], fields: chaFields },
    { id: 'cir_pdf', documentNames: ['cir'], fields: cirFields },
    {
      id: 'rg_plus_tie_batch',
      documentNames: ['rg', 'tie'],
      fields: [...rgFields, ...tieFields],
    },
  ];

  for (const scenario of testCases) {
    const documents = scenario.documentNames.map((name) => {
      const stored = files.get(name);
      return {
        document: stored.document,
        label: stored.definition.heading,
        documentType: stored.definition.type,
        subjectRole: stored.definition.type === 'tie' ? 'vessel' : 'person',
        allowedFieldIds: stored.definition.allowedFields.map((entry) => entry.id),
      };
    });
    const expected = Object.assign({},
      ...scenario.documentNames.map((name) => files.get(name).definition.expected));
    const startCall = calls.length;
    const started = performance.now();
    try {
      const result = await extractDocumentsWithOneContingency(documents, scenario.fields, {
        fetchImpl: meteredFetch,
        timeoutMs: 120_000,
      });
      const found = Object.fromEntries(result.evidence.map((item) => [item.fieldId, item.value]));
      const mismatches = Object.entries(expected)
        .filter(([id, expectedValue]) => normalized(found[id] || '') !== normalized(expectedValue))
        .map(([id]) => id);
      const scenarioCalls = calls.slice(startCall);
      const costUsd = scenarioCalls.reduce((acc, item) => acc + (item.estimatedUsd || 0), 0);
      scenarios.push({
        scenario: scenario.id,
        documents: scenario.documentNames.length,
        documentFormats: scenario.documentNames.map((name) => files.get(name).definition.kind),
        documentPages: scenario.documentNames.reduce((acc, name) => acc + files.get(name).definition.pages.length, 0),
        elapsedMs: Math.round(performance.now() - started),
        apiCalls: scenarioCalls.length,
        expectedFields: Object.keys(expected).length,
        correctFields: Object.keys(expected).length - mismatches.length,
        mismatchedFieldIds: mismatches,
        contingencyUsed: result.contingency.used,
        contingencyFailed: result.contingency.failed,
        inputTokens: scenarioCalls.reduce((acc, item) => acc + (item.inputTokens || 0), 0),
        outputTokens: scenarioCalls.reduce((acc, item) => acc + (item.outputTokens || 0), 0),
        costEstimatedUsd: Number(costUsd.toFixed(8)),
        status: 'completed',
      });
      console.log('Completed: ' + scenario.id + ' | calls=' + scenarioCalls.length +
        ' | cost~USD ' + costUsd.toFixed(6));
    } catch (error) {
      fatal = error instanceof Error && 'code' in error
        ? String(error.code) : 'request_or_processing_failure';
      scenarios.push({
        scenario: scenario.id, status: 'error', errorCode: fatal,
        apiCalls: calls.length - startCall,
        elapsedMs: Math.round(performance.now() - started),
      });
      console.error('Stopped after test ' + scenario.id + ' (error code: ' + fatal + ').');
      break;
    }
  }
} finally {
  const totalInputTokens = calls.reduce((sum, call) => sum + (call.inputTokens || 0), 0);
  const totalOutputTokens = calls.reduce((sum, call) => sum + (call.outputTokens || 0), 0);
  const summary = {
    time: new Date().toISOString(),
    model,
    syntheticOnly: true,
    source: 'real OpenAI Responses API via production document extractor',
    usagePriceUsdPerMillionTokens: rates,
    pricingNote: 'Estimate from metered tokens at published standard prices, not an invoice.',
    scenarios, calls, totals: {
      attemptedScenarios: scenarios.length, completedScenarios: scenarios.filter((s) => s.status === 'completed').length,
      externalCalls, inputTokens: totalInputTokens, outputTokens: totalOutputTokens,
      estimatedUsd: Number(totalEstimatedUsd.toFixed(8)),
      scenarioMeanUsd: scenarios.filter((s) => s.status === 'completed').length
        ? Number((totalEstimatedUsd / scenarios.filter((s) => s.status === 'completed').length).toFixed(8)) : null,
    },
    guards: {
      maxScenarios: 5, maxExternalCalls, maxEstimatedUsd,
      caveat: 'Cost guard is post-response/soft; the OpenAI project budget is authoritative.',
    },
  };
  await writeFile(join(reportsPath, 'resultados-openai-5-testes.json'),
    JSON.stringify(summary, null, 2) + '\n', { mode: 0o600 });
  const lines = [
    '# Cinco testes reais: custos de extração de documentos sintéticos',
    '',
    'Modelo: ' + model + '. Arquivos totalmente fictícios; nenhum documento pessoal real.',
    '',
    '| Cenário | Documentos | Páginas | Chamadas | Entrada | Saída | Custo estimado (USD) | Campos corretos | Resultado |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---|',
    ...scenarios.map((s) => '| ' + s.scenario + ' | ' + (s.documents ?? '-') +
      ' | ' + (s.documentPages ?? '-') + ' | ' + s.apiCalls +
      ' | ' + (s.inputTokens ?? '-') + ' | ' + (s.outputTokens ?? '-') +
      ' | ' + (typeof s.costEstimatedUsd === 'number' ? s.costEstimatedUsd.toFixed(8) : '-') +
      ' | ' + (typeof s.correctFields === 'number' ? s.correctFields + '/' + s.expectedFields : '-') +
      ' | ' + s.status + ' |'),
    '',
    '**Total:** ' + externalCalls + ' requisições à API; USD ' + totalEstimatedUsd.toFixed(8) +
      ' estimados com as taxas de tokens configuradas.',
    '',
    'O sistema permite uma tentativa principal e até uma única contingência por cenário.',
    'O custo é estimado com tokens efetivamente reportados, incluindo desconto para tokens em cache quando informado.',
    'Não corresponde a uma fatura, não inclui tributos nem outros custos externos.',
    'A execução tem limite de 5 cenários e 10 chamadas, mas não é um limite rígido de gastos.',
    '',
    'Somente métricas e IDs de campos faltantes aparecem neste relatório; PDFs e respostas brutas não são enviados aos artefatos.',
    '',
    'Documentos sintéticos simplificados não representam a qualidade ou complexidade dos documentos reais digitalizados.',
  ];
  await writeFile(join(reportsPath, 'relatorio-openai-5-testes.md'),
    lines.join('\n') + '\n', { mode: 0o600 });
  await rm(working, { recursive: true, force: true });
}
if (fatal || scenarios.length !== 5) process.exitCode = 1;
