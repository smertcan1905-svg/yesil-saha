/* Ülke ligleri. Kulüp kimlikleri kalır; yeni takımlar buradan eklenir. */
(function (root) {
  'use strict';
  const L = root.YSLogic;
  if (!L || !L.registerClubs) return;

  const SHAPES = ['shield', 'round', 'lozenge'];
  const PATTERNS = ['stripes', 'chevron', 'band', 'quarters', 'plain'];
  const COLORS = [
    { id: 'kirmizi', tr: 'Kırmızı', en: 'Red', short: 'Kırmızı', shortEn: 'Red', color: '#c1121f', second: '#f8fafc' },
    { id: 'mavi', tr: 'Mavi', en: 'Blue', short: 'Mavi', shortEn: 'Blue', color: '#1d4ed8', second: '#f8fafc' },
    { id: 'beyaz', tr: 'Beyaz', en: 'White', short: 'Beyaz', shortEn: 'Wht', color: '#f8fafc', second: '#1e3a8a' },
    { id: 'sari', tr: 'Sarı', en: 'Gold', short: 'Sarı', shortEn: 'Gold', color: '#e0a106', second: '#0f172a' },
    { id: 'yesil', tr: 'Yeşil', en: 'Green', short: 'Yeşil', shortEn: 'Grn', color: '#15803d', second: '#f8fafc' },
    { id: 'mor', tr: 'Mor', en: 'Purple', short: 'Mor', shortEn: 'Pur', color: '#6d28d9', second: '#f8fafc' },
    { id: 'turuncu', tr: 'Turuncu', en: 'Orange', short: 'Turuncu', shortEn: 'Org', color: '#ea580c', second: '#fff7ed' },
    { id: 'bordo', tr: 'Bordo', en: 'Maroon', short: 'Bordo', shortEn: 'Mar', color: '#7f1d1d', second: '#f59e0b' },
    { id: 'lacivert', tr: 'Lacivert', en: 'Navy', short: 'Lacivert', shortEn: 'Navy', color: '#0f2744', second: '#e2e8f0' },
    { id: 'gri', tr: 'Gri', en: 'Grey', short: 'Gri', shortEn: 'Grey', color: '#4b5563', second: '#f59e0b' },
  ];

  function slug(text) {
    return String(text).toLowerCase()
      .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function paint(i) { return COLORS[i % COLORS.length]; }

  function row(country, tier, city, color, strength, fixedId) {
    const initials = (city.short + color.tr).replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '').slice(0, 3).toUpperCase();
    return {
      id: fixedId || (country + (tier > 1 ? tier : '') + '-' + slug(city.tr) + '-' + color.id),
      country: country,
      name: city.tr + ' ' + color.tr,
      nameEn: city.en + ' ' + color.en,
      short: city.short + ' ' + color.short,
      shortEn: city.shortEn + ' ' + color.shortEn,
      tier: tier,
      strength: strength,
      color: color.color,
      second: color.second,
      shape: SHAPES[strength % SHAPES.length],
      pattern: PATTERNS[strength % PATTERNS.length],
      initials: initials,
    };
  }

  const known = [
    { id: 'londra-kirmizi', country: 'en', city: { tr: 'Londra', en: 'London', short: 'Lon', shortEn: 'Lon' }, color: 0, tier: 1, strength: 91 },
    { id: 'londra-mavi', country: 'en', city: { tr: 'Londra', en: 'London', short: 'Lon', shortEn: 'Lon' }, color: 1, tier: 1, strength: 89 },
    { id: 'madrid-beyaz', country: 'es', city: { tr: 'Madrid', en: 'Madrid', short: 'Mad', shortEn: 'Mad' }, color: 2, tier: 1, strength: 92 },
    { id: 'madrid-mor', country: 'es', city: { tr: 'Madrid', en: 'Madrid', short: 'Mad', shortEn: 'Mad' }, color: 5, tier: 1, strength: 86 },
    { id: 'barselona-mavi', country: 'es', city: { tr: 'Barselona', en: 'Barcelona', short: 'Bar', shortEn: 'Bar' }, color: 1, tier: 1, strength: 90 },
    { id: 'milano-kirmizi', country: 'it', city: { tr: 'Milano', en: 'Milan', short: 'Mil', shortEn: 'Mil' }, color: 0, tier: 1, strength: 88 },
    { id: 'milano-mavi', country: 'it', city: { tr: 'Milano', en: 'Milan', short: 'Mil', shortEn: 'Mil' }, color: 1, tier: 1, strength: 87 },
    { id: 'roma-bordo', country: 'it', city: { tr: 'Roma', en: 'Rome', short: 'Rom', shortEn: 'Rom' }, color: 7, tier: 1, strength: 85 },
    { id: 'paris-mavi', country: 'fr', city: { tr: 'Paris', en: 'Paris', short: 'Par', shortEn: 'Par' }, color: 1, tier: 1, strength: 90 },
    { id: 'munih-kirmizi', country: 'de', city: { tr: 'Münih', en: 'Munich', short: 'Mün', shortEn: 'Mun' }, color: 0, tier: 1, strength: 91 },
    { id: 'amsterdam-kirmizi', country: 'nl', city: { tr: 'Amsterdam', en: 'Amsterdam', short: 'Ams', shortEn: 'Ams' }, color: 0, tier: 1, strength: 86 },
    { id: 'lizbon-yesil', country: 'pt', city: { tr: 'Lizbon', en: 'Lisbon', short: 'Liz', shortEn: 'Lis' }, color: 4, tier: 1, strength: 85 },
  ];

  const extraTr = [
    ['Ankara', 'Ankara', 'Ank', 'Ank', 0],
    ['İzmir', 'Izmir', 'İzm', 'Izm', 0],
    ['Bursa', 'Bursa', 'Bur', 'Bur', 8],
    ['Antalya', 'Antalya', 'Ant', 'Ant', 1],
    ['Trabzon', 'Trabzon', 'Tra', 'Tra', 7],
    ['Adana', 'Adana', 'Ada', 'Ada', 2],
    ['Kocaeli', 'Kocaeli', 'Koc', 'Koc', 4],
    ['Eskişehir', 'Eskisehir', 'Esk', 'Esk', 1],
  ];

  const divisions = {
    en: {
      1: [
        ['Manchester', 'Manchester', 'Man', 'Man'],
        ['Liverpool', 'Liverpool', 'Liv', 'Liv'],
        ['Birmingham', 'Birmingham', 'Bir', 'Bir'],
        ['Leeds', 'Leeds', 'Lee', 'Lee'],
        ['Newcastle', 'Newcastle', 'New', 'New'],
        ['Brighton', 'Brighton', 'Bri', 'Bri'],
        ['Leicester', 'Leicester', 'Lei', 'Lei'],
        ['Southampton', 'Southampton', 'Sou', 'Sou'],
        ['Nottingham', 'Nottingham', 'Not', 'Not'],
        ['Bristol', 'Bristol', 'Brs', 'Brs'],
        ['Sheffield', 'Sheffield', 'She', 'She'],
        ['Coventry', 'Coventry', 'Cov', 'Cov'],
        ['Norwich', 'Norwich', 'Nor', 'Nor'],
        ['Wolverhampton', 'Wolverhampton', 'Wol', 'Wol'],
      ],
      2: [
        ['Hull', 'Hull', 'Hul', 'Hul'],
        ['Stoke', 'Stoke', 'Sto', 'Sto'],
        ['Derby', 'Derby', 'Der', 'Der'],
        ['Portsmouth', 'Portsmouth', 'Por', 'Por'],
        ['Sunderland', 'Sunderland', 'Sun', 'Sun'],
        ['Blackburn', 'Blackburn', 'Bla', 'Bla'],
        ['Burnley', 'Burnley', 'Bur', 'Bur'],
        ['Watford', 'Watford', 'Wat', 'Wat'],
        ['Reading', 'Reading', 'Rea', 'Rea'],
        ['Oxford', 'Oxford', 'Oxf', 'Oxf'],
        ['Plymouth', 'Plymouth', 'Ply', 'Ply'],
        ['Ipswich', 'Ipswich', 'Ips', 'Ips'],
        ['Preston', 'Preston', 'Pre', 'Pre'],
        ['Luton', 'Luton', 'Lut', 'Lut'],
        ['Bolton', 'Bolton', 'Bol', 'Bol'],
        ['Wigan', 'Wigan', 'Wig', 'Wig'],
      ],
    },
    es: {
      1: [
        ['Sevilla', 'Seville', 'Sev', 'Sev'],
        ['Valensiya', 'Valencia', 'Val', 'Val'],
        ['Bilbao', 'Bilbao', 'Bil', 'Bil'],
        ['Malaga', 'Malaga', 'Mal', 'Mal'],
        ['Zaragoza', 'Zaragoza', 'Zar', 'Zar'],
        ['Vigo', 'Vigo', 'Vig', 'Vig'],
        ['Granada', 'Granada', 'Gra', 'Gra'],
        ['Palma', 'Palma', 'Pal', 'Pal'],
        ['Gijon', 'Gijon', 'Gij', 'Gij'],
        ['Valladolid', 'Valladolid', 'Vld', 'Vld'],
        ['Santander', 'Santander', 'San', 'San'],
        ['Murcia', 'Murcia', 'Mur', 'Mur'],
        ['Alicante', 'Alicante', 'Ali', 'Ali'],
      ],
      2: [
        ['Cadiz', 'Cadiz', 'Cad', 'Cad'],
        ['Huelva', 'Huelva', 'Hue', 'Hue'],
        ['Cordoba', 'Cordoba', 'Cor', 'Cor'],
        ['Burgos', 'Burgos', 'Brg', 'Brg'],
        ['Leon', 'Leon', 'Leo', 'Leo'],
        ['Oviedo', 'Oviedo', 'Ovi', 'Ovi'],
        ['Tarragona', 'Tarragona', 'Tar', 'Tar'],
        ['Girona', 'Girona', 'Gir', 'Gir'],
        ['Almeria', 'Almeria', 'Alm', 'Alm'],
        ['Elche', 'Elche', 'Elc', 'Elc'],
        ['Badajoz', 'Badajoz', 'Bad', 'Bad'],
        ['Toledo', 'Toledo', 'Tol', 'Tol'],
        ['Salamanca', 'Salamanca', 'Sal', 'Sal'],
        ['Logrono', 'Logrono', 'Log', 'Log'],
        ['Pamplona', 'Pamplona', 'Pam', 'Pam'],
        ['Castellon', 'Castellon', 'Cas', 'Cas'],
      ],
    },
    it: {
      1: [
        ['Torino', 'Turin', 'Tor', 'Tor'],
        ['Napoli', 'Naples', 'Nap', 'Nap'],
        ['Floransa', 'Florence', 'Flo', 'Flo'],
        ['Cenova', 'Genoa', 'Cen', 'Gen'],
        ['Bologna', 'Bologna', 'Bol', 'Bol'],
        ['Verona', 'Verona', 'Ver', 'Ver'],
        ['Bergamo', 'Bergamo', 'Ber', 'Ber'],
        ['Udine', 'Udine', 'Udi', 'Udi'],
        ['Cagliari', 'Cagliari', 'Cag', 'Cag'],
        ['Parma', 'Parma', 'Par', 'Par'],
        ['Lecce', 'Lecce', 'Lec', 'Lec'],
        ['Salerno', 'Salerno', 'Sal', 'Sal'],
        ['Bari', 'Bari', 'Bar', 'Bar'],
      ],
      2: [
        ['Venedik', 'Venice', 'Ven', 'Ven'],
        ['Palermo', 'Palermo', 'Pal', 'Pal'],
        ['Catania', 'Catania', 'Cat', 'Cat'],
        ['Messina', 'Messina', 'Mes', 'Mes'],
        ['Perugia', 'Perugia', 'Per', 'Per'],
        ['Pisa', 'Pisa', 'Pis', 'Pis'],
        ['Modena', 'Modena', 'Mod', 'Mod'],
        ['Reggio', 'Reggio', 'Reg', 'Reg'],
        ['Como', 'Como', 'Com', 'Com'],
        ['Brescia', 'Brescia', 'Bre', 'Bre'],
        ['Padova', 'Padua', 'Pad', 'Pad'],
        ['Livorno', 'Livorno', 'Liv', 'Liv'],
        ['Foggia', 'Foggia', 'Fog', 'Fog'],
        ['Taranto', 'Taranto', 'Tar', 'Tar'],
        ['Siena', 'Siena', 'Sie', 'Sie'],
        ['Ancona', 'Ancona', 'Anc', 'Anc'],
      ],
    },
    de: {
      1: [
        ['Münih', 'Munich', 'Mün', 'Mun'],
        ['Berlin', 'Berlin', 'Ber', 'Ber'],
        ['Dortmund', 'Dortmund', 'Dor', 'Dor'],
        ['Leipzig', 'Leipzig', 'Lei', 'Lei'],
        ['Frankfurt', 'Frankfurt', 'Fra', 'Fra'],
        ['Hamburg', 'Hamburg', 'Ham', 'Ham'],
        ['Köln', 'Cologne', 'Köl', 'Col'],
        ['Stuttgart', 'Stuttgart', 'Stu', 'Stu'],
        ['Bremen', 'Bremen', 'Bre', 'Bre'],
        ['Augsburg', 'Augsburg', 'Aug', 'Aug'],
        ['Freiburg', 'Freiburg', 'Fre', 'Fre'],
        ['Mainz', 'Mainz', 'Mai', 'Mai'],
        ['Bochum', 'Bochum', 'Boc', 'Boc'],
        ['Hannover', 'Hannover', 'Han', 'Han'],
        ['Nürnberg', 'Nuremberg', 'Nür', 'Nur'],
        ['Leverkusen', 'Leverkusen', 'Lev', 'Lev'],
      ],
      2: [
        ['Düsseldorf', 'Dusseldorf', 'Düs', 'Dus'],
        ['Dresden', 'Dresden', 'Dre', 'Dre'],
        ['Kiel', 'Kiel', 'Kie', 'Kie'],
        ['Rostock', 'Rostock', 'Ros', 'Ros'],
        ['Karlsruhe', 'Karlsruhe', 'Kar', 'Kar'],
        ['Mannheim', 'Mannheim', 'Man', 'Man'],
        ['Wiesbaden', 'Wiesbaden', 'Wie', 'Wie'],
        ['Bonn', 'Bonn', 'Bon', 'Bon'],
        ['Münster', 'Munster', 'Mns', 'Mns'],
        ['Bielefeld', 'Bielefeld', 'Bie', 'Bie'],
        ['Magdeburg', 'Magdeburg', 'Mag', 'Mag'],
        ['Paderborn', 'Paderborn', 'Pad', 'Pad'],
        ['Osnabrück', 'Osnabruck', 'Osn', 'Osn'],
        ['Saarbrücken', 'Saarbrucken', 'Saa', 'Saa'],
        ['Heidenheim', 'Heidenheim', 'Hei', 'Hei'],
        ['Braunschweig', 'Braunschweig', 'Bra', 'Bra'],
      ],
    },
    fr: {
      1: [
        ['Paris', 'Paris', 'Par', 'Par'],
        ['Marsilya', 'Marseille', 'Mar', 'Mar'],
        ['Lyon', 'Lyon', 'Lyo', 'Lyo'],
        ['Lille', 'Lille', 'Lil', 'Lil'],
        ['Monako', 'Monaco', 'Mon', 'Mon'],
        ['Nice', 'Nice', 'Nic', 'Nic'],
        ['Rennes', 'Rennes', 'Ren', 'Ren'],
        ['Nantes', 'Nantes', 'Nan', 'Nan'],
        ['Strazburg', 'Strasbourg', 'Str', 'Str'],
        ['Toulouse', 'Toulouse', 'Tou', 'Tou'],
        ['Montpellier', 'Montpellier', 'Mpl', 'Mpl'],
        ['Lens', 'Lens', 'Len', 'Len'],
        ['Reims', 'Reims', 'Rei', 'Rei'],
        ['Brest', 'Brest', 'Bre', 'Bre'],
        ['Metz', 'Metz', 'Met', 'Met'],
      ],
      2: [
        ['Bordeaux', 'Bordeaux', 'Bor', 'Bor'],
        ['Angers', 'Angers', 'Ang', 'Ang'],
        ['Dijon', 'Dijon', 'Dij', 'Dij'],
        ['Grenoble', 'Grenoble', 'Gre', 'Gre'],
        ['Le Havre', 'Le Havre', 'Hav', 'Hav'],
        ['Auxerre', 'Auxerre', 'Aux', 'Aux'],
        ['Troyes', 'Troyes', 'Tro', 'Tro'],
        ['Caen', 'Caen', 'Cae', 'Cae'],
        ['Amiens', 'Amiens', 'Ami', 'Ami'],
        ['Ajaccio', 'Ajaccio', 'Aja', 'Aja'],
        ['Bastia', 'Bastia', 'Bas', 'Bas'],
        ['Toulon', 'Toulon', 'Tln', 'Tln'],
        ['Clermont', 'Clermont', 'Cle', 'Cle'],
        ['Valenciennes', 'Valenciennes', 'Vln', 'Vln'],
        ['Nancy', 'Nancy', 'Ncy', 'Ncy'],
        ['Orleans', 'Orleans', 'Orl', 'Orl'],
      ],
    },
    nl: {
      1: [
        ['Rotterdam', 'Rotterdam', 'Rot', 'Rot'],
        ['Eindhoven', 'Eindhoven', 'Ein', 'Ein'],
        ['Utrecht', 'Utrecht', 'Utr', 'Utr'],
        ['Arnhem', 'Arnhem', 'Arn', 'Arn'],
        ['Groningen', 'Groningen', 'Gro', 'Gro'],
        ['Heerenveen', 'Heerenveen', 'Hee', 'Hee'],
        ['Alkmaar', 'Alkmaar', 'Alk', 'Alk'],
        ['Zwolle', 'Zwolle', 'Zwo', 'Zwo'],
        ['Nijmegen', 'Nijmegen', 'Nij', 'Nij'],
        ['Tilburg', 'Tilburg', 'Til', 'Til'],
        ['Breda', 'Breda', 'Bre', 'Bre'],
        ['Maastricht', 'Maastricht', 'Maa', 'Maa'],
        ['Haarlem', 'Haarlem', 'Haa', 'Haa'],
        ['Lahey', 'The Hague', 'Lah', 'Hag'],
        ['Enschede', 'Enschede', 'Ens', 'Ens'],
      ],
      2: [
        ['Leiden', 'Leiden', 'Lei', 'Lei'],
        ['Delft', 'Delft', 'Del', 'Del'],
        ['Dordrecht', 'Dordrecht', 'Dor', 'Dor'],
        ['Venlo', 'Venlo', 'Ven', 'Ven'],
        ['Almere', 'Almere', 'Alm', 'Alm'],
        ['Amersfoort', 'Amersfoort', 'Ame', 'Ame'],
        ['Apeldoorn', 'Apeldoorn', 'Ape', 'Ape'],
        ['Deventer', 'Deventer', 'Dev', 'Dev'],
        ['Leeuwarden', 'Leeuwarden', 'Lee', 'Lee'],
        ['Den Bosch', 'Den Bosch', 'Bos', 'Bos'],
        ['Oss', 'Oss', 'Oss', 'Oss'],
        ['Emmen', 'Emmen', 'Emm', 'Emm'],
        ['Kerkrade', 'Kerkrade', 'Ker', 'Ker'],
        ['Waalwijk', 'Waalwijk', 'Waa', 'Waa'],
        ['Helmond', 'Helmond', 'Hel', 'Hel'],
        ['Sittard', 'Sittard', 'Sit', 'Sit'],
      ],
    },
    pt: {
      1: [
        ['Lizbon', 'Lisbon', 'Liz', 'Lis'],
        ['Porto', 'Porto', 'Por', 'Por'],
        ['Braga', 'Braga', 'Bra', 'Bra'],
        ['Guimaraes', 'Guimaraes', 'Gui', 'Gui'],
        ['Setubal', 'Setubal', 'Set', 'Set'],
        ['Faro', 'Faro', 'Far', 'Far'],
        ['Coimbra', 'Coimbra', 'Coi', 'Coi'],
        ['Funchal', 'Funchal', 'Fun', 'Fun'],
        ['Leiria', 'Leiria', 'Lei', 'Lei'],
        ['Aveiro', 'Aveiro', 'Ave', 'Ave'],
        ['Evora', 'Evora', 'Evo', 'Evo'],
        ['Viseu', 'Viseu', 'Vis', 'Vis'],
        ['Portimao', 'Portimao', 'Ptm', 'Ptm'],
        ['Barcelos', 'Barcelos', 'Brc', 'Brc'],
        ['Chaves', 'Chaves', 'Cha', 'Cha'],
      ],
      2: [
        ['Braganca', 'Braganca', 'Brg', 'Brg'],
        ['Beja', 'Beja', 'Bej', 'Bej'],
        ['Santarem', 'Santarem', 'San', 'San'],
        ['Viana', 'Viana', 'Via', 'Via'],
        ['Guarda', 'Guarda', 'Gua', 'Gua'],
        ['Castelo', 'Castelo', 'Cas', 'Cas'],
        ['Covilha', 'Covilha', 'Cov', 'Cov'],
        ['Famalicao', 'Famalicao', 'Fam', 'Fam'],
        ['Tondela', 'Tondela', 'Ton', 'Ton'],
        ['Estoril', 'Estoril', 'Est', 'Est'],
        ['Almada', 'Almada', 'Alm', 'Alm'],
        ['Sintra', 'Sintra', 'Sin', 'Sin'],
        ['Cascais', 'Cascais', 'Csc', 'Csc'],
        ['Matosinhos', 'Matosinhos', 'Mat', 'Mat'],
        ['Gondomar', 'Gondomar', 'Gon', 'Gon'],
        ['Loule', 'Loule', 'Lou', 'Lou'],
      ],
    },
  };

  const list = [];
  extraTr.forEach(function (city, i) {
    list.push(row('tr', 1, { tr: city[0], en: city[1], short: city[2], shortEn: city[3] }, COLORS[city[4]], 80 - i));
  });
  known.forEach(function (item) {
    list.push(row(item.country, item.tier, item.city, COLORS[item.color], item.strength, item.id));
  });
  Object.keys(divisions).forEach(function (country) {
    [1, 2].forEach(function (tier) {
      const cities = divisions[country][tier];
      const base = tier === 1 ? 84 : 70;
      cities.forEach(function (city, i) {
        const color = paint(i + tier * 3);
        const already = known.some(function (k) {
          return k.country === country && k.tier === tier && k.city.tr === city[0] && COLORS[k.color].id === color.id;
        });
        if (already) return;
        list.push(row(country, tier, { tr: city[0], en: city[1], short: city[2], shortEn: city[3] }, color, base - i));
      });
    });
  });

  L.registerClubs(list);
  L.FOREIGN = L.CLUBS.filter(function (c) { return c.country !== 'tr' && c.tier === 1; });
})(typeof globalThis !== 'undefined' ? globalThis : this);
