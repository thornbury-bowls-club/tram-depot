/* The Tram Depot · Thornbury Bowls Club Marketplace
   Screens and interactions. Data comes from window.DepotDB (db.js). */
(function () {
  'use strict';
  const db = window.DepotDB;
  const DAY = 864e5;
  const CREST = 'assets/crest.webp', SCRIPT = 'assets/script.webp';
  const CONTACT = (window.DEPOT_CONFIG && window.DEPOT_CONFIG.contactEmail) || 'chairperson@thornburybowls.com.au';

  /* ---------- icons and placeholder artwork ---------- */
  const ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.3 0 4 1.3 4.6 4"/></svg>',
    glass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10l-1 9a4 4 0 0 1-8 0z"/><path d="M12 16v5M8 21h8M7.5 8h9"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M12 9.5v.01M12 12.5v.01" stroke-linecap="round" stroke-width="2.6"/></svg>',
    signout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg>'
  };
  const ART = {
    bowls: '<svg viewBox="0 0 64 64"><circle cx="30" cy="34" r="20" fill="currentColor"/><circle cx="30" cy="34" r="12" fill="none" stroke="var(--surface)" stroke-width="2" opacity=".55"/><circle cx="30" cy="34" r="5" fill="none" stroke="var(--surface)" stroke-width="2" opacity=".55"/><circle cx="52" cy="14" r="5" fill="var(--surface)" stroke="currentColor" stroke-width="2"/></svg>',
    food: '<svg viewBox="0 0 64 64"><rect x="18" y="10" width="28" height="9" rx="2" fill="currentColor"/><path d="M16 22h32v28a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" fill="currentColor" opacity=".8"/><rect x="22" y="32" width="20" height="12" rx="2" fill="var(--surface)" opacity=".7"/></svg>',
    furniture: '<svg viewBox="0 0 64 64" fill="currentColor"><rect x="16" y="10" width="32" height="24" rx="4" opacity=".8"/><rect x="12" y="32" width="40" height="8" rx="3"/><rect x="15" y="40" width="5" height="16" rx="2"/><rect x="44" y="40" width="5" height="16" rx="2"/></svg>',
    craft: '<svg viewBox="0 0 64 64"><circle cx="28" cy="36" r="18" fill="currentColor"/><path d="M14 30c8 2 20 0 28-6M12 40c10 1 22-2 32-10M18 50c8-2 16-6 22-12" stroke="var(--surface)" stroke-width="2" fill="none" opacity=".6"/><path d="M40 8l16 40" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    services: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M40 10a12 12 0 0 0-13 16L12 41a5 5 0 0 0 7 7l15-15a12 12 0 0 0 16-13l-7 7-7-2-2-7z"/></svg>',
    other: '<svg viewBox="0 0 64 64"><path d="M10 22l22-10 22 10v24L32 56 10 46z" fill="currentColor" opacity=".8"/><path d="M10 22l22 10 22-10M32 32v24" stroke="var(--surface)" stroke-width="2.5" fill="none" opacity=".7"/></svg>',
    social: '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M14 8h18l-2 18a7 7 0 0 1-14 0z" opacity=".8"/><rect x="21.5" y="32" width="3" height="16"/><rect x="15" y="48" width="16" height="3" rx="1.5"/><path d="M36 14h16l-2 22a6 6 0 0 1-12 0z"/><rect x="42.5" y="41" width="3" height="10"/><rect x="37" y="51" width="14" height="3" rx="1.5"/></svg>',
    bowlers: '<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="22" cy="18" r="7"/><path d="M10 50c1-12 6-18 12-18s11 6 12 18z" opacity=".8"/><circle cx="44" cy="22" r="6"/><path d="M33 52c1-10 5-15 11-15s10 5 11 15z" opacity=".65"/></svg>'
  };
  const ARTCOL = { bowls: ['#dfe6f5', '#1d3370'], food: ['#fde9d6', '#b9590e'], furniture: ['#ece5db', '#6e5233'], craft: ['#f5e1ea', '#9b3b63'], services: ['#dff0ea', '#1f6b55'], other: ['#e9eaee', '#545b6e'], social: ['#fde9d6', '#b9590e'], bowlers: ['#dfe6f5', '#1d3370'] };

  /* ---------- the club's structure ---------- */
  const SECTIONS = [
    { id: 'market', name: 'Marketplace', blurb: 'Sell, give away or ask for an item or service', icon: 'tag' },
    { id: 'bowlers', name: 'Bowlers wanted', blurb: 'Find players for social bowls or a tournament', icon: 'people' },
    { id: 'social', name: 'Social', blurb: 'Share a non-bowling social event', icon: 'glass' }
  ];
  const CATS = {
    market: [['bowls', 'Bowls gear'], ['food', 'Food and produce'], ['furniture', 'Furniture'], ['craft', 'Craft'], ['services', 'Services'], ['other', 'Other']],
    bowlers: [['socialbowls', 'Social bowls'], ['tournament', 'Tournament']],
    social: [['social', 'Social']]
  };
  const SORTS = {
    market: [['newest', 'Newest'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['ending', 'Ending soon']],
    bowlers: [['soonest', 'Soonest event'], ['newest', 'Newest posted']],
    social: [['soonest', 'Soonest event'], ['newest', 'Newest posted']]
  };
  const EXPIRY = [['7', '7 days'], ['14', '14 days'], ['30', '30 days'], ['60', '60 days'], ['182', '6 months'], ['365', '12 months']];
  const POSITIONS = ['Any', 'Lead', 'Second', 'Third', 'Skip'];
  const SOLD_DAYS = 3;
  const secName = (id) => (SECTIONS.find((s) => s.id === id) || {}).name || '';
  const catName = (c) => (Object.values(CATS).flat().find((x) => x[0] === c) || [0, c])[1];
  const artFor = (l) => (l.section === 'market' ? l.category : l.section === 'social' ? 'social' : 'bowlers');

  /* ---------- state ---------- */
  const S = {
    booting: true, me: null, view: 'signin', tab: 'market',
    filters: { market: { type: 'all', cat: 'all' }, bowlers: { cat: 'all' }, social: { cat: 'all' } },
    q: '', sort: {}, detail: null, photoIdx: 0, form: null, errs: {}, confirm: null, extend: null,
    signStep: 'email', signEmail: '', signErr: '', busy: false, reporting: null, reported: null,
    modTab: 'reports', csv: '', csvMsg: '', csvRows: null, csvPreview: null, nm: { name: '', email: '' }, nmErr: '', ms: '', rmConfirm: null,
    listings: [], urls: {}, members: [], reports: [], loadErr: ''
  };
  try { S.sort = JSON.parse(localStorage.getItem('depot-sort') || '{}') || {}; } catch (e) { S.sort = {}; }
  try { S.signEmail = localStorage.getItem('depot-email') || ''; } catch (e) { /* private mode */ }
  const sortFor = (t) => S.sort[t] || SORTS[t][0][0];

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fd = (d) => DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()];
  const ft = (d) => { let h = d.getHours(); const m = d.getMinutes(); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (m ? ':' + String(m).padStart(2, '0') : '') + ap; };
  const ago = (d) => { const s = (Date.now() - d) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' hr ago'; const n = Math.round(s / 86400); return n === 1 ? 'yesterday' : n + ' days ago'; };
  const daysLeft = (l) => Math.ceil((l.expires - Date.now()) / DAY);
  const isExpired = (l) => l.expires < Date.now();
  const live = (l) => l.status === 'active' && !isExpired(l);
  const soldUntil = (l) => new Date(l.soldAt.getTime() + SOLD_DAYS * DAY);
  const recentlySold = (l) => l.status === 'sold' && l.soldAt && soldUntil(l) > Date.now();
  const visible = (l) => live(l) || recentlySold(l);
  const money = (n) => Number(n).toLocaleString('en-AU', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const priceText = (l) => l.priceType === 'free' ? 'Free' : l.priceType === 'offers' ? (l.type === 'wanted' ? 'Offers' : 'Ask / offers') : (l.type === 'wanted' ? 'Up to $' : '$') + money(l.price);
  const priceVal = (l) => l.priceType === 'free' ? 0 : l.priceType === 'offers' ? Infinity : Number(l.price);
  const isMod = () => !!(S.me && S.me.role === 'moderator');
  const mine = (l) => !!(S.me && l.sellerId === S.me.id);
  const endOfDayIn = (days) => { const d = new Date(Date.now() + days * DAY); d.setHours(23, 59, 0, 0); return d; };
  const toAnswer = () => S.listings.filter((l) => mine(l) && l.status !== 'hidden').flatMap((l) => l.questions.filter((q) => !q.answer && !q.hidden).map((q) => ({ l, q })));
  const listingById = (id) => S.listings.find((x) => x.id === id);

  function img(p, l, useThumb) {
    if (p && p.src) return '<img src="' + p.src + '" alt="">';
    if (p && p.path) {
      const url = S.urls[useThumb ? p.thumb : p.path] || S.urls[p.thumb] || S.urls[p.path];
      if (url) return '<img src="' + esc(url) + '" alt="" loading="lazy">';
    }
    const a = artFor(l || { section: 'market', category: 'other' }), c = ARTCOL[a] || ARTCOL.other;
    return '<div class="ph" style="background:' + c[0] + ';color:' + c[1] + '" role="img" aria-label="' + (p ? 'Photo loading' : 'No photo') + '">' + (ART[a] || ART.other) + '</div>';
  }

  let toastT;
  function toast(msg, ding, isErr) {
    clearTimeout(toastT);
    const old = document.querySelector('.toast'); if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : '');
    t.setAttribute('role', isErr ? 'alert' : 'status');
    t.innerHTML = (ding ? '<em>Ding ding</em>' : '') + esc(msg);
    document.body.appendChild(t);
    toastT = setTimeout(() => t.remove(), isErr ? 6000 : 3500);
  }
  const fail = (e) => { console.error(e); toast((e && e.message) || 'Something went wrong. Try again.', false, true); };

  /* ---------- data loading ---------- */
  async function refresh() {
    S.listings = await db.listings();
    await loadPhotoLinks();
    if (isMod() && S.view === 'mod') await loadModData();
  }
  async function loadPhotoLinks() {
    const paths = [];
    S.listings.forEach((l) => l.photos.forEach((p) => paths.push(p.thumb)));
    const d = S.detail && listingById(S.detail);
    if (d) d.photos.forEach((p) => paths.push(p.path));
    try { S.urls = Object.assign({}, S.urls, await db.signUrls(paths)); } catch (e) { console.warn(e); }
  }
  async function loadModData() {
    const [reports, members] = await Promise.all([db.reports(), db.members()]);
    S.reports = reports; S.members = members;
  }
  async function act(fn, okMsg, ding) {
    if (S.busy) return;
    S.busy = true; render();
    try {
      await fn();
      await refresh();
      if (okMsg) toast(okMsg, ding);
    } catch (e) { fail(e); }
    finally { S.busy = false; render(); }
  }

  /* ---------- routing (#listing-<id>, #mine, #mod, #new, #post, #market …) ---------- */
  function nav(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  async function route() {
    if (!S.me || !S.me.active) return render();
    const h = location.hash.replace(/^#/, '');
    S.confirm = null; S.extend = null; S.errs = {}; S.rmConfirm = null;
    if (h.startsWith('listing-')) {
      S.detail = h.slice(8); S.view = 'detail'; S.photoIdx = 0; S.reporting = null; S.reported = null;
      if (!listingById(S.detail)) { try { await refresh(); } catch (e) { fail(e); } }
      await loadPhotoLinks();
    } else if (h.startsWith('edit-')) {
      const l = listingById(h.slice(5));
      if (l && (mine(l) || isMod())) { S.form = newForm(null, l); S.view = 'form'; } else { S.view = 'browse'; }
    } else if (h === 'mine') S.view = 'mine';
    else if (h === 'mod' && isMod()) { S.view = 'mod'; try { await loadModData(); } catch (e) { fail(e); } }
    else if (h === 'new') S.view = 'choose';
    else if (h === 'post' && S.form) S.view = 'form';
    else { if (SECTIONS.some((s) => s.id === h)) S.tab = h; S.view = 'browse'; }
    render();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- views ---------- */
  function header() {
    const counts = Object.fromEntries(SECTIONS.map((s) => [s.id, S.listings.filter((l) => l.section === s.id && live(l)).length]));
    const ta = toAnswer().length;
    return '<header class="band"><div class="wrap">' +
      '<div class="band-top">' +
      '<button class="brand" data-a="home" aria-label="The Tram Depot home"><img class="crest" src="' + CREST + '" alt="Thornbury Bowls Club crest"><span style="min-width:0"><span class="sign">The Tram Depot</span><span class="sign-sub">Thornbury Bowls Club Marketplace</span></span></button>' +
      '<div class="who">' +
      (isMod() ? '<button class="iconbtn ' + (S.view === 'mod' ? 'on' : '') + '" data-a="nav" data-h="#mod">' + ICON.shield + '<span class="lbl">Moderate</span>' + (S.reports.length ? '<span class="badge">' + S.reports.length + '</span>' : '') + '</button>' : '') +
      '<button class="iconbtn ' + (S.view === 'mine' ? 'on' : '') + '" data-a="nav" data-h="#mine" aria-label="My listings' + (ta ? ', ' + ta + ' questions to answer' : '') + '">' + ICON.list + '<span class="lbl">My listings</span>' + (ta ? '<span class="badge">' + ta + '</span>' : '') + '</button>' +
      '<button class="iconbtn" data-a="signout" aria-label="Sign out ' + esc(S.me.name) + '" title="Sign out">' + ICON.signout + '</button>' +
      '</div></div>' +
      (S.view === 'browse' ? '<nav class="tabs" role="tablist" aria-label="Sections">' + SECTIONS.map((s) => '<button class="tab" role="tab" aria-selected="' + (S.tab === s.id) + '" data-a="nav" data-h="#' + s.id + '">' + s.name + '<span class="n">' + counts[s.id] + '</span></button>').join('') + '</nav>' : '') +
      '</div></header>';
  }
  const footer = () => '<div class="foot"><img src="' + SCRIPT + '" alt="Thornbury Bowls Club"></div><p class="note" style="text-align:center;margin:6px 0 0">Questions about the Depot? Email <span class="sel">' + esc(CONTACT) + '</span></p>';

  function browseView() {
    const t = S.tab, f = S.filters[t], q = S.q.trim().toLowerCase();
    let items = S.listings.filter((l) => l.section === t && visible(l));
    if (t === 'market' && f.type !== 'all') items = items.filter((l) => l.type === f.type);
    if (f.cat !== 'all') items = items.filter((l) => l.category === f.cat);
    if (q) items = items.filter((l) => (l.title + ' ' + l.desc + ' ' + catName(l.category) + ' ' + l.where).toLowerCase().includes(q));
    const s = sortFor(t);
    const pv = (l) => { const v = priceVal(l); return v === Infinity ? -1 : v; };
    items.sort((a, b) => (recentlySold(a) - recentlySold(b)) || (
      s === 'newest' ? b.created - a.created :
      s === 'low' ? (priceVal(a) - priceVal(b)) || (b.created - a.created) :
      s === 'high' ? (pv(b) - pv(a)) || (b.created - a.created) :
      s === 'ending' ? a.expires - b.expires :
      a.eventAt - b.eventAt));
    const cats = CATS[t];
    const ta = toAnswer().length;
    const tools = '<div class="tools">' +
      '<div class="searchrow"><div class="search">' + ICON.search + '<input type="text" id="q" placeholder="Search ' + secName(t).toLowerCase() + '" value="' + esc(S.q) + '" aria-label="Search listings"></div>' +
      '<div class="sortbox"><label for="sort">Sort</label><select id="sort">' + SORTS[t].map((o) => '<option value="' + o[0] + '"' + (o[0] === s ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div></div>' +
      (t === 'market' ? '<div class="filterrow"><div class="seg" role="group" aria-label="Listing type">' + [['all', 'All'], ['sale', 'For sale'], ['wanted', 'Wanted']].map((o) => '<button aria-pressed="' + (f.type === o[0]) + '" data-a="type" data-t="' + o[0] + '">' + o[1] + '</button>').join('') + '</div><span class="count">' + items.filter(live).length + ' available</span></div>' : '') +
      (cats.length > 1 ? '<div class="chips" role="group" aria-label="Category">' + [['all', 'All']].concat(cats).map((c) => '<button class="chip" aria-pressed="' + (f.cat === c[0]) + '" data-a="cat" data-c="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>' : '') +
      '</div>';
    let body;
    const filtered = q || f.cat !== 'all' || (f.type && f.type !== 'all');
    if (!items.length) body = '<div class="empty"><b>' + (filtered ? 'No listings match' : 'Be the first to post here') + '</b><span>' + (filtered ? 'Try another search or category.' : 'Tap "New post" to add one.') + '</span></div>';
    else if (t === 'market') body = '<div class="grid">' + items.map(card).join('') + '</div>';
    else body = '<div class="elist">' + items.map(ecard).join('') + '</div>';
    return '<main><div class="wrap">' +
      (ta ? '<button class="todo-banner" data-a="nav" data-h="#mine">' + ICON.chat + '<span>' + (ta === 1 ? '1 question' : ta + ' questions') + ' on your listings ' + (ta === 1 ? 'needs' : 'need') + ' an answer</span><span class="chev">' + ICON.chev + '</span></button>' : '') +
      tools + body + footer() + '</div></main>' +
      '<button class="btn go fab" data-a="nav" data-h="#new">' + ICON.plus + 'New post</button>';
  }
  function card(l) {
    const sold = recentlySold(l);
    return '<button class="card ' + (sold ? 'sold' : '') + '" data-a="open" data-id="' + l.id + '"><span class="thumb">' + img(l.photos[0], l, true) +
      (l.type === 'wanted' ? '<span class="tag wanted">Wanted</span>' : '') + (sold ? '<span class="ribbon">' + (l.type === 'wanted' ? 'Found' : 'Sold') + '</span>' : '') + '</span>' +
      '<span class="card-b"><span class="price">' + priceText(l) + '</span><span class="card-t">' + esc(l.title) + '</span><span class="meta">' + (sold ? (l.type === 'wanted' ? 'Found ' : 'Sold ') + ago(l.soldAt) : catName(l.category) + ' · ' + ago(l.created)) + '</span></span></button>';
  }
  function ecard(l) {
    const d = l.eventAt;
    return '<button class="ecard" data-a="open" data-id="' + l.id + '"><span class="datebox"><span class="d">' + DOW[d.getDay()] + '</span><span class="n">' + d.getDate() + '</span><span class="m">' + MON[d.getMonth()] + '</span></span>' +
      '<span class="card-b" style="padding:0"><span class="card-t">' + esc(l.title) + '</span>' +
      '<span class="erow"><span class="meta">' + ft(d) + (l.where ? ' · ' + esc(l.where) : '') + '</span></span>' +
      '<span class="erow">' + (l.section === 'bowlers' ? '<span class="tag">' + catName(l.category) + '</span>' : '') + (l.spots ? '<span class="tag warn">Need ' + esc(l.spots) + '</span>' : '') + (l.section === 'bowlers' && l.position !== 'Any' ? '<span class="tag">' + esc(l.position) + '</span>' : '') + '<span class="meta">Posted by ' + esc(l.sellerName) + '</span></span></span></button>';
  }

  function detailView() {
    const l = listingById(S.detail);
    if (!l) return '<main><div class="wrap"><button class="back" data-a="home">' + ICON.back + 'Back to browsing</button><div class="empty panel"><b>This listing is no longer available</b><span>It may have sold, expired or been removed.</span></div></div></main>';
    const own = mine(l), mod = isMod(), ev = l.section !== 'market';
    const pics = l.photos.length ? l.photos : [null];
    const pi = Math.min(S.photoIdx, pics.length - 1);
    const stat = l.status === 'hidden' ? '<span class="tag bad">Hidden by moderator</span>' : l.status === 'sold' ? '<span class="tag sold">' + (l.type === 'wanted' ? 'Found' : 'Sold') + '</span>' : isExpired(l) ? '<span class="tag bad">Expired</span>' : '';
    const facts = ev
      ? '<dl class="facts"><dt>When</dt><dd>' + fd(l.eventAt) + ', ' + ft(l.eventAt) + '</dd>' + (l.where ? '<dt>Where</dt><dd>' + esc(l.where) + '</dd>' : '') +
        (l.section === 'bowlers' ? '<dt>Type</dt><dd>' + catName(l.category) + '</dd>' + (l.spots ? '<dt>Spots</dt><dd>' + esc(l.spots) + ' needed</dd>' : '') + '<dt>Position</dt><dd>' + esc(l.position) + '</dd>' : '') + '</dl>'
      : '<dl class="facts"><dt>Category</dt><dd>' + catName(l.category) + '</dd><dt>Type</dt><dd>' + (l.type === 'wanted' ? 'Wanted' : 'For sale') + '</dd></dl>';
    const conf = S.confirm && S.confirm.id === l.id;
    const busy = S.busy ? ' disabled' : '';
    const ownerBar = own ? '<div class="owner-bar"><button class="btn small" data-a="nav" data-h="#edit-' + l.id + '">Edit</button>' + (l.section === 'market' && l.status === 'active' && !isExpired(l) ? '<button class="btn small" data-a="sold" data-id="' + l.id + '"' + busy + '>Mark as ' + (l.type === 'wanted' ? 'found' : 'sold') + '</button>' : '') + '<button class="btn small danger" data-a="askdel" data-id="' + l.id + '">Delete</button></div>' : '';
    const modBar = mod && !own ? '<div class="owner-bar"><span class="tag">Moderator</span><button class="btn small" data-a="hide" data-id="' + l.id + '"' + busy + '>' + (l.status === 'hidden' ? 'Restore listing' : 'Hide listing') + '</button><button class="btn small danger" data-a="askdel" data-id="' + l.id + '">Delete</button></div>' : '';
    const qs = l.questions.slice().sort((a, b) => own ? ((!!a.answer || a.hidden) - (!!b.answer || b.hidden)) : 0);
    const shown = l.questions.filter((q) => !q.hidden).length;
    const canAsk = !own && live(l);
    return '<main><div class="wrap"><button class="back" data-a="home">' + ICON.back + 'Back to ' + secName(l.section) + '</button>' +
      '<div class="detail">' +
      '<div class="gallery"><div class="main">' + img(pics[pi], l, false) + '</div>' + (pics.length > 1 ? '<div class="thumbs">' + pics.map((p, i) => '<button aria-pressed="' + (i === pi) + '" data-a="photo" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '">' + img(p, l, true) + '</button>').join('') + '</div>' : '') + '</div>' +
      '<div class="stack">' +
      '<div class="stack" style="gap:8px"><div class="erow">' + (l.type === 'wanted' ? '<span class="tag wanted">Wanted</span>' : '') + stat + '</div>' +
      '<h1 class="d-title">' + esc(l.title) + '</h1>' + (ev ? '' : '<div class="d-price">' + priceText(l) + '</div>') +
      '<div class="meta">Posted by <b>' + esc(l.sellerName) + '</b> · ' + ago(l.created) + (recentlySold(l) ? '' : ' · ' + (isExpired(l) ? 'expired' : (ev ? 'comes down ' : 'expires ') + fd(l.expires))) + '</div></div>' +
      (recentlySold(l) ? '<div class="soldnote">' + (l.type === 'wanted' ? 'Found' : 'Sold') + ' ' + ago(l.soldAt) + '. This listing comes down on ' + fd(soldUntil(l)) + '.</div>' : '') +
      facts + '<p class="desc" style="margin:0">' + esc(l.desc) + '</p>' + ownerBar + modBar +
      (conf ? '<div class="confirm" role="alert">Delete this listing for good?<button class="btn small danger" data-a="del" data-id="' + l.id + '"' + busy + '>Delete</button><button class="btn small" data-a="nodel">Keep it</button></div>' : '') +
      '<section class="qa panel" aria-labelledby="qa-h"><h2 id="qa-h">Questions <span class="meta" style="font-family:var(--font-body);letter-spacing:0;text-transform:none">(' + shown + ')</span></h2>' +
      (qs.length ? qs.map((q) => {
        const needs = own && !q.answer && !q.hidden;
        return '<div class="q ' + (q.hidden ? 'hidden' : '') + ' ' + (needs ? 'needs' : '') + '">' + (needs ? '<span class="flag">Needs your answer</span>' : '') +
          '<div class="qt">' + esc(q.text) + '</div><div class="meta">' + esc(q.byName) + ' · ' + ago(q.at) + (q.hidden ? ' · hidden by moderator' : '') + '</div>' +
          (q.answer ? '<div class="a"><b>' + esc(l.sellerName) + ':</b> ' + esc(q.answer) + '</div>' :
            own ? '<form class="ask" data-f="answer" data-l="' + l.id + '" data-q="' + q.id + '"><div class="row"><input type="text" id="ans-' + q.id + '" maxlength="1000" placeholder="Write your answer" aria-label="Answer"><button class="btn small primary"' + busy + '>Answer</button></div></form>' : '<div class="note">Waiting for an answer</div>') +
          (mod ? '<div><button class="btn link" data-a="hideq" data-id="' + q.id + '" data-h="' + (q.hidden ? 0 : 1) + '">' + (q.hidden ? 'Show question' : 'Hide question') + '</button></div>' : '') + '</div>';
      }).join('') : '<p class="note" style="margin:8px 0 0">No questions yet.</p>') +
      (canAsk ? '<form class="ask" data-f="ask"><label for="askq" class="note">Questions and answers are visible to all members. ' + esc(l.sellerName) + ' gets an email when you ask.</label><div class="row"><input type="text" id="askq" placeholder="Is it still available?" maxlength="300"><button class="btn primary"' + busy + '>Ask</button></div>' + (S.errs.ask ? '<span class="err">' + S.errs.ask + '</span>' : '') + '</form>' : '') +
      '</section>' +
      (!own ? (S.reported === l.id ? '<p class="note">Thanks. A moderator will take a look.</p>' : S.reporting === l.id ? '<form class="ask panel" data-f="report"><label for="rep" style="font-weight:700">Why are you reporting this?</label><input type="text" id="rep" maxlength="300" placeholder="Already sold, wrong section, inappropriate"><div class="row"><button class="btn small primary"' + busy + '>Send report</button><button type="button" class="btn small" data-a="noreport">Cancel</button></div></form>' : '<div><button class="btn link" data-a="report">Report this listing</button></div>') : '') +
      '</div></div></div></main>';
  }

  function chooseView() {
    return '<main><div class="wrap"><button class="back" data-a="home">' + ICON.back + 'Cancel</button>' +
      '<div class="page-h"><div><h1>New post</h1><p>What are you posting?</p></div></div>' +
      '<div class="choose">' + SECTIONS.map((s) => '<button class="choice" data-a="pick" data-s="' + s.id + '"><span class="ic">' + ICON[s.icon] + '</span><span><b>' + s.name + '</b><span>' + s.blurb + '</span></span><span class="chev">' + ICON.chev + '</span></button>').join('') + '</div></div></main>';
  }

  function newForm(section, l) {
    if (l) {
      const d = l.eventAt;
      const pad = (n) => String(n).padStart(2, '0');
      return {
        id: l.id, section: l.section, type: l.type, title: l.title, category: l.category, priceType: l.priceType || 'amount', price: l.price || '', desc: l.desc,
        photos: l.photos.map((p) => Object.assign({}, p)), removed: [], exp: '', expires: l.expires, status: l.status,
        date: d ? d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) : '', time: d ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : '',
        spots: l.spots, position: l.position, where: l.where
      };
    }
    return { section, type: 'sale', title: '', category: section === 'social' ? 'social' : '', priceType: 'amount', price: '', desc: '', photos: [], removed: [], exp: '30', date: '', time: '', spots: '', position: 'Any', where: '' };
  }

  function formView() {
    const f = S.form, e = S.errs, sec = SECTIONS.find((s) => s.id === f.section), ev = f.section !== 'market', edit = !!f.id;
    const err = (k) => e[k] ? '<span class="err" id="err-' + k + '">' + e[k] + '</span>' : '';
    const cats = CATS[f.section];
    const today = new Date(); const pad = (n) => String(n).padStart(2, '0');
    const minDate = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    return '<main><div class="wrap"><button class="back" data-a="' + (edit ? 'backdetail' : 'nav') + '" data-h="#new">' + ICON.back + (edit ? 'Back to listing' : 'Choose a different section') + '</button>' +
      '<div class="page-h"><div><h1>' + (edit ? 'Edit listing' : sec.name) + '</h1><p>' + (edit ? sec.name : sec.blurb) + '</p></div></div>' +
      '<form class="form panel" data-f="post" novalidate>' +
      (f.section === 'market' ? '<div class="field"><span class="lbl">Type</span><div class="radios">' + [['sale', 'For sale'], ['wanted', 'Wanted']].map((o) => '<label><input type="radio" name="type" value="' + o[0] + '"' + (f.type === o[0] ? ' checked' : '') + '>' + o[1] + '</label>').join('') + '</div></div>' : '') +
      '<div class="field"><label for="f-title">Title</label><input type="text" id="f-title" maxlength="80" value="' + esc(f.title) + '" placeholder="' + (ev ? (f.section === 'social' ? 'Trivia night team, The Croxton' : 'Need 2 for triples, Friday twilight') : (f.type === 'wanted' ? 'Size 2 bowls for a new bowler' : 'Henselite bowls, size 3')) + '">' + err('title') + '</div>' +
      (cats.length > 1 ? '<div class="field"><label for="f-cat">Category</label><select id="f-cat"><option value="">Choose a category</option>' + cats.map((c) => '<option value="' + c[0] + '"' + (f.category === c[0] ? ' selected' : '') + '>' + c[1] + '</option>').join('') + '</select>' + err('category') + '</div>' : '') +
      (f.section === 'market' ? '<div class="field"><span class="lbl">Price</span><div class="radios">' + [['amount', f.type === 'wanted' ? 'Up to an amount' : 'Set a price'], ['free', 'Free'], ['offers', f.type === 'wanted' ? 'Offers' : 'Ask / offers']].map((o) => '<label><input type="radio" name="ptype" value="' + o[0] + '"' + (f.priceType === o[0] ? ' checked' : '') + '>' + o[1] + '</label>').join('') + '</div>' +
        (f.priceType === 'amount' ? '<div style="max-width:200px"><label for="f-price" class="note">Amount in dollars</label><input type="number" id="f-price" min="1" max="99999" step="1" inputmode="numeric" value="' + esc(f.price) + '" placeholder="40"></div>' : '') + err('price') + '</div>' : '') +
      (ev ? '<div class="two"><div class="field"><label for="f-date">Event date</label><input type="date" id="f-date" min="' + minDate + '" value="' + esc(f.date) + '">' + err('date') + '</div><div class="field"><label for="f-time">Start time</label><input type="time" id="f-time" value="' + esc(f.time) + '"></div></div>' : '') +
      (f.section === 'bowlers' ? '<div class="two"><div class="field"><label for="f-spots">Spots needed <span class="note">(optional)</span></label><input type="number" id="f-spots" min="1" max="12" value="' + esc(f.spots) + '" placeholder="2">' + err('spots') + '</div><div class="field"><label for="f-pos">Position <span class="note">(optional)</span></label><select id="f-pos">' + POSITIONS.map((p) => '<option' + (f.position === p ? ' selected' : '') + '>' + p + '</option>').join('') + '</select></div></div>' : '') +
      (f.section === 'social' ? '<div class="field"><label for="f-where">Where <span class="note">(optional)</span></label><input type="text" id="f-where" maxlength="100" value="' + esc(f.where) + '" placeholder="Clubhouse"></div>' : '') +
      '<div class="field"><label for="f-desc">Description</label><textarea id="f-desc" maxlength="1500" placeholder="' + (ev ? 'Format, who it suits, anything to bring' : 'Condition, size, where to pick up') + '">' + esc(f.desc) + '</textarea>' + err('desc') + '</div>' +
      '<div class="field"><span class="lbl">Photos <span class="note">(' + (ev ? 'optional, ' : '') + 'up to 4)</span></span>' +
      '<div class="photos">' + f.photos.map((p, i) => '<div class="pslot">' + img(p, { section: f.section, category: f.category || 'other' }, true) + '<button type="button" data-a="rmphoto" data-i="' + i + '" aria-label="Remove photo ' + (i + 1) + '">×</button></div>').join('') +
      (f.photos.length < 4 ? '<label class="padd">' + ICON.camera + (S.photoBusy ? 'Adding…' : 'Add photo') + '<input type="file" id="f-photo" accept="image/*" multiple></label>' : '') + '</div>' +
      '<span class="hint">Photos are resized automatically, so phone photos are fine.</span></div>' +
      (ev ? '<p class="note" style="margin:0">This post comes down automatically the day after the event.</p>' :
        '<div class="field" style="max-width:300px"><label for="f-exp">' + (edit ? 'Extend from today by' : 'Show listing for') + '</label><select id="f-exp">' + (edit ? '<option value="">Keep current expiry (' + fd(f.expires) + ')</option>' : '') + EXPIRY.map((o) => '<option value="' + o[0] + '"' + (f.exp === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select><span class="hint">You can extend it any time from My listings.</span></div>') +
      '<div class="erow" style="gap:10px"><button class="btn go"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? (edit ? 'Saving…' : 'Posting…') : (edit ? 'Save changes' : 'Post listing')) + '</button><button type="button" class="btn" data-a="' + (edit ? 'backdetail' : 'home') + '">Cancel</button></div>' +
      (Object.keys(e).length ? '<span class="err" role="alert">Check the highlighted fields above.</span>' : '') +
      '</form></div></main>';
  }

  function mineView() {
    const list = S.listings.filter(mine).sort((a, b) => b.created - a.created);
    const busy = S.busy ? ' disabled' : '';
    const status = (l) => l.status === 'hidden' ? '<span class="tag bad">Hidden by moderator</span>' : l.status === 'sold' ? '<span class="tag sold">' + (l.type === 'wanted' ? 'Found' : 'Sold') + '</span><span class="meta">' + (recentlySold(l) ? 'showing until ' + fd(soldUntil(l)) : 'no longer showing') + '</span>' : isExpired(l) ? '<span class="tag bad">Expired</span>' : daysLeft(l) <= 3 ? '<span class="tag warn">Ends in ' + daysLeft(l) + ' day' + (daysLeft(l) === 1 ? '' : 's') + '</span>' : '<span class="tag ok">Active</span>';
    const ta = toAnswer();
    const todo = ta.length ? '<section class="todo" aria-labelledby="todo-h"><h2 class="sec-h" id="todo-h" style="display:flex;align-items:center;gap:8px">Questions to answer <span class="badge">' + ta.length + '</span></h2><p class="note" style="margin:0 0 4px">Answers show on the listing for all members.</p>' +
      ta.map(({ l, q }) => '<div class="q"><button class="btn link" style="padding:0;min-height:0;justify-self:start;color:var(--orange-ink);font-weight:700" data-a="open" data-id="' + l.id + '">' + esc(l.title) + '</button><div class="qt">' + esc(q.text) + '</div><div class="meta">' + esc(q.byName) + ' · ' + ago(q.at) + '</div>' +
        '<form class="ask" data-f="answer" data-l="' + l.id + '" data-q="' + q.id + '" style="margin-top:2px"><div class="row"><input type="text" id="ans-' + q.id + '" maxlength="1000" placeholder="Write your answer" aria-label="Answer to: ' + esc(q.text) + '"><button class="btn small primary"' + busy + '>Answer</button></div></form></div>').join('') + '</section>' : '';
    return '<main><div class="wrap"><button class="back" data-a="home">' + ICON.back + 'Back to browsing</button>' +
      '<div class="page-h"><div><h1>My listings</h1><p>Signed in as ' + esc(S.me.name) + '. Listings are deleted 30 days after they expire.</p></div><button class="btn go" data-a="nav" data-h="#new">' + ICON.plus + 'New post</button></div>' + todo +
      (list.length ? '<div class="rows">' + list.map((l) => {
        const open = l.questions.filter((q) => !q.answer && !q.hidden).length;
        return '<div class="lrow"><button class="tn" data-a="open" data-id="' + l.id + '" aria-label="Open ' + esc(l.title) + '">' + img(l.photos[0], l, true) + '</button>' +
          '<div style="min-width:0"><div class="erow">' + status(l) + (open ? '<span class="tag warn">' + open + ' to answer</span>' : '') + '<span class="meta">' + secName(l.section) + (l.section === 'market' ? ' · ' + catName(l.category) : '') + '</span></div>' +
          '<div class="card-t" style="margin-top:4px">' + esc(l.title) + '</div>' +
          '<div class="meta">' + (l.section === 'market' ? priceText(l) + ' · ' : '') + l.questions.length + ' question' + (l.questions.length === 1 ? '' : 's') + ' · ' + (isExpired(l) ? 'expired ' : (l.section === 'market' ? 'expires ' : 'comes down ')) + fd(l.expires) + '</div>' +
          '<div class="acts"><button class="btn small" data-a="nav" data-h="#edit-' + l.id + '">Edit</button>' + (l.section === 'market' ? '<button class="btn small" data-a="extend" data-id="' + l.id + '">Extend</button>' : '') + (l.section === 'market' && l.status === 'active' && !isExpired(l) ? '<button class="btn small" data-a="sold" data-id="' + l.id + '"' + busy + '>Mark as ' + (l.type === 'wanted' ? 'found' : 'sold') + '</button>' : '') + '<button class="btn small danger" data-a="askdel" data-id="' + l.id + '">Delete</button></div>' +
          (S.extend === l.id ? '<div class="extend"><label for="ext-sel" class="note">Extend from today by</label><select id="ext-sel">' + EXPIRY.map((o) => '<option value="' + o[0] + '"' + (o[0] === '30' ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select><button class="btn small primary" data-a="doextend" data-id="' + l.id + '"' + busy + '>Extend</button><button class="btn small" data-a="noextend">Cancel</button></div>' : '') +
          (S.confirm && S.confirm.id === l.id ? '<div class="confirm" style="margin-top:8px" role="alert">Delete for good?<button class="btn small danger" data-a="del" data-id="' + l.id + '"' + busy + '>Delete</button><button class="btn small" data-a="nodel">Keep it</button></div>' : '') +
          '</div></div>';
      }).join('') + '</div>' : '<div class="empty panel"><b>You haven\'t posted anything yet</b><span>Sell, give away or find something, or round up some bowlers.</span><button class="btn go" data-a="nav" data-h="#new">' + ICON.plus + 'New post</button></div>') +
      '</div></main>';
  }

  function modView() {
    const t = S.modTab, busy = S.busy ? ' disabled' : '';
    const byListing = {};
    S.reports.forEach((r) => { (byListing[r.listingId] = byListing[r.listingId] || []).push(r); });
    const reportedIds = Object.keys(byListing);
    let body = '';
    if (t === 'reports') {
      body = reportedIds.length ? '<div class="rows">' + reportedIds.map((id) => {
        const l = listingById(id); const rs = byListing[id];
        if (!l) return '';
        return '<div class="lrow"><button class="tn" data-a="open" data-id="' + l.id + '" aria-label="Open listing">' + img(l.photos[0], l, true) + '</button><div style="min-width:0">' +
          '<div class="card-t">' + esc(l.title) + '</div><div class="meta">Posted by ' + esc(l.sellerName) + ' · ' + (l.status === 'hidden' ? 'hidden' : 'visible') + '</div>' +
          rs.map((r) => '<div class="q" style="padding-block:8px"><div>"' + esc(r.reason) + '"</div><div class="meta">Reported by ' + esc(r.byName) + ' · ' + ago(r.at) + '</div></div>').join('') +
          '<div class="acts"><button class="btn small" data-a="hide" data-id="' + l.id + '"' + busy + '>' + (l.status === 'hidden' ? 'Restore' : 'Hide') + '</button><button class="btn small" data-a="dismiss" data-id="' + l.id + '"' + busy + '>Dismiss report</button><button class="btn small danger" data-a="askdel" data-id="' + l.id + '">Delete</button></div>' +
          (S.confirm && S.confirm.id === l.id ? '<div class="confirm" style="margin-top:8px">Delete for good?<button class="btn small danger" data-a="del" data-id="' + l.id + '"' + busy + '>Delete</button><button class="btn small" data-a="nodel">Keep it</button></div>' : '') +
          '</div></div>';
      }).join('') + '</div>' : '<div class="empty panel"><b>No open reports</b><span>Listings members report show up here.</span></div>';
    }
    if (t === 'all') {
      const all = S.listings.slice().sort((a, b) => b.created - a.created);
      body = all.length ? '<div class="tablewrap"><table><thead><tr><th>Listing</th><th>Section</th><th>Posted by</th><th>Status</th><th>Ends</th><th></th></tr></thead><tbody>' + all.map((l) => '<tr><td><button class="btn link" style="color:var(--ink);text-decoration:none;font-weight:700" data-a="open" data-id="' + l.id + '">' + esc(l.title.length > 38 ? l.title.slice(0, 36) + '…' : l.title) + '</button></td><td>' + secName(l.section) + '</td><td>' + esc(l.sellerName) + '</td><td>' + (l.status === 'hidden' ? '<span class="tag bad">Hidden</span>' : l.status === 'sold' ? '<span class="tag sold">Sold</span>' : isExpired(l) ? '<span class="tag bad">Expired</span>' : '<span class="tag ok">Active</span>') + '</td><td>' + fd(l.expires) + '</td><td><button class="btn small" data-a="hide" data-id="' + l.id + '"' + busy + '>' + (l.status === 'hidden' ? 'Restore' : 'Hide') + '</button></td></tr>').join('') + '</tbody></table></div>'
        : '<div class="empty panel"><b>No listings yet</b><span>Every listing, including hidden and expired ones, shows here.</span></div>';
    }
    if (t === 'members') {
      const counts = {}; S.listings.forEach((l) => { counts[l.sellerId] = (counts[l.sellerId] || 0) + 1; });
      const ms = S.ms.trim().toLowerCase();
      const rows = S.members.filter((m) => !ms || (m.name + ' ' + m.email).toLowerCase().includes(ms));
      const activeCount = S.members.filter((m) => m.active).length;
      const pv = S.csvPreview;
      body = '<div class="stack">' +
        '<div class="panel stack" style="gap:10px"><h2 class="sec-h">Add a member</h2>' +
        '<form class="two" data-f="addmember" novalidate style="align-items:end"><div class="field"><label for="nm-name">Name</label><input type="text" id="nm-name" maxlength="100" value="' + esc(S.nm.name) + '" placeholder="Chris Taylor"></div><div class="field"><label for="nm-email">Email</label><input type="email" id="nm-email" value="' + esc(S.nm.email) + '" placeholder="chris@example.com"></div><div><button class="btn primary"' + busy + '>Add member</button></div></form>' +
        (S.nmErr ? '<span class="err" role="alert">' + S.nmErr + '</span>' : '') + '<p class="note" style="margin:0">They can sign in straight away with that email. No invitation is sent, so let them know.</p></div>' +
        '<div class="filterrow"><div class="search" style="flex:1 1 240px">' + ICON.search + '<input type="text" id="msearch" placeholder="Find a member by name or email" value="' + esc(S.ms) + '" aria-label="Find a member"></div><span class="count">' + activeCount + ' active member' + (activeCount === 1 ? '' : 's') + '</span></div>' +
        '<div class="tablewrap"><table class="mtable"><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Listings</th><th></th></tr></thead><tbody>' +
        rows.map((m) => S.rmConfirm === m.id
          ? '<tr><td colspan="5" style="white-space:normal"><div class="confirm">Remove ' + esc(m.name) + '? They won\'t be able to sign in. Their listings stay up until they expire.<button class="btn small danger" data-a="rmmember" data-id="' + m.id + '"' + busy + '>Remove</button><button class="btn small" data-a="normmember">Cancel</button></div></td></tr>'
          : '<tr><td>' + esc(m.name) + '</td><td>' + esc(m.email) + '</td><td>' + (m.role === 'moderator' ? '<span class="tag warn">Moderator</span>' : !m.active ? '<span class="tag bad">Removed</span>' : '<span class="tag ok">Member</span>') + '</td><td>' + (counts[m.id] || 0) + '</td><td>' + (m.role === 'moderator' ? '' : !m.active ? '<button class="btn small" data-a="restoremember" data-id="' + m.id + '"' + busy + '>Restore</button>' : '<button class="btn small danger" data-a="askrmmember" data-id="' + m.id + '">Remove</button>') + '</td></tr>').join('') +
        (rows.length ? '' : '<tr><td colspan="5" style="white-space:normal" class="note">No members match.</td></tr>') +
        '</tbody></table></div>' +
        '<div class="panel stack" style="gap:10px"><h2 class="sec-h">Bulk update from a CSV</h2><p class="note" style="margin:0">For the yearly membership update. Paste or upload a CSV with each member\'s name and email. Members not in the file lose access (moderators are never removed). You\'ll see a preview before anything changes.</p>' +
        '<textarea id="csv" placeholder="name,email&#10;Chris Taylor,chris@example.com" style="font-family:ui-monospace,monospace;font-size:14px">' + esc(S.csv) + '</textarea>' +
        '<div class="erow" style="gap:8px"><label class="btn small">Choose CSV file<input type="file" id="csvfile" accept=".csv,text/csv,text/plain" style="position:absolute;width:1px;height:1px;opacity:0"></label><button class="btn small primary" data-a="previewcsv"' + busy + '>Preview changes</button></div>' +
        (S.csvMsg ? '<div class="err" role="alert">' + esc(S.csvMsg) + '</div>' : '') +
        (pv ? '<div class="soldnote" role="status" style="font-weight:400"><b>' + (pv.applied ? 'Member list updated.' : 'Preview, nothing changed yet.') + '</b><br>' + pv.valid_rows + ' members in the file' + (pv.skipped_rows ? ' (' + pv.skipped_rows + ' rows skipped: missing name or email)' : '') + '. ' + pv['new'] + ' new, ' + pv.restored + ' restored, ' + pv.renamed + ' renamed, ' + pv.removed + ' ' + (pv.applied ? 'removed' : 'would be removed') + '.' +
          (pv.removed ? '<br><span class="note">' + (pv.applied ? 'Removed' : 'Would lose access') + ': ' + esc(pv.removed_names.slice(0, 30).join(', ')) + (pv.removed_names.length > 30 ? ' and ' + (pv.removed_names.length - 30) + ' more' : '') + '</span>' : '') +
          (pv.applied ? '' : '<div class="erow" style="gap:8px;margin-top:10px"><button class="btn small primary" data-a="applycsv"' + busy + '>Apply these changes</button><button class="btn small" data-a="cancelcsv">Cancel</button></div>') + '</div>' : '') +
        '</div></div>';
    }
    return '<main><div class="wrap"><button class="back" data-a="home">' + ICON.back + 'Back to browsing</button>' +
      '<div class="page-h"><div><h1>Moderation</h1><p>Hide or remove listings and questions, and keep the member list current.</p></div></div>' +
      '<div class="mtabs seg" role="group" aria-label="Moderation views" style="display:inline-flex">' + [['reports', 'Reports (' + reportedIds.length + ')'], ['all', 'All listings'], ['members', 'Members']].map((o) => '<button aria-pressed="' + (t === o[0]) + '" data-a="modtab" data-t="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>' +
      body + '</div></main>';
  }

  function signinView() {
    const step = S.signStep, busy = S.busy ? ' disabled' : '';
    return '<div class="signin"><div class="wrap"><div class="sbox">' +
      '<div class="slogo"><img class="c" src="' + CREST + '" alt="Thornbury Bowls Club crest"><div><span class="sign">The Tram Depot</span><span class="sign-sub" style="font-size:14px">Thornbury Bowls Club Marketplace</span></div></div>' +
      '<div class="scard">' +
      (step === 'email'
        ? '<h1>Sign in with your email</h1><p>Use the email address the club has on file. We\'ll send you a 6-digit code. No password needed.</p>' +
          '<form class="stack" style="gap:10px" data-f="email" novalidate><label for="em" style="font-weight:700">Email</label><input type="email" id="em" autocomplete="email" inputmode="email" value="' + esc(S.signEmail) + '" placeholder="name@example.com">' + (S.signErr ? '<span class="err" role="alert">' + esc(S.signErr) + '</span>' : '') + '<button class="btn primary"' + busy + '>' + (S.busy ? 'Sending…' : 'Send code') + '</button></form>' +
          '<p class="note">For Thornbury Bowls Club members only. Not on the list, or changed your email? Contact <span class="sel">' + esc(CONTACT) + '</span>.</p>'
        : '<h1>Check your email</h1><p>We sent a code to <b style="color:var(--ink)">' + esc(S.signEmail) + '</b>. It works for 10 minutes. Check your junk folder if it hasn\'t arrived.</p>' +
          '<form class="stack" style="gap:10px" data-f="code" novalidate><label for="code" style="font-weight:700">6-digit code</label><input type="text" id="code" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="······">' + (S.signErr ? '<span class="err" role="alert">' + esc(S.signErr) + '</span>' : '') + '<button class="btn primary"' + busy + '>' + (S.busy ? 'Signing in…' : 'Sign in') + '</button></form>' +
          '<p class="note">You\'ll stay signed in on this device.</p>' +
          '<div class="erow"><button class="btn link" data-a="changeemail">Use a different email</button><button class="btn link" data-a="resend"' + busy + '>Send a new code</button></div>') +
      '</div><img class="scriptlogo" src="' + SCRIPT + '" alt="Thornbury Bowls Club"></div></div></div>';
  }

  function notMemberView() {
    return '<div class="signin"><div class="wrap"><div class="sbox">' +
      '<div class="slogo"><img class="c" src="' + CREST + '" alt="Thornbury Bowls Club crest"><div><span class="sign">The Tram Depot</span><span class="sign-sub" style="font-size:14px">Thornbury Bowls Club Marketplace</span></div></div>' +
      '<div class="scard"><h1>Your membership isn\'t active on the Depot</h1><p><b style="color:var(--ink)">' + esc(S.me.email) + '</b> isn\'t on the current member list. If you\'ve renewed or changed your email, contact <span class="sel">' + esc(CONTACT) + '</span> and they can update it.</p><button class="btn primary" data-a="signout">Sign out</button></div></div></div></div>';
  }

  function loadingView(msg) {
    return '<div class="signin"><div class="wrap"><div class="sbox" style="justify-items:center;text-align:center"><img src="' + CREST + '" alt="" style="width:84px"><span class="sign">The Tram Depot</span><p style="color:var(--on-navy-muted);margin:0">' + esc(msg || 'Loading the depot…') + '</p></div></div></div>';
  }

  function render() {
    const app = document.getElementById('app');
    if (S.booting) { app.innerHTML = loadingView(); return; }
    if (S.loadErr) { app.innerHTML = '<div class="signin"><div class="wrap"><div class="sbox"><div class="scard"><h1>The Depot couldn\'t load</h1><p>' + esc(S.loadErr) + '</p><button class="btn primary" data-a="reload">Try again</button></div></div></div></div>'; return; }
    if (!S.me) { app.innerHTML = signinView(); return; }
    if (!S.me.active) { app.innerHTML = notMemberView(); return; }
    const v = { browse: browseView, detail: detailView, choose: chooseView, form: formView, mine: mineView, mod: modView }[S.view] || browseView;
    const active = document.activeElement && document.activeElement.id;
    const pos = active && document.activeElement.selectionStart;
    app.innerHTML = header() + v();
    if (active && (active === 'q' || active === 'msearch')) {
      const el = document.getElementById(active);
      if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) { /* number inputs */ } }
    }
  }

  /* ---------- forms ---------- */
  function readForm() {
    const f = S.form; if (!f) return;
    const v = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
    const set = (k, id) => { const x = v(id); if (x !== null) f[k] = x; };
    set('title', 'f-title'); set('desc', 'f-desc'); set('category', 'f-cat'); set('price', 'f-price'); set('exp', 'f-exp');
    set('date', 'f-date'); set('time', 'f-time'); set('spots', 'f-spots'); set('where', 'f-where'); set('position', 'f-pos');
    const t = document.querySelector('input[name=type]:checked'); if (t) f.type = t.value;
    const p = document.querySelector('input[name=ptype]:checked'); if (p) f.priceType = p.value;
  }
  function validate() {
    const f = S.form, e = {};
    if (!f.title.trim()) e.title = 'Add a title so members know what it is.';
    if (f.section !== 'social' && !f.category) e.category = 'Choose a category.';
    if (f.section === 'market' && f.priceType === 'amount' && !(Number(f.price) > 0 && Number(f.price) < 100000)) e.price = 'Enter a dollar amount, or choose Free or Ask / offers.';
    if (f.section !== 'market') {
      if (!f.date) e.date = 'Add the event date.';
      else if (new Date(f.date + 'T23:59') < new Date()) e.date = 'Choose a date that hasn\'t passed yet.';
    }
    if (f.section === 'bowlers' && f.spots && !(Number(f.spots) >= 1 && Number(f.spots) <= 12)) e.spots = 'Enter a number from 1 to 12, or leave it blank.';
    if (!f.desc.trim()) e.desc = 'Add a short description.';
    return e;
  }
  function rowFromForm(f) {
    const row = { title: f.title.trim(), description: f.desc.trim(), category: f.section === 'social' ? 'social' : f.category };
    if (f.section === 'market') {
      Object.assign(row, { type: f.type, price_type: f.priceType, price: f.priceType === 'amount' ? Math.round(Number(f.price) * 100) / 100 : null });
    } else {
      Object.assign(row, {
        type: 'sale', price_type: null, price: null,
        event_at: new Date(f.date + 'T' + (f.time || '10:00')).toISOString(),
        spots: f.section === 'bowlers' && f.spots ? Number(f.spots) : null,
        position: f.section === 'bowlers' ? (f.position || 'Any') : null,
        location: f.section === 'social' ? (f.where.trim() || null) : null
      });
    }
    return row;
  }
  async function save() {
    const f = S.form;
    const row = rowFromForm(f);
    const files = f.photos.filter((p) => p.full);
    if (f.id) {
      if (f.section === 'market' && f.exp) {
        row.expires_at = endOfDayIn(Number(f.exp)).toISOString();
        if (f.status === 'sold') row.status = 'active';
      }
      await db.updateListing(f.id, row, {
        removePhotoIds: f.removed, files, memberId: S.me.id,
        keptPositions: f.photos.filter((p) => p.id).map((p) => p.position)
      });
      return f.id;
    }
    row.section = f.section;
    if (f.section === 'market') row.expires_at = endOfDayIn(Number(f.exp || 30)).toISOString();
    return await db.createListing(row, files, S.me.id);
  }

  /* photos: resized in the browser before upload (full ~1200px, thumbnail ~480px) */
  function loadImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => res({ im, url });
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That file couldn\'t be read as a photo.')); };
      im.src = url;
    });
  }
  function toJpeg(im, max, quality) {
    return new Promise((res) => {
      const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.naturalWidth * s)); c.height = Math.max(1, Math.round(im.naturalHeight * s));
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(im, 0, 0, c.width, c.height);
      c.toBlob((b) => res(b), 'image/jpeg', quality);
    });
  }
  async function preparePhoto(file) {
    const { im, url } = await loadImage(file);
    let full = await toJpeg(im, 1200, 0.8);
    if (full && full.size > 900 * 1024) full = await toJpeg(im, 1000, 0.65);
    const thumb = await toJpeg(im, 480, 0.75);
    if (!full || !thumb) throw new Error('That photo couldn\'t be prepared. Try a different one.');
    return { src: url, full, thumb };
  }

  function parseCsv(text) {
    const rows = [];
    text.split(/\r?\n/).forEach((line) => {
      if (!line.trim()) return;
      const cells = []; let cur = '', q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
        else if (ch === '"') q = true; else if (ch === ',' || ch === ';' || ch === '\t') { cells.push(cur.trim()); cur = ''; } else cur += ch;
      }
      cells.push(cur.trim());
      const ei = cells.findIndex((c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c));
      if (ei < 0) return;
      const name = cells.filter((c, i) => i !== ei && c && !/@/.test(c)).join(' ').replace(/\s+/g, ' ').trim();
      rows.push({ name, email: cells[ei].toLowerCase() });
    });
    return rows;
  }

  /* ---------- events ---------- */
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, id = b.dataset.id, l = id && listingById(id);
    switch (a) {
      case 'home': nav('#' + S.tab); break;
      case 'nav': nav(b.dataset.h); break;
      case 'reload': location.reload(); break;
      case 'type': S.filters.market.type = b.dataset.t; render(); break;
      case 'cat': S.filters[S.tab].cat = b.dataset.c; render(); break;
      case 'open': nav('#listing-' + id); break;
      case 'photo': S.photoIdx = Number(b.dataset.i); render(); break;
      case 'pick': S.form = newForm(b.dataset.s); nav('#post'); break;
      case 'backdetail': S.form ? nav('#listing-' + S.form.id) : nav('#mine'); break;
      case 'rmphoto': { readForm(); const p = S.form.photos.splice(Number(b.dataset.i), 1)[0]; if (p && p.id) S.form.removed.push(p.id); if (p && p.src) URL.revokeObjectURL(p.src); render(); break; }
      case 'sold': act(() => db.setListing(id, { status: 'sold' }), (l && l.type === 'wanted' ? 'Marked as found.' : 'Marked as sold.') + ' It shows that way for ' + SOLD_DAYS + ' days, then comes down.'); break;
      case 'askdel': S.confirm = { id }; S.extend = null; render(); break;
      case 'nodel': S.confirm = null; render(); break;
      case 'del': {
        const wasDetail = S.view === 'detail', other = l && !mine(l);
        await act(async () => { await db.deleteListing(id); S.confirm = null; }, 'Listing deleted');
        if (wasDetail && !listingById(id)) nav(other && isMod() ? '#mod' : '#mine');
        break;
      }
      case 'extend': S.extend = id; S.confirm = null; render(); break;
      case 'noextend': S.extend = null; render(); break;
      case 'doextend': {
        const n = Number(document.getElementById('ext-sel').value);
        const until = endOfDayIn(n);
        act(async () => { await db.setListing(id, Object.assign({ expires_at: until.toISOString() }, l && l.status === 'sold' ? { status: 'active' } : {})); S.extend = null; }, 'Now showing until ' + fd(until));
        break;
      }
      case 'hide': { const hid = l.status === 'hidden'; act(() => db.setListing(id, { status: hid ? 'active' : 'hidden' }), hid ? 'Listing restored' : 'Listing hidden from members'); break; }
      case 'hideq': { const h = b.dataset.h === '1'; act(() => db.hideQuestion(id, h), h ? 'Question hidden' : 'Question shown'); break; }
      case 'dismiss': act(() => db.dismissReports(id), 'Report dismissed'); break;
      case 'report': S.reporting = S.detail; render(); { const r = document.getElementById('rep'); if (r) r.focus(); } break;
      case 'noreport': S.reporting = null; render(); break;
      case 'modtab': S.modTab = b.dataset.t; S.confirm = null; render(); break;
      case 'askrmmember': S.rmConfirm = id; render(); break;
      case 'normmember': S.rmConfirm = null; render(); break;
      case 'rmmember': { const m = S.members.find((x) => x.id === id); act(async () => { await db.updateMember(id, { active: false }); S.rmConfirm = null; }, m.name + ' removed. They can no longer sign in.'); break; }
      case 'restoremember': { const m = S.members.find((x) => x.id === id); act(() => db.updateMember(id, { active: true }), m.name + ' can sign in again'); break; }
      case 'previewcsv': {
        S.csv = document.getElementById('csv').value; S.csvPreview = null;
        const rows = parseCsv(S.csv);
        if (!rows.length) { S.csvMsg = 'No members found. Each line needs a name and an email address.'; render(); break; }
        S.csvMsg = ''; S.csvRows = rows;
        act(async () => { S.csvPreview = await db.importMembers(rows, false); });
        break;
      }
      case 'applycsv': act(async () => { S.csvPreview = await db.importMembers(S.csvRows, true); S.csv = ''; }, 'Member list updated'); break;
      case 'cancelcsv': S.csvPreview = null; render(); break;
      case 'changeemail': S.signStep = 'email'; S.signErr = ''; render(); break;
      case 'resend':
        S.busy = true; S.signErr = ''; render();
        try { await db.sendCode(S.signEmail); toast('New code sent'); } catch (err) { S.signErr = err.message; }
        S.busy = false; render(); break;
      case 'signout': await db.signOut(); signedOut(); break;
    }
  });

  document.addEventListener('submit', async (e) => {
    const f = e.target.closest('form[data-f]'); if (!f) return;
    e.preventDefault();
    if (S.busy) return;
    const k = f.dataset.f;
    if (k === 'email') {
      const em = document.getElementById('em').value.trim().toLowerCase();
      S.signEmail = em;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { S.signErr = 'Enter your full email address.'; render(); return; }
      try { localStorage.setItem('depot-email', em); } catch (err) { /* private mode */ }
      S.busy = true; S.signErr = ''; render();
      try { await db.sendCode(em); S.signStep = 'code'; } catch (err) { S.signErr = err.message; }
      S.busy = false; render();
      const next = document.getElementById(S.signStep === 'code' ? 'code' : 'em'); if (next) next.focus();
      return;
    }
    if (k === 'code') {
      const c = document.getElementById('code').value.replace(/\D/g, '');
      if (c.length !== 6) { S.signErr = 'Enter the 6 digits from the email.'; render(); return; }
      S.busy = true; S.signErr = ''; render();
      try { await db.verifyCode(S.signEmail, c); S.busy = false; await signedIn(); }
      catch (err) { S.busy = false; S.signErr = err.message; render(); }
      return;
    }
    if (k === 'ask') {
      const t = document.getElementById('askq').value.trim();
      if (!t) { S.errs = { ask: 'Type a question first.' }; render(); return; }
      S.errs = {};
      const l = listingById(S.detail);
      act(() => db.ask(S.detail, t), l.sellerName + ' will get an email about your question');
      return;
    }
    if (k === 'answer') {
      const t = document.getElementById('ans-' + f.dataset.q).value.trim();
      if (!t) return;
      await act(() => db.answer(f.dataset.q, t));
      const left = toAnswer().length;
      toast(left ? 'Answer posted. ' + left + ' still to answer.' : 'Answer posted. You\'re all caught up.');
      return;
    }
    if (k === 'report') {
      const t = document.getElementById('rep').value.trim() || 'No reason given';
      const id = S.detail;
      act(async () => { await db.report(id, t); S.reporting = null; S.reported = id; });
      return;
    }
    if (k === 'addmember') {
      const name = document.getElementById('nm-name').value.trim(), email = document.getElementById('nm-email').value.trim().toLowerCase();
      S.nm = { name, email };
      const ex = S.members.find((m) => m.email === email);
      if (!name) S.nmErr = 'Enter the member\'s name.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) S.nmErr = 'Enter a full email address.';
      else if (ex && ex.active) S.nmErr = 'That email is already on the list (' + ex.name + ').';
      else {
        S.nmErr = '';
        await act(async () => { if (ex) await db.updateMember(ex.id, { active: true, name }); else await db.addMember(name, email); S.nm = { name: '', email: '' }; }, name + ' added. They can sign in now.');
        return;
      }
      render(); return;
    }
    if (k === 'post') {
      readForm();
      S.errs = validate();
      if (Object.keys(S.errs).length) {
        render();
        const first = document.querySelector('.err'); if (first) first.scrollIntoView({ block: 'center' });
        return;
      }
      const editing = !!S.form.id;
      S.busy = true; render();
      try {
        const id = await save();
        S.busy = false;
        await refresh();
        S.form = null;
        nav('#listing-' + id);
        toast(editing ? 'Changes saved' : 'Your listing is up', !editing);
      } catch (err) { S.busy = false; render(); fail(err); }
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'q') { S.q = e.target.value; render(); }
    if (e.target.id === 'msearch') { S.ms = e.target.value; render(); }
  });

  document.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.id === 'sort') { S.sort[S.tab] = t.value; try { localStorage.setItem('depot-sort', JSON.stringify(S.sort)); } catch (err) { /* ignore */ } render(); }
    if (t.name === 'type' || t.name === 'ptype') { readForm(); render(); }
    if (t.id === 'f-photo') {
      readForm();
      const files = Array.from(t.files || []).slice(0, 4 - S.form.photos.length);
      S.photoBusy = true; render();
      for (const file of files) {
        try { S.form.photos.push(await preparePhoto(file)); } catch (err) { toast(err.message, false, true); }
      }
      S.photoBusy = false; render();
    }
    if (t.id === 'csvfile' && t.files[0]) {
      const r = new FileReader();
      r.onload = () => { S.csv = String(r.result); S.csvMsg = ''; S.csvPreview = null; render(); };
      r.readAsText(t.files[0]);
    }
  });

  /* ---------- sign-in lifecycle ---------- */
  async function signedIn() {
    S.booting = true; render();
    try {
      S.me = await db.me();
      if (S.me && S.me.active) {
        await refresh();
        if (isMod()) { try { await loadModData(); } catch (e) { console.warn(e); } }
      }
      S.loadErr = '';
    } catch (e) {
      console.error(e);
      S.loadErr = e.message || 'Something went wrong.';
    }
    S.booting = false;
    S.signStep = 'email'; S.signErr = '';
    if (S.me && S.me.active) await route(); else render();
  }
  function signedOut() {
    Object.assign(S, { me: null, listings: [], urls: {}, members: [], reports: [], view: 'signin', signStep: 'email', signErr: '', form: null, busy: false, loadErr: '' });
    render();
    window.scrollTo(0, 0);
  }

  async function boot() {
    render();
    try {
      db.onAuth((event) => { if (event === 'SIGNED_OUT' && S.me) signedOut(); });
      const s = await db.session();
      if (s) { await signedIn(); return; }
    } catch (e) { console.warn(e); }
    S.booting = false; render();
  }
  boot();
})();
