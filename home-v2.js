/* ============================================================
   GickCRM — Home interactions (v5)
   - Hero: particle flow field with Perlin noise, trails, depth
   - Network: bezier-curve data pipeline with glowing pulse trails
   - Showcase tab switching + analytics count-up
   - IntersectionObserver pause/resume
   - prefers-reduced-motion support
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Utility: visibility observer for pause/resume ---------- */
  function watchVisibility(el, onEnter, onLeave) {
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) onEnter && onEnter();
          else onLeave && onLeave();
        });
      },
      { threshold: 0.01 }
    );
    obs.observe(el);
    return obs;
  }

  /* ---------- Lightweight 2D Perlin-like noise ---------- */
  function makeNoise(seed) {
    const perm = new Array(512);
    const p = new Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed || 12345;
    function rand() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function grad(h, x, y) {
      const u = (h & 1) ? x : -x;
      const v = (h & 2) ? y : -y;
      return u + v;
    }
    return function (x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);
      const u = fade(xf);
      const v = fade(yf);
      const aa = perm[perm[X] + Y];
      const ab = perm[perm[X] + Y + 1];
      const ba = perm[perm[X + 1] + Y];
      const bb = perm[perm[X + 1] + Y + 1];
      return lerp(
        lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
        lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
        v
      );
    };
  }

  /* ============================================================
     HERO PARTICLE FLOW FIELD
     Rich particle system with Perlin-noise flow, trails, depth,
     glow, and subtle mouse deflection.
     ============================================================ */
  function initHeroFlow() {
    const canvas = document.getElementById('heroWaveform');
    if (!canvas || reduceMotion) return;

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    let running = true;
    let rafId = null;
    const noise = makeNoise(42);
    let time = 0;
    let mouseX = -9999, mouseY = -9999;

    const COLORS = [
      [19, 78, 74],
      [30, 199, 139],
      [72, 226, 163],
      [16, 120, 93],
      [100, 240, 180],
    ];

    const particles = [];
    const NUM = 220;

    function spawn(p) {
      p.x = Math.random() * W;
      p.y = Math.random() * H;
      p.vx = 0;
      p.vy = 0;
      p.life = 0;
      p.maxLife = 120 + Math.random() * 180;
      p.size = 0.6 + Math.random() * 2.4;
      p.depth = Math.random();
      p.colorIdx = Math.floor(Math.random() * COLORS.length);
      p.trail = [];
    }

    for (let i = 0; i < NUM; i++) {
      const p = {};
      spawn(p);
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

    function render() {
      if (!running) return;

      // Semi-transparent fill for trail effect
      ctx.fillStyle = 'rgba(246, 244, 239, 0.06)';
      ctx.fillRect(0, 0, W, H);

      const noiseScale = 0.0028;
      const flowStrength = 1.8;
      const t = time * 0.003;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;

        // Flow field angle from Perlin noise
        const n = noise(p.x * noiseScale + t, p.y * noiseScale + t * 0.6);
        const angle = n * Math.PI * 4;

        // Apply flow force
        p.vx += Math.cos(angle) * flowStrength * (0.3 + p.depth * 0.7);
        p.vy += Math.sin(angle) * flowStrength * (0.3 + p.depth * 0.7);

        // Mouse repulsion
        if (mouseX > 0) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const force = (140 - dist) / 140 * 3;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Damping
        p.vx *= 0.94;
        p.vy *= 0.94;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Store trail point
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 18) p.trail.shift();

        // Respawn if out of bounds or expired
        if (p.life > p.maxLife || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
          spawn(p);
          continue;
        }

        // Life-based opacity (fade in/out)
        const lifeRatio = p.life / p.maxLife;
        let alpha;
        if (lifeRatio < 0.1) alpha = lifeRatio / 0.1;
        else if (lifeRatio > 0.8) alpha = (1 - lifeRatio) / 0.2;
        else alpha = 1;
        alpha *= 0.35 + p.depth * 0.65;

        const c = COLORS[p.colorIdx];
        const sz = p.size * (0.5 + p.depth * 0.5);

        // Draw trail
        if (p.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let j = 1; j < p.trail.length; j++) {
            ctx.lineTo(p.trail[j].x, p.trail[j].y);
          }
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha * 0.25})`;
          ctx.lineWidth = sz * 0.8;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Draw particle head with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
        ctx.shadowBlur = sz * 6;
        ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},${alpha * 0.5})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      time++;
      rafId = requestAnimationFrame(render);
    }

    function start() { if (!running) { running = true; render(); } }
    function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

    resize();
    window.addEventListener('resize', resize);
    watchVisibility(canvas, start, stop);
    render();
  }

  /* ============================================================
     FLOATING CRM EVENTS (spawn + fade)
     ============================================================ */
  function initHeroEvents() {
    const container = document.getElementById('heroEvents');
    if (!container || reduceMotion) return;

    const events = [
      { text: 'Новая заявка', x: 8, y: 20 },
      { text: 'Задача создана', x: 62, y: 14 },
      { text: 'Следующее действие назначено', x: 5, y: 70 },
      { text: 'Автоматизация выполнена', x: 55, y: 76 },
    ];

    let idx = 0;
    function spawnNext() {
      if (idx >= events.length) {
        setTimeout(() => { idx = 0; spawnNext(); }, 4000);
        return;
      }
      const ev = events[idx];
      const el = document.createElement('div');
      el.className = 'hero-event';
      el.style.left = ev.x + '%';
      el.style.top = ev.y + '%';
      el.innerHTML = `<span class="hero-event__dot"></span><span>${ev.text}</span>`;
      container.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 600);
      }, 3200);
      idx++;
      setTimeout(spawnNext, 2200);
    }

    let started = false;
    watchVisibility(container, () => {
      if (!started) { started = true; setTimeout(spawnNext, 1200); }
    });
  }

  /* ============================================================
     NETWORK DATA-PIPELINE ANIMATION
     Bezier-curve connections, glowing pulse trails, pulsing
     node rings, ambient particles.
     ============================================================ */
  function initNetworkAnimation() {
    const canvas = document.getElementById('networkCanvas');
    if (!canvas || reduceMotion) return;

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    let running = true;
    let rafId = null;
    let time = 0;

    const labelEls = Array.from(document.querySelectorAll('.network-label'));

    // Node positions (relative). Flow: 0→1→2→3→4→5
    const nodeRel = [
      { x: 0.08, y: 0.50 },
      { x: 0.28, y: 0.22 },
      { x: 0.50, y: 0.62 },
      { x: 0.68, y: 0.28 },
      { x: 0.86, y: 0.58 },
      { x: 0.96, y: 0.32 },
    ];

    let nodes = [];

    // Connections: linear chain + cross-links
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
      [0, 2], [1, 3], [2, 4], [3, 5],
    ];

    // Pre-compute control points for bezier curves
    let bezierData = [];

    function computeBeziers() {
      bezierData = connections.map((conn) => {
        const a = nodes[conn[0]];
        const b = nodes[conn[1]];
        if (!a || !b) return null;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;
        const curve = len * 0.18;
        return {
          ax: a.x, ay: a.y, bx: b.x, by: b.y,
          cx1: mx + nx * curve, cy1: my + ny * curve,
          cx2: mx + nx * curve * 0.5, cy2: my + ny * curve * 0.5,
        };
      });
    }

    function bezierPoint(b, t) {
      const u = 1 - t;
      const x = u * u * u * b.ax + 3 * u * u * t * b.cx1 + 3 * u * t * t * b.cx2 + t * t * t * b.bx;
      const y = u * u * u * b.ay + 3 * u * u * t * b.cy1 + 3 * u * t * t * b.cy2 + t * t * t * b.by;
      return { x, y };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = nodeRel.map((n) => ({ x: n.x * W, y: n.y * H }));
      labelEls.forEach((el, i) => {
        if (nodes[i]) {
          el.style.left = nodes[i].x + 'px';
          el.style.top = nodes[i].y + 'px';
        }
      });
      computeBeziers();
    }

    // Pulses traveling along connections
    const pulses = [];
    function spawnPulse() {
      const ci = Math.floor(Math.random() * connections.length);
      pulses.push({
        connIdx: ci,
        progress: 0,
        speed: 0.005 + Math.random() * 0.004,
        size: 2.5 + Math.random() * 2.5,
        trail: [],
      });
    }

    // Ambient background particles
    const ambient = [];
    for (let i = 0; i < 40; i++) {
      ambient.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0003,
        vy: (Math.random() - 0.5) * 0.0003,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.3,
      });
    }

    let activeNode = 0;
    let nodeTimer = 0;

    function drawAmbient() {
      ambient.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(19,78,74,${p.alpha})`;
        ctx.fill();
      });
    }

    function drawConnections() {
      bezierData.forEach((b) => {
        if (!b) return;
        ctx.beginPath();
        ctx.moveTo(b.ax, b.ay);
        ctx.bezierCurveTo(b.cx1, b.cy1, b.cx2, b.cy2, b.bx, b.by);
        ctx.strokeStyle = 'rgba(19,78,74,0.10)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    function drawNodes(t) {
      nodes.forEach((n, i) => {
        if (!n) return;
        const isActive = i === activeNode;
        const breathe = 1 + Math.sin(t * 0.06 + i) * 0.12;
        const r = (isActive ? 8 : 6) * breathe;

        // Pulsing outer rings
        if (isActive) {
          for (let ring = 0; ring < 3; ring++) {
            const ringT = ((t * 0.015 + ring * 0.33) % 1);
            const ringR = r + ringT * 32;
            const ringAlpha = (1 - ringT) * 0.3;
            ctx.beginPath();
            ctx.arc(n.x, n.y, ringR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(72,226,163,${ringAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // Glow halo
        const grad = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, r + 18);
        grad.addColorStop(0, isActive ? 'rgba(72,226,163,0.35)' : 'rgba(19,78,74,0.14)');
        grad.addColorStop(1, 'rgba(19,78,74,0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 18, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#48e2a3' : '#134e4a';
        ctx.shadowBlur = isActive ? 20 : 8;
        ctx.shadowColor = isActive ? 'rgba(72,226,163,0.7)' : 'rgba(19,78,74,0.3)';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner highlight
        ctx.beginPath();
        ctx.arc(n.x - r * 0.25, n.y - r * 0.25, r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)';
        ctx.fill();
      });
    }

    function drawPulses() {
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.progress += p.speed;
        if (p.progress >= 1) { pulses.splice(i, 1); continue; }

        const b = bezierData[p.connIdx];
        if (!b) { pulses.splice(i, 1); continue; }

        const pt = bezierPoint(b, p.progress);
        p.trail.push({ x: pt.x, y: pt.y });
        if (p.trail.length > 14) p.trail.shift();

        // Draw trail
        if (p.trail.length > 2) {
          for (let j = 1; j < p.trail.length; j++) {
            const a = p.trail[j - 1];
            const b2 = p.trail[j];
            const tAlpha = j / p.trail.length;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.strokeStyle = `rgba(72,226,163,${tAlpha * 0.5})`;
            ctx.lineWidth = p.size * tAlpha;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }

        // Pulse head
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120,255,200,0.95)';
        ctx.shadowBlur = 16;
        ctx.shadowColor = 'rgba(72,226,163,0.9)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function render() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      drawAmbient();
      drawConnections();
      drawPulses();
      drawNodes(time);

      // Cycle active node
      nodeTimer++;
      if (nodeTimer > 80) {
        nodeTimer = 0;
        activeNode = (activeNode + 1) % nodes.length;
        labelEls.forEach((el, i) => el.classList.toggle('active', i === activeNode));
      }

      // Spawn pulses
      if (time % 22 === 0) spawnPulse();
      if (time % 37 === 0) spawnPulse();

      time++;
      rafId = requestAnimationFrame(render);
    }

    function start() { if (!running) { running = true; render(); } }
    function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

    resize();
    window.addEventListener('resize', resize);
    watchVisibility(canvas, start, stop);
    render();
  }

  /* ============================================================
     SHOWCASE TAB SWITCHING
     ============================================================ */
  function initShowcase() {
    const tabs = Array.from(document.querySelectorAll('.showcase-v4__tab'));
    const screens = Array.from(document.querySelectorAll('.showcase-v4__screen'));
    if (!tabs.length || !screens.length) return;

    function activate(index) {
      tabs.forEach((t, i) => {
        const active = i === index;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      screens.forEach((s, i) => s.classList.toggle('active', i === index));
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(i));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          activate((i + 1) % tabs.length);
          tabs[(i + 1) % tabs.length].focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          activate((i - 1 + tabs.length) % tabs.length);
          tabs[(i - 1 + tabs.length) % tabs.length].focus();
        }
      });
    });
  }

  /* ============================================================
     ANALYTICS COUNT-UP
     ============================================================ */
  function initCountUp() {
    const badges = document.querySelectorAll('.analytics-badge[data-count]');
    if (!badges.length) return;

    badges.forEach((badge) => {
      const target = parseInt(badge.dataset.count, 10) || 0;
      const b = badge.querySelector('b');
      if (!b) return;
      if (reduceMotion) { b.textContent = String(target); return; }

      let current = 0;
      const step = Math.max(1, Math.ceil(target / 24));

      function tick() {
        current = Math.min(current + step, target);
        b.textContent = String(current);
        if (current < target) requestAnimationFrame(tick);
      }

      watchVisibility(badge, tick);
    });
  }

  /* ============================================================
     DEMO FORM (opens mailto — no fake success)
     ============================================================ */
  function initDemoForm() {
    const form = document.querySelector('[data-contact-form]');
    if (!form) return;
    const recipient = form.dataset.recipient || 'hello@gickcrm.ru';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const company = (data.get('company') || '').toString().trim();
      const contact = (data.get('contact') || '').toString().trim();
      const goal = (data.get('goal') || '').toString().trim();

      const subject = `Демонстрация GickCRM — ${company || name}`;
      const body = [
        `Имя: ${name}`,
        `Компания: ${company}`,
        `Контакт: ${contact}`,
        goal ? `Задача: ${goal}` : '',
      ].filter(Boolean).join('\n');

      window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    initHeroFlow();
    initHeroEvents();
    initNetworkAnimation();
    initShowcase();
    initCountUp();
    initDemoForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
