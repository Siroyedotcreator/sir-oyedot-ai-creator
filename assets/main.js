
// Keep the mobile navigation accessible, dismissible and in sync across screen sizes.
const menuButton = document.querySelector('.menu-toggle');
const primaryMenu = document.getElementById('primary-nav');
const closeMobileMenu = () => {
  if (!menuButton || !primaryMenu) return;
  primaryMenu.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded','false');
  menuButton.setAttribute('aria-label','Open menu');
};
const yearLabel = document.getElementById('year');
if (yearLabel) yearLabel.textContent = new Date().getFullYear();

menuButton?.addEventListener('click', () => {
  const isOpen = primaryMenu?.classList.toggle('is-open') ?? false;
  menuButton.setAttribute('aria-expanded',String(isOpen));
  menuButton.setAttribute('aria-label',isOpen ? 'Close menu' : 'Open menu');
});
primaryMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click',closeMobileMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && primaryMenu?.classList.contains('is-open')) {
    closeMobileMenu();
    menuButton?.focus();
  }
});
document.addEventListener('pointerdown', event => {
  if (primaryMenu?.classList.contains('is-open') &&
      !event.target.closest('.nav-wrap')) closeMobileMenu();
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 720) closeMobileMenu();
});
