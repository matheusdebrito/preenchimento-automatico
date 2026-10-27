# Extração estruturada conservadora — Fase 06

**Estado:** regras implementadas e submetidas a testes com texto/imagens **sintéticos**. Não existe homologação de precisão, uso de dados pessoais reais ou confiança suficiente para gerar um documento sem revisão.

**Escopo revisado:** fotografias da embarcação (popa/través) não
devem ser enviadas ao serviço de preenchimento: não geram sugestões de
campos. Se forem exigidas no protocolo oficial, essa obrigação é externa
à geração automática dos formulários.

## Identificação pelo requisito do serviço

O backend chama `suggestFields(text, requirementId)` após extrair texto nativo ou executar Tesseract. O `requirementId` vem do catálogo público, nunca do nome fornecido pelo arquivo. Cada resultado tem `status: REVIEW_REQUIRED` e indica qual documento originou a sugestão. O servidor salva candidatos **somente no job temporário**, não no PostgreSQL.

| Requisito de documento | Campos candidatos | Condições mínimas |
| --- | --- | --- |
| `buyer-identity` | `person.cpf`, `person.fullName`, `person.identity`, `person.issuer`, `person.issueDate` | CPF válido sintaticamente, dados de identidade rotulados e data de emissão válida |
| `seller-identity` | `seller.cpf`, `seller.fullName`, `seller.identity`, `seller.issuer`, `seller.issueDate` | Mesmos filtros; **nunca transferidos aos campos do comprador** |
| `tie` | `vessel.name`, `vessel.registration`, `vessel.hullId`, `vessel.year`, `vessel.length`, `vessel.capacity`, `vessel.motorBrand`, `vessel.motorPower`, `vessel.motorSerial` | Atributos da embarcação e motor com rótulos explícitos; nenhum CPF do titular atribuído ao comprador |
| `residence-proof` | `person.address`, `person.streetNumber`, `person.apartment`, `person.city`, `person.neighborhood`, `person.state`, `person.postalCode` | Cada componente somente com seu rótulo (`ENDEREÇO`, `NÚMERO`, `COMPLEMENTO`, `CIDADE`, `BAIRRO`, `UF`, `CEP`); nunca deduz cidade/bairro de endereço não estruturado |
| `sale-document` | `sale.invoice`, `sale.date`, `sale.place`, `sale.price` | Número, data válida (DD/MM/AAAA), local e valor rotulados de forma inequívoca; nenhum comprador/vendedor inferido |
| `source` (somente fixture de CI) | `vessel.hullId` | Rótulo HIN/CIN/casco |
| GRU, procuração e requisitos sem extração estruturada | não são enviados ao OCR | Sem heurística semântica confiável; avaliar futuramente se precisam ser uploads neste produto |
| outros requisitos | nenhum campo novo específico | Não há heurística arbitrária |

Cada regra recusa múltiplos valores diferentes para o mesmo campo. Valores presentes são **sugestões**, não dados comprovados. A interface exibe o nome do documento de origem, e o usuário precisa conferir/corrigir tudo.

A API monta os resultados de cada extração em estruturas locais temporárias e só os publica na revisão quando todos os documentos semanticamente relevantes terminam de processar. Falhas retornam o job a `UPLOADED`, limpam sugestões parciais e permitem nova tentativa; não é preciso refazer todos os uploads.

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
- [ ] Validar layout real de comprovantes em que endereço/cidade/bairro/CEP estão impressos em uma mesma linha, sem rótulos separados. Só implementar parser depois de validar casos com dados fictícios e preservar rejeição de ambiguidades.
- [ ] Validar variantes reais dos rótulos de identidade, TIE e venda com corpus controlado e melhorar pré-processamento sem comprometer privacidade/limites. Os campos TIE/venda novos usam apenas casos sintéticos e são sempre `REVIEW_REQUIRED`.
- [ ] Registrar e mitigar falso positivo/negativo, com revisão independente antes de habilitar o piloto.

## Ajuste de QA de 27/10/2026

O `DEV_QA_PREVIEW=true` agora utiliza **o mesmo serviço de transferência** com perguntas, requisitos e mapeamentos reais do catálogo (somente adaptados em memória para prévias, sem homologação). Isso permite avaliar a taxa de extração campo a campo do BDMOTO, inclusive Cidade, Bairro e CEP. A API restringe os candidatos OCR aos campos efetivamente presentes no pacote selecionado; os demais não são expostos na revisão.

O BDMOTO possui uma linha própria de Endereço e outra com Cidade/Bairro/CEP. A linha de Endereço **não foi suprimida sem validação visual**, para não apagar um campo do formulário oficial. As posições ainda precisam de verificação humana no PDF com marca AMOSTRA. Testes sintéticos de OCR não demonstram extração de todos os dados de um documento fotográfico real.
