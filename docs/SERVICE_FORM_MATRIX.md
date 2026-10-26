# Matriz de serviços e versões de formulários

Os formulários são cadastrados e mapeados individualmente. **Só depois**
o backend relaciona os serviços às versões oficiais verificadas; os serviços
não são donos dos PDFs e não criam cópias nem mapeamentos próprios.

| Serviço | ID | FormVersion ligada | Condição | Situação |
| --- | --- | --- | --- | --- |
| Transferência de moto aquática | `transferencia-moto-aquatica` | A confirmar com fonte oficial | A verificar por norma e jurisdição | `DRAFT` |

## Contrato

- `ServiceForm` associa `serviceId` e `formVersionId`, com `order` e condições.
- A mesma `formVersionId` pode ser associada a **vários** `serviceId`.
- As condições são comparações exatas com opções enumeradas em `ServiceQuestion`.
  Não executar código/expression arbitrária enviada pelo usuário.
- `DocumentRequirement` descreve **documentos de origem** que o usuário envia;
  é distinto de `FormDefinition` e não é um PDF de formulário em branco.
- Disponibilizar um serviço somente depois de confirmar os requisitos oficiais,
  validar suas condições e ter cada `FormVersion = VERIFIED` com
  exatamente um `FormMapping = APPROVED`.
- `validateCatalog` impede referências órfãs ou inconsistentes no catálogo,
  mas não substitui a revisão normativa humana.

## Evolução

Ao adicionar serviço novo, primeiro consultar o catálogo e reutilizar versões
existentes onde válidas. Pedir ao usuário somente os modelos ausentes ou
atualizados; não repetir o trabalho de mapeamento por serviço.
