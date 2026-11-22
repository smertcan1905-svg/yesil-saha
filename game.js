/* Yeşil Saha — ekranlar, kayıt, ses. */
(function () {
  'use strict';

  const L = window.YSLogic;
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

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SET_KEY);
      if (!raw) return { sound: true, vibrate: true };
      const parsed = JSON.parse(raw);
      return { sound: !parsed || parsed.sound !== false, vibrate: !parsed || parsed.vibrate !== false };
    } catch (e) {
      return { sound: true };
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
    node.textContent = message;
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

  function posLabel(pos) { return pos === 'ortasaha' ? 'Orta saha' : 'Forvet'; }

  function bar(pct, cls) {
    const w = L.clamp(Math.round(pct), 0, 100);
    return '<div class="bar ' + (cls || '') + '"><span style="width:' + w + '%"></span></div>';
  }

  function crest(club) {
    const letter = club && club.name ? club.name.slice(0, 1) : '?';
    const color = club && club.color ? club.color : '#147a34';
    return '<span class="crest" style="background:' + color + '">' + esc(letter) + '</span>';
  }

  function topbar(title) {
    return '<header class="topbar">' +
      '<button type="button" class="iconbtn" data-act="back" aria-label="Geri">←</button>' +
      '<h1>' + esc(title) + '</h1>' +
      '<button type="button" class="iconbtn" data-act="sound">' + (settings.sound ? 'Ses' : 'Sessiz') + '</button>' +
      '</header>';
  }

  function renderTable(rows, userId, tier) {
    const head = '<div class="tr head"><span>#</span><span>Takım</span><span>O</span><span>G</span><span>B</span><span>M</span><span>Av</span><span>P</span></div>';
    const body = rows.map(function (row, index) {
      const club = L.clubById(row.id);
      const name = club ? club.short : 'Takım';
      let zone = '';
      if (tier > 1 && index < 2) zone = 'up';
      if (tier < 4 && index >= rows.length - 2) zone = 'down';
      const me = row.id === userId ? ' me' : '';
      const gd = row.gd != null ? row.gd : row.gf - row.ga;
      const pts = row.pts != null ? row.pts : row.w * 3 + row.d;
      const gdTxt = (gd > 0 ? '+' : '') + gd;
      return '<div class="tr ' + zone + me + '"><span>' + (index + 1) + '</span><span class="tname">' +
        esc(name) + '</span><span>' + row.p + '</span><span>' + row.w + '</span><span>' + row.d +
        '</span><span>' + row.l + '</span><span>' + gdTxt + '</span><span class="pts">' + pts + '</span></div>';
    }).join('');
    let note = 'İlk iki terfi, son iki küme düşer.';
    if (tier <= 1) note = 'Alt iki sıra küme düşer. Üst lig yok.';
    else if (tier >= 4) note = 'İlk iki sıra üst lige çıkar.';
    return '<div class="table">' + head + body + '</div><p class="fine">' + note + '</p>';
  }

  function formPips(form) {
    if (!form || !form.length) return '<span class="muted">Henüz maç yok</span>';
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
      chip = '<div class="save-chip"><span>Kayıtlı kariyer</span><strong>' + esc(saved.player.name) +
        '</strong><span>' + saved.player.age + ' yaş · ' + esc(club ? club.name : '') + '</span></div>';
    }
    return '<div class="page menu-page">' +
      '<div class="hero">' +
      '<svg class="logo-ball" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" fill="#f6f3ea" stroke="#102018" stroke-width="3"/>' +
      '<path fill="#102018" d="M40 26l13.3 9.7-5.1 15.6H31.8l-5.1-15.6z"/></svg>' +
      '<p class="eyebrow">Futbol kariyeri</p>' +
      '<h1 class="logo">Yeşil Saha</h1>' +
      '<p class="lede">16 yaşında amatör takımda başla. Antrenman yap, maçta kaydırarak şut çek, lige tırman.</p>' +
      '</div>' + chip +
      '<div class="stack">' +
      '<button type="button" class="' + (saved ? 'btn gold' : 'btn ghost') + '" data-act="continue"' + (saved ? '' : ' disabled') + '>Devam et</button>' +
      '<button type="button" class="' + (saved ? 'btn' : 'btn gold') + '" data-act="new">Yeni kariyer</button>' +
      '<button type="button" class="btn ghost" data-act="stats">İstatistikler</button>' +
      '<button type="button" class="btn ghost" data-act="help">Nasıl oynanır?</button>' +
      '</div>' +
      '<button type="button" class="textbtn" data-act="sound">' + (settings.sound ? 'Ses açık' : 'Ses kapalı') + '</button>' +
      '<button type="button" class="textbtn" data-act="vibrate">' + (settings.vibrate !== false ? 'Titreşim açık' : 'Titreşim kapalı') + '</button>' +
      '<p class="fine">Kurgusal kulüpler. Ağ gerekmez; kayıt bu cihazda kalır.</p>' +
      '<div class="pitch-footer" aria-hidden="true"></div></div>';
  }

  function pageCreate() {
    const blurb = createPos === 'ortasaha'
      ? 'Pas ve asist senin işin. Vizyonun yüksek başlar, kanat değişir.'
      : 'Ceza sahasında bitirirsin. Hızın ve gücün öne çıkar, gol puanı uçurur.';
    const sheet = confirmWipe
      ? '<div class="sheet-back"><div class="sheet"><h3>Mevcut kariyer silinsin mi?</h3><p>Bu cihazdaki kayıt gider, geri alınmaz.</p>' +
        '<button type="button" class="btn gold" data-act="confirm-start">Sil ve başla</button>' +
        '<button type="button" class="btn ghost" data-act="cancel-wipe">Vazgeç</button></div></div>'
      : '';
    return '<div class="page">' + topbar('Yeni kariyer') +
      '<form id="create-form" class="stack">' +
      '<label class="field" for="isim">Adın</label>' +
      '<input id="isim" maxlength="16" placeholder="Örn. Arda Kaya" autocomplete="name" autocapitalize="words" enterkeyhint="done">' +
      '<p class="field">Mevki</p>' +
      '<div class="seg">' +
      '<button type="button" data-act="pos" data-pos="forvet" class="' + (createPos === 'forvet' ? 'on' : '') + '">Forvet</button>' +
      '<button type="button" data-act="pos" data-pos="ortasaha" class="' + (createPos === 'ortasaha' ? 'on' : '') + '">Orta saha</button>' +
      '</div>' +
      '<p class="helptext">' + blurb + '</p>' +
      '<ul class="facts"><li>Başlangıç yaşı 16</li><li>Amatör Kademe, kurgusal kulüp</li><li>Hız, Güç, Teknik, Vizyon, Frikik</li></ul>' +
      '<button type="submit" class="btn gold">Kariyere başla</button>' +
      '</form>' + sheet + '</div>';
  }

  function statBlock(saved) {
    if (!saved) {
      return '<div class="card empty"><h2>Henüz kariyer yok</h2><p>Yeni kariyerle 16 yaşında bir amatör takıma yazıl.</p>' +
        '<button type="button" class="btn" data-act="new">Yeni kariyer</button></div>';
    }
    const h = saved.history || {};
    const club = L.clubById(saved.clubId);
    const rows = [
      ['Maç', h.matches || 0],
      ['Gol', h.goals || 0],
      ['Asist', h.assists || 0],
      ['Galibiyet', h.wins || 0],
      ['Sezon', h.seasons || 0],
      ['Şampiyonluk', h.titles || 0],
      ['Terfi', h.promotions || 0],
      ['Transfer', h.transfers || 0],
      ['En yüksek puan', h.bestRating ? comma(h.bestRating) : '–'],
      ['Kazanç', L.formatMoney(h.earnings || 0)],
    ];
    const grid = rows.map(function (row) {
      return '<div class="stat"><b>' + esc(String(row[1])) + '</b><span>' + esc(row[0]) + '</span></div>';
    }).join('');
    const history = (saved.clubHistory || []).map(function (item) {
      const c = L.clubById(item.clubId);
      return '<li>Sezon ' + item.season + ' · ' + esc(c ? c.name : 'Kulüp') + ' · ' + esc(L.tierName(item.tier)) + '</li>';
    }).join('');
    return '<div class="card idcard">' + crest(club) + '<div><h2>' + esc(saved.player.name) + '</h2><p>' +
      saved.player.age + ' yaş · ' + posLabel(saved.player.pos) + '<br>' + esc(club ? club.name : '') + ' · ' +
      esc(L.tierName(saved.tier)) + '</p></div></div>' +
      '<div class="statgrid">' + grid + '</div>' +
      (history ? '<h3 class="section">Kulüp geçmişi</h3><ul class="history">' + history + '</ul>' : '') +
      (saved.retired ? '<p class="helptext">Bu kariyer kapandı. İstatistikler duruyor.</p>' : '');
  }

  function pageStats() {
    const saved = state || loadState();
    return '<div class="page">' + topbar('İstatistikler') + statBlock(saved) + '</div>';
  }

  function pageHelp() {
    const steps = [
      ['Hafta', 'Enerjin yettiği kadar antrenman yap. Yorulursan maçta özelliklerin düşer. Dinlen ya da enerji içeceği kullan, sonra maça çık.'],
      ['Şut', 'Topa basılı tutup kaleye kaydır. Yön isabeti, uzunluk güçtür. Soldaki çubuğun altın bölgesi ideal şuttur. Kaleciden uzak köşeyi seç.'],
      ['Pas', 'Pas pozisyonunda beyaz formalı arkadaşa kaydır veya üzerine dokun. Forvet gol kovalar, orta saha asist biriktirir.'],
      ['Kariyer', 'Yüksek puan hocayı, takımı ve taraftarı memnun eder. Form tutunca üst ligden teklif gelir. Sezon sonunda ilk iki terfi eder.'],
      ['Para', 'Maaş her maçtan sonra yatar. Krampon özellik ekler. Araba ve ev yaşam tarzını yükseltir.'],
    ];
    const list = steps.map(function (step) {
      return '<article class="card"><h3>' + step[0] + '</h3><p>' + step[1] + '</p></article>';
    }).join('');
    return '<div class="page">' + topbar('Nasıl oynanır?') + list + '</div>';
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
      inbox = '<div class="sheet-back"><div class="sheet"><p class="eyebrow">Transfer teklifi</p><h3>' +
        esc(offerClub ? offerClub.name : 'Kulüp') + '</h3><p>' + esc(L.tierName(state.inboxOffer.tier)) +
        ' · haftalık ' + L.formatMoney(state.inboxOffer.wage) + '</p><p>Formun konuşuluyor. Ne yapmak istersin?</p>' +
        '<button type="button" class="btn gold" data-act="inbox-now">Hemen katıl</button>' +
        '<button type="button" class="btn" data-act="inbox-later">Sezon sonunda katıl</button>' +
        '<button type="button" class="btn ghost" data-act="inbox-no">Kulüpte kal</button></div></div>';
    }
    const tired = !inbox && askTired
      ? '<div class="sheet-back"><div class="sheet"><h3>Yorgunsun</h3><p>Enerjin düşük. Maçta özelliklerin −' + pen +
        ' düşer. Yine de çıkabilirsin.</p><button type="button" class="btn" data-act="rest">Dinlen</button>' +
        '<button type="button" class="btn gold" data-act="match-force">Yine de çık</button>' +
        '<button type="button" class="btn ghost" data-act="close-tired">Vazgeç</button></div></div>'
      : '';
    return '<div class="page hub">' +
      '<div class="hub-scroll">' +
      '<header class="hub-top"><div><p class="eyebrow">Sezon ' + state.season + ' · Hafta ' + state.week + '/' + state.rounds.length +
      '</p><h1>' + esc(state.player.name) + '</h1><p class="sub">' + state.player.age + ' yaş · ' + posLabel(state.player.pos) +
      ' · ' + L.shirtNumber(state.player.name) + '</p></div>' +
      '<button type="button" class="iconbtn" data-act="sound">' + (settings.sound ? 'Ses' : 'Sessiz') + '</button></header>' +
      '<div class="club-row">' + crest(club) + '<div class="grow"><strong>' + esc(club ? club.name : '') + '</strong><span>' +
      esc(L.tierName(state.tier)) + '</span></div><div class="money"><b>' + L.formatMoney(state.player.money) +
      '</b><small>Maaş ' + L.formatMoney(state.wage) + '</small></div></div>' +
      '<div class="card energy-card"><div class="rel-top"><span>Enerji</span><b>' + state.player.energy + '</b></div>' +
      bar(state.player.energy, pen >= 8 ? 'bad' : pen > 0 ? 'mid' : 'good') +
      (pen > 0 ? '<p class="warn">Yorgunsun. Maçta özelliklerin −' + pen + '.</p>' : '<p class="fine">Ortalama özellik ' + avg + '.</p>') +
      '</div>' +
      '<div class="pips">' + formPips(state.form) + '</div>' +
      '<p class="helptext">' + esc(L.formComment(state.form)) + ' Bu sezon ' + state.seasonGoals + ' gol, ' + state.seasonAssists + ' asist.</p>' +
      (state.news && state.news[0] ? '<p class="news">' + esc(state.news[0]) + '</p>' : '') +
      '<article class="fixture">' +
      '<p class="eyebrow">' + (fix && fix.home ? 'İç saha' : 'Deplasman') + (threat ? ' · ' + esc(threat) : '') + '</p>' +
      '<h2>' + esc(opp ? opp.name : 'Rakip') + '</h2>' +
      '<p>' + esc(opp ? L.tierName(opp.tier) : '') + '</p></article>' +
      '<div class="action-grid">' +
      '<button type="button" class="btn" data-act="train-open">Antrenman</button>' +
      '<button type="button" class="btn" data-act="rest">Dinlen</button>' +
      '<button type="button" class="btn" data-act="drink">İçecek · ' + state.player.drinks + '</button>' +
      '</div>' +
      '<div class="action-grid">' +
      '<button type="button" class="btn ghost" data-act="life">Hayat</button>' +
      '<button type="button" class="btn ghost" data-act="casino">Kumarhane</button>' +
      '<button type="button" class="btn ghost" data-act="cabinet">Kupa dolabı</button>' +
      (state.cup && state.cup.alive && state.cup.playedWeek !== state.week ? '<button type="button" class="btn ghost" data-act="cup">Kupa maçı</button>' : '') +
      (state.europe && state.europe.alive && state.europe.playedWeek !== state.week ? '<button type="button" class="btn ghost" data-act="europe">Kıta kupası</button>' : '') +
      (state.milliInvite ? '<button type="button" class="btn ghost" data-act="milli-open">Milli davet</button>' : '') +
      '</div>' +
      (state.player.injured ? '<p class="warn">Sakatlık: ' + state.player.injured + ' hafta. Dinlen veya maçı kaçır.</p>' : '') +
      '</div>' +
      (state.player.injured
        ? '<button type="button" class="btn gold big" data-act="miss">Maçı kaçır</button>'
        : '<button type="button" class="btn gold big" data-act="match">Maça çık</button>') +
      '<nav class="bottom-nav">' +
      '<button type="button" data-act="table">Lig</button>' +
      '<button type="button" data-act="profile">Profil</button>' +
      '<button type="button" data-act="shop">Mağaza</button>' +
      '</nav>' + inbox + tired + '</div>';
  }

  function pageTrain() {
    const trained = L.trainedAttrs(state);
    const rows = L.ATTRS.map(function (key) {
      const base = state.player.base[key];
      const extra = trained[key] - base;
      const disabled = state.player.energy < L.TRAIN_COST || base >= 99;
      return '<div class="attr"><div class="grow"><b>' + L.ATTR_LABEL[key] + '</b><small>' + base + ' temel' +
        (extra > 0 ? ' · +' + extra + ' ek' : '') + '</small>' + bar(trained[key], 'good') + '</div>' +
        '<button type="button" class="btn tiny" data-act="train" data-attr="' + key + '"' + (disabled ? ' disabled' : '') + '>Çalış</button></div>';
    }).join('');
    return '<div class="page">' + topbar('Antrenman') +
      '<div class="card energy-card"><div class="rel-top"><span>Enerji</span><b>' + state.player.energy + '</b></div>' +
      bar(state.player.energy, state.player.energy < L.TRAIN_COST ? 'bad' : 'good') +
      '<p class="fine">Bir çalışma −' + L.TRAIN_COST + ' enerji. Gençken gelişim daha hızlı.</p></div>' +
      rows +
      '<button type="button" class="btn" data-act="rest">Dinlen</button>' +
      '</div>';
  }

  function pageShop() {
    const boots = L.BOOTS.map(function (item) {
      const on = state.player.boots === item.id;
      return '<article class="shop"><div><h3>' + esc(item.name) + '</h3><p>' + esc(item.blurb) + '</p></div><button type="button" class="btn tiny" data-act="buy" data-item="' + item.id + '"' +
        (on ? ' disabled' : '') + '>' + (on ? 'Takılı' : L.formatMoney(item.price)) + '</button></article>';
    }).join('');
    const life = L.LIFE.map(function (item) {
      const owned = state.player.ownedLife.indexOf(item.id) >= 0;
      return '<article class="shop"><div><h3>' + esc(item.name) + '</h3><p>' + esc(item.blurb) + '</p><p class="fine">Yaşam tarzı +' +
        item.score + '</p></div><button type="button" class="btn tiny" data-act="buy" data-item="' + item.id + '"' +
        (owned ? ' disabled' : '') + '>' + (owned ? 'Sende' : L.formatMoney(item.price)) + '</button></article>';
    }).join('');
    return '<div class="page">' + topbar('Mağaza') +
      '<div class="club-row"><div class="grow"><strong>' + L.formatMoney(state.player.money) + '</strong><span>Çantada ' +
      state.player.drinks + ' enerji içeceği</span></div>' +
      '<button type="button" class="btn tiny" data-act="drink">İç</button></div>' +
      '<h3 class="section">Enerji</h3>' +
      '<article class="shop"><div><h3>Enerji içeceği</h3><p>Maç öncesi bir yudum. Enerji +' + L.DRINK_GAIN + '.</p></div>' +
      '<div class="stack tight">' +
      '<button type="button" class="btn tiny" data-act="buy" data-item="icecek" data-qty="1">' + L.formatMoney(L.DRINK_PRICE) + '</button>' +
      '<button type="button" class="btn tiny" data-act="buy" data-item="icecek" data-qty="3">3’lü ' + L.formatMoney(L.DRINK_PACK) + '</button>' +
      '</div></article>' +
      '<h3 class="section">Krampon</h3><p class="fine">Tek krampon giyilir. Yenisi eskisinin yerini alır, antrenmanla gelen temel bozulmaz.</p>' + boots +
      '<h3 class="section">Yaşam</h3>' + life + '</div>';
  }

  function pageTable() {
    const rows = L.tableSorted(state);
    const items = state.rounds.map(function (round, index) {
      const pair = round.find(function (p) { return p[0] === state.clubId || p[1] === state.clubId; });
      if (!pair) return '';
      const home = pair[0] === state.clubId;
      const opp = L.clubById(home ? pair[1] : pair[0]);
      let tag = 'Sırada';
      if (state.phase === 'season' || index < state.week - 1) tag = 'Oynandı';
      else if (index === state.week - 1) tag = 'Bu hafta';
      return '<li><span>H' + (index + 1) + ' · ' + (home ? 'İç' : 'Dep') + '</span><b>' +
        esc(opp ? opp.short : '') + '</b><em>' + tag + '</em></li>';
    }).join('');
    return '<div class="page">' + topbar('Lig') +
      '<p class="eyebrow">' + esc(L.tierName(state.tier)) + ' · Sezon ' + state.season + '</p>' +
      renderTable(rows, state.clubId, state.tier) +
      '<h3 class="section">Fikstür</h3><ul class="fixtures">' + items + '</ul></div>';
  }

  function pageProfile() {
    const trained = L.trainedAttrs(state);
    const attrs = L.ATTRS.map(function (key) {
      return '<div class="rel"><div class="rel-top"><span>' + L.ATTR_LABEL[key] + '</span><b>' + trained[key] + '</b></div>' +
        bar(trained[key], 'good') + '</div>';
    }).join('');
    const rel = state.player.rel;
    const captain = L.isCaptain(state) ? '<p class="news">Kaptanlık bandı sende. Tüm özellikler +1.</p>' : '';
    const boot = L.BOOTS.find(function (b) { return b.id === state.player.boots; });
    const sheet = askRetire
      ? '<div class="sheet-back"><div class="sheet"><h3>Kariyeri noktalamak istiyor musun?</h3><p>İstatistiklerin kalır, maçlara dönemezsin.</p>' +
        '<button type="button" class="btn danger" data-act="retire-yes">Kramponları as</button>' +
        '<button type="button" class="btn ghost" data-act="retire-no">Devam et</button></div></div>'
      : '';
    return '<div class="page">' + topbar('Profil') +
      '<div class="card idcard">' + crest(L.clubById(state.clubId)) + '<div><h2>' + esc(state.player.name) + '</h2><p>' +
      state.player.age + ' yaş · ' + posLabel(state.player.pos) + ' · No ' + L.shirtNumber(state.player.name) + '<br>' +
      esc(L.tierName(state.tier)) + ' · maaş ' + L.formatMoney(state.wage) + '</p></div></div>' +
      captain +
      '<h3 class="section">Özellikler</h3>' + attrs +
      '<h3 class="section">İlişkiler</h3>' +
      relRow('Teknik direktör', rel.hoca) + relRow('Takım arkadaşları', rel.takim) + relRow('Taraftar', rel.taraftar) +
      '<h3 class="section">Yaşam tarzı</h3>' +
      '<div class="rel"><div class="rel-top"><span>' + (boot ? esc(boot.name) : 'Krampon yok') + '</span><b>' + L.lifestyleScore(state) + '</b></div>' +
      bar(L.lifestyleScore(state), 'mid') + '</div>' +
      '<p class="fine">Kariyer: ' + state.history.goals + ' gol, ' + state.history.assists + ' asist, ' + state.history.matches + ' maç.</p>' +
      '<button type="button" class="btn ghost" data-act="menu">Ana menü</button>' +
      '<button type="button" class="textbtn" data-act="retire">Kariyeri bitir</button>' +
      sheet + '</div>';
  }

  function relRow(label, value) {
    const cls = value >= 70 ? 'good' : value < 35 ? 'bad' : '';
    return '<div class="rel"><div class="rel-top"><span>' + label + '</span><b>' + value + ' · ' + L.moodWord(value) + '</b></div>' +
      bar(value, cls) + '</div>';
  }

  function pageResult() {
    const last = state.lastMatch;
    if (!last) return '<div class="page">' + topbar('Maç') + '<p>Maç bilgisi yok.</p></div>';
    const me = L.clubById(state.clubId);
    const opp = L.clubById(last.oppId);
    const word = last.result === 'win' ? 'Galibiyet' : last.result === 'draw' ? 'Beraberlik' : 'Mağlubiyet';
    const moments = (last.moments || []).map(function (m) {
      return '<li><b>' + m.minute + "'</b> " + esc(m.text) + '</li>';
    }).join('');
    return '<div class="page">' +
      '<p class="eyebrow">Hafta ' + last.week + ' · ' + (last.home ? 'İç saha' : 'Deplasman') + '</p>' +
      '<h1 class="result-word ' + last.result + '">' + word + '</h1>' +
      '<div class="scorebig"><div><span>' + esc(me ? me.short : '') + '</span><strong>' + last.us + '</strong></div>' +
      '<div><span>' + esc(opp ? opp.short : '') + '</span><strong>' + last.them + '</strong></div></div>' +
      '<div class="rating">Puan <b>' + comma(last.rating) + '</b></div>' +
      '<div class="statgrid two">' +
      '<div class="stat"><b>' + last.goals + '</b><span>Gol</span></div>' +
      '<div class="stat"><b>' + last.assists + '</b><span>Asist</span></div></div>' +
      '<div class="card">' +
      relDelta('Teknik direktör', last.deltas.hoca) +
      relDelta('Takım arkadaşları', last.deltas.takim) +
      relDelta('Taraftar', last.deltas.taraftar) +
      '<p class="fine">Kasaya +' + L.formatMoney(last.earn).replace('₺', '') + '₺ · maaş, prim ve gol.</p></div>' +
      (moments ? '<ul class="moments">' + moments + '</ul>' : '') +
      '<button type="button" class="btn gold" data-act="result-next">Devam</button></div>';
  }

  function relDelta(label, value) {
    const cls = value > 0 ? 'up' : value < 0 ? 'down' : '';
    return '<div class="rel-top"><span>' + label + '</span><b class="' + cls + '">' + signed(value) + '</b></div>';
  }

  function pageSeason() {
    const review = state.review;
    if (!review) return '<div class="page"><p>Sezon özeti yok.</p><button class="btn" data-act="season-next">Devam</button></div>';
    const decline = review.decline && review.decline.length
      ? '<p class="warn">Yaş aldın. ' + review.decline.join(' ve ') + ' bir puan geriledi.</p>' : '';
    const award = review.award ? '<p class="news">' + esc(review.award) + ' oldun.</p>' : '';
    const prize = review.prize ? '<p class="helptext">Sezon primi ' + L.formatMoney(review.prize) + '.</p>' : '';
    let offers = '';
    if (!review.retired && state.offers && state.offers.length) {
      offers = state.offers.map(function (offer) {
        const club = L.clubById(offer.clubId);
        const agreed = state.agreedOffer && state.agreedOffer.id === offer.id;
        return '<article class="shop offer"><div><h3>' + esc(club ? club.name : 'Kulüp') + '</h3><p>' +
          esc(L.tierName(offer.tier)) + ' · ' + L.formatMoney(offer.wage) + ' / hafta</p>' +
          (agreed ? '<p class="news">Anlaştın</p>' : '') + '</div>' +
          (agreed
            ? '<button type="button" class="btn tiny ghost" data-act="offer-no" data-id="' + esc(offer.id) + '">Vazgeç</button>'
            : '<div class="stack tight"><button type="button" class="btn tiny" data-act="offer-yes" data-id="' + esc(offer.id) + '">Kabul et</button>' +
              '<button type="button" class="btn tiny ghost" data-act="pazarlik" data-id="' + esc(offer.id) + '">Pazarlık</button>' +
              '<button type="button" class="btn tiny ghost" data-act="offer-no" data-id="' + esc(offer.id) + '">Reddet</button></div>') +
          '</article>';
      }).join('');
    } else if (!review.retired) {
      offers = '<div class="card empty"><p>Bu yaz üst ligden ses çıkmadı. Kulübün seninle devam etmek istiyor.</p></div>';
    }
    const nextLabel = review.retired ? 'Kariyeri kapat' : (state.agreedOffer ? 'Yeni kulübünle başla' : 'Yeni sezona geç');
    return '<div class="page">' +
      '<p class="eyebrow">Sezon ' + review.season + ' bitti</p>' +
      '<h1 class="logo small">' + esc(review.headline) + '</h1>' +
      '<p class="helptext">Sıra ' + review.rank + ' · ' + review.goals + ' gol, ' + review.assists + ' asist. Yaşın ' + review.age + ' oldu.</p>' +
      award + prize + decline +
      renderTable(review.table, review.clubId, review.tierBefore) +
      (review.retired ? '<p class="news">Bedenin artık profesyonel tempoya yetişmiyor. Kariyerin burada kapanıyor.</p>' : '<h3 class="section">Teklifler</h3>' + offers) +
      '<button type="button" class="btn gold" data-act="season-next">' + nextLabel + '</button></div>';
  }

  let talk = null;

  function pagePazarlik() {
    if (!talk) return '<div class="page">' + topbar('Pazarlık') + '<p>Açık teklif yok.</p></div>';
    const club = L.clubById(talk.clubId);
    return '<div class="page">' + topbar('Pazarlık') +
      '<h2>' + esc(club ? club.name : 'Kulüp') + '</h2>' +
      '<p class="helptext">İsteklerin yüksekse kulüp karşı teklif yapar ya da masadan kalkar.</p>' +
      '<div class="card"><div class="rel-top"><span>Maaş</span><b>' + L.formatMoney(talk.wage) + '</b></div>' +
      '<div class="action-grid"><button type="button" class="btn tiny" data-act="talk" data-key="wage" data-dir="-1">−</button>' +
      '<button type="button" class="btn tiny" data-act="talk" data-key="wage" data-dir="1">+</button></div></div>' +
      '<div class="card"><div class="rel-top"><span>İmza parası</span><b>' + L.formatMoney(talk.bonus || 0) + '</b></div>' +
      '<div class="action-grid"><button type="button" class="btn tiny" data-act="talk" data-key="bonus" data-dir="-1">−</button>' +
      '<button type="button" class="btn tiny" data-act="talk" data-key="bonus" data-dir="1">+</button></div></div>' +
      '<div class="card"><div class="rel-top"><span>Süre</span><b>' + (talk.years || 2) + ' yıl</b></div>' +
      '<div class="action-grid"><button type="button" class="btn tiny" data-act="talk" data-key="years" data-dir="-1">−</button>' +
      '<button type="button" class="btn tiny" data-act="talk" data-key="years" data-dir="1">+</button></div></div>' +
      '<div class="card"><div class="rel-top"><span>Gol bonusu</span><b>' + L.formatMoney(talk.goalBonus || 0) + '</b></div>' +
      '<div class="action-grid"><button type="button" class="btn tiny" data-act="talk" data-key="goalBonus" data-dir="-1">−</button>' +
      '<button type="button" class="btn tiny" data-act="talk" data-key="goalBonus" data-dir="1">+</button></div></div>' +
      '<button type="button" class="btn gold" data-act="talk-send">Teklifi götür</button>' +
      (talk.counter ? '<button type="button" class="btn" data-act="talk-take">Karşı teklifi kabul et</button>' : '') +
      '</div>';
  }

  function pageCasino() {
    return '<div class="page">' + topbar('Kumarhane') +
      '<p class="helptext">Kasa ' + L.formatMoney(state.player.money) + '. Kumar eğlencedir, maaşın asıl kaynaktır.</p>' +
      '<article class="card"><h3>Slot</h3><p>Üçlü aynı sembol öder.</p>' +
      '<button type="button" class="btn" data-act="slot" data-bet="50">50₺ çevir</button></article>' +
      '<article class="card"><h3>Rulet</h3><p>Kırmızı ya da siyah. Sıfır kasanın.</p>' +
      '<div class="action-grid"><button type="button" class="btn" data-act="rulet" data-pick="kirmizi">Kırmızı 50₺</button>' +
      '<button type="button" class="btn" data-act="rulet" data-pick="siyah">Siyah 50₺</button></div></article>' +
      '<article class="card"><h3>Blackjack</h3><p>17’de dur. Krupiye de 17’de durur.</p>' +
      '<button type="button" class="btn" data-act="bj" data-bet="50">50₺ el</button></article></div>';
  }

  function pageLife() {
    L.migrate(state);
    const love = state.player.partner;
    const gifts = (L.GIFTS || []).map(function (g) {
      return '<button type="button" class="btn" data-act="gift" data-id="' + g.id + '">' + esc(g.name) + ' · ' + L.formatMoney(g.price) + '</button>';
    }).join('');
    const sponsors = (L.SPONSORS || []).map(function (s) {
      const on = state.player.sponsor && state.player.sponsor.id === s.id;
      return '<article class="shop"><div><h3>' + esc(s.name) + '</h3><p>' + esc(s.blurb) + ' · ' + L.formatMoney(s.pay) + '/hf</p></div>' +
        '<button type="button" class="btn tiny" data-act="sponsor" data-id="' + s.id + '"' + (on ? ' disabled' : '') + '>' + (on ? 'Aktif' : 'İmzala') + '</button></article>';
    }).join('');
    return '<div class="page">' + topbar('Hayat') +
      '<div class="card"><div class="rel-top"><span>Moral</span><b>' + state.player.morale + '</b></div>' + bar(state.player.morale, 'mid') +
      '<p class="fine">Sözleşme ' + (state.player.contractYears || 0) + ' yıl · gol bonusu ' + L.formatMoney(state.player.goalBonus || 0) + '</p></div>' +
      '<h3 class="section">Sevgili</h3>' +
      (love
        ? '<div class="card"><div class="rel-top"><span>' + esc(love.name) + '</span><b>' + love.love + '</b></div>' + bar(love.love, 'good') + '</div>' +
          '<button type="button" class="btn" data-act="date">Akşam çık · 180₺</button>' + gifts
        : '<button type="button" class="btn gold" data-act="meet">Biriyle tanış · 120₺</button>') +
      '<h3 class="section">Sponsorluk</h3>' + sponsors +
      '<button type="button" class="btn ghost" data-act="renew">Kulüple sözleşme yenile</button>' +
      (state.milliInvite ? '<button type="button" class="btn" data-act="milli-open">Milli davet var</button>' : '') +
      '</div>';
  }

  function pageCabinet() {
    L.migrate(state);
    const cups = (state.trophies || []).map(function (t) {
      return '<li><b>' + esc(t.name) + '</b><span>Sezon ' + t.season + '</span></li>';
    }).join('');
    const hist = (state.seasonHistory || []).map(function (h) {
      const club = L.clubById(h.clubId);
      return '<li><b>S' + h.season + ' ' + esc(club ? club.short : '') + '</b><span>' + h.rank + '. · ' + h.goals + ' gol</span></li>';
    }).join('');
    const m = state.milli || { caps: 0, goals: 0 };
    return '<div class="page">' + topbar('Kupa dolabı') +
      '<div class="statgrid"><div class="stat"><b>' + (state.trophies || []).length + '</b><span>Kupa</span></div>' +
      '<div class="stat"><b>' + m.caps + '</b><span>Milli maç</span></div>' +
      '<div class="stat"><b>' + state.history.goals + '</b><span>Kariyer golü</span></div>' +
      '<div class="stat"><b>' + state.history.assists + '</b><span>Kariyer asisti</span></div></div>' +
      '<h3 class="section">Kupalar</h3>' + (cups ? '<ul class="fixtures">' + cups + '</ul>' : '<p class="fine">Vitrin boş. Sezonu şampiyon bitir.</p>') +
      '<h3 class="section">Sezonlar</h3>' + (hist ? '<ul class="fixtures">' + hist + '</ul>' : '<p class="fine">İlk sezonun sürüyor.</p>') +
      '</div>';
  }

  function pageMilli() {
    L.migrate(state);
    const inv = state.milliInvite;
    return '<div class="page">' + topbar('Milli takım') +
      '<h2>' + (inv ? 'Davetlisin' : 'Şimdilik yok') + '</h2>' +
      '<p class="helptext">' + (inv ? esc(inv.foe) + ' ile hazırlık maçı. Forma, taraftarı coşturur.' : 'Formun yükselince telefon gelir.') + '</p>' +
      '<p class="fine">Milli maç ' + ((state.milli && state.milli.caps) || 0) + ' · gol ' + ((state.milli && state.milli.goals) || 0) + '</p>' +
      (inv ? '<button type="button" class="btn gold" data-act="milli-play">Formayı giy</button><button type="button" class="btn ghost" data-act="milli-no">Bu seferlik hayır</button>' : '') +
      '</div>';
  }

  function pageRetired() {
    return '<div class="page">' + topbar('Kariyer bitti') + statBlock(state) +
      '<button type="button" class="btn gold" data-act="new">Yeni kariyer</button></div>';
  }

  function pageMatch() {
    const pen = state.live ? state.live.tiredPen : 0;
    return '<div class="match">' +
      '<header class="match-hud"><div><div id="match-score" class="match-score">Maç</div>' +
      '<div class="match-meta"><strong id="match-minute"></strong> <span id="match-sub"></span></div>' +
      (pen >= 8 ? '<p class="warn tight">Yorgunluk −' + pen + '</p>' : '') +
      '</div><button type="button" class="iconbtn" data-act="sound">' + (settings.sound ? 'Ses' : 'Sessiz') + '</button></header>' +
      '<div class="pitch-wrap"><canvas id="pitch" aria-label="Maç sahası. Şut için topu kaleye kaydır."></canvas></div>' +
      '<p id="match-hint">Topa basılı tutup hedefe kaydır.</p>' +
      '<button type="button" id="match-next" class="btn gold" data-act="match-next" hidden>Devam</button>' +
      '</div>';
  }

  function htmlFor(name) {
    if (name === 'menu') return pageMenu();
    if (name === 'create') return pageCreate();
    if (name === 'stats') return pageStats();
    if (name === 'help') return pageHelp();
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
          node.textContent = settings.sound ? 'Ses' : 'Sessiz';
        });
      } else go(view);
      return;
    }
    if (act === 'back') { go(backStack.pop() || 'menu'); return; }
    if (act === 'new') { confirmWipe = false; draftName = ''; go('create', 'menu'); return; }
    if (act === 'stats') { go('stats', view === 'menu' ? 'menu' : view); return; }
    if (act === 'help') { go('help', view); return; }
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

  function boot() {
    const screen = document.getElementById('screen');
    screen.addEventListener('click', onClick);
    screen.addEventListener('submit', onSubmit);
    screen.addEventListener('input', onInput);
    window.YESIL = {
      animSpeed: 1,
      getState: function () { return state; },
      getView: function () { return view; },
      getMatch: function () { return matchView; },
    };
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function () {});
      });
    }
    go('menu');
  }

  if (!L || !window.YSMatch) {
    const screen = document.getElementById('screen');
    if (screen) screen.textContent = 'Oyun dosyaları eksik. Sayfayı yenile.';
    return;
  }
  boot();
})();
