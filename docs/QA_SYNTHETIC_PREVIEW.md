# Simulação local de ponta a ponta — fotos fictícias → OCR → PDFs de AMOSTRA

## Finalidade e limites

Este é um **ambiente de QA local**, desligado por padrão, para testar a jornada real do frontend, backend Fastify, Tesseract, revisão humana e o motor `pdf-lib`. O serviço `qa-synthetic-moto` é **fictício**, separado de `transferencia-moto-aquatica`.

**Não use RG, CPF, fotos, TIE ou comprovantes reais nesta simulação.** A prévia usa temporariamente apenas os mapeamentos reduzidos dos anexos **2-A e 2-B**. Os seis `FormMapping` originais continuam `DRAFT`; este teste não vale como revisão humana ou homologação perante a Marinha. Os dois PDFs da amostra têm marca d'água visível **AMOSTRA - DADOS FICTICIOS - NAO UTILIZAR** em cada página.

- Somente habilitado em `NODE_ENV=development` e mediante configuração explícita `DEV_QA_PREVIEW=true`. A configuração é recusada em produção.
- O modo QA aparece separado dos "Serviços homologados" na página inicial e não libera o serviço oficial de transferência.
- Não cobra créditos (`creditCost=0`) e não registra recibo financeiro, sem afetar o saldo da conta.
- Os arquivos e campos seguem temporários no servidor: TTL deslizante de 20 minutos, teto de uma hora por job, com limpeza.
- Nunca exponha os containers locais diretamente à internet; o Compose vincula API e frontend a `127.0.0.1`.

## Como iniciar na sua máquina

Pré-requisitos: Docker Compose e um arquivo `.env` privado a partir do `.env.example` (senha local do PostgreSQL preenchida).

1. Edite o `.env` e defina `DEV_QA_PREVIEW=true` (não versionar nem enviar o `.env`).
2. Na raiz do projeto execute `docker compose up -d --build`.
3. Acesse **http://127.0.0.1:8080**, crie uma conta de **teste** em `/entrar` e volte à página inicial.
4. Abra o bloco **Teste técnico com dados fictícios** e selecione **Simulação técnica — moto aquática**.
5. Anexe uma **foto fictícia** de identidade (PNG/JPEG) e um **PDF/foto fictícia de TIE**; opcionalmente anexe documento fictício de venda e endereço.
6. Confira as sugestões do OCR e **corrija manualmente** qualquer campo ausente ou errado. Complete pelo menos nome fictício do comprador e nome fictício da moto aquática.
7. Clique em gerar. O fluxo de QA deve produzir os dois PDFs **2-A e 2-B**, obrigatoriamente marcados como AMOSTRA; teste o download e depois encerre/apague o job.
8. Ao terminar o QA, volte `DEV_QA_PREVIEW=false` no `.env` e execute `docker compose up -d --build` para desabilitar a simulação.

### Exemplo de textos totalmente inventados

Crie em editor de texto um PDF de teste com fonte grande, salve e, se quiser testar fotos, fotografe uma **impressão fictícia** (nunca um documento de pessoa real):

**Identidade fictícia do comprador:**

```text
DOCUMENTO FICTICIO - APENAS TESTE
NOME: MARIA DE SOUZA
CPF: 123.456.789-09
```

**TIE fictício:**

```text
TITULO FICTICIO - NAO EXISTE
NOME DA EMBARCACAO: MAR TESTE
INSCRICAO: RJ123456
HIN: BR-TESTE-123456
ANO DE CONSTRUCAO: 2022
COMPRIMENTO (M): 3,25
LOTACAO: 3
```

**Documento de venda fictício (opcional):**

```text
NOTA FISCAL: NF-2026-123
DATA DA VENDA: 15/10/2026
VALOR DA VENDA: R$ 15.900,00
```

Os números e nomes acima são **exemplos sintéticos**, não cadastros oficiais. Mesmo se o OCR sugerir valores, todos exigem revisão humana; CPFs sintáticos não comprovam identidade.

## Evidências automatizadas e critérios

- `backend/src/modules/catalog/qa-preview.test.ts`: catálogo QA coerente e nenhum status oficial alterado.
- `backend/src/routes/qa-preview.integration.test.ts`: gera foto PNG sintética a partir de PDF, faz OCR, revisão, download de PDF com marca AMOSTRA e confere consumo **zero** de créditos, em PostgreSQL real.
- `backend/src/config/env.test.ts`: a opção QA é desativada por padrão e não pode rodar em produção.
- `frontend/src/features/real/LiveFlowPage.test.tsx`: testa opção de câmera traseira e fluxo de revisão.
- `GitHub Actions` executa testes de backend/frontend e integração com ferramentas Poppler/Tesseract. O resultado deve ser confirmado para o último commit; não presumir CI verde com base em commits anteriores.

## Pendências de homologação

Este modo serve para você **experimentar tecnicamente** o fluxo com documentos inventados. **Não é MVP pronto para clientes reais**. Ainda faltam: atesto humano dos seis PDFs oficiais, regras condicionais confirmadas por serviço, testes reais de imagem em múltiplos aparelhos, isolamento do OCR, revisão LGPD e hardening, E2E em navegador real, além de revisão formal da política de créditos.

Leia também `PROJECT_TRACKER.md` e o relatório de pendências destinado à revisão do próximo dia.
