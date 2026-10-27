# Relatório de mapeamento técnico — autorizacao-transferencia-ma-v1

**Status:** RASCUNHO (`FormMapping = DRAFT`). Não homologado para uso real.

- Data dos testes preliminares: 26/10/2026
- Origem: PDF oficial da NORMAM-212/DPC, registrado e verificado em `docs/FORM_CATALOG.md`
- Identidade do formulário: `autorizacao-transferencia-ma`
- Versão técnica: `v1` (não confundir com edição oficial)
- Tipo: estático, preenchimento por coordenadas
- Total de posições em rascunho: **42**
- Método: imagem PNG de 850×1200 px, convertida em pontos PDF A4; imagens `pdftoppm`, arquivo oficial imutável
- Inspeção técnica: imagens fictícias geradas pela CI e analisadas visualmente pelo agente
- **Revisão humana independente:** PENDENTE — não confundir com inspeção técnica pelo agente.

## Evidências

- [Modelo original em branco, prévia página 1](../_pdf_previews/autorizacao-transferencia-ma/page-1.png)
- [Teste de preenchimento com dados fictícios, página 1](../_pdf_test_previews/autorizacao-transferencia-ma/page-1.png)

## Coordenadas e campos

**42 posições**, **38 campos semânticos**, **10 campos obrigatórios** no mapeamento atual. Para marcações sim/não, o mesmo ID aparece em duas posições e **somente uma** deve receber X.

As coordenadas abaixo são pixels da imagem-base de 850 × 1200; o código converte para pontos PDF. As assinaturas e os espaços reservados para reconhecimento de firma NÃO estão mapeados.

| Campo semântico | Página | X / linha Y | Largura | Fonte | Obrigatório | Renderização |
|---|---:|---:|---:|---:|---|---|
| `vessel.name` | 1 | 256 / 213 px | 176 px | 7 pt | Sim | Texto |
| `vessel.registration` | 1 | 530 / 213 px | 230 px | 7 pt | Sim | Texto |
| `vessel.motorBrand` | 1 | 178 / 264 px | 251 px | 7 pt | Não | Texto |
| `vessel.motorPower` | 1 | 190 / 289 px | 240 px | 7 pt | Não | Texto |
| `vessel.motorSerial` | 1 | 204 / 317 px | 225 px | 7 pt | Não | Texto |
| `seller.fullName` | 1 | 180 / 478 px | 255 px | 7 pt | Sim | Texto |
| `seller.cpf` | 1 | 207 / 532 px | 229 px | 7 pt | Sim | Texto |
| `seller.phone` | 1 | 190 / 562 px | 240 px | 7 pt | Não | Texto |
| `seller.email` | 1 | 180 / 587 px | 251 px | 7 pt | Não | Texto |
| `person.fullName` | 1 | 173 / 638 px | 560 px | 7.2 pt | Sim | Texto |
| `person.cpf` | 1 | 189 / 658 px | 544 px | 7 pt | Sim | Texto |
| `person.phone` | 1 | 189 / 677 px | 241 px | 7 pt | Não | Texto |
| `person.email` | 1 | 503 / 677 px | 244 px | 7 pt | Não | Texto |
| `person.address` | 1 | 166 / 697 px | 259 px | 7 pt | Não | Texto |
| `person.streetNumber` | 1 | 516 / 697 px | 46 px | 6 pt | Não | Texto |
| `person.apartment` | 1 | 660 / 697 px | 85 px | 6 pt | Não | Texto |
| `person.neighborhood` | 1 | 187 / 717 px | 122 px | 7 pt | Não | Texto |
| `person.city` | 1 | 363 / 717 px | 186 px | 7 pt | Não | Texto |
| `person.postalCode` | 1 | 596 / 717 px | 151 px | 7 pt | Não | Texto |
| `sale.price` | 1 | 177 / 738 px | 549 px | 7 pt | Não | Texto |
| `person.placeDate` | 1 | 219 / 758 px | 512 px | 7 pt | Não | Texto |
| `vessel.motor1Choice` | 1 | 264 / 243 px | 12 px | 7 pt | Sim | X se `sim` |
| `vessel.motor1Choice` | 1 | 321 / 243 px | 12 px | 7 pt | Sim | X se `nao` |
| `vessel.motor2Choice` | 1 | 585 / 243 px | 12 px | 7 pt | Sim | X se `sim` |
| `vessel.motor2Choice` | 1 | 643 / 243 px | 12 px | 7 pt | Sim | X se `nao` |
| `vessel.motor3Choice` | 1 | 264 / 344 px | 12 px | 7 pt | Sim | X se `sim` |
| `vessel.motor3Choice` | 1 | 321 / 344 px | 12 px | 7 pt | Sim | X se `nao` |
| `vessel.motor4Choice` | 1 | 585 / 344 px | 12 px | 7 pt | Sim | X se `sim` |
| `vessel.motor4Choice` | 1 | 643 / 344 px | 12 px | 7 pt | Sim | X se `nao` |
| `vessel.motor2Brand` | 1 | 507 / 264 px | 251 px | 7 pt | Não | Texto |
| `vessel.motor2Power` | 1 | 514 / 289 px | 240 px | 7 pt | Não | Texto |
| `vessel.motor2Serial` | 1 | 532 / 317 px | 225 px | 7 pt | Não | Texto |
| `vessel.motor3Brand` | 1 | 178 / 372 px | 251 px | 7 pt | Não | Texto |
| `vessel.motor3Power` | 1 | 190 / 398 px | 240 px | 7 pt | Não | Texto |
| `vessel.motor3Serial` | 1 | 204 / 423 px | 225 px | 7 pt | Não | Texto |
| `vessel.motor4Brand` | 1 | 507 / 372 px | 251 px | 7 pt | Não | Texto |
| `vessel.motor4Power` | 1 | 514 / 398 px | 240 px | 7 pt | Não | Texto |
| `vessel.motor4Serial` | 1 | 532 / 423 px | 225 px | 7 pt | Não | Texto |
| `coOwner.fullName` | 1 | 507 / 478 px | 244 px | 7 pt | Não | Texto |
| `coOwner.cpf` | 1 | 510 / 532 px | 241 px | 7 pt | Não | Texto |
| `coOwner.phone` | 1 | 518 / 562 px | 230 px | 7 pt | Não | Texto |
| `coOwner.email` | 1 | 507 / 587 px | 244 px | 7 pt | Não | Texto |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Campos do coproprietário e motores 2–4 foram acrescentados como opcionais; as escolhas sim/não exigem valor, mas a consistência entre escolha e dados de motor, a existência de coproprietário e os requisitos jurídicos condicionais ainda precisam de QA humano. Assinaturas e reconhecimento de firma de vendedor, comprador e coproprietário permanecem manuais; segunda página reservada ao reconhecimento.

Os exemplos atuais usam dados fictícios curtos. **Texto excessivo, letras acentuadas, campos obrigatórios, regras condicionais e separação de assinaturas** devem ser revistos com casos de teste representativos. Se um nome não couber, o motor bloqueia a emissão em vez de cortar o texto.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
