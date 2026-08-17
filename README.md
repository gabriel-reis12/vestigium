# 🗂️ VESTIGIUM — Caso 01: A Última Fotografia

> **Arquivo Confidencial VSTG-01**  
> Uma experiência investigativa cinematográfica, física e digital.  
> Desenvolvida com **Vanilla HTML5/CSS3**, **GSAP 3** e uma sequência imersiva de 267 quadros em canvas.

---

## 🔍 Sobre o Projeto

**Vestigium** é uma experiência imersiva de investigação documental e dedução lógica. Os jogadores recebem um dossiê físico com fotografias, relatórios oficiais, recortes de jornais, pistas lacradas e registros confidenciais para solucionar o mistério por trás de *A Última Fotografia*.

Esta landing page foi concebida com direção de arte editorial e cinematográfica inspirada em arquivos secretos, salas de interrogatório e relatórios periciais:
- **Iluminação Âmbar e Preto Profundo** (#080807), texturas de papel de arquivo e carimbos de classificação técnica.
- **Abertura Cinematográfica**: Controle de 267 quadros renderizados progressivamente em <canvas> sincronizados com a rolagem do usuário.
- **Animações GSAP Refinadas**: Uso de ScrollTrigger, CustomEase (*dossier easing*) e transições sem sobreposições ou dependências de terceiros.
- **Zero CDNs / 100% Autônomo**: Todas as bibliotecas, fontes e mídias rodam localmente com zero requisições externas para máxima privacidade e estabilidade.

---

## ⚡ Tecnologias Utilizadas

- **Core**: HTML5 Semântico, CSS3 Moderno (Custom Properties, Grid, Flexbox, Container Queries).
- **Animações**: [GSAP 3](https://gsap.com/) com plugins locais ScrollTrigger, SplitText e CustomEase.
- **Canvas Engine**: Sequenciador de frames de alta precisão com pré-carregamento otimizado.
- **Arquitetura de Dados**: [content.js](content.js) imutável com separação entre conteúdo, metadados e lógica visual.
- **Servidor Local**: Servidor HTTP nativo em Node.js ([server.mjs](server.mjs)).
- **Qualidade & QA**:
  - 
ode:test para testes semânticos e integridade de assets.
  - Testes E2E e visuais automatizados via Chrome DevTools Protocol (CDP) cobrindo 31 cenários (Desktop, Tablet, Mobile e Reduced Motion).

---

## 📋 Especificações do Caso 01

| Parâmetro | Detalhe Oficial |
| :--- | :--- |
| **Título** | Caso 01 — A Última Fotografia |
| **Investigadores** | 2 a 5 pessoas (ou individual) |
| **Duração Estimada** | 45 a 60 minutos |
| **Preço Oficial** | R$ 87,90 |
| **Dificuldade** | Nível 3 / Intermediário (com cartões de auxílio gradual) |
| **Classificação** | Livre de temas sensíveis e violência explícita |
| **Envio** | Todo o Brasil via Correios (Despacho em até 48h úteis) |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior.

### 1. Clonar o Repositório
`ash
git clone https://github.com/gabriel-reis12/vestigium.git
cd vestigium
`

### 2. Instalar Dependências
`ash
npm install
`

### 3. Iniciar o Servidor de Desenvolvimento
`ash
npm start
`
Acesse a aplicação no navegador em: **http://localhost:4173** (ou http://127.0.0.1:4173).

---

## 🧪 Testes e Homologação

O projeto conta com uma pipeline rigorosa de qualidade:

`ash
# Executa a verificação estrutural e linting
npm run lint

# Executa a verificação de tipos do schema de conteúdo
npm run typecheck

# Executa os testes unitários da arquitetura semântica
npm test

# Gera o build estático de distribuição
npm run build

# Executa a bateria completa de QA em browser real via Chrome CDP (31 cenários)
node execution/browser-qa.mjs
`

---

## 📁 Estrutura de Pastas

`	ext
vestigium/
├── .agents/                 # Diretrizes e regras de engenharia de software
├── .planning/               # Documentação técnica e design guardrails
├── dist/                    # Pacote estático gerado para produção
├── execution/               # Scripts de build, validação e browser QA via CDP
│   ├── browser-qa.mjs       # Bateria de 31 testes visuais/comportamentais
│   ├── build.mjs            # Gerador da pasta de distribuição
│   ├── typecheck.mjs        # Validador de tipos do content.js
│   └── validate.mjs         # Linter e validador de sintaxe
├── imagens/                 # Imagens do caso e os 267 quadros da abertura
├── tests/                   # Testes automatizados com Node Test Runner
│   └── landing.test.mjs     # Testes semânticos e integridade de conteúdo
├── vendor/                  # GSAP 3 e plugins oficiais empacotados localmente
├── video/                   # Mídias em alta resolução de demonstração
├── content.js               # Fonte de dados e textos da experiência
├── index.html               # Arquitetura semântica da landing page
├── package.json             # Metadados e scripts de automação
├── script.js                # Lógica de interação, timelines GSAP e canvas
├── server.mjs               # Servidor HTTP local rápido e seguro
└── styles.css               # Design system confidencial e responsivo
`

---

## ♿ Acessibilidade e Preferências do Usuário

- **prefers-reduced-motion**: Ao detectar preferência de movimento reduzido, desativa automaticamente o canvas em scroll, paralaxes e efeitos intensos, apresentando um pôster estático e layout totalmente legível.
- **Navegação por Teclado**: Todos os accordions, carrosséis de dossiês e botões de chamada possuem estados claros de foco visível (:focus-visible) e atributos ARIA adequados.
- **Contraste e Legibilidade**: Cores calibradas dentro dos padrões WCAG AA sobre papel escovado e fundos periciais.

---

## 📄 Licença e Confidencialidade

Projeto desenvolvido para a **Vestigium**. Todos os direitos reservados.
