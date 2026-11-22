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

  const COUNTRIES = {
    tr: { name: 'Türkiye', nameEn: 'Turkey', tiers: { 1: { name: 'Yıldız Lig', nameEn: 'Star League' }, 2: { name: 'Anadolu Lig', nameEn: 'Anatolian League' }, 3: { name: 'Bölgesel Lig', nameEn: 'Regional League' }, 4: { name: 'Amatör Kademe', nameEn: 'Amateur Tier' } } },
    en: { name: 'İngiltere', nameEn: 'England', tiers: { 1: { name: 'Ada Ligi', nameEn: 'Island League' }, 2: { name: 'Ada Alt', nameEn: 'Island Second' } } },
    es: { name: 'İspanya', nameEn: 'Spain', tiers: { 1: { name: 'Meseta Ligi', nameEn: 'Meseta League' }, 2: { name: 'Meseta Alt', nameEn: 'Meseta Second' } } },
    it: { name: 'İtalya', nameEn: 'Italy', tiers: { 1: { name: 'Çizme Ligi', nameEn: 'Boot League' }, 2: { name: 'Çizme Alt', nameEn: 'Boot Second' } } },
    de: { name: 'Almanya', nameEn: 'Germany', tiers: { 1: { name: 'Ren Ligi', nameEn: 'Rhine League' }, 2: { name: 'Ren Alt', nameEn: 'Rhine Second' } } },
    fr: { name: 'Fransa', nameEn: 'France', tiers: { 1: { name: 'Seine Ligi', nameEn: 'Seine League' }, 2: { name: 'Seine Alt', nameEn: 'Seine Second' } } },
    nl: { name: 'Hollanda', nameEn: 'Netherlands', tiers: { 1: { name: 'Kanal Ligi', nameEn: 'Canal League' }, 2: { name: 'Kanal Alt', nameEn: 'Canal Second' } } },
    pt: { name: 'Portekiz', nameEn: 'Portugal', tiers: { 1: { name: 'Tejo Ligi', nameEn: 'Tagus League' }, 2: { name: 'Tejo Alt', nameEn: 'Tagus Second' } } },
  };

  const COUNTRY_PAY = { tr: 1, en: 1.22, es: 1.18, it: 1.16, de: 1.2, fr: 1.14, nl: 1.08, pt: 1.06 };

  function club(row) {
    row.second = row.second || '#f8fafc';
    row.shape = row.shape || 'shield';
    row.pattern = row.pattern || 'band';
    return row;
  }

  const CLUBS = [
    club({ id: 'bogazici', name: 'İstanbul Mavi', nameEn: 'Istanbul Blue', short: 'İst Mavi', shortEn: 'Ist Blue', tier: 1, strength: 90, color: '#1d4ed8', second: '#f8fafc', shape: 'shield', pattern: 'stripes', initials: 'İM' }),
    club({ id: 'marmara', name: 'İstanbul Kırmızı', nameEn: 'Istanbul Red', short: 'İst Kırmızı', shortEn: 'Ist Red', tier: 1, strength: 88, color: '#c1121f', second: '#f6e27a', shape: 'shield', pattern: 'chevron', initials: 'İK' }),
    club({ id: 'boynuz', name: 'İstanbul Sarı', nameEn: 'Istanbul Gold', short: 'İst Sarı', shortEn: 'Ist Gold', tier: 1, strength: 86, color: '#e0a106', second: '#0f172a', shape: 'round', pattern: 'band', initials: 'İS' }),
    club({ id: 'baskent', name: 'Ankara Mor', nameEn: 'Ankara Purple', short: 'Ank Mor', shortEn: 'Ank Pur', tier: 1, strength: 85, color: '#6d28d9', second: '#f8fafc', shape: 'shield', pattern: 'quarters', initials: 'AM' }),
    club({ id: 'ege', name: 'İzmir Lacivert', nameEn: 'Izmir Navy', short: 'İzm Lacivert', shortEn: 'Izm Navy', tier: 1, strength: 84, color: '#0f2744', second: '#e2e8f0', shape: 'shield', pattern: 'stripes', initials: 'İL' }),
    club({ id: 'simsek', name: 'Bursa Yeşil', nameEn: 'Bursa Green', short: 'Bur Yeşil', shortEn: 'Bur Grn', tier: 1, strength: 83, color: '#15803d', second: '#f8fafc', shape: 'shield', pattern: 'chevron', initials: 'BY' }),
    club({ id: 'vadi', name: 'Antalya Turuncu', nameEn: 'Antalya Orange', short: 'Ant Turuncu', shortEn: 'Ant Org', tier: 1, strength: 82, color: '#ea580c', second: '#fff7ed', shape: 'round', pattern: 'rays', initials: 'AT' }),
    club({ id: 'kule', name: 'Konya Beyaz', nameEn: 'Konya White', short: 'Kon Beyaz', shortEn: 'Kon Wht', tier: 1, strength: 81, color: '#f8fafc', second: '#166534', shape: 'shield', pattern: 'band', initials: 'KB' }),
    club({ id: 'kapadokya', name: 'Kayseri Kızıl', nameEn: 'Kayseri Crimson', short: 'Kay Kızıl', shortEn: 'Kay Crim', tier: 2, strength: 78, color: '#b91c1c', second: '#fde68a', shape: 'shield', pattern: 'chevron', initials: 'KK' }),
    club({ id: 'toros', name: 'Adana Turuncu', nameEn: 'Adana Orange', short: 'Ada Turuncu', shortEn: 'Ada Org', tier: 2, strength: 76, color: '#c2410c', second: '#1e293b', shape: 'round', pattern: 'band', initials: 'ADT' }),
    club({ id: 'poyraz', name: 'Samsun Kırmızı', nameEn: 'Samsun Red', short: 'Sam Kırmızı', shortEn: 'Sam Red', tier: 2, strength: 75, color: '#dc2626', second: '#ffffff', shape: 'shield', pattern: 'stripes', initials: 'SK' }),
    club({ id: 'meric', name: 'Edirne Mavi', nameEn: 'Edirne Blue', short: 'Edi Mavi', shortEn: 'Edi Blue', tier: 2, strength: 74, color: '#2563eb', second: '#fef3c7', shape: 'lozenge', pattern: 'band', initials: 'EM' }),
    club({ id: 'icanadolu', name: 'Eskişehir Sarı', nameEn: 'Eskisehir Gold', short: 'Esk Sarı', shortEn: 'Esk Gold', tier: 2, strength: 73, color: '#ca8a04', second: '#1e293b', shape: 'shield', pattern: 'quarters', initials: 'ES' }),
    club({ id: 'sahil', name: 'Mersin Turkuaz', nameEn: 'Mersin Teal', short: 'Mer Turkuaz', shortEn: 'Mer Teal', tier: 2, strength: 72, color: '#0f766e', second: '#f0fdfa', shape: 'round', pattern: 'stripes', initials: 'MT' }),
    club({ id: 'bozkurt', name: 'Sivas Gri', nameEn: 'Sivas Grey', short: 'Siv Gri', shortEn: 'Siv Grey', tier: 2, strength: 71, color: '#4b5563', second: '#f59e0b', shape: 'shield', pattern: 'band', initials: 'SG' }),
    club({ id: 'harman', name: 'Gaziantep Kırmızı', nameEn: 'Gaziantep Red', short: 'Gaz Kırmızı', shortEn: 'Gaz Red', tier: 2, strength: 70, color: '#9f1239', second: '#fef3c7', shape: 'shield', pattern: 'chevron', initials: 'GK' }),
    club({ id: 'bozkir', name: 'Konya Boz', nameEn: 'Konya Dust', short: 'Kon Boz', shortEn: 'Kon Dust', tier: 3, strength: 66, color: '#78716c', second: '#fef3c7', shape: 'lozenge', pattern: 'plain', initials: 'KBO' }),
    club({ id: 'yayla', name: 'Erzurum Mavi', nameEn: 'Erzurum Blue', short: 'Erz Mavi', shortEn: 'Erz Blue', tier: 3, strength: 65, color: '#1d4ed8', second: '#e0f2fe', shape: 'shield', pattern: 'stripes', initials: 'ERM' }),
    club({ id: 'dere', name: 'Rize Yeşil', nameEn: 'Rize Green', short: 'Riz Yeşil', shortEn: 'Riz Grn', tier: 3, strength: 64, color: '#166534', second: '#fef08a', shape: 'shield', pattern: 'chevron', initials: 'RY' }),
    club({ id: 'zeytin', name: 'Aydın Yeşil', nameEn: 'Aydin Green', short: 'Ayd Yeşil', shortEn: 'Ayd Grn', tier: 3, strength: 63, color: '#4d7c0f', second: '#f7fee7', shape: 'round', pattern: 'band', initials: 'AY' }),
    club({ id: 'kopru', name: 'Çanakkale Mavi', nameEn: 'Canakkale Blue', short: 'Çan Mavi', shortEn: 'Can Blue', tier: 3, strength: 62, color: '#1e40af', second: '#fde68a', shape: 'shield', pattern: 'quarters', initials: 'ÇM' }),
    club({ id: 'ruzgar', name: 'Balıkesir Beyaz', nameEn: 'Balikesir White', short: 'Bal Beyaz', shortEn: 'Bal Wht', tier: 3, strength: 61, color: '#f8fafc', second: '#b91c1c', shape: 'round', pattern: 'stripes', initials: 'BB' }),
    club({ id: 'ova', name: 'Konya Altın', nameEn: 'Konya Gold', short: 'Kon Altın', shortEn: 'Kon Gold', tier: 3, strength: 60, color: '#b45309', second: '#1c1917', shape: 'lozenge', pattern: 'chevron', initials: 'KA' }),
    club({ id: 'serin', name: 'Trabzon Mavi', nameEn: 'Trabzon Blue', short: 'Tra Mavi', shortEn: 'Tra Blue', tier: 3, strength: 59, color: '#0369a1', second: '#f0f9ff', shape: 'shield', pattern: 'stripes', initials: 'TM' }),
    club({ id: 'cayir', name: 'Çorum Yeşil', nameEn: 'Corum Green', short: 'Çor Yeşil', shortEn: 'Cor Grn', tier: 4, strength: 58, color: '#16a34a', second: '#ecfccb', shape: 'shield', pattern: 'band', initials: 'ÇY' }),
    club({ id: 'degirmen', name: 'Denizli Sarı', nameEn: 'Denizli Gold', short: 'Den Sarı', shortEn: 'Den Gold', tier: 4, strength: 57, color: '#eab308', second: '#1e3a8a', shape: 'round', pattern: 'quarters', initials: 'DS' }),
    club({ id: 'tarla', name: 'Manisa Mor', nameEn: 'Manisa Purple', short: 'Man Mor', shortEn: 'Man Pur', tier: 4, strength: 56, color: '#7e22ce', second: '#faf5ff', shape: 'shield', pattern: 'chevron', initials: 'MM' }),
    club({ id: 'sokak', name: 'Diyarbakır Kırmızı', nameEn: 'Diyarbakir Red', short: 'Diy Kırmızı', shortEn: 'Diy Red', tier: 4, strength: 55, color: '#be123c', second: '#fff1f2', shape: 'shield', pattern: 'stripes', initials: 'DK' }),
    club({ id: 'bahce', name: 'Isparta Pembe', nameEn: 'Isparta Pink', short: 'Isp Pembe', shortEn: 'Isp Pink', tier: 4, strength: 54, color: '#db2777', second: '#fdf2f8', shape: 'round', pattern: 'band', initials: 'İP' }),
    club({ id: 'kavak', name: 'Zonguldak Yeşil', nameEn: 'Zonguldak Green', short: 'Zon Yeşil', shortEn: 'Zon Grn', tier: 4, strength: 53, color: '#3f6212', second: '#ecfccb', shape: 'lozenge', pattern: 'plain', initials: 'ZY' }),
    club({ id: 'patika', name: 'Van Gri', nameEn: 'Van Grey', short: 'Van Gri', shortEn: 'Van Grey', tier: 4, strength: 52, color: '#57534e', second: '#fef3c7', shape: 'shield', pattern: 'band', initials: 'VG' }),
    club({ id: 'iskele', name: 'İzmir Beyaz', nameEn: 'Izmir White', short: 'İzm Beyaz', shortEn: 'Izm Wht', tier: 4, strength: 51, color: '#f8fafc', second: '#0e7490', shape: 'round', pattern: 'stripes', initials: 'İB' }),
  ];

  CLUBS.forEach(function (c) { if (!c.country) c.country = 'tr'; });

  const CLUB_MAP = Object.create(null);
  CLUBS.forEach(function (c) { CLUB_MAP[c.id] = c; });

  function registerClubs(list) {
    (list || []).forEach(function (row) {
      const c = club(row);
      if (!c.country) c.country = 'tr';
      if (CLUB_MAP[c.id]) return;
      CLUBS.push(c);
      CLUB_MAP[c.id] = c;
    });
  }

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

  const CALIM = [
    { ball: [180, 360], gk: [180, 56], defs: [[180, 270]], mate: [300, 320], close: false, advanced: false },
    { ball: [120, 340], gk: [200, 56], defs: [[150, 250]], mate: [260, 280], close: false, advanced: true },
  ];

  const KAFA = [
    { ball: [180, 210], gk: [168, 56], defs: [[210, 200]], mate: [90, 300], close: true, advanced: false },
    { ball: [200, 188], gk: [210, 56], defs: [], mate: [120, 280], close: true, advanced: false },
  ];

  const SAVUNMA = [
    { ball: [180, 250], gk: [180, 56], defs: [[176, 320]], mate: [70, 400], close: true, advanced: false },
    { ball: [140, 230], gk: [200, 56], defs: [[150, 310]], mate: [280, 380], close: true, advanced: false },
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

  function countryInfo(id) { return COUNTRIES[id] || COUNTRIES.tr; }

  function leagueInfo(country, tier) {
    const pack = COUNTRIES[country] || COUNTRIES.tr;
    return (pack.tiers && pack.tiers[tier]) || { name: tierName(tier), nameEn: tierName(tier) };
  }

  function clubsIn(country, tier) {
    return CLUBS.filter(function (c) { return c.country === country && c.tier === tier; });
  }

  function maxTier(country) {
    let m = 1;
    CLUBS.forEach(function (c) {
      if (c.country === country && c.tier > m) m = c.tier;
    });
    return m;
  }

  function continentalClubs(state) {
    const grouped = Object.create(null);
    CLUBS.forEach(function (c) {
      if (c.tier !== 1 || !c.country) return;
      if (!grouped[c.country]) grouped[c.country] = [];
      grouped[c.country].push(c);
    });
    const out = [];
    Object.keys(grouped).forEach(function (country) {
      grouped[country].sort(function (a, b) { return b.strength - a.strength; });
      grouped[country].slice(0, 2).forEach(function (c) {
        if (!state || c.id !== state.clubId) out.push(c);
      });
    });
    return out;
  }

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
    let p = energyPenalty(state);
    const morale = state.player && state.player.morale;
    if (typeof morale === 'number' && morale < 40) p += 4;
    if (typeof morale === 'number' && morale >= 80) p = Math.max(0, p - 2);
    for (let i = 0; i < ATTRS.length; i++) a[ATTRS[i]] = Math.max(1, a[ATTRS[i]] - p);
    if (typeof morale === 'number' && morale >= 80) {
      for (let i = 0; i < ATTRS.length; i++) a[ATTRS[i]] = Math.min(99, a[ATTRS[i]] + 1);
    }
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

  function clubsForTier(tier, userClubId, country) {
    const home = country || 'tr';
    const presets = CLUBS.filter(function (c) { return c.country === home && c.tier === tier; }).map(function (c) { return c.id; });
    if (!presets.length) return userClubId ? [userClubId] : [];
    if (presets.indexOf(userClubId) >= 0) return presets;
    const next = presets.slice();
    next[next.length - 1] = userClubId;
    return next;
  }

  function setupSeason(state) {
    const ids = clubsForTier(state.tier, state.clubId, state.country || 'tr');
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
      country: 'tr',
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
      seasonHistory: [],
      trophies: [],
    };
    state.player.morale = 58;
    state.player.injured = 0;
    state.player.contractYears = 2;
    state.player.goalBonus = 40;
    state.player.partner = null;
    state.player.sponsor = null;
    state.milli = { caps: 0, goals: 0 };
    state.milliInvite = null;
    state.cup = { alive: true, round: 0, name: 'Anadolu Kupası', nameEn: 'Anatolia Cup', playedWeek: 0 };
    state.europe = tier === 1 ? { alive: true, round: 0, playedWeek: 0 } : null;
    const pool = clubsIn('tr', tier);
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
    const pool = type === 'pas' || type === 'orta' ? PASSES
      : type === 'frikik' ? FKS
      : type === 'calim' || type === 'birebir' ? CALIM
      : type === 'kafa' || type === 'penalti' || type === 'korner' || type === 'vole' ? KAFA
      : type === 'savunma' ? SAVUNMA
      : SHOTS;
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
    if (type === 'frikik') {
      let guard = 0;
      while (wall.length < 4 && guard < 4) {
        const last = wall[wall.length - 1] || { x: 168, y: 208 };
        wall.push({ x: clamp(last.x + 26, 48, 312), y: last.y + (guard % 2 ? 6 : -4) });
        guard += 1;
      }
      if (rng() < 0.45 && wall.length < 5) wall.push({ x: clamp(wall[0].x - 28, 40, 300), y: wall[0].y });
    }
    if (type === 'penalti') {
      ball.x = 180;
      ball.y = 248;
      keeper.x = 180;
      keeper.y = GOAL.y + 16;
      wall.length = 0;
      defenders.length = 0;
    }
    if (type === 'korner') {
      ball.x = 42;
      ball.y = 170;
    }
    if (type === 'birebir') {
      keeper.y = 150;
      if (defenders.length > 1) defenders.length = 1;
    }
    const mates = [];
    if (teammate) mates.push(teammate);
    if (teammate && (type === 'sut' || type === 'pas' || type === 'calim' || type === 'orta' || type === 'birebir')) {
      mates.push({
        x: clamp(340 - teammate.x, 36, 324),
        y: clamp(teammate.y + 34, 160, 520),
      });
    }
    const control = type === 'frikik' ? 'fk'
      : type === 'penalti' ? 'pen'
      : (type === 'kafa' || type === 'korner') ? 'header'
      : type === 'vole' ? 'volley'
      : type === 'savunma' ? 'defend'
      : 'open';
    return {
      type: type,
      control: control,
      ball: ball,
      goal: goal,
      keeper: keeper,
      defenders: defenders,
      wall: wall,
      teammate: teammate,
      mates: mates,
      close: !!tpl.close || ball.y < 310 || type === 'penalti' || type === 'birebir',
      pressure: pressure,
      gkSkill: gkSkill,
      mateAdvanced: !!(tpl.advanced && teammate && teammate.y < ball.y - 30),
      attacker: type === 'savunma' && defenders[0] ? defenders[0] : null,
    };
  }

  function rollType(pos, rng) {
    const x = rng();
    const rows = pos === 'forvet'
      ? [['penalti', 0.08], ['kafa', 0.09], ['korner', 0.07], ['vole', 0.06], ['birebir', 0.11], ['calim', 0.1], ['frikik', 0.08], ['pas', 0.09], ['savunma', 0.05], ['orta', 0.06]]
      : [['penalti', 0.04], ['kafa', 0.05], ['korner', 0.07], ['vole', 0.05], ['birebir', 0.05], ['calim', 0.08], ['frikik', 0.1], ['pas', 0.18], ['savunma', 0.11], ['orta', 0.13]];
    let acc = 0;
    for (let i = 0; i < rows.length; i++) {
      acc += rows[i][1];
      if (x < acc) return rows[i][0];
    }
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
    let n = 5;
    if (avg >= 64) n += 1;
    if (avg >= 78) n += 1;
    if (state.player.pos === 'forvet' && rngNext(state) < 0.55) n += 1;
    if (state.player.energy < 24 && n > 5) n -= 1;
    if (state.player.rel && state.player.rel.hoca < 36 && n > 5) n -= 1;
    n = clamp(n, 5, 8);
    const bench = !!(state.player.rel && state.player.rel.hoca < 36);
    const events = [];
    const used = {};
    for (let i = 0; i < n; i++) {
      const type = rollType(state.player.pos, function () { return rngNext(state); });
      const span = Math.floor(74 / n);
      let lo = 6 + i * span;
      let hi = 6 + (i + 1) * span;
      if (bench) { lo = Math.max(lo, 56); hi = Math.max(hi, lo + 4); }
      const minute = takeMinute(used, function () { return rngNext(state); }, lo, Math.min(88, hi));
      events.push({
        type: 'chance',
        minute: minute,
        scene: buildChance(type, state, function () { return rngNext(state); }),
      });
    }
    const oppN = Math.min(3, poisson(oppLambda(state), function () { return rngNext(state); }));
    for (let i = 0; i < oppN; i++) {
      events.push({ type: 'opp', key: 'flow.opp', minute: takeMinute(used, function () { return rngNext(state); }, 10, 86) });
    }
    const mateLam = clamp(0.28 + Math.max(0, avg - 48) / 80, 0.2, 1.35);
    const mateN = Math.min(2, poisson(mateLam, function () { return rngNext(state); }));
    for (let i = 0; i < mateN; i++) {
      events.push({ type: 'solo', key: 'flow.solo', minute: takeMinute(used, function () { return rngNext(state); }, 14, 84) });
    }
    const notes = ['flow.foul', 'flow.save', 'flow.card', 'flow.sub', 'flow.wide'];
    for (let i = 0; i < notes.length; i++) {
      events.push({ type: 'note', key: notes[i], minute: takeMinute(used, function () { return rngNext(state); }, 4 + i * 15, 18 + i * 15) });
    }
    events.sort(function (a, b) { return a.minute - b.minute || (a.type === 'chance' ? -1 : 1); });
    const expect = state.player.pos === 'forvet'
      ? 'score'
      : (rngNext(state) < 0.5 ? 'track' : 'create');
    state.live = {
      oppId: fix.oppId,
      home: fix.home,
      events: events,
      cursor: 0,
      waiting: null,
      attrs: attrsNow,
      tiredPen: energyPenalty(state),
      stats: emptyStats(state.player.pos, energyPenalty(state) > 0),
      stage: 'pre',
      clock: 0,
      speed: 1,
      paused: false,
      didHalf: false,
      stoppage: 1 + Math.floor(rngNext(state) * 3),
      expect: expect,
      bench: bench,
      meta: matchMeta(state, fix),
      ticker: [],
      scorers: [],
      possession: 48 + Math.round(avg / 10),
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
    let finalX = m.aimX + error;
    if (scene.type === 'frikik') {
      const center = scene.goal.x + scene.goal.w / 2;
      const bend = (attrs.frikik / 100) * 28;
      finalX += m.aimX < center ? bend * 0.45 : -bend * 0.45;
    }
    if (scene.type === 'penalti') {
      finalX = m.aimX + error * 0.55;
    }
    if (swipe.curve) finalX += swipe.curve;
    if (swipe.chip && m.power > 76) {
      return { outcome: 'over', power: m.power, aimX: finalX, onTarget: false, band: 'over' };
    }
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
    if (swipe.chip && scene.close) saveP -= 0.1;
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

  function ratingParts(stats) {
    const pos = (stats && stats.pos) || 'forvet';
    const parts = [
      { id: 'base', n: 6 },
      { id: 'goals', n: (stats.goals || 0) * (pos === 'forvet' ? 1.15 : 0.95) },
      { id: 'assists', n: (stats.assists || 0) * (pos === 'ortasaha' ? 0.95 : 0.75) },
      { id: 'passes', n: (stats.passesOk || 0) * 0.22 },
      { id: 'target', n: (stats.onTarget || 0) * 0.1 },
      { id: 'miss', n: -((stats.bigMiss || 0) * 0.28) },
      { id: 'turn', n: -((stats.turnovers || 0) * 0.16) },
      { id: 'self', n: -((stats.selfish || 0) * 0.12) },
    ];
    if (stats.result === 'win') parts.push({ id: 'res', n: 0.35 });
    else if (stats.result === 'loss') parts.push({ id: 'res', n: -0.4 });
    if (stats.tired) parts.push({ id: 'tired', n: -0.35 });
    return parts;
  }

  function rateMatch(stats) {
    let r = 0;
    ratingParts(stats || {}).forEach(function (part) { r += part.n; });
    return clamp(Math.round(r * 10) / 10, 1, 10);
  }

  const XI_FIRST = ['Ege', 'Kerem', 'Deniz', 'Baran', 'Emre', 'Aras', 'Mert', 'Can', 'Ozan', 'Berk', 'Umut', 'Alp', 'Serkan', 'Tarık', 'Levent', 'Bora'];
  const XI_LAST = ['Demir', 'Acar', 'Yüce', 'Solmaz', 'Bektaş', 'Duru', 'Sezgin', 'Karaca', 'Aladağ', 'Uslu'];

  function fakePlayer(rng, pos) {
    const a = XI_FIRST[Math.floor(rng() * XI_FIRST.length)];
    const b = XI_LAST[Math.floor(rng() * XI_LAST.length)];
    return { name: a + ' ' + b, pos: pos };
  }

  function matchMeta(state, fix) {
    const weathers = ['clear', 'cloud', 'rain', 'wind'];
    const weather = weathers[Math.floor(rngNext(state) * weathers.length)];
    const club = clubById(state.clubId);
    const opp = fix && fix.opp;
    const city = club && club.name ? String(club.name).split(' ')[0] : 'Saha';
    const oppCity = opp && opp.name ? String(opp.name).split(' ')[0] : '';
    const derby = !!(club && opp && city && city === oppCity);
    const cup = state.cup && state.cup.round >= 3;
    const importance = derby ? 'derby' : cup ? 'final' : (state.week >= (state.rounds.length || 7)) ? 'title' : 'league';
    const pos = state.player.pos === 'ortasaha' ? 'ortasaha' : 'forvet';
    const shape = pos === 'forvet'
      ? ['KL', 'SB', 'STP', 'STP', 'SB', 'OS', 'OS', 'OS', 'KLN', 'FOR', 'FOR']
      : ['KL', 'SB', 'STP', 'STP', 'SB', 'OS', 'OS', 'OS', 'OS', 'KLN', 'FOR'];
    const slot = pos === 'forvet' ? 10 : 6;
    const xi = shape.map(function (role, index) {
      if (index === slot) return { name: state.player.name, pos: role, me: true };
      return fakePlayer(function () { return rngNext(state); }, role);
    });
    const away = shape.map(function (role) {
      return fakePlayer(function () { return rngNext(state); }, role);
    });
    const us = userStrength(state);
    const them = opp ? opp.strength : 55;
    let odds = 'even';
    if (us > them + 8) odds = 'us';
    else if (them > us + 8) odds = 'them';
    return {
      weather: weather,
      stadium: city + ' Stadı',
      derby: derby,
      importance: importance,
      formation: pos === 'forvet' ? '4-3-3' : '4-2-3-1',
      xi: xi,
      away: away,
      odds: odds,
      captain: isCaptain(state),
      role: state.player.rel && state.player.rel.hoca < 36 ? 'bench' : 'start',
    };
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

  function offerWage(state, tier, mult, country) {
    const base = { 1: 9000, 2: 2800, 3: 980, 4: 420 }[tier] || 400;
    const avg = average(state.seasonRatings.length ? state.seasonRatings : [6.4]);
    const life = lifestyleScore(state);
    const pay = COUNTRY_PAY[country] || 1;
    let w = base * mult * pay * (0.86 + Math.max(0, avg - 5.5) * 0.16) * (1 + life / 220);
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
        country: club.country || 'tr',
        wage: offerWage(state, club.tier, mult, club.country),
        kind: kind,
        years: 3,
        bonus: Math.round(offerWage(state, club.tier, mult) * 2 / 10) * 10,
        goalBonus: club.tier === 1 ? 200 : club.tier === 2 ? 90 : 40,
      });
    }
    const home = state.country || 'tr';
    const higher = CLUBS.filter(function (c) { return c.country === home && c.tier === tier - 1; })
      .slice()
      .sort(function (a, b) { return b.strength - a.strength; });
    const same = CLUBS.filter(function (c) { return c.country === home && c.tier === tier && c.id !== state.clubId; })
      .slice()
      .sort(function (a, b) { return b.strength - a.strength; });
    const champ = state.review && state.review.champion;
    const promoted = state.review && state.review.promoted;
    if (tier > 1 && (avg >= 6.9 || champ || (promoted && avg >= 6.4))) {
      pushClub(higher[2] || higher[higher.length - 1] || higher[0], 1, 'yuksel');
      if (avg >= 7.8 || champ) pushClub(higher[0], 1.22, 'yildiz');
    }
    if (avg >= 6.3 && same.length) pushClub(same[0], 1.12, 'yatay');
    const abroadOk = (home === 'tr' && tier <= 2 && (avg >= 7.15 || (champ && tier === 1))) || (home !== 'tr' && (avg >= 7.1 || champ));
    if (abroadOk) {
      const pool = CLUBS.filter(function (c) { return c.country && c.country !== home && c.tier === 1; })
        .slice()
        .sort(function (a, b) { return b.strength - a.strength; });
      if (pool.length) pushClub(pool[Math.floor(rngNext(state) * Math.min(6, pool.length))], 1.28, 'yurt');
    }
    return offers.slice(0, 3);
  }

  function finishSeason(state) {
    const sorted = tableSorted(state);
    let rank = sorted.findIndex(function (r) { return r.id === state.clubId; }) + 1;
    if (rank <= 0) rank = sorted.length;
    const tierBefore = state.tier;
    const size = (state.leagueIds && state.leagueIds.length) || 8;
    const floor = maxTier(state.country || 'tr');
    const promoted = rank <= 2 && state.tier > 1;
    const relegated = rank > size - 2 && state.tier < floor;
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
      award = 'Gol Kralı Ödülü';
      state.player.rel.taraftar = clamp(state.player.rel.taraftar + 6, 0, 100);
    } else if (state.seasonAssists >= 5) {
      award = 'Asist Ödülü';
      state.player.rel.takim = clamp(state.player.rel.takim + 4, 0, 100);
    }
    state.history.seasons += 1;
    state.trophies = state.trophies || [];
    state.seasonHistory = state.seasonHistory || [];
    const seasonAvg = average(state.seasonRatings);
    if (seasonAvg >= 7.8 && rank <= 3) {
      award = award ? award + ' · Yılın Oyuncusu' : 'Yılın Oyuncusu';
      state.trophies.push({ name: 'Yılın Oyuncusu', season: state.season });
      state.history.playerAwards = (state.history.playerAwards || 0) + 1;
    }
    if (champion) state.trophies.push({ name: tierName(tierBefore) + ' şampiyonluğu', season: state.season });
    if (state.seasonGoals >= 6) state.trophies.push({ name: 'Gol Kralı Ödülü', season: state.season });
    state.seasonHistory.push({
      season: state.season,
      clubId: state.clubId,
      tier: tierBefore,
      rank: rank,
      goals: state.seasonGoals,
      assists: state.seasonAssists,
      award: award,
    });
    if (state.player.contractYears) state.player.contractYears = Math.max(0, state.player.contractYears - 1);
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
    const home = state.country || 'tr';
    let club = null;
    let kind = 'yatay';
    if (opts.abroad || (home === 'tr' && state.tier === 1 && avg >= 7.55)) {
      const foreign = CLUBS.filter(function (c) { return c.country && c.country !== home && c.tier === 1; });
      if (foreign.length && (opts.abroad || rngNext(state) < 0.45)) {
        club = foreign[Math.floor(rngNext(state) * foreign.length)];
        kind = 'yurt';
        targetTier = 1;
      }
    }
    if (!club) {
      const list = CLUBS.filter(function (c) { return c.country === home && c.tier === targetTier && c.id !== state.clubId; });
      if (!list.length) return null;
      club = list[Math.floor(rngNext(state) * list.length)];
      kind = club.tier < state.tier ? 'yuksel' : 'yatay';
    }
    const offerWageNow = offerWage(state, club.tier, kind === 'yurt' ? 1.3 : club.tier < state.tier ? 1.05 : 1.15, club.country);
    const offer = {
      id: 'inbox-' + state.season + '-' + state.week + '-' + club.id,
      clubId: club.id,
      tier: club.tier,
      country: club.country || home,
      wage: offerWageNow,
      kind: kind,
      years: 3,
      bonus: Math.round(offerWageNow * 2 / 10) * 10,
      goalBonus: club.tier === 1 ? 200 : 80,
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
    let result = us > them ? 'win' : us < them ? 'loss' : 'draw';
    if (report.shootout === 'win') result = 'win';
    else if (report.shootout === 'loss') result = 'loss';
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
    const comp = report.competition || null;
    if (!comp) {
      if (fix.home) applyScoreline(state, state.clubId, fix.oppId, us, them);
      else applyScoreline(state, fix.oppId, state.clubId, them, us);
      simRoundRemainder(state, state.week - 1);
    }

    state.player.energy = clamp(state.player.energy - 16, 0, 100);
    let earn = state.wage;
    if (result === 'win') earn += Math.round(state.wage * 0.5);
    else if (result === 'draw') earn += Math.round(state.wage * 0.2);
    earn += (report.goals || 0) * 80;
    earn += (report.assists || 0) * 50;
    if (state.player.sponsor && rating >= (state.player.sponsor.minRating || 6)) {
      earn += state.player.sponsor.pay;
      state.player.sponsor.weeks -= 1;
      if (state.player.sponsor.weeks <= 0) {
        addNews(state, state.player.sponsor.name + ' sponsorluğu bitti.');
        state.player.sponsor = null;
      }
    }
    if (state.player.goalBonus) earn += (report.goals || 0) * state.player.goalBonus;
    state.player.money += earn;
    state.history.earnings += earn;
    if (typeof state.player.morale === 'number') {
      const mood = result === 'win' ? 4 : result === 'loss' ? -3 : 0;
      state.player.morale = clamp(state.player.morale + mood + Math.round((rating - 6) * 1.2), 0, 100);
    }

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
      competition: comp,
      compName: report.compName || '',
    };
    if (comp === 'kupa' || comp === 'avrupa') {
      const bucket = comp === 'kupa' ? state.cup : state.europe;
      if (bucket) {
        if (result === 'win') {
          bucket.round += 1;
          if (bucket.round >= 4) {
            bucket.alive = false;
            state.trophies = state.trophies || [];
            const cupName = comp === 'kupa'
              ? ((state.cup && state.cup.name) || 'Anadolu Kupası')
              : ((state.europe && state.europe.name) || 'Elmas Kupa');
            state.trophies.push({ name: cupName, season: state.season });
            state.history.cups = (state.history.cups || 0) + 1;
            addNews(state, cupName + ' senin!');
          } else addNews(state, 'Kupa turunu geçtin.');
        } else {
          bucket.alive = false;
          addNews(state, 'Kupaya veda.');
        }
        bucket.playedWeek = state.week;
      }
    }
    if (comp === 'milli') {
      state.milli = state.milli || { caps: 0, goals: 0 };
      state.milli.caps += 1;
      state.milli.goals += report.goals || 0;
      state.milliInvite = null;
      state.player.rel.taraftar = clamp(state.player.rel.taraftar + 4, 0, 100);
      addNews(state, 'Milli formayla ' + (report.goals || 0) + ' gol.');
    }
    state.live = null;
    state.restedThisWeek = false;

    if (!state.player.injured && state.player.energy < 18 && rngNext(state) < 0.34) {
      state.player.injured = rngNext(state) < 0.22 ? 2 : 1;
      addNews(state, 'Sakatlandın. ' + state.player.injured + ' hafta yoksun.');
    }
    const lastWeek = !comp && state.week >= state.rounds.length;
    if (comp) {
      state.phase = 'result';
      state.afterResult = 'hub';
    } else if (lastWeek) {
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
    const moved = clubById(offer.clubId);
    if (moved && moved.country) state.country = moved.country;
    else if (offer.country) state.country = offer.country;
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
    const home = state.country || 'tr';
    state.cup = { alive: true, round: 0, name: 'Anadolu Kupası', nameEn: 'Anatolia Cup', playedWeek: 0 };
    state.europe = state.tier === 1 ? { alive: true, round: 0, playedWeek: 0 } : null;
    setupSeason(state);
    noteClub(state);
    const league = leagueInfo(home, state.tier);
    addNews(state, 'Sezon ' + state.season + ' başlıyor. ' + league.name + '.');
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
    FOREIGN: [],
    COUNTRIES: COUNTRIES,
    COUNTRY_PAY: COUNTRY_PAY,
    registerClubs: registerClubs,
    clubsIn: clubsIn,
    maxTier: maxTier,
    countryInfo: countryInfo,
    leagueInfo: leagueInfo,
    continentalClubs: continentalClubs,
    setupSeason: setupSeason,
    leagueNeedsRebuild: function (state) {
      if (!state) return false;
      const ids = clubsForTier(state.tier, state.clubId, state.country || 'tr');
      if (!state.leagueIds || state.leagueIds.length !== ids.length) return true;
      const set = Object.create(null);
      ids.forEach(function (id) { set[id] = true; });
      return state.leagueIds.some(function (id) {
        if (!set[id]) return true;
        const c = CLUB_MAP[id];
        return !c || c.country !== (state.country || 'tr');
      });
    },
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
    ratingParts: ratingParts,
    previewChance: function (state, type) {
      return buildChance(type || 'sut', state, Math.random);
    },
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
