import { Waves } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <div className="site-footer__brand">
            <span className="brand__mark" aria-hidden="true">
              <Waves />
            </span>
            <span>Preenchimento Automático</span>
          </div>
          <p className="site-footer__disclaimer">
            Ferramenta privada e independente. Não representa a Marinha do Brasil, não realiza
            protocolo oficial e não garante aprovação dos documentos.
          </p>
        </div>

        <nav aria-label="Navegação do rodapé" className="site-footer__nav">
          <Link className="site-footer__link" to="/">
            Início
          </Link>
          <Link className="site-footer__link" to="/minha-conta">
            Minha conta
          </Link>
          <Link className="site-footer__link" to="/creditos">
            Créditos
          </Link>
          <Link className="site-footer__link" to="/creditos/historico">
            Histórico
          </Link>
        </nav>

        <p className="site-footer__disclaimer">
          Protótipo em desenvolvimento. Nesta demonstração, os arquivos escolhidos permanecem no
          navegador e não são enviados a nenhum servidor.
        </p>
      </div>
    </footer>
  );
}
