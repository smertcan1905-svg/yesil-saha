/* Deterministic squads. Names follow nationality. Only changes are saved. */
(function (root) {
  'use strict';
  const L = root.YSLogic;
  if (!L) return;

  function hash(text) {
    let h = 2166136261;
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function rngOf(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(list, rng) { return list[Math.floor(rng() * list.length)]; }
  function fold(s) {
    return String(s || '').toLowerCase()
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[áàâã]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íì]/g, 'i').replace(/[óòôõ]/g, 'o').replace(/[úù]/g, 'u');
  }

  const POOLS = {
    tr: { first: ['Emre', 'Burak', 'Kerem', 'Ozan', 'Yusuf', 'Mert', 'Arda', 'Deniz', 'Cem', 'Baran', 'Umut', 'Ege'], last: ['Aksoy', 'Yildiran', 'Keskin', 'Aslan', 'Duman', 'Ersoy', 'Korkmaz', 'Tanrikulu', 'Sezgin', 'Ucar', 'Polat', 'Karaman'] },
    en: { first: ['Callum', 'Owen', 'Harvey', 'Jonah', 'Ellis', 'Finley', 'Reece', 'Toby', 'Mason', 'Elliot', 'George', 'Archie'], last: ['Whitaker', 'Hargreaves', 'Penrose', 'Dalton', 'Kershaw', 'Briggs', 'Hadley', 'Morton', 'Pritchard', 'Ellison', 'Cartwright', 'Newcombe'] },
    es: { first: ['Iker', 'Unai', 'Alvaro', 'Martin', 'Nicolas', 'Hugo', 'Diego', 'Pablo', 'Adrian', 'Sergio', 'Marcos', 'Ivan'], last: ['Herrero', 'Ceballos', 'Laguna', 'Ferrero', 'Salinas', 'Montero', 'Quintero', 'Belmonte', 'Aranda', 'Paredes', 'Roldan', 'Cuesta'] },
    it: { first: ['Lorenzo', 'Matteo', 'Andrea', 'Davide', 'Nicolo', 'Stefano', 'Giacomo', 'Riccardo', 'Edoardo', 'Alessio', 'Simone', 'Filippo'], last: ['Bellandi', 'Greco', 'Rinaldi', 'Moretti', 'Ferretti', 'Santoro', 'Pellegrini', 'Barbieri', 'Conti', 'Marchetti', 'De Luca', 'Vitale'] },
    de: { first: ['Lukas', 'Jonas', 'Finn', 'Leon', 'Tim', 'Niklas', 'Paul', 'Maximilian', 'Ben', 'Jannik', 'Tom', 'Erik'], last: ['Keller', 'Hoffmann', 'Kruger', 'Bergmann', 'Schreiber', 'Wolf', 'Neumann', 'Zimmermann', 'Hartmann', 'Kruger', 'Bauer', 'Vogel'] },
    fr: { first: ['Mathis', 'Enzo', 'Hugo', 'Adam', 'Leo', 'Nael', 'Sacha', 'Ilan', 'Noam', 'Evan', 'Axel', 'Malo'], last: ['Laurent', 'Morel', 'Girard', 'Roussel', 'Perrin', 'Garnier', 'Chevalier', 'Robin', 'Caron', 'Barbier', 'Masson', 'Dupont'] },
    nl: { first: ['Daan', 'Sem', 'Luuk', 'Milan', 'Jesse', 'Bram', 'Teun', 'Stijn', 'Thijs', 'Ruben', 'Joris', 'Niels'], last: ['Visser', 'Bakker', 'Smit', 'Meijer', 'Dekker', 'Bos', 'Vos', 'Willems', 'Kuiper', 'Prins', 'Hoekstra', 'Mulder'] },
    pt: { first: ['Duarte', 'Martim', 'Afonso', 'Goncalo', 'Tiago', 'Nuno', 'Diogo', 'Vasco', 'Pedro', 'Rui', 'Bruno', 'Miguel'], last: ['Faria', 'Pacheco', 'Queiros', 'Monteiro', 'Cardoso', 'Nogueira', 'Barros', 'Teixeira', 'Correia', 'Lamego', 'Varela', 'Braga'] },
    br: { first: ['Caio', 'Iago', 'Raul', 'Heitor', 'Davi', 'Enzo', 'Murilo', 'Caua', 'Breno', 'Kaique', 'Yuri', 'Erick'], last: ['Nogueira', 'Farias', 'Macedo', 'Tavares', 'Rezende', 'Batista', 'Camargo', 'Dutra', 'Paiva', 'Siqueira', 'Azevedo', 'Moura'] },
    ar: { first: ['Facundo', 'Thiago', 'Bautista', 'Valentin', 'Joaquin', 'Agustin', 'Tomas', 'Mateo', 'Santino', 'Benicio', 'Lisandro', 'Franco'], last: ['Pereyra', 'Godoy', 'Bustos', 'Ledesma', 'Quiroga', 'Paez', 'Sosa', 'Acosta', 'Molina', 'Rojas', 'Ibanez', 'Cabrera'] },
    ng: { first: ['Chinedu', 'Emeka', 'Tunde', 'Ifeanyi', 'Olumide', 'Kehinde', 'Segun', 'Abiola', 'Chuka', 'Femi', 'Obinna', 'Dayo'], last: ['Okeke', 'Balogun', 'Adeyemi', 'Nwosu', 'Okafor', 'Adebayo', 'Eze', 'Onyeka', 'Chukwu', 'Lawal', 'Bassey', 'Danladi'] },
    gh: { first: ['Kwame', 'Kofi', 'Yaw', 'Kojo', 'Kwabena', 'Fiifi', 'Elikem', 'Nana', 'Kweku', 'Paa', 'Selorm', 'Edem'], last: ['Mensah', 'Owusu', 'Boateng', 'Asante', 'Appiah', 'Agyeman', 'Darko', 'Quansah', 'Frimpong', 'Amankwah', 'Sarpong', 'Annan'] },
    sn: { first: ['Mamadou', 'Ibrahima', 'Ousmane', 'Cheikh', 'Abdou', 'Modou', 'Pape', 'Lamine', 'Souleymane', 'Aliou', 'Babacar', 'Moustapha'], last: ['Diallo', 'Ndiaye', 'Sarr', 'Ba', 'Gueye', 'Diop', 'Fall', 'Cisse', 'Sy', 'Kane', 'Mbaye', 'Faye'] },
    ci: { first: ['Yao', 'Kouame', 'Sekou', 'Issa', 'Ladji', 'Bakary', 'Drissa', 'Siaka', 'Adama', 'Lacina', 'Armand', 'Serge'], last: ['Kone', 'Traore', 'Coulibaly', 'Diabate', 'Bamba', 'Ouattara', 'Toure', 'Koffi', 'Gnahore', 'Boly', 'Diarra', 'Meite'] },
    ma: { first: ['Yassine', 'Anass', 'Hamza', 'Ayoub', 'Mehdi', 'Amine', 'Soufiane', 'Reda', 'Zakaria', 'Ilyas', 'Nabil', 'Hicham'], last: ['El Amrani', 'Bennani', 'Cherkaoui', 'Idrissi', 'Tahiri', 'Alaoui', 'Berrada', 'Zniber', 'Kettani', 'Lamrani', 'Squalli', 'Tazi'] },
    rs: { first: ['Nikola', 'Luka', 'Stefan', 'Marko', 'Nemanja', 'Dusan', 'Filip', 'Aleksa', 'Vuk', 'Ognjen', 'Petar', 'Jovan'], last: ['Jovic', 'Petrovic', 'Ilic', 'Kostic', 'Milic', 'Savic', 'Vukovic', 'Radic', 'Bogdanovic', 'Simic', 'Lazic', 'Maric'] },
    hr: { first: ['Luka', 'Ivan', 'Ante', 'Josip', 'Marko', 'Mateo', 'Borna', 'Domagoj', 'Andrej', 'Tin', 'Dino', 'Petar'], last: ['Kovac', 'Babic', 'Novak', 'Horvat', 'Maric', 'Tomic', 'Pavic', 'Juric', 'Bosnjak', 'Grgic', 'Vidic', 'Klaric'] },
    se: { first: ['Elias', 'Oscar', 'Hugo', 'Liam', 'Noah', 'William', 'Isak', 'Albin', 'Viktor', 'Felix', 'Theo', 'Arvid'], last: ['Lindgren', 'Bergstrom', 'Nyberg', 'Holm', 'Ekstrom', 'Sandberg', 'Lundqvist', 'Blom', 'Ahlgren', 'Soderberg', 'Wahlberg', 'Hedlund'] },
    no: { first: ['Magnus', 'Sander', 'Jonas', 'Henrik', 'Even', 'Sondre', 'Kristian', 'Tobias', 'Mathias', 'Andreas', 'Erlend', 'Simen'], last: ['Berg', 'Haugen', 'Nilsen', 'Solberg', 'Dahl', 'Moen', 'Bakke', 'Lie', 'Strand', 'Eide', 'Holmen', 'Viken'] },
  };

  const BLOCK = {};
  [
    'cristiano ronaldo', 'lionel messi', 'neymar junior', 'kylian mbappe', 'erling haaland',
    'mohamed salah', 'luka modric', 'karim benzema', 'robert lewandowski', 'harry kane',
    'jude bellingham', 'vinicius junior', 'zinedine zidane', 'ronaldinho gaucho', 'pele nascimento',
    'diego maradona', 'david beckham', 'wayne rooney', 'thierry henry', 'zlatan ibrahimovic',
    'didier drogba', 'samuel etoo', 'gianluigi buffon', 'paolo maldini', 'francesco totti',
    'andrea pirlo', 'iker casillas', 'raul gonzalez', 'david villa', 'fernando torres',
    'mesut ozil', 'thomas muller', 'manuel neuer', 'oliver kahn', 'lothar matthaus',
    'franz beckenbauer', 'johan cruyff', 'luis figo', 'eusebio da silva', 'gheorghe hagi',
    'andriy shevchenko', 'hristo stoichkov', 'jay jay okocha', 'george weah', 'sadio mane',
    'riyad mahrez', 'victor osimhen', 'bukayo saka', 'phil foden', 'jamal musiala',
    'joshua kimmich', 'toni kroos', 'kevin de bruyne', 'virgil van dijk', 'son heung min',
    'luis suarez', 'edinson cavani', 'sergio aguero', 'carlos tevez', 'paulo dybala',
    'javier zanetti', 'cafu ribeiro', 'rivaldo ferreira', 'ricardo kaka', 'romario faria',
    'zico coimbra', 'socrates brasileiro', 'mané garrincha', 'michel platini', 'jean pierre papin',
    'eric cantona', 'dennis bergkamp', 'ruud gullit', 'marco van basten', 'clarence seedorf',
    'frank rijkaard', 'patrick kluivert', 'henrik larsson', 'paul scholes', 'steven gerrard',
    'frank lampard', 'alan shearer', 'rio ferdinand', 'john terry', 'ryan giggs',
    'roy keane', 'patrick vieira', 'lilian thuram', 'claude makelele', 'didier deschamps',
    'franck ribery', 'antoine griezmann', 'paul pogba', 'ngolo kante', 'raphael varane',
    'hugo lloris', 'olivier giroud', 'ousmane dembele', 'kingsley coman', 'marco reus',
    'philipp lahm', 'bastian schweinsteiger', 'miroslav klose', 'michael ballack',
    'xavi hernandez', 'andres iniesta', 'carles puyol', 'gerard pique', 'sergio busquets',
    'sergio ramos', 'david silva', 'cesc fabregas', 'xabi alonso', 'luis suarez',
    'gianluigi donnarumma', 'mike maignan', 'achraf hakimi', 'adiemola lookman',
    'marcus rashford', 'raheem sterling', 'jack grealish', 'martin odegaard', 'viktor gyokeres',
    'alexander isak', 'emil forsberg', 'bruno fernandes', 'bernardo silva', 'ruben dias',
    'joao cancelo', 'joao felix', 'rafael leao', 'fernando muslera', 'wesley sneijder',
    'alex de souza', 'guti hernandez', 'fernando hierro', 'deco sousa', 'ricardo quaresma',
    'pepe lima', 'rui costa', 'cristiano ronaldo', 'lionel messi', 'neymar da silva',
  ].forEach(function (n) { BLOCK[fold(n)] = 1; });

  const FOREIGN = { en: 0.66, tr: 0.58, es: 0.40, it: 0.57, de: 0.50, fr: 0.36, nl: 0.46, pt: 0.55 };
  const LOCAL = { tr: 'tr', en: 'en', es: 'es', it: 'it', de: 'de', fr: 'fr', nl: 'nl', pt: 'pt' };
  const MIX = {
    en: [['br', 16], ['fr', 14], ['pt', 12], ['es', 10], ['ng', 8], ['gh', 6], ['ar', 8], ['nl', 8], ['sn', 6], ['ci', 5], ['se', 4], ['de', 3]],
    tr: [['br', 16], ['ng', 10], ['gh', 8], ['sn', 8], ['rs', 8], ['hr', 6], ['ar', 8], ['pt', 8], ['fr', 6], ['de', 4], ['ci', 6], ['ma', 4]],
    es: [['fr', 16], ['br', 14], ['ar', 14], ['pt', 12], ['ma', 10], ['ng', 6], ['hr', 6], ['de', 4], ['sn', 4]],
    it: [['ar', 16], ['br', 14], ['fr', 12], ['rs', 10], ['hr', 8], ['ng', 6], ['pt', 8], ['sn', 6], ['nl', 4], ['se', 4]],
    de: [['fr', 14], ['br', 10], ['nl', 12], ['ng', 8], ['gh', 6], ['rs', 8], ['se', 8], ['pt', 6], ['hr', 6], ['tr', 8], ['no', 4]],
    fr: [['br', 12], ['pt', 10], ['sn', 16], ['ci', 14], ['ma', 10], ['es', 8], ['ar', 6], ['ng', 6], ['hr', 4]],
    nl: [['br', 14], ['se', 8], ['no', 6], ['ng', 8], ['ar', 8], ['pt', 8], ['de', 8], ['fr', 6], ['gh', 6], ['ma', 4]],
    pt: [['br', 22], ['ar', 10], ['es', 8], ['sn', 12], ['ng', 6], ['fr', 8], ['hr', 4], ['ci', 6], ['ma', 4]],
  };
  const SLOTS = ['GK', 'GK', 'GK', 'CB', 'CB', 'CB', 'CB', 'FB', 'FB', 'FB', 'FB', 'DM', 'DM', 'CM', 'CM', 'CM', 'CM', 'AM', 'AM', 'W', 'W', 'W', 'ST', 'ST'];
  const FORMS = ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '4-1-4-1'];
  const STYLES = ['press', 'possess', 'direct', 'counter'];
  const PERSONAL = ['strict', 'fatherly', 'tactical', 'hot'];
  const CACHE = {};

  function foreignRate(club) {
    let r = FOREIGN[club.country] || 0.3;
    if ((club.tier || 1) >= 3) r *= 0.22;
    else if (club.tier === 2) r *= 0.55;
    else if ((club.strength || 70) < 80) r *= 0.78;
    else if ((club.strength || 70) >= 88) r = Math.min(0.8, r * 1.1);
    return r;
  }
  function natOf(club, rng, star) {
    const local = LOCAL[club.country] || 'tr';
    let rate = foreignRate(club);
    if (star) rate = Math.min(0.9, rate + 0.12);
    if (rng() > rate) return local;
    const bag = MIX[club.country] || MIX.en;
    let total = 0;
    bag.forEach(function (pair) { total += pair[1]; });
    let roll = rng() * total;
    for (let i = 0; i < bag.length; i++) {
      roll -= bag[i][1];
      if (roll <= 0) return bag[i][0];
    }
    return bag[0][0];
  }
  function personName(nat, rng) {
    const pool = POOLS[nat] || POOLS.en;
    for (let i = 0; i < 16; i++) {
      const first = pick(pool.first, rng);
      const last = pick(pool.last, rng);
      const key = fold(first + ' ' + last);
      if (!BLOCK[key]) return first + ' ' + last;
    }
    return pool.first[0] + ' ' + pool.last[pool.last.length - 1];
  }
  function rollAge(rng, star) {
    let age;
    if (star) age = 26 + Math.floor(rng() * 5);
    else {
      const x = rng();
      if (x < 0.08) age = 17 + Math.floor(rng() * 2);
      else if (x < 0.36) age = 19 + Math.floor(rng() * 5);
      else if (x < 0.70) age = 24 + Math.floor(rng() * 5);
      else if (x < 0.92) age = 29 + Math.floor(rng() * 5);
      else age = 34 + Math.floor(rng() * 4);
    }
    const jitter = Math.floor(rng() * 5) - 2;
    return Math.max(16, Math.min(38, age + jitter));
  }
  function kitPattern(club, away) {
    const home = { stripes: 'stripes', chevron: 'sash', band: 'hoops', quarters: 'halves', plain: 'plain' }[club.pattern] || 'plain';
    if (!away) return home;
    return home === 'stripes' ? 'hoops' : home === 'plain' ? 'sash' : 'stripes';
  }

  function buildSquad(club, season) {
    const rng = rngOf(hash(club.id + '|s' + (season || 1)));
    const squad = [];
    const used = {};
    SLOTS.forEach(function (pos, index) {
      const star = index === 22 || index === 16;
      const nat = natOf(club, rng, star);
      let age = rollAge(rng, star);
      age = Math.max(16, Math.min(38, age + Math.max(0, (season || 1) - 1)));
      if (age > 36 && rng() < 0.55) age = 17 + Math.floor(rng() * 2);
      const mean = Math.round((club.strength || 60) * (club.tier > 2 ? 0.72 : club.tier === 2 ? 0.8 : 0.86));
      let ovr = mean + Math.floor(rng() * 13) - 6;
      if (star) ovr += 6 + Math.floor(rng() * 4);
      ovr = Math.max(48, Math.min(94, ovr));
      const pot = Math.min(95, ovr + (age < 23 ? 6 + Math.floor(rng() * 8) : age < 28 ? 2 : 0));
      let num = pos === 'GK' && index === 0 ? 1 : 2 + Math.floor(rng() * 30);
      let guard = 0;
      while (used[num] && guard < 40) {
        num = (num % 32) + 1;
        guard += 1;
      }
      used[num] = 1;
      const injured = rng() < (age > 32 ? 0.08 : 0.04);
      squad.push({
        id: club.id + '-' + num,
        name: personName(nat, rng),
        nat: nat,
        age: age,
        pos: pos,
        ovr: ovr,
        pot: pot,
        num: num,
        star: star,
        injured: injured,
        goals: pos === 'ST' ? 6 + Math.floor(rng() * 14) : pos === 'W' || pos === 'AM' ? 3 + Math.floor(rng() * 8) : pos === 'CM' ? Math.floor(rng() * 5) : Math.floor(rng() * 2),
        assists: pos === 'AM' || pos === 'W' ? 4 + Math.floor(rng() * 8) : pos === 'CM' || pos === 'FB' ? 2 + Math.floor(rng() * 5) : Math.floor(rng() * 3),
      });
    });
    squad.sort(function (a, b) { return b.ovr - a.ovr; });
    const captain = squad.filter(function (p) { return p.pos !== 'GK' && p.age >= 26; })[0] || squad[0];
    captain.captain = true;
    const coachNat = rng() < 0.7 ? (LOCAL[club.country] || 'tr') : natOf(club, rng, false);
    const coach = {
      name: personName(coachNat, rng),
      nat: coachNat,
      personality: PERSONAL[Math.floor(rng() * PERSONAL.length)],
      formation: FORMS[Math.floor(rng() * FORMS.length)],
      style: STYLES[Math.floor(rng() * STYLES.length)],
    };
    const city = String(club.name || 'Saha').split(' ')[0];
    const stadium = {
      name: city + ' ' + ['Çınar', 'Tepe', 'Kale', 'Sahil', 'Park'][Math.floor(rng() * 5)] + ' Arena',
      capacity: 6000 + Math.round((club.strength || 50) * 520),
    };
    return {
      clubId: club.id,
      squad: squad,
      coach: coach,
      stadium: stadium,
      kit: { home: kitPattern(club, false), away: kitPattern(club, true), color: club.color, second: club.second || '#f8fafc' },
    };
  }

  function clubSquad(clubId, season) {
    const club = L.clubById(clubId);
    if (!club) return null;
    const key = clubId + '|' + (season || 1);
    if (!CACHE[key]) CACHE[key] = buildSquad(club, season || 1);
    return CACHE[key];
  }

  function nameMatches(nat, name) {
    const pool = POOLS[nat];
    if (!pool || !name) return false;
    const parts = String(name).split(' ');
    if (parts.length < 2) return false;
    const first = parts[0];
    const last = parts.slice(1).join(' ');
    return pool.first.indexOf(first) >= 0 && pool.last.indexOf(last) >= 0;
  }

  function scorerFromWorld(state, country, tier) {
    const c = country || (state && state.country) || 'tr';
    const t = tier || (state && state.tier) || 4;
    const clubs = L.clubsIn(c, t);
    const rows = [];
    clubs.forEach(function (club) {
      const pack = clubSquad(club.id, state.season || 1);
      if (!pack) return;
      pack.squad.forEach(function (p) {
        if (p.goals < 1 && p.assists < 1) return;
        rows.push({ name: p.name, nat: p.nat, clubId: club.id, goals: p.goals, assists: p.assists, me: false, pos: p.pos, age: p.age, ovr: p.ovr });
      });
    });
    if (state && (state.country || 'tr') === c && (state.tier || 4) === t) {
      rows.push({
        name: state.player.name,
        nat: 'tr',
        clubId: state.clubId,
        goals: state.seasonGoals || 0,
        assists: state.seasonAssists || 0,
        me: true,
        pos: state.player.pos === 'forvet' ? 'ST' : 'CM',
        age: state.player.age,
        ovr: 70,
      });
    }
    return rows;
  }

  function rivalFromWorld(state) {
    const clubs = L.clubsIn(state.country || 'tr', state.tier || 4).filter(function (c) { return c.id !== state.clubId; });
    if (!clubs.length) return null;
    const club = clubs[hash(state.clubId + '|r|' + state.season) % clubs.length];
    const pack = clubSquad(club.id, state.season || 1);
    const star = pack.squad.filter(function (p) { return p.pos === 'ST' || p.star; })[0];
    return {
      season: state.season,
      fromDb: true,
      name: star.name,
      age: star.age,
      nat: star.nat,
      clubId: club.id,
      pos: star.pos,
      goals: star.goals,
      assists: star.assists,
      rating: star.ovr,
    };
  }

  function matchScorer(clubId, season, minute, prefer) {
    const pack = clubSquad(clubId, season || 1);
    if (!pack) return null;
    const pool = pack.squad.filter(function (p) {
      if (p.injured) return false;
      if (prefer === 'st') return p.pos === 'ST' || p.pos === 'W' || p.pos === 'AM';
      return true;
    });
    if (!pool.length) return pack.squad[0];
    return pool[hash(clubId + '|' + minute) % pool.length];
  }

  function pickMotm(state) {
    const live = state.live;
    if (!live) return null;
    const mine = L.rateMatch(live.stats || {});
    const pack = clubSquad(live.oppId, state.season || 1);
    let best = null;
    if (pack) {
      pack.squad.forEach(function (p) {
        if (!best || p.ovr > best.ovr) best = p;
      });
    }
    const ai = best ? Math.round((6 + (best.ovr - 62) / 18 + (live.stats.oppGoals || 0) * 0.4) * 10) / 10 : 6;
    if (!live.motmGiven) {
      live.motmGiven = true;
      if (mine >= ai) state.player.motm = (state.player.motm || 0) + 1;
    }
    if (mine >= ai) return { name: state.player.name, rating: mine, me: true, nat: 'tr' };
    return { name: best ? best.name : 'Rakip', rating: ai, me: false, nat: best ? best.nat : '' };
  }

  function awardPool(state) {
    const rows = [];
    L.CLUBS.forEach(function (club) {
      if ((club.tier || 1) > 1) return;
      const pack = clubSquad(club.id, state.season || 1);
      if (!pack) return;
      pack.squad.forEach(function (p) {
        if (!p.star && p.ovr < (club.strength || 70) - 4) return;
        const score = p.goals * 4 + p.assists * 3 + p.ovr / 8 + (p.age <= 21 ? 2 : 0);
        rows.push({ name: p.name, nat: p.nat, age: p.age, pos: p.pos, clubId: club.id, score: score, goals: p.goals, assists: p.assists, ovr: p.ovr });
      });
    });
    const mine = (state.seasonGoals || 0) * 4 + (state.seasonAssists || 0) * 3 + (state.player.motm || 0) * 2 + ((state.history && state.history.titles) || 0) * 5;
    rows.push({ name: state.player.name, nat: 'tr', age: state.player.age, pos: state.player.pos === 'forvet' ? 'ST' : 'CM', clubId: state.clubId, score: mine + 8, goals: state.seasonGoals || 0, assists: state.seasonAssists || 0, me: true, ovr: 74 });
    rows.sort(function (a, b) { return b.score - a.score; });
    return rows;
  }

  let awardCacheKey = '';
  let awardCache = null;
  function globalAwards(state) {
    const key = (state.season || 1) + '|' + state.player.name + '|' + (state.seasonGoals || 0);
    if (awardCacheKey === key && awardCache) return awardCache;
    const pool = awardPool(state);
    const top30 = pool.slice(0, 30);
    const meIndex = top30.findIndex(function (r) { return r.me; });
    const young = pool.filter(function (r) { return r.age <= 21; })[0] || null;
    const gks = [];
    L.CLUBS.forEach(function (club) {
      if ((club.tier || 1) > 1) return;
      const pack = clubSquad(club.id, state.season || 1);
      const gk = pack && pack.squad.filter(function (p) { return p.pos === 'GK'; })[0];
      if (gk) gks.push({ name: gk.name, nat: gk.nat, clubId: club.id, ovr: gk.ovr + Math.round((club.strength || 60) / 40) });
    });
    gks.sort(function (a, b) { return b.ovr - a.ovr; });
    const xi = {};
    pool.forEach(function (p) {
      if (!xi[p.pos]) xi[p.pos] = p;
    });
    const coaches = [];
    L.CLUBS.forEach(function (club) {
      if ((club.tier || 1) > 1 || (club.strength || 0) < 86) return;
      const pack = clubSquad(club.id, state.season || 1);
      if (pack) coaches.push({ name: pack.coach.name, nat: pack.coach.nat, clubId: club.id, style: pack.coach.style });
    });
    awardCacheKey = key;
    awardCache = {
      star: top30[0],
      top30: top30,
      meAt: meIndex,
      rising: young,
      glove: gks[0] || null,
      goal: pool.filter(function (p) { return p.pos === 'ST' || p.pos === 'W'; })[0] || pool[0],
      coach: coaches[0] || null,
      xi: xi,
    };
    return awardCache;
  }

  function transferNews(state) {
    const clubs = L.clubsIn(state.country || 'tr', state.tier || 4);
    const lines = [];
    for (let i = 0; i < 4; i++) {
      const a = clubs[(hash(state.season + '|t|' + i) ) % clubs.length];
      const b = clubs[(hash(state.season + '|u|' + i) + 3) % clubs.length];
      if (!a || !b || a.id === b.id) continue;
      const pack = clubSquad(a.id, state.season || 1);
      const player = pack.squad[i % pack.squad.length];
      lines.push({
        name: player.name,
        nat: player.nat,
        from: a,
        to: b,
        textTr: player.name + ', ' + a.name + ' takımından ' + b.name + ' takımına geçti.',
        textEn: player.name + ' moved from ' + (a.nameEn || a.name) + ' to ' + (b.nameEn || b.name) + '.',
      });
    }
    return lines;
  }

  function tournamentAwards(state) {
    if (!state.europe) return null;
    const pack = clubSquad(state.clubId, state.season || 1);
    const xi = {};
    if (pack) pack.squad.forEach(function (p) { if (!xi[p.pos]) xi[p.pos] = p; });
    xi.YOU = { name: state.player.name, me: true, pos: state.player.pos === 'forvet' ? 'ST' : 'CM' };
    const player = (state.europeGoals || 0) >= 3 || (state.player.motm || 0) >= 2
      ? { name: state.player.name, me: true }
      : (pack && pack.squad.filter(function (p) { return p.star; })[0]) || { name: state.player.name, me: true };
    return { player: player, xi: xi };
  }

  if (L.scorerRows) {
    L.scorerRows = function (state, country, tier) {
      return scorerFromWorld(state, country, tier);
    };
  } else L.scorerRows = scorerFromWorld;

  if (L.ensurePlus) {
    const orig = L.ensurePlus;
    L.ensurePlus = function (state) {
      const next = orig(state);
      if (state && state.player && (!state.rival || !state.rival.fromDb)) state.rival = rivalFromWorld(state);
      return next;
    };
  }

  const doneMatch = L.completeMatch;
  if (doneMatch) {
    L.completeMatch = function (state, report) {
      const res = doneMatch(state, report);
      if (res && res.ok && state && state.review && state.awardsFor !== state.season) {
        state.awardsFor = state.season;
        const awards = globalAwards(state);
        state.lastAwards = awards;
        state.trophies = state.trophies || [];
        function give(name, win) {
          if (win && !state.trophies.some(function (t) { return t.season === state.season && t.name === name; })) {
            state.trophies.push({ name: name, season: state.season });
            if (state.news) state.news.unshift(name + ' senin.');
          }
        }
        give('Altın Yıldız Ödülü', awards.star && awards.star.me);
        give('Genç Yıldız Ödülü', awards.rising && awards.rising.me && state.player.age <= 21);
        const tour = tournamentAwards(state);
        if (tour && tour.player && tour.player.me) give('Turnuva Oyuncusu', true);
        const goals = (L.sortedBoard ? L.sortedBoard(L.scorerRows(state), 'goals') : []);
        const assists = (L.sortedBoard ? L.sortedBoard(L.scorerRows(state), 'assists') : []);
        if (goals[0] && goals[0].me) give('Gol Kralı Ödülü', true);
        if (assists[0] && assists[0].me) give('Asist Kralı Ödülü', true);
      }
      return res;
    };
  }

  L.clubSquad = clubSquad;
  L.nameMatches = nameMatches;
  L.POOLS = POOLS;
  L.matchScorer = matchScorer;
  L.pickMotm = pickMotm;
  L.globalAwards = globalAwards;
  L.transferNews = transferNews;
  L.tournamentAwards = tournamentAwards;
  L.rivalFromWorld = rivalFromWorld;
})(typeof globalThis !== 'undefined' ? globalThis : this);
