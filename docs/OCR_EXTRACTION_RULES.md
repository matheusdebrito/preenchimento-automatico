# Extração estruturada conservadora — Fase 06

**Estado:** regras implementadas e submetidas a testes com texto/imagens **sintéticos**. Não existe homologação de precisão, uso de dados pessoais reais ou confiança suficiente para gerar um documento sem revisão.

## Identificação pelo requisito do serviço

O backend chama `suggestFields(text, requirementId)` após extrair texto nativo ou executar Tesseract. O `requirementId` vem do catálogo público, nunca do nome fornecido pelo arquivo. Cada resultado tem `status: REVIEW_REQUIRED` e indica qual documento originou a sugestão. O servidor salva candidatos **somente no job temporário**, não no PostgreSQL.

| Requisito de documento | Campos candidatos | Condições mínimas |
| --- | --- | --- |
| `buyer-identity` | `person.cpf`, `person.fullName`, `person.identity`, `person.issuer` | CPF com dígitos verificadores; nome e identidade apenas com rótulos explícitos |
| `seller-identity` | `seller.cpf`, `seller.fullName`, `seller.identity`, `seller.issuer` | Mesmos filtros, mas **nunca transferidos aos campos do comprador** |
| `tie` | `vessel.name`, `vessel.registration`, `vessel.hullId` | Registro e nome apenas com rótulos claros da embarcação; nenhum CPF do titular atribuído ao comprador |
| `residence-proof` | `person.address`, `person.postalCode` | Endereço/CEP explícitos; nunca presume quem reside no imóvel |
| `source` (somente fixture de CI) | `vessel.hullId` | Rótulo HIN/CIN/casco |
| outros requisitos | nenhum campo novo específico | Não há heurística arbitrária |

Cada regra recusa múltiplos valores diferentes para o mesmo campo. Valores presentes são **sugestões**, não dados comprovados. A interface exibe o nome do documento de origem, e o usuário precisa conferir/corrigir tudo.

## Segurança e qualidade

- Não inferir nome, CPF ou endereço por posição de linha, proximidade de palavras ou por correspondências sem rótulos.
- CPF válido pelo cálculo dos dígitos verificadores não confirma que o indivíduo é o titular.
- Não preencher automaticamente campos de assinatura, datas não declaradas, carimbos ou documentos sem correspondência inequívoca.
- O Tesseract pode errar letras, acentos, documentos e números: os testes unitários verificam regras de extração, **não** a acurácia real do OCR.
- Não existe porcentagem de confiança calibrada; registrar baixa confiabilidade na UX e nunca anunciar confiabilidade numérica sem testes.
- Arquivos e texto extraído são temporários; permanecem fora de logs e do banco operacional.

## Casos de regressão

- CPF de comprador e vendedor com papéis distintos.
- CPF inválido, múltiplos CPFs legítimos no mesmo documento e ausências.
- TIE com nome e número da embarcação rotulados; não confundir proprietário com comprador.
- Duas inscrições diferentes no mesmo TIE: nenhuma sugerida.
- Comprovante com CEP/ENDEREÇO; múltiplos CEPs diferentes: sem sugestão.
- Exibição na revisão do documento de origem em linguagem amigável.

Arquivos: `backend/src/modules/jobs/ocr.ts`, `backend/src/modules/jobs/document-validator.test.ts`, `frontend/src/features/real/LiveFlowPage.tsx`.

## Pendências para concluir a Fase 06

- [ ] Bateria com imagens fictícias de diferentes resoluções, sombras, rotação, cortes e múltiplas páginas.
- [ ] Extrair e avaliar qualidade/confiança efetiva com corpus controlado, critérios mensuráveis e testes de erro.
- [ ] Validar as variantes de campos dos documentos aceitos; melhorar pré-processamento sem comprometer privacidade/limites.
- [ ] Registrar e mitigar falso positivo/negativo, com revisão independente antes de habilitar o piloto.
