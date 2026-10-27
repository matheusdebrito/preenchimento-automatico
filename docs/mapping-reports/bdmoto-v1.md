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

**28 posições**, **28 campos semânticos**, **6 campos obrigatórios** no mapeamento atual. Para marcações sim/não, o mesmo ID aparece em duas posições e **somente uma** deve receber X.

As coordenadas abaixo são pixels da imagem-base de 850 × 1200; o código converte para pontos PDF. As assinaturas e os espaços reservados para reconhecimento de firma NÃO estão mapeados.

| Campo semântico | Página | X / linha Y | Largura | Fonte | Obrigatório | Renderização |
|---|---:|---:|---:|---:|---|---|
| `process.transferOwnership` | 1 | 338 / 376 px | 20 px | 10 pt | Não | Texto |
| `person.fullName` | 1 | 310 / 461 px | 442 px | 7.5 pt | Sim | Texto |
| `person.address` | 1 | 205 / 485 px | 545 px | 7.4 pt | Sim | Texto |
| `person.city` | 1 | 182 / 509 px | 130 px | 7.2 pt | Não | Texto |
| `person.neighborhood` | 1 | 394 / 509 px | 152 px | 7.2 pt | Não | Texto |
| `person.postalCode` | 1 | 589 / 509 px | 171 px | 7.2 pt | Não | Texto |
| `person.identity` | 1 | 219 / 538 px | 100 px | 6.5 pt | Não | Texto |
| `person.issuer` | 1 | 457 / 538 px | 91 px | 6.5 pt | Não | Texto |
| `person.issueDate` | 1 | 704 / 538 px | 62 px | 6.2 pt | Não | Texto |
| `person.cpf` | 1 | 206 / 563 px | 108 px | 6.4 pt | Sim | Texto |
| `person.phone` | 1 | 363 / 563 px | 183 px | 6.7 pt | Não | Texto |
| `person.mobile` | 1 | 591 / 563 px | 172 px | 6.7 pt | Não | Texto |
| `person.email` | 1 | 171 / 587 px | 580 px | 7 pt | Não | Texto |
| `sale.invoice` | 1 | 218 / 1026 px | 106 px | 6.5 pt | Não | Texto |
| `sale.date` | 1 | 444 / 1026 px | 73 px | 6.4 pt | Não | Texto |
| `sale.place` | 1 | 571 / 1026 px | 185 px | 6.4 pt | Não | Texto |
| `seller.fullName` | 1 | 207 / 1054 px | 300 px | 6.4 pt | Não | Texto |
| `seller.cpf` | 1 | 614 / 1054 px | 141 px | 6.2 pt | Não | Texto |
| `vessel.name` | 2 | 169 / 155 px | 156 px | 6.6 pt | Sim | Texto |
| `vessel.registration` | 2 | 419 / 155 px | 95 px | 6.5 pt | Sim | Texto |
| `vessel.year` | 2 | 674 / 155 px | 84 px | 6 pt | Não | Texto |
| `vessel.length` | 2 | 236 / 178 px | 88 px | 6.1 pt | Não | Texto |
| `vessel.hullId` | 2 | 411 / 178 px | 104 px | 6 pt | Sim | Texto |
| `vessel.capacity` | 2 | 633 / 178 px | 121 px | 6.1 pt | Não | Texto |
| `vessel.motorBrand` | 2 | 226 / 219 px | 97 px | 6.2 pt | Não | Texto |
| `vessel.motorPower` | 2 | 408 / 219 px | 104 px | 6.1 pt | Não | Texto |
| `vessel.motorSerial` | 2 | 601 / 219 px | 157 px | 6.1 pt | Não | Texto |
| `person.placeDate` | 2 | 216 / 244 px | 107 px | 5.8 pt | Não | Texto |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Dados do proprietário e da embarcação distribuídos em duas páginas; verificar ambas, inclusive os campos de nota fiscal/venda condicionais. Assinatura do requerente, protocolo e carimbo do atendente permanecem manuais. Emitir em duas vias conforme norma.

Os exemplos atuais usam dados fictícios curtos. **Texto excessivo, letras acentuadas, campos obrigatórios, regras condicionais e separação de assinaturas** devem ser revistos com casos de teste representativos. Se um nome não couber, o motor bloqueia a emissão em vez de cortar o texto.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
