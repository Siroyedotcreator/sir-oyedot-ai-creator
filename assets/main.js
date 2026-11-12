
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


// Load video players only when people choose to watch. This keeps mobile browsing fast.
const createYouTubeFrame = (id, title) => {
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  const frame = document.createElement('iframe');
  frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&autoplay=1&playsinline=1';
  frame.title = title;
  frame.loading = 'eager';
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  return frame;
};

const reelDialog = document.getElementById('showreel-dialog');
const reelDialogContainer = document.getElementById('showreel-dialog-video');
const resetReelPlayer = () => {
  if (reelDialogContainer) reelDialogContainer.replaceChildren();
};
document.querySelectorAll('[data-video-open]').forEach(button => {
  button.addEventListener('click', () => {
    const id = button.getAttribute('data-video-open');
    if (!id || !reelDialog || !reelDialogContainer || typeof reelDialog.showModal !== 'function') {
      if (id) window.open('https://www.youtube.com/shorts/' + encodeURIComponent(id), '_blank', 'noopener');
      return;
    }
    const frame = createYouTubeFrame(id, 'Sir Oyedot AI Creator selected video');
    if (!frame) return;
    reelDialogContainer.replaceChildren(frame);
    reelDialog.showModal();
  });
});
reelDialog?.querySelector('.showreel-close')?.addEventListener('click', () => reelDialog.close());
reelDialog?.addEventListener('close', resetReelPlayer);
reelDialog?.addEventListener('click', e => { if (e.target === reelDialog) reelDialog.close(); });

document.querySelectorAll('[data-inline-youtube]').forEach(button => {
  button.addEventListener('click', () => {
    const id = button.getAttribute('data-inline-youtube');
    const container = button.closest('.youtube-preview');
    if (!id || !container) return;
    const frame = createYouTubeFrame(id, button.getAttribute('aria-label') || 'Creator video');
    if (frame) container.replaceChildren(frame);
  }, {once:true});
});

// Mobile contact actions use the existing Work and Contact pages, not an unconfirmed phone number.
if (!document.querySelector('.mobile-action-bar')) {
  const bar = document.createElement('nav');
  bar.className = 'mobile-action-bar';
  bar.setAttribute('aria-label','Quick mobile actions');
  const portfolioLink = document.createElement('a');
  portfolioLink.href = 'projects.html#featured-clips';
  portfolioLink.textContent = 'Watch my work';
  const contactLink = document.createElement('a');
  contactLink.href = 'contact.html';
  contactLink.textContent = "Let's connect ↗";
  bar.append(portfolioLink,contactLink);
  document.body.appendChild(bar);
  document.body.classList.add('has-mobile-bar');
}

// Subtle progressive enhancement: content remains visible if scripting is unavailable.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealTargets = document.querySelectorAll('.service-card,.process-step,.feature-card,.project-row,.clip-card,.contact-card');
  const revealObserver = new IntersectionObserver((entries,observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.remove('motion-pending');
        entry.target.classList.add('motion-in');
        observer.unobserve(entry.target);
      }
    }
  }, {rootMargin:'0px 0px -35px 0px',threshold:0.05});
  revealTargets.forEach(target => {
    target.classList.add('motion-item');
    if (target.getBoundingClientRect().top > window.innerHeight + 80) {
      target.classList.add('motion-pending');
      revealObserver.observe(target);
    } else {
      target.classList.add('motion-in');
    }
  });
}
