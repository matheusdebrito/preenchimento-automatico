# Preenchimento Automático — MVP

Aplicação web mobile-first para preenchimento assistido de formulários náuticos da Marinha do Brasil. O usuário escolhe um serviço, envia documentos de origem, revisa os dados extraídos e recebe os formulários oficiais preenchidos.

> **Estado atual:** fundação técnica e protótipo de interface. O fluxo do frontend é uma demonstração claramente identificada: nenhum arquivo real é enviado, nenhum OCR é executado, nenhum pagamento é processado e nenhum PDF oficial é gerado.

## Estrutura

```text
preenchimento-automatico/
├── backend/          API Node.js + TypeScript + Fastify
├── frontend/         React + TypeScript + Vite
├── compose.yaml      API, PostgreSQL e frontend
├── .env.example      Variáveis do ambiente local
├── MVP_PLAN.md       Plano de implementação
└── UI_DESIGN_GUIDE.md
```

## Requisitos

- Node.js 24 LTS
- npm 11+
- Docker 29+ com Docker Compose v2 (para o ambiente completo)

## Subir o ambiente completo

1. Crie o arquivo de ambiente e troque a senha:

   ```powershell
   Copy-Item .env.example .env
   ```

   Edite `POSTGRES_PASSWORD` no `.env`. Use uma senha longa e exclusiva deste ambiente. O `.env` é ignorado pelo Git.

2. Construa e suba os containers:

   ```powershell
   docker compose up --build
   ```

3. Acesse:

   - Frontend: <http://127.0.0.1:8080>
   - Saúde da API: <http://127.0.0.1:3000/health>
   - Saúde do frontend: <http://127.0.0.1:8080/healthz>

4. Encerrar:

   ```powershell
   docker compose down
   ```

   Para remover também o volume do PostgreSQL (dados locais):

   ```powershell
   docker compose down -v
   ```

As portas são publicadas apenas em `127.0.0.1`. O PostgreSQL não publica porta e só é acessível pela rede interna do Compose.

## Desenvolvimento local

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

O Vite abre em <http://127.0.0.1:5173>.

### Backend

```powershell
cd backend
npm install
npm run dev
```

A API abre em <http://127.0.0.1:3000>. O backend lê as variáveis do processo e não carrega `.env` automaticamente. Em desenvolvimento, os padrões seguros já permitem subir a API sem arquivo adicional; para alterar porta, CORS ou log, defina as variáveis no terminal antes de executar.

## Endpoints disponíveis

| Método | Rota      | Descrição                                      |
| ------ | --------- | ---------------------------------------------- |
| GET    | `/health` | Liveness da API, sem dados sensíveis           |
| GET    | `/healthz`| Liveness do container do frontend (Nginx)      |

Não existem endpoints de catálogo, upload, OCR, créditos, pagamentos ou PDF nesta etapa. A API não se conecta ao PostgreSQL ainda; o serviço de banco está preparado para a próxima etapa.

## Validação

Frontend:

```powershell
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
```

Backend:

```powershell
cd backend
npm run typecheck
npm run lint
npm test
npm run build
```

## Segurança e privacidade nesta etapa

- Nenhum documento real deve ser usado no protótipo.
- O frontend não envia arquivos; as prévias usam `URL.createObjectURL` em memória e são revogadas ao sair do fluxo.
- O backend não persiste dados, não grava corpos de requisição e mascara cabeçalhos sensíveis e endereços de origem nos logs.
- CORS aceita apenas as origens configuradas; o curinga `*` é rejeitado.
- Erros 500 retornam mensagem genérica e não expõem detalhes internos.
- A API e o frontend rodam como usuários não privilegiados nos containers, com `read_only`, `cap_drop: ALL` e `no-new-privileges` quando aplicável.
- O Nginx aplica CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`.
- O log de acesso do Nginx não registra IP do cliente nem query string.

### Limitações conhecidas

- A CSP do frontend usa `connect-src 'self'`. Quando o frontend passar a chamar a API, será necessário usar um proxy same-origin no Nginx ou atualizar a política com a origem explícita da API.
- O `/health` da API é apenas liveness. A verificação de prontidão do banco será adicionada junto com a camada de persistência.
- Não há HTTPS no Compose local. Em ambiente público, use um proxy reverso com TLS e não exponha as portas diretamente.
- As credenciais do PostgreSQL são passadas por variáveis de ambiente no Compose local. Em produção, use um gerenciador de segredos.
- O volume do PostgreSQL não possui rotina de backup nesta etapa.

## Próximas etapas

1. Catálogo de serviços e checklist de documentos com dados reais validados.
2. Modelo de dados, Prisma, migrations, autenticação e autorização.
3. Upload temporário com validação de assinatura, limites e limpeza por TTL.
4. Extração de texto/OCR e revisão humana.
5. Modelos oficiais versionados e geração determinística de PDF.
6. Créditos, pagamentos e auditoria.

Consulte `MVP_PLAN.md` para o escopo completo e `UI_DESIGN_GUIDE.md` para a identidade visual.


## Catálogo reutilizável de formulários (fundação)

- Contratos e catálogo conservador: `backend/src/modules/catalog/`.
- Inventário e processo de homologação: `docs/FORM_CATALOG.md`.
- Relação serviços × formulários: `docs/SERVICE_FORM_MATRIX.md`.
- O piloto permanece `DRAFT`; ainda não há modelos PDF oficiais validados nem geração real.
- A interface demonstrativa continua isolada no frontend, sem enviar documentos ao servidor.
- Próximo passo: validar os modelos oficiais aplicáveis ao piloto antes de criar motor de PDF ou liberar serviço.
