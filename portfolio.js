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
  const preview = host.querySelector('.portfolio-youtube');
  if (preview && item.embed) {
    const stage = preview.querySelector('.portfolio-youtube-stage');
    const play = stage.querySelector('button');
    const status = stage.querySelector('[role="status"]');
    play.hidden = false;
    play.addEventListener('click', () => {
      play.disabled = true;
      status.textContent = 'Loading YouTube…';
      const url = new URL(item.embed);
      url.searchParams.set('enablejsapi', '1');
      url.searchParams.set('origin', location.origin);
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('playsinline', '1');
      const frame = element('iframe', {
        src: url.href, title: 'About Regina Xia video', allowfullscreen: '',
        referrerpolicy: 'strict-origin-when-cross-origin',
        allow: 'autoplay; encrypted-media; picture-in-picture; web-share'
      });
      let failed = false;
      let player;
      function unavailable() {
        if (failed) return;
        failed = true;
        clearTimeout(timeout);
        player?.destroy();
        frame.remove();
        play.hidden = false;
        play.disabled = false;
        status.textContent = 'The embedded player could not load. Use Watch on YouTube below.';
      }
      const timeout = setTimeout(unavailable, 9000);
      stage.prepend(frame);
      function connectPlayer() {
        if (failed) return;
        player = new window.YT.Player(frame, { events: {
          onReady: () => {
            clearTimeout(timeout);
            frame.classList.add('is-ready');
            status.textContent = '';
            play.hidden = true;
          },
          onError: unavailable
        } });
      }
      if (window.YT?.Player) connectPlayer();
      else {
        window.onYouTubeIframeAPIReady = connectPlayer;
        let api = document.querySelector('script[data-youtube-api]');
        if (!api) {
          api = element('script', { src: 'https://www.youtube.com/iframe_api', 'data-youtube-api': '' });
          api.addEventListener('error', () => {
            api.remove();
            unavailable();
          }, { once: true });
          document.head.append(api);
        }
      }
    });
  } else if (item.file) {
    host.replaceChildren(element('video', { src: item.file, controls: '', playsinline: '', preload: 'metadata', class: 'portfolio-player' }));
  } else if (item.embed) {
    host.replaceChildren(element('iframe', {
      src: item.embed, title: item.title, loading: 'lazy', allowfullscreen: '',
      referrerpolicy: 'strict-origin-when-cross-origin',
      allow: 'accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share', class: 'portfolio-player'
    }));
  } else {
    const link = element('a', { href: item.url });
    link.textContent = item.title;
    host.replaceChildren(link);
  }
}

for (const list of document.querySelectorAll('[role="tablist"][data-hook="TabsListWrapper"]')) {
  const tabs = [...list.querySelectorAll('[role="tab"][aria-controls]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls'))?.closest('[role="tabpanel"]'));
  if (!tabs.length || panels.some(panel => !panel)) continue;

  function select(index, focus = false) {
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.tabIndex = selected ? 0 : -1;
      tab.setAttribute('aria-selected', String(selected));
      tab.classList.toggle('TabsList2027980309--current', selected);
      const panel = panels[position];
      panel.setAttribute('aria-hidden', String(!selected));
      panel.classList.toggle('Tabscomponent1176390459--isVisible', selected);
      if (!selected) for (const video of panel.querySelectorAll('video')) video.pause();
    });
    if (focus) tabs[index].focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      const moves = {
        ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length,
        Home: 0, End: tabs.length - 1, Enter: index, ' ': index
      };
      if (!Object.hasOwn(moves, event.key)) return;
      event.preventDefault();
      select(moves[event.key], true);
    });
  });
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
for (const book of document.querySelectorAll('.portfolio-book')) {
  const track = book.querySelector('.portfolio-book-track');
  const prev = book.querySelector('[data-book-prev]');
  const next = book.querySelector('[data-book-next]');
  const strip = book.querySelector('.portfolio-book-thumbs');
  const thumbs = [...strip.querySelectorAll('[data-book-page]')];
  const last = thumbs.length - 1;
  const clamp = index => Math.max(0, Math.min(last, index));
  const position = () => clamp(Math.round(track.scrollLeft / track.clientWidth));
  let active = -1;
  let destination;
  let drag;

  function highlight(index) {
    if (active === index) return;
    thumbs[active]?.removeAttribute('aria-current');
    const thumb = thumbs[index];
    thumb.setAttribute('aria-current', 'page');
    prev.setAttribute('aria-disabled', String(index === 0));
    next.setAttribute('aria-disabled', String(index === last));
    active = index;
    if (thumb.offsetLeft < strip.scrollLeft || thumb.offsetLeft + thumb.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollLeft = thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
    }
  }

  function show(index) {
    destination = clamp(index);
    highlight(destination);
    const smooth = !reducedMotion.matches && Math.abs(position() - destination) === 1;
    track.scrollTo({ left: destination * track.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
  }

  prev.addEventListener('click', () => show((destination ?? position()) - 1));
  next.addEventListener('click', () => show((destination ?? position()) + 1));
  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => show(i)));
  track.addEventListener('keydown', event => {
    const current = destination ?? position();
    const index = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: last }[event.key];
    if (index === undefined) return;
    event.preventDefault();
    show(index);
  });
  track.addEventListener('scroll', () => {
    if (destination === undefined) highlight(position());
    else if (Math.abs(track.scrollLeft - destination * track.clientWidth) < 2) destination = undefined;
  }, { passive: true });
  track.addEventListener('scrollend', () => {
    destination = undefined;
    highlight(position());
  });
  track.addEventListener('wheel', () => { destination = undefined; }, { passive: true });
  track.addEventListener('pointerdown', event => {
    destination = undefined;
    // Leave touch and trackpad scrolling to the browser.
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { x: event.clientX, left: track.scrollLeft, page: position() };
    track.setPointerCapture(event.pointerId);
    track.classList.add('is-dragging');
  });
  track.addEventListener('pointermove', event => {
    if (drag) track.scrollLeft = drag.left + drag.x - event.clientX;
  });
  function endDrag(event) {
    if (!drag) return;
    const distance = drag.x - event.clientX;
    const index = event.type === 'pointerup' && Math.abs(distance) > 35
      ? drag.page + Math.sign(distance) : drag.page;
    drag = undefined;
    track.classList.remove('is-dragging');
    show(index);
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  prev.hidden = next.hidden = strip.hidden = false;
  highlight(position());
}

if (!reducedMotion.matches) {
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
  let tileImage = tile.querySelector('img');
  const imageSlot = tile.querySelector('[data-hook="image-item"], [data-hook="item-wrapper"]');
  if (!tileImage && imageSlot && item.image) {
    tileImage = element('img', { src: item.image, alt: item.title, loading: 'lazy', class: 'portfolio-gallery-image' });
    imageSlot.append(tileImage);
  }
  if (tileImage && item.image && !tileImage.getAttribute('src')?.startsWith('/assets/')) {
    tileImage.srcset = '';
    tileImage.src = item.image;
  }
  if (tileImage) {
    renderedItems.add(tile.dataset.id);
    if (!portfolio.mobile && tile.style.display === 'none') {
      tile.style.display = 'block';
      tile.style.opacity = '1';
      tile.setAttribute('aria-hidden', 'false');
    }
  }
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

const alignment = {
  c: 'center', t: 'center top', b: 'center bottom', l: 'left center', r: 'right center',
  tl: 'left top', tr: 'right top', bl: 'left bottom', br: 'right bottom'
};
for (const img of document.querySelectorAll('img[data-portfolio-fill], img[data-portfolio-crop]')) {
  if (img.dataset.portfolioFill) {
    img.style.objectFit = 'cover';
    img.style.objectPosition = alignment[img.dataset.portfolioFill] || 'center';
  }
  if (img.dataset.portfolioCrop) {
    const applyCrop = () => {
      const [left, top, width, height] = img.dataset.portfolioCrop.split(',').map(Number);
      const right = img.naturalWidth - left - width;
      const bottom = img.naturalHeight - top - height;
      if (right < 0 || bottom < 0 || !img.naturalWidth || !img.naturalHeight) return;
      img.style.setProperty('object-view-box',
        'inset(' + [top / img.naturalHeight, right / img.naturalWidth, bottom / img.naturalHeight, left / img.naturalWidth].map(value => value * 100 + '%').join(' ') + ')');
    };
    if (img.complete) applyCrop();
    else img.addEventListener('load', applyCrop, { once: true });
  }
}

if (!portfolio.mobile) {
  for (const inner of document.querySelectorAll('.pro-gallery-margin-container')) {
    if (inner.style.width !== 'auto') continue;
    const outer = inner.closest('.pro-gallery');
    const host = outer?.closest('[id^="comp-"]');
    const tiles = [...inner.querySelectorAll('[data-hook="item-container"]')];
    const originalWidth = Math.max(0, ...tiles.map(tile => (parseFloat(tile.style.left) || 0) + (parseFloat(tile.style.width) || 0)));
    const originalHeight = parseFloat(inner.style.height);
    if (!host || !originalWidth || !originalHeight) continue;
    inner.style.width = originalWidth + 'px';
    inner.style.transformOrigin = 'top left';
    const resize = () => {
      const width = outer.clientWidth;
      if (!width) return;
      const scale = width / originalWidth;
      inner.style.transform = 'scale(' + scale + ')';
      outer.style.height = originalHeight * scale + 'px';
      host.style.height = outer.style.height;
    };
    resize();
    new ResizeObserver(resize).observe(host);
  }
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
