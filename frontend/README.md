# Frontend — Preenchimento Automático

Interface do MVP de preenchimento automático de formulários náuticos. Implementa o fluxo
visual completo descrito em `UI_DESIGN_GUIDE.md`, sem integrar OCR, autenticação, pagamentos ou
geração de PDF.

## Stack

- React 19 + TypeScript (strict)
- Vite 8
- React Router 7
- Lucide Icons
- CSS próprio com design tokens (sem framework de UI)
- Vitest + Testing Library

## Como executar

```bash
cd frontend
npm install
npm run dev
```

O servidor de desenvolvimento é exibido no terminal (por padrão `http://localhost:5173`).

## Scripts

| Script              | Descrição                                      |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento com HMR           |
| `npm run typecheck` | Verificação de tipos sem emitir arquivos       |
| `npm run lint`      | ESLint                                         |
| `npm test`          | Testes unitários e de fluxo                    |
| `npm run build`     | Typecheck + build de produção em `dist/`       |
| `npm run preview`   | Prévia local do build de produção              |

## Rotas

| Rota                       | Tela                                      |
| -------------------------- | ----------------------------------------- |
| `/`                        | Página inicial                            |
| `/minha-conta`             | Conta e saldo ilustrativo                 |
| `/creditos`                | Modelo de créditos e pacotes              |
| `/creditos/historico`      | Histórico ilustrativo de movimentações    |
| `/preencher/servico`       | Etapa 1 — escolha do serviço              |
| `/preencher/documentos`    | Etapa 2 — envio local de documentos       |
| `/preencher/leitura`       | Etapa 3 — prévia da leitura               |
| `/preencher/conferencia`   | Etapa 4 — conferência e correção          |
| `/preencher/download`      | Etapa 5 — prévia dos formulários          |
| `*`                        | Página não encontrada                     |

## Limites da demonstração

- Nenhum arquivo é enviado a servidores; a validação de JPG/PNG/PDF e o limite de 10 MB são
  apenas uma prévia local e não substituem a validação do backend.
- O fluxo do wizard usa dados fictícios e mantém o estado somente em memória. Ao sair da rota,
  as prévias locais são descartadas.
- Nenhum crédito é consumido e nenhum pagamento é simulado.
- Nenhum PDF é gerado. O botão de download permanece desabilitado até a confirmação dos modelos
  oficiais.
- O conteúdo de demonstração está identificado na interface. Não use documentos reais.
- O protótipo não representa a Marinha do Brasil, não protocola processos e não garante aprovação.

## Privacidade

O histórico de créditos exibe somente data, tipo, quantidade e referência não sensível. Dados de
documentos não são persistidos nem enviados. A política definitiva de retenção e exclusão deverá
ser implementada junto ao backend.

## Estrutura

```text
src/
  components/   layout e componentes reutilizáveis
  data/         catálogo e dados fictícios da demonstração
  features/     fluxo do wizard e validação local de arquivos
  hooks/        hooks compartilhados
  lib/          utilitários
  pages/        páginas estáticas e inicial
  styles/       tokens, base, componentes e páginas
```

## Validação executada

- `npm run typecheck`
- `npm run lint`
- `npm test` — 20 testes em 6 arquivos
- `npm run build`
- Lighthouse (acessibilidade, boas práticas e SEO) nas telas inicial, serviço, documentos e
  conferência
- Verificação de layout em 360 px, 768 px e 1440 px, sem rolagem horizontal
