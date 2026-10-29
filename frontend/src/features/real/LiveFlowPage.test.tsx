import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../App';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
const service = {
  id: 'ci-only-service', title: 'Serviço de teste', description: 'Dados fictícios',
  creditCost: 1, questions: [], documentRequirements: [
    { id: 'source', label: 'Documento de teste', required: false },
  ],
  formVersionIds: ['requerimento-ma-v1'],
  reviewFields: [{ id: 'person.fullName', label: 'Nome completo', valueKind: 'text' }],
};

afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); });

describe('jornada real isolada da demonstração', () => {
  it('navega pelo ciclo upload, OCR, revisão e download com API simulada', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = String(input);
      if (path === '/api/services/ci-only-service' && !init?.method) return json({ service });
      if (path.endsWith('/quote')) return json({ service });
      if (path === '/api/jobs') return json({ id: 'job-fixture' }, 201);
      if (path.endsWith('/documents/source')) return json({ id: 'file-fixture' }, 201);
      if (path.endsWith('/extract')) return json({
        fields: { 'person.fullName': 'MARIA EXEMPLO' }, sources: { 'person.fullName': 'source' },
      });
      if (path.endsWith('/review')) return json({ confirmed: true });
      if (path.endsWith('/renew')) return json({ expiresAt: Date.now() + 20 * 60_000 });
      if (path.endsWith('/generate')) return json({ downloads: ['requerimento-ma-v1'] });
      return json({ error: 'not_found' }, 404);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/preencher-real/ci-only-service']}><App /></MemoryRouter>);

    expect(await screen.findByRole('heading',{name:'Serviço de teste'})).toBeTruthy();
    await user.click(screen.getByRole('button',{name:'Conferir documentos necessários'}));
    expect(await screen.findByRole('heading',{name:'Documentos para leitura automática (opcionais)'})).toBeTruthy();
    const uploader = screen.getByLabelText(/^Documento de teste$/) as HTMLInputElement;
    const camera = screen.getByLabelText(/Fotografar documento de teste/i) as HTMLInputElement;
    expect(uploader.classList.contains('live-upload-input')).toBe(true);
    expect(document.querySelector('label[for="' + uploader.id + '"]')?.textContent)
      .toContain('Escolher arquivo');
    expect(document.querySelector('label[for="' + camera.id + '"]')?.textContent)
      .toContain('Usar câmera');
    expect(screen.getByText('PDF, JPG ou PNG · até 10 MB')).toBeTruthy();
    expect(camera.getAttribute('capture')).toBe('environment');
    expect(camera.getAttribute('accept')).toBe('image/jpeg,image/png');
    await user.upload(camera, new File(['fake-content'], 'foto.png', {type:'image/png'}));
    expect(screen.getByText('foto.png')).toBeTruthy();
    expect(screen.getByText('Trocar arquivo')).toBeTruthy();
    expect(screen.getByText(/0 MB/)).toBeTruthy();
    expect(uploader.disabled).toBe(false);
    await user.click(screen.getByRole('button',{name:'Analisar documentos e revisar campos'}));
    expect(await screen.findByRole('heading',{name:'Confira cada campo'})).toBeTruthy();
    expect((screen.getByLabelText(/Nome completo/) as HTMLInputElement).value).toBe('MARIA EXEMPLO');
    expect(screen.getByText(/Sugestão de Documento de teste/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Prorrogar sessão temporária' }));
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/renew'))).toBe(true);
    await user.clear(screen.getByLabelText(/Nome completo/));
    await user.type(screen.getByLabelText(/Nome completo/), 'MARIA CONFERIDA');
    await user.click(screen.getByRole('button',{name:'Confirmar e gerar formulários'}));
    expect(await screen.findByRole('heading',{name:'Formulários gerados'})).toBeTruthy();
    expect(screen.getByRole('link',{name:'Baixar PDF — requerimento-ma-v1'})
      .getAttribute('href')).toBe('/api/jobs/job-fixture/download/requerimento-ma-v1');
    expect(fetcher).toHaveBeenCalled();
    const reviewCall = fetcher.mock.calls.find((call) => String(call[0]).endsWith('/review'));
    expect(reviewCall).toBeDefined();
    expect(JSON.parse(reviewCall![1]!.body as string).values['person.fullName']).toBe('MARIA CONFERIDA');
  }, 25000);

  it('popula nome, CPF e RG do comprador quando a API entrega candidatos válidos', async () => {
    const identityService = {
      ...service,
      documentRequirements: [
        { id: 'buyer-identity', label: 'Identidade do comprador', required: false },
      ],
      reviewFields: [
        { id: 'person.fullName', label: 'Nome completo', valueKind: 'text', required: true },
        { id: 'person.cpf', label: 'CPF', valueKind: 'text', required: true },
        { id: 'person.identity', label: 'RG', valueKind: 'text', required: false },
      ],
    };
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = String(input);
      if (path === '/api/services/ci-only-service' && !init?.method) {
        return json({ service: identityService });
      }
      if (path.endsWith('/quote')) return json({ service: identityService });
      if (path === '/api/jobs' && init?.method === 'POST') return json({ id: 'job-identity' }, 201);
      if (path.endsWith('/documents/buyer-identity')) return json({ id: 'identity-photo' }, 201);
      if (path.endsWith('/extract')) return json({
        status: 'REVIEW',
        fields: {
          'person.fullName': 'MARIA DE SOUZA',
          'person.cpf': '123.456.789-09',
          'person.identity': '12.345.678-9',
        },
        sources: {
          'person.fullName': 'buyer-identity',
          'person.cpf': 'buyer-identity',
          'person.identity': 'buyer-identity',
        },
        diagnostics: [{ requirementId: 'buyer-identity', outcome: 'suggested', suggestionCount: 3 }],
      });
      return json({ error: 'not_found' }, 404);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/preencher-real/ci-only-service']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Serviço de teste' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Conferir documentos necessários' }));
    await user.upload(screen.getByLabelText(/^Identidade do comprador$/) as HTMLInputElement,
      new File(['synthetic'], 'rg-ficticio.jpg', { type: 'image/jpeg' }));
    await user.click(screen.getByRole('button', { name: 'Analisar documentos e revisar campos' }));
    expect(await screen.findByRole('heading', { name: 'Confira cada campo' })).toBeTruthy();
    expect((screen.getByLabelText(/Nome completo/) as HTMLInputElement).value).toBe('MARIA DE SOUZA');
    expect((screen.getByLabelText(/^CPF/) as HTMLInputElement).value).toBe('123.456.789-09');
    expect((screen.getByLabelText(/^RG/) as HTMLInputElement).value).toBe('12.345.678-9');
    expect(screen.getByText(/3 sugestão\(ões\) encontrada/)).toBeTruthy();
    expect(screen.queryByText('Nenhum campo preenchido pelo OCR')).toBeNull();
    expect(fetcher.mock.calls.some(([url]) =>
      String(url).endsWith('/documents/buyer-identity'))).toBe(true);
  }, 25000);

  it('permite gerar pela jornada manual sem anexar qualquer documento', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = String(input);
      if (path === '/api/services/ci-only-service' && !init?.method) return json({ service });
      if (path.endsWith('/quote')) return json({ service });
      if (path === '/api/jobs' && init?.method === 'POST') return json({ id: 'job-no-files' }, 201);
      if (path === '/api/jobs/job-no-files/extract') {
        return json({ status: 'REVIEW', fields: {}, sources: {}, diagnostics: [] });
      }
      if (path.endsWith('/review')) return json({ confirmed: true });
      if (path.endsWith('/generate')) return json({ downloads: ['requerimento-ma-v1'] });
      return json({ error: 'not_found' }, 404);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/preencher-real/ci-only-service']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Serviço de teste' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Conferir documentos necessários' }));
    expect(await screen.findByRole('heading',
      { name: 'Documentos para leitura automática (opcionais)' })).toBeTruthy();
    await user.click(screen.getByRole('button',
      { name: 'Continuar sem anexos — preencher manualmente' }));
    expect(await screen.findByRole('heading', { name: 'Confira cada campo' })).toBeTruthy();
    expect(screen.getByText(/Você optou por preencher sem documentos/)).toBeTruthy();
    await user.type(screen.getByLabelText(/Nome completo/) as HTMLInputElement, 'MARIA TESTE');
    await user.click(screen.getByRole('button', { name: 'Confirmar e gerar formulários' }));
    expect(await screen.findByRole('heading', { name: 'Formulários gerados' })).toBeTruthy();
    expect(fetcher.mock.calls.filter(([url]) => String(url).includes('/documents/'))).toHaveLength(0);
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/extract'))).toHaveLength(1);
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/review'))).toHaveLength(1);
  }, 25000);

  it('explica qual data foi recusada pelo backend antes da geração', async () => {
    const serviceWithDate = {
      ...service,
      reviewFields: [
        ...service.reviewFields,
        { id: 'sale.date', label: 'Data da venda', valueKind: 'date', required: false },
      ],
    };
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = String(input);
      if (path === '/api/services/ci-only-service' && !init?.method) {
        return json({ service: serviceWithDate });
      }
      if (path.endsWith('/quote')) return json({ service: serviceWithDate });
      if (path === '/api/jobs' && init?.method === 'POST') return json({ id: 'job-invalid-date' }, 201);
      if (path.endsWith('/documents/source')) return json({ id: 'source-id' }, 201);
      if (path.endsWith('/extract')) return json({
        fields: { 'person.fullName': 'MARIA EXEMPLO' },
        sources: { 'person.fullName': 'source' },
      });
      if (path.endsWith('/review')) {
        return json({ error: 'invalid_field_value', fieldId: 'sale.date' }, 422);
      }
      if (path === '/api/jobs/job-invalid-date' && !init?.method) {
        return json({ status: 'REVIEW', downloads: [] });
      }
      return json({ error: 'not_found' }, 404);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/preencher-real/ci-only-service']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Serviço de teste' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Conferir documentos necessários' }));
    await user.upload(screen.getByLabelText(/^Documento de teste$/) as HTMLInputElement,
      new File(['fixture'], 'fake.png', { type: 'image/png' }));
    await user.click(screen.getByRole('button', { name: 'Analisar documentos e revisar campos' }));
    expect(await screen.findByRole('heading', { name: 'Confira cada campo' })).toBeTruthy();
    const date = screen.getByLabelText(/Data da venda/) as HTMLInputElement;
    expect(date.placeholder).toBe('DD/MM/AAAA');
    await user.type(date, '01012026');
    expect(date.value).toBe('01/01/2026');
    await user.clear(date);
    await user.type(date, '31022026');
    expect(date.value).toBe('31/02/2026');
    await user.click(screen.getByRole('button', { name: 'Confirmar e gerar formulários' }));
    expect(await screen.findByText(/Confira Data da venda: use uma data válida/i)).toBeTruthy();
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/generate'))).toHaveLength(0);
  }, 25000);

  it('permite somente um RG, OCR sem sugestões e CPF corrigido no mesmo job', async () => {
    const anotherService = {
      ...service,
      documentRequirements: [
        { id: 'buyer-identity', label: 'Identidade fictícia', required: false },
        { id: 'tie', label: 'TIE fictício', required: false },
      ],
      reviewFields: [
        { id: 'person.fullName', label: 'Nome completo', valueKind: 'text', required: true },
        { id: 'person.cpf', label: 'CPF', valueKind: 'text', required: false },
      ],
    };
    let reviewAttempts = 0;
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = String(input);
      if (path === '/api/services/ci-only-service' && !init?.method) return json({ service: anotherService });
      if (path.endsWith('/quote')) return json({ service: anotherService });
      if (path === '/api/jobs' && init?.method === 'POST') return json({ id: 'job-manual' }, 201);
      if (path.includes('/documents/')) return json({ id: 'synthetic-file' }, 201);
      if (path.endsWith('/extract')) return json({
        fields: {}, sources: {}, diagnostics: [
          { requirementId: 'buyer-identity', outcome: 'no_supported_labels', suggestionCount: 0,
            nameStage: 'label_seen_name_rejected' },
          { requirementId: 'tie', outcome: 'no_text', suggestionCount: 0 },
        ],
      });
      if (path.endsWith('/review')) {
        reviewAttempts++;
        return reviewAttempts === 1
          ? json({ error: 'invalid_field_value', fieldId: 'person.cpf' }, 422)
          : json({ confirmed: true });
      }
      if (path.endsWith('/generate')) return json({ downloads: ['requerimento-ma-v1'] });
      if (path === '/api/jobs/job-manual') return json({ status: 'REVIEW', downloads: [] });
      return json({ error: 'unauthorized' }, 401);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/preencher-real/ci-only-service']}><App /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Serviço de teste' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Conferir documentos necessários' }));
    // One RG is sufficient; no TIE, residence proof, seller ID or photos
    // should be needed to reach the manual-review step.
    await user.upload(screen.getByLabelText(/^Identidade fictícia$/) as HTMLInputElement,
      new File(['ficticio'], 'fake.jpg', { type: 'image/jpeg' }));
    await user.click(screen.getByRole('button', { name: 'Analisar documentos e revisar campos' }));
    expect(fetcher.mock.calls.filter(([url]) =>
      String(url).includes('/documents/tie'))).toHaveLength(0);

    expect(await screen.findByRole('heading', { name: 'Confira cada campo' })).toBeTruthy();
    expect(screen.getByText('Nenhum campo preenchido pelo OCR')).toBeTruthy();
    expect(screen.getByText(/Nome: rótulo encontrado, mas valor não validado/)).toBeTruthy();
    expect(screen.getByText(/texto detectado, mas nenhum dado foi associado aos campos com segurança/)).toBeTruthy();
    expect(screen.getByText(/nenhum texto legível identificado na imagem/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Confirmar e gerar formulários' }));
    expect(screen.getByText(/Preencha o campo obrigatório: Nome completo/)).toBeTruthy();
    expect(reviewAttempts).toBe(0);

    await user.type(screen.getByLabelText(/Nome completo/) as HTMLInputElement, 'MARIA DE SOUZA');
    await user.type(screen.getByLabelText(/^CPF/) as HTMLInputElement, '111.111.111-11');
    await user.click(screen.getByRole('button', { name: 'Confirmar e gerar formulários' }));
    expect(await screen.findByText(/Confira CPF: informe um CPF válido/)).toBeTruthy();
    expect((screen.getByLabelText(/^CPF/) as HTMLInputElement).getAttribute('aria-invalid')).toBe('true');
    await user.clear(screen.getByLabelText(/^CPF/));
    await user.type(screen.getByLabelText(/^CPF/), '123.456.789-09');
    await user.click(screen.getByRole('button', { name: 'Confirmar e gerar formulários' }));
    expect(await screen.findByRole('heading', { name: 'Formulários gerados' })).toBeTruthy();
    expect(reviewAttempts).toBe(2);
    expect(fetcher.mock.calls.filter(([url]) => String(url) === '/api/jobs')).toHaveLength(1);
  }, 30000);

  it('bloqueia acesso ao serviço ainda não homologado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({error:'not_available'},404)));
    render(<MemoryRouter initialEntries={['/preencher-real/transferencia-moto-aquatica']}><App /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/ainda não foi homologado/)).toBeTruthy();
  });

  it('retoma o mesmo job após falha temporária de upload e permite cancelar', async () => {
    let jobsCreated = 0;
    let uploadsAttempted = 0;
    let deleted = 0;
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = String(input);
      if (path === '/api/services/ci-only-service' && !init?.method) return json({ service });
      if (path.endsWith('/quote')) return json({ service });
      if (path === '/api/jobs' && init?.method === 'POST') {
        jobsCreated++;
        return json({ id: 'job-resume' }, 201);
      }
      if (path === '/api/jobs/job-resume' && !init?.method) {
        return json({ status: 'CREATED', uploadedRequirementIds: [] });
      }
      if (path.endsWith('/documents/source')) {
        uploadsAttempted++;
        return uploadsAttempted === 1 ? json({ error: 'unavailable' }, 503)
          : json({ id: 'file-resume' }, 201);
      }
      if (path.endsWith('/extract')) return json({ fields: {}, sources: {} });
      if (path === '/api/jobs/job-resume' && init?.method === 'DELETE') {
        deleted++;
        return json({ removed: true });
      }
      return json({ error: 'not_found' }, 404);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/preencher-real/ci-only-service']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Serviço de teste' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Conferir documentos necessários' }));
    await user.upload(screen.getByLabelText(/^Documento de teste$/) as HTMLInputElement,
      new File(['fixture'], 'fake.png', { type: 'image/png' }));
    await user.click(screen.getByRole('button', { name: 'Analisar documentos e revisar campos' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Analisar documentos e revisar campos' }));
    expect(await screen.findByRole('heading', { name: 'Confira cada campo' })).toBeTruthy();
    expect(jobsCreated).toBe(1);
    expect(uploadsAttempted).toBe(2);
    await user.click(screen.getByRole('button', { name: 'Cancelar e apagar documentos temporários' }));
    expect(await screen.findByRole('heading', { name: 'Dados do serviço' })).toBeTruthy();
    expect(deleted).toBe(1);
  }, 25000);


  it('recupera downloads já gerados quando a resposta de geração se perde', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = String(input);
      if (path === '/api/services/ci-only-service' && !init?.method) return json({ service });
      if (path.endsWith('/quote')) return json({ service });
      if (path === '/api/jobs' && init?.method === 'POST') return json({ id: 'job-completed' }, 201);
      if (path.endsWith('/documents/source')) return json({ id: 'file' }, 201);
      if (path.endsWith('/extract')) return json({
        fields: { 'person.fullName': 'MARIA TESTE' }, sources: { 'person.fullName': 'source' },
      });
      if (path.endsWith('/review')) return json({ confirmed: true });
      if (path.endsWith('/generate')) throw new TypeError('Conexão interrompida após gravar PDF');
      if (path === '/api/jobs/job-completed' && !init?.method) {
        return json({ status: 'GENERATED', downloads: ['requerimento-ma-v1'] });
      }
      return json({ error: 'not_found' }, 404);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/preencher-real/ci-only-service']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Serviço de teste' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Conferir documentos necessários' }));
    await user.upload(screen.getByLabelText(/^Documento de teste$/) as HTMLInputElement,
      new File(['example'], 'image.png', { type: 'image/png' }));
    await user.click(screen.getByRole('button', { name: 'Analisar documentos e revisar campos' }));
    expect(await screen.findByRole('heading', { name: 'Confira cada campo' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Confirmar e gerar formulários' }));
    expect(await screen.findByRole('heading', { name: 'Formulários gerados' })).toBeTruthy();
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/generate'))).toHaveLength(1);
    expect(screen.getByRole('button', { name: /sem novo débito/ })).toBeTruthy();
  }, 25000);

  it('restaura revisão após recarregar a aba sem gravar documentos no navegador', async () => {
    const jobId = 'b148894d-9042-4b66-a3c0-c011be471234';
    sessionStorage.setItem('pa:temporary-job:ci-only-service', jobId);
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      if (url === '/api/services/ci-only-service' && !init?.method) return json({ service });
      if (url === '/api/services/ci-only-service/quote') return json({ service });
      if (url === '/api/jobs/' + jobId && !init?.method) {
        return json({ status:'REVIEW', expiresAt:Date.now()+100_000, answers:{},
          uploadedRequirementIds:['source'], fields:{'person.fullName':'ANA TESTE'},
          sources:{'person.fullName':'source'}, downloads:[] });
      }
      if (url === '/api/jobs/' + jobId && init?.method === 'DELETE') return json({ removed:true });
      return json({ error:'not_found' }, 404);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/preencher-real/ci-only-service']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading',{name:'Confira cada campo'})).toBeTruthy();
    expect((screen.getByLabelText(/Nome completo/) as HTMLInputElement).value).toBe('ANA TESTE');
    expect(sessionStorage.getItem('pa:temporary-job:ci-only-service')).toBe(jobId);
    expect(sessionStorage.length).toBe(1);
    await user.click(screen.getByRole('button',{name:'Cancelar e apagar documentos temporários'}));
    expect(await screen.findByRole('heading',{name:'Dados do serviço'})).toBeTruthy();
    expect(sessionStorage.length).toBe(0);
  }, 25000);

  it('descarta automaticamente um identificador de job expirado ao restaurar', async () => {
    const jobId = 'b148894d-9042-4b66-a3c0-c011be471235';
    sessionStorage.setItem('pa:temporary-job:ci-only-service', jobId);
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) =>
      String(input).startsWith('/api/jobs/') ? json({ error:'not_found' },404) : json({ service })));
    render(<MemoryRouter initialEntries={['/preencher-real/ci-only-service']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading',{name:'Dados do serviço'})).toBeTruthy();
    expect(sessionStorage.length).toBe(0);
  });

});
