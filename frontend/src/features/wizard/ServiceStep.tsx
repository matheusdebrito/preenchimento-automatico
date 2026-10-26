import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, ArrowRight, Check, Ship, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Notice } from '../../components/ui/Notice';
import { PILOT_SERVICE } from '../../data/catalog';
import { useWizard } from './WizardContext';
import { WIZARD_PATHS } from './wizard-steps';

export function ServiceStep() {
  const { selectedServiceId, selectService } = useWizard();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedServiceId) {
      setError('Escolha um serviço para continuar.');
      return;
    }

    setError(null);
    navigate(WIZARD_PATHS.documentos);
  };

  return (
    <section className="wizard-panel" aria-labelledby="service-title">
      <header className="wizard-panel__header">
        <p className="eyebrow">Etapa 1 de 5</p>
        <h1 className="wizard-panel__title" id="service-title">
          O que você precisa fazer?
        </h1>
        <p className="wizard-panel__subtitle">
          Escolha o serviço. No protótipo, apenas a transferência de moto aquática está disponível.
        </p>
      </header>

      <Notice tone="demo">
        Esta é uma prévia da interface. Nenhum documento é enviado e nenhum crédito é consumido.
      </Notice>

      <form onSubmit={handleSubmit}>
        <fieldset className="service-fieldset">
          <legend className="wizard-panel__section-title">Serviço disponível</legend>

          <label className="service-option">
            <input
              className="service-option__input"
              type="radio"
              name="service"
              value={PILOT_SERVICE.id}
              checked={selectedServiceId === PILOT_SERVICE.id}
              onChange={() => {
                selectService(PILOT_SERVICE.id);
                setError(null);
              }}
            />
            <span className="icon-badge" aria-hidden="true">
              <Ship />
            </span>
            <span className="service-option__content">
              <span className="service-option__title">{PILOT_SERVICE.title}</span>
              <span className="service-option__description">{PILOT_SERVICE.summary}</span>
              <span className="service-option__meta">
                <Badge tone="test">Fluxo disponível</Badge>
                <Badge tone="neutral">1 crédito</Badge>
              </span>
            </span>
            <span className="service-option__check" aria-hidden="true">
              <Check />
            </span>
          </label>
        </fieldset>

        {error ? (
          <p className="field__error service-error" role="alert">
            <AlertCircle aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : null}

        <div className="cost-card service-cost">
          <span className="cost-card__icon" aria-hidden="true">
            <Wallet />
          </span>
          <span className="cost-card__text">
            <span className="cost-card__title">1 crédito por processo</span>
            <span className="cost-card__detail">
              Você só usa o crédito ao preparar os formulários.
            </span>
          </span>
        </div>

        <div className="wizard-actions service-actions">
          <p className="wizard-actions__hint">
            Você poderá conferir e corrigir os dados antes de gerar qualquer formulário.
          </p>
          <div className="wizard-actions__end">
            <Button type="submit" icon={<ArrowRight aria-hidden="true" />} iconPosition="end">
              Continuar
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
