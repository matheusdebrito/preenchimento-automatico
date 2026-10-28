import { useState } from 'react';
import { FileSearch, ScanText, UploadCloud } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Notice';
import { api, ApiError } from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type OcrLine = {
  text: string;
  confidence: number;
  box: readonly [number, number, number, number] | null;
};
type OcrPageResult = {
  page: number;
  orientation: number | null;
  lines: readonly OcrLine[];
};
type OcrInspection = {
  engine: string;
  version: string;
  model: string;
  elapsedMs: number;
  fields: Record<string,string>;
  assessments: readonly {
    fieldId: string;
    status: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS';
    confidence: number | null;
    method?: string;
    anchor?: string;
  }[];
  pages: readonly OcrPageResult[];
};

const SOURCES = [
  ['buyer-identity', 'Identidade do comprador'],
  ['seller-identity', 'Identidade do vendedor'],
  ['tie', 'TIE / documento da embarcação'],
  ['residence-proof', 'Comprovante de residência'],
  ['sale-document', 'Documento de venda'],
] as const;

export function OcrPage() {
  useDocumentTitle('OCR');
  const [source, setSource] = useState(SOURCES[0][0]);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OcrInspection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const inspect = async () => {
    if (!file || busy) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const response = await api<OcrInspection>('/api/ocr/inspect/' + encodeURIComponent(source), {
        method: 'POST',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      setResult(response);
    } catch (issue) {
      setError(issue instanceof ApiError ? issue.message : 'Não foi possível executar o OCR.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageLayout>
      <div className="page">
        <div className="container page-stack">
          <header className="page__header">
            <p className="eyebrow">Diagnóstico</p>
            <h1>Leitura OCR</h1>
            <p className="lead">
              Envie um documento para ver exatamente o que o PaddleOCR reconheceu antes das regras
              de preenchimento.
            </p>
          </header>

          <Notice tone="info" title="Dados sensíveis">
            Esta tela exibe texto e valores encontrados no documento. Use apenas em ambiente
            controlado e não compartilhe capturas com informações pessoais.
          </Notice>

          <section className="ocr-inspector" aria-labelledby="ocr-upload-title">
            <div className="ocr-inspector__head">
              <span className="icon-badge" aria-hidden="true"><ScanText /></span>
              <div>
                <h2 id="ocr-upload-title">Testar documento</h2>
                <p>JPG, PNG ou PDF de até 10 MB. O arquivo é processado e não é armazenado por esta ferramenta.</p>
              </div>
            </div>

            <div className="ocr-controls">
              <label className="field">
                <span className="field__label">Tipo de documento</span>
                <select className="field__input" value={source}
                  onChange={(event) => setSource(event.target.value as typeof source)}>
                  {SOURCES.map(([value, label]) =>
                    <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="ocr-file">
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    if (selected && (selected.size > 10 * 1024 * 1024 ||
                      !['image/jpeg','image/png','application/pdf'].includes(selected.type))) {
                      setError('Escolha JPG, PNG ou PDF com até 10 MB.');
                      setFile(null); return;
                    }
                    setError(''); setFile(selected); setResult(null);
                  }} />
                <UploadCloud aria-hidden="true" />
                <span>{file ? file.name : 'Escolher documento'}</span>
              </label>
            </div>

            <Button onClick={() => void inspect()} disabled={!file || busy}
              icon={<FileSearch aria-hidden="true" />}>
              {busy ? 'Analisando…' : 'Executar OCR'}
            </Button>
            {error ? <p className="ocr-error" role="alert">{error}</p> : null}
          </section>

          {result ? (
            <>
              <section className="ocr-summary" aria-labelledby="ocr-summary-title">
                <div>
                  <p className="eyebrow">Motor</p>
                  <h2 id="ocr-summary-title">{result.engine} {result.version}</h2>
                  <p>{result.model} · {result.elapsedMs} ms · {result.pages.length} página(s)</p>
                </div>
                <div className="ocr-fields">
                  <h3>Campos interpretados pela aplicação</h3>
                  {Object.keys(result.fields).length ? (
                    <dl>
                      {Object.entries(result.fields).map(([key, value]) => (
                        <div key={key}><dt>{key}</dt><dd>{value}</dd></div>
                      ))}
                    </dl>
                  ) : <p>Nenhum campo semântico foi identificado.</p>}
                  {result.assessments.length ? (
                    <>
                      <h3>Diagnóstico dos conceitos suportados</h3>
                      <dl>
                        {result.assessments.map((item) => (
                          <div key={item.fieldId}>
                            <dt>{item.fieldId}</dt>
                            <dd>
                              {item.status}
                              {item.confidence !== null
                                ? ' · ' + (item.confidence * 100).toFixed(1) + '%' : ''}
                              {item.method ? ' · ' + item.method : ''}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  ) : null}
                </div>
              </section>

              <section className="ocr-results" aria-labelledby="ocr-lines-title">
                <div className="section-heading">
                  <p className="eyebrow">Retorno bruto estruturado</p>
                  <h2 id="ocr-lines-title">Texto reconhecido</h2>
                  <p>Confiança e coordenadas vêm diretamente do PaddleOCR.</p>
                </div>
                {result.pages.map((page) => (
                  <div className="ocr-page-result" key={page.page}>
                    <h3>Página {page.page + 1}{page.orientation !== null
                      ? ' · orientação ' + page.orientation : ''}</h3>
                    <div className="ocr-table-wrap">
                      <table className="ocr-table">
                        <thead><tr><th>Texto</th><th>Confiança</th><th>Caixa</th></tr></thead>
                        <tbody>
                          {page.lines.map((line, index) => (
                            <tr key={index}>
                              <td>{line.text}</td>
                              <td>{(line.confidence * 100).toFixed(1)}%</td>
                              <td>{line.box ? line.box.join(', ') : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
}
