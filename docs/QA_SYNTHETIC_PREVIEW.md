# Prévia local do serviço real — transferência de moto aquática

**Apenas QA local, nunca para documentos pessoais reais ou protocolo oficial.**

## Escopo dos uploads

O aplicativo prepara **formulários preenchidos**; não constitui um portal de
protocolo nem uma coleta completa do dossiê oficial. Por isso, as fotografias
da popa e do través da embarcação não constam mais nos uploads, nem são
requisitos bloqueantes de avanço. O backend rejeita esses identificadores
como requisitos inválidos, inclusive se forem enviados por API.

Isso **não é uma declaração de dispensa** dessas fotografias quando a pessoa
for realizar a transferência perante a autoridade competente. O rol
documental oficial continua descrito separadamente na matriz normativa e
exige conferência da Capitania aplicável.

## Por que não existe mais um segundo serviço fictício?

O modo `DEV_QA_PREVIEW=true` usa o próprio identificador unificado
`transferencia-propriedade-embarcacao`. O usuário escolhe **Moto aquática**
ou **Embarcação** na primeira etapa e o catálogo seleciona as relações de
formulário correspondentes. Não existe um segundo card nem um serviço paralelo
só para moto aquática, e o QA não duplica mapeamentos ou campos.

A camada de desenvolvimento adapta os status `DRAFT` *somente em memória*
para permitir gerar prévias, preservando o catálogo original sem aprovação.
A aplicação continua obrigatoriamente com `DRAFT` em produção. A flag só é
aceita em `NODE_ENV=development`, as prévias têm marca d'água em **todas as
páginas**, e nenhum crédito é debitado. A validação normativa e visual humana
continua obrigatória antes de tornar o serviço oficial disponível.

## Preparação

1. Fazer `git status --short` e preservar alterações locais, depois
   `git pull --ff-only` na `main`.
2. No `.env` local, definir `DEV_QA_PREVIEW=true`, com senha forte de
   PostgreSQL. Não enviar o `.env` ao GitHub.
3. Executar `docker compose up -d --build` e abrir
   `http://127.0.0.1:8080` no próprio computador.
4. Entrar com conta sintética e selecionar **Transferência de propriedade**.
   Esse é o único card do serviço para barco ou moto aquática.
5. Em **Tipo de embarcação**, escolher **Moto aquática** para testar a rota
   NORMAM-212. Ao escolher **Embarcação**, a interface também solicita o
   comprimento quando ele for necessário para decidir entre BSADE e BADE.
6. **Escolher quantos arquivos enviar (inclusive nenhum).** Todos os
   uploads são opcionais: pode anexar somente um RG fictício, anexar outros
   documentos fictícios ou clicar **Continuar sem anexos — preencher
   manualmente**. Nenhuma foto da embarcação é necessária. O backend permite
   continuar sem qualquer upload. Os dados exigidos pelo formulário serão
   informados na próxima etapa.
7. Revisar e completar todos os campos visíveis, inclusive **cidade, bairro
   e CEP separadamente**. Com arquivos, o OCR fornece apenas sugestões
   reconhecidas e indica quando não encontrou um campo. Sem arquivos, todos
   os campos são preenchidos manualmente. Os obrigatórios e valores inválidos
   continuam sendo verificados antes da geração.
8. Gerar as prévias, baixar cada PDF e conferir campo por campo, posição,
   acentos, texto cortado, assinaturas vazias e marca AMOSTRA em todas as
   páginas. Na transferência de **Moto aquática**, o pacote atual inclui
   Requerimento 2-A, BDMOTO 2-B, Autorização 2-D e Declaração de Residência
   1-C. A Comunicação de Venda 2-E permanece em seu serviço próprio.
9. Desligar `DEV_QA_PREVIEW` após os testes e reconstruir os containers.

## Cenários de regressão prioritários

- **Sem anexos:** escolher o tipo de embarcação, prosseguir diretamente à
  revisão, preencher manualmente os campos obrigatórios e gerar o pacote
  correspondente em AMOSTRA.
- **Somente RG fictício:** anexar apenas o documento do comprador, verificar
  sugestões de nome/CPF quando reconhecidas, completar os dados do vendedor,
  moto aquática e endereço manualmente; não devem ser pedidos outros uploads.
- **Arquivos parciais sem texto reconhecido:** a revisão continua disponível,
  com diagnóstico do OCR e campos editáveis, sem inventar informações.
- **Permissões:** usuários diferentes não acessam os jobs alheios; o modo QA
  não debita créditos. Os formulários oficiais seguem bloqueados em produção.

A análise automática de fotos reais ainda não foi validada com os documentos
que apresentaram falha durante o teste do usuário. Fotos e PDFs **sintéticos**
com o mesmo formato visual são necessários para diagnosticar a qualidade do
OCR sem utilizar dados pessoais.

## OCR e endereço

No BDMOTO há campos distintos **Endereço, Cidade, Bairro e CEP**. A fonte
oficial apresenta estas quatro áreas; portanto **não remova Endereço do
mapeamento apenas porque o OCR ainda não sabe separá-lo**. Agora o comprovante
pode sugerir `person.address`, `person.city`,
`person.neighborhood`, `person.postalCode`, `person.state`,
`person.streetNumber` e `person.apartment`, quando cada informação está
explicitamente rotulada. A regra evita deduzir cidade/bairro de uma linha de
endereço sem estrutura. Todos os valores continuam sujeitos a revisão.

Os campos de data no assistente possuem máscara `DD/MM/AAAA`: as barras
aparecem durante a digitação. Datas impossíveis permanecem rejeitadas pela API.

## Limitações e próxima revisão

Este fluxo utiliza o serviço e os mapeamentos reais, mas o status de QA é um
**desbloqueio técnico temporário**, não homologação. As regras condicionais de
transferência ainda precisam ser confrontadas com a norma vigente, e as seis
versões PDF precisam de revisão humana de todas as páginas, incluindo o
alinhamento de Endereço/Cidade/Bairro/CEP no BDMOTO.

O processamento OCR ainda não reconhece com confiança todo layout de RG,
CNH, TIE ou comprovante. Sem exemplos controlados de layout e qualidade de
imagem, **não é possível prometer extração de todos os campos**: dados que não
estão no documento ou não possuem rótulos verificáveis não devem ser
inventados. Testes devem usar somente imagens/PDFs sintéticos.

Amostras sintéticas para o OCR:

```text
DOCUMENTO FICTICIO DO COMPRADOR
NOME: MARIA DE SOUZA
CPF: 123.456.789-09

TITULO FICTICIO DE MOTO AQUATICA
NOME DA EMBARCACAO: MAR TESTE
INSCRICAO: RJ123456
HIN: BR-TESTE-123456

COMPROVANTE FICTICIO DE ENDERECO
ENDERECO: RUA DAS FLORES
NUMERO: 120
COMPLEMENTO: APTO 302
CIDADE: NITEROI
BAIRRO: ICARAI
CEP: 24230-100
UF: RJ
```

Leia também `PROJECT_TRACKER.md` e `docs/PENDENCIAS_PARA_2026-10-27.md`.
