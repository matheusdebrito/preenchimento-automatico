import { randomUUID } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { performance } from 'node:perf_hooks';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { extractDocumentsWithOneContingency } from '../dist/modules/jobs/openai-document-extractor.js';
import { catalog } from '../dist/modules/catalog/catalog.js';
import { publicService } from '../dist/modules/catalog/public-catalog.js';

const execFile = promisify(execFileCallback);
const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini-2026-03-17';
const pricing = {
  'gpt-5.4-mini-2026-03-17': { input: 0.75, cachedInput: 0.075, output: 4.50 },
  'gpt-5.4-nano-2026-03-17': { input: 0.20, cachedInput: 0.020, output: 1.25 },
};
const rates = pricing[model];
if (!rates) throw new Error('Unsupported test model; choose the approved mini or nano snapshot.');
const dryRun = process.env.OPENAI_COST_BENCH_DRY_RUN === '1';
const categoryMode = process.env.OPENAI_COST_BENCH_CATEGORY_MODE === '1';
if (!dryRun && !process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY GitHub Actions secret.');
}
const maxExternalCalls = categoryMode ? 6 : 10; // One primary + at most one contingency per case.
const maxEstimatedUsd = 0.15; // Soft guard based on observed token usage, not a billing guarantee.
const reportsPath = resolve(process.env.BENCH_REPORT_DIR ||
  (categoryMode ? 'openai-category-cost-results' : 'openai-cost-results'));
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
const residenceFields = [
  field('person.address', 'Rua'),
  field('person.streetNumber', 'Numero'),
  field('person.apartment', 'Complemento'),
  field('person.neighborhood', 'Bairro'),
  field('person.city', 'Cidade'),
  field('person.state', 'UF'),
  field('person.postalCode', 'CEP'),
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
    name: 'residence',
    heading: 'COMPROVANTE DE RESIDENCIA - FATURA SINTETICA',
    pages: [[
      ['TITULAR', 'ANA CLARA SOUZA'],
      ['LOGRADOURO', 'RUA DAS PALMEIRAS'],
      ['NUMERO', '145'],
      ['COMPLEMENTO', 'APT 203'],
      ['BAIRRO', 'CENTRO'],
      ['CIDADE', 'RIO DE JANEIRO'],
      ['ESTADO', 'RJ'],
      ['CEP', '20040-010'],
    ]],
    type: 'residence-proof',
    kind: 'pdf',
    allowedFields: residenceFields,
    expected: {
      'person.address': 'RUA DAS PALMEIRAS',
      'person.streetNumber': '145',
      'person.apartment': 'APT 203',
      'person.neighborhood': 'CENTRO',
      'person.city': 'RIO DE JANEIRO',
      'person.state': 'RJ',
      'person.postalCode': '20040-010',
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
let simulatedDescriptors = [];
let simulatedDefinitionsByRequirement = new Map();

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
  if (dryRun) {
    const candidates = [];
    const documents = [];
    for (const descriptor of simulatedDescriptors) {
      const definition = simulatedDefinitionsByRequirement.get(descriptor.document.requirementId);
      if (!definition) throw new Error('Missing synthetic fixture for document.');
      const subtype = definition.type === 'identity' ? 'rg'
        : definition.type === 'tie' ? 'tie-digital'
          : definition.type === 'residence-proof' ? 'not-applicable' : definition.type;
      documents.push({
        requirementId: descriptor.document.requirementId,
        status: 'readable', subtype,
      });
      for (const [fieldId, value] of Object.entries(definition.expected)) {
        if (descriptor.allowedFieldIds.includes(fieldId)) {
          candidates.push({
            fieldId, value,
            sourceRequirementId: descriptor.document.requirementId,
            confidence: 'high',
          });
        }
      }
    }
    response = new Response(JSON.stringify({
      output: [{ type: 'message', content: [{
        type: 'output_text', text: JSON.stringify({ candidates, documents }),
      }] }],
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } else {
    try {
      response = await fetch(url, options);
    } catch {
      calls.push({ sequence: externalCalls, status: 'network_error', elapsedMs: Math.round(performance.now() - started) });
      throw new Error('OpenAI request failed to reach the service.');
    }
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

  const originalTestCases = [
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

  // Validate document requirements and field allow-lists against the production
  // catalog, exactly as /api/jobs/:id/extract does. This is not a hand-picked
  // generic prompt: every case matches an available service and its chosen forms.
  function categoryCase(id, serviceId, answers, attachments, requiredEvidenceIds) {
    const service = publicService(catalog, serviceId, answers);
    if (!service || service.formVersionIds.length === 0) {
      throw new Error('Unavailable or unselected test service: ' + serviceId);
    }
    if (attachments.length !== 3) throw new Error('Each category must send exactly 3 documents.');
    const reviewable = new Set(service.reviewFields.map((entry) => entry.id));
    const documentNames = attachments.map((item) => item.fileName);
    const descriptors = attachments.map(({ fileName, requirementId }) => {
      const stored = files.get(fileName);
      const requirement = service.documentRequirements.find((item) => item.id === requirementId);
      if (!stored || !requirement?.extraction ||
        requirement.extraction.documentType !== stored.definition.type) {
        throw new Error('Unexpected document requirement for ' + serviceId + ': ' + requirementId);
      }
      const allowedFieldIds = requirement.extraction.allowedFieldIds
        .filter((fieldId) => reviewable.has(fieldId));
      const availableExpected = Object.keys(stored.definition.expected)
        .filter((fieldId) => allowedFieldIds.includes(fieldId));
      if (availableExpected.length === 0) {
        throw new Error('No expected fields from ' + requirementId + ' in ' + serviceId);
      }
      return {
        fileName, requirementId,
        documentType: requirement.extraction.documentType,
        subjectRole: requirement.extraction.subjectRole,
        label: requirement.label,
        allowedFieldIds,
      };
    });
    const ids = new Set(descriptors.flatMap((item) => item.allowedFieldIds));
    const fields = service.reviewFields.filter((entry) => ids.has(entry.id))
      .map((entry) => ({
        ...entry,
        ...(catalog.fields.find((item) => item.id === entry.id)?.validationRuleId
          ? { validationRuleId: catalog.fields.find((item) => item.id === entry.id).validationRuleId }
          : {}),
      }));
    const expected = {};
    for (const descriptor of descriptors) {
      for (const [fieldId, value] of Object.entries(files.get(descriptor.fileName).definition.expected)) {
        if (descriptor.allowedFieldIds.includes(fieldId)) {
          if (expected[fieldId] && expected[fieldId] !== value) {
            throw new Error('Conflicting fixture values for ' + fieldId);
          }
          expected[fieldId] = value;
        }
      }
    }
    for (const requiredFieldId of requiredEvidenceIds) {
      if (!Object.hasOwn(expected, requiredFieldId)) {
        throw new Error('Service does not use expected field ' + requiredFieldId + ': ' + serviceId);
      }
    }
    return { id, serviceId, documentNames, documents: descriptors, fields, expected };
  }

  const testCases = categoryMode ? [
    categoryCase(
      'embarcacoes_transferencia_3_docs',
      'transferencia-propriedade-embarcacao',
      { includeResidenceDeclaration: 'sim', vesselType: 'embarcacao',
        hasCoOwner: 'nao', tieSituation: 'regular', transferTarget: 'propriedade' },
      [
        { fileName: 'rg', requirementId: 'applicant-identity' },
        { fileName: 'tie', requirementId: 'tie' },
        { fileName: 'residence', requirementId: 'residence-proof' },
      ],
      ['person.fullName', 'vessel.registration', 'person.address'],
    ),
    categoryCase(
      'amadores_renovacao_cha_3_docs',
      'renovacao-cha-amador',
      { includeResidenceDeclaration: 'sim',
        amateurCategory: 'arrais', chaSituation: 'danificada' },
      [
        { fileName: 'rg', requirementId: 'applicant-identity' },
        { fileName: 'cha', requirementId: 'current-cha' },
        { fileName: 'residence', requirementId: 'residence-proof' },
      ],
      ['person.fullName', 'amateur.chaNumber', 'person.address'],
    ),
    categoryCase(
      'aquaviarios_revalidacao_certificado_3_docs',
      'revalidacao-certificado-aquaviario',
      { includeResidenceDeclaration: 'sim', certificateModel: 'dpc1031', personSex: 'feminino' },
      [
        { fileName: 'rg', requirementId: 'applicant-identity' },
        { fileName: 'cir', requirementId: 'current-cir' },
        { fileName: 'residence', requirementId: 'residence-proof' },
      ],
      ['person.fullName', 'aquaviario.cirNumber', 'person.address'],
    ),
  ] : originalTestCases;

  for (const scenario of testCases) {
    const documents = scenario.documents
      ? scenario.documents.map((entry) => ({
        document: { ...files.get(entry.fileName).document, requirementId: entry.requirementId },
        label: entry.label,
        documentType: entry.documentType,
        subjectRole: entry.subjectRole,
        allowedFieldIds: entry.allowedFieldIds,
      }))
      : scenario.documentNames.map((name) => {
        const stored = files.get(name);
        return {
          document: stored.document,
          label: stored.definition.heading,
          documentType: stored.definition.type,
          subjectRole: stored.definition.type === 'tie' ? 'vessel' : 'person',
          allowedFieldIds: stored.definition.allowedFields.map((entry) => entry.id),
        };
      });
    const expected = scenario.expected ?? Object.assign({},
      ...scenario.documentNames.map((name) => files.get(name).definition.expected));
    const startCall = calls.length;
    simulatedDescriptors = documents;
    simulatedDefinitionsByRequirement = new Map(documents.map((entry, i) =>
      [entry.document.requirementId, files.get(scenario.documentNames[i]).definition]));
    const started = performance.now();
    try {
      const result = await extractDocumentsWithOneContingency(documents, scenario.fields, {
        env: dryRun
          ? { ...process.env, OPENAI_API_KEY: 'offline-smoke-test-only' }
          : process.env,
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
        ...(scenario.serviceId ? { serviceId: scenario.serviceId } : {}),
        requestedFieldCount: scenario.fields.length,
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
    suite: categoryMode ? '3_categories_3_documents_each' : '5_baseline_cases',
    model,
    mode: dryRun ? 'offline_mock_no_api_calls' : 'real_openai_responses_api',
    syntheticOnly: true,
    source: dryRun
      ? 'Offline mock through the production extractor'
      : 'real OpenAI Responses API via production document extractor',
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
      maxScenarios: categoryMode ? 3 : 5, maxExternalCalls, maxEstimatedUsd,
      caveat: 'Cost guard is post-response/soft; the OpenAI project budget is authoritative.',
    },
  };
  await writeFile(join(reportsPath,
    categoryMode ? 'resultados-openai-3-categorias.json' : 'resultados-openai-5-testes.json'),
    JSON.stringify(summary, null, 2) + '\n', { mode: 0o600 });
  const lines = [
    dryRun
      ? '# Smoke offline: cenários sintéticos sem API'
      : categoryMode
        ? '# Três categorias de serviço: custo real com 3 documentos por processo'
        : '# Cinco testes reais: custos de extração de documentos sintéticos',
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
    'A execução tem limite de ' + (categoryMode ? 3 : 5) + ' cenários e ' + maxExternalCalls +
      ' chamadas, mas não é um limite rígido de gastos.',
    '',
    'Somente métricas e IDs de campos faltantes aparecem neste relatório; PDFs e respostas brutas não são enviados aos artefatos.',
    '',
    'Documentos sintéticos simplificados não representam a qualidade ou complexidade dos documentos reais digitalizados.',
  ];
  await writeFile(join(reportsPath,
    categoryMode ? 'relatorio-openai-3-categorias.md' : 'relatorio-openai-5-testes.md'),
    lines.join('\n') + '\n', { mode: 0o600 });
  await rm(working, { recursive: true, force: true });
}
if (fatal || scenarios.length !== (categoryMode ? 3 : 5)) process.exitCode = 1;
