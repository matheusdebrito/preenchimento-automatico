import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { Notice } from '../../components/ui/Notice';
import { Button } from '../../components/ui/Button';
import { api, ApiError } from '../../lib/api';
import type { LiveService } from '../../lib/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

type Step = 'questions' | 'files' | 'review' | 'download';

export function LiveFlowPage() {
  useDocumentTitle('Preenchimento de formulário');
  const { serviceId } = useParams();
  const [service, setService] = useState<LiveService | null>(null);
  const [step, setStep] = useState<Step>('questions');
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [files, setFiles] = useState<Record<string,File>>({});
  const [values, setValues] = useState<Record<string,string>>({});
  const [sources, setSources] = useState<Record<string,string>>({});
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadedRequirements, setUploadedRequirements] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    void api<{service:LiveService}>('/api/services/' + encodeURIComponent(serviceId))
      .then((response) => { if (!cancelled) setService(response.service); })
      .catch(() => { if (!cancelled) setError('Este serviço ainda não foi homologado para preenchimento.'); });
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
    if (jobId) {
      setError('Para substituir um documento, cancele e reinicie o processo temporário.');
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

  const extract = async () => {
    if (!service) return;
    if (service.documentRequirements.some((required) => required.required && !files[required.id])) {
      setError('Adicione os documentos obrigatórios antes de continuar.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      let currentJob = jobId;
      const present = new Set(uploadedRequirements);
      if (currentJob) {
        // Recover when an upload was stored but the browser lost the response.
        const status = await api<{status:string;uploadedRequirementIds:string[]}>(
          '/api/jobs/' + currentJob,
        );
        for (const requirement of status.uploadedRequirementIds) present.add(requirement);
        setUploadedRequirements([...present]);
        if (status.status !== 'CREATED' && status.status !== 'UPLOADED') {
          throw new ApiError(409, 'Este processo não aceita novos documentos.');
        }
      } else {
        const job = await api<{id:string}>('/api/jobs',
          { method:'POST', body:JSON.stringify({serviceId:service.id,answers}) });
        currentJob = job.id;
        setJobId(job.id);
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
      const read = await api<{fields:Record<string,string>;sources:Record<string,string>}>(
        '/api/jobs/' + currentJob + '/extract', { method:'POST', body:JSON.stringify({}) },
      );
      // Present and send only mapped fields that users can visibly review.
      const visible = new Set(service.reviewFields.map((field) => field.id));
      setValues(Object.fromEntries(Object.entries(read.fields).filter(([key]) => visible.has(key))));
      setSources(Object.fromEntries(Object.entries(read.sources).filter(([key]) => visible.has(key))));
      setStep('review');
    } catch (issue) {
      if (issue instanceof ApiError && issue.status === 404) {
        setJobId(null);
        setUploadedRequirements([]);
        setError('O processo expirou. Tente enviar novamente os documentos.');
      } else {
        setError(issue instanceof ApiError ? issue.message : 'Falha na leitura. Tente novamente.');
      }
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
      setJobId(null);
      setUploadedRequirements([]);
      setFiles({});
      setValues({});
      setSources({});
      setDownloads([]);
      setStep('questions');
    } catch {
      setError('Não foi possível excluir este processo agora. Tente novamente antes de sair.');
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!jobId) return;
    setBusy(true); setError('');
    try {
      if (service?.reviewFields.some((field) => field.required && !values[field.id]?.trim())) {
        setError('Preencha os campos obrigatórios antes de gerar.');
        return;
      }
      await api<{confirmed:boolean}>('/api/jobs/' + jobId + '/review',
        {method:'PATCH', body:JSON.stringify({confirmed:true,values})});
      const result = await api<{downloads:string[]}>('/api/jobs/' + jobId + '/generate',
        {method:'POST', body:JSON.stringify({})});
      setDownloads(result.downloads);
      setStep('download');
    } catch (issue) {
      setError(issue instanceof ApiError ? issue.message : 'Não foi possível gerar os formulários.');
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
          {error ? <Notice tone="danger" role="alert">{error}</Notice> : null}
          {!service ? (
            <Notice tone="info">Os formulários só serão liberados após validação oficial e revisão do preenchimento. <Link to="/preencher/servico">Conhecer demonstração</Link>.</Notice>
          ) : (
            <section className="card card--padded live-form">
              <p className="eyebrow">Custo: {service.creditCost} crédito por processo</p>
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
                  <h2>Documentos necessários</h2>
                  <p>Os arquivos serão enviados ao servidor temporariamente e excluídos após a sessão expirar.</p>
                  {service.documentRequirements.map((required) => (
                    <label key={required.id} className="field">
                      <span className="field__label">{required.label}{required.required ? ' *' : ' (opcional)'}</span>
                      <span className="field__hint">{required.description}</span>
                      <input className="field__input" type="file" accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(event) => selectFile(required.id, event)} />
                      {files[required.id] ? <span className="field__hint">{files[required.id]?.name}</span> : null}
                    </label>
                  ))}
                  <Button disabled={busy} onClick={() => void extract()}>
                    {busy ? 'Lendo documentos…' : 'Enviar e analisar documentos'}
                  </Button>
                </>
              ) : null}
              {step === 'review' ? (
                <>
                  <h2>Confira cada campo</h2>
                  <p>As sugestões do OCR podem estar incorretas. Corrija e confirme os valores antes de gerar.</p>
                  {service.reviewFields.map((field) => (
                    <label key={field.id} className="field">
                      <span className="field__label">{field.label}{field.required ? ' *' : ''}</span>
                      <input className="field__input" required={field.required} value={values[field.id] ?? ''}
                        onChange={(event) => setValues((prev) => ({ ...prev, [field.id]:event.target.value }))} />
                      <span className="field__hint">{sources[field.id] ? 'Origem: ' + sources[field.id] : 'Preenchimento manual necessário'}</span>
                    </label>
                  ))}
                  <Button disabled={busy} onClick={() => void generate()}>
                    {busy ? 'Gerando…' : 'Confirmar e gerar formulários'}
                  </Button>
                </>
              ) : null}
              {(step === 'files' || step === 'review' || step === 'download') ? (
                <button type="button" className="live-text-button" disabled={busy}
                  onClick={() => void cancel()}>
                  Cancelar e apagar documentos temporários
                </button>
              ) : null}
              {step === 'download' && jobId ? (
                <>
                  <h2>Formulários gerados</h2>
                  <Notice tone="success">Pacote preparado. Um único crédito foi utilizado neste processo.</Notice>
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
