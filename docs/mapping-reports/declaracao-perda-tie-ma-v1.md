# Relatório de mapeamento técnico — declaracao-perda-tie-ma-v1

**Status:** RASCUNHO (`FormMapping = DRAFT`). Não homologado para uso real.

- Data dos testes preliminares: 26/10/2026
- Origem: PDF oficial da NORMAM-212/DPC, registrado e verificado em `docs/FORM_CATALOG.md`
- Identidade do formulário: `declaracao-perda-tie-ma`
- Versão técnica: `v1` (não confundir com edição oficial)
- Tipo: estático, preenchimento por coordenadas
- Total de posições em rascunho: **9**
- Método: imagem PNG de 850×1200 px, convertida em pontos PDF A4; imagens `pdftoppm`, arquivo oficial imutável
- Inspeção técnica: imagens fictícias geradas pela CI e analisadas visualmente pelo agente
- **Revisão humana independente:** PENDENTE — não confundir com inspeção técnica pelo agente.

## Evidências

- [Modelo original em branco, prévia página 1](../_pdf_previews/declaracao-perda-tie-ma/page-1.png)
- [Teste de preenchimento com dados fictícios, página 1](../_pdf_test_previews/declaracao-perda-tie-ma/page-1.png)

## Coordenadas e campos

Coordenadas abaixo referem-se aos pixels da imagem-base; o mapeamento no código usa pontos PDF (origem inferior esquerda).

| Campo semântico | Página | Posição X / linha Y | Largura máxima | Fonte |
|---|---:|---:|---:|---:|
| `seller.fullName` | 1 | 152 / 297 px | 602 px | 7.2 pt |
| `seller.identity` | 1 | 230 / 325 px | 102 px | 6.6 pt |
| `seller.cpf` | 1 | 624 / 325 px | 136 px | 6.2 pt |
| `seller.phone` | 1 | 278 / 387 px | 203 px | 6.6 pt |
| `seller.email` | 1 | 187 / 418 px | 561 px | 7 pt |
| `vessel.name` | 1 | 328 / 482 px | 260 px | 7 pt |
| `vessel.registration` | 1 | 596 / 482 px | 150 px | 6.5 pt |
| `seller.nationality` | 1 | 230 / 355 px | 208 px | 7 pt |
| `seller.birthplace` | 1 | 545 / 355 px | 209 px | 7 pt |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Data e assinatura permanecem em branco para preenchimento/assinatura humana. Necessária confirmação de correspondência entre declarante e vendedor/proprietário em cada situação.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
