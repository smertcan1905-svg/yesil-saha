/* Hayat, soyunma odası, transfer penceresi, yaş, rakip ve krallık tabloları. */
(function (root) {
  'use strict';
  const L = root.YSLogic;
  if (!L) return;

  function lang() {
    const I = root.YSI18n;
    return I && I.lang && I.lang() === 'en' ? 'en' : 'tr';
  }
  function tx(pack) {
    if (!pack) return '';
    if (typeof pack === 'string') return pack;
    return lang() === 'en' ? (pack.en || pack.tr || '') : (pack.tr || pack.en || '');
  }
  function hash(text) {
    let h = 2166136261;
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function pick(list, n) { return list[Math.abs(n) % list.length]; }

  const GOODS = [
    { id: 'poyraz', kind: 'car', price: 14000, upkeep: 90, happy: 4, fame: 3, tr: 'Poyraz Hatch', en: 'Poyraz Hatch', blurbTr: 'Şehir içi ufak araba.', blurbEn: 'A small city car.' },
    { id: 'ege', kind: 'car', price: 52000, upkeep: 220, happy: 6, fame: 8, tr: 'Ege Sedan', en: 'Aegean Sedan', blurbTr: 'Kapıda fotoğraf çektirir.', blurbEn: 'People stop for a photo.' },
    { id: 'kule', kind: 'car', price: 160000, upkeep: 540, happy: 8, fame: 14, tr: 'Kule Coupe', en: 'Tower Coupe', blurbTr: 'Gece yolu senin.', blurbEn: 'The night road is yours.' },
    { id: 'daire', kind: 'home', price: 98000, upkeep: 180, happy: 8, fame: 4, family: 6, tr: 'Sahil Dairesi', en: 'Shore Flat', blurbTr: 'Oynadığın şehirde.', blurbEn: 'In the city where you play.' },
    { id: 'ev', kind: 'home', price: 280000, upkeep: 320, happy: 10, fame: 8, family: 8, tr: 'Tepe Evi', en: 'Hill House', blurbTr: 'Ailen bayramda gelir.', blurbEn: 'The family visits on holidays.' },
    { id: 'malikane', kind: 'home', price: 980000, upkeep: 800, happy: 12, fame: 16, family: 10, tr: 'Yamaç Malikane', en: 'Slope Manor', blurbTr: 'Sadece zirvede mantıklı.', blurbEn: 'Only makes sense at the top.' },
    { id: 'kum', kind: 'watch', price: 2800, upkeep: 0, happy: 2, fame: 2, tr: 'Kum Saati', en: 'Sand Glass', blurbTr: 'Sade kadran.', blurbEn: 'A plain face.' },
    { id: 'gece', kind: 'watch', price: 64000, upkeep: 0, happy: 4, fame: 10, tr: 'Gece Kadran', en: 'Night Dial', blurbTr: 'Koyu cam, sessiz tik.', blurbEn: 'Dark glass, a quiet tick.' },
    { id: 'ceket', kind: 'cloth', price: 900, upkeep: 0, happy: 2, fame: 1, tr: 'Sokak Ceket', en: 'Street Jacket', blurbTr: 'Antrenman çıkışı.', blurbEn: 'After training.' },
    { id: 'takim', kind: 'cloth', price: 4600, upkeep: 0, happy: 3, fame: 4, love: 2, tr: 'Gece Takım', en: 'Evening Suit', blurbTr: 'Ödül gecesi için.', blurbEn: 'For the awards night.' },
    { id: 'kopek', kind: 'pet', price: 700, upkeep: 40, happy: 6, family: 3, tr: 'Bahçe Köpeği', en: 'Garden Dog', blurbTr: 'Kapıda bekler.', blurbEn: 'Waits at the door.' },
    { id: 'kus', kind: 'pet', price: 350, upkeep: 15, happy: 3, tr: 'Salon Kuşu', en: 'Parlour Bird', blurbTr: 'Sabah şarkısı.', blurbEn: 'A morning song.' },
    { id: 'yat', kind: 'sea', price: 1400000, upkeep: 4000, happy: 10, fame: 22, minTier: 1, tr: 'Mavi Güverte', en: 'Blue Deck', blurbTr: 'Üst ligin yazı.', blurbEn: 'A top-flight summer.' },
    { id: 'jet', kind: 'air', price: 4800000, upkeep: 12000, happy: 8, fame: 30, minTier: 1, tr: 'Gökyüzü Hat', en: 'Sky Line', blurbTr: 'Deplasman artık kısa.', blurbEn: 'Away days get shorter.' },
    { id: 'sofra', kind: 'gift', price: 600, upkeep: 0, happy: 2, family: 8, tr: 'Aile Sofrası', en: 'Family Table', blurbTr: 'Eve yemek yollarsın.', blurbEn: 'You send dinner home.' },
    { id: 'buket', kind: 'gift', price: 250, upkeep: 0, love: 8, happy: 2, tr: 'Kır Buketi', en: 'Field Bouquet', blurbTr: 'Eşin ya da sevgilin için.', blurbEn: 'For your partner.' },
  ];

  const FIRST = ['Ege', 'Kerem', 'Deniz', 'Baran', 'Mert', 'Can', 'Ozan', 'Berk', 'Umut', 'Alp', 'Emre', 'Aras'];
  const LAST = ['Demir', 'Acar', 'Yüce', 'Solmaz', 'Duru', 'Sezgin', 'Karaca', 'Uslu'];
  const TRAITS = ['selfish', 'jealous', 'mentor', 'admirer', 'joker'];

  function good(id) { return GOODS.filter(function (g) { return g.id === id; })[0] || null; }

  function cityName(state) {
    const club = L.clubById(state.clubId);
    const raw = club && club.name ? String(club.name).split(' ')[0] : 'Şehir';
    return raw;
  }

  function labelGood(item, state) {
    if (!item) return '';
    const base = tx(item);
    if (item.kind === 'home') return cityName(state) + ' · ' + base;
    return base;
  }

  function ensurePlus(state) {
    if (!state || !state.player) return state;
    if (!state.ownedGoods) state.ownedGoods = [];
    if (typeof state.fame !== 'number') state.fame = 24;
    if (!state.squad || state.squadClub !== state.clubId) state.squad = makeSquad(state);
    if (!state.rival || state.rival.season !== state.season) state.rival = makeRival(state);
    if (!state.scorerTable || state.scorerClub !== state.clubId || state.scorerSeason !== state.season) seedScorers(state);
    if (!state.window) refreshWindow(state);
    if (typeof state.releaseClause !== 'number') state.releaseClause = Math.round(state.wage * 28 / 10) * 10;
    ensureCareer(state);
    return state;
  }

  const FOCUSES = [
    { id: 'finishing', tr: 'Bitiricilik', en: 'Finishing' },
    { id: 'pace', tr: 'Hız', en: 'Pace' },
    { id: 'passing', tr: 'Pas', en: 'Passing' },
    { id: 'dribbling', tr: 'Çalım', en: 'Dribbling' },
    { id: 'physical', tr: 'Fizik', en: 'Physical' },
    { id: 'mental', tr: 'Mental', en: 'Mental' },
  ];

  function ensureCareer(state) {
    if (!state.player.role) state.player.role = state.player.pos === 'ortasaha' ? 'ortasaha' : 'kanat';
    if (typeof state.player.familiar !== 'number') state.player.familiar = 64;
    if (typeof state.player.finish !== 'number') state.player.finish = state.player.base.teknik;
    if (typeof state.player.mental !== 'number') state.player.mental = 48;
    if (typeof state.player.fatigue !== 'number') state.player.fatigue = Math.max(0, 100 - (state.player.energy || 80));
    if (!state.train) state.train = { focus: 'finishing', xp: {}, points: 0, weekKey: '' };
    FOCUSES.forEach(function (row) {
      if (typeof state.train.xp[row.id] !== 'number') state.train.xp[row.id] = 10;
    });
    if (typeof state.train.points !== 'number') state.train.points = 0;
  }

  function focusById(id) {
    return FOCUSES.filter(function (row) { return row.id === id; })[0] || FOCUSES[0];
  }

  function applyFocusGain(state, id, amount) {
    ensureCareer(state);
    const key = focusById(id).id;
    state.train.xp[key] = (state.train.xp[key] || 0) + amount;
    let gained = 0;
    while (state.train.xp[key] >= 100) {
      state.train.xp[key] -= 100;
      state.train.points += 1;
      gained += 1;
    }
    return gained;
  }

  function applyPointTo(state, id) {
    const b = state.player.base;
    if (id === 'pace') b.hiz = Math.min(99, b.hiz + 1);
    else if (id === 'passing') b.vizyon = Math.min(99, b.vizyon + 1);
    else if (id === 'dribbling') b.teknik = Math.min(99, b.teknik + 1);
    else if (id === 'physical') b.guc = Math.min(99, b.guc + 1);
    else if (id === 'mental') state.player.mental = Math.min(99, (state.player.mental || 48) + 1);
    else state.player.finish = Math.min(99, (state.player.finish || 40) + 1);
  }

  function setWeeklyFocus(state, id) {
    ensureCareer(state);
    const key = (state.season || 1) + '-' + (state.week || 1);
    if (state.train.weekKey === key && state.train.focus) {
      return { ok: false, message: tx({ tr: 'Bu haftanın odağı kilitli: ' + tx(focusById(state.train.focus)) + '.', en: 'This week’s focus is locked: ' + tx(focusById(state.train.focus)) + '.' }) };
    }
    state.train.focus = focusById(id).id;
    state.train.weekKey = key;
    return { ok: true, message: tx({ tr: 'Haftalık odak: ' + tx(focusById(id)) + '. Çubuk dolunca puan gelir.', en: 'Weekly focus: ' + tx(focusById(id)) + '. A full bar gives a point.' }) };
  }

  function workFocus(state) {
    ensureCareer(state);
    if (state.player.energy < 16) return { ok: false, message: tx({ tr: 'Enerjin yetmiyor. Dinlen.', en: 'Not enough energy. Rest.' }) };
    state.player.energy -= 16;
    state.player.fatigue = L.clamp((state.player.fatigue || 0) + 6, 0, 100);
    const gained = applyFocusGain(state, state.train.focus, 28 + Math.floor(hash(state.week + state.train.focus) % 12));
    if (gained && state.train.points > 0) {
      state.train.points -= 1;
      applyPointTo(state, state.train.focus);
    }
    const xp = state.train.xp[state.train.focus] || 0;
    const label = tx(focusById(state.train.focus));
    const message = gained
      ? tx({ tr: label + ' +1. Çubuk ' + xp + '.', en: label + ' +1. Bar at ' + xp + '.' })
      : tx({ tr: label + ' deneyimi +' + xp + '. Henüz puan yok.', en: label + ' XP is at ' + xp + '. No point yet.' });
    return { ok: true, message: message, gain: gained };
  }

  function spendPoint(state, id) {
    ensureCareer(state);
    if (state.train.points < 1) return { ok: false, message: tx({ tr: 'Harcanacak puan yok.', en: 'No points to spend.' }) };
    state.train.points -= 1;
    applyPointTo(state, id || state.train.focus);
    return { ok: true, message: tx({ tr: tx(focusById(id || state.train.focus)) + ' +1.', en: tx(focusById(id || state.train.focus)) + ' +1.' }) };
  }

  function fitnessReport(state) {
    ensureCareer(state);
    const age = state.player.age || 16;
    const fatigue = L.clamp(state.player.fatigue || 0, 0, 100);
    let risk = Math.round(fatigue * 0.42);
    if (age >= 30) risk += (age - 29) * 2;
    if ((state.player.energy || 0) < 30) risk += 10;
    if ((state.player.mental || 0) >= 70) risk -= 6;
    risk = L.clamp(risk, 3, 82);
    const weeks = state.player.injured || 0;
    return { fatigue: fatigue, risk: risk, weeks: weeks, days: weeks * 7, energy: state.player.energy || 0 };
  }

  function seeDoctor(state) {
    const fit = fitnessReport(state);
    state.player.fatigue = L.clamp(fit.fatigue - 14, 0, 100);
    state.player.energy = L.clamp((state.player.energy || 0) + 8, 0, 100);
    if (state.player.injured > 1 && hash(state.week + 'doc') % 3 !== 0) {
      state.player.injured -= 1;
      return { ok: true, message: tx({ tr: 'Kulüp doktoru süreyi 1 hafta kısalttı. Kalan ' + (state.player.injured * 7) + ' gün.', en: 'The club doctor cut a week. ' + (state.player.injured * 7) + ' days left.' }) };
    }
    if (state.player.injured === 1 && hash(state.week + 'doc') % 2 === 0) {
      state.player.injured = 0;
      return { ok: true, message: tx({ tr: 'Doktor sahaya çıkabileceğini söyledi.', en: 'The doctor cleared you to play.' }) };
    }
    return { ok: true, message: tx({ tr: 'Doktor yorgunluğu düşürdü. Sakatlık riski %' + fitnessReport(state).risk + '.', en: 'The doctor eased the fatigue. Injury risk ' + fitnessReport(state).risk + '%.' }) };
  }

  function seePhysio(state) {
    const cost = Math.max(80, Math.round((state.wage || 200) * 0.35));
    if (state.player.money < cost) return { ok: false, message: tx({ tr: 'Fizyoterapist için ' + L.formatMoney(cost) + ' lazım.', en: 'The physio costs ' + L.formatMoney(cost) + '.' }) };
    state.player.money -= cost;
    state.player.fatigue = L.clamp((state.player.fatigue || 0) - 28, 0, 100);
    state.player.energy = L.clamp((state.player.energy || 0) + 16, 0, 100);
    if (state.player.injured > 0) state.player.injured -= 1;
    const left = (state.player.injured || 0) * 7;
    return { ok: true, message: tx({ tr: 'Özel fizyo ' + L.formatMoney(cost) + '. Kalan iyileşme ' + left + ' gün. Risk %' + fitnessReport(state).risk + '.', en: 'Private physio ' + L.formatMoney(cost) + '. Recovery left: ' + left + ' days. Risk ' + fitnessReport(state).risk + '%.' }) };
  }

  function applyAgeCurve(state) {
    ensureCareer(state);
    const age = state.player.age;
    const b = state.player.base;
    const notes = [];
    if (age >= 30) {
      const drop = age >= 34 ? 2 : 1;
      b.hiz = Math.max(16, b.hiz - drop);
      notes.push(tx({ tr: 'Hız −' + drop + ' (30’dan sonra düşer).', en: 'Pace −' + drop + ' (it falls after 30).' }));
    }
    if (age >= 33) b.guc = Math.max(16, b.guc - 1);
    if (age >= 27 && age <= 33 && b.vizyon < 94) {
      b.vizyon += 1;
      notes.push(tx({ tr: 'Vizyon +1. Zirve daha geç gelebilir.', en: 'Vision +1. It can peak later.' }));
    }
    if (age >= 26 && age <= 32 && state.player.finish < 96) {
      state.player.finish += 1;
      notes.push(tx({ tr: 'Bitiricilik +1.', en: 'Finishing +1.' }));
    } else if (age >= 36) state.player.finish = Math.max(18, state.player.finish - 1);
    if (age >= 29 && age <= 36 && state.player.mental < 95) state.player.mental += 1;
    state.player.familiar = Math.min(100, (state.player.familiar || 40) + 16);
    state.roleDeclinedSeason = null;
    state.ageNotes = notes;
    if (state.review) state.review.ageNotes = notes;
  }

  function makeSquad(state) {
    const h = hash(state.clubId + '|' + state.season);
    const squad = [];
    for (let i = 0; i < 5; i++) {
      squad.push({
        id: 'm' + i,
        name: pick(FIRST, h + i) + ' ' + pick(LAST, h + i * 3),
        pos: i === 0 ? 'forvet' : 'ortasaha',
        personality: TRAITS[i % TRAITS.length],
        rel: 42 + ((h >> i) % 36),
        age: 19 + ((h >> (i + 2)) % 14),
      });
    }
    state.squadClub = state.clubId;
    return squad;
  }

  function makeRival(state) {
    const clubs = L.clubsIn(state.country || 'tr', state.tier || 4).filter(function (c) { return c.id !== state.clubId; });
    const h = hash((state.clubId || '') + '|' + state.season + '|rival');
    const club = clubs.length ? clubs[h % clubs.length] : L.clubById(state.clubId);
    const young = (h % 3) !== 0;
    return {
      season: state.season,
      name: pick(FIRST, h + 4) + ' ' + pick(LAST, h + 9),
      age: young ? 19 + (h % 6) : 28 + (h % 6),
      clubId: club ? club.id : state.clubId,
      goals: h % 4,
      assists: h % 3,
      rating: 64 + (h % 12),
    };
  }

  function seedScorers(state) {
    const clubs = L.clubsIn(state.country || 'tr', state.tier || 4);
    const h = hash((state.country || 'tr') + '|' + state.tier + '|' + state.season);
    const rows = [];
    for (let i = 0; i < 10; i++) {
      const club = clubs[i % Math.max(1, clubs.length)];
      rows.push({
        name: pick(FIRST, h + i) + ' ' + pick(LAST, h + i * 2),
        clubId: club ? club.id : state.clubId,
        goals: (h + i * 5) % 8,
        assists: (h + i * 3) % 6,
        me: false,
      });
    }
    rows.push({
      name: state.player.name,
      clubId: state.clubId,
      goals: state.seasonGoals || 0,
      assists: state.seasonAssists || 0,
      me: true,
    });
    state.scorerTable = rows;
    state.scorerClub = state.clubId;
    state.scorerSeason = state.season;
  }

  function otherBoard(country, tier, season, kind) {
    const clubs = L.clubsIn(country || 'tr', tier || 1);
    const h = hash(country + '|' + tier + '|' + season + '|' + kind);
    const rows = [];
    const n = Math.max(8, Math.min(12, clubs.length));
    for (let i = 0; i < n; i++) {
      const club = clubs[i % Math.max(1, clubs.length)];
      rows.push({
        name: pick(FIRST, h + i * 7) + ' ' + pick(LAST, h + i),
        clubId: club ? club.id : '',
        goals: 4 + ((h + i * 11) % 18),
        assists: 2 + ((h + i * 5) % 12),
        me: false,
      });
    }
    return rows;
  }

  function scorerRows(state, country, tier) {
    ensurePlus(state);
    const c = country || state.country || 'tr';
    const t = tier || state.tier || 4;
    let rows;
    if (c === (state.country || 'tr') && t === (state.tier || 4)) {
      const me = state.scorerTable.filter(function (r) { return r.me; })[0];
      if (me) {
        me.goals = state.seasonGoals || 0;
        me.assists = state.seasonAssists || 0;
        me.name = state.player.name;
      }
      rows = state.scorerTable.slice();
    } else rows = otherBoard(c, t, state.season, 'league');
    return rows;
  }

  function sortedBoard(rows, key) {
    return rows.slice().sort(function (a, b) {
      return (b[key] || 0) - (a[key] || 0) || (b.goals || 0) - (a.goals || 0) || String(a.name).localeCompare(String(b.name), 'tr');
    });
  }

  function euroBoard(state) {
    ensurePlus(state);
    if (!state.europe) return [];
    const h = hash('euro|' + (state.europe.comp || 'star') + '|' + state.season);
    const rows = otherBoard('tr', 1, state.season, 'euro').slice(0, 8);
    rows.forEach(function (row, i) {
      row.goals = 1 + ((h + i * 4) % 7);
      row.assists = (h + i) % 5;
      row.clubId = '';
      row.name = pick(FIRST, h + i) + ' ' + pick(LAST, h + 20 + i);
    });
    rows.push({
      name: state.player.name,
      clubId: state.clubId,
      goals: state.europeGoals || 0,
      assists: state.europeAssists || 0,
      me: true,
    });
    return rows;
  }

  function buyGood(state, id) {
    ensurePlus(state);
    const item = good(id);
    if (!item) return { ok: false, message: tx({ tr: 'Rafta yok.', en: 'Not on the shelf.' }) };
    if (state.ownedGoods.some(function (g) { return g.id === id; })) return { ok: false, message: tx({ tr: 'Sende var.', en: 'You already own it.' }) };
    if (item.minTier && state.tier > item.minTier) return { ok: false, message: tx({ tr: 'Bu lig için erken.', en: 'Too soon for this league.' }) };
    if (state.player.money < item.price) return { ok: false, message: tx({ tr: 'Para yetmiyor.', en: 'Not enough money.' }) };
    state.player.money -= item.price;
    state.ownedGoods.push({ id: id });
    state.fame = L.clamp((state.fame || 0) + (item.fame || 0), 0, 100);
    if (state.family && item.happy) state.family.happiness = L.clamp(state.family.happiness + item.happy, 0, 100);
    if (state.family && item.family) state.family.happiness = L.clamp(state.family.happiness + item.family, 0, 100);
    if (state.player.partner && item.love) state.player.partner.love = L.clamp(state.player.partner.love + item.love, 0, 100);
    state.player.morale = L.clamp((state.player.morale || 50) + Math.round((item.happy || 0) / 2), 0, 100);
    return { ok: true, message: tx({ tr: labelGood(item, state) + ' senin.', en: labelGood(item, state) + ' is yours.' }) };
  }

  function sellGood(state, id) {
    ensurePlus(state);
    const item = good(id);
    const owned = state.ownedGoods.some(function (g) { return g.id === id; });
    if (!item || !owned) return { ok: false, message: tx({ tr: 'Satacak bir şey yok.', en: 'Nothing to sell.' }) };
    const back = Math.round(item.price * 0.55);
    state.player.money += back;
    state.ownedGoods = state.ownedGoods.filter(function (g) { return g.id !== id; });
    state.fame = L.clamp((state.fame || 0) - Math.round((item.fame || 0) / 2), 0, 100);
    return { ok: true, message: tx({ tr: 'Zararına gitti. ' + L.formatMoney(back) + '.', en: 'Sold at a loss. ' + L.formatMoney(back) + '.' }) };
  }

  function weeklyUpkeep(state) {
    ensurePlus(state);
    let cost = 0;
    state.ownedGoods.forEach(function (owned) {
      const item = good(owned.id);
      if (item) cost += item.upkeep || 0;
    });
    if (!cost) return 0;
    state.player.money = Math.max(0, state.player.money - cost);
    return cost;
  }

  function traitLine(mate) {
    const map = {
      selfish: { tr: 'Golü kendine ister.', en: 'Wants the goal for himself.' },
      jealous: { tr: 'Işık sende olunca surat eder.', en: 'Sours when the light is on you.' },
      mentor: { tr: 'Maç sonu doğruyu söyler.', en: 'Tells you the truth after the match.' },
      admirer: { tr: 'Seni izleyerek büyüyor.', en: 'Growing up by watching you.' },
      joker: { tr: 'Soyunma odasının sesi.', en: 'The noise of the dressing room.' },
    };
    return tx(map[mate.personality] || map.joker);
  }

  function roomEvent(state) {
    ensurePlus(state);
    const mate = state.squad[(state.week + state.season) % state.squad.length];
    const scenes = {
      selfish: { tr: mate.name + ' topu sana vermedi. Ne diyeceksin?', en: mate.name + ' did not give you the ball. What do you say?' },
      jealous: { tr: mate.name + ' röportajını kıskandı.', en: mate.name + ' was jealous of your interview.' },
      mentor: { tr: mate.name + ' akşam yemeğe çağırdı.', en: mate.name + ' invited you to dinner.' },
      admirer: { tr: mate.name + ' formanın numarasını sordu.', en: mate.name + ' asked about your shirt number.' },
      joker: { tr: mate.name + ' kramponunu sakladı. Şaka mı?', en: mate.name + ' hid your boot. A joke?' },
    };
    return { mate: mate, text: tx(scenes[mate.personality] || scenes.joker) };
  }

  function roomChoose(state, choice) {
    ensurePlus(state);
    const event = roomEvent(state);
    const mate = state.squad.filter(function (m) { return m.id === event.mate.id; })[0] || event.mate;
    let d = 0;
    let coach = 0;
    if (choice === 'calm') { d = 6; coach = 2; }
    else if (choice === 'joke') { d = mate.personality === 'joker' ? 8 : 1; coach = 0; }
    else if (choice === 'snap') { d = -8; coach = -3; }
    else { d = 3; coach = 1; }
    mate.rel = L.clamp(mate.rel + d, 0, 100);
    if (state.manager) {
      state.manager.rel = L.clamp(state.manager.rel + coach, 0, 100);
      state.player.rel.hoca = state.manager.rel;
    }
    state.player.rel.takim = L.clamp(state.player.rel.takim + Math.round(d / 3), 0, 100);
    return { ok: true, message: tx({ tr: mate.name + ' ilişkisi ' + mate.rel + '.', en: mate.name + ' relationship ' + mate.rel + '.' }) };
  }

  function refreshWindow(state) {
    const len = (state.rounds && state.rounds.length) || 7;
    const winterWeek = Math.max(2, Math.round(len / 2));
    const summer = state.week <= 1;
    const winter = state.week === winterWeek;
    const open = summer || winter;
    state.window = {
      open: open,
      kind: summer ? 'summer' : winter ? 'winter' : 'closed',
      days: open ? 3 : 0,
      label: summer
        ? { tr: 'Yaz penceresi', en: 'Summer window' }
        : winter
          ? { tr: 'Kış penceresi', en: 'Winter window' }
          : { tr: 'Pencere kapalı', en: 'Window shut' },
    };
    if (open && (!state.deadline || state.deadline.week !== state.week)) {
      const clubs = L.clubsIn(state.country || 'tr', Math.max(1, (state.tier || 4) - (state.week === 1 ? 0 : 0)));
      const pool = clubs.filter(function (c) { return c.id !== state.clubId; });
      const club = pool.length ? pool[hash(state.player.name + state.week) % pool.length] : null;
      if (club) {
        state.deadline = {
          week: state.week,
          days: 2,
          clubId: club.id,
          wage: Math.round(state.wage * 1.18 / 10) * 10,
          years: 3,
          clause: Math.round(state.wage * 32 / 10) * 10,
        };
      }
    }
    if (!open) state.deadline = null;
    const bossLow = state.manager && state.manager.rel < 42;
    state.clubWantsSale = !!bossLow;
  }

  function acceptDeadline(state) {
    ensurePlus(state);
    refreshWindow(state);
    const deal = state.deadline;
    if (!deal) return { ok: false, message: tx({ tr: 'Masada teklif yok.', en: 'No offer on the table.' }) };
    state.agreedOffer = {
      id: 'deadline-' + state.season + '-' + state.week,
      clubId: deal.clubId,
      tier: (L.clubById(deal.clubId) || {}).tier || state.tier,
      country: (L.clubById(deal.clubId) || {}).country || state.country,
      wage: deal.wage,
      years: deal.years,
    };
    state.releaseClause = deal.clause;
    state.player.rel.taraftar = L.clamp(state.player.rel.taraftar - 4, 0, 100);
    state.deadline = null;
    const club = L.clubById(state.agreedOffer.clubId);
    if (state.news) state.news.unshift(tx({ tr: 'Taraftar vedaya üzüldü. ' + (club ? club.name : '') + ' ile anlaştın.', en: 'Fans hated the goodbye. You agreed with ' + (club ? (club.nameEn || club.name) : '') + '.' }));
    return { ok: true, message: tx({ tr: 'Sezon sonu o kulüptesin.', en: 'You join them next season.' }) };
  }

  function stayPut(state) {
    ensurePlus(state);
    state.deadline = null;
    state.player.rel.taraftar = L.clamp(state.player.rel.taraftar + 3, 0, 100);
    return { ok: true, message: tx({ tr: 'Kulüpte kaldın. Tribün rahatladı.', en: 'You stayed. The stand relaxed.' }) };
  }

  function rollLoan(state) {
    ensurePlus(state);
    const clubs = L.clubsIn(state.country || 'tr', Math.min(4, (state.tier || 4) + 1)).filter(function (c) { return c.id !== state.clubId; });
    const club = clubs.length ? clubs[hash(state.week + 'loan') % clubs.length] : null;
    if (!club) return { ok: false, message: tx({ tr: 'Kiralık yok.', en: 'No loan.' }) };
    state.loanOffer = {
      clubId: club.id,
      wage: Math.round(state.wage * 0.9 / 10) * 10,
      weeks: 8,
      buy: Math.round(state.wage * 20 / 10) * 10,
    };
    return { ok: true, message: tx({ tr: club.name + ' seni kiralamak istiyor.', en: (club.nameEn || club.name) + ' want you on loan.' }) };
  }

  function acceptLoan(state) {
    ensurePlus(state);
    const offer = state.loanOffer;
    if (!offer) return { ok: false, message: tx({ tr: 'Teklif yok.', en: 'No offer.' }) };
    state.loan = { clubId: offer.clubId, weeks: offer.weeks, buy: offer.buy, wage: offer.wage, from: state.clubId };
    state.wage = offer.wage;
    state.squad = null;
    state.squadClub = '';
    const club = L.clubById(offer.clubId);
    state.clubId = offer.clubId;
    if (club) {
      state.tier = club.tier;
      state.country = club.country || state.country;
    }
    if (state.manager) state.manager = null;
    state.loanOffer = null;
    state.player.rel.taraftar = L.clamp(state.player.rel.taraftar - 2, 0, 100);
    L.migrate(state);
    if (L.setupSeason) L.setupSeason(state);
    state.week = 1;
    return { ok: true, message: tx({ tr: 'Kiralık gittin. Satın alma opsiyonu ' + L.formatMoney(offer.buy) + '.', en: 'You went on loan. Buy option ' + L.formatMoney(offer.buy) + '.' }) };
  }

  function positionOptions(state) {
    ensurePlus(state);
    if (state.player.age < 29) return null;
    if (state.roleDeclinedSeason === state.season) return null;
    const role = state.player.role || 'kanat';
    const options = [];
    if (role !== 'forvet') options.push('forvet');
    if (role !== 'onnumara') options.push('onnumara');
    if (role === 'forvet' && state.player.base.hiz >= 50) options.push('kanat');
    const text = role === 'kanat'
      ? { tr: 'Hoca: Hızın kanat için zorlanıyor. Menajerin de santrfor ya da on numara diyor. Karar senin.', en: 'Coach: Pace is getting hard on the wing. Your agent says striker or attacking mid. You choose.' }
      : { tr: 'Hoca: 29’u geçtin. Rolünü sezon içinde değiştirebilirsin. Alışkanlık maç maç artar.', en: 'Coach: You are past 29. You can change role this season. Familiarity grows match by match.' };
    return { from: role, options: options.slice(0, 2), text: tx(text), familiar: state.player.familiar || 0 };
  }

  function positionPitch(state) {
    const pitch = positionOptions(state);
    if (!pitch || !pitch.options.length) return null;
    return { to: pitch.options[0], text: pitch.text };
  }

  function acceptPosition(state, to) {
    const pitch = positionOptions(state);
    if (!pitch) return { ok: false, message: tx({ tr: 'Rol değişimi yok.', en: 'No role change.' }) };
    const role = to && pitch.options.indexOf(to) >= 0 ? to : pitch.options[0];
    state.player.role = role;
    state.player.pos = (role === 'ortasaha' || role === 'onnumara') ? 'ortasaha' : 'forvet';
    state.player.familiar = 22;
    if (role === 'forvet') state.player.finish = Math.min(96, (state.player.finish || 40) + 2);
    if (role === 'onnumara') state.player.base.vizyon = Math.min(99, state.player.base.vizyon + 2);
    if (state.manager) state.manager.rel = L.clamp(state.manager.rel + 4, 0, 100);
    state.roleDeclinedSeason = state.season;
    return { ok: true, message: tx({ tr: 'Yeni mevki başladı. Alışkanlık sezon boyunca artacak.', en: 'The new role starts. Familiarity grows across the season.' }) };
  }

  function declinePosition(state) {
    state.roleDeclinedSeason = state.season;
    if (state.manager) state.manager.rel = L.clamp(state.manager.rel - 2, 0, 100);
    return { ok: true, message: tx({ tr: 'Eski rolünde kaldın.', en: 'You kept the old role.' }) };
  }

  function chooseAfter(state, path) {
    if (!state.retired && L.retireCareer) L.retireCareer(state);
    const lines = {
      coach: { tr: 'Küçük bir kulübün hocası oldun. İlk konuşman soyunma odasında.', en: 'You became coach of a small club. The first talk is in the dressing room.' },
      pundit: { tr: 'Stüdyo ışığı yandı. Maçları ekrandan anlatıyorsun.', en: 'The studio lights came on. You talk through the matches on television.' },
      director: { tr: 'Sportif direktör oldun. Transfer listesi artık senin masanda.', en: 'You became sporting director. The transfer list sits on your desk.' },
      academy: { tr: 'Akademinin başına geçtin. 16 yaşındaki bir forvet senin kapında.', en: 'You took the academy. A 16-year-old striker is at your door.' },
    };
    state.after = {
      path: path,
      text: tx(lines[path] || lines.academy),
      goals: state.history ? state.history.goals : 0,
      assists: state.history ? state.history.assists : 0,
      titles: state.history ? state.history.titles : 0,
    };
    state.hall = true;
    return { ok: true, message: state.after.text };
  }

  function agentAdvice(state) {
    ensurePlus(state);
    if (!state.agent) return tx({ tr: 'Menajerin yok. Bu masada yalnızsın.', en: 'No agent. You sit at this table alone.' });
    if (!state.deadline) return tx({ tr: state.agent.name + ': Pencere sakinken imza atma.', en: state.agent.name + ': Do not sign while the window is quiet.' });
    return tx({ tr: state.agent.name + ': Ücret iyi, serbest kalma bedelini yükselt.', en: state.agent.name + ': The wage is fine. Push the release clause.' });
  }

  const origPass = L.resolvePass;
  L.resolvePass = function (scene, swipe, attrs, rng, pos) {
    const res = origPass(scene, swipe, attrs, rng, pos);
    if (!scene || scene.mateRel == null) return res;
    if ((res.outcome === 'pass' || res.outcome === 'assist') && scene.mateRel < 38 && rng() < 0.4) {
      return { outcome: 'cut', power: res.power, deg: res.deg, blocked: true };
    }
    return res;
  };

  const origComplete = L.completeMatch;
  L.completeMatch = function (state, report) {
    if (state && state.farewellMatch) {
      state.farewellMatch = false;
      state.farewellDone = true;
      const goals = (report && report.goals) || 0;
      const oppGoals = (report && report.oppGoals) || 0;
      state.lastMatch = {
        oppId: state.clubId,
        home: true,
        us: Math.max(goals, 1),
        them: oppGoals,
        result: goals > oppGoals ? 'win' : goals === oppGoals ? 'draw' : 'loss',
        week: state.week,
        goals: goals,
        assists: (report && report.assists) || 0,
        rating: 8.2,
        moments: [{ minute: 80, text: tx({ tr: 'Jübile. Tribün adını söyledi.', en: 'Testimonial. The stand said your name.' }) }],
        testimonial: true,
      };
      if (state.history) {
        state.history.matches = (state.history.matches || 0) + 1;
        state.history.goals = (state.history.goals || 0) + goals;
      }
      state.live = null;
      state.phase = 'result';
      state.afterResult = 'hall';
      state.player.energy = L.clamp((state.player.energy || 0) - 8, 0, 100);
      return { ok: true, match: state.lastMatch };
    }
    const res = origComplete(state, report);
    if (res && res.ok && state && state.player) {
      ensurePlus(state);
      state.player.familiar = Math.min(100, (state.player.familiar || 40) + 6);
      state.player.fatigue = L.clamp((state.player.fatigue || 0) + 12 + (state.player.age >= 32 ? 4 : 0), 0, 100);
      if (!state.player.injured) {
        const fit = fitnessReport(state);
        if (hash((state.season || 1) + '|' + state.week + '|inj') % 100 < Math.round(fit.risk * 0.28)) {
          state.player.injured = state.player.age >= 32 ? 2 : 1;
          if (state.news) state.news.unshift(tx({ tr: 'Sakatlandın. İyileşme ' + (state.player.injured * 7) + ' gün.', en: 'You got injured. Recovery is ' + (state.player.injured * 7) + ' days.' }));
        }
      }
      const cost = weeklyUpkeep(state);
      if (cost && state.news) state.news.unshift(tx({ tr: 'Haftalık hayat masrafı ' + L.formatMoney(cost) + '.', en: 'Weekly life cost ' + L.formatMoney(cost) + '.' }));
      if (state.rival) {
        state.rival.goals += (hash(state.week + 'g') % 2);
        state.rival.assists += (hash(state.week + 'a') % 2) ? 0 : 1;
      }
      if (state.scorerTable) {
        state.scorerTable.forEach(function (row, i) {
          if (row.me) return;
          if ((hash(state.season + '|' + state.week + '|' + i) % 3) === 0) row.goals += 1;
          if ((hash(state.season + '|' + state.week + '|a' + i) % 4) === 0) row.assists += 1;
        });
      }
      if (report && report.competition === 'avrupa') {
        state.europeGoals = (state.europeGoals || 0) + (report.goals || 0);
        state.europeAssists = (state.europeAssists || 0) + (report.assists || 0);
      }
      if (state.player.age >= 31 && state.player.injured) state.player.injured += 1;
      const rivalClub = state.rival && state.rival.clubId;
      if (rivalClub && state.lastMatch && state.lastMatch.oppId === rivalClub && state.news) {
        state.news.unshift(tx({ tr: state.rival.name + ' ile aynı sahadaydın.', en: 'You shared a pitch with ' + state.rival.name + '.' }));
      }
      refreshWindow(state);
    }
    return res;
  };

  const origFinish = L.finishSeason;
  if (origFinish) {
    L.finishSeason = function (state) {
      const res = origFinish(state);
      if (state && state.player) {
        ensurePlus(state);
        applyAgeCurve(state);
        const goals = sortedBoard(scorerRows(state), 'goals');
        const assists = sortedBoard(scorerRows(state), 'assists');
        state.trophies = state.trophies || [];
        if (goals[0] && goals[0].me && !state.trophies.some(function (t) { return t.season === state.season && t.name === 'Gol Kralı Ödülü'; })) {
          state.trophies.push({ name: 'Gol Kralı Ödülü', season: state.season });
        }
        if (assists[0] && assists[0].me && !state.trophies.some(function (t) { return t.season === state.season && t.name === 'Asist Kralı Ödülü'; })) {
          state.trophies.push({ name: 'Asist Kralı Ödülü', season: state.season });
        }
        if (state.player.contractYears === 0) {
          state.freeAgent = true;
          if (state.news) state.news.unshift(tx({ tr: 'Sözleşme bitti. Serbestsin.', en: 'The contract ended. You are a free agent.' }));
        }
        state.scorerTable = null;
      }
      return res;
    };
  }

  L.ensurePlus = ensurePlus;
  L.GOODS = GOODS;
  L.buyGood = buyGood;
  L.sellGood = sellGood;
  L.labelGood = labelGood;
  L.traitLine = traitLine;
  L.roomEvent = roomEvent;
  L.roomChoose = roomChoose;
  L.refreshWindow = refreshWindow;
  L.acceptDeadline = acceptDeadline;
  L.stayPut = stayPut;
  L.rollLoan = rollLoan;
  L.acceptLoan = acceptLoan;
  L.positionPitch = positionPitch;
  L.positionOptions = positionOptions;
  L.acceptPosition = acceptPosition;
  L.declinePosition = declinePosition;
  L.chooseAfter = chooseAfter;
  L.FOCUSES = FOCUSES;
  L.setWeeklyFocus = setWeeklyFocus;
  L.workFocus = workFocus;
  L.spendPoint = spendPoint;
  L.fitnessReport = fitnessReport;
  L.seeDoctor = seeDoctor;
  L.seePhysio = seePhysio;
  L.applyAgeCurve = applyAgeCurve;

  const origAttrs = L.matchAttrs;
  if (origAttrs) {
    L.matchAttrs = function (state) {
      const a = origAttrs(state);
      if (!state || !state.player) return a;
      if (typeof state.player.familiar === 'number' && state.player.familiar < 45) {
        a.teknik = Math.max(1, a.teknik - 2);
        a.vizyon = Math.max(1, a.vizyon - 1);
      }
      if (state.player.finish >= 70) a.teknik = Math.min(99, a.teknik + 1);
      if (state.player.mental >= 75) a.vizyon = Math.min(99, a.vizyon + 1);
      return a;
    };
  }

  const origTrain = L.train;
  if (origTrain) {
    L.train = function (state, attr) {
      const res = origTrain(state, attr);
      if (res && res.ok && state) {
        ensureCareer(state);
        const map = { hiz: 'pace', guc: 'physical', teknik: 'dribbling', vizyon: 'passing', frikik: 'finishing' };
        const gained = applyFocusGain(state, map[attr] || state.train.focus, 16);
        if (gained) res.message = (res.message || '') + ' ' + tx({ tr: 'Puan geldi.', en: 'A point landed.' });
      }
      return res;
    };
  }
  L.agentAdvice = agentAdvice;
  L.scorerRows = scorerRows;
  L.sortedBoard = sortedBoard;
  L.euroBoard = euroBoard;
  L.txPlus = tx;
})(typeof globalThis !== 'undefined' ? globalThis : this);
