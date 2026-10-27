# Relatório de mapeamento técnico — declaracao-residencia-ma-v1

**Status:** RASCUNHO (`FormMapping = DRAFT`). Não homologado para uso real.

- Data dos testes preliminares: 26/10/2026
- Origem: PDF oficial da NORMAM-212/DPC, registrado e verificado em `docs/FORM_CATALOG.md`
- Identidade do formulário: `declaracao-residencia-ma`
- Versão técnica: `v1` (não confundir com edição oficial)
- Tipo: estático, preenchimento por coordenadas
- Total de posições em rascunho: **8**
- Método: imagem PNG de 850×1200 px, convertida em pontos PDF A4; imagens `pdftoppm`, arquivo oficial imutável
- Inspeção técnica: imagens fictícias geradas pela CI e analisadas visualmente pelo agente
- **Revisão humana independente:** PENDENTE — não confundir com inspeção técnica pelo agente.

## Evidências

- [Modelo original em branco, prévia página 1](../_pdf_previews/declaracao-residencia-ma/page-1.png)
- [Teste de preenchimento com dados fictícios, página 1](../_pdf_test_previews/declaracao-residencia-ma/page-1.png)

## Coordenadas e campos

Coordenadas abaixo referem-se aos pixels da imagem-base; o mapeamento no código usa pontos PDF (origem inferior esquerda).

| Campo semântico | Página | Posição X / linha Y | Largura máxima | Fonte |
|---|---:|---:|---:|---:|
| `person.fullName` | 1 | 153 / 325 px | 598 px | 7.3 pt |
| `person.cpf` | 1 | 177 / 356 px | 122 px | 6.1 pt |
| `person.nationality` | 1 | 411 / 356 px | 116 px | 6.4 pt |
| `person.birthplace` | 1 | 644 / 356 px | 117 px | 6.2 pt |
| `person.phone` | 1 | 266 / 388 px | 176 px | 6.5 pt |
| `person.mobile` | 1 | 551 / 388 px | 206 px | 6.5 pt |
| `person.email` | 1 | 190 / 420 px | 554 px | 7.1 pt |
| `person.address` | 1 | 430 / 512 px | 320 px | 7 pt |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Data e assinatura permanecem em branco, e o endereço pode exceder a linha. A declaração só se aplica à hipótese comprovada pelas regras oficiais.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
