// Ferry site interactions. Every effect checks that its element exists, so subpages can load this too.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }

  // Letter-by-letter headline, after the boarding fog lifts.
  var n = 0;
  $$('[data-split]').forEach(function (el) {
    var t = el.textContent; el.textContent = '';
    t.split('').forEach(function (c) {
      var s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c;
      s.style.animationDelay = (1.25 + n++ * 0.035) + 's'; el.appendChild(s);
    });
  });

  // Header gets a ground once you leave the top.
  var top = $('#topbar');
  function onScroll() { if (top) top.classList.toggle('is-scrolled', scrollY > 40); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Reveal blocks as they come into view.
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  $$('.rv').forEach(function (el) { io.observe(el); });

  // Magnetic buttons.
  if (fine && !reduce) $$('.magnet').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      b.style.transform = 'translate(' + x * 0.22 + 'px,' + y * 0.32 + 'px)';
    });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });

  // Split-flap departures board.
  var CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ.';
  function flapRow(el, target, delay) {
    var len = 11, cells = [];
    el.innerHTML = '';
    for (var i = 0; i < len; i++) { var f = document.createElement('span'); f.className = 'flap'; f.textContent = ' '; el.appendChild(f); cells.push(f); }
    target = (target + '            ').slice(0, len);
    cells.forEach(function (f, i) {
      var goal = target[i], spins = 5 + Math.floor(Math.random() * 10);
      if (reduce) { f.textContent = goal; return; }
      setTimeout(function tick() {
        if (spins-- > 0) {
          f.textContent = CH[Math.floor(Math.random() * CH.length)];
          f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
          setTimeout(tick, 55);
        } else { f.textContent = goal; }
      }, delay + i * 40);
    });
  }
  var board = $('.board');
  if (board) {
    $$('[data-flap]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute('data-flap')); });
    var boarded = false;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !boarded) { boarded = true; $$('[data-flap]').forEach(function (el, i) { flapRow(el, el.getAttribute('data-flap'), i * 120); }); }
    }, { threshold: 0.3 }).observe(board);
    var clock = $('#clock');
    (function tick() { var d = new Date(); clock.textContent = 'Local time ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); setTimeout(tick, 15000); })();
  }

  // The crossing: the ferry's position follows the scroll.
  var crossing = $('#crossing');
  if (crossing) {
    var vessel = $('#vessel'), water = $('.water'), lines = $$('#mdOut .ln'), crates = $$('.crate'), files = $$('.dock--to .files span'), step = $('#stepText');
    var steps = [
      'Scroll to set sail. A chat leaves port with its code, tables and math aboard.',
      'Under way. Ferry reads the page structure, not just the text.',
      'Unloading: headings, a fenced Python block, LaTeX and a table.',
      'Docked. One clean .md file, with the code saved beside it as fib.py.'
    ];
    var crossingTick = function () {
      if (innerWidth <= 820 || reduce) {
        lines.forEach(function (l) { l.classList.add('in'); }); files.forEach(function (f) { f.classList.add('in'); });
        crates.forEach(function (c) { c.classList.add('off'); }); step.textContent = steps[3]; return;
      }
      var r = crossing.getBoundingClientRect(), total = crossing.offsetHeight - innerHeight;
      var p = Math.min(1, Math.max(0, -r.top / total));
      var w = water.clientWidth;
      vessel.style.transform = 'translate(' + (p * w - 75) + 'px,' + (-60 + Math.sin(p * 12) * 10) + '%) rotate(' + Math.sin(p * 14) * 3 + 'deg)';
      var shown = Math.floor(Math.max(0, (p - 0.35) / 0.5) * lines.length);
      lines.forEach(function (l, i) { l.classList.toggle('in', i < shown); });
      crates.forEach(function (c, i) { c.classList.toggle('off', p > 0.42 + i * 0.12); });
      files[0].classList.toggle('in', p > 0.82); files[1].classList.toggle('in', p > 0.9);
      var si = p < 0.15 ? 0 : p < 0.4 ? 1 : p < 0.86 ? 2 : 3;
      if (step.textContent !== steps[si]) step.textContent = steps[si];
    };
    addEventListener('scroll', crossingTick, { passive: true }); addEventListener('resize', crossingTick); crossingTick();
  }

  // Try it: one chat, four outputs.
  var pre = $('#outPre');
  if (pre) {
    var outs = {
      md: { n: 'memoized-fibonacci.md', t: '<span class="c">---\ntitle: Memoized Fibonacci\nsource: ChatGPT\n---</span>\n\n<span class="h">## You</span>\nWrite a memoized Fibonacci in Python…\n\n<span class="h">## ChatGPT</span>\nHere is a version using **lru_cache**:\n\n<span class="k">```python</span>\n@lru_cache\ndef fib(n):\n    return n if n &lt; 2 else fib(n-1) + fib(n-2)\n<span class="k">```</span>\n\n| n  | fib(n) |\n|----|--------|\n| 10 | 55     |\n| 20 | 6765   |' },
      json: { n: 'memoized-fibonacci.json', t: '{\n  <span class="k">"title"</span>: "Memoized Fibonacci",\n  <span class="k">"source"</span>: "chatgpt",\n  <span class="k">"messages"</span>: [\n    { <span class="k">"role"</span>: "user",\n      <span class="k">"content"</span>: "Write a memoized Fibonacci…" },\n    { <span class="k">"role"</span>: "assistant",\n      <span class="k">"content"</span>: "Here is a version using lru_cache…",\n      <span class="k">"code"</span>: [{ <span class="k">"lang"</span>: "python", <span class="k">"text"</span>: "@lru_cache\\ndef fib(n): …" }] }\n  ]\n}' },
      obs: { n: 'Vault / AI chats / Memoized Fibonacci.md', t: '<span class="c">---\ntitle: Memoized Fibonacci\nsource: ChatGPT\n---</span>\n\n<span class="h">## You</span>\nWrite a memoized Fibonacci in Python…\n\n<span class="h">## ChatGPT</span>\n<span class="k">```python</span>\n@lru_cache\ndef fib(n): …\n<span class="k">```</span>\n\n<span class="c">Saved into your vault through Obsidian\'s\nobsidian:// link. Nothing passes through Ferry.</span>' },
      notion: { n: 'Notion / your parent page / Memoized Fibonacci', t: '<span class="h">Heading 2</span>     You\n<span class="c">Paragraph</span>     Write a memoized Fibonacci…\n<span class="h">Heading 2</span>     ChatGPT\n<span class="c">Paragraph</span>     Here is a version using lru_cache\n<span class="k">Code</span>          python · @lru_cache def fib(n): …\n<span class="c">Bulleted list</span> kept as a list\n<span class="c">Quote</span>         kept as a quote\n\n<span class="c">Built with your own Notion key, called\nstraight from your browser. Pro.</span>' }
    };
    var nm = $('#outName');
    var show = function (k) { pre.innerHTML = outs[k].t; nm.textContent = outs[k].n; pre.classList.remove('swap'); void pre.offsetWidth; pre.classList.add('swap'); };
    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () { $$('.tab').forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); }); show(t.getAttribute('data-fmt')); });
    });
    show('md');
  }

  // Odometer: 640 chats.
  var odo = $('#odo');
  if (odo) {
    var digits = [6, 4, 0], cols = $$('.odo__d > span', odo);
    cols.forEach(function (col) { var h = ''; for (var k = 0; k < 2; k++) for (var d = 0; d <= 9; d++) h += '<b>' + d + '</b>'; col.innerHTML = h; });
    var roll = function () {
      cols.forEach(function (col, i) { col.style.transitionDelay = (i * 0.18) + 's'; col.style.transform = 'translateY(-' + (10 + digits[i]) + 'em)'; });
      var bar = $('#manBar'); if (bar) bar.style.width = '100%';
    };
    if (reduce) roll(); else new IntersectionObserver(function (es) { if (es[0].isIntersecting) roll(); }, { threshold: 0.4 }).observe(odo);
  }

  // Chart lanes draw in.
  var chart = $('#chart');
  if (chart) new IntersectionObserver(function (es) { if (es[0].isIntersecting) chart.classList.add('on'); }, { threshold: 0.35 }).observe(chart);

  // Lantern reveal in the hold.
  var hold = $('#hold'), lit = $('#holdLit');
  if (hold && lit) {
    if (fine && !reduce) hold.addEventListener('pointermove', function (e) {
      var r = lit.getBoundingClientRect();
      lit.style.setProperty('--lx', (e.clientX - r.left) + 'px'); lit.style.setProperty('--ly', (e.clientY - r.top) + 'px');
    });
    else { lit.style.webkitMaskImage = 'none'; lit.style.maskImage = 'none'; }
  }

  // Boarding passes lean toward the pointer.
  if (fine && !reduce) $$('.tilt').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = 'rotateY(' + x * 7 + 'deg) rotateX(' + (-y * 7) + 'deg)';
    });
    c.addEventListener('pointerleave', function () { c.style.transform = ''; });
  });

  // Depth gauge.
  var gDot = $('#gaugeDot');
  if (gDot) {
    var gDepth = $('#gaugeDepth'), gLabel = $('#gaugeLabel'), marks = $$('[data-depth]');
    var gauge = function () {
      var max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? scrollY / max : 0;
      gDot.style.top = (p * 100) + '%'; gDepth.textContent = Math.round(p * 420) + ' m';
      var cur = 'Surface'; marks.forEach(function (m) { if (m.getBoundingClientRect().top < innerHeight * 0.5) cur = m.getAttribute('data-depth'); });
      gLabel.textContent = cur.toUpperCase();
    };
    addEventListener('scroll', gauge, { passive: true }); gauge();
  }
})();
