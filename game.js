/* Yeşil Saha — ekranlar, kayıt, ses. */
(function () {
  'use strict';

  const L = window.YSLogic;
  const I18N = window.YSI18n;
  const Crests = window.YSCrests;
  const Cloud = window.YSCloud;
  const SAVE_KEY = 'yesil-saha-kayit-v1';
  const SET_KEY = 'yesil-saha-ayar-v1';

  let state = null;
  let view = 'menu';
  let backStack = ['menu'];
  let settings = loadSettings();
  let createPos = 'forvet';
  let draftName = '';
  let confirmWipe = false;
  let askTired = false;
  let askRetire = false;
  let matchView = null;

  const Sfx = {
    ctx: null,
    ensure: function () {
      if (!settings.sound) return null;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) {
        try { this.ctx = new AC(); } catch (e) { return null; }
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(function () {});
      return this.ctx;
    },
    env: function (freq, dur, type, gain, delay, rampTo) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (rampTo) o.frequency.exponentialRampToValueAtTime(Math.max(48, rampTo), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.06, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise: function (dur, gain) {
      const ctx = this.ensure();
      if (!ctx) return;
      const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 780;
      const g = ctx.createGain();
      g.gain.value = gain || 0.12;
      src.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      src.start();
    },
    kick: function () { this.noise(0.07, 0.16); this.env(190, 0.08, 'triangle', 0.05, 0, 70); },
    goal: function () {
      this.noise(0.18, 0.08);
      this.env(392, 0.12, 'triangle', 0.05, 0);
      this.env(523, 0.12, 'triangle', 0.07, 0.08);
      this.env(659, 0.14, 'triangle', 0.07, 0.16);
      this.env(784, 0.22, 'triangle', 0.08, 0.26);
      this.env(1046, 0.18, 'sine', 0.04, 0.34);
    },
    crowd: function () { this.noise(0.22, 0.1); this.env(180, 0.2, 'sawtooth', 0.02, 0, 90); },
    cheer: function () { this.goal(); this.env(988, 0.16, 'sine', 0.035, 0.26); },
    save: function () { this.noise(0.09, 0.1); this.env(150, 0.1, 'sine', 0.04, 0, 80); },
    miss: function () { this.env(210, 0.13, 'sine', 0.035, 0, 90); },
    pass: function () { this.env(680, 0.05, 'sine', 0.035, 0); this.env(880, 0.06, 'sine', 0.028, 0.045); },
    whistle: function () { this.env(1320, 0.16, 'sine', 0.03, 0); this.env(1560, 0.1, 'sine', 0.02, 0.1); },
    ui: function () { this.env(720, 0.045, 'sine', 0.028, 0); },
  };

  function t(key, vars) { return I18N ? I18N.t(key, vars) : key; }
  function say(text) { return I18N && I18N.say ? I18N.say(text) : text; }
  function cname(club) { return I18N ? I18N.clubName(club) : (club ? club.name : ''); }
  function cshort(club) { return I18N ? I18N.clubShort(club) : (club ? club.short : ''); }
  function iname(item) { return I18N && item ? I18N.itemName(item) : (item ? item.name : ''); }
  function iblurb(item) { return I18N && item ? I18N.itemBlurb(item) : (item ? item.blurb : ''); }

  function registerNames() {
    if (!I18N || !I18N.addNames || registerNames.done) return;
    const rows = [];
    (L.CLUBS || []).concat(L.FOREIGN || []).forEach(function (c) {
      rows.push({ tr: c.name, en: c.nameEn || c.name });
      rows.push({ tr: c.short, en: c.shortEn || c.short });
    });
    const prev = I18N.getLang();
    I18N.setLang('en');
    (L.BOOTS || []).concat(L.LIFE || []).concat(L.GIFTS || []).concat(L.SPONSORS || []).forEach(function (item) {
      rows.push({ tr: item.name, en: I18N.itemName(item) });
    });
    ['Yıldız Lig', 'Anadolu Lig', 'Bölgesel Lig', 'Amatör Kademe'].forEach(function (name, i) {
      rows.push({ tr: name, en: I18N.t('tier.' + (i + 1)) });
    });
    I18N.setLang(prev);
    I18N.addNames(rows);
    registerNames.done = true;
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SET_KEY);
      if (!raw) return { sound: true, vibrate: true, lang: 'tr' };
      const parsed = JSON.parse(raw);
      return {
        sound: !parsed || parsed.sound !== false,
        vibrate: !parsed || parsed.vibrate !== false,
        lang: parsed && parsed.lang === 'en' ? 'en' : 'tr',
      };
    } catch (e) {
      return { sound: true, vibrate: true, lang: 'tr' };
    }
  }

  function saveSettings() {
    try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.v !== 1 || !data.player || !data.player.base || !data.clubId) return null;
      if (!L.clubById(data.clubId)) return null;
      if (!Array.isArray(data.rounds) || !data.rounds.length) return null;
      return L.migrate ? L.migrate(data) : data;
    } catch (e) {
      return null;
    }
  }

  function save() {
    if (!state) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
    catch (e) { toast('Kayıt yazılamadı. Depolama dolu olabilir.'); }
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function clearToasts() {
    const root = document.getElementById('toasts');
    if (root) while (root.firstChild) root.removeChild(root.firstChild);
  }

  function toast(message) {
    const root = document.getElementById('toasts');
    if (!root || !message) return;
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = say(message);
    while (root.firstChild) root.removeChild(root.firstChild);
    root.appendChild(node);
    setTimeout(function () { if (node.parentNode) node.remove(); }, 1600);
  }

  function comma(n) {
    return String(n).replace('.', ',');
  }

  function signed(n) {
    const v = Math.round(n);
    if (v > 0) return '+' + v;
    return String(v).replace('-', '−');
  }

  function posLabel(pos) { return t(pos === 'ortasaha' ? 'pos.mid' : 'pos.fwd'); }
  function attrLabel(key) { return t('attr.' + key); }
  function tierLabel(tier) { return t('tier.' + tier); }
  function moodLabel(n) {
    if (n >= 80) return t('mood.great');
    if (n >= 60) return t('mood.good');
    if (n >= 40) return t('mood.ok');
    if (n >= 25) return t('mood.hurt');
    return t('mood.bad');
  }

  function bar(pct, cls) {
    const w = L.clamp(Math.round(pct), 0, 100);
    return '<div class="bar ' + (cls || '') + '"><span style="width:' + w + '%"></span></div>';
  }

  function crest(club) {
    if (Crests) return Crests.html(club, 48);
    const letter = club && club.name ? club.name.slice(0, 1) : '?';
    const color = club && club.color ? club.color : '#147a34';
    return '<span class="crest" style="background:' + color + '">' + esc(letter) + '</span>';
  }

  function topbar(title) {
    return '<header class="topbar">' +
      '<button type="button" class="iconbtn" data-act="back" aria-label="' + esc(t('common.back')) + '">←</button>' +
      '<h1>' + esc(title) + '</h1>' +
      '<button type="button" class="iconbtn" data-act="settings" aria-label="' + esc(t('menu.settings')) + '">⚙</button>' +
      '</header>';
  }

  function renderTable(rows, userId, tier) {
    const head = '<div class="tr head"><span>#</span><span>' + esc(t('table.team')) + '</span><span>O</span><span>G</span><span>B</span><span>M</span><span>Av</span><span>P</span></div>';
    const body = rows.map(function (row, index) {
      const club = L.clubById(row.id);
      const name = club ? cshort(club) : t('table.team');
      let zone = '';
      if (tier > 1 && index < 2) zone = 'up';
      if (tier < 4 && index >= rows.length - 2) zone = 'down';
      const me = row.id === userId ? ' me' : '';
      const gd = row.gd != null ? row.gd : row.gf - row.ga;
      const pts = row.pts != null ? row.pts : row.w * 3 + row.d;
      const gdTxt = (gd > 0 ? '+' : '') + gd;
      return '<div class="tr ' + zone + me + '"><span>' + (index + 1) + '</span><span class="tname">' +
        crest(club) + esc(name) + '</span><span>' + row.p + '</span><span>' + row.w + '</span><span>' + row.d +
        '</span><span>' + row.l + '</span><span>' + gdTxt + '</span><span class="pts">' + pts + '</span></div>';
    }).join('');
    let note = t('table.noteBoth');
    if (tier <= 1) note = t('table.noteTop');
    else if (tier >= 4) note = t('table.noteBot');
    return '<div class="table">' + head + body + '</div><p class="fine">' + note + '</p>';
  }

  function formPips(form) {
    if (!form || !form.length) return '<span class="muted">' + esc(t('hub.noForm')) + '</span>';
    return form.map(function (rating) {
      const cls = rating >= 7.5 ? 'hot' : rating >= 6 ? 'ok' : 'cold';
      return '<span class="pip ' + cls + '">' + comma(rating) + '</span>';
    }).join('');
  }

  function pageMenu() {
    const saved = loadState();
    let chip = '';
    if (saved) {
      const club = L.clubById(saved.clubId);
      chip = '<div class="save-chip">' + crest(club) + '<div><span>' + esc(t('menu.saved')) + '</span><strong>' + esc(saved.player.name) +
        '</strong><span>' + esc(t('common.age', { n: saved.player.age })) + ' · ' + esc(cname(club)) + '</span></div></div>';
    }
    return '<div class="page menu-page">' +
      '<div class="hero">' +
      '<svg class="logo-ball" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" fill="#f6f3ea" stroke="#102018" stroke-width="3"/>' +
      '<path fill="#102018" d="M40 26l13.3 9.7-5.1 15.6H31.8l-5.1-15.6z"/></svg>' +
      '<p class="eyebrow">' + esc(t('menu.kicker')) + '</p>' +
      '<h1 class="logo">Yeşil Saha</h1>' +
      '<p class="lede">' + esc(t('menu.lede')) + '</p>' +
      '</div>' + chip +
      '<div class="stack">' +
      '<button type="button" class="' + (saved ? 'btn gold' : 'btn ghost') + '" data-act="continue"' + (saved ? '' : ' disabled') + '>' + esc(t('menu.continue')) + '</button>' +
      '<button type="button" class="' + (saved ? 'btn' : 'btn gold') + '" data-act="new">' + esc(t('menu.new')) + '</button>' +
      '<button type="button" class="btn ghost" data-act="stats">' + esc(t('menu.stats')) + '</button>' +
      '<button type="button" class="btn ghost" data-act="help">' + esc(t('menu.help')) + '</button>' +
      '<button type="button" class="btn ghost" data-act="settings">' + esc(t('menu.settings')) + '</button>' +
      '</div>' +
      '<p class="fine">' + esc(t('menu.fine')) + '</p>' +
      '<div class="pitch-footer" aria-hidden="true"></div></div>';
  }

  function pageCreate() {
    const blurb = createPos === 'ortasaha' ? t('create.mid') : t('create.fwd');
    const sheet = confirmWipe
      ? '<div class="sheet-back"><div class="sheet"><h3>' + esc(t('create.wipeTitle')) + '</h3><p>' + esc(t('create.wipeBody')) + '</p>' +
        '<button type="button" class="btn gold" data-act="confirm-start">' + esc(t('create.wipeYes')) + '</button>' +
        '<button type="button" class="btn ghost" data-act="cancel-wipe">' + esc(t('common.cancel')) + '</button></div></div>'
      : '';
    return '<div class="page">' + topbar(t('create.title')) +
      '<form id="create-form" class="stack">' +
      '<label class="field" for="isim">' + esc(t('create.name')) + '</label>' +
      '<input id="isim" maxlength="16" placeholder="' + esc(t('create.ph')) + '" autocomplete="name" autocapitalize="words" enterkeyhint="done">' +
      '<p class="field">' + esc(t('create.pos')) + '</p>' +
      '<div class="seg">' +
      '<button type="button" data-act="pos" data-pos="forvet" class="' + (createPos === 'forvet' ? 'on' : '') + '">' + esc(t('pos.fwd')) + '</button>' +
      '<button type="button" data-act="pos" data-pos="ortasaha" class="' + (createPos === 'ortasaha' ? 'on' : '') + '">' + esc(t('pos.mid')) + '</button>' +
      '</div>' +
      '<p class="helptext">' + esc(blurb) + '</p>' +
      '<ul class="facts"><li>' + esc(t('create.age')) + '</li><li>' + esc(t('create.club')) + '</li><li>' + esc(t('create.attrs')) + '</li></ul>' +
      '<button type="submit" class="btn gold">' + esc(t('create.go')) + '</button>' +
      '</form>' + sheet + '</div>';
  }

  function statBlock(saved) {
    if (!saved) {
      return '<div class="card empty"><h2>' + esc(t('stats.emptyTitle')) + '</h2><p>' + esc(t('stats.emptyBody')) + '</p>' +
        '<button type="button" class="btn" data-act="new">' + esc(t('menu.new')) + '</button></div>';
    }
    const h = saved.history || {};
    const club = L.clubById(saved.clubId);
    const rows = [
      [t('common.matches'), h.matches || 0],
      [t('common.goals'), h.goals || 0],
      [t('common.assists'), h.assists || 0],
      [t('common.wins'), h.wins || 0],
      [t('stats.seasons'), h.seasons || 0],
      [t('stats.titles'), h.titles || 0],
      [t('stats.promos'), h.promotions || 0],
      [t('stats.transfers'), h.transfers || 0],
      [t('stats.best'), h.bestRating ? comma(h.bestRating) : '–'],
      [t('stats.earn'), L.formatMoney(h.earnings || 0)],
    ];
    const grid = rows.map(function (row) {
      return '<div class="stat"><b>' + esc(String(row[1])) + '</b><span>' + esc(row[0]) + '</span></div>';
    }).join('');
    const history = (saved.clubHistory || []).map(function (item) {
      const c = L.clubById(item.clubId);
      return '<li>' + esc(t('stats.line', { s: item.season, club: c ? cname(c) : t('talk.none'), tier: tierLabel(item.tier) })) + '</li>';
    }).join('');
    return '<div class="card idcard">' + crest(club) + '<div><h2>' + esc(saved.player.name) + '</h2><p>' +
      esc(t('common.age', { n: saved.player.age })) + ' · ' + posLabel(saved.player.pos) + '<br>' + esc(cname(club)) + ' · ' +
      esc(tierLabel(saved.tier)) + '</p></div></div>' +
      '<div class="statgrid">' + grid + '</div>' +
      (history ? '<h3 class="section">' + esc(t('stats.history')) + '</h3><ul class="history">' + history + '</ul>' : '') +
      (saved.retired ? '<p class="helptext">' + esc(t('stats.closed')) + '</p>' : '');
  }

  function pageStats() {
    const saved = state || loadState();
    return '<div class="page">' + topbar(t('stats.title')) + statBlock(saved) + '</div>';
  }

  function pageHelp() {
    const steps = [
      [t('help.week'), t('help.weekBody')],
      [t('help.shot'), t('help.shotBody')],
      [t('help.pass'), t('help.passBody')],
      [t('help.career'), t('help.careerBody')],
      [t('help.money'), t('help.moneyBody')],
    ];
    const list = steps.map(function (step) {
      return '<article class="card"><h3>' + step[0] + '</h3><p>' + step[1] + '</p></article>';
    }).join('');
    return '<div class="page">' + topbar(t('help.title')) + list + '</div>';
  }

  function pageHub() {
    const club = L.clubById(state.clubId);
    const fix = L.userFixture(state);
    const opp = fix && fix.opp;
    const pen = L.energyPenalty(state);
    const trained = L.trainedAttrs(state);
    const avg = Math.round((trained.hiz + trained.guc + trained.teknik + trained.vizyon + trained.frikik) / 5);
    const threat = opp ? L.threatLabel(L.userStrength(state), opp.strength) : '';
    let inbox = '';
    if (state.inboxOffer) {
      const offerClub = L.clubById(state.inboxOffer.clubId);
      inbox = '<div class="sheet-back"><div class="sheet"><p class="eyebrow">' + esc(t('hub.offer')) + '</p><h3>' +
        crest(offerClub) + esc(cname(offerClub) || t('table.team')) + '</h3><p>' + esc(tierLabel(state.inboxOffer.tier)) +
        ' · ' + esc(t('hub.offerWeek', { n: L.formatMoney(state.inboxOffer.wage) })) + '</p><p>' + esc(t('hub.offerAsk')) + '</p>' +
        '<button type="button" class="btn gold" data-act="inbox-now">' + esc(t('hub.joinNow')) + '</button>' +
        '<button type="button" class="btn" data-act="inbox-later">' + esc(t('hub.joinLater')) + '</button>' +
        '<button type="button" class="btn ghost" data-act="inbox-no">' + esc(t('hub.stay')) + '</button></div></div>';
    }
    const tired = !inbox && askTired
      ? '<div class="sheet-back"><div class="sheet"><h3>' + esc(t('hub.tiredTitle')) + '</h3><p>' + esc(t('hub.tiredBody', { n: pen })) +
        '</p><button type="button" class="btn" data-act="rest">' + esc(t('common.rest')) + '</button>' +
        '<button type="button" class="btn gold" data-act="match-force">' + esc(t('hub.playAnyway')) + '</button>' +
        '<button type="button" class="btn ghost" data-act="close-tired">' + esc(t('common.cancel')) + '</button></div></div>'
      : '';
    return '<div class="page hub">' +
      '<div class="hub-scroll">' +
      '<header class="hub-top"><div><p class="eyebrow">' + esc(t('common.season')) + ' ' + state.season + ' · ' + esc(t('common.week')) + ' ' + state.week + '/' + state.rounds.length +
      '</p><h1>' + esc(state.player.name) + '</h1><p class="sub">' + esc(t('common.age', { n: state.player.age })) + ' · ' + posLabel(state.player.pos) +
      ' · ' + L.shirtNumber(state.player.name) + '</p></div>' +
      '<button type="button" class="iconbtn" data-act="settings" aria-label="' + esc(t('menu.settings')) + '">⚙</button></header>' +
      '<div class="club-row">' + crest(club) + '<div class="grow"><strong>' + esc(cname(club)) + '</strong><span>' +
      esc(tierLabel(state.tier)) + '</span></div><div class="money"><b>' + L.formatMoney(state.player.money) +
      '</b><small>' + esc(t('hub.wage', { n: L.formatMoney(state.wage) })) + '</small></div></div>' +
      '<div class="card energy-card"><div class="rel-top"><span>' + esc(t('common.energy')) + '</span><b>' + state.player.energy + '</b></div>' +
      bar(state.player.energy, pen >= 8 ? 'bad' : pen > 0 ? 'mid' : 'good') +
      (pen > 0 ? '<p class="warn">' + esc(t('hub.tired', { n: pen })) + '</p>' : '<p class="fine">' + esc(t('hub.avg', { n: avg })) + '</p>') +
      '</div>' +
      '<div class="pips">' + formPips(state.form) + '</div>' +
      '<p class="helptext">' + esc(say(L.formComment(state.form))) + ' ' + esc(t('hub.seasonLine', { g: state.seasonGoals, a: state.seasonAssists })) + '</p>' +
      (state.news && state.news[0] ? '<p class="news">' + esc(say(state.news[0])) + '</p>' : '') +
      '<article class="fixture">' + crest(opp) +
      '<p class="eyebrow">' + esc(fix && fix.home ? t('common.home') : t('common.away')) + (threat ? ' · ' + esc(say(threat)) : '') + '</p>' +
      '<h2>' + esc(cname(opp) || t('match.title')) + '</h2>' +
      '<p>' + esc(opp ? tierLabel(opp.tier) : '') + '</p></article>' +
      '<div class="action-grid">' +
      '<button type="button" class="btn" data-act="train-open">' + esc(t('hub.train')) + '</button>' +
      '<button type="button" class="btn" data-act="rest">' + esc(t('common.rest')) + '</button>' +
      '<button type="button" class="btn" data-act="drink">' + esc(t('hub.drink', { n: state.player.drinks })) + '</button>' +
      '</div>' +
      '<div class="action-grid">' +
      '<button type="button" class="btn ghost" data-act="life">' + esc(t('hub.life')) + '</button>' +
      '<button type="button" class="btn ghost" data-act="casino">' + esc(t('hub.casino')) + '</button>' +
      '<button type="button" class="btn ghost" data-act="cabinet">' + esc(t('hub.cabinet')) + '</button>' +
      (state.cup && state.cup.alive && state.cup.playedWeek !== state.week ? '<button type="button" class="btn ghost" data-act="cup">' + esc(t('hub.cup')) + '</button>' : '') +
      (state.europe && state.europe.alive && state.europe.playedWeek !== state.week ? '<button type="button" class="btn ghost" data-act="europe">' + esc(t('hub.europe')) + '</button>' : '') +
      (state.milliInvite ? '<button type="button" class="btn ghost" data-act="milli-open">' + esc(t('hub.milli')) + '</button>' : '') +
      '</div>' +
      (state.player.injured ? '<p class="warn">' + esc(t('hub.injured', { n: state.player.injured })) + '</p>' : '') +
      '</div>' +
      (state.player.injured
        ? '<button type="button" class="btn gold big" data-act="miss">' + esc(t('hub.miss')) + '</button>'
        : '<button type="button" class="btn gold big" data-act="match">' + esc(t('hub.play')) + '</button>') +
      '<nav class="bottom-nav">' +
      '<button type="button" data-act="table">' + esc(t('hub.league')) + '</button>' +
      '<button type="button" data-act="profile">' + esc(t('hub.profile')) + '</button>' +
      '<button type="button" data-act="shop">' + esc(t('hub.shop')) + '</button>' +
      '</nav>' + inbox + tired + '</div>';
  }

  function pageTrain() {
    const trained = L.trainedAttrs(state);
    const rows = L.ATTRS.map(function (key) {
      const base = state.player.base[key];
      const extra = trained[key] - base;
      const disabled = state.player.energy < L.TRAIN_COST || base >= 99;
      return '<div class="attr"><div class="grow"><b>' + esc(attrLabel(key)) + '</b><small>' + esc(t('train.base', { n: base })) +
        (extra > 0 ? esc(t('train.extra', { n: extra })) : '') + '</small>' + bar(trained[key], 'good') + '</div>' +
        '<button type="button" class="btn tiny" data-act="train" data-attr="' + key + '"' + (disabled ? ' disabled' : '') + '>' + esc(t('train.work')) + '</button></div>';
    }).join('');
    return '<div class="page">' + topbar(t('train.title')) +
      '<div class="card energy-card"><div class="rel-top"><span>' + esc(t('common.energy')) + '</span><b>' + state.player.energy + '</b></div>' +
      bar(state.player.energy, state.player.energy < L.TRAIN_COST ? 'bad' : 'good') +
      '<p class="fine">' + esc(t('train.note', { n: L.TRAIN_COST })) + '</p></div>' +
      rows +
      '<button type="button" class="btn" data-act="rest">' + esc(t('common.rest')) + '</button>' +
      '</div>';
  }

  function pageShop() {
    const boots = L.BOOTS.map(function (item) {
      const on = state.player.boots === item.id;
      return '<article class="shop"><div><h3>' + esc(iname(item)) + '</h3><p>' + esc(iblurb(item)) + '</p></div><button type="button" class="btn tiny" data-act="buy" data-item="' + item.id + '"' +
        (on ? ' disabled' : '') + '>' + (on ? esc(t('shop.worn')) : L.formatMoney(item.price)) + '</button></article>';
    }).join('');
    const life = L.LIFE.map(function (item) {
      const owned = state.player.ownedLife.indexOf(item.id) >= 0;
      return '<article class="shop"><div><h3>' + esc(iname(item)) + '</h3><p>' + esc(iblurb(item)) + '</p><p class="fine">' + esc(t('shop.lifePlus', { n: item.score })) +
        '</p></div><button type="button" class="btn tiny" data-act="buy" data-item="' + item.id + '"' +
        (owned ? ' disabled' : '') + '>' + (owned ? esc(t('shop.owned')) : L.formatMoney(item.price)) + '</button></article>';
    }).join('');
    return '<div class="page">' + topbar(t('shop.title')) +
      '<div class="club-row"><div class="grow"><strong>' + L.formatMoney(state.player.money) + '</strong><span>' + esc(t('shop.bag', { n: state.player.drinks })) +
      '</span></div>' +
      '<button type="button" class="btn tiny" data-act="drink">' + esc(t('shop.sip')) + '</button></div>' +
      '<h3 class="section">' + esc(t('shop.energy')) + '</h3>' +
      '<article class="shop"><div><h3>' + esc(t('shop.drink')) + '</h3><p>' + esc(t('shop.drinkBody', { n: L.DRINK_GAIN })) + '</p></div>' +
      '<div class="stack tight">' +
      '<button type="button" class="btn tiny" data-act="buy" data-item="icecek" data-qty="1">' + L.formatMoney(L.DRINK_PRICE) + '</button>' +
      '<button type="button" class="btn tiny" data-act="buy" data-item="icecek" data-qty="3">' + esc(t('shop.pack', { n: L.formatMoney(L.DRINK_PACK) })) + '</button>' +
      '</div></article>' +
      '<h3 class="section">' + esc(t('shop.boots')) + '</h3><p class="fine">' + esc(t('shop.bootsNote')) + '</p>' + boots +
      '<h3 class="section">' + esc(t('shop.life')) + '</h3>' + life + '</div>';
  }

  function pageTable() {
    const rows = L.tableSorted(state);
    const items = state.rounds.map(function (round, index) {
      const pair = round.find(function (p) { return p[0] === state.clubId || p[1] === state.clubId; });
      if (!pair) return '';
      const home = pair[0] === state.clubId;
      const opp = L.clubById(home ? pair[1] : pair[0]);
      let tag = t('table.queued');
      if (state.phase === 'season' || index < state.week - 1) tag = t('table.played');
      else if (index === state.week - 1) tag = t('table.this');
      return '<li>' + crest(opp) + '<span>H' + (index + 1) + ' · ' + esc(home ? t('table.home') : t('table.away')) + '</span><b>' +
        esc(cshort(opp)) + '</b><em>' + esc(tag) + '</em></li>';
    }).join('');
    return '<div class="page">' + topbar(t('hub.league')) +
      '<p class="eyebrow">' + esc(tierLabel(state.tier)) + ' · ' + esc(t('common.season')) + ' ' + state.season + '</p>' +
      renderTable(rows, state.clubId, state.tier) +
      '<h3 class="section">' + esc(t('table.fixtures')) + '</h3><ul class="fixtures">' + items + '</ul></div>';
  }

  function pageProfile() {
    const trained = L.trainedAttrs(state);
    const attrs = L.ATTRS.map(function (key) {
      return '<div class="rel"><div class="rel-top"><span>' + esc(attrLabel(key)) + '</span><b>' + trained[key] + '</b></div>' +
        bar(trained[key], 'good') + '</div>';
    }).join('');
    const rel = state.player.rel;
    const captain = L.isCaptain(state) ? '<p class="news">' + esc(t('profile.captain')) + '</p>' : '';
    const boot = L.BOOTS.find(function (b) { return b.id === state.player.boots; });
    const sheet = askRetire
      ? '<div class="sheet-back"><div class="sheet"><h3>' + esc(t('profile.retireTitle')) + '</h3><p>' + esc(t('profile.retireBody')) + '</p>' +
        '<button type="button" class="btn danger" data-act="retire-yes">' + esc(t('profile.hang')) + '</button>' +
        '<button type="button" class="btn ghost" data-act="retire-no">' + esc(t('profile.keep')) + '</button></div></div>'
      : '';
    return '<div class="page">' + topbar(t('profile.title')) +
      '<div class="card idcard">' + crest(L.clubById(state.clubId)) + '<div><h2>' + esc(state.player.name) + '</h2><p>' +
      esc(t('common.age', { n: state.player.age })) + ' · ' + posLabel(state.player.pos) + ' · ' + esc(t('profile.no', { n: L.shirtNumber(state.player.name) })) + '<br>' +
      esc(tierLabel(state.tier)) + ' · ' + esc(t('profile.wage', { n: L.formatMoney(state.wage) })) + '</p></div></div>' +
      captain +
      '<h3 class="section">' + esc(t('profile.attrs')) + '</h3>' + attrs +
      '<h3 class="section">' + esc(t('profile.rels')) + '</h3>' +
      relRow(t('profile.coach'), rel.hoca) + relRow(t('profile.mates'), rel.takim) + relRow(t('profile.fans'), rel.taraftar) +
      '<h3 class="section">' + esc(t('profile.life')) + '</h3>' +
      '<div class="rel"><div class="rel-top"><span>' + (boot ? esc(iname(boot)) : esc(t('profile.noBoots'))) + '</span><b>' + L.lifestyleScore(state) + '</b></div>' +
      bar(L.lifestyleScore(state), 'mid') + '</div>' +
      '<p class="fine">' + esc(t('profile.career', { g: state.history.goals, a: state.history.assists, m: state.history.matches })) + '</p>' +
      '<button type="button" class="btn ghost" data-act="menu">' + esc(t('profile.menu')) + '</button>' +
      '<button type="button" class="textbtn" data-act="retire">' + esc(t('profile.retire')) + '</button>' +
      sheet + '</div>';
  }

  function relRow(label, value) {
    const cls = value >= 70 ? 'good' : value < 35 ? 'bad' : '';
    return '<div class="rel"><div class="rel-top"><span>' + esc(label) + '</span><b>' + value + ' · ' + esc(moodLabel(value)) + '</b></div>' +
      bar(value, cls) + '</div>';
  }

  function pageResult() {
    const last = state.lastMatch;
    if (!last) return '<div class="page">' + topbar(t('match.title')) + '<p>' + esc(t('result.missing')) + '</p></div>';
    const me = L.clubById(state.clubId);
    const opp = L.clubById(last.oppId);
    const word = last.result === 'win' ? t('common.wins') : last.result === 'draw' ? t('common.draw') : t('common.loss');
    const moments = (last.moments || []).map(function (m) {
      return '<li><b>' + m.minute + "'</b> " + esc(say(m.text)) + '</li>';
    }).join('');
    return '<div class="page">' +
      '<p class="eyebrow">' + esc(t('common.week')) + ' ' + last.week + ' · ' + esc(last.home ? t('common.home') : t('common.away')) + '</p>' +
      '<h1 class="result-word ' + last.result + '">' + esc(word) + '</h1>' +
      '<div class="scorebig"><div>' + crest(me) + '<span>' + esc(cshort(me)) + '</span><strong>' + last.us + '</strong></div>' +
      '<div>' + crest(opp) + '<span>' + esc(cshort(opp)) + '</span><strong>' + last.them + '</strong></div></div>' +
      '<div class="rating">' + esc(t('result.rating')) + ' <b>' + comma(last.rating) + '</b></div>' +
      '<div class="statgrid two">' +
      '<div class="stat"><b>' + last.goals + '</b><span>' + esc(t('common.goals')) + '</span></div>' +
      '<div class="stat"><b>' + last.assists + '</b><span>' + esc(t('common.assists')) + '</span></div></div>' +
      '<div class="card">' +
      relDelta(t('profile.coach'), last.deltas.hoca) +
      relDelta(t('profile.mates'), last.deltas.takim) +
      relDelta(t('profile.fans'), last.deltas.taraftar) +
      '<p class="fine">' + esc(t('result.cash', { n: L.formatMoney(last.earn) })) + '</p></div>' +
      (moments ? '<ul class="moments">' + moments + '</ul>' : '') +
      '<button type="button" class="btn gold" data-act="result-next">' + esc(t('common.continue')) + '</button></div>';
  }

  function relDelta(label, value) {
    const cls = value > 0 ? 'up' : value < 0 ? 'down' : '';
    return '<div class="rel-top"><span>' + label + '</span><b class="' + cls + '">' + signed(value) + '</b></div>';
  }

  function pageSeason() {
    const review = state.review;
    if (!review) return '<div class="page"><p>' + esc(t('season.missing')) + '</p><button class="btn" data-act="season-next">' + esc(t('common.continue')) + '</button></div>';
    const declineBits = (review.decline || []).map(function (bit) { return say(bit); });
    const decline = declineBits.length
      ? '<p class="warn">' + esc(t('season.aged', { attrs: declineBits.join(' ' + t('season.and') + ' ') })) + '</p>' : '';
    const award = review.award ? '<p class="news">' + esc(review.award.split(' · ').map(say).join(' · ')) + '</p>' : '';
    const prize = review.prize ? '<p class="helptext">' + esc(t('season.prize', { n: L.formatMoney(review.prize) })) + '</p>' : '';
    let offers = '';
    if (!review.retired && state.offers && state.offers.length) {
      offers = state.offers.map(function (offer) {
        const club = L.clubById(offer.clubId);
        const agreed = state.agreedOffer && state.agreedOffer.id === offer.id;
        return '<article class="shop offer">' + crest(club) + '<div><h3>' + esc(cname(club) || t('table.team')) + '</h3><p>' +
          esc(tierLabel(offer.tier)) + ' · ' + L.formatMoney(offer.wage) + ' / ' + esc(t('common.week').toLowerCase()) + '</p>' +
          (agreed ? '<p class="news">' + esc(t('season.agreed')) + '</p>' : '') + '</div>' +
          (agreed
            ? '<button type="button" class="btn tiny ghost" data-act="offer-no" data-id="' + esc(offer.id) + '">' + esc(t('season.drop')) + '</button>'
            : '<div class="stack tight"><button type="button" class="btn tiny" data-act="offer-yes" data-id="' + esc(offer.id) + '">' + esc(t('season.accept')) + '</button>' +
              '<button type="button" class="btn tiny ghost" data-act="pazarlik" data-id="' + esc(offer.id) + '">' + esc(t('season.talk')) + '</button>' +
              '<button type="button" class="btn tiny ghost" data-act="offer-no" data-id="' + esc(offer.id) + '">' + esc(t('season.reject')) + '</button></div>') +
          '</article>';
      }).join('');
    } else if (!review.retired) {
      offers = '<div class="card empty"><p>' + esc(t('season.quiet')) + '</p></div>';
    }
    const nextLabel = review.retired ? t('season.close') : (state.agreedOffer ? t('season.newClub') : t('season.next'));
    return '<div class="page">' +
      '<p class="eyebrow">' + esc(t('season.done', { n: review.season })) + '</p>' +
      '<h1 class="logo small">' + esc(say(review.headline)) + '</h1>' +
      '<p class="helptext">' + esc(t('season.line', { r: review.rank, g: review.goals, a: review.assists, age: review.age })) + '</p>' +
      award + prize + decline +
      renderTable(review.table, review.clubId, review.tierBefore) +
      (review.retired ? '<p class="news">' + esc(t('season.body')) + '</p>' : '<h3 class="section">' + esc(t('season.offers')) + '</h3>' + offers) +
      '<button type="button" class="btn gold" data-act="season-next">' + esc(nextLabel) + '</button></div>';
  }

  let talk = null;

  function pagePazarlik() {
    if (!talk) return '<div class="page">' + topbar(t('talk.title')) + '<p>' + esc(t('talk.none')) + '</p></div>';
    const club = L.clubById(talk.clubId);
    return '<div class="page">' + topbar(t('talk.title')) +
      crest(club) + '<h2>' + esc(cname(club) || t('table.team')) + '</h2>' +
      '<p class="helptext">' + esc(t('talk.help')) + '</p>' +
      '<div class="card"><div class="rel-top"><span>' + esc(t('talk.wage')) + '</span><b>' + L.formatMoney(talk.wage) + '</b></div>' +
      '<div class="action-grid"><button type="button" class="btn tiny" data-act="talk" data-key="wage" data-dir="-1">−</button>' +
      '<button type="button" class="btn tiny" data-act="talk" data-key="wage" data-dir="1">+</button></div></div>' +
      '<div class="card"><div class="rel-top"><span>' + esc(t('talk.bonus')) + '</span><b>' + L.formatMoney(talk.bonus || 0) + '</b></div>' +
      '<div class="action-grid"><button type="button" class="btn tiny" data-act="talk" data-key="bonus" data-dir="-1">−</button>' +
      '<button type="button" class="btn tiny" data-act="talk" data-key="bonus" data-dir="1">+</button></div></div>' +
      '<div class="card"><div class="rel-top"><span>' + esc(t('talk.years')) + '</span><b>' + esc(t('talk.yearN', { n: talk.years || 2 })) + '</b></div>' +
      '<div class="action-grid"><button type="button" class="btn tiny" data-act="talk" data-key="years" data-dir="-1">−</button>' +
      '<button type="button" class="btn tiny" data-act="talk" data-key="years" data-dir="1">+</button></div></div>' +
      '<div class="card"><div class="rel-top"><span>' + esc(t('talk.goal')) + '</span><b>' + L.formatMoney(talk.goalBonus || 0) + '</b></div>' +
      '<div class="action-grid"><button type="button" class="btn tiny" data-act="talk" data-key="goalBonus" data-dir="-1">−</button>' +
      '<button type="button" class="btn tiny" data-act="talk" data-key="goalBonus" data-dir="1">+</button></div></div>' +
      '<button type="button" class="btn gold" data-act="talk-send">' + esc(t('talk.send')) + '</button>' +
      (talk.counter ? '<button type="button" class="btn" data-act="talk-take">' + esc(t('talk.take')) + '</button>' : '') +
      '</div>';
  }

  function pageCasino() {
    return '<div class="page">' + topbar(t('casino.title')) +
      '<p class="helptext">' + esc(t('casino.note', { n: L.formatMoney(state.player.money) })) + '</p>' +
      '<article class="card"><h3>' + esc(t('casino.slot')) + '</h3><p>' + esc(t('casino.slotBody')) + '</p>' +
      '<button type="button" class="btn" data-act="slot" data-bet="50">' + esc(t('casino.spin')) + '</button></article>' +
      '<article class="card"><h3>' + esc(t('casino.roulette')) + '</h3><p>' + esc(t('casino.rouletteBody')) + '</p>' +
      '<div class="action-grid"><button type="button" class="btn" data-act="rulet" data-pick="kirmizi">' + esc(t('casino.red')) + '</button>' +
      '<button type="button" class="btn" data-act="rulet" data-pick="siyah">' + esc(t('casino.black')) + '</button></div></article>' +
      '<article class="card"><h3>' + esc(t('casino.bj')) + '</h3><p>' + esc(t('casino.bjBody')) + '</p>' +
      '<button type="button" class="btn" data-act="bj" data-bet="50">' + esc(t('casino.hand')) + '</button></article></div>';
  }

  function pageLife() {
    L.migrate(state);
    const love = state.player.partner;
    const gifts = (L.GIFTS || []).map(function (g) {
      return '<button type="button" class="btn" data-act="gift" data-id="' + g.id + '">' + esc(iname(g)) + ' · ' + L.formatMoney(g.price) + '</button>';
    }).join('');
    const sponsors = (L.SPONSORS || []).map(function (s) {
      const on = state.player.sponsor && state.player.sponsor.id === s.id;
      return '<article class="shop"><div><h3>' + esc(iname(s)) + '</h3><p>' + esc(iblurb(s)) + ' · ' + L.formatMoney(s.pay) + '/hf</p></div>' +
        '<button type="button" class="btn tiny" data-act="sponsor" data-id="' + s.id + '"' + (on ? ' disabled' : '') + '>' + (on ? esc(t('life.active')) : esc(t('life.sign'))) + '</button></article>';
    }).join('');
    return '<div class="page">' + topbar(t('life.title')) +
      '<div class="card"><div class="rel-top"><span>' + esc(t('life.morale')) + '</span><b>' + state.player.morale + '</b></div>' + bar(state.player.morale, 'mid') +
      '<p class="fine">' + esc(t('life.contract', { y: state.player.contractYears || 0, g: L.formatMoney(state.player.goalBonus || 0) })) + '</p></div>' +
      '<h3 class="section">' + esc(t('life.partner')) + '</h3>' +
      (love
        ? '<div class="card"><div class="rel-top"><span>' + esc(love.name) + '</span><b>' + love.love + '</b></div>' + bar(love.love, 'good') + '</div>' +
          '<button type="button" class="btn" data-act="date">' + esc(t('life.date')) + '</button>' + gifts
        : '<button type="button" class="btn gold" data-act="meet">' + esc(t('life.meet')) + '</button>') +
      '<h3 class="section">' + esc(t('life.sponsor')) + '</h3>' + sponsors +
      '<button type="button" class="btn ghost" data-act="renew">' + esc(t('life.renew')) + '</button>' +
      (state.milliInvite ? '<button type="button" class="btn" data-act="milli-open">' + esc(t('life.invite')) + '</button>' : '') +
      '</div>';
  }

  function pageCabinet() {
    L.migrate(state);
    const cups = (state.trophies || []).map(function (cup) {
      return '<li><b>' + esc(say(cup.name)) + '</b><span>' + esc(t('common.season')) + ' ' + cup.season + '</span></li>';
    }).join('');
    const hist = (state.seasonHistory || []).map(function (h) {
      const club = L.clubById(h.clubId);
      return '<li><b>S' + h.season + ' ' + esc(cshort(club)) + '</b><span>' + esc(t('cabinet.rank', { r: h.rank, g: h.goals })) + '</span></li>';
    }).join('');
    const m = state.milli || { caps: 0, goals: 0 };
    return '<div class="page">' + topbar(t('cabinet.title')) +
      '<div class="statgrid"><div class="stat"><b>' + (state.trophies || []).length + '</b><span>' + esc(t('cabinet.cups')) + '</span></div>' +
      '<div class="stat"><b>' + m.caps + '</b><span>' + esc(t('cabinet.caps')) + '</span></div>' +
      '<div class="stat"><b>' + state.history.goals + '</b><span>' + esc(t('cabinet.cg')) + '</span></div>' +
      '<div class="stat"><b>' + state.history.assists + '</b><span>' + esc(t('cabinet.ca')) + '</span></div></div>' +
      '<h3 class="section">' + esc(t('cabinet.list')) + '</h3>' + (cups ? '<ul class="fixtures">' + cups + '</ul>' : '<p class="fine">' + esc(t('cabinet.empty')) + '</p>') +
      '<h3 class="section">' + esc(t('cabinet.seasons')) + '</h3>' + (hist ? '<ul class="fixtures">' + hist + '</ul>' : '<p class="fine">' + esc(t('cabinet.first')) + '</p>') +
      '</div>';
  }

  function pageMilli() {
    L.migrate(state);
    const inv = state.milliInvite;
    return '<div class="page">' + topbar(t('milli.title')) +
      '<h2>' + esc(inv ? t('milli.in') : t('milli.out')) + '</h2>' +
      '<p class="helptext">' + (inv ? esc(t('milli.prep', { foe: say(inv.foe) })) : esc(t('milli.wait'))) + '</p>' +
      '<p class="fine">' + esc(t('milli.line', { c: (state.milli && state.milli.caps) || 0, g: (state.milli && state.milli.goals) || 0 })) + '</p>' +
      (inv ? '<button type="button" class="btn gold" data-act="milli-play">' + esc(t('milli.play')) + '</button><button type="button" class="btn ghost" data-act="milli-no">' + esc(t('milli.no')) + '</button>' : '') +
      '</div>';
  }

  function pageRetired() {
    return '<div class="page">' + topbar(t('retired.title')) + statBlock(state) +
      '<button type="button" class="btn gold" data-act="new">' + esc(t('menu.new')) + '</button></div>';
  }

  function pageMatch() {
    const pen = state.live ? state.live.tiredPen : 0;
    return '<div class="match">' +
      '<header class="match-hud"><div><div id="match-score" class="match-score">' + esc(t('match.title')) + '</div>' +
      '<div class="match-meta"><strong id="match-minute"></strong> <span id="match-sub"></span></div>' +
      (pen >= 8 ? '<p class="warn tight">' + esc(t('match.tired', { n: pen })) + '</p>' : '') +
      '</div><button type="button" class="iconbtn" data-act="sound">' + (settings.sound ? esc(t('menu.soundShort')) : esc(t('menu.mute'))) + '</button></header>' +
      '<div class="pitch-wrap"><canvas id="pitch" aria-label="' + esc(t('match.pitch')) + '"></canvas></div>' +
      '<p id="match-hint">' + esc(t('match.hint')) + '</p>' +
      '<button type="button" id="match-next" class="btn gold" data-act="match-next" hidden>' + esc(t('match.next')) + '</button>' +
      '</div>';
  }

  function pageSettings() {
    const cloudOn = Cloud && Cloud.configured();
    const code = state ? Cloud.encode(state) : '';
    return '<div class="page">' + topbar(t('set.title')) +
      '<h3 class="section">' + esc(t('set.lang')) + '</h3>' +
      '<div class="seg">' +
      '<button type="button" data-act="lang" data-lang="tr" class="' + (settings.lang !== 'en' ? 'on' : '') + '">' + esc(t('set.tr')) + '</button>' +
      '<button type="button" data-act="lang" data-lang="en" class="' + (settings.lang === 'en' ? 'on' : '') + '">' + esc(t('set.en')) + '</button>' +
      '</div>' +
      '<h3 class="section">' + esc(t('set.feel')) + '</h3>' +
      '<button type="button" class="btn" data-act="sound">' + esc(settings.sound ? t('menu.soundOn') : t('menu.soundOff')) + '</button>' +
      '<button type="button" class="btn ghost" data-act="vibrate">' + esc(settings.vibrate !== false ? t('menu.vibOn') : t('menu.vibOff')) + '</button>' +
      '<h3 class="section">' + esc(t('set.code')) + '</h3>' +
      '<p class="helptext">' + esc(t('set.codeHelp')) + '</p>' +
      '<textarea id="save-code" class="save-code" rows="5" spellcheck="false">' + esc(code) + '</textarea>' +
      '<div class="action-grid">' +
      '<button type="button" class="btn" data-act="export-copy"' + (state ? '' : ' disabled') + '>' + esc(t('set.copy')) + '</button>' +
      '<button type="button" class="btn" data-act="export-file"' + (state ? '' : ' disabled') + '>' + esc(t('set.file')) + '</button>' +
      '<button type="button" class="btn ghost" data-act="export-share"' + (state ? '' : ' disabled') + '>' + esc(t('set.share')) + '</button>' +
      '</div>' +
      '<label class="btn ghost filebtn">' + esc(t('set.pick')) + '<input id="save-file" type="file" accept=".ysave,text/plain" hidden></label>' +
      '<button type="button" class="btn gold" data-act="import-apply">' + esc(t('set.import')) + '</button>' +
      '<h3 class="section">' + esc(t('set.cloud')) + '</h3>' +
      '<p class="helptext">' + esc(cloudOn ? t('set.cloudOn') : t('set.cloudOff')) + '</p>' +
      '<div class="action-grid">' +
      '<button type="button" class="btn" data-act="cloud-save"' + (cloudOn && state ? '' : ' disabled') + '>' + esc(t('set.cloudSave')) + '</button>' +
      '<button type="button" class="btn ghost" data-act="cloud-load"' + (cloudOn ? '' : ' disabled') + '>' + esc(t('set.cloudLoad')) + '</button>' +
      '</div></div>';
  }

  function htmlFor(name) {
    if (name === 'menu') return pageMenu();
    if (name === 'create') return pageCreate();
    if (name === 'stats') return pageStats();
    if (name === 'help') return pageHelp();
    if (name === 'settings') return pageSettings();
    if (!state) return pageMenu();
    if (name === 'hub') return pageHub();
    if (name === 'train') return pageTrain();
    if (name === 'shop') return pageShop();
    if (name === 'table') return pageTable();
    if (name === 'profile') return pageProfile();
    if (name === 'result') return pageResult();
    if (name === 'season') return pageSeason();
    if (name === 'retired') return pageRetired();
    if (name === 'match') return pageMatch();
    if (name === 'pazarlik') return pagePazarlik();
    if (name === 'casino') return pageCasino();
    if (name === 'life') return pageLife();
    if (name === 'cabinet') return pageCabinet();
    if (name === 'milli') return pageMilli();
    return pageMenu();
  }

  function go(next, back) {
    if (back) backStack.push(back);
    if (next !== 'match' && matchView) {
      matchView.destroy();
      matchView = null;
    }
    view = next;
    const root = document.getElementById('screen');
    root.className = 'screen screen-' + view;
    if (next === 'match') {
      showMatch();
      return;
    }
    root.innerHTML = htmlFor(view);
    const input = root.querySelector('#isim');
    if (input) {
      input.value = draftName;
      if (!confirmWipe) input.focus();
    }
  }

  function showMatch() {
    clearToasts();
    if (!state.live) {
      const live = L.createMatch(state);
      if (!live) {
        toast('Bu haftanın fikstürü yok.');
        view = 'hub';
        go('hub');
        return;
      }
      save();
    }
    const root = document.getElementById('screen');
    root.className = 'screen screen-match';
    root.innerHTML = pageMatch();
    if (!state.sawTutorial) {
      const tutor = document.createElement('div');
      tutor.className = 'sheet-back';
      tutor.id = 'tutorial';
      tutor.innerHTML = '<div class="sheet"><p class="eyebrow">İlk maç</p><h3>Topu sen yönet</h3>' +
        '<p>Topa basılı tut, kaleye kaydır. Uzun kaydırma sert şuttur. Soldaki altın bölge ideal güçtür. Kaleciden uzak köşeyi dene.</p>' +
        '<p>Pas pozisyonunda beyaz formaya kaydır ya da üzerine dokun.</p>' +
        '<button type="button" class="btn gold" data-act="tutorial-ok">Anladım</button></div>';
      root.appendChild(tutor);
    }
    const canvas = root.querySelector('canvas');
    if (matchView) matchView.destroy();
    matchView = new window.YSMatch.MatchView(canvas, state, {
      onSave: save,
      onFinished: finishMatch,
      sfx: Sfx,
      speed: function () { return window.YESIL && window.YESIL.animSpeed ? window.YESIL.animSpeed : 1; },
      vibrate: function () { return settings.vibrate !== false; },
    });
    matchView.start();
  }

  function finishMatch(stats) {
    if (state.live) {
      stats.competition = state.live.competition || null;
      stats.compName = state.live.compName || '';
    }
    const res = L.completeMatch(state, stats);
    if (!res || !res.ok) {
      toast(res && res.message ? res.message : 'Maç işlenemedi.');
      save();
      go('hub');
      return;
    }
    save();
    if (res.match && (res.match.goals > 0 || res.match.result === 'win')) Sfx.crowd();
    if (res.match && res.match.result === 'win') Sfx.cheer();
    else Sfx.whistle();
    go('result');
  }

  function doStart(force) {
    const input = document.getElementById('isim');
    if (input) draftName = input.value;
    const err = L.validateName(draftName);
    if (err) { toast(err); return; }
    if (loadState() && !force) {
      confirmWipe = true;
      go('create');
      return;
    }
    confirmWipe = false;
    const made = L.createCareer({ name: draftName, pos: createPos });
    if (!made) { toast('Kariyer açılamadı.'); return; }
    state = made;
    askTired = false;
    save();
    Sfx.ui();
    go('hub');
  }

  function adoptCareer(data) {
    const migrated = L.migrate ? L.migrate(data) : data;
    if (!migrated || !L.clubById(migrated.clubId)) { toast('Kayıt kodu geçersiz.'); return; }
    state = migrated;
    askTired = false;
    save();
    toast('Kariyer yüklendi.');
    if (state.retired && state.phase !== 'result' && state.phase !== 'season') { go('retired'); return; }
    if (state.phase === 'result' && state.lastMatch) { go('result'); return; }
    if (state.phase === 'season' && state.review) { go('season'); return; }
    state.phase = 'hub';
    go('hub');
  }

  function openSave() {
    state = loadState();
    if (!state) { toast('Kayıt bulunamadı.'); go('menu'); return; }
    if (state.retired && state.phase !== 'result' && state.phase !== 'season') {
      go('retired');
      return;
    }
    if (state.phase === 'match' && state.live) { go('match'); return; }
    if (state.phase === 'result' && state.lastMatch) { go('result'); return; }
    if (state.phase === 'season' && state.review) { go('season'); return; }
    if (state.phase === 'retired') { go('retired'); return; }
    state.phase = 'hub';
    go('hub');
  }

  function onClick(event) {
    const btn = event.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    if (act !== 'match-next' && act !== 'tutorial-ok' && act !== 'sound') Sfx.ui();
    if (act === 'vibrate') {
      settings.vibrate = settings.vibrate === false;
      saveSettings();
      toast(settings.vibrate ? 'Titreşim açık' : 'Titreşim kapalı');
      if (view !== 'match') go(view);
      return;
    }
    if (act === 'sound') {
      settings.sound = !settings.sound;
      saveSettings();
      toast(settings.sound ? 'Ses açık' : 'Ses kapalı');
      if (view === 'match') {
        document.querySelectorAll('[data-act="sound"]').forEach(function (node) {
          node.textContent = settings.sound ? t('menu.soundShort') : t('menu.mute');
        });
      } else go(view);
      return;
    }
    if (act === 'back') { go(backStack.pop() || 'menu'); return; }
    if (act === 'new') { confirmWipe = false; draftName = ''; go('create', 'menu'); return; }
    if (act === 'stats') { go('stats', view === 'menu' ? 'menu' : view); return; }
    if (act === 'help') { go('help', view); return; }
    if (act === 'settings') {
      if (view !== 'settings') go('settings', view);
      return;
    }
    if (act === 'lang') {
      settings.lang = btn.dataset.lang === 'en' ? 'en' : 'tr';
      if (I18N) I18N.setLang(settings.lang);
      saveSettings();
      go('settings');
      return;
    }
    if (act === 'export-copy' || act === 'export-file' || act === 'export-share') {
      if (!state || !Cloud) { toast(t('set.needCareer')); return; }
      const code = Cloud.encode(state);
      const box = document.getElementById('save-code');
      if (box) box.value = code;
      if (act === 'export-file') {
        Cloud.download(code);
        toast('Dosya indirildi.');
        return;
      }
      if (act === 'export-share') {
        Cloud.share(code).then(function () { toast('Kayıt kodu kopyalandı.'); }).catch(function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(function () { toast('Paylaşım açılamadı.'); }).catch(function () { toast('Panoya yazılamadı.'); });
          } else toast('Paylaşım açılamadı.');
        });
        return;
      }
      const done = function () { toast('Kayıt kodu kopyalandı.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(function () { toast('Panoya yazılamadı.'); });
      } else if (box) {
        box.focus();
        box.select();
        done();
      }
      return;
    }
    if (act === 'import-apply') {
      const box = document.getElementById('save-code');
      const data = Cloud ? Cloud.decode(box ? box.value : '') : null;
      if (!data || !L.clubById(data.clubId)) { toast('Kayıt kodu geçersiz.'); return; }
      adoptCareer(data);
      return;
    }
    if (act === 'cloud-save') {
      if (!Cloud || !Cloud.configured() || !state) { toast('Bulut kapalı.'); return; }
      Cloud.saveCloud(state).then(function () { toast('Buluta yazıldı.'); }).catch(function () { toast('Bulut hatası.'); });
      return;
    }
    if (act === 'cloud-load') {
      if (!Cloud || !Cloud.configured()) { toast('Bulut kapalı.'); return; }
      Cloud.loadCloud().then(function (data) {
        if (!data || !L.clubById(data.clubId)) { toast('Kayıt kodu geçersiz.'); return; }
        adoptCareer(data);
        toast('Buluttan geldi.');
      }).catch(function () { toast('Bulut hatası.'); });
      return;
    }
    if (act === 'continue') { openSave(); return; }
    if (act === 'menu') { if (state) save(); go('menu'); return; }
    if (act === 'pos') {
      const input = document.getElementById('isim');
      if (input) draftName = input.value;
      createPos = btn.dataset.pos === 'ortasaha' ? 'ortasaha' : 'forvet';
      go('create');
      return;
    }
    if (act === 'cancel-wipe') { confirmWipe = false; go('create'); return; }
    if (act === 'confirm-start') { doStart(true); return; }
    if (!state) return;
    if (act === 'train-open') { askTired = false; go('train', 'hub'); return; }
    if (act === 'train') {
      const res = L.train(state, btn.dataset.attr);
      save();
      toast(res.message);
      go('train', 'hub');
      return;
    }
    if (act === 'rest') {
      const res = L.rest(state);
      save();
      toast(res.message);
      askTired = false;
      go(view === 'train' ? 'train' : 'hub');
      return;
    }
    if (act === 'drink') {
      const res = L.useDrink(state);
      save();
      toast(res.message);
      go(view === 'shop' ? 'shop' : 'hub');
      return;
    }
    if (act === 'buy') {
      const res = L.buy(state, btn.dataset.item, Number(btn.dataset.qty || 1));
      save();
      toast(res.message);
      go('shop');
      return;
    }
    if (act === 'table') { go('table', 'hub'); return; }
    if (act === 'profile') { askRetire = false; go('profile', 'hub'); return; }
    if (act === 'shop') { go('shop', 'hub'); return; }
    if (act === 'close-tired') { askTired = false; go('hub'); return; }
    if (act === 'match') {
      if (state.inboxOffer) return;
      if (L.energyPenalty(state) >= 8) { askTired = true; go('hub'); return; }
      go('match');
      return;
    }
    if (act === 'match-force') { askTired = false; go('match'); return; }
    if (act === 'match-next') { if (matchView) matchView.continue(); return; }
    if (act === 'tutorial-ok') {
      state.sawTutorial = true;
      save();
      const tutor = document.getElementById('tutorial');
      if (tutor) tutor.remove();
      return;
    }
    if (act === 'result-next') {
      const next = L.continueResult(state);
      save();
      go(next === 'season' ? 'season' : 'hub');
      return;
    }
    if (act === 'life') { go('life', 'hub'); return; }
    if (act === 'casino') { go('casino', 'hub'); return; }
    if (act === 'cabinet') { go('cabinet', 'hub'); return; }
    if (act === 'milli-open') { go('milli', 'hub'); return; }
    if (act === 'cup' || act === 'europe' || act === 'milli-play') {
      const kind = act === 'cup' ? 'kupa' : act === 'europe' ? 'avrupa' : 'milli';
      const res = L.beginSpecial(state, kind);
      if (!res.ok) { toast(res.message); return; }
      save();
      go('match');
      return;
    }
    if (act === 'milli-no') {
      state.milliInvite = null;
      save();
      toast('Daveti erteledin.');
      go('hub');
      return;
    }
    if (act === 'miss') {
      const res = L.missMatch(state);
      save();
      toast(res.message || 'Maç geçti.');
      go(state.phase === 'season' ? 'season' : state.phase === 'result' ? 'result' : 'hub');
      return;
    }
    if (act === 'meet' || act === 'date' || act === 'gift' || act === 'sponsor' || act === 'renew') {
      let res;
      if (act === 'meet') res = L.meetPartner(state);
      else if (act === 'date') res = L.dateNight(state);
      else if (act === 'gift') res = L.giveGift(state, btn.dataset.id);
      else if (act === 'sponsor') res = L.signSponsor(state, btn.dataset.id);
      else {
        talk = L.renewalOffer(state);
        go('pazarlik', 'life');
        return;
      }
      save();
      toast(res.message);
      go('life', 'hub');
      return;
    }
    if (act === 'slot' || act === 'rulet' || act === 'bj') {
      const bet = Number(btn.dataset.bet || 50);
      const res = act === 'slot' ? L.slot(state, bet) : act === 'rulet' ? L.roulette(state, bet, btn.dataset.pick) : L.blackjack(state, bet, 17);
      save();
      toast(res.message);
      go('casino', 'hub');
      return;
    }
    if (act === 'pazarlik') {
      const id = btn.dataset.id;
      const found = (state.offers || []).concat(state.inboxOffer || []).find(function (o) { return o && o.id === id; });
      if (!found) { toast('Teklif yok.'); return; }
      talk = {
        id: found.id, clubId: found.clubId, tier: found.tier, wage: found.wage,
        bonus: found.bonus || 0, years: found.years || 2, goalBonus: found.goalBonus || 40, kind: found.kind,
      };
      go('pazarlik', view);
      return;
    }
    if (act === 'talk') {
      if (!talk) return;
      const key = btn.dataset.key;
      const dir = Number(btn.dataset.dir || 1);
      if (key === 'wage') talk.wage = Math.max(200, talk.wage + dir * Math.max(20, Math.round(talk.wage * 0.05)));
      if (key === 'bonus') talk.bonus = Math.max(0, (talk.bonus || 0) + dir * 200);
      if (key === 'years') talk.years = L.clamp((talk.years || 2) + dir, 1, 5);
      if (key === 'goalBonus') talk.goalBonus = Math.max(0, (talk.goalBonus || 0) + dir * 20);
      go('pazarlik');
      return;
    }
    if (act === 'talk-send' || act === 'talk-take') {
      if (!talk) return;
      let res = { result: 'kabul', offer: talk, message: 'Karşı teklif tamam.' };
      if (act === 'talk-take' && talk.counter) {
        res.offer = Object.assign({}, talk, talk.counter, { kind: talk.kind, id: talk.id, clubId: talk.clubId, tier: talk.tier });
      } else {
        res = L.negotiate(state, talk, talk);
      }
      if (res.result === 'kabul') {
        const deal = res.offer;
        if (talk.kind === 'yenileme') {
          L.applyDeal(state, deal);
          toast('Sözleşme yenilendi. ' + L.formatMoney(deal.wage) + ' / hafta.');
        } else if (state.inboxOffer && state.inboxOffer.id === talk.id) {
          L.applyDeal(state, deal);
          state.inboxOffer = Object.assign({}, state.inboxOffer, deal);
          L.resolveInbox(state, 'now');
          toast('İmza tamam. Yeni takıma geçtin.');
        } else {
          L.applyDeal(state, deal);
          state.agreedOffer = deal;
          toast(res.message || 'Anlaştın. Sezon sonunda geçersin.');
        }
        talk = null;
        save();
        go(state.phase === 'hub' ? 'hub' : (state.phase === 'season' ? 'season' : 'hub'));
        return;
      }
      if (res.result === 'karsi') {
        talk = Object.assign({}, talk, res.offer, { counter: res.offer });
        toast(res.message);
        save();
        go('pazarlik');
        return;
      }
      toast(res.message || 'Kulüp kalktı.');
      if (talk.kind !== 'yenileme') {
        L.rejectSeasonOffer(state, talk.id);
        if (state.inboxOffer && state.inboxOffer.id === talk.id) state.inboxOffer = null;
      }
      talk = null;
      save();
      go(state.phase === 'season' ? 'season' : 'hub');
      return;
    }
    if (act === 'offer-yes') {
      const res = L.acceptSeasonOffer(state, btn.dataset.id);
      save();
      toast(res.message);
      go('season');
      return;
    }
    if (act === 'offer-no') {
      const res = L.rejectSeasonOffer(state, btn.dataset.id);
      save();
      toast(res.message);
      go('season');
      return;
    }
    if (act === 'season-next') {
      if (state.retired || (state.review && state.review.retired)) {
        L.retireCareer(state);
        save();
        go('retired');
        return;
      }
      const res = L.beginNextSeason(state);
      save();
      if (!res.ok) toast(res.message);
      go('hub');
      return;
    }
    if (act === 'inbox-now' || act === 'inbox-later' || act === 'inbox-no') {
      const mode = act === 'inbox-now' ? 'now' : act === 'inbox-later' ? 'later' : 'no';
      const res = L.resolveInbox(state, mode);
      save();
      toast(res.message);
      go('hub');
      return;
    }
    if (act === 'retire') { askRetire = true; go('profile', 'hub'); return; }
    if (act === 'retire-no') { askRetire = false; go('profile', 'hub'); return; }
    if (act === 'retire-yes') {
      L.retireCareer(state);
      save();
      go('retired');
    }
  }

  function onSubmit(event) {
    if (event.target && event.target.id === 'create-form') {
      event.preventDefault();
      doStart(false);
    }
  }

  function onInput(event) {
    if (event.target && event.target.id === 'isim') draftName = event.target.value;
  }

  function bindAndroidBack() {
    const cap = window.Capacitor;
    const AppPlugin = cap && cap.Plugins && cap.Plugins.App;
    if (!AppPlugin || !AppPlugin.addListener) return;
    if (bindAndroidBack.done) return;
    bindAndroidBack.done = true;
    AppPlugin.addListener('backButton', function () {
      const stay = window.YESIL && window.YESIL.onBack && window.YESIL.onBack();
      if (!stay && AppPlugin.exitApp) AppPlugin.exitApp();
    });
  }

  function boot() {
    const screen = document.getElementById('screen');
    screen.addEventListener('click', onClick);
    screen.addEventListener('submit', onSubmit);
    screen.addEventListener('input', onInput);
    screen.addEventListener('change', function (event) {
      const input = event.target;
      if (!input || input.id !== 'save-file' || !input.files || !input.files[0] || !Cloud) return;
      const reader = new FileReader();
      reader.onload = function () {
        const data = Cloud.decode(String(reader.result || ''));
        if (!data || !L.clubById(data.clubId)) { toast('Kayıt kodu geçersiz.'); return; }
        adoptCareer(data);
      };
      reader.readAsText(input.files[0]);
    });
    function onHardwareBack() {
      const sheet = document.querySelector('.sheet-back');
      if (sheet) {
        const cancel = sheet.querySelector('[data-act="cancel-wipe"], [data-act="close-tired"], [data-act="tutorial-ok"], [data-act="milli-no"], [data-act="retire-no"], [data-act="inbox-no"]');
        if (cancel) cancel.click();
        else sheet.remove();
        return true;
      }
      if (view === 'match') return true;
      if (view === 'menu') return false;
      const back = document.querySelector('[data-act="back"]');
      if (back) back.click();
      else go('menu');
      return true;
    }
    window.YESIL = {
      animSpeed: 1,
      getState: function () { return state; },
      getView: function () { return view; },
      getMatch: function () { return matchView; },
      onBack: onHardwareBack,
    };
    if (I18N) I18N.setLang(settings.lang || 'tr');
    registerNames();
    bindAndroidBack();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function () {});
      });
    }
    go('menu');
  }

  if (!L || !window.YSMatch) {
    const screen = document.getElementById('screen');
    if (screen) screen.textContent = (window.YSI18n ? window.YSI18n.t('err.files') : 'Oyun dosyaları eksik. Sayfayı yenile.');
    return;
  }
  boot();
})();
