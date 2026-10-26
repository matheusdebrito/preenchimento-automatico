# Catálogo de formulários oficiais (independente de serviços)

**Estado:** pesquisa normativa da Fase 01 concluída em 26/10/2026. Nenhum PDF
oficial foi obtido, armazenado ou homologado no repositório; nenhuma
`FormVersion` ou `FormMapping` foi criada. O serviço piloto permanece `DRAFT`.

O cadastro dos formulários é independente de transferência, renovação, inscrição
ou qualquer outro serviço. Os IDs e nomes abaixo são candidatos de identidade
lógica; não são prova de que o PDF correspondente já esteja disponível.

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
formulários das NORMAM-201/202/211. A NORMAM-212 é a norma específica para MA.

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

## 3. Formulários candidatos

| Anexo | Nome oficial | ID lógico proposto | Uso no serviço | Obrigação | PDF no repositório |
| --- | --- | --- | --- | --- | --- |
| 2-A | Requerimento para inscrição ou transferência de propriedade e/ou jurisdição de moto aquática ou do seu proprietário | `requerimento-ma` | Requerimento do adquirente | Obrigatório | Não obtido |
| 2-B | Boletim de Dados de Moto Aquática (BDMOTO) | `bdmoto` | Dados da MA, do requerente e da venda; emitido em duas vias | Obrigatório | Não obtido |
| 2-D | Autorização de Transferência de Propriedade | `autorizacao-transferencia-ma` | Autorização do proprietário/co-proprietário, com firmas reconhecidas | Condicional: exigido quando o TIE digital/antigo sem validade não trouxer autorização equivalente; assinatura/reconhecimento pelo usuário | Não obtido |
| 2-E | Comunicação de Transferência de Propriedade de Moto Aquática | `comunicacao-transferencia-ma` | Comunicação do vendedor para reduzir risco de multa | Opcional | Não obtido |
| 2-C | Declaração de Perda, Roubo ou Extravio de Título de Inscrição de Embarcação | `declaracao-perda-tie-ma` | Alternativa quando o TIE foi extraviado | Condicional | Não obtido |
| 1-C | Declaração de Residência | `declaracao-residencia-ma` | Alternativa quando não há comprovante de residência | Condicional | Não obtido |

**IDs independentes de serviço:** `requerimento-ma` e `bdmoto` são formulários
de uso mais amplo e não devem ser renomeados ou duplicados por serviço. Os demais
IDs representam a identidade do formulário, não uma pasta de serviço.

**Excluído:** o **anexo 3-D** trata de extravio/furto/roubo/dano da **CHA de
Motonauta**, não do TIE. Não usar o 3-D como declaração de perda do TIE.

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
   com outra numeração (por exemplo, 2-E como autorização e 2-F como
   comunicação). **Não usar** arquivos antigos; conferir sempre contra a edição
   2026 da NORMAM-212.
6. O 2-D traz prazo de 15 dias para embarcações registradas e 60 dias para
   inscritas. A MA do piloto é inscrita em CP/DL/AG; aplicar 60 dias, sem
   inventar registro no Tribunal Marítimo.

## 7. Checklist de downloads para a Fase 02

**Não baixar antecipadamente todos os modelos.** A Fase 02 é o portão humano:
o usuário confirma os arquivos e o agente só então verifica bytes, páginas,
hash, versão e campos. Nenhum PDF desta lista está no repositório.

Legenda: **P0** = necessário ao fluxo principal; **P1** = condicional/opcional;
**P2** = alternativa de residência.

| Prioridade | Formulário / ID | Anexo | Fonte oficial de referência | Destino sugerido | Condição |
| --- | --- | --- | --- | --- | --- |
| P0 | `requerimento-ma` | 2-A | [PDF 2026 da CPPE](<https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-212(REQUERIMENTO%20EMBARCA%C3%87%C3%83O).pdf>) | `backend/templates/requerimento-ma/v1/original.pdf` | Obrigatório |
| P0 | `bdmoto` | 2-B | [PDF 2026 da CPPE](<https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-212(BDMOTO).pdf>) | `backend/templates/bdmoto/v1/original.pdf` | Obrigatório |
| P0 | `autorizacao-transferencia-ma` | 2-D | NORMAM-212/DPC 2026, página 2-D-1 (PDF oficial acima); não foi localizado PDF standalone atual inequívoco | `backend/templates/autorizacao-transferencia-ma/v1/original.pdf` | P0 quando o TIE não trouxer autorização equivalente; PDF standalone a confirmar |
| P1 | `comunicacao-transferencia-ma` | 2-E | NORMAM-212/DPC 2026, página 2-E-1; candidato oficial da CPRS: [PDF](https://assets.marinha.mil.br/cprs/sites/www.marinha.mil.br.cprs/files/COMUNICACAO%20DE%20TRANSFERENCIA%20DE%20PROPRIEDADE%20-%20NORMAM-212.pdf) | `backend/templates/comunicacao-transferencia-ma/v1/original.pdf` | Opcional (vendedor) |
| P1 | `declaracao-perda-tie-ma` | 2-C | [PDF 2026 da DelGuaira](https://assets.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/Declara%C3%A7%C3%A3o%20de%20extarvio%20MA%20Anexo-2C.pdf) | `backend/templates/declaracao-perda-tie-ma/v1/original.pdf` | Condicional: TIE extraviado; confirmar divergência 3-D |
| P2 | `declaracao-residencia-ma` | 1-C | [PDF 2026 da CPPE](<https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-212(DECLARA%C3%87%C3%83O%20DE%20RESIDENCIA).pdf>) | `backend/templates/declaracao-residencia-ma/v1/original.pdf` | Alternativa ao comprovante de residência |

**Não solicitar:** anexo 3-D (CHA), formulários antigos da NORMAM-34/DPC, DPEM,
vistoria/CSN e modelos de outros serviços. Se o usuário não tiver o PDF
standalone do 2-D, a Fase 02 deve confirmar com a CP/DL/AG ou usar o PDF oficial
completo da NORMAM-212 como fonte, **sem recortar, redesenhar ou substituir** o
conteúdo oficial.

## 8. O que ainda não foi criado

- Nenhuma `FormVersion`: sem PDF não há hash, páginas, tipo (`ACROFORM`,
  `STATIC` ou `UNKNOWN`) nem status `VERIFIED`.
- Nenhum `FormMapping`: sem PDF e sem renderização com dados sintéticos não há
  coordenadas, campos AcroForm, relatório ou revisão visual.
- Nenhum `ServiceForm`: o serviço não é associado a versões ainda; o catálogo
  em código permanece conservador, com `forms`, `versions`, `mappings` e
  `serviceForms` vazios.
- Nenhuma alteração de status para `AVAILABLE`; o piloto continua `DRAFT`.

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
