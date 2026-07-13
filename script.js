const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));

document.querySelectorAll("[data-counter]").forEach((node) => {
  const target = Number(node.dataset.counter || 0);
  let started = false;

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || started) return;
        started = true;

        if (prefersReducedMotion) {
          node.textContent = target.toLocaleString("ru-RU");
          return;
        }

        const start = performance.now();
        const duration = 1300;

        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          node.textContent = Math.round(target * eased).toLocaleString("ru-RU");
          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );

  counterObserver.observe(node);
});

if (!prefersReducedMotion) {
  const floatingNodes = document.querySelectorAll("[data-float]");

  const animateFloat = () => {
    const time = performance.now() / 1000;
    floatingNodes.forEach((node, index) => {
      const amplitude = Number(node.dataset.float || 10);
      const y = Math.sin(time * 0.9 + index * 0.8) * amplitude;
      node.style.transform = `translate3d(0, ${y}px, 0)`;
    });
    requestAnimationFrame(animateFloat);
  };

  requestAnimationFrame(animateFloat);
}
