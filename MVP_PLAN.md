# MVP — Preenchimento Automático de Formulários da Marinha

**Status:** plano de implementação | **Prioridade:** colocar um fluxo ponta a ponta em funcionamento antes de ampliar serviços.

## 1. Objetivo

Criar um SaaS web, mobile-first, que permita ao usuário selecionar um serviço da Marinha, enviar fotos ou PDFs dos documentos de origem, extrair dados automaticamente, revisar os campos, gerar os formulários oficiais preenchidos e baixar um pacote PDF. A aplicação **não protocola** processos na Marinha e **não promete aprovação**.

## 2. Escopo da primeira versão funcional

### Dentro do MVP

- **Um único serviço inicial:** transferência de propriedade de moto aquática (jet ski), com regras e formulários confirmados antes da implementação.
- Seleção do serviço e visualização do checklist de documentos de origem.
- Upload de JPG, JPEG, PNG e PDF pelo celular ou computador; captura por câmera quando o navegador oferecer suporte.
- Extração direta de texto de PDFs digitais; OCR no servidor para imagens e PDFs digitalizados.
- Extração estruturada de campos necessários, com indicação da origem e sinalização de campos não encontrados ou divergentes.
- Tela de revisão **obrigatória**: usuário corrige e confirma cada dado antes da geração.
- Preenchimento determinístico dos **modelos oficiais e vigentes** de PDF, preservando o layout.
- Download dos formulários gerados (individualmente e/ou ZIP).
- Limpeza automática dos arquivos de origem, dados extraídos e PDFs gerados após encerramento/expiração.
- Autenticação por e-mail e senha; saldos e lançamentos de créditos persistentes.
- **Créditos de teste concedidos manualmente** no protótipo; consumir um crédito apenas na primeira geração bem-sucedida do pacote, com idempotência.
- **Monetização escolhida:** créditos avulsos e pacotes pré-pagos, sem assinatura ou mensalidade. Pagamento real entra em fase comercial posterior.
- Layout legível e responsivo para celulares e computadores lentos.

### Fora do MVP

- Gestão de processos, clientes e embarcações em banco de dados.
- Múltiplos serviços da Marinha além do piloto.
- Pagamento real no protótipo inicial, assinaturas, planos empresariais e cobrança por usuários. A compra avulsa de créditos será integrada depois da validação do fluxo documental.
- Fine-tuning, RAG, Ollama ou modelo de linguagem pago.
- Integração/protocolo automático com sistemas da Marinha.
- Assinatura eletrônica, disparos de WhatsApp, validação jurídica automática e aprovação automática de documentos.

> **Decisão de escopo:** primeiro demonstrar com segurança o caminho **upload → extração → revisão → geração → download → exclusão**, com um único serviço. Não prometer implementar todo o SaaS em um dia.

## 3. Pré-requisito documental obrigatório

Antes de mapear PDFs:

1. Localizar a **NORMAM-212/DPC vigente** e as instruções atuais da Capitania escolhida para o serviço piloto.
2. Confirmar **quais formulários realmente são exigidos**, seus modelos oficiais, versões e hipóteses condicionais. Não usar listas anteriores como fonte definitiva.
3. Baixar os modelos oficiais autorizados para preenchimento, registrando `sourceUrl`, data de verificação, versão e hash SHA-256.
4. Conferir se são PDFs preenchíveis (AcroForm), PDFs estáticos ou modelos que exigem tratamento específico.
5. Mapear os campos necessários em uma planilha/arquivo de configuração versionado e submeter uma amostra fictícia preenchida à inspeção visual.
6. Se não houver confirmação normativa ou um modelo adequado, **não inventar formulário**: permitir somente prévia dos dados e marcar a geração como bloqueada.

## 4. Jornada do usuário

1. Cadastrar-se/entrar.
2. Escolher **Transferência de moto aquática**.
3. Responder às perguntas condicionais relevantes (por exemplo, pessoa física/jurídica, situação do TIE e jurisdição), conforme requisitos verificados.
4. Ver documentos solicitados e orientações para fotografar sem cortes/reflexos.
5. Anexar documentos por categoria (identidade, TIE, comprovante etc.).
6. Confirmar o término do upload e acompanhar o processamento (`aguardando`, `processando`, `revisão`, `erro`).
7. Revisar dados extraídos, inclusive diferenças entre documentos; não preencher automaticamente informação incerta.
8. Confirmar os dados e gerar o pacote final; um crédito é debitado **uma única vez** após sucesso.
9. Baixar PDFs; correções e novos downloads dentro da mesma sessão não cobram novamente.
10. Encerrar a sessão de preenchimento; eliminar arquivos e dados temporários. Sessões abandonadas expiram e são limpas automaticamente.

## 5. Arquitetura inicial

- **Frontend:** React + TypeScript + Vite, interface mobile-first.
- **Backend:** Node.js LTS compatível com as dependências + TypeScript + Fastify (ou stack existente, se já houver código).
- **Banco persistente:** PostgreSQL + Prisma apenas para usuários, créditos, sessões operacionais mínimas, templates e auditoria sem dados documentais.
- **OCR:** worker no servidor com Tesseract inicialmente; avaliar PaddleOCR somente após testes comparativos.
- **Fila:** para o protótipo, fila simples com controle de concorrência; introduzir Redis/BullMQ somente se necessário para recuperação e volume. Se houver tarefas assíncronas, preservar estado e expiração sem registrar dados pessoais nos jobs.
- **PDF:** pdf-lib ou biblioteca compatível, sempre com modelos oficiais versionados.
- **Arquivos:** diretório/volume temporário privado, **fora** da pasta pública, com expiração e exclusão; nunca incluído em backups.
- **Implantação:** Docker Compose com API, frontend, Postgres e worker OCR; configurar limites de recursos e healthchecks.

### Separação de responsabilidades

- `auth`: contas, autenticação e sessões.
- `credits`: concessão, saldo, consumo, estorno e livro-razão, sem planos nem assinaturas.
- `payments` (fase comercial posterior): compra de créditos, conciliação e confirmação pelo provedor.
- `catalog`: serviços, requisitos condicionais e versões dos formulários.
- `upload`: recepção, limites, inspeção e armazenamento temporário.
- `extraction`: PDF textual/OCR, parsing, origem e validação dos campos.
- `review`: confirmação explícita de dados.
- `forms`: mapeamento e geração determinística dos PDFs.
- `cleanup`: expiração e descarte.

## 6. Modelo mínimo de dados persistentes

- `User`: id, e-mail normalizado e único, hash da senha, timestamps.
- `CreditLedger`: id, userId, tipo (`GRANT`, `PURCHASE`, `CONSUME`, `REFUND`, `ADJUSTMENT`), quantidade, referência idempotente, timestamp. `PURCHASE` só será usado com pagamentos reais.
- `CreditPurchase` (fase comercial): userId, pacote, quantidade, valor, status, id externo do pagamento e chave de idempotência; não armazenar dados de cartão.
- `GenerationRecord`: id técnico, userId, serviceId, status, referência de consumo, timestamp; **sem nome/CPF/dados da embarcação**.
- `FormTemplate`: código, versão, serviço, hash do PDF, fonte, status de vigência.

**Não criar** tabelas permanentes de comprador, vendedor, documentos, OCR, nome da embarcação ou campos preenchidos. Evitar dados pessoais também em logs, filas, rastreamento de erros e backups. Lembrar que e-mail e dados de conta ainda são dados pessoais sob a LGPD.

## 7. Regras de negócio

- Uma unidade de cobrança = **um pacote documental de um serviço**, não uma página ou um formulário individual.
- Sem mensalidade, renovação automática, cobrança por funcionário ou planos empresariais no MVP.
- Creditar compras apenas após confirmação válida do pagamento, sem duplicação em reenvios de webhook.
- Definir explicitamente eventual expiração, estorno e reembolso de créditos antes de vendê-los; não expirar créditos silenciosamente.
- Exibir quantidade de créditos antes de gerar, bloquear geração se saldo insuficiente.
- **Não debitar** por upload, OCR, erro do servidor ou simples prévia.
- Consumo com transação no banco e chave de idempotência; repetição de requisição não consome crédito novamente.
- Falha após reserva de crédito deve liberar/estornar de modo transacional e auditável.
- Preenchimento e edição durante a mesma sessão permanecem incluídos no mesmo crédito.
- Nunca substituir um valor ausente por palpite do OCR ou de um modelo.
- Registrar qual documento e página originaram cada campo **somente na sessão temporária**, para facilitar conferência.
- O usuário confirma a exatidão antes de gerar os documentos; não inventar assinaturas, carimbos ou atestados de terceiros.

## 8. Segurança, privacidade e confiabilidade

- HTTPS em produção; senhas com Argon2id ou equivalente forte; cookies HTTP-only, Secure e SameSite apropriados (se autenticação por sessão).
- Autorização no backend em cada endpoint; limitar taxa de login, upload e processamento.
- Validar MIME real/assinatura de arquivo, tamanho, páginas e formato; proteger contra PDFs maliciosos, imagens-bomba e path traversal.
- Processar arquivos como usuário não privilegiado, sem execução de arquivos enviados; timeouts e limites de memória/CPU no worker.
- Diretório temporário fora do webroot; identificadores aleatórios; sem nomes originais em caminhos públicos.
- Logs sem conteúdo de documentos, CPF, nomes ou texto OCR; métricas apenas técnicas.
- Limpeza em `finally` quando possível e job periódico para resíduos após crash; configurar retenção curta (por exemplo, até 2 horas após upload, revisando a UX).
- Documentar exceções: dados temporários podem existir até a rotina de limpeza; evitar afirmar exclusão instantânea se ela não for garantida.
- Banco e ledger com backup externo testado; arquivos documentais temporários excluídos dos backups.
- Expor aviso de finalidade e prazo de retenção; revisar requisitos LGPD antes de produção.

## 9. Critérios de aceitação do MVP

- [ ] Um usuário novo consegue se cadastrar, autenticar-se e ver créditos de teste.
- [ ] O fluxo funciona em celular e computador sem executar OCR pesado no navegador.
- [ ] O sistema recebe JPG/PNG/PDF e rejeita arquivos inválidos com mensagens claras.
- [ ] Extrai texto de um PDF digital e de uma foto de teste com qualidade suficiente para permitir revisão.
- [ ] Campos ausentes ou conflitantes aparecem como **pendentes de confirmação**, nunca como corretos.
- [ ] Todos os dados necessários do formulário-piloto podem ser corrigidos manualmente.
- [ ] O PDF oficial gerado mantém campos alinhados, texto legível e modelo correto.
- [ ] O usuário pode baixar o arquivo gerado no celular.
- [ ] Um processo concluído consome exatamente um crédito; reenvios e retentativas não duplicam débito.
- [ ] Falhas de OCR, PDF e rede não removem créditos indevidamente.
- [ ] Dados documentais não ficam no PostgreSQL nem aparecem em logs.
- [ ] Sessões encerradas/expiradas e falhas são cobertas pela limpeza de arquivos temporários.
- [ ] Typecheck, testes principais e build passam; o fluxo ponta a ponta foi validado manualmente.

## 10. Ordem incremental de implementação no OpenCode

**Regra:** executar uma etapa por vez; revisar diff, executar validações e corrigir a causa-raiz antes de avançar. Não mudar versões/dependências sem conferir compatibilidade.

### Etapa A — Fundação
- Criar projeto/containers, `.env.example`, scripts de typecheck/test/build, healthcheck e README.
- **Validar:** subir containers, abrir frontend e obter `/health` da API.

### Etapa B — Catálogo do único serviço
- Registrar serviço-piloto, regras condicionais, arquivos oficiais e mapa dos campos versionados.
- **Validar:** seleção do serviço exibe checklist correto e arquivo PDF oficial corresponde à versão conferida.

### Etapa C — Upload temporário
- Implementar envio de JPG/PNG/PDF, validação, limites e exclusão.
- **Validar:** fotos do celular e PDFs abrem; arquivos malformados são rejeitados; nenhum upload vai para pasta pública.

### Etapa D — Extração
- Extrair texto de PDF digital; OCR no worker para imagens/digitalizações; mapear somente campos do formulário-piloto.
- **Validar:** casos sintéticos com texto legível, campo ausente e conflito; nenhuma inferência silenciosa.

### Etapa E — Revisão e geração
- Tela de confirmação; mapeamento para campos; geração usando o modelo oficial.
- **Validar:** gerar e comparar visualmente PDFs com exemplos fictícios; verificar campos longos, caracteres especiais e páginas múltiplas.

### Etapa F — Créditos e autenticação
- Cadastro/login, ledger e crédito de teste via comando/admin de desenvolvimento; consumo idempotente.
- **Validar:** saldo correto após sucesso, falha e requisições repetidas; nenhum débito duplo.

### Etapa G — Resiliência, privacidade e QA
- Cleanup pós-conclusão e por expiração; limites de recursos; testes integrados; layout mobile; acessibilidade básica.
- **Validar:** simular erro do worker, fechamento do navegador, expiração, upload interrompido e restauração do banco de teste.

## 11. Próxima fase (não implementar antes do MVP validado)

- Mais serviços: inscrição de embarcações, renovação de Arrais/Mestre/Capitão-Amador, serviços de aquaviários, conforme normas verificadas.
- **Primeira evolução comercial:** venda avulsa de créditos e pacotes pré-pagos via Pix/cartão com webhooks verificados, idempotência e conciliação.
- **Futuro fora do escopo:** equipes, contas empresariais, saldos compartilhados e eventual assinatura; não implementar sem nova decisão.
- Comparação Tesseract x PaddleOCR por documento e campo; IA local somente onde métricas demonstrarem necessidade.
- Gestão de versões dos formulários, revisão editorial e monitoramento de alterações normativas.

## 12. Instruções para o OpenCode

> Leia todo este `MVP_PLAN.md` antes de alterar arquivos. Inspecione o repositório e informe o que já existe. Trabalhe apenas na etapa solicitada; não antecipe fases. Antes de propor dependências ou comandos, confira versões e compatibilidade com o código atual. Preserve o escopo e as regras de não retenção de documentos. Para cada etapa, apresente: arquivos alterados, decisões tomadas, comandos executados, resultados de testes/typecheck/build, riscos e critérios de aceite atendidos. Se uma norma, formulário ou requisito oficial não estiver confirmado, sinalize a lacuna e não invente. Não avance com falhas de validação sem corrigi-las.

### Primeiro comando sugerido para o OpenCode

> Leia `MVP_PLAN.md`, inspecione o repositório e proponha **somente a Etapa A — Fundação**, com versões justificadas, estrutura de pastas, Docker Compose e critérios de validação. Não implemente OCR, pagamentos ou novos serviços agora. Caso não seja um repositório vazio, adapte-se ao código existente e apresente o plano antes de modificar arquivos.
