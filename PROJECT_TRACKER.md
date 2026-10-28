# PROJECT_TRACKER.md — Estado operacional do MVP

> Atualização: 27/10/2026. Primeiro serviço: transferência de propriedade de moto aquática. Modelo de créditos avulsos e pacotes; sem assinatura, sem planos empresariais e sem integração oficial com a Marinha.
>
> O histórico anterior completo, incluindo todas as subtarefas, decisões, comandos e execuções de CI, está preservado **sem alteração de bytes** em [PROJECT_TRACKER_HISTORY_2026-10-27.md](PROJECT_TRACKER_HISTORY_2026-10-27.md). Seus registros são históricos; a tabela e o checklist de OCR abaixo corrigem o estado atual. Nenhuma tarefa de outra fase foi removida ou considerada concluída por esta consolidação.

## 0. Protocolo de continuidade

Seguir `AGENTS.md`, `MVP_PLAN.md`, `UI_DESIGN_GUIDE.md` e os catálogos técnicos. Conferir branch, alterações locais e último commit antes de editar; preservar trabalho do usuário. Inspecionar, planejar, implementar a menor alteração coesa, validar e registrar resultados reais. Não inventar testes executados nem marcar fases completas a partir de código escrito.

Os checklists detalhados das fases não alteradas continuam vinculantes no [histórico integral](PROJECT_TRACKER_HISTORY_2026-10-27.md). Atualizar este quadro, o checklist afetado e o registro na mesma entrega. Não sacrificar segurança, privacidade ou revisão humana para fazer a extração funcionar. Não versionar imagens/documentos pessoais, texto OCR ou valores reais. Testes automatizados e CI usam dados fictícios.

A autorização atual é corrigir a extração do nome e reproduzir a falha no material fornecido, não liberar produção, cobrar, homologar PDFs nem publicar dados pessoais. Os portões normativos, visuais e de produção continuam pendentes. Em 27/10, o usuário também solicitou explicitamente console.log dos dados para diagnóstico; a exceção fica restrita ao console do navegador no QA local, sem logs de servidor ou texto OCR bruto.

## 1. Quadro geral de progresso

| Fase | Objetivo | Dependência | Situação |
| --- | --- | --- | --- |
| 00 | Revalidar fundação existente | — | [x] Concluída; evidências anteriores preservadas |
| 01 | Catalogar serviço e modelos exigidos | 00 | [x] Concluída; evidências anteriores preservadas |
| 02 | PDFs oficiais e versões, sem aprovar mapeamento | 01 | [x] Concluída; portão humano anterior preservado |
| 03 | API de catálogo e seleção | 02; liberação real depende de 04 | [x] Concluída; contrato não alterado |
| 04 | Motor reutilizável de preenchimento PDF | 02 | [ ] Parcial — seis mapas em QA; aprovação visual e normativa pendente |
| 05 | Upload seguro e retenção temporária | 00 | [ ] Parcial — uploads opcionais e limites; fuzzing e isolamento pendentes |
| 06 | OCR e extração estruturada | 05 | [ ] Parcial — correção anterior passou no CI; usuário ainda relata nome vazio no formulário; diagnóstico local adicionado |
| 07 | Revisão humana e jornada integrada | 03, 04, 06 | [ ] Parcial — console QA distingue nova extração de recuperação, CI aprovado; E2E/browser/mobile real pendentes |
| 08 | Autenticação e créditos de teste | 07 | [ ] Parcial — sessão e ledger existentes; crash real/multi-instância pendentes |
| 09 | Hardening e homologação ponta a ponta | 08 | [ ] Pendente — segurança, desempenho, UX e homologação integral |
| 10 | Pagamentos reais | 09 e autorização | [ ] Pendente |
| 11 | Infraestrutura de produção | 09 e autorização | [ ] Pendente |
| 12 | Segurança de produção e segredos | 11 | [ ] Pendente |
| 13 | LGPD, políticas e retenção | 09, 11 e revisão responsável | [ ] Pendente |
| 14 | Observabilidade, backup e recuperação | 11, 12 | [ ] Pendente |
| 15 | Carga, capacidade e custos | 11, 14 | [ ] Pendente |
| 16 | Homologação pré-lançamento | 10–15 | [ ] Pendente |
| 17 | Lançamento controlado | 16 e autorização | [ ] Pendente |
| 18 | Expansão de serviços | 17 e decisão | [ ] Pendente |

**Correção de estado:** a marcação anterior de Fase 06 como concluída devido ao fallback por coordenadas fixas era incompatível com os testes e com as pendências do próprio checklist. O estado correto é **Parcial**. A reprodução anterior no núcleo e o CI de código não comprovam resolução no ambiente do usuário, que voltou a relatar nome vazio no formulário. Os formulários e o serviço de produção permanecem DRAFT; QA local mantém AMOSTRA e revisão explícita.

## 2. Checklists preservados das outras fases

Fases 00–05: seguir os [checklists completos anteriores](PROJECT_TRACKER_HISTORY_2026-10-27.md#fase-00--revalidar-a-fundação-existente), preservando o portão humano de mapeamento e os requisitos de upload seguro.

Fases 07–09: seguir a [revisão integrada e suas pendências](PROJECT_TRACKER_HISTORY_2026-10-27.md#fase-07--revisão-e-integração-do-wizard), autenticação, créditos e hardening. Nenhuma mudança atual aprova E2E real, pagamentos ou isolamento completo.

Fases 10–18 e expansão: todos os critérios, dependências e autorizações anteriores permanecem no [plano histórico completo](PROJECT_TRACKER_HISTORY_2026-10-27.md). Não avançar de fase apenas por esta correção.

## 3. Fase 06 — checklist atual

As evidências históricas de PDF nativo, rasterização, CPF, TIE, endereço, venda, mapeamento, conflitos e diagnósticos continuam no [checklist anterior](PROJECT_TRACKER_HISTORY_2026-10-27.md#fase-06--pdf-textual-ocr-e-extração-estruturada). Os marcos antigos de leitura de identidade descrevem implementações substituídas pela correção atual, não o algoritmo vigente.

- [x] Reproduzir a falha de orientação e associação do nome no núcleo do OCR, sem publicar informações pessoais.
- [x] Remover a caixa fixa de pixels e integrar normalização EXIF/rotações ortogonais, OSD e TSV de duas segmentações na mesma imagem.
- [x] Associar NOME à linha correspondente por geometria relativa; comparar candidatos completos sem eliminar silenciosamente sobrenomes de baixa confiança.
- [x] Rejeitar candidatos fortes conflitantes, rótulos de filiação/social e pistas contraditórias entre leituras; preservar papéis comprador/vendedor e REVIEW_REQUIRED.
- [x] Executar localmente 18 testes de associação/limites e 3 integrações com Tesseract e imagens sintéticas: 21 aprovados.
- [x] Reproduzir o caso fornecido nas quatro rotações ortogonais; nome completo conferido contra referência visual privada, CPF retornado, diagnóstico name_recognized e limpeza de temporários confirmados.
- [x] Verificar TypeScript estrito dos módulos alterados em isolamento; posteriormente confirmar typecheck completo no CI de Node 24.
- [x] Configurar dependências de orientação/rasterização em Docker e CI; adicionar testes de integração sem fixture pessoal.
- [x] Confirmar o CI completo do commit de código `401f3da`: backend, frontend, PostgreSQL, Compose e PDF aprovados na execução [40584518041](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40584518041).
- [x] Adicionar console.log solicitado pelo usuário para fields/sources/diagnostics antes de entregar os dados ao formulário, somente em loopback com nameStage de QA; distinguir recuperação sem nova leitura. TypeScript isolado e 17 cenários locais com fetch simulado aprovados.
- [x] Confirmar no CI os 24 casos de `api.ocr-console.test.ts` (73 testes frontend no total), typecheck, lint e build, além dos demais jobs: execução [40606288813](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40606288813), commit `71a636a`, completed/success.
- [ ] Conferir o fluxo completo no navegador e o ambiente Windows/Docker do usuário; investigar a resposta real da API e o campo ainda vazio.
- [ ] Medir precisão em corpus variado: modelos, perspectiva, inclinação, sombras, reflexos, baixa resolução e nomes em múltiplas linhas. Não anunciar precisão numérica a partir de uma fotografia.
- [ ] Calibrar critérios de confiança e medir falsos positivos/negativos; name_recognized não prova transcrição perfeita nem titularidade.
- [ ] Completar isolamento de decodificadores, limites reais de CPU/RAM, fuzzing, carga e comportamento sob interrupção.
- [ ] Homologar o OCR junto ao restante do serviço sem remover revisão humana nem confundir qualidade OCR com aprovação dos formulários.

**Aceite:** extração rastreável, resultados conservadores e falhas tratadas; confiança medida e revisão humana preservada. A fase continua aberta.

## 4. Registro de execução — 27/10/2026, correção do nome

**Base:** commit `17d65bfbb26ef6348a2bf69b95563124894b93d7`; branch `fix/ocr-nome-orientacao`; implementação `401f3da3b9c73c4f2ff2980ef01945d4a127fc2b`, [PR 2](https://github.com/matheusdebrito/preenchimento-automatico/pull/2).

**Arquivos:** `backend/src/modules/jobs/identity-ocr.ts`, `ocr.ts`, dois novos arquivos de testes, `backend/Dockerfile`, `.github/workflows/ci.yml`, esta consolidação do tracker e `docs/OCR_IDENTITY_FIX_2026-10-27.md`. O tracker anterior foi preservado integralmente no arquivo histórico da raiz, mantendo seus links relativos. Nenhuma migração, alteração de dependência npm/lockfile, mudança de formulário ou publicação de material pessoal.

**Implementado:** normalização de orientação, associação espacial PSM 11/6, rejeição de ambiguidades/filiação, orçamento por imagem e limpeza; ImageMagick e dados OSD no ambiente. O caminho antigo por número de campos não escolhe mais os candidatos de nome de imagens.

**Testado localmente:** Linux, Node 22.16.0, Tesseract 5.5.0. TypeScript estrito isolado. Testes transpilados, usando adaptador de runner Vitest → node:test apenas para execução local: 21/21 aprovados. O núcleo foi também executado na imagem fornecida em quatro rotações: nome correto, CPF retornado e nenhum temporário remanescente. Resultados compartilhados omitem valores pessoais.

**CI confirmado:** execução [40584518041](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40584518041), commit `401f3da`, status completed/success. Os cinco jobs passaram: checks backend, checks frontend, postgres-integration, compose-smoke e pdf-mapping-visual. Backend executou npm ci, auditoria, typecheck, lint, testes e build com Node 24; o job de integração executou os testes com PostgreSQL e as ferramentas OCR reais. O Compose construiu e iniciou a stack e validou saúde/proxy/autorização. O job de PDF gerou e verificou amostras, sem aprovar visualmente os formulários.

**Ainda não verificado:** navegador e Windows/Docker da máquina do usuário, precisão de corpus amplo, isolamento/carga e homologação. A conclusão do CI não comprova esses itens. A atualização posterior deste registro é somente documental, sem modificar os arquivos de código validados.

**Riscos/próximo passo (registro histórico):** revisar/integrar o PR; reconstruir a imagem da API uma vez pelas novas ferramentas; depois usar o testador que importa TypeScript local sem rebuild a cada alteração. Avaliar nomes multilinha e corpus amplo. Limites de cache do ImageMagick não equivalem a sandbox de processo. O PR 2 foi posteriormente integrado em `cf7ced32d642c6526f5909378bfad5650eb623bb`; isso não confirma a versão executada na máquina do usuário.

**Documento técnico vigente:** [correção de OCR de identidade](docs/OCR_IDENTITY_FIX_2026-10-27.md). As descrições do caminho antigo no README e no histórico de OCR devem ser interpretadas como anteriores a esta correção.

## 5. Registro de execução — 27/10/2026, console de diagnóstico solicitado

**Base:** `cf7ced32d642c6526f5909378bfad5650eb623bb`, main. O usuário continua sem visualizar o nome e pediu um console.log simples; esta entrega adiciona instrumentação, não declara nova correção da leitura.

**Arquivos:** `frontend/src/lib/api.ts`, `frontend/src/lib/api.ocr-console.test.ts`, `docs/QA_OCR_CONSOLE.md` e este tracker. Nenhuma alteração de backend, contrato, extração, imagem, banco ou dependência.

**Implementado:** no retorno bem-sucedido de POST extract ou GET job, imprimir snapshot JSON de fields/sources/diagnostics antes do preenchimento. Apenas localhost/127.0.0.1/[::1] com diagnóstico de identidade nameStage emitido pelo QA do servidor. GET é identificado como recuperação, possivelmente com edições manuais. Sem requisições adicionais, sem persistência em storage/servidor e sem imprimir identificadores, erros, documentos, tokens ou texto OCR bruto. Os valores dos campos são visíveis no console por solicitação explícita; usar dados fictícios e não publicar capturas com informações reais.

**Validação local:** `tsc --target ES2023 --module ESNext --strict --noUncheckedIndexedAccess --lib ES2023,DOM` sobre o módulo real; 17 testes com node:test, fetch simulado e o módulo compilado, todos aprovados. Cobrem retorno preservado, nova extração, recuperação, nome ausente, hosts locais/remotos, QA desligado, payload malformado, HTTP 503 e ambiente sem window. As dependências npm/rede não estavam disponíveis localmente; Vitest foi executado pelo CI. Browser real, Docker local e reconhecimento da foto não foram retestados nesta entrega.

**CI da entrega:** implementação `ba174e0`; primeiro CI [40606175520](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40606175520) apontou dois erros no-unexpected-multiline no teste novo, corrigidos em `71a636a1ae1364747433879864eeea83fecf3ad6`. O CI [40606288813](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40606288813) desse último commit terminou completed/success. Frontend: typecheck, lint (sem erros; aviso anterior em AuthProvider.tsx), 24 testes novos e 73 no total aprovados, build aprovado. Backend, PostgreSQL, Compose e amostras PDF também aprovados. A atualização final deste tracker é exclusivamente documental e não altera o código validado.

**Operação e limites:** ver [QA do console OCR](docs/QA_OCR_CONSOLE.md). Atualizar somente o frontend para receber o log; não reconstruir a API por causa desta instrumentação. O log mostra os campos processados devolvidos pela API, não todo texto reconhecido pelo Tesseract. Resultado recuperado não equivale a nova análise. Falha de extração no ambiente do usuário permanece em investigação.
