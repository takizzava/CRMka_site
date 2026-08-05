(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const canvas = document.querySelector('#signal-canvas');
  const signalStage = document.querySelector('[data-signal-stage]');
  const eventCard = document.querySelector('[data-signal-event]');

  if (canvas && signalStage) {
    const context = canvas.getContext('2d', { alpha: true });
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const scene = { width: 0, height: 0, dpr: 1, visible: true, frame: 0, start: performance.now() };
    const eventMessages = [
      ['Новая заявка', 'Источник: сайт'],
      ['Задача создана', 'Ответственный назначен'],
      ['Следующий шаг', 'Встреча · завтра, 11:00'],
      ['Автоматизация', 'Сценарий выполнен']
    ];
    let eventIndex = 0;
    let eventTimer = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const mobile = bounds.width < 640;
      scene.width = Math.max(1, bounds.width);
      scene.height = Math.max(1, bounds.height);
      scene.dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1.75);
      canvas.width = Math.round(scene.width * scene.dpr);
      canvas.height = Math.round(scene.height * scene.dpr);
      context.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0);
      draw(performance.now(), true);
    };

    const curvePoint = (x, time, layer, amplitude) => {
      const normalized = x / scene.width;
      const envelope = Math.sin(Math.PI * normalized);
      const slow = Math.sin(normalized * Math.PI * (2.1 + layer * .13) + time * (.00042 + layer * .000035) + layer * 1.8);
      const detail = Math.sin(normalized * Math.PI * (5.4 + layer * .35) - time * .00027 + layer) * .28;
      const pointerLift = Math.exp(-Math.pow((normalized - (.5 + pointer.x * .16)) * 4.2, 2)) * pointer.y * 16;
      return scene.height * (.49 + layer * .028) + (slow + detail) * amplitude * envelope + pointerLift;
    };

    const drawGridGlow = (time) => {
      const glowX = scene.width * (.56 + pointer.x * .07);
      const glowY = scene.height * (.48 + pointer.y * .05);
      const glow = context.createRadialGradient(glowX, glowY, 4, glowX, glowY, scene.width * .46);
      glow.addColorStop(0, 'rgba(76, 225, 159, .13)');
      glow.addColorStop(.5, 'rgba(45, 176, 128, .045)');
      glow.addColorStop(1, 'rgba(16, 71, 63, 0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, scene.width, scene.height);

      const pulse = (time * .00008) % 1;
      context.beginPath();
      context.arc(scene.width * .53, scene.height * .51, 28 + pulse * scene.width * .25, 0, Math.PI * 2);
      context.strokeStyle = `rgba(105, 232, 177, ${.1 * (1 - pulse)})`;
      context.lineWidth = 1;
      context.stroke();
    };

    const draw = (time, staticFrame = false) => {
      if (!context || !scene.width || !scene.height) return;
      context.clearRect(0, 0, scene.width, scene.height);
      pointer.x += (pointer.targetX - pointer.x) * .035;
      pointer.y += (pointer.targetY - pointer.y) * .035;
      drawGridGlow(time);

      const mobile = scene.width < 640;
      const layers = mobile ? 4 : 6;
      const samples = mobile ? 90 : 150;

      for (let layer = layers - 1; layer >= 0; layer -= 1) {
        const amplitude = scene.height * (.1 + layer * .014);
        context.beginPath();
        for (let index = 0; index <= samples; index += 1) {
          const x = (index / samples) * scene.width;
          const y = curvePoint(x, time, layer, amplitude);
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        const opacity = .16 + (layers - layer) * .07;
        context.strokeStyle = `rgba(${80 + layer * 8}, ${220 + layer * 2}, ${157 + layer * 4}, ${opacity})`;
        context.lineWidth = layer === 0 ? 2.2 : 1 + (layers - layer) * .12;
        context.shadowBlur = layer < 2 ? 12 : 4;
        context.shadowColor = 'rgba(79, 224, 160, .34)';
        context.stroke();
      }

      context.shadowBlur = 0;
      const particleCount = mobile ? 5 : 9;
      for (let index = 0; index < particleCount; index += 1) {
        const progress = (time * (.000035 + index * .000002) + index * .127) % 1;
        const x = progress * scene.width;
        const y = curvePoint(x, time, index % Math.min(layers, 4), scene.height * (.1 + (index % 4) * .014));
        const radius = index % 3 === 0 ? 2.4 : 1.4;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = index % 3 === 0 ? 'rgba(220,255,237,.95)' : 'rgba(106,235,179,.72)';
        context.shadowBlur = 10;
        context.shadowColor = '#7aefba';
        context.fill();
      }
      context.shadowBlur = 0;

      if (!staticFrame && scene.visible && !document.hidden && !reducedMotion.matches) {
        scene.frame = window.requestAnimationFrame(draw);
      }
    };

    const start = () => {
      window.cancelAnimationFrame(scene.frame);
      if (scene.visible && !document.hidden && !reducedMotion.matches) scene.frame = window.requestAnimationFrame(draw);
      else draw(performance.now(), true);
    };

    signalStage.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const bounds = signalStage.getBoundingClientRect();
      pointer.targetX = (event.clientX - bounds.left) / bounds.width - .5;
      pointer.targetY = (event.clientY - bounds.top) / bounds.height - .5;
    }, { passive: true });
    signalStage.addEventListener('pointerleave', () => { pointer.targetX = 0; pointer.targetY = 0; });

    const stageObserver = new IntersectionObserver(([entry]) => {
      scene.visible = entry.isIntersecting;
      start();
    }, { rootMargin: '100px 0px' });
    stageObserver.observe(signalStage);
    document.addEventListener('visibilitychange', start);
    reducedMotion.addEventListener?.('change', start);
    new ResizeObserver(resize).observe(canvas);
    resize();
    start();

    if (eventCard && !reducedMotion.matches) {
      eventTimer = window.setInterval(() => {
        if (!scene.visible || document.hidden) return;
        eventCard.classList.add('is-changing');
        window.setTimeout(() => {
          eventIndex = (eventIndex + 1) % eventMessages.length;
          const [title, detail] = eventMessages[eventIndex];
          eventCard.querySelector('strong').textContent = title;
          eventCard.querySelector('small').textContent = detail;
          eventCard.classList.remove('is-changing');
        }, 330);
      }, 3400);
    }
    window.addEventListener('pagehide', () => window.clearInterval(eventTimer), { once: true });
  }

  const showcaseTabs = [...document.querySelectorAll('.showcase-tab')];
  const showcaseImage = document.querySelector('[data-showcase-image]');
  const showcaseTitle = document.querySelector('[data-showcase-title]');
  const showcaseCopy = document.querySelector('[data-showcase-copy]');
  const showcaseIndex = document.querySelector('[data-showcase-index]');

  if (showcaseTabs.length && showcaseImage && showcaseTitle && showcaseCopy && showcaseIndex) {
    showcaseTabs.forEach((tab, index) => {
      tab.id = `showcase-tab-${index + 1}`;
      tab.setAttribute('aria-controls', 'showcase-panel');
      tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
    showcaseImage.closest('[role="tabpanel"]')?.setAttribute('id', 'showcase-panel');
    showcaseImage.closest('[role="tabpanel"]')?.setAttribute('aria-labelledby', 'showcase-tab-1');

    const activateTab = (tab, moveFocus = false) => {
      const nextIndex = showcaseTabs.indexOf(tab);
      if (nextIndex < 0 || tab.classList.contains('is-active')) return;
      showcaseTabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
        item.setAttribute('tabindex', active ? '0' : '-1');
      });
      showcaseImage.classList.add('is-switching');
      const preload = new Image();
      preload.src = tab.dataset.image;
      const swap = () => {
        showcaseImage.src = tab.dataset.image;
        showcaseImage.alt = tab.dataset.alt;
        showcaseTitle.textContent = tab.dataset.title;
        showcaseCopy.textContent = tab.dataset.copy;
        showcaseIndex.textContent = `${String(nextIndex + 1).padStart(2, '0')} / ${String(showcaseTabs.length).padStart(2, '0')}`;
        showcaseImage.closest('[role="tabpanel"]')?.setAttribute('aria-labelledby', tab.id);
        window.requestAnimationFrame(() => showcaseImage.classList.remove('is-switching'));
      };
      if (preload.complete) swap();
      else preload.addEventListener('load', swap, { once: true });
      if (moveFocus) tab.focus();
    };

    showcaseTabs.forEach((tab) => {
      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = showcaseTabs.indexOf(tab);
        const target = event.key === 'Home' ? 0 : event.key === 'End' ? showcaseTabs.length - 1 : event.key === 'ArrowRight' ? (current + 1) % showcaseTabs.length : (current - 1 + showcaseTabs.length) % showcaseTabs.length;
        activateTab(showcaseTabs[target], true);
      });
    });
  }

  const form = document.querySelector('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const recipient = form.dataset.recipient || 'hello@gickcrm.ru';
      const subject = encodeURIComponent(`Запрос демонстрации GickCRM — ${data.get('company')}`);
      const body = encodeURIComponent(`Имя: ${data.get('name')}\nКомпания: ${data.get('company')}\nКонтакт: ${data.get('contact')}\nЗадача: ${data.get('goal') || 'Не указана'}`);
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    });
  }
})();
