
document.getElementById('year').textContent = new Date().getFullYear();

const button = document.querySelector('.menu-toggle');
const menu = document.querySelector('#primary-nav');

button?.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('is-open');
  button.setAttribute('aria-expanded', String(isOpen));
  button.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});

menu?.querySelectorAll('a').forEach(link =>
  link.addEventListener('click', () => {
    menu.classList.remove('is-open');
    button?.setAttribute('aria-expanded', 'false');
  })
);
