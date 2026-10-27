# Relatório de mapeamento técnico — comunicacao-transferencia-ma-v1

**Status:** RASCUNHO (`FormMapping = DRAFT`). Não homologado para uso real.

- Data dos testes preliminares: 26/10/2026
- Origem: PDF oficial da NORMAM-212/DPC, registrado e verificado em `docs/FORM_CATALOG.md`
- Identidade do formulário: `comunicacao-transferencia-ma`
- Versão técnica: `v1` (não confundir com edição oficial)
- Tipo: estático, preenchimento por coordenadas
- Total de posições em rascunho: **22**
- Método: imagem PNG de 850×1200 px, convertida em pontos PDF A4; imagens `pdftoppm`, arquivo oficial imutável
- Inspeção técnica: imagens fictícias geradas pela CI e analisadas visualmente pelo agente
- **Revisão humana independente:** PENDENTE — não confundir com inspeção técnica pelo agente.

## Evidências

- [Modelo original em branco, prévia página 1](../_pdf_previews/comunicacao-transferencia-ma/page-1.png)
- [Teste de preenchimento com dados fictícios, página 1](../_pdf_test_previews/comunicacao-transferencia-ma/page-1.png)

## Coordenadas e campos

Coordenadas abaixo referem-se aos pixels da imagem-base; o mapeamento no código usa pontos PDF (origem inferior esquerda).

| Campo semântico | Página | Posição X / linha Y | Largura máxima | Fonte |
|---|---:|---:|---:|---:|
| `vessel.name` | 1 | 190 / 269 px | 307 px | 6.8 pt |
| `vessel.registration` | 1 | 621 / 269 px | 137 px | 6.6 pt |
| `seller.fullName` | 1 | 280 / 360 px | 473 px | 6.6 pt |
| `seller.identity` | 1 | 277 / 381 px | 106 px | 6.3 pt |
| `seller.issuer` | 1 | 292 / 404 px | 101 px | 6.2 pt |
| `seller.cpf` | 1 | 218 / 426 px | 533 px | 6.8 pt |
| `seller.address` | 1 | 218 / 448 px | 285 px | 6.6 pt |
| `seller.streetNumber` | 1 | 552 / 448 px | 207 px | 6.7 pt |
| `seller.neighborhood` | 1 | 493 / 466 px | 262 px | 6.5 pt |
| `seller.city` | 1 | 190 / 494 px | 261 px | 6.5 pt |
| `seller.state` | 1 | 489 / 494 px | 80 px | 6.3 pt |
| `seller.postalCode` | 1 | 612 / 494 px | 145 px | 6.3 pt |
| `person.fullName` | 1 | 271 / 594 px | 482 px | 6.7 pt |
| `person.identity` | 1 | 278 / 616 px | 112 px | 6.3 pt |
| `person.issuer` | 1 | 288 / 640 px | 104 px | 6.2 pt |
| `person.cpf` | 1 | 217 / 656 px | 530 px | 6.6 pt |
| `person.address` | 1 | 224 / 679 px | 279 px | 6.6 pt |
| `person.streetNumber` | 1 | 548 / 679 px | 208 px | 6.4 pt |
| `person.neighborhood` | 1 | 482 / 697 px | 271 px | 6.4 pt |
| `person.city` | 1 | 198 / 721 px | 194 px | 6.3 pt |
| `person.state` | 1 | 440 / 721 px | 70 px | 6.2 pt |
| `person.postalCode` | 1 | 568 / 721 px | 184 px | 6.2 pt |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Campos complementares, tipo e data da identidade, CP/DL/AG e local/data de assinatura ainda não estão preenchidos. Comunicação do vendedor não substitui o pedido do comprador.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
