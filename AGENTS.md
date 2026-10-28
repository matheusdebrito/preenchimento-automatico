# AGENTS.md — Preenchimento Automático

## 1. Missão e prioridades

Este repositório implementa um MVP de preenchimento automático de formulários náuticos da Marinha do Brasil. O usuário escolhe um **serviço**, envia imagens/PDFs, revisa dados extraídos e recebe os formulários oficiais preenchidos. Os documentos de entrada, dados extraídos e PDFs gerados são **temporários** e não integram o cadastro persistente.

Prioridades, nesta ordem:
1. Segurança, privacidade, integridade de dados e conformidade.
2. Correção funcional e fidelidade aos modelos oficiais.
3. Simplicidade, legibilidade, manutenção e testes.
4. Desempenho mensurado e custo operacional controlado.
5. Velocidade de entrega.

**Nunca sacrificar segurança ou correção por otimização.** Não afirmar que algo foi testado, seguro, conforme ou otimizado sem evidência.

## 2. Fonte de verdade e contexto

**Obrigatório:** seguir `PROJECT_TRACKER.md` como checklist operacional de fases, atualizar seus marcadores somente após evidências de testes e parar no portão humano de download de PDFs oficiais (Fase 02). Ao retomar uma sessão, verificar a primeira fase incompleta. Não avançar de fase sem informar o resultado e não solicitar PDFs antes da pesquisa documental (Fase 01).


Antes de editar:
- Ler este arquivo, `MVP_PLAN.md`, README, configuração existente, estrutura de pastas, arquivos relevantes, testes e histórico recente de alterações disponível.
- Identificar stack, versões instaladas e suportadas, scripts, configuração TypeScript, ORM, migrations, Docker, variáveis de ambiente e padrões existentes.
- Não supor versões, APIs, sintaxes, nomes de arquivos ou comportamento de bibliotecas. Conferir documentação oficial quando disponível e compatibilidade com o código real.
- Respeitar o escopo do MVP; não adicionar IA generativa, microserviços, filas, Redis ou serviços pagos sem justificativa mensurável e aprovação explícita.
- Monetização aprovada: **créditos avulsos e pacotes pré-pagos**. Não implementar planos mensais, assinaturas, empresas ou cobranças por usuário.
- Preferir soluções e padrões já adotados no projeto. Evitar dependências desnecessárias.
- Os requisitos normativos e arquivos PDF oficiais precisam ser conferidos contra a versão vigente e a jurisdição pertinente antes de declarar um formulário apto a produção. Não inventar exigências da Marinha.

Se as instruções entrarem em conflito, informar o conflito e seguir a alternativa mais segura. Não modificar segredos, infraestrutura de produção ou dados reais sem autorização.

## 2.1. Catálogo de serviços e PDFs reutilizáveis

- O backend é a fonte de verdade para requisitos, disponibilidade de serviços, custo em créditos e vínculos com formulários; dados de `frontend/src/data/demo.ts` são exclusivamente demonstrativos.
- Antes de criar um novo formulário, procurar versão/modelo reutilizável no catálogo. Reutilizar `FieldDefinition` e motor de preenchimento, sem duplicar lógica por serviço.
- Definir `ServiceForm` como vínculo muitos-para-muitos com condições explícitas validadas no servidor; nunca executar expressões arbitrárias fornecidas pelo cliente.
- Separar `FormDefinition` (identidade independente), `FormVersion` (arquivo, revisão, origem, norma, hash e status), `FormMapping` (campos e revisão técnica) e `ServiceForm` (vínculo muitos-para-muitos por `formVersionId`). Não criar arquivos ou mapeamentos duplicados por serviço.
- PDFs oficiais devem ser armazenados somente em `backend/templates/<form-id>/<revisao-interna>/original.pdf`. Nunca usar subpastas por serviço. A revisão interna não deve ser confundida com a revisão da Marinha.
- Não marcar `FormVersion` como `VERIFIED` sem evidências documentais e verificação do arquivo, nem `FormMapping` como `APPROVED` sem relatório, testes e revisão visual humana. Serviços `AVAILABLE` exigem versão verificada + mapeamento aprovado.
- Validar dados do catálogo com `validateCatalog` nos testes e na futura inicialização da API; essa validação estática **não** substitui checagem do PDF real ou fonte oficial.
- Preservar o PDF oficial original; detectar AcroForm antes de recorrer ao preenchimento por coordenadas. Tratar cada nova versão como novo mapeamento validado.
- Gerar documentos com dados fictícios, renderizar **todas as páginas**, inspecionar alinhamento/cortes/fontes e executar testes de regressão antes de liberar produção.
- Arquivos pessoais, OCR e PDFs preenchidos não podem ser versionados ou colocados na pasta de templates; usar armazenamento temporário privado com expiração.
- Consultar `docs/FORM_CATALOG.md` e `docs/SERVICE_FORM_MATRIX.md`; eles descrevem pendências e não substituem verificação normativa oficial.

## 2.4. Escopo de motor no MVP

- O MVP trabalha com **um único motor**. O domínio ativo usa somente `vessel.motorBrand`, `vessel.motorPower` e `vessel.motorSerial`.
- Quando um formulário usar o rótulo impresso **Motor/Marca**, interpretar semanticamente apenas como **marca do motor** (`vessel.motorBrand`).
- Não criar `motor1Choice`, `motor2*`, `motor3*` ou `motor4*` enquanto múltiplos motores estiverem fora do escopo.
- Se múltiplos motores forem aprovados futuramente, reavaliar o modelo como coleção estruturada de motores; não espalhar novamente campos numerados pelo domínio sem decisão arquitetural explícita.

## 3. Método de trabalho incremental

Para cada mudança:
1. **Inspecionar:** localizar os arquivos e dependências afetados; identificar impactos em APIs, tipos, banco de dados, autenticação e segurança.
2. **Planejar:** descrever objetivo, arquivos a alterar, riscos, critérios de aceite e testes. Para tarefas pequenas, plano breve.
3. **Implementar:** fazer a menor alteração coesa possível. Evitar refatorações amplas e mudanças fora do escopo.
4. **Validar:** executar comandos existentes relevantes (lint, typecheck, testes, build e verificações de segurança). Corrigir causa-raiz antes de avançar.
5. **Relatar:** informar o que mudou, o que foi realmente executado, resultados, limitações, riscos residuais e próximos passos.

Quando uma etapa exigir decisão de produto, alteração destrutiva, novos custos ou mudanças estruturais relevantes, solicitar aprovação antes de executar. Não avançar para outra etapa enquanto erros introduzidos pela etapa atual estiverem pendentes.

## 2.2. QA do mesmo serviço real — sem homologação implícita

- Em desenvolvimento local (`NODE_ENV=development` + `DEV_QA_PREVIEW=true`), testar o identificador e os contratos reais de `transferencia-moto-aquatica`, não um serviço paralelo com campos simplificados.
- O overlay `qaPreviewCatalog` reutiliza perguntas, documentos, vínculos condicionais e os seis mapeamentos originais. A elevação transitória de status é **somente em memória no QA**; jamais escrever `APPROVED` ou `AVAILABLE` no catálogo de produção sem revisão humana.
- PDFs de QA são **sempre marcados AMOSTRA em todas as páginas**, não debitam créditos, não são válidos para protocolo e só podem usar dados inteiramente fictícios.
- Quando usuário questionar campo de PDF, conferir separadamente **rótulo impresso, área de preenchimento, identificador semântico, coordenadas e extração OCR**; não alterar/remover um campo normativo com base em suposição. Registrar divergência em `docs/mapping-reports/` e aguardar o portão de revisão visual.
- Ao ampliar OCR, aceitar somente pistas consistentes por requisito/documento e gerar sugestões para campos presentes na seleção. Não prometer reconhecimento total sem corpus medido de layouts e imagens.
- **Uploads de documentos de origem são sempre opcionais na ferramenta de preenchimento.** O usuário pode anexar zero, um ou vários documentos e deve conseguir revisar os mesmos campos mapeados ao PDF. Distinguir a validação de valores e campos necessários para gerar PDF da coleta de arquivos para OCR; jamais exigir RG/TIE/comprovante apenas por constarem do rol oficial de protocolo.
- O único caminho de usuário para transferência é `/preencher-real/transferencia-moto-aquatica` (disponível apenas em QA local enquanto DRAFT). Não reintroduzir `WizardRoute`/demo público em `/preencher/*` nem um segundo serviço de teste. Testes devem exercitar 0 anexos, 1 RG sintético e múltiplos arquivos.


## 2.3. Arquitetura obrigatória de formulários e entendimento de documentos

- **Serviço é composição, não fonte de campos.** `ServiceDefinition` contém workflow/perguntas/requisitos e `ServiceForm` seleciona versões de formulários. Os campos revisáveis devem ser derivados dos `FormMapping.placements` das versões selecionadas; não criar listas paralelas de campos por serviço.
- **Campo canônico é reutilizável.** IDs como `person.fullName`, `person.cpf` e `vessel.registration` não pertencem a um serviço, formulário ou motor OCR.
- **Documento não conhece serviço nem formulário.** OCR produz `DocumentObservation`; um `DocumentExtractor` do tipo documental produz `FieldEvidence[]`; somente depois o processo filtra pelos campos exigidos pelos formulários.
- **Formulário não conhece a origem do dado.** O preenchimento consome campos canônicos resolvidos, independentemente de terem vindo de RG, CNH, TIE, entrada manual ou outra fonte permitida.
- **Conflitos nunca são resolvidos silenciosamente.** `FieldResolver` deve bloquear seleção automática quando evidências divergirem e encaminhar o campo para revisão.
- **Não ampliar `suggestFields()` com novos tipos documentais.** Esse parser é apenas adaptador transitório para tipos ainda não migrados. RG/CNH, TIE, CHA, CIR e futuros documentos devem possuir extractors independentes com fixtures sintéticas e testes.
- Coordenadas absolutas podem auxiliar, mas não devem ser a única regra de reconhecimento. Preferir âncoras semânticas, geometria relativa, validação de formato e evidências rastreáveis.
- Até existir classificação explícita/confiável, não afirmar que um upload é RG ou CNH apenas por estar no requisito “identidade”. O perfil `identity` é transitório e deve ser separado por tipo quando a classificação for implementada.
- A especificação vigente está em `docs/DOCUMENT_UNDERSTANDING_ARCHITECTURE.md`. Mudanças que contradigam essa arquitetura exigem decisão explícita e atualização do documento.

## 3.1. Sincronização obrigatória do PROJECT_TRACKER.md

**Regra de entrega (sem exceções):** toda alteração de código, teste, arquitetura ou documentação que represente avanço, correção, bloqueio ou mudança de escopo de uma fase deve atualizar o `PROJECT_TRACKER.md` **na mesma entrega**, antes de declarar o trabalho encerrado. Não basta acrescentar uma nota ao final do arquivo.

Checklist obrigatório, nesta ordem:
1. **Quadro geral de progresso (seção 1):** revisar a linha de cada fase afetada e atualizar a descrição de situação para `Concluída`, `Parcial`, `Pendente` ou `Bloqueada`, informando em poucas palavras o que falta. Manter `[ ]` para fases parciais, pendentes ou bloqueadas e só usar `[x]` quando todos os critérios de aceite forem comprovados.
2. **Checklist detalhado da fase:** marcar as subtarefas realmente comprovadas, preservar pendências e registrar impedimentos. Nunca marcar tarefas apenas porque o código foi escrito ou o teste foi adicionado.
3. **Registro de execução:** incluir data, fase, escopo, arquivos alterados, commits, comandos e resultados reais, testes não executados, riscos e próximo passo. Distinguir `implementado`, `testado` e `homologado`.
4. **Resumo de estado:** corrigir qualquer texto antigo no próprio `PROJECT_TRACKER.md` que contradiga o quadro e, quando a funcionalidade, operação ou estado público do MVP mudar, revisar também o `README.md` e a documentação técnica pertinente.
5. **Verificação final:** antes de commit/push ou relatório final, reler o quadro geral e a fase detalhada e verificar que seções, registro e README (quando aplicável) não se contradizem. Confirmar no GitHub que as alterações foram gravadas. Se o tracker não puder ser atualizado, relatar expressamente o bloqueio e **não afirmar que a entrega documental está completa**.

Atualizações somente documentais que corrijam um registro anterior também devem verificar a coerência do quadro geral. Teste criado mas não executado deve constar como **não verificado**; CI verde anterior não comprova teste novo. Aprovação humana, homologação dos PDFs, produção e pagamentos não podem ser inferidos de alterações técnicas.

## 3.2. Padrão de engenharia ponta a ponta e regressões de QA

**Obrigatório após qualquer bug reportado pelo usuário:** investigar a causa-raiz e o fluxo completo (navegador, sessão, contrato HTTP, regras de domínio, armazenamento, OCR, geração e recuperação). Não corrigir apenas o sintoma visual ou reduzir validações de segurança para fazer um teste passar.

- Para toda operação do usuário, projetar e testar estados **inicial, carregando, sucesso, entrada ausente/inválida, indisponibilidade, retentativa, cancelamento e recuperação** conforme aplicáveis. Nenhum botão deve parecer inerte: informar a causa do bloqueio próximo à ação, inclusive para teclado/leitor de tela.
- Mensagens de erro de API devem fornecer **código estável e identificador de campo/requisito do catálogo**, nunca valores sensíveis, conteúdo OCR, documentos ou tokens. No frontend, mostrar a explicação em linguagem humana e permitir corrigir sem perder o job.
- A interface nunca é a única barreira de autorização: duplicar no backend as regras de autenticação, propriedade, troca de conta, preenchimento, créditos, expiração e disponibilidade.
- Ao alterar autenticação ou estado compartilhado, auditar cabeçalho, login, conta, logout, atualização da sessão, sessão expirada e navegação móvel, além de testes diretos da API.
- Ao alterar OCR, distinguir **texto não detectado, texto sem rótulo reconhecido, valores ambíguos e dados válidos**. Não inventar informações nem inferir identidade; incluir regressões com dados fictícios e manter a revisão humana obrigatória.
- Conferir coerência de textos, termos e privacidade **em todas as páginas**, evitando alegações desatualizadas ou informações duplicadas entre header, footer, cadastro e fluxo real.
- Antes de concluir, rodar todos os jobs do CI para o último commit de **código** (frontend, backend, PostgreSQL, PDF e Compose). Corrigir falhas e registrar o hash/execução. Testes automatizados não substituem execução manual em navegador/dispositivo e homologação normativa.
- Sempre atualizar **quadro geral, checklists e registro** do `PROJECT_TRACKER.md`, os documentos de QA afetados e o README quando a experiência ou contrato mudar. Registrar a pendência se faltar fixture, imagem anonimizada ou homologação externa.
- Avaliar segurança, manutenção, estruturas de dados, desempenho e escalabilidade pelo **sistema inteiro**, mas não adicionar infraestrutura complexa sem necessidade comprovada. Não afirmar ausência de erros ou prontidão de produção sem evidências.

## 4. Regras gerais de código

- TypeScript estrito (`strict`), tipos explícitos nas fronteiras e validação de entrada em runtime; não usar `any` nem `as unknown as` para contornar erros.
- Separar responsabilidades de rotas, serviços, domínio, persistência, OCR e geração de PDF; não criar abstrações sem necessidade.
- Preferir funções pequenas, nomes claros, tratamento explícito de erros e respostas de API consistentes.
- Implementar regras críticas de negócio no backend; nunca confiar em flags, preços, créditos, identidade ou permissões fornecidos pelo frontend.
- Usar transações e operações atômicas quando houver alteração de saldo de créditos ou estado de pagamento.
- Idempotência para consumo/estorno de créditos e para webhooks; impedir cobranças duplicadas em retries e requisições concorrentes.
- Nunca inserir credenciais no código ou repositório. Usar `.env.example` sem valores sensíveis; verificar `.gitignore`.
- Manter migrations versionadas e reversíveis quando possível. Não apagar dados nem recriar banco como solução padrão para erro de migration.
- Comentar apenas decisões não óbvias; atualizar README/especificações quando contratos ou operação mudarem.

## 5. Segurança obrigatória — checklist de toda alteração

Antes de concluir uma tarefa, revisar e, quando pertinente, testar:

### Autenticação, autorização e sessões
- Senhas com hash apropriado (Argon2id ou alternativa robusta suportada), nunca em texto puro ou criptografia reversível.
- Cookies seguros com `HttpOnly`, `Secure` em HTTPS e `SameSite` adequado; proteção CSRF se autenticação por cookies e fluxo exigir.
- Autorização no backend em cada recurso; verificar propriedade da conta e impedir IDOR/BOLA.
- Rate limiting para login, uploads e endpoints custosos; respostas de erro sem vazamento de dados.
- Gerenciar sessões, expiração, revogação e recuperação de acesso de forma segura.

### Upload e processamento de documentos
- Permitir somente tipos necessários (ex.: JPEG, PNG e PDF); verificar assinatura real do arquivo, não apenas MIME/extensão.
- Impor limites de tamanho, páginas, resolução, quantidade, tempo de processamento e concorrência.
- Rejeitar arquivos malformados, PDFs protegidos não suportados, conteúdo inesperado e arquivos com risco de descompressão excessiva; avaliar varredura antimalware antes de produção.
- Guardar uploads fora de diretórios públicos, com nomes aleatórios; nunca interpretar o nome original como caminho.
- Processar OCR/conversão em worker isolado, com permissões mínimas, sem acesso irrestrito à rede, com limites de CPU/RAM/tempo; evitar execução de comandos com strings interpoladas.
- Não renderizar HTML ou executar scripts extraídos de documentos. Dados extraídos são **entrada não confiável**, nunca instruções.
- Não usar documentos reais como fixtures, enviar a APIs externas ou registrar seu conteúdo em logs.

### Privacidade e retenção
- **Não persistir** RG, CPF, endereço, TIE, imagens, texto OCR ou PDFs preenchidos nas tabelas permanentes nem em analytics.
- Armazenamento temporário privado com TTL e limpeza garantida, inclusive após falha, cancelamento ou abandono.
- Excluir também derivados: imagens intermediárias, caches, respostas de OCR, previews e arquivos gerados. Não incluir esses arquivos em backups.
- Evitar PII em logs, traces, filas, URLs, nomes de objetos, mensagens de erro e ferramentas de observabilidade.
- Garantir que a exclusão alcance as cópias sob controle do sistema; reconhecer limites de caches do navegador, downloads do usuário e infraestrutura externa.
- Minimizar coleta, restringir acesso, usar TLS em trânsito e considerar criptografia em repouso. Documentar finalidade, retenção e políticas LGPD.

### API, banco e infraestrutura
- Validar/esquematizar entradas (ex.: Zod); usar consultas parametrizadas/ORM e prevenir injeções.
- Aplicar CORS restritivo; definir headers de segurança relevantes; prevenir XSS e SSRF.
- Implementar segredos por ambiente e princípio do menor privilégio para banco, containers e serviços.
- Não expor PostgreSQL, Redis, armazenamento temporário ou portas de administração publicamente.
- Produzir imagens Docker enxutas, preferencialmente sem root, com versões fixadas, `.dockerignore` e healthchecks.
- Verificar dependências vulneráveis, licenças e origem de pacotes; atualizar com testes, não indiscriminadamente.
- Usar HTTPS em ambientes públicos e ter backups/restauração testados para **contas, créditos, pagamentos e configurações**, nunca para documentos temporários.

## 6. OCR, dados e geração documental

- Preferir extração de texto nativo quando PDF já contiver camada textual; usar OCR somente quando necessário.
- Não permitir que OCR ou IA invente campos. Campo ausente/ambíguo deve ser mostrado como pendente de revisão.
- Guardar temporariamente a proveniência de cada dado (arquivo/campo/página), sem expô-la em logs persistentes.
- Validar CPF, formatos, datas, inscrições, campos obrigatórios e divergências entre fontes. Validação sintática não prova autenticidade.
- Exigir confirmação humana antes da geração final e sinalizar claramente dados incertos.
- Usar **PDFs oficiais versionados e mapeamento determinístico de campos**; não recriar livremente os layouts com IA.
- Testar campos longos, acentos, formatação, impressão, páginas, assinaturas e integridade visual do PDF.
- Separar `ServiceDefinition`, `DocumentRequirement`, `FormDefinition`, `FormVersion`, `FormMapping` e `ServiceForm`. O backend associa versões de documentos a serviços somente após validar exigências e condições.
- Não afirmar que o documento gerado foi aprovado pela Marinha ou que substitui assinatura/protocolo oficial.

## 7. Desempenho e otimização

- Priorizar experiência em celulares e computadores lentos: frontend leve, interface responsiva e upload com feedback.
- Executar OCR no servidor, fora do processo HTTP principal quando necessário; evitar travar o event loop.
- Limitar trabalhos simultâneos e usar fila se os testes mostrarem necessidade; não adicionar complexidade antes disso.
- Minimizar uploads por compressão/reescalonamento **sem perder legibilidade ou caracteres críticos**; preservar opção de arquivo original.
- Evitar OCR duplicado, conversões redundantes, consultas N+1 e carregamento integral de arquivos grandes em memória.
- Medir latência (upload, OCR, geração), uso de CPU/RAM, taxa de erro e custo por processo antes de otimizar.
- Fazer benchmarks com PDFs nativos, scans e fotos de qualidade variada; registrar contexto e resultados. Não alegar ganho sem medição.
- Otimizações nunca podem degradar precisão, privacidade ou segurança.

## 8. Testes e critérios mínimos de aceite

Exigir, conforme a mudança:
- `lint`, `typecheck`, `build` e testes automatizados existentes passando.
- Testes unitários para o catálogo independente, relações muitos-para-muitos, versões, mapeamentos, condições, crédito, validação de campos e expiração. Criar fixtures sintéticas de dois serviços compartilhando um mesmo formulário.
- Testes de integração para upload, OCR (com mocks quando apropriado), geração de PDF e autorização.
- Testes de segurança para acesso indevido, extensão falsa, arquivo acima do limite, arquivo corrompido, repetição de requisições, concorrência e tentativas de path traversal.
- Testes de falha: timeout OCR, falha do worker, usuário fechando navegador, sessão expirada, falta de espaço e limpeza de temporários.
- Conferência visual dos formulários PDF gerados contra modelos oficiais, com dados **fictícios**, casos difíceis e relatório padronizado por versão (`docs/FORM_MAPPING_REPORT_TEMPLATE.md`).
- Teste de restauração dos dados persistentes financeiros antes de produção.

Se um teste não puder ser executado, informar claramente **qual teste, por quê e qual risco permanece**. Nunca marcar validação como concluída sem executar.

## 9. Escopo de dados e créditos

Persistente: usuários, credenciais em hash, movimentações auditáveis de créditos, configurações e catálogo/versionamento de formulários. Compras e referências externas de pagamento somente quando a etapa comercial for implementada. Não criar organizações, planos ou assinaturas no MVP.

Temporário: uploads, imagens intermediárias, dados OCR, dados de processo, prévias e PDFs preenchidos.

- Um crédito corresponde a **um processo documental**, não a cada formulário ou correção.
- Não consumir crédito irreversivelmente antes da geração prevista; tratar falhas com estorno ou liberação da reserva, em transação idempotente.
- Correções e reexportações da mesma sessão não devem cobrar novamente dentro da política definida.
- Verificar saldo e permissão no backend, sem pressupor plano mensal.
- No protótipo, usar concessão de créditos de teste. Na etapa comercial, permitir compras avulsas e pacotes pré-pagos.
- Ao integrar pagamento, creditar somente após confirmação válida, autenticar webhooks, assegurar idempotência e conciliar falhas.
- Não implementar cobrança real até existir especificação e testes específicos de integração com o provedor.
- Não impor vencimento a créditos comprados sem política explícita e revisão das obrigações aplicáveis.

## 10. Condições de entrega para cada etapa

Encerrar cada tarefa com este resumo:

```text
Objetivo:
Arquivos alterados:
Decisões e compatibilidade verificadas:
Riscos de segurança analisados e mitigados:
Impacto de desempenho (medido ou ainda não medido):
Comandos executados e resultados:
Critérios de aceite atendidos:
Pendências e riscos residuais:
Próxima menor etapa recomendada:
```

**Autorização específica de 26/10/2026:** continuar consecutivamente as tarefas técnicas das fases 00–09 do MVP sem novas autorizações de fase, respeitando bloqueios de segurança e homologação. Não iniciar pagamentos reais, publicação ou tratamento de documentos reais antes da revisão e das autorizações correspondentes. Não mascarar erros, não pular validações e não declarar o MVP pronto para produção sem revisão de segurança, privacidade e conformidade documental.**


## Continuidade até produção

Siga as fases 10 a 18 de `PROJECT_TRACKER.md` após concluir o MVP técnico. Exija aprovação explícita antes de contratar infraestrutura, publicar o sistema, aceitar documentos reais ou ativar cobranças. Verifique segurança, LGPD, backups e restauração, monitoramento, carga, rollback e decisão de lançamento. A expansão de cada serviço exige nova verificação de formulários e homologação. Planos empresariais e assinaturas continuam fora do escopo aprovado.

## Regras adicionais para retentativas, documentos e autenticação

- Não presumir que `CORS_ORIGINS` equivale a requisições **same-origin**. Uma chamada POST feita pelo navegador ao próprio frontend atrás do proxy deve ser permitida, mas `Origin` externo não autorizado deve ser recusado. Testar o fluxo no Nginx e no Fastify.
- Nunca apagar um job enquanto OCR, geração ou streaming de download estiverem ativos. Implementar limites de concorrência e prazo temporário, documentar exceções de fechamento e monitorar discos e memória.
- Validar assinaturas/estrutura de arquivo antes de utilizar decodificadores; limites de tamanho, páginas e geometria não são substitutos de sandbox ou atualização de dependências.
- Dados extraídos do documento do vendedor **não** podem ser atribuídos automaticamente aos campos do comprador. Candidatos de OCR, mesmo com dígitos validadores corretos, são sugestões e dependem de conferência.
- Em retentativas, reutilizar o job idempotentemente e nunca cobrar duas vezes. O registro do estado de débito para recuperação após queda do processo ainda exige solução antes de produção.
- A API deve rejeitar qualquer campo de revisão não incluído na projeção visível do serviço e confirmar todos os obrigatórios. Não preencher silenciosamente informações que o usuário não viu.

## Regras técnicas obrigatórias — fase 04 de PDFs

- `FieldDefinition` e `FormMapping` devem permanecer independentes de `ServiceDefinition`; só associar `ServiceForm` após verificar que o PDF e suas condições atendem ao serviço.
- A geração real exige `FormVersion=VERIFIED`, hash SHA-256 idêntico e exatamente um `FormMapping=APPROVED` com relatório/atesto humano. `TESTED` sozinho não autoriza distribuição.
- Não truncar, eliminar acentos, reduzir fontes a tamanhos ilegíveis nem reconstruir PDFs oficiais. Se um campo não comportar texto legítimo, informar impedimento e solicitar revisão, não mascarar.
- Tratar CPF, datas e escolhas sim/não como dados semânticos validados. Nunca utilizar o CPF do vendedor como se fosse do declarante ou comprador.
- **Assinaturas, carimbos, protocolo, autenticação e reconhecimento de firma são manuais.** Não criar automação dessas áreas na Fase 04.
- Para revisar os seis mapas, consultar `docs/FASE_04_REVISAO_VISUAL.md` e os artefatos fictícios do CI. Apenas revisores humanos podem atestar aprovação final.

## Exigências adicionais de segurança e QA — uploads e retomada

- Para arquivos acima de bytes pequenos, autorizar o dono e o requisito no hook `onRequest` antes de bufferizar; repetir a autorização na operação efetiva. Não confiar apenas em validação de MIME/tamanho.
- PDF digitalizado multipágina deve passar pela verificação de **cada página** antes da rasterização. Um PDF com primeira página A4 e segunda gigante deve ser recusado.
- O diretório de arquivos privados não pode ser uma raiz genérica nem symlink, não pode entrar em backups/webroot e precisa de permissões restritivas. Testar cenários de restos órfãos após interrupções.
- Estado de sessão retomável do wizard: usar apenas UUID opaco no `sessionStorage` da aba. **Nunca armazenar CPF, OCR, campos digitados, nomes de documentos ou PDF no navegador.** Conferir propriedade/expiração no servidor a cada restauração.
- Ao estender testes E2E, verificar que um usuário não pode ler, subir ou excluir documentos do outro e que falha de emissão não desconta créditos. A recuperação após crash com ledger persistente ainda não está implementada.

## Regras adicionais de extração OCR — Fase 06

- Somente sugerir valores documentais quando o tipo de documento e o rótulo identificarem o campo semântico com baixa ambiguidade. TIE não fornece automaticamente CPF do comprador; identidade do vendedor não preenche o comprador.
- CPF com dígito verificador correto **não comprova identidade**; sugestões continuam em `REVIEW_REQUIRED`.
- Se houver dois valores diferentes que encaixem na mesma regra, não selecionar nenhum. Campos ausentes permanecem vazios para preenchimento manual.
- Nunca anunciar porcentagem de confiança sem evidências reais do OCR. Investigar imagem rotacionada, perspectiva, sombras e leituras inconsistentes antes de abrir para público.
- Verificar e atualizar `docs/OCR_EXTRACTION_RULES.md` e testes unitários sempre que acrescentar padrões.

## Cobrança com entrega — regras técnicas

- Um serviço concluído gera no máximo **1 débito**, independentemente de quantos formulários existam no pacote. O débito e o recibo precisam ser inseridos atomicamente em PostgreSQL.
- Não persistir conteúdo de documento, CPF, dados OCR ou campos de formulários em `job_credit_receipts`; somente job UUID, usuário UUID, estado e timestamps.
- Não marcar um pacote como entregue antes de a resposta de download terminar; `HTTP finish` não garante que o cliente tenha salvo o arquivo.
- A reconciliação de startup atual pressupõe **apenas uma instância** com jobs efêmeros; proibir implantação multi-instância sem novo projeto e testes de recuperação.
- Não ativar cobrança real antes de crash-test, revisão de reembolso e homologação da entrega.
