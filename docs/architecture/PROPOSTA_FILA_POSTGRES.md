# Próxima etapa: fila PostgreSQL e workers persistentes — proposta para revisão

**Situação em 31/10/2026:** não implementada e **nenhuma migration foi criada na pasta executável nem aplicada**. O PR #97 apenas elimina o limite de 3 processos abertos por instância, admite até 100 e limita a duas operações pesadas em execução. Ao saturar, retorna `503 processing_capacity_exceeded` e permite tentar novamente. **Não há tarefa enfileirada neste estado.**

## Por que a fila exige mais que uma tabela

Hoje o `JobStore` usa `Map` em memória, documentos em armazenamento temporário privado e um callback de cobrança antes da chamada à OpenAI. Uma fila PostgreSQL desacoplada, sem remodelar esses contratos, poderia perder o estado do processo após reinício, fazer uma análise duplicada após expiração de lease ou levar outro worker a tentar ler um arquivo que não possui. Por isso não é seguro simplesmente adicionar um `CREATE TABLE` e um serviço worker.

## Proposta de entrega segura

1. **Modelar o estado técnico durável:** persistir somente UUIDs, dono, etapa, timestamps, tentativas, lease e motivo técnico da falha. Não persistir CPF, nomes, endereços, dados extraídos, imagens nem PDFs no banco.
2. **Armazenamento privado temporário compartilhável:** guardar a referência a objetos/arquivos criptografados e acessíveis somente ao worker autorizado, com expiração absoluta de uma hora e exclusão independente do estado de cobrança. O atual volume Docker local atende apenas uma instância.
3. **Tabela de tarefas:** desenhar schema de `processing_tasks` com `job_id`, `kind` (EXTRACT/GENERATE), `user_id`, `status`, `available_at`, `lease_until`, `attempts`, `idempotency_key`, `created_at` e `updated_at`; uma constraint adequada impediria duas tarefas ativas equivalentes. Definir índices e política de retenção antes de escrever migration.
4. **Admissão transacional:** inserir ou recuperar a tarefa idempotente no PostgreSQL. Workers reivindicam tarefas com lock transacional (ex.: `FOR UPDATE SKIP LOCKED`), usando lease e limite de concorrência por worker. Não segurar transações abertas durante chamadas externas.
5. **Cobrança OpenAI:** continuar debitando um crédito apenas antes do primeiro envio real. Registrar a tentativa de envio idempotente e **não repetir automaticamente** uma requisição cuja resposta se perdeu após o débito; reconciliar estado/uso antes de nova tentativa.
6. **Cancelamento, retries e falhas:** não apagar arquivos enquanto houver uma operação/stream ativo. Retentar operações locais seguras com backoff limitado; manter revisão manual e mensagens claras para indisponibilidade da OpenAI.
7. **Rollout:** migration revisada e autorizada explicitamente, integração PostgreSQL em banco descartável, testes de dupla requisição e recuperação após crash, testes de filas e backpressure, homologação controlada; somente então habilitar o worker via configuração e validar rollback.

## Revisão obrigatória antes de executar migration

Antes de criar/aplicar qualquer migration, apresentar SQL integral, riscos de locks, compatibilidade com registros atuais, inspeção de duplicidades, plano de rollout e rollback. **A autorização geral para melhorar desempenho não autoriza execução de migrations ainda não revisadas.**

Esta proposta não altera as regras de cobrança nem a política de retenção atual.
