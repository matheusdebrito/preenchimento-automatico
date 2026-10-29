# Homologação técnica dos anexos NORMAM-211/DPC 2026

> **Correção normativa de 29/10/2026:** a auditoria posterior contra a NORMAM-211/DPC
> completa fornecida pelo responsável pelo produto identificou que o PDF antes tratado como
> Anexo 3-C não corresponde ao 3-C vigente desta publicação. O 3-C correto é o **Termo de
> Responsabilidade de Construção/Alteração**. A aprovação histórica descrita abaixo continua
> válida apenas para os sete outros formulários. A versão e o mapeamento do 3-C foram
> rebaixados para `IDENTIFIED/DRAFT` e as coordenadas antigas foram descartadas. Consulte
> `docs/NORMAM_SOURCE_AUDIT_2026-10-29.md`.
>
**Data técnica:** 29/10/2026  
**Escopo:** oito PDFs oficiais adicionados ao repositório para serviços de embarcações de esporte e recreio.  
**Resultado técnico histórico:** sete formulários permanecem `VERIFIED/APPROVED`; o antigo 3-C foi invalidado após a auditoria normativa.  
**Decisão de produto em 29/10/2026:** o responsável pelo produto autorizou a
liberação do escopo de um único motor com base nesta evidência. Sete desses mapas
permanecem `APPROVED`; a antiga aprovação do 3-C foi revogada. Isso não afirma que o usuário
tenha inspecionado pessoalmente cada página; a inspeção visual registrada abaixo
foi realizada pelo agente sobre os artefatos reproduzíveis do CI.

## Evidência reproduzível

A inspeção foi executada no GitHub Actions sobre os próprios bytes versionados.

- run técnico de revisão visual: `40802473189`;
- artefato de inspeção estrutural: `normam211-homologation-inspection` (`12867145494`);
- artefato de PDFs sintéticos + PNGs: `pdf-mapping-review-synthetic` (`12866343656`);
- todos os exemplos usam dados inteiramente fictícios e marca d'água
  `AMOSTRA - DADOS FICTICIOS - NAO UTILIZAR`.

O job de inspeção validou assinatura PDF, SHA-256, quantidade/dimensões/rotação de
páginas, ausência de criptografia, estrutura via qpdf, fontes e tipo de formulário.
Os oito PDFs são estáticos, sem campos AcroForm.

| FormVersion | Anexo | Páginas | SHA-256 | Estado técnico |
| --- | --- | ---: | --- | --- |
| `bade-er-2026-v1` | 2-A | 7 | `CCCA17A6C0608B995829A5A4BBDD97953343C3D924E3B74FD00CC0AE76623524` | VERIFIED / APPROVED |
| `bsade-er-2026-v1` | 2-B | 1 | `56F9301CC153FF97C5B4A72BE0C7688BC030F87CED9C861AB6064DD62D012988` | VERIFIED / APPROVED |
| `requerimento-embarcacao-er-2026-v1` | 2-C | 2 | `DAEDFD1D1F7C48C020D7D3169BFD9D36B4EEA122E75FDCC792EB3CC59E691AFF` | VERIFIED / APPROVED |
| `declaracao-residencia-er-2026-v1` | 2-G | 1 | `392DC41E9E2A95409972156A4460F4DF6E74C2F906D4111CC03B1CE7457C8B38` | VERIFIED / APPROVED |
| `declaracao-perda-tie-er-2026-v1` | 2-H | 1 | `D67AAB9B1E878F7877A69AC0B9E6197DE932A61D166626B50141FBE119567093` | VERIFIED / APPROVED |
| `comunicacao-transferencia-er-2026-v1` | 2-I | 1 | `0DF2A7550AF9CBFDCBC27D94128C2BBB0EEFA88BABA6142CB39EDB4FE22EA142` | VERIFIED / APPROVED |
| `autorizacao-transferencia-er-2026-v1` | 2-K | 1 | `52A4CACFFEFD628EF9D95DC84943CCA0CB0FD66A706272380A92F19F4B9EDE5E` | VERIFIED / APPROVED |
| `termo-responsabilidade-er-2026-v1` | 3-C | - | - | IDENTIFIED / DRAFT - substituído após auditoria normativa |

## Revisão página a página

### 2-A — BADE

- páginas 1 e 2: campos do requerente/embarcação renderizados e revisados;
- datas de quilha, lançamento, DPEM e requerente são escritas em segmentos,
  respeitando os separadores impressos;
- campos administrativos reservados à CP/DL/AG não são preenchidos;
- páginas 3 e 4 são checklist/uso administrativo e permanecem intactas;
- páginas 5 a 7 são instruções e permanecem intactas;
- marcações e campos densos de propulsão/combustível foram reposicionados após
  revisão visual.

### 2-B — BSADE

- natureza do requerimento é marcada por flags independentes;
- transferência de propriedade + jurisdição pode marcar as duas opções sem
  reutilizar uma escolha mutuamente exclusiva;
- dados pessoais, venda, embarcação e único motor do MVP ficaram dentro das
  células revisadas.

### 2-C — Requerimento

- área de navegação aceita somente aliases revisados, com normalização de
  maiúsculas/acentos, e marca o X dentro do parêntese correto;
- opções de serviço foram reposicionadas pela geometria do PDF;
- página 2 mantém segunda via/outro serviço, local e data dentro das linhas.

### 2-G — Declaração de residência

- dados pessoais/endereço revisados;
- local e data são escritos nos três segmentos impressos.

### 2-H — Perda/extravio

- opção TIE é marcada dentro dos parênteses;
- data de expedição e data da declaração são segmentadas;
- nome/CPF/contatos e identificação da embarcação ficaram alinhados.

### 2-I — Comunicação de transferência

- proprietário anterior e novo proprietário foram mantidos semanticamente
  separados;
- data textual é produzida como dia + nome do mês + dois dígitos do ano, de
  acordo com o texto já impresso no modelo.

### 2-K — Autorização de transferência

- dados da embarcação, primeiro motor, proprietário, coproprietário e comprador
  foram revisados;
- **limitação deliberada:** o MVP mantém apenas um motor canônico
  (`vessel.motorBrand`, `vessel.motorPower`, `vessel.motorSerial`).
  Motor 2–4 não são inferidos nem preenchidos;
- as opções impressas `Motor 1 ( ) SIM ( ) NÃO` também permanecem manuais:
  ausência de dado não pode ser inferida como `NÃO`, e o domínio aprovado não
  possui `motor1Choice`.

### 3-C — Termo de Responsabilidade de Construção/Alteração

- o PDF anteriormente revisado não corresponde ao 3-C da publicação completa usada como
  fonte normativa atual;
- suas coordenadas foram descartadas e não podem ser reaproveitadas;
- o PDF correto foi identificado a partir da NORMAM-211, mas só voltará a `VERIFIED`
  depois da validação de bytes, novo mapeamento, geração sintética e revisão visual;
- ele não faz parte do pacote padrão de transferência de propriedade.


## Regras de segurança/correção preservadas

- o sistema não preenche assinatura, rubrica, reconhecimento de firma, carimbo
  ou campo reservado à autoridade;
- nenhum valor é truncado silenciosamente para caber no PDF;
- escolhas estáticas são fail-closed: apenas valores/aliases explicitamente
  revisados são aceitos;
- `false` em checkbox unilateral significa deixar a caixa em branco;
- valores canônicos de data continuam `DD/MM/AAAA`; transformações são apenas
  de apresentação no PDF;
- os PDFs originais são preservados e verificados por SHA-256 antes da geração;
- fotos da embarcação não são solicitadas pela ferramenta de preenchimento,
  embora possam continuar sendo exigidas no procedimento oficial.

## Estado de liberação e bloqueios residuais

- Sete mapas NORMAM-211 permanecem `APPROVED`. A aprovação antiga do 3-C foi
  revogada porque o documento de referência estava semanticamente incorreto.
- Sete serviços podem ficar `AVAILABLE` para embarcação/barco com os formulários
  já cobertos.
- Moto aquática continua bloqueada em produção e preservada apenas no QA local
  até a homologação NORMAM-212 correspondente.
- O formulário pendente relevante é o Anexo 3-C correto (Construção/Alteração), não o
  3-D. Alteração de dados, alteração de motor e inscrição de médio porte permanecem
  bloqueadas até modelar sua aplicabilidade e homologar o novo mapa.
- Múltiplos motores ficam explicitamente fora do MVP.
- QA manual em navegador/mobile permanece uma verificação operacional pendente,
  sem invalidar a revisão estrutural e visual reproduzível já concluída.
