# QA técnica - NORMAM-211 amadores (Anexos 5-D e 5-H)

**Data:** 29/10/2026  
**Fonte:** NORMAM-211/DPC fornecida ao projeto.

## Estrutura verificada localmente

| Anexo | Páginas | Tamanho | AcroForm | SHA-256 local |
| --- | ---: | --- | --- | --- |
| 5-D | 1 | A4 595x842 pt | não | `8A1A941EE655B68D0839B2ABA187CCA70B41D6D9D1AD32E2415F820E71081F0F` |
| 5-H | 2 | A4 595x842 pt | não | `26B8041A137D2613D6BB184DAF72E63DC2C67A7DB944D44D14E1E884DC8AF503` |

Ambos estão sem criptografia, sem anexos e sem anotações. A inspeção estrutural foi feita
com `pdf_inspect.py` e a revisão visual com renderização a 180 dpi.

## 5-D - Declaração de extravio/furto/roubo/dano da CHA

Mapeados:

- nome, identidade, órgão expedidor e data de expedição;
- CPF e endereço;
- telefone;
- número, data de emissão e categoria da CHA;
- opções Extraviada, Roubada, Furtada e Danificada;
- data da declaração.

O motivo é obtido da resposta validada `chaSituation` por `answerBindings`, sem confiar
em valor arbitrário vindo do navegador.

## 5-H - Requerimento

Mapeados:

- nome, CPF, identidade e órgão expedidor;
- endereço e contatos;
- opção 2 - Emissão/Renovação;
- descrição do pedido;
- local, data e CPF na página 2.

Assinatura permanece manual.

## Estado de homologação

Os mappings estão em `DRAFT`. A geometria foi conferida com amostras sintéticas locais,
mas os PDFs 5-D/5-H ainda não estão versionados em
`backend/templates/<form>/v1/original.pdf`. Portanto as FormVersion continuam
`IDENTIFIED` e não podem ser promovidas para `VERIFIED` ou usadas em produção.

A promoção exige:

1. bytes exatos versionados no repositório;
2. SHA-256 do arquivo versionado igual ao registrado;
3. geração pelo motor real do projeto;
4. renderização da saída sintética pelo CI;
5. revisão visual final;
6. testes/typecheck/build.
