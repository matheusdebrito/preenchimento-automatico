import type { ComponentType } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { DocumentsStep } from './DocumentsStep';
import { DownloadStep } from './DownloadStep';
import { ReadingStep } from './ReadingStep';
import { ReviewStep } from './ReviewStep';
import { ServiceStep } from './ServiceStep';
import { WizardProvider } from './WizardContext';
import { WizardLayout } from './WizardLayout';
import { isWizardStepSlug, WIZARD_PATHS } from './wizard-steps';

const STEP_COMPONENTS: Record<string, ComponentType> = {
  servico: ServiceStep,
  documentos: DocumentsStep,
  leitura: ReadingStep,
  conferencia: ReviewStep,
  download: DownloadStep,
};

function WizardStepSwitch() {
  const location = useLocation();
  const slug = location.pathname.split('/').filter(Boolean)[1];

  if (!slug) {
    return <Navigate to={WIZARD_PATHS.servico} replace />;
  }

  if (!isWizardStepSlug(slug)) {
    return <Navigate to={WIZARD_PATHS.servico} replace />;
  }

  const Step = STEP_COMPONENTS[slug];

  if (!Step) {
    return <Navigate to={WIZARD_PATHS.servico} replace />;
  }

  return <Step />;
}

export function WizardRoute() {
  return (
    <WizardProvider>
      <WizardLayout>
        <WizardStepSwitch />
      </WizardLayout>
    </WizardProvider>
  );
}
