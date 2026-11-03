# Teste real de custo OpenAI (5 cenários, execução manual)

## Estado

A implementação está preparada para **chamadas reais**, mas **não há resultados reais até
a execução manual com o segredo de Actions configurado**. Não inclua credenciais em
commit, issue, comentário, workflow, artifact ou histórico de terminal.

O modelo padrão é `gpt-5.4-mini-2026-03-17` porque corresponde à configuração
atual da extração documental da aplicação. O workflow permite escolher
`gpt-5.4-nano-2026-03-17`, mas é necessário verificar a disponibilidade
do snapshot no projeto (a documentação pública pode marcá-lo como descontinuado).

## Configurar com segurança

1. **Revogue a chave anteriormente compartilhada no chat** e gere uma nova
   credencial com acesso apenas ao projeto de testes e menor privilégio.
   Configure limites de orçamento e avisos de consumo diretamente na OpenAI.
2. No GitHub, abra **Settings → Secrets and variables → Actions**.
3. Em **Repository secrets → New repository secret**, crie
   `OPENAI_API_KEY` com a **nova** credencial. Não cole em inputs do workflow.
4. Opcionalmente, em **Repository variables**, configure
   `OPENAI_PROJECT_ID` para direcionar explicitamente as requisições.
   Uma chave `sk-proj` vinculada ao projeto já pode ser suficiente.
5. Somente depois que o código e o CI estiverem integrados à `main`,
   execute **Actions → Cinco custos OpenAI - sintéticos (manual) → Run workflow**,
   mantendo o modelo mini padrão.

A permissão GitHub disponível ao assistente **não permite criar Actions Secrets
nem disparar `workflow_dispatch`**. Essas duas ações devem ser feitas
manualmente por um mantenedor do repositório. Não habilite execução automática
em pull requests: benchmarks com cobrança dependem de código revisado.

## Casos

| Caso | Arquivos enviados | Objetivo |
| --- | --- | --- |
| `rg_png` | 1 PNG de RG sintético | Comparar extração em imagem e campos de identidade |
| `tie_2page_pdf` | 1 TIE sintético em 2 páginas | Medir custo de PDF com características de embarcação |
| `cha_pdf` | 1 CHA sintética em PDF | Validar número, categoria, emissão e titular |
| `cir_pdf` | 1 CIR sintética em PDF | Validar número, categoria e titular |
| `rg_plus_tie_batch` | RG PNG + TIE de 2 páginas | Medir ganho/custo de envio conjunto num processo |

Todos os dados são artificiais e os arquivos são criados temporariamente
com `pdf-lib`; o PNG é renderizado localmente com `pdftoppm`. Não são cópias
de modelos oficiais, nem documentos com validade jurídica, nem dados reais de usuários.

## Limites e custos

O script usa diretamente a função `extractDocumentsWithOneContingency` do
extrator de produção. São **5 cenários**, com uma chamada principal e até uma
única contingência por cenário: **no máximo 10 chamadas** à API.
Se uma chamada der erro, o teste interrompe os próximos cenários,
registra a falha sem armazenar respostas brutas e termina com status de erro.

O controle de **USD 0,15 estimados** interrompe *novas* chamadas quando o
limiar é alcançado; ele é **apenas uma guarda flexível pós-resposta**, NÃO um
limite rígido de cobrança. Limites efetivos devem ser configurados na plataforma
da OpenAI.

Preço de referência do mini por 1 milhão de tokens (tabela padrão, consultar
atualizações antes de comparar com a fatura):

- entrada não cacheada: USD 0,75
- entrada cacheada: USD 0,075
- saída: USD 4,50

O script contabiliza `input_tokens`, `output_tokens` e, quando disponível,
`input_tokens_details.cached_tokens` de **cada chamada**; estima a despesa
aplicando as tarifas ao volume reportado. Pode haver diferença em relação à
fatura por mudanças de preço, modalidade ou ajustes de cobrança.

Fonte: https://developers.openai.com/api/docs/models/gpt-5.4-mini

## Evidências

O workflow publica apenas `openai-cost-results/`, contendo:

- `resultados-openai-5-testes.json`: métricas por chamada e por cenário
- `relatorio-openai-5-testes.md`: tabela de custo, precisão e duração

**Não publica** chave, payload da API, valores extraídos, respostas brutas,
PDFs/PNGs ou arquivos temporários. Os PDFs e PNGs são apagados ao término.

O número de campos corretos é medido contra os valores artificiais conhecidos.
Esse teste não mede fidedignamente fotos tremidas, baixa resolução, variantes
documentais reais, upload web, débito de créditos no app, múltiplas contas nem
concorrência na VPS.

## Reprodução local (somente com credencial no ambiente)

Após instalar e compilar as dependências, em ambiente confiável:

```bash
npm ci --prefix backend
npm run build --prefix backend
node backend/scripts/openai-cost-benchmark.mjs
```

Requer Node.js 24, `pdf-lib`, `pdftoppm` e variável de ambiente
`OPENAI_API_KEY`. Não use `set -x` nem imprima essa variável.
