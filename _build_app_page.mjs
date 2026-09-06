// _build_app_page.mjs — builds hockey-training-app.html (the dedicated "hockey training app" SEO landing page)
// by reusing index.html's style block, app tour, footer, mobile bar and script so it looks identical to the homepage.
// Run: node _build_app_page.mjs
import fs from 'node:fs';

const idx = fs.readFileSync('index.html', 'utf8');
const between = (s, a, b, inclusive = true) => {
  const i = s.indexOf(a); if (i < 0) throw new Error('start marker not found: ' + a);
  const j = s.indexOf(b, i); if (j < 0) throw new Error('end marker not found: ' + b);
  return s.slice(i, inclusive ? j + b.length : j);
};

const STYLE = between(idx, '<style>', '</style>');
const tourStart = idx.indexOf('<div class="tour" id="tour"');
const featIdx = idx.indexOf('<div class="app-features-wrap reveal">');
const wrapIdx = idx.lastIndexOf('<div class="wrap">', featIdx);
if (tourStart < 0 || featIdx < 0 || wrapIdx < 0) throw new Error('tour block not found');
const TOUR = idx.slice(tourStart, wrapIdx).trimEnd();
const MARQUEE = between(idx, '<div class="marquee"', '<section class="app-section"', false).trimEnd();
const FOOTER = between(idx, '<footer class="footer">', '</footer>')
  .replace('href="#hero"', 'href="/"')
  .replace('href="#tiers"', 'href="/#tiers"')
  .replace('href="#about"', 'href="/#about"')
  .replace('href="#method"', 'href="/#method"');
const MOBILE_BAR = between(idx, '<div class="mobile-bar"', '</div>').replace('href="#trial"', 'href="#pricing"');
const SCRIPT = idx.slice(idx.lastIndexOf('<script>'), idx.lastIndexOf('</script>') + '</script>'.length);

const APP_URL = 'https://apps.apple.com/us/app/elite-hockey-drills/id6787257275';
const PAGE_URL = 'https://elitehockeydrills.com/hockey-training-app.html';
const TITLE = 'Hockey Training App — Off-Ice Training for Ice Hockey Players | Elite Hockey Drills';
const DESC = 'Elite Hockey Drills is the hockey training app that builds your personalized off-ice program from your age, level, position, and schedule, then runs your whole season. 228+ exercises with demo videos, game-day mode, progress tracking. 7-day free trial on iOS.';

const faqs = [
  {
    q: 'Is Elite Hockey Drills an on-ice or off-ice hockey training app?',
    a: 'Off-ice. The app programs the strength, speed, power, and conditioning work you do away from the rink, which is where most of a hockey player\'s physical development actually happens. It is built to sit around your ice time, not replace it: tell the app which days you skate and play, and it plans your off-ice sessions so you show up to practice and games fresh.'
  },
  {
    q: 'What ages does the app cover?',
    a: 'Five age bands in one app: 9 to 11, 12 to 14, 15 to 18, 19 to 39, and 40+. Each band gets its own programming logic. Younger players get movement quality and coordination first, teens get growth-spurt-aware strength and power, adults get maximal strength and repeat-sprint conditioning, and masters players get durability-first training that still keeps them fast.'
  },
  {
    q: 'Is there an Android version?',
    a: 'The iOS app is live on the App Store now. The Android version is in final preparation and lands on Google Play in September 2026. Follow @elite_hockey_drills on Instagram or grab the free 5-day program from the homepage and we will email you the day it drops.'
  },
  {
    q: 'How much does the hockey training app cost?',
    a: 'The download is free and every new account gets a 7-day free trial with everything unlocked: the full personalized program, every demo video, game-day mode, and progress tracking. After the trial it is $17.99 per month or $99.90 per year, which works out to about $8.33 a month. Cancel anytime through your App Store account.'
  },
  {
    q: 'What equipment do I need?',
    a: 'Very little. The programs run on bodyweight, resistance bands, and a box or sturdy step. Some age bands add light dumbbells or a pull-up bar as optional upgrades. You tell the app what you have and it only programs exercises you can actually do at home. No gym membership and no barbell required.'
  },
  {
    q: 'How long are the sessions and how many per week?',
    a: 'Most sessions run 45 to 60 minutes. The number per week depends on your ice schedule: the app typically plans three to five off-ice sessions around your practices and games, with lighter weeks built in automatically every fourth week so you recover instead of accumulating fatigue.'
  },
  {
    q: 'Does it work during the season, not just in the summer?',
    a: 'Yes, that is the point of it. Pre-season, in-season, playoffs, and off-season each get a different structure. In-season the app keeps you strong and explosive with lower volume, and game-day mode swaps a normal session for activation and preparation when you have a game tomorrow, then a neural reset the day after.'
  },
  {
    q: 'How is this different from a PDF program or YouTube workouts?',
    a: 'A PDF is the same for everyone and never changes. YouTube gives you a workout, not a plan. The app builds a program for you specifically, sequences it across weeks and blocks, adapts when you miss a day or have a game, coaches every set with targets and a demo video, and tracks your tests and personal records so you can see the work turning into speed.'
  },
  {
    q: 'Who built the app?',
    a: 'Coach David Ciboch, M.Ed. in PE and Sport Science, a former national-team hockey coach with over a decade of coaching from youth development to the national level, more than 1,000 athletes trained, and 60+ players signed to professional contracts. The app programs the way he programs his own athletes.'
  }
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const faqHtml = faqs.map(f => `      <div class="faq-item">
        <button class="faq-q-btn" onclick="toggleFaq(this)">
          <span>${esc(f.q)}</span>
          <span class="faq-icon"></span>
        </button>
        <div class="faq-a"><div class="faq-a-inner">${esc(f.a)}</div></div>
      </div>`).join('\n');

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://elitehockeydrills.com/#organization',
      name: 'Elite Hockey Drills',
      url: 'https://elitehockeydrills.com/',
      logo: 'https://elitehockeydrills.com/apple-touch-icon.png',
      sameAs: ['https://instagram.com/elite_hockey_drills', APP_URL]
    },
    {
      '@type': 'WebPage',
      '@id': PAGE_URL + '#webpage',
      url: PAGE_URL,
      name: 'Hockey Training App — Off-Ice Training for Ice Hockey Players',
      description: DESC,
      isPartOf: { '@id': 'https://elitehockeydrills.com/#website' },
      about: { '@id': 'https://elitehockeydrills.com/#app' },
      breadcrumb: { '@id': PAGE_URL + '#breadcrumb' }
    },
    {
      '@type': 'BreadcrumbList',
      '@id': PAGE_URL + '#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://elitehockeydrills.com/' },
        { '@type': 'ListItem', position: 2, name: 'Hockey Training App', item: PAGE_URL }
      ]
    },
    {
      '@type': 'MobileApplication',
      '@id': 'https://elitehockeydrills.com/#app',
      name: 'Elite Hockey Drills',
      alternateName: 'Elite Hockey Drills: Off-Ice Hockey Training App',
      url: PAGE_URL,
      operatingSystem: 'iOS',
      applicationCategory: 'HealthApplication',
      applicationSubCategory: 'Sports training',
      description: 'Personalized off-ice hockey training built around your season. The app builds your program from your age, level, position, equipment, and schedule, coaches every session with a demo video for every exercise, adapts to game days and missed sessions, and tracks tests and personal records. Ages 9 to 40+. 7-day free trial.',
      installUrl: APP_URL,
      downloadUrl: APP_URL,
      screenshot: ['app-home', 'app-program', 'app-training', 'app-gameday', 'app-progress'].map(n => 'https://elitehockeydrills.com/assets/app/' + n + '.webp'),
      featureList: [
        'Personalized off-ice program from age, level, position, equipment and schedule',
        '228+ hockey-specific exercises, each with a demo video',
        'Season-aware periodization: foundation, strength, power, peak and deload blocks',
        'Game-day mode with activation, timing and next-day reset',
        'Adapts to missed sessions instead of punishing them',
        'Six baseline tests, personal records, streaks and session history'
      ],
      author: { '@id': 'https://elitehockeydrills.com/#organization' },
      publisher: { '@id': 'https://elitehockeydrills.com/#organization' },
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free download with 7-day free trial' },
        { '@type': 'Offer', price: '17.99', priceCurrency: 'USD', description: 'Premium Monthly subscription' },
        { '@type': 'Offer', price: '99.90', priceCurrency: 'USD', description: 'Premium Annual subscription' }
      ]
    },
    {
      '@type': 'FAQPage',
      '@id': PAGE_URL + '#faq',
      mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
    }
  ]
};

const badges = (style = '') => `<div class="store-badges"${style ? ' style="' + style + '"' : ''}>
          <a class="store-badge" href="${APP_URL}" aria-label="Download Elite Hockey Drills on the App Store">
            <img src="assets/app/app-store-badge.svg" alt="Download on the App Store" width="120" height="40" />
          </a>
          <span class="play-soon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3l14 9-14 9V3z"/></svg>
            Google Play — coming soon
          </span>
        </div>`;

const arrow = '<svg class="btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

const ages = [
  { age: 'Ages 9–11', name: 'Foundations', copy: 'Coordination, balance, and bodyweight strength in short, fun sessions. The app teaches the movement before it ever loads it.', href: '/program-9-11.html' },
  { age: 'Ages 12–14', name: 'Develop', copy: 'Growth-spurt aware. Technique and control come first, and strength is added as the body is ready for it, not before.', href: '/program-12-14.html' },
  { age: 'Ages 15–18', name: 'Compete', copy: 'Strength, power, and repeat-sprint speed built for tryouts, junior hockey, and a season that does not let up.', href: '/program-15-18.html' },
  { age: 'Ages 19–39', name: 'Dominate', copy: 'Beer league to pro. Maximal strength, explosive power, and the conditioning to still be the fastest player in the third period.', href: '/program-19-39.html' },
  { age: 'Ages 40+', name: 'Sustain', copy: 'Joint-friendly strength, mobility, and just enough speed work to stay dangerous without paying for it the next morning.', href: '/program-40-plus.html' }
];
const agesHtml = ages.map(a => `      <div class="method-card reveal">
        <div class="age-focus">${a.age}</div>
        <h3>${a.name}</h3>
        <p>${a.copy}</p>
        <a class="age-link" href="${a.href}">One-time 8-week program for ${a.age.replace('Ages ', '')}</a>
      </div>`).join('\n');

// Comparison table rows: [label, [appClass, appText], [programClass, programText]]
const cmpRows = [
  ['Personalized to your age, level, position &amp; schedule', ['yes', 'Built for you'], ['no', 'Fixed per age band']],
  ['Adapts to game days &amp; missed sessions', ['yes', 'Automatically'], ['no', 'No']],
  ['Runs your whole season, block after block', ['yes', 'All year'], ['no', '8 weeks']],
  ['Demo video for every exercise', ['yes', 'Yes'], ['yes', 'Yes']],
  ['Tests, personal records &amp; progress tracking', ['yes', 'In the app'], ['no', 'Tests included, tracked by hand']],
  ['Price', ['yes', 'Free 7-day trial, then $17.99/mo or $99.90/yr'], ['no', '$79 once, yours forever']],
  ['Where it runs', ['yes', 'iOS App Store, Android coming soon'], ['no', 'Any browser']]
];
const cmpHtml = cmpRows.map(([label, [c1, t1], [c2, t2]]) =>
  `          <tr><td>${label}</td><td class="${c1}" data-col="App">${t1}</td><td class="${c2}" data-col="8-Week Program">${t2}</td></tr>`
).join('\n');

const EXTRA_CSS = `<style>
/* ── Hockey Training App landing page extras (reuses homepage tokens) ── */
.hero-sub a{color:var(--ice);text-decoration:none;border-bottom:1px solid var(--ice-line);}
.sec-sub a{color:var(--ice);text-decoration:none;border-bottom:1px solid var(--ice-line);}
.ages-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));margin-top:56px;}
.ages-grid .method-card{padding:28px 24px;}
.ages-grid .method-card h3{font-size:30px;}
.age-focus{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ice);margin-bottom:12px;}
.age-link{display:inline-block;margin-top:16px;font-size:13px;color:var(--ice);text-decoration:none;border-bottom:1px solid var(--ice-line);padding-bottom:2px;transition:border-color .2s;}
.age-link:hover{border-color:var(--ice);}
.cmp-wrap{margin-top:56px;overflow-x:auto;-webkit-overflow-scrolling:touch;}
.cmp{width:100%;min-width:600px;border-collapse:separate;border-spacing:0;background:var(--card);border:1px solid var(--line-2);border-radius:18px;overflow:hidden;}
.cmp th,.cmp td{padding:18px 22px;text-align:left;border-bottom:1px solid var(--line);font-size:14px;line-height:1.55;vertical-align:top;}
.cmp th{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:.02em;font-weight:400;color:var(--ink);background:var(--card-2);}
.cmp th.is-app{color:var(--ice);}
.cmp td:first-child{color:#C8CCD3;width:44%;}
.cmp tr:last-child td{border-bottom:0;}
.cmp .yes{color:var(--ink);}
.cmp .yes::before{content:'✓';color:var(--ice);font-weight:700;margin-right:8px;}
.cmp .no{color:var(--ink-2);}
.cmp .no::before{content:'—';color:var(--ink-3);margin-right:8px;}
.cmp-note{color:var(--ink-2);font-size:13px;margin-top:22px;}
.cmp-note a{color:var(--ice);}
@media (max-width:640px){
  .cmp-wrap{overflow:visible;}
  .cmp{min-width:0;display:block;background:transparent;border:0;border-radius:0;}
  .cmp thead{display:none;}
  .cmp tbody,.cmp tr,.cmp td{display:block;}
  .cmp tr{background:var(--card);border:1px solid var(--line-2);border-radius:14px;margin-bottom:12px;padding:8px 0 10px;}
  .cmp td{width:auto;border-bottom:0;padding:6px 18px;}
  .cmp td:first-child{width:auto;color:var(--ink);font-weight:600;padding:10px 18px 6px;}
  .cmp .yes::before,.cmp .no::before{display:block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin:0 0 2px;}
  .cmp .yes::before{content:'✓ ' attr(data-col);}
  .cmp .no::before{content:'— ' attr(data-col);}
}
</style>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-JH623WRMN8"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-JH623WRMN8');
  </script>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#070708" />
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png" />
<link rel="shortcut icon" href="favicon.ico" />
<link rel="manifest" href="site.webmanifest" />
<title>${TITLE}</title>
<meta name="description" content="${DESC}" />
<meta name="apple-itunes-app" content="app-id=6787257275" />
<meta property="og:title" content="Hockey Training App — Off-Ice Training Built Around Your Season" />
<meta property="og:description" content="The Elite Hockey Drills app builds your personalized off-ice hockey program and runs your whole season. 228+ exercises with demo videos. 7-day free trial on iOS." />
<meta property="og:url" content="${PAGE_URL}" />
<meta property="og:image" content="https://elitehockeydrills.com/ehd_hero_medball.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://elitehockeydrills.com/ehd_hero_medball.jpg" />
<link rel="canonical" href="${PAGE_URL}" />
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
${STYLE}
${EXTRA_CSS}
</head>
<body>

<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>

<header class="nav" id="nav">
  <a href="/" class="nav-logo"><span class="dot"></span>ELITE HOCKEY DRILLS</a>
  <nav>
    <ul class="nav-links">
      <li><a href="#features">Inside the App</a></li>
      <li><a href="#how">How It Works</a></li>
      <li><a href="/#about">Coach</a></li>
      <li><a href="/#tiers">Programs</a></li>
      <li><a href="/library.html">Library</a></li>
      <li><a href="/articles.html">Articles</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
  </nav>
  <div class="nav-right">
    <a href="${APP_URL}" class="nav-cta">Get the App</a>
    <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="mobile-menu" id="mobileMenu">
    <a href="#features">Inside the App</a>
    <a href="#how">How It Works</a>
    <a href="/#about">Coach</a>
    <a href="/#tiers">Programs</a>
    <a href="/library.html">Library</a>
    <a href="/articles.html">Articles</a>
    <a href="#faq">FAQ</a>
    <a href="/api/restore">Restore Access</a>
  </div>
</header>

<section class="hero" id="hero">
  <div class="hero-bg"></div>
  <div class="hero-glow"></div>
  <div class="hero-aurora hero-aurora-1" aria-hidden="true"></div>
  <div class="hero-aurora hero-aurora-2" aria-hidden="true"></div>
  <div class="hero-content">
    <div class="hero-grid-inner">
      <div class="hero-text">
        <div class="hero-badges">
          <div class="hero-status">Now live on the App Store</div>
          <div class="hero-presale-pill">
            <span class="hero-presale-dot"></span>
            Android — coming soon
          </div>
        </div>
        <h1 class="hero-h1 display">
          <span class="line">The Hockey Training App</span>
          <span class="line"><span class="accent serif">built</span> around your <span class="ice">season.</span></span>
        </h1>
        <p class="hero-sub">
          Elite Hockey Drills is an <strong>ice hockey training app for the off-ice side of the game</strong>: the strength, speed, and conditioning work that decides who is still fast in the third period. Answer a few questions and it builds a personalized off-ice program from your age, level, position, and schedule, then coaches you through every session with a demo video for every exercise. <strong>Your first week is free.</strong>
        </p>
        <div class="hero-ctas">
          <a href="${APP_URL}" class="btn btn-primary">
            Start Your Free Week
            ${arrow}
          </a>
          <a href="#how" class="btn btn-ghost">See How It Works</a>
        </div>
        ${badges('justify-content:flex-start;margin:-40px 0 64px;')}
        <div class="hero-stats">
          <div>
            <div class="hero-stat-num display">228<span class="plus">+</span></div>
            <div class="hero-stat-label">Exercises With Video</div>
          </div>
          <div>
            <div class="hero-stat-num display">5</div>
            <div class="hero-stat-label">Age Bands, 9 to 40+</div>
          </div>
          <div>
            <div class="hero-stat-num display">7</div>
            <div class="hero-stat-label">Day Free Trial</div>
          </div>
          <div>
            <div class="hero-stat-num display">1,000<span class="plus">+</span></div>
            <div class="hero-stat-label">Athletes Trained</div>
          </div>
        </div>
      </div>
      <div class="hero-phone">
        <div class="tilt">
          <div class="phone-mock">
            <img class="phone-shot" src="assets/app/app-home.webp" alt="Elite Hockey Drills hockey training app — today's off-ice session on the home screen" width="640" height="1138" fetchpriority="high" />
            <div class="phone-glare" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

${MARQUEE}

<section class="app-section" id="features">
  <div class="app-bg-glow"></div>
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="sec-num serif">01 — Inside the App</div>
      <h2 class="sec-title">Five screens. <em>One season.</em></h2>
      <p class="sec-sub">Most hockey training apps hand you a list of workouts and leave the planning to you. This one does the planning. Every screen exists to answer one question: what should I do today to be faster on the ice?</p>
    </div>

  </div>

  ${TOUR}

  <div class="wrap">

    <div class="app-features-wrap reveal">
      <ul class="app-features">
        <li>228+ off-ice hockey exercises, each with a coach-filmed demo video</li>
        <li>Personalized program from your age, level, position &amp; equipment</li>
        <li>Season-aware: pre-season, in-season, playoffs &amp; game days</li>
        <li>Periodized blocks: foundation, strength, power, peak &amp; deload</li>
        <li>Game-day mode with activation, timing &amp; next-day reset</li>
        <li>Six baseline tests, personal records, streaks &amp; history</li>
        <li>Adapts when you miss a day instead of punishing you</li>
        <li>Rebuild your program anytime your schedule or goals change</li>
      </ul>
    </div>

    <div class="app-offer reveal" id="pricing">
      <div class="app-pricing-row">
        <div class="app-price-block">
          <div class="num display">7 <span>days</span></div>
          <div class="lbl">Free Trial</div>
        </div>
        <div class="app-price-block">
          <div class="num display">$17.99<span>/mo</span></div>
          <div class="lbl">Monthly</div>
        </div>
        <div class="app-price-block">
          <div class="num display">$99.90<span>/yr</span></div>
          <div class="lbl">Annual · Save 54%</div>
        </div>
      </div>
      ${badges()}
      <p class="app-trial-note">Free to download · One app for ages 9–11 through 40+ · Cancel anytime during the trial</p>
    </div>
  </div>
</section>

<section class="method" id="how">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="sec-num serif">02 — How It Works</div>
      <h2 class="sec-title">Three minutes to <em>your program.</em></h2>
      <p class="sec-sub">No templates and no generic gym plan with a hockey logo on it. The app was built by <a href="/#about">Coach David Ciboch, M.Ed. Sport Science</a>, a former national-team coach, and it programs the way he programs his own athletes.</p>
    </div>
    <div class="method-grid">
      <div class="method-card reveal">
        <div class="method-card-num serif">i.</div>
        <h3>Tell It About You</h3>
        <p>Your age band, playing level, position, the equipment you have at home, which days you skate, and when you play. That is everything the app needs to know.</p>
      </div>
      <div class="method-card reveal">
        <div class="method-card-num serif">ii.</div>
        <h3>Get Your Program</h3>
        <p>The app builds a periodized multi-week block around your real week: three to five sessions of 45 to 60 minutes, explosive work when you are fresh, strength when it fits, recovery when your body needs it.</p>
      </div>
      <div class="method-card reveal">
        <div class="method-card-num serif">iii.</div>
        <h3>Train With a Coach in Your Pocket</h3>
        <p>Every session is guided rep by rep: sets, reps, tempo, rest, and a demo video for every exercise. Log a set with one tap. Game tomorrow? The session swaps to activation and prep automatically.</p>
      </div>
    </div>
  </div>
</section>

<section class="method" id="ages">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="sec-num serif">03 — Who It's For</div>
      <h2 class="sec-title">One app. <em>Every age.</em></h2>
      <p class="sec-sub">The same hockey training app serves a nine-year-old learning to move and a forty-year-old still playing on Sunday nights, because every exercise scales and every program is built for the age band it belongs to.</p>
    </div>
    <div class="ages-grid">
${agesHtml}
    </div>
  </div>
</section>

<section class="method" id="compare">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="sec-num serif">04 — App or Program?</div>
      <h2 class="sec-title">Subscription <em>or one-time?</em></h2>
      <p class="sec-sub">Both are built by the same coach on the same method. The app is the living version that runs your season. The 8-week programs are fixed blocks you buy once and keep forever.</p>
    </div>
    <div class="cmp-wrap reveal">
      <table class="cmp">
        <thead>
          <tr><th scope="col">What you get</th><th scope="col" class="is-app">The App</th><th scope="col">8-Week Program</th></tr>
        </thead>
        <tbody>
${cmpHtml}
        </tbody>
      </table>
    </div>
    <p class="cmp-note">Prefer the one-time route? <a href="/#tiers">See the five 8-week programs</a>. Not sure? Start the app's free trial first. It costs nothing to see the difference.</p>
  </div>
</section>

<section class="faq" id="faq">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="sec-num serif">05 — Questions</div>
      <h2 class="sec-title">Frequently <em>asked.</em></h2>
    </div>
    <div class="faq-list">
${faqHtml}
    </div>
  </div>
</section>

<section class="final" id="contact">
  <div class="final-glow"></div>
  <div class="final-content">
    <div class="reveal">
      <div class="eyebrow ice" style="margin-bottom:18px;">Start tonight</div>
      <h2 class="display">Your first week<br>is <em>free.</em></h2>
      <p>Download the app, answer a few questions, and your personalized off-ice hockey program is ready before your next practice. Cancel anytime during the trial and pay nothing.</p>
      <a href="${APP_URL}" class="btn btn-primary final-cta-btn">
        Start Your Free Week
        ${arrow}
      </a>
      ${badges('margin-top:22px;')}
      <p class="final-note" style="margin-top:24px;">Not ready for the app? <a href="survey.html" style="color:var(--ice);">Take the 60-second quiz</a> for a free 5-day program. No card needed.</p>
    </div>
  </div>
</section>

${FOOTER}

${MOBILE_BAR}

${SCRIPT}
</body>
</html>
`;

fs.writeFileSync('hockey-training-app.html', html);
console.log('wrote hockey-training-app.html', (html.length / 1024).toFixed(0) + ' KB');
