# PROJECT_TRACKER.md — Estado operacional do MVP

> Atualização: 28/10/2026. Primeiro serviço: transferência de propriedade de moto aquática. Modelo de créditos avulsos e pacotes; sem assinatura, sem planos empresariais e sem integração oficial com a Marinha.
>
> O histórico anterior completo, incluindo todas as subtarefas, decisões, comandos e execuções de CI, está preservado **sem alteração de bytes** em [PROJECT_TRACKER_HISTORY_2026-10-27.md](PROJECT_TRACKER_HISTORY_2026-10-27.md). Seus registros são históricos; a tabela e o checklist de OCR abaixo corrigem o estado atual. Nenhuma tarefa de outra fase foi removida ou considerada concluída por esta consolidação.

## 0. Protocolo de continuidade

Seguir `AGENTS.md`, `MVP_PLAN.md`, `UI_DESIGN_GUIDE.md` e os catálogos técnicos. Conferir branch, alterações locais e último commit antes de editar; preservar trabalho do usuário. Inspecionar, planejar, implementar a menor alteração coesa, validar e registrar resultados reais. Não inventar testes executados nem marcar fases completas a partir de código escrito.

Os checklists detalhados das fases não alteradas continuam vinculantes no [histórico integral](PROJECT_TRACKER_HISTORY_2026-10-27.md). Atualizar este quadro, o checklist afetado e o registro na mesma entrega. Não sacrificar segurança, privacidade ou revisão humana para fazer a extração funcionar. Não versionar imagens/documentos pessoais, texto OCR ou valores reais. Testes automatizados e CI usam dados fictícios.

A autorização atual inclui consolidar a arquitetura reutilizável de formulários e entendimento de documentos, sem liberar produção, cobrar, homologar PDFs nem publicar dados pessoais. Os portões normativos, visuais e de produção continuam pendentes. Em 27/10, o usuário também solicitou explicitamente console.log dos dados para diagnóstico; a exceção fica restrita ao console do navegador no QA local, sem logs de servidor ou texto OCR bruto.

## 1. Quadro geral de progresso

| Fase | Objetivo | Dependência | Situação |
| --- | --- | --- | --- |
| 00 | Revalidar fundação existente | — | [x] Concluída; evidências anteriores preservadas |
| 01 | Catalogar serviço e modelos exigidos | 00 | [x] Concluída; evidências anteriores preservadas |
| 02 | PDFs oficiais e versões, sem aprovar mapeamento | 01 | [x] Concluída; portão humano anterior preservado |
| 03 | API de catálogo e seleção | 02; liberação real depende de 04 | [x] Concluída; contrato não alterado |
| 04 | Motor reutilizável de preenchimento PDF | 02 | [ ] Parcial — seis mapas em QA; aprovação visual e normativa pendente |
| 05 | Upload seguro e retenção temporária | 00 | [ ] Parcial — uploads opcionais e limites; fuzzing e isolamento pendentes |
| 06 | OCR e extração estruturada | 05 | [ ] Parcial — PaddleOCR é o único motor; identidade, TIE/TIEM e residência usam extração estruturada/semântica; venda ainda usa adaptador legado; corpus amplo pendente |
| 07 | Revisão humana e jornada integrada | 03, 04, 06 | [ ] Parcial — console QA distingue nova extração de recuperação, CI aprovado; E2E/browser/mobile real pendentes |
| 08 | Autenticação e créditos de teste | 07 | [ ] Parcial — sessão e ledger existentes; crash real/multi-instância pendentes |
| 09 | Hardening e homologação ponta a ponta | 08 | [ ] Pendente — segurança, desempenho, UX e homologação integral |
| 10 | Pagamentos reais | 09 e autorização | [ ] Pendente |
| 11 | Infraestrutura de produção | 09 e autorização | [ ] Pendente |
| 12 | Segurança de produção e segredos | 11 | [ ] Pendente |
| 13 | LGPD, políticas e retenção | 09, 11 e revisão responsável | [ ] Pendente |
| 14 | Observabilidade, backup e recuperação | 11, 12 | [ ] Pendente |
| 15 | Carga, capacidade e custos | 11, 14 | [ ] Pendente — auto-tuning OCR implementado; benchmark real de CPU/RAM/latência ainda obrigatório |
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
- [x] Localizar a ausência no retorno de uma nova extração: somente person.cpf e nameStage label_not_detected, conforme console do usuário. Não atribuir o 404 ao OCR sem URL.
- [x] Conferir que o modelo local é o blob oficial de tessdata_fast/4.1.0; comparar com a origem tessdata do pacote Alpine. Implementar instalador com SHA-256 obrigatório, preservando OSD/configs.
- [x] Executar o novo smoke de nome/CPF e hash dentro da imagem final da API em 0°/90°; cinco jobs aprovados no CI [40607708562](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40607708562), commit `3a61d323d03a61746bda942fac91b93a6aff685e`. Não equivale a reteste da foto real.
- [x] Integrar PaddleOCR como motor primário interno, mantendo Tesseract como fallback de disponibilidade e as regras semânticas/revisão humana no backend TypeScript.
- [x] Adicionar página autenticada `/ocr` e item `OCR` ao lado de `Início`, exibindo motor/modelo, tempo, campos interpretados, texto reconhecido, confiança e bounding boxes.
- [x] Validar PaddleOCR real dentro do container final com fixture fictícia e manter smoke do fallback Tesseract; execução CI `40610487883` aprovada nos cinco jobs após fixar PaddlePaddle 3.2.2 devido à regressão CPU/oneDNN observada em 3.3.1.
- [x] Integrar e validar explicitamente o PaddleOCR no fluxo `transferencia-moto-aquatica`: comprador e vendedor permanecem separados, e o diagnóstico da revisão informa `paddleocr`, `tesseract` fallback ou `pdf-text` por documento. CI `40613739310` aprovado nos cinco jobs.
- [x] Confirmar no ambiente Windows/Docker do usuário que PaddleOCR está estável e que o nome do titular passou a ser preenchido no fluxo de Transferência após desabilitar oneDNN e limitar threads.
- [x] Introduzir contratos `DocumentObservation`, `DocumentExtractor`, `FieldEvidence` e `FieldResolver`; migrar identidade para essa fronteira sem depender de ID de serviço.
- [x] Manter campos de revisão derivados dos `FormMapping.placements` dos formulários selecionados, sem lista paralela de campos por serviço.
- [x] Ampliar o extractor transitório de identidade para número do documento e órgão emissor, usando âncoras semânticas/geometria e preservando comprador/vendedor em campos separados.
- [ ] Separar RG e CNH em tipos documentais explícitos após implementar classificação/seleção confiável; o perfil `identity` permanece transitório.
- [x] Migrar TIE e comprovante de residência do adaptador `suggestFields()` para extractors independentes; documento de venda permanece como último consumidor legado.
- [ ] Medir precisão em corpus variado: modelos, perspectiva, inclinação, sombras, reflexos, baixa resolução e nomes em múltiplas linhas. Não anunciar precisão numérica a partir de uma fotografia.
- [ ] Calibrar critérios de confiança e medir falsos positivos/negativos; name_recognized não prova transcrição perfeita nem titularidade.
- [ ] Completar isolamento de decodificadores, limites reais de RAM, fuzzing, carga e comportamento sob interrupção.
- [x] Implementar concorrência OCR adaptativa por CPU: detectar afinidade/quota do container, reservar CPU, dimensionar workers/threads, limitar fila e manter overrides por ambiente. Isso não substitui benchmark nem homologação de capacidade.
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

## 6. Registro de execução — 27/10/2026, paridade do modelo OCR

**Base:** `dde014a895710bfff6081a4bb72a3419f694a471`. A resposta de nova extração fornecida pelo usuário contém somente person.cpf e label_not_detected; não há nome para o frontend preencher. O 404 não identifica recurso e permanece sem causa determinada.

**Evidência:** o arquivo português deste ambiente tem SHA-256 `c4932b937207a9514b7514d518b931a99938c02a28a5a5a553f8599ed58b7deb` e Git blob `e9f373e95c66b4bf557c263721ef31f78e5bc301`, conferido com o repositório oficial tessdata_fast/4.1.0. O pacote Alpine é construído a partir de tessdata. Essa divergência de preparação explica por que não se deveria prometer equivalência dos testes anteriores; ainda não demonstra a causa exata no computador do usuário.

**Arquivos/implementação:** `backend/Dockerfile`, `backend/scripts/install-ocr-model.sh`, `backend/scripts/smoke-ocr-runtime.mjs`, fixture PNG inteiramente fictícia, `.github/workflows/ci.yml`, `docs/OCR_RUNTIME_PARITY.md` e este tracker. Mesmo modelo português com checksum obrigatório no Ubuntu/Alpine; OSD/configs preservados. Novo smoke executa extração real de nome/CPF dentro do container final em 0°/90° e verifica limpeza, papel e REVIEW_REQUIRED. Nenhuma alteração nos filtros de nomes, frontend, contrato HTTP, cadastro, banco ou cobrança.

**Executado localmente:** `sh -n`, `node --check`, hash/blob do modelo, quatro casos do instalador com transporte simulado (download válido, reaproveitamento, checksum inválido preservando destino e limpeza, destino ausente), todos aprovados. Nenhum download real foi simulado como bem-sucedido. Docker não está instalado neste ambiente; clone público também não foi possível por rede, então os arquivos foram lidos e publicados pelo conector.

**CI confirmado e integração:** commit `3a61d323d03a61746bda942fac91b93a6aff685e`, execução [40607708562](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40607708562), completed/success. Cinco jobs aprovados, incluindo o passo `Verify real OCR inside the built API container` do job Compose (`122551236075`): modelo verificado e extração sintética 0°/90° com nome/CPF corretos. PR [3](https://github.com/matheusdebrito/preenchimento-automatico/pull/3) integrado à main em `25e64ffbcd0157a00ee4b4af413eb2f0e6b1ab6f`. Este registro posterior é somente documental, sem modificar o código testado.

**Ainda pendente:** reteste da foto no ambiente do usuário e navegador. Sem nova afirmação de que o nome do usuário já aparece. A foto anexada não é tratada como idêntica ao original do repositório. O CI não usa documentos pessoais e não demonstra precisão em corpus amplo.

**Operação:** atualizar a main e reconstruir somente a API. O modelo é instalado no build; editar TypeScript sem rebuild não troca traineddata. Comandos e limites em [paridade OCR](docs/OCR_RUNTIME_PARITY.md). A revisão humana continua obrigatória.


## 7. Registro de execução — 27/10/2026, PaddleOCR e página de inspeção

**Base:** `3a214b40d02f99250dc40bce6084f64fea1d37b1`; branch `feat/paddle-ocr-inspector`; PR 4.

**Arquitetura:** criado serviço interno Python para PaddleOCR, sem porta publicada no host. O Compose fornece `PADDLE_OCR_URL=http://ocr:8000` somente à API. O fluxo normal tenta Paddle primeiro e mantém o Tesseract existente como fallback quando o sidecar estiver indisponível. As regras de identificação de CPF/nome, separação comprador/vendedor e revisão obrigatória permanecem no backend TypeScript. O serviço Paddle não registra texto/documentos e remove o arquivo temporário após cada inferência.

**Página de diagnóstico:** nova rota `/ocr`, acessível pelo item **OCR** imediatamente após **Início**. O endpoint autenticado `POST /api/ocr/inspect/:source` aceita JPG/PNG/PDF dentro dos limites existentes, valida PDF antes da decodificação e retorna somente ao usuário autenticado: engine, versão, modelo, tempo, campos semânticos e linhas reconhecidas com confiança/coordenadas. A tela alerta sobre dados sensíveis e não persiste o upload.

**Versões:** `paddleocr==3.7.0`, `paddlepaddle==3.2.2`, PP-OCRv6, português, CPU. A tentativa inicial com PaddlePaddle 3.3.1 construiu/subiu, mas falhou na inferência CPU/oneDNN com `ConvertPirAttribute2RuntimeAttribute ... ArrayAttribute<DoubleAttribute>`; a versão foi fixada em 3.2.2 e a inferência passou no container.

**Validação:** execução CI `40610487883`, commit `7875edf74d9b98c84672eb64de22334844fd5b7c`, todos os cinco jobs aprovados. Backend: typecheck, lint, testes e build. Frontend: typecheck, lint, testes e build. PostgreSQL e PDFs aprovados. Compose: build/start/health/proxy aprovados; `Verify PaddleOCR inside the built OCR container` reconheceu nome e CPF da fixture fictícia; `Verify Tesseract fallback inside the built API container` também passou. Nenhum documento pessoal faz parte do CI.

**Riscos residuais:** sucesso da fixture não comprova que PaddleOCR resolverá a fotografia real nem mede precisão. Ainda é obrigatório retestar a imagem do usuário na nova página, avaliar perspectiva/reflexo/desfoque/nomes multilinha e calibrar falsos positivos/negativos antes de qualquer homologação. O primeiro build do serviço inclui modelos no image layer e aumenta substancialmente tamanho/tempo de build e consumo de memória; capacidade ainda precisa ser medida.


## 8. Registro de execução — 27/10/2026, PaddleOCR no serviço de Transferência

**Base:** `35e0bc2cf85a25c2dcec5b2aac35ef8fcf8884fe`; branch `feat/transferencia-paddle-observability`; PR 5.

**Implementação:** o serviço `transferencia-moto-aquatica` usa o caminho global de extração com PaddleOCR como motor primário. O backend agora retorna também o motor efetivamente utilizado em cada documento: `paddleocr`, `tesseract` (fallback) ou `pdf-text` quando o PDF possui camada textual suficiente. A tela de revisão exibe essa informação no diagnóstico por documento, sem armazenar texto OCR adicional.

**Mapeamento de identidade:** testes específicos confirmam que identidade do comprador alimenta apenas `person.fullName`/`person.cpf` e identidade do vendedor alimenta apenas `seller.fullName`/`seller.cpf`, usando o texto estruturado produzido pelo Paddle e mantendo os papéis separados.

**Validação:** CI `40613739310` concluído com sucesso nos cinco jobs: backend, frontend, PostgreSQL, PDFs e Compose. O Compose construiu e iniciou a stack, executou PaddleOCR dentro do container final e validou também o fallback Tesseract. O primeiro CI da branch encontrou somente uma expectativa antiga de diagnóstico que não incluía o novo campo `engine`; o contrato de teste foi atualizado e a segunda execução passou integralmente.

**Pendente:** testar no navegador com os documentos reais usados pelo usuário na Transferência. O CI usa apenas dados/fixtures sintéticos e não constitui medição de precisão nem homologação documental.


## 9. Registro de execução — 27/10/2026, OCR Paddle-only na Transferência

**Motivo:** no fluxo real de `transferencia-moto-aquatica`, o PaddleOCR conseguia reconhecer o nome, mas a aplicação ainda convertia a resposta estruturada para texto e dependia de regras herdadas do parser Tesseract para preencher `person.fullName`/`seller.fullName`.

**Correção:** PaddleOCR passa a ser o único motor de OCR dos documentos semânticos. O backend usa diretamente linhas, bounding boxes, ordem e confiança do Paddle para identidade, mantendo comprador e vendedor separados. O reconhecimento aceita nome abaixo/à direita do rótulo, nome quebrado em múltiplas linhas, ausência de caixas e uma pequena falha OCR no rótulo `NOME`; rótulos de filiação e nome social continuam bloqueados.

**Removido:** fallback Tesseract, implementação TSV/OSD antiga, testes Tesseract, modelo `por.traineddata`, ImageMagick usado pelo pipeline antigo e dependências Tesseract do container da API/CI. `poppler-utils` permanece apenas para validação segura de PDFs via `pdfinfo`, não como OCR.

**Segurança:** todo valor extraído continua `REVIEW_REQUIRED`; nenhuma evidência textual adicional é persistida e documentos permanecem temporários.

**Validação:** PR 6. Backend/frontend unitários e builds passaram no CI após remoção das dependências antigas. Validação final Docker/Paddle e PostgreSQL registrada no mesmo PR antes do merge.


## 10. Registro de execução — 27/10/2026, arquitetura de entendimento de documentos

**Decisão arquitetural:** serviços deixam de ser tratados como fonte de campos. Os campos necessários continuam derivados dos mapeamentos dos formulários selecionados via `ServiceForm -> FormVersion -> FormMapping.placements`. Requisitos de documentos passam a declarar apenas um perfil semântico reutilizável de extração e o papel do sujeito; regras OCR não pertencem ao serviço.

**Implementado:** camada `backend/src/modules/document-understanding/` com `DocumentObservation`, `DocumentExtractor`, `FieldEvidence`, conversão da resposta Paddle para observação neutra, extractor de identidade, registry e `FieldResolver`. O fluxo `/api/jobs/:id/extract` usa evidências canônicas e resolve divergências de forma centralizada. Evidências discordantes não escolhem valor automaticamente.

**Migração incremental:** identidade foi migrada para o novo extractor. TIE, comprovante de residência e documento de venda permanecem temporariamente no adaptador rotulado legado para não quebrar o MVP. O arquivo `docs/DOCUMENT_UNDERSTANDING_ARCHITECTURE.md` e o `AGENTS.md` proíbem adicionar novos tipos a `suggestFields()`.

**Limite atual:** o requisito “identidade” ainda não distingue RG de CNH. Não há classificador documental homologado; portanto o sistema não deve inferir silenciosamente o tipo. A próxima evolução é classificação/seleção explícita e extractors individuais para RG/CNH, seguida de TIE, CHA e CIR.

**Validação:** testes unitários novos cobrem evidências de nome/CPF, separação comprador/vendedor e conflitos entre fontes. CI completo deve ser registrado após execução do último commit; até lá esta mudança está implementada, mas não declarada validada integralmente.

**Segurança/privacidade:** evidências continuam temporárias e `REVIEW_REQUIRED`; não são persistidas em banco, logs ou analytics. A arquitetura não altera os portões de homologação dos PDFs nem transforma OCR em prova de autenticidade.


## 11. Registro de execução — 27/10/2026, número da identidade e órgão emissor

**Escopo:** ampliar somente o `identityDocumentExtractor`, sem adicionar regras ao serviço nem ao parser legado. Os campos já existiam no catálogo e nos mapeamentos: `person.identity`/`person.issuer` e `seller.identity`/`seller.issuer`.

**Implementado:** reconhecimento conservador de rótulos como `RG`, `REGISTRO GERAL`, `IDENTIDADE`, `ÓRGÃO EMISSOR`, `ÓRGÃO EXPEDIDOR`, `EMISSOR` e `EXPEDIDOR`. O valor pode estar na mesma linha, à direita ou abaixo do rótulo. Número de identidade exige presença de dígitos e formato limitado; CPF válido e datas são rejeitados como número de identidade. Órgão emissor exige conteúdo textual plausível e resultados divergentes não são escolhidos silenciosamente.

**Arquitetura:** a extração continua independente de serviço e formulário. O papel semântico do requisito define apenas se as evidências alimentam `person.*` ou `seller.*`; os campos efetivamente exibidos continuam filtrados pelos mapeamentos dos formulários selecionados.

**Validação:** testes sintéticos adicionados para comprador, vendedor, rótulos inline, valores abaixo do rótulo, rejeição de CPF/data e ambiguidade de órgão emissor. CI completo deve ser registrado após execução do último commit; até lá a alteração está implementada, mas não declarada validada integralmente.

**Limite:** o perfil ainda é `identity`, não um `RgExtractor` específico. A separação RG/CNH continua pendente para evitar inferência silenciosa do tipo documental.


## 12. Registro de execução — 27/10/2026, simplificação para um único motor

**Decisão de produto/domínio:** o MVP passa a trabalhar com apenas um motor. O rótulo impresso `Motor/Marca` representa somente a **marca do motor**, mapeada em `vessel.motorBrand`. Potência e número de série permanecem separados em `vessel.motorPower` e `vessel.motorSerial`.

**Removido do domínio ativo:** `vessel.motor1Choice`, `vessel.motor2Choice`, `vessel.motor3Choice`, `vessel.motor4Choice` e todos os campos `motor2*`, `motor3*`, `motor4*`. O mapeamento da autorização de transferência mantém apenas o conjunto único de marca/potência/série do primeiro bloco.

**Impacto no mapeamento:** `autorizacao-transferencia-ma-v1` passa de 42 para 25 posições ativas, e o total documentado dos seis formulários passa de 135 para 118 posições. Isso não representa homologação do PDF; o mapeamento continua DRAFT e sujeito à revisão visual/normativa.

**Regra de evolução:** suporte futuro a múltiplos motores exige nova decisão arquitetural e deve preferir uma coleção estruturada de motores em vez de reintroduzir campos numerados espalhados pelo domínio.

**Validação:** teste de catálogo impede a reintrodução acidental dos campos numerados de motor no MVP. CI completo deve ser registrado após a execução do último commit.


## 13. Registro de execução — 27/10/2026, TIE, comprovante de residência e fast-path de PDF

**Motivo:** após a migração arquitetural e a simplificação para um único motor, a `main` continha uma falha de lint no extractor de identidade e dois testes ainda acoplados aos antigos quatro motores. Além disso, TIE e comprovante de residência continuavam usando o parser textual legado, inadequado para os modelos realistas adicionados em `documentos/`.

**Correção da base:** removida a expressão regular com escape desnecessário e atualizados os testes de mapeamento/validação para o domínio de um único motor. Nenhuma regra de múltiplos motores foi reintroduzida.

**Entendimento estruturado:** adicionados `TieDocumentExtractor` e `ResidenceProofDocumentExtractor`, ambos sobre `DocumentObservation`. TIE produz evidências para inscrição, nome da embarcação, casco/HIN/CIN, ano, comprimento, lotação, marca, potência, série do motor e autoridade quando os rótulos/formatos permitem. Comprovante produz CEP, logradouro, número, complemento, bairro, cidade e UF. O comprovante não preenche `person.fullName`, pois o titular da conta não é prova suficiente de que seja a pessoa do processo.

**Otimização conservadora:** PDFs de TIE, comprovante e documento de venda tentam primeiro `pdftotext -bbox-layout` para gerar a mesma representação espacial. A rota rápida é recusada quando a camada textual é ausente/pobre e então o fluxo usa PaddleOCR. Identidades continuam no Paddle para não alterar o comportamento já conferido no RG real.

**Regressão com documentos de referência:** os dois modelos de TIE e o comprovante presentes em `documentos/` foram incorporados a um teste de integração que nunca imprime texto OCR nem valores extraídos; somente motor utilizado, tempo, páginas, quantidade de linhas e IDs canônicos encontrados. O objetivo é impedir que uma otimização futura torne a leitura mais rápida sacrificando os campos centrais.

**Validação:** backend e frontend já passaram em typecheck, lint, testes unitários e build na branch. A integração real com Paddle/Poppler e o smoke do Compose devem ser registrados após o CI final desta entrega.


## 14. Registro de execução — 28/10/2026, capacidade OCR adaptativa

**Motivo:** o serviço PaddleOCR possuía um `OCR_LOCK` global que serializava toda inferência, enquanto a API rejeitava acima de duas extrações simultâneas. A máquina podia possuir mais vCPUs sem que o OCR aproveitasse essa capacidade.

**Implementado:** novo `ocr-service/tuning.py` detecta CPUs efetivamente disponíveis por afinidade e quota de cgroup, reserva 1 CPU em máquinas até 4 vCPU e 2 CPUs acima disso, limita o modo automático a no máximo 4 workers e distribui até 4 threads por worker. Cada worker possui uma instância PaddleOCR própria; nenhuma instância é usada simultaneamente por duas requisições. O serviço mantém fila limitada por semáforo e devolve `429 ocr_busy` quando a capacidade total ativa+espera estiver esgotada.

**Coordenação com a API:** `backend/src/modules/jobs/ocr.ts` calcula um limite de requisições OCR em voo a partir da mesma política de workers, com override `OCR_MAX_CONCURRENT`. O objetivo é manter o pool alimentado sem permitir acúmulo ilimitado no processo Node.

**Operação:** `compose.yaml` e `.env.example` aceitam `OCR_RESERVED_CPUS`, `OCR_MAX_WORKERS`, `OCR_WORKERS`, `OCR_CPU_THREADS`, `OCR_QUEUE_DEPTH` e `OCR_MAX_CONCURRENT`. O endpoint interno `/health` do OCR expõe somente capacidade calculada, sem texto ou dados documentais. O smoke test valida esses metadados e a inferência repetida.

**Testes adicionados:** testes unitários Python cobrem perfis automáticos de 2/4/8/12/16 CPUs, overrides e preservação de ao menos uma CPU utilizável; teste TypeScript cobre o limite adaptativo da API. O CI passa a executar o teste puro de tuning antes de construir o PaddleOCR e corrige a detecção de alterações para o arquivo real `compose.yaml`.

**Ainda não verificado:** benchmark de throughput e consumo real de RAM/CPU em VPS de 4/8/12+ vCPU, comportamento sob dezenas de uploads simultâneos, limites de memória do container e perfil ótimo por modelo de CPU. Portanto a Fase 15 permanece pendente e nenhuma quantidade de usuários simultâneos é homologada por esta entrega.


## 15. Registro de execução — 28/10/2026, aproveitamento curado dos JSONs de âncoras

**Origem:** o usuário adicionou `documentos/ancoras/` com referências para CHA, CIN, CIR, CNH, RG antigo, TIE digital e TIEM antigo. CIN é tratada no produto como integrante da família de identidade, sem presumir um número de RG separado do CPF.

**Decisão arquitetural:** os JSONs não são configuração executável. Eles permanecem como fonte documental e somente conhecimento explicitamente revisado é promovido para o código. Isso impede que novos campos adicionados ao JSON alterem silenciosamente o domínio, reintroduzam múltiplos motores ou coletem dados pessoais desnecessários.

**Promovido:** aliases de nome de titular em CIN/CNH, data de emissão/expedição, nacionalidade, naturalidade, órgão expedidor bilíngue, aliases adicionais TIE/TIEM para inscrição, ano, comprimento, casco e atividade, além de preferência de direção `below/right` no mecanismo semântico. O CPF continua dependente de validação e unicidade.

**Descartado nesta entrega:** fuzzy matching global, motores 2–4, dados opcionais da CIN, campos de CNH sem uso atual, proprietário do TIE/TIEM como comprador, hipoteca/alienação, CIR parcialmente confirmado e quaisquer IDs sem correspondência segura no catálogo canônico.

**Segurança semântica:** CPF da CIN não é copiado automaticamente para `person.identity`; proprietário do documento náutico não é convertido em comprador; valores divergentes continuam ambíguos e sujeitos a revisão humana.

**Testes adicionados:** regressões sintéticas de CIN/CNH/RG e TIE/TIEM cobrem aliases promovidos, prioridade de direção e ausência de promoção de campos descartados. A validação integral depende do CI do PR desta entrega; não considerar homologado antes do último commit aprovado.

**Documentação:** ver `docs/ANCHOR_PROFILES_CURATED_USAGE.md` e `docs/DOCUMENT_UNDERSTANDING_ARCHITECTURE.md`.
