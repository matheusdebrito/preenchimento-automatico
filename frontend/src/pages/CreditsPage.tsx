import { Check, History, Info, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Badge } from '../components/ui/Badge';
import { Notice } from '../components/ui/Notice';
import { DEMO_CREDIT_PRODUCTS } from '../data/demo';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function CreditsPage() {
  useDocumentTitle('Créditos');

  return (
    <PageLayout>
      <div className="page">
        <div className="container page-stack">
          <header className="page__header">
            <p className="eyebrow">Créditos</p>
            <h1>Pague por processo, sem mensalidade.</h1>
            <p className="lead">
              Cada processo documental usa um crédito, independentemente da quantidade de
              formulários gerados.
            </p>
          </header>

          <Notice tone="demo" title="Compra indisponível no protótipo">
            A venda de créditos ainda não está ativa. Esta tela apresenta o modelo aprovado de
            créditos avulsos e pacotes pré-pagos; nenhum pagamento é simulado.
          </Notice>

          <div className="credits-layout">
            <section className="card card--padded" aria-labelledby="how-credits-title">
              <div className="credit-equation">
                <span className="icon-badge icon-badge--white icon-badge--lg" aria-hidden="true">
                  <Wallet />
                </span>
                <div className="credit-equation__text">
                  <h2 className="credit-equation__title" id="how-credits-title">
                    1 crédito = preenchimento de um processo
                  </h2>
                  <p>
                    Correções e novos downloads dentro da mesma sessão não geram nova cobrança.
                  </p>
                </div>
              </div>

              <h3 className="wizard-panel__section-title credits-included-title">
                O que está incluído
              </h3>
              <ul className="credit-list credits-included-list">
                <li>
                  <Check aria-hidden="true" />
                  Enviar os documentos do processo.
                </li>
                <li>
                  <Check aria-hidden="true" />
                  Conferir e corrigir os dados encontrados.
                </li>
                <li>
                  <Check aria-hidden="true" />
                  Preparar o pacote de formulários do serviço.
                </li>
                <li>
                  <Check aria-hidden="true" />
                  Baixar novamente durante a janela da mesma sessão.
                </li>
              </ul>
            </section>

            <section className="credit-policy" aria-labelledby="policy-title">
              <h2 id="policy-title">Condições de uso</h2>
              <p>
                Não há mensalidade, assinatura, renovação automática ou cobrança por usuário. O
                saldo exibido na interface é informativo; a autorização e o consumo são verificados
                no servidor.
              </p>
              <p>
                O crédito é consumido uma única vez, após a primeira geração bem-sucedida do
                pacote. Falhas de processamento não devem gerar cobrança.
              </p>
              <Link className="action-link" to="/creditos/historico">
                <span className="icon-badge" aria-hidden="true">
                  <History />
                </span>
                <span className="action-link__text">
                  <span>Histórico de créditos</span>
                  <span className="action-link__hint">Movimentações operacionais</span>
                </span>
              </Link>
            </section>
          </div>

          <section aria-labelledby="products-title">
            <div className="section-heading">
              <h2 id="products-title">Opções previstas</h2>
              <p>Os preços e meios de pagamento serão exibidos quando a compra estiver disponível.</p>
            </div>
            <div className="product-grid">
              {DEMO_CREDIT_PRODUCTS.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-card__top">
                    <h3 className="product-card__title">{product.title}</h3>
                    <Badge tone="soon">Em breve</Badge>
                  </div>
                  <p className="product-card__text">{product.description}</p>
                  <p className="product-card__text">{product.detail}</p>
                  <div className="product-card__footer">
                    <span className="product-card__price">Disponível na etapa comercial</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <Notice
            tone="info"
            icon={<Info aria-hidden="true" />}
            title="Créditos de teste no protótipo"
          >
            Enquanto a compra não estiver ativa, créditos de teste podem ser concedidos
            manualmente. O protótipo não processa pagamentos nem emite cobranças.
          </Notice>
        </div>
      </div>
    </PageLayout>
  );
}
