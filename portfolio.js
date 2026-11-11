const portfolio = JSON.parse(document.getElementById('portfolio-data').textContent);

function element(tag, attributes = {}) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

if (portfolio.mobile) {
  const menu = element('nav', { class: 'portfolio-menu', 'aria-label': 'Main navigation', hidden: '' });
  for (const [label, href] of portfolio.navigation) {
    const link = element('a', { href });
    link.textContent = label;
    menu.append(link);
  }
  document.body.append(menu);
  const trigger = document.querySelector('[data-testid="tinymenu-menubutton"]');
  if (trigger) {
    trigger.setAttribute('aria-label', 'Menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
      trigger.setAttribute('aria-expanded', String(!menu.hidden));
    });
  } else {
    menu.hidden = false;
    menu.classList.add('portfolio-menu-inline');
  }
}

for (const item of portfolio.videos) {
  const host = document.getElementById(item.id);
  if (!host) continue;
  if (item.file) {
    host.replaceChildren(element('video', { src: item.file, controls: '', playsinline: '', preload: 'metadata', class: 'portfolio-player' }));
  } else if (item.embed) {
    host.replaceChildren(element('iframe', {
      src: item.embed, title: item.title, loading: 'lazy', allowfullscreen: '',
      allow: 'accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share', class: 'portfolio-player'
    }));
  } else {
    const link = element('a', { href: item.url });
    link.textContent = item.title;
    host.replaceChildren(link);
  }
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (const item of portfolio.background) {
    const host = document.getElementById(item.container);
    if (!host) continue;
    const layer = host.querySelector('wix-video') || host;
    const video = element('video', {
      src: item.video, autoplay: '', muted: '', loop: '', playsinline: '',
      'aria-hidden': 'true', class: 'portfolio-background'
    });
    video.muted = true;
    video.playbackRate = item.rate || 1;
    layer.classList.add('portfolio-background-host');
    layer.append(video);
    video.play().catch(() => video.remove());
  }
}

const lightbox = element('dialog', { class: 'portfolio-lightbox', 'aria-label': 'Project image' });
const close = element('button', { type: 'button', 'aria-label': 'Close image' });
close.textContent = '×';
const image = element('img');
close.addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});
lightbox.append(close, image);
document.body.append(lightbox);

function activate(item) {
  if (item.link) location.assign(item.link);
  else if (item.image) {
    image.src = item.image;
    image.alt = item.title;
    lightbox.showModal();
  }
}

const renderedItems = new Set();
for (const tile of document.querySelectorAll('[data-hook="item-container"][data-id]')) {
  const item = portfolio.gallery[tile.dataset.id];
  if (!item) continue;
  const tileImage = tile.querySelector('img');
  if (tileImage && item.image && !tileImage.getAttribute('src')?.startsWith('/assets/')) {
    tileImage.srcset = '';
    tileImage.src = item.image;
  }
  if (tileImage) renderedItems.add(tile.dataset.id);
  if (tile.querySelector('a[href]')) continue;
  tile.tabIndex = 0;
  tile.setAttribute('role', item.link ? 'link' : 'button');
  tile.addEventListener('click', () => activate(item));
  tile.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate(item);
  });
}

const remaining = Object.entries(portfolio.gallery).filter(([id, item]) => !renderedItems.has(id) && item.image);
if (remaining.length) {
  const gallery = element('section', { class: 'portfolio-extra-gallery', 'aria-label': 'More project images' });
  for (const [, item] of remaining) {
    const link = element('a', { href: item.link || item.image });
    link.append(element('img', { src: item.image, alt: item.title, loading: 'lazy' }));
    if (!item.link) link.addEventListener('click', event => {
      event.preventDefault();
      activate(item);
    });
    gallery.append(link);
  }
  const footer = document.getElementById('SITE_FOOTER');
  if (footer) footer.before(gallery);
  else document.body.append(gallery);
}
