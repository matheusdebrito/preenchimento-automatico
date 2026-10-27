import { Waves } from 'lucide-react';

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
            Ferramenta privada e independente da Marinha do Brasil.
            Não realiza protocolo oficial nem garante aprovação dos documentos.
          </p>
        </div>
        <p className="site-footer__disclaimer">
          No preenchimento assistido, imagens e PDFs são enviados temporariamente ao servidor
          para leitura e geração, com exclusão ao encerrar ou expirar o processo.
          Confira seus dados antes de gerar.
        </p>
      </div>
    </footer>
  );
}
