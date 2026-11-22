/* Günlük ödül, görevler, görünüm ve rekorlar. Eski kayda alan ekler. */
(function (root) {
  'use strict';
  const L = root.YSLogic;
  if (!L) return;

  const LOOK = {
    hair: ['short', 'curly', 'long', 'buzz', 'mohawk'],
    hairColor: ['#1c1917', '#6b3a1f', '#d4a017', '#9a3412', '#e7e5e4'],
    skin: ['#f3d2b3', '#e0b08a', '#c68642', '#8d5524'],
    boots: ['#111827', '#f8fafc', '#b91c1c', '#eab308', '#1d4ed8'],
    beard: ['none', 'stubble', 'full'],
  };

  const DAILY = [
    { money: 250 },
    { energy: 25 },
    { drinks: 1 },
    { money: 600 },
    { energy: 40 },
    { drinks: 2 },
    { money: 1500, drinks: 1 },
  ];

  const MISSIONS = {
    daily: [
      { id: 'train', need: 1, reward: { money: 150 } },
      { id: 'match', need: 1, reward: { energy: 20 } },
      { id: 'goal', need: 1, reward: { money: 300 } },
    ],
    weekly: [
      { id: 'goals', need: 3, reward: { money: 800 } },
      { id: 'wins', need: 1, reward: { drinks: 1 } },
    ],
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function dateKey(d) {
    const x = d instanceof Date ? d : new Date();
    return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
  }

  function prevKey(key) {
    const p = String(key).split('-');
    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    d.setDate(d.getDate() - 1);
    return dateKey(d);
  }

  function weekKey(d) {
    const x = d instanceof Date ? d : new Date();
    const start = new Date(x.getFullYear(), 0, 1);
    const n = Math.ceil(((x - start) / 86400000 + start.getDay() + 1) / 7);
    return x.getFullYear() + '-W' + n;
  }

  function defaultLook() {
    return { hair: 'short', hairColor: '#1c1917', skin: '#e0b08a', boots: '#111827', beard: 'none' };
  }

  function freshMissions(now) {
    return {
      day: dateKey(now),
      week: weekKey(now),
      daily: { train: 0, match: 0, goal: 0, claimed: {} },
      weekly: { goals: 0, wins: 0, claimed: {} },
    };
  }

  function ensureMeta(state, now) {
    if (!state || !state.player) return state;
    if (!state.player.look) state.player.look = defaultLook();
    const look = state.player.look;
    if (LOOK.hair.indexOf(look.hair) < 0) look.hair = 'short';
    if (!look.hairColor) look.hairColor = '#1c1917';
    if (!look.skin) look.skin = '#e0b08a';
    if (!look.boots) look.boots = '#111827';
    if (LOOK.beard.indexOf(look.beard) < 0) look.beard = 'none';
    if (!state.daily) state.daily = { last: '', claimed: '', streak: 0 };
    if (!state.missions) state.missions = freshMissions(now);
    rollMissions(state, now);
    return state;
  }

  function rollMissions(state, now) {
    if (!state.missions) state.missions = freshMissions(now);
    const day = dateKey(now);
    const week = weekKey(now);
    if (state.missions.day !== day) {
      state.missions.day = day;
      state.missions.daily = { train: 0, match: 0, goal: 0, claimed: {} };
    }
    if (state.missions.week !== week) {
      state.missions.week = week;
      state.missions.weekly = { goals: 0, wins: 0, claimed: {} };
    }
    if (!state.missions.daily.claimed) state.missions.daily.claimed = {};
    if (!state.missions.weekly.claimed) state.missions.weekly.claimed = {};
  }

  function applyReward(state, reward) {
    if (!reward) return;
    if (reward.money) {
      state.player.money += reward.money;
      state.history.earnings = (state.history.earnings || 0) + reward.money;
    }
    if (reward.energy) state.player.energy = L.clamp(state.player.energy + reward.energy, 0, 100);
    if (reward.drinks) state.player.drinks += reward.drinks;
  }

  function claimDaily(state, now) {
    ensureMeta(state, now);
    const key = dateKey(now);
    if (state.daily.claimed === key) return { ok: false, reason: 'claimed' };
    if (state.daily.last === prevKey(key)) state.daily.streak = (state.daily.streak % 7) + 1;
    else state.daily.streak = 1;
    const reward = DAILY[state.daily.streak - 1];
    applyReward(state, reward);
    state.daily.last = key;
    state.daily.claimed = key;
    return { ok: true, streak: state.daily.streak, reward: reward };
  }

  function bumpMission(state, kind, n, now) {
    ensureMeta(state, now);
    const add = n || 1;
    const d = state.missions.daily;
    const w = state.missions.weekly;
    if (kind === 'train') d.train += add;
    if (kind === 'match') d.match += add;
    if (kind === 'goal') { d.goal += add; w.goals += add; }
    if (kind === 'win') w.wins += add;
  }

  function missionValue(state, scope, id) {
    const bag = scope === 'weekly' ? state.missions.weekly : state.missions.daily;
    if (scope === 'weekly' && id === 'goals') return bag.goals || 0;
    return bag[id] || 0;
  }

  function claimMission(state, scope, id, now) {
    ensureMeta(state, now);
    const list = MISSIONS[scope] || [];
    const spec = list.find(function (m) { return m.id === id; });
    if (!spec) return { ok: false, reason: 'missing' };
    const bag = scope === 'weekly' ? state.missions.weekly : state.missions.daily;
    if (bag.claimed[id]) return { ok: false, reason: 'claimed' };
    if (missionValue(state, scope, id) < spec.need) return { ok: false, reason: 'early' };
    bag.claimed[id] = true;
    applyReward(state, spec.reward);
    return { ok: true, reward: spec.reward };
  }

  function records(state) {
    ensureMeta(state);
    const hist = state.seasonHistory || [];
    let best = null;
    hist.forEach(function (h) {
      if (!best || h.goals > best.goals || (h.goals === best.goals && h.rank < best.rank)) best = h;
    });
    let fastest = null;
    const trail = state.clubHistory || [];
    if (trail.length) {
      const startTier = trail[0].tier;
      trail.forEach(function (h) {
        if (h.tier < startTier && (fastest == null || h.season < fastest)) fastest = h.season;
      });
    }
    const h = state.history || {};
    return {
      goals: h.goals || 0,
      assists: h.assists || 0,
      matches: h.matches || 0,
      bestRating: h.bestRating || 0,
      promotions: h.promotions || 0,
      best: best,
      fastest: fastest,
    };
  }

  function recordCard(state) {
    const rec = records(state);
    const club = L.clubById(state.clubId);
    const lines = [
      state.player.name,
      (club ? club.name : ''),
      'Gol ' + rec.goals + ' · Asist ' + rec.assists + ' · Maç ' + rec.matches,
    ];
    if (rec.best) lines.push('En iyi sezon S' + rec.best.season + ' · ' + rec.best.goals + ' gol · ' + rec.best.rank + '.');
    if (rec.fastest) lines.push('İlk terfi: sezon ' + rec.fastest);
    else lines.push('Terfi: ' + rec.promotions);
    return lines.filter(Boolean).join('\n');
  }

  function boardPayload(state) {
    const rec = records(state);
    const club = L.clubById(state.clubId);
    const list = state.trophies || [];
    const stars = list.filter(function (row) {
      return row && (row.name === 'Altın Yıldız Ödülü' || row.name === 'Golden Star Award');
    }).length;
    const trophies = Math.max(list.length, (state.history.cups || 0) + (state.history.titles || 0));
    return {
      name: state.player.name,
      club: club ? club.name : '',
      nat: state.player.nat || state.country || 'tr',
      age: state.player.age,
      goals: rec.goals,
      assists: rec.assists,
      trophies: trophies,
      ballonStars: stars,
      careerScore: rec.goals * 3 + rec.assists * 2 + trophies * 25 + stars * 40,
      version: '1.8.1',
      updatedAt: Date.now(),
    };
  }

  L.LOOK = LOOK;
  L.DAILY = DAILY;
  L.MISSIONS = MISSIONS;
  L.defaultLook = defaultLook;
  L.ensureMeta = ensureMeta;
  L.dateKey = dateKey;
  L.weekKey = weekKey;
  L.claimDaily = claimDaily;
  L.bumpMission = bumpMission;
  L.claimMission = claimMission;
  L.missionValue = missionValue;
  L.records = records;
  L.recordCard = recordCard;
  L.boardPayload = boardPayload;

  const origMigrate = L.migrate;
  L.migrate = function (state) {
    const next = origMigrate ? origMigrate(state) : state;
    return ensureMeta(next);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
