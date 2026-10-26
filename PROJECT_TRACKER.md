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
7. Fazer uma fase por vez; após concluir, **parar e informar o resultado**, inclusive pendências. Não avançar automaticamente.
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
| 02 | **Solicitar PDFs oficiais e verificar versões (sem aprovação do mapeamento)** | 01 | [ ] |
| 03 | API de catálogo e integração de seleção | 02; liberar serviço real somente após 04 | [ ] |
| 04 | Motor reutilizável de preenchimento PDF | 02 | [ ] |
| 05 | Upload seguro e retenção temporária | 00 | [ ] |
| 06 | OCR/extração estruturada no servidor | 05 | [ ] |
| 07 | Revisão humana e jornada integrada | 03, 04, 06 | [ ] |
| 08 | Autenticação, créditos de teste e consumo idempotente | 07 | [ ] |
| 09 | Hardening e homologação ponta a ponta | 08 | [ ] |
| 10 | Pagamentos reais por créditos, em sandbox e liberação controlada | 09 e aprovação explícita | [ ] |
| 11 | Infraestrutura de produção e deploy reproduzível | 09 e aprovação explícita | [ ] |
| 12 | Segurança de produção e gestão de segredos | 11 | [ ] |
| 13 | LGPD, políticas e retenção verificadas | 09, 11 e revisão responsável | [ ] |
| 14 | Observabilidade, backup e recuperação | 11, 12 | [ ] |
| 15 | Carga, capacidade e custos operacionais | 11, 14 | [ ] |
| 16 | Homologação pré-lançamento e revisão do go/no-go | 10–15 | [ ] |
| 17 | Lançamento controlado e acompanhamento | 16 e autorização explícita | [ ] |
| 18 | Expansão incremental de serviços | 17 e decisão por serviço | [ ] |

> **Estado inicial conhecido em 26/10/2026:** frontend demonstrativo, API Fastify com healthcheck, Compose/PostgreSQL e contratos preliminares de catálogo foram adicionados ao repositório. Esses fatos **não significam** aprovação de build/testes nem homologação dos PDFs. A Fase 00 foi executada localmente e registrada abaixo em 26/10/2026; a Fase 01 também foi registrada na mesma data, com pesquisa normativa concluída e **sem PDFs oficiais obtidos**. O registro contém as evidências verificáveis.

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

- [ ] Parar a execução e mostrar **somente os PDFs efetivamente necessários ao serviço piloto**, separando modelos condicionais, com links oficiais verificados.
- [ ] Para cada formulário **ainda não disponível e verificado**, solicitar o PDF oficial em branco para `backend/templates/<form-id>/<revisao-interna>/original.pdf`. O `form-id` identifica o formulário, não o serviço; `revisao-interna` é um slug controlado e **não** se confunde com versão oficial. Exemplo ilustrativo: `backend/templates/bdmoto/v1/original.pdf`.
- [ ] Aceitar download realizado pelo agente apenas com fonte oficial comprovável e autorização do usuário; **nunca fabricar, redesenhar ou substituir o PDF original**.
- [ ] **AGUARDAR a confirmação de que os arquivos estão presentes**, depois inspecionar bytes, assinatura `%PDF`, páginas, dimensões, campos AcroForm e metadados.
- [ ] Registrar cada **FormVersion**: `formId`, `revision` interna, revisão oficial (se existir), fonte e norma, jurisdição relevante, data de verificação, SHA-256, caminho, tipo PDF (`ACROFORM`, `STATIC` ou `UNKNOWN`) e status `IDENTIFIED`/`VERIFIED`/`OUTDATED`.
- [ ] Reutilizar o mesmo arquivo e seu futuro mapeamento quando mais de um serviço empregar a mesma versão oficial.
- [ ] Conferir se a versão/estrutura é consistente com a fonte; em caso de divergência, bloqueio ou PDF ausente, **não avançar**.
- [ ] Verificar condições de uso/versionamento de modelos públicos; nunca adicionar documentos pessoais nem arquivos preenchidos com dados reais ao Git.
- [ ] **Portão humano:** apresentar a relação de arquivos oficiais disponíveis, requisitos documentais verificados e lacunas; confirmar com o usuário antes de encerrar a fase. Nenhum mapeamento será marcado como aprovado aqui.
- **Aceite:** modelos oficiais necessários para o serviço piloto presentes, individualmente versionados e verificados contra a fonte. **Aprovação de FormMapping somente na Fase 04** após teste visual humano. Relações com serviços serão adicionadas apenas após confirmação de sua aplicabilidade.

### Mensagem que o OpenCode deve apresentar no portão de PDFs

> Chegamos ao cadastro independente de formulários oficiais. Para continuar, preciso dos **PDFs em branco ainda ausentes**: **[nome e ID do formulário + finalidade + norma/versão + link oficial verificado + caminho de destino `backend/templates/<form-id>/<revisao-interna>/original.pdf`]**. O arquivo poderá ser reutilizado por vários serviços. Não envie documentos preenchidos ou com dados pessoais. Confirme quando os PDFs estiverem disponíveis; verificarei integridade, fonte, versão e campos antes de mapear. Se a lista ainda estiver incerta, informarei o que precisa ser esclarecido.

## Fase 03 — API de catálogo e contratos

- [ ] Utilizar `validateCatalog` e conferir serviços, formulários, versões, mapeamentos e `ServiceForm` muitos-para-muitos por **FormVersion**, inclusive perguntas e condições enumeradas.
- [ ] Expor endpoints públicos **apenas de serviços realmente disponíveis**; rascunhos são internos e não liberam geração. O piloto só muda para `AVAILABLE` **depois** de modelos verificados e mapeamentos aprovados na Fase 04.
- [ ] Migrar seleção/checklist do frontend de dados hardcoded para a API sem remover a demonstração.
- [ ] Testar relações inexistentes, versões inativas, condições e restrição de disponibilidade.
- **Aceite:** API e interface mostram o mesmo catálogo validado; nenhuma exigência inventada é exposta como oficial.

## Fase 04 — Motor genérico de PDFs

- [ ] Detectar campos AcroForm; para PDFs estáticos, definir coordenadas por página, unidades e fontes.
- [ ] Separar **campo semântico** de **campo/posição do PDF**, permitindo reutilização do motor entre serviços.
- [ ] Versionar `FormVersion` (modelo oficial e hash) e `FormMapping` (revisão técnica) separadamente. Nunca modificar o PDF original nem recriar seu layout.
- [ ] Criar um relatório **por formulário/versão** usando `docs/FORM_MAPPING_REPORT_TEMPLATE.md`, identificando campos automáticos, revisados e pendentes, páginas, geometria, casos de teste e resultados.
- [ ] Implementar validações de comprimento, acentos, quebras de linha, espaços para assinaturas e campos condicionais.
- [ ] Gerar PDFs com **dados sintéticos**, renderizar **todas as páginas** e conferir visualmente texto cortado, sobreposição e paginação.
- [ ] Executar testes automatizados de regressão por modelo, guardar evidências sintéticas sem dados reais e obter revisão humana explícita antes de marcar **FormMapping = `APPROVED`**; manter FormVersion = `VERIFIED` e bloquear versões `OUTDATED`.
- **Aceite:** pacote piloto gerado corretamente com dados fictícios, modelo preservado, visual inspecionado e sem documento real.

## Fase 05 — Upload seguro e temporário

- [ ] Implementar upload JPG/JPEG/PNG/PDF com validação de conteúdo real, limites de tamanho/páginas/dimensões e proteção contra arquivos maliciosos.
- [ ] Armazenar apenas em volume privado temporário, isolado do webroot e backups; gerar IDs aleatórios, sem nome do cliente no path.
- [ ] Exigir acesso autorizado ao job; impor quotas, limites de concorrência, timeout e limpeza após encerramento/expiração/falha.
- [ ] Testar upload inválido, truncado, grande, PDF malformado e cancelamento.
- **Aceite:** nenhum dado documental persistido no PostgreSQL, logs ou repositório.

## Fase 06 — PDF textual, OCR e extração estruturada

- [ ] Extrair texto nativo de PDFs digitais sem OCR quando possível.
- [ ] Converter páginas de PDFs digitalizados para imagens sob limites de recursos.
- [ ] Executar Tesseract no servidor/worker com tratamento de qualidade de imagem e limites de CPU/memória.
- [ ] Mapear texto para IDs semânticos reutilizáveis; registrar origem/confiança somente no job temporário.
- [ ] Detectar conflitos e ausências; nunca completar valores por suposição.
- [ ] Testar fotos/PDFs **sintéticos**, com qualidade variada e campos ambíguos.
- **Aceite:** extração rastreável, falhas tratadas e nenhuma confiança excessiva em OCR.

## Fase 07 — Revisão e integração do wizard

- [ ] Substituir o fluxo fictício por API real com separação clara entre demonstração e produção.
- [ ] Permitir corrigir todos os campos necessários e confirmar explicitamente dados antes da geração.
- [ ] Integrar seleção → upload → leitura → conferência → geração → download.
- [ ] Preservar UX mobile-first, paleta, ícones e acessibilidade estabelecidos.
- [ ] Testar fechamento do navegador, falha de rede, retorno à sessão temporária, download e expiração.
- **Aceite:** fluxo funcional com documentos sintéticos, mensagens corretas e nenhuma geração sem revisão.

## Fase 08 — Autenticação e créditos de teste

- [ ] Criar persistência mínima para usuários e ledger de créditos; não armazenar dados de clientes ou embarcações.
- [ ] Implementar autenticação, autorização por operação, proteção de sessão e limitação de taxa.
- [ ] Conceder créditos de **teste** por mecanismo interno seguro; não integrar cobrança real nesta fase.
- [ ] Debitar **uma vez por pacote documental gerado com sucesso**, usando transação e idempotência; retentativas, ajustes ou falhas não geram débito duplicado.
- [ ] Testar concorrência, acesso entre usuários, estorno e recuperação de falha.
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

## Registro de execução — atualizar a cada sessão/fase

| Data (Brasília) | Fase | Situação | Evidências (comandos, testes, arquivos, revisão) | Commit / bloqueio |
| --- | --- | --- | --- | --- |
| 2026-10-26 | Inicialização | Plano criado; nenhuma fase certificada | Estado anterior conhecido apenas pelo histórico do repositório; verificar no ambiente OpenCode | — |
| 2026-10-26 | Auditoria de arquitetura (fora das fases) | Contratos e documentação corrigidos; nenhuma fase integralmente certificada | Formulário/versão/mapeamento separados; testes sintéticos. GitHub Actions CI [40382726714](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40382726714): backend e frontend com `npm ci`, `npm audit --omit=dev --audit-level=high`, typecheck, lint, testes e build **aprovados**. Docker Compose, navegação manual e arquivos oficiais ainda não verificados nesta auditoria. | Commits de 26/10/2026; continuar Fase 00 localmente |
| 2026-10-26 | 00 — Revalidar fundação | CONCLUÍDA | Inspeção de git/estrutura/versões; backend: `npm ci`, audit 0, typecheck, lint, 22 testes e build; frontend: `npm ci` (229 pacotes após encerrar Vite que travava um binário), audit 0, typecheck, lint, 20 testes e build; Compose build/up com API, PostgreSQL e frontend `healthy`; smoke HTTP, CORS, headers e isolamento; fluxo demonstrativo completo e Lighthouse 1.0. | Base `dcaad28`; sem bloqueio |
| 2026-10-26 | 01 — Pesquisa documental | CONCLUÍDA (pesquisa; sem PDFs) | NORMAM-212/DPC 2026 conferida no PDF oficial (112 páginas; SHA-256 `A10CEDAB96556B9747AC43B5F3F8CB79637DB365071A1609F75181852C5A90A0`); item 2.4.1 e anexos 1-C, 2-A a 2-E lidos; NORMAM-101/DPC e NORMAM-211/DPC conferidas e descartadas para MA (a 211 exclui expressamente moto aquática e motonauta); página do gov.br conferida; formulários e documentos de origem separados; checklist P0/P1/P2 criado; nenhum PDF de formulário baixado para o repositório. | Commit local na branch `docs/fases-00-01`; não enviado. Fase 02 é o portão humano dos PDFs |

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
