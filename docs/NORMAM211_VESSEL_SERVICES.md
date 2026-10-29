# Serviços de embarcações - NORMAM-211/DPC 2026

## Estado

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
integra transferências padrão. Alteração de dados e alteração de motor continuam
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
| `transferencia-propriedade-embarcacao` | Transferência de propriedade | AVAILABLE |
| `transferencia-jurisdicao-embarcacao` | Transferência de jurisdição | AVAILABLE |
| `transferencia-propriedade-jurisdicao-embarcacao` | Transferência de propriedade e jurisdição | AVAILABLE |
| `renovacao-tie-embarcacao` | Renovação do TIE/TIEM | AVAILABLE |
| `segunda-via-tie-embarcacao` | Renovação do TIE/TIEM por perda, roubo ou extravio (ID legado) | AVAILABLE |
| `alteracao-dados-embarcacao` | Alteração de dados/características | DRAFT |
| `alteracao-motor-embarcacao` | Troca, instalação ou retirada de motor | DRAFT |
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
- 2-K: transferência de propriedade e propriedade + jurisdição.
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
- alteração de dados e alteração de motor: `DRAFT`;
- inscrição >12 m até 24 m e moto aquática: opções bloqueadas até completar os anexos aplicáveis;
- domínio de motor: permanece restrito a um único motor canônico;
- 2-K: Motor 2–4 e caixas SIM/NÃO permanecem manuais até decisão de domínio;
- 3-C corrigido: Termo de Responsabilidade de Construção/Alteração; o 3-D desta
  edição é o termo para prova de máquinas/navegação e não é o formulário que estava faltando;
- assinaturas, reconhecimento de firma, carimbos e campos reservados à autoridade
  nunca são preenchidos pelo sistema.
