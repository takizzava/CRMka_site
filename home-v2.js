/* ============================================================
   GickCRM — Home interactions (v4)
   - Hero waveform canvas animation
   - Floating CRM events
   - Network data-flow canvas animation
   - Showcase tab switching
   - Analytics count-up
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

  /* ============================================================
     HERO WAVEFORM ANIMATION
     Multiple flowing green waveform lines + particles + perspective grid
     ============================================================ */
  function initHeroWaveform() {
    const canvas = document.getElementById('heroWaveform');
    if (!canvas || reduceMotion) return;

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    let running = true;
    let rafId = null;

    const lines = [
      { amp: 38, freq: 0.012, speed: 0.018, phase: 0,   y: 0.30, width: 2.4, alpha: 0.85, color: '19,78,74' },
      { amp: 52, freq: 0.008, speed: 0.014, phase: 1.2, y: 0.50, width: 3.0, alpha: 0.60, color: '30,199,139' },
      { amp: 30, freq: 0.016, speed: 0.022, phase: 2.4, y: 0.68, width: 1.8, alpha: 0.40, color: '72,226,163' },
      { amp: 44, freq: 0.010, speed: 0.012, phase: 3.6, y: 0.42, width: 2.0, alpha: 0.50, color: '19,78,74' },
    ];

    const particles = [];
    const NUM_PARTICLES = 18;
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        line: i % lines.length,
        progress: Math.random(),
        speed: 0.0015 + Math.random() * 0.0025,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.5 + Math.random() * 0.5,
      });
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

    function drawGrid() {
      ctx.save();
      ctx.strokeStyle = 'rgba(19,78,74,0.05)';
      ctx.lineWidth = 1;
      const step = 48;
      // perspective-ish horizontal lines
      for (let y = 0; y < H; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let x = 0; x < W; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      ctx.restore();
    }

    function waveY(line, x, time) {
      const baseY = H * line.y;
      return baseY + Math.sin(x * line.freq + time * line.speed + line.phase) * line.amp
        + Math.sin(x * line.freq * 0.5 + time * line.speed * 0.7) * (line.amp * 0.3);
    }

    function drawLine(line, time) {
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y = waveY(line, x, time);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${line.color},${line.alpha})`;
      ctx.lineWidth = line.width;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${line.color},0.4)`;
      ctx.stroke();
      ctx.restore();
    }

    function drawParticles(time) {
      particles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const line = lines[p.line];
        const x = p.progress * W;
        const y = waveY(line, x, time);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(72,226,163,${p.alpha})`;
        ctx.shadowBlur = 14;
        ctx.shadowColor = 'rgba(72,226,163,0.8)';
        ctx.fill();
        ctx.restore();
      });
    }

    let time = 0;
    function render() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      drawGrid();
      lines.forEach((line) => drawLine(line, time));
      drawParticles(time);
      time += 1;
      rafId = requestAnimationFrame(render);
    }

    function start() {
      if (running) return;
      running = true;
      render();
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

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
        // restart cycle after pause
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

    // Start only when hero is visible
    let started = false;
    watchVisibility(container, () => {
      if (!started) { started = true; setTimeout(spawnNext, 1200); }
    });
  }

  /* ============================================================
     NETWORK DATA-FLOW ANIMATION
     6 nodes connected with animated light pulses
     ============================================================ */
  function initNetworkAnimation() {
    const canvas = document.getElementById('networkCanvas');
    if (!canvas || reduceMotion) return;

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    let running = true;
    let rafId = null;

    const labelEls = Array.from(document.querySelectorAll('.network-label'));

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      positionLabels();
    }

    // Node positions (relative). Flow: 0→1→2→3→4→5
    const nodeRel = [
      { x: 0.08, y: 0.50 }, // Заявка
      { x: 0.28, y: 0.22 }, // Коммуникация
      { x: 0.50, y: 0.62 }, // Задача
      { x: 0.68, y: 0.28 }, // Следующее действие
      { x: 0.86, y: 0.58 }, // Автоматизация
      { x: 0.95, y: 0.30 }, // Аналитика
    ];

    let nodes = [];

    function positionLabels() {
      nodes = nodeRel.map((n) => ({ x: n.x * W, y: n.y * H }));
      labelEls.forEach((el, i) => {
        if (nodes[i]) {
          el.style.left = nodes[i].x + 'px';
          el.style.top = nodes[i].y + 'px';
        }
      });
    }

    // Connections: linear chain + a few cross-links
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
      [0, 2], [1, 3], [2, 4], [3, 5],
    ];

    // Pulses traveling along connections
    const pulses = [];
    function spawnPulse() {
      const conn = connections[Math.floor(Math.random() * connections.length)];
      pulses.push({
        from: conn[0],
        to: conn[1],
        progress: 0,
        speed: 0.008 + Math.random() * 0.006,
        size: 2 + Math.random() * 2,
      });
    }

    let activeNode = 0;
    let nodeTimer = 0;

    function drawConnections() {
      connections.forEach((conn) => {
        const a = nodes[conn[0]];
        const b = nodes[conn[1]];
        if (!a || !b) return;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(19,78,74,0.12)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });
    }

    function drawNodes(time) {
      nodes.forEach((n, i) => {
        if (!n) return;
        const isActive = i === activeNode;
        const pulse = isActive ? 1 + Math.sin(time * 0.08) * 0.15 : 1;
        const r = (isActive ? 7 : 5) * pulse;
        ctx.save();
        // glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 8, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, r + 8);
        grad.addColorStop(0, isActive ? 'rgba(72,226,163,0.3)' : 'rgba(19,78,74,0.12)');
        grad.addColorStop(1, 'rgba(19,78,74,0)');
        ctx.fillStyle = grad;
        ctx.fill();
        // core
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#48e2a3' : '#134e4a';
        ctx.shadowBlur = isActive ? 16 : 6;
        ctx.shadowColor = isActive ? 'rgba(72,226,163,0.6)' : 'rgba(19,78,74,0.3)';
        ctx.fill();
        ctx.restore();
      });
    }

    function drawPulses() {
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          pulses.splice(i, 1);
          continue;
        }
        const a = nodes[p.from];
        const b = nodes[p.to];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * p.progress;
        const y = a.y + (b.y - a.y) * p.progress;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(72,226,163,0.9)';
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(72,226,163,0.8)';
        ctx.fill();
        ctx.restore();
      }
    }

    let time = 0;
    function render() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      drawConnections();
      drawPulses();
      drawNodes(time);

      // cycle active node
      nodeTimer++;
      if (nodeTimer > 90) {
        nodeTimer = 0;
        activeNode = (activeNode + 1) % nodes.length;
        labelEls.forEach((el, i) => el.classList.toggle('active', i === activeNode));
      }

      // spawn pulses periodically
      if (time % 28 === 0) spawnPulse();

      time++;
      rafId = requestAnimationFrame(render);
    }

    function start() {
      if (running) return;
      running = true;
      render();
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

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
    initHeroWaveform();
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
