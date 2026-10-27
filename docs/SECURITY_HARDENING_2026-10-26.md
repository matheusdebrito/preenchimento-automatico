# Hardening incremental — 26/10/2026

Este registro complementa `PROJECT_TRACKER.md`. Não constitui auditoria de segurança certificada, homologação documental ou autorização para produção.

## Correções de causa-raiz

| Tema | Problema | Mudança / validação |
| --- | --- | --- |
| Mesmo domínio e CORS | Login era negado quando o navegador enviava `Origin` do frontend em `127.0.0.1`, mesmo acessando o mesmo site | Comparação rigorosa de origem e `Host` no backend, testes de origem legítima/invasora e smoke HTTP por Nginx |
| Expiração durante processamento | Cleanup e cancelamento poderiam remover arquivos usados por OCR, geração ou download | Leases por job com renovação de TTL após operação, exclusão bloqueada durante operações ativas |
| Criação concorrente | Jobs criados simultaneamente poderiam ultrapassar a quota antes de serem inseridos no registro | Reserva de criações pendentes por usuário e limite global; tests `Promise.allSettled` |
| Documento duplicado | Reenvio poderia armazenar múltiplos documentos no mesmo requisito | Um upload por requisito; GET de status expõe IDs dos requisitos enviados para retomada |
| Exposição de dados no OCR | Campos de CPF de comprador e vendedor podiam ser confundidos | Separação pela origem, CPF com dígitos verificadores válidos e nomes apenas com rótulos explícitos |
| Integridade dos uploads | PNG com assinatura/IHDR falsos passava no controle inicial | Verificação de chunks `IHDR`, `IDAT`, `IEND` e CRC; limite de pixels |
| PDF fora de padrão | Não havia limite de geometria da página | Poppler limita páginas e tamanho da primeira página; teste com página de 3000×3000 pt |
| Retentativas | Falha no upload recriava jobs e consumia quotas | React consulta status, pula arquivos já enviados, suporta cancelamento e recuperação do pacote gerado |
| Revisão do PDF | OCR poderia enviar valores de campos não mostrados na revisão | Projeção de campos reais, obrigatoriedade e validação de whitelist no backend |
| Segredos em subprocessos | OCR/Poppler recebiam todo `process.env` | Ambiente mínimo: `PATH`, `LC_ALL`, `OMP_THREAD_LIMIT`, `TESSDATA_PREFIX` quando necessário |
| Crédito duplicado | Recuperação após perda de resposta poderia tentar nova geração | Consultar estado do job antes de repetir operação, além de ledger idempotente |

## Evidências automatizadas

- Testes no backend: origem e limite de login/cadastro; job ativo/expiração, quotas e duplicação; CRC de PNG e limites PDF; OCR comprador/vendedor, CPF e PDF digitalizado; créditos incluindo estorno idempotente.
- Testes no frontend: fluxo com API simulada, upload interrompido e retomado, cancelamento, recuperação de geração com resposta perdida.
- Integração: PostgreSQL real, pdf-lib com PDFs sintéticos, Poppler e Tesseract, download autorizado.
- Docker: build e smoke de frontend/backend/PostgreSQL. O CI exercita POST legítimo por Nginx e nega a origem cross-site.
- Referência de CI: consultar [workflow](../.github/workflows/ci.yml) e resultados no GitHub Actions; apenas execuções **verdes** contam como prova.

## Limitações e condições obrigatórias antes do MVP homologado

1. `FormMapping` dos seis PDFs oficiais permanece `DRAFT`; a revisão visual humana dos campos ainda não terminou. Não tornar `ServiceDefinition` disponível.
2. A segurança dos PDFs não se esgota na inspeção de cabeçalho/CRC/metadados. É necessária revisão do isolamento e atualização de bibliotecas de decodificação para produção.
3. O limite do PDF é baseado no `pdfinfo`, incluindo a geometria da primeira página; revisar demais páginas antes de permitir documentos arbitrários em produção.
4. A retenção temporária funciona em instância única e armazenamento efêmero. Falta prova de comportamento em encerramento abrupto, filas distribuídas e backups.
5. O ledger é idempotente, mas não há estado persistente de entrega associado a cada cobrança para estorno automático de jobs perdidos após crash.
6. Limitação de tentativas na API é por IP observado no processo. Em produção, requer IP confiável do proxy, rate limiting compartilhado e controles de abuso.
7. Falta teste completo de carga, acessibilidade real em dispositivos, documentação LGPD revisada e homologação da aplicabilidade normativa por Capitania.

**Marco preservado:** arquitetura de PDF independente de serviço; crédito único por pacote; apenas dados fictícios em CI. Pagamentos reais, publicações e dados de clientes permanecem fora do escopo executado.
