/* Yeşil Saha — kariyer kuralları. DOM yok; tarayıcı ve Node aynı dosyayı kullanır. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.YSLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 1;
  const LOG_W = 360;
  const LOG_H = 600;
  const GOAL = Object.freeze({ x: 102, y: 40, w: 156, h: 26 });
  const POWER_SCALE = 2.25;
  const TRAIN_COST = 26;
  const DRINK_PRICE = 200;
  const DRINK_PACK = 520;
  const DRINK_GAIN = 40;

  const ATTRS = ['hiz', 'guc', 'teknik', 'vizyon', 'frikik'];
  const ATTR_LABEL = {
    hiz: 'Hız',
    guc: 'Güç',
    teknik: 'Teknik',
    vizyon: 'Vizyon',
    frikik: 'Frikik',
  };

  const TIERS = {
    1: 'Yıldız Lig',
    2: 'Anadolu Lig',
    3: 'Bölgesel Lig',
    4: 'Amatör Kademe',
  };

  const CLUBS = [
    { id: 'bogazici', name: 'Boğaziçi Yıldız', short: 'Boğaziçi', tier: 1, strength: 90, color: '#2f6fed' },
    { id: 'marmara', name: 'Marmara Kartal', short: 'M. Kartal', tier: 1, strength: 88, color: '#d23b3b' },
    { id: 'boynuz', name: 'Altın Boynuz', short: 'A. Boynuz', tier: 1, strength: 86, color: '#e0a106' },
    { id: 'baskent', name: 'Başkent Gücü', short: 'Başkent', tier: 1, strength: 85, color: '#8b3d8b' },
    { id: 'ege', name: 'Ege Fırtınası', short: 'Ege', tier: 1, strength: 84, color: '#1493b8' },
    { id: 'simsek', name: 'Karadeniz Şimşek', short: 'Şimşek', tier: 1, strength: 83, color: '#1f8a4c' },
    { id: 'vadi', name: 'Vadi Spor', short: 'Vadi', tier: 1, strength: 82, color: '#6a8f2a' },
    { id: 'kule', name: 'Kule FK', short: 'Kule', tier: 1, strength: 81, color: '#c4622d' },
    { id: 'kapadokya', name: 'Kapadokya Birlik', short: 'Kapadokya', tier: 2, strength: 78, color: '#d4652f' },
    { id: 'toros', name: 'Toros Kartalı', short: 'Toros', tier: 2, strength: 76, color: '#b4532a' },
    { id: 'poyraz', name: 'Poyraz Spor', short: 'Poyraz', tier: 2, strength: 75, color: '#1d7eb5' },
    { id: 'meric', name: 'Meriç Yıldızı', short: 'Meriç', tier: 2, strength: 74, color: '#3457d5' },
    { id: 'icanadolu', name: 'İç Anadolu FK', short: 'İç Anadolu', tier: 2, strength: 73, color: '#c49214' },
    { id: 'sahil', name: 'Sahil Birliği', short: 'Sahil', tier: 2, strength: 72, color: '#0f8f86' },
    { id: 'bozkurt', name: 'Bozkurt SK', short: 'Bozkurt', tier: 2, strength: 71, color: '#4b5563' },
    { id: 'harman', name: 'Harman Spor', short: 'Harman', tier: 2, strength: 70, color: '#a36b12' },
    { id: 'bozkir', name: 'Bozkır SK', short: 'Bozkır', tier: 3, strength: 66, color: '#8a8175' },
    { id: 'yayla', name: 'Yayla Gençlik', short: 'Yayla', tier: 3, strength: 65, color: '#2f9e4f' },
    { id: 'dere', name: 'Dereboyu FK', short: 'Dereboyu', tier: 3, strength: 64, color: '#2178a8' },
    { id: 'zeytin', name: 'Zeytinli Spor', short: 'Zeytinli', tier: 3, strength: 63, color: '#7aa318' },
    { id: 'kopru', name: 'Köprübaşı SK', short: 'Köprübaşı', tier: 3, strength: 62, color: '#c47b18' },
    { id: 'ruzgar', name: 'Rüzgâr Gençlik', short: 'Rüzgâr', tier: 3, strength: 61, color: '#1a8ec4' },
    { id: 'ova', name: 'Ova Spor', short: 'Ova', tier: 3, strength: 60, color: '#d4a017' },
    { id: 'serin', name: 'Serintepe FK', short: 'Serintepe', tier: 3, strength: 59, color: '#1aa0a0' },
    { id: 'cayir', name: 'Çayır SK', short: 'Çayır', tier: 4, strength: 58, color: '#3cb35a' },
    { id: 'degirmen', name: 'Değirmen FK', short: 'Değirmen', tier: 4, strength: 57, color: '#c4842a' },
    { id: 'tarla', name: 'Tarla Gençlik', short: 'Tarla', tier: 4, strength: 56, color: '#6b9a1e' },
    { id: 'sokak', name: 'Sokak Birliği', short: 'Sokak', tier: 4, strength: 55, color: '#e06a22' },
    { id: 'bahce', name: 'Bahçe Spor', short: 'Bahçe', tier: 4, strength: 54, color: '#d23d78' },
    { id: 'kavak', name: 'Kavakaltı FK', short: 'Kavakaltı', tier: 4, strength: 53, color: '#7da318' },
    { id: 'patika', name: 'Patika Spor', short: 'Patika', tier: 4, strength: 52, color: '#8d8478' },
    { id: 'iskele', name: 'İskele Gençlik', short: 'İskele', tier: 4, strength: 51, color: '#2a6fdb' },
  ];

  const CLUB_MAP = Object.create(null);
  CLUBS.forEach(function (c) { CLUB_MAP[c.id] = c; });

  const BOOTS = [
    { id: 'plastik', name: 'Plastik krampon', price: 450, bonus: { teknik: 2 }, blurb: 'Mahalle sahasının emektarı. Teknik +2.' },
    { id: 'cim', name: 'Çim kramponu', price: 1900, bonus: { hiz: 3, teknik: 1 }, blurb: 'Islak çimde tutar. Hız +3, Teknik +1.' },
    { id: 'pro', name: 'Profesyonel krampon', price: 7800, bonus: { teknik: 3, frikik: 3, guc: 2 }, blurb: 'Maç günü ayakkabısı. Teknik +3, Frikik +3, Güç +2.' },
    { id: 'yildiz', name: 'Yıldız kramponu', price: 26000, bonus: { hiz: 3, teknik: 4, vizyon: 2 }, blurb: 'Işıltılı deri. Hız +3, Teknik +4, Vizyon +2.' },
  ];

  const LIFE = [
    { id: 'hatchback', name: 'İkinci el araba', price: 9000, score: 12, blurb: 'Mahallede selamın sabahın değişir.' },
    { id: 'sedan', name: 'Spor sedan', price: 48000, score: 28, blurb: 'Taraftar kapıda fotoğraf ister.' },
    { id: 'studio', name: 'Stüdyo daire', price: 95000, score: 22, blurb: 'Kendi anahtarın, kendi düzenin.' },
    { id: 'villa', name: 'Deniz manzaralı ev', price: 280000, score: 40, blurb: 'Sezon bitince balkon seni bekler.' },
  ];

  const OUTCOMES = {
    goal: { banner: 'GOL!', detail: 'Ağlar sallanıyor!' },
    save: { banner: 'Kurtarış', detail: 'Kaleci uzandı, topu çıkardı.' },
    wide: { banner: 'Aut', detail: 'Yanından gitti.' },
    over: { banner: 'Üstten', detail: 'Fazla sert, üstten aut.' },
    weak: { banner: 'Zayıf', detail: 'Kaleci rahatça tuttu.' },
    wall: { banner: 'Baraj', detail: 'Duvar kapatmış.' },
    scuff: { banner: 'Boş', detail: 'Kötü temas, top gitmedi.' },
    assist: { banner: 'ASİST!', detail: 'Pasın golle bitti!' },
    pass: { banner: 'Pas tamam', detail: 'Top arkadaşında kaldı.' },
    cut: { banner: 'Kesildi', detail: 'Rakip pasın arasına girdi.' },
    off: { banner: 'Sapma', detail: 'Pas arkadaşından uzak düştü.' },
    power: { banner: 'Doz kaçtı', detail: 'Pas ya çok sert ya çok yumuşak.' },
  };

  const SHOTS = [
    { ball: [180, 286], gk: [214, 56], defs: [[124, 214], [236, 206], [176, 176]], mate: [308, 250], close: true, advanced: false },
    { ball: [74, 312], gk: [168, 56], defs: [[132, 236], [196, 258]], mate: [246, 220], close: true, advanced: true },
    { ball: [286, 318], gk: [148, 56], defs: [[230, 240], [168, 268]], mate: [116, 246], close: true, advanced: false },
    { ball: [180, 430], gk: [180, 56], defs: [[136, 330], [226, 312], [180, 250]], mate: [304, 360], close: false, advanced: false },
    { ball: [146, 236], gk: [228, 56], defs: [[198, 188], [108, 198]], mate: [274, 210], close: true, advanced: true },
    { ball: [210, 360], gk: [156, 56], defs: [[160, 280], [250, 300]], mate: [84, 300], close: false, advanced: false },
  ];

  const PASSES = [
    { ball: [150, 410], gk: [180, 56], defs: [[86, 340], [196, 470]], mate: [252, 268], close: false, advanced: true },
    { ball: [68, 372], gk: [196, 56], defs: [[150, 470]], mate: [248, 318], close: false, advanced: true },
    { ball: [206, 300], gk: [170, 56], defs: [[150, 210], [250, 236]], mate: [96, 392], close: true, advanced: false },
    { ball: [120, 450], gk: [188, 56], defs: [[210, 360], [70, 300]], mate: [250, 300], close: false, advanced: true },
  ];

  const FKS = [
    { ball: [180, 478], gk: [196, 56], defs: [], wall: [[154, 214], [182, 208], [212, 214]], mate: [304, 390], close: false, advanced: false },
    { ball: [112, 456], gk: [150, 56], defs: [], wall: [[148, 206], [176, 200], [206, 208]], mate: [286, 360], close: false, advanced: false },
    { ball: [246, 470], gk: [210, 56], defs: [], wall: [[156, 210], [186, 204], [216, 210]], mate: [78, 380], close: false, advanced: false },
  ];

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function average(nums) {
    if (!nums || !nums.length) return 0;
    let s = 0;
    for (let i = 0; i < nums.length; i++) s += nums[i];
    return s / nums.length;
  }

  function formatMoney(n) {
    const v = Math.round(Number(n) || 0);
    const sign = v < 0 ? '-' : '';
    const body = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return sign + body + '₺';
  }

  function moodWord(n) {
    if (n >= 80) return 'Harika';
    if (n >= 60) return 'İyi';
    if (n >= 40) return 'Normal';
    if (n >= 25) return 'Kırgın';
    return 'Kötü';
  }

  function rngNext(state) {
    let a = state.rng >>> 0;
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    state.rng = a >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function validateName(name) {
    const n = String(name == null ? '' : name).trim();
    if (n.length < 2) return 'Adın en az 2 karakter olsun.';
    if (n.length > 16) return 'Adın en fazla 16 karakter olsun.';
    if (!/^[\p{L}\p{M}0-9 .'-]+$/u.test(n)) return 'Bu adda desteklenmeyen bir karakter var.';
    return '';
  }

  function clubById(id) { return CLUB_MAP[id] || null; }
  function tierName(tier) { return TIERS[tier] || 'Lig'; }

  function shirtNumber(name) {
    let h = 7;
    const s = String(name || 'X');
    for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    return (h % 24) + 7;
  }

  function isCaptain(state) {
    const r = state.player.rel;
    return r.takim >= 76 && r.taraftar >= 70 && r.hoca >= 64;
  }

  function lifestyleScore(state) {
    let s = 0;
    const owned = state.player.ownedLife || [];
    for (let i = 0; i < LIFE.length; i++) {
      if (owned.indexOf(LIFE[i].id) >= 0) s += LIFE[i].score;
    }
    return clamp(s, 0, 100);
  }

  function trainedAttrs(state) {
    const a = {
      hiz: state.player.base.hiz,
      guc: state.player.base.guc,
      teknik: state.player.base.teknik,
      vizyon: state.player.base.vizyon,
      frikik: state.player.base.frikik,
    };
    const boot = BOOTS.find(function (b) { return b.id === state.player.boots; });
    if (boot) {
      for (let i = 0; i < ATTRS.length; i++) {
        const k = ATTRS[i];
        if (boot.bonus[k]) a[k] = Math.min(99, a[k] + boot.bonus[k]);
      }
    }
    if (isCaptain(state)) {
      for (let i = 0; i < ATTRS.length; i++) a[ATTRS[i]] = Math.min(99, a[ATTRS[i]] + 1);
    }
    return a;
  }

  function energyPenalty(state) {
    const e = state.player.energy;
    if (e >= 65) return 0;
    if (e >= 40) return 3;
    if (e >= 25) return 8;
    return 13;
  }

  function matchAttrs(state) {
    const a = trainedAttrs(state);
    const p = energyPenalty(state);
    for (let i = 0; i < ATTRS.length; i++) a[ATTRS[i]] = Math.max(1, a[ATTRS[i]] - p);
    return a;
  }

  function userStrength(state) {
    const a = trainedAttrs(state);
    const avg = (a.hiz + a.guc + a.teknik + a.vizyon + a.frikik) / 5;
    const rel = (state.player.rel.takim + state.player.rel.hoca) / 2;
    return 30 + avg * 0.62 + rel * 0.12;
  }

  function threatLabel(us, them) {
    const d = them - us;
    if (d > 10) return 'Rakip favori';
    if (d > 4) return 'Rakip bir adım önde';
    if (d > -4) return 'Dengeli maç';
    if (d > -10) return 'Hafif favorisin';
    return 'Favorisin';
  }

  function formComment(form) {
    if (!form || !form.length) return 'İlk maçın seni bekliyor.';
    const avg = average(form);
    if (avg >= 8) return 'Formun ateş gibi. Kulüpler seni izliyor.';
    if (avg >= 7) return 'İyi bir seri. Hoca güveniyor.';
    if (avg >= 6) return 'İdare eder bir form grafiği.';
    return 'Formun düştü. Antrenman ve dinlenme şart.';
  }

  function addNews(state, text) {
    state.news.unshift(text);
    if (state.news.length > 6) state.news.length = 6;
  }

  function noteClub(state) {
    const last = state.clubHistory[state.clubHistory.length - 1];
    if (!last || last.clubId !== state.clubId || last.season !== state.season || last.tier !== state.tier) {
      state.clubHistory.push({ season: state.season, clubId: state.clubId, tier: state.tier });
    }
  }

  function roundRobin(ids) {
    const arr = ids.slice();
    const n = arr.length;
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) {
        let a = arr[i];
        let b = arr[n - 1 - i];
        if ((r + i) % 2 === 1) {
          const tmp = a;
          a = b;
          b = tmp;
        }
        pairs.push([a, b]);
      }
      rounds.push(pairs);
      const fixed = arr[0];
      const moved = arr.slice(1);
      moved.unshift(moved.pop());
      arr.length = 0;
      arr.push.apply(arr, [fixed].concat(moved));
    }
    return rounds;
  }

  function clubsForTier(tier, userClubId) {
    const presets = CLUBS.filter(function (c) { return c.tier === tier; }).map(function (c) { return c.id; });
    if (presets.indexOf(userClubId) >= 0) return presets;
    const next = presets.slice();
    next[next.length - 1] = userClubId;
    return next;
  }

  function setupSeason(state) {
    const ids = clubsForTier(state.tier, state.clubId);
    state.leagueIds = ids;
    state.rounds = roundRobin(ids);
    state.table = ids.map(function (id) {
      return { id: id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    });
  }

  function emptyHistory() {
    return {
      matches: 0, goals: 0, assists: 0,
      wins: 0, draws: 0, losses: 0,
      seasons: 0, titles: 0, promotions: 0, relegations: 0,
      transfers: 0, bestRating: 0, earnings: 0,
    };
  }

  function createCareer(opts) {
    opts = opts || {};
    const nameErr = validateName(opts.name);
    if (nameErr) return null;
    const pos = opts.pos === 'ortasaha' ? 'ortasaha' : 'forvet';
    const tier = [1, 2, 3, 4].indexOf(opts.tier) >= 0 ? opts.tier : 4;
    let seed = opts.seed;
    if (seed == null || seed === '') seed = (Math.random() * 0xffffffff) >>> 0;
    const state = {
      v: VERSION,
      rng: seed >>> 0,
      season: 1,
      week: 1,
      phase: 'hub',
      tier: tier,
      clubId: '',
      wage: 340,
      leagueIds: [],
      rounds: [],
      table: [],
      player: {
        name: String(opts.name).trim(),
        pos: pos,
        age: 16,
        base: { hiz: 40, guc: 40, teknik: 40, vizyon: 40, frikik: 40 },
        energy: 86,
        money: 220,
        boots: null,
        ownedLife: [],
        drinks: 0,
        rel: { hoca: 50, takim: 48, taraftar: 44 },
      },
      form: [],
      seasonRatings: [],
      seasonGoals: 0,
      seasonAssists: 0,
      history: emptyHistory(),
      news: [],
      clubHistory: [],
      lastMatch: null,
      review: null,
      offers: [],
      inboxOffer: null,
      agreedOffer: null,
      afterResult: null,
      live: null,
      restedThisWeek: false,
      sawTutorial: false,
      retired: false,
    };
    const pool = CLUBS.filter(function (c) { return c.tier === tier; });
    const club = pool[Math.floor(rngNext(state) * pool.length)];
    state.clubId = club.id;
    const wageBase = { 1: 7500, 2: 2400, 3: 820, 4: 340 }[tier];
    state.wage = wageBase + Math.floor(rngNext(state) * 8) * 10;
    const j = function () { return Math.floor(rngNext(state) * 5) - 2; };
    if (pos === 'forvet') {
      state.player.base = {
        hiz: 47 + j(), guc: 45 + j(), teknik: 41 + j(), vizyon: 35 + j(), frikik: 37 + j(),
      };
    } else {
      state.player.base = {
        hiz: 42 + j(), guc: 39 + j(), teknik: 45 + j(), vizyon: 49 + j(), frikik: 35 + j(),
      };
    }
    state.player.rel.hoca = 48 + Math.floor(rngNext(state) * 7);
    state.player.rel.takim = 46 + Math.floor(rngNext(state) * 7);
    state.player.rel.taraftar = 42 + Math.floor(rngNext(state) * 7);
    setupSeason(state);
    noteClub(state);
    if (tier === 4) addNews(state, club.name + ' ile ilk sezonun. Her gol, bir adım.');
    else addNews(state, tierName(tier) + ' macerası başlıyor.');
    return state;
  }

  function train(state, attr) {
    if (ATTRS.indexOf(attr) < 0) return { ok: false, message: 'Bu antrenman yok.' };
    if (state.retired) return { ok: false, message: 'Kariyerin kapandı.' };
    if (state.player.energy < TRAIN_COST) return { ok: false, message: 'Enerjin yetmiyor. Dinlen veya içecek kullan.' };
    const base = state.player.base[attr];
    if (base >= 99) return { ok: false, message: 'Bu özellik tavan yaptı.' };
    state.player.energy -= TRAIN_COST;
    const age = state.player.age;
    let gain = 1;
    if (age >= 34) gain = rngNext(state) < 0.35 ? 1 : 0;
    else if (age >= 30) gain = rngNext(state) < 0.62 ? 1 : 0;
    else {
      gain = 1;
      const roll = rngNext(state);
      if (age <= 19 && roll < 0.5) gain = 2;
      else if (age <= 23 && roll < 0.22) gain = 2;
    }
    if (base >= 85 && gain > 0 && rngNext(state) < 0.55) gain = Math.max(0, gain - 1);
    if (base >= 93 && gain > 1) gain = 1;
    if (state.player.rel.hoca >= 72 && gain > 0 && rngNext(state) < 0.3) gain += 1;
    gain = Math.max(0, Math.min(gain, 99 - base));
    state.player.base[attr] += gain;
    if (gain > 0) state.player.rel.hoca = clamp(state.player.rel.hoca + 1, 0, 100);
    const label = ATTR_LABEL[attr];
    const message = gain === 0
      ? label + ' çalıştın ama bugün gelişim gelmedi.'
      : label + ' +' + gain + '.';
    return { ok: true, message: message, gain: gain };
  }

  function rest(state) {
    if (state.retired) return { ok: false, message: 'Kariyerin kapandı.' };
    if (state.player.energy >= 100) return { ok: false, message: 'Enerjin zaten dolu.' };
    const gain = state.restedThisWeek ? 22 : 42;
    const before = state.player.energy;
    state.player.energy = clamp(before + gain, 0, 100);
    state.restedThisWeek = true;
    return { ok: true, message: 'Dinlendin. Enerji +' + (state.player.energy - before) + '.' };
  }

  function buy(state, itemId, qty) {
    if (state.retired) return { ok: false, message: 'Kariyerin kapandı.' };
    if (itemId === 'icecek') {
      const n = qty === 3 ? 3 : 1;
      const price = n === 3 ? DRINK_PACK : DRINK_PRICE;
      if (state.player.money < price) return { ok: false, message: 'Yetersiz bakiye.' };
      state.player.money -= price;
      state.player.drinks += n;
      return { ok: true, message: n === 3 ? 'Üç enerji içeceği çantanda.' : 'Enerji içeceği alındı.' };
    }
    const boot = BOOTS.find(function (b) { return b.id === itemId; });
    if (boot) {
      if (state.player.boots === boot.id) return { ok: false, message: 'Bu krampon zaten ayağında.' };
      if (state.player.money < boot.price) return { ok: false, message: 'Yetersiz bakiye.' };
      state.player.money -= boot.price;
      state.player.boots = boot.id;
      return { ok: true, message: boot.name + ' takıldı.' };
    }
    const life = LIFE.find(function (b) { return b.id === itemId; });
    if (life) {
      if (state.player.ownedLife.indexOf(life.id) >= 0) return { ok: false, message: 'Buna zaten sahipsin.' };
      if (state.player.money < life.price) return { ok: false, message: 'Yetersiz bakiye.' };
      state.player.money -= life.price;
      state.player.ownedLife.push(life.id);
      state.player.rel.taraftar = clamp(state.player.rel.taraftar + Math.round(life.score / 8), 0, 100);
      return { ok: true, message: life.name + ' artık senin. Yaşam tarzın yükseldi.' };
    }
    return { ok: false, message: 'Bu ürün rafta yok.' };
  }

  function useDrink(state) {
    if (state.player.drinks <= 0) return { ok: false, message: 'Çantanda içecek yok. Mağazaya uğra.' };
    if (state.player.energy >= 100) return { ok: false, message: 'Enerjin zaten dolu.' };
    state.player.drinks -= 1;
    const before = state.player.energy;
    state.player.energy = Math.min(100, before + DRINK_GAIN);
    return { ok: true, message: 'Enerji +' + (state.player.energy - before) + '.' };
  }

  function userFixture(state) {
    const round = state.rounds[state.week - 1];
    if (!round) return null;
    for (let i = 0; i < round.length; i++) {
      const pair = round[i];
      if (pair[0] === state.clubId) return { home: true, oppId: pair[1], opp: clubById(pair[1]) };
      if (pair[1] === state.clubId) return { home: false, oppId: pair[0], opp: clubById(pair[0]) };
    }
    return null;
  }

  function poisson(lambda, rng) {
    if (lambda <= 0) return 0;
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k += 1;
      p *= rng();
      if (k > 8) break;
    } while (p > L);
    return k - 1;
  }

  function oppLambda(state) {
    const fix = userFixture(state);
    if (!fix || !fix.opp) return 0.8;
    const us = Math.max(35, userStrength(state));
    const them = fix.opp.strength;
    const lam = (them / us) * (fix.home ? 0.82 : 1.02);
    return clamp(lam, 0.35, 2.35);
  }

  function jitter(rng, amount) { return (rng() - 0.5) * amount; }

  function buildChance(type, state, rng) {
    const pool = type === 'pas' ? PASSES : type === 'frikik' ? FKS : SHOTS;
    const tpl = pool[Math.floor(rng() * pool.length)];
    const ball = {
      x: clamp(Math.round(tpl.ball[0] + jitter(rng, 14)), 40, 320),
      y: clamp(Math.round(tpl.ball[1] + jitter(rng, 14)), 190, 540),
    };
    const goal = { x: GOAL.x, y: GOAL.y, w: GOAL.w, h: GOAL.h };
    const keeper = {
      x: clamp(Math.round(tpl.gk[0] + jitter(rng, 16)), GOAL.x + 18, GOAL.x + GOAL.w - 18),
      y: GOAL.y + 16,
    };
    const defenders = (tpl.defs || []).map(function (d) {
      return { x: Math.round(d[0] + jitter(rng, 12)), y: Math.round(d[1] + jitter(rng, 10)) };
    });
    const wall = (tpl.wall || []).map(function (d) {
      return { x: Math.round(d[0] + jitter(rng, 6)), y: Math.round(d[1] + jitter(rng, 4)) };
    });
    let teammate = null;
    if (tpl.mate) {
      teammate = {
        x: clamp(Math.round(tpl.mate[0] + jitter(rng, 12)), 36, 324),
        y: clamp(Math.round(tpl.mate[1] + jitter(rng, 12)), 150, 530),
      };
    }
    function pushOff(p) {
      if (!p) return;
      const dx = p.x - ball.x;
      const dy = p.y - ball.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 40) {
        p.x = clamp(Math.round(ball.x + (dx / dist) * 42), 28, 332);
        p.y = clamp(Math.round(ball.y + (dy / dist) * 42), 120, 560);
      }
    }
    defenders.forEach(pushOff);
    wall.forEach(pushOff);
    pushOff(teammate);
    const fix = userFixture(state);
    let pressure = { 1: 16, 2: 11, 3: 6, 4: 2 }[state.tier] || 4;
    if (fix && fix.home) pressure = Math.max(0, pressure - 2);
    const gkSkill = clamp(fix && fix.opp ? fix.opp.strength * 0.94 : 55, 32, 93);
    return {
      type: type,
      ball: ball,
      goal: goal,
      keeper: keeper,
      defenders: defenders,
      wall: wall,
      teammate: teammate,
      close: !!tpl.close || ball.y < 310,
      pressure: pressure,
      gkSkill: gkSkill,
      mateAdvanced: !!(tpl.advanced && teammate && teammate.y < ball.y - 30),
    };
  }

  function rollType(pos, rng) {
    const x = rng();
    if (pos === 'forvet') {
      if (x < 0.14) return 'frikik';
      if (x < 0.40) return 'pas';
      return 'sut';
    }
    if (x < 0.12) return 'frikik';
    if (x < 0.62) return 'pas';
    return 'sut';
  }

  function takeMinute(used, rng, min, max) {
    for (let i = 0; i < 12; i++) {
      const m = min + Math.floor(rng() * Math.max(1, max - min));
      if (!used[m]) { used[m] = 1; return m; }
    }
    used[min] = 1;
    return min;
  }

  function emptyStats(pos, tired) {
    return {
      goals: 0, assists: 0, shots: 0, onTarget: 0, passesOk: 0, turnovers: 0,
      selfish: 0, bigMiss: 0, oppGoals: 0, soloGoals: 0, chances: 0,
      pos: pos, tired: !!tired, moments: [],
    };
  }

  function createMatch(state) {
    if (state.live) return state.live;
    const fix = userFixture(state);
    if (!fix) return null;
    const attrsNow = matchAttrs(state);
    const avg = (attrsNow.hiz + attrsNow.guc + attrsNow.teknik + attrsNow.vizyon + attrsNow.frikik) / 5;
    let n = 4;
    if (avg >= 70) n += 1;
    if (rngNext(state) < 0.42) n += 1;
    if (rngNext(state) < 0.22 && n < 6) n += 1;
    if (state.player.energy < 22 && n > 3) n -= 1;
    n = clamp(n, 3, 6);
    const events = [];
    const used = {};
    for (let i = 0; i < n; i++) {
      const type = rollType(state.player.pos, function () { return rngNext(state); });
      const span = Math.floor(76 / n);
      const minute = takeMinute(used, function () { return rngNext(state); }, 8 + i * span, 8 + (i + 1) * span);
      events.push({
        type: 'chance',
        minute: minute,
        scene: buildChance(type, state, function () { return rngNext(state); }),
      });
    }
    const oppN = Math.min(4, poisson(oppLambda(state), function () { return rngNext(state); }));
    for (let i = 0; i < oppN; i++) {
      events.push({ type: 'opp', minute: takeMinute(used, function () { return rngNext(state); }, 12, 86) });
    }
    if (state.player.rel.takim >= 52 && rngNext(state) < 0.16) {
      events.push({ type: 'solo', minute: takeMinute(used, function () { return rngNext(state); }, 20, 80) });
    }
    events.sort(function (a, b) { return a.minute - b.minute || (a.type === 'chance' ? -1 : 1); });
    state.live = {
      oppId: fix.oppId,
      home: fix.home,
      events: events,
      cursor: 0,
      waiting: null,
      attrs: attrsNow,
      tiredPen: energyPenalty(state),
      stats: emptyStats(state.player.pos, energyPenalty(state) > 0),
    };
    state.phase = 'match';
    return state.live;
  }

  function angDiff(a, b) {
    let d = Math.abs(a - b);
    if (d > Math.PI) d = Math.PI * 2 - d;
    return d;
  }

  function classifyAction(scene, swipe) {
    const dx = swipe.x2 - swipe.x1;
    const dy = swipe.y2 - swipe.y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 12) return { kind: 'none', dist: dist };
    const swipeAng = Math.atan2(dy, dx);
    if (scene.teammate) {
      const mateAng = Math.atan2(scene.teammate.y - scene.ball.y, scene.teammate.x - scene.ball.x);
      const mouthY = scene.goal.y + scene.goal.h;
      const gcx = scene.goal.x + scene.goal.w / 2;
      const goalAng = Math.atan2(mouthY - scene.ball.y, gcx - scene.ball.x);
      const dMate = angDiff(swipeAng, mateAng);
      const dGoal = angDiff(swipeAng, goalAng);
      if (scene.type === 'pas') {
        if (dMate <= dGoal) return { kind: 'pass', dist: dist };
        return { kind: 'selfish', dist: dist };
      }
      if (dMate + 0.28 < dGoal && dMate < 0.42) return { kind: 'pass', dist: dist };
    }
    if (scene.type === 'frikik') return { kind: 'fk', dist: dist };
    return { kind: 'shot', dist: dist };
  }

  function shotModel(scene, swipe, attrs) {
    const dx = swipe.x2 - swipe.x1;
    const dy = swipe.y2 - swipe.y1;
    const dist = Math.hypot(dx, dy);
    const power = clamp(dist / POWER_SCALE, 0, 100);
    const accStat = scene.type === 'frikik'
      ? attrs.frikik * 0.72 + attrs.teknik * 0.28
      : attrs.teknik * 0.78 + attrs.guc * 0.22;
    const spread = (100 - accStat) * 0.32 + (scene.pressure || 0) * 0.38;
    const ideal = scene.close ? 50 : 58;
    const slack = 10 + attrs.guc * 0.11 + (scene.close ? 4 : 0);
    const soft = scene.close ? 24 : 34;
    const hard = ideal + slack + 4;
    let band = 'ok';
    if (power < soft) band = 'weak';
    else if (power > hard) band = 'over';
    else if (Math.abs(power - ideal) <= slack * 0.62) band = 'ideal';
    const mouthY = scene.goal.y + scene.goal.h;
    let aimX = scene.ball.x;
    let ok = dy < -8 && dist >= 12;
    if (Math.abs(dy) > 0.001) {
      const t = (mouthY - scene.ball.y) / dy;
      aimX = scene.ball.x + dx * t;
    } else ok = false;
    const left = scene.goal.x + 6;
    const right = scene.goal.x + scene.goal.w - 6;
    return {
      ok: ok,
      power: power,
      aimX: aimX,
      spread: spread,
      band: band,
      ideal: ideal,
      slack: slack,
      soft: soft,
      hard: hard,
      onTarget: aimX >= left && aimX <= right,
      accStat: accStat,
      mouthY: mouthY,
      left: left,
      right: right,
    };
  }

  function resolveShot(scene, swipe, attrs, rng) {
    const m = shotModel(scene, swipe, attrs);
    if (!m.ok) return { outcome: 'scuff', power: m.power, aimX: m.aimX, onTarget: false, band: m.band };
    const error = (rng() - rng()) * m.spread;
    const finalX = m.aimX + error;
    const onTarget = finalX >= m.left && finalX <= m.right;
    if (scene.type === 'frikik' && scene.wall && scene.wall.length && m.band !== 'weak') {
      const lift = 64 - attrs.guc * 0.14 - attrs.frikik * 0.1;
      const radius = 17 - attrs.frikik * 0.07;
      for (let i = 0; i < scene.wall.length; i++) {
        if (Math.abs(finalX - scene.wall[i].x) < radius && m.power < lift) {
          return { outcome: 'wall', power: m.power, aimX: finalX, onTarget: false, band: m.band };
        }
      }
    }
    const nearGoal = finalX > scene.goal.x - 36 && finalX < scene.goal.x + scene.goal.w + 36;
    if (m.band === 'over') {
      return { outcome: nearGoal ? 'over' : 'wide', power: m.power, aimX: finalX, onTarget: false, band: m.band };
    }
    if (!onTarget) return { outcome: 'wide', power: m.power, aimX: finalX, onTarget: false, band: m.band };
    if (m.band === 'weak') return { outcome: 'weak', power: m.power, aimX: finalX, onTarget: true, band: m.band };
    const distGk = Math.abs(finalX - scene.keeper.x);
    let saveP = 0.3 + (scene.gkSkill || 50) / 210;
    if (distGk < 18) saveP += 0.34;
    else if (distGk < 34) saveP += 0.18;
    else if (distGk < 52) saveP += 0.07;
    else saveP -= 0.05;
    saveP -= Math.max(0, m.accStat - 58) / 340;
    if (m.band === 'ideal') saveP -= 0.03;
    if (scene.close) saveP -= 0.05;
    saveP = clamp(saveP, 0.2, 0.93);
    if (rng() < saveP) return { outcome: 'save', power: m.power, aimX: finalX, onTarget: true, band: m.band };
    return { outcome: 'goal', power: m.power, aimX: finalX, onTarget: true, band: m.band };
  }

  function distToSegment(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const len2 = abx * abx + aby * aby || 1;
    let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
    t = clamp(t, 0, 1);
    const x = a.x + abx * t;
    const y = a.y + aby * t;
    return Math.hypot(p.x - x, p.y - y);
  }

  function laneBlocked(scene) {
    if (!scene.teammate) return false;
    const obstacles = (scene.defenders || []).concat(scene.wall || []);
    for (let i = 0; i < obstacles.length; i++) {
      if (distToSegment(obstacles[i], scene.ball, scene.teammate) < 26) return true;
    }
    return false;
  }

  function resolvePass(scene, swipe, attrs, rng, pos) {
    if (!scene.teammate) return { outcome: 'scuff', power: 0, deg: 180 };
    const dx = swipe.x2 - swipe.x1;
    const dy = swipe.y2 - swipe.y1;
    const dist = Math.hypot(dx, dy);
    const power = clamp(dist / POWER_SCALE, 0, 100);
    const swipeAng = Math.atan2(dy, dx);
    const mateAng = Math.atan2(scene.teammate.y - scene.ball.y, scene.teammate.x - scene.ball.x);
    const deg = angDiff(swipeAng, mateAng) * 180 / Math.PI;
    const tolerance = 16 + attrs.vizyon * 0.2;
    if (deg > tolerance) return { outcome: 'off', power: power, deg: deg };
    if (power < 24 || power > 86) return { outcome: 'power', power: power, deg: deg };
    let p = 0.58 + attrs.vizyon / 210 + attrs.teknik / 320;
    const blocked = laneBlocked(scene);
    if (blocked) p -= 0.26;
    p = clamp(p, 0.12, 0.93);
    if (rng() > p) return { outcome: 'cut', power: power, deg: deg, blocked: blocked };
    let ap = 0.2 + attrs.vizyon / 300 + (scene.mateAdvanced ? 0.1 : 0);
    if (pos === 'ortasaha') ap += 0.07;
    ap = clamp(ap, 0.08, 0.72);
    if (rng() < ap) return { outcome: 'assist', power: power, deg: deg };
    return { outcome: 'pass', power: power, deg: deg };
  }

  function swipeToward(ball, target, power) {
    const dx = target.x - ball.x;
    const dy = target.y - ball.y;
    const len = Math.hypot(dx, dy) || 1;
    const dist = clamp(power, 1, 100) * POWER_SCALE;
    return {
      x1: ball.x,
      y1: ball.y,
      x2: ball.x + (dx / len) * dist,
      y2: ball.y + (dy / len) * dist,
    };
  }

  function tapPassSwipe(scene) {
    if (!scene.teammate) return null;
    return swipeToward(scene.ball, scene.teammate, 52);
  }

  function applyChance(stats, kind, outcome) {
    if (kind === 'pass') {
      if (outcome === 'assist') { stats.assists += 1; stats.passesOk += 1; }
      else if (outcome === 'pass') stats.passesOk += 1;
      else stats.turnovers += 1;
      return;
    }
    stats.shots += 1;
    if (kind === 'selfish') stats.selfish += 1;
    if (outcome === 'goal') { stats.goals += 1; stats.onTarget += 1; }
    else if (outcome === 'save' || outcome === 'weak') stats.onTarget += 1;
    else stats.bigMiss += 1;
  }

  function applyEvent(stats, eventType) {
    if (eventType === 'opp') stats.oppGoals += 1;
    if (eventType === 'solo') stats.soloGoals += 1;
  }

  function teamGoals(stats) {
    return (stats.goals || 0) + (stats.assists || 0) + (stats.soloGoals || 0);
  }

  function rateMatch(stats) {
    let r = 6;
    const pos = stats.pos || 'forvet';
    r += (stats.goals || 0) * (pos === 'forvet' ? 1.15 : 0.95);
    r += (stats.assists || 0) * (pos === 'ortasaha' ? 0.95 : 0.75);
    r += (stats.passesOk || 0) * 0.22;
    r += (stats.onTarget || 0) * 0.1;
    r -= (stats.bigMiss || 0) * 0.28;
    r -= (stats.turnovers || 0) * 0.16;
    r -= (stats.selfish || 0) * 0.12;
    if (stats.result === 'win') r += 0.35;
    else if (stats.result === 'loss') r -= 0.4;
    if (stats.tired) r -= 0.35;
    return clamp(Math.round(r * 10) / 10, 1, 10);
  }

  function bumpRel(state, key, delta) {
    const before = state.player.rel[key];
    const after = clamp(Math.round(before + delta), 0, 100);
    state.player.rel[key] = after;
    return after - before;
  }

  function tableSorted(state) {
    const rows = state.table.map(function (r) {
      return {
        id: r.id, p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga,
        gd: r.gf - r.ga,
        pts: r.w * 3 + r.d,
      };
    });
    rows.sort(function (a, b) {
      return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || String(a.id).localeCompare(String(b.id), 'tr');
    });
    return rows;
  }

  function bumpRow(row, gf, ga) {
    row.p += 1;
    row.gf += gf;
    row.ga += ga;
    if (gf > ga) row.w += 1;
    else if (gf === ga) row.d += 1;
    else row.l += 1;
  }

  function applyScoreline(state, homeId, awayId, hg, ag) {
    const home = state.table.find(function (t) { return t.id === homeId; });
    const away = state.table.find(function (t) { return t.id === awayId; });
    if (home) bumpRow(home, hg, ag);
    if (away) bumpRow(away, ag, hg);
  }

  function simRoundRemainder(state, roundIndex) {
    const round = state.rounds[roundIndex];
    if (!round) return;
    for (let i = 0; i < round.length; i++) {
      const a = round[i][0];
      const b = round[i][1];
      if (a === state.clubId || b === state.clubId) continue;
      const ca = clubById(a);
      const cb = clubById(b);
      const hg = poisson(clamp(ca.strength / cb.strength * 1.05, 0.4, 2.5), function () { return rngNext(state); });
      const ag = poisson(clamp(cb.strength / ca.strength * 0.92, 0.35, 2.3), function () { return rngNext(state); });
      applyScoreline(state, a, b, hg, ag);
    }
  }

  function offerWage(state, tier, mult) {
    const base = { 1: 9000, 2: 2800, 3: 980, 4: 420 }[tier] || 400;
    const avg = average(state.seasonRatings.length ? state.seasonRatings : [6.4]);
    const life = lifestyleScore(state);
    let w = base * mult * (0.86 + Math.max(0, avg - 5.5) * 0.16) * (1 + life / 220);
    w = Math.round(w / 10) * 10;
    return Math.max(w, state.wage + 90);
  }

  function makeOffers(state) {
    const avg = average(state.seasonRatings);
    const tier = state.tier;
    const offers = [];
    function pushClub(club, mult, kind) {
      if (!club) return;
      if (club.id === state.clubId) return;
      if (offers.some(function (o) { return o.clubId === club.id; })) return;
      offers.push({
        id: 'o' + state.season + '-' + offers.length + '-' + club.id,
        clubId: club.id,
        tier: club.tier,
        wage: offerWage(state, club.tier, mult),
        kind: kind,
      });
    }
    const higher = CLUBS.filter(function (c) { return c.tier === tier - 1; })
      .slice()
      .sort(function (a, b) { return b.strength - a.strength; });
    const same = CLUBS.filter(function (c) { return c.tier === tier && c.id !== state.clubId; })
      .slice()
      .sort(function (a, b) { return b.strength - a.strength; });
    const champ = state.review && state.review.champion;
    const promoted = state.review && state.review.promoted;
    if (tier > 1 && (avg >= 6.9 || champ || (promoted && avg >= 6.4))) {
      pushClub(higher[2] || higher[higher.length - 1] || higher[0], 1, 'yuksel');
      if (avg >= 7.8 || champ) pushClub(higher[0], 1.22, 'yildiz');
    }
    if (avg >= 6.3 && same.length) pushClub(same[0], 1.12, 'yatay');
    return offers.slice(0, 3);
  }

  function finishSeason(state) {
    const sorted = tableSorted(state);
    let rank = sorted.findIndex(function (r) { return r.id === state.clubId; }) + 1;
    if (rank <= 0) rank = sorted.length;
    const tierBefore = state.tier;
    const promoted = rank <= 2 && state.tier > 1;
    const relegated = rank >= 7 && state.tier < 4;
    const champion = rank === 1;
    let prize = 0;
    if (champion) {
      prize = state.wage * 8;
      state.history.titles += 1;
      state.player.rel.taraftar = clamp(state.player.rel.taraftar + 12, 0, 100);
      state.player.rel.hoca = clamp(state.player.rel.hoca + 8, 0, 100);
    } else if (promoted) {
      prize = state.wage * 4;
      state.player.rel.taraftar = clamp(state.player.rel.taraftar + 6, 0, 100);
    }
    if (relegated) {
      state.player.rel.taraftar = clamp(state.player.rel.taraftar - 10, 0, 100);
      state.player.rel.hoca = clamp(state.player.rel.hoca - 8, 0, 100);
      state.history.relegations += 1;
    }
    if (promoted) {
      state.tier -= 1;
      state.history.promotions += 1;
      state.wage = Math.round(state.wage * 1.35 / 10) * 10;
    } else if (relegated) {
      state.tier += 1;
      state.wage = Math.max(220, Math.round(state.wage * 0.8 / 10) * 10);
    } else {
      state.wage = Math.round(state.wage * 1.06 / 10) * 10;
    }
    state.player.money += prize;
    state.history.earnings += prize;
    state.player.age += 1;
    const decline = [];
    if (state.player.age >= 33) {
      if (rngNext(state) < 0.7) {
        state.player.base.hiz = Math.max(18, state.player.base.hiz - 1);
        decline.push('Hız');
      }
      if (rngNext(state) < 0.5) {
        state.player.base.guc = Math.max(18, state.player.base.guc - 1);
        decline.push('Güç');
      }
    } else if (state.player.age >= 31 && rngNext(state) < 0.4) {
      state.player.base.hiz = Math.max(18, state.player.base.hiz - 1);
      decline.push('Hız');
    }
    let award = '';
    if (state.seasonGoals >= 6) {
      award = 'Gol kralı';
      state.player.rel.taraftar = clamp(state.player.rel.taraftar + 6, 0, 100);
    } else if (state.seasonAssists >= 5) {
      award = 'Asist kralı';
      state.player.rel.takim = clamp(state.player.rel.takim + 4, 0, 100);
    }
    state.history.seasons += 1;
    const club = clubById(state.clubId);
    const clubName = club ? club.name : 'Takımın';
    let headline;
    if (champion && promoted) headline = clubName + ' şampiyon oldu ve üst lige çıktı!';
    else if (champion) headline = clubName + ' ligi şampiyon kapattı!';
    else if (promoted) headline = clubName + ' üst lige yükseldi.';
    else if (relegated) headline = clubName + ' küme düştü.';
    else headline = 'Sezonu ' + rank + '. sırada bitirdin.';
    state.review = {
      rank: rank,
      promoted: promoted,
      relegated: relegated,
      champion: champion,
      prize: prize,
      decline: decline,
      award: award,
      season: state.season,
      goals: state.seasonGoals,
      assists: state.seasonAssists,
      table: sorted,
      tierBefore: tierBefore,
      tierAfter: state.tier,
      age: state.player.age,
      headline: headline,
      clubId: state.clubId,
      retired: state.player.age >= 42,
    };
    state.offers = makeOffers(state);
    if (state.player.age >= 42) state.retired = true;
    state.seasonGoals = 0;
    state.seasonAssists = 0;
    state.seasonRatings = [];
    addNews(state, headline);
  }

  function inboxEligible(state) {
    if (!state || state.inboxOffer || state.agreedOffer || state.retired) return false;
    if (state.phase === 'season' || state.phase === 'result') return false;
    if (!state.seasonRatings || state.seasonRatings.length < 4) return false;
    if (average(state.seasonRatings) < 7.35) return false;
    return true;
  }

  function maybeInbox(state, opts) {
    opts = opts || {};
    if (!inboxEligible(state)) return null;
    if (!opts.force && rngNext(state) > 0.55) return null;
    const avg = average(state.seasonRatings);
    let targetTier = state.tier;
    if (state.tier > 1 && avg >= 7.35) targetTier = state.tier - 1;
    if (state.tier === 1) targetTier = 1;
    const list = CLUBS.filter(function (c) { return c.tier === targetTier && c.id !== state.clubId; });
    if (!list.length) return null;
    const club = list[Math.floor(rngNext(state) * list.length)];
    const offer = {
      id: 'inbox-' + state.season + '-' + state.week + '-' + club.id,
      clubId: club.id,
      tier: club.tier,
      wage: offerWage(state, club.tier, club.tier < state.tier ? 1.05 : 1.15),
      kind: club.tier < state.tier ? 'yuksel' : 'yatay',
    };
    state.inboxOffer = offer;
    addNews(state, club.name + ' seni soruyor.');
    return offer;
  }

  function completeMatch(state, report) {
    if (!state) return { ok: false, message: 'Kariyer yok.' };
    if (state.retired && state.phase !== 'match') return { ok: false, message: 'Kariyerin kapandı.' };
    if (state.phase === 'result' || state.phase === 'season') {
      return { ok: false, message: 'Maç zaten işlendi.' };
    }
    report = report || {};
    const fix = userFixture(state);
    if (!fix) return { ok: false, message: 'Fikstür bulunamadı.' };
    const us = teamGoals(report);
    const them = report.oppGoals || 0;
    const result = us > them ? 'win' : us < them ? 'loss' : 'draw';
    const rating = rateMatch({
      goals: report.goals || 0,
      assists: report.assists || 0,
      shots: report.shots || 0,
      onTarget: report.onTarget || 0,
      passesOk: report.passesOk || 0,
      turnovers: report.turnovers || 0,
      selfish: report.selfish || 0,
      bigMiss: report.bigMiss || 0,
      pos: state.player.pos,
      tired: !!report.tired,
      result: result,
    });
    if (fix.home) applyScoreline(state, state.clubId, fix.oppId, us, them);
    else applyScoreline(state, fix.oppId, state.clubId, them, us);
    simRoundRemainder(state, state.week - 1);

    state.player.energy = clamp(state.player.energy - 16, 0, 100);
    let earn = state.wage;
    if (result === 'win') earn += Math.round(state.wage * 0.5);
    else if (result === 'draw') earn += Math.round(state.wage * 0.2);
    earn += (report.goals || 0) * 80;
    earn += (report.assists || 0) * 50;
    state.player.money += earn;
    state.history.earnings += earn;

    const deltas = {
      hoca: bumpRel(state, 'hoca', (rating - 6.2) * 3.1 + ((report.goals || 0) > 0 ? 1 : 0)),
      takim: bumpRel(state, 'takim', (report.assists || 0) * 4 + (report.passesOk || 0) * 1.2 - (report.selfish || 0) * 4 + (rating - 6.2) * 1.4),
      taraftar: bumpRel(state, 'taraftar', (report.goals || 0) * 5 + (result === 'win' ? 4 : result === 'loss' ? -5 : -1) + (rating - 6) * 1.2),
    };

    state.form.push(rating);
    if (state.form.length > 5) state.form.shift();
    state.seasonRatings.push(rating);
    state.seasonGoals += report.goals || 0;
    state.seasonAssists += report.assists || 0;
    state.history.matches += 1;
    state.history.goals += report.goals || 0;
    state.history.assists += report.assists || 0;
    if (result === 'win') state.history.wins += 1;
    else if (result === 'draw') state.history.draws += 1;
    else state.history.losses += 1;
    if (rating > state.history.bestRating) state.history.bestRating = rating;

    state.lastMatch = {
      us: us,
      them: them,
      result: result,
      rating: rating,
      earn: earn,
      deltas: deltas,
      oppId: fix.oppId,
      home: fix.home,
      goals: report.goals || 0,
      assists: report.assists || 0,
      week: state.week,
      moments: (report.moments || []).slice(0, 8),
    };
    state.live = null;
    state.restedThisWeek = false;

    const lastWeek = state.week >= state.rounds.length;
    if (lastWeek) {
      finishSeason(state);
      state.phase = 'result';
      state.afterResult = 'season';
    } else {
      state.week += 1;
      state.phase = 'result';
      state.afterResult = 'hub';
      maybeInbox(state);
    }
    const headline = result === 'win' ? 'Galibiyet' : result === 'draw' ? 'Beraberlik' : 'Mağlubiyet';
    addNews(state, headline + ' · puan ' + String(rating).replace('.', ','));
    return { ok: true, match: state.lastMatch };
  }

  function continueResult(state) {
    if (!state || state.phase !== 'result') return state ? state.phase : 'hub';
    const next = state.afterResult || 'hub';
    state.phase = next;
    state.afterResult = null;
    return next;
  }

  function applyClubMove(state, offer) {
    state.clubId = offer.clubId;
    state.tier = offer.tier;
    state.wage = offer.wage;
    state.player.rel.hoca = 46;
    state.player.rel.takim = 42;
    state.player.rel.taraftar = 40;
    state.history.transfers += 1;
    const club = clubById(offer.clubId);
    addNews(state, (club ? club.name : 'Yeni kulüp') + ' ile imzaladın.');
    noteClub(state);
  }

  function findSeasonOffer(state, offerId) {
    return (state.offers || []).find(function (o) { return o.id === offerId; }) || null;
  }

  function acceptSeasonOffer(state, offerId) {
    const offer = findSeasonOffer(state, offerId);
    if (!offer) return { ok: false, message: 'Teklif bulunamadı.' };
    state.agreedOffer = offer;
    const club = clubById(offer.clubId);
    return { ok: true, message: (club ? club.name : 'Kulüp') + ' ile el sıkıştın. Yeni sezona orada başlayacaksın.' };
  }

  function rejectSeasonOffer(state, offerId) {
    const offer = findSeasonOffer(state, offerId);
    state.offers = (state.offers || []).filter(function (o) { return o.id !== offerId; });
    if (state.agreedOffer && state.agreedOffer.id === offerId) state.agreedOffer = null;
    if (!offer) return { ok: false, message: 'Teklif bulunamadı.' };
    return { ok: true, message: 'Teklifi reddettin.' };
  }

  function beginNextSeason(state) {
    if (!state || state.retired) return { ok: false, message: 'Bu kariyer kapandı.' };
    if (state.agreedOffer) {
      applyClubMove(state, state.agreedOffer);
      state.agreedOffer = null;
    }
    state.season += 1;
    state.week = 1;
    state.phase = 'hub';
    state.offers = [];
    state.inboxOffer = null;
    state.review = null;
    state.lastMatch = null;
    state.form = [];
    state.seasonGoals = 0;
    state.seasonAssists = 0;
    state.seasonRatings = [];
    state.restedThisWeek = false;
    state.afterResult = null;
    state.live = null;
    state.player.energy = clamp(Math.max(state.player.energy, 80), 0, 100);
    setupSeason(state);
    noteClub(state);
    addNews(state, 'Sezon ' + state.season + ' başlıyor. ' + tierName(state.tier) + '.');
    return { ok: true, message: 'Yeni sezon başladı.' };
  }

  function resolveInbox(state, mode) {
    const offer = state.inboxOffer;
    if (!offer) return { ok: false, message: 'Bekleyen teklif yok.' };
    const club = clubById(offer.clubId);
    const name = club ? club.name : 'Kulüp';
    if (mode === 'later') {
      state.agreedOffer = offer;
      state.inboxOffer = null;
      return { ok: true, message: name + ' yazın seni bekleyecek. Şimdilik formasını giy.' };
    }
    if (mode === 'now') {
      applyClubMove(state, offer);
      state.inboxOffer = null;
      state.agreedOffer = null;
      beginNextSeason(state);
      return { ok: true, message: name + ' soyunma odası seni bekliyor. Yeni sezon, yeni takım.' };
    }
    state.inboxOffer = null;
    state.player.rel.hoca = clamp(state.player.rel.hoca + 2, 0, 100);
    return { ok: true, message: 'Kulübünde kalıyorsun. Hoca bunu unutmaz.' };
  }

  function retireCareer(state) {
    if (!state) return { ok: false, message: 'Kariyer yok.' };
    state.retired = true;
    state.phase = 'retired';
    state.live = null;
    addNews(state, state.player.name + ' kramponlarını astı.');
    return { ok: true, message: 'Kariyerin burada bitti. İstatistiklerin duruyor.' };
  }

  function bestStepUpTier(state) {
    return Math.max(1, state.tier - 1);
  }

  return {
    VERSION: VERSION,
    LOG_W: LOG_W,
    LOG_H: LOG_H,
    GOAL: GOAL,
    POWER_SCALE: POWER_SCALE,
    TRAIN_COST: TRAIN_COST,
    DRINK_PRICE: DRINK_PRICE,
    DRINK_PACK: DRINK_PACK,
    DRINK_GAIN: DRINK_GAIN,
    ATTRS: ATTRS,
    ATTR_LABEL: ATTR_LABEL,
    TIERS: TIERS,
    CLUBS: CLUBS,
    BOOTS: BOOTS,
    LIFE: LIFE,
    OUTCOMES: OUTCOMES,
    clamp: clamp,
    average: average,
    formatMoney: formatMoney,
    moodWord: moodWord,
    validateName: validateName,
    clubById: clubById,
    tierName: tierName,
    shirtNumber: shirtNumber,
    isCaptain: isCaptain,
    lifestyleScore: lifestyleScore,
    trainedAttrs: trainedAttrs,
    matchAttrs: matchAttrs,
    energyPenalty: energyPenalty,
    userStrength: userStrength,
    threatLabel: threatLabel,
    formComment: formComment,
    roundRobin: roundRobin,
    createCareer: createCareer,
    train: train,
    rest: rest,
    buy: buy,
    useDrink: useDrink,
    userFixture: userFixture,
    createMatch: createMatch,
    shotModel: shotModel,
    resolveShot: resolveShot,
    resolvePass: resolvePass,
    classifyAction: classifyAction,
    swipeToward: swipeToward,
    tapPassSwipe: tapPassSwipe,
    emptyStats: emptyStats,
    applyChance: applyChance,
    applyEvent: applyEvent,
    teamGoals: teamGoals,
    rateMatch: rateMatch,
    tableSorted: tableSorted,
    completeMatch: completeMatch,
    continueResult: continueResult,
    acceptSeasonOffer: acceptSeasonOffer,
    rejectSeasonOffer: rejectSeasonOffer,
    beginNextSeason: beginNextSeason,
    resolveInbox: resolveInbox,
    inboxEligible: inboxEligible,
    maybeInbox: maybeInbox,
    retireCareer: retireCareer,
    bestStepUpTier: bestStepUpTier,
    poisson: poisson,
    laneBlocked: laneBlocked,
  };
});
