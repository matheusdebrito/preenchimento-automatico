# UI_DESIGN_GUIDE.md — Preenchimento Automático

> Referência visual e funcional aprovada para orientar o OpenCode. Este documento descreve a experiência desejada, não afirma que as telas já estão implementadas.
> Prioridade: **mobile-first, clareza para pessoas com pouca familiaridade digital, acessibilidade, segurança e desempenho**.

## 1. Visão do produto

Aplicação web para preenchimento assistido de formulários relativos a serviços da Marinha do Brasil. O usuário escolhe um **serviço** (não formulários individuais), fotografa ou anexa documentos, confere os dados extraídos pelo OCR executado **no servidor**, e baixa o pacote de PDFs preenchidos. O produto cobra **créditos por processo**; assinaturas mensais, planos empresariais, gestão de funcionários e painel complexo ficam fora do MVP.

- Nome provisório na interface: **Preenchimento Automático** (não assumir nome comercial definitivo).
- A plataforma é privada e **não representa a Marinha do Brasil**.
- Não prometer que o protocolo junto à Marinha será feito automaticamente, nem que o PDF será aceito sem conferência.
- O sistema não armazena permanentemente documentos, dados OCR ou PDFs gerados. Somente dados operacionais necessários a usuário, créditos, transações e configurações são persistidos.

## 2. Direção visual aprovada

Visual profissional, acolhedor e limpo, com identidade náutica discreta. Fundo claro; cabeçalho/hero em azul profundo; verde-petróleo para identidade e ações principais; azul secundário para informação; âmbar para alertas. Evitar excesso de gráficos, termos técnicos, sombras chamativas e navegação administrativa complexa.

### Tokens de cor

| Token | HEX | Aplicação |
|---|---|---|
| `navy` | `#142F43` | Cabeçalho, títulos de destaque, textos fortes |
| `teal` | `#197A83` | Ações principais, ícones, progresso |
| `mint-light` | `#EAF3F2` | Cartões de confiança, saldo e ícones |
| `page-bg` | `#F7F9FA` | Fundo da página |
| `amber` | `#E49B46` | Avisos e estados de atenção |
| `white` | `#FFFFFF` | Superfícies de cartões e controles |
| `text-muted` | `#617381` | Texto secundário (ajustar para contraste AA) |
| `border` | `#DFE6EB` | Divisórias e bordas discretas |
| `hero-muted` | `#D5E3EA` | Texto secundário sobre fundo escuro |

**Importante:** esses tons são referência de identidade; verificar contraste WCAG AA antes de utilizar texto pequeno, especialmente sobre fundo claro. Não codificar estado apenas por cor.

### Tipografia e espaçamento

- Fonte: **Inter** (ou fonte de sistema equivalente, sem bloquear renderização).
- Base 16 px; corpo 16–18 px; textos auxiliares preferencialmente >=14 px; títulos claros e hierarquizados.
- Espaçamentos consistentes em múltiplos de 4 ou 8 px; cartões com raios de 12–20 px.
- Área de toque de pelo menos 44 x 44 px; botões primários com altura aproximadamente 48–56 px.
- Ícones sempre com rótulos textuais para navegação e ações principais.
- Priorizar boa leitura e desempenho em celulares simples e computadores antigos.

### Ícones (Lucide)

Manter a linguagem visual aprovada de ícones simples e traços limpos. Sugestões de nomes de Lucide:

- Marca náutica: `waves`, `ship-wheel`, `anchor`.
- Embarcações: `ship`.
- Habilitações de amadores: `id-card`.
- Aquaviários: `anchor`.
- Segurança e privacidade: `shield-check`.
- Foto: `camera`; arquivo: `upload`, `file-up`.
- Processo novo: `file-plus`; formulários prontos: `file-check-2`.
- Créditos: `wallet`; histórico: `history`.
- Passos e navegação: `arrow-right`, `chevron-right`, `check`, `alert-circle`, `menu`.

Biblioteca React sugerida: `lucide-react`, **somente se compatível com o projeto existente**.

## 3. Responsividade e organização

- **Mobile-first**: coluna única com cartões empilhados; botões largos; fluxo tipo assistente (*wizard*).
- Desktop: conteúdo central com largura máxima confortável (~960–1120 px), sem esticar formulários de ponta a ponta; cartões de categorias podem usar 2–3 colunas onde couber.
- Cabeçalho enxuto com marca textual à esquerda e acesso à conta/menu à direita.
- Navegação curta; **sem dashboard administrativo cheio de gráficos**, sem menu lateral obrigatório no MVP.
- Em mobile, evitar tabelas extensas e diálogos que ocupem a tela; preservar o progresso ao trocar de etapa, enquanto a sessão existir.
- Estados necessários em toda tela: inicial, carregando, vazio, erro, sucesso e expiração de sessão.

## 4. Tela pública inicial (`/`)

**Objetivo:** explicar em poucos segundos o que a ferramenta faz e dar um próximo passo claro.

### Hero

- Fundo `navy`.
- Cabeçalho com ícone `waves`, nome provisório **Preenchimento Automático** e botão de menu/conta.
- Título: **“Documentos da Marinha sem complicação.”**
- Subtítulo: **“Escolha o serviço, envie as fotos dos documentos e receba os formulários preenchidos.”**
- CTA primário: **“Começar agora”** com `arrow-right`.

### Seção “O que você deseja fazer?”

Cartões/tarjas brancas sobre fundo `page-bg`, com ícone dentro de quadrado arredondado `mint-light`, título, descrição curta e `chevron-right`:

1. `ship` **Embarcações e jet skis** — “Transferência, inscrição e outros serviços.”
2. `id-card` **Arrais, Mestre e Capitão** — “Inscrição, renovação e segunda via.”
3. `anchor` **Aquaviários** — “CIR, certificados e documentos profissionais.”

**Nota de escopo:** as categorias podem aparecer como visão do produto, mas somente os serviços realmente implementados devem estar ativos. Itens futuros recebem “Em breve”, sem abrir um fluxo quebrado.

### Confiança

Cartão discreto `mint-light` com `shield-check`:

- Título: **“Seus documentos são temporários”**.
- Texto: **“Os arquivos são utilizados para preencher os formulários e excluídos após a conclusão ou expiração do processamento.”**
- Esta mensagem só pode aparecer se a exclusão e a política de retenção estiverem implementadas e testadas. Antes disso, usar texto que descreva fielmente a operação real.

## 5. Tela da conta (`/minha-conta`)

**Objetivo:** apresentar saldo e ações básicas, sem excesso de informação.

- Saudação: “Bem-vindo!” (sem exigir nome visível).
- Cartão de créditos em `mint-light`: **“Seus créditos”** + número em destaque + “processos disponíveis” + `wallet`.
- Botão **“Comprar créditos”** abre a tela de créditos quando o pagamento real estiver disponível; no MVP técnico, sinalizar de forma clara “Créditos de teste” e não fingir compra real.
- Ações grandes: **“Preencher documentos”** (`file-plus`) e **“Histórico de créditos”** (`history`).
- Apenas dados operacionais aparecem no histórico; nunca dados dos documentos pessoais processados.

## 6. Fluxo principal do preenchimento (5 passos)

Exibir progresso visual numerado e com texto: **1 Serviço → 2 Documentos → 3 Leitura → 4 Conferência → 5 Download**. Em tela estreita, mostrar “Etapa N de 5” e etapa atual para evitar apertar os rótulos.

### Etapa 1 — Escolher serviço

- Pergunta principal: **“O que você precisa fazer?”**
- Primeiro escolher categoria; depois serviço específico.
- Para o MVP, **transferência de jet ski** é o primeiro fluxo de ponta a ponta; demais serviços somente após validação normativa e implementação.
- Perguntas condicionais simples podem determinar quais formulários oficiais se aplicam. A seleção deve ser feita por **regras determinísticas versionadas**, nunca por decisão livre de LLM.
- Informar antes de iniciar quantos créditos serão cobrados (regra atual: 1 crédito por pacote de formulários de um serviço, sujeita à política definida no backend).

### Etapa 2 — Enviar documentos

- Título **“Envie os documentos”**.
- Instrução **“Tire uma foto ou escolha um arquivo do seu celular ou computador.”**
- Mostrar somente os documentos exigidos para aquele serviço, com rótulo e pequena explicação.
- Para cada documento, apresentar **“Tirar foto”** (`camera`) e **“Escolher arquivo”** (`upload`).
- Aceitar JPG, PNG e PDF conforme as validações reais do servidor. `accept` no frontend serve apenas de auxílio, não de barreira de segurança.
- Exibir arquivos recebidos, prévia segura quando possível, botão de trocar/remover, progresso de envio e mensagens claras para arquivo inválido.
- Não afirmar “Estamos processando” antes de confirmar upload completo.

### Etapa 3 — Leitura

- Mensagem: **“Estamos lendo as informações dos documentos.”**
- Indicador de progresso/etapas sem inventar porcentagens de precisão.
- OCR é executado **no servidor**, em worker isolado ou processo controlado, não no navegador.
- Usuário pode sair e voltar enquanto o trabalho é processado, desde que os arquivos já tenham sido enviados. Ao retornar, consultar o status do trabalho.
- Se falhar, mostrar **“Não conseguimos ler este documento. Tire outra foto ou preencha os dados manualmente.”**

### Etapa 4 — Conferir informações

- Título: **“Confira os dados encontrados”**.
- Dados recuperados aparecem em campos editáveis organizados por pessoa, endereço e embarcação.
- Marcar de forma textual campos **“Confirmado”**, **“Precisa conferir”** e **“Não encontrado”**; nunca tratar a saída de OCR como fato incontestável.
- Quando houver divergência, mostrar qual documento originou cada valor (sem gravar essa informação no banco permanente).
- Campos como CPF, número de casco, inscrição, motor e nomes exigem validação e, se necessário, confirmação manual.
- Botão primário: **“Confirmar e preparar formulários”**.
- Explicar a cobrança de crédito e solicitar confirmação antes da primeira geração definitiva; não cobrar por correções ou downloads do mesmo processamento durante sua janela válida.

### Etapa 5 — Download

- Título: **“Seus formulários estão prontos”**.
- Lista de PDFs gerados com nome claro e opção **“Baixar PDF”**; opcionalmente **“Baixar todos”** em ZIP.
- Mensagem: **“Confira os documentos antes de imprimir ou assinar.”**
- Não afirmar protocolo automático, aprovação pela Marinha ou validade jurídica garantida.
- Encerramento explícito da sessão de processamento e exclusão segura dos arquivos temporários; expiração automática para sessões abandonadas.
- Mostrar prazo de disponibilidade do download de acordo com a implementação real.

## 7. Tela de créditos (`/creditos`) — sem planos

- Apenas **créditos avulsos e pacotes pré-pagos**; sem mensalidade, assinatura, assentos ou planos empresariais.
- Comunicação: **“1 crédito = preenchimento de um processo”**, com explicação do que está incluído e das condições de correção.
- Exibir preço total, créditos incluídos, valor unitário equivalente, meios de pagamento disponíveis e política de uso antes da compra.
- Integrar pagamento real **somente quando o MVP comercial for implementado**. Nunca simular confirmação como se tivesse havido pagamento.
- Saldo no frontend é informativo: autorização e consumo devem ser verificados no backend.

## 8. Tela de histórico de créditos (`/creditos/historico`)

- Lista simples e legível: data, tipo (**Compra**, **Uso**, **Estorno**, **Ajuste**), quantidade e eventual referência financeira não sensível.
- Não mostrar documento, nome do titular do TIE nem informações do processo.
- Estados vazios com texto simples: **“Você ainda não tem movimentações.”**

## 9. Microtexto: palavras que usar e evitar

| Evitar | Preferir |
|---|---|
| Upload | Enviar foto / Escolher arquivo |
| OCR em andamento | Lendo as informações |
| Extração estruturada | Dados encontrados |
| Validar OCR | Conferir informações |
| Gerar artefatos | Preparar formulários |
| Token de uso | Crédito |
| Processamento concluído | Seus formulários estão prontos |

Mensagens de erro devem explicar **o problema e a ação que resolve**: “A foto ficou difícil de ler. Tire outra foto com boa iluminação.” Evitar códigos de erro sem contexto.

## 10. Componentes reutilizáveis sugeridos

- `AppHeader`
- `PrimaryButton`, `SecondaryButton`
- `ServiceCategoryCard`, `ServiceCard`
- `CreditBalanceCard`
- `WizardProgress`
- `DocumentUploadCard`
- `UploadStatus`
- `ExtractionField`
- `ReviewSection`
- `FormDownloadCard`
- `PrivacyNotice`
- `EmptyState`, `ErrorState`, `LoadingState`

Usar os componentes já existentes no projeto sempre que satisfizerem os requisitos; evitar duplicação e dependências visuais pesadas sem necessidade.

## 11. Segurança, privacidade e desempenho que o layout deve respeitar

- Não inserir conteúdo de documentos pessoais em URLs, analytics, logs, notificações ou estado persistente do navegador.
- Não persistir dados OCR em `localStorage`/`sessionStorage` por conveniência; manter apenas os identificadores opacos necessários para retomar uma sessão, se a arquitetura permitir.
- Proteger páginas e downloads com autenticação/autorização e tokens temporários; não utilizar IDs previsíveis.
- Validar extensão, MIME real, assinatura do arquivo, tamanho e número de páginas no backend; limitar taxas e concorrência.
- Limitar o upload de fotos grandes com compressão **opcional e cuidadosa**, sem comprometer legibilidade de dados críticos.
- Tratar o resultado de OCR como **entrada não confiável**; escapar conteúdo e validar antes de gerar PDF.
- Ações de pagamento e consumo de crédito devem ter tratamento idempotente e mensagens de falha claras.
- Não bloquear a UI durante OCR; usar fila e atualização de status. Não prometer processamento instantâneo.
- Suportar teclado, leitores de tela, foco visível, contraste AA e mensagens com `aria-live` quando apropriado.
- Preferir CSS e SVG/ícones leves a imagens pesadas; reduzir JavaScript inicial e carregar componentes conforme necessidade.

## 12. Critérios objetivos de aceite visual/UX

1. Em largura de **360 px**, o fluxo principal funciona sem rolagem horizontal e com botões utilizáveis.
2. Em desktop, os textos não ficam largos demais e o conteúdo principal permanece centralizado.
3. Uma pessoa consegue identificar em segundos o botão **“Começar agora”** e as três categorias na página inicial.
4. O fluxo mostra etapa atual, progresso e ação para voltar onde for seguro.
5. Upload funciona com foto do celular e arquivo JPG/PNG/PDF; estados e erros são compreensíveis.
6. Campos com resultado incerto não parecem confirmados; podem ser corrigidos antes de gerar PDF.
7. A operação de geração mostra o custo em créditos e não debita novamente quando o usuário corrige ou baixa o mesmo pacote.
8. A tela final permite baixar PDFs e deixa claro que o usuário deve revisá-los.
9. Não existem links ou botões que aparentem funcionar sem rota/ação implementada; recursos futuros são sinalizados.
10. Testar visualmente ao menos **360 px, 768 px e 1440 px**, além de navegação com teclado e contraste.

## 13. Instrução para o OpenCode

1. Ler `AGENTS.md`, `MVP_PLAN.md` e este `UI_DESIGN_GUIDE.md` antes de modificar o código.
2. Examinar a estrutura atual, versões, dependências e componentes disponíveis; **não presumir stack de UI já instalada**.
3. Criar a interface usando os tokens e o fluxo descritos, sem adicionar bibliotecas desnecessárias.
4. Implementar **uma tela/etapa por vez**, validando responsividade, acessibilidade, typecheck, testes e build conforme disponíveis.
5. Não criar API falsa para parecer que OCR/pagamentos estão funcionando. Para desenvolvimento isolado da interface, identificar claramente dados de demonstração e substituir por integrações reais na etapa correspondente.
6. Não alterar regras de segurança ou de cobrança para facilitar a implementação visual.
7. Ao concluir, listar arquivos alterados, verificações executadas, falhas encontradas, limitações e próximos passos.

> **Resumo visual:** azul profundo `#142F43` + verde-petróleo `#197A83` + superfícies claras + ícones Lucide náuticos + texto simples + wizard mobile-first. O objetivo é que o usuário escolha o serviço, envie fotos, confira os dados e baixe PDFs, sem precisar conhecer termos técnicos.
