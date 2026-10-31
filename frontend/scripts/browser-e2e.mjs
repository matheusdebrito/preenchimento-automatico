import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:8080';
const output = resolve(process.cwd(), 'browser-qa-results');
await mkdir(output, { recursive: true });
let browser;
let lastPage;
const failures = [];
const requestErrors = [];
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    acceptDownloads: true,
    locale: 'pt-BR',
  });
  const page = await context.newPage();
  lastPage = page;
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => requestErrors.push('pageerror: ' + error.message));
  page.on('response', response => {
    if (response.status() >= 500) requestErrors.push(String(response.status()) + ' ' + response.url());
  });

  // Browser registration against real Fastify/PostgreSQL via same-origin nginx.
  await page.goto(base + '/entrar?modo=cadastro&next=%2Fpreencher-real%2Fsegunda-via-cir-aquaviario');
  await page.getByRole('heading', { name: 'Criar conta' }).waitFor();
  await page.locator('input[name="name"]').fill('Pessoa Ficticia de Teste');
  await page.locator('input[name="tel"]').fill('21999998888');
  await page.locator('input[name="email"]').fill('browser-qa@example.invalid');
  await page.locator('#auth-password').fill('SenhaFicticiaUnica2026!');
  await page.locator('#auth-confirmation').fill('SenhaFicticiaUnica2026!');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await page.waitForURL('**/preencher-real/segunda-via-cir-aquaviario');
  await page.getByRole('heading', { name: 'Dados do serviço' }).waitFor();
  console.log('PASS: cadastro e autenticação no navegador');

  async function choose(labelPart, value) {
    await page.locator('label.field').filter({ hasText: labelPart }).locator('select').selectOption(value);
  }
  async function fillName() {
    const nameField = page.locator('input[id$="-person.fullName"]:visible').first();
    await nameField.waitFor();
    await nameField.fill('MARIA GONCALVES TESTE');
    const cpfField = page.locator('input[id$="-person.cpf"]:visible').first();
    if (await cpfField.count()) await cpfField.fill('529.982.247-25');
  }
  async function completeService(id, expectedIds, shortName) {
    await page.getByRole('button', { name: 'Ver formulários e continuar' }).click();
    await page.getByRole('heading', { name: 'Documentos para preenchimento automático (opcionais)' }).waitFor();
    await page.screenshot({ path: join(output, shortName + '-documents.png'), fullPage: true });
    await page.getByRole('button', { name: 'Continuar sem anexos — preencher manualmente' }).click();
    await page.getByRole('heading', { name: 'Preencha e confira os formulários' }).waitFor();
    await fillName();
    await page.screenshot({ path: join(output, shortName + '-review.png'), fullPage: true });
    await page.getByRole('button', { name: 'Confirmar e gerar formulários' }).click();
    await page.getByRole('button', { name: 'Continuar mesmo assim' }).waitFor();
    await page.getByRole('button', { name: 'Continuar mesmo assim' }).click();
    await page.getByRole('heading', { name: 'Formulários gerados' }).waitFor();
    await page.getByText(/nenhum crédito de análise foi consumido/i).waitFor();
    for (const versionId of expectedIds) {
      const link = page.locator('a[download][href*="' + versionId + '"]');
      assert.equal(await link.count(), 1, 'Download not shown for ' + versionId);
      const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
      const path = join(output, shortName + '-' + versionId + '.pdf');
      await download.saveAs(path);
      const file = await readFile(path);
      assert.equal(file.subarray(0, 5).toString(), '%PDF-', 'Non-PDF download: ' + path);
      assert(file.length > 1000, 'Empty PDF: ' + versionId);
      console.log('PASS: ' + versionId + ', ' + file.length + ' bytes');
    }
    await page.screenshot({ path: join(output, shortName + '-download-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: join(output, shortName + '-download-mobile.png'), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 3);
    assert(!overflow, 'Horizontal overflow in mobile screen');
    await page.setViewportSize({ width: 1280, height: 800 });
    const balance = await page.request.get(base + '/api/credits/balance');
    assert.equal(balance.status(), 200);
    const payload = await balance.json();
    assert.equal(payload.balance, 0, 'Manual, no-document flow must not debit credits');
    console.log('PASS: ' + shortName + ' browser flow, mobile layout, no OpenAI / credit debit');
  }

  // The first service generates Anexos 1-K and 1-L plus an auxiliary request.
  await choose('Motivo da 2ª via da CIR', 'extravio');
  await completeService('segunda-via-cir-aquaviario',
    ['declaracao-extravio-aquaviario-2026-v1', 'declaracao-residencia-aquaviario-2026-v1'],
    'aquaviario');

  // The next service covers the restored official NORMAM-211 Anexo 3-C.
  await page.goto(base + '/preencher-real/inscricao-embarcacao');
  await page.getByRole('heading', { name: 'Dados do serviço' }).waitFor();
  await choose('Tipo de embarcação', 'embarcacao');
  await choose('A embarcação possui coproprietário?', 'nao');
  await choose('Comprimento da embarcação', 'ate_6m');
  await choose('Será apresentado o Termo de Responsabilidade', 'sim');
  await completeService('inscricao-embarcacao',
    ['termo-responsabilidade-er-2026-v1'], 'embarcacao');

  assert.deepEqual(requestErrors, [], 'Browser page/server errors');
  console.log('PASS: browser E2E completed');
} catch (error) {
  failures.push(String(error?.stack ?? error));
  if (lastPage) {
    await lastPage.screenshot({ path: join(output, 'failure.png'), fullPage: true }).catch(() => {});
    const body = await lastPage.locator('body').innerText().catch(() => 'unavailable');
    console.error('Last visible UI:\n' + body.slice(0, 6000));
  }
  console.error('BROWSER QA FAILURE:', failures.join('\n'));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
