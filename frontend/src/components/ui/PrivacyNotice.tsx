import { ShieldCheck } from 'lucide-react';
import { Notice } from './Notice';

export function PrivacyNotice() {
  return (
    <Notice
      tone="info"
      icon={<ShieldCheck aria-hidden="true" />}
      title="Seus documentos ficam sob seu controle"
    >
      Nesta demonstração, as fotos e os arquivos escolhidos permanecem no seu navegador e não são
      enviados a nenhum servidor.
    </Notice>
  );
}
