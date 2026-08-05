const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('.mobile-menu');

const closeMobileMenu = () => {
  mobileMenu?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Открыть меню');
};

menuButton?.addEventListener('click', () => {
  const open = mobileMenu?.classList.toggle('open') ?? false;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});

mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMobileMenu));

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !mobileMenu?.classList.contains('open')) return;
  closeMobileMenu();
  menuButton?.focus();
});

if (matchMedia('(pointer:fine)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((element) => {
    element.addEventListener('mousemove', (event) => {
      const bounds = element.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      const target = element.querySelector('.crm-window') || element;
      target.style.transform = `rotateY(${x * 7 - 6}deg) rotateX(${-y * 6 + 2}deg) translateZ(0)`;
    });
    element.addEventListener('mouseleave', () => {
      const target = element.querySelector('.crm-window') || element;
      target.style.transform = '';
    });
  });
}
