# Revisão de 27/10/2026 — MVP de Preenchimento Automático

**Leitura prioritária amanhã:** o desenvolvimento avançou, mas o serviço oficial `transferencia-moto-aquatica` permanece `DRAFT` e **não está liberado para documentos pessoais ou protocolos oficiais**. Esta decisão é deliberada: homologação visual dos formulários não pode ser substituída por teste automatizado.

## 1. Implementado nesta continuação

| Entrega | Evidência | Limitação |
| --- | --- | --- |
| OCR do documento de venda | Sugestões conservadoras para número da nota, data e preço; recusam datas inválidas e valores conflitantes | Não extrai contratos de layout arbitrário; revisão humana obrigatória |
| OCR do TIE | Ano, comprimento e lotação rotulados; complementa nome, registro e casco existentes | Dados sem rótulo ficam vazios; não presume proprietário/comprador |
| OCR robustecido | Ignora fotos da moto aquática/GRU sem mapeamento semântico; publica revisão atomica e restaura upload após falha | OCR de imagem continua falível, sem precisão percentual medida |
| Captura por câmera | Campo mobile `capture=environment` para JPG/PNG, mantendo upload PDF normal | Captura em aparelho físico e HTTPS local ainda não validados |
| Modo QA local | `DEV_QA_PREVIEW=true`, serviço `qa-synthetic-moto`, amostras 2-A/2-B com marca d'água em todas as páginas, custo zero | Exige dados totalmente fictícios; não habilita o serviço oficial |
| Integração técnica | Teste PNG sintético → Tesseract → Fastify → revisão → PDF → download → saldo de créditos 0 | Não comprova confiabilidade em fotos reais nem exatidão oficial |
| Isolamento dos testes | Cada instância Fastify de teste ganha raiz temporária própria para impedir limpeza cruzada | Produção ainda é de instância única |

**CI de referência:** [execução 40440558586](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40440558586) — cinco jobs de backend/frontend, PostgreSQL, PDFs fictícios e Compose aprovados no commit `83b7d0c`. Após novos commits documentais, verificar a execução mais recente de `main` em [GitHub Actions](https://github.com/matheusdebrito/preenchimento-automatico/actions).

## 1.1. Robustez adicionada após o primeiro CI verde

- **JPEG do celular:** nova integração gera JPEG fictício com Poppler, valida o preflight de upload e executa Tesseract, exigindo rótulo inequívoco e `REVIEW_REQUIRED`. Isso complementa o caso PNG, **sem comprovar desempenho em fotos reais**.
- **Revisão de dados:** a API rejeita CPF inválido e data impossível (como `31/02/2026`) antes da geração do PDF e identifica o `fieldId` sem retornar os valores privados; a interface orienta o campo e o formato DD/MM/AAAA. Testes de backend e frontend adicionados.
- **Concorrência de migrations:** a inicialização PostgreSQL usa `pg_advisory_xact_lock` durante o schema, evitando a disputa de `CREATE TABLE IF NOT EXISTS` entre suítes paralelas. O lock é liberado no fim da transação, conforme a [documentação oficial do PostgreSQL](https://www.postgresql.org/docs/17/explicit-locking.html#ADVISORY-LOCKS). Há teste de seis inicializações concorrentes.
- **Validação mais forte do resultado:** o teste QA passou a inspecionar **ambos** os PDFs 2-A/2-B, conferindo valores revisados e marca d'água por página, além do saldo zero.
- **Evidência:** o CI de referência anterior (40440558586) já passou. Os testes das melhorias desta subseção devem ser confirmados pela execução do **commit mais recente de código**, antes de marcá-las como homologadas; não interpretar commits intermediários falhos como resultado final.

## 2. O que você pode testar amanhã, sem dados reais

1. Ler [o roteiro do QA sintético](QA_SYNTHETIC_PREVIEW.md).
2. Em `.env` **local**: `DEV_QA_PREVIEW=true` e senha de PostgreSQL exclusiva.
3. Executar `docker compose up -d --build` e abrir **http://127.0.0.1:8080** no mesmo computador.
4. Criar conta de **teste**, acessar o cartão **Teste técnico com dados fictícios**, e anexar imagem/PDF inventado (exemplos de texto no roteiro).
5. Conferir se os campos sugeridos correspondem aos rótulos; corrigir manualmente o que estiver ausente ou incorreto.
6. Gerar, baixar e visualizar os dois PDFs com marca **AMOSTRA**, verificando páginas, alinhamento, caracteres e download. Encerrar e remover os documentos do job.
7. Desligar `DEV_QA_PREVIEW` após o teste.

**Não usar dados de clientes.** A stack local vincula suas portas a `127.0.0.1`; fotografar diretamente em celular na mesma rede exigirá uma solução segura de acesso HTTPS para testes. Não abra as portas para `0.0.0.0` apenas para contornar essa restrição.

## 3. Ações humanas bloqueantes — prioridade máxima

- [ ] **Revisar visualmente os seis anexos** (2-A, 2-B, 2-C, 2-D, 2-E e 1-C) com PDFs fictícios e suas páginas renderizadas. Conferir alinhamento, longos nomes/acentos, datas, condicionais, assinaturas reservadas e impressão. Usar [roteiro da Fase 04](FASE_04_REVISAO_VISUAL.md) e relatórios em `docs/mapping-reports/`. Cada `FormMapping` requer atesto independente antes de `APPROVED`.
- [ ] **Conferir a matriz normativa com a NORMAM-212 vigente e a Capitania aplicável.** Há uma divergência a reconciliar: `docs/SERVICE_FORM_MATRIX.md` documenta opções detalhadas de `tieSituation`/`authorizationStatus`, enquanto `backend/src/modules/catalog/catalog.ts` mantém `tieSituation=regular|extraviado` e `transferAuthorization`. Não ativar a transferência oficial sem resolver consequências dos condicionais para 2-C/2-D/TIE.
- [ ] **Testar em navegador e dispositivo real**, inclusive leitor de tela, teclado, celular de desempenho modesto, rotação/perspectiva/foto escura e recuperação de job. Registrar resultados; o CI atual usa testes React/JSDOM e PNGs sintéticos.
- [ ] **Decidir se os mapas oficiais e regras condicionais têm qualidade suficiente** para ativar o serviço. Não aprovar por equivalência à QA técnica.

## 4. Engenharia ainda pendente (sem decisão humana imediata)

- [ ] Isolar Poppler e Tesseract em worker/container não privilegiado, com limites reais de CPU/RAM, filesystem e rede; o limite atual de bytes rasterizados é apenas uma defesa parcial.
- [ ] Fuzzing de PNG/JPEG/PDF e testes de carga concorrente, DoS, espaço em disco e limpeza após crash de processos.
- [ ] Medir precisão OCR por campo usando corpus sintético controlado com fotografias de qualidades diferentes; avaliar rotação e pré-processamento conforme evidências, sem inferir confiança arbitrária.
- [ ] E2E no navegador real do fluxo com câmera, upload, revisão, reenvio, sessão, download e exclusão.
- [ ] Falha abrupta real do backend/PostgreSQL durante entrega, estorno e recuperação de créditos, inclusive retentativas; modelar compartilhamento se houver múltiplas instâncias.
- [ ] Revisão formal de segurança OWASP, LGPD, retenção, observabilidade e acessibilidade (Fase 09). Até lá não existe liberação para uso com dados reais.

## 5. Fora do escopo automaticamente autorizado

**Não iniciadas:** pagamentos reais (Fase 10), infraestrutura de produção (11), publicação pública, armazenamento de dados pessoais reais, ou expansão para outros serviços (18). As fases 10–17 exigem requisitos técnicos e decisões adicionais, mesmo com autorização para executar tarefas técnicas do MVP.

## 6. Estado para retomada

- Fases **00–03: concluídas**.
- Fase **04: parcial**, seis PDFs verificados e mapeamentos `DRAFT` aguardando homologação humana.
- Fases **05–08: parciais**, com novas funcionalidades e regressões técnicas aprovadas no CI.
- Fase **09: pendente** de homologação integral.
- A simulação local **funciona para amostras sintéticas**; **não equivale** a formulário oficial pronto, extração comprovada de todas as fotos ou lançamento comercial.

Fonte operacional: [PROJECT_TRACKER.md](../PROJECT_TRACKER.md). Histórico anterior: [relatório de continuidade](RELATORIO_CONTINUIDADE_2026-10-26.md).
