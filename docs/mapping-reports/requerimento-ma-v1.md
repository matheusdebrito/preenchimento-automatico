# Relatório de mapeamento técnico — requerimento-ma-v1

**Status:** RASCUNHO (`FormMapping = DRAFT`). Não homologado para uso real.

- Data dos testes preliminares: 26/10/2026
- Origem: PDF oficial da NORMAM-212/DPC, registrado e verificado em `docs/FORM_CATALOG.md`
- Identidade do formulário: `requerimento-ma`
- Versão técnica: `v1` (não confundir com edição oficial)
- Tipo: estático, preenchimento por coordenadas
- Total de posições em rascunho: **16**
- Método: imagem PNG de 850×1200 px, convertida em pontos PDF A4; imagens `pdftoppm`, arquivo oficial imutável
- Inspeção técnica: imagens fictícias geradas pela CI e analisadas visualmente pelo agente
- **Revisão humana independente:** PENDENTE — não confundir com inspeção técnica pelo agente.

## Evidências

- [Modelo original em branco, prévia página 1](../_pdf_previews/requerimento-ma/page-1.png)
- [Teste de preenchimento com dados fictícios, página 1](../_pdf_test_previews/requerimento-ma/page-1.png)

## Coordenadas e campos

Coordenadas abaixo referem-se aos pixels da imagem-base; o mapeamento no código usa pontos PDF (origem inferior esquerda).

| Campo semântico | Página | Posição X / linha Y | Largura máxima | Fonte |
|---|---:|---:|---:|---:|
| `person.fullName` | 1 | 176 / 321 px | 557 px | 8 pt |
| `person.address` | 1 | 202 / 345 px | 283 px | 7 pt |
| `person.streetNumber` | 1 | 517 / 345 px | 40 px | 6.5 pt |
| `person.apartment` | 1 | 636 / 346 px | 120 px | 7 pt |
| `person.city` | 1 | 175 / 369 px | 247 px | 7 pt |
| `person.state` | 1 | 451 / 369 px | 116 px | 7 pt |
| `person.identity` | 1 | 650 / 370 px | 110 px | 7 pt |
| `person.issuer` | 1 | 183 / 392 px | 135 px | 7 pt |
| `person.postalCode` | 1 | 354 / 392 px | 133 px | 7 pt |
| `person.phone` | 1 | 520 / 392 px | 48 px | 5.8 pt |
| `person.cpf` | 1 | 700 / 392 px | 66 px | 5.2 pt |
| `vessel.registration` | 1 | 232 / 466 px | 324 px | 7.6 pt |
| `vessel.name` | 1 | 177 / 488 px | 375 px | 7.6 pt |
| `vessel.length` | 1 | 241 / 515 px | 134 px | 7.5 pt |
| `vessel.hullId` | 1 | 230 / 536 px | 340 px | 7.5 pt |
| `process.transferOwnership` | 1 | 137 / 655 px | 20 px | 9 pt |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Campos de local/data e assinatura não foram automatizados. Tipos empresariais, representante e alterações além da transferência não são contemplados. O tamanho mínimo do CPF exige revalidação em impressão.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
