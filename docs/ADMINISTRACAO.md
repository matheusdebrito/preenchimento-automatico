# Administração da aplicação

Este documento descreve como habilitar e operar contas administrativas no projeto `preenchimento-automatico`.

## Visão geral

O painel administrativo está disponível em:

```text
/admin
```

O acesso depende da autenticação normal da aplicação. Não existe login administrativo separado e não existe senha administrativa no `.env`.

Para acessar o painel, a conta precisa estar:

```text
status = ACTIVE
role = ADMIN
```

A autorização é validada no backend em todas as rotas `/api/admin/*`. O frontend apenas oculta ou exibe a navegação de acordo com a role da sessão.

## Criar o primeiro administrador

1. Crie a conta normalmente pela aplicação.
2. Atualize/suba a aplicação com a versão mais recente.
3. Promova a conta existente pelo container da API:

```powershell
docker compose exec api npm run admin:promote -- usuario@dominio.com
```

Saída esperada:

```text
Role atualizada: usuario@dominio.com -> ADMIN.
```

Depois faça logout e login novamente. O item **Administração** deve aparecer no menu e `/admin` deve ficar acessível.

### Se a conta já for ADMIN

O comando é idempotente e apenas informa que nenhuma alteração foi necessária:

```text
Nenhuma alteração: usuario@dominio.com já possui role ADMIN.
```

## Remover uma role administrativa

Use:

```powershell
docker compose exec api npm run admin:demote -- usuario@dominio.com
```

Saída esperada:

```text
Role atualizada: usuario@dominio.com -> USER.
```

O comando recusa a operação se essa conta for o último administrador ativo.

## Regras de segurança

- a conta precisa existir antes da promoção;
- o e-mail é normalizado e validado;
- nenhuma senha é passada pela linha de comando;
- nenhuma senha administrativa fica no `.env`;
- alterações de role são transacionais;
- mudanças concorrentes de privilégio são serializadas no PostgreSQL;
- o sistema não permite remover o último administrador ativo;
- ações via CLI são registradas em `admin_audit_log`;
- a origem de promoções/rebaixamentos via terminal aparece como `CLI`;
- usuários comuns recebem `403` nas APIs administrativas;
- contas `BLOCKED` ou `PENDING` não podem acessar o painel.

## Funcionalidades do painel

O painel administrativo inclui:

- total de usuários;
- usuários ativos, bloqueados e pendentes;
- créditos usados hoje;
- créditos usados na semana;
- créditos usados no mês;
- créditos concedidos administrativamente no mês;
- saldo total de créditos;
- uso diário dos últimos 30 dias;
- listagem paginada de usuários;
- busca por nome, e-mail, CPF ou celular;
- filtros por status e role;
- detalhes da conta;
- saldo de créditos por usuário;
- créditos utilizados por usuário;
- histórico recente de movimentações;
- alteração de status;
- alteração de role;
- depósito de créditos;
- trilha de auditoria administrativa.

## Depósito de créditos

Créditos administrativos são registrados no ledger; o saldo não é alterado diretamente.

A movimentação usa:

```text
reason = admin_grant
```

A operação é transacional e idempotente. Um retry com a mesma chave não duplica os créditos.

Toda concessão fica registrada no `admin_audit_log`.

## Auditoria

A tabela `admin_audit_log` registra ações como:

```text
CREDIT_GRANT
STATUS_CHANGE
ROLE_CHANGE
```

Ações feitas pela interface administrativa identificam o administrador responsável.

Ações de promoção/rebaixamento feitas pelos comandos de manutenção aparecem com origem:

```text
CLI
```

## Status de conta

Valores suportados:

```text
ACTIVE
BLOCKED
PENDING
```

Somente contas `ACTIVE` podem autenticar e manter uma sessão válida.

Ao bloquear ou colocar uma conta como pendente, suas sessões existentes são invalidadas.

## Roles

Valores suportados:

```text
USER
ADMIN
```

O painel administrativo também permite alterar a role de outras contas, respeitando as proteções de segurança.

Um administrador não pode alterar o próprio status ou role pelo painel.

## Atualizar a aplicação antes de usar os comandos

Depois de alterações no repositório:

```powershell
git pull --ff-only
docker compose up -d --build
```

Depois, execute o comando de promoção/rebaixamento conforme necessário.

## Troubleshooting

### /admin redireciona para /minha-conta

A sessão atual está sendo reconhecida como usuário comum.

Confirme a role diretamente no banco:

```powershell
docker compose exec db psql -U preenchimento -d preenchimento -c "SELECT email, role, status FROM app_users ORDER BY email;"
```

A conta precisa aparecer como:

```text
usuario@dominio.com | ADMIN | ACTIVE
```

Se ainda estiver como `USER`, promova novamente:

```powershell
docker compose exec api npm run admin:promote -- usuario@dominio.com
```

Depois faça logout e login novamente.

### Conta não encontrada

O comando só funciona com uma conta já existente.

Confirme os usuários:

```powershell
docker compose exec db psql -U preenchimento -d preenchimento -c "SELECT email, role, status FROM app_users ORDER BY email;"
```

### Não é permitido remover o último administrador

Esse comportamento é intencional.

Promova outra conta primeiro:

```powershell
docker compose exec api npm run admin:promote -- outro-admin@dominio.com
```

Depois remova a role da conta anterior:

```powershell
docker compose exec api npm run admin:demote -- admin-antigo@dominio.com
```

## Comandos de referência rápida

Promover:

```powershell
docker compose exec api npm run admin:promote -- usuario@dominio.com
```

Rebaixar:

```powershell
docker compose exec api npm run admin:demote -- usuario@dominio.com
```

Listar roles:

```powershell
docker compose exec db psql -U preenchimento -d preenchimento -c "SELECT email, role, status FROM app_users ORDER BY email;"
```

Atualizar aplicação:

```powershell
git pull --ff-only
docker compose up -d --build
```

## Arquivos relacionados

- `backend/src/scripts/admin-role.ts`
- `backend/src/modules/admin/admin-service.ts`
- `backend/src/routes/admin.ts`
- `backend/migrations/004_admin_dashboard.sql`
- `backend/migrations/005_admin_cli_audit.sql`
- `frontend/src/pages/AdminPage.tsx`
