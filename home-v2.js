/* ============================================================
   GickCRM — Home interactions (v6)
   - Hero: calm full-screen ambient orbs with mouse parallax
   - Network: slow bezier data-pipeline with glowing pulses
   - Showcase tab switching + analytics count-up
   - IntersectionObserver pause/resume
   - prefers-reduced-motion support
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
     HERO AMBIENT ORBS
     Calm full-screen field of soft glowing orbs that drift
     slowly and respond to mouse movement via parallax + proximity.
     ============================================================ */
  function initHeroFlow() {
    const canvas = document.getElementById('heroWaveform');
    const hero = document.querySelector('.hero-v4');
    if (!canvas || !hero || reduceMotion) return;

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    let running = true;
    let rafId = null;
    let time = 0;

    let mx = 0.5, my = 0.5;
    let tmx = 0.5, tmy = 0.5;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      tmx = (e.clientX - rect.left) / rect.width;
      tmy = (e.clientY - rect.top) / rect.height;
    });
    hero.addEventListener('mouseleave', () => { tmx = 0.5; tmy = 0.5; });

    var orbs = [
      { bx: 0.15, by: 0.22, r: 240, color: [19, 78, 74],   alpha: 0.20, sx: 0.00016, sy: 0.00019, px: 38, py: 28, phase: 0.0, depth: 0.8 },
      { bx: 0.75, by: 0.32, r: 300, color: [30, 199, 139], alpha: 0.13, sx: 0.00013, sy: 0.00017, px: 46, py: 36, phase: 1.5, depth: 0.4 },
      { bx: 0.42, by: 0.60, r: 270, color: [16, 120, 93],  alpha: 0.16, sx: 0.00018, sy: 0.00014, px: 42, py: 32, phase: 3.0, depth: 0.6 },
      { bx: 0.88, by: 0.18, r: 200, color: [72, 226, 163], alpha: 0.09, sx: 0.00020, sy: 0.00022, px: 32, py: 24, phase: 4.5, depth: 0.3 },
      { bx: 0.10, by: 0.72, r: 230, color: [19, 78, 74],   alpha: 0.15, sx: 0.00015, sy: 0.00018, px: 36, py: 30, phase: 2.2, depth: 0.7 },
      { bx: 0.58, by: 0.85, r: 210, color: [30, 199, 139], alpha: 0.10, sx: 0.00017, sy: 0.00020, px: 34, py: 26, phase: 5.1, depth: 0.5 },
    ];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = hero.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function render() {
      if (!running) return;

      mx += (tmx - mx) * 0.015;
      my += (tmy - my) * 0.015;

      ctx.clearRect(0, 0, W, H);

      var scale = Math.min(W, H) / 900;

      for (var i = 0; i < orbs.length; i++) {
        var o = orbs[i];

        var driftX = Math.sin(time * o.sx + o.phase) * o.px;
        var driftY = Math.cos(time * o.sy + o.phase) * o.py;

        var parallax = (1 - o.depth) * 70;
        var pX = (mx - 0.5) * parallax;
        var pY = (my - 0.5) * parallax;

        var x = o.bx * W + driftX + pX;
        var y = o.by * H + driftY + pY;

        var mouseDX = x - (mx * W);
        var mouseDY = y - (my * H);
        var dist = Math.sqrt(mouseDX * mouseDX + mouseDY * mouseDY);
        var proximity = Math.max(0, 1 - dist / 350);

        var r = o.r * scale * (1 + proximity * 0.12);
        var a = o.alpha * (1 + proximity * 0.6);

        var c = o.color;
        var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0,   'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')');
        grad.addColorStop(0.4, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a * 0.5) + ')');
        grad.addColorStop(1,   'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');

        ctx.fillStyle = grad;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }

      time++;
      rafId = requestAnimationFrame(render);
    }

    function start() { if (!running) { running = true; render(); } }
    function stop()  { running = false; if (rafId) cancelAnimationFrame(rafId); }

    resize();
    window.addEventListener('resize', resize);
    watchVisibility(canvas, start, stop);
    render();
  }

  /* ============================================================
     FLOATING CRM EVENTS
     ============================================================ */
  function initHeroEvents() {
    var container = document.getElementById('heroEvents');
    if (!container || reduceMotion) return;

    var events = [
      { text: 'Новая заявка', x: 8, y: 20 },
      { text: 'Задача создана', x: 62, y: 14 },
      { text: 'Следующее действие назначено', x: 5, y: 70 },
      { text: 'Автоматизация выполнена', x: 55, y: 76 },
    ];

    var idx = 0;
    function spawnNext() {
      if (idx >= events.length) {
        setTimeout(function () { idx = 0; spawnNext(); }, 5000);
        return;
      }
      var ev = events[idx];
      var el = document.createElement('div');
      el.className = 'hero-event';
      el.style.left = ev.x + '%';
      el.style.top = ev.y + '%';
      el.innerHTML = '<span class="hero-event__dot"></span><span>' + ev.text + '</span>';
      container.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('show'); });
      setTimeout(function () {
        el.classList.remove('show');
        setTimeout(function () { el.remove(); }, 600);
      }, 3400);
      idx++;
      setTimeout(spawnNext, 2800);
    }

    var started = false;
    watchVisibility(container, function () {
      if (!started) { started = true; setTimeout(spawnNext, 1500); }
    });
  }

  /* ============================================================
     NETWORK DATA-PIPELINE (slow, calm)
     ============================================================ */
  function initNetworkAnimation() {
    var canvas = document.getElementById('networkCanvas');
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    var running = true;
    var rafId = null;
    var time = 0;

    var labelEls = Array.prototype.slice.call(document.querySelectorAll('.network-label'));

    var nodeRel = [
      { x: 0.08, y: 0.50 },
      { x: 0.28, y: 0.22 },
      { x: 0.50, y: 0.62 },
      { x: 0.68, y: 0.28 },
      { x: 0.86, y: 0.58 },
      { x: 0.96, y: 0.32 },
    ];

    var nodes = [];

    var connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
      [0, 2], [1, 3], [2, 4], [3, 5],
    ];

    var bezierData = [];

    function computeBeziers() {
      bezierData = connections.map(function (conn) {
        var a = nodes[conn[0]];
        var b = nodes[conn[1]];
        if (!a || !b) return null;
        var mx2 = (a.x + b.x) / 2;
        var my2 = (a.y + b.y) / 2;
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        var nx = -dy / len;
        var ny = dx / len;
        var curve = len * 0.18;
        return {
          ax: a.x, ay: a.y, bx: b.x, by: b.y,
          cx1: mx2 + nx * curve, cy1: my2 + ny * curve,
          cx2: mx2 + nx * curve * 0.5, cy2: my2 + ny * curve * 0.5,
        };
      });
    }

    function bezierPoint(b, t) {
      var u = 1 - t;
      var x = u * u * u * b.ax + 3 * u * u * t * b.cx1 + 3 * u * t * t * b.cx2 + t * t * t * b.bx;
      var y = u * u * u * b.ay + 3 * u * u * t * b.cy1 + 3 * u * t * t * b.cy2 + t * t * t * b.by;
      return { x: x, y: y };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = nodeRel.map(function (n) { return { x: n.x * W, y: n.y * H }; });
      labelEls.forEach(function (el, i) {
        if (nodes[i]) {
          el.style.left = nodes[i].x + 'px';
          el.style.top = nodes[i].y + 'px';
        }
      });
      computeBeziers();
    }

    var pulses = [];
    function spawnPulse() {
      var ci = Math.floor(Math.random() * connections.length);
      pulses.push({
        connIdx: ci,
        progress: 0,
        speed: 0.0025 + Math.random() * 0.002,
        size: 2.5 + Math.random() * 2,
        trail: [],
      });
    }

    var ambient = [];
    for (var i = 0; i < 20; i++) {
      ambient.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0002,
        vy: (Math.random() - 0.5) * 0.0002,
        size: 0.5 + Math.random() * 1.2,
        alpha: 0.08 + Math.random() * 0.2,
      });
    }

    var activeNode = 0;
    var nodeTimer = 0;

    function drawAmbient() {
      ambient.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(19,78,74,' + p.alpha + ')';
        ctx.fill();
      });
    }

    function drawConnections() {
      bezierData.forEach(function (b) {
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
      nodes.forEach(function (n, i) {
        if (!n) return;
        var isActive = i === activeNode;
        var breathe = 1 + Math.sin(t * 0.04 + i) * 0.10;
        var r = (isActive ? 8 : 6) * breathe;

        if (isActive) {
          for (var ring = 0; ring < 3; ring++) {
            var ringT = ((t * 0.01 + ring * 0.33) % 1);
            var ringR = r + ringT * 32;
            var ringAlpha = (1 - ringT) * 0.25;
            ctx.beginPath();
            ctx.arc(n.x, n.y, ringR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(72,226,163,' + ringAlpha + ')';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        var grad = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, r + 18);
        grad.addColorStop(0, isActive ? 'rgba(72,226,163,0.30)' : 'rgba(19,78,74,0.12)');
        grad.addColorStop(1, 'rgba(19,78,74,0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 18, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#48e2a3' : '#134e4a';
        ctx.shadowBlur = isActive ? 18 : 6;
        ctx.shadowColor = isActive ? 'rgba(72,226,163,0.6)' : 'rgba(19,78,74,0.2)';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(n.x - r * 0.25, n.y - r * 0.25, r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)';
        ctx.fill();
      });
    }

    function drawPulses() {
      for (var i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i];
        p.progress += p.speed;
        if (p.progress >= 1) { pulses.splice(i, 1); continue; }

        var b = bezierData[p.connIdx];
        if (!b) { pulses.splice(i, 1); continue; }

        var pt = bezierPoint(b, p.progress);
        p.trail.push({ x: pt.x, y: pt.y });
        if (p.trail.length > 12) p.trail.shift();

        if (p.trail.length > 2) {
          for (var j = 1; j < p.trail.length; j++) {
            var a = p.trail[j - 1];
            var b2 = p.trail[j];
            var tAlpha = j / p.trail.length;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.strokeStyle = 'rgba(72,226,163,' + (tAlpha * 0.45) + ')';
            ctx.lineWidth = p.size * tAlpha;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120,255,200,0.9)';
        ctx.shadowBlur = 14;
        ctx.shadowColor = 'rgba(72,226,163,0.8)';
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

      nodeTimer++;
      if (nodeTimer > 140) {
        nodeTimer = 0;
        activeNode = (activeNode + 1) % nodes.length;
        labelEls.forEach(function (el, i) { el.classList.toggle('active', i === activeNode); });
      }

      if (time % 55 === 0) spawnPulse();
      if (time % 90 === 0) spawnPulse();

      time++;
      rafId = requestAnimationFrame(render);
    }

    function start() { if (!running) { running = true; render(); } }
    function stop()  { running = false; if (rafId) cancelAnimationFrame(rafId); }

    resize();
    window.addEventListener('resize', resize);
    watchVisibility(canvas, start, stop);
    render();
  }

  /* ============================================================
     SHOWCASE TAB SWITCHING
     ============================================================ */
  function initShowcase() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.showcase-v4__tab'));
    var screens = Array.prototype.slice.call(document.querySelectorAll('.showcase-v4__screen'));
    if (!tabs.length || !screens.length) return;

    function activate(index) {
      tabs.forEach(function (t, i) {
        var active = i === index;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      screens.forEach(function (s, i) { s.classList.toggle('active', i === index); });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(i); });
      tab.addEventListener('keydown', function (e) {
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
    var badges = document.querySelectorAll('.analytics-badge[data-count]');
    if (!badges.length) return;

    badges.forEach(function (badge) {
      var target = parseInt(badge.dataset.count, 10) || 0;
      var b = badge.querySelector('b');
      if (!b) return;
      if (reduceMotion) { b.textContent = String(target); return; }

      var current = 0;
      var step = Math.max(1, Math.ceil(target / 24));

      function tick() {
        current = Math.min(current + step, target);
        b.textContent = String(current);
        if (current < target) requestAnimationFrame(tick);
      }

      watchVisibility(badge, tick);
    });
  }

  /* ============================================================
     DEMO FORM
     ============================================================ */
  function initDemoForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;
    var recipient = form.dataset.recipient || 'hello@gickcrm.ru';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get('name') || '').toString().trim();
      var company = (data.get('company') || '').toString().trim();
      var contact = (data.get('contact') || '').toString().trim();
      var goal = (data.get('goal') || '').toString().trim();

      var subject = 'Демонстрация GickCRM — ' + (company || name);
      var body = [
        'Имя: ' + name,
        'Компания: ' + company,
        'Контакт: ' + contact,
        goal ? 'Задача: ' + goal : '',
      ].filter(Boolean).join('\n');

      window.location.href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
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
