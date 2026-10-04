/* Android visitors: every App Store link goes to the Google Play listing instead.
   Links marked data-store="ios" (the App Store badge, "The App — iOS") keep pointing at the App Store.
   Google Play click tracking → GA4 event "play_store_click" (mark it as a key event in GA). */
(function(){
  var PLAY='https://play.google.com/store/apps/details?id=com.elitehockeydrills.training'+(/^\/cs(\/|$)/.test(location.pathname)?'&hl=cs':'');
  if(/Android/i.test(navigator.userAgent||'')){
    document.querySelectorAll('a[href*="apps.apple.com"]:not([data-store])').forEach(function(a){a.href=PLAY;});
  }
  document.addEventListener('click',function(e){var t=e.target;var a=t&&t.closest?t.closest('a[href*="play.google.com/store/apps"]'):null;if(!a||typeof gtag!=='function')return;var s=a.closest('section[id],header,footer,nav,.mobile-bar,.buybar');gtag('event','play_store_click',{placement:a.getAttribute('data-place')||(s&&(s.id||String(s.className).split(' ')[0]))||'link',link_text:((a.textContent||'').replace(/[ \t\r\n]+/g,' ').trim()||a.getAttribute('aria-label')||'').slice(0,60),page_path:location.pathname,transport_type:'beacon'});},true);
})();
