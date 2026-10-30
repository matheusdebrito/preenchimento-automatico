# Validação antes de Pull Request

O objetivo é evitar usar o primeiro CI do PR como ambiente de descoberta de erros previsíveis.

## 1. Validação local

Em cada pacote alterado:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Os testes do extrator OpenAI usam respostas simuladas. Não é necessário configurar uma chave real nem consumir créditos para executar a suíte automatizada.

## 2. Validação da branch

Depois do push, abrir o PR como rascunho e aguardar o workflow CI concluir para o head atual da branch. O CI executa auditoria das dependências, typecheck, lint, testes, build, integração PostgreSQL, validação Compose e inspeção normativa/visual aplicável.

Só marcar o PR como pronto após todos os jobs obrigatórios passarem. Se algum gate não puder ser executado, declarar a limitação e manter o PR não validado.

## 3. Alterações na análise documental

Para mudanças em `openai-document-extractor.ts`, perfis documentais, `allowedFieldIds`, validações ou contratos:
- adicionar testes determinísticos com Responses API simulada;
- testar origem autorizada, campos não permitidos, respostas malformadas, CPF/data inválidos, valores ausentes e conflitos;
- não enviar documentos reais ou dados pessoais ao CI;
- não usar uma chamada real à API como substituto de testes determinísticos.

Antes de produção, realizar homologação controlada com documentos sintéticos e amostras autorizadas, chave de projeto própria, limites de custo e revisão humana.

## 4. Alteração de expectativas documentais

Antes de alterar uma expectativa:
1. reproduzir com fixture sintética ou amostra pública autorizada;
2. identificar a causa da diferença;
3. criar regressão determinística;
4. corrigir o algoritmo, prompt, schema ou política de campo;
5. só então ajustar a expectativa;
6. executar o CI completo da branch.

Nunca alterar a expectativa apenas para fazer o CI passar.

## 5. PR

O CI do PR é gate obrigatório, mas não substitui revisão visual dos PDFs, homologação normativa, avaliação de privacidade ou teste manual em navegador/celular.
