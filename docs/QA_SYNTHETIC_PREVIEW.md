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

O modo `DEV_QA_PREVIEW=true` passa a usar o próprio identificador
`transferencia-moto-aquatica`, com **as mesmas perguntas, requisitos de upload,
regras de seleção e posições de todos os seis mapas** do catálogo oficial.
Assim, o que for corrigido ou testado no serviço de transferência se aplica ao
mesmo fluxo usado futuramente. Não há duplicação de mapeamentos ou campos só
para o QA.

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
4. Entrar com conta sintética e selecionar **Transferência de moto aquática —
   prévia local de QA**, no bloco de testes técnicos.
5. Responder **todas as perguntas reais**. Uma combinação simples para testar
   os anexos 2-A/2-B: TIE regular, autorização já consta no TIE, sem comunicação
   opcional do vendedor, comprovante de residência, sem coproprietário e sem
   representante.
6. Enviar os documentos de origem solicitados para extrair dados:
   identidade fictícia do comprador, identidade fictícia do vendedor, TIE
   fictício (se disponível) e comprovante fictício de residência (se a
   condição selecionada exigir). **Não é necessário enviar fotos da
   embarcação**, pois elas não fornecem campos para o preenchimento. Outros
   requisitos de entrada podem variar conforme as respostas.
7. Revisar todos os campos, inclusive **cidade, bairro e CEP separadamente**.
   O OCR só sugere campos encontrados de maneira inequívoca; os demais
   precisam ser preenchidos manualmente.
8. Gerar as prévias condicionais, baixar cada PDF e conferir campo por campo,
   posição, acentos, texto cortado, assinaturas vazias e marca AMOSTRA em todas
   as páginas. Os anexos 2-A/2-B são selecionados por padrão; 2-C, 2-D,
   2-E e 1-C aparecem somente se as respostas exigirem seus vínculos de QA.
9. Desligar `DEV_QA_PREVIEW` após os testes e reconstruir os containers.

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
