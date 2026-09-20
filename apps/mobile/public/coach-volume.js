/* Reproducible synthetic load test in the unchanged application. No connected account. */
(() => {
  const $ = (id) => document.getElementById(id),
    frame = $("app"),
    start = $("start"),
    pause = $("pause");
  const delay = (ms) => new Promise((r) => setTimeout(r, ms)),
    doc = () => frame.contentDocument;
  let paused = false,
    running = false,
    runId = "",
    stepIndex = -1;
  const speed = () => Number($("speed").value);
  async function gate() {
    while (paused) await delay(100);
  }
  async function until(fn, label) {
    for (let i = 0; i < 150; i++) {
      await gate();
      if (fn()) return;
      await delay(100);
    }
    throw Error(label);
  }
  function check(value, label) {
    if (!value) throw Error(label);
  }
  const chapter = (id) =>
    doc()?.querySelector(`[data-testid="notification-chapter-${id}"]`);
  const rows = () =>
    [...doc().querySelectorAll('[data-testid^="notification-"]')].filter(
      (e) => !e.dataset.testid.startsWith("notification-chapter-"),
    );
  const button = (label) =>
    [...doc().querySelectorAll('[role="button"],button')].find(
      (e) =>
        e.getAttribute("aria-label") === label ||
        e.textContent.trim() === label,
    );
  async function show(el, label) {
    check(el, "Élément absent : " + label);
    await gate();
    $("current").textContent = label;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.style.outline = "2px solid #141414";
    await delay(speed() * 1.5);
    await gate();
    el.style.outline = "";
  }
  async function tap(el, label) {
    await show(el, label);
    el.click();
    await delay(speed());
  }
  const steps = [
    [
      "Vue d’ensemble : six rubriques",
      async () => {
        await tap(button("Notifications"), "Ouvrir les notifications");
        check(rows().length === 0, "Les rubriques doivent être repliées.");
        check(
          doc().querySelectorAll('[data-testid^="notification-chapter-"]')
            .length === 6,
          "Six rubriques attendues.",
        );
      },
    ],
    [
      "Réservations : 10 événements au départ",
      async () => {
        await tap(chapter("booking"), "Ouvrir les réservations");
        check(rows().length === 10, "Dix réservations affichées au départ.");
        await tap(
          button("Voir les précédents"),
          "Afficher dix réservations précédentes",
        );
        check(
          rows().length === 20,
          "Vingt réservations affichées après chargement.",
        );
        await tap(rows()[15], "Consulter une réservation de l’historique");
        await tap(button("Retour"), "Retrouver l’historique chargé");
        check(
          rows().length === 20,
          "Les vingt lignes restent disponibles au retour.",
        );
        await tap(
          button("Réduire l’historique"),
          "Revenir aux dix événements récents",
        );
        check(rows().length === 10, "Historique réduit.");
      },
    ],
    [
      "Annulations : retrouver les 24 séances",
      async () => {
        await tap(chapter("cancelled"), "Ouvrir les annulations");
        check(rows().length === 10, "Dix annulations récentes affichées.");
        await show(
          rows()[0],
          "Les annulations les plus récentes apparaissent en premier.",
        );
      },
    ],
    [
      "Messages : uniquement dans la messagerie",
      async () => {
        check(!chapter("messages"), "Aucun doublon dans les notifications.");
        await tap(button("Retour"), "Revenir à l’espace coach");
        await tap(button("Messages"), "Ouvrir la messagerie dédiée");
        check(
          doc().querySelectorAll('[data-testid^="conversation-"]').length ===
            36,
          "36 conversations attendues.",
        );
        await tap(
          button("Camille Martin"),
          "Ouvrir la conversation de Camille",
        );
        check(
          doc().querySelectorAll('[data-testid^="message-"]').length === 6,
          "Six messages préservés.",
        );
        await tap(button("Retour"), "Retour aux conversations");
        await tap(button("Retour"), "Retour à l’espace coach");
        await tap(
          button("Notifications"),
          "Retour aux notifications générales",
        );
      },
    ],
    [
      "Agenda : une action ancienne reste à traiter",
      async () => {
        await tap(
          button("2 actions à traiter"),
          "Accéder directement aux actions en attente",
        );
        check(
          !chapter("booking"),
          "L’historique ordinaire est masqué pendant le traitement.",
        );
        check(
          chapter("calendar").textContent.includes("1 à traiter"),
          "L’incident ancien doit rester signalé.",
        );
        await tap(
          doc().querySelector('[data-testid="notification-volume-calendar"]'),
          "Consulter l’incident vieux de neuf jours",
        );
        check(
          doc().body.textContent.includes("Google Calendar"),
          "Réglages Google Calendar attendus.",
        );
        await tap(button("Retour"), "Retour aux notifications");
        check(
          chapter("calendar").textContent.includes("1 à traiter"),
          "Lire ne résout pas l’incident.",
        );
      },
    ],
    [
      "Dossier : une deuxième action à retrouver",
      async () => {
        await tap(chapter("dossier"), "Ouvrir le dossier coach");
        check(
          chapter("dossier").textContent.includes("1 à traiter"),
          "Correction encore attendue.",
        );
        await show(
          rows()[0],
          "Cette correction attend depuis douze jours, même si elle est lue.",
        );
      },
    ],
    [
      "Exploration libre du coach fictif",
      async () => {
        await tap(
          button("Toutes les notifications"),
          "Retrouver toutes les rubriques",
        );
        check(!rows().length, "Retour à la vue compacte.");
      },
    ],
  ];
  function draw() {
    const list = $("steps");
    list.replaceChildren(
      ...steps.map(([name]) => {
        const li = document.createElement("li");
        li.textContent = name;
        return li;
      }),
    );
  }
  function fit() {
    const area = document.querySelector(".stage"),
      scale = Math.min(
        1,
        (area.clientWidth || 430) / 406,
        Math.max(420, innerHeight - 125) / 888,
      );
    document.querySelector(".device").style.transform = `scale(${scale})`;
    Object.assign(document.querySelector(".sizer").style, {
      width: 406 * scale + "px",
      height: 888 * scale + "px",
    });
  }
  async function play() {
    if (running) return;
    running = true;
    paused = false;
    stepIndex = -1;
    start.disabled = true;
    pause.disabled = false;
    pause.textContent = "Pause";
    $("result").textContent = "";
    $("bar").style.width = "0";
    draw();
    try {
      const response = await fetch("coach-volume.json", { cache: "no-store" });
      check(response.ok, "Chargement des données impossible.");
      const payload = await response.json();
      if (runId) localStorage.removeItem("partant-native-recette-" + runId);
      runId = "volume-" + crypto.randomUUID();
      localStorage.setItem(
        "partant-native-recette-" + runId,
        JSON.stringify(payload.store),
      );
      frame.src = "/?data=preview&recette=" + runId;
      await until(
        () =>
          frame.contentWindow.location.search.includes(runId) &&
          button("Notifications"),
        "Chargement de l’application impossible.",
      );
      for (let i = 0; i < steps.length; i++) {
        stepIndex = i;
        $("steps").children[i].className = "active";
        await steps[i][1]();
        $("steps").children[i].className = "done";
        $("bar").style.width = ((i + 1) / steps.length) * 100 + "%";
      }
      $("current").textContent =
        "Simulation terminée. Vous pouvez explorer le téléphone.";
      $("result").textContent =
        "Les rubriques affichent dix événements au départ, puis dix de plus sur demande. Les pages chargées restent disponibles au retour d’un détail. Les actions anciennes disposent d’un accès direct et les messages restent dans la messagerie.";
    } catch (e) {
      if (stepIndex >= 0) $("steps").children[stepIndex].className = "failed";
      $("current").textContent = "Simulation interrompue.";
      $("result").textContent = e.message;
    } finally {
      running = false;
      paused = false;
      start.disabled = false;
      start.textContent = "Rejouer la simulation";
      pause.disabled = true;
      pause.textContent = "Pause";
    }
  }
  start.addEventListener("click", play);
  pause.addEventListener("click", () => {
    paused = !paused;
    pause.textContent = paused ? "Reprendre" : "Pause";
  });
  window.addEventListener("resize", fit);
  draw();
  fit();
  if (new URLSearchParams(location.search).get("autoplay") === "1")
    setTimeout(play, 1200);
})();
