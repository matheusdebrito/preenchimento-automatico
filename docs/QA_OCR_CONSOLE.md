# Diagnóstico de OCR no navegador — descontinuado

O fluxo descrito anteriormente dependia do antigo `DEV_QA_PREVIEW` e de logs temporários
no console do navegador. Esse modo foi removido do runtime.

O diagnóstico atual deve ser feito pelos campos e diagnósticos seguros devolvidos pela API
para a própria interface de revisão, sem `console.log` de dados extraídos e sem promover
serviços ou mappings por variável de ambiente.

Este arquivo permanece apenas como registro histórico da abordagem anterior.
