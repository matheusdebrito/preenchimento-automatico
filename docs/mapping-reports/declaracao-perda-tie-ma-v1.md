# Relatório de mapeamento técnico — declaracao-perda-tie-ma-v1

**Status:** RASCUNHO (`FormMapping = DRAFT`). Não homologado para uso real.

- Data dos testes preliminares: 26/10/2026
- Origem: PDF oficial da NORMAM-212/DPC, registrado e verificado em `docs/FORM_CATALOG.md`
- Identidade do formulário: `declaracao-perda-tie-ma`
- Versão técnica: `v1` (não confundir com edição oficial)
- Tipo: estático, preenchimento por coordenadas
- Total de posições em rascunho: **11**
- Método: imagem PNG de 850×1200 px, convertida em pontos PDF A4; imagens `pdftoppm`, arquivo oficial imutável
- Inspeção técnica: imagens fictícias geradas pela CI e analisadas visualmente pelo agente
- **Revisão humana independente:** PENDENTE — não confundir com inspeção técnica pelo agente.

## Evidências

- [Modelo original em branco, prévia página 1](../_pdf_previews/declaracao-perda-tie-ma/page-1.png)
- [Teste de preenchimento com dados fictícios, página 1](../_pdf_test_previews/declaracao-perda-tie-ma/page-1.png)

## Coordenadas e campos

**11 posições**, **11 campos semânticos**, **4 campos obrigatórios** no mapeamento atual. Para marcações sim/não, o mesmo ID aparece em duas posições e **somente uma** deve receber X.

As coordenadas abaixo são pixels da imagem-base de 850 × 1200; o código converte para pontos PDF. As assinaturas e os espaços reservados para reconhecimento de firma NÃO estão mapeados.

| Campo semântico | Página | X / linha Y | Largura | Fonte | Obrigatório | Renderização |
|---|---:|---:|---:|---:|---|---|
| `declarant.fullName` | 1 | 152 / 297 px | 602 px | 7.2 pt | Sim | Texto |
| `declarant.identity` | 1 | 230 / 325 px | 102 px | 6.6 pt | Não | Texto |
| `declarant.cpf` | 1 | 624 / 325 px | 136 px | 6.2 pt | Sim | Texto |
| `declarant.phone` | 1 | 278 / 387 px | 203 px | 6.6 pt | Não | Texto |
| `declarant.email` | 1 | 187 / 418 px | 561 px | 7 pt | Não | Texto |
| `vessel.name` | 1 | 328 / 482 px | 260 px | 7 pt | Sim | Texto |
| `vessel.registration` | 1 | 596 / 482 px | 150 px | 6.5 pt | Sim | Texto |
| `declarant.nationality` | 1 | 230 / 355 px | 208 px | 7 pt | Não | Texto |
| `declarant.birthplace` | 1 | 545 / 355 px | 209 px | 7 pt | Não | Texto |
| `declarant.issueDate` | 1 | 434 / 325 px | 141 px | 6 pt | Não | Texto |
| `declarant.mobile` | 1 | 591 / 387 px | 163 px | 6.5 pt | Não | Texto |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Separados os dados do declarante dos dados do vendedor; acrescidos celular e data de expedição da identidade. A data/local de assinatura e assinatura do declarante ou representante devem ser feitos manualmente. Validar responsabilidade do declarante conforme TIE e situação do extravio.

Os exemplos atuais usam dados fictícios curtos. **Texto excessivo, letras acentuadas, campos obrigatórios, regras condicionais e separação de assinaturas** devem ser revistos com casos de teste representativos. Se um nome não couber, o motor bloqueia a emissão em vez de cortar o texto.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
