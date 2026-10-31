# NORMAM-101/DPC 2026 - Aquaviários - QA técnico

## Fonte normativa

Templates extraídos da NORMAM-101/DPC fornecida para homologação em 30/10/2026.

- Anexo 1-E - Modelo de Requerimento de Certificação - páginas 165 e 166 do PDF.
- Anexo 1-K - Declaração de Extravio, Roubo ou Furto - página 179 do PDF.
- Anexo 1-L - Declaração de Residência - página 181 do PDF.

A inspeção visual confirmou que o Anexo 1-E é específico de certificação. Ele não foi reutilizado como requerimento genérico para CIR, transferência de jurisdição, ascensão de categoria ou outros processos nos quais a NORMAM-101 apenas exige "requerimento do interessado".

## Templates versionados

| Formulário | SHA-256 | Observação |
| --- | --- | --- |
| Anexo 1-E | 536293EABB34EE5624C7D765BF3DE2B97DEEC449B591A7D9905405F86AD84100 | duas páginas oficiais extraídas e normalizadas para template estático |
| Anexo 1-K | 4D17057BFF256919E8381BE1310449609D86701427331736127A959D8FAD599A | página oficial preservada em A4 e normalizada para template estático |
| Anexo 1-L | 401109FF4F65F10D1544CDC76D0C748CF5B69824F041D0E3FA8806C713EAD2DF | página oficial preservada em A4 e normalizada para template estático |

A normalização não redesenha os formulários: preserva a página oficial e sua geometria para estabilizar o preenchimento por coordenadas.

## Decisões normativas

- O 1-E só é associado a emissão, segunda via e revalidação de certificação.
- O 1-K atual oferece opções DPC-1031, DPC-1033, DPC-1034 e CIR. Não há opção DPC-1032 no formulário.
- O 1-L é reutilizado nos processos que aceitam declaração de residência.
- Em pedidos de 2ª via por dano, o 1-K não é gerado; a NORMAM prevê a declaração para extravio, roubo ou furto.
- DPC-1033 não é oferecido no fluxo de revalidação: a NORMAM informa que a Autoridade Marítima Brasileira não revalida esse certificado, exigindo novo reconhecimento após revalidação no país de origem.

## Mapeamento

Os mapeamentos são por coordenadas sobre os templates estáticos. Todos os campos de geração permanecem opcionais, seguindo a regra geral do produto: campos ausentes devem ir para revisão e podem permanecer em branco se o usuário decidir continuar.

## Homologação visual manual

Em 30/10/2026 foram geradas amostras sintéticas sobre os três templates e renderizadas para inspeção visual, sem depender do CI:

- **1-E:** nome, nascimento, nacionalidade, naturalidade, sexo, telefone, CIR, categoria, endereço completo, observações, motivo da solicitação, modelo do certificado e local/data foram reposicionados após a primeira renderização.
- **1-K:** identidade, órgão expedidor, CPF, endereço, documento perdido, número, data/relato do fato e CP/DL/AG + data foram revisados visualmente. O checkbox do documento foi reposicionado dentro dos parênteses.
- **1-L:** os dados pessoais permaneceram nas linhas corretas; rua/número/complemento ficam na linha oficial de endereço e bairro/cidade/UF/CEP usam a linha imediatamente inferior, preservando todos os campos editáveis; cidade e data da assinatura foram separados conforme o layout impresso.

As amostras confirmaram ausência de sobreposição material nos campos revisados. A validação integrada da aplicação ficará para a etapa de teste manual combinada para o módulo de Aquaviários.


## Requerimento auxiliar do interessado - revisão de composição

A revisão dos serviços identificou que a NORMAM-101 exige requerimento do interessado em diversos procedimentos, mas não publica um modelo padronizado para todos eles. O Anexo 1-E é específico de certificação e não deve ser reutilizado como requerimento genérico.

Foi criado o formulário **Requerimento do interessado (modelo auxiliar não oficial)** como modelo auxiliar do produto. O próprio PDF informa que não é formulário da Marinha, não representa deferimento e deve ser conferido e assinado pelo interessado. Não usa brasão, selo ou identidade visual da Autoridade Marítima.

- Uma página A4.
- Campos editáveis: CP/DL/AG destinatária, nome, CPF, identidade, endereço, local e data.
- Assunto e finalidade são preenchidos pelo catálogo de acordo com o serviço.
- Todos os campos permanecem opcionais.
- SHA-256: C0D7EFD0B476519380D16C284C4F5FFC63E7622AF0ACDB268667B4AFE6A6A32B.

### Escopo atual de serviços publicado

A decisão de produto de 30/10/2026 limita a categoria Aquaviários a sete serviços: inscrição inicial da CIR, 2ª via da CIR, revalidação da CIR, ascensão de categoria, emissão de certificado, 2ª via de certificado e revalidação de certificado. Transferência de jurisdição, transferência de categoria/grupo e homologação do LRM não fazem parte da oferta atual; seus vínculos de serviço foram removidos do catálogo. Formulários e campos compartilhados só permanecem quando ainda atendem aos sete serviços selecionados.

### Matriz de formulários gerados

| Serviço | Pacote gerado |
| --- | --- |
| Inscrição inicial / emissão da CIR | Anexo 1-L; modelo auxiliar somente para 4º Grupo (Mergulhadores) e 5º Grupo (Práticos) |
| 2ª via da CIR | Modelo auxiliar + Anexo 1-L; Anexo 1-K somente para extravio, roubo ou furto |
| Revalidação da CIR | Modelo auxiliar + Anexo 1-L |
| Ascensão de categoria | Modelo auxiliar + Anexo 1-L |
| Emissão de certificado | Anexo 1-E oficial + Anexo 1-L |
| 2ª via de certificado | Anexo 1-E oficial + Anexo 1-L; Anexo 1-K somente para extravio, roubo ou furto |
| Revalidação de certificado | Anexo 1-E oficial + Anexo 1-L |

### Documentos de entrada e formulários de saída

A aplicação aceita somente cinco categorias de entrada para a OpenAI:
- identidade: RG, CNH ou CIN;
- comprovante de residência;
- CHA;
- CIR;
- TIE/TIEM.

Todos os uploads são opcionais e cada fonte só é exibida quando pode preencher
ao menos um campo mapeado nos formulários selecionados. CPF separado, GRU,
atestados, certificados de curso/competência, comprovantes de embarque, LRM,
documentos migratórios, escolaridade, histórico escolar, CTPS, registro de
ocorrência e certificado de competência não são uploads da aplicação.

O catálogo não publica uma lista de documentos que a Marinha pode exigir para
protocolar o processo. Ele mantém apenas as associações entre cada serviço e
os formulários/anexos oficiais a preencher. A interface apresenta os nomes e
referências normativas desses formulários de saída. O upload da CIR usa política
conservadora para sugerir nome do titular, número da CIR e categoria somente
quando esses campos existem no PDF aplicável; os candidatos continuam sujeitos
à revisão humana.

A ascensão de categoria pergunta grupo profissional, mas não exibe checklists
de comprovantes de curso ou embarque. A finalidade do requerimento auxiliar
permanece editável para o usuário informar categoria atual e pretendida. A
fotografia prevista em alguns processos é capturada no atendimento e não é
solicitada como upload.

**Pendente de confirmação:** a Parte III (documentos anexados) do Anexo 1-E não possui
mapeamento automático homologado; depois do download deve ser conferida e preenchida
manualmente conforme o caso. A elegibilidade da segunda via do DPC-1032 também exige
verificação normativa específica. Nenhuma coordenada oficial foi inventada.

A revalidação do DPC-1033 continua indisponível, pois a NORMAM-101 informa que a AMB não revalida esse modelo.


**Ponto de atenção - revalidação DPC-1032:** a regra geral do artigo 1.22 inclui o modelo DPC-1032, mas a NORMAM-101 não apresenta um subitem de documentação equivalente aos itens 1.22.2 (DPC-1031) e 1.22.3 (DPC-1034). O catálogo mantém a opção e sinaliza a necessidade de confirmar documentos específicos com a CP/DL/AG, sem inventar uma lista normativa.
