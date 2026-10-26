# Catálogo de formulários oficiais (independente de serviços)

**Estado:** inventário inicial, nenhum PDF oficial obtido ou homologado no repositório.
O cadastro dos formulários é independente de transferência, renovação, inscrição ou qualquer outro serviço.

## Entidades e responsabilidades

| Entidade | Descrição | Validação |
| --- | --- | --- |
| `FieldDefinition` | Dado semântico como `person.fullName` ou `vessel.hullId` | Reutilizável entre documentos, OCR e formulários |
| `FormDefinition` | Identidade lógica estável do formulário | `id` não inclui nome do serviço |
| `FormVersion` | Um PDF oficial imutável, revisão, origem, norma, hash, tipo e situação | `IDENTIFIED`, `VERIFIED` ou `OUTDATED` |
| `FormMapping` | Revisão técnica dos nomes de campos ou coordenadas de **uma versão** | `DRAFT`, `TESTED` ou `APPROVED` |
| `ServiceForm` | Associação muitos-para-muitos do serviço à **versão** do formulário | Pode ter condições declarativas e ordem |

`FormVersion.status = VERIFIED` confirma arquivo e metadados; **não** homologa o preenchimento.
A homologação visual de cada versão só ocorre com `FormMapping.status = APPROVED`,
relatório, testes com dados sintéticos e revisão humana. Somente versões verificadas
com exatamente um mapeamento aprovado podem ser usadas em serviços ativos.

## Inventário inicial — candidatos não homologados

| Formulário candidato | Identificador sugerido | Norma a conferir | PDF | Estado |
| --- | --- | --- | --- | --- |
| Boletim de Dados de Moto Aquática (BDMOTO) | `bdmoto` | NORMAM-212/DPC vigente e Capitania competente | Não baixado | Candidato, não cadastrado como `FormVersion` |

**A tabela não confirma exigência do BDMOTO nem qualquer outro formulário no serviço
piloto.** Conferir fontes oficiais e requisitos condicionais antes de baixar ou vincular.
Formulários com nomes semelhantes podem ter PDFs distintos por norma e não devem
compartilhar o mesmo `FormVersion` sem equivalência comprovada.

## Diretórios versionados — NÃO por serviço

```text
backend/templates/
  <form-id>/
    <revisao-interna>/
      original.pdf

backend/src/modules/catalog/
  contracts.ts
  catalog.ts
  validate-catalog.ts
  catalog.test.ts

docs/
  FORM_CATALOG.md
  SERVICE_FORM_MATRIX.md
  FORM_MAPPING_REPORT_TEMPLATE.md
```

Por exemplo, `backend/templates/bdmoto/v1/original.pdf` é somente um exemplo
de caminho interno, **não** representa uma edição oficial confirmada.
IDs/revisões são slugs controlados. Um `FormVersion` preserva ainda a
identificação da revisão oficial, quando existir.

## Procedimento por formulário e versão

1. Pesquisar norma vigente, requisitos do serviço piloto e se o modelo já existe no catálogo.
2. Solicitar **somente PDFs ainda ausentes**, informando nome, link oficial e caminho por formulário.
3. Verificar conteúdo `%PDF`, tamanho, páginas, URL, revisão oficial, data e SHA-256.
4. Registrar `FormDefinition` e `FormVersion` sem atribuir um serviço proprietário.
5. Identificar AcroForm ou PDF estático; mapear cada posição/nome em `FormMapping` independente.
6. Gerar arquivo preenchido com dados fictícios, conferir todas as páginas e registrar
   preenchimento automático, revisão manual e pendências no relatório de mapeamento.
7. Somente após aprovação humana registrar `FormMapping.status = APPROVED`.
8. Confirmar aplicabilidade normativa e associar a versão aos serviços via `ServiceForm`.
9. Quando o PDF mudar: adicionar **nova** `FormVersion`, recalcular hash, criar novo
   `FormMapping` e refazer os testes. Nunca sobrescrever silenciosamente a revisão anterior.

## Segurança e verificação

- `validateCatalog` valida referências, duplicatas, URLs HTTPS, hash em formato SHA-256,
  pasta esperada, mapeamentos e estados, mas **não abre o arquivo nem comprova a
  autenticidade da fonte oficial**; essa verificação e a inspeção visual são separadas.
- Nenhum documento real de cliente, PDF preenchido, OCR ou imagem temporária pode entrar
  no Git, na pasta de modelos, nos logs ou em backup de dados persistentes.
- Os formulários só devem ser commitados após conferir a fonte e a possibilidade de
  redistribuição, com revisão independente do conteúdo.
