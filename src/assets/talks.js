/**
 * Talks page: YouTube-style stage + rail, privacy-first facades.
 * Nothing loads from YouTube/Google until the user clicks play.
 */
(function () {
  const dataEl = document.getElementById('talks-data');
  const root = document.getElementById('talks-app');
  if (!dataEl || !root) return;

  let talks;
  try {
    talks = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }
  if (!Array.isArray(talks) || !talks.length) return;

  const bySlug = Object.create(null);
  talks.forEach((t) => { bySlug[t.slug] = t; });

  const player = document.getElementById('talk-player');
  const details = document.getElementById('talk-details');
  const rail = document.getElementById('talks-rail');
  if (!player || !details || !rail) return;

  function watchUrl(t) {
    return 'https://www.youtube.com/watch?v=' + encodeURIComponent(t.id);
  }

  function embedUrl(t) {
    return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(t.id) +
      '?autoplay=1&rel=0';
  }

  function setRailCurrent(slug) {
    rail.querySelectorAll('[data-slug]').forEach((el) => {
      const on = el.getAttribute('data-slug') === slug;
      // "Other talks" — hide the one currently in the main spot
      el.hidden = on;
      el.classList.toggle('is-current', on);
      if (on) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
  }

  function renderFacade(t) {
    player.innerHTML = '';
    player.setAttribute('data-video-id', t.id);
    player.setAttribute('data-slug', t.slug);

    const a = document.createElement('a');
    a.className = 'talk-facade';
    a.href = watchUrl(t);
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
    a.setAttribute('aria-label', 'Play video: ' + t.title);

    const img = document.createElement('img');
    img.src = t.thumbnail;
    img.alt = '';
    img.width = 1280;
    img.height = 720;
    img.decoding = 'async';
    a.appendChild(img);

    const play = document.createElement('span');
    play.className = 'talk-play';
    play.setAttribute('aria-hidden', 'true');
    a.appendChild(play);

    a.addEventListener('click', function (e) {
      e.preventDefault();
      injectEmbed(t);
    });

    player.appendChild(a);
  }

  function injectEmbed(t) {
    player.innerHTML = '';
    player.setAttribute('data-video-id', t.id);
    player.setAttribute('data-slug', t.slug);

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl(t);
    iframe.title = t.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    player.appendChild(iframe);
  }

  function renderDetails(t) {
    details.innerHTML = '';

    const h2 = document.createElement('h2');
    h2.className = 'talk-title';
    h2.id = 'talk-heading';
    h2.textContent = t.title;
    details.appendChild(h2);

    const meta = document.createElement('p');
    meta.className = 'talk-meta';
    meta.textContent = t.meta || '';  // pre-formatted by scripts/build.js
    details.appendChild(meta);

    if (t.description) {
      const desc = document.createElement('p');
      desc.className = 'talk-desc';
      desc.textContent = t.description;
      details.appendChild(desc);
    }
  }

  function selectTalk(slug, opts) {
    const t = bySlug[slug] || talks[0];
    const options = opts || {};
    renderFacade(t);
    renderDetails(t);
    setRailCurrent(t.slug);
    root.setAttribute('data-active-slug', t.slug);

    if (options.updateHash !== false) {
      const next = '#' + t.slug;
      if (location.hash !== next) {
        if (options.replace) history.replaceState(null, '', next);
        else history.pushState(null, '', next);
      }
    }
  }

  function slugFromHash() {
    const h = (location.hash || '').replace(/^#/, '');
    return h && bySlug[h] ? h : talks[0].slug;
  }

  // On narrow screens the rail sits below the player, so the swapped-in talk
  // would be off-screen; bring the stage back into view.
  function revealPlayer() {
    const stage = player.parentElement || player;
    const r = stage.getBoundingClientRect();
    if (r.top >= 0 && r.top < window.innerHeight / 2) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stage.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }

  rail.addEventListener('click', function (e) {
    const item = e.target.closest('[data-slug]');
    if (!item || !rail.contains(item)) return;
    // Let modified / non-primary clicks through so Cmd/Ctrl/Shift-click still
    // opens the YouTube link in a new tab or window as the browser intends.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    selectTalk(item.getAttribute('data-slug'));
    revealPlayer();
  });

  window.addEventListener('hashchange', function () {
    selectTalk(slugFromHash(), { updateHash: false });
  });

  // Leave a bare talks.html URL alone so shared links keep showing the newest talk.
  selectTalk(slugFromHash(), { updateHash: false });
})();
