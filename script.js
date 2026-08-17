document.documentElement.classList.add("js");

const content = window.VESTIGIUM_CONTENT;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (value, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));

if (typeof window.gsap !== "undefined") {
  const plugins = [];
  if (typeof window.ScrollTrigger !== "undefined") plugins.push(window.ScrollTrigger);
  if (typeof window.CustomEase !== "undefined") plugins.push(window.CustomEase);
  if (typeof window.SplitText !== "undefined") plugins.push(window.SplitText);
  window.gsap.registerPlugin(...plugins);

  if (typeof window.CustomEase !== "undefined") {
    window.CustomEase.create("dossier", "0.22, 1, 0.36, 1");
    window.CustomEase.create("stamp", "0.34, 1.56, 0.64, 1");
    window.CustomEase.create("reveal", "0.16, 1, 0.3, 1");
  }
}

function setupConfigurableContent() {
  if (!content) return;

  const priceElement = document.querySelector("[data-product-price]");
  const availabilityElement = document.querySelector("[data-product-availability]");

  if (priceElement) {
    priceElement.textContent = content.product.price ?? "Preço em definição";
  }
  if (availabilityElement) {
    availabilityElement.textContent =
      content.product.availability ?? "Disponibilidade em definição";
  }

  for (const element of document.querySelectorAll("[data-current-year]")) {
    element.textContent = new Date().getFullYear();
  }

  for (const link of document.querySelectorAll("[data-config-link]")) {
    const key = link.dataset.configLink;
    const url = content.links[key];

    if (url) {
      link.href = url;
      if (/^https?:/i.test(url)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      continue;
    }

    link.dataset.unavailable = "true";
    link.setAttribute("aria-disabled", "true");
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showStatus(
        key === "checkout"
          ? "O canal oficial de compra ou lista de espera ainda será configurado."
          : "Este link oficial ainda será configurado.",
      );
    });
  }
}

let statusTimer;

function showStatus(message) {
  const status = document.querySelector("#action-status");
  if (!status) return;

  window.clearTimeout(statusTimer);
  status.textContent = message;
  status.classList.add("is-visible");
  statusTimer = window.setTimeout(() => status.classList.remove("is-visible"), 4200);
}

function setupFAQ() {
  const list = document.querySelector("#faq-list");
  if (!list || !content) return;

  content.faq.forEach((item, index) => {
    const faqItem = document.createElement("article");
    const heading = document.createElement("h3");
    const trigger = document.createElement("button");
    const question = document.createElement("span");
    const symbol = document.createElement("span");
    const panel = document.createElement("div");
    const body = document.createElement("div");
    const bodyContent = document.createElement("div");
    const registration = document.createElement("span");
    const answer = document.createElement("p");
    const number = String(index + 1).padStart(2, "0");
    const questionId = `faq-question-${number}`;
    const answerId = `faq-answer-${number}`;

    faqItem.className = "faq-item";
    faqItem.dataset.status = item.status;
    heading.className = "faq-item__heading";
    trigger.className = "faq-item__trigger";
    trigger.type = "button";
    trigger.id = questionId;
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", answerId);
    question.className = "faq-item__question";
    question.textContent = item.question;
    symbol.className = "faq-item__symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = "+";
    panel.className = "faq-item__body";
    panel.id = answerId;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", questionId);
    panel.setAttribute("aria-hidden", "true");
    body.className = "faq-item__body-inner";
    bodyContent.className = "faq-item__content";
    registration.className = "faq-item__registration";
    registration.textContent = "Resposta registrada";
    answer.textContent = item.answer;
    bodyContent.append(registration, answer);

    if (item.status === "pending") {
      const pending = document.createElement("span");
      pending.className = "faq-pending";
      pending.textContent = "Informação pendente de confirmação";
      bodyContent.append(pending);
    }

    const setExpanded = (expanded) => {
      faqItem.classList.toggle("is-open", expanded);
      trigger.setAttribute("aria-expanded", String(expanded));
      panel.setAttribute("aria-hidden", String(!expanded));
      symbol.textContent = expanded ? "−" : "+";

      if (reducedMotionQuery.matches || !window.gsap) {
        panel.style.height = expanded ? "auto" : "0px";
        panel.style.opacity = expanded ? "1" : "0";
      } else {
        if (expanded) {
          window.gsap.killTweensOf(panel);
          panel.style.height = "auto";
          const targetHeight = panel.scrollHeight;
          panel.style.height = "0px";
          panel.style.opacity = "0";
          window.gsap.to(panel, {
            height: targetHeight,
            opacity: 1,
            duration: 0.35,
            ease: "dossier",
            onComplete: () => {
              panel.style.height = "auto";
              if (window.ScrollTrigger) window.ScrollTrigger.refresh();
            },
          });
        } else {
          window.gsap.killTweensOf(panel);
          window.gsap.to(panel, {
            height: 0,
            opacity: 0,
            duration: 0.25,
            ease: "power2.inOut",
            onComplete: () => {
              if (window.ScrollTrigger) window.ScrollTrigger.refresh();
            },
          });
        }
      }
    };

    trigger.addEventListener("click", () => {
      setExpanded(trigger.getAttribute("aria-expanded") !== "true");
    });

    trigger.append(question, symbol);
    heading.append(trigger);
    body.append(bodyContent);
    panel.append(body);
    faqItem.append(heading, panel);
    list.append(faqItem);

    if (index === 0) setExpanded(true);
  });
}

function setupGallery() {
  const grid = document.querySelector("#gallery-grid");
  const dialog = document.querySelector("#gallery-lightbox");
  const dialogImage = document.querySelector("#lightbox-image");
  const dialogCaption = document.querySelector("#lightbox-caption");

  if (!grid || !dialog || !content) return;

  let currentIndex = 0;
  let returnFocus = null;

  function updateDialog(index) {
    currentIndex = (index + content.gallery.length) % content.gallery.length;
    const item = content.gallery[currentIndex];
    dialogImage.src = item.src;
    dialogImage.alt = item.alt;
    dialogCaption.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(
      content.gallery.length,
    ).padStart(2, "0")} · ${item.classification} — ${item.description}`;
  }

  function openDialog(index, trigger) {
    returnFocus = trigger;
    updateDialog(index);

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    dialog.querySelector(".lightbox__close").focus();
  }

  content.gallery.forEach((item, index) => {
    const button = document.createElement("button");
    const media = document.createElement("span");
    const image = document.createElement("img");
    const inspect = document.createElement("span");
    const caption = document.createElement("span");
    const number = document.createElement("span");
    const captionCopy = document.createElement("span");
    const classification = document.createElement("strong");
    const description = document.createElement("span");
    const formattedIndex = String(index + 1).padStart(2, "0");

    button.className = "gallery-item";
    button.type = "button";
    button.dataset.reveal = "";
    button.dataset.assetSlot = `gallery-${formattedIndex}`;
    button.setAttribute(
      "aria-label",
      `Examinar evidência ${formattedIndex}: ${item.classification}. ${item.description}`,
    );
    media.className = "gallery-item__media";
    image.src = item.src;
    image.alt = item.alt;
    image.width = item.width;
    image.height = item.height;
    image.loading = "lazy";
    image.decoding = "async";
    inspect.className = "gallery-item__inspect";
    inspect.textContent = "Examinar evidência";
    caption.className = "gallery-item__caption";
    number.className = "gallery-item__number";
    number.textContent = formattedIndex;
    captionCopy.className = "gallery-item__caption-copy";
    classification.textContent = item.classification;
    description.textContent = item.description;

    media.append(image, inspect);
    captionCopy.append(classification, description);
    caption.append(number, captionCopy);
    button.append(media, caption);
    button.addEventListener("click", () => openDialog(index, button));
    grid.append(button);
  });

  dialog.querySelector(".lightbox__close").addEventListener("click", () => dialog.close());
  dialog
    .querySelector(".lightbox__nav--previous")
    .addEventListener("click", () => updateDialog(currentIndex - 1));
  dialog
    .querySelector(".lightbox__nav--next")
    .addEventListener("click", () => updateDialog(currentIndex + 1));

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") updateDialog(currentIndex - 1);
    if (event.key === "ArrowRight") updateDialog(currentIndex + 1);
  });

  dialog.addEventListener("close", () => {
    dialogImage.src = "";
    returnFocus?.focus();
  });
}

function setupEvidenceInventory() {
  const inventory = document.querySelector("[data-evidence-inventory]");
  const visual = inventory?.querySelector("#evidence-visual");
  const buttons = [...(inventory?.querySelectorAll("[data-evidence-index]") ?? [])];

  if (!inventory || !visual || !buttons.length) return;

  function activate(button) {
    const index = button.dataset.evidenceIndex;
    visual.dataset.activeIndex = index;

    buttons.forEach((candidate) => {
      const selected = candidate === button;
      candidate.setAttribute("aria-pressed", String(selected));
      candidate.closest("li").classList.toggle("is-active", selected);
    });
  }

  buttons.forEach((button, index) => {
    button.addEventListener("mouseenter", () => activate(button));
    button.addEventListener("focus", () => activate(button));
    button.addEventListener("click", () => activate(button));
    button.addEventListener("keydown", (event) => {
      const navigationKeys = ["ArrowDown", "ArrowUp", "Home", "End"];
      if (!navigationKeys.includes(event.key)) return;

      event.preventDefault();
      let targetIndex = index;
      if (event.key === "ArrowDown") targetIndex = (index + 1) % buttons.length;
      if (event.key === "ArrowUp") targetIndex = (index - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") targetIndex = 0;
      if (event.key === "End") targetIndex = buttons.length - 1;
      buttons[targetIndex].focus();
    });
  });
}

function setupCaseFileTilt() {
  const caseFile = document.querySelector("[data-case-file]");

  if (!caseFile || reducedMotionQuery.matches) return;

  let frameRequest = null;
  let pointerX = 0;
  let pointerY = 0;

  function renderTilt() {
    frameRequest = null;
    if (window.innerWidth <= 1000) return;

    const bounds = caseFile.getBoundingClientRect();
    const normalizedX = clamp((pointerX - bounds.left) / bounds.width, 0, 1) * 2 - 1;
    const normalizedY = clamp((pointerY - bounds.top) / bounds.height, 0, 1) * 2 - 1;

    caseFile.style.setProperty("--paper-tilt-x", `${(-normalizedY * 1.1).toFixed(2)}deg`);
    caseFile.style.setProperty("--paper-tilt-y", `${(normalizedX * 1.2).toFixed(2)}deg`);
  }

  function resetTilt() {
    if (frameRequest !== null) window.cancelAnimationFrame(frameRequest);
    frameRequest = null;
    caseFile.style.setProperty("--paper-tilt-x", "0deg");
    caseFile.style.setProperty("--paper-tilt-y", "0deg");
  }

  caseFile.addEventListener(
    "mousemove",
    (event) => {
      if (window.innerWidth <= 1000) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frameRequest === null) frameRequest = window.requestAnimationFrame(renderTilt);
    },
    { passive: true },
  );
  caseFile.addEventListener("mouseleave", resetTilt);
  window.addEventListener("blur", resetTilt);
}

function setupSmoothAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      const headerOffset = 72;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - (hash === "#conteudo" ? 0 : headerOffset);

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: reducedMotionQuery.matches ? "auto" : "smooth",
      });

      if (
        target.getAttribute("tabindex") === null &&
        target.tagName !== "A" &&
        target.tagName !== "BUTTON"
      ) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    });
  });
}

function setupSiteHeader() {
  const site = document.getElementById("conteudo");
  const header = document.querySelector(".site-header");
  const openingReport = site?.querySelector("[data-report-reveal]");
  if (!site || !header) return;

  let frameRequest = null;

  const updateHeaderState = () => {
    frameRequest = null;
    const entered = site.getBoundingClientRect().top <= 0;
    site.classList.toggle("site--entered", entered);
    document.documentElement.classList.toggle("site-entered", entered);
    if (entered) openingReport?.classList.add("is-visible");
  };

  const queueUpdate = () => {
    if (frameRequest !== null) return;
    frameRequest = window.requestAnimationFrame(updateHeaderState);
  };

  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
  updateHeaderState();
}

function setupIntro() {
  const intro = document.querySelector("[data-intro]");
  const sticky = intro?.querySelector(".intro__sticky");
  const canvas = document.querySelector("#sequence");
  const fallback = intro?.querySelector(".intro__fallback");
  const context = canvas?.getContext("2d", { alpha: false });

  if (!intro || !sticky || !canvas || !fallback) return;

  const lowPowerDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  const saveData = navigator.connection?.saveData === true;
  const staticIntro = reducedMotionQuery.matches || saveData || lowPowerDevice || !context;
  const skipButton = intro.querySelector("[data-skip-intro]");

  try {
    if (window.sessionStorage.getItem("vestigium-intro-seen")) {
      skipButton.textContent = "Ir direto ao caso";
    }
  } catch {
    // O acesso rápido continua disponível mesmo quando sessionStorage é bloqueado.
  }

  skipButton.addEventListener("click", () => {
    try {
      window.sessionStorage.setItem("vestigium-intro-seen", "true");
    } catch {
      // Sem impacto funcional.
    }
  });

  if (staticIntro) {
    fallback.src = "./imagens/ezgif-frame-267.png";
    intro.dataset.renderMode = "static";
    intro.classList.add("intro--static", "intro--case-visible");
    intro.style.setProperty("--case-reveal", "1");
    return;
  }

  const FRAME_COUNT = 267;
  const FRAME_CACHE_LIMIT = 267;
  const FRAME_LOOKAHEAD = 30;
  const EASING = 14;
  const cache = new Map();
  const loading = new Map();

  let targetFrame = 0;
  let renderedFrame = 0;
  let lastPaintedFrame = -1;
  let lastTimestamp = performance.now();
  let viewportWidth = 0;
  let viewportHeight = 0;
  let introVisible = true;
  let animationFrameId = null;
  let resizeQueued = false;
  let warmTimer;

  intro.dataset.renderMode = "discrete";

  const frameSource = (index) =>
    `./imagens/ezgif-frame-${String(index + 1).padStart(3, "0")}.png`;

  function loadFrame(index) {
    const boundedIndex = Math.max(0, Math.min(FRAME_COUNT - 1, index));

    if (cache.has(boundedIndex)) return Promise.resolve(cache.get(boundedIndex));
    if (loading.has(boundedIndex)) return loading.get(boundedIndex);

    const request = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";

      image.onload = () => {
        image.dataset.frameIndex = String(boundedIndex);
        cache.set(boundedIndex, image);
        loading.delete(boundedIndex);
        pruneCache(Math.round(renderedFrame));
        lastPaintedFrame = -1;
        intro.classList.add("intro--canvas-ready");
        resolve(image);
      };

      image.onerror = () => {
        loading.delete(boundedIndex);
        resolve(null);
      };

      image.src = frameSource(boundedIndex);
    });

    loading.set(boundedIndex, request);
    return request;
  }

  function pruneCache(center) {
    if (cache.size <= FRAME_CACHE_LIMIT) return;

    const removable = [...cache.keys()]
      .filter((index) => index !== 0 && index !== FRAME_COUNT - 1)
      .sort((a, b) => Math.abs(b - center) - Math.abs(a - center));

    while (cache.size > FRAME_CACHE_LIMIT && removable.length) {
      const index = removable.shift();
      const image = cache.get(index);
      cache.delete(index);
      image.src = "";
    }
  }

  function warmFrames(center, direction = 1) {
    for (let offset = 0; offset <= FRAME_LOOKAHEAD; offset += 1) {
      const primary = center + offset * direction;
      const secondary = center - offset * direction;

      if (primary >= 0 && primary < FRAME_COUNT) loadFrame(primary).catch(() => {});
      if (secondary >= 0 && secondary < FRAME_COUNT && secondary !== primary) {
        loadFrame(secondary).catch(() => {});
      }
    }
  }

  function nearestLoadedFrame(index) {
    if (cache.has(index)) return cache.get(index);

    let nearestImage = cache.get(0) ?? null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const [loadedIndex, image] of cache) {
      const distance = Math.abs(loadedIndex - index);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestImage = image;
      }
    }

    return nearestImage;
  }

  function resizeCanvas() {
    viewportWidth = sticky.clientWidth;
    viewportHeight = sticky.clientHeight;
    const pixelRatioLimit = viewportWidth <= 720 ? 3 : 2;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, pixelRatioLimit);
    canvas.width = Math.round(viewportWidth * pixelRatio);
    canvas.height = Math.round(viewportHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    lastPaintedFrame = -1;
  }

  function paintImage(image) {
    if (!image) return;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const scale = Math.max(
      viewportWidth / image.naturalWidth,
      viewportHeight / image.naturalHeight,
    );
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const x = Math.round((viewportWidth - width) / 2);
    const y = Math.round((viewportHeight - height) / 2);

    context.drawImage(image, x, y, width, height);
  }

  function render(frame) {
    const frameIndex = Math.round(frame);
    const image = cache.get(frameIndex) ?? nearestLoadedFrame(frameIndex);

    context.globalAlpha = 1;
    context.fillStyle = "#070706";
    context.fillRect(0, 0, viewportWidth, viewportHeight);
    paintImage(image);
    intro.dataset.renderedFrame = String(Number(image?.dataset.frameIndex ?? frameIndex) + 1);
  }

  function introProgress() {
    const range = Math.max(1, intro.offsetHeight - window.innerHeight);
    return clamp((window.scrollY - intro.offsetTop) / range);
  }

  function updateFromScroll() {
    const progress = introProgress();
    const previousTarget = targetFrame;
    const reveal = clamp((progress - 0.79) / 0.16);
    const promptOpacity = clamp(1 - progress * 5);

    targetFrame = progress * (FRAME_COUNT - 1);
    intro.style.setProperty("--case-reveal", reveal.toFixed(4));
    intro.style.setProperty("--case-offset", `${((1 - reveal) * 34).toFixed(2)}px`);
    intro.style.setProperty("--prompt-opacity", promptOpacity.toFixed(4));
    intro.classList.toggle("intro--case-visible", reveal > 0.1);
    intro.classList.toggle("intro--controls-hidden", progress > 0.96);

    const direction = targetFrame >= previousTarget ? 1 : -1;
    const center = Math.round(targetFrame);
    const frameJump = Math.abs(targetFrame - renderedFrame);

    loadFrame(center)
      .then(() => {
        if (Math.round(targetFrame) !== center) return;
        if (frameJump > 8 || progress > 0.97) renderedFrame = targetFrame;
        render(renderedFrame);
        lastPaintedFrame = Math.round(renderedFrame);
      })
      .catch(() => {});
    loadFrame(center + direction).catch(() => {});

    window.clearTimeout(warmTimer);
    warmTimer = window.setTimeout(() => warmFrames(center, direction), 45);

    if (progress > 0.98) {
      try {
        window.sessionStorage.setItem("vestigium-intro-seen", "true");
      } catch {
        // Sem impacto funcional.
      }
    }
  }

  function animate(timestamp) {
    animationFrameId = null;
    if (!introVisible) return;

    const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    const smoothing = 1 - Math.exp(-EASING * deltaTime);
    renderedFrame += (targetFrame - renderedFrame) * smoothing;

    if (Math.abs(targetFrame - renderedFrame) < 0.002) renderedFrame = targetFrame;

    const paintKey = Math.round(renderedFrame);
    if (paintKey !== lastPaintedFrame) {
      render(renderedFrame);
      lastPaintedFrame = paintKey;
    }

    lastTimestamp = timestamp;
    animationFrameId = window.requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (animationFrameId !== null) return;
    lastTimestamp = performance.now();
    animationFrameId = window.requestAnimationFrame(animate);
  }

  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        introVisible = entry.isIntersecting;
        if (introVisible) {
          updateFromScroll();
          startAnimation();
        } else if (animationFrameId !== null) {
          window.cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      },
      { threshold: 0.001 },
    );
    visibilityObserver.observe(intro);
  }

  window.addEventListener("scroll", updateFromScroll, { passive: true });
  window.addEventListener("resize", () => {
    if (resizeQueued) return;
    resizeQueued = true;
    window.requestAnimationFrame(() => {
      resizeCanvas();
      updateFromScroll();
      resizeQueued = false;
    });
  });

  resizeCanvas();
  updateFromScroll();
  renderedFrame = targetFrame;

  loadFrame(Math.round(targetFrame)).then(() => {
    render(renderedFrame);
    warmFrames(Math.round(targetFrame));
  });
  loadFrame(FRAME_COUNT - 1).catch(() => {});

  startAnimation();
}

function setupGSAPAnimations() {
  if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
    return;
  }

  document
    .querySelectorAll(
      "[data-reveal], [data-procedure], [data-experience], [data-analysis], [data-purchase], [data-final-reveal], [data-report-reveal]",
    )
    .forEach((el) => el.classList.add("is-visible"));

  const mm = window.gsap.matchMedia();

  // Redução de movimento
  mm.add("(prefers-reduced-motion: reduce)", () => {
    document
      .querySelectorAll(
        "[data-reveal], [data-procedure], [data-experience], [data-analysis], [data-purchase], [data-final-reveal], [data-report-reveal]",
      )
      .forEach((el) => el.classList.add("is-visible"));

    window.gsap.set(
      "[data-reveal], .overview-copy, .case-file, .steps li, .experience__copy, .analysis-card, .audience-profile, .gallery-item, .purchase-card, .faq-item, .final-cta__inner",
      {
        clearProps: "all",
        opacity: 1,
        visibility: "visible",
      },
    );
    document.querySelectorAll(".metrics .meter i").forEach((meter) => {
      meter.style.width = meter.style.getPropertyValue("--value") || "100%";
    });
  });

  // Desktop (>= 1001px)
  mm.add("(min-width: 1001px) and (prefers-reduced-motion: no-preference)", () => {
    // 1. Navegação ativa por seção
    const sections = ["caso", "como-funciona", "galeria", "faq"];
    sections.forEach((id) => {
      const sec = document.getElementById(id);
      const navLink = document.querySelector(`.navigation__links a[href="#${id}"]`);
      if (sec && navLink) {
        window.ScrollTrigger.create({
          trigger: sec,
          start: "top 40%",
          end: "bottom 40%",
          onToggle: (self) => {
            if (self.isActive) {
              document
                .querySelectorAll(".navigation__links a")
                .forEach((a) => a.classList.remove("is-active"));
              navLink.classList.add("is-active");
            }
          },
        });
      }
    });

    // 2. Seção Caso Overview (#caso)
    const casoSection = document.getElementById("caso");
    if (casoSection) {
      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: casoSection,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".report-kicker", {
        opacity: 0,
        x: -24,
        duration: 0.6,
        ease: "dossier",
      })
        .from(
          ".report-title__line > span",
          {
            y: "110%",
            opacity: 0,
            stagger: 0.1,
            duration: 0.7,
            ease: "dossier",
          },
          "-=0.3",
        )
        .from(
          ".overview-copy .lead, .overview-copy > p:last-child",
          {
            opacity: 0,
            y: 18,
            stagger: 0.12,
            duration: 0.6,
            ease: "dossier",
          },
          "-=0.4",
        )
        .from(
          ".case-file",
          {
            opacity: 0,
            x: 35,
            rotationZ: 2,
            duration: 0.75,
            ease: "dossier",
          },
          "-=0.5",
        )
        .from(
          ".case-file__mark",
          {
            opacity: 0,
            scale: 1.4,
            rotationZ: 8,
            duration: 0.45,
            ease: "stamp",
          },
          "-=0.1",
        );

      window.gsap.to(".case-overview__visual img", {
        y: 35,
        ease: "none",
        scrollTrigger: {
          trigger: casoSection,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }

    // 3. Seção Inventário de Evidências (#conteudo-do-caso)
    const evidenceSection = document.getElementById("conteudo-do-caso");
    if (evidenceSection) {
      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: evidenceSection,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".evidence .section-heading", {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: "dossier",
      })
        .from(
          ".evidence-visual",
          {
            opacity: 0,
            scale: 0.97,
            duration: 0.7,
            ease: "dossier",
          },
          "-=0.3",
        )
        .from(
          ".evidence-inventory__head",
          {
            opacity: 0,
            x: 16,
            duration: 0.5,
          },
          "-=0.4",
        )
        .from(
          ".evidence-list li",
          {
            opacity: 0,
            x: 24,
            stagger: 0.07,
            duration: 0.5,
            ease: "dossier",
          },
          "-=0.3",
        )
        .from(
          ".disclosure",
          {
            opacity: 0,
            y: 12,
            duration: 0.4,
          },
          "-=0.2",
        );
    }

    // 4. Seção Como Funciona (#como-funciona)
    const procedureSection = document.getElementById("como-funciona");
    if (procedureSection) {
      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: procedureSection,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".procedure .section-heading", {
        opacity: 0,
        y: 22,
        duration: 0.6,
        ease: "dossier",
      })
        .from(
          ".steps__progress span",
          {
            scaleX: 0,
            duration: 0.9,
            ease: "dossier",
          },
          "-=0.3",
        )
        .from(
          ".steps li",
          {
            opacity: 0,
            y: 28,
            stagger: 0.14,
            duration: 0.65,
            ease: "dossier",
          },
          "-=0.6",
        );
    }

    // 5. Seção Experiência (#experiencia)
    const experienceSection = document.getElementById("experiencia");
    if (experienceSection) {
      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: experienceSection,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".experience__copy", {
        opacity: 0,
        y: 24,
        duration: 0.65,
        ease: "dossier",
      }).from(
        ".experience-points li",
        {
          opacity: 0,
          x: -20,
          stagger: 0.08,
          duration: 0.55,
          ease: "dossier",
        },
        "-=0.3",
      );

      window.gsap.to(".experience__image img", {
        scale: 1.045,
        ease: "none",
        scrollTrigger: {
          trigger: experienceSection,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }

    // 6. Seção Nível da Investigação (#nivel)
    const levelSection = document.getElementById("nivel");
    if (levelSection) {
      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: levelSection,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".investigation-level .section-heading", {
        opacity: 0,
        y: 18,
        duration: 0.35,
        ease: "dossier",
      })
        .from(
          ".analysis-card",
          {
            opacity: 0,
            scale: 0.98,
            duration: 0.35,
            ease: "dossier",
          },
          "-=0.2",
        )
        .from(
          ".metrics dt, .metrics dd b, .analysis-card__facts",
          {
            opacity: 0,
            duration: 0.3,
            stagger: 0.02,
          },
          "-=0.15",
        );

      document.querySelectorAll(".metrics .meter i").forEach((meter) => {
        const val = meter.style.getPropertyValue("--value") || "100%";
        tl.fromTo(
          meter,
          { width: "0%" },
          {
            width: val,
            duration: 0.45,
            ease: "dossier",
          },
          "<",
        );
      });
    }

    // 7. Seção Público (#para-quem)
    const audienceSection = document.getElementById("para-quem");
    if (audienceSection) {
      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: audienceSection,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".audience .section-heading", {
        opacity: 0,
        y: 18,
        duration: 0.35,
        ease: "dossier",
      }).from(
        ".audience-profile",
        {
          opacity: 0,
          y: 20,
          stagger: 0.06,
          duration: 0.4,
          ease: "dossier",
        },
        "-=0.2",
      );
    }

    // 8. Seção Galeria (#galeria)
    const gallerySection = document.getElementById("galeria");
    if (gallerySection) {
      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: gallerySection,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".gallery .section-heading", {
        opacity: 0,
        y: 18,
        duration: 0.35,
        ease: "dossier",
      }).from(
        ".gallery-item",
        {
          opacity: 0,
          y: 20,
          stagger: 0.06,
          duration: 0.4,
          ease: "dossier",
        },
        "-=0.2",
      );
    }

    // 9. Seção Comunidade (#comunidade)
    const communitySection = document.getElementById("comunidade");
    if (communitySection) {
      window.gsap.from(".community__inner", {
        opacity: 0,
        y: 18,
        duration: 0.4,
        ease: "dossier",
        scrollTrigger: {
          trigger: communitySection,
          start: "top 80%",
          once: true,
        },
      });
    }

    // 10. Seção Oferta (#oferta)
    const purchaseSection = document.getElementById("oferta");
    if (purchaseSection) {
      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: purchaseSection,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".purchase-card__copy, .purchase-card__document-stack, .purchase-card__action", {
        opacity: 0,
        y: 16,
        stagger: 0.06,
        duration: 0.35,
        ease: "dossier",
      });
    }

    // 11. Seção FAQ (#faq)
    const faqSection = document.getElementById("faq");
    if (faqSection) {
      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: faqSection,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".faq .section-heading", {
        opacity: 0,
        y: 18,
        duration: 0.35,
        ease: "dossier",
      }).from(
        ".faq-item",
        {
          opacity: 0,
          y: 14,
          stagger: 0.04,
          duration: 0.35,
          ease: "dossier",
        },
        "-=0.2",
      );
    }

    // 12. Seção Encerramento & Rodapé (#encerramento, #rodape)
    const finalSection = document.getElementById("encerramento");
    if (finalSection) {
      const tl = window.gsap.timeline({
        scrollTrigger: {
          trigger: finalSection,
          start: "top 78%",
          once: true,
        },
      });

      tl.from(".final-cta__line", {
        scaleY: 0,
        duration: 0.35,
        ease: "dossier",
      })
        .from(
          ".footer__archive-line, .footer__archive-status, .footer__archive-code, .footer__grid",
          {
            opacity: 0,
            y: 10,
            stagger: 0.03,
            duration: 0.35,
            ease: "dossier",
          },
          "-=0.1",
        );
    }
  });

  // Tablet e Mobile (< 1001px)
  mm.add("(max-width: 1000px) and (prefers-reduced-motion: no-preference)", () => {
    const sectionsToAnimate = [
      "#caso",
      "#conteudo-do-caso",
      "#como-funciona",
      "#experiencia",
      "#nivel",
      "#para-quem",
      "#galeria",
      "#comunidade",
      "#oferta",
      "#faq",
      "#encerramento",
    ];

    sectionsToAnimate.forEach((selector) => {
      const el = document.querySelector(selector);
      if (!el) return;

      window.gsap.from(
        el.querySelectorAll(
          ".section-heading, .overview-copy, .case-file, .evidence-visual, .evidence-inventory, .steps li, .experience__copy, .experience-points, .analysis-card, .audience-profile, .gallery-item, .purchase-card, .faq-item, .final-cta__inner",
        ),
        {
          opacity: 0,
          y: 18,
          stagger: 0.06,
          duration: 0.5,
          ease: "dossier",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            once: true,
          },
        },
      );
    });

    const levelSection = document.getElementById("nivel");
    if (levelSection) {
      window.ScrollTrigger.create({
        trigger: levelSection,
        start: "top 82%",
        once: true,
        onEnter: () => {
          document.querySelectorAll(".metrics .meter i").forEach((meter) => {
            const val = meter.style.getPropertyValue("--value") || "100%";
            window.gsap.fromTo(
              meter,
              { width: "0%" },
              { width: val, duration: 0.6, ease: "dossier" },
            );
          });
        },
      });
    }
  });

  window.addEventListener("load", () => {
    window.ScrollTrigger.refresh();
  });
}

function setupProcedureFocus() {
  document.querySelectorAll(".steps li").forEach((step) => {
    step.addEventListener("focus", () => step.classList.add("is-focused"));
    step.addEventListener("blur", () => step.classList.remove("is-focused"));
  });
}

setupConfigurableContent();
setupFAQ();
setupGallery();
setupEvidenceInventory();
setupCaseFileTilt();
setupProcedureFocus();
setupSmoothAnchorLinks();
setupSiteHeader();
setupIntro();
setupGSAPAnimations();

