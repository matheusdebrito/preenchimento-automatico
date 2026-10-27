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

## Reconhecimento de RG fotografado — ajuste de 27/10/2026

O diagnóstico do bug relatado revelou dois pontos concretos do código anterior:

1. Imagens de identidade eram lidas somente com `tesseract --psm 6`, modo que pressupõe um bloco uniforme de texto. RGs fotografados frequentemente distribuem nome, CPF, número do registro e emissor em áreas separadas.
2. O parser aceitava nomes e RG principalmente quando seguiam o formato **`NOME: VALOR`** ou **`RG: VALOR`** na mesma linha. Layouts como `NOME\nMARIA DE SOUZA` e `REGISTRO GERAL\n12.345.678-9` não geravam candidatos.

**Ajuste implementado:** para `buyer-identity`/`seller-identity` em imagens ou PDF rasterizado, usar primeiro segmentação de texto esparso `--psm 11`, com uma única tentativa alternativa `--psm 6` **também quando o nome civil do titular estiver ausente, mesmo que CPF e RG tenham sido encontrados**. A escolha prefere a leitura que consegue identificar o nome com rótulo explícito; em empate, usa a com mais candidatos válidos. As leituras não são concatenadas. O parser entende rótulo e valor na mesma linha ou em linhas consecutivas, exige formato reconhecível, rejeita nomes da mãe/pai e nomes sociais como nome civil, não mistura comprador/vendedor e não preenche valores em caso de conflito. Tudo continua sujeito a **revisão humana**.

**Evidência sintética:** teste unitário com rótulos separados e rejeição de ambiguidades (`document-validator.test.ts`); teste real de foto JPEG sintética gerada com Poppler e lida por Tesseract (`ocr.integration.test.ts`). [CI do código e dos testes](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40529677699) verificou backend, integração PostgreSQL, frontend e Compose; conferir a conclusão geral antes de marcar todos os jobs como aprovados.

**Limite:** nenhum RG real do usuário foi examinado aqui; o teste com documento fictício não demonstra acurácia em fotos com reflexos, cortes, inclinação, modelos diferentes ou OCR com caracteres confundidos. Não armazenar imagens, texto bruto ou dados de pessoas reais nos logs do servidor nem no repositório. O frontend exibe apenas o estado da análise e os campos sugeridos, não o conteúdo bruto do OCR.

**Referência técnica:** [Tesseract — Improving the quality of the output](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html), especialmente segmentação, escala, orientação e contraste.

## RG com CPF identificado e nome ausente — regressão de 27/10/2026

O critério anterior de fallback era apenas **quantidade de candidatos OCR**.
Ao reconhecer CPF e RG, o backend não executava a segunda segmentação, ainda
que o nome do titular estivesse vazio. O critério agora verifica explicitamente
`person.fullName` ou `seller.fullName`. Rótulos `NOME / NAME`, `NOME E
SOBRENOME` e `NOME MARIA DE SOUZA` são reconhecidos apenas quando o nome
candidato é plausível; rótulos de filiação/genitores continuam excluídos.

**Teste sem dados pessoais:** `backend/src/modules/jobs/document-validator.test.ts`
exercita CPF+RG reconhecidos sem nome, a escolha de outra leitura contendo nome,
e a não substituição do nome válido por muitos números. A leitura de imagens
continua limitada a duas tentativas, sem mistura de textos divergentes e com
revisão humana obrigatória. Não afirmar sucesso com a foto real do usuário
sem um novo teste controlado.

## Campos vazios sem erro HTTP — diagnóstico de integração (27/10/2026)

Uma operação `POST /api/jobs/:id/extract` pode responder HTTP 200 e manter
todos os campos vazios **sem erro de processamento**: a foto foi recebida, mas
não houve sugestão segura ou nenhuma sugestão corresponde aos campos do
formulário. Isso deve ser comunicado explicitamente e não confundido com
um bug silencioso de renderização.

**Contrato de diagnóstico por documento (sem textos pessoais):**

- `no_text`: Tesseract/Poppler não retornou texto reconhecível;
- `no_supported_labels`: houve texto, mas os candidatos validados são zero;
- `no_applicable_fields`: o OCR detectou um dado com regra conhecida, mas
  o campo não consta nos PDFs selecionados (ex.: RG do vendedor em 2-A/2-B);
- `suggested`: há campos válidos aplicáveis, todos ainda sujeitos à revisão;
- `not_analyzed`: requisito de upload não tem regra semântica de OCR.

O frontend exibe um aviso destacado **Nenhum campo preenchido pelo OCR** se
os documentos foram analisados mas zero campos foram aplicados; junto a cada
requisito mostra o motivo. O aviso não bloqueia o preenchimento manual.

**Cobertura:** teste React com API simulada comprova que
`person.fullName`, `person.cpf`, `person.identity` retornados sob
`buyer-identity` aparecem efetivamente nos inputs. Teste de integração
PostgreSQL/Poppler confirma `no_applicable_fields` para um dado reconhecido
fora do mapeamento do formulário, sem reproduzir a informação na resposta.

**Limitação:** o RG do usuário não foi fornecido aqui; o diagnóstico exato
do caso real ainda depende do resultado mostrado no navegador após atualizar
a aplicação. Não solicitar ou publicar OCR bruto, CPF ou fotos reais em issues
e logs; utilizar amostras com dados inventados.

## Ajuste de QA de 27/10/2026

O `DEV_QA_PREVIEW=true` agora utiliza **o mesmo serviço de transferência** com perguntas, requisitos e mapeamentos reais do catálogo (somente adaptados em memória para prévias, sem homologação). Isso permite avaliar a taxa de extração campo a campo do BDMOTO, inclusive Cidade, Bairro e CEP. A API restringe os candidatos OCR aos campos efetivamente presentes no pacote selecionado; os demais não são expostos na revisão.

O BDMOTO possui uma linha própria de Endereço e outra com Cidade/Bairro/CEP. A linha de Endereço **não foi suprimida sem validação visual**, para não apagar um campo do formulário oficial. As posições ainda precisam de verificação humana no PDF com marca AMOSTRA. Testes sintéticos de OCR não demonstram extração de todos os dados de um documento fotográfico real.
