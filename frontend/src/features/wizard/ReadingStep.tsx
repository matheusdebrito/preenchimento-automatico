import { ArrowRight, CheckCircle2, Clock, FileCheck2 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Notice } from '../../components/ui/Notice';
import { useWizard } from './WizardContext';
import { WIZARD_PATHS } from './wizard-steps';

export function ReadingStep() {
  const { uploadsByRequirement, usingDemo } = useWizard();
  const navigate = useNavigate();
  const fileCount = Object.values(uploadsByRequirement).reduce(
    (total, uploads) => total + uploads.length,
    0,
  );

  if (!usingDemo && fileCount === 0) {
    return <Navigate to={WIZARD_PATHS.documentos} replace />;
  }

  return (
    <section className="wizard-panel" aria-labelledby="reading-title">
      <header className="wizard-panel__header">
        <p className="eyebrow">Etapa 3 de 5</p>
        <h1 className="wizard-panel__title" id="reading-title">
          Leitura dos documentos
        </h1>
        <p className="wizard-panel__subtitle">
          Esta é uma prévia da etapa em que as informações são lidas no servidor.
        </p>
      </header>

      <Notice tone="demo" title="Prévia de interface">
        {usingDemo
          ? 'Nenhum documento foi enviado. Os dados da próxima etapa são fictícios e servem apenas para demonstrar o fluxo.'
          : `Você selecionou ${fileCount} ${fileCount === 1 ? 'arquivo' : 'arquivos'} localmente, mas nenhum foi enviado. A leitura real acontecerá no servidor quando a integração estiver ativa.`}
      </Notice>

      <ol className="reading-list">
        <li className="reading-step reading-step--done">
          <span className="reading-step__icon" aria-hidden="true">
            <CheckCircle2 />
          </span>
          <div className="reading-step__content">
            <span className="reading-step__label">Documentos selecionados</span>
            <span className="reading-step__text">
              {usingDemo
                ? 'Documentos de exemplo preparados para a demonstração.'
                : `${fileCount} ${fileCount === 1 ? 'arquivo' : 'arquivos'} mantidos apenas neste navegador.`}
            </span>
          </div>
        </li>
        <li className="reading-step reading-step--current">
          <span className="reading-step__icon" aria-hidden="true">
            <Clock />
          </span>
          <div className="reading-step__content">
            <span className="reading-step__label">Lendo as informações</span>
            <span className="reading-step__text">
              No produto, a leitura acontece no servidor, nunca no navegador. Nesta demonstração,
              nenhum processamento está em andamento.
            </span>
          </div>
        </li>
        <li className="reading-step">
          <span className="reading-step__icon" aria-hidden="true">
            <FileCheck2 />
          </span>
          <div className="reading-step__content">
            <span className="reading-step__label">Dados encontrados</span>
            <span className="reading-step__text">
              Os dados ficam disponíveis para conferência na próxima etapa.
            </span>
          </div>
        </li>
      </ol>

      <p className="field__hint">
        Quando a integração estiver ativa, você poderá sair e voltar enquanto o servidor processa os
        documentos.
      </p>

      <div className="wizard-actions">
        <p className="wizard-actions__hint">
          Sem porcentagens inventadas: o progresso real virá do servidor.
        </p>
        <div className="wizard-actions__end">
          <Button
            onClick={() => navigate(WIZARD_PATHS.conferencia)}
            icon={<ArrowRight aria-hidden="true" />}
            iconPosition="end"
          >
            Ver dados de exemplo
          </Button>
        </div>
      </div>
    </section>
  );
}
