(function(){
  if (!matchMedia('(pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('[data-stack-tilt]').forEach((stack) => {
    const main = stack.querySelector('.screen-card--main');
    const secondary = stack.querySelector('.screen-card--secondary');
    if (!main || !secondary) return;

    const apply = (el, rx, ry, tx, ty, scale = 1) => {
      el.style.transform = `perspective(1600px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    };

    stack.addEventListener('mousemove', (event) => {
      const rect = stack.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      apply(main, 9 - py * 7, -12 + px * 14, px * 10, py * 12, 1.01);
      apply(secondary, 10 - py * 8, -16 + px * 16, px * 18, py * 14, 1.02);
    });

    stack.addEventListener('mouseleave', () => {
      main.style.transform = '';
      secondary.style.transform = '';
    });
  });
})();

(function(){
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const recipient = form.dataset.recipient || 'hello@gickcrm.ru';
    const subject = encodeURIComponent(`Запрос демонстрации GickCRM — ${data.get('company') || 'новая компания'}`);
    const body = encodeURIComponent([
      'Здравствуйте! Хочу получить демонстрацию GickCRM.',
      '',
      `Имя: ${data.get('name') || ''}`,
      `Компания: ${data.get('company') || ''}`,
      `Контакт: ${data.get('contact') || ''}`,
      `Задача: ${data.get('goal') || 'Не указана'}`
    ].join('\n'));

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  });
})();
