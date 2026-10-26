# PROJECT_TRACKER.md — Plano executável do MVP

> **Objetivo:** orientar o OpenCode na implementação incremental, permitindo retomar o trabalho e marcar cada fase somente quando seus critérios forem comprovadamente atendidos.
>
> **Escopo:** primeiro serviço = transferência de propriedade de moto aquática. Modelo comercial = créditos avulsos e pacotes pré-pagos; **sem assinatura nem planos empresariais**. Nenhuma integração real com a Marinha ou promessa de aprovação.
>
> **Fontes de verdade:** `AGENTS.md` (segurança e engenharia), `MVP_PLAN.md` (requisitos), `UI_DESIGN_GUIDE.md` (UX), `docs/FORM_CATALOG.md` e `docs/SERVICE_FORM_MATRIX.md` (catalogação). Em conflito, **não avançar** sem registrar a divergência e priorizar a regra mais segura.

## 0. Protocolo obrigatório do agente

1. **No início de toda sessão:** ler este arquivo, os documentos citados e o estado atual do repositório; conferir `git status`, branch, alterações locais e último commit. Nunca sobrescrever trabalho não commitado.
2. Escolher **somente a primeira fase incompleta cujas dependências estejam satisfeitas**. Relatar o escopo e os testes previstos antes de modificar código.
3. Executar alterações pequenas e compatíveis com as versões e padrões existentes; evitar dependências, infraestrutura e abstrações desnecessárias.
4. Rodar os comandos de verificação aplicáveis dos pacotes afetados (`typecheck`, `lint`, `test`, `build`), além dos testes específicos da fase. Se não puder executar, registrar **não verificado**, nunca marcar como aprovado.
5. **Marcar [x] apenas após evidência verificável**. Adicionar na seção "Registro de execução": data, fase, arquivos alterados, comandos e resultados, validações manuais, riscos e commit. Uma fase parcialmente feita permanece [ ].
6. Se faltar decisão do usuário, modelo oficial, dado normativo, ferramenta necessária ou acesso, registrar **BLOQUEADO** e fazer uma pergunta objetiva com os arquivos/instruções necessários. Não inventar PDFs, fontes oficiais, versões, campos nem obrigações legais.
7. Fazer uma fase por vez; após concluir, **parar e informar o resultado**, inclusive pendências. Não avançar automaticamente.
8. Não editar marcadores de fases futuras, não simular testes, não usar documentos pessoais reais em testes, não lançar código inseguro para "desbloquear".
9. Manter o frontend demonstrativo funcionando até haver integração real validada; separar explicitamente fluxos `demo` e `real`.
10. Sempre revisar segurança (autenticação, autorização, validação de entradas, uploads, logs, temporários, consumo de créditos), desempenho (medir antes de otimizar) e LGPD.

### Estados e dependências

- **[ ]** Pendente/em andamento/bloqueado: explicitar situação no Registro de execução.
- **[x]** Concluída e verificada.
- Uma fase pode depender de subetapas, mas não de suposições; uma confirmação verbal não substitui inspeção/teste.
- O agente pode corrigir problemas da fase atual sem abrir uma nova fase.

## 1. Quadro geral de progresso

| Fase | Objetivo | Dependência | Situação |
| --- | --- | --- | --- |
| 00 | Revalidar fundação existente | — | [ ] |
| 01 | Catalogar serviço e modelos exigidos | 00 | [ ] |
| 02 | **Solicitar PDFs oficiais ao usuário e homologar modelos** | 01 | [ ] |
| 03 | API de catálogo e integração de seleção | 02 para liberar serviço; estrutura pode ser preparada antes | [ ] |
| 04 | Motor reutilizável de preenchimento PDF | 02 | [ ] |
| 05 | Upload seguro e retenção temporária | 00 | [ ] |
| 06 | OCR/extração estruturada no servidor | 05 | [ ] |
| 07 | Revisão humana e jornada integrada | 03, 04, 06 | [ ] |
| 08 | Autenticação, créditos de teste e consumo idempotente | 07 | [ ] |
| 09 | Hardening e homologação ponta a ponta | 08 | [ ] |
| 10 | Pagamentos reais de créditos (fase comercial posterior) | MVP homologado e autorização explícita | [ ] |

> **Estado inicial conhecido em 26/10/2026:** frontend demonstrativo, API Fastify com healthcheck, Compose/PostgreSQL e contratos preliminares de catálogo foram adicionados ao repositório. Esses fatos **não significam** aprovação de build/testes nem homologação dos PDFs. A Fase 00 deverá verificar o estado local real antes de qualquer [x].

## Fase 00 — Revalidar a fundação existente

- [ ] Inspecionar frontend, backend, Compose, versões, lockfiles, testes, alterações locais e instruções vigentes.
- [ ] Executar `typecheck`, `lint`, `test` e `build` em frontend e backend; documentar comandos e resultados.
- [ ] Verificar funcionamento do frontend demonstrativo e `GET /health` em ambiente local, se disponível.
- [ ] Revisar riscos imediatos e inconsistências antes de evoluir.
- **Aceite:** evidências registradas, erros introduzidos/identificados bloqueantes resolvidos; demonstração preservada.

## Fase 01 — Pesquisa documental e regras do serviço

- [ ] Verificar a **NORMAM-212/DPC vigente** e as orientações da Capitania/jurisdição aplicável; registrar links, data, versão e particularidades.
- [ ] Identificar exatamente os formulários aplicáveis à **transferência de propriedade de moto aquática**, distinguindo obrigatórios, condicionais e **documentos de origem do usuário** (não confundir com modelos em branco).
- [ ] Atualizar `docs/FORM_CATALOG.md` e `docs/SERVICE_FORM_MATRIX.md` com evidências oficiais, perguntas condicionais e pendências.
- [ ] Conferir o código dos contratos (`FormTemplate`, `FieldDefinition`, `ServiceForm`) sem criar relações fictícias.
- [ ] Gerar **checklist de downloads pendentes**: nome oficial, código/anexo, finalidade, link oficial direto ou página de origem, formato e nome de arquivo sugerido.
- **Aceite:** matriz sustentada por fontes verificáveis; nenhuma exigência sem referência; lista de PDFs pronta para apresentar ao usuário.

## Fase 02 — PORTÃO OBRIGATÓRIO: solicitar e validar os PDFs oficiais

**Esta é a hora exata em que o OpenCode deve solicitar ao usuário que baixe/adicone os arquivos. NÃO solicitar todos os PDFs da Marinha antecipadamente.**

- [ ] Parar a execução e mostrar **somente os PDFs efetivamente necessários ao serviço piloto**, separando modelos condicionais, com links oficiais verificados.
- [ ] Pedir que o usuário salve os **modelos oficiais em branco** em `backend/templates/motos-aquaticas/`, usando os nomes recomendados. Aceitar modelos obtidos diretamente pelo agente apenas se a origem oficial puder ser comprovada, a ferramenta permitir e o usuário autorizar; **não criar PDFs substitutos**.
- [ ] **AGUARDAR a confirmação de que os arquivos estão presentes**, depois inspecionar bytes, assinatura `%PDF`, páginas, dimensões, campos AcroForm e metadados.
- [ ] Registrar para cada arquivo: URL oficial, norma, jurisdição, data de verificação, versão, SHA-256, caminho, tipo PDF (`ACROFORM`, `STATIC` ou outro), estado e observações.
- [ ] Conferir se a versão/estrutura é consistente com a fonte; em caso de divergência, bloqueio ou PDF ausente, **não avançar**.
- [ ] Verificar condições de uso/versionamento de modelos públicos; nunca adicionar documentos pessoais nem arquivos preenchidos com dados reais ao Git.
- [ ] **Portão humano:** apresentar resumo dos PDFs e solicitar confirmação de que o conjunto corresponde ao serviço escolhido, antes de homologar.
- **Aceite:** todos os modelos necessários ao fluxo piloto presentes, verificados e associados à fonte; ainda não marcar `APPROVED` antes de mapeamento e testes da Fase 04.

### Mensagem que o OpenCode deve apresentar no portão de PDFs

> Chegamos à etapa de cadastro dos formulários oficiais. Para continuar, preciso dos seguintes PDFs em branco, obtidos nas fontes oficiais verificadas: **[lista por nome + finalidade + link + nome de destino]**. Salve-os em `backend/templates/motos-aquaticas/` e me avise quando terminar. **Não envie documentos preenchidos ou com dados pessoais.** Após sua confirmação, verificarei versão, integridade e campos e seguirei com o mapeamento. Se a lista ainda estiver incerta, informarei quais requisitos precisam de confirmação.

## Fase 03 — API de catálogo e contratos

- [ ] Validar referencialmente serviços, campos, templates e relações muitos-para-muitos, inclusive condições.
- [ ] Expor endpoints públicos **apenas de serviços realmente disponíveis**; rascunhos são internos e não liberam geração.
- [ ] Migrar seleção/checklist do frontend de dados hardcoded para a API sem remover a demonstração.
- [ ] Testar relações inexistentes, versões inativas, condições e restrição de disponibilidade.
- **Aceite:** API e interface mostram o mesmo catálogo validado; nenhuma exigência inventada é exposta como oficial.

## Fase 04 — Motor genérico de PDFs

- [ ] Detectar campos AcroForm; para PDFs estáticos, definir coordenadas por página, unidades e fontes.
- [ ] Separar **campo semântico** de **campo/posição do PDF**, permitindo reutilização do motor entre serviços.
- [ ] Versionar mapeamento e modelo; não modificar o PDF original nem recriar o layout oficial.
- [ ] Implementar validações de comprimento, acentos, quebras de linha, espaços para assinaturas e campos condicionais.
- [ ] Gerar PDFs com **dados sintéticos**, renderizar **todas as páginas** e conferir visualmente texto cortado, sobreposição e paginação.
- [ ] Executar testes automatizados de regressão por modelo e registrar revisão humana antes de marcá-lo `APPROVED`.
- **Aceite:** pacote piloto gerado corretamente com dados fictícios, modelo preservado, visual inspecionado e sem documento real.

## Fase 05 — Upload seguro e temporário

- [ ] Implementar upload JPG/JPEG/PNG/PDF com validação de conteúdo real, limites de tamanho/páginas/dimensões e proteção contra arquivos maliciosos.
- [ ] Armazenar apenas em volume privado temporário, isolado do webroot e backups; gerar IDs aleatórios, sem nome do cliente no path.
- [ ] Exigir acesso autorizado ao job; impor quotas, limites de concorrência, timeout e limpeza após encerramento/expiração/falha.
- [ ] Testar upload inválido, truncado, grande, PDF malformado e cancelamento.
- **Aceite:** nenhum dado documental persistido no PostgreSQL, logs ou repositório.

## Fase 06 — PDF textual, OCR e extração estruturada

- [ ] Extrair texto nativo de PDFs digitais sem OCR quando possível.
- [ ] Converter páginas de PDFs digitalizados para imagens sob limites de recursos.
- [ ] Executar Tesseract no servidor/worker com tratamento de qualidade de imagem e limites de CPU/memória.
- [ ] Mapear texto para IDs semânticos reutilizáveis; registrar origem/confiança somente no job temporário.
- [ ] Detectar conflitos e ausências; nunca completar valores por suposição.
- [ ] Testar fotos/PDFs **sintéticos**, com qualidade variada e campos ambíguos.
- **Aceite:** extração rastreável, falhas tratadas e nenhuma confiança excessiva em OCR.

## Fase 07 — Revisão e integração do wizard

- [ ] Substituir o fluxo fictício por API real com separação clara entre demonstração e produção.
- [ ] Permitir corrigir todos os campos necessários e confirmar explicitamente dados antes da geração.
- [ ] Integrar seleção → upload → leitura → conferência → geração → download.
- [ ] Preservar UX mobile-first, paleta, ícones e acessibilidade estabelecidos.
- [ ] Testar fechamento do navegador, falha de rede, retorno à sessão temporária, download e expiração.
- **Aceite:** fluxo funcional com documentos sintéticos, mensagens corretas e nenhuma geração sem revisão.

## Fase 08 — Autenticação e créditos de teste

- [ ] Criar persistência mínima para usuários e ledger de créditos; não armazenar dados de clientes ou embarcações.
- [ ] Implementar autenticação, autorização por operação, proteção de sessão e limitação de taxa.
- [ ] Conceder créditos de **teste** por mecanismo interno seguro; não integrar cobrança real nesta fase.
- [ ] Debitar **uma vez por pacote documental gerado com sucesso**, usando transação e idempotência; retentativas, ajustes ou falhas não geram débito duplicado.
- [ ] Testar concorrência, acesso entre usuários, estorno e recuperação de falha.
- **Aceite:** segurança e invariantes de saldo verificadas por testes.

## Fase 09 — Segurança, desempenho e homologação

- [ ] Rodar typecheck, lint, testes, build, integração e cenários ponta a ponta em ambiente controlado.
- [ ] Revisar OWASP para autenticação, upload, PDFs, endpoints, processamento e logs; revisar dependências vulneráveis.
- [ ] Medir consumo de CPU/memória do OCR, concorrência, limites e tempo de resposta; otimizar com métricas, não por intuição.
- [ ] Auditar retenção e limpeza de arquivos temporários, backups, logs, erros e mensagens sobre privacidade/LGPD.
- [ ] Verificar acessibilidade e experiência em celulares modestos.
- [ ] Revisar formalmente PDFs, regras de serviço e responsabilidade das assinaturas.
- **Aceite:** checklist completo, riscos residuais documentados, fluxos críticos homologados.

## Fase 10 — Comercialização por créditos (APENAS mediante autorização posterior)

- [ ] Reconfirmar intenção de iniciar pagamentos reais; **não iniciar esta fase automaticamente**.
- [ ] Especificar compra avulsa/pacotes, valores, reembolsos, prazo de validade e provedor.
- [ ] Implementar pagamento Pix/cartão com verificação de webhook, conciliação e idempotência.
- [ ] Testar compras duplicadas, chargeback/cancelamentos e falhas do provedor em sandbox.
- **Aceite:** aprovação explícita do usuário e testes financeiros/auditoria concluídos.
- **Fora de escopo:** mensalidades, assinaturas e planos empresariais.

## Registro de execução — atualizar a cada sessão/fase

| Data (Brasília) | Fase | Situação | Evidências (comandos, testes, arquivos, revisão) | Commit / bloqueio |
| --- | --- | --- | --- | --- |
| 2026-10-26 | Inicialização | Plano criado; nenhuma fase certificada | Estado anterior conhecido apenas pelo histórico do repositório; verificar no ambiente OpenCode | — |

### Modelo de relatório ao final de cada fase

```text
Fase: [número e nome]
Status: CONCLUÍDA / PARCIAL / BLOQUEADA
Alterações: [arquivos alterados e decisões]
Validações reais: [comando -> resultado, inclusive falhas]
Segurança e privacidade: [riscos tratados / riscos residuais]
Formulários: [fonte, versão e status, se aplicável]
Pendência para o usuário: [somente se houver]
Próxima fase elegível: [número]
Commit: [SHA, se realizado]
```

## Critério de encerramento do plano

O MVP técnico está pronto apenas quando **fases 00 a 09** estiverem todas marcadas [x], com evidências no registro e o fluxo completo validado. A fase 10 é uma evolução comercial separada, não uma exigência para concluir o protótipo.
