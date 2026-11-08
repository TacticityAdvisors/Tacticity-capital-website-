(function () {
  var root = document.documentElement;
  var body = document.body;
  var header = document.querySelector('.header_header');
  var menu = document.querySelector('.menu_menu');
  var burger = document.querySelector('.header_burger');
  var page = document.getElementById('page');
  var io, titleTimer, rafId, lastY = 0, navigating = false;

  /* ---- viewport height var (original sets --vh from innerHeight) ---- */
  function setVh() { root.style.setProperty('--vh', window.innerHeight + 'px'); }
  setVh(); window.addEventListener('resize', setVh);

  /* ---- menu ---- */
  function setMenu(open) {
    menu.classList.toggle('is-active', open);
    burger.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    body.classList.toggle('is-locked', open);
    if (open) header.classList.add('is-active');
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-active')); });

  /* ---- header: hides on scroll down, returns on scroll up ---- */
  function onScroll() {
    var y = window.scrollY;
    if (!menu.classList.contains('is-active')) {
      header.classList.toggle('is-active', y < 50 || y < lastY);
    }
    lastY = y;
    updatePanel();
    updateDark();
    updateMask();
  }
  window.addEventListener('scroll', function () {
    if (!rafId) rafId = requestAnimationFrame(function () { rafId = 0; onScroll(); });
  }, { passive: true });

  /* header turns white while over black sections */
  function updateDark() {
    var els = page.querySelectorAll('[data-dark]'), on = false, hy = header.offsetHeight / 2 + header.offsetTop;
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (r.top <= hy && r.bottom >= hy) { on = true; break; }
    }
    header.classList.toggle('on-dark', on || maskDark);
  }

  /* ---- "Our Funds" circular mask driven by scroll ---- */
  function updateMask() {
    var sec = page.querySelector('.mask_section');
    if (!sec || window.innerWidth < 812) return;
    var r = sec.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
    var ease = function (t) { return 1 - Math.pow(1 - t, 2); };
    var circle = sec.querySelector('.mask_circle');
    var big = Math.hypot(window.innerWidth, window.innerHeight);
    var rad = p < .25 ? ease(p / .25) * 18 : 18 + (p - .25) / .75 * big;
    circle.style.setProperty('--r', rad + 'px');
    circle.style.setProperty('--cx', (12 + p * 60) + '%');
    sec.style.setProperty('--o', p > .6 ? 1 : 0);
  }

  /* ---- per-page init (runs on first load and after every transition) ---- */
  function initPage() {
    // generate pattern lines
    page.querySelectorAll('[data-lines]').forEach(function (el) {
      el.innerHTML = '';
      for (var i = 0; i < +el.dataset.lines; i++) {
        var d = document.createElement('div');
        d.className = 'index_line'; d.style.setProperty('--index', i);
        el.appendChild(d);
      }
    });
    // split text into masked lines
    page.querySelectorAll('[data-split]').forEach(function (el) {
      el.innerHTML = el.dataset.split.split('|').map(function (t) {
        return '<span class="animatedTitle_line animatedTitle_br"><span class="animatedTitle_lineAnimated">' + t + '</span></span>';
      }).join('');
    });
    // reveal on view
    if (io) io.disconnect();
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var d = +e.target.dataset.delay || 0;
          setTimeout(function () { e.target.classList.add('is-in'); }, d);
          io.unobserve(e.target);
        }
      });
    }, { threshold: .2 });
    page.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });

    initTitleLoop();
    onScroll();
  }

  /* ---- hero title loop (a single word just slides in and stays) ---- */
  function initTitleLoop() {
    clearInterval(titleTimer);
    page.querySelectorAll('.titleLoop').forEach(function (loop) {
      var words = loop.querySelectorAll('.titleLoop_word');
      var i = 0;
      setTimeout(function () {
        loop.classList.add('is-ready');
        words[0].classList.add('is-current');
      }, 200);
      if (words.length < 2) return;
      titleTimer = setInterval(function () {
        var prev = words[i];
        i = (i + 1) % words.length;
        prev.classList.remove('is-current'); prev.classList.add('is-past');
        words[i].classList.remove('is-past'); words[i].style.transition = 'none';
        words[i].style.transform = 'translate3d(0,100%,0)';
        void words[i].offsetWidth;
        words[i].style.transition = ''; words[i].style.transform = '';
        words[i].classList.add('is-current');
      }, 2600);
    });
  }

  /* ---- strategy / team: dark circle follows the cursor, then swallows the hero on scroll ---- */
  var mx = null, my = null, maskDark = false, mRaf = 0;
  window.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!mRaf) mRaf = requestAnimationFrame(function () { mRaf = 0; updatePanel(); });
  }, { passive: true });

  function updatePanel() {
    var sec = page.querySelector('.maskp');
    maskDark = false;
    if (!sec || window.innerWidth < 812) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var r = sec.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
    var s = sec.querySelector('.maskp_sticky').getBoundingClientRect();
    var dark = sec.querySelector('.maskp_dark');
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    var k = ease(Math.min(1, p / .3));
    var x0 = mx == null ? vw / 2 : mx, y0 = my == null ? vh / 2 : my;
    var cx = x0 + (vw / 2 - x0) * k - s.left;
    var cy = y0 + (vh / 2 - y0) * k - s.top;
    var rad = ease(Math.min(1, p / .8)) * Math.hypot(vw, vh) * .55;   // no circle until you scroll
    dark.style.clipPath = 'circle(' + rad.toFixed(1) + 'px at ' + cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px)';
    sec.classList.toggle('is-open', p > .6);
    sec.classList.toggle('is-scrolled', p > .02);
    maskDark = p > .6 && r.bottom > 60;
  }

  /* ---- filters (team + strategies) ---- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-filter]');
    if (!b) return;
    var wrap = b.closest('.directory');
    wrap.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
    var f = b.dataset.filter;
    wrap.querySelectorAll('[data-cat]').forEach(function (it) {
      var show = f === 'all' || (' ' + it.dataset.cat + ' ').indexOf(' ' + f + ' ') > -1;
      it.hidden = !show;
      it.classList.remove('is-shown');
      if (show) { void it.offsetWidth; it.classList.add('is-shown'); }
    });
  });

  /* ---- page transition ----
     Mirrors the original (react-spring useTransition, exitBeforeEnter):
     leave  -> old page hidden immediately
     enter  -> new page fades opacity 0 -> 1 over 1500ms, quartOut easing   */
  function fadeIn() {
    root.classList.remove('pre-fade');
    page.classList.remove('is-leaving');
    page.classList.add('is-entering');
    void page.offsetWidth;
    requestAnimationFrame(function () {
      page.classList.add('is-entering-active');
      setTimeout(function () {
        page.classList.remove('is-entering', 'is-entering-active');
      }, 1550);
    });
  }

  function applyTheme(el) {
    var d = el || page;
    body.style.backgroundColor = d.dataset.bg || '#fff';
    if (d.dataset.accent) root.style.setProperty('--accent', d.dataset.accent);
  }

  function go(url, push) {
    if (navigating) return;
    navigating = true;
    page.classList.add('is-leaving');                 // leave: old page hidden immediately
    setMenu(false);
    fetch(url).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var next = doc.getElementById('page');
      document.title = doc.title;
      page.innerHTML = next.innerHTML;
      page.dataset.bg = next.dataset.bg || '';
      page.dataset.accent = next.dataset.accent || '';
      applyTheme();                                    // new page colour shows instantly
      if (push) history.pushState({}, '', url);
      window.scrollTo(0, 0); lastY = 0;
      initPage();
      fadeIn();                                        // enter: opacity 0 -> 1, 1500ms quartOut
      navigating = false;
    }).catch(function () { location.href = url; });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !/\.html$|\/$/.test(u.pathname) || u.pathname === location.pathname) {
      if (u.pathname === location.pathname && u.origin === location.origin) { e.preventDefault(); setMenu(false); }
      return;
    }
    if (location.protocol === 'file:') {
      // no fetch on file://: hide instantly, new page fades in on load
      sessionStorage.setItem('fadeIn', '1');
      page.classList.add('is-leaving');
      return;
    }
    e.preventDefault();
    go(u.href, true);
  });
  window.addEventListener('popstate', function () { go(location.href, false); });

  /* ---- boot ---- */
  applyTheme();
  initPage();
  if (sessionStorage.getItem('fadeIn')) { sessionStorage.removeItem('fadeIn'); fadeIn(); }
  header.classList.add('is-active');
})();
