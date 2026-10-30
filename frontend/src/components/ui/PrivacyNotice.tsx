import { ShieldCheck } from 'lucide-react';
import { Notice } from './Notice';

export function PrivacyNotice() {
  return (
    <Notice
      tone="info"
      icon={<ShieldCheck aria-hidden="true" />}
      title="Como seus documentos são processados"
    >
      Os arquivos enviados são recebidos pelo servidor. Quando você solicita a análise automática,
      os PDFs e as imagens com campos aplicáveis são transmitidos à OpenAI pela API para extração
      de informações. A aplicação mantém arquivos e sugestões no job temporário até o cancelamento
      ou a expiração. Confira e corrija os dados antes de gerar os formulários e não envie documentos
      de terceiros sem autorização.
    </Notice>
  );
}
