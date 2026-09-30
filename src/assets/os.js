// Detect the visitor's OS, point the hero button at the right file and highlight its card.
(function () {
  const ua = (navigator.userAgentData?.platform || navigator.platform + ' ' + navigator.userAgent).toLowerCase();
  const os = /android|iphone|ipad/.test(ua) ? null
    : ua.includes('mac') ? 'mac'
    : ua.includes('win') ? 'win'
    : ua.includes('linux') ? 'linux'
    : null;
  const names = { mac: 'macOS', win: 'Windows', linux: 'Linux' };
  const card = os && document.querySelector(`.plat[data-os="${os}"]`);
  if (!card) return;
  card.classList.add('rec');
  const hero = document.getElementById('hero-dl');
  if (hero) {
    hero.textContent = `Download for ${names[os]}`;
    hero.href = card.href;
    hero.setAttribute('download', '');
  }
})();
