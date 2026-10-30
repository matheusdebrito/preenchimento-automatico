# QA técnica — NORMAM-212/DPC 2026

**Data:** 29/10/2026  
**Escopo:** Anexos 1-C, 2-A, 2-B, 2-C, 2-D e 2-E usados pelos serviços de moto aquática.

## Evidência normativa

A matriz foi confrontada com a NORMAM-212/DPC aprovada pela Portaria DPC/DGN/MB nº 201/2026,
com o texto oficial fornecido para a homologação e com páginas operacionais atuais da Marinha.
Foram confirmados:

- inscrição: Requerimento 2-A + BDMOTO 2-B;
- transferência de propriedade/jurisdição: Requerimento 2-A e BDMOTO 2-B, com 2-D quando há transferência de propriedade;
- renovação: BDMOTO somente quando houver alteração das características da moto aquática;
- 2ª via/renovação por perda, roubo ou extravio: Requerimento 2-A com o motivo correspondente;
- perda/roubo/extravio: declaração oficial de perda do TIE;
- alteração cadastral: 2-A identifica se a alteração é da moto aquática, do proprietário ou de ambos; o BDMOTO usa a natureza “Atualização de dados”;
- comunicação de venda: Comunicação 2-E acompanhada da autorização de transferência 2-D;
- declaração de residência: Anexo 1-C;
- qualquer alteração de característica da moto aquática exige Responsável Técnico e ART no protocolo.

A NORMAM-212/DPC 2026 contém referência textual inconsistente a “anexo 3-D” no item de
perda/extravio do TIE, enquanto o índice e o formulário oficial publicado identificam a
declaração de perda do TIE de moto aquática como Anexo 2-C. O catálogo usa o formulário
efetivamente publicado como 2-C e não altera a numeração do documento.

## QA visual dos mappings

Foi utilizado o artefato `pdf-mapping-review-synthetic` do workflow CI 40875801960.
O job `pdf-mapping-visual` concluiu com sucesso. Os PDFs sintéticos e todas as páginas
renderizadas foram inspecionados visualmente.

Mappings revisados:

- `requerimento-ma-v1-map-v1` — revisão v2;
- `bdmoto-v1-map-v1` — revisão v2, duas páginas;
- `autorizacao-transferencia-ma-v1-map-v1` — duas páginas;
- `comunicacao-transferencia-ma-v1-map-v1`;
- `declaracao-perda-tie-ma-v1-map-v1`;
- `declaracao-residencia-ma-v1-map-v1`.

Após a primeira revisão visual, o Anexo 2-A e o BDMOTO foram novamente confrontados com
a matriz completa de serviços, não apenas com transferência de propriedade. Foram
adicionadas e verificadas visualmente as marcações semânticas para:

- Inscrição;
- Transferência de propriedade;
- Transferência de jurisdição;
- Transferência conjunta de propriedade e jurisdição;
- Renovação;
- “sim/não” para alteração de características na renovação;
- 2ª via e respectivos motivos perda/roubo/extravio;
- alteração de dados da moto aquática, do proprietário ou de ambos;
- naturezas do BDMOTO: Inscrição, Transferência de proprietário, Transferência de
  jurisdição e Atualização de dados.

As posições foram confrontadas sobre render oficial 850x1200. Não foram observadas
marcações fora das caixas ou sobreposição material.

O número de inscrição deixou de ser campo obrigatório no Requerimento 2-A e no BDMOTO,
porque ele ainda não existe durante a inscrição inicial. O campo continua disponível para
todos os serviços posteriores.

Os seis mappings permanecem `APPROVED`.

## Decisões de fluxo

- Moto aquática usa os mesmos cards dos serviços de embarcação, escolhida por
  `vesselType=moto_aquatica`.
- As relações NORMAM-212 usam uma faixa de `order` distinta das relações de barco para
  preservar a unicidade exigida pelo catálogo; as condições por `vesselType` selecionam
  apenas o conjunto correto.
- Em renovação/renovação por perda, o BDMOTO só entra quando houve alteração de
  características.
- A 2ª via pergunta explicitamente perda, roubo ou extravio para marcar o motivo no 2-A.
- Alteração cadastral pergunta se os dados são da moto aquática, do proprietário ou de ambos.
- Alterações de características continuam informando a obrigação normativa de Responsável
  Técnico e ART, sem transformar ART/GRU/fotos em uploads de OCR quando não fornecem dados
  para o preenchimento automático.

## Limites

A aplicação prepara formulários. Fotografias, GRU, DPEM, reconhecimento de firma,
assinaturas, ART e demais itens de protocolo não são automaticamente validados pela
ferramenta e continuam sob conferência da CP/DL/AG.
