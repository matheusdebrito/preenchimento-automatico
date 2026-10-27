# Matriz de serviços e versões de formulários

Os formulários são cadastrados e mapeados individualmente. **Só depois** o
backend relaciona os serviços às versões oficiais verificadas; os serviços não
são donos dos PDFs e não criam cópias nem mapeamentos próprios.

**Estado em 26/10/2026:** pesquisa documental da Fase 01 concluída e Fase 02
encerrada após confirmação do usuário. Seis PDFs oficiais foram obtidos e
verificados; as seis `FormVersion` estão registradas como `VERIFIED`/`STATIC`.
Nenhum `FormMapping` foi aprovado e nenhum `ServiceForm` foi criado. O serviço
continua `DRAFT` até o mapeamento da Fase 04.

## Serviço piloto

| Serviço | ID | Formulários identificados | Versões ligadas | Condições | Situação |
| --- | --- | --- | --- | --- | --- |
| Transferência de propriedade de moto aquática | `transferencia-moto-aquatica` | 2-A e 2-B obrigatórios; 2-D condicional; 2-E opcional; 2-C e 1-C condicionais | Seis `v1` verificadas; nenhum `ServiceForm` | TIE, assinatura/reconhecimento, residência, representante e co-proprietário | `DRAFT` |

## Base normativa confirmada

- **NORMAM-212/DPC 2026**, item **2.4.1** (transferência de propriedade de MA).
  Fonte: [PDF oficial](https://assets.marinha.mil.br/sites/default/files/atos-normativos/dpc/normam/normam-212.pdf),
  acesso em 26/10/2026, 112 páginas, SHA-256
  `A10CEDAB96556B9747AC43B5F3F8CB79637DB365071A1609F75181852C5A90A0`.
- **NORMAM-211/DPC 2026** foi conferida e **não se aplica**: sua introdução
  exclui expressamente moto aquática e motonauta, remetendo à NORMAM-212.
  **NORMAM-101/DPC** regula aquaviários e também não se aplica à transferência
  de propriedade. Nenhum anexo dessas duas normas será usado no piloto.
- A transferência é requerida pelo **novo adquirente**, via **BDMOTO (2-B)**,
  em até **60 dias** para MA inscrita em CP/DL/AG.
- Pode ser requerida em **qualquer CP/DL/AG**; não há jurisdição obrigatória
  identificada para o serviço. Exigências operacionais locais não são tratadas
  como regra nacional.
- O **2-D**, quando aplicável, exige reconhecimento das firmas do comprador e do
  vendedor por autenticidade; o sistema só pode gerar uma minuta preenchida. O
  reconhecimento e a assinatura são etapas humanas externas. Se o TIE antigo já
  contiver autorização equivalente, a CP/DL/AG deve avaliá-la antes de exigir
  outra via.
- O **2-E** é uma comunicação opcional do vendedor para reduzir risco de multa;
  não substitui o requerimento do comprador.
- O **2.4.1** não exige DPEM, vistoria, CSN ou nota fiscal autônoma. O BDMOTO
  contém campos de nota fiscal/venda, mas isso não amplia o rol de documentos.
- Taxa do serviço no gov.br: **R$ 36,00** (página modificada em 15/12/2025);
  confirmar código/valor na tabela vigente. O sistema não cobra nem paga a GRU.
- O sistema **não protocola** o processo e não promete aprovação da Marinha.

## Formulários e situação do vínculo

| Formulário | Anexo | ID lógico | Obrigação no piloto | `FormVersion` | `ServiceForm` |
| --- | --- | --- | --- | --- | --- |
| Requerimento para inscrição ou transferência de propriedade e/ou jurisdição de MA ou do seu proprietário | 2-A | `requerimento-ma` | Obrigatório | `requerimento-ma-v1`, `VERIFIED`/`STATIC` | Nenhum; só após mapeamento aprovado |
| Boletim de Dados de Moto Aquática (BDMOTO) | 2-B | `bdmoto` | Obrigatório, duas vias | `bdmoto-v1`, `VERIFIED`/`STATIC` | Nenhum; só após mapeamento aprovado |
| Autorização de Transferência de Propriedade | 2-D | `autorizacao-transferencia-ma` | Condicional: quando o TIE não trouxer autorização equivalente; assinatura/reconhecimento pelo usuário | `autorizacao-transferencia-ma-v1`, `VERIFIED`/`STATIC` (extrato da NORMAM) | Nenhum; só após mapeamento aprovado |
| Comunicação de Transferência de Propriedade de MA | 2-E | `comunicacao-transferencia-ma` | Opcional (vendedor) | `comunicacao-transferencia-ma-v1`, `VERIFIED`/`STATIC` (extrato da NORMAM) | Nenhum; só após mapeamento aprovado |
| Declaração de Perda, Roubo ou Extravio de TIE | 2-C | `declaracao-perda-tie-ma` | Condicional: TIE extraviado | `declaracao-perda-tie-ma-v1`, `VERIFIED`/`STATIC` | Nenhum; só após mapeamento aprovado |
| Declaração de Residência | 1-C | `declaracao-residencia-ma` | Condicional: alternativa ao comprovante | `declaracao-residencia-ma-v1`, `VERIFIED`/`STATIC` | Nenhum; só após mapeamento aprovado |

O **anexo 3-D é da CHA de Motonauta**, não do TIE. A citação ao 3-D no 2.4.1(a)
está registrada como divergência no catálogo; não usar o 3-D para transferência.
Também não usar formulários antigos da NORMAM-34/DPC que tenham numeração
diferente. O candidato standalone da CPRS para o 2-E foi descartado porque seu
título interno é **ANEXO 2-F**; o 2-E usado foi extraído da NORMAM-212/DPC 2026,
página 84.

## Perguntas condicionais previstas

As opções são enumeradas; nenhuma condição arbitrária do cliente será executada.
A descrição completa, com os efeitos e as pendências, está em
[`FORM_CATALOG.md`](FORM_CATALOG.md).

| Pergunta | Opções | Efeito principal |
| --- | --- | --- |
| `tieSituation` | `digital_com_qr`, `antigo_sem_validade`, `antigo_com_validade`, `extraviado` | Define uso do 2-D; `extraviado` aciona 2-C e possível renovação do TIE |
| `authorizationStatus` | `assinada_reconhecida`, `pendente` | `pendente` gera minuta do 2-D e bloqueia a alegação de pacote protocolável |
| `sellerCommunication` | `sim`, `nao` | Inclui o 2-E opcional |
| `residenceProof` | `conta_consumo`, `declaracao_1c` | Inclui o 1-C quando não há comprovante |
| `representative` | `nao`, `sim` | Exige procuração e identificação do outorgado |
| `coOwner` | `nao`, `sim` | Exige assinatura/reconhecimento do co-proprietário no 2-D |
| `buyerType` | `pessoa_fisica`, `pessoa_juridica` | Seleciona CPF/CNPJ e documento de identificação |
| `jurisdictionChange` | `nao`, `sim` | `sim` está fora do piloto; orientar serviço separado |

## Documentação do procedimento oficial (referência normativa)

A relação abaixo descreve peças que podem integrar o procedimento de
transferência perante a autoridade competente. **Não equivale à lista de
uploads do aplicativo**, cuja função é apenas extrair informações e preencher
formulários — não reunir nem protocolar o dossiê oficial.

- TIE atual (digital com QR Code impresso ou modelo antigo);
- autorização de transferência assinada e reconhecida (2-D ou campo equivalente
  do TIE, conforme o caso);
- documento oficial de identificação com foto e CPF/CNPJ;
- comprovante de residência ou 1-C, quando aplicável;
- duas fotografias coloridas da MA (popa e través), em mídia;
- comprovante de pagamento da GRU;
- dados da nota fiscal/venda para preencher o BDMOTO;
- procuração e identificação do outorgado, quando aplicável;
- assinatura do co-proprietário, quando houver.

**Uploads no preenchimento automático:** o catálogo só deve solicitar
documentos que ajudem a identificar/corroborar campos do formulário. As fotos
coloridas de popa e través foram removidas do upload obrigatório e da
interface do aplicativo porque não alimentam o OCR nem o PDF. A eventual
exigência dessas fotos **no procedimento oficial** permanece sujeita à norma
vigente e à Capitania competente; sua ausência no aplicativo não significa
dispensa na etapa de protocolo.

**Não incluir por padrão:** DPEM, vistoria, CSN, contrato social/estatuto ou
nota fiscal como documento autônomo. Se a CP/DL/AG escolhida exigir algo
adicional, registrar a exigência local com referência e tratá-la como
condicional.

## Fora do escopo do piloto

- Inscrição inicial, renovação de TIE e emissão de segunda via.
- Transferência de jurisdição; se o usuário também precisar, será um serviço
  separado ou uma ampliação aprovada.
- Aluguel de MA, habilitação de motonauta e formulários de outras NORMAM.
- Protocolo na Marinha, pagamento da GRU, reconhecimento de firma e atendimento
  presencial.
- Geração de PDF antes de o modelo oficial ser verificado e mapeado.

## Gate da Fase 02 — concluído

O **portão humano dos PDFs** foi confirmado pelo usuário em 26/10/2026. Os seis
arquivos oficiais foram baixados e verificados; o serviço continua `DRAFT`. O
agente deve:

1. ~~inspecionar bytes, assinatura `%PDF`, páginas, dimensões, metadados e tipo~~
   — concluído em 26/10/2026;
2. ~~registrar `FormVersion` com URL, data, SHA-256, revisão oficial e caminho~~
   — concluído no catálogo em código;
3. manter `FormMapping` separado e só aprovar após renderização com dados
   fictícios e revisão visual humana — pendente para a Fase 04;
4. criar `ServiceForm` apenas para versões verificadas e mapeamentos aprovados
   — pendente;
5. manter o serviço `DRAFT` até todos os requisitos estarem completos — mantido.

**Pendência do portão:** nenhuma. A Fase 02 foi encerrada em 26/10/2026 após o
usuário confirmar os PDFs, as fontes, os extratos 2-D/2-E e o descarte do 2-E
antigo (2-F). A Fase 03 só começa com nova autorização; a Fase 04 é a
responsável pelo mapeamento visual.

## Evolução

Ao adicionar serviço novo, primeiro consultar o catálogo e reutilizar versões
existentes onde válidas. Pedir ao usuário somente os modelos ausentes ou
atualizados; não repetir o trabalho de mapeamento por serviço. Os formulários
2-A e 2-B são candidatos naturais a reutilização por outros serviços de MA.
