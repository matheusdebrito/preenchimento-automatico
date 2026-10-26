import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { WizardProgress } from '../../components/ui/WizardProgress';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useWizard } from './WizardContext';
import { WIZARD_PATHS, WIZARD_STEPS } from './wizard-steps';

interface WizardLayoutProps {
  children: ReactNode;
}

export function WizardLayout({ children }: WizardLayoutProps) {
  const location = useLocation();
  const { selectedServiceId } = useWizard();
  const foundIndex = WIZARD_STEPS.findIndex(
    (step) => location.pathname === `/preencher/${step.slug}`,
  );
  const stepIndex = foundIndex >= 0 ? foundIndex : 0;
  const currentStep = WIZARD_STEPS[stepIndex] ?? WIZARD_STEPS[0];
  const previousStep = stepIndex > 0 ? WIZARD_STEPS[stepIndex - 1] : undefined;

  useDocumentTitle(currentStep.label);

  if (!selectedServiceId && stepIndex > 0) {
    return <Navigate to={WIZARD_PATHS.servico} replace />;
  }

  return (
    <PageLayout>
      <div className="wizard">
        <div className="container">
          <div className="wizard__header">
            <div className="wizard__heading">
              <p className="eyebrow">Preenchimento</p>
              <Badge tone="demo">Demonstração</Badge>
            </div>
            <WizardProgress steps={WIZARD_STEPS} currentIndex={stepIndex} />
          </div>

          <div className="wizard__body">
            {previousStep ? (
              <Button
                to={WIZARD_PATHS[previousStep.slug]}
                variant="ghost"
                icon={<ArrowLeft aria-hidden="true" />}
                className="wizard__back"
                aria-label={`Voltar para ${previousStep.label}`}
              >
                Voltar
              </Button>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
