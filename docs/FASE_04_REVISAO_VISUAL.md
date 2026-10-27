# Fase 04 — Verificação do mapeamento visual dos PDFs oficiais

**Estado:** implementação técnica ampliada; revisão humana independente pendente. **NÃO É HOMOLOGAÇÃO.**

## O que foi feito

- Conferência visual de exemplos gerados a partir dos seis PDFs oficiais; os originais permanecem imutáveis e vinculados a SHA-256.
- Motor `pdf-lib` com validação de linhas únicas, Unicode normalizado (NFC), acentos, sobreposição por largura, páginas giradas/CropBox, distinção explícita de AcroForm texto/checkbox e marcações `markWhen` condicionais.
- Validação semântica de CPF (dígitos verificadores), datas `DD/MM/AAAA` e escolhas dos motores antes de preencher uma versão `APPROVED`.
- Corretos papéis de **declarante** no 2-C, **coproprietário** e motores 2–4 no 2-D, campos de identidade/complemento no 2-E e local/data no 2-A.
- **135 posições** em rascunho, em seis versões, documentadas com indicação dos campos obrigatórios.
- CI com testes de preenchimento em cada PDF, SHA-256 e páginas, mais artefato `pdf-mapping-review-synthetic` com PDFs e PNGs de todas as páginas geradas com dados fictícios.

## Como fazer a aprovação humana

1. Abra o [GitHub Actions — CI](https://github.com/matheusdebrito/preenchimento-automatico/actions/workflows/ci.yml) e escolha uma execução aprovada na `main`.
2. Baixe o artefato **`pdf-mapping-review-synthetic`** no rodapé da execução. Contém PDFs marcados como **AMOSTRA — DADOS FICTÍCIOS — NÃO UTILIZAR**, e imagens `layout-*.png`. Eles não servem para submissão oficial.
3. Para cada versão, compare **todas as páginas** do PDF fictício com o original em `backend/templates/<form-id>/v1/original.pdf` e com a lista de campos de `docs/mapping-reports/<versão>.md`.
4. Confira manualmente 100% dos campos, acentos, posições, margens, linhas, checkboxes, dados de coproprietário, datas e onde o conteúdo não cabe. Teste valores longos e os casos condicionais usando somente **dados fictícios**.
5. Verifique que todas as áreas de assinatura, rubrica, reconhecimento de firma, carimbo e protocolo permanecem **em branco**. Não há assinatura digital automatizada, protocolo nem autenticação de firma.
6. Anote no relatório de cada modelo os campos que precisam de ajuste, links para evidência, data, nome do revisor e conclusão. Se encontrar sobreposição, atualizar coordenadas, regenerar prévias e repetir.
7. Somente após validação documental/normativa e revisão humana explícita, alterar o status do `FormMapping` para `APPROVED`; jamais automatizar essa transição ou usar `TESTED` como sinônimo de `APPROVED`.

## Inventário de modelos

| Anexo | FormVersion | Posições | Campos semânticos | Campos obrigatórios | Relatório |
| --- | --- | ---: | ---: | ---: | --- |
| 2-A | `requerimento-ma-v1` | 17 | 17 | 5 | [Abrir](mapping-reports/requerimento-ma-v1.md) |
| 2-B | `bdmoto-v1` | 28 | 28 | 6 | [Abrir](mapping-reports/bdmoto-v1.md) |
| 2-D | `autorizacao-transferencia-ma-v1` | 42 | 38 | 10 | [Abrir](mapping-reports/autorizacao-transferencia-ma-v1.md) |
| 2-E | `comunicacao-transferencia-ma-v1` | 29 | 29 | 6 | [Abrir](mapping-reports/comunicacao-transferencia-ma-v1.md) |
| 2-C | `declaracao-perda-tie-ma-v1` | 11 | 11 | 4 | [Abrir](mapping-reports/declaracao-perda-tie-ma-v1.md) |
| 1-C | `declaracao-residencia-ma-v1` | 8 | 8 | 3 | [Abrir](mapping-reports/declaracao-residencia-ma-v1.md) |

## Pendências por modelo — conferência obrigatória

- **2-A:** assinatura, CPF/CNPJ e requisição/local/data, com atenção à célula estreita de CPF. Confirmar eventuais situações de pessoa jurídica e representante.
- **2-B:** duas páginas e duas vias, vendedor e comprador, descrição da moto e marcas da natureza do requerimento; deixar assinatura, carimbo e protocolo livres.
- **2-C:** declarante independente de vendedor/comprador, data da identidade, comprovante da situação do TIE, local/data e assinatura manuais.
- **2-D:** quatro escolhas de motor e até quatro conjuntos de dados; coproprietário condicional; três assinaturas e campos para reconhecimento de firma permanecem manuais. A segunda página deve ser inspecionada, mesmo sem dados automáticos.
- **2-E:** identificação e endereço dos dois titulares, CP/DL/AG; data/local final e assinatura do vendedor ainda são manuais.
- **1-C:** endereço em linha única, conteúdo longo, local/data e assinatura manuais.

## Impedimentos antes de liberar o piloto

- [ ] Os seis relatórios possuem campo a campo o **aceite humano assinado/datado** (não substituído por verificação automática).
- [ ] Os campos opcionais/condicionais foram conferidos contra as exigências vigentes da NORMAM-212 e diferenças operacionais locais pertinentes.
- [ ] Foi comprovado que nomes longos, datas e acentuação são legíveis sem invadir rótulos/células ou recortar o texto.
- [ ] Os PDF gerados preservam todas as páginas e áreas manuais, e a impressão/assinatura foi testada.
- [ ] `ServiceForm` será associado às versões aprovadas com condições explícitas; `ServiceDefinition` permanece `DRAFT` até todas as dependências atendidas.

**Situação atual:** não promover `FormMapping` de `DRAFT` para `APPROVED` automaticamente. A autorização do usuário para implementar o MVP não substitui a aprovação humana do conteúdo de formulários oficiais.
