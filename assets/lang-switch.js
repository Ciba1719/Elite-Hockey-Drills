/* Elite Hockey Drills — language switcher (EN / CZ / SV / DE / FI)
   One file for every page. Each page has a placeholder
     <div class="lang-dd" data-cur="en|cs|sv"></div>
   in its nav. This script turns it into a flag dropdown that links to the SAME
   page in the other languages (/page.html  ↔  /cs/page.html  ↔  /sv/page.html).
   To add a language later: add it to LANGS (+ a flag) and build the /xx/ pages. */
(function () {
  var LANGS = [
    { code: 'en', label: 'EN', name: 'English', prefix: '' },
    { code: 'cs', label: 'CZ', name: 'Čeština', prefix: '/cs' },
    { code: 'sv', label: 'SV', name: 'Svenska', prefix: '/sv' },
    { code: 'de', label: 'DE', name: 'Deutsch', prefix: '/de' },
    { code: 'fi', label: 'FI', name: 'Suomi', prefix: '/fi' },
  ];
  var HINT = {
    cs: { text: 'Tahle stránka je i v češtině.', btn: 'Česky', close: 'Zavřít' },
    sv: { text: 'Den här sidan finns även på svenska.', btn: 'Svenska', close: 'Stäng' },
    de: { text: 'Diese Seite gibt es auch auf Deutsch.', btn: 'Deutsch', close: 'Schließen' },
    fi: { text: 'Tämä sivu on myös suomeksi.', btn: 'Suomeksi', close: 'Sulje' },
  };
  // Inline SVG flags (Windows does not render flag emoji).
  var FLAG = {
    en: '<svg viewBox="0 0 19 10" aria-hidden="true"><rect width="19" height="10" fill="#B22234"/><path d="M0 1.15h19M0 2.69h19M0 4.23h19M0 5.77h19M0 7.31h19M0 8.85h19" stroke="#fff" stroke-width=".77"/><rect width="7.6" height="5.38" fill="#3C3B6E"/><g fill="#fff"><circle cx="1.1" cy="1" r=".32"/><circle cx="2.6" cy="1" r=".32"/><circle cx="4.1" cy="1" r=".32"/><circle cx="5.6" cy="1" r=".32"/><circle cx="1.85" cy="2" r=".32"/><circle cx="3.35" cy="2" r=".32"/><circle cx="4.85" cy="2" r=".32"/><circle cx="6.35" cy="2" r=".32"/><circle cx="1.1" cy="3" r=".32"/><circle cx="2.6" cy="3" r=".32"/><circle cx="4.1" cy="3" r=".32"/><circle cx="5.6" cy="3" r=".32"/><circle cx="1.85" cy="4" r=".32"/><circle cx="3.35" cy="4" r=".32"/><circle cx="4.85" cy="4" r=".32"/><circle cx="6.35" cy="4" r=".32"/></g></svg>',
    cs: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#D7141A"/><path d="M0 0l15 10L0 20z" fill="#11457E"/></svg>',
    sv: '<svg viewBox="0 0 16 10" aria-hidden="true"><rect width="16" height="10" fill="#006AA7"/><path d="M5 0h2v10H5zM0 4h16v2H0z" fill="#FECC00"/></svg>',
    de: '<svg viewBox="0 0 5 3" aria-hidden="true"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#DD0000"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>',
    fi: '<svg viewBox="0 0 18 11" aria-hidden="true"><rect width="18" height="11" fill="#fff"/><path d="M5 0h3v11H5zM0 4h18v3H0z" fill="#002F6C"/></svg>',
  };

  var path = location.pathname;
  var m = path.match(/^\/(cs|sv|de|fi)(?=\/|$)/);
  var cur = m ? m[1] : 'en';
  var base = m ? path.slice(m[0].length) : path;
  if (base === '' || base === '/index.html') base = '/';
  function urlFor(code) {
    var L = LANGS.filter(function (l) { return l.code === code; })[0];
    if (base === '/') return L.prefix ? L.prefix + '/' : '/';
    if (code === 'en' && base === '/app.html') return '/app';
    if (code !== 'en' && base === '/app') return L.prefix + '/app.html';
    return L.prefix + base;
  }
  function save(code) { try { localStorage.setItem('ehd_lang', code); } catch (e) {} }

  var css = '' +
    '.lang-dd{position:relative;display:inline-flex;flex:none;z-index:1002;font-family:"Inter Tight",system-ui,sans-serif}' +
    '.lang-dd-btn{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 10px 0 9px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(14,14,19,.55);color:#ECEDEF;font:600 12px/1 "Inter Tight",system-ui,sans-serif;letter-spacing:.12em;cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:border-color .2s,background .2s}' +
    '.lang-dd-btn:hover,.lang-dd.open .lang-dd-btn{border-color:#5DB4E5;background:rgba(14,14,19,.85)}' +
    '.lang-dd .flag{display:inline-flex;width:20px;height:14px;border-radius:2.5px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.18);flex:none}' +
    '.lang-dd .flag svg{width:100%;height:100%;display:block}' +
    '.lang-dd-chev{width:9px;height:9px;opacity:.7;transition:transform .2s}' +
    '.lang-dd.open .lang-dd-chev{transform:rotate(180deg)}' +
    '.lang-dd-menu{position:absolute;top:calc(100% + 8px);right:0;min-width:168px;padding:6px;margin:0;list-style:none;background:#0E0E13;border:1px solid rgba(255,255,255,.12);border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.5);opacity:0;visibility:hidden;transform:translateY(-4px);transition:opacity .18s,transform .18s,visibility .18s}' +
    '.lang-dd.open .lang-dd-menu{opacity:1;visibility:visible;transform:none}' +
    '.lang-dd-menu a{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;color:#ECEDEF;font:500 14.5px/1.1 "Inter Tight",system-ui,sans-serif;letter-spacing:0;text-decoration:none;white-space:nowrap}' +
    '.lang-dd-menu a:hover,.lang-dd-menu a:focus-visible{background:rgba(93,180,229,.12);outline:none}' +
    '.lang-dd-menu a[aria-current] {color:#5DB4E5}' +
    '.lang-dd-menu .tick{margin-left:auto;width:14px;height:14px}' +
    '.lang-dd--float{position:fixed;top:14px;right:14px}' +
    /* auto-fit on narrow phones: applied only if the nav would wrap/overflow */
    'html.ld-t1 .nav-logo{white-space:nowrap!important;letter-spacing:.06em!important;font-size:14px!important;gap:6px!important}' +
    'html.ld-t1 .nav-right{gap:6px!important}' +
    'html.ld-t1 .nav-cta{white-space:nowrap!important}' +
    'html.ld-t2 .nav-price{display:none!important}' +
    'html.ld-t2 .nav-cta{padding-left:11px!important;padding-right:11px!important;font-size:12px!important}' +
    'html.ld-t3 .nav-logo{font-size:12.5px!important;letter-spacing:.04em!important}' +
    '@media (max-width:560px){.lang-dd-btn{gap:5px;height:36px;padding:0 8px}.lang-dd-code{display:none}}' +
    '@media (max-width:380px){.lang-dd-btn{padding:0 6px}.lang-dd-chev{display:none}}' +
    '.lang-hint{position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:1003;display:none;align-items:center;gap:12px;padding:12px 14px 12px 16px;background:rgba(14,14,19,.96);border:1px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 18px 40px rgba(0,0,0,.45);font:400 14px/1.35 "Inter Tight",system-ui,sans-serif;color:#ECEDEF}' +
    '.lang-hint.show{display:flex}.lang-hint span{flex:1}' +
    '.lang-hint a{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:#070708;background:#5DB4E5;padding:9px 14px;border-radius:999px;white-space:nowrap;text-decoration:none}' +
    '.lang-hint a .flag{width:18px;height:12px;border-radius:2px;overflow:hidden;display:inline-flex}.lang-hint a .flag svg{width:100%;height:100%}' +
    '.lang-hint button{background:none;border:0;color:#9398A2;font-size:20px;line-height:1;padding:4px 6px;cursor:pointer}' +
    '@media (min-width:720px){.lang-hint{left:auto;right:20px;bottom:20px;max-width:400px}}';

  function init() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var hosts = document.querySelectorAll('.lang-dd');
    if (!hosts.length) {               // safety net: page without placeholder
      var h = document.createElement('div'); h.className = 'lang-dd lang-dd--float';
      document.body.appendChild(h); hosts = [h];
    }
    var chev = '<svg class="lang-dd-chev" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 3.5L5 7l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var tick = '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var curL = LANGS.filter(function (l) { return l.code === cur; })[0];

    Array.prototype.forEach.call(hosts, function (host, i) {
      var id = 'langMenu' + i;
      var items = LANGS.map(function (l) {
        var me = l.code === cur;
        return '<li><a href="' + urlFor(l.code) + '" lang="' + l.code + '" hreflang="' + l.code + '" data-lang="' + l.code + '"' + (me ? ' aria-current="true"' : '') + '><span class="flag">' + FLAG[l.code] + '</span>' + l.name + (me ? tick : '') + '</a></li>';
      }).join('');
      host.innerHTML = '<button type="button" class="lang-dd-btn" aria-haspopup="true" aria-expanded="false" aria-controls="' + id + '" aria-label="Language: ' + curL.name + '"><span class="flag">' + FLAG[cur] + '</span><span class="lang-dd-code">' + curL.label + '</span>' + chev + '</button><ul class="lang-dd-menu" id="' + id + '" role="menu">' + items + '</ul>';
      var btn = host.querySelector('.lang-dd-btn');
      var menu = host.querySelector('.lang-dd-menu');
      function set(open) {
        host.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
        if (open) { menu.style.left = ''; menu.style.right = ''; var r = menu.getBoundingClientRect(); if (r.left < 8) { menu.style.right = 'auto'; menu.style.left = (8 - host.getBoundingClientRect().left) + 'px'; } }
      }
      btn.addEventListener('click', function (e) { e.stopPropagation(); set(!host.classList.contains('open')); });
      document.addEventListener('click', function (e) { if (!host.contains(e.target)) set(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
      host.querySelectorAll('a[data-lang]').forEach(function (a) { a.addEventListener('click', function () { save(a.getAttribute('data-lang')); }); });
    });

    // Keep the nav on one line on small phones.
    function fit() {
      var root = document.documentElement; root.classList.remove('ld-t1', 'ld-t2', 'ld-t3');
      var nav = document.querySelector('.lang-dd:not(.lang-dd--float)');
      nav = nav && nav.closest('header, .nav, nav');
      if (!nav) return;
      var logo = nav.querySelector('.nav-logo');
      function bad() {
        var kids = nav.querySelectorAll('.nav-logo, .nav-cta, .lang-dd, .nav-toggle, .nav-price');
        for (var k = 0; k < kids.length; k++) { var r = kids[k].getBoundingClientRect(); if (r.width && (r.right > window.innerWidth + 1)) return true; }
        if (logo) { var lh = parseFloat(getComputedStyle(logo).lineHeight) || logo.getBoundingClientRect().height; var h = logo.getBoundingClientRect().height; if (h > 1.6 * Math.max(lh, 16) && h > 30) return true; }
        var cta = nav.querySelector('.nav-cta'); if (cta && cta.getBoundingClientRect().height > 52) return true;
        return false;
      }
      ['ld-t1', 'ld-t2', 'ld-t3'].some(function (c) { if (!bad()) return true; root.classList.add(c); return false; });
    }
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 120); });

    // Visiting a translated page = a language choice.
    if (cur !== 'en') save(cur);

    // English pages: gentle hint for Czech/Slovak and Swedish browsers (never a forced redirect).
    if (cur === 'en') {
      var stored = null; try { stored = localStorage.getItem('ehd_lang'); } catch (e) {}
      var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).join(',').toLowerCase();
      var want = /(^|,)(cs|sk)\b/.test(langs) ? 'cs' : (/(^|,)sv\b/.test(langs) ? 'sv' : (/(^|,)de\b/.test(langs) ? 'de' : (/(^|,)fi\b/.test(langs) ? 'fi' : null)));
      if (want && !stored) {
        var t = HINT[want];
        var bar = document.createElement('div');
        bar.className = 'lang-hint'; bar.setAttribute('lang', want); bar.setAttribute('role', 'dialog');
        bar.innerHTML = '<span>' + t.text + '</span><a href="' + urlFor(want) + '" data-lang="' + want + '"><span class="flag">' + FLAG[want] + '</span>' + t.btn + '</a><button type="button" aria-label="' + t.close + '">×</button>';
        document.body.appendChild(bar);
        bar.querySelector('a').addEventListener('click', function () { save(want); });
        bar.querySelector('button').addEventListener('click', function () { bar.classList.remove('show'); save('en'); });
        setTimeout(function () { bar.classList.add('show'); }, 1200);
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
