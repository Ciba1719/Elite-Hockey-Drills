/* Store links on every page (loaded by ~2,140 pages; the /app smart link pages tag their own).
   1. Android visitors: every App Store link goes to the Google Play listing instead.
      Links marked data-store="ios" (the App Store badge, "The App — iOS") keep pointing at the App Store.
   2. Every store link is tagged so installs can be counted by where they came from (2026-11-08):
      - App Store: Apple campaign link (provider token pt + campaign ct) → App Store Connect →
        Analytics → Acquisition → Campaigns. Apple shows a campaign once 5+ accounts installed from it.
      - Google Play: install referrer with UTM → Play Console → Store performance → Traffic sources (UTM).
      Campaign: "free-program" on the survey and the free program pages (what Comment HOCKEY leads to),
      "website" everywhere else. Coarse on purpose: small campaigns stay below Apple's threshold.
   3. Google Play clicks → GA4 event "play_store_click" (placement, campaign, page). App Store clicks
      are counted by each page's own inline "app_store_click" handler, so not here (no double count). */
(function(){
  var APP_ID = 'id6787257275', PT = '129111129', PLAY_ID = 'com.elitehockeydrills.training';
  var langM = location.pathname.match(/^\/(cs|sv|de|fi|ru|es)(?=\/|$)/);
  var lang = langM ? langM[1] : 'en';
  var base = langM ? location.pathname.slice(langM[0].length) : location.pathname;
  var CAMPAIGN = /^\/(survey|free-program[\w-]*)(\.html)?$/.test(base) ? 'free-program' : 'website';
  var PLAY = 'https://play.google.com/store/apps/details?id=' + PLAY_ID + (langM && lang !== 'es' ? '&hl=' + lang : '');

  function placement(a){
    var s = a.closest('section[id],header,footer,nav,.mobile-bar,.buybar');
    return (a.getAttribute('data-place') || (s && (s.id || String(s.className).split(' ')[0])) || 'link').slice(0, 40);
  }
  // Adds the tags to one link (idempotent: a link that already carries them is left alone).
  function tag(a){
    var u;
    try { u = new URL(a.href, location.href); } catch (e) { return null; }
    if (u.hostname === 'apps.apple.com' && u.pathname.indexOf(APP_ID) !== -1) {
      if (!u.searchParams.has('pt')) {
        u.searchParams.set('pt', PT); u.searchParams.set('ct', CAMPAIGN); u.searchParams.set('mt', '8');
        a.href = u.toString();
      }
      return 'ios';
    }
    if (u.hostname === 'play.google.com' && u.searchParams.get('id') === PLAY_ID) {
      if (!u.searchParams.has('referrer')) {
        u.searchParams.set('referrer', 'utm_source=website&utm_medium=' + lang + '&utm_campaign=' + CAMPAIGN + '&utm_content=' + placement(a));
        a.href = u.toString();
      }
      return 'android';
    }
    return null;
  }

  if (/Android/i.test(navigator.userAgent || '')) {
    document.querySelectorAll('a[href*="apps.apple.com"]:not([data-store])').forEach(function(a){ a.href = PLAY; });
  }
  document.querySelectorAll('a[href*="apps.apple.com"],a[href*="play.google.com/store/apps"]').forEach(tag);

  // Capture phase: links added later (the survey's success screen builds its app block after
  // the form is sent) are tagged here, before the browser follows them.
  document.addEventListener('click', function(e){
    var t = e.target;
    var a = t && t.closest ? t.closest('a[href*="apps.apple.com"],a[href*="play.google.com/store/apps"]') : null;
    if (!a) return;
    var store = tag(a);
    // App Store clicks: the pages count those themselves (inline "app_store_click" on 2,123
    // pages), so only Google Play is counted here, as before.
    if (store !== 'android' || typeof gtag !== 'function') return;
    gtag('event', 'play_store_click', {
      placement: placement(a),
      store_campaign: CAMPAIGN,
      link_text: ((a.textContent || '').replace(/[ \t\r\n]+/g, ' ').trim() || a.getAttribute('aria-label') || '').slice(0, 60),
      page_path: location.pathname,
      transport_type: 'beacon'
    });
  }, true);
})();
