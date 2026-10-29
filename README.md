# Preenchimento Automático — SaaS de formulários náuticos

Aplicação mobile-first que auxilia usuários a enviar documentos, revisar informações extraídas e gerar **modelos oficiais de formulários náuticos**, preservando o PDF original. Plataforma privada, independente da Marinha do Brasil: **não realiza protocolo oficial nem garante aceitação do documento**.

> **Status em 26/10/2026:** Fases 00–03 concluídas. O núcleo das fases 04–08 foi implementado e testado com dados **sintéticos**, mas **a homologação do MVP está pendente**. Os seis PDFs oficiais estão verificados; seus mapeamentos estão em `DRAFT`, e o serviço de transferência de moto aquática permanece `DRAFT` (não liberado). Nenhum cliente real, pagamento ou aprovação oficial foi processado.

## Estado do desenvolvimento

| Componente | Implementado | Restrições |
| --- | --- | --- |
| Catálogo de serviços e condições | API e frontend integrados; fotos de popa/través excluídas dos uploads de preenchimento | Só serviços aprovados ficam disponíveis; não substitui rol documental oficial |
| Seis anexos oficiais da NORMAM-212/DPC (2026) | Identidade e SHA-256 verificados | Não são automaticamente homologados para preenchimento |
| Mapeamento PDF reutilizável | **118 posições em seis formulários** | `DRAFT`; exemplos sintéticos e regressões testados, conferência humana pendente |
| Preenchimento pdf-lib | Motor determinístico, verificação de hash e testes | Exige `APPROVED`, bloqueando o piloto |
| Upload/limpeza | Autorização pré-upload, diretório privado, quotas, TTL, verificação por página PDF e preflight adicional PNG/JPEG | Exige fuzzing/isolamento de decodificadores e testes de carga |
| OCR no servidor | OCR conservador com extração individual de endereço, número, complemento, cidade, bairro, UF e CEP rotulados, além dos campos anteriores | Ausência de rótulos/baixa legibilidade ainda exigem revisão; sem precisão comprovada com fotos reais |
| Autenticação e créditos | PostgreSQL, sessões HttpOnly, menu conectado à sessão, logout obrigatório para trocar conta, ledger/recibos/estornos | Instância única, créditos de teste; sem pagamentos reais |
| Fluxo React integrado | Arquivos de OCR opcionais (inclusive zero), preenchimento manual ou misto, revisão de dados, geração e download no único serviço real | Produção permanece DRAFT; prévias com AMOSTRA, sem créditos e sem documentos pessoais |
| Testes automatizados | CI com npm, Postgres real e Docker Compose | Não substitui homologação documental, carga nem teste manual real |

Consulte o [fluxo de entrega e estorno de créditos](docs/CREDIT_DELIVERY_LIFECYCLE.md), as [regras e limites do OCR](docs/OCR_EXTRACTION_RULES.md), o [status técnico detalhado](docs/MVP_STATUS_2026-10-26.md), o [planejamento](PROJECT_TRACKER.md), o [roteiro de revisão humana dos PDFs](docs/FASE_04_REVISAO_VISUAL.md), o [relatório de segurança incremental](docs/SECURITY_HARDENING_2026-10-26.md) e os [relatórios de mapeamento](docs/mapping-reports/).

## Estrutura

```text
backend/
  src/modules/catalog/        # FormDefinition, FormVersion, FormMapping e ServiceForm
  src/modules/pdf/            # Motor de preenchimento e integridade do original
  src/modules/jobs/           # Validação de uploads, TTL e OCR
  src/modules/auth/           # PostgreSQL, credenciais e créditos
  src/routes/                 # /health, /api/services, /api/auth, /api/jobs
  templates/<form-id>/<revisao-interna>/original.pdf
  migrations/001_initial.sql
  migrations/002_job_credit_receipts.sql
frontend/
  src/features/wizard/        # Demonstração sem upload ao servidor
  src/features/real/          # Jornada da API (somente QA sintético; serviço real bloqueado)
  src/pages/
  nginx/default.conf         # Proxy same-origin /api e cabeçalhos de proteção
docs/
  FORM_CATALOG.md
  SERVICE_FORM_MATRIX.md
  mapping-reports/
  _pdf_test_previews/         # Imagens de PDFs com dados fictícios
```

Formulários são versionados e mapeados **independentemente dos serviços**, depois associados via `ServiceForm`. Não duplicar arquivos por serviço.

### Escopo de motor no MVP

O MVP trabalha com **um único motor** por processo/formulário. Os campos canônicos ativos são:

- `vessel.motorBrand`: marca do motor. Quando o formulário imprimir **Motor/Marca**, interpretar exclusivamente como marca;
- `vessel.motorPower`: potência;
- `vessel.motorSerial`: número de série.

Campos `motor2`, `motor3`, `motor4` e marcações sim/não por motor não fazem parte do domínio ativo. Se suporte a múltiplos motores for necessário futuramente, o modelo deve evoluir de forma estrutural, preferencialmente para uma coleção de motores, em vez de reintroduzir campos numerados espalhados pelo domínio.

### Retomada segura de processos

Enquanto a sessão temporária estiver válida, atualizar a mesma aba permite recuperar o job e continuar a conferência ou o download. A aba mantém **somente o UUID aleatório do job em `sessionStorage`**; os PDFs, dados pessoais, OCR e conteúdo digitado permanecem privados no servidor e não são copiados para o armazenamento do navegador. Ao encerrar e apagar o job, o identificador também é descartado. A recuperação não é garantida depois de fechar a aba/navegador, expirar a sessão, reiniciar a instância ou trocar de conta.

**Armazenamento temporário:** quando configurar `TEMP_DOCUMENT_ROOT` manualmente, use uma pasta absoluta, exclusiva e privada, nunca uma raiz genérica (`/tmp`, `/`, a raiz do repositório) nem um link simbólico. A aplicação deve falhar em caso de configuração insegura.

## Ambiente local

Pré-requisitos: Node.js 24 LTS, npm compatível e Docker Compose.

Copie `.env.example` para `.env` e defina uma senha PostgreSQL forte e exclusiva para o ambiente local:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

- Frontend: http://127.0.0.1:8080
- API (liveness): http://127.0.0.1:3000/health
- Catálogo público: http://127.0.0.1:8080/api/services — retorna lista vazia até haver serviço aprovado
- Demonstração: http://127.0.0.1:8080/preencher/servico — não envia documentos ao servidor
- Conta: http://127.0.0.1:8080/entrar
- Jornada real: `/preencher-real/:serviceId` — somente para catálogo homologado

O Compose usa PostgreSQL privado na rede Docker, API e frontend vinculados a `127.0.0.1` e Nginx como proxy de `/api`. Não exponha a stack local publicamente, pois não há TLS nem os controles completos de produção. Para desligar: `docker compose down`. **`docker compose down -v` apaga os dados locais persistentes do PostgreSQL.**

O segredo `DEV_GRANT_SECRET` é opcional, restrito a ambiente de desenvolvimento e necessário para acionar o endpoint interno de concessão de três créditos **de teste**; não há cobrança real.

### Comandos de validação

Em cada pasta `backend/` e `frontend/`:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

O [GitHub Actions](.github/workflows/ci.yml) também executa auditoria de dependências de produção, integração com PostgreSQL real e smoke test Docker Compose. Os testes usam dados sintéticos, inclusive PDFs oficiais preenchidos só para QA. Antes de abrir PR, especialmente em mudanças de OCR/document-understanding, execute o gate descrito em [Validação antes de Pull Request](docs/PRE_PR_VALIDATION.md); o workflow manual `Pre-PR OCR` valida regras determinísticas e os documentos reais de referência antes do CI normal do PR.

**Validação incremental:** o teste de autorização entre contas e estorno por expiração (`a8607e3`) foi aprovado no [CI com PostgreSQL e Compose](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40435783780). Também foram adicionados controles de consistência para PNG/JPEG, limite de bytes dos arquivos rasterizados do OCR e limpeza de sessões expiradas no PostgreSQL, com regressões sintéticas. **As novas alterações passaram no CI [40437270173](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40437270173)** com backend, frontend, PostgreSQL, prévias sintéticas e Compose; isso não substitui fuzzing, sandbox de OCR, homologação documental nem testes de carga. O histórico detalhado fica no [`PROJECT_TRACKER.md`](PROJECT_TRACKER.md), e as pendências em [`docs/RELATORIO_CONTINUIDADE_2026-10-26.md`](docs/RELATORIO_CONTINUIDADE_2026-10-26.md).

**QA integrado verificado:** o [CI 40441312938](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40441312938) passou nos cinco jobs e inclui leitura de PNG/JPEG fictícios, revisão com CPF/data válidos, conferência dos valores preenchidos nos dois PDFs de amostra e teste de inicialização concorrente do PostgreSQL. Os procedimentos e resultados estão no [PROJECT_TRACKER](PROJECT_TRACKER.md); as [pendências de homologação e QA para 27/10/2026](docs/PENDENCIAS_PARA_2026-10-27.md) continuam abertas. Os testes sintéticos não asseguram leitura correta de fotos reais nem liberação de formulários oficiais.

### Simulação local de OCR e PDFs com dados fictícios

Existe um modo de QA **opcional, desligado por padrão**, para testar a jornada real no navegador antes da revisão humana dos formulários. Coloque `DEV_QA_PREVIEW=true` **apenas no `.env` da sua máquina**, execute `docker compose up -d --build`, entre com uma conta fictícia e escolha **Transferência de moto aquática** na página inicial. Agora existe um único caminho de preenchimento: a demonstração antiga foi retirada da navegação e as rotas legadas redirecionam para a página inicial. Depois desative a flag e reconstrua os containers.

O modo QA é recusado em produção, não consome créditos e usa **o mesmo serviço `transferencia-moto-aquatica`**: perguntas, requisitos reais e as posições dos seis anexos. Os anexos 2-A e 2-B entram sempre, e 2-C/2-D/2-E/1-C entram quando suas condições são selecionadas. O catálogo de produção mantém o serviço e os mapeamentos `DRAFT`; só o ambiente local permite prévias com **AMOSTRA em todas as páginas**. **Não use documentos pessoais reais**, pois os PDFs não são homologados nem válidos para protocolo. Instruções e fixtures textuais fictícias: [simulação local de ponta a ponta](docs/QA_SYNTHETIC_PREVIEW.md). Para a revisão de amanhã, leia [as pendências priorizadas de 27/10/2026](docs/PENDENCIAS_PARA_2026-10-27.md), com os portões documentais e os testes ainda necessários.

### Uploads necessários para preencher formulários

O aplicativo solicita apenas as entradas configuradas para auxiliar na
identificação e conferência dos campos dos formulários. **Não solicita fotos
da embarcação (popa e través)**, pois elas não são usadas na extração nem na
geração dos PDFs. A API também rejeita upload para esses identificadores.
A possível exigência de fotos durante a transferência oficial, descrita em
[docs/SERVICE_FORM_MATRIX.md](docs/SERVICE_FORM_MATRIX.md), é **separada**
deste produto, que não protocola documentos perante a Marinha.

### Uploads de documentos mais claros

Na etapa de anexos opcionais, cada documento possui um cartão com ações
**Escolher arquivo** e **Usar câmera**, ícones de identificação, orientação
de formato/tamanho e confirmação visível do nome do arquivo selecionado.
O design utiliza as cores existentes do produto e mantém o `input[type=file]`
acessível por teclado e leitor de tela. No celular, as duas ações ficam
empilhadas e têm área de toque confortável. A seleção de arquivos continua
opcional; dados não reconhecidos podem ser digitados manualmente.

### Preenchimento sem anexos ou com apenas um RG

Os uploads de identidade, TIE, residência, venda e demais documentos são
**opcionais para a ferramenta de preenchimento**. Após responder às perguntas,
o usuário pode seguir **sem anexos**, anexar só um RG para obter sugestões
conservadoras do OCR ou enviar múltiplos arquivos. O backend aceita extrair
um conjunto vazio de documentos e abre a revisão com valores em branco. A
revisão exige apenas os **campos mapeados como obrigatórios nos PDFs
selecionados** e verifica CPF, datas e tipos; os documentos de origem não
são requisito de geração.

No QA local há um único caminho para `transferencia-moto-aquatica`, sem a
antiga demonstração paralela. Os testes usam dados integralmente fictícios
e os PDFs permanecem com marca **AMOSTRA**, sem custos. Instruções:
[roteiro de QA](docs/QA_SYNTHETIC_PREVIEW.md). O comportamento das fotos
reais do usuário **não foi confirmado** sem amostras adequadas.

### Diagnóstico seguro do nome no RG em QA local

Quando o OCR consegue sugerir o CPF mas o nome permanece vazio, a aplicação
mostra, em **Resultado da leitura por documento**, o motivo técnico do
reconhecimento do nome. A API em QA local inclui `nameStage` no diagnóstico
de cada identidade, sem retornar o nome, CPF ou texto OCR bruto:

- `label_not_detected`: não encontrou um rótulo de titular reconhecível na
  saída textual; isso não garante que a palavra estivesse ausente da foto.
- `label_seen_name_rejected`: localizou um rótulo semelhante a NOME, mas não
  conseguiu validar um valor de nome.
- `name_recognized`: gerou sugestão de nome válida para revisão.
- `name_not_mapped`: gerou nome, mas o campo não existe no PDF selecionado.

O diagnóstico é exclusivo da prévia local de QA, não é enviado por serviços
normais nem substitui a revisão humana. O relato reproduzido por meio da API
confirmou que `person.cpf` foi devolvido, mas `person.fullName` **não**;
o campo de nome está mapeado nos formulários 2-A e BDMOTO. Portanto, não era
um problema de desenhar o valor na interface. O estágio exato de perda do
nome na foto específica ainda exige reteste com dados fictícios ou leitura
local do estado `nameStage`, sem compartilhar documentos pessoais.

### Quando a foto é enviada, mas os campos continuam vazios

Uma leitura OCR pode concluir sem erro HTTP e sem sugestões, por exemplo quando
há texto ilegível, rótulos não interpretados ou candidatos não presentes no PDF.
Isso **não significa** que o formulário recebeu dados válidos. Na revisão,
o aviso **Nenhum campo preenchido pelo OCR** agora fica destacado e a seção
**Resultado da leitura por documento** diferencia `no_text` (sem texto legível),
`no_supported_labels` (texto sem candidatos), `no_applicable_fields` (candidato
não mapeado) e `suggested` (sugestões aplicáveis). Esses estados não exibem
dados pessoais nem o texto reconhecido.

Testes React provam que nome, CPF e RG retornados pela API aparecem de fato
nos campos correspondentes; a integração PostgreSQL testa o caso de campo
identificado mas não mapeado. **Não foi possível reproduzir a foto específica
enviada pelo usuário**, de modo que a falha real de reconhecimento permanece
em investigação. Para reteste, utilizar foto inteiramente fictícia, subir a
versão mais recente, iniciar job novo e verificar o estado exibido por arquivo.

### Entendimento de documentos e RG fotografado

O motor OCR atual é **PaddleOCR**. A aplicação separa a leitura visual da interpretação semântica: Paddle produz páginas, linhas, confiança e geometria; a camada `document-understanding` transforma isso em evidências de campos canônicos sujeitas a revisão.

Os perfis em `documentos/ancoras/` são usados apenas como **referência curada de layouts**. A aplicação não carrega esses JSONs diretamente: aliases e preferências de direção só entram no runtime após revisão e teste contra campos canônicos já existentes. Dados fora do domínio ativo são ignorados.

O primeiro extractor migrado é o perfil de **identidade**, que localiza o titular por âncoras como `NOME`, relações à direita/abaixo, linhas fragmentadas e validação de CPF, bloqueando rótulos de filiação e nome social. O mesmo extractor é reutilizado para os papéis comprador e vendedor sem conhecer o serviço.

O fluxo atual ainda trata RG e CNH sob o perfil transitório `identity`, pois a interface não classifica explicitamente qual documento foi enviado. Não inferimos silenciosamente o tipo. A evolução prevista é separar RG, CNH, TIE, CHA e CIR em extractors próprios após introduzir classificação/seleção de tipo.

TIE, comprovante de residência e documento de venda ainda passam por um adaptador conservador do parser rotulado legado. **Nenhum novo tipo documental deve ser adicionado a esse parser**; a migração deve seguir `DocumentObservation -> DocumentExtractor -> FieldEvidence -> FieldResolver`.

Detalhes e regras permanentes: [arquitetura de entendimento de documentos](docs/DOCUMENT_UNDERSTANDING_ARCHITECTURE.md).

TIE e comprovante de residência já usam extractors estruturados próprios. Para PDFs desses tipos, a API pode aproveitar diretamente uma camada textual com geometria quando ela já contém os campos centrais esperados; caso a camada esteja ausente, incompleta ou semanticamente insuficiente, a leitura cai automaticamente para PaddleOCR. Essa otimização não é aplicada ao RG/CNH enquanto o fluxo de identidade validado não tiver equivalência comprovada.

### Leitura opcional com OpenAI

Além do PaddleOCR local, o fluxo real pode enviar os documentos de um processo
para a **Responses API da OpenAI** em uma única chamada multimodal. O usuário
escolhe o método antes da análise; PaddleOCR continua disponível como caminho
local e compatível.

O backend usa por padrão o snapshot `gpt-5.4-mini-2026-03-17`, configurável
por `OPENAI_MODEL`. O `gpt-5.4-nano-2026-03-17` também é aceito para
benchmarks de custo, mas não é o padrão. A API recebe somente os campos
revisáveis do serviço como schema permitido, exige saída estruturada, usa
`store:false` e não habilita ferramentas. Valores mascarados, ilegíveis,
incertos ou ausentes devem ser omitidos.

A resposta do modelo **não é tratada como verdade**. CPF, datas, booleanos e
campos sim/não passam novamente pelas validações determinísticas do backend;
valores diferentes entre documentos continuam sendo resolvidos como conflito,
e toda sugestão permanece sujeita à revisão humana antes da geração do PDF.

Além disso, cada requisito documental possui uma política explícita
`allowedFieldIds`. A OpenAI recebe somente a interseção entre os campos
necessários para os formulários selecionados e os campos autorizados para
aquele documento. O backend valida novamente o par campo/origem e descarta
qualquer candidato retornado a partir de uma fonte não autorizada. Documentos
sem campos aplicáveis (por exemplo, GRU ou procuração sem campos próprios no
catálogo) não são enviados à API, reduzindo exposição de dados e custo.

Configuração no `.env`:

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini-2026-03-17
OPENAI_PROJECT_ID=
OPENAI_DOCUMENT_DETAIL=high
```

A chave é exclusivamente do servidor e nunca deve ser incluída no frontend,
Git ou logs. Quando OpenAI é selecionada, os documentos deixam a VPS e são
enviados ao provedor externo para processamento; isso deve ser considerado na
política de privacidade e no tratamento de dados pessoais do produto.

### Capacidade adaptativa do PaddleOCR

O serviço OCR detecta as CPUs efetivamente disponíveis ao container, incluindo afinidade e quota de cgroup/Docker, reserva capacidade para API/PostgreSQL e cria um pool conservador de predictors independentes. O objetivo é aumentar throughput sem compartilhar a mesma instância PaddleOCR entre threads.

Perfil automático atual:

```text
2 vCPU  -> 1 worker / 1 thread
4 vCPU  -> 1 worker / 3 threads
8 vCPU  -> 2 workers / 3 threads por worker
12 vCPU -> 3 workers / 3 threads por worker
16 vCPU -> 4 workers / 3 threads por worker
```

Esses valores são limites iniciais de engenharia, não benchmark de produção. O número real de usuários simultâneos depende do modelo da CPU, tamanho/qualidade dos documentos e memória disponível. Antes de produção, a Fase 15 ainda exige teste de carga e medição de CPU/RAM/latência.

O endpoint interno `/health` do OCR expõe somente metadados operacionais de capacidade (`availableCpus`, `workers`, `threadsPerWorker`, `queueDepth`), sem conteúdo documental. A fila é limitada; quando todos os slots estão ocupados o serviço responde `429 ocr_busy` em vez de acumular requisições sem limite.

A configuração é automática por padrão e pode ser ajustada no `.env` com `OCR_RESERVED_CPUS`, `OCR_MAX_WORKERS`, `OCR_WORKERS`, `OCR_CPU_THREADS`, `OCR_QUEUE_DEPTH` e `OCR_MAX_CONCURRENT`. Manter `auto` até existir benchmark da máquina alvo.

### Datas, OCR do BDMOTO e teste no serviço verdadeiro

Os campos semânticos de data exibem `DD/MM/AAAA` automaticamente enquanto se digita; o backend continua a rejeitar datas inválidas. O OCR foi ampliado para sugerir separadamente `Cidade`, `Bairro`, `CEP`, `UF`, `Número` e `Complemento` quando os rótulos aparecem no comprovante. **Endereço é um campo distinto no PDF oficial BDMOTO** e não foi removido sem revisão visual. Campos ausentes, fotos ilegíveis e layouts desconhecidos continuam exigindo conferência manual. O backend limita sugestões aos campos da seleção atual.

O roteiro atualizado está em [QA do serviço real com dados fictícios](docs/QA_SYNTHETIC_PREVIEW.md), e o estado das fases permanece no [PROJECT_TRACKER.md](PROJECT_TRACKER.md). Essas mudanças não aprovam os PDFs.

### Reteste após correções de QA em 27/10/2026

As falhas relatadas na navegação autenticada, links repetidos no rodapé, ausência de feedback dos requisitos, OCR sem explicação e erro `422` na revisão receberam correções verificadas em [GitHub Actions 40510328039](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40510328039). Agora o frontend exibe **Entrar apenas ao visitante** e oferece **Sair** ao usuário autenticado; o backend também exige logout para alternar de conta. No wizard, os campos obrigatórios e valores inválidos são identificados. Nenhum anexo é obrigatório: com ou sem OCR, os demais dados podem ser informados manualmente. Se o OCR não sugerir dados, a interface exibe o resultado por documento, sem inventar valores.

Para reproduzir o reteste com **documentos totalmente fictícios**, seguir [o roteiro de correções](docs/QA_CORRECOES_2026-10-27.md). O erro `422` observado pelo usuário não teve seu campo exato identificado, pois não houve acesso ao JSON da resposta original; não foi enfraquecida a validação de CPF/data. **Essas correções não homologam os mapeamentos oficiais nem comprovam precisão do OCR com fotos reais.**

### Menu mobile — reteste visual

Em telas de até 767 px, o cabeçalho mantém o botão no canto superior direito, com tamanho fixo **100×44 px** nos dois estados, sempre exibindo o texto **Menu** ao lado do ícone. Apenas o ícone alterna entre as três linhas e X, com nome acessível de ação **Menu**/**Fechar menu** e `aria-expanded` atualizado. O painel de links abre e fecha com transição suave; Escape, seleção de rota e logout preservam o fechamento. Em dispositivos com preferência por redução de movimento, a transição não é executada. No desktop, o menu continua horizontal.

**Teste manual pendente:** conferir na sua máquina com o modo responsivo do navegador em 320, 375 e 767 px, além de um celular real, abertura/fechamento, posição fixa do botão com o texto Menu ao lado do ícone sem sobrepor o nome da aplicação, links acessíveis e redução de movimento. A suíte React/JSDOM verifica estados e acessibilidade básica, mas não substitui a inspeção visual em navegador.

## Endpoints implementados

- `GET /health`: liveness
- `GET /api/services`, `GET /api/services/:id` e `POST /api/services/:id/quote`: catálogo público homologado e requisitos condicionais
- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `GET /api/auth/me`: contas e sessões
- `GET /api/credits/balance`, `/api/credits/history`: saldo/histórico operacional
- `POST /api/jobs`, `POST /api/jobs/:id/renew`, `POST /api/jobs/:id/documents/:requirementId`, `POST /api/jobs/:id/extract`, `PATCH /api/jobs/:id/review`, `POST /api/jobs/:id/generate`, `GET /api/jobs/:id/download/:versionId`, `DELETE /api/jobs/:id`: processos temporários autenticados, com renovação de 20 minutos limitada a uma hora desde a criação

A API utiliza limites de arquivos, autorização por sessão, validação de origem e tentativas, estados de job e débito idempotente por processo. Quando um job expira pelo TTL deslizante sem entrega, a API tenta estornar o crédito após remover os arquivos privados; se o banco falhar, a reconciliação persistente continua como fallback. Ver [ciclo de crédito/entrega](docs/CREDIT_DELIVERY_LIFECYCLE.md). A camada OCR ainda não extrai automaticamente todos os campos.

## Segurança, privacidade e limites

- Dados documentais, texto OCR e PDFs preenchidos são **temporários** (20 minutos com renovação controlada, teto de uma hora por processo); contas e movimentações de créditos são persistentes.
- Não adicionar RG, CPF, documentos pessoais preenchidos ou arquivos de clientes ao Git.
- Todos os mapeamentos de formulários reais seguem `DRAFT` até revisão documental independente. **Jamais mudar o piloto para `AVAILABLE` com pendências.**
- A comprovação de assinatura, versão normativa e requisitos condicionais permanece necessária. A aprovação técnica não equivale à aprovação da Marinha.
- Não há HTTPS, pagamento real, backup/restauração de produção, monitoramento ou proteção dimensionada para usuários públicos.
- O OCR pode interpretar dados incorretamente; cada campo deve ser conferido pelo usuário.
- Novos serviços e versões oficiais devem passar novamente pela conferência de fonte, mapeamento e QA.

## Serviços de embarcações NORMAM-211 em preparação

O catálogo técnico agora inclui nove serviços de embarcações de esporte e
recreio: inscrição inicial, transferências de propriedade/jurisdição,
renovação do TIE/TIEM (incluindo perda/extravio do modelo antigo), alteração de dados, alteração de motor e
comunicação de venda. Os modelos oficiais 2-A, 2-B, 2-C, 2-G, 2-H, 2-I, 2-K e
3-C foram identificados em fontes oficiais de 2026.

Uma auditoria posterior contra a NORMAM-211/DPC completa corrigiu a identificação
do Anexo 3-C: ele é o **Termo de Responsabilidade de Construção/Alteração**.
Sete mapas NORMAM-211 permanecem homologados; o 3-C foi rebaixado para
`IDENTIFIED/DRAFT` e precisa ser remapeado. O catálogo também corrige a regra de
porte: BSADE somente até 6 m; acima de 6 m usa BADE. Os serviços de alteração e
a inscrição de médio porte continuam fail-closed até completar essa homologação.

Todos os documentos de origem cadastrados para essa expansão entram no pipeline
OCR quando enviados. Tipos já estruturados podem sugerir campos; documentos de
apoio sem extractor semântico são lidos sem gerar palpites. O usuário sempre
revisa ou preenche manualmente antes da geração.

Detalhes: [serviços NORMAM-211](docs/NORMAM211_VESSEL_SERVICES.md) e
[relatório de QA técnico dos mapas](docs/mapping-reports/normam211-2026-technical-qa.md).

## Planejamento e expansão

O [`PROJECT_TRACKER.md`](PROJECT_TRACKER.md) documenta o MVP (00–09), a preparação comercial/produção (10–17) e a expansão (18). Apenas o trabalho técnico do MVP foi autorizado para execução contínua; pagamentos reais, infraestrutura externa e lançamento público requerem novas decisões. **Sem assinaturas ou planos empresariais nesta versão.**


## Serviços de amadores NORMAM-211

A NORMAM-211 também cobre Arrais-Amador, Mestre-Amador e Capitão-Amador. O
catálogo já modela, em `DRAFT`, **Inscrição/Emissão da CHA** e **Renovação da
CHA**. Perda, roubo, furto ou dano da cédula não é exposto como uma “segunda via”
separada: a norma direciona esses casos para renovação, com o Anexo 5-D quando
aplicável. Os anexos 5-D e 5-H precisam ser versionados, mapeados e revisados
antes da liberação.
