# Serviços de embarcações - NORMAM-211/DPC 2026

## Estado atual após auditoria — 30/10/2026

Este documento conserva registros históricos de homologação anteriores. **O estado operacional
atual é definido pelo catálogo `backend/src/modules/catalog/vessel-services.ts`**, não por
afirmações antigas de `DRAFT` ou bloqueio de opções abaixo.

- Seis serviços de embarcação publicados, com seleção barco/moto aquática.
- BSADE (até 6 m), BADE (maior que 6 m até 24 m) e BDMOTO conforme tipo/serviço.
- Renovação do TIE/TIEM de barco pergunta comprimento mesmo sem alteração para não omitir BADE/BSADE.
- Segunda via solicita o formato do título: TIE digital é reimprimível e não segue o processo de segunda via.
- Pergunta de conversão de remo para motor removida porque não controlava nenhum campo ou documento.
  Exigências técnicas continuam sujeitas à conferência na NORMAM/CP/DL/AG.
- As únicas entradas da OpenAI são identidade (RG/CNH/CIN), comprovante de residência,
  CHA, CIR e TIE/TIEM. Para embarcações, os uploads relevantes são identidade, residência
  e TIE/TIEM; nota fiscal e documento de motor não são solicitados.
- O catálogo associa o serviço aos formulários/anexos oficiais de saída; não publica
  checklists de documentos comprobatórios para protocolo.

## Estado histórico (28–29/10/2026)

Esta expansão foi catalogada em 28/10/2026 com base na NORMAM-211/DPC vigente
(Portaria DPC/DGN/MB nº 200, de 27/02/2026) e em modelos publicados em páginas
oficiais da Marinha em 2026.

**Revisão normativa em 29/10/2026:** a NORMAM-211 completa fornecida pelo
responsável pelo produto revelou que o PDF anteriormente catalogado como 3-C
estava semanticamente incorreto. O Anexo 3-C vigente é o **Termo de
Responsabilidade de Construção/Alteração**. Por isso sua versão/mapeamento foram
rebaixados para `IDENTIFIED/DRAFT` até novo remapeamento e revisão visual.

Os outros sete mapas NORMAM-211 permanecem `APPROVED`. Sete serviços continuam
`AVAILABLE` para embarcação/barco, mas com a composição corrigida: o 3-C não
integra transferências padrão. Alterações de dados/características e de motor passam a usar um único fluxo; os demais casos continuam
`DRAFT`, e a inscrição de médio porte permanece bloqueada até modelar corretamente
a condição de uso do 3-C.

Auditoria normativa:
[NORMAM_SOURCE_AUDIT_2026-10-29.md](NORMAM_SOURCE_AUDIT_2026-10-29.md).

A primeira expansão cobre embarcações de esporte e recreio de até 24 m.
Embarcações maiores e casos sujeitos a registro no Tribunal Marítimo exigem
pesquisa e composição próprias.

## Serviços catalogados

| ID | Serviço | Estado |
| --- | --- | --- |
| `inscricao-embarcacao` | Inscrição inicial de embarcação | AVAILABLE até 12 m; >12 m bloqueado |
| `transferencia-propriedade-embarcacao` | Transferência de propriedade e/ou jurisdição | AVAILABLE |
| `renovacao-tie-embarcacao` | Renovação do TIE/TIEM | AVAILABLE |
| `segunda-via-tie-embarcacao` | Renovação do TIE/TIEM por perda, roubo ou extravio (ID legado) | AVAILABLE |
| `alteracao-dados-embarcacao` | Alteração de dados, características ou motor | AVAILABLE |
| `comunicacao-venda-embarcacao` | Comunicação de venda | AVAILABLE |

A nomenclatura de motor segue o procedimento atual de alteração de
características; não é tratada no produto como uma operação independente de
“averbação/desaverbação” sem confirmação normativa específica.

## Formulários identificados

| ID lógico | Anexo 2026 | Modelo | Fonte oficial |
| --- | --- | --- | --- |
| `bade-er` | 2-A | BADE | <https://www.marinha.mil.br/cfpa/sites/www.marinha.mil.br.cfpa/files/2026-02/Anexo%202-A%20%28BADE%29.pdf> |
| `bsade-er` | 2-B | BSADE | <https://www.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-211%28BSADE%29.pdf> |
| `requerimento-embarcacao-er` | 2-C | Requerimento de Serviços para Regularização de Embarcações | <https://assets.marinha.mil.br/cppe/sites/www.marinha.mil.br.cppe/files/2026-03/normam-211%28REQUERIMENTO%29_0.pdf> |
| `declaracao-residencia-er` | 2-G | Declaração de Residência | <https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/upload/normam-211-2G.pdf> |
| `declaracao-perda-tie-er` | 2-H | Declaração de Perda/Extravio | <https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/Extravio%20ANEXO%202-H.pdf> |
| `comunicacao-transferencia-er` | 2-I | Comunicação de Transferência de Propriedade | <https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/anexo%202-i_0.pdf> |
| `autorizacao-transferencia-er` | 2-K | Autorização para Transferência de Propriedade | <https://www.marinha.mil.br/delguaira/sites/www.marinha.mil.br.delguaira/files/2026-03/Compra%20a%20e%20venda%20ANEXO%202-K.pdf> |
| `termo-responsabilidade-er` | 3-C | Termo de Responsabilidade de Construção/Alteração | NORMAM-211/DPC completa fornecida ao projeto |

A numeração é registrada na `FormVersion`, não no ID lógico do formulário.
Assim, uma renumeração futura da NORMAM gera nova versão sem quebrar o vínculo
semântico do serviço.

## Composição inicial

- Até 6 m (embarcação miúda): selecionar BSADE.
- Mais de 6 m e até 12 m (pequeno porte): selecionar BADE.
- Mais de 12 m e menor que 24 m (médio porte): selecionar BADE; inscrição permanece bloqueada até completar a regra do 3-C.
- Requerimento 2-C: usado pelos serviços de regularização correspondentes.
- 2-K: incluído somente quando a escolha envolve transferência de propriedade; não é incluído em transferência apenas de jurisdição.
- 2-H: quando o TIE/TIEM estiver perdido/extraviado; na segunda via é parte
  do fluxo base desta expansão.
- 2-G: quando o usuário selecionar declaração de residência.
- 3-C: Termo de Responsabilidade de Construção/Alteração. Não integra transferência padrão.
  Na alteração, aparece apenas nas situações específicas descritas na NORMAM; na inscrição
  de médio porte pode substituir a vistoria inicial quando a norma permitir.
- 2-I + 2-K: comunicação de venda, pois a NORMAM exige a comunicação acompanhada
  da autorização de transferência.

A composição é deliberadamente `DRAFT`: páginas locais podem conter
orientações operacionais adicionais e a exigência final precisa ser
reconfirmada contra a norma e a CP/DL/AG antes de cada serviço sair do rascunho.

## OCR e documentos de origem

Uploads continuam opcionais para a ferramenta de preenchimento. Todos os
requisitos cadastrados nesta expansão possuem um perfil de extração:

- identidade -> extractor de identidade;
- TIE/TIEM -> extractor estruturado TIE;
- comprovante de residência -> extractor de residência;
- documento de compra/venda -> adaptador legado atual, até sua migração;
- procuração, GRU e outros apoios -> `supporting-document`.

Fotos da embarcação podem integrar o procedimento oficial, mas não são solicitadas
pela ferramenta de preenchimento porque não alimentam OCR nem os PDFs.

`supporting-document` passa pelo OCR para leitura técnica, mas não produz
campo automaticamente sem um extractor semântico explícito. Isso atende ao
princípio “ler tudo, inventar nada”: texto reconhecido sem associação segura
fica sem sugestão e o usuário preenche/revisa manualmente.

## Gates antes de liberar cada serviço

1. baixar o PDF oficial;
2. validar assinatura, páginas, dimensões e origem;
3. registrar SHA-256 e caminho imutável em `backend/templates/<form>/<rev>/original.pdf`;
4. identificar AcroForm ou PDF estático;
5. criar `FormMapping`;
6. gerar amostras inteiramente fictícias;
7. renderizar todas as páginas e revisar visualmente;
8. marcar a versão `VERIFIED` após inspeção e o mapa `APPROVED` após evidência visual e decisão de liberação;
9. promover o mapa a `APPROVED` somente após revisão visual humana registrada;
10. executar CI e QA do fluxo completo em navegador/mobile;
11. somente então alterar o serviço de `DRAFT` para `AVAILABLE`.

O sistema não protocola, não assina, não reconhece firmas e não promete
aceitação do processo pela Marinha.


## Homologação técnica de 29/10/2026

- sete versões/mapas anteriores permanecem `VERIFIED/APPROVED`;
- o 3-C corrigido está `IDENTIFIED/DRAFT` até remapeamento;
- sete serviços: `AVAILABLE` para embarcação/barco;
- alteração de dados/características e motor: fluxo único `AVAILABLE`, com seleção do tipo de alteração no início;
- inscrição >12 m até 24 m e moto aquática: opções bloqueadas até completar os anexos aplicáveis;
- domínio de motor: permanece restrito a um único motor canônico;
- 2-K: Motor 2–4 e caixas SIM/NÃO permanecem manuais até decisão de domínio;
- 3-C corrigido: Termo de Responsabilidade de Construção/Alteração; o 3-D desta
  edição é o termo para prova de máquinas/navegação e não é o formulário que estava faltando;
- assinaturas, reconhecimento de firma, carimbos e campos reservados à autoridade
  nunca são preenchidos pelo sistema.


## Consolidação de alteração de dados e motor — 30/10/2026

Os antigos cards separados de alteração de dados e de motor foram consolidados no serviço
`alteracao-dados-embarcacao`. A pergunta inicial define se o usuário pretende alterar apenas
dados/características, apenas motor ou ambos. Para moto aquática, a seleção também distingue
dados da embarcação, dados do proprietário e combinações com motor.

A composição de saída continua normativa: BADE/BSADE/BDMOTO, requerimentos e Anexo 3-C
são selecionados conforme as respostas. A extração automática recebe somente identidade
(RG/CNH/CIN), comprovante de residência e TIE/TIEM. Nota fiscal, documento de origem/propriedade
e comprovante de motor não são solicitados como upload; seus campos, quando existentes no PDF,
são preenchidos manualmente. O antigo ID `alteracao-motor-embarcacao` deixou de ser publicado
para evitar dois processos artificiais para a mesma atualização cadastral.


## Consolidação das transferências — 30/10/2026

Os três cards anteriores foram substituídos por um único serviço **Transferência de propriedade e/ou jurisdição**. O usuário escolhe o alvo da transferência no início do fluxo. A escolha controla as marcações dos formulários de saída e quais fontes de identidade/residência são exibidas para extração. A identidade do vendedor é uma entrada permitida quando há transferência de propriedade; TIE/TIEM e comprovantes de residência também podem alimentar campos mapeados. Documento de origem/propriedade não é upload da ferramenta. O Anexo 2-K é um formulário de saída condicional, não um documento de entrada.
