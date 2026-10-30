# QA técnica — NORMAM-212/DPC 2026

**Data:** 29/10/2026  
**Escopo:** Anexos 1-C, 2-A, 2-B, 2-C, 2-D e 2-E usados pelos serviços de moto aquática.

## Evidência normativa

A matriz foi confrontada com a NORMAM-212/DPC aprovada pela Portaria DPC/DGN/MB nº 201/2026 e com páginas operacionais atuais da Marinha. Foram confirmados:

- inscrição: Requerimento 2-A + BDMOTO 2-B;
- transferência de propriedade/jurisdição: Requerimento 2-A e BDMOTO 2-B, com 2-D quando há transferência de propriedade;
- renovação: BDMOTO somente quando houver alteração das características da moto aquática;
- perda/roubo/extravio: Declaração 2-C;
- comunicação de venda: Comunicação 2-E acompanhada da autorização de transferência 2-D;
- declaração de residência: Anexo 1-C;
- qualquer alteração de característica da moto aquática exige Responsável Técnico e ART.

## QA visual dos mappings

Foi utilizado o artefato `pdf-mapping-review-synthetic` do workflow CI 40875801960.
O job `pdf-mapping-visual` concluiu com sucesso. Os PDFs sintéticos e todas as páginas
renderizadas foram inspecionados visualmente.

Mappings revisados:

- `requerimento-ma-v1-map-v1`;
- `bdmoto-v1-map-v1` (2 páginas);
- `autorizacao-transferencia-ma-v1-map-v1` (2 páginas);
- `comunicacao-transferencia-ma-v1-map-v1`;
- `declaracao-perda-tie-ma-v1-map-v1`;
- `declaracao-residencia-ma-v1-map-v1`.

Não foram observados textos sobrepostos, valores fora dos campos ou marcações em áreas
incorretas nas amostras geradas. Os seis mappings foram promovidos para `APPROVED`.

## Decisões de fluxo

- Moto aquática passa a usar os mesmos cards de serviços já existentes, escolhida por
  `vesselType=moto_aquatica`.
- As relações NORMAM-212 usam uma faixa de `order` distinta das relações de barco para
  preservar a unicidade exigida pelo catálogo; as condições por `vesselType` continuam
  selecionando apenas o conjunto correto.
- Em renovação/renovação por perda, a pergunta de BDMOTO foi separada da pergunta de
  alteração de dados de barco: para MA, o BDMOTO só aparece se houve alteração de
  características.
- Nos serviços de alteração de MA, a interface informa a necessidade de Responsável Técnico
  e ART nos casos previstos no item 2.7.

## Limites

A aplicação prepara formulários. Fotografias, GRU, DPEM, reconhecimento de firma,
assinaturas, ART e demais itens de protocolo não são automaticamente validados pela
ferramenta e continuam sob conferência da CP/DL/AG.
