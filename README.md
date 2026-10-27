# Preenchimento Automático — SaaS de formulários náuticos

Aplicação mobile-first que auxilia usuários a enviar documentos, revisar informações extraídas e gerar **modelos oficiais de formulários náuticos**, preservando o PDF original. Plataforma privada, independente da Marinha do Brasil: **não realiza protocolo oficial nem garante aceitação do documento**.

> **Status em 26/10/2026:** Fases 00–03 concluídas. O núcleo das fases 04–08 foi implementado e testado com dados **sintéticos**, mas **a homologação do MVP está pendente**. Os seis PDFs oficiais estão verificados; seus mapeamentos estão em `DRAFT`, e o serviço de transferência de moto aquática permanece `DRAFT` (não liberado). Nenhum cliente real, pagamento ou aprovação oficial foi processado.

## Estado do desenvolvimento

| Componente | Implementado | Restrições |
| --- | --- | --- |
| Catálogo de serviços e condições | API e frontend integrados | Só serviços aprovados ficam disponíveis |
| Seis anexos oficiais da NORMAM-212/DPC (2026) | Identidade e SHA-256 verificados | Não são automaticamente homologados para preenchimento |
| Mapeamento PDF reutilizável | **135 posições em seis formulários** | `DRAFT`; exemplos sintéticos e regressões testados, conferência humana pendente |
| Preenchimento pdf-lib | Motor determinístico, verificação de hash e testes | Exige `APPROVED`, bloqueando o piloto |
| Upload/limpeza | Autorização pré-upload, diretório privado, quotas, TTL, verificação por página PDF e preflight adicional PNG/JPEG | Exige fuzzing/isolamento de decodificadores e testes de carga |
| OCR no servidor | `pdftotext` + Tesseract; sugestões conservadoras para identidade, TIE, residência e documento de venda; teto de rasterização | Fotos e dados ficam sujeitos a erros; revisão obrigatória, sem métricas reais de precisão |
| Autenticação e créditos | PostgreSQL, sessões HttpOnly com limpeza de expiradas, ledger, recibos e estorno antecipado de jobs vencidos | Instância única, créditos de teste; sem pagamentos reais |
| Fluxo React integrado | Perguntas, upload, captura com câmera, revisão, geração, download e recuperação na mesma aba | Serviço real somente homologado; QA sintético local com PDFs marcados como AMOSTRA |
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
  src/features/real/          # Jornada real bloqueada até homologação
  src/pages/
  nginx/default.conf         # Proxy same-origin /api e cabeçalhos de proteção
docs/
  FORM_CATALOG.md
  SERVICE_FORM_MATRIX.md
  mapping-reports/
  _pdf_test_previews/         # Imagens de PDFs com dados fictícios
```

Formulários são versionados e mapeados **independentemente dos serviços**, depois associados via `ServiceForm`. Não duplicar arquivos por serviço.

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

O [GitHub Actions](.github/workflows/ci.yml) também executa auditoria de dependências de produção, integração com PostgreSQL real e smoke test Docker Compose. Os testes usam dados sintéticos, inclusive PDFs oficiais preenchidos só para QA.

**Validação incremental:** o teste de autorização entre contas e estorno por expiração (`a8607e3`) foi aprovado no [CI com PostgreSQL e Compose](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40435783780). Também foram adicionados controles de consistência para PNG/JPEG, limite de bytes dos arquivos rasterizados do OCR e limpeza de sessões expiradas no PostgreSQL, com regressões sintéticas. **As novas alterações passaram no CI [40437270173](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40437270173)** com backend, frontend, PostgreSQL, prévias sintéticas e Compose; isso não substitui fuzzing, sandbox de OCR, homologação documental nem testes de carga. O histórico detalhado fica no [`PROJECT_TRACKER.md`](PROJECT_TRACKER.md), e as pendências em [`docs/RELATORIO_CONTINUIDADE_2026-10-26.md`](docs/RELATORIO_CONTINUIDADE_2026-10-26.md).

**QA integrado verificado:** o [CI 40441312938](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40441312938) passou nos cinco jobs e inclui leitura de PNG/JPEG fictícios, revisão com CPF/data válidos, conferência dos valores preenchidos nos dois PDFs de amostra e teste de inicialização concorrente do PostgreSQL. Os procedimentos e resultados estão no [PROJECT_TRACKER](PROJECT_TRACKER.md); as [pendências de homologação e QA para 27/10/2026](docs/PENDENCIAS_PARA_2026-10-27.md) continuam abertas. Os testes sintéticos não asseguram leitura correta de fotos reais nem liberação de formulários oficiais.

### Simulação local de OCR e PDFs com dados fictícios

Existe um modo de QA **opcional, desligado por padrão**, para testar a jornada real no navegador antes da revisão humana dos formulários. Coloque `DEV_QA_PREVIEW=true` **apenas no `.env` da sua máquina**, execute `docker compose up -d --build`, entre com uma conta fictícia e abra o cartão **Teste técnico com dados fictícios** na página inicial. Depois desative a flag e reconstrua os containers.

O modo QA é recusado em produção, não consome créditos, mantém o serviço piloto `DRAFT` e gera **somente duas amostras (2-A e 2-B)** com marca d'água em todas as páginas. **Não use documentos pessoais reais**, pois os PDFs de exemplo não são homologados ou válidos para protocolo. Instruções e fixtures textuais fictícias: [simulação local de ponta a ponta](docs/QA_SYNTHETIC_PREVIEW.md). Para a revisão de amanhã, leia [as pendências priorizadas de 27/10/2026](docs/PENDENCIAS_PARA_2026-10-27.md), com os portões documentais e os testes ainda necessários.

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

## Planejamento e expansão

O [`PROJECT_TRACKER.md`](PROJECT_TRACKER.md) documenta o MVP (00–09), a preparação comercial/produção (10–17) e a expansão (18). Apenas o trabalho técnico do MVP foi autorizado para execução contínua; pagamentos reais, infraestrutura externa e lançamento público requerem novas decisões. **Sem assinaturas ou planos empresariais nesta versão.**
