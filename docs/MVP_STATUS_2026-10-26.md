# Status técnico do MVP — 26/10/2026

## Origem e histórico

OpenCode entregou as fases 00–02 e seis PDFs NORMAM-212/DPC 2026 oficiais versionados. O estado foi auditado via GitHub antes de continuar. Esta rodada implementou API, PDFs, arquivos temporários, OCR, contas, créditos de teste, interface real e testes E2E em banco real. **Nenhum cliente real foi processado e nenhuma cobrança real foi ativada.**

## Módulos implementados

| Módulo | Evidência | Status |
|---|---|---|
| API Fastify de catálogo | `backend/src/routes/catalog.ts`, `public-catalog.ts`, testes unitários | Implementado e testado com fixtures |
| Modelos oficiais | `backend/templates/*/v1/original.pdf` | 6 PDFs `VERIFIED` pela Fase 02 |
| Motor de preenchimento | `backend/src/modules/pdf/` | Testado com dados sintéticos; aprovação real bloqueada |
| Mapeamento independente | `backend/src/modules/catalog/draft-mappings.ts` | 104 posições `DRAFT`, relatórios por versão |
| Upload seguro/TTL | `backend/src/modules/jobs/`, `routes/jobs.ts` | Implementado; QA de falhas incompleto |
| OCR texto e Tesseract | `backend/src/modules/jobs/ocr.ts` | PDF nativo testado, scans não homologados |
| Login, sessão e ledger | `backend/src/modules/auth/`, migration SQL | PostgreSQL real testado, rate limit pendente |
| Interface integrada | `frontend/src/features/real/LiveFlowPage.tsx` | Desenvolvida, E2E de navegador pendente |
| E2E de API | `backend/src/routes/jobs.integration.test.ts` | 2 formulários sintéticos em modelo oficial, 1 débito único, login/download autorizados |
| Compose | `compose.yaml`, workflow CI | Smoke inicial identificou segredo vazio; correção incorporada e revalidação pendente |

## Evidências de mapeamento e riscos

Confira os arquivos da pasta [`docs/mapping-reports/`](mapping-reports/) e as imagens de [`docs/_pdf_test_previews/`](_pdf_test_previews/). Os testes renderizam somente valores sintéticos e adicionam marca d'água de amostra.

A inspeção automática/visual do agente revelou sobreposições de rótulos, que foram corrigidas em parte. Ainda existem campos sem mapeamento: datas, assinaturas, coproprietário, motores adicionais, rubricas e exigências condicionais. O serviço piloto precisa de avaliação jurídica/normativa local e revisão documental independente antes de tornar-se público, inclusive em ambiente local com dados reais.

## Próximas ações objetivas

1. Completar os mapas de 2-A e 2-B e suas regras condicionais e revisar visualmente todos os campos com dados longos/acento; depois os anexos condicionais.
2. Fechar relatórios, submeter à revisão humana independente e só então mudar `FormMapping` para `APPROVED`.
3. Associar `ServiceForm` e, depois de validar as regras, mudar o piloto para `AVAILABLE`.
4. Testar fotos digitalizadas com Tesseract, erros e limites de processamento, armazenamento/limpeza após crash/TTL e cargas concorrentes.
5. Adicionar limitação de taxa aos endpoints de autenticação e teste de rollback/estorno; concluir testes de interface no navegador.
6. Confirmar Smoke Docker Compose e hardening da Fase 09. Pagamentos reais e produção permanecem fases 10+.

**Estado:** fundação técnica avançada, **MVP ainda NÃO homologado**, sem uso de dados reais nem cobrança.
