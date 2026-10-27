# Relatório de mapeamento técnico — autorizacao-transferencia-ma-v1

**Status:** RASCUNHO (`FormMapping = DRAFT`). Não homologado para uso real.

- Data dos testes preliminares: 26/10/2026
- Origem: PDF oficial da NORMAM-212/DPC, registrado e verificado em `docs/FORM_CATALOG.md`
- Identidade do formulário: `autorizacao-transferencia-ma`
- Versão técnica: `v1` (não confundir com edição oficial)
- Tipo: estático, preenchimento por coordenadas
- Total de posições em rascunho: **21**
- Método: imagem PNG de 850×1200 px, convertida em pontos PDF A4; imagens `pdftoppm`, arquivo oficial imutável
- Inspeção técnica: imagens fictícias geradas pela CI e analisadas visualmente pelo agente
- **Revisão humana independente:** PENDENTE — não confundir com inspeção técnica pelo agente.

## Evidências

- [Modelo original em branco, prévia página 1](../_pdf_previews/autorizacao-transferencia-ma/page-1.png)
- [Teste de preenchimento com dados fictícios, página 1](../_pdf_test_previews/autorizacao-transferencia-ma/page-1.png)

## Coordenadas e campos

Coordenadas abaixo referem-se aos pixels da imagem-base; o mapeamento no código usa pontos PDF (origem inferior esquerda).

| Campo semântico | Página | Posição X / linha Y | Largura máxima | Fonte |
|---|---:|---:|---:|---:|
| `vessel.name` | 1 | 256 / 213 px | 176 px | 7 pt |
| `vessel.registration` | 1 | 530 / 213 px | 230 px | 7 pt |
| `vessel.motorBrand` | 1 | 178 / 264 px | 251 px | 7 pt |
| `vessel.motorPower` | 1 | 190 / 289 px | 240 px | 7 pt |
| `vessel.motorSerial` | 1 | 204 / 317 px | 225 px | 7 pt |
| `seller.fullName` | 1 | 180 / 478 px | 255 px | 7 pt |
| `seller.cpf` | 1 | 207 / 532 px | 229 px | 7 pt |
| `seller.phone` | 1 | 190 / 562 px | 240 px | 7 pt |
| `seller.email` | 1 | 180 / 587 px | 251 px | 7 pt |
| `person.fullName` | 1 | 173 / 638 px | 560 px | 7.2 pt |
| `person.cpf` | 1 | 189 / 658 px | 544 px | 7 pt |
| `person.phone` | 1 | 189 / 677 px | 241 px | 7 pt |
| `person.email` | 1 | 503 / 677 px | 244 px | 7 pt |
| `person.address` | 1 | 166 / 697 px | 259 px | 7 pt |
| `person.streetNumber` | 1 | 516 / 697 px | 46 px | 6 pt |
| `person.apartment` | 1 | 660 / 697 px | 85 px | 6 pt |
| `person.neighborhood` | 1 | 187 / 717 px | 122 px | 7 pt |
| `person.city` | 1 | 363 / 717 px | 186 px | 7 pt |
| `person.postalCode` | 1 | 596 / 717 px | 151 px | 7 pt |
| `sale.price` | 1 | 177 / 738 px | 549 px | 7 pt |
| `person.placeDate` | 1 | 219 / 758 px | 512 px | 7 pt |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Coproprietário, motores adicionais, marcações SIM/NÃO e reconhecimento de firma ainda precisam de mapeamento/regras condicionais. Assinaturas não podem ser automatizadas.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
