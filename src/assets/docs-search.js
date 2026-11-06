/* Developer docs search. Fetches the build-time index (search-index.json,
   same origin) the first time the box is used and searches it in the page.
   No external services or scripts. */
(function () {
  var form = document.querySelector('.docs-search');
  if (!form) return;
  var input = form.querySelector('input'), list = form.querySelector('.docs-search-results');
  var index = null, loading = null, failed = false, items = [], active = -1;

  function load() {
    if (index || loading) return loading;
    failed = false;
    loading = fetch('search-index.json').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      index = j.map(function (e) {
        return { e: e, p: e.p.toLowerCase(), h: e.h.toLowerCase(), t: e.t.toLowerCase() };
      });
    }).catch(function () { loading = null; failed = true; }); // next keystroke/focus retries
    return loading;
  }

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Highlight all terms in one pass over the raw text, escaping each piece
  // afterwards, so a term can never match inside an earlier <mark> or entity.
  function mark(s, terms) {
    var alts = terms.slice().sort(function (a, b) { return b.length - a.length; })
      .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    if (!alts.length) return esc(s);
    var re = new RegExp(alts.join('|'), 'gi'), out = '', last = 0, m;
    while ((m = re.exec(s))) {
      out += esc(s.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>';
      last = re.lastIndex;
    }
    return out + esc(s.slice(last));
  }
  function snippet(text, terms) {
    var low = text.toLowerCase(), at = -1;
    for (var i = 0; i < terms.length && at < 0; i++) at = low.indexOf(terms[i]);
    var start = Math.max(0, at - 50);
    var s = text.slice(start, start + 160);
    return (start > 0 ? '… ' : '') + s + (start + 160 < text.length ? ' …' : '');
  }

  function search(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length || !index) return [];
    var res = [];
    index.forEach(function (x) {
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i], s = 0;
        if (x.h.indexOf(t) >= 0) s += x.h === t ? 12 : 8;
        if (x.p.indexOf(t) >= 0) s += 4;
        var n = 0, pos = x.t.indexOf(t);
        while (pos >= 0 && n < 5) { n++; pos = x.t.indexOf(t, pos + t.length); }
        s += n;
        if (!s) return; // every term must match somewhere
        score += s;
      }
      if (q.length > 3 && (x.h + ' ' + x.t).indexOf(q.toLowerCase()) >= 0) score += 6;
      res.push({ x: x.e, score: score });
    });
    return res.sort(function (a, b) { return b.score - a.score; }).slice(0, 8).map(function (r) {
      r.terms = terms; return r;
    });
  }

  function render() {
    var q = input.value.trim();
    items = search(q);
    active = -1;
    if (!q) { close(); return; }
    if (!items.length) {
      list.innerHTML = '<li class="docs-search-empty">' + (index ? 'No matches for “' + esc(q) + '”' : failed ? 'Search is unavailable right now' : 'Loading…') + '</li>';
    } else {
      list.innerHTML = items.map(function (r, i) {
        var e = r.x;
        return '<li role="option" id="ds-opt-' + i + '"><a href="' + esc(e.u) + '">' +
          '<span class="ds-where">' + esc(e.k) + ' · ' + mark(e.p, r.terms) + '</span>' +
          (e.h ? '<b>' + mark(e.h, r.terms) + '</b>' : '') +
          '<span class="ds-snip">' + mark(snippet(e.t, r.terms), r.terms) + '</span></a></li>';
      }).join('');
    }
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
  function move(d) {
    if (!items.length) return;
    active = (active + d + items.length) % items.length;
    [].forEach.call(list.children, function (li, i) { li.classList.toggle('active', i === active); });
    input.setAttribute('aria-activedescendant', 'ds-opt-' + active);
    list.children[active].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('focus', function () { load(); if (input.value.trim()) render(); });
  input.addEventListener('input', function () { (load() || Promise.resolve()).then(render); render(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Escape') { if (!list.hidden) close(); else input.blur(); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = items[active >= 0 ? active : 0];
    if (r) location.href = r.x.u;
  });
  list.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  document.addEventListener('click', function (e) { if (!form.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if ((e.key === '/' && !typing) || (typeof e.key === 'string' && e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault(); input.focus(); input.select();
    }
  });
})();
