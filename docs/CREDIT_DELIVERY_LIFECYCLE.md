# Ciclo de consumo de créditos — análise documental

**Situação:** o crédito é consumido quando a aplicação inicia o envio dos documentos para a OpenAI.

## Fluxo e invariantes

1. O usuário seleciona os documentos e confirma explicitamente a análise com IA.
2. Imediatamente antes da chamada externa à OpenAI, o backend consome **1 crédito por job**.
3. A cobrança é idempotente: contingência, retry do mesmo job ou chamadas concorrentes não criam um segundo débito.
4. O recibo fica com estado `consumed`. Depois que a requisição externa foi iniciada, o crédito não é estornado apenas porque o usuário não gerou ou não baixou os PDFs.
5. Geração e download dos PDFs não fazem nova cobrança.
6. Jobs antigos ainda podem possuir estados `charged`, `delivered` ou `refunded`; as rotinas de reconciliação continuam atuando somente nesses recibos legados pendentes.

A tabela persiste somente UUIDs, horários e estado de cobrança. Não armazena documentos, prompts, OCR, valores de formulários ou PDFs.

## Código e testes

- `backend/migrations/002_job_credit_receipts.sql`
- `backend/migrations/007_analysis_credit_consumption.sql`
- `backend/src/modules/auth/job-credit.ts`
- `backend/src/modules/auth/job-credit.integration.test.ts`
- `backend/src/routes/jobs.ts`
- `backend/src/modules/jobs/openai-document-extractor.ts`

A cobrança usa transação e bloqueio da linha do usuário. O hook de cobrança é executado imediatamente antes do `fetch` para a OpenAI.

## Limitações

- Se a conexão falhar depois do início da tentativa externa, o crédito permanece consumido, pois não é possível provar de forma segura que a OpenAI não recebeu/processou a requisição.
- O fluxo continua sendo de instância única para o armazenamento temporário dos jobs.
- Pagamentos reais continuam fora do escopo desta lógica de créditos internos.

