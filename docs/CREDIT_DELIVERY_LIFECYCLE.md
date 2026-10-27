# Ciclo de entrega de créditos — MVP de instância única

**Situação:** implementado e testado com créditos fictícios. Não há cobrança real.

## Fluxo e invariantes

1. A geração é concluída em armazenamento temporário privado.
2. O backend cria `credit_ledger` com débito de **1 crédito por processo**, e `job_credit_receipts` com estado `charged`, na **mesma transação**. Uma falha da transação desfaz ambas as operações.
3. No primeiro download com resposta HTTP finalizada, o recibo passa a `delivered`, não cobrando novamente pelos demais PDFs do pacote.
4. Antes da entrega, `DELETE` do job, expiração do limite absoluto de 60 minutos ou reinício do processo pode estornar o débito. O estorno cria apenas uma movimentação positiva no ledger e marca `refunded` atomicamente.
5. O startup de instância única estorna recibos pendentes do processo anterior antes de aceitar solicitações. Um sweep a cada 60 segundos verifica recibos vencidos.

A tabela contém somente UUID de usuário/job e horários/estado. Não contém nome, CPF, OCR, original enviado ou PDFs preenchidos. Os documentos seguem sendo apagados pelo armazenamento temporário.

## Código e testes

- `backend/migrations/002_job_credit_receipts.sql`
- `backend/src/modules/auth/job-credit.ts`
- `backend/src/modules/auth/job-credit.integration.test.ts`
- `backend/src/routes/jobs.ts`
- `backend/src/routes/jobs.integration.test.ts`
- `backend/src/server.ts`

As ações são idempotentes, com bloqueio transacional da linha do usuário. Os testes PostgreSQL verificam geração, concorrência, estorno, reinício simulado e entrega.

## Limitações bloqueantes

- A solução **não suporta múltiplas instâncias**. Um segundo servidor conectado ao banco poderia estornar cobranças de jobs ainda ativos no primeiro; implementar coordenação/estado compartilhado antes de escalar horizontalmente.
- `HTTP finish` prova apenas a finalização da escrita HTTP pelo servidor, **não o armazenamento do PDF pelo usuário**.
- Se o PostgreSQL ficar indisponível, o estorno aguarda uma reconciliação posterior.
- O PDF não é reconstruível após reiniciar a instância: somente o crédito não entregue é estornado.
- Exige testes de queda abrupta real, falha de banco durante entrega, tempo de expiração, segurança e política de devolução antes de comercializar.

**Não implementar pagamentos reais sem autorização específica e homologação.**
