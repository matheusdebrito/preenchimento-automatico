import { useId, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle2, FileText, Trash2, Upload } from 'lucide-react';
import type { DocumentRequirement } from '../../data/demo';
import type { LocalUpload } from '../../features/wizard/WizardContext';
import { validateDocumentFile } from '../../features/wizard/file-validation';
import { formatFileSize } from '../../lib/format';
import { cx } from '../../lib/cx';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface DocumentUploadCardProps {
  requirement: DocumentRequirement;
  uploads: readonly LocalUpload[];
  onAddFiles: (files: readonly File[]) => void;
  onRemoveFile: (fileId: string) => void;
}

export function DocumentUploadCard({
  requirement,
  uploads,
  onAddFiles,
  onRemoveFile,
}: DocumentUploadCardProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<readonly string[]>([]);
  const complete = uploads.length > 0;

  const handleSelection = (fileList: FileList | null, input: HTMLInputElement) => {
    const selectedFiles = Array.from(fileList ?? []);
    input.value = '';

    if (selectedFiles.length === 0) {
      return;
    }

    const validFiles: File[] = [];
    const nextErrors: string[] = [];

    selectedFiles.forEach((file) => {
      const error = validateDocumentFile(file);

      if (error) {
        nextErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    setErrors(nextErrors);

    if (validFiles.length > 0) {
      onAddFiles(validFiles);
    }
  };

  return (
    <article
      className={cx('doc-card', complete && 'doc-card--complete')}
      aria-labelledby={titleId}
    >
      <div className="doc-card__head">
        <span className="icon-badge" aria-hidden="true">
          <FileText />
        </span>
        <div className="doc-card__content">
          <h2 className="doc-card__title" id={titleId}>
            {requirement.title}
          </h2>
          <p className="doc-card__description" id={descriptionId}>
            {requirement.description}
          </p>
        </div>
        <Badge
          tone={complete ? 'success' : 'neutral'}
          icon={complete ? <CheckCircle2 aria-hidden="true" /> : undefined}
        >
          {complete ? 'Adicionado' : 'Pendente'}
        </Badge>
      </div>

      <div className="doc-card__actions">
        <Button
          variant="secondary"
          icon={<Camera aria-hidden="true" />}
          onClick={() => cameraInputRef.current?.click()}
          aria-label={`Tirar foto — ${requirement.title}`}
          aria-describedby={descriptionId}
        >
          Tirar foto
        </Button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(event) => handleSelection(event.target.files, event.target)}
        />

        <Button
          variant="secondary"
          icon={<Upload aria-hidden="true" />}
          onClick={() => fileInputRef.current?.click()}
          aria-label={`Escolher arquivo — ${requirement.title}`}
          aria-describedby={descriptionId}
        >
          Escolher arquivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          multiple
          hidden
          onChange={(event) => handleSelection(event.target.files, event.target)}
        />
      </div>

      <p className="field__hint">JPG, PNG ou PDF · até 10 MB · você pode adicionar mais de um arquivo.</p>

      {errors.length > 0 ? (
        <div className="field__error" role="alert">
          <AlertCircle aria-hidden="true" />
          <span>{errors.join(' ')}</span>
        </div>
      ) : null}

      {uploads.length > 0 ? (
        <ul className="upload-files" aria-label={`Arquivos de ${requirement.title}`}>
          {uploads.map((upload) => (
            <li className="upload-file" key={upload.id}>
              {upload.previewUrl ? (
                <img
                  className="upload-file__thumb"
                  src={upload.previewUrl}
                  alt={`Prévia de ${upload.file.name}`}
                />
              ) : (
                <span className="upload-file__icon" aria-hidden="true">
                  <FileText />
                </span>
              )}
              <span className="upload-file__info">
                <span className="upload-file__name">{upload.file.name}</span>
                <span className="upload-file__size">{formatFileSize(upload.file.size)}</span>
              </span>
              <button
                type="button"
                className="upload-file__remove"
                onClick={() => onRemoveFile(upload.id)}
                aria-label={`Remover ${upload.file.name} de ${requirement.title}`}
              >
                <Trash2 aria-hidden="true" />
                <span>Remover</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
