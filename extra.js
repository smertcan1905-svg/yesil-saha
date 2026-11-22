/* Kariyerin dışı: pazarlık, hayat, kumar, kupa ve yeni pozisyonlar. */
(function (root) {
  'use strict';
  const L = root.YSLogic;
  if (!L) return;

  const GIFTS = [
    { id: 'cicek', name: 'Çiçek', price: 80, love: 6 },
    { id: 'yemek', name: 'Akşam yemeği', price: 260, love: 10 },
    { id: 'saat', name: 'Kol saati', price: 1400, love: 18 },
  ];
  const SPONSORS = [
    { id: 'cayir-kola', name: 'Çayır Kola', minRating: 6.4, pay: 180, weeks: 6, blurb: 'Formun 6,4 üstü kalsın.' },
    { id: 'toros', name: 'Toros Spor', minRating: 7.1, pay: 420, weeks: 6, blurb: 'Haftalık puanın 7,1 olsun.' },
    { id: 'yildiz-saat', name: 'Yıldız Saat', minRating: 7.8, pay: 900, weeks: 5, blurb: 'Yıldızların saati. Puan 7,8.' },
  ];
  const PARTNERS = ['Ela', 'Deniz', 'Mira', 'Kerem', 'Yağmur', 'Emir'];

  L.GIFTS = GIFTS;
  L.SPONSORS = SPONSORS;

  L.OUTCOMES.beat = { banner: 'Çalım!', detail: 'Rakibi avucunun içine aldın.' };
  L.OUTCOMES.lost = { banner: 'Top gitti', detail: 'Çalım tutmadı.' };
  L.OUTCOMES.foul = { banner: 'Faul!', detail: 'Rakip ancak faulle durdurabildi.' };
  L.OUTCOMES.win = { banner: 'Top kapıldı', detail: 'Geri dönüş temiz.' };
  L.OUTCOMES.header = { banner: 'Kafa!', detail: 'Zamanlama tam.' };

  function migrate(state) {
    if (!state || !state.player) return state;
    const p = state.player;
    if (typeof p.morale !== 'number') p.morale = 58;
    if (typeof p.injured !== 'number') p.injured = 0;
    if (typeof p.contractYears !== 'number') p.contractYears = 2;
    if (typeof p.goalBonus !== 'number') p.goalBonus = 40;
    if (p.partner === undefined) p.partner = null;
    if (p.sponsor === undefined) p.sponsor = null;
    if (!state.trophies) state.trophies = [];
    if (!state.seasonHistory) state.seasonHistory = [];
    if (!state.milli) state.milli = { caps: 0, goals: 0 };
    if (state.milliInvite === undefined) state.milliInvite = null;
    if (!state.cup) state.cup = { alive: true, round: 0, name: 'İlçe Kupası', playedWeek: 0 };
    if (state.europe === undefined) state.europe = state.tier === 1 ? { alive: true, round: 0, playedWeek: 0 } : null;
    if (!state.history.cups) state.history.cups = state.history.cups || 0;
    if (!state.history.playerAwards) state.history.playerAwards = 0;
    return state;
  }
  L.migrate = migrate;

  function playerValue(state) {
    migrate(state);
    const a = L.trainedAttrs(state);
    const avg = (a.hiz + a.guc + a.teknik + a.vizyon + a.frikik) / 5;
    const form = L.average(state.form && state.form.length ? state.form : [6.2]);
    const age = state.player.age;
    const ageK = age < 24 ? 1.05 : age < 30 ? 1 : age < 34 ? 0.82 : 0.62;
    const tierK = { 1: 1.35, 2: 1.15, 3: 1, 4: 0.9 }[state.tier] || 1;
    return (0.55 + avg / 120) * (0.65 + form / 12) * ageK * tierK;
  }
  L.playerValue = playerValue;

  function negotiate(state, offer, demand) {
    migrate(state);
    if (!offer) return { ok: false, result: 'yok', message: 'Teklif yok.' };
    demand = demand || {};
    const fair = offer.wage || state.wage;
    const askWage = Math.max(100, demand.wage || fair);
    const bonus = Math.max(0, demand.bonus || 0);
    const years = L.clamp(demand.years || offer.years || 2, 1, 5);
    const goalBonus = Math.max(0, demand.goalBonus || offer.goalBonus || 40);
    const value = playerValue(state);
    const greed = (askWage / fair) * 0.62 + (bonus / Math.max(1, fair * 6)) * 0.28 + (years > 4 ? 0.12 : 0) + (goalBonus / 400) * 0.08;
    const tolerance = 0.92 + Math.min(0.55, (value - 0.6) * 0.45);
    const pack = { wage: Math.round(askWage / 10) * 10, bonus: Math.round(bonus / 10) * 10, years: years, goalBonus: Math.round(goalBonus / 10) * 10 };
    if (greed <= tolerance) {
      return { ok: true, result: 'kabul', offer: Object.assign({}, offer, pack), message: 'Kulüp şartlarını kabul etti.' };
    }
    if (greed <= tolerance + 0.38) {
      const counter = {
        wage: Math.round(fair * Math.min(askWage / fair, tolerance) / 10) * 10,
        bonus: Math.round(Math.min(bonus, fair * 2) / 10) * 10,
        years: Math.min(years, 3),
        goalBonus: Math.min(goalBonus, offer.goalBonus || 80),
      };
      return { ok: true, result: 'karsi', offer: Object.assign({}, offer, counter), message: 'Kulüp karşı teklif yaptı.' };
    }
    return { ok: true, result: 'ret', message: 'Kulüp masadan kalktı.' };
  }
  L.negotiate = negotiate;

  function applyDeal(state, offer) {
    migrate(state);
    state.wage = offer.wage;
    state.player.contractYears = offer.years || 2;
    state.player.goalBonus = offer.goalBonus || state.player.goalBonus || 40;
    if (offer.bonus) {
      state.player.money += offer.bonus;
      state.history.earnings += offer.bonus;
    }
    state.player.morale = L.clamp((state.player.morale || 50) + 6, 0, 100);
  }
  L.applyDeal = applyDeal;

  function renewalOffer(state) {
    migrate(state);
    const bump = 1 + Math.max(0, L.average(state.form || []) - 6) * 0.08;
    const wage = Math.round(state.wage * bump / 10) * 10;
    return {
      id: 'renew-' + state.season,
      clubId: state.clubId,
      tier: state.tier,
      wage: Math.max(wage, state.wage),
      years: 3,
      bonus: Math.round(state.wage * 3 / 10) * 10,
      goalBonus: state.player.goalBonus || 40,
      kind: 'yenileme',
    };
  }
  L.renewalOffer = renewalOffer;

  function meetPartner(state) {
    migrate(state);
    if (state.player.partner) return { ok: false, message: 'Zaten birin var.' };
    if (state.player.money < 120) return { ok: false, message: 'Bir kahve ısmarlayacak paran yok.' };
    state.player.money -= 120;
    const name = PARTNERS[Math.floor(L.clamp(state.rng % 997, 0, 996) % PARTNERS.length)];
    state.player.partner = { name: name, love: 42 };
    state.player.morale = L.clamp(state.player.morale + 4, 0, 100);
    return { ok: true, message: name + ' ile tanıştın.' };
  }
  L.meetPartner = meetPartner;

  function dateNight(state) {
    migrate(state);
    if (!state.player.partner) return { ok: false, message: 'Önce biriyle tanış.' };
    if (state.player.money < 180) return { ok: false, message: 'Akşam için paran yetmiyor.' };
    state.player.money -= 180;
    state.player.partner.love = L.clamp(state.player.partner.love + 8, 0, 100);
    state.player.morale = L.clamp(state.player.morale + 5, 0, 100);
    return { ok: true, message: state.player.partner.name + ' akşamı sevdi. Bağ +8.' };
  }
  L.dateNight = dateNight;

  function giveGift(state, id) {
    migrate(state);
    if (!state.player.partner) return { ok: false, message: 'Hediye verecek kimse yok.' };
    const gift = GIFTS.find(function (g) { return g.id === id; });
    if (!gift) return { ok: false, message: 'Bu hediye yok.' };
    if (state.player.money < gift.price) return { ok: false, message: 'Yetersiz bakiye.' };
    state.player.money -= gift.price;
    state.player.partner.love = L.clamp(state.player.partner.love + gift.love, 0, 100);
    state.player.morale = L.clamp(state.player.morale + 2, 0, 100);
    return { ok: true, message: gift.name + ' gitti. Bağ +' + gift.love + '.' };
  }
  L.giveGift = giveGift;

  function signSponsor(state, id) {
    migrate(state);
    const deal = SPONSORS.find(function (s) { return s.id === id; });
    if (!deal) return { ok: false, message: 'Sponsor yok.' };
    const form = L.average(state.form && state.form.length ? state.form : [0]);
    if (state.form.length && form + 0.05 < deal.minRating) return { ok: false, message: 'Formun bu sözleşme için yetmiyor.' };
    if (!state.form.length && deal.minRating > 6.5) return { ok: false, message: 'Önce birkaç maç oyna.' };
    state.player.sponsor = { id: deal.id, name: deal.name, pay: deal.pay, weeks: deal.weeks, minRating: deal.minRating };
    return { ok: true, message: deal.name + ' ile el sıkıştın. Haftalık ' + L.formatMoney(deal.pay) + '.' };
  }
  L.signSponsor = signSponsor;

  const origBuy = L.buy;
  L.buy = function (state, itemId, qty) {
    migrate(state);
    const before = (state.player.ownedLife || []).length;
    const res = origBuy(state, itemId, qty);
    if (res && res.ok && (state.player.ownedLife || []).length > before) {
      state.player.morale = L.clamp(state.player.morale + 8, 0, 100);
      if (state.player.partner) state.player.partner.love = L.clamp(state.player.partner.love + 4, 0, 100);
    }
    return res;
  };

  const origRest = L.rest;
  L.rest = function (state) {
    migrate(state);
    const res = origRest(state);
    if (res && res.ok && state.player.injured > 0) {
      state.player.injured -= 1;
      res.message += state.player.injured ? ' Sakatlık: ' + state.player.injured + ' hafta.' : ' Sakatlık geçti.';
    }
    return res;
  };

  function missMatch(state) {
    migrate(state);
    if (!state.player.injured) return { ok: false, message: 'Sakatlığın yok.' };
    const res = L.completeMatch(state, {
      goals: 0, assists: 0, shots: 0, onTarget: 0, passesOk: 0, turnovers: 0,
      selfish: 0, bigMiss: 0, oppGoals: 1, soloGoals: 0, tired: true, moments: [],
    });
    if (state.player.injured > 0) state.player.injured -= 1;
    return res && res.ok ? { ok: true, message: 'Maçı kaçırdın. Takım sahada yalnızdı.' } : res;
  }
  L.missMatch = missMatch;

  function slot(state, bet) {
    migrate(state);
    bet = Math.round(bet);
    if (bet < 20 || bet > 2000) return { ok: false, message: 'Bahis 20 ile 2.000 arası olsun.' };
    if (state.player.money < bet) return { ok: false, message: 'Yetersiz bakiye.' };
    const icons = ['limon', 'yıldız', 'yedi', 'top'];
    function roll() { return icons[Math.floor((rngPull(state)) * icons.length)] || 'top'; }
    function rngPull(s) {
      let a = s.rng >>> 0;
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      s.rng = a >>> 0;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    const reels = [roll(), roll(), roll()];
    let mult = 0;
    if (reels[0] === reels[1] && reels[1] === reels[2]) mult = reels[0] === 'yedi' ? 8 : reels[0] === 'yıldız' ? 5 : 3;
    else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) mult = 1.2;
    const win = Math.round(bet * mult);
    state.player.money += win - bet;
    return { ok: true, reels: reels, win: win, net: win - bet, message: mult ? 'Kazanç ' + L.formatMoney(win) + '.' : 'Boş döndü.' };
  }
  L.slot = slot;

  function roulette(state, bet, pick) {
    migrate(state);
    bet = Math.round(bet);
    if (bet < 20 || state.player.money < bet) return { ok: false, message: 'Bahis geçersiz.' };
    let a = state.rng >>> 0;
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    state.rng = a >>> 0;
    const n = ((t ^ (t >>> 14)) >>> 0) % 37;
    const red = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].indexOf(n) >= 0;
    let mult = 0;
    if (pick === 'kirmizi' && red) mult = 2;
    else if (pick === 'siyah' && n !== 0 && !red) mult = 2;
    else if (String(pick) === String(n)) mult = 20;
    const win = bet * mult;
    state.player.money += win - bet;
    return { ok: true, number: n, win: win, net: win - bet, message: 'Çark ' + n + '. ' + (mult ? 'Kazandın.' : 'Kaybettin.') };
  }
  L.roulette = roulette;

  function blackjack(state, bet, standAt) {
    migrate(state);
    bet = Math.round(bet);
    if (bet < 20 || state.player.money < bet) return { ok: false, message: 'Bahis geçersiz.' };
    function pull() {
      let a = state.rng >>> 0;
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      state.rng = a >>> 0;
      return 1 + (((t ^ (t >>> 14)) >>> 0) % 13);
    }
    function val(card) { return card === 1 ? 11 : card >= 10 ? 10 : card; }
    function hand(cards) {
      let s = 0;
      let aces = 0;
      cards.forEach(function (c) { s += val(c); if (c === 1) aces += 1; });
      while (s > 21 && aces) { s -= 10; aces -= 1; }
      return s;
    }
    const player = [pull(), pull()];
    const dealer = [pull(), pull()];
    const target = standAt || 17;
    while (hand(player) < target) player.push(pull());
    const ps = hand(player);
    if (ps > 21) {
      state.player.money -= bet;
      return { ok: true, player: player, dealer: dealer, net: -bet, message: 'Battın. ' + ps + '.' };
    }
    while (hand(dealer) < 17) dealer.push(pull());
    const ds = hand(dealer);
    let net = 0;
    let message = 'Berabere.';
    if (ds > 21 || ps > ds) { net = bet; message = 'El sende. ' + ps + '–' + ds + '.'; }
    else if (ps < ds) { net = -bet; message = 'Krupiye aldı. ' + ps + '–' + ds + '.'; }
    state.player.money += net;
    return { ok: true, player: player, dealer: dealer, net: net, message: message };
  }
  L.blackjack = blackjack;

  function resolveDribble(scene, swipe, attrs, rng) {
    const def = (scene.defenders && scene.defenders[0]) || { x: scene.ball.x, y: scene.ball.y - 70 };
    const dx = swipe.x2 - swipe.x1;
    const dy = swipe.y2 - swipe.y1;
    const dist = Math.hypot(dx, dy);
    const power = L.clamp(dist / L.POWER_SCALE, 0, 100);
    const swipeAng = Math.atan2(dy, dx);
    const defAng = Math.atan2(def.y - scene.ball.y, def.x - scene.ball.x);
    let diff = Math.abs(swipeAng - defAng);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    const deg = diff * 180 / Math.PI;
    const need = 32 - (attrs.hiz || 40) * 0.16;
    if (power < 18) return { outcome: 'lost', deg: deg };
    if (deg < Math.max(12, need)) {
      if (rng() < 0.22 + (attrs.hiz || 40) / 400) return { outcome: 'foul', deg: deg };
      return { outcome: 'lost', deg: deg };
    }
    if (rng() < 0.12) return { outcome: 'foul', deg: deg };
    return { outcome: 'beat', deg: deg };
  }
  L.resolveDribble = resolveDribble;

  function resolveTackle(scene, swipe, attrs, rng) {
    const atk = scene.attacker || (scene.defenders && scene.defenders[0]);
    if (!atk) return { outcome: 'lost', deg: 180 };
    const dx = swipe.x2 - swipe.x1;
    const dy = swipe.y2 - swipe.y1;
    const swipeAng = Math.atan2(dy, dx);
    const ang = Math.atan2(atk.y - scene.ball.y, atk.x - scene.ball.x);
    let diff = Math.abs(swipeAng - ang);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    const deg = diff * 180 / Math.PI;
    const tol = 20 + (attrs.hiz || 40) * 0.16 + (attrs.guc || 40) * 0.06;
    if (deg <= tol && rng() < 0.5 + (attrs.guc || 40) / 260) return { outcome: 'win', deg: deg };
    return { outcome: 'lost', deg: deg };
  }
  L.resolveTackle = resolveTackle;

  function resolveHeader(scene, accuracy, attrs, rng) {
    const acc = L.clamp(accuracy, 0, 1);
    const mouth = scene.goal.y + scene.goal.h;
    const aimX = scene.goal.x + 18 + rng() * (scene.goal.w - 36);
    if (acc < 0.42) return { outcome: 'wide', aimX: aimX, onTarget: false };
    let saveP = 0.26 + (scene.gkSkill || 50) / 280 - (attrs.guc || 40) / 420 - acc * 0.22;
    saveP = L.clamp(saveP, 0.1, 0.86);
    if (rng() < saveP) return { outcome: 'save', aimX: aimX, onTarget: true };
    return { outcome: 'goal', aimX: aimX, onTarget: true };
  }
  L.resolveHeader = resolveHeader;

  const origApply = L.applyChance;
  L.applyChance = function (stats, kind, outcome) {
    if (kind === 'dribble') {
      if (outcome === 'beat' || outcome === 'foul') stats.passesOk += 1;
      else { stats.turnovers += 1; stats.bigMiss += 1; }
      return;
    }
    if (kind === 'tackle') {
      if (outcome === 'win') stats.passesOk += 1;
      else stats.bigMiss += 1;
      return;
    }
    if (kind === 'header') {
      stats.shots += 1;
      if (outcome === 'goal') { stats.goals += 1; stats.onTarget += 1; }
      else if (outcome === 'save' || outcome === 'weak') stats.onTarget += 1;
      else stats.bigMiss += 1;
      return;
    }
    return origApply(stats, kind, outcome);
  };

  function suggestSwipe(scene) {
    const g = scene.goal;
    if ((scene.type === 'pas' || scene.type === 'orta') && scene.teammate) {
      return L.swipeToward(scene.ball, scene.teammate, 52);
    }
    if (scene.type === 'savunma' && (scene.attacker || (scene.defenders && scene.defenders[0]))) {
      const atk = scene.attacker || scene.defenders[0];
      return L.swipeToward(scene.ball, atk, 48);
    }
    if (scene.type === 'calim' && scene.defenders && scene.defenders[0]) {
      const def = scene.defenders[0];
      const away = { x: scene.ball.x + (scene.ball.x < def.x ? -70 : 70), y: scene.ball.y - 80 };
      return L.swipeToward(scene.ball, away, 46);
    }
    const left = { x: g.x + 18, y: g.y + g.h };
    const right = { x: g.x + g.w - 18, y: g.y + g.h };
    const target = Math.abs(left.x - scene.keeper.x) >= Math.abs(right.x - scene.keeper.x) ? left : right;
    return L.swipeToward(scene.ball, target, scene.close ? 50 : 58);
  }
  L.suggestSwipe = suggestSwipe;

  function beginSpecial(state, kind) {
    migrate(state);
    if (state.player.injured > 0) return { ok: false, message: 'Sakatın. Önce dinlen.' };
    if (kind === 'kupa' && (!state.cup || !state.cup.alive)) return { ok: false, message: 'Kupada yoksun.' };
    if (kind === 'avrupa' && (!state.europe || !state.europe.alive)) return { ok: false, message: 'Kıta kupasında yoksun.' };
    if (kind === 'milli' && !state.milliInvite) return { ok: false, message: 'Milli davet yok.' };
    const live = L.createMatch(state);
    if (!live) return { ok: false, message: 'Maç kurulamadı.' };
    live.competition = kind;
    live.compName = kind === 'milli' ? 'Milli maç' : kind === 'avrupa' ? 'Kıta Kupası' : (state.cup && state.cup.name) || 'Kupa';
    if (kind === 'avrupa' && L.FOREIGN && L.FOREIGN.length) {
      const pick = L.FOREIGN[Math.abs((state.season * 5 + state.week) | 0) % L.FOREIGN.length];
      live.displayOpp = pick.name;
      live.oppColor = pick.color;
      live.oppSecond = pick.second;
    } else if (kind === 'milli') {
      live.displayOpp = 'Kıyı Milli';
      live.oppColor = '#b91c1c';
    } else {
      live.displayOpp = 'Kupa Rakibi';
      live.oppColor = '#1d4ed8';
    }
    return { ok: true, message: live.compName + ' başlıyor.' };
  }
  L.beginSpecial = beginSpecial;

  function maybeMilli(state) {
    migrate(state);
    if (state.milliInvite || state.retired) return null;
    if (state.player.age < 18) return null;
    const form = L.average(state.form || []);
    if (!state.form || state.form.length < 3 || form < 7.25) return null;
    if ((state.tier || 4) > 2 && form < 7.6) return null;
    state.milliInvite = { foe: 'Kıyı Milli' };
    return state.milliInvite;
  }
  L.maybeMilli = maybeMilli;

  const origComplete = L.completeMatch;
  L.completeMatch = function (state, report) {
    migrate(state);
    const res = origComplete(state, report);
    if (res && res.ok) {
      if (state.player.partner) state.player.partner.love = L.clamp(state.player.partner.love - 1, 0, 100);
      if (!state.milliInvite) maybeMilli(state);
    }
    return res;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
