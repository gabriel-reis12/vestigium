/*
 * Conteúdo configurável da landing page.
 *
 * TODO_COMERCIAL: preencher os valores nulos somente com dados oficiais.
 * Não inserir preço, disponibilidade, contato ou URLs provisórias no markup.
 */
window.VESTIGIUM_CONTENT = Object.freeze({
  product: {
    name: "Caso 01 — A Última Fotografia",
    price: "R$ 87,90",
    availability: null, // TODO_COMERCIAL: estoque, pré-venda ou lista de espera.
    players: "2–5 jogadores",
    duration: "45–60 minutos",
  },

  links: {
    checkout: null, // TODO_COMERCIAL: URL oficial de compra ou lista de espera.
    instagram: "https://www.instagram.com/vestigium.games/",
    contact: null, // TODO_COMERCIAL: e-mail ou página oficial de contato.
    privacy: null, // TODO_LEGAL: URL da política de privacidade.
    terms: null, // TODO_LEGAL: URL dos termos de uso.
  },

  gallery: [
    {
      src: "./imagens/gallery-envelope.png",
      width: 1122,
      height: 1402,
      alt: "Envelope confidencial fechado do Caso 01 sobre o arquivo Vestigium.",
      classification: "Arquivo selado",
      description: "Envelope fechado e identificado para abertura da investigação.",
      caption: "Envelope confidencial fechado do Caso 01",
    },
    {
      src: "./imagens/section-offer-product.png",
      width: 1536,
      height: 1024,
      alt: "Caixa física aberta do Caso 01 com dossiê, envelope lacrado, documentos e fotografias.",
      classification: "Revelação inicial",
      description: "Primeiro contato com o arquivo físico e seus materiais.",
      caption: "Apresentação física do arquivo A Última Fotografia",
    },
    {
      src: "./imagens/section-case-contents.png",
      width: 1586,
      height: 992,
      alt: "Inventário físico do Caso 01 organizado sobre uma mesa de investigação.",
      classification: "Conjunto físico",
      description: "Documentos, fotografias e evidências apresentados sem expor a solução.",
      caption: "Inventário completo dos materiais do caso",
    },
    {
      src: "./imagens/gallery-photographic-evidence.png",
      width: 1003,
      height: 1568,
      alt: "Conjunto de fotografias de uma cabana preso ao dossiê do Caso 01.",
      classification: "Evidência fotográfica",
      description: "Detalhe visual de fotografias integradas ao arquivo investigativo.",
      caption: "Registro fotográfico integrante da investigação",
    },
  ],

  faq: [
    {
      question: "Quantas pessoas podem jogar?",
      answer: "A experiência foi concebida para grupos de 2 a 5 jogadores.",
      status: "confirmed",
    },
    {
      question: "Quanto tempo dura a investigação?",
      answer: "A duração estimada é de 45 a 60 minutos, de acordo com o ritmo do grupo.",
      status: "confirmed",
    },
    {
      question: "É possível jogar sozinho?",
      answer: "Sim, é possível jogar sozinho, mas a experiência se torna muito mais rica e divertida quando jogada em grupo.",
      status: "confirmed",
    },
    {
      question: "Preciso usar celular ou computador?",
      answer: "Não é obrigatório o uso de celular para resolver o caso, mas haverá momentos em que ele ajudará a aprofundar a imersão.",
      status: "confirmed",
    },
    {
      question: "O jogo pode ser jogado novamente?",
      answer: "O jogo pode ser jogado mais de uma vez. A ordem das investigações e os detalhes só ficarão mais nítidos a cada nova partida.",
      status: "confirmed",
    },
    {
      question: "O conteúdo é adequado para iniciantes?",
      answer: "Iniciantes podem jogar sem medo, pois haverá cartões de ajuda para orientar a investigação sempre que necessário.",
      status: "confirmed",
    },
    {
      question: "O jogo contém spoilers ou temas sensíveis?",
      answer: "Não contém temas sensíveis nem violência explícita, sendo uma investigação focada em dedução lógica, análise documental e observação.",
      status: "confirmed",
    },
    {
      question: "Como funciona a entrega?",
      answer: "A entrega é feita via Correios para todo o Brasil, com pedidos despachados em até 48 horas após a confirmação.",
      status: "confirmed",
    },
  ],
});
