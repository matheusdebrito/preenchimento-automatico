# Serviços de embarcações - NORMAM-211/DPC 2026

## Estado

Esta expansão foi catalogada em 28/10/2026 com base na NORMAM-211/DPC vigente
(Portaria DPC/DGN/MB nº 200, de 27/02/2026) e em modelos publicados em páginas
oficiais da Marinha em 2026.

**Importante:** os oito modelos abaixo estão somente como `IDENTIFIED`.
O ambiente desta sessão não conseguiu baixar os binários oficiais para o
workspace; por isso não há hash, inspeção estrutural, renderização, mapeamento
ou aprovação visual. Nenhum dos nove serviços pode ficar `AVAILABLE` antes
desses gates.

A primeira expansão cobre embarcações de esporte e recreio de até 24 m.
Embarcações maiores e casos sujeitos a registro no Tribunal Marítimo exigem
pesquisa e composição próprias.

## Serviços catalogados

| ID | Serviço | Estado |
| --- | --- | --- |
| `inscricao-embarcacao` | Inscrição inicial de embarcação | DRAFT |
| `transferencia-propriedade-embarcacao` | Transferência de propriedade | DRAFT |
| `transferencia-jurisdicao-embarcacao` | Transferência de jurisdição | DRAFT |
| `transferencia-propriedade-jurisdicao-embarcacao` | Transferência de propriedade e jurisdição | DRAFT |
| `renovacao-tie-embarcacao` | Renovação do TIE/TIEM | DRAFT |
| `segunda-via-tie-embarcacao` | 2ª via do TIE/TIEM por perda, roubo ou extravio | DRAFT |
| `alteracao-dados-embarcacao` | Alteração de dados/características | DRAFT |
| `alteracao-motor-embarcacao` | Troca, instalação ou retirada de motor | DRAFT |
| `comunicacao-venda-embarcacao` | Comunicação de venda | DRAFT |

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
| `termo-responsabilidade-er` | 3-C | Termo de Responsabilidade para Inscrição/Transferência | <https://www.marinha.mil.br/cfpa/sites/www.marinha.mil.br.cfpa/files/2026-02/ANEXO%203-C%20%28TERMO%20DE%20RESPONSABILIDADE%29.pdf> |

A numeração é registrada na `FormVersion`, não no ID lógico do formulário.
Assim, uma renumeração futura da NORMAM gera nova versão sem quebrar o vínculo
semântico do serviço.

## Composição inicial

- Até 12 m: selecionar BSADE.
- Maior que 12 m e até 24 m: selecionar BADE.
- Requerimento 2-C: usado pelos serviços de regularização correspondentes.
- 2-K: transferência de propriedade e propriedade + jurisdição.
- 2-H: quando o TIE/TIEM estiver perdido/extraviado; na segunda via é parte
  do fluxo base desta expansão.
- 2-G: quando o usuário selecionar declaração de residência.
- 3-C: composição inicial para faixa maior que 12 m e até 24 m em
  inscrição/transferência/renovação; deve ser reconferido no gate normativo
  antes de liberação.
- 2-I: comunicação de venda.

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
- procuração, GRU, fotos e outros apoios -> `supporting-document`.

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
8. marcar a versão `VERIFIED` e o mapa `APPROVED` somente com evidência;
9. executar CI e QA do fluxo completo;
10. somente então alterar o serviço de `DRAFT` para `AVAILABLE`.

O sistema não protocola, não assina, não reconhece firmas e não promete
aceitação do processo pela Marinha.
