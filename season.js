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
    return state;
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

  function positionPitch(state) {
    ensurePlus(state);
    if (state.player.age < 30 && state.player.base.hiz >= 40) return null;
    const to = state.player.pos === 'forvet' ? 'ortasaha' : 'forvet';
    const text = state.player.pos === 'forvet'
      ? { tr: 'Hoca: Hızın düşüyor. Onu orta sahaya çekeyim, hedef forvet gibi değil.', en: 'Coach: Your pace is fading. I would drop you into midfield.' }
      : { tr: 'Hoca: Ceza sahasına daha yakın oynatacağım.', en: 'Coach: I would play you closer to goal.' };
    return { to: to, text: tx(text) };
  }

  function acceptPosition(state) {
    const pitch = positionPitch(state);
    if (!pitch) return { ok: false, message: tx({ tr: 'Rol değişimi yok.', en: 'No role change.' }) };
    state.player.pos = pitch.to;
    state.player.base.hiz = Math.max(18, state.player.base.hiz - 1);
    state.player.base.vizyon = Math.min(99, state.player.base.vizyon + 1);
    if (state.manager) state.manager.rel = L.clamp(state.manager.rel + 4, 0, 100);
    return { ok: true, message: tx({ tr: 'Yeni rolün başladı.', en: 'The new role starts now.' }) };
  }

  function declinePosition(state) {
    if (state.manager) state.manager.rel = L.clamp(state.manager.rel - 2, 0, 100);
    return { ok: true, message: tx({ tr: 'Eski rolünde kaldın.', en: 'You kept the old role.' }) };
  }

  function chooseAfter(state, path) {
    if (!state.retired && L.retireCareer) L.retireCareer(state);
    const lines = {
      coach: { tr: 'Altyapıda başladın. Üç karar sonra küçük bir kulübün hocasısın.', en: 'You started with the youth side. Three calls later you coach a small club.' },
      pundit: { tr: 'Stüdyo ışığı yandı. Maçları anlatıyorsun.', en: 'The studio lights came on. You talk through the matches.' },
      ambassador: { tr: 'Kulüp seni elçi yaptı. Tribün hâlâ adını bağırıyor.', en: 'The club made you an ambassador. The stand still shouts your name.' },
    };
    state.after = {
      path: path,
      text: tx(lines[path] || lines.ambassador),
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
    const res = origComplete(state, report);
    if (res && res.ok && state && state.player) {
      ensurePlus(state);
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
        if (state.player.age >= 32) state.player.base.hiz = Math.max(18, state.player.base.hiz - 1);
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
  L.acceptPosition = acceptPosition;
  L.declinePosition = declinePosition;
  L.chooseAfter = chooseAfter;
  L.agentAdvice = agentAdvice;
  L.scorerRows = scorerRows;
  L.sortedBoard = sortedBoard;
  L.euroBoard = euroBoard;
  L.txPlus = tx;
})(typeof globalThis !== 'undefined' ? globalThis : this);
