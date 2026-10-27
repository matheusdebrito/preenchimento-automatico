# Correções após teste manual — 27/10/2026

## Relato e análise

Durante o teste do modo QA local, o usuário interrompeu a jornada na revisão após observar:
1. A opção **Entrar** continuava visível mesmo após autenticação; a rota de login permitia iniciar troca de conta.
2. O rodapé repetia navegação do cabeçalho e trazia aviso antigo sobre os arquivos não irem ao servidor.
3. Ausência de indicação visível de qual documento obrigatório faltava ao tentar prosseguir.
4. Nenhuma sugestão automática do OCR com os arquivos selecionados.
5. `PATCH /api/jobs/:id/review` retornou HTTP **422** depois de preenchimento manual.

**Importante:** não foram recebidos os arquivos/fotos do teste nem o corpo JSON da resposta 422. Portanto, a causa exata da ausência de sugestões e o campo específico que rejeitou a requisição original **não foram comprovados**. O backend já possuía validações para obrigatórios, CPF e datas; o problema confirmado era a ausência de contexto suficiente na interface.

## Alterações realizadas

| Camada | Correção |
| --- | --- |
| Autenticação frontend | `AuthProvider` consulta `/api/auth/me` e centraliza sessão; cabeçalho apresenta `Entrar` apenas ao visitante, `Minha conta` e `Sair` ao autenticado. A rota `/entrar` redireciona o autenticado para a conta; uma falha de consulta mostra opção de tentar novamente sem presumir logout. |
| Autenticação backend | `POST /api/auth/login` e `POST /api/auth/register` respondem `409 already_authenticated` se o cookie indicar sessão válida. A troca de usuário exige logout explícito. |
| Rodapé e início | Links duplicados removidos do rodapé. Textos corrigidos: a demonstração visual pode rodar no navegador, enquanto o fluxo de processamento envia temporariamente imagens/PDFs ao servidor. |
| Documentos obrigatórios | Ao tentar continuar, a interface enumera os requisitos ausentes junto ao botão e junto ao documento correspondente, sem perder o que já foi selecionado. A API pode retornar `422 missing_document` com `requirementId` público. |
| OCR | O backend retorna `diagnostics` temporários por requisito (campos sugeridos, sem texto, sem rótulos suportados ou sem análise configurada), **sem enviar texto extraído ou dados pessoais nos diagnósticos**. A UI apresenta o resultado por documento e avisa quando nenhum campo foi identificado. |
| Revisão / 422 | `missing_required_fields` agora informa `fieldId`, assim como `invalid_field_value`; o frontend explica o campo e mantém a revisão aberta. A validação rigorosa de CPF e data não foi relaxada. |

## Verificações automatizadas

- `frontend/src/components/layout/AppHeader.test.tsx`: visitante, autenticado, logout e menu via teclado.
- `frontend/src/pages/AuthPage.test.tsx`: não mostrar formulário quando autenticado; sessão atualizada após login e logout.
- `frontend/src/components/layout/AppFooter.test.tsx`: sem navegação duplicada ou texto falso sobre upload local.
- `frontend/src/pages/HomePage.test.tsx`: texto coerente e provider na composição dos componentes.
- `frontend/src/features/real/LiveFlowPage.test.tsx`: ausência de documentos, relatório OCR vazio, obrigatório, CPF inválido e reenvio bem-sucedido da revisão no mesmo job.
- `backend/src/routes/qa-preview.integration.test.ts`: resposta com diagnóstico, recuperação do diagnóstico no job e `422` com identificador do campo obrigatório, sem valor privado.
- `backend/src/modules/auth/auth.integration.test.ts`: login/cadastro bloqueados enquanto sessão válida, com a identidade mantida.
- **Evidência:** [GitHub Actions 40510328039](https://github.com/matheusdebrito/preenchimento-automatico/actions/runs/40510328039), commit `af800ef`: **5/5 jobs aprovados**, incluindo checks do frontend/backend, integração PostgreSQL, prévias PDFs sintéticas e Docker Compose. Versões intermediárias do trabalho tiveram falhas de testes por mudanças de navegação e foram corrigidas antes desta execução.

## Roteiro de reteste manual (prioridade)

1. Na sua máquina, atualizar a branch `main`, manter `DEV_QA_PREVIEW=true` **somente em desenvolvimento** e executar `docker compose up -d --build`. Verificar os três containers e `http://127.0.0.1:3000/health`.
2. Criar ou acessar uma conta de teste. Após login, o cabeçalho deve mostrar **Minha conta** e **Sair**, nunca **Entrar**; acessar `/entrar` deve redirecionar para a conta.
3. Conferir o rodapé sem links de navegação duplicados e com aviso de processamento temporário correto.
4. Abrir o serviço `qa-synthetic-moto`, avançar até documentos e clicar **Enviar e analisar documentos** sem anexar os dois obrigatórios. Devem aparecer nomes dos arquivos faltantes perto do botão; enviar só um deve informar somente o outro.
5. Enviar **documentos inteiramente fictícios**: identidade com `NOME: MARIA DE SOUZA` / `CPF: 123.456.789-09`, e TIE com `NOME DA EMBARCACAO: MAR TESTE`. Conferir sugestões e o relatório por documento. Se não reconhecer, anotar se informou **sem texto** ou **sem rótulo suportado**; não coletar dados reais.
6. Preencher/corrigir campos visíveis. Propositalmente deixar o nome da moto aquática vazio e usar CPF sintaticamente inválido em tentativas separadas. Deve ser identificado o **campo exato** sem retornar valores em logs/erro.
7. Corrigir com os dados fictícios acima, confirmar e gerar. Devem aparecer os PDFs QA 2-A e 2-B marcados como **AMOSTRA**, com saldo de créditos inalterado.
8. Sair, abrir novamente `/entrar` e confirmar que o login só fica disponível após logout; o job antigo não pode ser acessado sem sessão/por outra conta.

**Atenção:** depois de alterar o código e reiniciar os containers, um job anterior pode ter expirado ou deixado de existir. Inicie um **novo** processo em vez de reutilizar o UUID que falhou no teste original.

## Pendências não resolvidas por essa entrega

- O OCR em fotos reais de modelos de identidade e TIE diferentes permanece **sem precisão medida**; são necessárias imagens **sintéticas/anônimas autorizadas** com resultados esperados para melhorar regras de reconhecimento sem inferir identidade.
- A revisão visual e normativa dos seis mapeamentos oficiais segue pendente; o modo QA só gera amostras dos anexos 2-A/2-B.
- Não foram executados testes manuais em navegador/celular do usuário por esta execução. Isolamento completo de OCR, fuzzing, carga, recuperação de crash e homologação (Fase 09) permanecem em aberto.
- **Não habilitar** processamento de dados de clientes, serviço oficial ou pagamentos a partir desse resultado de CI.
