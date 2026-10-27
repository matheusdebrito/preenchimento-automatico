# Relatório de mapeamento técnico — bdmoto-v1

**Status:** RASCUNHO (`FormMapping = DRAFT`). Não homologado para uso real.

- Data dos testes preliminares: 26/10/2026
- Origem: PDF oficial da NORMAM-212/DPC, registrado e verificado em `docs/FORM_CATALOG.md`
- Identidade do formulário: `bdmoto`
- Versão técnica: `v1` (não confundir com edição oficial)
- Tipo: estático, preenchimento por coordenadas
- Total de posições em rascunho: **28**
- Método: imagem PNG de 850×1200 px, convertida em pontos PDF A4; imagens `pdftoppm`, arquivo oficial imutável
- Inspeção técnica: imagens fictícias geradas pela CI e analisadas visualmente pelo agente
- **Revisão humana independente:** PENDENTE — não confundir com inspeção técnica pelo agente.

## Evidências

- [Modelo original em branco, prévia página 1](../_pdf_previews/bdmoto/page-1.png)
- [Teste de preenchimento com dados fictícios, página 1](../_pdf_test_previews/bdmoto/page-1.png)
- [Prévia original, página 2](../_pdf_previews/bdmoto/page-2.png)
- [Teste fictício, página 2](../_pdf_test_previews/bdmoto/page-2.png)

## Coordenadas e campos

Coordenadas abaixo referem-se aos pixels da imagem-base; o mapeamento no código usa pontos PDF (origem inferior esquerda).

| Campo semântico | Página | Posição X / linha Y | Largura máxima | Fonte |
|---|---:|---:|---:|---:|
| `process.transferOwnership` | 1 | 338 / 376 px | 20 px | 10 pt |
| `person.fullName` | 1 | 310 / 461 px | 442 px | 7.5 pt |
| `person.address` | 1 | 205 / 485 px | 545 px | 7.4 pt |
| `person.city` | 1 | 182 / 509 px | 130 px | 7.2 pt |
| `person.neighborhood` | 1 | 394 / 509 px | 152 px | 7.2 pt |
| `person.postalCode` | 1 | 589 / 509 px | 171 px | 7.2 pt |
| `person.identity` | 1 | 219 / 538 px | 100 px | 6.5 pt |
| `person.issuer` | 1 | 457 / 538 px | 91 px | 6.5 pt |
| `person.issueDate` | 1 | 704 / 538 px | 62 px | 6.2 pt |
| `person.cpf` | 1 | 206 / 563 px | 108 px | 6.4 pt |
| `person.phone` | 1 | 363 / 563 px | 183 px | 6.7 pt |
| `person.mobile` | 1 | 591 / 563 px | 172 px | 6.7 pt |
| `person.email` | 1 | 171 / 587 px | 580 px | 7 pt |
| `sale.invoice` | 1 | 218 / 1026 px | 106 px | 6.5 pt |
| `sale.date` | 1 | 444 / 1026 px | 73 px | 6.4 pt |
| `sale.place` | 1 | 571 / 1026 px | 185 px | 6.4 pt |
| `seller.fullName` | 1 | 207 / 1054 px | 300 px | 6.4 pt |
| `seller.cpf` | 1 | 614 / 1054 px | 141 px | 6.2 pt |
| `vessel.name` | 2 | 169 / 155 px | 156 px | 6.6 pt |
| `vessel.registration` | 2 | 419 / 155 px | 95 px | 6.5 pt |
| `vessel.year` | 2 | 674 / 155 px | 84 px | 6 pt |
| `vessel.length` | 2 | 236 / 178 px | 88 px | 6.1 pt |
| `vessel.hullId` | 2 | 411 / 178 px | 104 px | 6 pt |
| `vessel.capacity` | 2 | 633 / 178 px | 121 px | 6.1 pt |
| `vessel.motorBrand` | 2 | 226 / 219 px | 97 px | 6.2 pt |
| `vessel.motorPower` | 2 | 408 / 219 px | 104 px | 6.1 pt |
| `vessel.motorSerial` | 2 | 601 / 219 px | 157 px | 6.1 pt |
| `person.placeDate` | 2 | 216 / 244 px | 107 px | 5.8 pt |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Campos em células estreitas exigem validação com nomes/documentos longos. Campos de assinatura e carimbo continuam vazios. Data de emissão reajustada na linha do rótulo.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
