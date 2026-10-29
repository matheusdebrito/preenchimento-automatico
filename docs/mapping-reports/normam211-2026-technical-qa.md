# Homologação técnica dos anexos NORMAM-211/DPC 2026

**Data técnica:** 29/10/2026  
**Escopo:** oito PDFs oficiais adicionados ao repositório para serviços de embarcações de esporte e recreio.  
**Resultado técnico:** `FormVersion = VERIFIED` e revisão visual técnica concluída.  
**Decisão de produto em 29/10/2026:** o responsável pelo produto autorizou a
liberação do escopo de um único motor com base nesta evidência. Os oito mapas
NORMAM-211 foram promovidos para `APPROVED`. Isso não afirma que o usuário
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
| `termo-responsabilidade-er-2026-v1` | 3-C | 2 | `706D23CA1BA72F596AC3C959A2D64363C596877355B9F3A637EE371873E15AA0` | VERIFIED / APPROVED |

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

### 3-C — Termo de responsabilidade

- uso limitado a inscrição/transferência de propriedade na composição atual;
- data de nascimento, data de expedição e data final são segmentadas de acordo
  com o layout;
- página 2 não possui campos do requerente mapeados e permanece intacta.

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

## Bloqueios para APPROVED / AVAILABLE

1. O repositório exige revisão visual **humana** para `FormMapping = APPROVED`.
   Esta revisão foi técnica, realizada pelo agente, e não deve ser rotulada como
   gate humano.
2. O Anexo 3-D (Termo de Responsabilidade de Construção/Alteração) ainda precisa
   ser incorporado e modelado nos casos em que a responsabilidade técnica for
   aplicável. A tentativa de download automatizado não foi mantida porque a
   origem consultada apresentou cadeia TLS inválida no runner; TLS não foi
   contornado.
3. Embarcações com múltiplos motores continuam fora do domínio aprovado do MVP.
4. Falta QA manual completo no navegador/mobile do fluxo real antes da
   publicação dos serviços.

Por esses motivos, os oito mapas podem avançar de `DRAFT` para `TESTED`,
mas nenhum serviço desta expansão deve ficar `AVAILABLE` nesta entrega.
