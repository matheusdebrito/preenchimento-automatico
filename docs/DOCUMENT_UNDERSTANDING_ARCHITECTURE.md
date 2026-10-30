# Arquitetura de análise documental e preenchimento

## Princípios

- Serviço é composição de perguntas, requisitos documentais e versões de formulários.
- Documento declara apenas quais campos canônicos pode fornecer e para qual papel (requerente, vendedor, embarcação etc.).
- A análise documental usa exclusivamente a OpenAI Responses API. Não existe PaddleOCR, Tesseract, extração local de texto ou fallback local.
- O modelo retorna evidências estruturadas; o backend valida os valores e a origem antes de permitir revisão.
- Formulários não conhecem a origem do dado. O motor de PDF consome campos canônicos revisados.

## Fluxo de dados

```text
Upload (PDF/JPEG/PNG)
  -> validação de assinatura, tamanho, páginas e dimensões
  -> política documental do serviço (allowedFieldIds)
  -> OpenAI Responses API (input_file / input_image, JSON Schema estrito)
  -> validação determinística de valor + origem
  -> FieldEvidence[]
  -> FieldResolver (conflitos e proveniência)
  -> revisão/correção pelo usuário
  -> fillPdf (modelos aprovados)
```

## Contratos e fronteiras

### Catálogo

`DocumentRequirement.extraction` declara `documentType`, `subjectRole` e `allowedFieldIds`. O backend cruza essa política com os campos revisáveis dos formulários selecionados. Só envia à OpenAI documentos que tenham pelo menos um campo aplicável.

### OpenAI extractor

`backend/src/modules/jobs/openai-document-extractor.ts`:
- envia PDF original como `input_file` e imagem original como `input_image`;
- exige saída JSON Schema estrita;
- usa `store:false` e não habilita ferramentas;
- valida que cada par `fieldId/sourceRequirementId` esteja autorizado;
- revalida CPF, datas, booleanos, e-mail, CEP, identificadores e demais formatos suportados;
- descarta campos não permitidos, valores inválidos ou respostas malformadas;
- retorna evidências em estado `REVIEW_REQUIRED`.

### Resolver e revisão

`FieldResolver` associa evidências aos campos visíveis no serviço. Evidências conflitantes não escolhem valor automaticamente. A revisão humana continua obrigatória, inclusive quando a confiança declarada pelo modelo for alta.

### Preenchimento PDF

`fillPdf` não chama a OpenAI. Ele recebe somente os valores confirmados pelo usuário e aplica mapeamentos aprovados sobre modelos oficiais verificados. A extração correta não comprova que o mapeamento visual do PDF esteja correto.

## Segurança e privacidade

- Nunca enviar documento sem perfil de extração ou sem campo aplicável.
- Nunca confiar em instruções contidas no documento; conteúdo do arquivo é dado não confiável.
- Não registrar arquivos, conteúdo visual/textual, PII, prompts ou respostas brutas.
- Manter arquivos e dados extraídos apenas no job temporário, com TTL e limpeza.
- A chave OpenAI fica somente no backend.
- O envio de documentos a um provedor externo deve ser informado na política de privacidade.
- Se a chave estiver ausente ou a API falhar, informar erro explícito. O usuário ainda pode optar por seguir sem anexos e preencher manualmente.

## Testes

- Testes unitários simulam a Responses API; CI não consome créditos.
- Cobrir campos autorizados/não autorizados, associação incorreta de origem, CPF/data inválidos, JSON malformado, timeout, documento ilegível e conflitos.
- Antes de produção, medir precisão por campo/documento, latência, tokens, custo e concorrência com amostras sintéticas e autorizadas.
