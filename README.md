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
| Análise documental | OpenAI Responses API recebe PDFs/imagens originais e retorna sugestões estruturadas limitadas por documento e serviço | Requer `OPENAI_API_KEY`; todas as sugestões exigem revisão humana e a precisão deve ser homologada com amostras autorizadas |
| Autenticação e créditos | PostgreSQL, sessões HttpOnly, menu conectado à sessão, logout obrigatório para trocar conta, ledger/recibos/estornos | Instância única, créditos de teste; sem pagamentos reais |
| Fluxo React integrado | Uploads documentais opcionais, análise OpenAI, preenchimento manual ou misto, revisão de dados, geração e download | Produção permanece DRAFT; prévias com AMOSTRA, sem créditos e sem documentos pessoais |
| Testes automatizados | CI com npm, Postgres real e Docker Compose | Não substitui homologação documental, carga nem teste manual real |

Consulte o [fluxo de entrega e estorno de créditos](docs/CREDIT_DELIVERY_LIFECYCLE.md), a [arquitetura de análise documental OpenAI](docs/OPENAI_DOCUMENT_ANALYSIS.md), o [status técnico detalhado](docs/MVP_STATUS_2026-10-26.md), o [planejamento](PROJECT_TRACKER.md), o [roteiro de revisão humana dos PDFs](docs/FASE_04_REVISAO_VISUAL.md), o [relatório de segurança incremental](docs/SECURITY_HARDENING_2026-10-26.md) e os [relatórios de mapeamento](docs/mapping-reports/).

## Estrutura

```text
backend/
  src/modules/catalog/        # FormDefinition, FormVersion, FormMapping e ServiceForm
  src/modules/pdf/            # Motor de preenchimento e integridade do original
  src/modules/jobs/           # Validação de uploads, TTL e integração OpenAI
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

Enquanto a sessão temporária estiver válida, atualizar a mesma aba permite recuperar o job e continuar a conferência ou o download. A aba mantém **somente o UUID aleatório do job em `sessionStorage`**; os PDFs, dados pessoais, arquivos enviados e conteúdo digitado permanecem privados no servidor e não são copiados para o armazenamento do navegador. Ao encerrar e apagar o job, o identificador também é descartado. A recuperação não é garantida depois de fechar a aba/navegador, expirar a sessão, reiniciar a instância ou trocar de conta.

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

O [GitHub Actions](.github/workflows/ci.yml) também executa auditoria de dependências de produção, integração com PostgreSQL real e smoke test Docker Compose. Os testes usam dados sintéticos, inclusive PDFs oficiais preenchidos só para QA. Antes de abrir PR, especialmente em mudanças de análise documental, execute o gate descrito em [Validação antes de Pull Request](docs/PRE_PR_VALIDATION.md); o CI valida o contrato com respostas simuladas; homologação real controlada continua sendo gate pré-produção.

**Validação incremental:** o teste de autorização entre contas e estorno por expiração (`a8607e3`) foi aprovado no [CI com PostgreSQL e Compose](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40435783780). Também foram adicionados controles de consistência para PNG/JPEG, limites de tamanho e páginas dos arquivos enviados à análise documental e limpeza de sessões expiradas no PostgreSQL, com regressões sintéticas. **As novas alterações passaram no CI [40437270173](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40437270173)** com backend, frontend, PostgreSQL, prévias sintéticas e Compose; isso não substitui fuzzing, homologação documental nem testes de carga. O histórico detalhado fica no [`PROJECT_TRACKER.md`](PROJECT_TRACKER.md), e as pendências em [`docs/RELATORIO_CONTINUIDADE_2026-10-26.md`](docs/RELATORIO_CONTINUIDADE_2026-10-26.md).

**QA integrado verificado:** o [CI 40441312938](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40441312938) passou nos cinco jobs e inclui leitura de PNG/JPEG fictícios, revisão com CPF/data válidos, conferência dos valores preenchidos nos dois PDFs de amostra e teste de inicialização concorrente do PostgreSQL. Os procedimentos e resultados estão no [PROJECT_TRACKER](PROJECT_TRACKER.md); as [pendências de homologação e QA para 27/10/2026](docs/PENDENCIAS_PARA_2026-10-27.md) continuam abertas. Os testes sintéticos não asseguram leitura correta de fotos reais nem liberação de formulários oficiais.

### Testes sintéticos de análise documental e PDFs

Testes de análise documental, preenchimento e geração de PDF usam respostas OpenAI simuladas, fixtures e dados sintéticos diretamente na suíte automatizada. O servidor em execução utiliza somente o catálogo oficial; não existe flag de ambiente para promover serviços ou mapeamentos `DRAFT` em runtime.

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
sugestões da OpenAI ou enviar múltiplos arquivos. O backend aceita extrair
um conjunto vazio de documentos e abre a revisão com valores em branco. A
revisão exige apenas os **campos mapeados como obrigatórios nos PDFs
selecionados** e verifica CPF, datas e tipos; os documentos de origem não
são requisito de geração.

Os testes automatizados continuam usando dados integralmente fictícios. O comportamento
de fotos reais do usuário deve ser validado separadamente com corpus autorizado e revisão
humana; nenhum modo especial de runtime altera o catálogo para esse fim.

### Quando a foto é enviada, mas os campos continuam vazios

Uma análise documental pode concluir sem erro HTTP e sem sugestões, por exemplo quando
há texto ilegível, rótulos não interpretados ou candidatos não presentes no PDF.
Isso **não significa** que o formulário recebeu dados válidos. Na revisão,
o aviso **Nenhum campo sugerido automaticamente** agora fica destacado e a seção
**Resultado da análise por documento** diferencia `no_text` (sem texto legível),
`no_supported_labels` (texto sem candidatos), `no_applicable_fields` (candidato
não mapeado) e `suggested` (sugestões aplicáveis). Esses estados não exibem
dados pessoais nem o texto reconhecido.

Testes React provam que nome, CPF e RG retornados pela API aparecem de fato
nos campos correspondentes; a integração PostgreSQL testa o caso de campo
identificado mas não mapeado. **Não foi possível reproduzir a foto específica
enviada pelo usuário**, de modo que a falha real de reconhecimento permanece
em investigação. Para reteste, utilizar foto inteiramente fictícia, subir a
versão mais recente, iniciar job novo e verificar o estado exibido por arquivo.

### Análise documental com OpenAI

A aplicação utiliza exclusivamente a **OpenAI Responses API** para interpretar documentos. Não existe serviço PaddleOCR, Tesseract ou extração local de texto para alimentar os formulários.

O backend envia os arquivos originais diretamente à API: PDFs como arquivos e imagens PNG/JPEG como imagens. Antes do envio, filtra os documentos e campos com base no catálogo do serviço selecionado e na política `allowedFieldIds`. Arquivos sem campos aplicáveis não são enviados.

A resposta usa schema JSON estrito. O backend valida novamente a estrutura, o vínculo entre campo e documento de origem, CPF, datas, booleanos e regras específicas. Valores ausentes, ilegíveis, mascarados, inválidos ou conflitantes não são inventados. Todas as sugestões permanecem em revisão humana antes do preenchimento do PDF.

A configuração está no backend:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini-2026-03-17
OPENAI_PROJECT_ID=
OPENAI_DOCUMENT_DETAIL=high
```

A chave nunca deve ser incluída no frontend, Git ou logs. As chamadas usam `store:false`. Como os documentos são enviados a um provedor externo, isso deve ser refletido na política de privacidade e nos avisos ao usuário.

A suíte automatizada simula a Responses API e não consome créditos. Antes de produção, é necessário homologar com documentos sintéticos e amostras autorizadas, medir precisão por campo, latência, tokens e custo. Consulte [Análise documental com OpenAI](docs/OPENAI_DOCUMENT_ANALYSIS.md).

### Datas, preenchimento do BDMOTO e teste no serviço verdadeiro

Os campos semânticos de data exibem `DD/MM/AAAA` automaticamente enquanto se digita; o backend continua a rejeitar datas inválidas. A análise documental pode sugerir separadamente `Cidade`, `Bairro`, `CEP`, `UF`, `Número` e `Complemento` quando os rótulos aparecem no comprovante. **Endereço é um campo distinto no PDF oficial BDMOTO** e não foi removido sem revisão visual. Campos ausentes, fotos ilegíveis e layouts desconhecidos continuam exigindo conferência manual. O backend limita sugestões aos campos da seleção atual.

O roteiro atualizado está em [QA do serviço real com dados fictícios](docs/QA_SYNTHETIC_PREVIEW.md), e o estado das fases permanece no [PROJECT_TRACKER.md](PROJECT_TRACKER.md). Essas mudanças não aprovam os PDFs.

### Reteste após correções de QA em 27/10/2026

As falhas relatadas na navegação autenticada, links repetidos no rodapé, ausência de feedback dos requisitos, análise documental sem explicação e erro `422` na revisão receberam correções verificadas em [GitHub Actions 40510328039](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40510328039). Agora o frontend exibe **Entrar apenas ao visitante** e oferece **Sair** ao usuário autenticado; o backend também exige logout para alternar de conta. No wizard, os campos obrigatórios e valores inválidos são identificados. Nenhum anexo é obrigatório: com ou sem anexos, os demais dados podem ser informados manualmente. Se a análise não sugerir dados, a interface exibe o resultado por documento, sem inventar valores.

Para reproduzir o reteste com **documentos totalmente fictícios**, seguir [o roteiro de correções](docs/QA_CORRECOES_2026-10-27.md). O erro `422` observado pelo usuário não teve seu campo exato identificado, pois não houve acesso ao JSON da resposta original; não foi enfraquecida a validação de CPF/data. **Essas correções não homologam os mapeamentos oficiais nem comprovam precisão da análise OpenAI com fotos reais.**

### Menu mobile — reteste visual

Em telas de até 767 px, o cabeçalho mantém o botão no canto superior direito, com tamanho fixo **100×44 px** nos dois estados, sempre exibindo o texto **Menu** ao lado do ícone. Apenas o ícone alterna entre as três linhas e X, com nome acessível de ação **Menu**/**Fechar menu** e `aria-expanded` atualizado. O painel de links abre e fecha com transição suave; Escape, seleção de rota e logout preservam o fechamento. Em dispositivos com preferência por redução de movimento, a transição não é executada. No desktop, o menu continua horizontal.

**Teste manual pendente:** conferir na sua máquina com o modo responsivo do navegador em 320, 375 e 767 px, além de um celular real, abertura/fechamento, posição fixa do botão com o texto Menu ao lado do ícone sem sobrepor o nome da aplicação, links acessíveis e redução de movimento. A suíte React/JSDOM verifica estados e acessibilidade básica, mas não substitui a inspeção visual em navegador.

## Endpoints implementados

- `GET /health`: liveness
- `GET /api/services`, `GET /api/services/:id` e `POST /api/services/:id/quote`: catálogo público homologado e requisitos condicionais
- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `GET /api/auth/me`: contas e sessões
- `GET /api/credits/balance`, `/api/credits/history`: saldo/histórico operacional
- `POST /api/jobs`, `POST /api/jobs/:id/renew`, `POST /api/jobs/:id/documents/:requirementId`, `POST /api/jobs/:id/extract`, `PATCH /api/jobs/:id/review`, `POST /api/jobs/:id/generate`, `GET /api/jobs/:id/download/:versionId`, `DELETE /api/jobs/:id`: processos temporários autenticados, com renovação de 20 minutos limitada a uma hora desde a criação

A API utiliza limites de arquivos, autorização por sessão, validação de origem e tentativas, estados de job e débito idempotente por processo. Quando um job expira pelo TTL deslizante sem entrega, a API tenta estornar o crédito após remover os arquivos privados; se o banco falhar, a reconciliação persistente continua como fallback. Ver [ciclo de crédito/entrega](docs/CREDIT_DELIVERY_LIFECYCLE.md). A análise OpenAI ainda não extrai automaticamente todos os campos.

## Segurança, privacidade e limites

- Dados documentais, dados extraídos e PDFs preenchidos são **temporários** (20 minutos com renovação controlada, teto de uma hora por processo); contas e movimentações de créditos são persistentes.
- Não adicionar RG, CPF, documentos pessoais preenchidos ou arquivos de clientes ao Git.
- Todos os mapeamentos de formulários reais seguem `DRAFT` até revisão documental independente. **Jamais mudar o piloto para `AVAILABLE` com pendências.**
- A comprovação de assinatura, versão normativa e requisitos condicionais permanece necessária. A aprovação técnica não equivale à aprovação da Marinha.
- Não há HTTPS, pagamento real, backup/restauração de produção, monitoramento ou proteção dimensionada para usuários públicos.
- O A OpenAI pode interpretar dados incorretamente; cada campo deve ser conferido pelo usuário.
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
catálogo já modela, em `DRAFT`, **Inscrição para exame de amador** e **Renovação da
CHA**. A inscrição do art. 5.4.1 não é vinculada ao Anexo 5-H por inferência. Perda,
roubo, furto ou dano da cédula não é exposto como uma “segunda via”
separada: a norma direciona esses casos para renovação, com o Anexo 5-D quando
aplicável. Os anexos 5-D e 5-H precisam ser versionados, mapeados e revisados
antes da liberação.
