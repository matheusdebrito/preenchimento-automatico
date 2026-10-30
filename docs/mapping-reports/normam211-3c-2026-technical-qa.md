# QA técnica — NORMAM-211/DPC 2026, Anexo 3-C

**Data:** 29/10/2026

## Correção do template

A revisão visual identificou que o binário anteriormente versionado como Anexo 3-C era um
modelo antigo de **Termo de Responsabilidade para Inscrição/Transferência de Propriedade**.
Ele não correspondia ao Anexo 3-C vigente.

O template foi substituído pela página oficial do Anexo 3-C da NORMAM-211/DPC 2026:
**Termo de Responsabilidade de Construção/Alteração**.

Arquivo versionado:
- caminho: `backend/templates/termo-responsabilidade-er/v1/original.pdf`;
- SHA-256: `3937D3997C6BD49A31FFBBD7B4D19A195304FF6024D96D629079E5F327390DB3`;
- uma página A4 extraída do documento oficial e preservada como template estático.

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
