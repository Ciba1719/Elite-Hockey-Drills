// _build_parents_page.mjs — the parent page the app's "Ask a parent" message
// links to (funnel move 1, 2026-11-07). A player aged 13-17 sends a parent a
// message from the app; the link lands here: what the app is, what it costs,
// how to start it on the player's phone (incl. purchase approval), how to
// cancel, privacy, contact.
//
// Builds parents.html + cs|sv|de|fi|ru|es/parents.html from the texts below
// (not through the _ru_work segment pipeline, and es exists only for this
// page because the app has Spanish and the site does not).
// The app links to /parents and /<lang>/parents (Netlify serves the .html).
//   node _build_parents_page.mjs
import fs from 'node:fs';
import path from 'node:path';

const LANGS = ['en', 'cs', 'sv', 'de', 'fi', 'ru', 'es'];
const NAMES = { en: 'English', cs: 'Čeština', sv: 'Svenska', de: 'Deutsch', fi: 'Suomi', ru: 'Русский', es: 'Español' };
const pagePath = (l) => (l === 'en' ? '/parents' : `/${l}/parents`);
const appLink = (l) => (l === 'en' || l === 'es' ? '/app?src=parents' : `/${l}/app.html?src=parents`);
const privacyLink = (l) => (l === 'en' || l === 'es' ? '/privacy.html' : `/${l}/privacy.html`);
const EMAIL = 'coach@elitehockeydrills.com';

// Prices as each language's homepage states them (04 — pricing).
const T = {
  en: {
    title: 'For parents — Elite Hockey Drills',
    desc: 'Your player asked you to start Elite Hockey Drills: what it is, what it costs, how to start it on their phone and how to cancel.',
    kicker: 'For parents',
    h1: 'Your player asked you to start Elite Hockey Drills',
    lead: 'It is an off-ice training app for hockey players: strength, speed and conditioning, planned around their practices and games. It was built by Coach David Ciboch, M.Ed. Sport Science and former UAE national-team coach.',
    whatH: 'What your player gets',
    what: [
      'A program for their age, position and schedule: 2 to 5 sessions a week around practices and games, with lighter weeks built in.',
      'A demo video for every exercise (390+), so they learn to do it right.',
      'Training that fits their age. Players 14 and under use bodyweight and light equipment only, never barbells. After a concussion that is not yet cleared, hard landings, heavy spinal loading and all-out sprints stay out of the plan until a professional clears it.',
      'Tests and personal records, so you can both see what is changing.',
    ],
    costH: 'What it costs',
    yearly: 'Yearly',
    yearlyLine: '7 days free, then {year} a year (about {perMonth} a month)',
    monthly: 'Monthly',
    monthlyLine: '{month} a month, billed from the first day, no free week',
    billing: 'Billed by Apple or Google. We never see your card. One subscription covers every age group.',
    localNote: 'Outside the US, the store shows the price in your currency.',
    startH: 'How to start it (2 minutes, on their phone)',
    start: [
      'Sit down with your player and open the app on their phone. Their program is already saved.',
      'They tap the start button with the yearly plan selected.',
      'The App Store or Google Play asks for the payment. If your family uses purchase approval (Apple’s Ask to Buy in Family Sharing, or Google Family Link), you get a request on your own phone: approve it. Otherwise you confirm with the payment method on their store account.',
      'Done. The free week starts and the first workout is one tap away.',
    ],
    cancelH: 'How to cancel',
    cancel: 'Cancel before day 7 and nothing is charged. Cancel on the account that holds the subscription, usually your player’s:',
    cancelIos: 'iOS: Settings → your name → Subscriptions → Elite Hockey Drills',
    cancelAndroid: 'Android: Google Play → profile picture → Payments & subscriptions → Subscriptions',
    cancelAfter: 'After the free week, access runs to the end of the paid period.',
    privacyH: 'Privacy',
    privacy: 'No ads. Personal data is never sold. Players under 13 need a parent’s consent to set up the app.',
    privacyLink: 'Privacy policy',
    contactH: 'Questions?',
    contact: 'Write to Coach David: {email}',
    cta: 'Get the app',
    langs: 'Languages',
  },
  cs: {
    title: 'Pro rodiče — Elite Hockey Drills',
    desc: 'Váš hráč vás požádal o spuštění Elite Hockey Drills: co to je, kolik to stojí, jak to spustit na jeho telefonu a jak to zrušit.',
    kicker: 'Pro rodiče',
    h1: 'Váš hráč vás prosí o spuštění Elite Hockey Drills',
    lead: 'Je to aplikace na suchou přípravu hokejistů: síla, rychlost a kondice, naplánované kolem jejich tréninků na ledě a zápasů. Postavil ji trenér David Ciboch, M.Ed. sportovní vědy a bývalý trenér reprezentace SAE.',
    whatH: 'Co váš hráč dostane',
    what: [
      'Program podle věku, pozice a rozvrhu: 2 až 5 tréninků týdně kolem ledu a zápasů, s lehčími týdny v plánu.',
      'Video ke každému cviku (390+), aby se naučil cvičit správně.',
      'Trénink přiměřený věku. Hráči do 14 let cvičí jen s vlastní vahou a lehkými pomůckami, nikdy s činkou. Po otřesu mozku zůstávají tvrdé dopady, těžká zátěž páteře a sprinty naplno mimo plán, dokud hráče neuvolní lékař.',
      'Testy a osobní rekordy, takže oba uvidíte, co se zlepšuje.',
    ],
    costH: 'Kolik to stojí',
    yearly: 'Roční',
    yearlyLine: '7 dní zdarma, pak {year} ročně (zhruba {perMonth} měsíčně)',
    monthly: 'Měsíční',
    monthlyLine: '{month} měsíčně, platí se od prvního dne, bez dnů zdarma',
    billing: 'Platí se přes Apple nebo Google. Vaši kartu nikdy neuvidíme. Jedno předplatné pokrývá všechny věkové kategorie.',
    localNote: '',
    startH: 'Jak to spustit (2 minuty, na jeho telefonu)',
    start: [
      'Sedněte si s hráčem a otevřete aplikaci na jeho telefonu. Program už má uložený.',
      'Hráč klepne na tlačítko pro start s vybraným ročním plánem.',
      'App Store nebo Google Play si řekne o platbu. Pokud máte v rodině zapnuté schvalování nákupů (Rodinné sdílení Apple nebo Google Family Link), přijde vám žádost na váš telefon: schvalte ji. Jinak platbu potvrdíte platební metodou na jeho účtu v obchodě.',
      'Hotovo. Týden zdarma běží a první trénink je na jedno klepnutí.',
    ],
    cancelH: 'Jak to zrušit',
    cancel: 'Když předplatné zrušíte do 7. dne, nic se nestrhne. Rušte ho na účtu, na kterém běží, obvykle na účtu hráče:',
    cancelIos: 'iOS: Nastavení → jméno → Předplatná → Elite Hockey Drills',
    cancelAndroid: 'Android: Google Play → profilový obrázek → Platby a předplatná → Předplatná',
    cancelAfter: 'Po týdnu zdarma běží přístup do konce zaplaceného období.',
    privacyH: 'Soukromí',
    privacy: 'Žádné reklamy. Osobní údaje nikdy neprodáváme. Hráči mladší 13 let potřebují k nastavení aplikace souhlas rodiče.',
    privacyLink: 'Zásady ochrany osobních údajů',
    contactH: 'Máte otázky?',
    contact: 'Napište trenérovi Davidovi: {email}',
    cta: 'Stáhnout aplikaci',
    langs: 'Jazyky',
  },
  sv: {
    title: 'För föräldrar — Elite Hockey Drills',
    desc: 'Din spelare har bett dig starta Elite Hockey Drills: vad det är, vad det kostar, hur du startar det i deras telefon och hur du avslutar.',
    kicker: 'För föräldrar',
    h1: 'Din spelare har bett dig starta Elite Hockey Drills',
    lead: 'Det är en app för barmarksträning för hockeyspelare: styrka, snabbhet och kondition, planerat runt deras isträningar och matcher. Den är byggd av tränaren David Ciboch, M.Ed. i idrottsvetenskap och tidigare förbundskapten för Förenade Arabemiratens landslag.',
    whatH: 'Det här får din spelare',
    what: [
      'Ett program för deras ålder, position och schema: 2 till 5 pass i veckan runt isträningar och matcher, med lättare veckor inplanerade.',
      'En demovideo för varje övning (390+), så att de lär sig göra rätt.',
      'Träning som passar åldern. Spelare som är 14 år eller yngre tränar bara med kroppsvikt och lätt utrustning, aldrig med skivstång. Efter en hjärnskakning som inte är friskförklarad hålls hårda landningar, tung belastning av ryggen och maxsprinter utanför planen tills en expert ger klartecken.',
      'Tester och personbästan, så att ni båda ser vad som förändras.',
    ],
    costH: 'Vad det kostar',
    yearly: 'Årsvis',
    yearlyLine: '7 dagar gratis, sedan {year} per år (cirka {perMonth} per månad)',
    monthly: 'Månadsvis',
    monthlyLine: '{month} per månad, debiteras från första dagen, ingen gratisvecka',
    billing: 'Debiteras via Apple eller Google. Vi ser aldrig ditt kort. Ett abonnemang täcker alla åldersgrupper.',
    localNote: '',
    startH: 'Så startar du det (2 minuter, i deras telefon)',
    start: [
      'Sätt dig med din spelare och öppna appen i deras telefon. Programmet är redan sparat.',
      'De trycker på startknappen med årsplanen vald.',
      'App Store eller Google Play ber om betalningen. Om er familj använder köpgodkännande (Familjedelning hos Apple eller Google Family Link) får du en förfrågan i din egen telefon: godkänn den. Annars bekräftar du med betalningsmetoden på deras butikskonto.',
      'Klart. Gratisveckan börjar och första passet är ett tryck bort.',
    ],
    cancelH: 'Så avslutar du',
    cancel: 'Avsluta före dag 7 så debiteras ingenting. Avsluta på kontot som har prenumerationen, oftast din spelares:',
    cancelIos: 'iOS: Inställningar → ditt namn → Prenumerationer → Elite Hockey Drills',
    cancelAndroid: 'Android: Google Play → profilbilden → Betalningar och prenumerationer → Prenumerationer',
    cancelAfter: 'Efter gratisveckan gäller åtkomsten till slutet av den betalda perioden.',
    privacyH: 'Integritet',
    privacy: 'Inga annonser. Personuppgifter säljs aldrig. Spelare under 13 år behöver en förälders samtycke för att komma igång.',
    privacyLink: 'Integritetspolicy',
    contactH: 'Frågor?',
    contact: 'Skriv till tränaren David: {email}',
    cta: 'Hämta appen',
    langs: 'Språk',
  },
  de: {
    title: 'Für Eltern — Elite Hockey Drills',
    desc: 'Ihr Spieler hat Sie gebeten, Elite Hockey Drills zu starten: was es ist, was es kostet, wie Sie es auf seinem Handy starten und wie Sie kündigen.',
    kicker: 'Für Eltern',
    h1: 'Ihr Spieler bittet Sie, Elite Hockey Drills zu starten',
    lead: 'Es ist eine App für Off-Ice-Training von Eishockeyspielern: Kraft, Schnelligkeit und Kondition, geplant um Eistraining und Spiele. Entwickelt von Coach David Ciboch, M.Ed. Sportwissenschaft und früherer Nationaltrainer der VAE.',
    whatH: 'Das bekommt Ihr Spieler',
    what: [
      'Ein Programm für Alter, Position und Wochenplan: 2 bis 5 Einheiten pro Woche rund um Eistraining und Spiele, mit eingeplanten leichteren Wochen.',
      'Ein Demovideo zu jeder Übung (390+), damit sie richtig ausgeführt wird.',
      'Training, das zum Alter passt. Spieler bis 14 Jahre trainieren nur mit Körpergewicht und leichtem Material, nie mit der Langhantel. Nach einer Gehirnerschütterung ohne ärztliche Freigabe bleiben harte Landungen, schwere Belastung der Wirbelsäule und Maximalsprints aus dem Plan, bis eine Fachperson freigibt.',
      'Tests und Bestleistungen, damit Sie beide sehen, was sich verändert.',
    ],
    costH: 'Was es kostet',
    yearly: 'Jährlich',
    yearlyLine: '7 Tage gratis, danach {year} im Jahr (etwa {perMonth} im Monat)',
    monthly: 'Monatlich',
    monthlyLine: '{month} im Monat, ab dem ersten Tag, ohne Gratiswoche',
    billing: 'Abrechnung über Apple oder Google. Wir sehen Ihre Karte nie. Ein Abo deckt alle Altersgruppen ab.',
    localNote: '',
    startH: 'So starten Sie es (2 Minuten, auf seinem Handy)',
    start: [
      'Setzen Sie sich mit Ihrem Spieler zusammen und öffnen Sie die App auf seinem Handy. Sein Programm ist schon gespeichert.',
      'Er tippt mit ausgewähltem Jahresabo auf den Start-Button.',
      'Der App Store oder Google Play fragt nach der Zahlung. Wenn Ihre Familie Kaufgenehmigungen nutzt (Familienfreigabe von Apple oder Google Family Link), bekommen Sie eine Anfrage auf Ihr eigenes Handy: Bestätigen Sie sie. Sonst bestätigen Sie mit der Zahlungsmethode seines Store-Kontos.',
      'Fertig. Die Gratiswoche beginnt, und das erste Training ist einen Tipp entfernt.',
    ],
    cancelH: 'So kündigen Sie',
    cancel: 'Kündigen Sie vor Tag 7, wird nichts abgebucht. Kündigen Sie in dem Konto, zu dem das Abo gehört, meist dem Ihres Spielers:',
    cancelIos: 'iOS: Einstellungen → Name → Abonnements → Elite Hockey Drills',
    cancelAndroid: 'Android: Google Play → Profilbild → Zahlungen und Abos → Abos',
    cancelAfter: 'Nach der Gratiswoche bleibt der Zugang bis zum Ende des bezahlten Zeitraums.',
    privacyH: 'Datenschutz',
    privacy: 'Keine Werbung. Persönliche Daten werden nie verkauft. Spieler unter 13 Jahren brauchen für die Einrichtung die Zustimmung eines Elternteils.',
    privacyLink: 'Datenschutzerklärung',
    contactH: 'Fragen?',
    contact: 'Schreiben Sie Coach David: {email}',
    cta: 'App holen',
    langs: 'Sprachen',
  },
  fi: {
    title: 'Vanhemmille — Elite Hockey Drills',
    desc: 'Pelaajasi pyysi sinua aloittamaan Elite Hockey Drillsin: mikä se on, mitä se maksaa, miten sen aloittaa hänen puhelimessaan ja miten sen voi perua.',
    kicker: 'Vanhemmille',
    h1: 'Pelaajasi pyytää sinua aloittamaan Elite Hockey Drillsin',
    lead: 'Se on jääkiekkoilijoiden oheisharjoittelusovellus: voima, nopeus ja kunto, suunniteltuna jäätreenien ja pelien ympärille. Sen on tehnyt valmentaja David Ciboch, liikuntatieteiden maisteri (M.Ed.) ja Arabiemiirikuntien maajoukkueen entinen valmentaja.',
    whatH: 'Mitä pelaajasi saa',
    what: [
      'Ohjelman iän, pelipaikan ja aikataulun mukaan: 2–5 treeniä viikossa jäätreenien ja pelien ympärillä, kevyemmät viikot valmiiksi suunniteltuna.',
      'Demovideon jokaisesta liikkeestä (390+), jotta hän oppii tekemään oikein.',
      'Ikään sopivaa harjoittelua. Enintään 14-vuotiaat treenaavat vain kehonpainolla ja kevyillä välineillä, ei koskaan levytangolla. Aivotärähdyksen jälkeen, kun lääkäri ei ole vielä antanut lupaa, kovat alastulot, raskas selkärangan kuormitus ja täysillä tehtävät spurtit pysyvät pois ohjelmasta, kunnes asiantuntija antaa luvan.',
      'Testit ja ennätykset, jotta näette molemmat, mikä muuttuu.',
    ],
    costH: 'Mitä se maksaa',
    yearly: 'Vuositilaus',
    yearlyLine: '7 päivää ilmaiseksi, sen jälkeen {year} vuodessa (noin {perMonth} kuukaudessa)',
    monthly: 'Kuukausitilaus',
    monthlyLine: '{month} kuukaudessa, laskutus ensimmäisestä päivästä, ei ilmaista viikkoa',
    billing: 'Laskutus Applen tai Googlen kautta. Emme koskaan näe korttiasi. Yksi tilaus kattaa kaikki ikäluokat.',
    localNote: '',
    startH: 'Näin aloitat (2 minuuttia, hänen puhelimessaan)',
    start: [
      'Istu pelaajasi kanssa alas ja avaa sovellus hänen puhelimessaan. Ohjelma on jo tallessa.',
      'Hän napauttaa aloituspainiketta vuositilaus valittuna.',
      'App Store tai Google Play pyytää maksun. Jos perheessänne on ostojen hyväksyntä käytössä (Applen Perhejako tai Google Family Link), saat pyynnön omaan puhelimeesi: hyväksy se. Muuten vahvistat maksun hänen kauppatilinsä maksutavalla.',
      'Valmista. Ilmainen viikko alkaa, ja ensimmäinen treeni on yhden napautuksen päässä.',
    ],
    cancelH: 'Näin perut',
    cancel: 'Kun perut ennen 7. päivää, mitään ei veloiteta. Peru tililtä, jolla tilaus on, yleensä pelaajasi tililtä:',
    cancelIos: 'iOS: Asetukset → nimi → Tilaukset → Elite Hockey Drills',
    cancelAndroid: 'Android: Google Play → profiilikuva → Maksut ja tilaukset → Tilaukset',
    cancelAfter: 'Ilmaisen viikon jälkeen käyttö jatkuu maksetun jakson loppuun.',
    privacyH: 'Tietosuoja',
    privacy: 'Ei mainoksia. Henkilötietoja ei koskaan myydä. Alle 13-vuotias tarvitsee vanhemman suostumuksen sovelluksen käyttöönottoon.',
    privacyLink: 'Tietosuojaseloste',
    contactH: 'Kysyttävää?',
    contact: 'Kirjoita valmentaja Davidille: {email}',
    cta: 'Lataa sovellus',
    langs: 'Kielet',
  },
  ru: {
    title: 'Для родителей — Elite Hockey Drills',
    desc: 'Ваш игрок попросил вас подключить Elite Hockey Drills: что это, сколько стоит, как запустить на его телефоне и как отменить.',
    kicker: 'Для родителей',
    h1: 'Ваш игрок просит вас подключить Elite Hockey Drills',
    lead: 'Это приложение для тренировок хоккеистов вне льда: сила, скорость и выносливость, спланированные вокруг тренировок на льду и игр. Его создал тренер Давид Цибох, магистр спортивной науки (M.Ed.) и бывший тренер сборной ОАЭ.',
    whatH: 'Что получит ваш игрок',
    what: [
      'Программу под возраст, позицию и расписание: от 2 до 5 тренировок в неделю вокруг льда и игр, с запланированными лёгкими неделями.',
      'Видео к каждому упражнению (390+), чтобы он выполнял всё правильно.',
      'Тренировки по возрасту. Игроки 14 лет и младше занимаются только с собственным весом и лёгким инвентарём, никогда со штангой. После сотрясения мозга, пока врач не дал допуск, жёсткие приземления, тяжёлая нагрузка на позвоночник и спринты в полную силу не входят в план, пока специалист их не разрешит.',
      'Тесты и личные рекорды, чтобы вы оба видели, что меняется.',
    ],
    costH: 'Сколько стоит',
    yearly: 'Годовая',
    yearlyLine: '7 дней бесплатно, затем {year} в год (около {perMonth} в месяц)',
    monthly: 'Месячная',
    monthlyLine: '{month} в месяц, списание с первого дня, без бесплатной недели',
    billing: 'Оплата через Apple или Google. Мы никогда не видим вашу карту. Одна подписка покрывает все возрастные группы.',
    localNote: 'За пределами США магазин показывает цену в вашей валюте.',
    startH: 'Как подключить (2 минуты, на его телефоне)',
    start: [
      'Сядьте вместе с игроком и откройте приложение на его телефоне. Программа уже сохранена.',
      'Он нажимает кнопку старта с выбранным годовым планом.',
      'App Store или Google Play попросит оплату. Если в семье включено одобрение покупок («Семейный доступ» Apple или Google Family Link), запрос придёт на ваш телефон: одобрите его. Иначе подтвердите оплату способом, привязанным к его аккаунту в магазине.',
      'Готово. Бесплатная неделя началась, первая тренировка в одно касание.',
    ],
    cancelH: 'Как отменить',
    cancel: 'Отмените до 7-го дня, и ничего не спишется. Отменяйте в том аккаунте, где оформлена подписка, обычно в аккаунте игрока:',
    cancelIos: 'iOS: Настройки → имя → Подписки → Elite Hockey Drills',
    cancelAndroid: 'Android: Google Play → значок профиля → Платежи и подписки → Подписки',
    cancelAfter: 'После бесплатной недели доступ сохраняется до конца оплаченного периода.',
    privacyH: 'Конфиденциальность',
    privacy: 'Никакой рекламы. Личные данные никогда не продаются. Игрокам младше 13 лет для настройки приложения нужно согласие родителя.',
    privacyLink: 'Политика конфиденциальности',
    contactH: 'Есть вопросы?',
    contact: 'Напишите тренеру Давиду: {email}',
    cta: 'Скачать приложение',
    langs: 'Языки',
  },
  es: {
    title: 'Para padres — Elite Hockey Drills',
    desc: 'Tu jugador te ha pedido que actives Elite Hockey Drills: qué es, cuánto cuesta, cómo activarlo en su teléfono y cómo cancelarlo.',
    kicker: 'Para padres',
    h1: 'Tu jugador te pide que actives Elite Hockey Drills',
    lead: 'Es una app de entrenamiento fuera del hielo para jugadores de hockey: fuerza, velocidad y resistencia, planificadas según sus entrenamientos en hielo y sus partidos. La creó el entrenador David Ciboch, M.Ed. en Ciencias del Deporte y exentrenador de la selección de los Emiratos Árabes Unidos.',
    whatH: 'Lo que recibe tu jugador',
    what: [
      'Un programa según su edad, posición y horario: de 2 a 5 sesiones a la semana alrededor del hielo y los partidos, con semanas más suaves ya planificadas.',
      'Un vídeo de cada ejercicio (más de 390), para que aprenda a hacerlo bien.',
      'Entrenamiento adecuado a su edad. Los jugadores de 14 años o menos entrenan solo con su peso corporal y material ligero, nunca con barra. Tras una conmoción cerebral sin alta médica, los aterrizajes duros, la carga pesada sobre la columna y los sprints al máximo quedan fuera del plan hasta que un profesional lo autorice.',
      'Tests y récords personales, para que los dos veáis lo que cambia.',
    ],
    costH: 'Cuánto cuesta',
    yearly: 'Anual',
    yearlyLine: '7 días gratis y después {year} al año (unos {perMonth} al mes)',
    monthly: 'Mensual',
    monthlyLine: '{month} al mes, se cobra desde el primer día, sin semana gratis',
    billing: 'Se cobra a través de Apple o Google. Nunca vemos tu tarjeta. Una suscripción cubre todas las edades.',
    localNote: 'Fuera de EE. UU., la tienda muestra el precio en tu moneda.',
    startH: 'Cómo activarlo (2 minutos, en su teléfono)',
    start: [
      'Siéntate con tu jugador y abre la app en su teléfono. Su programa ya está guardado.',
      'Toca el botón de empezar con el plan anual seleccionado.',
      'El App Store o Google Play pide el pago. Si en tu familia está activada la aprobación de compras («En familia» de Apple o Google Family Link), te llega una solicitud a tu propio teléfono: apruébala. Si no, confirmas con el método de pago de su cuenta de la tienda.',
      'Listo. Empieza la semana gratis y el primer entrenamiento está a un toque.',
    ],
    cancelH: 'Cómo cancelar',
    cancel: 'Si cancelas antes del día 7, no se cobra nada. Cancela en la cuenta que tiene la suscripción, normalmente la de tu jugador:',
    cancelIos: 'iOS: Ajustes → nombre → Suscripciones → Elite Hockey Drills',
    cancelAndroid: 'Android: Google Play → foto de perfil → Pagos y suscripciones → Suscripciones',
    cancelAfter: 'Después de la semana gratis, el acceso dura hasta el final del periodo pagado.',
    privacyH: 'Privacidad',
    privacy: 'Sin anuncios. Nunca vendemos datos personales. Los jugadores menores de 13 años necesitan el consentimiento de un padre o una madre para configurar la app.',
    privacyLink: 'Política de privacidad',
    contactH: '¿Preguntas?',
    contact: 'Escribe al entrenador David: {email}',
    cta: 'Descargar la app',
    langs: 'Idiomas',
  },
};

const PRICES = {
  en: { year: '$99.90', perMonth: '$8.33', month: '$17.99' },
  cs: { year: '2&nbsp;790&nbsp;Kč', perMonth: '232,50&nbsp;Kč', month: '499&nbsp;Kč' },
  sv: { year: '1&nbsp;295&nbsp;kr', perMonth: '107,92&nbsp;kr', month: '229&nbsp;kr' },
  de: { year: '99,90&nbsp;€', perMonth: '8,33&nbsp;€', month: '19,99&nbsp;€' },
  fi: { year: '99,90&nbsp;€', perMonth: '8,33&nbsp;€', month: '19,99&nbsp;€' },
  ru: { year: '$99.90', perMonth: '$8.33', month: '$17.99' },
  es: { year: '$99.90', perMonth: '$8.33', month: '$17.99' },
};

const esc = (s) => String(s).replace(/&(?!(nbsp|amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? `{${k}}`);

function page(lang) {
  const t = T[lang];
  const p = PRICES[lang];
  const url = `https://elitehockeydrills.com${pagePath(lang)}`;
  const alternates = LANGS.map(l => `  <link rel="alternate" hreflang="${l}" href="https://elitehockeydrills.com${pagePath(l)}" />`).join('\n');
  const langLinks = LANGS.map(l => (l === lang
    ? `<span aria-current="page">${NAMES[l]}</span>`
    : `<a href="${pagePath(l)}" hreflang="${l}" lang="${l}">${NAMES[l]}</a>`)).join(' · ');
  const email = `<a href="mailto:${EMAIL}">${EMAIL}</a>`;
  return `<!DOCTYPE html>
<html lang="${lang}">
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
<meta name="robots" content="noindex" />
<!-- Built by _build_parents_page.mjs — edit the texts there, not this file. -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.desc)}" />
<meta property="og:title" content="${esc(t.h1)}" />
<meta property="og:description" content="${esc(t.desc)}" />
<meta property="og:image" content="https://elitehockeydrills.com/coach.jpg" />
<meta property="og:url" content="${url}" />
${alternates}
  <link rel="alternate" hreflang="x-default" href="https://elitehockeydrills.com/parents" />
<style>
  :root { --bg:#070708; --card:#101015; --line:#23232c; --fg:#f2f5f9; --mut:#a6acb4; --gold:#eeb158; --ice:#4fc3f7; }
  * { box-sizing:border-box; }
  html,body { margin:0; background:var(--bg); color:var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Arial, sans-serif; }
  main { max-width:620px; margin:0 auto; padding:40px 16px 48px; }
  .brand { font-size:13px; letter-spacing:.18em; text-transform:uppercase; color:var(--mut); }
  .kicker { display:inline-block; margin-top:26px; font-size:12px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--gold); }
  h1 { font-size:30px; line-height:1.12; margin:10px 0 16px; font-weight:900; }
  .rule { width:96px; height:4px; background:var(--gold); margin:0 0 18px; }
  .lead { display:flex; gap:14px; align-items:flex-start; }
  .lead img { width:64px; height:64px; border-radius:50%; object-fit:cover; flex:none; border:1px solid var(--line); }
  p, li { color:var(--mut); font-size:16.5px; line-height:1.55; }
  p { margin:0 0 14px; }
  h2 { font-size:15px; letter-spacing:.14em; text-transform:uppercase; color:var(--fg); margin:34px 0 12px; }
  ul, ol { margin:0; padding-left:22px; }
  li { margin:0 0 10px; }
  li::marker { color:var(--gold); font-weight:700; }
  .plans { display:grid; gap:10px; }
  .plan { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px 16px; }
  .plan.best { border-color:var(--gold); }
  .plan b { display:block; color:var(--fg); font-size:15px; letter-spacing:.06em; text-transform:uppercase; margin-bottom:4px; }
  .plan span { color:var(--fg); font-size:16.5px; }
  .note { font-size:14.5px; margin-top:10px; }
  .path { display:block; color:var(--fg); background:var(--card); border:1px solid var(--line); border-radius:8px; padding:9px 12px; margin:8px 0 0; font-size:15px; line-height:1.45; }
  a { color:var(--ice); }
  .btn { display:block; text-align:center; margin:30px 0 0; padding:16px 18px; border-radius:12px; background:var(--gold); color:#121212; font-size:17px; font-weight:800; text-decoration:none; letter-spacing:.02em; }
  footer { max-width:620px; margin:0 auto; padding:0 16px 40px; color:var(--mut); font-size:13.5px; line-height:1.8; }
  footer a { color:var(--mut); }
  footer [aria-current] { color:var(--fg); }
</style>
</head>
<body>
<main>
  <div class="brand">Elite Hockey Drills · Coach David Ciboch</div>
  <div class="kicker">${esc(t.kicker)}</div>
  <h1>${esc(t.h1)}</h1>
  <div class="rule"></div>
  <div class="lead">
    <img src="/coach-face.jpg" alt="Coach David Ciboch" width="64" height="64" />
    <p>${esc(t.lead)}</p>
  </div>

  <h2>${esc(t.whatH)}</h2>
  <ul>
${t.what.map(s => `    <li>${esc(s)}</li>`).join('\n')}
  </ul>

  <h2>${esc(t.costH)}</h2>
  <div class="plans">
    <div class="plan best"><b>${esc(t.yearly)}</b><span>${fill(esc(t.yearlyLine), p)}</span></div>
    <div class="plan"><b>${esc(t.monthly)}</b><span>${fill(esc(t.monthlyLine), p)}</span></div>
  </div>
  <p class="note">${esc(t.billing)}${t.localNote ? ` ${esc(t.localNote)}` : ''}</p>

  <h2>${esc(t.startH)}</h2>
  <ol>
${t.start.map(s => `    <li>${esc(s)}</li>`).join('\n')}
  </ol>

  <h2>${esc(t.cancelH)}</h2>
  <p>${esc(t.cancel)}</p>
  <span class="path">${esc(t.cancelIos)}</span>
  <span class="path">${esc(t.cancelAndroid)}</span>
  <p class="note">${esc(t.cancelAfter)}</p>

  <h2>${esc(t.privacyH)}</h2>
  <p>${esc(t.privacy)} <a href="${privacyLink(lang)}">${esc(t.privacyLink)}</a></p>

  <h2>${esc(t.contactH)}</h2>
  <p>${fill(esc(t.contact), { email })}</p>

  <a class="btn" href="${appLink(lang)}">${esc(t.cta)}</a>
</main>
<footer>
  <div>${esc(t.langs)}: ${langLinks}</div>
  <div>© Elite Hockey Drills</div>
</footer>
<script>
  // Which page language parents land on, and whether they go on to the store.
  try { gtag('event', 'parents_page_view', { page_lang: '${lang}' }); } catch (e) {}
  document.querySelector('.btn').addEventListener('click', function () {
    try { gtag('event', 'parents_get_app', { page_lang: '${lang}' }); } catch (e) {}
  });
</script>
</body>
</html>
`;
}

for (const lang of LANGS) {
  const file = lang === 'en' ? 'parents.html' : path.join(lang, 'parents.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(lang));
  console.log('wrote', file);
}
