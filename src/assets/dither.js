// Two-colour dither backgrounds drawn at each section's real size, so dots stay square.
// Usage: <body data-dither="bayer|stipple|grain" data-px="3">. Sections carry data-from / data-to colours.
(function () {
  const kind = document.body.dataset.dither, px = +document.body.dataset.px || 3;
  const k = document.body.dataset.strength ? +document.body.dataset.strength : 1;  // 1 = pure two-colour dither, lower = softer (mixed with the smooth gradient)
  const B8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
              3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const sized = new WeakMap();
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  function paint(el) {
    const W = Math.ceil(el.offsetWidth / px), H = Math.ceil(el.offsetHeight / px);
    if (!W || !H) return;
    const key = W + 'x' + H; if (sized.get(el) === key) return; sized.set(el, key);
    seed = 7 + els.indexOf(el) * 101;  // same pattern every time: nothing shifts on redraw
    const [a, b] = [hex(el.dataset.from), hex(el.dataset.to)];
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    let noise;
    if (kind === 'stipple') {                       // clustered dots: blurred noise, stretched
      const n = new Float32Array(W * H).map(rnd); noise = new Float32Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, l = n[y * W + (x + W - 1) % W], r = n[y * W + (x + 1) % W],
              u = n[((y + H - 1) % H) * W + x], dn = n[((y + 1) % H) * W + x];
        noise[i] = Math.min(1, Math.max(0, ((n[i] * 2 + l + r + u + dn) / 6 - .25) * 2));
      }
    }
    for (let y = 0; y < H; y++) {
      const t = y / (H - 1);
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const th = kind === 'bayer' ? (B8[(y % 8) * 8 + x % 8] + .5) / 64 : kind === 'stipple' ? noise[i] : rnd();
        const col = th < t ? b : a, o = i * 4;
        for (let c = 0; c < 3; c++) { const smooth = a[c] + (b[c] - a[c]) * t; d[o + c] = Math.round(smooth + (col[c] - smooth) * k); }
        d[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    el.style.backgroundImage = 'url(' + c.toDataURL() + ')';
    el.style.backgroundSize = (W * px) + 'px ' + (H * px) + 'px';
  }
  const els = [...document.querySelectorAll('[data-from]')];
  const all = () => els.forEach(paint);
  all();
  // Only redraw when the width changes: phone browsers fire resize while scrolling (address bar)
  let t, lastW = innerWidth; addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(t); t = setTimeout(all, 200); });
  addEventListener('load', all);
})();
