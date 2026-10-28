# Console OCR no QA local

Instrumentação solicitada pelo usuário em 27/10/2026 para investigar nome ausente no formulário. Não altera as regras do OCR nem comprova correção da extração.

## Uso

Com a aplicação em QA local (`DEV_QA_PREVIEW=true` no backend, `NODE_ENV=development`), abra a página em `http://127.0.0.1:8080` ou `http://localhost:8080`. Abra F12 > Console e filtre por `[OCR]`.

Ao analisar um documento de identidade, aparece:

```text
[OCR] Extracao concluida - dados retornados pela API
```

O JSON contém `fields`, `sources` e `diagnostics`, com os valores retornados pela API antes do preenchimento dos inputs. Confira `fields["person.fullName"]`, `fields["seller.fullName"]` e `diagnostics[].nameStage`. Campo ausente não é inventado.

Ao recarregar um processo existente, o log é:

```text
[OCR] Processo recuperado - sem nova leitura; pode incluir edicoes manuais
```

Essa recuperação usa os dados já armazenados no job. Não dispara OCR novamente e não prova que os valores atuais foram obtidos pelo OCR, pois o usuário pode ter revisado os campos.

## Atualização

Na main atualizada, com API e banco já rodando, reconstruir apenas o frontend:

```powershell
git pull --ff-only
docker compose up -d --no-deps --build frontend
```

Interromper se o pull falhar; preservar mudanças locais. Atualizar a aba com Ctrl+F5. Não é necessário reconstruir a API para esta instrumentação.

## Limites e privacidade

O log requer origem loopback e pelo menos um diagnóstico de identidade com `nameStage`, que o backend só emite em QA. Sem documento de identidade, sem esse marcador, fora de localhost/127.0.0.1/[::1] ou em respostas de produção, não imprime. O build estático do Docker local funciona; não depende de `import.meta.env.DEV`.

Mostra campos **já processados e filtrados pela API**, não o texto bruto do Tesseract, a imagem, IDs do job ou credenciais. Não modifica valores nem dispara requisições adicionais. Não adiciona logs no servidor nem grava os campos no armazenamento do navegador.

Os valores ficam visíveis no console. Usar dados fictícios. Não publicar prints ou copiar logs contendo nome/CPF reais; limpar o console após o teste e desativar QA ao encerrar. A instrumentação é temporária para diagnóstico e não substitui a conferência humana.
