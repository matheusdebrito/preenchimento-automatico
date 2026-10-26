import { Check } from 'lucide-react';
import { cx } from '../../lib/cx';

export interface WizardStepInfo {
  slug: string;
  label: string;
}

interface WizardProgressProps {
  steps: readonly WizardStepInfo[];
  currentIndex: number;
}

export function WizardProgress({ steps, currentIndex }: WizardProgressProps) {
  const current = steps[currentIndex] ?? steps[0];
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <nav className="wizard-progress" aria-label="Progresso do preenchimento">
      <div className="wizard-progress__compact" aria-hidden="true">
        <span className="wizard-progress__compact-label">
          Etapa {currentIndex + 1} de {steps.length}
        </span>
        <span className="wizard-progress__compact-current">{current?.label}</span>
        <div className="wizard-progress__bar">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ol className="wizard-progress__list">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={step.slug}
              className={cx(
                'wizard-progress__item',
                isDone && 'wizard-progress__item--done',
                isCurrent && 'wizard-progress__item--current',
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="wizard-progress__marker" aria-hidden="true">
                {isDone ? <Check /> : index + 1}
              </span>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
