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
