# QA técnica — NORMAM-211/DPC 2026, Anexo 3-C

**Data:** 29/10/2026

## Correção do template

A revisão visual identificou que o binário anteriormente versionado como Anexo 3-C era um
modelo antigo de **Termo de Responsabilidade para Inscrição/Transferência de Propriedade**.
Ele não correspondia ao Anexo 3-C vigente.

O template foi substituído pela página oficial do Anexo 3-C da NORMAM-211/DPC 2026:
**Termo de Responsabilidade de Construção/Alteração**.

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
- ART e responsabilidade técnica continuam sendo requisitos externos ao preenchimento
  automático.
