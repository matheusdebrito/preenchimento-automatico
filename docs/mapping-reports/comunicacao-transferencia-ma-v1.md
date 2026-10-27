# Relatório de mapeamento técnico — comunicacao-transferencia-ma-v1

**Status:** RASCUNHO (`FormMapping = DRAFT`). Não homologado para uso real.

- Data dos testes preliminares: 26/10/2026
- Origem: PDF oficial da NORMAM-212/DPC, registrado e verificado em `docs/FORM_CATALOG.md`
- Identidade do formulário: `comunicacao-transferencia-ma`
- Versão técnica: `v1` (não confundir com edição oficial)
- Tipo: estático, preenchimento por coordenadas
- Total de posições em rascunho: **29**
- Método: imagem PNG de 850×1200 px, convertida em pontos PDF A4; imagens `pdftoppm`, arquivo oficial imutável
- Inspeção técnica: imagens fictícias geradas pela CI e analisadas visualmente pelo agente
- **Revisão humana independente:** PENDENTE — não confundir com inspeção técnica pelo agente.

## Evidências

- [Modelo original em branco, prévia página 1](../_pdf_previews/comunicacao-transferencia-ma/page-1.png)
- [Teste de preenchimento com dados fictícios, página 1](../_pdf_test_previews/comunicacao-transferencia-ma/page-1.png)

## Coordenadas e campos

**29 posições**, **29 campos semânticos**, **6 campos obrigatórios** no mapeamento atual. Para marcações sim/não, o mesmo ID aparece em duas posições e **somente uma** deve receber X.

As coordenadas abaixo são pixels da imagem-base de 850 × 1200; o código converte para pontos PDF. As assinaturas e os espaços reservados para reconhecimento de firma NÃO estão mapeados.

| Campo semântico | Página | X / linha Y | Largura | Fonte | Obrigatório | Renderização |
|---|---:|---:|---:|---:|---|---|
| `vessel.name` | 1 | 190 / 269 px | 307 px | 6.8 pt | Sim | Texto |
| `vessel.registration` | 1 | 621 / 269 px | 137 px | 6.6 pt | Sim | Texto |
| `seller.fullName` | 1 | 280 / 360 px | 473 px | 6.6 pt | Sim | Texto |
| `seller.identity` | 1 | 277 / 381 px | 106 px | 6.3 pt | Não | Texto |
| `seller.issuer` | 1 | 292 / 404 px | 101 px | 6.2 pt | Não | Texto |
| `seller.cpf` | 1 | 218 / 426 px | 533 px | 6.8 pt | Sim | Texto |
| `seller.address` | 1 | 218 / 448 px | 285 px | 6.6 pt | Não | Texto |
| `seller.streetNumber` | 1 | 552 / 448 px | 207 px | 6.7 pt | Não | Texto |
| `seller.neighborhood` | 1 | 493 / 466 px | 262 px | 6.5 pt | Não | Texto |
| `seller.city` | 1 | 190 / 494 px | 261 px | 6.5 pt | Não | Texto |
| `seller.state` | 1 | 489 / 494 px | 80 px | 6.3 pt | Não | Texto |
| `seller.postalCode` | 1 | 612 / 494 px | 145 px | 6.3 pt | Não | Texto |
| `person.fullName` | 1 | 271 / 594 px | 482 px | 6.7 pt | Sim | Texto |
| `person.identity` | 1 | 278 / 616 px | 112 px | 6.3 pt | Não | Texto |
| `person.issuer` | 1 | 288 / 640 px | 104 px | 6.2 pt | Não | Texto |
| `person.cpf` | 1 | 217 / 656 px | 530 px | 6.6 pt | Sim | Texto |
| `person.address` | 1 | 224 / 679 px | 279 px | 6.6 pt | Não | Texto |
| `person.streetNumber` | 1 | 548 / 679 px | 208 px | 6.4 pt | Não | Texto |
| `person.neighborhood` | 1 | 482 / 697 px | 271 px | 6.4 pt | Não | Texto |
| `person.city` | 1 | 198 / 721 px | 194 px | 6.3 pt | Não | Texto |
| `person.state` | 1 | 440 / 721 px | 70 px | 6.2 pt | Não | Texto |
| `person.postalCode` | 1 | 568 / 721 px | 184 px | 6.2 pt | Não | Texto |
| `vessel.authority` | 1 | 211 / 292 px | 537 px | 6.8 pt | Não | Texto |
| `seller.identityType` | 1 | 451 / 381 px | 294 px | 6.2 pt | Não | Texto |
| `seller.issueDate` | 1 | 557 / 403 px | 187 px | 6.1 pt | Não | Texto |
| `seller.apartment` | 1 | 265 / 468 px | 134 px | 6.4 pt | Não | Texto |
| `person.identityType` | 1 | 451 / 616 px | 295 px | 6.2 pt | Não | Texto |
| `person.issueDate` | 1 | 557 / 638 px | 188 px | 6.1 pt | Não | Texto |
| `person.apartment` | 1 | 265 / 699 px | 120 px | 6.3 pt | Não | Texto |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Incluídos CP/DL/AG, tipo e emissão de identidade, complemento de endereço do vendedor e do comprador. Local/data final da declaração e assinatura do proprietário anterior permanecem manuais. Validar CPF/CNPJ, campos longos e particularidades dos dois titulares antes de homologar.

Os exemplos atuais usam dados fictícios curtos. **Texto excessivo, letras acentuadas, campos obrigatórios, regras condicionais e separação de assinaturas** devem ser revistos com casos de teste representativos. Se um nome não couber, o motor bloqueia a emissão em vez de cortar o texto.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
