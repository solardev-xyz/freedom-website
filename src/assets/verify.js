// Copy SHA-256 digests from the download verify panel. No network calls.
(function () {
  function flash(btn, ok) {
    const prev = btn.textContent;
    btn.textContent = ok ? 'Copied' : 'Failed';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = prev;
      btn.disabled = false;
    }, 1200);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copyhash');
    if (!btn) return;
    const hash = btn.getAttribute('data-hash');
    if (!hash) return;
    const done = (ok) => flash(btn, ok);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hash).then(() => done(true)).catch(() => done(false));
      return;
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = hash;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      done(document.execCommand('copy'));
      document.body.removeChild(ta);
    } catch (_) {
      done(false);
    }
  });
})();
