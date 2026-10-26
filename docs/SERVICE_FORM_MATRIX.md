# Matriz de serviços e formulários

Esta matriz vincula serviços a **versões de modelos**, inclusive com
condições. Não pressupõe que um modelo usado em uma norma possa ser
substituído por outro visualmente semelhante.

| Serviço | ID | Modelo | Condição | Situação |
| --- | --- | --- | --- | --- |
| Transferência de propriedade de moto aquática | `transferencia-moto-aquatica` | A confirmar após consulta oficial | A verificar (jurisdição e caso concreto) | `DRAFT` — não liberado |

## Regras de associação

- Um serviço pode ter vários formulários; cada formulário pode pertencer a vários serviços.
- A associação `ServiceForm` guarda `serviceId`, `formTemplateId`,
  condições e ordem de geração.
- As condições aceitam apenas respostas predefinidas e validadas no backend;
  não executar expressões dinâmicas ou código recebido do cliente.
- Um serviço só pode ser marcado `AVAILABLE` quando seus requisitos e
  formulários efetivamente necessários estiverem validados e os modelos
  aplicáveis estiverem `APPROVED`.
- A decisão de geração e seu custo são conferidos no servidor.
- Reutilizar campos semânticos e motor de PDF; manter mapeamentos
  distintos quando os PDFs oficiais diferirem.

## Próxima verificação documental

Confirmar NORMAM-212/DPC vigente, orientação da Capitania aplicável,
requisitos da transferência de moto aquática, variantes do procedimento
e links oficiais de cada formulário exigido. Sem isso, manter o serviço
apenas como demonstração, sem gerar documentos reais.
