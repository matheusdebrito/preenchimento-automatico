# QA técnica - NORMAM-211 amadores (Anexos 5-D e 5-H)

**Data:** 29/10/2026  
**Fonte:** NORMAM-211/DPC fornecida ao projeto.

## Estrutura verificada localmente

| Anexo | Páginas | Tamanho | AcroForm | SHA-256 local |
| --- | ---: | --- | --- | --- |
| 5-D | 1 | A4 595x842 pt | não | `53DD1F6576B3B9C6C4D1B056B18F4333DBCC24C3DE8FB18047B32B6AEBE9850E` |
| 5-H | 2 | A4 595x842 pt | não | `06E753608DE9B2C8D29B4380EB2EFF7D81B9E5376B4AE2011AFD5F2AEAAC78BF` |

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

Os mappings 5-D e 5-H estão `APPROVED` após QA visual sintético, verificação dos
blobs versionados e revisão dos usos publicados. Os PDFs estão versionados em
`backend/templates/<form>/v1/original.pdf` e suas `FormVersion` permanecem
`VERIFIED`.

Os serviços de renovação, emissão de Veleiro, equivalência profissional, renovação com
agregação de MTA e inscrição em exame estão publicados quando usam somente relações
homologadas. A inscrição em exame usa o 5-H por evidência operacional oficial de CP/DL/AG,
sem inventar um formulário alternativo.

A promoção exige:

1. bytes exatos versionados no repositório;
2. SHA-256 do arquivo versionado igual ao registrado;
3. geração pelo motor real do projeto;
4. renderização da saída sintética pelo CI;
5. revisão visual final;
6. testes/typecheck/build.


## Uso do 5-H na inscrição para exame

A NORMAM-211, no item 5.4.1, não cita nominalmente o Anexo 5-H. A liberação do
serviço de inscrição se apoia também em orientação operacional oficial da Marinha:
a página da DPC "Para quem quer se tornar um Navegador Amador" oferece o
Requerimento de Inscrição para o Exame, e a lista operacional do COM8DN identifica
o requerimento de inscrição como Anexo 5-H da NORMAM-211.

O Anexo 5-H vigente **não possui uma caixa específica “Inscrição para exame”**. Por
isso, o serviço não marca automaticamente a opção 2 “Emissão/Renovação” por inferência.
A aplicação escreve no campo **Descrição do pedido** exatamente “Inscrição para exame de
Arrais-Amador”, “Mestre-Amador” ou “Capitão-Amador”, conforme a categoria escolhida.

Essa decisão preserva simultaneamente as duas evidências disponíveis: a orientação
operacional oficial exige o 5-H para a inscrição, enquanto o próprio PDF não oferece uma
opção impressa equivalente ao nome do serviço.


## Revisão v2 do 5-H - expansão de serviços de amadores

Em 29/10/2026 o mapping do 5-H foi ampliado sem alterar o PDF versionado. Foram
adicionadas e revisadas visualmente as marcações das opções 1, 3 e 12, preservando a
opção 2 já homologada:

- 1: concessão por correspondência/equivalência profissional;
- 2: emissão/renovação;
- 3: renovação de ARA/MSA/CPA com agregação de MTA;
- 12: pedido de revisão de prova de Capitão-Amador.

As amostras sintéticas locais confirmaram o X dentro dos respectivos quadrículos. A
revisão do mapping passou para v2 e permanece APPROVED.
