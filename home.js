// Ferry site interactions: quiet, slow, and only where they explain something.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }

  // Header gets a ground once you leave the top.
  var top = $('#topbar');
  function onScroll() { if (top) top.classList.toggle('is-scrolled', scrollY > 40); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Blocks rise in once as they come into view.
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.rv').forEach(function (el) { io.observe(el); });

  // Photographs drift slightly slower than the page.
  var layers = $$('[data-parallax]');
  function parallax() {
    if (reduce) return;
    layers.forEach(function (l) {
      var r = l.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var mid = r.top + r.height / 2 - innerHeight / 2;
      l.querySelector('img').style.setProperty('--py', (mid * -0.08).toFixed(1) + 'px');
    });
  }
  var hp = $('.history__pic img');
  function picDrift() {
    if (!hp || reduce) return;
    var r = hp.parentElement.getBoundingClientRect();
    hp.style.setProperty('--py', ((r.top + r.height / 2 - innerHeight / 2) * -0.06).toFixed(1) + 'px');
  }

  // Split-flap departures board: each row settles once.
  var CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function flapRow(el, target, delay) {
    var cells = $$('.flap', el);
    if (reduce) return;
    cells.forEach(function (f, i) {
      var goal = target[i] === ' ' ? '\u00a0' : target[i], spins = 4 + Math.floor(Math.random() * 6);
      setTimeout(function tick() {
        if (spins-- > 0) {
          f.textContent = CH[1 + Math.floor(Math.random() * (CH.length - 1))];
          f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
          setTimeout(tick, 70);
        } else { f.textContent = goal; }
      }, delay + i * 45);
    });
  }
  var board = $('.board');
  if (board) {
    $$('[data-flap]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute('data-flap')); $$('.flap', el).forEach(function (f) { f.setAttribute('aria-hidden', 'true'); }); });
    var boarded = false;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !boarded) { boarded = true; $$('[data-flap]').forEach(function (el, i) { flapRow(el, el.getAttribute('data-flap'), i * 160); }); }
    }, { threshold: 0.35 }).observe(board);
    var clock = $('#clock');
    (function tick() { var d = new Date(); clock.textContent = 'Local time ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); setTimeout(tick, 15000); })();
  }

  // The crossing: scroll moves the route, the photo eases in, the file fills.
  var crossing = $('#crossing');
  var crossingTick = function () {};
  if (crossing) {
    var lines = $$('#mdOut .ln'), files = $$('.files span'), step = $('#stepText'), route = $('#route'), pic = $('.crossing__stage .photo img');
    var steps = [
      'A chat leaves port with its code, tables and math aboard.',
      'Under way. Ferry reads the page structure, not just the text.',
      'Arriving: headings, a fenced Python block, LaTeX and a table.',
      'Docked. One clean .md file, with the code saved beside it as fib.py.'
    ];
    crossingTick = function () {
      if (innerWidth <= 820 || reduce) {
        lines.forEach(function (l) { l.classList.add('in'); }); files.forEach(function (f) { f.classList.add('in'); });
        step.textContent = steps[3]; return;
      }
      var r = crossing.getBoundingClientRect(), total = crossing.offsetHeight - innerHeight;
      var p = Math.min(1, Math.max(0, -r.top / total));
      route.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      pic.style.setProperty('--z', (1.18 - p * 0.13).toFixed(3));
      crossing.style.setProperty('--q', p.toFixed(3));
      var shown = Math.floor(Math.max(0, (p - 0.2) / 0.6) * lines.length);
      lines.forEach(function (l, i) { l.classList.toggle('in', i < shown); });
      files[0].classList.toggle('in', p > 0.82); files[1].classList.toggle('in', p > 0.9);
      var si = p < 0.15 ? 0 : p < 0.35 ? 1 : p < 0.85 ? 2 : 3;
      if (step.textContent !== steps[si]) step.textContent = steps[si];
    };
  }

  var ticking = false;
  function frame() { parallax(); picDrift(); crossingTick(); ticking = false; }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame); frame();

  // Try it: one chat, four outputs.
  var pre = $('#outPre');
  if (pre) {
    var outs = {
      md: { n: 'memoized-fibonacci.md', t: '<span class="c">---\ntitle: Memoized Fibonacci\nsource: ChatGPT\n---</span>\n\n<span class="h">## You</span>\nWrite a memoized Fibonacci in Python…\n\n<span class="h">## ChatGPT</span>\nHere is a version using **lru_cache**:\n\n<span class="k">```python</span>\n@lru_cache\ndef fib(n):\n    return n if n &lt; 2 else fib(n-1) + fib(n-2)\n<span class="k">```</span>\n\n| n  | fib(n) |\n|----|--------|\n| 10 | 55     |\n| 20 | 6765   |' },
      json: { n: 'memoized-fibonacci.json', t: '{\n  <span class="k">"title"</span>: "Memoized Fibonacci",\n  <span class="k">"source"</span>: "chatgpt",\n  <span class="k">"messages"</span>: [\n    { <span class="k">"role"</span>: "user",\n      <span class="k">"content"</span>: "Write a memoized Fibonacci…" },\n    { <span class="k">"role"</span>: "assistant",\n      <span class="k">"content"</span>: "Here is a version using lru_cache…" }\n  ]\n}' },
      obs: { n: 'Vault / AI chats / Memoized Fibonacci.md', t: '<span class="c">---\ntitle: Memoized Fibonacci\nsource: ChatGPT\n---</span>\n\n<span class="h">## You</span>\nWrite a memoized Fibonacci in Python…\n\n<span class="h">## ChatGPT</span>\n<span class="k">```python</span>\n@lru_cache\ndef fib(n): …\n<span class="k">```</span>\n\n<span class="c">Saved into your vault through Obsidian\'s\nobsidian:// link. Nothing passes through Ferry.</span>' },
      notion: { n: 'Notion / your page / Memoized Fibonacci', t: '<span class="h">Heading</span>     You\n<span class="c">Text</span>        Write a memoized Fibonacci…\n<span class="h">Heading</span>     ChatGPT\n<span class="c">Text</span>        Here is a version using lru_cache\n<span class="k">Code</span>        python · @lru_cache def fib(n): …\n<span class="c">List</span>        kept as a list\n<span class="c">Quote</span>       kept as a quote\n\n<span class="c">Built with your own Notion key, called\nstraight from your browser. Pro.</span>' }
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
    var roll = function () { cols.forEach(function (col, i) { col.style.transitionDelay = (i * 0.2) + 's'; col.style.transform = 'translateY(-' + (10 + digits[i]) + 'em)'; }); };
    if (reduce) roll(); else new IntersectionObserver(function (es) { if (es[0].isIntersecting) roll(); }, { threshold: 0.5 }).observe(odo);
  }
})();
