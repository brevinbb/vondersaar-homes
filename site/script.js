/* ============================================================
   Vondersaar Homes — scroll-driven construction
   The wireframe builds foundation → walls → roof → detail,
   then the finished photo materializes with a construction sweep.
   ============================================================ */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- nav stuck state ---------- */
  const nav = $("#nav");
  const onNav = () => nav.classList.toggle("is-stuck", window.scrollY > 40);
  onNav();
  window.addEventListener("scroll", onNav, { passive: true });

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  $$(".about, .build, .process, .work, .contact, .card, .pstep, .work__item").forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });

  if (reduce) return; // final state is baked into CSS

  /* ---------- prep wireframe strokes ---------- */
  // Build order groups, in the sequence a real house goes up.
  const order = ["foundation", "walls", "roof", "detail"];
  const stageName = {
    foundation: "FOUNDATION",
    walls: "FRAMING",
    roof: "ROOFING",
    detail: "FINISHES",
  };

  const groups = order.map((name) => {
    const g = $(`[data-layer="${name}"]`);
    const shapes = g ? $$("line, rect, path", g) : [];
    shapes.forEach((s) => {
      const len = s.getTotalLength();
      s.style.strokeDasharray = len;
      s.style.strokeDashoffset = len;
      s._len = len;
    });
    return { name, shapes };
  });

  const hero = $(".hero");
  const photo = $(".hero__photo");
  const photoImg = $(".hero__photo img");
  const grid = $(".hero__grid");
  const scan = $(".hero__scan");
  const wire = $(".hero__wire");
  const hudVal = $("#hudVal");
  const hudStage = $("#hudStage");

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // fraction of scroll spent constructing the wireframe vs. revealing the photo
  const WIRE_END = 0.62;

  let lastP = -1;

  function render() {
    const rect = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    if (total <= 0) { applyProgress(0); return; }
    const p = clamp(-rect.top / total, 0, 1);
    if (Math.abs(p - lastP) < 0.0008) return;
    lastP = p;
    applyProgress(p);
  }

  function applyProgress(p) {

    /* --- phase 1: construct the wireframe --- */
    const wp = clamp(p / WIRE_END, 0, 1); // 0..1 across the build
    const per = 1 / groups.length;
    let builtFraction = 0;
    let activeStage = "foundation";

    groups.forEach((grp, i) => {
      const gStart = i * per;
      const gp = clamp((wp - gStart) / per, 0, 1);
      if (gp > 0 && gp < 1) activeStage = grp.name;
      else if (gp >= 1) activeStage = grp.name;
      grp.shapes.forEach((s) => {
        s.style.strokeDashoffset = s._len * (1 - gp);
      });
      builtFraction += gp * per;
    });

    /* --- phase 2: materialize the photograph --- */
    const rp = clamp((p - WIRE_END) / (1 - WIRE_END), 0, 1);
    // wipe the photo in left→right
    photo.style.clipPath = `inset(0 ${(1 - rp) * 100}% 0 0)`;
    // warm/saturate as it completes
    photoImg.style.filter = `saturate(${lerp(0.6, 1, rp)}) brightness(${lerp(0.9, 1, rp)})`;
    // blueprint grid fades as the real thing arrives
    grid.style.opacity = String(lerp(0.5, 0, rp));
    // wireframe lingers over the build, then dissolves during reveal
    wire.style.opacity = String(lerp(1, 0, clamp((rp - 0.1) / 0.7, 0, 1)));

    // construction scan line tracks the wipe edge
    if (rp > 0 && rp < 1) {
      scan.style.opacity = "1";
      scan.style.left = `${rp * 100}%`;
    } else {
      scan.style.opacity = "0";
    }

    /* --- HUD readout --- */
    const pct = Math.round((builtFraction * WIRE_END + rp * (1 - WIRE_END)) * 100);
    hudVal.textContent = String(pct).padStart(2, "0") + "%";
    hudStage.textContent = rp > 0.02 ? "MOVE-IN READY" : stageName[activeStage];
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        render();
        ticking = false;
      });
      ticking = true;
    }
  }
  // Debug hook: ?build=0.5 freezes the sequence at a fixed progress for review.
  const forced = new URLSearchParams(location.search).get("build");
  if (forced !== null) {
    applyProgress(clamp(parseFloat(forced), 0, 1));
    return;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { lastP = -1; render(); });
  render();
})();
