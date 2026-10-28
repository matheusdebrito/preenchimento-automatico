# Paridade do modelo de português no OCR

## Evidência e limite do diagnóstico

O console fornecido pelo usuário confirmou uma nova extração com `person.cpf` e sem `person.fullName`, com `nameStage: label_not_detected`. Portanto, nesse retorno a ausência antecede o preenchimento dos inputs. O erro HTTP 404 não veio acompanhado da URL e não pode ser atribuído ao OCR.

O ambiente local anterior usou `por.traineddata` com SHA-256 `c4932b937207a9514b7514d518b931a99938c02a28a5a5a553f8599ed58b7deb`, 1.982.756 bytes e Git blob `e9f373e95c66b4bf557c263721ef31f78e5bc301`. O blob foi conferido no repositório oficial `tesseract-ocr/tessdata_fast`, tag 4.1.0. O APKBUILD do Alpine usa a família `tesseract-ocr/tessdata`, não `tessdata_fast`. A documentação oficial descreve diferenças entre essas famílias.

Isso confirma uma divergência na preparação dos ambientes, **não demonstra por si só a causa exata da foto não reconhecida no computador do usuário**. A imagem anexada ao chat tem 1355×2048 pixels e 590.861 bytes; não se presumiu igualdade com o arquivo original do repositório. Não foram adicionados dados pessoais nem novas imagens reais.

## Alteração

- O build da API instala o modelo português `tessdata_fast/4.1.0`, com verificação SHA-256 obrigatória antes da substituição atômica. Falha de rede/checksum interrompe o build, sem usar silenciosamente outro modelo.
- Preserva dados OSD e configurações TSV do pacote do sistema; define `TESSDATA_PREFIX=/usr/share/tessdata` no Docker.
- O CI Ubuntu usa o mesmo instalador e valida os mesmos bytes. O teste Compose passa a executar `extractText` e `suggestFields` **dentro da imagem final da API**, com o usuário não privilegiado, filesystem somente leitura e `/tmp` do Compose.
- O smoke usa somente uma PNG fictícia incluída, na orientação normal e girada 90°. Confere nome completo, CPF, `name_recognized`, `REVIEW_REQUIRED`, separação comprador/vendedor e limpeza dos temporários. Não lê `rg.jpg`, não aceita caminhos de documentos e não envia documentos a serviços externos.

Não foram relaxados os filtros de nomes nem as proteções contra filiação, conflitos e baixa confiança. A revisão humana continua obrigatória. O modelo não é declarado superior para todo documento; o objetivo é tornar verificável a correspondência entre o ambiente de validação e o runtime.

## Atualização e teste

Na main contendo esta alteração, preserve alterações locais e execute um comando por vez. Pare se ocorrer erro:

```powershell
git pull --ff-only
docker compose up -d --no-deps --build api
```

API e banco devem estar em execução para o segundo comando, pois `--no-deps` não inicia o banco. Não é necessário reconstruir o frontend para trocar o modelo do servidor.

Para verificar o runtime com a fixture fictícia, sem abrir formulário nem fornecer documento:

```powershell
docker compose exec -T api node scripts/smoke-ocr-runtime.mjs
```

O relatório `[OCR_RUNTIME_SMOKE]` inclui a versão do Tesseract, o hash do modelo e somente resultados sintéticos. Sucesso não prova leitura correta de toda foto ou funcionamento E2E no navegador. Para reavaliar a leitura na aplicação, inicie novo processo; recuperação de um job antigo não reexecuta o OCR. Cancelar o processo remove seus documentos e campos temporários.

## Validação desta entrega

Local: `sh -n` do instalador, `node --check` do smoke, comparação de hash/blob com o modelo oficial e quatro cenários do instalador com transporte simulado: download válido, reaproveitamento, checksum incorreto preservando destino e limpeza, destino ausente. Docker não está disponível localmente; a execução real do smoke depende do novo CI, a registrar no tracker. A foto do usuário não foi retestada no Docker nesta entrega.

Fontes primárias: https://tesseract-ocr.github.io/tessdoc/Data-Files ; https://github.com/tesseract-ocr/tessdata_fast/tree/4.1.0 ; https://gitlab.alpinelinux.org/alpine/aports/-/blob/master/community/tesseract-ocr/APKBUILD .
