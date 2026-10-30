# PROJECT_TRACKER.md — Estado operacional do MVP

> Atualização: 29/10/2026. Matriz serviço -> formulário auditada contra as NORMAM-211/212 anexadas pelo usuário. Fluxos de barco homologados preservados; inscrição para exame de amador voltou a DRAFT por ausência de exigência expressa do 5-H no item 5.4.1; matriz de Moto Aquática foi completada, mas permanece bloqueada enquanto seus seis mapeamentos PDF estiverem DRAFT. Modelo de créditos avulsos e pacotes; sem assinatura, sem planos empresariais e sem integração oficial com a Marinha.
>
> O histórico anterior completo, incluindo todas as subtarefas, decisões, comandos e execuções de CI, está preservado **sem alteração de bytes** em [PROJECT_TRACKER_HISTORY_2026-10-27.md](PROJECT_TRACKER_HISTORY_2026-10-27.md). Seus registros são históricos; a tabela e o checklist de OCR abaixo corrigem o estado atual. Nenhuma tarefa de outra fase foi removida ou considerada concluída por esta consolidação.

## 0. Protocolo de continuidade

Seguir `AGENTS.md`, `MVP_PLAN.md`, `UI_DESIGN_GUIDE.md` e os catálogos técnicos. Conferir branch, alterações locais e último commit antes de editar; preservar trabalho do usuário. Inspecionar, planejar, implementar a menor alteração coesa, validar e registrar resultados reais. Não inventar testes executados nem marcar fases completas a partir de código escrito.

Os checklists detalhados das fases não alteradas continuam vinculantes no [histórico integral](PROJECT_TRACKER_HISTORY_2026-10-27.md). Atualizar este quadro, o checklist afetado e o registro na mesma entrega. Não sacrificar segurança, privacidade ou revisão humana para fazer a extração funcionar. Não versionar imagens/documentos pessoais, texto OCR ou valores reais. Testes automatizados e CI usam dados fictícios.

A autorização atual inclui consolidar a arquitetura reutilizável, auditar os PDFs contra as NORMAM-211/212 completas fornecidas pelo usuário e evoluir OCR/document understanding, sem liberar produção, cobrar ou publicar dados pessoais. A auditoria revogou a antiga aprovação do 3-C incorreto; os portões de produção continuam vinculantes. Em 27/10, o usuário também solicitou explicitamente console.log dos dados para diagnóstico; a exceção fica restrita ao console do navegador no QA local, sem logs de servidor ou texto OCR bruto.

## 1. Quadro geral de progresso

| Fase | Objetivo | Dependência | Situação |
| --- | --- | --- | --- |
| 00 | Revalidar fundação existente | — | [x] Concluída; evidências anteriores preservadas |
| 01 | Catalogar serviço e modelos exigidos | 00 | [x] Concluída; evidências anteriores preservadas |
| 02 | PDFs oficiais e versões, sem aprovar mapeamento | 01 | [x] Concluída; portão humano anterior preservado |
| 03 | API de catálogo e seleção | 02; liberação real depende de 04 | [x] Concluída; contrato não alterado |
| 04 | Motor reutilizável de preenchimento PDF | 02 | [ ] Parcial — 7 mapas NORMAM-211 APPROVED; 3-C corrigido voltou a DRAFT; 6 mapas NORMAM-212 ainda DRAFT |
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
| 18 | Expansão de serviços | 17 e decisão | [ ] Parcial — matriz serviço/formulário auditada contra NORMAM-211/212; 7 serviços de barco ativos, alterações seguem DRAFT com 3-C restrito aos casos previstos no item 2.12.1, inscrição para exame de amador voltou a DRAFT, matriz de Moto Aquática completa mas bloqueada por mapeamentos DRAFT e QA manual pendente |

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

## 3.0.1. Auditoria normativa de 29/10/2026

A NORMAM-211/DPC e a NORMAM-212/DPC completas foram incorporadas como fonte
primária da revisão. A auditoria corrigiu três premissas antigas:

- Anexo 3-C da NORMAM-211 = Termo de Responsabilidade de Construção/Alteração;
- BSADE é usado para embarcação miúda (até 6 m); acima de 6 m o fluxo usa BADE;
- perda/roubo/extravio do TIE digital ou da CHA digital não deve ser exposto como
  uma “segunda via” autônoma quando a própria norma direciona para impressão/renovação.

Também foram identificadas referências internas inconsistentes na própria publicação
(2-L/2-K e 3-D/2-C, entre outras). O produto seguirá o título e conteúdo do anexo
efetivamente publicado e registrará a divergência, sem inventar numeração.


A segunda revisão de 29/10/2026 fechou a matriz serviço -> formulário:
- renovação TIE/TIEM usa 2-C e só inclui BADE/BSADE quando houve alteração;
- perda/extravio adiciona 2-H; transferência de propriedade usa 2-C + BADE/BSADE + autorização;
- o 3-C só é associado, no fluxo do item 2.12.1, quando houver estaleiro comprovadamente extinto ou construção artesanal; os serviços permanecem DRAFT;
- adaptação de embarcação miúda a remo para motor registra a Declaração do Responsável Técnico como documento de apoio;
- inscrição para exame ARA/MSA/CPA voltou a DRAFT porque o item 5.4.1 não exige expressamente o 5-H;
- a matriz NORMAM-212 foi completada para todos os serviços equivalentes, mas não entra no catálogo ativo enquanto os mapeamentos de Moto Aquática permanecerem DRAFT.

Relatório: `docs/NORMAM_SOURCE_AUDIT_2026-10-29.md`.

## 3.1. Fase 18 — checklist atual de expansão NORMAM-211

A decisão de produto para os serviços de embarcações foi dada pelo usuário em
28/10/2026. Isso autoriza catalogar e preparar os fluxos, mas não remove os
gates normativos, visuais e de produção.

- [x] Definir os nove serviços de embarcações aprovados para a aplicação.
- [x] Identificar os anexos NORMAM-211/DPC 2026 em fontes oficiais e manter IDs lógicos independentes da numeração normativa.
- [x] Cadastrar `ServiceDefinition`, perguntas, requisitos opcionais de origem e composição condicional `ServiceForm` em DRAFT.
- [x] Garantir perfil OCR em todos os requisitos da expansão; documentos de apoio usam `supporting-document` e não inventam campos.
- [x] Exibir no frontend os serviços planejados sem criar links de geração antes da homologação.
- [x] Preservar os modelos oficiais já homologados e substituir o 3-C incorreto pelo Termo de Responsabilidade de Construção/Alteração.
- [x] Manter sete versões/mapas NORMAM-211 em `VERIFIED/APPROVED`.
- [x] Revogar a antiga aprovação do 3-C, descartar suas coordenadas e retornar a versão corrigida para `IDENTIFIED/DRAFT`.
- [x] Corrigir BADE/BSADE: BSADE até 6 m; BADE acima de 6 m.
- [x] Manter o domínio do MVP em um único motor e impedir reintrodução silenciosa de motor2/3/4.
- [x] Remover fotos da embarcação do upload da aplicação; exigência oficial permanece apenas na documentação do procedimento.
- [x] Validar os bytes versionados do 3-C correto; blob Git comparado byte a byte com o PDF enviado pelo usuário.
- [x] Refazer o FormMapping do 3-C correto, revisar amostra sintética local e promover para `TESTED`.
- [x] Fixar o MVP em um único motor; Motor 2–4 e caixas relacionadas permanecem fora do domínio e serão tratados em evolução futura.
- [x] Manter sete serviços para embarcação/barco; alteração de dados, alteração de motor, moto aquática e inscrição >12 m permanecem em validação enquanto 3-C/NORMAM-212 não estiverem homologados.
- [x] Auditar a matriz de formulários de todos os serviços atuais contra as NORMAM-211/212 fornecidas pelo usuário.
- [x] Preservar renovação TIE/TIEM com BADE/BSADE somente quando houver alteração de características.
- [x] Restringir o 3-C aos casos expressos no item 2.12.1 (estaleiro comprovadamente extinto ou construção artesanal) e registrar a exigência técnica específica da adaptação de remo para motor.
- [x] Retornar inscrição para exame de amador a DRAFT até existir evidência operacional específica para uso do 5-H.
- [x] Completar a matriz pendente NORMAM-212 para inscrição, transferências, renovação, extravio, alterações e comunicação de venda sem liberar Moto Aquática prematuramente.
- [ ] Executar QA manual em navegador/celular com upload -> OCR -> revisão -> geração -> download para cada serviço.
- [ ] Revalidar requisitos para casos acima de 24 m / registro no Tribunal Marítimo antes de ampliar o escopo.

**Aceite parcial atual:** sete mapas NORMAM-211 permanecem `APPROVED`. O
3-C correto está `IDENTIFIED/DRAFT` e sua antiga homologação foi revogada.
Sete serviços permanecem liberados nos cenários cobertos. Permanecem fail-closed:
moto aquática, alteração de dados, alteração de motor, inscrição >12 m e inscrição
de embarcação construída pelo próprio interessado. QA manual em navegador/celular
continua pendente.

## 3.2. Registro de execução — 28/10/2026, catálogo dos serviços NORMAM-211

**Decisão:** os serviços escolhidos são inscrição inicial; transferência de
propriedade; transferência de jurisdição; transferência conjunta de propriedade
e jurisdição; renovação do TIE/TIEM; segunda via por perda/roubo/extravio;
alteração de dados/características; troca/instalação/retirada de motor; e
comunicação de venda. A nomenclatura do motor acompanha a alteração de
características da NORMAM-211, sem criar uma semântica independente de
“averbação” sem evidência.

**Formulários identificados:** 2-A BADE, 2-B BSADE, 2-C Requerimento, 2-G
Declaração de Residência, 2-H Declaração de Perda/Extravio, 2-I Comunicação de
Transferência, 2-K Autorização de Transferência e 3-C Termo de Responsabilidade.
As versões foram cadastradas como `IDENTIFIED` com URL oficial, sem hash,
template ou status `VERIFIED`.

**Arquitetura:** novo módulo `vessel-services.ts` concentra os serviços e
relações reutilizáveis. Até 12 m seleciona BSADE; maior que 12 m até 24 m
seleciona BADE. Anexos de residência/perda são condicionais e a autorização
2-K entra nas transferências de propriedade. A composição permanece DRAFT e
deve ser reconferida antes de cada liberação.

**OCR:** todos os requisitos dos nove serviços possuem `extraction`. Identidade,
TIE e residência reutilizam extractors estruturados; venda permanece no
adaptador legado; procuração, GRU, fotos e outros apoios usam o novo tipo
`supporting-document`, que passa pelo OCR mas não produz `FieldEvidence`
sem regra semântica revisada. A interface passou a usar mensagem genérica para
texto lido sem associação segura.

**Frontend:** a página inicial lista os nove serviços como “Formulário em
validação”. Eles não são clicáveis nem retornados por `GET /api/services`
enquanto estiverem DRAFT, preservando o fail-closed atual.

**Bloqueio documental:** o ambiente de execução não conseguiu resolver/baixar
os binários oficiais da Marinha/GitHub. Não foram inventadas coordenadas, hashes
ou PDFs. O próximo passo documental é baixar os oito anexos oficiais, inspecionar
com renderização, mapear e revisar visualmente antes de qualquer `AVAILABLE`.

**Validação:** o primeiro CI do PR #24 revelou dois testes antigos que pressupunham que toda `FormVersion` já possuía PDF/hash e que toda versão possuía `FormMapping`. Eles foram corrigidos para preservar o contrato correto: somente versões `VERIFIED` exigem asset/hash e somente versões verificadas atualmente mapeadas entram nos testes de coordenadas. Um segundo CI encontrou apenas a expectativa textual antiga do diagnóstico frontend (`nome/CPF/RG`), atualizada para a mensagem genérica de qualquer documento. O head de implementação `ef9ade1d` passou integralmente na execução `40791885589`: `backend-checks`, `frontend-checks`, `postgres-integration`, `pdf-mapping-visual`, `compose-smoke`, `reference-documents` e `ocr-integration` em sucesso. Após este registro documental, o head final deve repetir o CI antes do merge.

## 3.3. Registro de execução — 28/10/2026, homologação técnica NORMAM-211

**Branch/PR:** `feat/homologate-normam211-services`, PR #25.

**PDFs:** os oito anexos adicionados pelo usuário foram preservados sem
reconversão em `backend/templates/<form>/v1/original.pdf`. A inspeção por
GitHub Actions confirmou assinatura PDF, ausência de criptografia, qpdf sem
erros estruturais, A4 sem rotação e ausência de AcroForm. SHA-256 e caminhos
imutáveis foram registrados nas oito `FormVersion`, agora
`VERIFIED/STATIC`.

**Mapeamento e QA visual:** foram criados oito mapas por coordenadas. Amostras
inteiramente fictícias foram geradas com marca d'água e todas as páginas foram
renderizadas. A revisão técnica encontrou e corrigiu, entre outros pontos:
caixas do 2-C/2-H, datas segmentadas em 2-A/2-G/2-H/2-I/3-C, escolhas de área de
navegação fail-closed por aliases explícitos e campos densos do BADE. O artefato
final de revisão técnica é do run `40802473189`,
`pdf-mapping-review-synthetic` (`12866343656`); a inspeção estrutural do
mesmo run está no artefato `12867145494`. Relatório:
`docs/mapping-reports/normam211-2026-technical-qa.md`.

**Escopo preservado:** a expansão inicialmente chegou a introduzir campos
motor1–4, mas isso contrariava `AGENTS.md`. A alteração foi revertida e testes
agora garantem o domínio de um único motor canônico. O 2-K deixa Motor 2–4 e as
caixas SIM/NÃO manuais em vez de inferir informação ausente. Fotos da embarcação
também foram retiradas do upload da aplicação, sem afirmar dispensa no
procedimento oficial.

**OCR/document understanding:** identidade passou a extrair data de nascimento;
TIE/TIEM passou a reconhecer tipo, área de navegação, pontal, material do casco
e tipo de propulsão nos layouts confirmados. O modelo `tie digital 2.pdf`
entrou no teste de referência. Revisão humana permanece obrigatória.

**Correção posterior:** esse registro é histórico. A auditoria de 29/10/2026
contra a NORMAM-211 completa confirmou sete mapas anteriores e invalidou o antigo
3-C. O formulário correto é o Anexo 3-C - Termo de Responsabilidade de
Construção/Alteração. O estado vigente está documentado em
`docs/NORMAM_SOURCE_AUDIT_2026-10-29.md`.

**CI:** durante a homologação, falhas reais do preview foram usadas como gate e
corrigidas, em vez de relaxar testes. O workflow passou a cancelar runs
obsoletos do mesmo PR por `concurrency`. Após a atualização deste tracker, o
head final deve repetir todos os gates antes do merge.

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


## 16. Registro de execução — 28/10/2026, rótulo confundido com série do motor no TIE digital

**Relato:** no TIE digital, o campo de número de série do motor recebeu o próprio rótulo bilíngue `N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER` em vez do valor real.

**Causa investigada:** a extração semântica validava candidatos próximos ao rótulo, mas não possuía uma regra geral proibindo que outra linha reconhecida pelo mesmo conjunto de aliases fosse usada como valor. A fragmentação/agrupamento espacial do OCR pode colocar rótulos duplicados ou sintéticos na vizinhança do campo.

**Correção:** `anchoredCandidates()` agora exclui explicitamente linhas que também correspondem aos aliases do próprio conceito antes de tratá-las como valor à direita, abaixo ou sequencial. O validador de `vessel.motorSerial` também rejeita defensivamente textos equivalentes a `SÉRIE DO MOTOR`, `ENGINE SERIAL NUMBER`, `MOTOR 1` e `ENGINE 1`.

**Regressões:** testes sintéticos cobrem rótulo bilíngue duplicado e rótulo compactado próximo ao valor real; o resultado esperado permanece exclusivamente o número de série. A validação integral depende do CI do PR desta correção.


## 17. Registro de execução — 28/10/2026, fronteiras semânticas entre campos do TIE digital

**Relato:** no TIE digital de referência, `vessel.motorManufacturerBrandModel` retornava o próprio rótulo do campo seguinte, `N° DE SÉRIE DO MOTOR / ENGINE SERIAL NUMBER`.

**Evidência visual:** o layout digital empilha, para cada motor, o rótulo de fabricante/marca/modelo, seu valor, o rótulo de número de série e seu valor. No modelo público anexado, os dois valores do motor estão mascarados com asteriscos. Portanto esses campos devem resultar em `NOT_FOUND`; um rótulo vizinho nunca é um valor aceitável.

**Causa-raiz:** o extrator semântico procurava o primeiro valor estruturalmente válido abaixo/direita do rótulo e podia pular uma linha inválida/mascarada. A correção anterior impedia somente que aliases do **mesmo conceito** fossem usados como valor. Assim, ao extrair fabricante/marca/modelo, o rótulo do conceito seguinte (série do motor) ainda podia ser atravessado e considerado candidato. O teste de integração real também estava incorreto: exigia `motorManufacturerBrandModel` e `motorSerial` como presentes no modelo cujo conteúdo está mascarado, institucionalizando o falso positivo.

**Correção arquitetural:** `extractSemanticConcepts()` agora fornece ao mecanismo de candidatos todos os rótulos conhecidos do catálogo de conceitos. `anchoredCandidates()` trata qualquer rótulo semântico vizinho como fronteira de campo. A busca à direita/abaixo não atravessa a primeira fronteira e a busca sequencial interrompe ao encontrar outro rótulo. Isso preserva a associação espacial sem criar uma lista específica de exceções por documento.

**Regressões:** adicionados testes para (1) valor inválido seguido pelo rótulo do próximo conceito, (2) TIE digital mascarado, que não deve produzir fabricante/série, e (3) TIE digital com valores reais, que deve manter fabricante e série separados. O teste de referência real foi corrigido para exigir ausência dos campos mascarados em vez de falso `FOUND`.

**Pendente:** CI completo e reteste no ambiente do usuário com o mesmo TIE digital. A correção não altera campos de proprietário, múltiplos motores no domínio nem homologação documental.


## 18. Registro de execução — 28/10/2026, correção do preflight e redução de falhas tardias no CI

**Falha do PR 20:** o primeiro ajuste removeu o falso positivo `vessel.motorManufacturerBrandModel`, mas o TIE digital real ainda produziu `vessel.motorSerial`. Um diagnóstico sem expor o valor mostrou `method=anchor-sequential`, candidato somente numérico de 4 caracteres e `looksYear=true`: a ordem bruta do PaddleOCR colocou o ano de construção imediatamente após o rótulo da série, apesar de estar em outra coluna visual.

**Correção adicional:** conceitos semânticos aceitam fronteiras específicas para cabeçalhos de motor e podem desativar `anchor-sequential` quando há geometria. O diagnóstico real mostrou que a série do motor estava capturando o ano de construção (4 dígitos) por ordem bruta do PaddleOCR em outra coluna. A restrição foi aplicada especificamente a `motorManufacturerBrandModel` e `motorSerial`; os demais conceitos preservam o fallback legado porque o TIE real ainda depende dele para campos como `AB / GT`. Foram adicionadas regressões para cabeçalhos compactados, ano em outra coluna e preservação de sequential fora dos conceitos de risco.

**Padrão das falhas recentes:** as falhas não indicam flakiness geral do GitHub Actions; os jobs de infraestrutura têm passado. Os casos observados vieram de validação tardia de hipóteses: teste sintético inadequado, expectativa de referência alterada antes de reproduzir a saída real e diferença entre fragmentação sintética e PaddleOCR real.

**Mudança de processo:** o CI principal foi preservado sem alterações estruturais e foi criado um workflow manual separado, `Pre-PR OCR`, para executar na branch antes de abrir PRs que alterem OCR/document-understanding. Ele roda o gate determinístico e o OCR real dos documentos públicos de referência. `AGENTS.md` torna esse preflight obrigatório; também foi criado `npm run verify:document-understanding` para typecheck + lint + testes determinísticos + build, e `docs/PRE_PR_VALIDATION.md` documenta o processo.

**Objetivo:** o CI do PR permanece uma verificação independente, mas deixa de ser o primeiro ambiente em que a alteração é realmente testada. Isso não garante zero falhas, porém reduz erros previsíveis e separa melhor regressão de código, comportamento do OCR real e infraestrutura.


## 19. Registro de execução — 28/10/2026, inscrição do TIEM confundida com série do casco

**Relato:** no TIEM antigo fotografado, a extração atribuiu o valor de `FORMATO DE SÉRIE DO CASCO/FORMA` ao campo `vessel.registration`, embora a inscrição correta estivesse no bloco `Nº DE INSCRIÇÃO` no topo do documento.

**Causa-raiz:** o conceito `vessel.registration` permitia `anchor-sequential` mesmo quando o PaddleOCR fornecia bounding boxes. Como o validador de inscrição aceita valores alfanuméricos com hífen, um identificador de casco estruturalmente válido podia ser escolhido a partir da ordem bruta do OCR quando essa ordem divergisse da disposição visual.

**Correção:** `vessel.registration` mantém as buscas geométricas `below/right`, mas desativa o fallback sequencial quando há geometria. Documentos sem geometria preservam o fallback sequencial existente.

**Regressão:** adicionado teste com linhas deliberadamente fora da ordem visual: o array OCR coloca `BR-MZL-123456` antes de `441M2023001234`, enquanto as bounding boxes posicionam cada valor junto ao seu rótulo correto. O resultado exigido é `vessel.registration = 441M2023001234` e `vessel.hullId = BR-MZL-123456`.

**Validação:** o commit `626203c2` foi validado no CI do PR #21, execução `40734184046`: `backend-checks`, `postgres-integration`, `pdf-mapping-visual`, `ocr-integration`, `reference-documents` e `compose-smoke` concluíram com sucesso; `frontend-checks` foi corretamente ignorado por não haver alteração de frontend. Isso valida a regressão automatizada e a integração de OCR, mas não substitui o reteste manual desta imagem no ambiente do usuário.


## 20. Registro de execução — 28/10/2026, robustez semântica de TIE/TIEM após reteste real

**Relato:** após o PR #21, o mesmo TIEM antigo continuou associando incorretamente o identificador do casco ao número de inscrição no ambiente do usuário. O usuário também informou que outros modelos deixavam de sugerir alguns campos já suportados.

**Causa-raiz ampliada:** desativar `anchor-sequential` com geometria eliminou apenas um caminho de falso positivo. O validador de `vessel.registration` continuava aceitando identificadores náuticos fortes como `BR-MZL-123456` e `BRABC12345D626`; além disso, aliases antigos eram estreitos para variações comuns produzidas por OCR, como `N°`, `Nº`, `N O`, `ATIVIDADE - USO`, `QTDADE` e `NOME DO FABRICANTE`.

**Correção:** `vessel.registration` agora rejeita identificadores fortes de casco iniciados por `BR` quando combinam letras e dígitos. A normalização remove espaços internos apenas para validação de identificadores, preservando o valor original como evidência. Os aliases de inscrição, casco, atividade, fabricante, tripulantes e passageiros foram ampliados de modo conservador para variantes comuns de OCR sem introduzir fuzzy matching global.

**Regressões determinísticas:** adicionados cenários em que o OCR coloca `BR-MZL-123456` na mesma linha sintética do rótulo `N° DE INSCRIÇÃO`, mantendo `441M2023001234` geometricamente abaixo; e cenários com variantes de rótulos antigos. A expectativa continua separar `vessel.registration` de `vessel.hullId`.

**Referência real:** o teste de `documentos/tie/TIEM antigo.pdf` exige inscrição, ano, comprimento, nome da embarcação, marca do motor, atividade, tripulantes e passageiros. O scan público mascara o número de série do casco e não produz no PaddleOCR evidência utilizável de potência nem do número de série do motor; esses campos não devem ser inventados a partir de números vizinhos e permanecem cobertos por regressões determinísticas quando há valores reais.

**Escopo preservado:** não foram promovidos proprietário, coproprietário, hipoteca, alienação, data de inscrição, validade, via, construtor, material ou cor do casco porque esses campos não pertencem atualmente aos mapeamentos ativos do MVP. A entrega amplia a confiabilidade dos campos canônicos já usados pelos formulários.

**Validação:** o primeiro CI do PR #22, execução `40737990904`, passou em backend, PostgreSQL, PDF, Compose e OCR sintético, mas falhou em `reference-documents`. O diagnóstico seguro mostrou que o TIEM real recuperou inscrição, casco, ano, comprimento, atividade, tripulantes e passageiros, porém não recuperou nome da embarcação nem potência/série/marca do motor. A causa adicional identificada foi competição entre linhas originais e frases espaciais sintéticas: quando o rótulo original já existe, frases sintéticas mais largas podem criar candidatos extras em grades densas e tornar o conceito ambíguo. A correção subsequente faz o mecanismo preferir rótulos originais e usar frases sintéticas como reparo apenas quando nenhuma linha original corresponde ao conceito. O CI seguinte mostrou uma segunda forma de competição: uma frase sintética formada pelos três valores da linha do motor (`115 6E5L1001234 YAMAHA`) podia ser escolhida como valor de marca mesmo com a linha atômica `YAMAHA` disponível. O mecanismo agora prioriza linhas OCR atômicas sobre frases sintéticas também na seleção de valores à direita/abaixo. Foi adicionada regressão com cabeçalho e três colunas de motor no mesmo grid. Execuções posteriores com diagnóstico sanitizado mostraram a saída real do scan: `NOMEDA EMBARCACAO`, `N DO F MOTORSERIE` e `N DO P MOTORSERIE`; após os aliases/fuzzy locais, nome e marca passaram a ser encontrados. Potência e série continuam ausentes no scan porque não há candidato OCR confiável para esses valores, enquanto os testes determinísticos preservam `115` e `6E5L1001234` no layout equivalente. O teste de referência foi corrigido para não exigir evidência que o arquivo não contém. O CI do head final ainda deve ficar totalmente verde antes do merge; reteste manual no ambiente do usuário continua obrigatório após integração.


## 21. Registro de execução — 28/10/2026, análise comparativa de três modelos TIE/TIEM

**Fontes analisadas:** TIE digital público bilíngue, TIEM antigo público de baixa resolução e um TIEM antigo limpo fornecido pelo usuário para QA. A análise visual confirmou duas famílias de layout dentro do mesmo domínio: o TIE digital usa blocos verticais bilíngues, seções `MOTOR n / ENGINE n`, `AB / GT` e `BOCA / BREADTH`; o TIEM antigo usa grade densa, inscrição no topo esquerdo, potência/série/fabricante em colunas e características do casco no bloco direito.

**Falhas de teste descobertas:** os testes de referência exigiam `vessel.hullId` no TIE digital público e no TIEM antigo público mesmo quando o valor do casco está ausente/mascarado; também exigiam `vessel.grossTonnage` no TIE digital apesar de `AB / GT` estar mascarado. Isso institucionalizava falsos positivos produzidos por candidatos numéricos vizinhos.

**Mudança arquitetural:** `tie` continua sendo uma única família semântica, mas o extractor passa a classificar opcionalmente a variante como `digital`, `legacy` ou `unknown` usando múltiplos marcadores fortes. A classificação só restringe conceitos exclusivos da variante; conceitos compartilhados continuam disponíveis. Se a classificação for inconclusiva, o comportamento multi-layout anterior é preservado.

**Hardening de candidatos:** casco, `AB / GT`, `BOCA / BREADTH`, potência e marca do motor deixam de usar sequência bruta quando há geometria. O fallback de casco deixa de aceitar um identificador alfanumérico genérico e passa a aceitar somente formato forte iniciado por `BR`; uma inscrição não pode virar casco apenas por ser o único token alfanumérico longo do documento.

**Regressões adicionadas:** classificação de TIE digital; classificação de TIEM antigo mesmo com OCR degradado como `N DO F MOTORSERIE`; fallback `unknown`; TIE digital com AB/GT, breadth e casco mascarados deve manter esses campos ausentes; TIEM limpo em grid deve preservar inscrição `441M2023001234`, potência `115`, série `6E5L1001234`, fabricante `YAMAHA` e casco `BR-MZL-123456` sem ativar conceitos exclusivos do digital.

**Privacidade/escopo:** o arquivo QA enviado pelo usuário não é versionado no repositório. A regressão usa uma observação sintética equivalente com dados fictícios. Proprietário, coproprietário, CPF/CNPJ, hipoteca, alienação, datas e demais campos fora dos mapeamentos ativos continuam não promovidos.

**Validação:** o preflight local não pôde ser executado nesta sessão por indisponibilidade de resolução DNS para `github.com`, portanto não foi contabilizado como aprovado. O CI do PR #23, execução `40765499950`, validou o head de código com `backend-checks`, `postgres-integration`, `pdf-mapping-visual`, `compose-smoke`, `reference-documents` e `ocr-integration` em sucesso; `frontend-checks` foi corretamente ignorado por não haver alteração de frontend. Após este registro documental, o novo head deve repetir o CI completo e somente então pode ser integrado.


## 3.2. Expansão de amadores - NORMAM-211

- [x] Confirmar na NORMAM-211 que ARA/MSA/CPA pertencem ao escopo da norma.
- [x] Identificar Anexo 5-H (Requerimento) e Anexo 5-D (extravio/furto/roubo/dano da CHA).
- [x] Catalogar Inscrição para exame de amador e Renovação da CHA; a NORMAM 5.4.1 não cita o 5-H nominalmente, mas orientação operacional oficial da DPC/OMs da Marinha confirma seu uso no requerimento de inscrição.
- [x] Não criar “segunda via” separada: perda/dano de cédula segue renovação.
- [x] Modelar dependência de categoria: Arrais usa atestado 5-E; Mestre exige Arrais válido; Capitão exige Mestre válido.
- [x] Versionar 5-D e 5-H como templates imutáveis no repositório; blobs Git comparados byte a byte com os PDFs enviados pelo usuário.
- [x] Registrar SHA-256 local, páginas, dimensões e ausência de AcroForm dos anexos 5-D e 5-H.
- [x] Criar FormMapping dos anexos 5-D e 5-H e promover para `TESTED` após QA sintético local.
- [x] Gerar amostras fictícias locais e revisar visualmente; promoção continua bloqueada até repetir a geração com os bytes versionados pelo motor real.
- [x] Promover 5-D e 5-H para `APPROVED` e liberar `renovacao-cha-amador` como serviço de preenchimento após autorização explícita do responsável pelo produto.
- [x] Liberar `inscricao-exame-amador` reutilizando o 5-H homologado; categoria escolhida é escrita na descrição do pedido e identidade/residência permanecem uploads opcionais para preenchimento.
- [ ] Executar CI/typecheck/build do head de liberação; isso continua como validação técnica pendente, sem rebaixar o estado normativo dos PDFs.
- [x] Catalogar e liberar Emissão de CHA de Veleiro usando o 5-H aprovado; 5-G é documento emitido pela entidade de treinamento e não é gerado para o candidato.
- [x] Catalogar e liberar Concessão de CHA por equivalência profissional usando a opção 1 do 5-H.
- [x] Liberar Renovação com agregação de Motonauta: Anexo 3-A versionado em `backend/templates/requerimento-motonauta/v1/original.pdf`, Git blob conferido contra o PDF usado no QA, SHA-256 registrado, mapping v2 revisado visualmente nas duas páginas e serviço promovido para `AVAILABLE`.
- [x] Remover Pedido de revisão de prova de Capitão-Amador do escopo do produto por decisão do responsável.
- [ ] Aquaviários: obter NORMAM-101/DPC antes de catalogar serviços profissionais.


### Registro de implementação - 29/10/2026, mappings 5-D/5-H e 3-C

- [x] Adicionar `answerBindings` ao `ServiceForm` para copiar respostas já validadas para campos do PDF sem lógica específica de CHA na rota.
- [x] Validar bindings no catálogo e adicionar testes unitários de precedência/fail-closed.
- [x] Vincular `chaSituation` -> `process.chaLossReason` para o Anexo 5-D.
- [x] Mapear 5-D e 5-H em coordenadas PDF, mantendo assinatura manual.
- [x] Mapear o 3-C correto com campos semânticos próprios de construção/alteração.
- [x] Registrar relatórios em `docs/mapping-reports/normam211-amadores-2026-technical-qa.md` e `normam211-3c-2026-technical-qa.md`.
- [ ] Executar suíte completa/typecheck/build quando o ambiente conseguir acessar o repositório ou CI for disparado.


### Validação dos blobs versionados - 29/10/2026

Os três PDFs foram enviados pelo responsável do produto para a branch do PR #37 e os
blobs Git foram comparados byte a byte com os arquivos locais usados no QA:

- Anexo 3-C: Git blob `2d22e83e51721d34fe06d4e1230be67bf226ca56`, SHA-256
  `63B31E5D256B8B178E88D1689AE0087C49ECB89EBB012B9F8B465B095F50F005`;
- Anexo 5-D: Git blob `6473c645eb700b4eb27bb0bb26418804560378eb`, SHA-256
  `53DD1F6576B3B9C6C4D1B056B18F4333DBCC24C3DE8FB18047B32B6AEBE9850E`;
- Anexo 5-H: Git blob `0eeb17b1f83f17ac788d68d3fdeeb98e26868bd4`, SHA-256
  `06E753608DE9B2C8D29B4380EB2EFF7D81B9E5376B4AE2011AFD5F2AEAAC78BF`.

As três `FormVersion` estavam `VERIFIED` nesse ponto do histórico. Os mappings 5-D e
5-H já haviam sido promovidos para `APPROVED`; o 3-C ainda permanecia `TESTED` naquele
snapshot. Esse estado do 3-C foi posteriormente substituído pela homologação registrada
abaixo, após troca do template antigo pelo Anexo 3-C oficial vigente.


## Registro de execução — 29/10/2026, recuperação da verificação de sessão

**Problema observado:** a tela de login ficava bloqueada em "Verificando sua sessão..." e,
quando `GET /api/auth/me` falhava por motivo diferente de 401, a interface entrava em
`unavailable` e escondia o formulário. O botão de tentativa repetida não mudava o estado
visual para loading, parecendo não funcionar.

**Correção:** `AuthProvider.refreshSession()` agora publica o estado `loading` antes da nova
consulta e a leitura de sessão possui timeout de 10 segundos. `AuthPage` mantém o
formulário disponível quando a consulta de sessão está temporariamente indisponível,
oferecendo nova tentativa sem bloquear a autenticação. Falhas 401 de login, indisponibilidade
do servidor e sessão já existente (409) recebem tratamentos distintos.

**Cobertura:** adicionado teste de regressão para falha inicial de sessão, formulário ainda
utilizável, retry com feedback de loading e recuperação para estado guest. O CI continua
dependente de execução manual do workflow antes de considerar os gates automatizados
confirmados.


## Registro de execução — 29/10/2026, remoção do DEV_QA_PREVIEW

**Decisão:** o modo `DEV_QA_PREVIEW` foi removido do runtime. A aplicação passa a
usar um único catálogo oficial em execução normal, sem overlays de ambiente que promovam
serviços/mapeamentos `DRAFT`, zerem créditos ou alterem a composição de formulários.

**Removido:** variável do `.env.example` e `compose.yaml`, parsing em `env.ts`,
override em `server.ts`, opção `qaPreview` de `buildApp/registerJobRoutes`, exceções
de cobrança/entrega/estorno, watermark exclusivo desse modo e os testes/módulos dedicados
à prévia de runtime. O `catalogOverride` genérico continua disponível somente para testes
isolados.

**Motivo operacional:** o overlay havia criado relações duplicadas de formulário para o
mesmo serviço e invalidado o catálogo durante o startup da API. A remoção elimina essa
segunda fonte de comportamento. Serviços e mappings só passam a `AVAILABLE/APPROVED`
pelo catálogo oficial após seus gates de homologação.


## Registro de execução — 29/10/2026, homologação integral dos serviços em validação

### Estado do catálogo após a revisão

- [x] 14/14 serviços catalogados em `AVAILABLE`.
- [x] 17/17 versões de formulários em `VERIFIED`.
- [x] 17/17 mappings em `APPROVED`.
- [x] Nenhuma opção de serviço permanece bloqueada por `unavailableOptions` no catálogo oficial.
- [x] Moto Aquática liberada nos mesmos nove cards de serviços de embarcação por meio de `vesselType`.
- [x] Inscrição para exame de Arrais/Mestre/Capitão liberada com o Anexo 5-H, sustentada pela NORMAM e por procedimentos operacionais atuais de CP/DL/AG.
- [x] Alteração de dados e alteração de motor de embarcação liberadas com as condições normativas do Anexo 3-C.
- [x] Faixa de embarcação maior que 12 m e menor que 24 m liberada na inscrição inicial.
- [x] Opção do Anexo 3-C na inscrição inicial liberada, incluindo construção pelo interessado e uso do termo para dispensa de vistoria de embarcação de médio porte.
- [x] Documentos apenas de protocolo (GRU, ART, atestados/certificados sem campos automáticos) não são solicitados como uploads de OCR.

### Correções encontradas durante a homologação

1. **Template 3-C incorreto:** o PDF anteriormente versionado era um termo antigo de inscrição/transferência, e não o Anexo 3-C vigente. O binário foi substituído pelo **Termo de Responsabilidade de Construção/Alteração** da NORMAM-211/DPC 2026, SHA-256 `3937D3997C6BD49A31FFBBD7B4D19A195304FF6024D96D629079E5F327390DB3`. O mapping foi revisado visualmente e promovido para `APPROVED`.
2. **Moto Aquática incompleta fora da transferência:** a revisão visual anterior cobria alinhamento, mas o Requerimento 2-A e o BDMOTO não possuíam todas as marcações semânticas usadas por inscrição, jurisdição, renovação, 2ª via e alteração de dados. Os mappings foram atualizados para revisão v2.
3. **Inscrição inicial bloqueada por número inexistente:** `vessel.registration` deixou de ser obrigatório no 2-A/BDMOTO e também nos formulários de barco reutilizados pela inscrição inicial. O campo permanece disponível nos serviços posteriores.
4. **2ª via de moto aquática:** passou a perguntar explicitamente perda, roubo ou extravio para marcar o motivo correspondente no Anexo 2-A.
5. **Alteração cadastral de moto aquática:** passou a distinguir dados da moto aquática, do proprietário ou de ambos, marcando corretamente o Anexo 2-A; o BDMOTO usa `Atualização de dados`.
6. **Renovação de moto aquática:** o BDMOTO continua condicionado exclusivamente à alteração de características, conforme item 2.2 da NORMAM-212.
7. **Frontend:** removidas mensagens residuais do antigo QA runtime; serviços liberados são apresentados pelo fluxo normal com custo de 1 crédito.

### Cobertura adicionada

- [x] Testes de catálogo exigem 14 serviços disponíveis, 17 mappings aprovados e catálogo sem erros.
- [x] Testes de projeção pública cobrem os pacotes de formulários de barco e moto aquática.
- [x] Teste de geração percorre todos os pacotes liberados de moto aquática, aplica `serviceFormValues` e chama o motor real `fillPdf` para detectar opções de checkbox inválidas.
- [x] Testes de mapping mantêm coordenadas dentro das páginas oficiais e campos obrigatórios compatíveis com inscrição inicial.

### Validação técnica ainda não executada nesta sessão

O workflow do repositório permanece manual (`workflow_dispatch`) e o conector GitHub
disponível nesta sessão não oferece ação de disparo. O ambiente de container também não
resolve `github.com`, portanto não foi possível clonar a branch e executar `npm test`,
typecheck, lint e build localmente. Os testes foram atualizados, mas **não são declarados
como aprovados até a execução do CI/preflight no head desta branch**.

A homologação normativa/visual acima não depende desse limite técnico, porém a branch só
deve ser tratada como validada para merge após os gates automatizados serem executados.
