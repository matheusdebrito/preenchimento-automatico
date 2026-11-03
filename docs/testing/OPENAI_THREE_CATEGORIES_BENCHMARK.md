# Benchmark real: três categorias, três documentos por serviço

Este benchmark compara **o custo de uma análise com três uploads simultâneos** na
mesma chamada à Responses API para cada categoria de serviço. A execução
utiliza o código do extrator de produção e as regras do catálogo público
(versões dos formulários, campos de revisão e autorização de cada documento).

| Cenário | Serviço selecionado no catálogo | Arquivos fictícios |
| --- | --- | --- |
| Embarcações | `transferencia-propriedade-embarcacao` | RG em PNG, TIE em PDF (2 páginas), comprovante de residência em PDF |
| Amadores | `renovacao-cha-amador` | RG em PNG, CHA em PDF, comprovante de residência em PDF |
| Aquaviários | `revalidacao-cir-aquaviario` | RG em PNG, CIR em PDF, comprovante de residência em PDF |

A pergunta `includeResidenceDeclaration` usa `sim` nos três
serviços, de modo que os campos da declaração sejam considerados nos
formulários. A opção de coproprietário é `nao` no caso de embarcações.
O teste usa um requerente fictício e dados artificiais coerentes entre
os documentos; jamais há upload de identidade pessoal real. Os layouts
sintéticos são simplificados e **não reproduzem formatos oficiais**.

## Segurança e limites

- A credencial entra exclusivamente no job de execução da branch `main`
  via `secrets.OPENAI_API_KEY`, não em PRs nem em arquivos.
- O ID do projeto vem de `vars.OPENAI_PROJECT_ID` ou, se configurado
  como segredo, `secrets.OPENAI_PROJECT_ID`.
- Há **3 processos**, **3 documentos por processo**, e no máximo
  **6 chamadas reais** (uma primária e uma contingência por processo).
- A guarda de US$ 0,15 é flexível e verificada após cada resposta, não
  constitui limite de cobrança garantido; limite efetivo exige orçamento
  configurado no projeto OpenAI.
- O evento push limitado ao arquivo do próprio workflow foi adicionado
  para disparar uma execução ao integrar este PR à `main`, conforme
  pedido de realizar os testes agora. Depois disso, execuções normais
  são iniciadas em Actions → Custos OpenAI - 3 categorias com 3 documentos
  → Run workflow. A alteração futura desse workflow também pode disparar
  um teste: manter atenção à alteração de arquivos de automação faturável.
- O relatório contém apenas contagens, IDs de campos divergentes, tempos,
  tokens e custos; **não publica PDFs, PNGs, prompts, extrações brutas ou
  chaves**.
- O CI executa as mesmas três simulações offline, sem credenciais ou custo.
  Resultado offline não é evidência de acerto da IA real.

## Métricas

`openai-category-cost-results/relatorio-openai-3-categorias.md` e
`openai-category-cost-results/resultados-openai-3-categorias.json`
registram para cada serviço: número de documentos e páginas, campos-alvo,
acertos vs dados sintéticos conhecidos, campos divergentes, quantas chamadas,
tokens de entrada/saída, tempo total e custo aproximado em dólares.

O valor estimado usa os tokens efetivos reportados, diferenciando entrada
em cache quando disponível. **Não é fatura**. Não valida a qualidade de
documentos reais, upload no navegador nem cobrança de créditos no aplicativo.

## Observações sobre representatividade

O teste inclui três documentos em cada cenário para comparar
comportamento e custo da análise multi-arquivo. Os documentos são
gerados por `pdf-lib` e a imagem de RG por renderização local
`pdftoppm`, portanto capturam apenas parte da complexidade de fotos
e digitalizações de usuários finais. O filtro de campos é aplicado
**a partir do serviço**; campos que não constem dos PDFs selecionados
não devem ser extraídos automaticamente. Quando o mesmo campo aparece
em dois documentos, os dados sintéticos são iguais para evitar
um conflito artificial.
