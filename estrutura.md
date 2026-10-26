# Estrutura atual do projeto — 26/10/2026

> Este arquivo descreve a estrutura existente, não todas as funcionalidades concluídas.
> Consulte o PROJECT_TRACKER.md para status e critérios de aceite.

```text
preenchimento-automatico/
├── .github/workflows/ci.yml   # Typecheck, lint, testes, build e audit
├── AGENTS.md                  # Regras do agente
├── MVP_PLAN.md                # Escopo do MVP
├── PROJECT_TRACKER.md         # Fases até produção/expansão
├── UI_DESIGN_GUIDE.md         # Referência visual aprovada
├── README.md
├── compose.yaml               # Frontend, backend e PostgreSQL local
├── backend/
│   ├── src/
│   │   ├── modules/catalog/
│   │   │   ├── contracts.ts
│   │   │   ├── catalog.ts
│   │   │   ├── validate-catalog.ts
│   │   │   └── catalog.test.ts
│   │   ├── config/
│   │   └── routes/
│   ├── templates/README.md    # PDFs futuros por form-id/revisão
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/wizard/
│   │   ├── data/              # Apenas demonstração
│   │   └── pages/
│   ├── package.json
│   └── Dockerfile
└── docs/
    ├── FORM_CATALOG.md
    ├── SERVICE_FORM_MATRIX.md
    └── FORM_MAPPING_REPORT_TEMPLATE.md
```

## Arquitetura de formulários

Cada PDF oficial terá diretório independente em
`backend/templates/<form-id>/<revisao-interna>/original.pdf`.
`FormDefinition` define a identidade; `FormVersion`, o PDF
oficial imutável; `FormMapping`, o mapeamento técnico versionado;
`ServiceForm`, a associação com um ou vários serviços.

Seis PDFs oficiais do piloto foram cadastrados e verificados na Fase 02.
Eles estão em `backend/templates/<form-id>/v1/original.pdf`; o 2-D e o 2-E
são extratos de páginas da NORMAM-212/DPC 2026. A interface atual é uma
demonstração e não faz upload, OCR nem gera arquivos reais. A liberação do
serviço piloto depende do mapeamento aprovado e de revisão humana.
