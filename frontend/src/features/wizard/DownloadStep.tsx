import { ArrowRight, FileCheck2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Notice } from '../../components/ui/Notice';
import { DEMO_FORM_SLOT } from '../../data/demo';
import { useWizard } from './WizardContext';
import { WIZARD_PATHS } from './wizard-steps';

export function DownloadStep() {
  const { reset } = useWizard();
  const navigate = useNavigate();

  const handleFinish = () => {
    // Sair da rota desmonta o WizardProvider e o cleanup revoga as prévias locais.
    navigate('/');
  };

  const handleRestart = () => {
    reset();
    navigate(WIZARD_PATHS.servico);
  };

  return (
    <section className="wizard-panel" aria-labelledby="download-title">
      <header className="wizard-panel__header">
        <p className="eyebrow">Etapa 5 de 5</p>
        <h1 className="wizard-panel__title" id="download-title">
          Prévia dos formulários
        </h1>
        <p className="wizard-panel__subtitle">
          Esta é a etapa em que os PDFs oficiais ficarão disponíveis para download.
        </p>
      </header>

      <Notice tone="demo" title="Prévia de entrega">
        A geração real depende da confirmação dos modelos oficiais e da integração com o gerador de
        PDFs. Nenhum arquivo foi gerado e nenhum crédito foi consumido nesta demonstração.
      </Notice>

      <div className="download-list">
        <article className="download-card">
          <span className="download-card__icon" aria-hidden="true">
            <FileCheck2 />
          </span>
          <div className="download-card__content">
            <h2 className="download-card__name">{DEMO_FORM_SLOT.name}</h2>
            <p className="download-card__meta">{DEMO_FORM_SLOT.description}</p>
            <div className="download-card__badge">
              <Badge tone="warning">Aguardando modelo oficial</Badge>
            </div>
          </div>
          <div className="download-card__action">
            <Button
              variant="secondary"
              disabled
              aria-describedby="download-disabled-reason"
            >
              Baixar PDF
            </Button>
          </div>
        </article>
      </div>

      <p className="field__hint" id="download-disabled-reason">
        O download será habilitado quando um modelo oficial estiver disponível.
      </p>

      <Notice tone="info" icon={<ShieldCheck aria-hidden="true" />}>
        Quando a geração estiver ativa, confira os documentos antes de imprimir ou assinar. O
        sistema não protocola o processo na Marinha nem garante aprovação.
      </Notice>

      <div className="wizard-actions">
        <div className="wizard-actions__start">
          <Button variant="ghost" onClick={handleRestart}>
            Refazer demonstração
          </Button>
        </div>
        <div className="wizard-actions__end">
          <Button
            onClick={handleFinish}
            icon={<ArrowRight aria-hidden="true" />}
            iconPosition="end"
          >
            Encerrar demonstração
          </Button>
        </div>
      </div>
    </section>
  );
}
