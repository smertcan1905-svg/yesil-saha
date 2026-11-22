/* Aile, eş, menajer, hayal kulübü, ülke kupası ve kıta kupaları. */
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
    return lang() === 'en' ? (pack.en || pack.tr || '') : (pack.tr || pack.en || '');
  }
  function hash(text) {
    let h = 2166136261;
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function pick(list, n) { return list[n % list.length]; }

  const MOTHERS = ['Sevim', 'Nurten', 'Aysel', 'Hacer', 'Filiz', 'Gülten'];
  const FATHERS = ['Kemal', 'Osman', 'Hüseyin', 'Mustafa', 'Yusuf', 'Cemil'];
  const SIBS = ['Ela', 'Burak', 'Defne', 'Kaan', 'Nehir', 'Arda'];
  const BOSSES = [
    { name: 'Hakan Demirtaş', personality: 'strict' },
    { name: 'Selim Karaca', personality: 'fatherly' },
    { name: 'Vedat Uslu', personality: 'tactical' },
    { name: 'Orhan Bektaş', personality: 'hot' },
    { name: 'Cem Aladağ', personality: 'strict' },
    { name: 'Tarık Yüce', personality: 'tactical' },
    { name: 'Bora Sezgin', personality: 'hot' },
    { name: 'Levent Acar', personality: 'fatherly' },
  ];
  const AGENTS = [
    { id: 'kucuk', name: 'Naci Küçük', cut: 5, skill: 42, tr: 'Ucuz ve sabırlı.', en: 'Cheap and patient.' },
    { id: 'orta', name: 'Jale Mert', cut: 8, skill: 68, tr: 'Sözleşmeyi o konuşur.', en: 'She does the talking.' },
    { id: 'yildiz', name: 'Rafael Costa', cut: 12, skill: 88, tr: 'Kapıları açar, payı yüksektir.', en: 'Opens doors, takes a larger cut.' },
  ];
  const CUPS = {
    tr: { tr: 'Anadolu Kupası', en: 'Anatolia Cup' },
    en: { tr: 'Crown Trophy', en: 'Crown Trophy' },
    es: { tr: 'Copa Sol', en: 'Copa Sol' },
    it: { tr: 'Coppa Aurora', en: 'Coppa Aurora' },
    de: { tr: 'Adler Pokal', en: 'Adler Pokal' },
    fr: { tr: 'Coupe Lumière', en: 'Coupe Lumière' },
    nl: { tr: 'Tulp Beker', en: 'Tulp Beker' },
    pt: { tr: 'Taça Atlântico', en: 'Taça Atlântico' },
  };
  const EU = {
    diamond: { tr: 'Elmas Kupa', en: 'Diamond Cup' },
    road: { tr: 'Altın Yol Kupası', en: 'Golden Road Cup' },
    star: { tr: 'Yıldız Serisi', en: 'Star Series' },
  };
  const SHIELDS = {
    season: { tr: 'Açılış Kalkanı', en: 'Season Shield' },
    continental: { tr: 'Kıtal Kalkan', en: 'Continental Shield' },
    nations: { tr: 'Uluslar Turnuvası', en: 'Nations Trophy' },
  };
  const ROUND_NAMES = [
    { tr: 'Son 16', en: 'Round of 16' },
    { tr: 'Çeyrek final', en: 'Quarter-final' },
    { tr: 'Yarı final', en: 'Semi-final' },
    { tr: 'Final', en: 'Final' },
  ];

  function cupPack(country) { return CUPS[country] || CUPS.tr; }
  function euPack(id) { return EU[id] || EU.star; }

  function makeFamily(state) {
    const h = hash(state.player.name + '|' + (state.clubId || ''));
    const sibs = 1 + (h % 2);
    const siblings = [];
    for (let i = 0; i < sibs; i++) {
      siblings.push({
        name: pick(SIBS, h + i * 3),
        age: 12 + ((h >> (i + 2)) % 10),
        football: i === 0,
      });
    }
    return {
      mother: pick(MOTHERS, h),
      father: pick(FATHERS, h >> 4),
      siblings: siblings,
      happiness: 62,
      seen: {},
      log: [],
    };
  }

  function makeManager(state) {
    const h = hash((state.clubId || 'x') + '|' + state.season + '|' + (state.week || 1));
    const boss = pick(BOSSES, h);
    return { name: boss.name, personality: boss.personality, rel: 52 + (h % 18), clubId: state.clubId };
  }

  function assignEurope(state, force) {
    if (!state || state.tier !== 1) {
      if (state && state.tier !== 1) state.europe = null;
      return;
    }
    if (!state.europe) state.europe = { alive: true, round: 0, playedWeek: 0, gp: 0, pts: 0 };
    if (state.europe.comp && !force) return;
    const clubs = L.clubsIn(state.country || 'tr', 1).slice().sort(function (a, b) { return b.strength - a.strength; });
    let idx = clubs.findIndex(function (c) { return c.id === state.clubId; });
    if (state.review && state.review.rank) idx = state.review.rank - 1;
    const comp = idx >= 0 && idx < 2 ? 'diamond' : idx < 5 ? 'road' : 'star';
    state.europe.comp = comp;
    state.europe.name = euPack(comp).tr;
    state.europe.nameEn = euPack(comp).en;
    state.europe.alive = true;
    state.europe.round = state.europe.round || 0;
    state.europe.gp = force ? 0 : (state.europe.gp || 0);
    state.europe.pts = force ? 0 : (state.europe.pts || 0);
    state.europe.playedWeek = force ? 0 : (state.europe.playedWeek || 0);
    if (!state.europe.rivals || force) {
      state.europe.rivals = ['Liman Mavi', 'Kale Beyaz', 'Vadi Kırmızı'].map(function (name, i) {
        return { name: name, pts: i === 0 ? 1 : 0 };
      });
    }
  }

  function ensureWorld(state) {
    if (!state || !state.player) return state;
    if (!state.family || !state.family.mother) state.family = makeFamily(state);
    if (typeof state.family.happiness !== 'number') state.family.happiness = 62;
    if (!state.family.seen) state.family.seen = {};
    if (!state.family.log) state.family.log = [];
    if (!state.manager || state.manager.clubId !== state.clubId) {
      state.manager = makeManager(state);
      state.player.rel.hoca = state.manager.rel;
    }
    if (!state.targets) {
      state.targets = {
        goals: state.player.pos === 'forvet' ? 12 : 6,
        rating: 6.8,
        caps: state.tier <= 2 ? 1 : 0,
      };
    }
    if (typeof state.media !== 'number') state.media = 40;
    if (typeof state.sponsorHeat !== 'number') state.sponsorHeat = 20;
    if (!state.cup) state.cup = { alive: true, round: 0, playedWeek: 0 };
    const cup = cupPack(state.country || 'tr');
    state.cup.name = cup.tr;
    state.cup.nameEn = cup.en;
    if (state.tier === 1) assignEurope(state, false);
    return state;
  }

  function bumpHappy(state, n) {
    state.family.happiness = L.clamp((state.family.happiness || 50) + n, 0, 100);
    state.player.morale = L.clamp((state.player.morale || 50) + Math.round(n * 0.6), 0, 100);
  }

  function familyMail(state) {
    ensureWorld(state);
    const f = state.family;
    const sib = f.siblings[0];
    const pool = [
      { id: 'hi', from: f.mother, tr: f.mother + ': Oğlum, iyi misin? Bu hafta kendini yorma.', en: f.mother + ': Are you alright? Do not wear yourself out this week.' },
      { id: 'house', from: f.father, cost: 450, tr: f.father + ': Evin çatısı aktı. ' + 450 + ' lira yollayabilir misin?', en: f.father + ': The roof is leaking. Can you send 450?' },
      { id: 'school', from: f.mother, cost: 280, tr: f.mother + ': ' + sib.name + ' okul taksitini sordu.', en: f.mother + ': ' + sib.name + ' asked about the school fee.' },
      { id: 'ball', from: sib.name, tr: sib.name + ': Ben de futbolcu olmak istiyorum. Bir idmanına geleyim mi?', en: sib.name + ': I want to be a footballer too. Can I come to training?' },
      { id: 'birth', from: f.mother, energy: 8, tr: f.mother + ': Babanın doğum günü. Akşam eve gelir misin?', en: f.mother + ': It is your father\'s birthday. Will you come home?' },
      { id: 'wed', from: f.father, energy: 12, cost: 600, tr: f.father + ': Kuzenin evleniyor. Düğüne yetiş, masraf da var.', en: f.father + ': Your cousin is getting married. Come, and it costs a bit.' },
      { id: 'proud', from: f.mother, tr: f.mother + ': Golünü komşulara izlettim. Gözlerim doldu.', en: f.mother + ': I made the neighbours watch your goal. I teared up.' },
      { id: 'hurt', from: f.father, tr: f.father + ': Sakatlandığını duydum. Doktoru dinle, acele etme.', en: f.father + ': I heard you were hurt. Listen to the doctor.' },
    ];
    let mail = null;
    if (state.player.injured > 0) mail = pool[7];
    else if ((state.seasonGoals || 0) > 0 && !f.seen.proud) mail = pool[6];
    else mail = pool[(state.season * 3 + state.week) % 6];
    if (f.pending && f.pending.id === mail.id && f.pending.week === state.week) return f.pending;
    f.pending = { id: mail.id, week: state.week, from: mail.from, tr: mail.tr, en: mail.en, cost: mail.cost || 0, energy: mail.energy || 0 };
    return f.pending;
  }

  function familyChoose(state, id) {
    ensureWorld(state);
    const mail = familyMail(state);
    let message = { tr: 'Tamam.', en: 'Alright.' };
    if (id === 'help') {
      const cost = mail.cost || 0;
      if (cost && state.player.money < cost) message = { tr: 'Para yetmedi.', en: 'The money was not there.' };
      else {
        if (cost) state.player.money -= cost;
        if (mail.energy) state.player.energy = L.clamp(state.player.energy - mail.energy, 0, 100);
        bumpHappy(state, 8);
        message = { tr: 'Aile rahatladı.', en: 'The family relaxed.' };
      }
    } else if (id === 'later') {
      bumpHappy(state, -6);
      message = { tr: 'Ertelendi. Evdeki ses kısıldı.', en: 'You put it off. The house went quiet.' };
    } else if (id === 'warm') {
      bumpHappy(state, 4);
      message = { tr: 'Sıcak bir cevap yetti.', en: 'A warm reply was enough.' };
    } else if (id === 'bring') {
      bumpHappy(state, 7);
      state.player.energy = L.clamp(state.player.energy - 6, 0, 100);
      message = { tr: sibLine(state), en: sibLine(state, true) };
    }
    state.family.seen[mail.id] = (state.family.seen[mail.id] || 0) + 1;
    state.family.log.unshift({ from: mail.from, text: tx(mail), reply: tx(message) });
    if (state.family.log.length > 12) state.family.log.pop();
    state.family.pending = null;
    return { ok: true, message: tx(message) };
  }
  function sibLine(state, en) {
    const name = state.family.siblings[0].name;
    return en ? name + ' came to training and would not stop smiling.' : name + ' idmana geldi, gülümsemesi bitmedi.';
  }

  function partnerScene(state) {
    ensureWorld(state);
    const p = state.player.partner;
    if (!p) return null;
    const night = !!state.player.nightFlag;
    const love = p.love || 0;
    const scenes = [
      { id: 'date', tr: p.name + ' bu akşam sadece seninle yemek istiyor.', en: p.name + ' wants dinner with only you tonight.', need: 160 },
      { id: 'time', tr: p.name + ': Antrenman bitince de telefonun kapalı. Beni unuttun.', en: p.name + ': Your phone dies after training. You forgot me.' },
      { id: 'argue', tr: p.name + ': Yine geç kaldın. Bu böyle gitmez.', en: p.name + ': You are late again. This cannot go on.' },
      { id: 'jealous', tr: p.name + ': Gece dışarıdaydın. Kimleydin?', en: p.name + ': You were out last night. Who with?' },
      { id: 'move', tr: p.name + ': Aynı eve çıkalım. Anahtar bende de olsun.', en: p.name + ': Let us move in together. I want a key too.' },
      { id: 'ring', tr: p.name + ' yüzüğü ciddiye bindi. Aileler de soruyor.', en: p.name + ' is serious about a ring. The families are asking.' },
      { id: 'break', tr: p.name + ': Ben böyle mutlu değilim.', en: p.name + ': I am not happy like this.' },
    ];
    let scene = scenes[(state.week + (p.love || 0)) % 4];
    if (night) scene = scenes[3];
    else if (love >= 78 && state.player.money > 2000) scene = scenes[5];
    else if (love >= 70) scene = scenes[4];
    else if (love < 28) scene = scenes[6];
    return scene;
  }

  function partnerChoose(state, id) {
    ensureWorld(state);
    const p = state.player.partner;
    if (!p) return { ok: false, message: lang() === 'en' ? 'Meet someone first.' : 'Önce biriyle tanış.' };
    const scene = partnerScene(state);
    if (id === 'break') {
      state.player.partner = null;
      state.player.morale = L.clamp(state.player.morale - 10, 0, 100);
      state.player.nightFlag = false;
      return { ok: true, message: lang() === 'en' ? 'It ended.' : 'İlişki bitti.' };
    }
    if (id === 'date') {
      const res = L.dateNight ? L.dateNight(state) : { ok: false, message: '' };
      if (res.ok) bumpHappy(state, 3);
      return res.ok ? { ok: true, message: tx({ tr: p.name + ' akşamı unutmadı.', en: p.name + ' will remember tonight.' }) } : res;
    }
    if (id === 'promise') {
      p.love = L.clamp(p.love + 6, 0, 100);
      state.player.morale = L.clamp(state.player.morale + 3, 0, 100);
      state.player.nightFlag = false;
      return { ok: true, message: tx({ tr: 'Söz verdin. İçi rahatladı.', en: 'You promised. That settled them.' }) };
    }
    if (id === 'cold') {
      p.love = L.clamp(p.love - 8, 0, 100);
      state.player.morale = L.clamp(state.player.morale - 4, 0, 100);
      return { ok: true, message: tx({ tr: 'Soğuk cevap. Ev sessiz.', en: 'A cold answer. The flat went quiet.' }) };
    }
    if (id === 'move') {
      if (state.player.money < 900) return { ok: false, message: tx({ tr: 'Depozito için para yok.', en: 'No money for the deposit.' }) };
      state.player.money -= 900;
      p.love = L.clamp(p.love + 14, 0, 100);
      p.home = true;
      bumpHappy(state, 6);
      return { ok: true, message: tx({ tr: 'Aynı evdesiniz.', en: 'You share a home now.' }) };
    }
    if (id === 'ring') {
      if (state.player.money < 2500) return { ok: false, message: tx({ tr: 'Yüzük için erken.', en: 'Too soon for a ring.' }) };
      state.player.money -= 2500;
      p.love = 100;
      p.married = true;
      bumpHappy(state, 12);
      state.player.morale = L.clamp(state.player.morale + 8, 0, 100);
      return { ok: true, message: tx({ tr: 'Nişan haber oldu.', en: 'The engagement made the news.' }) };
    }
    if (scene && scene.id === 'jealous' && id === 'honest') {
      p.love = L.clamp(p.love - 2, 0, 100);
      state.player.nightFlag = false;
      return { ok: true, message: tx({ tr: 'Doğruyu söyledin. Kırgın ama duruyor.', en: 'You told the truth. Hurt, but still here.' }) };
    }
    p.love = L.clamp(p.love + 2, 0, 100);
    return { ok: true, message: tx({ tr: 'Konuşma kapandı.', en: 'The talk ended.' }) };
  }

  function hireAgent(state, id) {
    ensureWorld(state);
    const found = AGENTS.filter(function (a) { return a.id === id; })[0];
    if (!found) return { ok: false, message: 'Yok.' };
    if (state.player.money < 200) return { ok: false, message: tx({ tr: 'İmza parası yok.', en: 'No money for the signing fee.' }) };
    state.player.money -= 200;
    state.agent = { id: found.id, name: found.name, cut: found.cut, skill: found.skill };
    return { ok: true, message: tx({ tr: found.name + ' menajerin oldu. Pay %' + found.cut + '.', en: found.name + ' is your agent. Cut ' + found.cut + '%.' }) };
  }
  function fireAgent(state) {
    ensureWorld(state);
    if (!state.agent) return { ok: false, message: tx({ tr: 'Menajerin yok.', en: 'You have no agent.' }) };
    const name = state.agent.name;
    state.agent = null;
    return { ok: true, message: tx({ tr: name + ' ile yollar ayrıldı.', en: 'You and ' + name + ' parted.' }) };
  }

  function agentScene(state) {
    ensureWorld(state);
    if (!state.agent) return null;
    const a = state.agent;
    const scenes = [
      { id: 'wage', tr: a.name + ': Kulübe maaş artışı açalım. Ben masadayım.', en: a.name + ': Let us open a pay rise. I will sit at the table.' },
      { id: 'offer', tr: a.name + ': Başka kulüp seni sordu. Aceleye gerek yok.', en: a.name + ': Another club asked about you. No need to rush.' },
      { id: 'sponsor', tr: a.name + ': Bir marka forma için aradı. Ismin duyulsun.', en: a.name + ': A brand called about your shirt. Let the name travel.' },
      { id: 'advice', tr: a.name + ': Bu hafta faul yapma, kart sınırdasın. Sakin oyna.', en: a.name + ': You are near a ban. Play calm this week.' },
    ];
    return scenes[(state.week + a.skill) % scenes.length];
  }

  function agentChoose(state, id) {
    ensureWorld(state);
    if (!state.agent) return { ok: false, message: tx({ tr: 'Önce menajer tut.', en: 'Hire an agent first.' }) };
    if (id === 'push') {
      const offer = L.renewalOffer ? L.renewalOffer(state) : null;
      if (offer && L.negotiate) {
        offer.wage = Math.round(offer.wage * (1 + state.agent.skill / 400));
        const res = L.negotiate(state, offer, { wage: offer.wage, bonus: offer.bonus, years: offer.years, goalBonus: offer.goalBonus });
        if (res && (res.result === 'kabul' || res.result === 'karsi')) {
          return { ok: true, message: tx({ tr: 'Menajer masadan bir şey çıkardı.', en: 'The agent got something out of the room.' }) };
        }
      }
      return { ok: true, message: tx({ tr: 'Kulüp kapıyı araladı, imza sonra.', en: 'The club left the door ajar.' }) };
    }
    if (id === 'sponsor') {
      state.sponsorHeat = L.clamp((state.sponsorHeat || 20) + 12 + Math.round(state.agent.skill / 20), 0, 100);
      return { ok: true, message: tx({ tr: 'Markalar menajerini arıyor.', en: 'Brands are calling the agent.' }) };
    }
    if (id === 'wait') {
      state.player.morale = L.clamp(state.player.morale + 2, 0, 100);
      return { ok: true, message: tx({ tr: 'Sabrettin. Menajer de onayladı.', en: 'You waited. The agent agreed.' }) };
    }
    state.media = L.clamp((state.media || 40) + 3, 0, 100);
    return { ok: true, message: tx({ tr: 'Tavsiye cepte.', en: 'Advice noted.' }) };
  }

  function setDream(state, clubId) {
    ensureWorld(state);
    const club = L.clubById(clubId);
    if (!club) return { ok: false, message: 'Kulüp yok.' };
    state.dream = { clubId: club.id, signed: club.id === state.clubId, since: state.season };
    if (state.dream.signed) state.news.unshift(tx({ tr: 'Hayalindeki kulüptesin.', en: 'You are at the club you dreamed of.' }));
    return { ok: true, message: tx({ tr: club.name + ' artık hayalin.', en: club.name + ' is the dream now.' }) };
  }

  function dreamView(state) {
    ensureWorld(state);
    const country = state.dreamBrowse || state.country || 'tr';
    const clubs = L.clubsIn(country, 1).slice();
    const dream = state.dream && L.clubById(state.dream.clubId);
    let gap = '';
    if (dream) {
      const same = (dream.country || 'tr') === (state.country || 'tr');
      const tiers = (dream.tier || 1) - (state.tier || 4);
      gap = !same
        ? tx({ tr: 'Önce o ülkenin ligine geçmen gerek.', en: 'You still need a move to that country.' })
        : tiers > 0
          ? tx({ tr: tiers + ' kademe yukarıdasın.', en: 'You are ' + tiers + ' tiers above it.' })
          : tiers < 0
            ? tx({ tr: Math.abs(tiers) + ' lig uzaktasın.', en: Math.abs(tiers) + ' leagues away.' })
            : tx({ tr: 'Aynı ligdesiniz. Gözlemciler bakıyor.', en: 'Same league. Scouts are watching.' });
    }
    const goals = state.seasonGoals || 0;
    const rate = state.seasonRatings && state.seasonRatings.length ? L.average(state.seasonRatings) : 0;
    return {
      country: country,
      clubs: clubs,
      dream: dream,
      signed: !!(state.dream && state.dream.signed),
      gap: gap,
      targets: state.targets,
      goals: goals,
      rate: Math.round(rate * 10) / 10,
      caps: (state.milli && state.milli.caps) || 0,
    };
  }

  function bossCard(state, when) {
    ensureWorld(state);
    const b = state.manager;
    const rel = b.rel;
    const stats = state.live && state.live.stats;
    const us = stats ? L.teamGoals(stats) : 0;
    const them = stats ? stats.oppGoals || 0 : 0;
    const packs = {
      strict: {
        pre: { tr: b.name + ': Bugün bahanen olmasın. İşini yap.', en: b.name + ': No excuses today. Do your job.' },
        half: { tr: us >= them ? b.name + ': Skor yetmez. İkinci yarı da böyle.' : b.name + ': Bu yarı kabul edilemez.', en: us >= them ? b.name + ': The score is not enough.' : b.name + ': That half is unacceptable.' },
        post: { tr: rel >= 60 ? b.name + ': İdare eder. Yarın da aynı ciddiyet.' : b.name + ': Bu seviyeyle oynatmam.', en: rel >= 60 ? b.name + ': It will do. Same focus tomorrow.' : b.name + ': I will not pick you at this level.' },
      },
      fatherly: {
        pre: { tr: b.name + ': Rahat ol evlat. Takım seninle.', en: b.name + ': Easy, son. The team is with you.' },
        half: { tr: b.name + ': Nefes al. Skor ' + us + '–' + them + '. Birlikte toparlarız.', en: b.name + ': Breathe. It is ' + us + '–' + them + '. We fix it together.' },
        post: { tr: b.name + ': Elinden geleni gördüm. Kapı açık.', en: b.name + ': I saw the effort. The door stays open.' },
      },
      tactical: {
        pre: { tr: b.name + ': Koridorda kal. İlk dokunuş ileri.', en: b.name + ': Stay in the lane. First touch goes forward.' },
        half: { tr: b.name + ': Pres yüksek olsun. Kanatları boş bırakma.', en: b.name + ': Press higher. Do not leave the wings.' },
        post: { tr: b.name + ': Plan ' + (us > them ? 'işledi.' : 'yarım kaldı.'), en: b.name + ': The plan ' + (us > them ? 'worked.' : 'came up short.') },
      },
      hot: {
        pre: { tr: b.name + ': Kan istiyorum bugün! Uyuma!', en: b.name + ': I want blood today. Wake up!' },
        half: { tr: us < them ? b.name + ': Soyunma odasını dağıtırım!' : b.name + ': Böyle devam! Bağırma bana yetmez, gol yetmez!', en: us < them ? b.name + ': I will tear this dressing room up!' : b.name + ': More! Shouting is not a goal!' },
        post: { tr: b.name + ': Ya böylesin ya kulübede oturursun.', en: b.name + ': Play like that or sit in the stands.' },
      },
    };
    const tone = packs[b.personality] || packs.tactical;
    const body = tone[when] || tone.pre;
    const expect = state.live && state.live.expect;
    const extra = expect === 'score'
      ? { tr: ' Beklenti: bugün gol.', en: ' Expectation: a goal today.' }
      : expect === 'track'
        ? { tr: ' Beklenti: geri koş, top kaybetme.', en: ' Expectation: track back, do not give it away.' }
        : { tr: ' Beklenti: üretim, asist kovalamak.', en: ' Expectation: create, chase an assist.' };
    return {
      title: b.name,
      personality: b.personality,
      rel: b.rel,
      body: tx(body) + (when === 'pre' ? tx(extra) : ''),
    };
  }

  function applyBoss(state, when, choice) {
    ensureWorld(state);
    const b = state.manager;
    const id = choice || 'humble';
    let d = 0;
    if (id === 'humble') d = b.personality === 'hot' ? 2 : 4;
    else if (id === 'confident') d = b.personality === 'tactical' ? 4 : 1;
    else if (id === 'arrogant') d = b.personality === 'fatherly' ? -3 : -6;
    else if (id === 'minutes') d = b.rel < 45 ? 3 : -2;
    if (when === 'post' && state.live && state.live.stats) {
      const met = expectMet(state);
      d += met ? 5 : -4;
    }
    b.rel = L.clamp(b.rel + d, 0, 100);
    state.player.rel.hoca = b.rel;
    if (b.rel >= 76 && state.player.rel.takim < 70) state.player.rel.takim = L.clamp(state.player.rel.takim + 2, 0, 100);
    return { ok: true, message: tx({ tr: 'Hoca ilişkisi ' + b.rel + '.', en: 'Coach relationship ' + b.rel + '.' }) };
  }

  function expectMet(state) {
    const live = state.live;
    if (!live || !live.stats) return false;
    const s = live.stats;
    if (live.expect === 'score') return (s.goals || 0) > 0;
    if (live.expect === 'track') return (s.turnovers || 0) <= 1;
    return (s.assists || 0) > 0 || (s.passesOk || 0) >= 2;
  }

  function pressCard(state, when) {
    ensureWorld(state);
    const derby = state.live && state.live.meta && state.live.meta.derby;
    const big = state.live && state.live.meta && (state.live.meta.importance === 'final' || state.live.meta.importance === 'derby');
    const milli = state.live && state.live.competition === 'milli';
    let q;
    if (milli) q = { tr: 'Milli forma hakkında ne dersin?', en: 'What about the national shirt?' };
    else if (derby) q = { tr: 'Rakibi nasıl görüyorsun? Şehir bunu konuşuyor.', en: 'How do you see the rival? The city is talking.' };
    else if (big) q = { tr: 'Büyük gece. Üzerindeki yükü hissediyor musun?', en: 'A big night. Do you feel the weight?' };
    else if (when === 'post') q = { tr: 'Maç bitti. Tek cümle?', en: 'The match is over. One sentence?' };
    else q = { tr: 'Bu hafta senden ne bekleyelim?', en: 'What should we expect from you this week?' };
    return { body: tx(q), big: !!(big || milli) };
  }

  function applyPress(state, choice) {
    ensureWorld(state);
    const id = choice || 'calm';
    const b = state.manager;
    if (id === 'trash') {
      state.media = L.clamp(state.media + 8, 0, 100);
      state.player.rel.taraftar = L.clamp(state.player.rel.taraftar + 4, 0, 100);
      if (b) { b.rel = L.clamp(b.rel - 5, 0, 100); state.player.rel.hoca = b.rel; }
      state.player.rel.takim = L.clamp(state.player.rel.takim - 2, 0, 100);
      state.news.unshift(tx({ tr: 'Basın: Yıldız rakibi kızdırdı.', en: 'Press: The star riled the rival.' }));
    } else if (id === 'humble') {
      state.media = L.clamp(state.media + 2, 0, 100);
      if (b) { b.rel = L.clamp(b.rel + 3, 0, 100); state.player.rel.hoca = b.rel; }
      state.player.rel.takim = L.clamp(state.player.rel.takim + 2, 0, 100);
      state.news.unshift(tx({ tr: 'Basın: Sakin ve saygılı bir cevap.', en: 'Press: A calm and respectful answer.' }));
    } else if (id === 'us') {
      state.player.rel.takim = L.clamp(state.player.rel.takim + 4, 0, 100);
      state.player.rel.taraftar = L.clamp(state.player.rel.taraftar + 2, 0, 100);
      state.news.unshift(tx({ tr: 'Basın: Övgü takıma gitti.', en: 'Press: The praise went to the team.' }));
    } else {
      state.sponsorHeat = L.clamp(state.sponsorHeat + 6, 0, 100);
      state.media = L.clamp(state.media + 3, 0, 100);
      state.news.unshift(tx({ tr: 'Basın: Markalar bu cümleyi kesti.', en: 'Press: Brands clipped that sentence.' }));
    }
    return { ok: true, message: state.news[0] };
  }

  function maybeOffice(state) {
    ensureWorld(state);
    if (!state.manager) return null;
    if (state.player.nightFlag && state.manager.personality === 'strict') return 'discipline';
    if (state.manager.rel < 36) return 'bench';
    if (state.manager.rel > 86) return 'praise';
    if ((state.inboxOffer || (state.media || 0) > 70) && state.manager.rel > 50) return 'transfer';
    if ((state.week || 1) % 5 === 0) return 'role';
    return null;
  }

  function officeCard(state) {
    const kind = (state.live && state.live.officeKind) || maybeOffice(state) || 'praise';
    const b = state.manager;
    const map = {
      bench: { tr: b.name + ': Bu hafta kulübedesin. Dakika istiyorsan söyle.', en: b.name + ': You are on the bench. Ask if you want minutes.' },
      praise: { tr: b.name + ': Soyunma odasının sesi oldun. Böyle devam.', en: b.name + ': You became the voice of the room. Keep it.' },
      role: { tr: b.name + ': Seni başka bir rolde de düşünüyorum.', en: b.name + ': I am thinking of you in another role.' },
      discipline: { tr: b.name + ': Gece hayatın sahaya çıktı. Bu son uyarı.', en: b.name + ': The nightlife showed up on the pitch. Last warning.' },
      transfer: { tr: b.name + ': Dışarıdan ses var. Gitmek ister misin, yoksa kalır mısın?', en: b.name + ': There is noise outside. Do you want to go, or stay?' },
    };
    return { kind: kind, body: tx(map[kind] || map.praise) };
  }

  function applyOffice(state, choice) {
    ensureWorld(state);
    const kind = (state.live && state.live.officeKind) || maybeOffice(state) || 'praise';
    const id = choice || 'stay';
    const b = state.manager;
    if (kind === 'discipline' || id === 'sorry') {
      b.rel = L.clamp(b.rel + 2, 0, 100);
      state.player.nightFlag = false;
      state.player.morale = L.clamp(state.player.morale - 2, 0, 100);
    } else if (id === 'minutes' || kind === 'bench') {
      b.rel = L.clamp(b.rel + (id === 'arrogant' ? -4 : 1), 0, 100);
    } else if (id === 'switch' && kind === 'role') {
      state.player.pos = state.player.pos === 'forvet' ? 'ortasaha' : 'forvet';
      b.rel = L.clamp(b.rel + 3, 0, 100);
    } else if (id === 'stay') {
      b.rel = L.clamp(b.rel + 2, 0, 100);
    }
    state.player.rel.hoca = b.rel;
    return { ok: true, message: tx({ tr: 'Ofis bitti.', en: 'The office meeting ended.' }) };
  }

  function applyCard(state, stage, choice) {
    if (stage === 'talk' || stage === 'htalk' || stage === 'post') {
      const when = stage === 'htalk' ? 'half' : stage === 'post' ? 'post' : 'pre';
      return applyBoss(state, when, choice);
    }
    if (stage === 'press' || stage === 'flash') return applyPress(state, choice);
    if (stage === 'office') return applyOffice(state, choice);
    return { ok: true, message: '' };
  }

  function cupDue(state) {
    ensureWorld(state);
    if (!state.cup || !state.cup.alive || state.cup.round >= 4) return false;
    if (state.cup.playedWeek === state.week) return false;
    return state.week % 2 === 1;
  }
  function europeDue(state) {
    ensureWorld(state);
    if (!state.europe || !state.europe.alive) return false;
    if (state.europe.playedWeek === state.week) return false;
    if ((state.europe.gp || 0) >= 3 && state.europe.round >= 4) return false;
    return state.week % 2 === 0;
  }
  function superDue(state) {
    return !!(state.super && state.super.alive && state.super.playedWeek !== state.week && state.week === 1);
  }

  function bracket(state) {
    ensureWorld(state);
    const rows = ROUND_NAMES.map(function (name, index) {
      const done = state.cup.round > index;
      const now = state.cup.round === index && state.cup.alive;
      return { name: tx(name), done: done, now: now, alive: state.cup.alive };
    });
    return { title: tx(cupPack(state.country || 'tr')), rows: rows, round: state.cup.round };
  }

  function euroView(state) {
    ensureWorld(state);
    if (!state.europe) return null;
    const pack = euPack(state.europe.comp);
    return {
      title: tx(pack),
      comp: state.europe.comp,
      gp: state.europe.gp || 0,
      pts: state.europe.pts || 0,
      rivals: state.europe.rivals || [],
      round: state.europe.round || 0,
      alive: state.europe.alive,
    };
  }

  function noteScout(state) {
    if (!state.dream || state.dream.signed) return;
    const club = L.clubById(state.dream.clubId);
    if (!club) return;
    const rate = state.seasonRatings && state.seasonRatings.length ? L.average(state.seasonRatings) : 0;
    if (rate < 6.6 && (state.seasonGoals || 0) < 3) return;
    const line = tx({
      tr: club.name + ' gözlemcisi bu hafta tribündeydi.',
      en: 'A ' + (club.nameEn || club.name) + ' scout was in the stands.',
    });
    if (!state.news || state.news[0] === line) return;
    state.news.unshift(line);
    state.media = L.clamp((state.media || 40) + 2, 0, 100);
  }

  function paintFace(canvas, kind, color) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const dpr = 2;
    canvas.width = 88 * dpr;
    canvas.height = 104 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 88, 104);
    ctx.fillStyle = color || '#15803d';
    ctx.beginPath();
    ctx.arc(44, 78, 26, Math.PI, 0);
    ctx.fill();
    const skin = kind === 'father' || kind === 'boss' ? '#c68642' : '#e0b08a';
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(44, 40, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = kind === 'boss' ? '#94a3b8' : '#1c1917';
    ctx.beginPath();
    ctx.arc(44, 36, kind === 'father' ? 16 : 18, Math.PI, 0);
    ctx.fill();
    if (kind === 'mother' || kind === 'partner') {
      ctx.fillRect(28, 36, 6, 16);
      ctx.fillRect(54, 36, 6, 16);
    }
    ctx.fillStyle = '#111';
    ctx.fillRect(36, 40, 3, 3);
    ctx.fillRect(50, 40, 3, 3);
  }

  const origMigrate = L.migrate;
  L.migrate = function (state) {
    const next = origMigrate ? origMigrate(state) : state;
    return ensureWorld(next);
  };

  const origComplete = L.completeMatch;
  L.completeMatch = function (state, report) {
    const eu = state && state.europe;
    const pending = eu && eu.pending;
    const res = origComplete(state, report);
    if (res && res.ok && state) {
      if (state.agent && res.match && res.match.earn) {
        const cut = Math.round(res.match.earn * state.agent.cut / 100);
        state.player.money = Math.max(0, state.player.money - cut);
        res.match.earn -= cut;
      }
      if (report && report.competition === 'avrupa' && state.europe && pending) {
        const euNow = state.europe;
        const result = state.lastMatch && state.lastMatch.result;
        if (pending === 'group') {
          euNow.alive = true;
          euNow.gp = (euNow.gp || 0) + 1;
          euNow.pts = (euNow.pts || 0) + (result === 'win' ? 3 : result === 'draw' ? 1 : 0);
          euNow.round = 0;
          if (euNow.gp >= 3) {
            euNow.round = 1;
            euNow.alive = euNow.pts >= 4;
            if (!euNow.alive && state.news) state.news.unshift(tx({ tr: 'Gruplar elendi.', en: 'Out of the group.' }));
          }
        }
        euNow.pending = null;
      }
      if (report && (report.competition === 'shield' || report.competition === 'cshield') && state.lastMatch && state.lastMatch.result === 'win') {
        state.trophies = state.trophies || [];
        state.trophies.push({
          name: report.competition === 'cshield' ? SHIELDS.continental.tr : SHIELDS.season.tr,
          season: state.season,
        });
        if (state.super) state.super.alive = false;
      }
      if (state.dream && state.dream.clubId === state.clubId) {
        state.dream.signed = true;
      }
      noteScout(state);
      if (state.manager && state.form && state.form.length >= 4) {
        const bad = state.form.slice(-4).filter(function (r) { return r < 5.6; }).length;
        if (bad >= 3 && state.manager.rel < 40 && state.week > 3) {
          const old = state.manager.name;
          state.manager = null;
          ensureWorld(state);
          if (state.news) state.news.unshift(tx({ tr: old + ' gönderildi. Yeni hoca geldi.', en: old + ' was sacked. A new coach arrived.' }));
        }
      }
    }
    return res;
  };

  const origNext = L.beginNextSeason;
  if (origNext) {
    L.beginNextSeason = function (state) {
      const champ = state.review && state.review.champion;
      const wonCup = (state.trophies || []).some(function (t) { return t.season === state.season; });
      const res = origNext(state);
      if (champ || wonCup) state.super = { alive: true, playedWeek: 0 };
      if (state.tier === 1) assignEurope(state, true);
      else state.europe = null;
      state.targets = null;
      ensureWorld(state);
      return res;
    };
  }

  const origBegin = L.beginSpecial;
  L.beginSpecial = function (state, kind) {
    ensureWorld(state);
    if (kind === 'shield' || kind === 'cshield') {
      const live = L.createMatch(state);
      if (!live) return { ok: false, message: 'Maç kurulamadı.' };
      live.competition = kind;
      live.compName = kind === 'cshield' ? SHIELDS.continental.tr : SHIELDS.season.tr;
      live.displayOpp = lang() === 'en' ? 'Shield rival' : 'Kalkan rakibi';
      if (state.super) state.super.playedWeek = state.week;
      return { ok: true, message: live.compName };
    }
    if (kind === 'avrupa' && state.europe) {
      state.europe.pending = (state.europe.gp || 0) < 3 ? 'group' : 'ko';
    }
    const res = origBegin ? origBegin(state, kind) : { ok: false, message: 'Yok.' };
    if (res && res.ok && state.live) {
      if (kind === 'avrupa' && state.europe) {
        const pack = euPack(state.europe.comp);
        state.europe.name = pack.tr;
        state.europe.nameEn = pack.en;
        state.live.compName = pack.tr;
        state.live.euroNight = true;
      }
      if (kind === 'kupa' && state.cup) state.live.compName = state.cup.name;
    }
    return res;
  };

  if (L.slot) {
    const origSlot = L.slot;
    L.slot = function (state, bet) {
      const res = origSlot(state, bet);
      if (res && res.ok && state && state.player) state.player.nightFlag = true;
      return res;
    };
  }

  L.ensureWorld = ensureWorld;
  L.familyMail = familyMail;
  L.familyChoose = familyChoose;
  L.partnerScene = partnerScene;
  L.partnerChoose = partnerChoose;
  L.AGENTS = AGENTS;
  L.hireAgent = hireAgent;
  L.fireAgent = fireAgent;
  L.agentScene = agentScene;
  L.agentChoose = agentChoose;
  L.setDream = setDream;
  L.dreamView = dreamView;
  L.bossCard = bossCard;
  L.pressCard = pressCard;
  L.officeCard = officeCard;
  L.maybeOffice = maybeOffice;
  L.applyCard = applyCard;
  L.cupDue = cupDue;
  L.europeDue = europeDue;
  L.superDue = superDue;
  L.cupBracket = bracket;
  L.euroView = euroView;
  L.paintFace = paintFace;
  L.euPack = euPack;
  L.worldText = tx;
})(typeof globalThis !== 'undefined' ? globalThis : this);
