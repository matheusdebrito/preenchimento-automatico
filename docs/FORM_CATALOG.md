# Catálogo de formulários oficiais (independente de serviços)

**Estado:** pesquisa normativa da Fase 01 concluída em 26/10/2026. A Fase 02 foi
concluída em 26/10/2026: seis PDFs oficiais foram obtidos, verificados e
confirmados pelo usuário; as respectivas `FormVersion` foram registradas como
`VERIFIED`/`STATIC` no catálogo em código. Nenhum `FormMapping` ou `ServiceForm`
foi criado. O serviço piloto permanece `DRAFT` até o mapeamento da Fase 04.

O cadastro dos formulários é independente de transferência, renovação, inscrição
ou qualquer outro serviço. Os IDs e nomes abaixo identificam a identidade lógica
do documento; o PDF e a versão correspondente estão registrados na seção 3.1.

## 1. Escopo e fontes verificadas

**Serviço pesquisado:** transferência de propriedade de moto aquática (MA), sem
protocolo na Marinha e sem promessa de aprovação.

**Norma específica:** NORMAM-212/DPC — *Normas da Autoridade Marítima para Motos
Aquáticas e Motonautas*, edição 2026.

- PDF oficial consultado:
  <https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-212.pdf>
- Acesso em 26/10/2026; 112 páginas; tamanho 1.492.857 bytes; SHA-256
  `A10CEDAB96556B9747AC43B5F3F8CB79637DB365071A1609F75181852C5A90A0`.
  O arquivo foi usado apenas para leitura em diretório temporário do sistema e
  não foi adicionado ao repositório.
- Folha de registro de modificações: edição 2026, com a modificação 6 determinada
  pela **Portaria DPC/DGN/MB nº 201, de 27/02/2026**, com efeito indicado em
  04/03/2026.
- Página oficial da DPC: <https://www.marinha.mil.br/dpc/normam-212>. O acesso
  direto por ferramenta retornou HTTP 403 em 26/10/2026; a edição e a alteração
  foram conferidas no PDF oficial acima.

**Normas adicionais fornecidas pelo usuário em 26/10/2026:** foram conferidas
para descartar aplicação cruzada. Nenhuma delas substitui a NORMAM-212 no
serviço de transferência de MA.

| Norma | Título / escopo | Aplicabilidade ao piloto |
| --- | --- | --- |
| [NORMAM-101/DPC](https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-101.pdf), 2023 (Mod. 2 de 22/07/2026) | *Normas da Autoridade Marítima para Aquaviários*; trata de ingresso, cadastro, inscrição, certificação e carreira de aquaviários. PDF com 267 páginas; SHA-256 `74AF4D83C26A255B7C8EF9A12359F905AEF00488490D0347AD548CE0A24CD049`. | **Não aplicável** à transferência de propriedade de MA; não usar seus anexos. |
| [NORMAM-211/DPC](https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-211.pdf), 2026 | *Normas da Autoridade Marítima para Atividades de Esporte e Recreio*. A introdução exclui expressamente as embarcações do tipo moto aquática e motonauta e remete à NORMAM-212. PDF com 268 páginas; SHA-256 `71492859082A6786203619C859FCC99BC72C85128DC9FD27D32F93A92B09598C`. | **Não aplicável** à MA; não usar seus anexos de transferência. |
| [NORMAM-212/DPC](https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-212.pdf), 2026 | *Normas da Autoridade Marítima para Motos Aquáticas e Motonautas*. PDF com 112 páginas; SHA-256 `A10CEDAB96556B9747AC43B5F3F8CB79637DB365071A1609F75181852C5A90A0`. | **Aplicável** ao piloto; base do item 2.4.1. |

A verificação foi feita no texto oficial: a NORMAM-211/DPC 2026 declara, na
introdução e no item 1.2, que ficam excetuadas as regras para moto aquática e
motonauta, cujo regramento está na NORMAM-212/DPC. A NORMAM-101/DPC trata de
aquaviários, não de propriedade de embarcação de esporte/recreio.

**Serviço no gov.br:** *Solicitar inscrição, transferência de propriedade e/ou
jurisdição, títulos e certidões de Embarcações*,
<https://www.gov.br/pt-br/servicos/solicitar-inscricao-transferencia-de-propriedade-e-ou-jurisdicao-titulos-e-certidoes-de-embarcacoes>,
com última modificação em 15/12/2025. A página informa atendimento em qualquer
Capitania, Delegacia ou Agência (CP/DL/AG) e taxa de **R$ 36,00** para
“TITULOS - TRANSFERENCIA DE PROPRIEDADE DE EMBARCACAO”. O valor e o código da
GRU devem ser reconferidos na tabela vigente antes de qualquer cobrança.

**Jurisdição:** o item 2.4.1 da NORMAM-212 permite requerer a transferência em
**qualquer CP/DL/AG**; não foi identificada uma jurisdição obrigatória para este
serviço. Exigências operacionais locais (agendamento, idade do comprovante de
residência, conferência de documentos) não são universais e não foram tratadas
como regra nacional. A unidade escolhida deve ser confirmada antes do atendimento.

**Fora do escopo desta pesquisa:** inscrição inicial, renovação de TIE,
transferência de jurisdição, aluguel de MA, habilitação de motonauta e
formulários das NORMAM-201/202, da NORMAM-211 (que exclui MA) e da NORMAM-101
(aquaviários). A NORMAM-212 é a norma específica para MA.

## 2. Regras confirmadas para transferência de propriedade

Base: NORMAM-212/DPC 2026, item **2.4.1**, páginas 2-4 e 2-5.

- A transferência deve ser requerida pelo **novo adquirente**, por meio do
  **BDMOTO (anexo 2-B)**, dentro de **60 dias** para embarcações inscritas em
  CP/DL/AG.
- Se o TIE for digital (Gov.br) ou antigo sem data de validade, o proprietário
  deve preencher a **Autorização de Transferência de Propriedade (anexo 2-D)**,
  com reconhecimento das firmas do comprador e do vendedor **por autenticidade**.
  Se o TIE antigo já contiver autorização equivalente, ela pode ser avaliada pela
  CP/DL/AG; não criar uma segunda autorização sem necessidade. Assinatura
  eletrônica é admitida na forma da alínea “b” do inciso 1.11.3.
- Para evitar multas ao vendedor, recomenda-se a **Comunicação de Transferência
  de Propriedade (anexo 2-E)**, que é opcional para o comprador e deve ser
  acompanhada de cópia da autorização.
- Documentos relacionados no item 2.4.1: TIE; autorização de transferência;
  BDMOTO; procuração e identificação do outorgado (quando aplicável);
  comprovante de residência; documento oficial de identificação com foto e
  CPF/CNPJ; duas fotografias coloridas da MA (popa e través); e comprovante de
  pagamento da GRU.
- **Não** constam do 2.4.1: DPEM, vistoria, CSN ou nota fiscal como documento
  autônomo. O BDMOTO contém campos de nota fiscal/venda, mas isso não transforma
  a nota em exigência autônoma do rol. Não exigir esses itens por padrão sem
  confirmação local por escrito.
- O sistema **não substitui o reconhecimento de firma** nem o atendimento
  presencial. Um anexo 2-D gerado pelo sistema é uma minuta preenchida; só se
  torna documento de transferência válido após as assinaturas e o reconhecimento
  exigidos. O pacote final não deve ser apresentado como “pronto para protocolo”
  antes disso.
- O sistema não protocola o processo na Marinha. O usuário paga a GRU, entrega
  os documentos e acompanha o processo nos canais oficiais.

## 3. Formulários identificados

| Anexo | Nome oficial | ID lógico | Uso no serviço | Obrigação | PDF no repositório |
| --- | --- | --- | --- | --- | --- |
| 2-A | Requerimento para inscrição ou transferência de propriedade e/ou jurisdição de moto aquática ou do seu proprietário | `requerimento-ma` | Requerimento do adquirente | Obrigatório | Sim, `v1` (`VERIFIED`, `STATIC`) |
| 2-B | Boletim de Dados de Moto Aquática (BDMOTO) | `bdmoto` | Dados da MA, do requerente e da venda; emitido em duas vias | Obrigatório | Sim, `v1` (`VERIFIED`, `STATIC`) |
| 2-D | Autorização de Transferência de Propriedade | `autorizacao-transferencia-ma` | Autorização do proprietário/co-proprietário, com firmas reconhecidas | Condicional: exigido quando o TIE digital/antigo sem validade não trouxer autorização equivalente; assinatura/reconhecimento pelo usuário | Sim, `v1` (`VERIFIED`, `STATIC`), extraído da NORMAM |
| 2-E | Comunicação de Transferência de Propriedade de Moto Aquática | `comunicacao-transferencia-ma` | Comunicação do vendedor para reduzir risco de multa | Opcional | Sim, `v1` (`VERIFIED`, `STATIC`), extraído da NORMAM |
| 2-C | Declaração de Perda, Roubo ou Extravio de Título de Inscrição de Embarcação | `declaracao-perda-tie-ma` | Alternativa quando o TIE foi extraviado | Condicional | Sim, `v1` (`VERIFIED`, `STATIC`) |
| 1-C | Declaração de Residência | `declaracao-residencia-ma` | Alternativa quando não há comprovante de residência | Condicional | Sim, `v1` (`VERIFIED`, `STATIC`) |

**IDs independentes de serviço:** `requerimento-ma` e `bdmoto` são formulários
de uso mais amplo e não devem ser renomeados ou duplicados por serviço. Os demais
IDs representam a identidade do formulário, não uma pasta de serviço.

**Excluído:** o **anexo 3-D** trata de extravio/furto/roubo/dano da **CHA de
Motonauta**, não do TIE. Não usar o 3-D como declaração de perda do TIE.

### 3.1 Arquivos verificados e versões registradas

Verificação de 26/10/2026: todos os arquivos têm assinatura `%PDF`, não estão
criptografados, não possuem campos AcroForm e foram classificados como `STATIC`.
As páginas foram renderizadas para conferência visual. O PDF completo da
NORMAM-212 permaneceu fora do repositório; somente os anexos abaixo foram
versionados, em `backend/templates/<form-id>/v1/original.pdf`.

| ID / versão | Anexo | Origem do arquivo | Páginas / bytes | SHA-256 | Caminho no repositório |
| --- | --- | --- | --- | --- | --- |
| `requerimento-ma-v1` | 2-A | PDF standalone 2026 da CPPE; comparado visualmente com a NORMAM, p. 75 | 1 / 25.510 | `0E0CE9A72BE328C722D0D8C6CCB5C028E1B0881119D8A8A743BC52AA88CBFB5E` | `backend/templates/requerimento-ma/v1/original.pdf` |
| `bdmoto-v1` | 2-B | PDF standalone 2026 da CPPE; comparado visualmente com a NORMAM, p. 76-77 | 2 / 31.891 | `BBCC6E0FA261BE82C30FBD280697E83E750DA82B5CFB88647BA27748F0973318` | `backend/templates/bdmoto/v1/original.pdf` |
| `autorizacao-transferencia-ma-v1` | 2-D | Extraído do PDF oficial da NORMAM-212/DPC 2026, p. 81-82 | 2 / 1.088.148 | `1E3855A0F6151481032E01823EE38985D69BAB68606A33C201ACEF0E1D2B8ED3` | `backend/templates/autorizacao-transferencia-ma/v1/original.pdf` |
| `comunicacao-transferencia-ma-v1` | 2-E | Extraído do PDF oficial da NORMAM-212/DPC 2026, p. 84 | 1 / 1.086.868 | `3CE8A920F8E77A10105973B1B0CF74CD7A48A34B3F449496B2CC9D89E97B0419` | `backend/templates/comunicacao-transferencia-ma/v1/original.pdf` |
| `declaracao-perda-tie-ma-v1` | 2-C | PDF standalone 2026 da DelGuaira; comparado visualmente com a NORMAM, p. 79 | 1 / 37.562 | `A0F2464E4743AA5C60813066C16524FE2B8FDA2E67F78A6FF6472120B9BCE3EB` | `backend/templates/declaracao-perda-tie-ma/v1/original.pdf` |
| `declaracao-residencia-ma-v1` | 1-C | PDF standalone 2026 da CPPE; comparado visualmente com a NORMAM, p. 73 | 1 / 37.274 | `F75612D57F5D6C884D43107F17F0FB3F52B43B5A34BFAA351C6E717C26EA5782` | `backend/templates/declaracao-residencia-ma/v1/original.pdf` |

**Observações de origem:**

- Os quatro PDFs standalone acima são de março de 2026 e visualmente
  correspondem aos anexos da NORMAM-212/DPC 2026. A extração de texto apresenta
  pequenas diferenças de codificação de fonte, mas o conteúdo, os campos e o
  layout conferem.
- O 2-D foi extraído em duas páginas: a página 1 contém a autorização e as
  assinaturas/reconhecimentos; a página 2 contém a nota oficial e a referência
  ao anexo 2-E. O texto e as dimensões das páginas extraídas coincidem com as
  páginas de origem.
- O 2-E foi extraído de uma única página. O candidato standalone da CPRS foi
  baixado e descartado: seu título interno é **ANEXO 2-F**, de numeração antiga,
  e não corresponde ao 2-E da NORMAM-212/DPC 2026.
- Nenhuma versão foi marcada como `APPROVED`; `FormVersion = VERIFIED` significa
  apenas que o PDF e os metadados foram conferidos, não que o preenchimento
  esteja homologado.

## 4. Documentos de origem do usuário

Estes itens são **entradas** do fluxo, não modelos em branco gerados pelo
sistema. A origem e a finalidade devem ser exibidas no checklist.

| Documento de origem | Obrigação | Observação |
| --- | --- | --- |
| TIE atual (digital com QR Code impresso ou modelo antigo) | Obrigatório | Se digital, anexar cópia impressa com QR Code; se extraviado, ver 2-C |
| Autorização de Transferência de Propriedade assinada e reconhecida | Obrigatório | Pode ser o 2-D ou campo equivalente do TIE, conforme o caso; o sistema só gera minuta |
| Documento oficial de identificação com foto e CPF/CNPJ | Obrigatório | Cópia simples; PF/PJ conforme o caso |
| Comprovante de residência | Obrigatório | Se não houver, avaliar a Declaração de Residência (1-C) |
| Duas fotografias coloridas da MA (popa e través), em mídia | Obrigatório | Conferir legibilidade e características da MA |
| Comprovante de pagamento da GRU | Obrigatório | Valor/código a confirmar na tabela vigente |
| Dados da nota fiscal/venda (número, data, local, vendedor, CPF/CNPJ) | Necessário para preencher o BDMOTO | O 2.4.1 não lista a nota como documento autônomo; o BDMOTO pede os dados |
| Procuração e identificação do outorgado | Condicional | Quando o requerente atua por representante |
| Assinatura do co-proprietário | Condicional | Se houver co-proprietário, o 2-D prevê sua assinatura/reconhecimento |
| Declaração de perda/roubo/extravio do TIE (2-C) | Condicional | Se o TIE foi extraviado; pode ser necessária renovação do TIE |
| Declaração de Residência (1-C) | Condicional | Alternativa ao comprovante de residência |

**Não coletar por padrão:** DPEM, vistoria, CSN, contrato social/estatuto ou
nota fiscal como documento autônomo, pois não estão no rol do 2.4.1. Se a
CP/DL/AG escolhida exigir algo adicional, registrar a exigência local com
referência e tratá-la como condicional, não como regra nacional.

## 5. Perguntas condicionais propostas

As respostas devem ser opções enumeradas e validadas no backend; nenhuma
expressão arbitrária do cliente será executada.

| Pergunta | Opções | Efeito |
| --- | --- | --- |
| `tieSituation` | `digital_com_qr`, `antigo_sem_validade`, `antigo_com_validade`, `extraviado` | Digital/sem validade: usar 2-D; extraviado: 2-C e possível renovação do TIE |
| `authorizationStatus` | `assinada_reconhecida`, `pendente` | Se pendente, gerar minuta do 2-D e marcar o pacote como não protocolável até assinatura/reconhecimento |
| `sellerCommunication` | `sim`, `nao` | Se sim, incluir 2-E (opcional) |
| `residenceProof` | `conta_consumo`, `declaracao_1c` | Se declaração, incluir 1-C |
| `representative` | `nao`, `sim` | Se sim, exigir procuração e identificação do outorgado |
| `coOwner` | `nao`, `sim` | Se sim, exigir assinatura/reconhecimento do co-proprietário no 2-D |
| `buyerType` | `pessoa_fisica`, `pessoa_juridica` | Seleciona CPF/CNPJ e o documento de identificação correspondente |
| `jurisdictionChange` | `nao`, `sim` | `sim` está fora do piloto (transferência de jurisdição); orientar serviço separado |

## 6. Inconsistências e pendências de interpretação

Registradas para não serem resolvidas por suposição:

1. O item 2.4.1(a) remete ao **anexo 3-D** para TIE extraviado, mas o 3-D é a
   declaração da **CHA de Motonauta**; o anexo **2-C** é a declaração de perda,
   roubo ou extravio do **TIE**. Usar 2-C e confirmar com a CP/DL/AG qual modelo
   aceitar.
2. O item 2.4.1 menciona “modelo constante do anexo 2-S”, mas a NORMAM-212 não
   possui anexo 2-S; o modelo de comunicação é o **2-E**.
3. A nota do 2-D remete ao “artigo 2.11”, porém a transferência de MA está no
   **2.4.1**.
4. O item 2.4.1(h) menciona GRU de “inscrição de MA”, embora o serviço seja de
   transferência; a página do gov.br lista “TRANSFERENCIA DE PROPRIEDADE” por
   R$ 36,00. Confirmar o código/valor na tabela vigente.
5. Alguns sítios de CP/DL/AG ainda publicam formulários da antiga NORMAM-34/DPC
   com outra numeração. O candidato standalone da CPRS para o 2-E foi conferido
   e **descartado**: o título interno é **ANEXO 2-F** e a numeração não
   corresponde à edição 2026. **Não usar** arquivos antigos; conferir sempre
   contra a edição 2026 da NORMAM-212.
6. O 2-D traz prazo de 15 dias para embarcações registradas e 60 dias para
   inscritas. A MA do piloto é inscrita em CP/DL/AG; aplicar 60 dias, sem
   inventar registro no Tribunal Marítimo.

## 7. Checklist de downloads para a Fase 02

**Arquivos baixados, inspecionados e confirmados em 26/10/2026**, com autorização
do usuário. A Fase 02 foi encerrada após a confirmação do portão humano; os
arquivos estão nos caminhos definitivos e as `FormVersion` foram registradas no
catálogo em código.

Legenda: **P0** = necessário ao fluxo principal; **P1** = condicional/opcional;
**P2** = alternativa de residência.

| Prioridade | Formulário / ID | Anexo | Fonte oficial de referência | Destino verificado | Condição |
| --- | --- | --- | --- | --- | --- |
| P0 | `requerimento-ma` | 2-A | [PDF 2026 da CPPE](<https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-212(REQUERIMENTO%20EMBARCA%C3%87%C3%83O).pdf>) | `backend/templates/requerimento-ma/v1/original.pdf` | Obrigatório; `VERIFIED` |
| P0 | `bdmoto` | 2-B | [PDF 2026 da CPPE](<https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-212(BDMOTO).pdf>) | `backend/templates/bdmoto/v1/original.pdf` | Obrigatório, duas vias; `VERIFIED` |
| P0 | `autorizacao-transferencia-ma` | 2-D | NORMAM-212/DPC 2026, p. 81-82 (PDF oficial acima); extraído, pois não há standalone atual inequívoco | `backend/templates/autorizacao-transferencia-ma/v1/original.pdf` | P0 quando o TIE não trouxer autorização equivalente; `VERIFIED` |
| P1 | `comunicacao-transferencia-ma` | 2-E | NORMAM-212/DPC 2026, p. 84; extraído. O candidato da CPRS é o antigo **2-F** e foi descartado | `backend/templates/comunicacao-transferencia-ma/v1/original.pdf` | Opcional (vendedor); `VERIFIED` |
| P1 | `declaracao-perda-tie-ma` | 2-C | [PDF 2026 da DelGuaira](https://assets.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/Declara%C3%A7%C3%A3o%20de%20extarvio%20MA%20Anexo-2C.pdf) | `backend/templates/declaracao-perda-tie-ma/v1/original.pdf` | Condicional: TIE extraviado; confirmar divergência 3-D; `VERIFIED` |
| P2 | `declaracao-residencia-ma` | 1-C | [PDF 2026 da CPPE](<https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-212(DECLARA%C3%87%C3%83O%20DE%20RESIDENCIA).pdf>) | `backend/templates/declaracao-residencia-ma/v1/original.pdf` | Alternativa ao comprovante de residência; `VERIFIED` |

**Não solicitar:** anexo 3-D (CHA), formulários antigos da NORMAM-34/DPC, DPEM,
vistoria/CSN e modelos de outros serviços. O 2-D e o 2-E são extratos de páginas
inteiras do PDF oficial da NORMAM-212/DPC 2026; não foram redesenhados nem
substituídos. O PDF completo da norma não foi versionado.

## 8. O que já foi criado e o que ainda falta

- **Criado:** seis `FormDefinition` e seis `FormVersion` no catálogo em código,
  todas com `status = VERIFIED`, `pdfKind = STATIC`, hash, fonte, data e caminho
  verificado. Não há `FormMapping` nem `ServiceForm`.
- **Falta:** aprovação de `FormMapping` na Fase 04, com coordenadas, relatório
  por formulário/versão e renderização de todas as páginas com dados sintéticos.
- **Falta:** associação `ServiceForm` e liberação do serviço; o piloto continua
  `DRAFT` e não gera documento para usuário real.
- **Fora de escopo desta fase:** assinatura, reconhecimento de firma, GRU,
  protocolo na Marinha e qualquer promessa de aceitação oficial.

## 9. Critérios de aprovação (Fases 02 e 04)

1. O PDF deve vir de fonte oficial e ser registrado com URL, data, SHA-256,
   páginas e tipo.
2. `FormVersion = VERIFIED` só depois da inspeção do arquivo; não é aprovação
   do preenchimento.
3. `FormMapping = APPROVED` só depois de gerar todas as páginas com dados
   fictícios, conferir visualmente alinhamento/cortes/fontes e registrar o
   relatório por formulário/versão.
4. O serviço só pode ficar `AVAILABLE` com cada versão verificada e exatamente
   um mapeamento aprovado, além de condições e documentos validados no backend.
5. A aprovação técnica não garante aceitação pela Marinha e não substitui
   assinatura, reconhecimento de firma nem protocolo oficial.


## 10. Expansão NORMAM-211/DPC 2026

Em 28/10/2026 foram catalogados nove serviços de embarcações de esporte e
recreio e oito formulários vigentes da NORMAM-211/DPC. Diferentemente das seis
versões do piloto de moto aquática, essas novas versões permanecem
`IDENTIFIED`: os binários oficiais ainda não foram incorporados, hashados,
renderizados nem mapeados. Os serviços permanecem `DRAFT`.

Inventário, fontes, composição inicial, estratégia OCR e gates:
[NORMAM211_VESSEL_SERVICES.md](NORMAM211_VESSEL_SERVICES.md).
