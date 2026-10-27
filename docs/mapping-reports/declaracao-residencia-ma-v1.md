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

**8 posições**, **8 campos semânticos**, **3 campos obrigatórios** no mapeamento atual. Para marcações sim/não, o mesmo ID aparece em duas posições e **somente uma** deve receber X.

As coordenadas abaixo são pixels da imagem-base de 850 × 1200; o código converte para pontos PDF. As assinaturas e os espaços reservados para reconhecimento de firma NÃO estão mapeados.

| Campo semântico | Página | X / linha Y | Largura | Fonte | Obrigatório | Renderização |
|---|---:|---:|---:|---:|---|---|
| `person.fullName` | 1 | 153 / 325 px | 598 px | 7.3 pt | Sim | Texto |
| `person.cpf` | 1 | 177 / 356 px | 122 px | 6.1 pt | Sim | Texto |
| `person.nationality` | 1 | 411 / 356 px | 116 px | 6.4 pt | Não | Texto |
| `person.birthplace` | 1 | 644 / 356 px | 117 px | 6.2 pt | Não | Texto |
| `person.phone` | 1 | 266 / 388 px | 176 px | 6.5 pt | Não | Texto |
| `person.mobile` | 1 | 551 / 388 px | 206 px | 6.5 pt | Não | Texto |
| `person.email` | 1 | 190 / 420 px | 554 px | 7.1 pt | Não | Texto |
| `person.address` | 1 | 430 / 512 px | 320 px | 7 pt | Sim | Texto |

## Critérios de validação

- [x] Original mantido imutável, com SHA-256 registrado.
- [x] Todos os campos mapeados possuem coordenadas dentro das páginas (teste automatizado).
- [x] Gerada amostra sintética e renderização para conferência.
- [ ] Conferidos limites reais de nomes, endereços, acentos e caracteres especiais em todas as posições.
- [ ] Validado que todos os campos obrigatórios e condicionais foram identificados.
- [ ] Corrigidas as lacunas e aprovado relatório por revisor humano.
- [ ] Associada a versão ao serviço aplicável e marcados critérios de `APPROVED`.

## Riscos e pendências

Endereço principal mapeado; uma segunda linha opcional permanece sem automatização. Assinatura e local/data de declaração continuam manuais. Verificar conteúdo do endereço e aplicabilidade legal da declaração.

Os exemplos atuais usam dados fictícios curtos. **Texto excessivo, letras acentuadas, campos obrigatórios, regras condicionais e separação de assinaturas** devem ser revistos com casos de teste representativos. Se um nome não couber, o motor bloqueia a emissão em vez de cortar o texto.

**Decisão:** manter `DRAFT` e bloquear geração real até completar a revisão e os cenários.
