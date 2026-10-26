# Modelo de relatório de mapeamento de formulário PDF

> Copiar este documento para um relatório **por FormVersion + FormMapping**.
> Não registrar dados pessoais reais. Antes de marcar APPROVED, obter revisão humana.

## Identificação e evidências

- ID lógico do formulário:
- ID da versão PDF (`FormVersion.id`):
- Revisão interna / revisão oficial:
- Norma e jurisdição:
- Fonte oficial (URL e data conferida):
- SHA-256:
- Arquivo original:
- Tipo (AcroForm / estático / híbrido):
- Total de páginas e dimensões:
- ID/revisão do mapeamento (`FormMapping`):
- Responsável pela revisão / data:

## Inventário dos campos

| Campo semântico | Página (índice desde 0) | PDF: nome AcroForm ou coordenadas em pontos | Obrigatório? | Automático / revisão / pendente | Observações |
| --- | --- | --- | --- | --- | --- |
| (preencher após inspeção) | | | | | |

**Para PDFs estáticos:** usar coordenadas PDF em pontos, origem inferior esquerda;
registrar `x`, `y`, largura máxima, fonte e tamanho. Cada coordenada
deve ser conferida sobre imagem renderizada da página, sem modificar o original.

## Validação automatizada

- [ ] Verificado hash e metadados do PDF original.
- [ ] Campos AcroForm inventariados ou posições dos campos estáticos identificadas.
- [ ] Todos os campos necessários presentes; ausência documentada e bloqueante quando obrigatória.
- [ ] PDF gerado usando apenas dados sintéticos.
- [ ] Testados textos longos, acentuação, data, números, caixas de seleção e campos condicionais aplicáveis.
- [ ] Todas as páginas renderizadas e inspecionadas sem recortes, sobreposição ou mudança do conteúdo oficial.
- [ ] Testes de regressão e validação do catálogo executados e resultados anexados.

## Resultado e aprovação

- Campos mapeados automaticamente:
- Campos corrigidos manualmente:
- Campos pendentes:
- Falhas conhecidas:
- Evidências de teste (arquivos sintéticos, captura de renderização, comando e resultado):
- Decisão: `DRAFT` / `TESTED` / `APPROVED`
- Revisor humano e data:
- Declaração: aprovação do **mapeamento técnico**, não garantia de aceitação pela Marinha.
