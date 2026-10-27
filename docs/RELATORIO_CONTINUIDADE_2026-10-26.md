# Relatório de continuidade — 26/10/2026 (horário de Brasília)

**Repositório:** `matheusdebrito/preenchimento-automatico`, branch `main`. Os commits podem aparecer em 27/10 no GitHub por causa do fuso UTC.

**Escopo permitido:** evolução técnica do MVP com dados exclusivamente sintéticos. **Não** ativar pagamentos reais, implantar produção, liberar serviços oficiais sem homologação ou coletar documentos pessoais reais.

## Implementações realizadas nesta continuação

| Área | Mudança | Commits |
| --- | --- | --- |
| Fase 08 — créditos | Confirmada execução no GitHub Actions do teste de expiração, estorno idempotente e separação entre contas que havia sido adicionado anteriormente | `a8607e3` |
| Fase 05 — uploads | Validação de PNG ampliada: tipos de cor/profundidades do IHDR, paleta exigida para imagens indexadas, posição de PLTE/IDAT, chunks críticos não reconhecidos; JPEG não aceita largura/altura zero | `3e77bf6` |
| Fase 05 — regressões | Casos sintéticos malformados; fixture de IHDR teve CRC corrigido após falha do primeiro CI | `a35cc90`, `ab79c9e` |
| Fase 08 — sessões | Limpeza de sessões expiradas no PostgreSQL ao iniciar a API e a cada hora, mantendo sessões válidas e sem excluir contas/créditos | `bfbf070`, `a6af348`, `04b1ea2` |
| Fase 06 — OCR | Limites defensivos de saída intermediária do Poppler: até 16 MiB por página e 48 MiB por PDF antes de enviar ao Tesseract; teste desses limites com valores sintéticos | `a235b85`, `1ad1f31` |

### Evidências técnicas e critérios de confiança

- O CI do commit `a8607e3` [concluiu com sucesso](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40435783780): verificações de frontend/backend, PostgreSQL, prévias sintéticas e Compose.
- A mudança de PNG foi fundamentada na [especificação PNG (Terceira Edição), seção 11.2.1](https://www.w3.org/TR/png/#11IHDR), que determina as combinações válidas de cor/profundidade e o uso de PLTE. O conserto do teste atualiza o CRC em vez de confundir falta de paleta com checksum inválido.
- A [orientação OWASP sobre uploads](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) recomenda defesa em camadas, limites após descompressão e isolamento de decodificadores. Os limites de bytes adicionados são **mitigações parciais**, não constituem sandbox de OCR nem proteção completa contra arquivos maliciosos.
- O [Node.js documenta o cálculo CRC32 integrado](https://nodejs.org/api/zlib.html#zlibcrc32data-value), utilizado apenas na fixture de regressão do PNG; nenhuma dependência externa foi adicionada.
- **Verificação do CI nos commits mais recentes:** conferir a execução correspondente ao topo de `main` em [GitHub Actions](https://github.com/matheusdebrito/preenchimento-automatico/actions). Commits intermediários podem ter falhado enquanto a fixture de teste estava sendo corrigida; a evidência válida é o pipeline do commit final, não de versões intermediárias.

## Pendências ordenadas para o próximo ciclo

### P0 — Portões bloqueantes do MVP

- [ ] **Homologação documental da Fase 04:** conferir visualmente em cada uma das páginas dos seis PDFs oficiais as posições, acentos, textos longos, datas, condicionais, campos de representante/coproprietário e assinatura. Registrar revisor, data e parecer por `FormMapping`, em `docs/mapping-reports/` e no roteiro `docs/FASE_04_REVISAO_VISUAL.md`. Os seis continuam `DRAFT`; não convertê-los automaticamente para `APPROVED`.
- [ ] **Aplicabilidade ao serviço piloto:** confirmar obrigações do 2-A/2-B e anexos condicionais (TIE, representante, 2-C/2-D/2-E/1-C) contra a NORMAM e orientações oficiais. Só vincular e liberar `ServiceForm` após verificação documental.
- [ ] **CI do último commit:** verificar typecheck, lint, testes, build, integração PostgreSQL, prévias e Compose; corrigir qualquer falha antes de dar uma fase como concluída.

### P1 — Engenharia necessária antes de usuários reais

- [ ] **Isolamento de decodificadores e OCR:** worker/processo isolado com limites reais de CPU/RAM, rede e filesystem, mais tratamento de falhas; o teto de tamanho do PNG gerado não impede por si só exaustão de memória durante conversão.
- [ ] **Fuzzing e testes de carga de upload:** documentos malformados JPEG/PNG/PDF, políglotas, páginas com alta complexidade, interrupção de upload, baixa capacidade de disco e várias requisições simultâneas. Medir resultados com limites reproduzíveis.
- [ ] **OCR de qualidade variada:** fotos rotacionadas, perspectiva, sombras, pouca resolução e múltiplos documentos; avaliar por campo com evidências, sem prometer confiança sem dados.
- [ ] **Créditos e entrega:** crash real antes/durante/depois da confirmação de download, falha de PostgreSQL, recuperação de temporários e garantia de estorno. A implementação atual é **somente instância única**. `HTTP finish` não comprova que o usuário salvou o documento.
- [ ] **Retenção:** verificar a janela entre o fim do TTL deslizante do job e o vencimento absoluto do recibo financeiro; avaliar estorno antecipado de pacotes não entregues quando o job for apagado por limpeza.
- [ ] **Navegador real:** E2E do wizard, recarga, duas abas, logout, volta de sessão, links de download e acessibilidade mobile (teclado, leitores de tela, contraste, celulares modestos).
- [ ] **Fase 09:** revisão OWASP completa, medição CPU/RAM/latência e concorrência, limpeza de dados temporários e LGPD, testes de recuperação e checklist de GO/NO-GO.

### P2 — Produção e monetização: não iniciadas

- [ ] Pagamentos reais Pix/cartão e reembolsos externos (**Fase 10**), deploy público (**Fase 11**), backup operacional, observabilidade, políticas LGPD, carga comercial e lançamento (**Fases 12–17**). Dependem do MVP homologado, das decisões operacionais e das autorizações correspondentes.
- [ ] Expansão para outros serviços (**Fase 18**) somente após estabilidade e validação normativa formulário por formulário.

## Para revisão do responsável amanhã

1. Abrir [GitHub Actions](https://github.com/matheusdebrito/preenchimento-automatico/actions) e observar principalmente o pipeline de `main` mais recente.
2. Ler o [PROJECT_TRACKER.md](../PROJECT_TRACKER.md): quadro geral, checklists de cada fase e registro de execução. A situação deve permanecer **parcial** para Fases 04–08 e **pendente** para 09.
3. Examinar os artefatos `pdf-mapping-review-synthetic` do CI e registrar revisão humana independente dos PDFs antes de qualquer alteração para `APPROVED`.
4. Não enviar documentos pessoais reais nos testes, não abrir a stack local à internet e não ativar cobrança ou uso oficial.

**Conclusão:** melhorias defensivas implementadas, com rastreabilidade e limites explícitos. Não foi declarada homologação do MVP, aprovação de formulários nem prontidão comercial.
