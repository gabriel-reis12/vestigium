# Histórico do projeto

## 2026-08-03 — Correção do handoff entre introdução e conteúdo

- Corrigida a saída rápida da sequência para que o quadro final seja pintado imediatamente mesmo quando a rolagem salta muitos quadros.
- Mantido o último quadro da abertura protegido no cache, evitando o retorno visual ao primeiro quadro durante a transição.
- Corrigida a altura intrínseca do símbolo da navegação, que mantinha `1254px` do atributo HTML e fazia o cabeçalho cobrir praticamente toda a viewport.
- O menu principal agora surge com `72px` ao fim da introdução, permanece fixo no topo durante a landing page e não cria uma seção intermediária.
- Removida da abertura a assinatura duplicada da marca; a ação “Pular introdução” foi isolada no canto superior direito.
- Corrigida também a dimensão intrínseca do símbolo do rodapé, eliminando a área vazia de mais de uma viewport e reunindo marca, slogan, navegação e assinatura no mesmo bloco.
- A primeira seção passa a ser revelada no mesmo instante em que o conteúdo assume a viewport, eliminando a faixa vazia após a introdução.
- Adicionado um cenário automatizado específico para validar quadro final, posição do header e visibilidade imediata do relatório inicial.

## 2026-08-03 — Assets oficiais e nitidez da abertura

- Distribuídas as novas fotografias pelas seções de apresentação, inventário, procedimento, experiência, nível, público, galeria e oferta, preservando os arquivos originais sem recompressão.
- Integrado o símbolo oficial da Vestigium à introdução, navegação, rodapé, favicon e metadados sociais, sem redesenhar ou distorcer a marca.
- Reorganizada a galeria com os quatro novos enquadramentos, dimensões declaradas, `object-fit: contain` e carregamento sob demanda.
- Corrigida a suavização excessiva da abertura removendo a mistura entre quadros consecutivos, alinhando o desenho a pixels inteiros e ampliando a densidade do canvas em telas móveis de alta resolução.
- Mantidos fallbacks estáticos, suporte a `prefers-reduced-motion` e carregamento lazy para as fotografias abaixo da primeira dobra.

## 2026-08-03 — Fechamento formal do relatório

- Transformado “O caso está esperando” em uma sequência final única com marcador vertical, etiqueta, título, texto e CTA revelados em ordem.
- Reforçado o botão “Abrir o Caso 01” com maior presença e uma linha interna que surge somente em hover ou foco, sem pulsação contínua.
- Criada uma faixa de transição documental com “Arquivo encerrado”, classificação do Caso 01 e paginação do relatório.
- Reorganizado o rodapé em marca, navegação, canais e links institucionais, preservando todos os destinos no arquivo configurável e sem inventar URLs.
- Refinados espaçamento, estados de hover/foco, composição móvel em uma coluna e estado estático para `prefers-reduced-motion`, sem parallax.

## 2026-08-03 — Interrogatório rápido acessível

- Aprimorada a seção “Perguntas frequentes” mantendo duas colunas e título sticky somente no desktop.
- Substituído o acordeão nativo por botões com `aria-expanded`, `aria-controls`, regiões identificadas e abertura independente de múltiplas respostas.
- Adicionados transição curta de altura e opacidade, troca real entre `+` e `−`, foco visível e identificação “Resposta registrada”.
- Reforçados contraste das divisórias, tamanho de perguntas e respostas e largura de leitura, com comportamento sticky removido em tablet e celular.
- Mantidas as respostas não confirmadas como pendentes em `content.js`, agora acompanhadas de marcadores `TODO_PRODUTO` ou `TODO_COMERCIAL` específicos.

## 2026-08-03 — Oferta em arquivo confidencial

- Reestruturada a seção comercial do Caso 01 como uma página clara extraída de um arquivo, preservando a quebra visual da narrativa.
- Reforçados a etiqueta de disponibilidade, a identificação `VSTG · CASO 01` e os quatro atributos confirmados do produto, organizados em duas colunas no desktop.
- Transformado o painel comercial em dois papéis sobrepostos com textura, bordas e sombras físicas discretas, sem aparência de card SaaS.
- Atualizado o CTA para “Entrar na lista de investigadores”, mantendo preço e disponibilidade em definição e sem simular um cadastro inexistente.
- Adicionados preenchimento progressivo no CTA, entrada única do painel, estado estático para `prefers-reduced-motion` e composição em coluna única no celular.

## 2026-08-03 — Mesa editorial de evidências

- Redesenhada a “Galeria do produto” como uma grade editorial assimétrica `7/5` e `8/4`, com margens, bordas e legendas padronizadas.
- Preservados os quadros 180, 225, 270 e 300 na ordem de envelope selado, revelação inicial, conjunto físico e detalhe complementar.
- Substituído o recorte agressivo por enquadramento integral com `object-fit: contain`, mantendo envelope, logo e título do caso visíveis.
- Adicionadas legendas monoespaçadas com número, classificação e descrição, slots de substituição e indicação “Examinar evidência”.
- Refinado o lightbox acessível com legenda detalhada, ESC, setas, retorno de foco e navegação pelo teclado; todas as imagens abaixo da dobra mantêm lazy loading.

## 2026-08-03 — Perfis de investigação

- Redesenhada a seção “Para quem segue as pistas” para apresentar quatro formas distintas de viver a investigação.
- Reduzido o espaço superior dos blocos e ampliada a presença visual dos números `01–04`.
- Adicionadas texturas decorativas próprias para fragmentos de texto, linhas de conexão, coordenadas e recorte desfocado do quadro 270 existente.
- Incluídas anotações finais específicas e estados de hover/foco com iluminação âmbar, linha vermelha e deslocamento sutil da descrição.
- Mantidas quatro colunas no desktop, grade `2×2` no tablet e cartões horizontais empilhados no celular, sem carrossel.

## 2026-08-03 — Painel técnico da investigação

- Ampliado e reequilibrado o painel “Nível da investigação”, mantendo título e descrição à esquerda no desktop.
- Reforçados contraste, espaçamento e tamanhos dos critérios, classificações, duração e número de jogadores.
- Convertidas as barras contínuas em faixas segmentadas com escala de referência e marcadores verticais, sem aparência de nota comercial.
- Preservado e refinado o código `ANL/01 · VESTIGIUM` e o alinhamento dos cantos vermelhos do painel.
- Implementada uma sequência única de contorno, preenchimento das barras e entrada dos valores, com estado integral para `prefers-reduced-motion`.

## 2026-08-03 — Momento emocional da experiência

- Redesenhada a seção “Uma história que acontece sobre a mesa” como o ápice emocional da landing page, preservando o texto e o quadro 225 existente.
- Reenquadrado o fundo para manter envelope e dossiê reconhecíveis, com gradientes direcionais que protegem a leitura sem apagar a fotografia.
- Transformados os cinco benefícios em observações técnicas conectadas ao produto por linhas e pequenos registros vermelhos.
- Implementada uma revelação narrativa única — título, explicação, linhas e anotações — além de push-in de até `3,5%` enquanto a seção está visível.
- Desativado o movimento da imagem em tablet, celular e `prefers-reduced-motion`, preservando o conteúdo integral nesses contextos.

## 2026-08-03 — Procedimento investigativo progressivo

- Transformada a seção “Como funciona” em uma progressão visual de três etapas, preservando integralmente os textos principais.
- Adicionados linha de protocolo animada, números com maior presença e divisórias inspiradas em marcações técnicas de relatório.
- Criados em CSS os símbolos abstratos de lacre, documento analisado e conexão de evidências, sem imagens ou bibliotecas adicionais.
- Incluídas microfrases reveladas por hover ou foco, com navegação por teclado e iluminação âmbar discreta.
- Convertida a sequência para uma trilha vertical em tablet e celular, com estado estático completo para `prefers-reduced-motion`.

## 2026-08-03 — Inventário interativo de evidências

- Redesenhada a seção “O que existe dentro do caso” como um inventário técnico integrado à mesa de análise.
- Preservada a imagem existente com enquadramento completo em `object-fit: contain` e um ponto de substituição identificado para a futura fotografia profissional.
- Adicionados seis registros interativos com descrições sem spoilers, seleção por ponteiro, foco e teclado, além de marcadores conectados à área visual.
- Ajustados espaçamento, proporção das colunas e ordem responsiva para manter a imagem antes do inventário em tablet e celular.
- Incluída a observação editorial: “Conteúdo apresentado sem revelar elementos decisivos da investigação.”

## 2026-08-03 — Abertura formal do relatório

- Refinada a seção “Todo detalhe pode ser uma pista” sem alterar sua mensagem ou informações confirmadas.
- Adicionados código técnico, título revelado por linhas e marcação vermelha discreta no texto principal.
- A ficha do Caso 01 recebeu textura, iluminação, dobra de papel, sombra física e inclinação sutil por ponteiro limitada a `1,2°` no desktop.
- Implementada uma sequência única de entrada: etiqueta, título, ficha e carimbo por último, com fallback completo para `prefers-reduced-motion`.
- Ajustadas largura das colunas, quebras de texto, espaçamento vertical e apresentação móvel.

## 2026-08-03 — Guardrails visuais e técnicos

- Registradas em `.planning/design-guardrails.md` as regras permanentes de identidade visual, responsividade, movimento, acessibilidade, performance e validação para as próximas alterações.
- Nenhuma seção ou comportamento da interface foi alterado nesta etapa.

## 2026-08-01 — Landing page oficial do Caso 01

- Preservada e integrada a abertura quadro a quadro com os 300 arquivos existentes em `imagens/`.
- Adicionados progresso de abertura, acesso rápido ao conteúdo, fallback estático e suporte a `prefers-reduced-motion`.
- Criada a landing page completa do produto “Caso 01 — A Última Fotografia” em HTML semântico e responsivo.
- Implementadas as seções de caso, evidências, funcionamento, experiência, nível, público, galeria, comunidade, oferta, FAQ, chamada final e rodapé.
- Adicionados lightbox acessível, FAQ nativo em acordeão, navegação por teclado, foco visível e revelações suaves por interseção.
- Centralizados preço, disponibilidade, links e respostas comerciais pendentes em `content.js`, sem dados fictícios.
- Configurados metadados essenciais de SEO e compartilhamento; canonical, favicon oficial e dados estruturados permanecem pendentes de assets/dados oficiais.
- Adicionados scripts sem dependências para lint estrutural, verificação do schema de conteúdo, testes, build estático e QA em navegador.
- Gerado build de produção em `dist/`.

## 2026-08-01 — Abertura inicial

- Criada animação de rolagem suave em canvas a partir da sequência de 300 quadros JPEG.
- Adicionado cache limitado de quadros e servidor local Node na porta `4173`.
