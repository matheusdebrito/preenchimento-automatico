import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { Notice } from '../../components/ui/Notice';
import { Button } from '../../components/ui/Button';
import { api, ApiError } from '../../lib/api';
import { formatBrazilianDateInput } from '../../lib/date-mask';
import type { LiveService } from '../../lib/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { readTemporaryJob, rememberTemporaryJob, forgetTemporaryJob } from './temporary-job-session';

type Step = 'questions' | 'files' | 'review' | 'download';
type ExtractionDiagnostic = {
  requirementId: string;
  outcome: 'suggested' | 'no_text' | 'no_supported_labels' | 'no_applicable_fields' | 'not_analyzed';
  suggestionCount: number;
};

export function LiveFlowPage() {
  useDocumentTitle('Preenchimento de formulário');
  const { serviceId } = useParams();
  const [service, setService] = useState<LiveService | null>(null);
  const [step, setStep] = useState<Step>('questions');
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [files, setFiles] = useState<Record<string,File>>({});
  const [values, setValues] = useState<Record<string,string>>({});
  const [sources, setSources] = useState<Record<string,string>>({});
  const [diagnostics, setDiagnostics] = useState<ExtractionDiagnostic[]>([]);
  const [invalidFieldId, setInvalidFieldId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [uploadedRequirements, setUploadedRequirements] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    void (async () => {
      try {
        const initial = await api<{service:LiveService}>(
          '/api/services/' + encodeURIComponent(serviceId));
        const savedId = readTemporaryJob(serviceId);
        if (!savedId) {
          if (!cancelled) setService(initial.service);
          return;
        }
        try {
          const status = await api<{
            status: string; expiresAt: number; answers: Record<string,string>;
            uploadedRequirementIds: string[];
            fields: Record<string,string>; sources: Record<string,string>; downloads: string[];
            diagnostics?: ExtractionDiagnostic[];
          }>('/api/jobs/' + savedId);
          const quoted = await api<{service:LiveService}>(
            '/api/services/' + encodeURIComponent(serviceId) + '/quote',
            { method: 'POST', body: JSON.stringify({ answers: status.answers }) },
          );
          if (cancelled) return;
          setService(quoted.service);
          setAnswers(status.answers);
          setJobId(savedId);
          setExpiresAt(status.expiresAt);
          setUploadedRequirements(status.uploadedRequirementIds);
          if (status.status === 'REVIEW' || status.status === 'GENERATED') {
            const visible = new Set(quoted.service.reviewFields.map((field) => field.id));
            setValues(Object.fromEntries(
              Object.entries(status.fields ?? {}).filter(([id]) => visible.has(id))));
            setSources(Object.fromEntries(
              Object.entries(status.sources ?? {}).filter(([id]) => visible.has(id))));
            setDiagnostics(status.diagnostics ?? []);
            if (status.status === 'GENERATED') setDownloads(status.downloads ?? []);
            setStep(status.status === 'GENERATED' ? 'download' : 'review');
          } else {
            setStep('files');
            if (status.status === 'PROCESSING' || status.status === 'GENERATING') {
              setError('O servidor ainda está processando este pacote. Atualize a página após a conclusão.');
            }
          }
        } catch (issue) {
          if (issue instanceof ApiError && [401, 404, 410].includes(issue.status)) {
            forgetTemporaryJob(serviceId);
          }
          if (!cancelled) {
            setService(initial.service);
            setError('Não foi possível recuperar a sessão temporária. Você pode iniciar um novo processo.');
          }
        }
      } catch {
        if (!cancelled) setError('Este serviço ainda não foi homologado para preenchimento.');
      }
    })();
    return () => { cancelled = true; };
  }, [serviceId]);

  const quote = async () => {
    if (!service || service.questions.some((question) => !answers[question.id])) {
      setError('Responda às perguntas sobre o seu caso.');
      return;
    }
    setBusy(true); setError('');
    try {
      const result = await api<{service:LiveService}>(
        '/api/services/' + encodeURIComponent(service.id) + '/quote',
        { method: 'POST', body: JSON.stringify({ answers }) },
      );
      setService(result.service);
      setStep('files');
    } catch { setError('Não foi possível validar os requisitos do serviço.'); }
    finally { setBusy(false); }
  };

  const selectFile = (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (uploadedRequirements.includes(id)) {
      setError('Esse documento já foi enviado. Para substituí-lo, cancele o processo.');
      return;
    }
    if (file.size === 0 || file.size > 10 * 1024 * 1024 ||
      !['application/pdf','image/png','image/jpeg'].includes(file.type)) {
      setError('Escolha JPG, PNG ou PDF com até 10 MB.');
      return;
    }
    setFiles((prev) => ({ ...prev, [id]: file }));
    setError('');
  };

  const showReview = (
    fields: Record<string, string>,
    originNotes: Record<string, string>,
    reports: ExtractionDiagnostic[] = [],
  ) => {
    const visible = new Set(service?.reviewFields.map((field) => field.id) ?? []);
    setValues(Object.fromEntries(Object.entries(fields).filter(([key]) => visible.has(key)).map(([key, value]) => [key, service?.reviewFields.find((field) => field.id === key)?.valueKind === 'date' ? formatBrazilianDateInput(value) : value])));
    setSources(Object.fromEntries(Object.entries(originNotes).filter(([key]) => visible.has(key))));
    setDiagnostics(reports);
    setInvalidFieldId(null);
    setStep('review');
  };

  const extract = async () => {
    if (!service) return;
    setBusy(true);
    setError('');
    try {
      let currentJob = jobId;
      const present = new Set(uploadedRequirements);
      if (currentJob) {
        // Recover when an upload was stored but the browser lost the response.
        const status = await api<{
          status: string; uploadedRequirementIds: string[]; expiresAt?: number;
          fields?: Record<string,string>; sources?: Record<string,string>; downloads?: string[];
          diagnostics?: ExtractionDiagnostic[];
        }>('/api/jobs/' + currentJob);
        if (status.expiresAt) setExpiresAt(status.expiresAt);
        if (status.status === 'REVIEW') {
          showReview(status.fields ?? {}, status.sources ?? {}, status.diagnostics ?? []);
          return;
        }
        if (status.status === 'GENERATED') {
          setDownloads(status.downloads ?? []);
          setStep('download');
          return;
        }
        for (const requirement of status.uploadedRequirementIds) present.add(requirement);
        setUploadedRequirements([...present]);
        if (status.status !== 'CREATED' && status.status !== 'UPLOADED') {
          throw new ApiError(409, 'Este processo não aceita novos documentos.');
        }
      } else {
        const job = await api<{id:string;expiresAt:number}>('/api/jobs',
          { method:'POST', body:JSON.stringify({serviceId:service.id,answers}) });
        currentJob = job.id;
        rememberTemporaryJob(service.id, job.id);
        setJobId(job.id);
        setExpiresAt(job.expiresAt);
      }
      for (const [requirementId, file] of Object.entries(files)) {
        if (present.has(requirementId)) continue;
        await api<{id:string}>(
          '/api/jobs/' + currentJob + '/documents/' + encodeURIComponent(requirementId),
          { method:'POST', body:file, headers:{ 'Content-Type':file.type } },
        );
        present.add(requirementId);
        setUploadedRequirements([...present]);
      }
      const read = await api<{
        fields: Record<string,string>; sources: Record<string,string>;
        diagnostics?: ExtractionDiagnostic[];
      }>(
        '/api/jobs/' + currentJob + '/extract', { method:'POST', body:JSON.stringify({}) },
      );
      // Present and send only fields that the user can visibly review.
      showReview(read.fields, read.sources, read.diagnostics ?? []);
    } catch (issue) {
      if (issue instanceof ApiError && issue.status === 404) {
        if (serviceId) forgetTemporaryJob(serviceId);
        setJobId(null);
        setUploadedRequirements([]);
        setExpiresAt(null);
        setError('O processo expirou. Tente enviar novamente os documentos.');
      } else {
        setError(issue instanceof ApiError ? issue.message : 'Falha na leitura. Tente novamente.');
      }
    } finally {
      setBusy(false);
    }
  };

  const renewSession = async () => {
    if (!jobId || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await api<{expiresAt:number}>('/api/jobs/' + jobId + '/renew',
        { method: 'POST', body: JSON.stringify({}) });
      setExpiresAt(response.expiresAt);
    } catch {
      setError('Não foi possível prolongar a sessão temporária. Ela pode ter expirado.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (jobId) {
        try {
          await api<{removed:boolean}>('/api/jobs/' + jobId, { method:'DELETE' });
        } catch (issue) {
          // A 404 means the private files have already expired.
          if (!(issue instanceof ApiError && issue.status === 404)) throw issue;
        }
      }
      if (serviceId) forgetTemporaryJob(serviceId);
      setJobId(null);
      setExpiresAt(null);
      setUploadedRequirements([]);
      setFiles({});
      setValues({});
      setSources({});
      setDiagnostics([]);
      setInvalidFieldId(null);
      setDownloads([]);
      setStep('questions');
    } catch {
      setError('Não foi possível excluir este processo agora. Tente novamente antes de sair.');
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!jobId || !service) return;
    setError('');
    setInvalidFieldId(null);
    const missing = service.reviewFields.find((field) =>
      field.required && !values[field.id]?.trim());
    if (missing) {
      setInvalidFieldId(missing.id);
      setError('Preencha o campo obrigatório: ' + missing.label + '.');
      document.getElementById('review-' + missing.id)?.focus();
      return;
    }

    setBusy(true);
    try {
      await api<{confirmed:boolean}>('/api/jobs/' + jobId + '/review',
        {method:'PATCH', body:JSON.stringify({confirmed:true,values})});
      const result = await api<{downloads:string[]}>('/api/jobs/' + jobId + '/generate',
        {method:'POST', body:JSON.stringify({})});
      setDownloads(result.downloads);
      setStep('download');
    } catch (issue) {
      // A lost response after generation must not trigger another debit.
      try {
        const current = await api<{status:string;downloads:string[]}>('/api/jobs/' + jobId);
        if (current.status === 'GENERATED') {
          setDownloads(current.downloads);
          setStep('download');
          return;
        }
      } catch {
        // Preserve the original issue, including a precise field ID.
      }
      if (issue instanceof ApiError && issue.fieldId) {
        const field = service.reviewFields.find((item) => item.id === issue.fieldId);
        const label = field?.label ?? 'o campo informado';
        const tip = issue.errorCode === 'missing_required_fields'
          ? 'é obrigatório e precisa ser preenchido.'
          : field?.valueKind === 'date'
            ? 'use uma data válida no formato DD/MM/AAAA.'
            : issue.fieldId.endsWith('.cpf')
              ? 'informe um CPF válido com os dígitos verificadores.'
              : 'revise o formato e o valor.';
        setInvalidFieldId(issue.fieldId);
        setError('Confira ' + label + ': ' + tip);
        document.getElementById('review-' + issue.fieldId)?.focus();
      } else {
        setError(issue instanceof ApiError ? issue.message : 'Não foi possível gerar os formulários.');
      }
    } finally { setBusy(false); }
  };

  return (
    <PageLayout>
      <div className="page">
        <div className="container page-stack live-flow">
          <header className="page__header">
            <p className="eyebrow">Preenchimento assistido</p>
            <h1>{service?.title ?? 'Serviço náutico'}</h1>
            <p className="lead">{service?.description ?? 'Carregando disponibilidade do serviço…'}</p>
          </header>
          {error && step !== 'files' && step !== 'review'
            ? <Notice tone="danger" role="alert">{error}</Notice> : null}
          {!service ? (
            <Notice tone="info">Os formulários só serão liberados após validação oficial e revisão do preenchimento. <Link to="/preencher/servico">Conhecer demonstração</Link>.</Notice>
          ) : (
            <section className="card card--padded live-form">
              <p className="eyebrow">{service.id === 'transferencia-moto-aquatica' && service.creditCost === 0
                ? 'Simulação técnica: sem cobrança de créditos'
                : 'Custo: ' + service.creditCost + ' crédito por processo'}</p>
              {service.id === 'transferencia-moto-aquatica' && service.creditCost === 0 ? (
                <Notice tone="danger" role="alert">
                  SOMENTE QA LOCAL do serviço de transferência: utilize documentos e fotos inteiramente fictícios.
                  Os PDFs gerados terão marca d’água AMOSTRA e não podem ser usados em processos oficiais.
                </Notice>
              ) : null}
              <Notice tone="info">Ferramenta independente. Não protocola documentos na Marinha e não substitui assinaturas, reconhecimento de firmas ou conferência.</Notice>
              {step === 'questions' ? (
                <>
                  <h2>Dados do serviço</h2>
                  {service.questions.map((question) => (
                    <label key={question.id} className="field">
                      <span className="field__label">{question.label}</span>
                      <select className="field__input" required value={answers[question.id] ?? ''}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, [question.id]:event.target.value }))}>
                        <option value="">Selecione</option>
                        {question.options.map((value) => <option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}
                      </select>
                    </label>
                  ))}
                  <Button disabled={busy} onClick={() => void quote()}>Conferir documentos necessários</Button>
                </>
              ) : null}
              {step === 'files' ? (
                <>
                  <h2>Documentos para leitura automática (opcionais)</h2>
                  <p>Você pode anexar apenas um documento, vários ou nenhum.
                    O OCR tentará sugerir os dados disponíveis; todos os demais campos
                    poderão ser preenchidos manualmente na próxima etapa.</p>
                  <p className="field__hint">Os arquivos escolhidos são enviados temporariamente
                    ao servidor e excluídos ao cancelar ou expirar o processo.</p>
                  {service.documentRequirements.map((required) => (
                    <div key={required.id} className="live-upload-field">
                      <label className="field">
                        <span className="field__label">{required.label} (opcional)</span>
                        <span className="field__hint">{required.description}</span>
                        <input className="field__input" type="file" accept=".pdf,.png,.jpg,.jpeg"
                          disabled={uploadedRequirements.includes(required.id) || busy}
                          onChange={(event) => selectFile(required.id, event)} />
                      </label>
                      <label className="field">
                        <span className="field__hint">Ou fotografe com a câmera do celular (frente nítida, sem cortes ou reflexos)</span>
                        <input className="field__input" type="file" accept="image/jpeg,image/png"
                          capture="environment" aria-label={'Fotografar ' + required.label.toLowerCase()}
                          disabled={uploadedRequirements.includes(required.id) || busy}
                          onChange={(event) => selectFile(required.id, event)} />
                      </label>
                      {uploadedRequirements.includes(required.id)
                        ? <span className="field__hint">Documento recebido pelo servidor</span>
                        : files[required.id]
                          ? <span className="field__hint">{files[required.id]?.name}</span>
                          : null}
                    </div>
                  ))}
                  {error ? <Notice tone="danger" role="alert">{error}</Notice> : null}
                  <Button disabled={busy} onClick={() => void extract()}>
                    {busy ? 'Preparando revisão…' :
                      Object.keys(files).length > 0 || uploadedRequirements.length > 0
                        ? 'Analisar documentos e revisar campos'
                        : 'Continuar sem anexos — preencher manualmente'}
                  </Button>
                </>
              ) : null}
              {step === 'review' ? (
                <>
                  <h2>Confira cada campo</h2>
                  <p>As sugestões do OCR podem estar incorretas. Corrija e confirme os valores antes de gerar.</p>
                  {diagnostics.length === 0 ? (
                    <Notice tone="info" role="status">
                      Você optou por preencher sem documentos. Informe manualmente os campos
                      necessários para os formulários selecionados.
                    </Notice>
                  ) : service.reviewFields.some((field) => sources[field.id] &&
                    service.documentRequirements.some((doc) => doc.id === sources[field.id])) ? (
                    <Notice tone="info" role="status">
                      Alguns campos foram sugeridos automaticamente. Confira todos antes de confirmar.
                      Os demais podem ser preenchidos manualmente.
                    </Notice>
                  ) : (
                    <Notice tone="danger" role="alert" title="Nenhum campo preenchido pelo OCR">
                      O arquivo foi recebido, mas não foi possível aproveitar dados dele para os
                      formulários selecionados. Confira o resultado da leitura por documento abaixo.
                      Se necessário, refaça a foto com o documento inteiro, bem iluminado, sem
                      reflexos e com o texto nítido. Você pode continuar preenchendo manualmente.
                    </Notice>
                  )}
                  {diagnostics.length > 0 ? (
                    <div className="live-ocr-report">
                      <strong>Resultado da leitura por documento</strong>
                      <ul>
                        {diagnostics.map((item) => (
                          <li key={item.requirementId}>
                            {service.documentRequirements.find((doc) =>
                              doc.id === item.requirementId)?.label ?? 'Documento enviado'}:
                            {' ' + (item.outcome === 'suggested'
                              ? item.suggestionCount + ' sugestão(ões) encontrada(s), sujeitas à revisão'
                              : item.outcome === 'no_text' ? 'nenhum texto legível identificado na imagem'
                                : item.outcome === 'not_analyzed' ? 'não há extração automática configurada'
                                  : item.outcome === 'no_applicable_fields'
                                    ? 'alguns dados reconhecidos, mas não há campos correspondentes no formulário selecionado'
                                    : 'texto detectado, mas nome/CPF/RG não foram identificados com segurança')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {service.reviewFields.map((field) => (
                    <label key={field.id} className="field">
                      <span className="field__label">{field.label}{field.required ? ' *' : ''}</span>
                      <input id={'review-' + field.id} className="field__input"
                        required={field.required} value={values[field.id] ?? ''}
                        aria-invalid={invalidFieldId === field.id || undefined}
                        inputMode={field.valueKind === 'date' ? 'numeric' : undefined}
                        maxLength={field.valueKind === 'date' ? 10 : undefined}
                        placeholder={field.valueKind === 'date' ? 'DD/MM/AAAA' : undefined}
                        onChange={(event) => {
                          const typed = field.valueKind === 'date'
                            ? formatBrazilianDateInput(event.target.value)
                            : event.target.value;
                          setValues((prev) => ({ ...prev, [field.id]:typed }));
                          if (invalidFieldId === field.id) {
                            setInvalidFieldId(null);
                            setError('');
                          }
                        }} />
                      <span className="field__hint">
                        {sources[field.id] &&
                          service.documentRequirements.some((doc) => doc.id === sources[field.id])
                          ? 'Sugestão de ' +
                            (service.documentRequirements.find((document) =>
                              document.id === sources[field.id])?.label ?? 'documento enviado') +
                            ' — confira antes de confirmar'
                          : 'Preenchimento manual necessário'}
                      </span>
                      {invalidFieldId === field.id
                        ? <span className="field__error">Confira o valor informado neste campo.</span>
                        : null}
                    </label>
                  ))}
                  {error ? <Notice tone="danger" role="alert">{error}</Notice> : null}
                  <Button disabled={busy} onClick={() => void generate()}>
                    {busy ? 'Gerando…' : 'Confirmar e gerar formulários'}
                  </Button>
                </>
              ) : null}
              {jobId && step !== 'questions' ? (
                <div className="field">
                  <p className="field__hint">
                    Documentos temporários: até 20 minutos por renovação,
                    limitados a 1 hora desde o início.
                    {expiresAt ? ' Prazo indicado: ' + new Date(expiresAt).toLocaleTimeString('pt-BR') + '.' : ''}
                  </p>
                  <button type="button" className="live-text-button" disabled={busy}
                    onClick={() => void renewSession()}>
                    Prorrogar sessão temporária
                  </button>
                </div>
              ) : null}
              {(step === 'files' || step === 'review' || step === 'download') ? (
                <button type="button" className="live-text-button" disabled={busy}
                  onClick={() => void cancel()}>
                  {step === 'download'
                    ? 'Encerrar e apagar PDFs (sem novo débito)'
                    : 'Cancelar e apagar documentos temporários'}
                </button>
              ) : null}
              {step === 'download' && jobId ? (
                <>
                  <h2>Formulários gerados</h2>
                  <Notice tone="success">{service.id === 'transferencia-moto-aquatica' && service.creditCost === 0
                    ? 'Amostras preparadas. Nenhum crédito foi cobrado. Não utilize estes PDFs oficialmente.'
                    : 'Pacote preparado. Um único crédito foi reservado no processo e será mantido após o download. Se a entrega não ocorrer, poderá ser estornado.'}</Notice>
                  {downloads.map((version) => (
                    <a className="btn btn--secondary" key={version}
                      href={'/api/jobs/' + jobId + '/download/' + encodeURIComponent(version)} download>
                      Baixar PDF — {version}
                    </a>
                  ))}
                  <p className="field__hint">Confira as informações e assine os documentos conforme orientações oficiais.</p>
                </>
              ) : null}
            </section>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
