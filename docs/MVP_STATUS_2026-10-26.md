# Status técnico do MVP — 26/10/2026

## Origem e histórico

OpenCode entregou as fases 00–02 e seis PDFs NORMAM-212/DPC 2026 oficiais versionados. O estado foi auditado via GitHub antes de continuar. Esta rodada implementou API, PDFs, arquivos temporários, OCR, contas, créditos de teste, interface real e testes E2E em banco real. **Nenhum cliente real foi processado e nenhuma cobrança real foi ativada.**

## Módulos implementados

| Módulo | Evidência | Status |
|---|---|---|
| API Fastify de catálogo | `backend/src/routes/catalog.ts`, `public-catalog.ts`, testes unitários | Implementado e testado com fixtures |
| Modelos oficiais | `backend/templates/*/v1/original.pdf` | 6 PDFs `VERIFIED` pela Fase 02 |
| Motor de preenchimento | `backend/src/modules/pdf/` | Testado com dados sintéticos; aprovação real bloqueada |
| Mapeamento independente | `backend/src/modules/catalog/draft-mappings.ts` | 135 posições `DRAFT`, relatórios por versão, prévias sintéticas e CI com artefatos de revisão visual |
| Upload seguro/TTL | `backend/src/modules/jobs/`, `routes/jobs.ts` | Implementado; QA de falhas incompleto |
| OCR texto e Tesseract | `backend/src/modules/jobs/ocr.ts` | PDF nativo e imagens/PDFs digitalizados sintéticos testados; OCR sujeito a falhas de reconhecimento |
| Login, sessão e ledger | `backend/src/modules/auth/`, migration SQL | PostgreSQL real testado, rate limit local implementado e testado |
| Interface integrada | `frontend/src/features/real/LiveFlowPage.tsx` | Desenvolvida; testes de componentes com API simulada passaram, E2E em navegador real pendente |
| E2E de API | `backend/src/routes/jobs.integration.test.ts` | 2 formulários sintéticos em modelo oficial, 1 débito único, login/download autorizados |
| Compose | `compose.yaml`, workflow CI | Smoke Docker Compose com Postgres e proxy same-origin aprovado após correção do segredo opcional |

## Evidências de mapeamento e riscos

Confira os arquivos da pasta [`docs/mapping-reports/`](mapping-reports/) e as imagens de [`docs/_pdf_test_previews/`](_pdf_test_previews/). Os testes renderizam somente valores sintéticos e adicionam marca d'água de amostra.

A inspeção automática/visual do agente revelou sobreposições de rótulos, que foram corrigidas em parte. Ainda existem campos sem mapeamento: datas, assinaturas, coproprietário, motores adicionais, rubricas e exigências condicionais. O serviço piloto precisa de avaliação jurídica/normativa local e revisão documental independente antes de tornar-se público, inclusive em ambiente local com dados reais.

## Próximas ações objetivas

1. Completar os mapas de 2-A e 2-B e suas regras condicionais e revisar visualmente todos os campos com dados longos/acento; depois os anexos condicionais.
2. Fechar relatórios, submeter à revisão humana independente e só então mudar `FormMapping` para `APPROVED`.
3. Associar `ServiceForm` e, depois de validar as regras, mudar o piloto para `AVAILABLE`.
4. Ampliar testes do Tesseract com qualidade de imagens variada; testar erros, tempo, limpeza após crash/TTL e carga concorrente. Há testes sintéticos de imagem/PDF escaneado e limites de jobs.
5. Completar teste de estorno/rollback; executar E2E em navegador real. A limitação básica de taxa da autenticação e o teste do wizard React com API simulada já foram adicionados.
6. Concluir hardening, testes de carga, acessibilidade e homologação humana da Fase 09. O smoke Docker Compose foi aprovado. Pagamentos reais e produção permanecem fases 10+.

**Estado:** fundação técnica avançada, **MVP ainda NÃO homologado**, sem uso de dados reais nem cobrança.

## Validação integrada adicional

A execução [CI 40425506645](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40425506645) passou com backend, frontend, PostgreSQL real e Docker Compose, incluindo autenticação, controle de créditos, PDFs sintéticos, Tesseract e testes de fluxo React. Foram corrigidos durante a execução: segredo opcional vazio no Compose, expectativas excessivas do OCR, seleção de inputs no teste do React e posicionamento de testes de concorrência. O armazenamento temporário passou a limitar processos ativos e uploads concorrentes, com 30 MB por job. **Isso comprova a infraestrutura técnica testada, não a aptidão dos modelos para usuários reais.**

## Continuação de segurança e UX — 26/10/2026

Implementados e commitados na `main`:
- Requisições de frontend pelo proxy same-origin corrigidas e testadas contra tentativas cross-site.
- Proteção de jobs durante OCR/geração/download e limites concorrentes de criação e upload; limpeza e TTL testados.
- Confirmação de campos visíveis e obrigatórios; rejeição de valores estranhos ao formulário.
- Retentativa de uploads sem recriar jobs; recuperação após perda de resposta na geração e exclusão explícita pelo usuário.
- Preflight reforçado para PNG (estrutura e checksum) e PDFs (número/tamanho de páginas), mais testes reais Poppler.
- OCR conservador diferencia comprador e vendedor, valida CPF e não repassa segredos para subprocessos.
- Testes de rollback de créditos e CI com smoke de acesso de login pelo proxy.

**Persistem riscos:** os decodificadores de arquivos e o OCR não substituem um isolamento de segurança completo; o consumo de créditos ainda exige reconciliação/reserva persistente em falhas abruptas de processo antes de produção. Testes com carga, recuperação de falhas de infraestrutura, revisão de segurança independente e análise documental final continuam pendentes. Os seis mapeamentos seguem `DRAFT`, a transferência segue indisponível, e pagamentos/produção não foram ativados.

Relatório da implementação: [hardening e verificação](SECURITY_HARDENING_2026-10-26.md).

## Controle do prazo temporário

Adicionado endpoint autenticado `POST /api/jobs/:id/renew`, com prazo deslizante de 20 minutos e retenção máxima de uma hora desde a criação. A interface exibe a expiração estimada e botão para renovar. A geração/streaming só estende até o limite absoluto. Testes de UI e integração com banco verificam renovação; arquivos são removidos por cancelamento ou limpeza programada. Requer nova validação em falha abrupta para habilitação de produção.

## Fase 04 — Motor PDF e mapeamentos (continuação)

**Implementação técnica atual:** seis `FormMapping` independentes, **135 posições** distribuídas entre anexos 2-A, 2-B, 2-C, 2-D, 2-E e 1-C. Motor pdf-lib distingue campos AcroForm e posições estáticas, suporta seleções condicionais `markWhen`, rejeita textos que ultrapassam o campo, caracteres invisíveis ou não suportados, datas inválidas e CPFs com dígito verificador inválido. A origem/identidade do **declarante** no 2-C é diferente da do vendedor; os dados de coproprietário e motores 2–4 foram acrescentados no 2-D; tipos/datas de identidade e complementos foram acrescentados no 2-E; local/data incluído no 2-A.

O CI executa regressões **para cada PDF oficial** com dados fictícios, preservação do modelo e testes de erro, além de gerar o artefato `pdf-mapping-review-synthetic` (PDF e PNG de todas as páginas). As prévias atuais no GitHub foram inspecionadas e corrigidas onde marcas e complementos sobrepunham rótulos.

**Não homologado:** assinaturas, reconhecimento de firma, carimbos e protocolo permanecem manuais; necessidade/obrigatoriedade de campos condicionais por serviço, nomes longos e impressões reais ainda exigem revisão. `FormMapping` segue `DRAFT` e `ServiceDefinition` segue `DRAFT`. Procedimento de revisão: [FASE_04_REVISAO_VISUAL.md](FASE_04_REVISAO_VISUAL.md).

## Continuação de 26/10/2026 — uploads, retomada e isolamento

A Fase 05 agora possui preflight autorizado antes de armazenar o upload em memória, verificação de todas as dimensões das páginas PDF e proteção contra diretório temporário inseguro/symlink. Testes em CI cobrem PDF com segunda página de dimensão excessiva, requisições de outra conta, limpeza de diretórios órfãos e geração inválida sem débito.

Na Fase 07, a interface restaura o job após recarregar a mesma aba, desde que não tenha expirado e pertença à sessão autenticada. **Somente o UUID aleatório é salvo no `sessionStorage`**, nunca nomes, CPF, OCR, anexos ou PDF; o servidor continua sendo autoridade para recuperar os dados.

Na Fase 08, o teste sintético demonstra a autorização por proprietário e o ledger sem desconto quando a emissão falha. Ainda não há reconciliação confiável após crash entre débito e disponibilização do arquivo. E2E em navegador real e verificações de carga são pendências.

Referências: [CI 40433692288](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40433692288), [CI 40433826699](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40433826699). Os serviços oficiais permanecem bloqueados em `DRAFT` até homologação.

## Extração semântica adicional — 26/10/2026

Regras de OCR foram estendidas conservadoramente para TIE (`vessel.name`, `vessel.registration`, `vessel.hullId`), identidades distintas do comprador/vendedor (CPF, nome, RG/identidade, emissor) e comprovantes de residência (`person.address`, `person.postalCode`). Exigem rótulos claros e resultados não ambíguos; todo candidato é `REVIEW_REQUIRED`. A interface mostra a origem em linguagem compreensível. Não inferir titulares do TIE como compradores.

O pipeline e os testes usam exclusivamente amostras fictícias. **Faltam** testes reais com imagens difíceis, medição de confiança, confiabilidade por tipo de documento e suporte a situações documentais variáveis. Referência: [regras técnicas de extração](OCR_EXTRACTION_RULES.md).

## Débito e entrega: proteção após reinício

Debitar o crédito por pacote e criar o recibo de geração agora é uma única transação PostgreSQL. Um download concluído registra o recibo `delivered`; um pacote sem entrega pode gerar reembolso idempotente ao cancelar, expirar ou reiniciar a API. Os recibos contêm apenas identificadores aleatórios e timestamps, não PDFs nem dados de documentos.

**Importante:** o sistema continua sendo de instância única, os testes de falha abrupta real e de confirmação no dispositivo ainda estão pendentes, e a Fase 08 não deve ser considerada homologada para cobranças reais. Consulte [CREDIT_DELIVERY_LIFECYCLE.md](CREDIT_DELIVERY_LIFECYCLE.md).
