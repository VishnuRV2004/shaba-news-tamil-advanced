(() => {
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const native = 'onpagereveal' in window && 'onpageswap' in window && 'CSSViewTransitionRule' in window;
  const storageKey = 'shaba-folio-photo-navigation';
  let clicked = null;

  function route(value) {
    if (!value) return null;
    const url = new URL(value, location.href);
    const match = /^\/folio(?:\/story\/([a-z0-9-]+))?\/?$/.exec(url.pathname);
    return url.origin === location.origin && match ? {id: match[1], path: url.pathname + url.search, hash: url.hash} : null;
  }

  function photo(id, link) {
    const selector = '[data-fo-photo="' + CSS.escape(id) + '"]';
    const local = link?.querySelector(selector) || link?.closest('.fo-cover-section')?.querySelector(selector);
    const options = Array.from(document.querySelectorAll(selector));
    return local || options.find(element => {
      const rect = element.getBoundingClientRect();
      return rect.width && rect.height && rect.top < innerHeight && rect.bottom > 0;
    }) || options[0];
  }

  function target(from, to, entering) {
    if (!from || !to || from.path === to.path || (!from.id && !to.id)) return null;
    const element = photo(to.id || from.id, entering ? null : clicked) || document.querySelector('.fo-story-photo');
    if (entering && !to.id && !to.hash && element) {
      const rect = element.getBoundingClientRect();
      if (rect.top >= innerHeight || rect.bottom <= 0) element.scrollIntoView({block: 'center', behavior: 'instant'});
    }
    return element;
  }

  function remember(value) {
    try { sessionStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* Storage can be unavailable in private browsing. */ }
  }

  document.addEventListener('click', event => {
    if (!motion.matches || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const from = route(location.href), to = route(link.href);
    if (!to || !from || from.path === to.path) return;
    clicked = link;
    if (native) return;
    const element = target(from, to, false);
    const image = element?.matches('img') ? element : element?.querySelector('img');
    if (!image?.naturalWidth) return;
    const {left, top, width, height} = element.getBoundingClientRect();
    remember({from: location.href, to: to.path, src: image.currentSrc, left, top, width, height, time: Date.now()});
  }, true);

  function applyName(transition, from, to, entering) {
    if (!transition || !motion.matches) return;
    const element = target(from, to, entering);
    if (!element) return;
    // The snapshot name must be available before hydration without changing React's server markup.
    const parts = [];
    for (let node = element; node && node !== document.body; node = node.parentElement) {
      parts.unshift(':nth-child(' + (Array.prototype.indexOf.call(node.parentElement.children, node) + 1) + ')');
    }
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('body > ' + parts.join(' > ') + ' { view-transition-name: folio-photo; }');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    const release = () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(active => active !== sheet);
    };
    transition.finished.then(release, release);
  }

  if (native) {
    window.addEventListener('pageswap', event => {
      applyName(event.viewTransition, route(location.href), route(event.activation?.entry?.url || clicked?.href), false);
    });
    window.addEventListener('pagereveal', event => {
      applyName(event.viewTransition, route(window.navigation?.activation?.from?.url || document.referrer), route(location.href), true);
      clicked = null;
    });
    return;
  }

  window.addEventListener('pageshow', () => {
    if (!motion.matches || !Element.prototype.animate) return;
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem(storageKey)); sessionStorage.removeItem(storageKey); } catch { return; }
    const to = route(location.href);
    if (!saved || to?.path !== saved.to || Date.now() - saved.time > 15000) return;
    const element = target(route(saved.from), to, true);
    if (!element) return;
    const end = element.getBoundingClientRect();
    if (!end.width || !end.height || !saved.width || !saved.height) return;
    const overlay = document.createElement('img');
    overlay.src = saved.src; overlay.alt = ''; overlay.setAttribute('aria-hidden', 'true');
    Object.assign(overlay.style, {position:'fixed', pointerEvents:'none', zIndex:'1000', objectFit:'cover', margin:'0', width:end.width+'px', height:end.height+'px', left:end.left+'px', top:end.top+'px', transformOrigin:'0 0'});
    document.body.append(overlay);
    const start = 'translate('+ (saved.left-end.left) +'px,'+ (saved.top-end.top) +'px) scale('+saved.width/end.width+','+saved.height/end.height+')';
    const animation = overlay.animate([{ transform:start, opacity:1 }, { transform:'none', opacity:1, offset:.83 }, { transform:'none', opacity:0 }], {duration:590,easing:'cubic-bezier(.23,.72,.19,1)'});
    animation.finished.then(() => overlay.remove(), () => overlay.remove());
  });
})();
