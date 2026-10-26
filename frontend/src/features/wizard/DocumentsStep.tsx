import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Notice } from '../../components/ui/Notice';
import { DEMO_DOCUMENT_REQUIREMENTS, DEMO_REQUIREMENTS_NOTE } from '../../data/demo';
import { DocumentUploadCard } from './DocumentUploadCard';
import { useWizard } from './WizardContext';
import { WIZARD_PATHS } from './wizard-steps';

export function DocumentsStep() {
  const { uploadsByRequirement, addFiles, removeFile, continueWithDemo } = useWizard();
  const navigate = useNavigate();

  const completeCount = DEMO_DOCUMENT_REQUIREMENTS.filter(
    (requirement) => (uploadsByRequirement[requirement.id]?.length ?? 0) > 0,
  ).length;
  const allComplete = completeCount === DEMO_DOCUMENT_REQUIREMENTS.length;

  const handleContinue = () => {
    if (allComplete) {
      navigate(WIZARD_PATHS.leitura);
    }
  };

  const handleDemo = () => {
    continueWithDemo();
    navigate(WIZARD_PATHS.leitura);
  };

  return (
    <section className="wizard-panel" aria-labelledby="documents-title">
      <header className="wizard-panel__header">
        <p className="eyebrow">Etapa 2 de 5</p>
        <h1 className="wizard-panel__title" id="documents-title">
          Envie os documentos
        </h1>
        <p className="wizard-panel__subtitle">
          Tire uma foto ou escolha um arquivo do seu celular ou computador.
        </p>
      </header>

      <Notice tone="demo" title="Não envie documentos reais nesta demonstração">
        Os arquivos escolhidos ficam somente no seu navegador e não são enviados. Para conhecer o
        fluxo sem arquivos, use “Continuar com dados de exemplo”.
      </Notice>

      <div className="doc-list">
        {DEMO_DOCUMENT_REQUIREMENTS.map((requirement) => (
          <DocumentUploadCard
            key={requirement.id}
            requirement={requirement}
            uploads={uploadsByRequirement[requirement.id] ?? []}
            onAddFiles={(files) => addFiles(requirement.id, files)}
            onRemoveFile={(fileId) => removeFile(requirement.id, fileId)}
          />
        ))}
      </div>

      <div>
        <p className="upload-summary" role="status" aria-live="polite">
          {completeCount} de {DEMO_DOCUMENT_REQUIREMENTS.length} documentos adicionados.
        </p>
        <p className="field__hint">{DEMO_REQUIREMENTS_NOTE}</p>
      </div>

      <div className="wizard-actions">
        <div className="wizard-actions__start">
          <Button
            variant="secondary"
            icon={<Sparkles aria-hidden="true" />}
            onClick={handleDemo}
          >
            Continuar com dados de exemplo
          </Button>
        </div>
        <div className="wizard-actions__end">
          <Button
            onClick={handleContinue}
            disabled={!allComplete}
            icon={<ArrowRight aria-hidden="true" />}
            iconPosition="end"
            aria-describedby="documents-continue-hint"
          >
            Continuar
          </Button>
        </div>
      </div>
      <p className="wizard-actions__hint" id="documents-continue-hint">
        Adicione pelo menos um arquivo em cada documento para continuar. Você também pode usar os
        dados de exemplo.
      </p>
    </section>
  );
}
