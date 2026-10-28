# Processo de validação antes de Pull Request

O objetivo deste processo é evitar usar o primeiro CI do PR como ambiente de descoberta de erros previsíveis.

## 1. Validação determinística local

Para alterações em OCR e entendimento de documentos:

```bash
cd backend
npm ci
npm run verify:document-understanding
```

Esse comando executa typecheck, lint, testes determinísticos de `document-understanding` e build.

Para alterações gerais do backend, manter também `npm test`. Para frontend alterado, executar typecheck, lint, testes e build em `frontend/`.

## 2. Validação da branch no mesmo ambiente do CI

Depois do push da branch e **antes de abrir o PR**, executar o workflow manual `Pre-PR OCR` na branch.

Com GitHub CLI:

```bash
gh workflow run pre-pr-ocr.yml --ref NOME_DA_BRANCH
```

Ou pela interface do GitHub: **Actions -> Pre-PR OCR -> Run workflow -> selecionar a branch**.

Esse workflow é separado do CI principal para não aumentar o risco de quebrar o pipeline de PR. Ele executa os testes determinísticos de document-understanding e o OCR real dos documentos públicos de referência com PaddleOCR.

## 3. Regra especial para OCR/documentos

Alterações em qualquer um destes caminhos exigem o `Pre-PR OCR` da branch:

- `ocr-service/`
- `backend/src/modules/document-understanding/`
- módulos OCR em `backend/src/modules/jobs/`
- `documentos/`
- regras de aliases, geometria, validadores ou fixtures de referência

A validação deve incluir o job `reference-documents`, porque testes sintéticos não reproduzem necessariamente a fragmentação real produzida pelo PaddleOCR.

## 4. Como alterar expectativas de referência

Antes de mudar um teste de referência de `FOUND` para `NOT_FOUND` ou o inverso:

1. observar o comportamento real do documento;
2. identificar qual evidência/linha/método gera o resultado;
3. criar uma regressão determinística que reproduza a causa;
4. corrigir o algoritmo;
5. só então ajustar a expectativa do documento real;
6. executar o CI completo da branch.

Nunca alterar a expectativa apenas para fazer o CI passar.

## 5. PR

Abrir o PR somente depois dos gates anteriores verdes. O CI do PR continua existindo como verificação independente, mas não deve ser a primeira execução da mudança.
