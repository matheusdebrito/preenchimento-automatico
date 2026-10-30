import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, ChevronDown, FileCheck2, FileText, UploadCloud } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { Notice } from '../../components/ui/Notice';
import { Button } from '../../components/ui/Button';
import { api, ApiError } from '../../lib/api';
import { formatBrazilianDateInput } from '../../lib/date-mask';
import type { LiveReviewField, LiveReviewForm, LiveService } from '../../lib/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { readTemporaryJob, rememberTemporaryJob, forgetTemporaryJob } from './temporary-job-session';

type Step = 'questions' | 'files' | 'review' | 'download';

type ExtractionDiagnostic = {
  requirementId: string;
  outcome: 'suggested' | 'no_text' | 'no_supported_labels' | 'no_applicable_fields' | 'not_analyzed';
  suggestionCount: number;
  engine?: 'openai';
};

function groupedReviewForms(service: LiveService): readonly LiveReviewForm[] {
  if (service.reviewForms?.length) return service.reviewForms;
  return [{
    formVersionId: 'all-fields',
    formId: 'all-fields',
    name: 'Dados dos formulários',
    fields: service.reviewFields,
  }];
}

function downloadName(
  service: { reviewForms: readonly { formVersionId:string; formId:string; name:string }[] },
  versionId: string,
): string {
  const form = service.reviewForms.find((item) => item.formVersionId === versionId);
  if (!form) return 'Formulário';
  const id = form.formId;
  if (id.includes('bade')) return id.includes('bsade') ? 'BSADE' : 'BADE';
  if (id.includes('bdmoto')) return 'BDMOTO';
  if (id.startsWith('requerimento')) return 'Requerimento';
  if (id.startsWith('autorizacao-transferencia')) return 'Autorização de Transferência';
  if (id.startsWith('comunicacao-transferencia')) return 'Comunicação de Transferência';
  if (id.startsWith('declaracao-residencia')) return 'Declaração de Residência';
  if (id.startsWith('declaracao-perda')) return 'Declaração de Perda ou Extravio';
  if (id.startsWith('termo-responsabilidade')) return 'Termo de Responsabilidade';
  return form.name;
}

function reviewInputId(formVersionId: string, fieldId: string): string {
  return 'review-' + formVersionId + '-' + fieldId;
}

function firstReviewFormIds(service: LiveService): string[] {
  const first = groupedReviewForms(service)[0];
  return first ? [first.formVersionId] : [];
}

function currentBrazilianDate(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return day + '/' + month + '/' + today.getFullYear();
}

type ReviewFieldGroup = {
  id: string;
  title: string;
  fields: readonly LiveReviewField[];
};

function reviewFieldGroup(fieldId: string): { id: string; title: string; order: number } {
  const suffix = fieldId.split('.').slice(1).join('.');
  const addressFields = new Set([
    'address', 'streetNumber', 'apartment', 'neighborhood', 'city', 'state', 'postalCode',
    'cityState',
  ]);
  const contactFields = new Set(['phone', 'mobile', 'email', 'fax']);
  const identityFields = new Set([
    'identity', 'identityType', 'issuer', 'issuerState', 'issueDate', 'documentOrigin',
    'parent1Name', 'parent2Name',
  ]);
  const personalFields = new Set([
    'fullName', 'cpf', 'taxId', 'nationality', 'birthplace', 'birthDate',
  ]);

  if (fieldId.startsWith('person.')) {
    if (personalFields.has(suffix)) return { id: 'person', title: 'Dados pessoais', order: 10 };
    if (identityFields.has(suffix)) return { id: 'person-document', title: 'Documento de identificação', order: 20 };
    if (addressFields.has(suffix)) return { id: 'person-address', title: 'Endereço', order: 30 };
    if (contactFields.has(suffix)) return { id: 'person-contact', title: 'Contato', order: 40 };
    return { id: 'person-other', title: 'Outros dados pessoais', order: 45 };
  }
  if (fieldId.startsWith('seller.')) {
    if (personalFields.has(suffix)) return { id: 'seller', title: 'Dados do vendedor', order: 50 };
    if (identityFields.has(suffix)) return { id: 'seller-document', title: 'Documento do vendedor', order: 60 };
    if (addressFields.has(suffix)) return { id: 'seller-address', title: 'Endereço do vendedor', order: 70 };
    if (contactFields.has(suffix)) return { id: 'seller-contact', title: 'Contato do vendedor', order: 80 };
    return { id: 'seller-other', title: 'Outros dados do vendedor', order: 85 };
  }
  if (fieldId.startsWith('coOwner.')) {
    if (personalFields.has(suffix)) return { id: 'co-owner', title: 'Dados do coproprietário', order: 90 };
    if (identityFields.has(suffix)) return { id: 'co-owner-document', title: 'Documento do coproprietário', order: 100 };
    if (addressFields.has(suffix)) return { id: 'co-owner-address', title: 'Endereço do coproprietário', order: 110 };
    if (contactFields.has(suffix)) return { id: 'co-owner-contact', title: 'Contato do coproprietário', order: 120 };
    return { id: 'co-owner-other', title: 'Outros dados do coproprietário', order: 125 };
  }
  if (fieldId.startsWith('registeredOwner.')) {
    if (addressFields.has(suffix)) return { id: 'registered-owner-address', title: 'Endereço do proprietário registrado', order: 140 };
    return { id: 'registered-owner', title: 'Proprietário registrado', order: 130 };
  }
  if (fieldId.startsWith('declarant.')) {
    if (personalFields.has(suffix)) return { id: 'declarant', title: 'Dados do declarante', order: 150 };
    if (identityFields.has(suffix)) return { id: 'declarant-document', title: 'Documento do declarante', order: 160 };
    if (contactFields.has(suffix)) return { id: 'declarant-contact', title: 'Contato do declarante', order: 170 };
    return { id: 'declarant-other', title: 'Outros dados do declarante', order: 175 };
  }
  if (fieldId.startsWith('sale.')) return { id: 'sale', title: 'Dados da venda', order: 180 };
  if (fieldId.startsWith('vessel.motor') || fieldId.includes('Propulsion') ||
    fieldId.startsWith('vessel.fuel') || fieldId.startsWith('vessel.lateralThruster')) {
    return { id: 'motor', title: 'Motor e propulsão', order: 200 };
  }
  if (fieldId.startsWith('vessel.')) return { id: 'vessel', title: 'Dados da embarcação', order: 190 };
  if (fieldId.startsWith('process.')) return { id: 'process', title: 'Dados do serviço', order: 210 };
  return { id: 'other', title: 'Outros dados', order: 220 };
}

function groupReviewFields(fields: readonly LiveReviewField[]): readonly ReviewFieldGroup[] {
  const groups = new Map<string, ReviewFieldGroup & { order: number }>();
  for (const field of fields) {
    const definition = reviewFieldGroup(field.id);
    const current = groups.get(definition.id);
    if (current) {
      groups.set(definition.id, { ...current, fields: [...current.fields, field] });
    } else {
      groups.set(definition.id, {
        id: definition.id,
        title: definition.title,
        order: definition.order,
        fields: [field],
      });
    }
  }
  return [...groups.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ id, title, fields }) => ({ id, title, fields }));
}

function questionConditionsMatch(
  question: LiveService['questions'][number],
  answers: Readonly<Record<string, string>>,
): boolean {
  return (question.conditions ?? []).every((condition) =>
    condition.equals !== undefined
      ? answers[condition.questionId] === condition.equals
      : condition.oneOf?.includes(answers[condition.questionId] ?? '') === true);
}

function pruneHiddenAnswers(
  service: LiveService,
  answers: Readonly<Record<string, string>>,
): Record<string, string> {
  const next = { ...answers };
  let changed = true;
  while (changed) {
    changed = false;
    for (const question of service.questions) {
      if (Object.hasOwn(next, question.id) && !questionConditionsMatch(question, next)) {
        delete next[question.id];
        changed = true;
      }
    }
  }
  return next;
}

export function LiveFlowPage() {
  useDocumentTitle('Preenchimento de formulário');
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<LiveService | null>(null);
  const [step, setStep] = useState<Step>('questions');
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [files, setFiles] = useState<Record<string,File>>({});
  const [values, setValues] = useState<Record<string,string>>({});
  const [sources, setSources] = useState<Record<string,string>>({});
  const [diagnostics, setDiagnostics] = useState<ExtractionDiagnostic[]>([]);
  const [invalidFieldIds, setInvalidFieldIds] = useState<string[]>([]);
  const [blankFieldIds, setBlankFieldIds] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [uploadedRequirements, setUploadedRequirements] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<readonly string[]>([]);
  const [confirmAnalysisCharge, setConfirmAnalysisCharge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openReviewFormIds, setOpenReviewFormIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const cancelRequested = useRef(false);

  const reviewForms = service ? groupedReviewForms(service) : [];
  const allReviewFormsOpen = reviewForms.length > 0 &&
    reviewForms.every((form) => openReviewFormIds.includes(form.formVersionId));

  const revealReviewFields = (fieldIds: readonly string[]) => {
    if (fieldIds.length === 0) return;
    const formsToOpen = reviewForms
      .filter((form) => form.fields.some((field) => fieldIds.includes(field.id)))
      .map((form) => form.formVersionId);
    setOpenReviewFormIds((current) => [...new Set([...current, ...formsToOpen])]);

    const firstFieldId = fieldIds[0];
    const firstForm = reviewForms.find((form) =>
      form.fields.some((field) => field.id === firstFieldId));
    if (!firstForm || !firstFieldId) return;
    window.setTimeout(() => {
      document.getElementById(reviewInputId(firstForm.formVersionId, firstFieldId))?.focus();
    }, 0);
  };

  useEffect(() => {
    if (step !== 'review') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [step]);

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
            if (status.status === 'GENERATED') {
              setDownloads(status.downloads ?? []);
            } else {
              setOpenReviewFormIds(firstReviewFormIds(quoted.service));
            }
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
    if (!service) return;
    const relevantAnswers = pruneHiddenAnswers(service, answers);
    const relevantQuestions = service.questions.filter((question) =>
      questionConditionsMatch(question, relevantAnswers));
    if (relevantQuestions.some((question) => !relevantAnswers[question.id])) {
      setError('Responda às perguntas sobre o seu caso.');
      return;
    }
    setBusy(true); setError('');
    try {
      const result = await api<{service:LiveService}>(
        '/api/services/' + encodeURIComponent(service.id) + '/quote',
        { method: 'POST', body: JSON.stringify({ answers: relevantAnswers }) },
      );
      setAnswers(relevantAnswers);
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
    setConfirmAnalysisCharge(false);
    setError('');
  };

  const showReview = (
    fields: Record<string, string>,
    originNotes: Record<string, string>,
    reports: ExtractionDiagnostic[] = [],
  ) => {
    const visible = new Set(service?.reviewFields.map((field) => field.id) ?? []);
    const visibleValues = Object.fromEntries(
      Object.entries(fields)
        .filter(([key]) => visible.has(key))
        .map(([key, value]) => [
          key,
          service?.reviewFields.find((field) => field.id === key)?.valueKind === 'date'
            ? formatBrazilianDateInput(value)
            : value,
        ]),
    );
    if (visible.has('process.date') && !visibleValues['process.date']) {
      visibleValues['process.date'] = currentBrazilianDate();
    }
    setValues(visibleValues);
    setSources(Object.fromEntries(Object.entries(originNotes).filter(([key]) => visible.has(key))));
    setDiagnostics(reports);
    setInvalidFieldIds([]);
    setBlankFieldIds([]);
    if (service) setOpenReviewFormIds(firstReviewFormIds(service));
    setStep('review');
  };

  const extract = async () => {
    if (!service) return;
    cancelRequested.current = false;
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
        '/api/jobs/' + currentJob + '/extract',
        { method:'POST', body:JSON.stringify({}) },
      );
      // A concurrent cancellation wins over a late OCR response.
      if (cancelRequested.current) return;
      // Present and send only fields that the user can visibly review.
      showReview(read.fields, read.sources, read.diagnostics ?? []);
    } catch (issue) {
      if (cancelRequested.current) return;
      if (issue instanceof ApiError && issue.status === 404) {
        if (serviceId) forgetTemporaryJob(serviceId);
        setJobId(null);
        setUploadedRequirements([]);
        setExpiresAt(null);
        setError('O processo expirou. Tente enviar novamente os documentos.');
      } else {
        setError(issue instanceof ApiError ? issue.message : 'Falha na análise documental. Tente novamente.');
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

  const resetTemporaryJobForBack = async (target: 'questions' | 'files') => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (jobId) {
        try {
          await api<{removed:boolean}>('/api/jobs/' + jobId, { method:'DELETE' });
        } catch (issue) {
          if (!(issue instanceof ApiError && issue.status === 404)) throw issue;
        }
      }
      if (serviceId) forgetTemporaryJob(serviceId);
      setJobId(null);
      setExpiresAt(null);
      setUploadedRequirements([]);
      setValues({});
      setSources({});
      setDiagnostics([]);
      setInvalidFieldIds([]);
      setBlankFieldIds([]);
      setOpenReviewFormIds([]);
      setDownloads([]);
      setConfirmAnalysisCharge(false);
      if (target === 'questions') setFiles({});
      setStep(target);
    } catch {
      setError('Não foi possível voltar com segurança. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const backFromFiles = () => {
    if (jobId) {
      void resetTemporaryJobForBack('questions');
      return;
    }
    setError('');
    setFiles({});
    setStep('questions');
  };

  const backFromReview = () => {
    void resetTemporaryJobForBack('files');
  };

  const cancel = async () => {
    // Cancellation is intentionally allowed while OCR is running on the files
    // step. It remains blocked during generation/download accounting.
    if (busy && step !== 'files') return;
    cancelRequested.current = true;
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
      setInvalidFieldIds([]);
      setBlankFieldIds([]);
      setOpenReviewFormIds([]);
      setDownloads([]);
      setConfirmAnalysisCharge(false);
      setStep('questions');
    } catch {
      setError('Não foi possível excluir este processo agora. Tente novamente antes de sair.');
    } finally {
      setBusy(false);
    }
  };

  const generate = async (allowBlankFields = false) => {
    if (!jobId || !service) return;
    setError('');
    setInvalidFieldIds([]);

    const blankFields = service.reviewFields.filter((field) => !values[field.id]?.trim());
    if (!allowBlankFields && blankFields.length > 0) {
      setBlankFieldIds(blankFields.map((field) => field.id));
      return;
    }
    setBlankFieldIds([]);

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
        const tip = issue.fieldReason === 'required'
          ? 'é obrigatório e precisa ser preenchido.'
          : issue.fieldReason === 'invalid_cpf'
            ? 'informe um CPF válido com os dígitos verificadores.'
            : issue.fieldReason === 'invalid_date'
              ? 'use uma data válida no formato DD/MM/AAAA.'
              : issue.fieldReason === 'invalid_boolean'
                ? 'selecione uma opção válida.'
                : issue.fieldReason === 'invalid_choice'
                  ? 'selecione uma das opções permitidas.'
                  : issue.fieldReason === 'unsupported_character'
                    ? 'contém um caractere não suportado pelo formulário.'
                    : issue.fieldReason === 'text_too_long'
                      ? 'possui texto longo demais ou caracteres inválidos.'
                      : issue.fieldReason === 'text_overflow'
                        ? 'possui texto maior do que o espaço disponível no formulário.'
                        : issue.errorCode === 'missing_required_fields'
                          ? 'é obrigatório e precisa ser preenchido.'
                          : field?.valueKind === 'date'
                            ? 'use uma data válida no formato DD/MM/AAAA.'
                            : issue.fieldId.endsWith('.cpf')
                              ? 'informe um CPF válido com os dígitos verificadores.'
                              : 'revise o formato e o valor.';
        setInvalidFieldIds([issue.fieldId]);
        setError('Confira ' + label + ': ' + tip);
        revealReviewFields([issue.fieldId]);
      } else {
        if (issue instanceof ApiError && issue.formVersionId) {
          const formName = reviewForms.find((form) =>
            form.formVersionId === issue.formVersionId)?.name ?? issue.formVersionId;
          setError(issue.message + ' Formulário: ' + formName + '.');
        } else {
          setError(issue instanceof ApiError ? issue.message : 'Não foi possível gerar os formulários.');
        }
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
            <Notice tone="danger">
              Este serviço não está disponível com a seleção informada. <Link to="/">Voltar aos serviços</Link>.
            </Notice>
          ) : (
            <section className="card card--padded live-form">
              <p className="eyebrow">Custo: {service.creditCost} crédito por processo</p>
              <p className="lead">{service.description}</p>
              <Notice tone="info">Ferramenta independente. Não protocola documentos na Marinha e não substitui assinaturas, reconhecimento de firmas ou conferência.</Notice>
              {step === 'questions' ? (
                <>
                  <Button variant="ghost" icon={<ArrowLeft aria-hidden="true" />}
                    onClick={() => navigate(-1)}>Voltar</Button>
                  <h2>Dados do serviço</h2>
                  {service.questions.filter((question) =>
                    questionConditionsMatch(question, pruneHiddenAnswers(service, answers))).map((question) => (
                    <label key={question.id} className="field">
                      <span className="field__label">{question.label}</span>
                      <select className="field__input" required value={answers[question.id] ?? ''}
                        onChange={(event) => setAnswers((prev) =>
                          pruneHiddenAnswers(service, {
                            ...prev,
                            [question.id]: event.target.value,
                          }))}>
                        <option value="">Selecione</option>
                        {question.options.map((value) => {
                          const unavailable = question.unavailableOptions?.includes(value) ?? false;
                          const label = value === 'moto_aquatica' ? 'Moto aquática'
                            : value === 'embarcacao' ? 'Embarcação / barco'
                              : value === 'ate_6m' ? 'Até 6 m'
                                : value === 'maior_6_ate_12m' ? 'Maior que 6 m até 12 m'
                                  : value === 'maior_12_menor_24m' ? 'Maior que 12 m e menor que 24 m'
                                    : value === 'arrais' ? 'Arrais-Amador'
                                      : value === 'mestre' ? 'Mestre-Amador'
                                        : value === 'capitao' ? 'Capitão-Amador'
                                          : value === 'sim' ? 'Sim'
                                            : value === 'nao' ? 'Não'
                                              : value === 'regular' ? 'Regular'
                                                : value === 'extraviado' ? 'Perdido, roubado ou extraviado'
                                                  : value === 'extraviada' ? 'Extraviada'
                                                  : value === 'roubada' ? 'Roubada'
                                                    : value === 'furtada' ? 'Furtada'
                                                      : value === 'danificada' ? 'Danificada'
                                                        : value === 'perda' ? 'Perda'
                                                          : value === 'roubo' ? 'Roubo'
                                                            : value === 'extravio' ? 'Extravio'
                                                              : value === 'dados_embarcacao' ? 'Dados da moto aquática'
                                                                : value === 'dados_proprietario' ? 'Dados do proprietário'
                                                                  : value === 'ambos' ? 'Moto aquática e proprietário'
                                                                    : value === 'estaleiro_extinto' ? 'Estaleiro comprovadamente extinto'
                                                                      : value === 'construcao_artesanal' ? 'Construção artesanal'
                                                                        : value.replaceAll('_',' ');
                          return <option key={value} value={value} disabled={unavailable}>
                            {label}{unavailable ? ' (em validação)' : ''}
                          </option>;
                        })}
                      </select>
                    </label>
                  ))}
                  <Button disabled={busy} onClick={() => void quote()}>Conferir documentos necessários</Button>
                </>
              ) : null}
              {step === 'files' ? (
                <>
                  <Button variant="ghost" icon={<ArrowLeft aria-hidden="true" />}
                    disabled={busy} onClick={backFromFiles}>Voltar</Button>
                  <h2>Documentos para preenchimento automático (opcionais)</h2>
                  <p>Você pode anexar um documento, vários ou nenhum. A leitura automática
                    serve apenas para sugerir dados. Se preferir, continue sem anexos e
                    preencha cada formulário manualmente na próxima etapa.</p>
                  <p className="field__hint">Os arquivos escolhidos são enviados temporariamente
                    ao servidor e excluídos ao cancelar ou expirar o processo.</p>
                  <div className="live-upload-list">
                    {service.documentRequirements.map((required) => {
                      const uploaded = uploadedRequirements.includes(required.id);
                      const selected = files[required.id];
                      return (
                        <div key={required.id}
                          className={'live-upload-field' + (uploaded ? ' live-upload-field--uploaded' : '')}>
                          <div className="live-upload-field__head">
                            <span className="live-upload-field__icon" aria-hidden="true">
                              <FileText />
                            </span>
                            <div className="live-upload-field__info">
                              <div className="live-upload-field__name">
                                <strong>{required.label}</strong>
                                <span className="live-upload-field__optional">Opcional</span>
                              </div>
                              {required.description
                                ? <p className="live-upload-field__description">{required.description}</p>
                                : null}
                            </div>
                          </div>
                          <div className="live-upload-actions">
                            <input id={'upload-file-' + required.id}
                              className="live-upload-input" type="file"
                              accept=".pdf,.png,.jpg,.jpeg" aria-label={required.label}
                              disabled={uploaded || busy}
                              onChange={(event) => selectFile(required.id, event)} />
                            <label className="live-upload-action"
                              htmlFor={'upload-file-' + required.id}>
                              <UploadCloud aria-hidden="true" />
                              {selected ? 'Trocar arquivo' : 'Escolher arquivo'}
                            </label>
                            <input id={'upload-camera-' + required.id}
                              className="live-upload-input" type="file"
                              accept="image/jpeg,image/png" capture="environment"
                              aria-label={'Fotografar ' + required.label.toLowerCase()}
                              disabled={uploaded || busy}
                              onChange={(event) => selectFile(required.id, event)} />
                            <label className="live-upload-action live-upload-action--camera"
                              htmlFor={'upload-camera-' + required.id}>
                              <Camera aria-hidden="true" /> Usar câmera
                            </label>
                          </div>
                          {uploaded ? (
                            <div className="live-upload-file-status" role="status">
                              <FileCheck2 aria-hidden="true" />
                              <span>Documento recebido pelo servidor</span>
                            </div>
                          ) : selected ? (
                            <div className="live-upload-file-status" role="status">
                              <FileCheck2 aria-hidden="true" />
                              <span className="live-upload-file-status__name">{selected.name}</span>
                              <span className="live-upload-file-status__size">
                                {(selected.size / 1024 / 1024).toLocaleString('pt-BR', {
                                  maximumFractionDigits: 2,
                                })} MB
                              </span>
                            </div>
                          ) : (
                            <p className="live-upload-field__help">PDF, JPG ou PNG · até 10 MB</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {error ? <Notice tone="danger" role="alert">{error}</Notice> : null}
                  {confirmAnalysisCharge &&
                  (Object.keys(files).length > 0 || uploadedRequirements.length > 0) ? (
                    <Notice tone="info" title="Confirmar análise com IA">
                      Ao continuar, os documentos serão enviados para a OpenAI e 1 crédito será
                      consumido quando a requisição externa for iniciada. Esse crédito não é
                      estornado apenas por você não gerar ou baixar os PDFs depois.
                      <div className="state__actions">
                        <Button variant="ghost" disabled={busy}
                          onClick={() => setConfirmAnalysisCharge(false)}>
                          Voltar
                        </Button>
                        <Button disabled={busy} onClick={() => void extract()}>
                          {busy ? 'Enviando para análise…' : 'Confirmar e consumir 1 crédito'}
                        </Button>
                      </div>
                    </Notice>
                  ) : (
                    <Button disabled={busy} onClick={() => {
                      if (Object.keys(files).length > 0 || uploadedRequirements.length > 0) {
                        setConfirmAnalysisCharge(true);
                      } else {
                        void extract();
                      }
                    }}>
                      {busy ? 'Preparando revisão…' :
                        Object.keys(files).length > 0 || uploadedRequirements.length > 0
                          ? 'Analisar documentos e revisar campos'
                          : 'Continuar sem anexos — preencher manualmente'}
                    </Button>
                  )}
                </>
              ) : null}
              {step === 'review' ? (
                <>
                  <Button variant="ghost" icon={<ArrowLeft aria-hidden="true" />}
                    disabled={busy} onClick={backFromReview}>Voltar</Button>
                  <h2>Preencha e confira os formulários</h2>
                  <p>
                    Os campos estão organizados pelos formulários que serão gerados.
                    Abra cada seção para preencher ou conferir. Quando o mesmo dado aparece
                    em mais de um formulário, o valor é compartilhado automaticamente.
                  </p>
                  {diagnostics.length === 0 ? (
                    <Notice tone="info" role="status">
                      Você optou por preencher sem documentos. Preencha manualmente os
                      formulários abaixo; nenhum upload é obrigatório para continuar.
                    </Notice>
                  ) : service.reviewFields.some((field) => sources[field.id] &&
                    service.documentRequirements.some((doc) => doc.id === sources[field.id])) ? (
                    <Notice tone="info" role="status">
                      Alguns campos foram sugeridos automaticamente. Confira todos antes de confirmar.
                      Os demais podem ser preenchidos manualmente.
                    </Notice>
                  ) : (
                    <Notice tone="danger" role="alert" title="Nenhum campo preenchido automaticamente">
                      O arquivo foi recebido, mas não foi possível aproveitar dados dele para os
                      formulários selecionados. Confira o resultado da leitura por documento abaixo.
                      Se necessário, refaça a foto com o documento inteiro, bem iluminado, sem
                      reflexos e com o texto nítido. Você pode continuar preenchendo manualmente.
                    </Notice>
                  )}
                  {diagnostics.length > 0 ? (
                    <div className="live-analysis-report">
                      <strong>Resultado da análise por documento</strong>
                      <ul>
                        {diagnostics.map((item) => (
                          <li key={item.requirementId}>
                            {service.documentRequirements.find((doc) =>
                              doc.id === item.requirementId)?.label ?? 'Documento enviado'}:
                            {' ' + (item.outcome === 'suggested'
                              ? item.suggestionCount + ' sugestão(ões) encontrada(s), sujeitas à revisão'
                              : item.outcome === 'no_text' ? 'não foi possível ler o documento'
                                : item.outcome === 'not_analyzed' ? 'não há extração automática configurada'
                                  : item.outcome === 'no_applicable_fields'
                                    ? 'alguns dados reconhecidos, mas não há campos correspondentes no formulário selecionado'
                                    : 'texto detectado, mas nenhum dado foi associado aos campos com segurança')}
                            {item.engine ? (
                              <span className="live-analysis-provider">
                                {' · Provedor: ' + (
                                  'OpenAI'
                                )}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="live-review-toolbar">
                    <span>
                      {reviewForms.length} {reviewForms.length === 1 ? 'formulário' : 'formulários'}
                    </span>
                    {reviewForms.length > 1 ? (
                      <button
                        type="button"
                        className="live-text-button"
                        onClick={() => setOpenReviewFormIds(allReviewFormsOpen
                          ? []
                          : reviewForms.map((form) => form.formVersionId))}
                      >
                        {allReviewFormsOpen ? 'Fechar todos' : 'Abrir todos'}
                      </button>
                    ) : null}
                  </div>

                  <div className="live-review-forms">
                    {reviewForms.map((form) => {
                      const isOpen = openReviewFormIds.includes(form.formVersionId);
                      const completed = form.fields.filter((field) =>
                        values[field.id]?.trim()).length;
                      const blankRemaining = form.fields.filter((field) =>
                        !values[field.id]?.trim()).length;
                      const hasError = form.fields.some((field) =>
                        invalidFieldIds.includes(field.id));
                      const triggerId = 'form-trigger-' + form.formVersionId;
                      const panelId = 'form-panel-' + form.formVersionId;

                      return (
                        <section
                          key={form.formVersionId}
                          className={'live-review-form' +
                            (isOpen ? ' live-review-form--open' : '') +
                            (hasError ? ' live-review-form--error' : '')}
                        >
                          <button
                            id={triggerId}
                            type="button"
                            className="live-review-form__trigger"
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            onClick={() => setOpenReviewFormIds((current) =>
                              current.includes(form.formVersionId)
                                ? current.filter((id) => id !== form.formVersionId)
                                : [...current, form.formVersionId])}
                          >
                            <span className="live-review-form__icon" aria-hidden="true">
                              <FileText />
                            </span>
                            <span className="live-review-form__heading">
                              <strong>{form.name}</strong>
                              <span>
                                {completed} de {form.fields.length} campos preenchidos
                                {blankRemaining > 0
                                  ? ' · ' + blankRemaining + ' em branco'
                                  : ''}
                              </span>
                            </span>
                            <ChevronDown
                              className="live-review-form__chevron"
                              aria-hidden="true"
                            />
                          </button>

                          {isOpen ? (
                            <div
                              id={panelId}
                              className="live-review-form__content"
                              role="region"
                              aria-labelledby={triggerId}
                            >
                              {form.description ? (
                                <p className="live-review-form__description">{form.description}</p>
                              ) : null}
                              {form.fields.length === 0 ? (
                                <p className="field__hint">
                                  Este formulário não exige dados manuais adicionais.
                                </p>
                              ) : (
                                <div className="live-review-form__groups">
                                  {groupReviewFields(form.fields).map((group) => (
                                    <section key={group.id} className="live-review-field-group">
                                      <h3 className="live-review-field-group__title">{group.title}</h3>
                                      <div className="live-review-form__fields">
                                  {group.fields.map((field) => {
                                    const sharedFormCount = reviewForms.filter((candidate) =>
                                      candidate.fields.some((candidateField) =>
                                        candidateField.id === field.id)).length;
                                    const source = sources[field.id] &&
                                      service.documentRequirements.find((document) =>
                                        document.id === sources[field.id]);

                                    return (
                                      <label
                                        key={form.formVersionId + ':' + field.id}
                                        className="field live-review-field"
                                      >
                                        <span className="field__label">
                                          {field.label}
                                        </span>
                                        <input
                                          id={reviewInputId(form.formVersionId, field.id)}
                                          className="field__input"
                                          value={values[field.id] ?? ''}
                                          aria-invalid={invalidFieldIds.includes(field.id) || undefined}
                                          inputMode={field.valueKind === 'date' ? 'numeric' : undefined}
                                          maxLength={field.valueKind === 'date' ? 10 : undefined}
                                          placeholder={field.valueKind === 'date'
                                            ? 'DD/MM/AAAA'
                                            : undefined}
                                          onChange={(event) => {
                                            const typed = field.valueKind === 'date'
                                              ? formatBrazilianDateInput(event.target.value)
                                              : event.target.value;
                                            setValues((prev) => ({ ...prev, [field.id]:typed }));
                                            if (invalidFieldIds.includes(field.id) && typed.trim()) {
                                              const remaining = invalidFieldIds.filter((id) => id !== field.id);
                                              setInvalidFieldIds(remaining);
                                              if (remaining.length === 0) {
                                                setError('');
                                              } else {
                                                const labels = service.reviewFields
                                                  .filter((item) => remaining.includes(item.id))
                                                  .map((item) => item.label);
                                                setError(
                                                  'Não é possível gerar os formulários. Preencha os campos obrigatórios pendentes: ' +
                                                  labels.join(', ') + '.',
                                                );
                                              }
                                            }
                                          }}
                                        />
                                        <span className="field__hint">
                                          {source
                                            ? 'Sugestão de ' + source.label +
                                              ' — confira antes de confirmar'
                                            : 'Preenchimento manual'}
                                          {sharedFormCount > 1
                                            ? ' · Este valor é compartilhado com outros formulários'
                                            : ''}
                                        </span>
                                        {invalidFieldIds.includes(field.id)
                                          ? <span className="field__error">
                                              Confira o valor informado neste campo.
                                            </span>
                                          : null}
                                      </label>
                                    );
                                  })}
                                      </div>
                                    </section>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </section>
                      );
                    })}
                  </div>

                  {blankFieldIds.length > 0 ? (
                    <Notice tone="info" role="status">
                      <strong>Existem campos em branco.</strong>{' '}
                      Você pode preenchê-los agora ou continuar e gerar os PDFs deixando-os vazios.
                      <div>
                        Campos em branco: {service.reviewFields
                          .filter((field) => blankFieldIds.includes(field.id))
                          .map((field) => field.label)
                          .join(', ')}.
                      </div>
                      <div className="live-upload-actions">
                        <Button variant="ghost" disabled={busy} onClick={() => {
                          const ids = [...blankFieldIds];
                          setBlankFieldIds([]);
                          revealReviewFields(ids);
                        }}>
                          Preencher campos
                        </Button>
                        <Button disabled={busy} onClick={() => void generate(true)}>
                          Continuar mesmo assim
                        </Button>
                      </div>
                    </Notice>
                  ) : null}
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
                <button type="button" className="live-text-button"
                  disabled={busy && step !== 'files'}
                  onClick={() => void cancel()}>
                  {step === 'download'
                    ? 'Encerrar e apagar PDFs (sem novo débito)'
                    : 'Cancelar e apagar documentos temporários'}
                </button>
              ) : null}
              {step === 'download' && jobId ? (
                <>
                  <Button variant="ghost" icon={<ArrowLeft aria-hidden="true" />}
                    onClick={() => navigate(-1)}>Voltar</Button>
                  <h2>Formulários gerados</h2>
                  <Notice tone="success">
                    Pacote preparado. O crédito da análise já foi consumido quando os documentos foram enviados à OpenAI; baixar os PDFs não gera novo débito.
                  </Notice>
                  {downloads.map((version) => (
                    <a className="btn btn--secondary" key={version}
                      href={'/api/jobs/' + jobId + '/download/' + encodeURIComponent(version)} download>
                      Baixar PDF - {downloadName(service, version)}
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
