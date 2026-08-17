# Guardrails de design e implementação — Vestigium

Estas diretrizes são obrigatórias para todas as próximas alterações da landing page.

## Processo antes de cada alteração

1. Inspecionar a implementação vigente, incluindo markup, conteúdo configurável, estilos, animações, assets e comportamento responsivo.
2. Preservar componentes e convenções existentes sempre que atenderem ao pedido.
3. Não substituir assets nem arquivos sem necessidade.
4. Manter imagens preparadas para troca simples, com `object-fit`, `aspect-ratio`, dimensões explícitas, responsividade e carregamento otimizado.

## Identidade visual permanente

- Preto profundo e grafite como base.
- Branco envelhecido e bege de papel para contraste e superfícies editoriais.
- Vermelho escuro usado apenas como destaque.
- Tipografia serifada editorial nos títulos.
- Tipografia monoespaçada em etiquetas, números, códigos e dados técnicos.
- Linhas finas, carimbos, códigos e detalhes de arquivo usados com moderação.
- Textura pontilhada e granulação discretas.
- Atmosfera investigativa sofisticada, minimalista e cinematográfica.

## O que evitar

- Interface policial genérica.
- Estética cyberpunk, neon ou excessivamente tecnológica.
- Excesso de vermelho ou decoração.
- Ícones genéricos ou coloridos.
- Sombras artificiais e exageradas.
- Bordas arredondadas modernas sem justificativa.
- Animações chamativas ou sem função narrativa.

## Movimento e interação

- Usar animações de scroll somente quando reforçarem significado, hierarquia ou transição narrativa.
- Preservar a abertura quadro a quadro e seu fallback estático.
- Pausar trabalho visual fora da viewport sempre que possível.
- Respeitar integralmente `prefers-reduced-motion`.
- Manter foco visível, navegação por teclado e áreas de toque adequadas.

## Responsividade e performance

- Validar desktop, tablet e celular após cada mudança relevante.
- Garantir legibilidade, contraste, ausência de overflow horizontal e conteúdo importante visível.
- Simplificar efeitos em telas menores e dispositivos limitados.
- Evitar dependências grandes; priorizar CSS e APIs nativas.
- Preservar lazy loading abaixo da dobra e dimensões explícitas de mídia.

## Validação obrigatória

Executar, quando aplicável:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `node execution/browser-qa.mjs` para alterações visuais ou interativas relevantes

Ao concluir, informar resumidamente os arquivos modificados e os resultados das verificações.
