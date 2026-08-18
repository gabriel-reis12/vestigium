import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const qaDirectory = resolve(root, ".tmp", "qa");
const profileDirectory = resolve(root, ".tmp", `chrome-cdp-${process.pid}`);
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9300 + (process.pid % 200);
const errors = [];
const results = [];

if (!profileDirectory.startsWith(`${root}${sep}`)) throw new Error("Perfil temporário inválido.");

await mkdir(qaDirectory, { recursive: true });
await mkdir(profileDirectory, { recursive: true });

const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-breakpad",
    "--disable-crash-reporter",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--force-color-profile=srgb",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDirectory}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (response.ok) return;
    } catch {
      // O Chrome ainda está inicializando.
    }
    await delay(100);
  }
  throw new Error("Chrome DevTools não ficou disponível.");
}

await waitForDebugger();

const targetResponse = await fetch(
  `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent("about:blank")}`,
  { method: "PUT" },
);
const target = await targetResponse.json();
const socket = new WebSocket(target.webSocketDebuggerUrl);

let nextId = 1;
const pending = new Map();
const eventWaiters = new Map();

await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", rejectOpen, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);

  if (message.id) {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
    return;
  }

  if (message.method === "Runtime.exceptionThrown") {
    errors.push(`Exceção: ${message.params.exceptionDetails.text}`);
  }

  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    const source = message.params.entry.url ? ` — ${message.params.entry.url}` : "";
    errors.push(`Console: ${message.params.entry.text}${source}`);
  }

  if (message.method === "Network.loadingFailed" && !message.params.canceled) {
    errors.push(`Rede: ${message.params.errorText} (${message.params.requestId})`);
  }

  const waiters = eventWaiters.get(message.method);
  if (!waiters?.length) return;
  eventWaiters.set(message.method, []);
  waiters.forEach((resolveEvent) => resolveEvent(message.params));
});

function send(method, params = {}) {
  const id = nextId;
  nextId += 1;

  return new Promise((resolveRequest, rejectRequest) => {
    pending.set(id, { resolve: resolveRequest, reject: rejectRequest });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

function waitForEvent(method, timeout = 10000) {
  return new Promise((resolveEvent, rejectEvent) => {
    const timer = setTimeout(() => rejectEvent(new Error(`Tempo excedido aguardando ${method}.`)), timeout);
    const resolveWithCleanup = (params) => {
      clearTimeout(timer);
      resolveEvent(params);
    };
    const waiters = eventWaiters.get(method) ?? [];
    waiters.push(resolveWithCleanup);
    eventWaiters.set(method, waiters);
  });
}

await Promise.all([
  send("Page.enable"),
  send("Runtime.enable"),
  send("Log.enable"),
  send("Network.enable"),
]);

const allScenarios = [
  { name: "desktop-intro-cdp", width: 1440, height: 1000, reduced: false, target: null },
  { name: "desktop-intro-quality", width: 1440, height: 900, dpr: 2, reduced: false, target: null },
  { name: "desktop-intro-exit", width: 1440, height: 1000, reduced: false, target: null },
  { name: "desktop-case", width: 1440, height: 1000, reduced: false, target: "caso" },
  { name: "desktop-evidence", width: 1440, height: 1000, reduced: false, target: "conteudo-do-caso" },
  { name: "desktop-procedure", width: 1440, height: 1000, reduced: false, target: "como-funciona" },
  { name: "desktop-experience", width: 1440, height: 1000, reduced: false, target: "experiencia" },
  { name: "desktop-level", width: 1440, height: 1000, reduced: false, target: "nivel" },
  { name: "desktop-audience", width: 1440, height: 1000, reduced: false, target: "para-quem" },
  { name: "desktop-gallery", width: 1280, height: 900, reduced: false, target: "galeria" },
  { name: "desktop-purchase", width: 1280, height: 900, reduced: false, target: "oferta" },
  { name: "desktop-faq", width: 1280, height: 900, reduced: false, target: "faq" },
  { name: "desktop-closing", width: 1280, height: 900, reduced: false, target: "encerramento" },
  { name: "desktop-footer", width: 1440, height: 1000, reduced: false, target: "rodape" },
  { name: "tablet-evidence", width: 768, height: 1024, reduced: false, target: "conteudo-do-caso" },
  { name: "tablet-procedure", width: 768, height: 1024, reduced: false, target: "como-funciona" },
  { name: "tablet-experience", width: 768, height: 1024, reduced: false, target: "experiencia" },
  { name: "tablet-level", width: 768, height: 1024, reduced: false, target: "nivel" },
  { name: "tablet-audience", width: 768, height: 1024, reduced: false, target: "para-quem" },
  { name: "tablet-gallery", width: 768, height: 1024, reduced: false, target: "galeria" },
  { name: "tablet-purchase", width: 768, height: 1024, reduced: false, target: "purchase-panel" },
  { name: "tablet-footer", width: 768, height: 1024, reduced: false, target: "rodape" },
  { name: "mobile-case", width: 390, height: 844, reduced: false, target: "caso" },
  { name: "mobile-evidence", width: 390, height: 844, reduced: false, target: "conteudo-do-caso" },
  { name: "mobile-procedure", width: 390, height: 844, reduced: false, target: "como-funciona" },
  { name: "mobile-experience", width: 390, height: 844, reduced: false, target: "experiencia" },
  { name: "mobile-level", width: 390, height: 844, reduced: false, target: "nivel" },
  { name: "mobile-audience", width: 390, height: 844, reduced: false, target: "para-quem" },
  { name: "mobile-gallery", width: 390, height: 844, reduced: false, target: "galeria" },
  { name: "mobile-purchase", width: 390, height: 844, reduced: false, target: "purchase-panel" },
  { name: "mobile-faq", width: 390, height: 844, reduced: false, target: "faq" },
  { name: "mobile-footer", width: 390, height: 844, reduced: false, target: "rodape" },
  { name: "mobile-reduced", width: 390, height: 844, reduced: true, target: null },
];
const scenarios = process.env.QA_SCENARIO
  ? allScenarios.filter((scenario) => scenario.name === process.env.QA_SCENARIO)
  : allScenarios;

for (const scenario of scenarios) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: scenario.width,
    height: scenario.height,
    deviceScaleFactor: scenario.dpr ?? 1,
    mobile: scenario.width < 720,
    screenWidth: scenario.width,
    screenHeight: scenario.height,
  });
  await send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [
      {
        name: "prefers-reduced-motion",
        value: scenario.reduced ? "reduce" : "no-preference",
      },
    ],
  });

  const loaded = waitForEvent("Page.loadEventFired");
  await send("Page.navigate", {
    url: `http://127.0.0.1:4173/?qa=${scenario.name}-${Date.now()}`,
  });
  await loaded;
  await delay(900);

  const evaluation = await send("Runtime.evaluate", {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        document.documentElement.style.scrollBehavior = "auto";
        const target = ${JSON.stringify(scenario.target)};
        const scenarioName = ${JSON.stringify(scenario.name)};
        if (scenarioName === "desktop-intro-quality") {
          const intro = document.getElementById("intro");
          const range = intro.offsetHeight - window.innerHeight;
          window.scrollTo(0, Math.round(range * 0.52));
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        } else if (scenarioName === "desktop-intro-exit") {
          const intro = document.getElementById("intro");
          window.scrollTo(0, Math.round(intro.offsetHeight - window.innerHeight * 0.55));
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        } else if (target) {
          document.querySelector("[data-skip-intro]").click();
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const element = document.getElementById(target);
          const origin = window.scrollY;
          const destination = element.getBoundingClientRect().top + origin;
          for (let step = 1; step <= 18; step += 1) {
            window.scrollTo(0, origin + ((destination - origin) * step) / 18);
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        } else {
          window.scrollTo(0, 0);
        }

        const required = ["caso", "conteudo-do-caso", "como-funciona", "experiencia", "nivel", "para-quem", "galeria", "oferta", "faq"];
        return {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
          missingOrCollapsed: required.filter((id) => {
            const element = document.getElementById(id);
            return !element || element.getBoundingClientRect().height < 1;
          }),
          introStatic: document.getElementById("intro").classList.contains("intro--static"),
          scrollY: Math.round(window.scrollY),
        };
      })()
    `,
  });

  await delay(1000);

  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });

  await writeFile(
    resolve(qaDirectory, `${scenario.name}.png`),
    Buffer.from(screenshot.data, "base64"),
  );

  const interactions = {};

  if (scenario.target) {
    const targetViewportState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const target = document.getElementById(${JSON.stringify(scenario.target)});
        const rect = target.getBoundingClientRect();
        const siteRect = document.getElementById("conteudo").getBoundingClientRect();
        const headerRect = document.querySelector(".site-header").getBoundingClientRect();
        const navigationRect = document.querySelector(".navigation").getBoundingClientRect();
        return {
          targetTop: Math.round(rect.top),
          targetBottom: Math.round(rect.bottom),
          targetVisible: rect.top < innerHeight && rect.bottom > 0,
          siteTop: Math.round(siteRect.top),
          scrollY: Math.round(scrollY),
          introHeight: Math.round(document.getElementById("intro").getBoundingClientRect().height),
          headerRect: { top: Math.round(headerRect.top), bottom: Math.round(headerRect.bottom), height: Math.round(headerRect.height) },
          navigationRect: { top: Math.round(navigationRect.top), bottom: Math.round(navigationRect.bottom), height: Math.round(navigationRect.height) },
          targetOpacity: getComputedStyle(target).opacity,
        };
      })()`,
    });
    interactions.targetViewport = targetViewportState.result.value;
  }

  if (scenario.name === "desktop-intro-cdp") {
    const introChromeState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const skip = document.querySelector("[data-skip-intro]");
        const skipRect = skip.getBoundingClientRect();
        const header = document.querySelector(".site-header");
        return {
          noDuplicateBrand: !document.querySelector(".intro .brand-label"),
          skipAtTopRight: skipRect.top >= 0 && skipRect.top < 32 && skipRect.right > innerWidth * 0.8,
          skipAccessible: skip.getBoundingClientRect().height >= 44 && getComputedStyle(skip).pointerEvents === "auto",
          mainNavigationHidden: getComputedStyle(header).display === "none",
        };
      })()`,
    });
    interactions.introChrome = introChromeState.result.value;
  }

  if (scenario.name === "desktop-intro-quality") {
    await delay(220);
    const introQualityState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const intro = document.getElementById("intro");
        const canvas = document.getElementById("sequence");
        const bounds = canvas.getBoundingClientRect();
        return {
          discreteFrames: intro.dataset.renderMode === "discrete",
          optimizedFrameFormat: intro.dataset.frameFormat === "jpeg",
          boundedFrameCache: Number(intro.dataset.frameCacheLimit) <= 24,
          highDensityBacking: canvas.width / bounds.width >= 1.99 && canvas.height / bounds.height >= 1.99,
          canvasReady: intro.classList.contains("intro--canvas-ready"),
          noSofteningFilter: getComputedStyle(canvas).filter === "none",
          animatedMidpoint: window.scrollY > 0 && !intro.classList.contains("intro--static"),
        };
      })()`,
    });
    interactions.introQuality = introQualityState.result.value;
  }

  if (scenario.name === "desktop-intro-exit") {
    const transitionBefore = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const intro = document.getElementById("intro");
        const site = document.getElementById("conteudo");
        const header = document.querySelector(".site-header");
        const style = getComputedStyle(header);
        return {
          finalFramePainted: Number(intro.dataset.renderedFrame) >= 266,
          headerHeldBack: !site.classList.contains("site--entered") && style.display === "none",
          siteStillApproaching: site.getBoundingClientRect().top > 0,
        };
      })()`,
    });

    await send("Runtime.evaluate", {
      awaitPromise: true,
      expression: `(async () => {
        const site = document.getElementById("conteudo");
        window.scrollTo(0, site.offsetTop);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      })()`,
    });
    await delay(240);

    const transitionAfter = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const site = document.getElementById("conteudo");
        const header = document.querySelector(".site-header");
        const caseContent = document.querySelector("[data-report-reveal]");
        const style = getComputedStyle(header);
        return {
          headerReleasedAtTop: site.classList.contains("site--entered") && style.display !== "none",
          headerAligned: Math.abs(header.getBoundingClientRect().top) <= 1,
          contentFollowsHeader: document.getElementById("caso").getBoundingClientRect().top >= header.getBoundingClientRect().bottom - 1,
          firstSectionVisible: caseContent.classList.contains("is-visible") && parseFloat(getComputedStyle(caseContent).opacity) > 0.99,
        };
      })()`,
    });
    interactions.introExit = { ...transitionBefore.result.value, ...transitionAfter.result.value };
  }

  if (scenario.name === "desktop-case") {
    const bounds = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const rect = document.querySelector("[data-case-file]").getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      })()`,
    });
    await send("Runtime.evaluate", {
      expression: `document.querySelector("[data-case-file]").dispatchEvent(new MouseEvent("mousemove", {
        bubbles: true,
        clientX: ${bounds.result.value.right - 3},
        clientY: ${bounds.result.value.top + 3}
      }))`,
    });
    await delay(100);

    const tiltState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const style = document.querySelector("[data-case-file]").style;
        const x = parseFloat(style.getPropertyValue("--paper-tilt-x"));
        const y = parseFloat(style.getPropertyValue("--paper-tilt-y"));
        return {
          x,
          y,
          withinLimit: Math.abs(x) <= 1.2 && Math.abs(y) <= 1.2,
          officialBackground: document.querySelector(".case-overview__visual img").src.includes("section-case-overview.png"),
          persistentHeader: getComputedStyle(document.querySelector(".site-header")).position === "fixed" &&
            Math.abs(document.querySelector(".site-header").getBoundingClientRect().top) <= 1 &&
            document.querySelector(".site-header").getBoundingClientRect().height <= 74 &&
            getComputedStyle(document.querySelector(".site-header")).display !== "none",
        };
      })()`,
    });
    interactions.caseFileTilt = tiltState.result.value;
  }

  if (scenario.name === "desktop-evidence") {
    await send("Runtime.evaluate", {
      expression: `document.querySelector("[data-evidence-index='1']").focus()`,
    });
    await send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "ArrowDown",
      code: "ArrowDown",
      windowsVirtualKeyCode: 40,
      nativeVirtualKeyCode: 40,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "ArrowDown",
      code: "ArrowDown",
      windowsVirtualKeyCode: 40,
      nativeVirtualKeyCode: 40,
    });
    await delay(100);

    const inventoryState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `({
        secondFocused: document.activeElement === document.querySelector("[data-evidence-index='2']"),
        secondSelected: document.querySelector("[data-evidence-index='2']").getAttribute("aria-pressed") === "true",
        markerUpdated: document.getElementById("evidence-visual").dataset.activeIndex === "2",
        officialInventory: document.querySelector(".evidence-visual__media img").src.includes("section-case-contents.png") &&
          document.querySelector(".evidence-visual__media img").naturalWidth === 1586,
      })`,
    });
    interactions.evidenceKeyboard = inventoryState.result.value;
  }

  if (scenario.name === "desktop-procedure") {
    await send("Runtime.evaluate", {
      expression: `document.querySelector("[data-evidence-index='6']").focus()`,
    });
    await send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await delay(260);

    const procedureState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const sequence = document.querySelector("[data-procedure]");
        const firstStep = document.querySelector(".steps li");
        const micro = firstStep.querySelector(".steps__micro");
        const title = firstStep.querySelector("h3");
        const description = firstStep.querySelector(".steps__description");
        const microOpacity = parseFloat(getComputedStyle(micro).opacity);
        return {
          activatedOnce: sequence.classList.contains("is-visible"),
          stepFocused: document.activeElement === firstStep,
          focusedClassApplied: firstStep.classList.contains("is-focused"),
          microphraseRevealed: microOpacity > 0.5,
          microOpacity,
          titleRevealed: parseFloat(getComputedStyle(title).opacity) > 0.9,
          descriptionRevealed: parseFloat(getComputedStyle(description).opacity) > 0.9,
          officialProcedureImage: document.querySelector(".procedure__visual img").src.includes("section-how-it-works.png"),
        };
      })()`,
    });
    interactions.procedureFocus = procedureState.result.value;
  }

  if (scenario.name === "desktop-experience") {
    await delay(700);
    const experienceState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const section = document.querySelector("[data-experience]");
        const image = section.querySelector(".experience__image img");
        const imageMatrix = new DOMMatrixReadOnly(getComputedStyle(image).transform);
        const notes = [...section.querySelectorAll(".experience-points li")];
        return {
          revealedOnce: section.classList.contains("is-visible"),
          pushInActive: imageMatrix.a > 1 && imageMatrix.a <= 1.036,
          linesDrawn: notes.every((item) => getComputedStyle(item, "::after").transform !== "matrix(0, 0, 0, 1, 0, 0)"),
          markersInserted: notes.every((item) => parseFloat(getComputedStyle(item, "::before").opacity) > 0.9),
          notesVisible: [...section.querySelectorAll(".experience-points__text")]
            .every((item) => parseFloat(getComputedStyle(item).opacity) > 0.9),
          officialExperienceImage: image.src.includes("section-table-experience.png") && image.naturalWidth === 1672,
        };
      })()`,
    });
    interactions.experienceDesktop = experienceState.result.value;
  }

  if (scenario.name === "desktop-level") {
    await delay(650);
    const analysisState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const section = document.querySelector("[data-analysis]");
        const card = section.querySelector(".analysis-card");
        const bars = [...section.querySelectorAll(".meter i")];
        const values = [...section.querySelectorAll(".metrics b")];
        return {
          revealedOnce: section.classList.contains("is-visible"),
          outlineVisible: getComputedStyle(card).borderTopColor !== "rgba(0, 0, 0, 0)",
          barsFilled: bars.every((bar) => new DOMMatrixReadOnly(getComputedStyle(bar).transform).a > 0.99),
          valuesVisible: values.every((value) => parseFloat(getComputedStyle(value).opacity) > 0.9),
          factsVisible: parseFloat(getComputedStyle(section.querySelector(".analysis-card__facts")).opacity) > 0.9,
          officialLevelImage: section.querySelector(".investigation-level__visual img").src.includes("section-investigation-level.png"),
          confirmedFacts: section.querySelector(".analysis-card__facts").textContent.includes("45–60") &&
            section.querySelector(".analysis-card__facts").textContent.includes("2–5"),
        };
      })()`,
    });
    interactions.analysisDesktop = analysisState.result.value;
  }

  if (scenario.name === "desktop-audience") {
    await send("Runtime.evaluate", {
      expression: `document.querySelector(".steps li:last-child").focus()`,
    });
    await send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await delay(400);

    const audienceState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const profiles = [...document.querySelectorAll(".audience-profile")];
        const first = profiles[0];
        const line = getComputedStyle(first, "::after");
        const description = getComputedStyle(first.querySelector(".audience-profile__description"));
        const textureChecks = [
          getComputedStyle(profiles[0].querySelector(".audience-profile__texture"), "::before").content !== "none",
          getComputedStyle(profiles[1].querySelector(".audience-profile__texture")).backgroundImage !== "none",
          getComputedStyle(profiles[2].querySelector(".audience-profile__texture"), "::before").content !== "none",
          getComputedStyle(profiles[3].querySelector(".audience-profile__texture")).backgroundImage.includes("intro-frames/frame-240.jpg"),
        ];
        return {
          fourColumns: new Set(profiles.map((item) => Math.round(item.getBoundingClientRect().top))).size === 1,
          firstFocused: document.activeElement === first,
          redLineExtended: new DOMMatrixReadOnly(line.transform).a > 0.99,
          descriptionRaised: description.translate !== "none" && description.translate !== "0px",
          allNotesPresent: profiles.every((item) => item.querySelector(".audience-profile__note").textContent.trim().length > 0),
          distinctTextures: textureChecks.every(Boolean),
          officialAudienceImage: document.querySelector(".audience__visual img").src.includes("section-audience.png"),
        };
      })()`,
    });
    interactions.audienceDesktop = audienceState.result.value;
  }

  if (scenario.name === "tablet-experience" || scenario.name === "mobile-experience") {
    await delay(700);
    const responsiveExperienceState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const section = document.querySelector("[data-experience]");
        const image = section.querySelector(".experience__image img");
        const transform = getComputedStyle(image).transform;
        const scale = transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;
        const copy = section.querySelector(".experience__copy").getBoundingClientRect();
        const notes = section.querySelector(".experience-points").getBoundingClientRect();
        return {
          parallaxDisabled: Math.abs(scale - 1) < 0.001,
          notesFollowCopy: notes.top >= copy.bottom - 1,
          notesVisible: [...section.querySelectorAll(".experience-points__text")]
            .every((item) => parseFloat(getComputedStyle(item).opacity) > 0.9),
        };
      })()`,
    });
    interactions.experienceResponsive = responsiveExperienceState.result.value;
  }

  if (scenario.name === "tablet-level" || scenario.name === "mobile-level") {
    await delay(650);
    const responsiveAnalysisState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const section = document.querySelector("[data-analysis]");
        const heading = section.querySelector(".section-heading").getBoundingClientRect();
        const card = section.querySelector(".analysis-card").getBoundingClientRect();
        const criterionSize = parseFloat(getComputedStyle(section.querySelector(".metrics dt")).fontSize);
        const factSize = parseFloat(getComputedStyle(section.querySelector(".analysis-card__facts strong")).fontSize);
        return {
          panelBelowText: card.top >= heading.bottom - 1,
          criteriaLegible: criterionSize >= 16,
          factsLegible: factSize >= 25,
          barsFilled: [...section.querySelectorAll(".meter i")]
            .every((bar) => new DOMMatrixReadOnly(getComputedStyle(bar).transform).a > 0.99),
        };
      })()`,
    });
    interactions.analysisResponsive = responsiveAnalysisState.result.value;
  }

  if (scenario.name === "tablet-audience" || scenario.name === "mobile-audience") {
    const responsiveAudienceState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const profiles = [...document.querySelectorAll(".audience-profile")];
        const bounds = profiles.map((item) => item.getBoundingClientRect());
        const mobile = window.innerWidth <= 720;
        const number = profiles[0].querySelector(".audience-profile__number").getBoundingClientRect();
        const title = profiles[0].querySelector("h3").getBoundingClientRect();
        return {
          expectedGrid: mobile
            ? bounds.every((item, index) => index === 0 || item.top >= bounds[index - 1].bottom - 1)
            : Math.abs(bounds[0].top - bounds[1].top) < 1 && bounds[2].top >= bounds[0].bottom - 1,
          horizontalMobileCard: !mobile || number.right <= title.left + 1,
          notesVisible: profiles.every((item) => getComputedStyle(item.querySelector(".audience-profile__note")).display !== "none"),
        };
      })()`,
    });
    interactions.audienceResponsive = responsiveAudienceState.result.value;
  }

  if (scenario.name === "mobile-procedure") {
    await delay(420);
    const mobileProcedureState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const progress = document.querySelector(".steps__progress").getBoundingClientRect();
        const steps = [...document.querySelectorAll(".steps li")].map((item) => item.getBoundingClientRect());
        return {
          verticalProgress: progress.height > progress.width,
          sequentialStack: steps[1].top >= steps[0].bottom - 1 && steps[2].top >= steps[1].bottom - 1,
          allContentVisible: [...document.querySelectorAll(".steps h3, .steps__description")]
            .every((item) => parseFloat(getComputedStyle(item).opacity) > 0.9),
        };
      })()`,
    });
    interactions.procedureMobile = mobileProcedureState.result.value;
  }

  if (scenario.name === "mobile-reduced") {
    const reducedProcedureState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const sequence = document.querySelector("[data-procedure]");
        const progress = document.querySelector(".steps__progress span");
        return {
          sequenceReady: sequence.classList.contains("is-visible"),
          progressReady: getComputedStyle(progress).transform === "none",
          contentReady: [...document.querySelectorAll(".steps h3, .steps__description")]
            .every((item) => parseFloat(getComputedStyle(item).opacity) === 1),
        };
      })()`,
    });
    interactions.procedureReducedMotion = reducedProcedureState.result.value;

    const reducedExperienceState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const section = document.querySelector("[data-experience]");
        const image = section.querySelector(".experience__image img");
        return {
          sequenceReady: section.classList.contains("is-visible"),
          parallaxDisabled: getComputedStyle(image).transform === "none",
          notesReady: [...section.querySelectorAll(".experience-points__text")]
            .every((item) => parseFloat(getComputedStyle(item).opacity) === 1),
        };
      })()`,
    });
    interactions.experienceReducedMotion = reducedExperienceState.result.value;

    const reducedAnalysisState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const section = document.querySelector("[data-analysis]");
        return {
          panelReady: section.classList.contains("is-visible"),
          barsReady: [...section.querySelectorAll(".meter i")]
            .every((bar) => getComputedStyle(bar).transform === "none"),
          valuesReady: [...section.querySelectorAll(".metrics b")]
            .every((value) => parseFloat(getComputedStyle(value).opacity) === 1),
        };
      })()`,
    });
    interactions.analysisReducedMotion = reducedAnalysisState.result.value;

    const reducedPurchaseState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const section = document.querySelector("[data-purchase]");
        const panel = section.querySelector("[data-purchase-panel]");
        const style = getComputedStyle(panel);
        return {
          panelReady: section.classList.contains("is-visible"),
          panelVisible: parseFloat(style.opacity) === 1,
          motionRemoved: style.translate === "none" || parseFloat(style.translate) === 0,
        };
      })()`,
    });
    interactions.purchaseReducedMotion = reducedPurchaseState.result.value;
  }

  if (scenario.name === "desktop-gallery") {
    await send("Runtime.evaluate", {
      expression: `document.querySelector(".audience-profile:last-child").focus()`,
    });
    await send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await delay(760);

    const galleryLayoutState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const items = [...document.querySelectorAll(".gallery-item")];
        const images = items.map((item) => item.querySelector("img"));
        const bounds = items.map((item) => item.getBoundingClientRect());
        const expectedFiles = [
          "gallery-envelope.png",
          "section-offer-product.png",
          "section-case-contents.png",
          "gallery-photographic-evidence.png",
        ];
        const expectedWidths = [1122, 1536, 1586, 1003];
        const expectedHeights = [1402, 1024, 992, 1568];
        return {
          allImagesPreserved: images.length === 4 && images.every((image, index) => image.src.endsWith(expectedFiles[index])),
          declaredDimensions: images.every((image, index) =>
            image.getAttribute("width") === String(expectedWidths[index]) &&
            image.getAttribute("height") === String(expectedHeights[index])),
          fullFraming: images.every((image) => getComputedStyle(image).objectFit === "contain"),
          lazyLoaded: images.every((image) => image.loading === "lazy"),
          asymmetricGrid: bounds[1].width > bounds[0].width && bounds[2].width > bounds[3].width,
          compactRows: parseFloat(getComputedStyle(document.querySelector(".gallery-grid")).rowGap) <= 20,
          internalZoom: parseFloat(getComputedStyle(images[0]).scale) > 1 && parseFloat(getComputedStyle(images[0]).scale) <= 1.019,
          inspectVisible: parseFloat(getComputedStyle(items[0].querySelector(".gallery-item__inspect")).opacity) > 0.9,
          structuredCaptions: items.every((item) => item.querySelector(".gallery-item__number") && item.querySelector(".gallery-item__caption-copy strong") && item.querySelector(".gallery-item__caption-copy > span")),
        };
      })()`,
    });
    interactions.galleryLayout = galleryLayoutState.result.value;

    await send("Runtime.evaluate", {
      expression: `document.querySelector(".gallery-item").click()`,
    });
    await delay(250);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight" });

    const openState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `({
        open: document.getElementById("gallery-lightbox").open,
        closeFocused: document.activeElement.classList.contains("lightbox__close"),
        nextImageSelected: document.getElementById("lightbox-caption").textContent.startsWith("02 /"),
        detailedCaption: document.getElementById("lightbox-caption").textContent.includes("Revelação inicial"),
        fullImageVisible: getComputedStyle(document.getElementById("lightbox-image")).objectFit === "contain",
      })`,
    });

    const lightboxScreenshot = await send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    await writeFile(
      resolve(qaDirectory, "desktop-lightbox.png"),
      Buffer.from(lightboxScreenshot.data, "base64"),
    );

    await send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
      nativeVirtualKeyCode: 27,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
      nativeVirtualKeyCode: 27,
    });
    await delay(100);

    const closeState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `({
        closed: !document.getElementById("gallery-lightbox").open,
        focusReturned: document.activeElement.classList.contains("gallery-item"),
      })`,
    });

    interactions.galleryKeyboard = { ...openState.result.value, ...closeState.result.value };
  }

  if (scenario.name === "tablet-gallery" || scenario.name === "mobile-gallery") {
    const responsiveGalleryState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const items = [...document.querySelectorAll(".gallery-item")];
        const bounds = items.map((item) => item.getBoundingClientRect());
        const mobile = window.innerWidth <= 720;
        return {
          expectedEditorialGrid: mobile
            ? bounds.every((item, index) => index === 0 || item.top >= bounds[index - 1].bottom - 1)
            : bounds[1].width > bounds[0].width && bounds[2].width > bounds[3].width,
          completeImages: items.every((item) => getComputedStyle(item.querySelector("img")).objectFit === "contain"),
          lazyImages: items.every((item) => item.querySelector("img").loading === "lazy"),
          readableCaptions: items.every((item) => parseFloat(getComputedStyle(item.querySelector(".gallery-item__caption-copy > span")).fontSize) >= 10),
        };
      })()`,
    });
    interactions.galleryResponsive = responsiveGalleryState.result.value;
  }

  if (scenario.name === "desktop-purchase") {
    await send("Runtime.evaluate", {
      expression: `document.querySelector(".purchase-card__cta").focus()`,
    });
    const ctaBounds = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const rect = document.querySelector(".purchase-card__cta").getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`,
    });
    await send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: ctaBounds.result.value.x,
      y: ctaBounds.result.value.y,
    });
    await delay(440);

    const desktopPurchaseState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const section = document.querySelector("[data-purchase]");
        const features = [...section.querySelectorAll(".purchase-card__copy li")];
        const featureBounds = features.map((item) => item.getBoundingClientRect());
        const panel = section.querySelector("[data-purchase-panel]");
        const panelStyle = getComputedStyle(panel);
        const cta = section.querySelector(".purchase-card__cta");
        const ctaFill = parseFloat(getComputedStyle(cta, "::before").scale);
        const backingPaper = getComputedStyle(panel, "::before");
        const plain = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const sectionText = plain(section.textContent);
        return {
          reinforcedLabel: plain(section.querySelector(".purchase-card__kicker .eyebrow").textContent).trim().toUpperCase() === "ARQUIVO DISPONIVEL EM BREVE",
          productRegister: section.querySelector(".purchase-card__register").textContent.includes("VSTG") && section.querySelector(".purchase-card__register").textContent.includes("CASO 01"),
          twoColumnFacts: Math.abs(featureBounds[0].top - featureBounds[1].top) < 1 && Math.abs(featureBounds[2].top - featureBounds[3].top) < 1,
          confirmedFacts: sectionText.includes("2 a 5 jogadores") && sectionText.includes("45 a 60 minutos") && sectionText.includes("Documentos, fotografias, pistas e codigos"),
          pricePending: ["Preco em definicao", "R$ 87,90", "87,90"].some((val) => plain(section.querySelector("[data-product-price]").textContent).includes(plain(val))),
          coherentCta: cta.textContent.trim() === "Entrar na lista de investigadores" && cta.getAttribute("aria-disabled") === "true",
          helperPresent: plain(document.getElementById("purchase-helper").textContent).trim() === "Seja avisado quando o Caso 01 estiver disponivel.",
          documentStack: backingPaper.content !== "none" && backingPaper.rotate !== "none" && Boolean(panel.querySelector(".purchase-card__action")),
          entranceComplete: section.classList.contains("is-visible") && parseFloat(panelStyle.opacity) > 0.99 && (panelStyle.translate === "none" || parseFloat(panelStyle.translate) === 0),
          progressiveFill: ctaFill > 0.99,
          officialOfferImage: section.querySelector(".purchase__visual img").src.includes("section-offer-product.png"),
        };
      })()`,
    });
    interactions.purchaseDesktop = desktopPurchaseState.result.value;
  }

  if (scenario.name === "tablet-purchase" || scenario.name === "mobile-purchase") {
    const responsivePurchaseState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const section = document.querySelector("[data-purchase]");
        const copy = section.querySelector(".purchase-card__copy").getBoundingClientRect();
        const panel = section.querySelector("[data-purchase-panel]").getBoundingClientRect();
        const features = [...section.querySelectorAll(".purchase-card__copy li")]
          .map((item) => item.getBoundingClientRect());
        const mobile = window.innerWidth <= 720;
        return {
          singleColumnComposition: panel.top >= copy.bottom - 1,
          expectedFactLayout: mobile
            ? features.every((item, index) => index === 0 || item.top >= features[index - 1].bottom - 1)
            : Math.abs(features[0].top - features[1].top) < 1 && Math.abs(features[2].top - features[3].top) < 1,
          panelNearlyFullWidth: !mobile || panel.width >= window.innerWidth - 48,
          readableCommercialData: parseFloat(getComputedStyle(section.querySelector("[data-product-price]")).fontSize) >= 30 && parseFloat(getComputedStyle(section.querySelector(".purchase-card__cta")).fontSize) >= 10,
          entranceComplete: section.classList.contains("is-visible") && parseFloat(getComputedStyle(section.querySelector("[data-purchase-panel]")).opacity) > 0.99,
        };
      })()`,
    });
    interactions.purchaseResponsive = responsivePurchaseState.result.value;
  }

  if (scenario.name === "desktop-faq") {
    await send("Runtime.evaluate", {
      expression: `document.querySelectorAll(".faq-item__trigger")[1].focus()`,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: " ",
      code: "Space",
      text: " ",
      windowsVirtualKeyCode: 32,
      nativeVirtualKeyCode: 32,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: " ",
      code: "Space",
      windowsVirtualKeyCode: 32,
      nativeVirtualKeyCode: 32,
    });
    await delay(320);

    const faqState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const items = [...document.querySelectorAll(".faq-item")];
        const triggers = items.map((item) => item.querySelector(".faq-item__trigger"));
        const secondPanel = document.getElementById(triggers[1].getAttribute("aria-controls"));
        const content = secondPanel.querySelector(".faq-item__content");
        const heading = document.querySelector(".faq-grid .section-heading");
        const divider = getComputedStyle(items[1]).borderTopColor;
        return {
          multipleOpen: triggers[0].getAttribute("aria-expanded") === "true" && triggers[1].getAttribute("aria-expanded") === "true",
          semanticButtons: triggers.every((trigger) => trigger.tagName === "BUTTON" && trigger.type === "button"),
          controlsLinked: secondPanel.getAttribute("aria-labelledby") === triggers[1].id && secondPanel.getAttribute("aria-hidden") === "false",
          symbolChanged: triggers[1].querySelector(".faq-item__symbol").textContent !== "+",
          registrationVisible: content.querySelector(".faq-item__registration").textContent.trim() === "Resposta registrada" && parseFloat(getComputedStyle(content).opacity) > 0.99,
          keyboardFocusMaintained: document.activeElement === triggers[1] && getComputedStyle(triggers[1]).outlineStyle !== "none",
          stickyHeading: getComputedStyle(heading).position === "sticky",
          readableAnswer: parseFloat(getComputedStyle(content.querySelector("p")).fontSize) >= 16 && content.getBoundingClientRect().width <= 620,
          strongerDivider: divider !== "rgba(0, 0, 0, 0)",
        };
      })()`,
    });
    interactions.faqKeyboard = faqState.result.value;
  }

  if (scenario.name === "mobile-faq") {
    const mobileFaqState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const heading = document.querySelector(".faq-grid .section-heading");
        const list = document.getElementById("faq-list");
        const triggers = [...document.querySelectorAll(".faq-item__trigger")];
        return {
          stickyRemoved: getComputedStyle(heading).position === "static",
          singleColumn: list.getBoundingClientRect().top >= heading.getBoundingClientRect().bottom - 1,
          readableQuestions: triggers.every((trigger) => parseFloat(getComputedStyle(trigger).fontSize) >= 17),
          fullWidthControls: triggers.every((trigger) => Math.abs(trigger.getBoundingClientRect().width - list.getBoundingClientRect().width) < 1),
          initialAnswerClear: triggers[0].getAttribute("aria-expanded") === "true" && document.getElementById(triggers[0].getAttribute("aria-controls")).getAttribute("aria-hidden") === "false",
        };
      })()`,
    });
    interactions.faqResponsive = mobileFaqState.result.value;
  }

  if (scenario.name === "desktop-closing") {
    await send("Runtime.evaluate", {
      expression: `document.querySelector(".final-cta__button").focus()`,
    });
    await delay(180);
    const buttonBounds = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const rect = document.querySelector(".final-cta__button").getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`,
    });
    await send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: buttonBounds.result.value.x,
      y: buttonBounds.result.value.y,
    });
    await delay(300);

    const closingState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const section = document.getElementById("encerramento");
        const sequence = section.querySelector("[data-final-reveal]");
        const marker = section.querySelector(".final-cta__line");
        const eyebrow = sequence.querySelector(".eyebrow");
        const title = sequence.querySelector("h2");
        const copy = sequence.querySelector(".final-cta__copy");
        const button = sequence.querySelector(".final-cta__button");
        const delays = [eyebrow, title, copy, button]
          .map((element) => parseFloat(getComputedStyle(element).transitionDelay));
        const footer = document.getElementById("rodape");
        const configuredLinks = [...footer.querySelectorAll("[data-config-link]")];
        return {
          centeredComposition: getComputedStyle(section).textAlign === "center" && getComputedStyle(sequence).alignItems === "center",
          reinforcedMarker: marker.getBoundingClientRect().height >= 90 && parseFloat(getComputedStyle(marker, "::after").width) >= 15,
          sequenceCompleted: sequence.classList.contains("is-visible") && [eyebrow, title, copy, button].every((element) => parseFloat(getComputedStyle(element).opacity) > 0.99),
          labelBeforeTitle: delays[0] < delays[1] && delays[1] < delays[2] && delays[2] < delays[3],
          preservedCopy: title.textContent.includes("O caso") && copy.textContent.includes("foram reunidas") && button.textContent.trim() === "Abrir o Caso 01",
          prominentButton: button.getBoundingClientRect().height >= 58 && button.getBoundingClientRect().width >= 240,
          hoverMarkVisible: parseFloat(getComputedStyle(button, "::after").scale) > 0.99,
          archiveDivider: footer.querySelector(".footer__archive-status").textContent.trim().toLowerCase() === "arquivo encerrado" && footer.querySelector(".footer__archive-code").textContent.includes("VSTG"),
          clearFooterGroups: footer.querySelectorAll(".footer__group").length === 3 && Boolean(footer.querySelector(".footer__identity")),
          linksRemainConfigured: configuredLinks.length === 4 && configuredLinks.every((link) => link.getAttribute("aria-disabled") === "true"),
          smoothTransition: getComputedStyle(section).backgroundImage.includes("linear-gradient") && getComputedStyle(section).borderBottomWidth === "0px" && getComputedStyle(footer).borderTopWidth === "0px",
          noContinuousMotion: getComputedStyle(button).animationName === "none" && getComputedStyle(footer).transform === "none",
        };
      })()`,
    });
    interactions.closingDesktop = closingState.result.value;
  }

  if (scenario.name === "mobile-footer") {
    const mobileFooterState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const footer = document.getElementById("rodape");
        const archive = footer.querySelector(".footer__archive");
        const archiveParts = [...archive.children].map((item) => item.getBoundingClientRect());
        const groups = [footer.querySelector(".footer__identity"), ...footer.querySelectorAll(".footer__group")]
          .map((item) => item.getBoundingClientRect());
        const links = [...footer.querySelectorAll(".footer__nav a")];
        const symbolRect = footer.querySelector(".footer__symbol").getBoundingClientRect();
        return {
          archivedStack: archiveParts[1].top >= archiveParts[0].bottom - 1 && archiveParts[2].top >= archiveParts[1].bottom - 1,
          oneColumnGroups: groups.every((item, index) => index === 0 || item.top >= groups[index - 1].bottom - 1),
          strongerBrand: parseFloat(getComputedStyle(footer.querySelector(".footer__brand")).fontSize) >= 17,
          touchFriendlyLinks: links.every((link) => link.getBoundingClientRect().height >= 40),
          discreteArchiveLabel: parseFloat(getComputedStyle(footer.querySelector(".footer__archive-status")).fontSize) <= 10,
          signatureStacked: getComputedStyle(footer.querySelector(".footer__bottom")).flexDirection === "column",
          footerStable: getComputedStyle(footer).transform === "none" && getComputedStyle(footer).animationName === "none",
          officialBrandSymbol: footer.querySelector(".footer__symbol").src.includes("logo-symbol-dark.png"),
          boundedBrandSymbol: Math.round(symbolRect.width) === 58 && Math.round(symbolRect.height) === 58,
          compactFooter: footer.getBoundingClientRect().height < 1500,
        };
      })()`,
    });
    interactions.footerMobile = mobileFooterState.result.value;
  }

  if (scenario.name === "desktop-footer") {
    const desktopFooterState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const footer = document.getElementById("rodape");
        const symbolRect = footer.querySelector(".footer__symbol").getBoundingClientRect();
        const gridRect = footer.querySelector(".footer__grid").getBoundingClientRect();
        const columns = [footer.querySelector(".footer__identity"), ...footer.querySelectorAll(".footer__group")]
          .map((item) => item.getBoundingClientRect());
        return {
          boundedBrandSymbol: Math.round(symbolRect.width) === 58 && Math.round(symbolRect.height) === 58,
          alignedColumns: columns.every((item) => Math.abs(item.top - columns[0].top) <= 4),
          compactGrid: gridRect.height < 360,
          compactFooter: footer.getBoundingClientRect().height < 560,
        };
      })()`,
    });
    interactions.footerDesktop = desktopFooterState.result.value;
  }

  if (scenario.name === "tablet-footer") {
    const tabletFooterState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const footer = document.getElementById("rodape");
        const symbolRect = footer.querySelector(".footer__symbol").getBoundingClientRect();
        const identityRect = footer.querySelector(".footer__identity").getBoundingClientRect();
        return {
          boundedBrandSymbol: Math.round(symbolRect.width) === 58 && Math.round(symbolRect.height) === 58,
          identityWithinGrid: identityRect.height < 120,
          compactFooter: footer.getBoundingClientRect().height < 900,
        };
      })()`,
    });
    interactions.footerTablet = tabletFooterState.result.value;
  }

  if (scenario.name === "mobile-reduced") {
    const reducedFinalState = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const sequence = document.querySelector("[data-final-reveal]");
        const marker = sequence.querySelector(".final-cta__line");
        const items = [...sequence.querySelectorAll(":scope > .eyebrow, :scope > h2, :scope > .final-cta__copy, :scope > .final-cta__button")];
        return {
          sequenceReady: sequence.classList.contains("is-visible"),
          contentReady: items.every((item) => parseFloat(getComputedStyle(item).opacity) === 1),
          markerReady: parseFloat(getComputedStyle(marker).opacity) === 1 && parseFloat(getComputedStyle(marker).scale) === 1,
          footerStill: getComputedStyle(document.getElementById("rodape")).transform === "none",
        };
      })()`,
    });
    interactions.finalReducedMotion = reducedFinalState.result.value;
  }

  results.push({ scenario: scenario.name, ...evaluation.result.value, ...interactions });
}

socket.close();
browser.kill();
const report = { errors, results };
await writeFile(resolve(qaDirectory, "browser-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

await Promise.race([
  new Promise((resolveExit) => browser.once("exit", resolveExit)),
  delay(2000),
]);

try {
  await rm(profileDirectory, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 });
} catch {
  // O perfil é regenerável e permanece apenas se o Crashpad do Chrome ainda o estiver usando.
}

if (
  errors.length ||
  results.some(
    (result) =>
      result.horizontalOverflow ||
      result.missingOrCollapsed.length ||
      (result.targetViewport && !result.targetViewport.targetVisible) ||
      (result.introQuality && Object.values(result.introQuality).some((value) => !value)) ||
      (result.introChrome && Object.values(result.introChrome).some((value) => !value)) ||
      (result.introExit && Object.values(result.introExit).some((value) => !value)) ||
      (result.caseFileTilt && (!result.caseFileTilt.withinLimit || !result.caseFileTilt.officialBackground)) ||
      (result.evidenceKeyboard && Object.values(result.evidenceKeyboard).some((value) => !value)) ||
      (result.procedureFocus && Object.values(result.procedureFocus).some((value) => !value)) ||
      (result.procedureMobile && Object.values(result.procedureMobile).some((value) => !value)) ||
      (result.procedureReducedMotion && Object.values(result.procedureReducedMotion).some((value) => !value)) ||
      (result.experienceDesktop && Object.values(result.experienceDesktop).some((value) => !value)) ||
      (result.experienceResponsive && Object.values(result.experienceResponsive).some((value) => !value)) ||
      (result.experienceReducedMotion && Object.values(result.experienceReducedMotion).some((value) => !value)) ||
      (result.analysisDesktop && Object.values(result.analysisDesktop).some((value) => !value)) ||
      (result.analysisResponsive && Object.values(result.analysisResponsive).some((value) => !value)) ||
      (result.analysisReducedMotion && Object.values(result.analysisReducedMotion).some((value) => !value)) ||
      (result.audienceDesktop && Object.values(result.audienceDesktop).some((value) => !value)) ||
      (result.audienceResponsive && Object.values(result.audienceResponsive).some((value) => !value)) ||
      (result.galleryLayout && Object.values(result.galleryLayout).some((value) => !value)) ||
      (result.galleryResponsive && Object.values(result.galleryResponsive).some((value) => !value)) ||
      (result.galleryKeyboard && Object.values(result.galleryKeyboard).some((value) => !value)) ||
      (result.purchaseDesktop && Object.values(result.purchaseDesktop).some((value) => !value)) ||
      (result.purchaseResponsive && Object.values(result.purchaseResponsive).some((value) => !value)) ||
      (result.purchaseReducedMotion && Object.values(result.purchaseReducedMotion).some((value) => !value)) ||
      (result.faqKeyboard && Object.values(result.faqKeyboard).some((value) => !value)) ||
      (result.faqResponsive && Object.values(result.faqResponsive).some((value) => !value)) ||
      (result.closingDesktop && Object.values(result.closingDesktop).some((value) => !value)) ||
      (result.footerMobile && Object.values(result.footerMobile).some((value) => !value)) ||
      (result.finalReducedMotion && Object.values(result.finalReducedMotion).some((value) => !value)) ||
      (result.scenario === "mobile-reduced" && !result.introStatic) ||
      (result.scenario !== "mobile-reduced" && result.introStatic),
  )
) {
  process.exitCode = 1;
}
