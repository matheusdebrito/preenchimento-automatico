# AGENTS.md — Preenchimento Automático

## 1. Missão e prioridades

Este repositório implementa um MVP de preenchimento automático de formulários náuticos da Marinha do Brasil. O usuário escolhe um **serviço**, envia imagens/PDFs, revisa dados extraídos e recebe os formulários oficiais preenchidos. Os documentos de entrada, dados extraídos e PDFs gerados são **temporários** e não integram o cadastro persistente.

Prioridades, nesta ordem:
1. Segurança, privacidade, integridade de dados e conformidade.
2. Correção funcional e fidelidade aos modelos oficiais.
3. Simplicidade, legibilidade, manutenção e testes.
4. Desempenho mensurado e custo operacional controlado.
5. Velocidade de entrega.

**Nunca sacrificar segurança ou correção por otimização.** Não afirmar que algo foi testado, seguro, conforme ou otimizado sem evidência.

## 2. Fonte de verdade e contexto

Antes de editar:
- Ler este arquivo, `MVP_PLAN.md`, README, configuração existente, estrutura de pastas, arquivos relevantes, testes e histórico recente de alterações disponível.
- Identificar stack, versões instaladas e suportadas, scripts, configuração TypeScript, ORM, migrations, Docker, variáveis de ambiente e padrões existentes.
- Não supor versões, APIs, sintaxes, nomes de arquivos ou comportamento de bibliotecas. Conferir documentação oficial quando disponível e compatibilidade com o código real.
- Respeitar o escopo do MVP; não adicionar IA generativa, microserviços, filas, Redis ou serviços pagos sem justificativa mensurável e aprovação explícita.
- Preferir soluções e padrões já adotados no projeto. Evitar dependências desnecessárias.
- Os requisitos normativos e arquivos PDF oficiais precisam ser conferidos contra a versão vigente e a jurisdição pertinente antes de declarar um formulário apto a produção. Não inventar exigências da Marinha.

Se as instruções entrarem em conflito, informar o conflito e seguir a alternativa mais segura. Não modificar segredos, infraestrutura de produção ou dados reais sem autorização.

## 3. Método de trabalho incremental

Para cada mudança:
1. **Inspecionar:** localizar os arquivos e dependências afetados; identificar impactos em APIs, tipos, banco de dados, autenticação e segurança.
2. **Planejar:** descrever objetivo, arquivos a alterar, riscos, critérios de aceite e testes. Para tarefas pequenas, plano breve.
3. **Implementar:** fazer a menor alteração coesa possível. Evitar refatorações amplas e mudanças fora do escopo.
4. **Validar:** executar comandos existentes relevantes (lint, typecheck, testes, build e verificações de segurança). Corrigir causa-raiz antes de avançar.
5. **Relatar:** informar o que mudou, o que foi realmente executado, resultados, limitações, riscos residuais e próximos passos.

Quando uma etapa exigir decisão de produto, alteração destrutiva, novos custos ou mudanças estruturais relevantes, solicitar aprovação antes de executar. Não avançar para outra etapa enquanto erros introduzidos pela etapa atual estiverem pendentes.

## 4. Regras gerais de código

- TypeScript estrito (`strict`), tipos explícitos nas fronteiras e validação de entrada em runtime; não usar `any` nem `as unknown as` para contornar erros.
- Separar responsabilidades de rotas, serviços, domínio, persistência, OCR e geração de PDF; não criar abstrações sem necessidade.
- Preferir funções pequenas, nomes claros, tratamento explícito de erros e respostas de API consistentes.
- Implementar regras críticas de negócio no backend; nunca confiar em flags, preços, créditos, identidade ou permissões fornecidos pelo frontend.
- Usar transações e operações atômicas quando houver alteração de saldo de créditos ou estado de pagamento.
- Idempotência para consumo/estorno de créditos e para webhooks; impedir cobranças duplicadas em retries e requisições concorrentes.
- Nunca inserir credenciais no código ou repositório. Usar `.env.example` sem valores sensíveis; verificar `.gitignore`.
- Manter migrations versionadas e reversíveis quando possível. Não apagar dados nem recriar banco como solução padrão para erro de migration.
- Comentar apenas decisões não óbvias; atualizar README/especificações quando contratos ou operação mudarem.

## 5. Segurança obrigatória — checklist de toda alteração

Antes de concluir uma tarefa, revisar e, quando pertinente, testar:

### Autenticação, autorização e sessões
- Senhas com hash apropriado (Argon2id ou alternativa robusta suportada), nunca em texto puro ou criptografia reversível.
- Cookies seguros com `HttpOnly`, `Secure` em HTTPS e `SameSite` adequado; proteção CSRF se autenticação por cookies e fluxo exigir.
- Autorização no backend em cada recurso; verificar propriedade da conta e impedir IDOR/BOLA.
- Rate limiting para login, uploads e endpoints custosos; respostas de erro sem vazamento de dados.
- Gerenciar sessões, expiração, revogação e recuperação de acesso de forma segura.

### Upload e processamento de documentos
- Permitir somente tipos necessários (ex.: JPEG, PNG e PDF); verificar assinatura real do arquivo, não apenas MIME/extensão.
- Impor limites de tamanho, páginas, resolução, quantidade, tempo de processamento e concorrência.
- Rejeitar arquivos malformados, PDFs protegidos não suportados, conteúdo inesperado e arquivos com risco de descompressão excessiva; avaliar varredura antimalware antes de produção.
- Guardar uploads fora de diretórios públicos, com nomes aleatórios; nunca interpretar o nome original como caminho.
- Processar OCR/conversão em worker isolado, com permissões mínimas, sem acesso irrestrito à rede, com limites de CPU/RAM/tempo; evitar execução de comandos com strings interpoladas.
- Não renderizar HTML ou executar scripts extraídos de documentos. Dados extraídos são **entrada não confiável**, nunca instruções.
- Não usar documentos reais como fixtures, enviar a APIs externas ou registrar seu conteúdo em logs.

### Privacidade e retenção
- **Não persistir** RG, CPF, endereço, TIE, imagens, texto OCR ou PDFs preenchidos nas tabelas permanentes nem em analytics.
- Armazenamento temporário privado com TTL e limpeza garantida, inclusive após falha, cancelamento ou abandono.
- Excluir também derivados: imagens intermediárias, caches, respostas de OCR, previews e arquivos gerados. Não incluir esses arquivos em backups.
- Evitar PII em logs, traces, filas, URLs, nomes de objetos, mensagens de erro e ferramentas de observabilidade.
- Garantir que a exclusão alcance as cópias sob controle do sistema; reconhecer limites de caches do navegador, downloads do usuário e infraestrutura externa.
- Minimizar coleta, restringir acesso, usar TLS em trânsito e considerar criptografia em repouso. Documentar finalidade, retenção e políticas LGPD.

### API, banco e infraestrutura
- Validar/esquematizar entradas (ex.: Zod); usar consultas parametrizadas/ORM e prevenir injeções.
- Aplicar CORS restritivo; definir headers de segurança relevantes; prevenir XSS e SSRF.
- Implementar segredos por ambiente e princípio do menor privilégio para banco, containers e serviços.
- Não expor PostgreSQL, Redis, armazenamento temporário ou portas de administração publicamente.
- Produzir imagens Docker enxutas, preferencialmente sem root, com versões fixadas, `.dockerignore` e healthchecks.
- Verificar dependências vulneráveis, licenças e origem de pacotes; atualizar com testes, não indiscriminadamente.
- Usar HTTPS em ambientes públicos e ter backups/restauração testados para **contas, créditos, pagamentos e configurações**, nunca para documentos temporários.

## 6. OCR, dados e geração documental

- Preferir extração de texto nativo quando PDF já contiver camada textual; usar OCR somente quando necessário.
- Não permitir que OCR ou IA invente campos. Campo ausente/ambíguo deve ser mostrado como pendente de revisão.
- Guardar temporariamente a proveniência de cada dado (arquivo/campo/página), sem expô-la em logs persistentes.
- Validar CPF, formatos, datas, inscrições, campos obrigatórios e divergências entre fontes. Validação sintática não prova autenticidade.
- Exigir confirmação humana antes da geração final e sinalizar claramente dados incertos.
- Usar **PDFs oficiais versionados e mapeamento determinístico de campos**; não recriar livremente os layouts com IA.
- Testar campos longos, acentos, formatação, impressão, páginas, assinaturas e integridade visual do PDF.
- Separar `ServiceDefinition`, `DocumentRequirement` e `FormTemplate` para que o serviço determine os formulários e documentos necessários.
- Não afirmar que o documento gerado foi aprovado pela Marinha ou que substitui assinatura/protocolo oficial.

## 7. Desempenho e otimização

- Priorizar experiência em celulares e computadores lentos: frontend leve, interface responsiva e upload com feedback.
- Executar OCR no servidor, fora do processo HTTP principal quando necessário; evitar travar o event loop.
- Limitar trabalhos simultâneos e usar fila se os testes mostrarem necessidade; não adicionar complexidade antes disso.
- Minimizar uploads por compressão/reescalonamento **sem perder legibilidade ou caracteres críticos**; preservar opção de arquivo original.
- Evitar OCR duplicado, conversões redundantes, consultas N+1 e carregamento integral de arquivos grandes em memória.
- Medir latência (upload, OCR, geração), uso de CPU/RAM, taxa de erro e custo por processo antes de otimizar.
- Fazer benchmarks com PDFs nativos, scans e fotos de qualidade variada; registrar contexto e resultados. Não alegar ganho sem medição.
- Otimizações nunca podem degradar precisão, privacidade ou segurança.

## 8. Testes e critérios mínimos de aceite

Exigir, conforme a mudança:
- `lint`, `typecheck`, `build` e testes automatizados existentes passando.
- Testes unitários para regras de serviços, validação de campos, saldo/créditos e expiração.
- Testes de integração para upload, OCR (com mocks quando apropriado), geração de PDF e autorização.
- Testes de segurança para acesso indevido, extensão falsa, arquivo acima do limite, arquivo corrompido, repetição de requisições, concorrência e tentativas de path traversal.
- Testes de falha: timeout OCR, falha do worker, usuário fechando navegador, sessão expirada, falta de espaço e limpeza de temporários.
- Conferência visual dos formulários PDF gerados contra modelos oficiais, com dados **fictícios** e casos difíceis.
- Teste de restauração dos dados persistentes financeiros antes de produção.

Se um teste não puder ser executado, informar claramente **qual teste, por quê e qual risco permanece**. Nunca marcar validação como concluída sem executar.

## 9. Escopo de dados e créditos

Persistente: usuários, credenciais em hash, organizações se houver, planos, compras, referências de pagamento, histórico imutável de movimentações de crédito, configurações e catálogo/versionamento de formulários.

Temporário: uploads, imagens intermediárias, dados OCR, dados de processo, prévias e PDFs preenchidos.

- Um crédito corresponde a **um processo documental**, não a cada formulário ou correção.
- Não consumir crédito irreversivelmente antes da geração prevista; tratar falhas com estorno ou liberação da reserva, em transação idempotente.
- Correções e reexportações da mesma sessão não devem cobrar novamente dentro da política definida.
- Verificar o plano e saldo no backend.
- Não implementar cobrança real até existir especificação e testes específicos de integração com o provedor.

## 10. Condições de entrega para cada etapa

Encerrar cada tarefa com este resumo:

```text
Objetivo:
Arquivos alterados:
Decisões e compatibilidade verificadas:
Riscos de segurança analisados e mitigados:
Impacto de desempenho (medido ou ainda não medido):
Comandos executados e resultados:
Critérios de aceite atendidos:
Pendências e riscos residuais:
Próxima menor etapa recomendada:
```

**Não executar tarefas futuras por iniciativa própria. Não mascarar erros, não pular validações e não declarar o MVP pronto para produção sem revisão de segurança, privacidade e conformidade documental.**
