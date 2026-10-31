# QA técnica — NORMAM-211/DPC 2026, Anexo 3-C

**Data:** 29/10/2026

## Correção do template

A revisão visual identificou que o binário anteriormente versionado como Anexo 3-C era um
modelo antigo de **Termo de Responsabilidade para Inscrição/Transferência de Propriedade**.
Ele não correspondia ao Anexo 3-C vigente.

O template foi substituído pela página oficial do Anexo 3-C da NORMAM-211/DPC 2026:
**Termo de Responsabilidade de Construção/Alteração**.

Arquivo versionado (correção de legibilidade em 31/10/2026, PR #93):
- caminho: `backend/templates/termo-responsabilidade-er/v1/original.pdf`;
- SHA-256: `AD769898EDDC2327880292423761FC87D789428AEF279FDC1735C7200E750529`;
- fonte integral: NORMAM-211/DPC, página **210 do PDF** entregue pelo responsável do produto; SHA-256 de origem `71492859082A6786203619C859FCC99BC72C85128DC9FD27D32F93A92B09598C`;
- uma página A4 rasterizada em tons de cinza (220 DPI), mantendo exatamente o conteúdo visual da página normativa. O PDF é estático e compatível com `pdf-lib`.

**Alerta contra regressão:** o arquivo `documentos/anexos/NORMAM 211 Anx 3-C.pdf` contém **outro termo antigo de inscrição/transferência**, apesar do nome sugerir 3-C; não o usar para reconstruir o formulário. A primeira tentativa do PR #93 o utilizou por engano, descoberta e descartada na inspeção das prévias antes do merge. O template anterior também tinha uma imagem base com grande faixa preta. A inspeção visual das novas amostras do PR #93 confirma que a fonte 3-C agora tem título de **Construção/Alteração** e não apresenta a faixa preta.

## Campos homologados

O mapping atual posiciona:

- OM de inscrição;
- nome da embarcação;
- construída/alterada;
- estaleiro ou construtor;
- comprimento total;
- comprimento entre perpendiculares;
- boca moldada;
- pontal moldado;
- área de navegação;
- lotação;
- construída/alterada na declaração final;
- local e data.

Assinatura do responsável técnico e ART não são preenchidas automaticamente.

## QA visual

O formulário oficial foi preenchido com dados sintéticos usando as coordenadas do mapping
`responsibilityConstructionPlacements` e renderizado novamente. A inspeção página a página
confirmou alinhamento dos textos e marcações nos campos corretos, sem sobreposição
material. O mapping foi promovido de `TESTED` para `APPROVED`.

## Aplicação normativa

- inscrição inicial: o 3-C pode ser gerado quando o interessado informa que irá apresentá-lo;
  isso cobre construção pelo próprio interessado e a dispensa de vistoria de embarcação de
  médio porte prevista nos itens 2.5 e 3.34;
- alteração de dados/motor de barco: o 3-C permanece condicionado aos casos do item
  2.12.1 (estaleiro comprovadamente extinto ou construção artesanal);
- adaptação de embarcação miúda a remo para motor continua sujeita à declaração técnica
  prevista na NORMAM, mas a ferramenta não solicita esse documento como fonte de OCR;
- ART e responsabilidade técnica continuam sendo requisitos externos ao preenchimento
  automático.
