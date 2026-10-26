import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, ArrowRight, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Notice } from '../../components/ui/Notice';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PILOT_SERVICE } from '../../data/catalog';
import { DEMO_REVIEW_SECTIONS } from '../../data/demo';
import type { FieldStatus, ReviewFieldDefinition } from '../../data/demo';
import { useWizard } from './WizardContext';
import { WIZARD_PATHS } from './wizard-steps';

function resolveStatus(field: ReviewFieldDefinition, value: string): FieldStatus {
  if (value !== field.value) {
    return 'revisar';
  }

  return field.status;
}

export function ReviewStep() {
  const { reviewValues, setReviewValue } = useWizard();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasErrors = Object.keys(errors).length > 0;

  const handleValueChange = (fieldId: string, value: string) => {
    setReviewValue(fieldId, value);

    if (errors[fieldId]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missingFields = DEMO_REVIEW_SECTIONS.flatMap((section) => section.fields).filter(
      (field) => !(reviewValues[field.id] ?? '').trim(),
    );

    if (missingFields.length > 0) {
      const nextErrors: Record<string, string> = {};
      missingFields.forEach((field) => {
        nextErrors[field.id] = 'Preencha este campo para continuar.';
      });
      setErrors(nextErrors);

      const firstMissing = missingFields[0];
      if (firstMissing) {
        document.getElementById(`review-${firstMissing.id}`)?.focus();
      }
      return;
    }

    setErrors({});
    navigate(WIZARD_PATHS.download);
  };

  return (
    <section className="wizard-panel" aria-labelledby="review-title">
      <header className="wizard-panel__header">
        <p className="eyebrow">Etapa 4 de 5</p>
        <h1 className="wizard-panel__title" id="review-title">
          Confira os dados encontrados
        </h1>
        <p className="wizard-panel__subtitle">
          Marque o que está correto, corrija o que precisar e preencha os campos não encontrados.
        </p>
      </header>

      <Notice tone="demo" title="Dados fictícios de demonstração">
        Não insira dados reais de pessoas ou embarcações. Na versão integrada, os valores virão dos
        seus documentos e cada campo mostrará a origem da informação.
      </Notice>

      {hasErrors ? (
        <Notice tone="danger" role="alert" title="Confira os campos destacados">
          Preencha todos os campos obrigatórios antes de preparar os formulários.
        </Notice>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="review-layout">
          {DEMO_REVIEW_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const sectionTitleId = `review-section-${section.id}`;

            return (
              <section
                className="review-section"
                key={section.id}
                aria-labelledby={sectionTitleId}
              >
                <div className="review-section__head">
                  <span className="icon-badge" aria-hidden="true">
                    <SectionIcon />
                  </span>
                  <h2 className="wizard-panel__section-title" id={sectionTitleId}>
                    {section.title}
                  </h2>
                </div>

                <div className="review-grid">
                  {section.fields.map((field) => {
                    const value = reviewValues[field.id] ?? '';
                    const error = errors[field.id];
                    const sourceId = `review-${field.id}-source`;
                    const errorId = `review-${field.id}-error`;
                    const describedBy = error ? `${sourceId} ${errorId}` : sourceId;
                    const status = resolveStatus(field, value);

                    return (
                      <div className="review-field" key={field.id}>
                        <div className="review-field__top">
                          <label className="field__label" htmlFor={`review-${field.id}`}>
                            {field.label}
                          </label>
                          <StatusBadge status={status} />
                        </div>
                        <input
                          className="field__input"
                          id={`review-${field.id}`}
                          name={field.id}
                          value={value}
                          onChange={(event) => handleValueChange(field.id, event.target.value)}
                          inputMode={field.inputMode}
                          autoComplete="off"
                          aria-invalid={Boolean(error)}
                          aria-describedby={describedBy}
                        />
                        <span className="review-field__source" id={sourceId}>
                          {field.source}
                        </span>
                        {error ? (
                          <span className="field__error" id={errorId}>
                            <AlertCircle aria-hidden="true" />
                            <span>{error}</span>
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="cost-card review-cost">
          <span className="cost-card__icon" aria-hidden="true">
            <Wallet />
          </span>
          <span className="cost-card__text">
            <span className="cost-card__title">
              Custo deste processo: {PILOT_SERVICE.creditCost} crédito
            </span>
            <span className="cost-card__detail">
              Nesta demonstração, nenhum crédito é consumido. Na versão final, o débito acontece uma
              única vez após a geração bem-sucedida.
            </span>
          </span>
        </div>

        <div className="wizard-actions review-actions">
          <p className="wizard-actions__hint">
            Ao confirmar, você declara que conferiu os dados acima.
          </p>
          <div className="wizard-actions__end">
            <Button type="submit" icon={<ArrowRight aria-hidden="true" />} iconPosition="end">
              Confirmar e preparar formulários
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
