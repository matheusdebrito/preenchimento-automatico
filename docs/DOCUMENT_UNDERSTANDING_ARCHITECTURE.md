# Arquitetura de formulários e entendimento de documentos

## Decisão

A aplicação não define campos manualmente por serviço. O serviço compõe formulários e regras de processo; os campos necessários são derivados dos mapeamentos dos formulários selecionados.

A extração também não deve conhecer serviços. Um documento produz evidências de campos canônicos; o processo decide quais dessas evidências são aplicáveis aos formulários escolhidos.

Fluxo obrigatório:

```text
Serviço -> Formulários -> FormMapping -> campos canônicos
Upload -> OCR -> DocumentObservation -> DocumentExtractor -> FieldEvidence
FieldEvidence -> FieldResolver -> revisão humana -> preenchimento dos formulários
```

## Responsabilidades

### Campo canônico

É a identidade semântica reutilizável, por exemplo `person.fullName`, `person.cpf`, `vessel.registration`. Não pertence a um serviço nem a um PDF específico.

### Formulário

`FormDefinition` e `FormVersion` representam o documento. `FormMapping.placements` é a fonte de verdade técnica dos campos que aquela versão precisa. Um serviço não deve duplicar essa lista.

### Serviço

`ServiceDefinition` contém workflow, perguntas, custo e documentos que podem auxiliar o processo. `ServiceForm` compõe versões de formulários e condições. O serviço não implementa regras de OCR.

### Tipo de documento

Um tipo de documento possui estratégia própria de entendimento. RG, CNH, TIE, CHA e CIR devem evoluir para tipos identificáveis e extratores independentes. Nesta primeira migração, RG/CNH continuam sob o perfil transitório `identity` porque o fluxo atual ainda não classifica qual documento de identidade foi enviado. Não inferir o tipo silenciosamente.

### DocumentObservation

É a representação neutra da saída do OCR: páginas, linhas, confiança e geometria. PaddleOCR é um produtor dessa observação; regras de domínio não devem depender da API específica do Paddle.

### DocumentExtractor

Conhece a semântica de um tipo de documento e produz `FieldEvidence[]`. Não conhece serviço nem formulário.

### FieldEvidence

Registra valor, campo canônico, documento, página, linhas utilizadas, confiança e método de associação. É temporário e sujeito a revisão; nunca prova autenticidade.

### FieldResolver

Agrupa evidências por campo. Valores equivalentes podem reforçar a origem; valores divergentes geram conflito e não são escolhidos silenciosamente.

## Regras de evolução

1. Não adicionar novos documentos ao parser monolítico `suggestFields()`.
2. Novos documentos devem ganhar extractor próprio e testes sintéticos.
3. Coordenadas absolutas só podem ser pistas; preferir âncoras semânticas e relações espaciais.
4. OCR não inventa valores. Ausência, ambiguidade e conflito seguem para revisão manual.
5. Extratores não conhecem IDs de serviço.
6. Formulários não conhecem a origem do dado.
7. Serviços não duplicam listas de campos já presentes nos mapeamentos.
8. Evidência e dados extraídos permanecem temporários e não entram em analytics/logs.
9. Antes de suportar RG, CNH, TIE, CHA e CIR individualmente, implementar classificação explícita ou escolha do tipo; não assumir que todo documento de identidade é RG.

## Migração incremental

- Etapa 1: contratos, observação neutra, resolver e extractor de identidade.
- Etapa 2: retirar identidade do parser legado após regressões equivalentes.
- Etapa 3: criar classificação/tipo explícito e separar RG de CNH.
- Etapa 4: adicionar TIE, CHA e CIR como extractors independentes.
- Etapa 5: migrar comprovante de residência e documento de venda; eliminar o parser legado quando não houver consumidores.

O parser legado pode existir durante a transição para tipos ainda não migrados, mas não pode receber novos tipos de documento.
