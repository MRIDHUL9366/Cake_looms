(function () {
  var rig = document.getElementById('rig');
  rig.querySelectorAll('.layer').forEach(function (l) { l.style.transform = 'translateZ(' + l.dataset.z + 'px)' });
  var host = document.getElementById('shards');
  for (var i = 0; i < 11; i++) {
    var s = document.createElement('i'); s.className = 'shard';
    var w = 8 + Math.random() * 16, a = Math.random() * Math.PI * 2, r = 170 + Math.random() * 190;
    s.style.cssText = 'width:' + w + 'px;height:' + (w * .6) + 'px;margin:-' + w / 2 + 'px 0 0 -' + w / 2 + 'px;' +
      'transform:translate3d(' + (Math.cos(a) * r * 1.5) + 'px,' + (Math.sin(a) * r * .7) + 'px,' + (Math.random() * 80 - 20) + 'px) rotate(' + Math.random() * 180 + 'deg);' +
      'animation-delay:-' + (Math.random() * 7).toFixed(2) + 's;animation-duration:' + (5 + Math.random() * 4).toFixed(2) + 's';
    host.appendChild(s);
  }
  var $ = function (i) { return document.getElementById(i) };
  var fx = $('fx'), fig = $('fig'), fig3 = $('fig3'), contact = $('contact2') || $('contact'), contact3 = $('contact3'), hint = $('hint');
  var cherrySheen = $('cherrySheen'), cherryGlint = $('cherryGlint'), cherryShadow = $('cherryShadow');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v) { return Math.min(1, Math.max(0, v)) }, lerp = function (a, b, t) { return a + (b - a) * t };
  var ease = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2 };

  /* ---------- cherry that travels: hero -> vanilla cake -> dark cake -> delivery box ---------- */
  var OX = .383, A2 = { x: .50, y: .135, h: .19 }, A3 = { x: .50, y: .0784, h: .168 }, A4 = { x: .427, y: .410, h: .125 };
  var vw, vh, H0, W0, ax2, ay2, sc2, ax3, ay3, sc3, ax4, ay4, sc4, r4h, S1, Ta, Tb, Tc, Td, px0, py0;
  function measure() {
    vw = innerWidth; vh = innerHeight;
    H0 = Math.min(vh * (vw < 700 ? .44 : vw < 1000 ? .54 : .66), 560, vw * (vw < 700 ? .56 : vw < 1000 ? .62 : .8) * 900 / 630); W0 = H0 * .7;
    fx.style.width = W0 + 'px'; fx.style.height = H0 + 'px';
    var r = fig.getBoundingClientRect(), r3 = fig3.getBoundingClientRect(), y = scrollY;
    ax2 = r.left + r.width * A2.x; ay2 = r.top + y + r.height * A2.y; sc2 = r.width * A2.h / H0;
    ax3 = r3.left + r3.width * A3.x; ay3 = r3.top + y + r3.height * A3.y; sc3 = r3.width * A3.h / H0;
    S1 = Math.max(vh * .5, ay2 - vh * .55);
    // Smooth scroll transition window between Cake 1 and Cake 2
    Ta = Math.max(S1 + vh * .08, ay2 - vh * .38);
    Tb = ay3 - vh * .50;
    if (Tb - Ta < vh * .35) Tb = Ta + vh * .35;
    px0 = vw / 2 - (.5 - OX) * W0; py0 = vh * (vw < 1000 ? .42 : .5) + H0 / 2;
    var dImg = $('deliveryImg');
    if (dImg) {
      var delRig = $('deliveryRig');
      var prevRigTransform = delRig ? delRig.style.transform : '';
      if (delRig) delRig.style.transform = 'none';
      var r4 = dImg.getBoundingClientRect();
      if (delRig) delRig.style.transform = prevRigTransform;

      ax4 = r4.left + r4.width * A4.x;
      ay4 = r4.top + y + r4.height * A4.y;
      sc4 = r4.width * A4.h / H0;
      r4h = r4.height || (r4.width * 558 / 1024);

      // On mobile (vw < 900), the delivery scooter is stacked at the top of the order section
      // and scrolls past faster than on desktop. Target landing when scooter is at ~52% viewport height.
      var targetBoxVp = (vw < 900) ? 0.52 : 0.48;
      Td = ay4 - vh * targetBoxVp;
      Tc = Math.max(Tb + vh * (vw < 900 ? .08 : .10), ay3 - vh * (vw < 900 ? .34 : .38));
      var minFlight = vh * (vw < 900 ? .28 : .38);
      if (Td - Tc < minFlight) Td = Tc + minFlight;
    }
  }
  addEventListener('resize', measure);
  addEventListener('load', measure);
  ['cakeImg', 'cake3Img', 'deliveryImg'].forEach(function (id) {
    var img = $(id);
    if (img && !img.complete) img.addEventListener('load', measure);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setTimeout(measure, 100);
  setTimeout(measure, 400);
  measure();
  if (cherrySheen && $('cherryImg')) {
    var cm = 'url("' + $('cherryImg').src + '")';
    cherrySheen.style.webkitMaskImage = cm;
    cherrySheen.style.maskImage = cm;
  }

  var tx = 0, ty = 0, cx = 0, cy = 0, t0 = performance.now(), landedAt = -1, state = 0, last = performance.now();
  /* ---------- 3D cakes: tilt, light sweep, moving shadow ---------- */
  var cakes = [['fig', 'tilt2', 'sheen2', 'gs2', 'cakeImg', 0], ['fig3', 'tilt3', 'sheen3', 'gs3', 'cake3Img', 2]].map(function (a) {
    var c = { fig: $(a[0]), tilt: $(a[1]), sheen: $(a[2]), gs: $(a[3]), ph: a[5], intro: reduce ? 0 : 1, seen: false };
    var m = 'url("' + $(a[4]).src + '")'; c.sheen.style.webkitMaskImage = m; c.sheen.style.maskImage = m;
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) c.seen = true }, { threshold: .12 }).observe(c.fig);
    return c;
  });
  function updateCakes(now, dt) {
    if (reduce) return;
    cakes.forEach(function (c) {
      var r = c.fig.getBoundingClientRect(), mid = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      if (c.seen) c.intro += (0 - c.intro) * Math.min(1, dt * 3.2);
      var idle = Math.sin(now / 2600 + c.ph) * 4;
      var ry = cx * 9 + idle - mid * 12 - c.intro * 40, rx = -cy * 4 - mid * 3 + c.intro * 14;
      c.tilt.style.transform = 'perspective(1100px) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg)';
      c.tilt.style.opacity = (1 - c.intro * .9).toFixed(2);
      c.sheen.style.setProperty('--s', (50 - ry * 4.5).toFixed(1) + '%');
      c.gs.style.transform = 'translateX(' + (-ry * 2).toFixed(1) + 'px) scaleX(' + (1 - Math.abs(ry) * .008).toFixed(3) + ')';
      c.gs.style.opacity = (c.ph ? (.75 + .25 * Math.sin(now / 1500)) : 1) * (1 - c.intro * .9);
    });
  }
  addEventListener('pointermove', function (e) { tx = (e.clientX / vw - .5) * 2; ty = (e.clientY / vh - .5) * 2 }, { passive: true });

  /* ---------- chocolate and pastry falling in the hero ---------- */
  var hero = document.querySelector('.hero'), heroDrip = hero.querySelector('.drip');
  var layer = document.createElement('div'); layer.className = 'bake'; layer.setAttribute('aria-hidden', 'true'); hero.insertBefore(layer, $('stage'));
  var dropsEl = document.createElement('div'); dropsEl.className = 'drops'; dropsEl.setAttribute('aria-hidden', 'true'); hero.insertBefore(dropsEl, $('stage'));
  function uri(v) { return 'data:image/svg+xml;utf8,' + encodeURIComponent(v) }
  function mac(a, b) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><defs><radialGradient id="g" cx=".35" cy=".25" r=".85"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient><linearGradient id="c" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff6e4"/><stop offset="1" stop-color="#e3cfa8"/></linearGradient></defs><path d="M12 44Q50 66 88 44V38H12Z" fill="url(#g)"/><rect x="9" y="33" width="82" height="11" rx="5.5" fill="url(#c)"/><path d="M9 33Q9 6 50 6Q91 6 91 33Z" fill="url(#g)"/><ellipse cx="34" cy="17" rx="16" ry="6" fill="#fff" opacity=".28"/></svg>' }
  var SQ = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a3b25"/><stop offset="1" stop-color="#2b150c"/></linearGradient></defs><rect x="6" y="6" width="88" height="88" rx="9" fill="url(#a)"/><g fill="#4a2616" stroke="#7d4a30" stroke-width="2"><rect x="16" y="16" width="30" height="30" rx="5"/><rect x="54" y="16" width="30" height="30" rx="5"/><rect x="16" y="54" width="30" height="30" rx="5"/><rect x="54" y="54" width="30" height="30" rx="5"/></g></svg>';
  var SH = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a4529"/><stop offset="1" stop-color="#24110a"/></linearGradient></defs><polygon points="8,70 40,10 92,30 80,86 30,92" fill="url(#a)"/><polyline points="40,10 92,30" stroke="#a8693f" stroke-width="3" fill="none" opacity=".6"/><polyline points="8,70 40,10" stroke="#a8693f" stroke-width="2" fill="none" opacity=".4"/></svg>';
  var CK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="a" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#dba264"/><stop offset="1" stop-color="#9a5c2c"/></radialGradient></defs><circle cx="50" cy="50" r="44" fill="url(#a)"/><g fill="#33190e"><ellipse cx="34" cy="36" rx="9" ry="6"/><ellipse cx="62" cy="30" rx="8" ry="6"/><ellipse cx="68" cy="58" rx="10" ry="6"/><ellipse cx="40" cy="64" rx="8" ry="6"/><ellipse cx="52" cy="48" rx="6" ry="4"/></g></svg>';
  var SL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 90"><polygon points="10,30 70,30 100,16 40,16" fill="#6a3a24"/><rect x="10" y="30" width="60" height="12" fill="#2f170e"/><rect x="10" y="42" width="60" height="14" fill="#5b3220"/><rect x="10" y="56" width="60" height="8" fill="#d2a177"/><rect x="10" y="64" width="60" height="16" fill="#4c2818"/><polygon points="70,30 100,16 100,66 70,80" fill="#3a1d11"/><rect x="12" y="32" width="20" height="3" rx="1.5" fill="#fff" opacity=".22"/></svg>';
  var ITEMS = [
    { src: uri(mac('#f2a7b8', '#c2506f')), w: 1, asp: .7, crumb: '#f0d6b0' },
    { src: uri(mac('#9a6644', '#4b2a1b')), w: 1, asp: .7, crumb: '#d9b88c' },
    { src: uri(mac('#cbb0ea', '#8f62c4')), w: 1, asp: .7, crumb: '#f0d6b0' },
    { src: uri(SQ), w: .9, asp: 1, crumb: '#3a1d11' },
    { src: uri(SH), w: .85, asp: 1, crumb: '#3a1d11' },
    { src: uri(CK), w: 1, asp: 1, crumb: '#b9803f' },
    { src: uri(SL), w: 1.15, asp: .82, crumb: '#5b3220' }
  ];
  var TIPS = [[80, 100], [230, 74], [370, 90], [660, 118], [810, 84], [1100, 108], [1240, 70], [1376, 96]];
  var B = { items: [], crumbs: [], drops: [], next: .8, dnext: 1.2, run: true };
  new IntersectionObserver(function (en) { B.run = en[0].isIntersecting }, { threshold: 0 }).observe(hero);
  function crumbs(parent, x, y, color, n, power) {
    for (var i = 0; i < n; i++) {
      var el = document.createElement('i'), z = 2.5 + Math.random() * 3.5; el.className = 'crumb';
      el.style.width = z + 'px'; el.style.height = z * .8 + 'px'; el.style.background = color; parent.appendChild(el);
      B.crumbs.push({ el: el, x: x, y: y, vx: (Math.random() - .5) * power, vy: -(Math.random() * power * .9 + 60), t: 0 });
    }
  }
  function spawnItem() {
    var W = layer.clientWidth, it = ITEMS[Math.random() * ITEMS.length | 0], d = .75 + Math.random() * .45;
    var base = Math.min(78, Math.max(W < 700 ? 30 : 38, W * .055)), w = base * d * it.w, h = w * it.asp, x, tries = 0;
    do { x = Math.random() * (W - w) } while (Math.abs((x + w / 2) / W - .5) < (W < 700 ? .24 : .17) && tries++ < 20);
    var el = document.createElement('div'); el.className = 'rc'; el.style.width = w + 'px'; el.style.height = h + 'px';
    var im = new Image(); im.src = it.src; im.alt = ''; im.draggable = false; im.style.cssText = 'display:block;width:100%;height:100%;filter:drop-shadow(0 8px 6px rgba(0,0,0,.5))';
    el.appendChild(im); layer.appendChild(el);
    B.items.push({
      el: el, w: w, h: h, d: d, x: x, y: -h * 1.3, vx: (Math.random() - .5) * 26, vy: 30, t: 0,
      ph: [Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3], rz: (Math.random() - .5) * 40, wz: (Math.random() - .5) * 110,
      landed: false, lt: 0, rest: (Math.random() - .5) * 50, sway: 6 + Math.random() * 10, crumb: it.crumb
    });
  }
  function spawnDrop() {
    var W = dropsEl.clientWidth, tip = TIPS[Math.random() * TIPS.length | 0], dh = heroDrip.offsetHeight;
    var w = Math.max(9, W * .011), el = document.createElement('div'); el.className = 'drop';
    el.style.width = w + 'px'; el.style.height = (w * 1.5) + 'px'; dropsEl.appendChild(el);
    B.drops.push({ el: el, w: w, h: w * 1.5, x: tip[0] / 1440 * W - w / 2, y: tip[1] / 130 * dh - w * .7, t: 0, hang: 1.1 + Math.random() * .9, vy: 0, state: 0, lt: 0 });
  }
  function stepBake(dt) {
    var small = innerWidth < 700, H = layer.clientHeight, floor = H * .93, i;
    if (B.run) {
      B.next -= dt; B.dnext -= dt;
      if (B.next <= 0) { if (B.items.length < (small ? 3 : 4)) spawnItem(); B.next = (small ? 3.4 : 2.4) + Math.random() * 2; }
      if (B.dnext <= 0) { if (B.drops.length < 3) spawnDrop(); B.dnext = (small ? 2.4 : 1.8) + Math.random() * 1.6; }
    }
    for (i = B.items.length - 1; i >= 0; i--) {
      var c = B.items[i], op = 1; c.t += dt;
      if (!c.landed) {
        c.vy += 1500 * (.6 + .4 * c.d) * dt; c.vy *= 1 - .1 * dt;
        c.x += (c.vx + Math.cos(c.t * 1.3 + c.ph[0]) * c.sway) * dt; c.y += c.vy * dt;
        c.wz *= 1 - .8 * dt; c.rz += c.wz * dt;
        if (c.y + c.h >= floor) {
          c.y = floor - c.h;
          if (Math.abs(c.vy) > 200) { crumbs(layer, c.x + c.w / 2, floor, c.crumb, 6 + (c.vy / 260 | 0), 260); c.vy = -c.vy * .32; c.vx += (Math.random() - .5) * 120; c.wz += (Math.random() - .5) * 340; }
          else { c.vy = 0; c.landed = true; c.lt = 0; }
        }
      } else {
        c.lt += dt; c.vx *= 1 - 3 * dt; c.x += c.vx * dt; c.wz *= 1 - 6 * dt; c.rz += (c.rest - c.rz) * Math.min(1, dt * 5);
        if (c.lt > 2.2) op = 1 - (c.lt - 2.2) / 1;
        if (c.lt > 3.2) { c.el.remove(); B.items.splice(i, 1); continue }
      }
      var k = c.landed ? Math.max(0, 1 - c.lt * 3) : 1;
      var rz = c.rz + 20 * Math.sin(c.t * 2.1 + c.ph[0]) * k, rx = 24 * Math.sin(c.t * 1.6 + c.ph[1]) * k, ry = 46 * Math.sin(c.t * 1.2 + c.ph[2]) * k;
      c.el.style.opacity = op;
      c.el.style.transform = 'translate3d(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px,0) rotateZ(' + rz.toFixed(1) + 'deg) rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg)';
    }
    for (i = B.drops.length - 1; i >= 0; i--) {
      var d = B.drops[i]; d.t += dt;
      if (d.state === 0) {                       // a drop swells and stretches on the drip
        var f = Math.min(1, d.t / d.hang), sy = .25 + .75 * f + .9 * Math.pow(f, 4), sx = (.4 + .6 * f) / Math.sqrt(Math.max(1, sy * .8));
        d.el.style.transform = 'translate3d(' + d.x.toFixed(1) + 'px,' + d.y.toFixed(1) + 'px,0) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
        if (f >= 1) { d.state = 1; d.vy = 30; d.y += d.h * (.25 + .75 + .9) * .2 }
      } else if (d.state === 1) {                 // it lets go and falls, stretching with speed
        d.vy += 1900 * dt; d.y += d.vy * dt;
        var sy2 = 1 + Math.min(d.vy / 1100, .9), sx2 = 1 / Math.sqrt(sy2);
        d.el.style.transform = 'translate3d(' + d.x.toFixed(1) + 'px,' + d.y.toFixed(1) + 'px,0) scale(' + sx2.toFixed(3) + ',' + sy2.toFixed(3) + ')';
        if (d.y + d.h * sy2 >= floor) { d.state = 2; d.lt = 0; d.y = floor - d.h * .2; d.el.style.transformOrigin = '50% 100%'; crumbs(dropsEl, d.x + d.w / 2, floor - 2, '#3a1d11', 5, 200) }
      } else {                                 // splat, then fade
        d.lt += dt;
        d.el.style.transform = 'translate3d(' + d.x.toFixed(1) + 'px,' + (d.y - d.h * .8).toFixed(1) + 'px,0) scale(' + (2.2 + d.lt * .8).toFixed(2) + ',' + (.18).toFixed(2) + ')';
        d.el.style.opacity = Math.max(0, 1 - d.lt / .9);
        if (d.lt > .9) { d.el.remove(); B.drops.splice(i, 1) }
      }
    }
    for (i = B.crumbs.length - 1; i >= 0; i--) {
      var q = B.crumbs[i]; q.t += dt; q.vy += 1800 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.y > floor) { q.y = floor; q.vy *= -.3; q.vx *= .5 }
      q.el.style.opacity = Math.max(0, 1 - q.t / .9);
      q.el.style.transform = 'translate3d(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px,0)';
      if (q.t > .9) { q.el.remove(); B.crumbs.splice(i, 1) }
    }
  }

  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!reduce) stepBake(dt);
    var sy = scrollY, p = clamp(sy / S1), e1 = ease(p), q = clamp((sy - Ta) / (Tb - Ta)), e2 = ease(q), k = 1 - e1;
    var u = (Tc && Td && sy > Tc) ? clamp((sy - Tc) / (Td - Tc)) : 0;
    cx += (tx - cx) * .07; cy += (ty - cy) * .07;
    var idle = reduce ? 0 : Math.sin((now - t0) / 2400) * 10, bob = reduce ? 0 : Math.sin((now - t0) / 900) * 8 * k;

    var st = u > 0 ? 3 : (q >= 1 ? 2 : (p >= 1 && q <= 0 ? 1 : 0));
    if (st !== state) { state = st; landedAt = st > 0 ? now : -1 }
    var sx = 1, syy = 1, lift = 0;
    if (landedAt > 0 && !reduce && u === 0) {
      var d = (now - landedAt) / 1000;
      if (state === 2) {                       // dropped onto the dark cake: gravity bounces that die out
        if (d < 1.8) {
          var env = Math.exp(-d * 3.4); lift = Math.abs(Math.sin(d * 8)) * env * sc3 * H0 * .7;
          var sq = env * Math.max(0, 1 - lift / (sc3 * H0 * .1)) * .14; syy = 1 - sq; sx = 1 + sq * .7;
        }
      } else if (d < .9) { var qq = Math.exp(-d * 6) * Math.sin(d * 22); sx = 1 + .07 * qq; syy = 1 - .11 * qq; }
    }

    var px = lerp(px0, ax2, e1) - Math.sin(Math.PI * e1) * vw * .03;
    var py = lerp(py0, ay2 - sy + sc2 * H0 * .04, e1) + bob;
    var sc = lerp(1, sc2, e1);
    /* Cake 1 -> Cake 2: Centered on the scrolling page */
    if (q > 0) {
      var eq = ease(q);
      var y1Vp = ay2 - sy + sc2 * H0 * 0.04;
      var y2Vp = ay3 - sy + sc3 * H0 * 0.04;
      var centerVpY = vh * 0.48; // exact vertical center of the scrolling viewport

      // Smoothly rises from Cake 1 into viewport center at q=0.5, then lands onto Cake 2
      if (q < 0.5) {
        var t1 = q / 0.5;
        var et1 = t1 * t1 * (3 - 2 * t1); // smoothstep
        py = lerp(y1Vp, centerVpY, et1);
      } else {
        var t2 = (q - 0.5) / 0.5;
        var et2 = t2 * t2 * (3 - 2 * t2); // smoothstep
        py = lerp(centerVpY, y2Vp, et2);
      }
      py -= lift;

      // Arcs horizontally across the screen from Cake 1 to Cake 2
      var arcX12 = Math.sin(Math.PI * q) * (vw < 700 ? 16 : 34);
      px = lerp(ax2, ax3, eq) + arcX12;
      sc = lerp(sc2, sc3, eq);
    }

    // Realistic 3D perspective orientation (never collapses to 0-width paper slice)
    var roll = Math.sin(Math.PI * e1) * -22 + (q > 0 ? Math.sin(Math.PI * q) * -26 + Math.cos(q * Math.PI * 2) * 8 : 0);
    var pitch = -cy * 8 * k + Math.sin(Math.PI * e1) * 12 + (q > 0 ? Math.sin(Math.PI * q) * 16 : 0);
    var yaw = (cx * 14 + idle) * k + Math.sin(Math.PI * e1) * 18 + (q > 0 ? Math.sin(Math.PI * q) * -20 : 0);

    var ry = reduce ? 0 : yaw,
        rx = reduce ? 0 : pitch,
        rz = reduce ? 0 : roll;

    var cherryOp = 1;
    if (u > 0 && ax4 !== undefined) {
      var euFlight = ease(clamp(u / 0.85));
      var uDip = clamp((u - 0.85) / 0.10);
      var eDip = uDip * uDip;

      var arcX = Math.sin(Math.PI * euFlight) * (vw < 700 ? -14 : -30);
      px = lerp(ax3, ax4, euFlight) + arcX;

      // Live viewport positions of Cake 2 and Delivery box
      var yCake2Vp = ay3 - sy + sc3 * H0 * 0.04;
      var yBoxVp = ay4 - sy + sc4 * H0 * 0.04;
      var centerBoxY = vh * 0.48; // exact visual center of scrolling screen

      // Smooth piecewise flight: Cake 2 -> screen center -> delivery box
      var baseFlightY;
      if (u < 0.42) {
        var tBox1 = u / 0.42;
        var etBox1 = tBox1 * tBox1 * (3 - 2 * tBox1);
        baseFlightY = lerp(yCake2Vp, centerBoxY, etBox1);
      } else {
        var tBox2 = clamp((u - 0.42) / 0.43);
        var etBox2 = tBox2 * tBox2 * (3 - 2 * tBox2);
        baseFlightY = lerp(centerBoxY, yBoxVp, etBox2);
      }
      var dipY = eDip * (r4h * 0.22);
      py = baseFlightY + dipY;

      sc = lerp(sc3, sc4, euFlight) * (1 - uDip * 0.35);
      if (!reduce) {
        var flightPhase = Math.sin(Math.PI * euFlight);
        ry += flightPhase * 20;
        rx += flightPhase * 14;
        rz += flightPhase * -22;
      }
      if (u >= 0.85) cherryOp = Math.max(0, 1 - (u - 0.85) / 0.10);
    }

    /* AFTER DELIVERY PATTERN: Ensure cherry dips cleanly inside box and NEVER reappears below scooter */
    var isDelivered = (u >= 0.95) || (Td !== undefined && sy >= Td);
    if (isDelivered) {
      fx.style.display = 'none';
      fx.style.visibility = 'hidden';
      fx.style.opacity = '0';
    } else {
      fx.style.display = 'block';
      fx.style.visibility = 'visible';
      fx.style.opacity = cherryOp.toFixed(3);
    }

    fx.style.transform = 'translate3d(' + (px - OX * W0).toFixed(1) + 'px,' + (py - H0).toFixed(1) + 'px,0) perspective(1200px) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg) scale(' + (sc * sx).toFixed(4) + ',' + (sc * syy).toFixed(4) + ')';

    /* Dynamic 3D Spherical Lighting, Glint, and Altitude Shadow */
    if (cherrySheen) {
      var gx = 34 + rx * 0.45 + cx * 6;
      var gy = 30 - ry * 0.35 + cy * 6;
      cherrySheen.style.setProperty('--gx', gx.toFixed(1) + '%');
      cherrySheen.style.setProperty('--gy', gy.toFixed(1) + '%');
    }
    if (cherryGlint) {
      var glx = 32 + rx * 0.35 + cx * 5;
      var gly = 34 - ry * 0.30 + cy * 5;
      cherryGlint.style.setProperty('--glint-x', glx.toFixed(1) + '%');
      cherryGlint.style.setProperty('--glint-y', gly.toFixed(1) + '%');
      var glOp = reduce ? 0.85 : 0.75 + 0.25 * Math.sin((now - t0) / 450 + rz * 0.05);
      cherryGlint.style.setProperty('--glint-op', glOp.toFixed(2));
    }
    if (cherryShadow) {
      var inAir = (q > 0.05 && q < 0.95) || (u > 0.05 && u < 0.85);
      var alt = inAir ? 1 : 0;
      var sblur = lerp(5, 14, alt);
      var sscale = lerp(1.0, 1.35, alt);
      var sop = isDelivered ? 0 : lerp(0.68, 0.32, alt) * cherryOp;
      cherryShadow.style.setProperty('--sblur', sblur.toFixed(1) + 'px');
      cherryShadow.style.setProperty('--sscale', sscale.toFixed(2));
      cherryShadow.style.setProperty('--sop', sop.toFixed(2));
    }

    contact.style.setProperty('--c', (Math.max(0, (e1 - .7) / .3) * (1 - clamp(q * 6))).toFixed(2));
    contact3.style.setProperty('--c', (Math.max(0, (q - .65) / .35) * (1 - clamp(u * 5))).toFixed(2));

    var boxGlow = $('boxGlow');
    if (boxGlow) {
      var bg = 0;
      if (!isDelivered && u > 0.60 && u < 0.95) {
        if (u < 0.85) bg = (u - 0.60) / 0.25;
        else bg = Math.max(0, 1 - (u - 0.85) / 0.10);
      } else {
        bg = 0;
      }
      boxGlow.style.setProperty('--bglow', bg.toFixed(2));
    }

    updateCakes(now, dt);
    var delRig = $('deliveryRig');
    if (delRig) {
      delRig.classList.toggle('packed', u >= 0.90 || isDelivered);
      if (!reduce) {
        var rD = delRig.getBoundingClientRect();
        if (rD.top < vh && rD.bottom > 0) {
          delRig.style.transform = 'perspective(1200px) rotateY(' + (cx * 11).toFixed(2) + 'deg) rotateX(' + (-cy * 6).toFixed(2) + 'deg)';
        }
      }
    }
    hint.style.opacity = sy > 24 ? 0 : 1;
    rig.style.transform = 'rotateY(' + (cx * 16 + idle).toFixed(2) + 'deg) rotateX(' + (-cy * 9).toFixed(2) + 'deg)';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
