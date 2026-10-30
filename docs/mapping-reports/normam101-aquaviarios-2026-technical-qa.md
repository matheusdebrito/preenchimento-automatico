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
| Anexo 1-E | B00D4869DEDA33EFCC1B8F0A6283A5AF5794FD5A12E6AC0BCA13A11DA7009D9B | recorte direto das duas páginas oficiais |
| Anexo 1-K | 973BDBE9BB5C4AA0C9B05C8665AE7EBA0902E7E7BEDC663AE9E4A0C11E6B4390 | página oficial preservada em A4 e normalizada para imagem monocromática legível |
| Anexo 1-L | 401109FF4F65F10D1544CDC76D0C748CF5B69824F041D0E3FA8806C713EAD2DF | página oficial preservada em A4 e normalizada para imagem monocromática legível |

A normalização dos anexos 1-K e 1-L não redesenha o formulário: ela rasteriza a própria página oficial, preservando geometria e conteúdo para estabilizar o template estático.

## Decisões normativas

- O 1-E só é associado a emissão, segunda via e revalidação de certificação.
- O 1-K atual oferece opções DPC-1031, DPC-1033, DPC-1034 e CIR. Não há opção DPC-1032 no formulário.
- O 1-L é reutilizado nos processos que aceitam declaração de residência.
- Em pedidos de 2ª via por dano, o 1-K não é gerado; a NORMAM prevê a declaração para extravio, roubo ou furto.
- DPC-1033 não é oferecido no fluxo de revalidação: a NORMAM informa que a Autoridade Marítima Brasileira não revalida esse certificado, exigindo novo reconhecimento após revalidação no país de origem.

## Mapeamento

Os mapeamentos são por coordenadas sobre os templates estáticos. Todos os campos de geração permanecem opcionais, seguindo a regra geral do produto: campos ausentes devem ir para revisão e podem permanecer em branco se o usuário decidir continuar.

A homologação final depende do pipeline de CI `pdf-mapping-visual`, que gera amostras sintéticas, preenche os PDFs e renderiza o resultado para inspeção/regressão.
