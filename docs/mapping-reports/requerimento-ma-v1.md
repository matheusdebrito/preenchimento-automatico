# Relatório de mapeamento técnico — requerimento-ma-v1

**Status:** RASCUNHO (`FormMapping = DRAFT`). Não homologado para uso real.

- Data dos testes preliminares: 26/10/2026
- Origem: PDF oficial da NORMAM-212/DPC, registrado e verificado em `docs/FORM_CATALOG.md`
- Identidade do formulário: `requerimento-ma`
- Versão técnica: `v1` (não confundir com edição oficial)
- Tipo: estático, preenchimento por coordenadas
- Total de posições em rascunho: **17**
- Método: imagem PNG de 850×1200 px, convertida em pontos PDF A4; imagens `pdftoppm`, arquivo oficial imutável
- Inspeção técnica: imagens fictícias geradas pela CI e analisadas visualmente pelo agente
- **Revisão humana independente:** PENDENTE — não confundir com inspeção técnica pelo agente.

## Evidências

- [Modelo original em branco, prévia página 1](../_pdf_previews/requerimento-ma/page-1.png)
- [Teste de preenchimento com dados fictícios, página 1](../_pdf_test_previews/requerimento-ma/page-1.png)

## Coordenadas e campos

**17 posições**, **17 campos semânticos**, **5 campos obrigatórios** no mapeamento atual. Para marcações sim/não, o mesmo ID aparece em duas posições e **somente uma** deve receber X.

As coordenadas abaixo são pixels da imagem-base de 850 × 1200; o código converte para pontos PDF. As assinaturas e os espaços reservados para reconhecimento de firma NÃO estão mapeados.

| Campo semântico | Página | X / linha Y | Largura | Fonte | Obrigatório | Renderização |
|---|---:|---:|---:|---:|---|---|
| `person.fullName` | 1 | 176 / 321 px | 557 px | 8 pt | Sim | Texto |
| `person.address` | 1 | 202 / 345 px | 283 px | 7 pt | Não | Texto |
| `person.streetNumber` | 1 | 517 / 345 px | 40 px | 6.5 pt | Não | Texto |
| `person.apartment` | 1 | 636 / 346 px | 120 px | 7 pt | Não | Texto |
| `person.city` | 1 | 175 / 369 px | 247 px | 7 pt | Não | Texto |
| `person.state` | 1 | 451 / 369 px | 116 px | 7 pt | Não | Texto |
| `person.identity` | 1 | 650 / 370 px | 110 px | 7 pt | Não | Texto |
| `person.issuer` | 1 | 183 / 392 px | 135 px | 7 pt | Não | Texto |
| `person.postalCode` | 1 | 354 / 392 px | 133 px | 7 pt | Não | Texto |
| `person.phone` | 1 | 520 / 392 px | 48 px | 5.8 pt | Não | Texto |
| `person.cpf` | 1 | 700 / 392 px | 66 px | 5.2 pt | Sim | Texto |
| `vessel.registration` | 1 | 232 / 466 px | 324 px | 7.6 pt | Sim | Texto |
| `vessel.name` | 1 | 177 / 488 px | 375 px | 7.6 pt | Sim | Texto |
| `vessel.length` | 1 | 241 / 515 px | 134 px | 7.5 pt | Não | Texto |
| `vessel.hullId` | 1 | 230 / 536 px | 340 px | 7.5 pt | Sim | Texto |
| `process.transferOwnership` | 1 | 137 / 655 px | 20 px | 9 pt | Não | Texto |
| `person.placeDate` | 1 | 132 / 1011 px | 284 px | 8 pt | Não | Texto |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Local e data agora aparecem na posição correspondente; assinatura e CPF/CNPJ do requerente continuam exclusivamente manuais. O campo estreito de CPF na primeira página exige conferência em impressão. Em casos de pessoa jurídica, representantes e mudanças conjuntas, revalidar regras antes de ativar serviço.

Os exemplos atuais usam dados fictícios curtos. **Texto excessivo, letras acentuadas, campos obrigatórios, regras condicionais e separação de assinaturas** devem ser revistos com casos de teste representativos. Se um nome não couber, o motor bloqueia a emissão em vez de cortar o texto.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
