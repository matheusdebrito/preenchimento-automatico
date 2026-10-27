# PROJECT_TRACKER.md — Plano do MVP à produção e expansão

> **Objetivo:** orientar o OpenCode da prova técnica ao lançamento comercial e à expansão, permitindo retomar o trabalho e marcar cada fase somente quando seus critérios forem comprovadamente atendidos.
>
> **Escopo:** primeiro serviço = transferência de propriedade de moto aquática. Modelo comercial = créditos avulsos e pacotes pré-pagos; **sem assinatura nem planos empresariais**. Nenhuma integração real com a Marinha ou promessa de aprovação.
>
> **Fontes de verdade:** `AGENTS.md` (segurança e engenharia), `MVP_PLAN.md` (requisitos), `UI_DESIGN_GUIDE.md` (UX), `docs/FORM_CATALOG.md`, `docs/SERVICE_FORM_MATRIX.md` e `docs/FORM_MAPPING_REPORT_TEMPLATE.md` (catalogação). Em conflito, **não avançar** sem registrar a divergência e priorizar a regra mais segura.

## 0. Protocolo obrigatório do agente

1. **No início de toda sessão:** ler este arquivo, os documentos citados e o estado atual do repositório; conferir `git status`, branch, alterações locais e último commit. Nunca sobrescrever trabalho não commitado.
2. Escolher **somente a primeira fase incompleta cujas dependências estejam satisfeitas**. Relatar o escopo e os testes previstos antes de modificar código.
3. Executar alterações pequenas e compatíveis com as versões e padrões existentes; evitar dependências, infraestrutura e abstrações desnecessárias.
4. Rodar os comandos de verificação aplicáveis dos pacotes afetados (`typecheck`, `lint`, `test`, `build`), além dos testes específicos da fase. Se não puder executar, registrar **não verificado**, nunca marcar como aprovado.
5. **Marcar [x] apenas após evidência verificável**. Adicionar na seção "Registro de execução": data, fase, arquivos alterados, comandos e resultados, validações manuais, riscos e commit. Uma fase parcialmente feita permanece [ ].
6. Se faltar decisão do usuário, modelo oficial, dado normativo, ferramenta necessária ou acesso, registrar **BLOQUEADO** e fazer uma pergunta objetiva com os arquivos/instruções necessários. Não inventar PDFs, fontes oficiais, versões, campos nem obrigações legais.
7. Após concluir uma fase, registrar e informar o resultado. **Autorização de 26/10/2026:** o usuário permitiu executar de forma consecutiva as fases técnicas 00–09 do MVP sem pedir nova autorização por fase. Isso não equivale a revisão humana de modelo oficial, validação jurídica, autorização de produção ou cobrança. Quando houver bloqueador comprovado, registrar e prosseguir somente com tarefas independentes e seguras.
8. Não editar marcadores de fases futuras, não simular testes, não usar documentos pessoais reais em testes, não lançar código inseguro para "desbloquear".
9. Manter o frontend demonstrativo funcionando até haver integração real validada; separar explicitamente fluxos `demo` e `real`.
10. Sempre revisar segurança (autenticação, autorização, validação de entradas, uploads, logs, temporários, consumo de créditos), desempenho (medir antes de otimizar) e LGPD.

### Estados e dependências

- **[ ]** Pendente/em andamento/bloqueado: explicitar situação no Registro de execução.
- **[x]** Concluída e verificada.
- Uma fase pode depender de subetapas, mas não de suposições; uma confirmação verbal não substitui inspeção/teste.
- O agente pode corrigir problemas da fase atual sem abrir uma nova fase.

## Marcos e portões de aprovação

- **Marco 1 — MVP técnico:** fases 00–09. Demonstrar preenchimento ponta a ponta com dados sintéticos; **não significa pronto para usuários reais**.
- **Marco 2 — Produção comercial:** fases 10–17. Exige autorização explícita antes de pagar por serviços, configurar infraestrutura externa, ativar cobrança real, processar documentos reais ou publicar a aplicação.
- **Marco 3 — Expansão:** fase 18 e posteriores; somente após estabilização em produção e validação de demanda, serviço por serviço.
- Aprovação para **planejar** não autoriza contratação, custos, uso de dados reais, migração destrutiva, publicação nem cobrança. Registrar cada autorização e seus limites no Registro de execução.
- Dependências e políticas de segurança do MVP continuam válidas em produção; não suspender requisitos de segurança por serem uma fase futura.

## 1. Quadro geral de progresso

| Fase | Objetivo | Dependência | Situação |
| --- | --- | --- | --- |
| 00 | Revalidar fundação existente | — | [x] |
| 01 | Catalogar serviço e modelos exigidos | 00 | [x] |
| 02 | **Solicitar PDFs oficiais e verificar versões (sem aprovação do mapeamento)** | 01 | [x] |
| 03 | API de catálogo e integração de seleção | 02; liberar serviço real somente após 04 | [x] |
| 04 | Motor reutilizável de preenchimento PDF | 02 | [ ] Parcial — motor e seis mapas DRAFT; regras condicionais e revisão humana pendentes |
| 05 | Upload seguro e retenção temporária | 00 | [ ] Parcial — uploads e feedback de obrigatórios testados; fuzzing, isolamento e carga pendentes |
| 06 | OCR/extração estruturada no servidor | 05 | [ ] Parcial — diagnóstico por documento e amostras PNG/JPEG testados; precisão em fotos reais e isolamento pendentes |
| 07 | Revisão humana e jornada integrada | 03, 04, 06 | [ ] Parcial — feedback de documentos e 422 corrigido, rodapé simplificado; navegador real e acessibilidade pendentes |
| 08 | Autenticação, créditos de teste e consumo idempotente | 07 | [ ] Parcial — sessão unificada e troca de conta bloqueada; crash real e multi-instância pendentes |
| 09 | Hardening e homologação ponta a ponta | 08 | [ ] Pendente — verificações de segurança, desempenho, UX e homologação integral |
| 10 | Pagamentos reais por créditos, em sandbox e liberação controlada | 09 e aprovação explícita | [ ] |
| 11 | Infraestrutura de produção e deploy reproduzível | 09 e aprovação explícita | [ ] |
| 12 | Segurança de produção e gestão de segredos | 11 | [ ] |
| 13 | LGPD, políticas e retenção verificadas | 09, 11 e revisão responsável | [ ] |
| 14 | Observabilidade, backup e recuperação | 11, 12 | [ ] |
| 15 | Carga, capacidade e custos operacionais | 11, 14 | [ ] |
| 16 | Homologação pré-lançamento e revisão do go/no-go | 10–15 | [ ] |
| 17 | Lançamento controlado e acompanhamento | 16 e autorização explícita | [ ] |
| 18 | Expansão incremental de serviços | 17 e decisão por serviço | [ ] |

> **Estado consolidado ao final de 26/10/2026:** fases 00–03 concluídas; fases 04–08 parciais; Fase 09 pendente. Os seis PDFs oficiais estão verificados, mas seus mapeamentos e o serviço de transferência continuam `DRAFT`. O CI de créditos anterior (`a8607e3`) e o novo CI de QA (`83b7d0c`, [execução 40440558586](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40440558586)) passaram. A simulação local `qa-synthetic-moto` está desabilitada por padrão, usa apenas amostras com marca d'água, nunca habilita serviço real nem consome créditos. O [CI 40441312938](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40441312938) também aprovou regressões de JPEG sintético, verificação do conteúdo dos dois PDFs, validação de CPF/data na revisão e migrations concorrentes. A integração técnica não valida precisão OCR em documentos reais nem substitui revisão humana dos mapeamentos. Sem pagamentos ou lançamento público.

## Fase 00 — Revalidar a fundação existente

- [x] Inspecionar frontend, backend, Compose, versões, lockfiles, testes, alterações locais e instruções vigentes.
- [x] Executar `typecheck`, `lint`, `test` e `build` em frontend e backend; documentar comandos e resultados.
- [x] Verificar funcionamento do frontend demonstrativo e `GET /health` em ambiente local, se disponível.
- [x] Revisar riscos imediatos e inconsistências antes de evoluir.
- **Aceite:** evidências registradas, erros introduzidos/identificados bloqueantes resolvidos; demonstração preservada.

## Fase 01 — Pesquisa documental e regras do serviço

- [x] Verificar a **NORMAM-212/DPC vigente** e as orientações da Capitania/jurisdição aplicável; registrar links, data, versão e particularidades. A edição 2026 foi conferida no PDF oficial; o item 2.4.1 permite qualquer CP/DL/AG e não foi identificada exigência nacional específica de jurisdição. Particularidades operacionais locais só serão tratadas após a unidade ser escolhida.
- [x] Identificar exatamente os formulários aplicáveis à **transferência de propriedade de moto aquática**, distinguindo obrigatórios, condicionais e **documentos de origem do usuário** (não confundir com modelos em branco). Ver `docs/FORM_CATALOG.md`.
- [x] Atualizar `docs/FORM_CATALOG.md` e `docs/SERVICE_FORM_MATRIX.md` com evidências oficiais, perguntas condicionais e pendências.
- [x] Conferir `FormDefinition`, `FormVersion`, `FormMapping`, `FieldDefinition` e `ServiceForm`, mantendo cada formulário independente de serviços. Os contratos atuais suportam o modelo; nenhuma versão ou vínculo foi criado sem PDF verificado.
- [x] Para cada candidato, procurar um formulário/versão já cadastrado e reutilizá-lo; não criar cópias por categoria ou serviço. O catálogo em código permaneceu vazio; os IDs candidatos foram documentados sem criar `FormVersion`.
- [x] Gerar **checklist de downloads pendentes**: nome oficial, código/anexo, finalidade, link oficial direto ou página de origem, formato e nome de arquivo sugerido. Ver seção 7 de `docs/FORM_CATALOG.md`.
- **Aceite:** matriz sustentada por fontes verificáveis; nenhuma exigência sem referência; lista de PDFs pronta para apresentar ao usuário.

## Fase 02 — PORTÃO OBRIGATÓRIO: solicitar e validar os PDFs oficiais

**Esta é a hora exata em que o OpenCode deve solicitar ao usuário os PDFs que ainda não existem no catálogo. NÃO solicitar todos os PDFs da Marinha antecipadamente. O diretório é por identidade e revisão do formulário, nunca por serviço.**

**Situação em 26/10/2026:** downloads autorizados pelo usuário, seis PDFs obtidos e inspecionados, versões registradas no catálogo em código e portão humano **confirmado pelo usuário**. Fase **CONCLUÍDA** em 26/10/2026.

- [x] Parar a execução e mostrar **somente os PDFs efetivamente necessários ao serviço piloto**, separando modelos condicionais, com links oficiais verificados.
- [x] Para cada formulário **ainda não disponível e verificado**, solicitar o PDF oficial em branco para `backend/templates/<form-id>/<revisao-interna>/original.pdf`. O `form-id` identifica o formulário, não o serviço; `revisao-interna` é um slug controlado e **não** se confunde com versão oficial. Exemplo ilustrativo: `backend/templates/bdmoto/v1/original.pdf`.
- [x] Aceitar download realizado pelo agente apenas com fonte oficial comprovável e autorização do usuário; **nunca fabricar, redesenhar ou substituir o PDF original**. O 2-D e o 2-E são extratos de páginas inteiras do PDF oficial da NORMAM-212/DPC 2026.
- [x] **AGUARDAR a confirmação de que os arquivos estão presentes**, depois inspecionar bytes, assinatura `%PDF`, páginas, dimensões, campos AcroForm e metadados. Os arquivos foram baixados, inspecionados e confirmados pelo usuário.
- [x] Registrar cada **FormVersion**: `formId`, `revision` interna, revisão oficial (se existir), fonte e norma, jurisdição relevante, data de verificação, SHA-256, caminho, tipo PDF (`ACROFORM`, `STATIC` ou `UNKNOWN`) e status `IDENTIFIED`/`VERIFIED`/`OUTDATED`.
- [x] Reutilizar o mesmo arquivo e seu futuro mapeamento quando mais de um serviço empregar a mesma versão oficial. Ainda não há segundo serviço; as versões foram cadastradas por identidade, sem cópia por serviço.
- [x] Conferir se a versão/estrutura é consistente com a fonte; em caso de divergência, bloqueio ou PDF ausente, **não avançar**. As divergências textuais da norma foram registradas; os PDFs não foram alterados.
- [x] Verificar condições de uso/versionamento de modelos públicos; nunca adicionar documentos pessoais nem arquivos preenchidos com dados reais ao Git.
- [x] **Portão humano:** apresentar a relação de arquivos oficiais disponíveis, requisitos documentais verificados e lacunas; confirmar com o usuário antes de encerrar a fase. Nenhum mapeamento será marcado como aprovado aqui. Confirmação registrada em 26/10/2026: “está tudo correto”.
- **Aceite:** modelos oficiais necessários para o serviço piloto presentes, individualmente versionados e verificados contra a fonte. **Aprovação de FormMapping somente na Fase 04** após teste visual humano. Relações com serviços serão adicionadas apenas após confirmação de sua aplicabilidade.

### Mensagem que o OpenCode deve apresentar no portão de PDFs

> Chegamos ao cadastro independente de formulários oficiais. Para continuar, preciso dos **PDFs em branco ainda ausentes**: **[nome e ID do formulário + finalidade + norma/versão + link oficial verificado + caminho de destino `backend/templates/<form-id>/<revisao-interna>/original.pdf`]**. O arquivo poderá ser reutilizado por vários serviços. Não envie documentos preenchidos ou com dados pessoais. Confirme quando os PDFs estiverem disponíveis; verificarei integridade, fonte, versão e campos antes de mapear. Se a lista ainda estiver incerta, informarei o que precisa ser esclarecido.

## Fase 03 — API de catálogo e contratos

- [x] Utilizar `validateCatalog` e conferir serviços, formulários, versões, mapeamentos e `ServiceForm` muitos-para-muitos por **FormVersion**, inclusive perguntas e condições enumeradas.
- [x] Expor endpoints públicos **apenas de serviços realmente disponíveis**; rascunhos são internos e não liberam geração. O piloto só muda para `AVAILABLE` **depois** de modelos verificados e mapeamentos aprovados na Fase 04.
- [x] Criar fluxo real com seleção e checklist obtidos da API, preservando o frontend demonstrativo claramente separado.
- [x] Testar relações inexistentes, versões inativas, condições e restrição de disponibilidade com fixtures sintéticas.
- **Aceite:** API e interface mostram o mesmo catálogo validado; nenhuma exigência inventada é exposta como oficial.

## Fase 04 — Motor genérico de PDFs

- [x] Detectar campos AcroForm; os seis PDFs oficiais são estáticos e receberam coordenadas preliminares com páginas e fontes.
- [x] Separar **campo semântico** de **campo/posição do PDF**, permitindo reutilização do motor entre serviços.
- [x] Versionar `FormVersion` (modelo oficial e hash) e `FormMapping` (revisão técnica) separadamente; preservar original e bloquear modelos não aprovados.
- [x] Criar relatório **por formulário/versão** em `docs/mapping-reports/`, com posições, evidências sintéticas e pendências; nenhum está homologado.
- [x] Validar comprimento, acentuação, caracteres invisíveis, quebras de linha, CPF, datas, checkbox e espaços de assinatura reservados; motor interrompe geração em vez de cortar dados.
- [x] Mapear marcações condicionais sim/não para os quatro motores e campos opcionais de coproprietário no 2-D, sem vincular serviço ainda em rascunho.
- [ ] Conferir regras documentais e obrigatoriedade por **serviço** (coproprietário, representante, TIE), além do mapeamento independente por PDF.
- [x] Gerar PDFs com **dados sintéticos** e renderizar todas as páginas dos seis modelos; prévias em `docs/_pdf_test_previews`. A conferência apontou lacunas registradas nos relatórios; por isso a etapa ainda não foi aprovada.
- [x] Executar testes automatizados de regressão em **todos os seis modelos**, verificar geometria/páginas, preservar original e guardar prévias fictícias no GitHub Actions (`pdf-mapping-review-synthetic`).
- [ ] Obter revisão humana explícita e relatório de aprovação de **cada formulário** antes de marcar `FormMapping = APPROVED`; manter `FormVersion = VERIFIED` e bloquear versões `OUTDATED`.
- **Aceite:** pacote piloto gerado corretamente com dados fictícios, modelo preservado, visual inspecionado e sem documento real.

## Fase 05 — Upload seguro e temporário

- [x] Validar assinatura/MIME de JPG/JPEG/PNG/PDF, chunks/CRC de PNG, tamanho de arquivo, número de páginas e **dimensões de todas as páginas** PDF via Poppler.
- [x] Guardar arquivos em diretório temporário privado fora do webroot e do PostgreSQL, com IDs aleatórios, permissões 0700 e bloqueio de raiz genérica/symlink.
- [x] Autorizar upload **antes** de bufferizar conteúdo; validar proprietário e requisito também no handler; aplicar limites por usuário/job, timeout, expiração, exclusão e renovação limitada a uma hora.
- [x] Testar assinatura inválida, PNG corrompido, PDF de página excessiva, requisição de outra conta, cancelamento, diretórios órfãos e concorrência.
- [x] Validar no CI o novo preflight baseado no PNG Third Edition (IHDR, PLTE, chunks críticos) e rejeição de JPEG com dimensões zero; fixture sintética corrigida após falhas intermediárias.
- [x] Conferir em integração PostgreSQL/Poppler o upload de foto PNG fictícia e isolamento de arquivos temporários entre instâncias de teste; CI 40440558586 (sem dados reais).
- [x] Regressão com JPEG fictício gerado pelo Poppler, preflight e OCR Tesseract, além do PNG já testado; CI 40441312938.
- [x] Exibir identificação de requisitos de upload obrigatórios ausentes na API/UI sem enviar documentos desnecessários; teste React e CI 40510328039.
- [ ] Complementar fuzzing e isolamento de decodificadores JPEG/PNG/PDF, ensaios sob carga e recuperação de falhas súbitas antes de homologar a Fase 05.
- **Aceite:** nenhum dado documental persistido no PostgreSQL, logs ou repositório.

## Fase 06 — PDF textual, OCR e extração estruturada

- [x] Extrair texto nativo de PDFs digitais sem OCR quando possível; confirmado com PDF sintético no CI de integração.
- [x] Implementar conversão limitada de PDFs digitalizados com `pdftoppm`, a testar com amostras digitalizadas reais/sintéticas de qualidade variada.
- [x] Verificar no CI o teto adicional de rasterização do Poppler (16 MiB por página, 48 MiB total), antes da decodificação pelo Tesseract; não equivale a limite real de CPU/RAM.
- [x] Sugerir dados rotulados de documento fictício de venda e do TIE, somente como `REVIEW_REQUIRED`, com casos de conflito/ausência; ignorar fotos da embarcação e recibos sem regras semânticas. CI 40440558586.
- [x] Verificar fluxo sintético foto PNG → Tesseract → revisão manual → PDF com PostgreSQL/Poppler/Tesseract; CI 40440558586.
- [x] Validar extração conservadora de nome rotulado em JPEG sintético, mantendo status `REVIEW_REQUIRED` e papel do comprador; CI 40441312938.
- [x] Registrar no job temporário apenas status e número de sugestões por documento (`suggested`, `no_text`, `no_supported_labels`, `not_analyzed`), persistidos só até expiração e visíveis ao reabrir a revisão; CI 40510328039.
- [ ] Executar Tesseract no servidor/worker isolado com tratamento de qualidade de imagem e limites reais de CPU/memória.
- [x] Criar sugestões a partir de rótulos explícitos para IDs semânticos reutilizáveis (CPF/nome/RG/emissor, TIE, endereço/CEP), mantendo a origem dentro do job e exigindo revisão humana.
- [ ] Medir e registrar confiança do OCR por campo a partir de evidência real, sem inventar percentuais ou usar precisão de checksum como prova de identidade.
- [x] Detectar conflitos e ausências; nunca completar valores por suposição.
- [x] Testar candidatos sintéticos ambíguos, divergências de CPF, registros de TIE e comprovantes com múltiplos CEPs; nenhum desses casos gera preenchimento por suposição.
- [ ] Testar fotos/PDFs com **qualidade de imagem variada** (perspectiva, rotação, sombras, baixa resolução) e identificar limites do Tesseract.
- **Aceite:** extração rastreável, falhas tratadas e nenhuma confiança excessiva em OCR.

## Fase 07 — Revisão e integração do wizard

- [x] Manter demonstração claramente separada da jornada real da API, liberada só para serviços `AVAILABLE`.
- [x] Expor todos os campos visíveis para correção e confirmação explícita; impedir geração antes de verificar obrigatórios.
- [x] Integrar seleção → upload → leitura → conferência → geração → download para fixtures sintéticas no CI.
- [x] Disponibilizar captura por câmera traseira (`capture=environment`) além de upload PDF/JPG/PNG, coberta por teste React com API simulada.
- [x] Disponibilizar QA local opt-in (`DEV_QA_PREVIEW=true`) com catálogo sintético isolado, duas amostras 2-A/2-B marcadas, revisão obrigatória e custo zero; CI de integração 40440558586.
- [x] Validar CPF por dígitos e datas DD/MM/AAAA na API antes da geração e exibir indicação do campo inválido no frontend, com teste React e PostgreSQL; CI 40441312938.
- [x] Verificar em ambos os PDFs QA 2-A e 2-B o conteúdo de campos revisados e marca AMOSTRA em todas as páginas; CI 40441312938.
- [x] Corrigir UX de documento obrigatório, 422 na revisão com `fieldId` e mensagens próximas aos controles; manter o job após campo inválido e não relatar sucesso silencioso sem candidatos OCR. Testes frontend/backend, CI 40510328039.
- [x] Remover repetição de navegação no rodapé e corrigir textos sobre o fluxo real de upload temporário; CI 40510328039.
- [ ] Validar UX mobile-first e acessibilidade em dispositivos/navegadores reais.
- [x] Testar perda de resposta, retomada de uploads, recuperação de revisão/download após **recarregar a mesma aba**, cancelamento e expiração em testes React/API.
- [ ] Testar navegação E2E em navegador real, abertura de nova aba e múltiplos dispositivos; `sessionStorage` guarda só o UUID do job, não arquivos nem campos.
- **Aceite:** fluxo funcional com documentos sintéticos, mensagens corretas e nenhuma geração sem revisão.

## Fase 08 — Autenticação e créditos de teste

- [x] Criar persistência mínima para usuários e ledger de créditos; não armazenar dados de clientes ou embarcações.
- [x] Implementar autenticação por sessão HttpOnly, autorização por proprietário (incluindo preflight de upload), proteção de origem e limitação básica de taxa para login/cadastro.
- [x] Conceder créditos de **teste** por mecanismo interno seguro; não integrar cobrança real nesta fase.
- [x] Debitar **uma vez por pacote documental gerado com sucesso**, usando transação e idempotência; verificadas retentativas e concorrência no CI com PostgreSQL real.
- [x] Testar concorrência, acesso entre usuários, estorno idempotente e falha de geração de PDF **sem consumir créditos**.
- [x] Criar recibo persistente mínimo, com débito atômico no PostgreSQL e estorno idempotente de jobs não entregues após cancelamento, expiração ou reinício em **instância única**.
- [x] Verificar no CI a limpeza de sessões expiradas no startup e a cada hora; preservar sessões vigentes sem alterar contas ou ledger de créditos.
- [x] Estornar recibo não entregue quando o job expirar pelo TTL deslizante de 20 minutos, após apagar os arquivos privados; preservar pacotes entregues e usar reconciliação posterior se o banco falhar. Testes unitários e com PostgreSQL no CI 40437615191.
- [x] Verificar que o modo QA com foto e PDFs sintéticos não cria débito ou recibo financeiro; teste PostgreSQL de saldo zero no CI 40440558586. Não se aplica a serviços oficiais.
- [x] Serializar a inicialização do esquema PostgreSQL com bloqueio de transação advisory e testar seis conexões simultâneas; CI 40441312938. Não equivale à migração de produção multi-instância ou à proteção do fluxo financeiro em vários processos.
- [x] Sincronizar menu, login, logout e estado de sessão no frontend, impedindo tela de entrar autenticado; recusar login/cadastro por API quando sessão válida (`409 already_authenticated`), preservando usuário atual. Testes de frontend e PostgreSQL, CI 40510328039.
- [ ] Testar falha real de processo durante o download, inconsistência de banco e execução multi-instância antes de produção.
- **Aceite:** segurança e invariantes de saldo verificadas por testes.

## Fase 09 — Segurança, desempenho e homologação

- [ ] Rodar typecheck, lint, testes, build, integração e cenários ponta a ponta em ambiente controlado.
- [ ] Revisar OWASP para autenticação, upload, PDFs, endpoints, processamento e logs; revisar dependências vulneráveis.
- [ ] Medir consumo de CPU/memória do OCR, concorrência, limites e tempo de resposta; otimizar com métricas, não por intuição.
- [ ] Auditar retenção e limpeza de arquivos temporários, backups, logs, erros e mensagens sobre privacidade/LGPD.
- [ ] Verificar acessibilidade e experiência em celulares modestos.
- [ ] Revisar formalmente PDFs, regras de serviço e responsabilidade das assinaturas.
- **Aceite:** checklist completo, riscos residuais documentados, fluxos críticos homologados.

## Fase 10 — Comercialização por créditos (APENAS mediante autorização posterior)

- [ ] Reconfirmar intenção de iniciar pagamentos reais; **não iniciar esta fase automaticamente**.
- [ ] Especificar compra avulsa/pacotes, valores, reembolsos, prazo de validade e provedor.
- [ ] Implementar pagamento Pix/cartão com verificação de webhook, conciliação e idempotência.
- [ ] Testar compras duplicadas, chargeback/cancelamentos e falhas do provedor em sandbox.
- **Aceite:** aprovação explícita do usuário e testes financeiros/auditoria concluídos.
- **Fora de escopo:** mensalidades, assinaturas e planos empresariais.

## Fase 11 — Infraestrutura de produção e entrega reproduzível

- [ ] Definir provedor, região, orçamento, domínio, topologia, separação de ambientes e processo de atualização/rollback; **pedir aprovação antes de contratar ou publicar**.
- [ ] Preparar deploy reproduzível, TLS/HTTPS e renovação, rede e firewall com banco e worker não expostos à internet.
- [ ] Configurar isolamento do processamento de PDFs/OCR, armazenamento temporário privado, limites de CPU/memória e volumes persistentes apenas para dados necessários.
- [ ] Criar pipeline com verificações obrigatórias e proteção de branches, migrations com estratégia segura e rollback comprovado em ambiente de homologação.
- **Aceite:** infraestrutura testada com dados sintéticos, documentação de operação e custos, sem publicação pública não autorizada.

## Fase 12 — Segurança operacional de produção

- [ ] Definir modelo de ameaças e revisar autenticação, autorização por recurso, sessões, CSRF conforme mecanismo de autenticação, CORS/CSP, rate limit e abuso automatizado.
- [ ] Adotar gerenciador de segredos/credenciais, menor privilégio, rotatividade e remoção de segredos dos logs e imagens.
- [ ] Revisar upload/decodificadores PDF e imagem, isolamento de worker, proteção a DoS e sandbox de processamento.
- [ ] Automatizar verificação de dependências/imagens, atualizações de segurança e verificação de permissões.
- [ ] Testar falhas relevantes sem dados reais; registrar riscos remanescentes e responsáveis.
- **Aceite:** checklist e evidências de segurança revisados, sem vulnerabilidade crítica pendente para lançamento.

## Fase 13 — Privacidade, LGPD e políticas

- [ ] Documentar finalidade, base legal adequada, minimização, retenção, descarte, terceiros envolvidos e direitos dos titulares; submeter documentos jurídicos à revisão apropriada antes do lançamento.
- [ ] Verificar que documentos enviados, prévias, OCR e PDFs finais são temporários e não entram em backups, telemetria, logs nem ferramentas terceirizadas sem justificativa e proteção.
- [ ] Testar exclusão após conclusão/expiração, inclusive cancelamentos, falhas, jobs órfãos e volumes.
- [ ] Criar política de privacidade, termos de uso, orientações de segurança e canal de atendimento pertinentes, com promessas técnicas verificadas.
- **Aceite:** fluxo de dados e políticas documentados/revisados; retenção e exclusão comprovadas em ambiente de homologação.

## Fase 14 — Observabilidade, backup e recuperação

- [ ] Implementar métricas técnicas, logs sem dados pessoais documentais, alertas sobre erros, filas, CPU/memória, disco e falhas de processamento/pagamento.
- [ ] Configurar backups criptografados **somente dos dados persistentes necessários**, com retenção e permissões, sem documentos temporários.
- [ ] Testar restauração do banco, recuperação após queda, reprocessamentos idempotentes e procedimentos de incidente.
- [ ] Documentar runbooks de indisponibilidade, suspensão de pagamentos, reversão de deploy e contatos operacionais.
- **Aceite:** alertas e restauração testados; evidências registradas e dados sensíveis protegidos.

## Fase 15 — Capacidade, desempenho e custos

- [ ] Estabelecer metas de tempo de processamento e concorrência realistas, sem prometer valores não medidos.
- [ ] Realizar teste de carga com documentos sintéticos de diferentes tamanhos, incluindo imagens problemáticas e PDFs multipágina.
- [ ] Medir uso de CPU/RAM/disco, latência, filas e custo por pacote; ajustar limites, paralelismo e backpressure com evidências.
- [ ] Avaliar saturação do servidor e experiência em celular/rede lenta; testar limites e mensagens de indisponibilidade.
- **Aceite:** orçamento de recursos e capacidade inicial documentados com medições e critérios de escalonamento.

## Fase 16 — Homologação final e decisão de lançamento

- [ ] Executar testes unitários, integração, E2E, segurança, carga mínima, acessibilidade e backup/restore em ambiente representativo.
- [ ] Conferir a vigência e apresentação de **todos** os modelos oficiais ativos, regras condicionais e assinatura/validação humana necessária.
- [ ] Homologar compras, webhooks, duplicidade, reembolsos, estornos e reconciliação do saldo com provedor em sandbox.
- [ ] Verificar domínio, TLS, privacidade, suporte, políticas comerciais, métricas, incidentes, rollback e custos.
- [ ] Elaborar relatório **GO/NO-GO** com falhas bloqueantes e riscos residuais; **pedir autorização explícita antes de publicar/aceitar dados reais/cobrar**.
- **Aceite:** decisão documentada, sem bloqueadores críticos não resolvidos e aprovação registrada.

## Fase 17 — Lançamento controlado

- [ ] Publicar somente após GO explícito e verificar serviços em produção sem expor banco, arquivos temporários ou informações sensíveis.
- [ ] Ativar pagamentos reais somente após confirmação do provedor e da autorização específica para cobrança.
- [ ] Fazer smoke tests seguros de catálogo, acesso, pagamento e geração; evitar uso de documentação pessoal real em testes.
- [ ] Acompanhar erros, consumo, custos, limpeza e disponibilidade nos primeiros ciclos, com plano de suspensão e rollback.
- [ ] Registrar incidentes, ajustes e aceite operacional pós-lançamento.
- **Aceite:** produto operando sob monitoramento e com procedimentos de correção e suspensão documentados.

## Fase 18 — Expansão incremental e manutenção

- [ ] Priorizar novos serviços com base em demanda e custo de implementação, sem inferir obrigatoriedade de formulários.
- [ ] Para **cada novo serviço**, pesquisar exigências (Fase 01), **reutilizar FormVersion e FormMapping já aprovados** quando aplicáveis, solicitar apenas PDFs ausentes/atualizados na Fase 02, mapear/testar versões novas na Fase 04, vincular em `ServiceForm` e homologar antes de disponibilizar.
- [ ] Monitorar mudanças normativas, desativar modelos desatualizados e preservar histórico de versões.
- [ ] Analisar métricas agregadas e feedback sem reter conteúdo documental; melhorar OCR somente mediante testes comparativos.
- [ ] Considerar equipes/contas empresariais e assinaturas **apenas se houver nova decisão explícita**.
- **Aceite:** cada ampliação passa por sua própria revisão, testes, autorização e registro de lançamento.

## Auditoria e implementação técnica — 26/10/2026

**Escopo autorizado:** fases técnicas do MVP 00–09, sem autorização para pagamentos reais, publicação ou processamento de documentos pessoais de clientes.

**Fase 03 — CONCLUÍDA:** API `/api/services`, `/api/services/:id`, `/api/services/:id/quote` (apenas serviços `AVAILABLE`), catálogo validado, perguntas condicionais, frontend real separado da demonstração. Testes unitários/CI passaram, inclusive bloqueio do piloto `DRAFT`.

**Fase 04 — PARCIAL:** motor PDF determinístico com `pdf-lib`, SHA-256, originais imutáveis, 6 FormMappings em `DRAFT`, **135 posições** em `docs/mapping-reports/`, todas as páginas renderizadas com dados fictícios em `docs/_pdf_test_previews/` e artefatos de QA do CI. Foram incluídos coproprietário, motores 2–4, identidade do declarante e campos adicionais; faltam regras condicionais por serviço e revisão humana independente. Proibir `APPROVED` prematuro.

**Fase 05 — PARCIAL:** upload protegido por autenticação, IDs aleatórios, assinatura/MIME, até 10 MB/arquivo e 30 MB/job, limites de páginas/dimensões, armazenamento em temp privado e TTL 20 min. Foram adicionados testes de limitação de jobs e uploads simultâneos; ainda faltam ensaios amplos de falhas, image bombs completas, expiração em processamento e carga.

**Fase 06 — PARCIAL:** `pdftotext`, `pdftoppm`, Tesseract português no contêiner, extração conservadora CPF/HIN e conflitos; ainda com teste real de Tesseract usando PNG e PDF escaneado sintéticos, mas sem bateria de fotos digitalizadas variadas e sem motor de extração amplo por tipo de documento.

**Fase 07 — PARCIAL:** fluxo React autenticado separado do demo: perguntas, upload, extração, revisão, PDF e download. Teste E2E **de API** com catálogo sintético e documentos falsos passou; teste React com API simulada aprovado; falta homologação do serviço real, E2E em navegador real e recuperação/expiração.

**Fase 08 — PARCIAL:** PostgreSQL persistente, scrypt, cookies HttpOnly/SameSite, saldo/ledger idempotente, crédito de teste restrito a desenvolvimento. Integração real de cadastro, sessão, três débitos concorrentes e geração de dois PDFs com débito único passou em CI. Limitação básica de taxa por IP para login/cadastro implementada e testada; faltam testes de estorno/falhas de subprocessos.

**Fase 09 — NÃO CONCLUÍDA:** npm typecheck/lint/test/build/audit, testes reais PostgreSQL e pipeline E2E sintético passaram na CI [40423956171](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40423956171). O primeiro Docker Compose smoke [40424130637](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40424130637) revelou segredo opcional vazio, corrigido. O smoke foi aprovado em [40425506645](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40425506645), junto com os testes de backend/frontend/PostgreSQL. Falta segurança/carga, retenção, acessibilidade e aprovação documental.

**Bloqueador de homologação:** os seis PDFs reais permanecem `VERIFIED`, os `FormMapping` permanecem `DRAFT`, o piloto `DRAFT`, e `ServiceForm` não libera uso real. Não alterar para `APPROVED`/`AVAILABLE` sem fechar relatório e revisão documental humana. A autorização para seguir desenvolvendo **não** é revisão humana dos campos do documento.

## Segurança e resiliência incremental — continuação de 26/10/2026

**Situação:** melhorias efetivamente implementadas; fases 04–09 permanecem **parciais** e o piloto permanece `DRAFT`.

- **Sessões e origem:** corrigida aceitação de `Origin` legitimamente igual ao `Host` do frontend Nginx, sem permitir domínios externos arbitrários. Testes verificam mesma origem, origem não autorizada, `Origin: null` e frontend de desenvolvimento.
- **Processamento e privacidade:** `JobStore` protege OCR, geração e downloads de exclusão simultânea por expiração/cancelamento; renova TTL após operação, aplica quotas de criações concorrentes, um arquivo por requisito e limite global do processo. Testes de concorrência, exclusão, prazos e duplicidade.
- **Formulários e revisão:** só campos visíveis e vinculados ao mapeamento podem ser confirmados pelo usuário; campos obrigatórios são validados no servidor e na interface. Não utilizar valores OCR ocultos no PDF.
- **Retomada e descarte:** React recupera uploads após falhas, consulta status de job para retomar revisão/download após respostas perdidas e fornece cancelamento autenticado com exclusão dos dados temporários. Após a geração, alerta que excluir o PDF não estorna o crédito.
- **Uploads:** validação estrutural de chunks e CRC de PNG, MIME/assinatura, dimensões de imagem, número de páginas e geometria do PDF (via Poppler). Isso **não substitui** verificação de segurança completa dos decodificadores.
- **OCR:** campos de comprador/vendedor separados, checksum de CPF, inferência restrita a nomes acompanhados de rótulo, eliminação de imagens intermediárias após falha e subprocessos sem credenciais de banco/segredo da aplicação.
- **Créditos:** testes de estorno idempotente e rejeição de reaproveitamento inconsistente de chave; **ainda não há reconciliação persistente com um job interrompido por crash**.
- **CI:** executadas baterias TypeScript, lint, testes unitários, integração PostgreSQL + Poppler/Tesseract, build e Docker Compose com testes de origem real pelo proxy. Resultados precisam ser acompanhados no GitHub Actions a cada commit; nenhuma evidência substitui homologação documental.

**Bloqueadores mantidos:** PDFs `VERIFIED` mas mapeamentos `DRAFT`; revisão humana das páginas, requisitos condicionais e campos ausentes ainda pendentes. Não marcar fases 04–09 como [x] antes de fechar todos os critérios; não processar documentos reais nem cobrar usuários.

### Retenção temporária — marco adicional da mesma rodada

- [x] Adicionado `POST /api/jobs/:id/renew` com autorização por proprietário e resposta de expiração: a renovação é expressa, não automática no frontend.
- [x] Prazo deslizante de 20 minutos com limite **absoluto de uma hora desde `createdAt`**, mesmo após várias renovações.
- [x] Proteção contra renovação de processos expirados/removidos, mais testes unitários do limite absoluto e integração de API real.
- [x] Interface informa o prazo e permite prorrogar a sessão, testada com API simulada.

**Atenção:** a renovação não transfere arquivos ao banco de dados. O encerramento abrupto ainda requer testes de retenção após falhas; uma sessão ativa tem prazo máximo de uma hora, não promessa de retenção por uma hora inteira.

## Fase 04 — Auditoria técnica aprofundada (26/10/2026, horário de Brasília)

- **Escopo executado:** alteração do motor de preenchimento, validações semânticas, expansão de mapeamento, relatórios por formulário e regressão automatizada. A etapa de publicação/homologação não foi autorizada como substituição da conferência humana.
- **Motor:** controle do tamanho físico do campo e caracteres especiais, NFC, bloqueio de bidi/controle, página girada/CropBox, texto verdadeiro em AcroForm e marcadores sim/não declarativos. CPF/datas validados pelo backend para versões aprovadas.
- **Mapeamentos independentes:** seis modelos `DRAFT`, **135 posições**, declarações de campos essenciais, co-proprietário e até quatro motores, documento do declarante separado do vendedor. Não existe formulário duplicado por serviço.
- **Visual:** exemplos fictícios com marca “AMOSTRA”, duas rodadas de correção de checkbox de motor e complemento de endereço; relatório [FASE_04_REVISAO_VISUAL.md](docs/FASE_04_REVISAO_VISUAL.md) e relatórios individuais.
- **Regressão:** integridade SHA-256, testes de cada PDF com valores fictícios, requisitos por formulário, texto longo bloqueado e imagens PNG de todas as páginas disponíveis no artefato de CI `pdf-mapping-review-synthetic`.
- **Riscos e bloqueios:** campos de assinatura/firma manual, regras por serviço ainda não homologadas, impressão real e revisão humana independente pendentes. **Fase 04 não marcada como concluída**, piloto `DRAFT`, nenhum PDF liberado a usuário final.
- **Resultados do CI:** a execução [40431641525](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40431641525) passou nos cinco jobs de backend, frontend, PostgreSQL, Compose e revisão PDF. Conferir a execução do último commit para registrar validação final.

## Continuação técnica do MVP — 26/10/2026 (fases 05, 07 e 08)

**Mudanças commitadas e verificadas em CI com dados fictícios:**
- Upload de PDF agora verifica as dimensões **de cada página**, não só a primeira, e o teste regressivo cria um PDF com página 1 A4 e página 2 acima do limite.
- O hook `onRequest` autentica e autoriza a propriedade do job **antes de ler o corpo** de `POST /api/jobs/:id/documents/:requirementId`; o handler mantém a segunda verificação para evitar confiar em uma etapa só.
- O armazenamento temporário recusa diretórios genéricos e links simbólicos, reforça permissões privadas e testa remoção de diretórios órfãos. Testes de junction no Windows usam variante compatível.
- O endpoint autenticado `GET /api/jobs/:id` retorna respostas enumeradas do serviço, sem caminho de arquivo nem OCR completo além dos campos que o proprietário pode consultar.
- O React recupera um job válido após atualização da mesma aba: guarda somente o UUID opaco em `sessionStorage`, revalida sessão e disponibilidade com a API e reconstrói requisitos, estado de upload, revisão ou download.
- Testes sintéticos de API tentam consultar, enviar e apagar arquivos com **outra conta**, e simulam geração inválida antes de uma geração válida para verificar que não houve débito.
- Testes asseguram que diretórios órfãos da instância anterior são excluídos, sem retomar documentos pessoais armazenados no disco.
- **Evidências:** [CI 40433692288](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40433692288) e [CI 40433826699](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40433826699), ambos com cinco jobs aprovados. Conferir execução do commit final para validação consolidada.

**Ainda bloqueado:** 1) seis mapeamentos em `DRAFT` e piloto indisponível; 2) testes E2E reais de navegador, dispositivos e carga; 3) isolamento mais forte de decodificadores; 4) conciliação persistente de crédito após crash; 5) validação de requisitos condicionais/assinaturas e aprovação humana. Não iniciar cobrança real nem publicar.

## Continuação da Fase 06 — extração conservadora por documento (26/10/2026)

- `suggestFields(text, requirementId)` agora aplica regras **específicas para a origem**: comprador/vendedor não são misturados; TIE só informa a embarcação; comprovante de residência fornece endereço/CEP apenas quando rotulados explicitamente.
- CPF válido exige dígitos verificadores e apenas um valor não ambíguo. Nomes, RG e órgão emissor exigem rótulos. Campos com valores divergentes/ambíguos não são escolhidos automaticamente.
- O frontend apresenta o **nome amigável do documento de origem** e lembra que cada sugestão requer conferência antes de gerar PDFs.
- Testes sintéticos de várias origens e ambiguidades estão em `backend/src/modules/jobs/document-validator.test.ts`; testes do wizard em `frontend/src/features/real/LiveFlowPage.test.tsx`.
- **Não concluído:** OCR com documentos reais ou digitalizações de qualidade variada; medição de confiança e acurácia, correções de perspectiva e avaliação de imagens ruins. Nenhum dado de cliente usado.

## Fase 08 — entrega e estorno de créditos (26/10/2026)

- A migração `002_job_credit_receipts.sql` registra apenas UUID de job/usuário, estado e horários; não grava arquivos, OCR ou dados pessoais.
- Débito de **1 crédito por pacote** e recibo persistem juntos numa transação. Um segundo débito do mesmo job é recusado/idempotente.
- A resposta HTTP concluída marca o job `delivered`. Cancelamento anterior, expiração e reinício da única instância estornam cobranças sem entrega de forma idempotente.
- No startup, a API recupera as cobranças não entregues **antes de aceitar requisições**; uma rotina de 60 segundos procura recibos vencidos.
- Testes em PostgreSQL: cobrança, concorrência, estorno, entrega e reinício simulado. Guia: [CREDIT_DELIVERY_LIFECYCLE.md](docs/CREDIT_DELIVERY_LIFECYCLE.md).
- **Limitação bloqueante de produção:** `HTTP finish` não prova que o usuário salvou o PDF; execução com múltiplas instâncias e falhas reais exigem revisão e testes. Nenhuma cobrança real foi ativada.

## Registro de execução — atualizar a cada sessão/fase

| Data (Brasília) | Fase | Situação | Evidências (comandos, testes, arquivos, revisão) | Commit / bloqueio |
| --- | --- | --- | --- | --- |
| 2026-10-26 | Inicialização | Plano criado; nenhuma fase certificada | Estado anterior conhecido apenas pelo histórico do repositório; verificar no ambiente OpenCode | — |
| 2026-10-26 | Auditoria de arquitetura (fora das fases) | Contratos e documentação corrigidos; nenhuma fase integralmente certificada | Formulário/versão/mapeamento separados; testes sintéticos. GitHub Actions CI [40382726714](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40382726714): backend e frontend com `npm ci`, `npm audit --omit=dev --audit-level=high`, typecheck, lint, testes e build **aprovados**. Docker Compose, navegação manual e arquivos oficiais ainda não verificados nesta auditoria. | Commits de 26/10/2026; continuar Fase 00 localmente |
| 2026-10-26 | 00 — Revalidar fundação | CONCLUÍDA | Inspeção de git/estrutura/versões; backend: `npm ci`, audit 0, typecheck, lint, 22 testes e build; frontend: `npm ci` (229 pacotes após encerrar Vite que travava um binário), audit 0, typecheck, lint, 20 testes e build; Compose build/up com API, PostgreSQL e frontend `healthy`; smoke HTTP, CORS, headers e isolamento; fluxo demonstrativo completo e Lighthouse 1.0. | Base `dcaad28`; sem bloqueio |
| 2026-10-26 | 01 — Pesquisa documental | CONCLUÍDA (pesquisa; sem PDFs) | NORMAM-212/DPC 2026 conferida no PDF oficial (112 páginas; SHA-256 `A10CEDAB96556B9747AC43B5F3F8CB79637DB365071A1609F75181852C5A90A0`); item 2.4.1 e anexos 1-C, 2-A a 2-E lidos; NORMAM-101/DPC e NORMAM-211/DPC conferidas e descartadas para MA (a 211 exclui expressamente moto aquática e motonauta); página do gov.br conferida; formulários e documentos de origem separados; checklist P0/P1/P2 criado; nenhum PDF de formulário baixado para o repositório. | Commit local na branch `docs/fases-00-01`; não enviado. Fase 02 é o portão humano dos PDFs |
| 2026-10-26 | 02 — PDFs oficiais | CONCLUÍDA: arquivos baixados, verificados e portão humano confirmado | NORMAM-212/DPC 2026 oficial (112 páginas; SHA-256 `A10CED...A90A0`); 2-A, 2-B, 2-C e 1-C standalone 2026 verificados visualmente contra a NORMAM; 2-D extraído das p. 81-82 e 2-E da p. 84; o candidato CPRS do 2-E é o antigo 2-F e foi descartado; seis `FormVersion` `VERIFIED`/`STATIC` no catálogo em código; teste de integridade dos PDFs; `typecheck`, `lint`, 23 testes e `build` do backend aprovados; usuário confirmou “está tudo correto” em 26/10/2026. | Commit local da fase na branch `feat/fase-02-pdfs-oficiais`; sem push/PR. Fase 03 não iniciada |

### Relatório da Fase 00 — 26/10/2026

**Status:** CONCLUÍDA.

**Ambiente:** Windows; Node.js `24.21.0`; npm `11.19.0`; Docker `29.8.2`; Docker Compose `5.5.1`; branch `main`; base `dcaad28`; árvore limpa no início.

**Alterações desta fase:** somente `PROJECT_TRACKER.md` e `README.md` (registro documental). Nenhuma alteração funcional, dependência ou configuração de runtime.

**Validações reais:**
- Backend: `npm ci` (188 pacotes), `npm audit --omit=dev --audit-level=high` (0 vulnerabilidades), `typecheck`, `lint`, `npm test` (3 arquivos, 22 testes) e `build` — todos aprovados.
- Frontend: `npm ci` (229 pacotes; a primeira tentativa falhou porque um servidor Vite mantinha um binário aberto), `npm audit --omit=dev --audit-level=high` (0 vulnerabilidades), `typecheck`, `lint`, `npm test` (6 arquivos, 20 testes) e `build` — todos aprovados. Artefatos: JS 277,03 kB (88,21 kB gzip), CSS 31,33 kB (6,07 kB gzip).
- Docker: `docker compose config` válido; `docker compose build` e `docker compose up -d --wait` concluídos; API, PostgreSQL e frontend `healthy`.
- HTTP: `/health` 200 JSON; `/` e `/preencher/servico` 200; `/healthz` 200; `/robots.txt` 200; asset inexistente 404; rota desconhecida da API 404 JSON; CORS libera `http://127.0.0.1:8080` e bloqueia origem não autorizada; headers de segurança presentes.
- Containers: API `user=node`, frontend `user=101`, ambos `read_only`, `cap_drop=ALL` e `no-new-privileges`; PostgreSQL sem porta publicada no host.
- Navegação manual no frontend em `http://127.0.0.1:8080`: início → serviço → documentos (dados de exemplo) → leitura → conferência → download. A validação bloqueou CEP e número do motor ausentes, aceitou dados sintéticos após preenchimento e exibiu a prévia de download sem erros no console. Nenhum documento real foi enviado.
- Lighthouse na home: acessibilidade 1,0; boas práticas 1,0; SEO 1,0.

**Segurança e privacidade:** o fluxo permanece demonstrativo e local; nenhum arquivo, dado pessoal, OCR ou PDF foi enviado/persistido. O `.env` local está ignorado. Permanecem como riscos residuais: CSP `connect-src 'self'` exigirá proxy same-origin ou ajuste explícito quando a API for integrada; `/health` é apenas liveness; o CI não constrói imagens Docker; e a validação visual de 360/768/1440 px deve ser repetida na fase de QA/homologação.

**Pendência para o usuário:** nenhuma para concluir a Fase 00.

**Próxima fase elegível:** 01 — pesquisa documental e regras do serviço. Não iniciar sem autorização; a Fase 02 continua sendo o portão humano dos PDFs oficiais.

### Relatório da Fase 01 — 26/10/2026

**Status:** CONCLUÍDA (pesquisa documental; nenhum PDF oficial foi baixado para o repositório).

**Fontes verificadas:**
- NORMAM-212/DPC 2026, PDF oficial em `https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-212.pdf`; 112 páginas; 1.492.857 bytes; SHA-256 `A10CEDAB96556B9747AC43B5F3F8CB79637DB365071A1609F75181852C5A90A0`; acesso em 26/10/2026. O arquivo foi lido em diretório temporário do sistema e não entrou no repositório.
- Folha de registro de modificações da edição 2026: modificação 6 pela Portaria DPC/DGN/MB nº 201, de 27/02/2026, com efeito em 04/03/2026.
- Página do serviço no gov.br (`.../solicitar-inscricao-transferencia-de-propriedade-e-ou-jurisdicao-titulos-e-certidoes-de-embarcacoes`), última modificação em 15/12/2025; atendimento em CP/DL/AG; taxa de R$ 36,00 para transferência de propriedade de embarcação.
- Normas adicionais fornecidas pelo usuário em 26/10/2026 e conferidas para descartar aplicação cruzada: **NORMAM-101/DPC** (2023; Mod. 2 de 22/07/2026; 267 páginas; SHA-256 `74AF4D83C26A255B7C8EF9A12359F905AEF00488490D0347AD548CE0A24CD049`; regula aquaviários, não propriedade) e **NORMAM-211/DPC 2026** (268 páginas; SHA-256 `71492859082A6786203619C859FCC99BC72C85128DC9FD27D32F93A92B09598C`; esporte/recreio, mas exclui expressamente MA e motonauta e remete à NORMAM-212). Nenhuma das duas será usada para os formulários do piloto.
- Anexos oficiais 2026 localizados em sítios de CP/DL/AG: 2-A, 2-B e 2-C, além do 1-C; o 2-D e o 2-E foram conferidos no PDF oficial da NORMAM-212. Links e destinos estão no checklist da Fase 02.

**Regras confirmadas (NORMAM-212/DPC 2026, 2.4.1):**
- Requerimento pelo novo adquirente, via BDMOTO (2-B), em até 60 dias para MA inscrita em CP/DL/AG.
- 2-D com firmas do comprador e do vendedor reconhecidas por autenticidade; 2-E é comunicação opcional do vendedor.
- Documentos do rol: TIE; autorização; BDMOTO; procuração/identificação do outorgado quando aplicável; comprovante de residência; identificação com foto e CPF/CNPJ; duas fotos (popa e través); comprovante da GRU.
- O 2.4.1 não exige DPEM, vistoria, CSN ou nota fiscal autônoma. O BDMOTO pede dados da nota/venda, mas isso não amplia o rol.
- O sistema só gera minuta do 2-D; não substitui assinatura, reconhecimento de firma, pagamento da GRU ou protocolo.
- A transferência pode ser requerida em qualquer CP/DL/AG; não foi identificada jurisdição obrigatória. Exigências operacionais locais não foram generalizadas.
- Aplicabilidade confirmada: NORMAM-212/DPC 2026 é a norma específica para MA; NORMAM-211/DPC 2026 exclui MA e motonauta; NORMAM-101/DPC regula aquaviários. Não misturar anexos dessas normas.
- O piloto permanece `DRAFT`; nenhuma `FormVersion`, `FormMapping` ou `ServiceForm` foi criada.

**Formulários identificados:** 2-A (`requerimento-ma`) e 2-B (`bdmoto`) obrigatórios; 2-D (`autorizacao-transferencia-ma`) condicional, exigido quando o TIE não trouxer autorização equivalente; 2-E (`comunicacao-transferencia-ma`) opcional; 2-C (`declaracao-perda-tie-ma`) condicional para TIE extraviado; 1-C (`declaracao-residencia-ma`) condicional como alternativa de comprovante. O 3-D foi excluído por tratar da CHA de Motonauta.

**Divergências registradas:** 2.4.1(a) cita 3-D para perda do TIE, mas o modelo próprio é 2-C; 2.4.1 cita “anexo 2-S”, inexistente, quando o modelo é 2-E; a nota do 2-D cita “artigo 2.11”, mas a transferência está no 2.4.1; o 2.4.1(h) menciona GRU de inscrição, enquanto o gov.br lista transferência; alguns sítios ainda publicam formulários antigos da NORMAM-34/DPC com outra numeração. Todas as divergências estão em `docs/FORM_CATALOG.md` e devem ser confirmadas com a CP/DL/AG, sem suposição.

**Alterações desta fase:** `docs/FORM_CATALOG.md`, `docs/SERVICE_FORM_MATRIX.md`, `PROJECT_TRACKER.md` e `README.md`; nenhuma alteração funcional, dependência, PDF ou dado real.

**Validações reais:** PDFs oficiais baixados apenas para leitura e convertidos em texto no diretório temporário: NORMAM-212 (112 páginas), NORMAM-211 (268 páginas) e NORMAM-101 (267 páginas); item 2.4.1 e anexos 1-C/2-A a 2-E conferidos no índice e no texto da NORMAM-212; a introdução da NORMAM-211 confirma a exclusão de MA/motonauta e a remissão à NORMAM-212; a NORMAM-101 confirma escopo de aquaviários. Verificação HEAD dos links oficiais: NORMAM, 2-A, 2-B, 2-C, 2-E e 1-C responderam `200 OK` com `Content-Type: application/pdf` (o link inicial do 1-C com `+` retornou 404 e foi corrigido para `%20`); `git diff --check` sem erros; `backend/templates` contém somente o `README.md`, sem PDF; `git status` mostra apenas alterações documentais. Não houve teste de código porque não houve alteração de código.

**Segurança e privacidade:** nenhum documento pessoal, upload, OCR, PDF preenchido ou dado de cliente foi usado. Os PDFs públicos das normas ficaram fora do repositório e foram removidos do temporário após a extração. Nenhum segredo ou `.env` foi lido ou exposto.

**Pendência para o usuário:** fornecer/confirmar os PDFs oficiais da Fase 02, conforme o checklist P0/P1/P2. O 2-D precisa de PDF standalone atual ou confirmação da CP; não será recortado/redesenhado.

**Próxima fase elegível:** 02 — portão humano de PDFs. Não iniciar a Fase 03 antes da verificação dos arquivos e da aprovação do mapeamento na Fase 04.

### Relatório da Fase 02 — 26/10/2026

**Status:** CONCLUÍDA (downloads e verificação técnica concluídos; portão humano confirmado pelo usuário em 26/10/2026).

**Arquivos obtidos e verificados:**

| Anexo | ID / versão | Origem | Páginas | SHA-256 | Tipo |
| --- | --- | --- | --- | --- | --- |
| 2-A | `requerimento-ma-v1` | PDF 2026 da CPPE | 1 | `0E0CE9A72BE328C722D0D8C6CCB5C028E1B0881119D8A8A743BC52AA88CBFB5E` | `STATIC` |
| 2-B | `bdmoto-v1` | PDF 2026 da CPPE | 2 | `BBCC6E0FA261BE82C30FBD280697E83E750DA82B5CFB88647BA27748F0973318` | `STATIC` |
| 2-D | `autorizacao-transferencia-ma-v1` | Extrato da NORMAM-212/DPC 2026, p. 81-82 | 2 | `1E3855A0F6151481032E01823EE38985D69BAB68606A33C201ACEF0E1D2B8ED3` | `STATIC` |
| 2-E | `comunicacao-transferencia-ma-v1` | Extrato da NORMAM-212/DPC 2026, p. 84 | 1 | `3CE8A920F8E77A10105973B1B0CF74CD7A48A34B3F449496B2CC9D89E97B0419` | `STATIC` |
| 2-C | `declaracao-perda-tie-ma-v1` | PDF 2026 da DelGuaira | 1 | `A0F2464E4743AA5C60813066C16524FE2B8FDA2E67F78A6FF6472120B9BCE3EB` | `STATIC` |
| 1-C | `declaracao-residencia-ma-v1` | PDF 2026 da CPPE | 1 | `F75612D57F5D6C884D43107F17F0FB3F52B43B5A34BFAA351C6E717C26EA5782` | `STATIC` |

**Validações reais:**
- Download autorizado pelo usuário; NORMAM-212 baixada do PDF oficial da DPC/`assets.marinha.mil.br` e conferida por SHA-256 (`A10CEDAB96556B9747AC43B5F3F8CB79637DB365071A1609F75181852C5A90A0`), 112 páginas e 1.492.857 bytes.
- Links oficiais responderam `200 OK` + `application/pdf`; o 2-A, 2-B e 1-C são de 19/03/2026, o 2-C de 18/03/2026 e o NORMAM de 05/03/2026.
- Todos os seis PDFs têm assinatura `%PDF`, não estão criptografados, não têm AcroForm (`0` campos) e foram classificados como `STATIC`.
- 2-A (p. 75), 2-B (p. 76-77), 2-C (p. 79) e 1-C (p. 73) foram renderizados e comparados visualmente com as páginas correspondentes da NORMAM; layout e campos conferem. O 2-D (p. 81-82) e o 2-E (p. 84) foram extraídos com `pdf-lib`; o texto e as dimensões coincidem exatamente com as páginas de origem.
- O candidato standalone da CPRS para o 2-E foi baixado e descartado: título interno **ANEXO 2-F**, numeração antiga, 2 páginas (a segunda em branco). Não foi usado.
- Backend: `npm run typecheck`, `npm run lint`, `npm test` (4 arquivos, 23 testes, incluindo a integridade física e o SHA-256 dos seis PDFs) e `npm run build` — todos aprovados.
- PDFs completos da NORMAM e arquivos temporários permaneceram fora do repositório; somente os seis anexos foram copiados para `backend/templates/`.

**Segurança e privacidade:** nenhum documento pessoal, upload, OCR, PDF preenchido ou dado de cliente foi usado. A NORMAM é publicação pública; o PDF completo não foi versionado. O 2-D e o 2-E são derivados de páginas oficiais e estão identificados como extratos, não como arquivos standalone. Nenhum segredo ou `.env` foi lido.

**Pendência para o usuário:** nenhuma para a Fase 02. A confirmação do portão foi registrada em 26/10/2026: o usuário aceitou os seis PDFs, as fontes e os extratos 2-D/2-E, e confirmou o descarte do 2-E antigo (2-F).

**Próxima fase elegível:** 03 — API de catálogo. Não iniciada; depende de nova autorização. A Fase 04 continua responsável pelo `FormMapping` e pela renderização com dados sintéticos.

**Commit:** `commit local da fase` na branch `feat/fase-02-pdfs-oficiais`; não enviado ao remoto e sem PR.

### Modelo de relatório ao final de cada fase

```text
Fase: [número e nome]
Status: CONCLUÍDA / PARCIAL / BLOQUEADA
Alterações: [arquivos alterados e decisões]
Validações reais: [comando -> resultado, inclusive falhas]
Segurança e privacidade: [riscos tratados / riscos residuais]
Formulários: [fonte, versão e status, se aplicável]
Pendência para o usuário: [somente se houver]
Próxima fase elegível: [número]
Commit: [SHA, se realizado]
```

## Critério de encerramento do plano

- **MVP técnico:** fases 00–09 com [x] e evidências; isso **não** autoriza atendimento público nem processamento de dados reais.
- **Prontidão para produção:** fases 10–16 com [x], checklist GO/NO-GO e autorizações de custo, dados reais e cobrança.
- **Lançamento:** fase 17 com [x], publicação aprovada e acompanhamento inicial.
- **Expansão:** fase 18 é recorrente por serviço; nunca considerar todo o catálogo da Marinha concluído de uma vez.

## Registro complementar — 26/10/2026, Fase 08 (créditos de teste)

**Status:** PARCIAL; a Fase 08 permanece [ ] e a Fase 09 não foi homologada.

- **Alteração:** acrescentado teste de integração em `backend/src/modules/auth/job-credit.integration.test.ts` para impedir confirmação de entrega por outra conta e verificar estorno único de recibo vencido, preservando recibo já entregue.
- **Commit de código:** `a8607e305207dddf69e68e3deb28d4734d272867` na branch `main`.
- **Verificação executada:** releitura do arquivo alterado no GitHub, confirmando a presença do teste. **Resultado revisado:** o pipeline [40435783780](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40435783780) do commit `a8607e3` passou nos cinco jobs (backend/frontend, PostgreSQL, prévias PDF e Compose). O status anterior de não verificado se referia ao momento da implementação.
- **Segurança e privacidade:** testes usam UUIDs e contas sintéticas, sem dados pessoais reais; nenhum formulário foi aprovado nem foi ativada cobrança real.
- **Riscos e próximo passo:** executar o pipeline completo com PostgreSQL, investigar qualquer falha e continuar os testes de falhas abruptas/infraestrutura. Não marcar a fase como concluída antes das evidências.


## Registro complementar — continuidade autônoma de 26/10/2026 (Fases 05, 06 e 08)

**Status:** PARCIAL em todas as fases afetadas. Os três checks novos de regressão automatizada foram confirmados em CI; os demais critérios de aceite continuam abertos.

- **Fase 05:** `backend/src/modules/jobs/document-validator.ts` e `document-validator.test.ts`; preflight de IHDR PNG com tipos e profundidades válidos, PLTE obrigatório para paleta, chunks críticos desconhecidos e JPEG sem dimensões zero. Testes sintéticos foram corrigidos para recomputar o CRC de chunks adulterados. Commits: `3e77bf6`, `a35cc90`, `ab79c9e` e `009cf56`. Os commits intermediários falharam por CRC incorreto das fixtures sintéticas; o teste final corrigido passou no CI 40437270173.
- **Fase 06:** `backend/src/modules/jobs/ocr.ts` e `ocr.integration.test.ts`; limite de 16 MiB por raster, 48 MiB por PDF e teste sintético dos limites. Commits: `a235b85` e `1ad1f31`. A execução do Poppler ainda não ocorre em sandbox isolado com limite efetivo de CPU/RAM.
- **Fase 08:** `backend/src/modules/auth/auth-service.ts`, `server.ts` e `auth.integration.test.ts`; exclusão de sessões vencidas ao iniciar e a cada hora, com teste que preserva sessões ainda válidas. Commits: `bfbf070`, `a6af348` e `04b1ea2`. O teste de crédito `a8607e3` passou no CI anterior; testes de falha abrupta real ainda pendem.
- **Segurança:** documentos pessoais nunca foram usados nesta continuação. Fontes técnicas externas: [PNG Terceira Edição (W3C)](https://www.w3.org/TR/png/), [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) e [Node.js zlib.crc32](https://nodejs.org/api/zlib.html#zlibcrc32data-value).
- **Validação comprovada:** [CI 40437270173](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40437270173) do commit de código `009cf56` passou nos cinco jobs: checks frontend/backend (typecheck, lint, testes, build e auditoria de dependências), integração PostgreSQL, prévias PDF sintéticas e Compose. Esse resultado inclui os testes PNG/JPEG, OCR raster e limpeza de sessões. Commits de documentação posteriores exigem checagem própria de CI; eles não alteram esse resultado de código.
- **Pendências priorizadas:** `docs/RELATORIO_CONTINUIDADE_2026-10-26.md`; revisão humana dos seis mapas (todos `DRAFT`), isolamento/fuzzing do OCR, testes reais de crash e recuperação de créditos, E2E em navegador, carga e segurança antes de produção.
- **Próximo passo:** revisar CI, corrigir falhas sem avançar o marcador de fase; depois atualizar esta evidência, quadro e checklists. Não liberar `AVAILABLE` nem pagamentos reais.

## Registro complementar — estorno antecipado no TTL (Fase 08, 26/10/2026)

**Status:** SUBTAREFA CONCLUÍDA com evidência, Fase 08 permanece PARCIAL.

- **Mudanças:** `backend/src/modules/jobs/job-store.ts` notifica a expiração após remover o diretório temporário; `backend/src/routes/jobs.ts` tenta estornar com `refundUndeliveredJobCredit` (transação/idempotência preexistentes), sem atrasar a exclusão de arquivos privados se o banco estiver indisponível.
- **Testes:** `backend/src/modules/jobs/job-store.test.ts` verifica callback único, arquivos apagados antes da tentativa de estorno e limpeza mesmo com falha do callback; `backend/src/modules/auth/job-credit.integration.test.ts` usa PostgreSQL e UUIDs fictícios para verificar estorno no TTL e não estornar pacotes entregues.
- **Evidência:** [CI 40437615191](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40437615191) do commit `8e88717` aprovado nos cinco jobs, incluindo PostgreSQL real, backend/frontend, previsualizações sintéticas e Docker Compose. Commits de código: `a6948bc`, `4b4417d`, `51d4aea`, `dc137e7`, `8e88717`.
- **Documentação:** `docs/CREDIT_DELIVERY_LIFECYCLE.md` atualizada para distinguir TTL deslizante de 20 minutos e prazo absoluto de uma hora.
- **Limitações:** se o estorno antecipado falhar, a compensação só ocorre na reconciliação posterior (limite absoluto ou reinício); nenhum crash real ou falha de PostgreSQL durante o download foi validado. Instância única, créditos fictícios, nenhum pagamento real.
- **Próximos passos:** confirmar falhas abruptas, cronologia de downloads, disponibilidade de PostgreSQL e eventual arquitetura coordenada antes de escalar. Não marcar Fase 08 ou 09 como concluída.


## Registro de execução — 26/10/2026: foto fictícia → OCR → revisão → PDF (Fases 05–08)

**Status:** SUBTAREFAS TÉCNICAS CONCLUÍDAS COM TESTES; fases 05–08 continuam **PARCIAIS**, Fase 04 continua **DRAFT**, Fase 09 não homologada.

- **Escopo:** estender a leitura conservadora de TIE e documento de venda, restringir OCR aos requisitos conhecidos e publicar sugestões somente após extração completa; oferecer captura com câmera traseira; implementar modo QA em desenvolvimento desligado por padrão para o fluxo completo sem ativar o serviço oficial.
- **Arquivos de backend:** `backend/src/modules/jobs/ocr.ts`, `backend/src/routes/jobs.ts`, `backend/src/modules/catalog/qa-preview.ts`, `backend/src/modules/pdf/qa-watermark.ts`, `backend/src/config/env.ts`, `backend/src/app.ts`, `backend/src/server.ts` e testes `backend/src/modules/jobs/document-validator.test.ts`, `backend/src/modules/catalog/qa-preview.test.ts`, `backend/src/config/env.test.ts`, `backend/src/routes/qa-preview.integration.test.ts`. Corrigido o conflito de raízes temporárias entre aplicações Fastify de testes paralelos, cada uma com diretório único e limpeza ao fechar.
- **Arquivos de frontend e ambiente:** `frontend/src/features/real/LiveFlowPage.tsx`, `frontend/src/pages/HomePage.tsx`, `frontend/src/styles/pages.css`, `frontend/src/features/real/LiveFlowPage.test.tsx`, `compose.yaml`, `.env.example`. O bloco QA fica separado dos serviços homologados e mostra avisos explícitos de uso fictício.
- **Documentos:** `docs/OCR_EXTRACTION_RULES.md`, `docs/QA_SYNTHETIC_PREVIEW.md`, `docs/PENDENCIAS_PARA_2026-10-27.md`, `README.md` e este tracker.
- **Commits de referência:** OCR `3a693fa`, `f1c0433`, `3753fb8`, `4b5d75d`, `67fdf52`; câmera `ec1e4a8`, `ec2e73c`; modo QA `1f436e8`, `bc03271`, `f5e5fd8`, `2d59492`, `7ca9bde`, `555ea0e`; correção de catálogo `1bf2846`; isolamento dos testes `cf46231`, `83b7d0c`. Commits posteriores exclusivamente documentais devem ser inspecionados pelo histórico GitHub.
- **Validação verificável:** [GitHub Actions 40440558586](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40440558586) para `83b7d0c`, **cinco jobs aprovados**: `checks (backend)`, `checks (frontend)` (typecheck, lint, test, build, auditoria), `postgres-integration` (testes reais com PostgreSQL, Poppler e Tesseract), `compose-smoke` e `pdf-mapping-visual`. O teste QA exercita foto PNG sintética, OCR, revisão, preenchimento de 2-A e 2-B, download de PDF com marca d'água e saldo zero. Testes intermediários falharam por índice de ordenação no catálogo e interferência entre diretórios de tests; causas corrigidas antes desse CI verde.
- **Limitações de execução:** a validação acima provém do CI remoto, não de navegador/celular físicos e não demonstra que fotos reais serão extraídas sem erros. A execução local nesta sessão foi impossibilitada pela indisponibilidade de clonagem do repositório no container; não alegar validação local.
- **Segurança/privacidade:** serviço oficial e seis `FormMapping` permanecem `DRAFT`; QA ativo somente em `NODE_ENV=development` com flag explícita; PDF marcado como AMOSTRA em toda página, sem débito e sem documentos pessoais. Não habilitar QA com dados reais nem em produção. Isolamento real de decodificadores, fuzzing, carga e revisão LGPD ainda pendentes.
- **Bloqueios para o responsável:** revisar visualmente os seis anexos/posições, reconciliar condições documentais divergentes entre `docs/SERVICE_FORM_MATRIX.md` e `backend/src/modules/catalog/catalog.ts`, testar fotos/câmera em navegador e celular físicos. Lista priorizada e roteiro de testes: `docs/PENDENCIAS_PARA_2026-10-27.md` e `docs/QA_SYNTHETIC_PREVIEW.md`.
- **Próxima etapa técnica:** isolamento de OCR em worker com recursos limitados, E2E real, testes de falha e carga; não marcar o MVP como homologado antes de atender a todos os aceites, e não iniciar pagamentos ou deploy público.


## Registro de execução — validações adicionais de 26/10/2026 (Fases 05–08)

**Status:** novas subtarefas técnicas concluídas e verificadas; Fases 05–08 permanecem **[ ] PARCIAIS**. Fase 09 permanece não homologada.

- **OCR de fotos:** `backend/src/modules/jobs/ocr.integration.test.ts` agora gera JPEG fictício por Poppler, valida a assinatura e solicita Tesseract, verificando sugestão de nome e papel do comprador. Commit `350f10c`; não foram usadas fotos de clientes.
- **Revisão e PDFs:** `backend/src/routes/jobs.ts` rejeita CPF inválido, data impossível e tipos semânticos incompatíveis ainda na confirmação de revisão. `frontend/src/lib/api.ts` recebe apenas o identificador do campo inválido e `frontend/src/features/real/LiveFlowPage.tsx` mostra o rótulo/hint (inclusive DD/MM/AAAA); teste `frontend/src/features/real/LiveFlowPage.test.tsx`. `backend/src/routes/qa-preview.integration.test.ts` verifica que **ambos** os arquivos 2-A e 2-B contêm os nomes fictícios revisados e marcadores de AMOSTRA em cada página. Commits `b740cc7`, `73f4028`, `97f9e1b`, `736af05`, `62bfa86`, `e3253be`.
- **Concorrência de banco:** `backend/src/modules/auth/db.ts` agora executa os SQL 001/002 no mesmo cliente/transação após `pg_advisory_xact_lock(145902,1)`; o bloqueio evita DDL simultâneo de processos concorrentes e é automaticamente liberado na finalização da transação. Teste de seis inicializações em `backend/src/modules/auth/db.integration.test.ts`. Commits `23cab5d`, `68c149c`. Fundamentação: [PostgreSQL 17 — advisory locks](https://www.postgresql.org/docs/17/explicit-locking.html#ADVISORY-LOCKS).
- **Validações executadas:** [GitHub Actions 40441312938](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40441312938) do commit `68c149c`, **5/5 jobs concluídos com sucesso**: backend e frontend (typecheck/lint/tests/build/auditoria), integração PostgreSQL + Poppler/Tesseract, Compose e prévias dos formulários fictícios. Falhas de DDL concorrente em commits intermediários ocorreram antes do lock transacional, não no CI final. O ambiente local real e dispositivos móveis não foram testados.
- **Documentação:** `README.md`, `docs/QA_SYNTHETIC_PREVIEW.md`, `docs/OCR_EXTRACTION_RULES.md` e `docs/PENDENCIAS_PARA_2026-10-27.md` descrevem o escopo, o QA opt-in e os bloqueios. **Segurança:** nenhum serviço oficial habilitado e nenhum dado pessoal real processado. Nenhuma cobrança, aprovação de PDF ou deploy foi autorizado/efetuado.
- **Próxima etapa:** revisão visual/jurídica dos PDFs e condições de serviço pelo responsável; isolação de decodificadores/OCR, medições de desempenho/acurácia, E2E físico e teste de falha real antes de liberar o MVP para clientes.

## Registro de execução — correção dos testes manuais em 27/10/2026 (Fases 05–08)

**Estado:** correções implementadas e testes de regressão automatizados aprovados; Fases 05–08 permanecem **PARCIAIS**, Fase 09 **PENDENTE**. Os seis mapeamentos oficiais seguem `DRAFT`.

- **Relato do teste:** cabeçalho expunha Entrar mesmo autenticado, rodapé duplicava links, requisito obrigatório sem feedback visível, zero sugestões OCR, `PATCH /api/jobs/:id/review` devolveu HTTP 422 sem indicar campo na interface.
- **Causa observável:** menus independentes do estado de sessão; rodapé desatualizado; feedback de documentos e 422 ficava distante/sem identificação da causa; regras OCR conservadoras retornavam vazio sem relatório do motivo. **A causa exata do 422 original e do OCR vazio não pode ser determinada sem o JSON de resposta e a amostra, que não foram fornecidos.** Nenhuma validação foi desativada.
- **Backend:** `backend/src/routes/auth.ts` impede login/cadastro com cookie já autenticado; `backend/src/routes/jobs.ts` retorna identificador público de campo/requisito em 422 e diagnóstico de OCR sem conteúdo dos documentos; `backend/src/modules/jobs/job-store.ts` mantém somente contagens/resultados técnicos temporários. Testes em `backend/src/modules/auth/auth.integration.test.ts` e `backend/src/routes/qa-preview.integration.test.ts`.
- **Frontend:** `frontend/src/features/auth/AuthProvider.tsx` concentra consulta de sessão, login e logout; `AppHeader.tsx` e `AuthPage.tsx` bloqueiam navegação de login autenticado, `AppFooter.tsx` elimina links duplicados, `HomePage.tsx` corrige texto de privacidade; `LiveFlowPage.tsx` explica obrigatórios, OCR sem sugestões e o erro no campo exato; `lib/api.ts` preserva apenas IDs/códigos seguros. Testes de página, sessão, rodapé e fluxo real foram adicionados/atualizados, incluindo `HomePage.test.tsx`, `LiveFlowPage.test.tsx`, `AuthPage.test.tsx` e `AppHeader.test.tsx`.
- **CI verificado:** [GitHub Actions 40510328039](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40510328039), commit de código `af800ef`, **5/5 jobs aprovados** (`checks backend`, `checks frontend`, `postgres-integration`, `pdf-mapping-visual`, `compose-smoke`). Comandos via workflow: typecheck, lint, tests, build, integração PostgreSQL e geração de PDFs sintéticos. Runs intermediários falharam devido à adaptação de testes de navegação/cópia e foram resolvidos antes do CI verde.
- **Evidências e próximo teste:** `docs/QA_CORRECOES_2026-10-27.md` descreve causa, escopo e roteiro de reteste manual. Testar em navegador após `docker compose up -d --build` com documentos **inteiramente fictícios**, iniciar novo job e confirmar os quatro pontos.
- **Risco remanescente:** não houve acesso às fotos reais, nem medição de precisão OCR por layout/qualidade. Testes automatizados não substituem confirmação manual de UX, revisão de segurança de OCR, homologação dos seis PDFs e validação normativa. Nenhum serviço oficial, cobrança ou publicação foi liberado.

