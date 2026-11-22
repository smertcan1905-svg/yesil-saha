/* Yeşil Saha — üstten saha, kaydırmalı şut ve pas. */
(function (root) {
  'use strict';

  function MatchView(canvas, state, hooks) {
    const L = root.YSLogic;
    hooks = hooks || {};
    const ctx = canvas.getContext('2d');
    const cache = document.createElement('canvas');
    let dead = false;
    let raf = 0;
    let phase = 'aim';
    let ball = { x: 180, y: 320 };
    let flight = null;
    let drag = null;
    let pending = null;
    let keeperX = 180;
    let keeperTarget = 180;
    let userPos = { x: 180, y: 360 };
    let particles = [];
    let shake = 0;
    let flash = 0;
    let lastT = 0;
    let timer = 0;
    let shownScene = null;
    let kickAnim = 0;
    let mateKick = 0;
    let diveAmt = 0;
    let diveDir = 1;
    let ballSpin = 0;
    let headerPhase = 0;
    let celebrateT = 0;

    function tx(key, fallback, vars) {
      const I = root.YSI18n;
      if (I && I.has && I.has(key)) return I.t(key, vars);
      return fallback;
    }
    function tr(text) {
      const I = root.YSI18n;
      return I && I.say ? I.say(text) : (text || '');
    }
    function labelClub(club, short) {
      const I = root.YSI18n;
      if (!club) return '';
      if (!I) return short ? club.short : club.name;
      return short ? I.clubShort(club) : I.clubName(club);
    }
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    function speed() {
      let n = 1;
      try { if (hooks.speed) n = Number(hooks.speed()) || 1; } catch (e) { n = 1; }
      if (n < 0.25) n = 0.25;
      if (reduce) n = Math.max(n, 12);
      return n;
    }

    function sfx(name) {
      const bag = hooks.sfx;
      if (!bag || !bag[name]) return;
      try { bag[name](); } catch (e) { /* sessiz kalsın */ }
    }

    function hint(text) {
      const el = document.getElementById('match-hint');
      if (el) el.textContent = tr(text || '');
    }

    function setNext(on, label) {
      const b = document.getElementById('match-next');
      if (!b) return;
      b.hidden = !on;
      if (label) b.textContent = label;
      fit();
    }

    function updateHud() {
      const live = state.live;
      if (!live) return;
      const me = L.clubById(state.clubId);
      const opp = L.clubById(live.oppId);
      const score = document.getElementById('match-score');
      const left = me ? labelClub(me, true) : tr('Sen');
      const right = opp ? labelClub(opp, true) : (live.displayOpp ? tr(live.displayOpp) : tr('Rakip'));
      if (score) {
        score.textContent = left + '  ' + L.teamGoals(live.stats) + ' – ' + (live.stats.oppGoals || 0) + '  ' + right;
      }
      const ev = live.events[Math.min(live.cursor, Math.max(0, live.events.length - 1))];
      const minute = document.getElementById('match-minute');
      if (minute) {
        if (live.stage === 'half' || live.stage === 'htalk') minute.textContent = "45'";
        else if (live.stage === 'full' || live.stage === 'post' || live.stage === 'flash') minute.textContent = "90'";
        else if (phase === 'live') minute.textContent = Math.floor(live.clock || 0) + "'";
        else if (ev) minute.textContent = ev.minute + "'";
      }
      const bar = document.getElementById('match-progress');
      if (bar) bar.style.width = Math.min(100, ((live.clock || 0) / 90) * 100) + '%';
      const sub = document.getElementById('match-sub');
      if (!sub) return;
      if (live.stage === 'half' || live.stage === 'htalk') {
        sub.textContent = tx('flow.half', 'Devre arası');
        return;
      }
      if (live.stage === 'full' || live.stage === 'post' || live.stage === 'flash') {
        sub.textContent = tx('flow.full', 'Maç sonu');
        return;
      }
      if (phase === 'live') {
        sub.textContent = live.compName ? tr(live.compName) : tx('flow.live', 'Oyun sürüyor.');
        return;
      }
      if (ev && ev.type === 'chance') {
        const chances = live.events.filter(function (e) { return e.type === 'chance'; });
        const idx = chances.indexOf(ev);
        const kind = tx('kind.' + ev.scene.type, 'Şut');
        sub.textContent = tx('match.pos', 'Pozisyon', { i: idx + 1, n: chances.length, k: kind });
      } else if (ev && ev.type === 'opp') sub.textContent = tx('match.counter', 'Karşı atak');
      else if (ev && ev.type === 'solo') sub.textContent = tx('match.teamAtk', 'Takım atağı');
    }

    function chanceHint(scene) {
      if (!scene) return 'Topu hedefe kaydır.';
      if (scene.type === 'pas' || scene.type === 'orta') return scene.type === 'orta'
        ? 'Ortayı beyaz formaya doğru kaydır.'
        : 'Beyaz formaya kaydır veya üzerine dokun.';
      if (scene.type === 'frikik') return 'Frikik virajlı gider. Direğin dışından kaydır, frikik içeri büker.';
      if (scene.type === 'calim') return 'Savunmacının yanından kaydır. Üstüne değil, çevresinden.';
      if (scene.type === 'kafa' || scene.control === 'header' || scene.type === 'korner') return 'Çubuk yeşil bölgedeyken dokun. Kaydırma kafanın yönüdür.';
      if (scene.control === 'volley' || scene.type === 'vole') return 'Top inince, çubuk yeşildeyken dokun.';
      if (scene.type === 'penalti') return 'Penaltı. Kalecinin ters köşesine kaydır.';
      if (scene.type === 'savunma') return 'Top kap. Koşan rakibe doğru kaydır.';
      return 'Topa bas, kaleye kaydır. Altın bölge ideal güç.';
    }

    function commentLine(ev) {
      const live = state.live;
      if (!live || !ev) return '';
      const us = L.teamGoals(live.stats);
      const them = live.stats.oppGoals;
      const names = {
        sut: 'Şut alanı açılıyor.',
        uzak: 'Uzaktan şut denenecek.',
        pas: 'Pas hattı aranıyor.',
        ara: 'Ara pası aranıyor.',
        orta: 'Kanattan orta geliyor.',
        calim: 'Çalım denenecek.',
        kafa: 'Hava topu, kafa vakti.',
        penalti: 'Penaltı noktası.',
        frikik: 'Frikik düdüğü.',
        savunma: 'Karşı atak! Topu kap.',
      };
      const bit = ev.scene ? (names[ev.scene.type] || 'Pozisyon.') : (ev.type === 'opp' ? 'Rakip hücumda.' : 'Takım öne çıktı.');
      return ev.minute + "'  " + us + '–' + them + '  ·  ' + bit;
    }

    function showBanner(waiting) {
      const live = state.live;
      const last = live && live.cursor >= live.events.length - 1;
      hint(waiting.detail || waiting.text || '');
      setNext(true, last ? tx('match.end', 'Maç sonu') : tx('match.next', 'Devam'));
      updateHud();
    }

    function clearAuto() {
      if (timer) clearTimeout(timer);
      timer = 0;
    }

    function armAuto() {
      clearAuto();
      const ms = Math.max(160, 980 / speed());
      timer = setTimeout(function () { advance(); }, ms);
    }

    function currentEvent() {
      if (!state.live) return null;
      return state.live.events[state.live.cursor] || null;
    }

    function placeUser(scene) {
      const gcx = scene.goal.x + scene.goal.w / 2;
      const mouth = scene.goal.y + scene.goal.h;
      if (scene.type === 'savunma') {
        return {
          x: L.clamp((scene.ball.x + gcx) / 2, 36, L.LOG_W - 36),
          y: L.clamp(scene.ball.y - 58, 90, L.LOG_H - 40),
        };
      }
      const vx = scene.ball.x - gcx;
      const vy = scene.ball.y - mouth;
      const len = Math.hypot(vx, vy) || 1;
      return {
        x: L.clamp(scene.ball.x + (vx / len) * 30, 28, L.LOG_W - 28),
        y: L.clamp(scene.ball.y + (vy / len) * 30, 80, L.LOG_H - 24),
      };
    }

    function cardEl() { return document.getElementById('match-card'); }
    function toolsEl() { return document.getElementById('match-tools'); }

    function hideCard() {
      const card = cardEl();
      if (card) { card.hidden = true; card.innerHTML = ''; }
      const root = document.querySelector('.match');
      if (root) root.classList.remove('card-on');
    }

    function showCard(html, label) {
      phase = 'card';
      const card = cardEl();
      const go = '<button type="button" class="btn gold card-go" data-act="match-next">' + (label || tx('flow.go', 'Devam')) + '</button>';
      if (card) {
        card.hidden = false;
        card.innerHTML = html + go;
        const face = card.querySelector('canvas.face');
        if (face && L.paintFace && state.manager) L.paintFace(face, 'boss', '#14532d');
      }
      const root = document.querySelector('.match');
      if (root) root.classList.add('card-on');
      setNext(true, label || tx('flow.go', 'Devam'));
      const tools = toolsEl();
      if (tools) tools.hidden = true;
    }

    function choiceRow() {
      return '<button type="button" class="btn" data-act="story-choice" data-choice="humble">' + tx('choice.humble', 'Alçakgönüllü') + '</button>' +
        '<button type="button" class="btn" data-act="story-choice" data-choice="confident">' + tx('choice.confident', 'Kendinden emin') + '</button>' +
        '<button type="button" class="btn ghost" data-act="story-choice" data-choice="arrogant">' + tx('choice.arrogant', 'Kibirli') + '</button>' +
        '<button type="button" class="btn ghost" data-act="story-choice" data-choice="minutes">' + tx('choice.minutes', 'Dakika iste') + '</button>';
    }

    function pressRow() {
      return '<button type="button" class="btn" data-act="story-choice" data-choice="calm">' + tx('choice.calm', 'Sakin cevap') + '</button>' +
        '<button type="button" class="btn" data-act="story-choice" data-choice="us">' + tx('choice.us', 'Takımı öv') + '</button>' +
        '<button type="button" class="btn ghost" data-act="story-choice" data-choice="trash">' + tx('choice.trash', 'Rakibi kızdır') + '</button>' +
        '<button type="button" class="btn ghost" data-act="story-choice" data-choice="brand">' + tx('choice.brand', 'Markaya oyna') + '</button>';
    }

    function showStage(stage) {
      const live = state.live;
      if (!live) return;
      live.stage = stage;
      if (stage === 'pre' && live.meta && L.bossCard) {
        const meta = live.meta;
        const opp = L.clubById(live.oppId);
        const me = L.clubById(state.clubId);
        showCard(
          '<p class="eyebrow">' + tx('flow.pre', 'Maç önü') + '</p><h2>' + (me ? labelClub(me, false) : '') + ' – ' + (opp ? labelClub(opp, false) : '') + '</h2>' +
          '<p>' + tx('match.you', 'SEN') + ' · ' + (meta.formation || '') + ' · ' + (meta.stadium || '') + '</p>' +
          '<p class="fine">' + tx('weather.' + (meta.weather || 'clear'), meta.weather || '') + ' · ' + tx('importance.' + (meta.importance || 'league'), meta.importance || '') + ' · ' + (meta.role === 'bench' ? tx('flow.bench', 'Yedek') : tx('flow.xi', 'İlk 11')) + '</p>',
          tx('flow.start', 'Maça başla')
        );
        return;
      }
      if ((stage === 'talk' || stage === 'htalk' || stage === 'post') && L.bossCard) {
        const when = stage === 'htalk' ? 'half' : stage === 'post' ? 'post' : 'pre';
        const card = L.bossCard(state, when);
        showCard('<p class="eyebrow">' + tx('flow.talk', 'Hoca') + '</p><div class="boss-row"><canvas class="face"></canvas><div><h2>' + card.title + '</h2><p>' + card.rel + '</p></div></div><p>' + card.body + '</p>' + choiceRow());
        return;
      }
      if ((stage === 'press' || stage === 'flash') && L.pressCard) {
        const card = L.pressCard(state, stage === 'flash' ? 'post' : 'pre');
        showCard('<p class="eyebrow">' + tx('flow.press', 'Basın') + '</p><p>' + card.body + '</p>' + pressRow());
        return;
      }
      if (stage === 'half') {
        const stats = live.stats || {};
        showCard('<p class="eyebrow">' + tx('flow.half', 'Devre') + '</p><h2>' + L.teamGoals(stats) + ' – ' + (stats.oppGoals || 0) + '</h2><p>' + tx('dream.rate', 'Puan') + ' ' + L.rateMatch(stats) + '</p>', tx('flow.go', 'Devam'));
        updateHud();
        return;
      }
      if (stage === 'full') {
        const stats = live.stats || {};
        const bits = (L.ratingParts ? L.ratingParts(Object.assign({ result: L.teamGoals(stats) === (stats.oppGoals || 0) ? 'draw' : L.teamGoals(stats) > (stats.oppGoals || 0) ? 'win' : 'loss', pos: state.player.pos }, stats)) : []).map(function (p) {
          return '<li><b>' + p.id + '</b><span>' + (Math.round(p.n * 10) / 10) + '</span></li>';
        }).join('');
        const motm = L.pickMotm ? L.pickMotm(state) : null;
        const motmLine = motm ? '<p class="news">' + tx('flow.motm', 'Maçın adamı') + ': ' + motm.name + ' · ' + motm.rating + '</p>' : '';
        showCard('<p class="eyebrow">' + tx('flow.full', 'Maç sonu') + '</p><h2>' + L.teamGoals(stats) + ' – ' + (stats.oppGoals || 0) + '</h2>' + motmLine + '<ul class="fixtures">' + bits + '</ul>', tx('flow.go', 'Devam'));
        updateHud();
        return;
      }
      if (stage === 'office' && L.officeCard) {
        if (!live.officeKind && L.maybeOffice) live.officeKind = L.maybeOffice(state);
        const card = L.officeCard(state);
        showCard('<p class="eyebrow">' + tx('flow.office', 'Ofis') + '</p><p>' + card.body + '</p>' + choiceRow());
        return;
      }
      phase = 'live';
      hideCard();
      setNext(false);
      const tools = toolsEl();
      if (tools) tools.hidden = false;
      if (!live.ticker || !live.ticker.length) {
        pushTick(Math.max(1, Math.floor(live.clock || 1)), tx('flow.live', 'Oyun sürüyor.'));
      } else {
        const tick = document.getElementById('match-ticker');
        if (tick) tick.innerHTML = tickerHtml(live);
      }
      updateHud();
    }

    function escTick(text) {
      return String(text == null ? '' : text).replace(/[&<>]/g, function (ch) {
        return ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : '&gt;';
      });
    }

    function tickerHtml(live) {
      return (live.ticker || []).slice(0, 3).map(function (row) {
        return '<p>' + row.m + "' " + escTick(row.text) + '</p>';
      }).join('');
    }

    function pushTick(minute, text) {
      const live = state.live;
      if (!live.ticker) live.ticker = [];
      live.ticker.unshift({ m: Math.floor(minute), text: text });
      if (live.ticker.length > 8) live.ticker.pop();
      const el = document.getElementById('match-ticker');
      if (!el) return;
      el.innerHTML = tickerHtml(live);
    }

    function armAim(ev) {
      phase = 'aim';
      pending = null;
      flight = null;
      kickAnim = 0;
      mateKick = 0;
      diveAmt = 0;
      shownScene = ev.scene;
      ball = { x: ev.scene.ball.x, y: ev.scene.ball.y };
      keeperX = ev.scene.keeper.x;
      keeperTarget = ev.scene.keeper.x;
      userPos = placeUser(ev.scene);
      hint(chanceHint(ev.scene));
      setNext(false);
      const one = document.querySelector('[data-act="onetwo"]');
      if (one) one.hidden = !(ev.scene && ev.scene.teammate && (ev.scene.control === 'open' || !ev.scene.control));
      const tools = toolsEl();
      if (tools) tools.hidden = false;
      updateHud();
    }

    function pump() {
      const live = state.live;
      if (!live || phase !== 'live' || live.paused) return;
      while (live.cursor < live.events.length) {
        const ev = live.events[live.cursor];
        if (ev.minute > live.clock + 0.05) break;
        if (ev.type === 'chance') {
          live.stage = 'moment';
          armAim(ev);
          return;
        }
        if (ev.type === 'opp' || ev.type === 'solo') {
          L.applyEvent(live.stats, ev.type);
          let text = tx(ev.key || (ev.type === 'opp' ? 'flow.opp' : 'flow.solo'), ev.type === 'opp' ? 'Rakip golü' : 'Takım golü');
          if (L.matchScorer) {
            const who = L.matchScorer(ev.type === 'opp' ? live.oppId : state.clubId, state.season, ev.minute, 'st');
            if (who && who.name && who.name !== state.player.name) text = who.name + ' · ' + text;
          }
          if (!live.scorers) live.scorers = [];
          live.scorers.push({ minute: ev.minute, text: text });
          pushTick(ev.minute, text);
          sfx(ev.type === 'opp' ? 'miss' : 'goal');
        } else {
          pushTick(ev.minute, tx(ev.key || 'flow.foul', 'Oyun sürüyor.'));
        }
        live.cursor += 1;
        updateHud();
      }
      const endAt = 90 + (live.stoppage || 1);
      if (!live.didHalf && live.clock >= 45 && phase === 'live') {
        live.didHalf = true;
        live.clock = 45;
        showStage('half');
        return;
      }
      if (live.clock >= endAt && phase === 'live' && live.cursor >= live.events.length) {
        showStage('full');
      }
    }

    function advanceStage() {
      const live = state.live;
      if (!live) return;
      const stage = live.stage;
      if ((stage === 'talk' || stage === 'htalk' || stage === 'post' || stage === 'press' || stage === 'flash' || stage === 'office') && !live.picked && L.applyCard) {
        L.applyCard(state, stage, null);
      }
      live.picked = false;
      if (stage === 'pre') { showStage('talk'); return; }
      if (stage === 'talk') { showStage('press'); return; }
      if (stage === 'press' || stage === 'htalk') {
        live.stage = 'live';
        phase = 'live';
        if (live.didHalf && live.clock < 45.2) live.clock = 45.2;
        hideCard();
        const tools = toolsEl();
        if (tools) tools.hidden = false;
        setNext(false);
        if (!live.ticker || !live.ticker.length) {
          pushTick(Math.max(1, Math.floor(live.clock || 1)), tx('flow.live', 'Oyun sürüyor.'));
        }
        sfx('whistle');
        updateHud();
        return;
      }
      if (stage === 'half') { showStage('htalk'); return; }
      if (stage === 'full') {
        const level = L.teamGoals(live.stats) === (live.stats.oppGoals || 0);
        const knock = live.competition === 'kupa' || live.competition === 'avrupa' || live.competition === 'milli';
        if (level && knock && !live.shootoutDone && L.previewChance) {
          live.shootoutDone = true;
          live.shootKicks = 0;
          const scene = L.previewChance(state, 'penalti');
          live.events.push({ type: 'chance', minute: 121, scene: scene });
          live.cursor = live.events.length - 1;
          hideCard();
          setNext(false);
          armAim(live.events[live.cursor]);
          hint(tx('flow.shootout', 'Penaltı atışları'));
          return;
        }
        showStage('post');
        return;
      }
      if (stage === 'post') { showStage('flash'); return; }
      if (stage === 'flash') {
        const office = L.maybeOffice && L.maybeOffice(state);
        if (office) { live.officeKind = office; showStage('office'); return; }
        finish();
        return;
      }
      if (stage === 'office') { finish(); return; }
      live.stage = 'live';
      phase = 'live';
      hideCard();
    }

    function bootFlow() {
      const live = state.live;
      if (!live) return;
      if (!live.stage) live.stage = 'pre';
      if (live.stage === 'live' || live.stage === 'moment') {
        phase = 'live';
        hideCard();
        if (live.stage === 'moment') enter();
        else pump();
        return;
      }
      showStage(live.stage);
    }

    const LIVE_XI = [
      { x: 180, y: 86, n: '1', keeper: true, home: false },
      { x: 54, y: 150, n: '2', home: false },
      { x: 128, y: 138, n: '4', home: false },
      { x: 214, y: 138, n: '5', home: false },
      { x: 300, y: 150, n: '3', home: false },
      { x: 72, y: 230, n: '6', home: false },
      { x: 150, y: 214, n: '8', home: false },
      { x: 230, y: 214, n: '10', home: false },
      { x: 306, y: 230, n: '7', home: false },
      { x: 132, y: 300, n: '9', home: false },
      { x: 228, y: 300, n: '11', home: false },
      { x: 132, y: 390, n: '11', home: true },
      { x: 228, y: 390, n: '9', home: true },
      { x: 72, y: 456, n: '7', home: true },
      { x: 150, y: 470, n: '10', home: true },
      { x: 230, y: 470, n: '8', home: true },
      { x: 306, y: 456, n: '6', home: true },
      { x: 54, y: 530, n: '3', home: true },
      { x: 128, y: 544, n: '5', home: true },
      { x: 214, y: 544, n: '4', home: true },
      { x: 300, y: 530, n: '2', home: true },
      { x: 180, y: 575, n: '1', keeper: true, home: true },
    ];

    function drawLive(time) {
      if (cache.width) ctx.drawImage(cache, 0, 0, L.LOG_W, L.LOG_H);
      const live = state.live || {};
      const me = L.clubById(state.clubId);
      const opp = L.clubById(live.oppId);
      const homeKit = me ? me.color : '#15803d';
      const homeSecond = me && me.second;
      const awayKit = (opp && opp.color) || live.oppColor || '#b91c1c';
      const awaySecond = (opp && opp.second) || live.oppSecond || '#f8fafc';
      const order = LIVE_XI.map(function (p, i) { return { p: p, i: i }; });
      order.sort(function (a, b) { return a.p.y - b.p.y; });
      order.forEach(function (row) {
        const p = row.p;
        const i = row.i;
        const x = p.x + Math.sin(time / 420 + i) * 6;
        const y = p.y + Math.cos(time / 510 + i * 1.3) * 4;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.58, 0.58);
        drawFigure(0, 0, {
          jersey: p.home ? homeKit : awayKit,
          second: p.home ? homeSecond : awaySecond,
          shorts: '#f8fafc',
          socks: p.home ? homeKit : awayKit,
          hair: p.home ? '#1c1917' : '#44403c',
          number: p.n,
          keeper: !!p.keeper,
          gloves: '#fde047',
          boot: '#111827',
          running: true,
          phase: i * 0.7,
        }, time);
        ctx.restore();
      });
      const span = 820;
      const step = Math.floor(time / span) % LIVE_XI.length;
      const nxt = (step + 1) % LIVE_XI.length;
      const u = (time % span) / span;
      const ease = u * u * (3 - 2 * u);
      const from = LIVE_XI[step];
      const to = LIVE_XI[nxt];
      const bx = from.x + (to.x - from.x) * ease;
      const by = from.y + (to.y - from.y) * ease;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 213, 106, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(from.x, from.y, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
      drawBall(bx, by, ballSpin);
    }

    function enter() {
      if (dead || !state.live) return;
      const live = state.live;
      const ev = live.events[live.cursor];
      if (!ev) { finish(); return; }
      if (ev.scene) shownScene = ev.scene;
      if (live.waiting) {
        phase = 'banner';
        showBanner(live.waiting);
        if (ev.type !== 'chance') armAuto();
        return;
      }
      if (ev.type !== 'chance') {
        L.applyEvent(live.stats, ev.type);
        const text = ev.type === 'opp' ? 'Karşı gol' : 'Takım golü';
        const detail = ev.type === 'opp' ? 'Rakip fileyi buldu.' : 'Arkadaşın kendi başına bitirdi.';
        live.stats.moments.push({ minute: ev.minute, text: text });
        live.waiting = { text: text, detail: detail, outcome: ev.type };
        if (hooks.onSave) hooks.onSave();
        phase = 'banner';
        ball = { x: L.LOG_W / 2, y: 280 };
        showBanner(live.waiting);
        if (ev.type === 'opp') sfx('miss'); else sfx('goal');
        if (ev.type === 'solo') { shake = 0.6; flash = 0.4; }
        armAuto();
        return;
      }
      if (live.flowCursor !== live.cursor) {
        live.flowCursor = live.cursor;
        phase = 'flow';
        const line = commentLine(ev);
        hint(line);
        const note = document.getElementById('match-comment');
        if (note) note.textContent = line;
        updateHud();
        clearAuto();
        timer = setTimeout(function () {
          if (!dead && phase === 'flow') enter();
        }, Math.max(50, 620 / speed()));
        return;
      }
      phase = 'aim';
      pending = null;
      flight = null;
      kickAnim = 0;
      mateKick = 0;
      diveAmt = 0;
      ball = { x: ev.scene.ball.x, y: ev.scene.ball.y };
      keeperX = ev.scene.keeper.x;
      keeperTarget = ev.scene.keeper.x;
      userPos = placeUser(ev.scene);
      hint(chanceHint(ev.scene));
      setNext(false);
      updateHud();
    }

    function finish() {
      if (dead) return;
      phase = 'done';
      setNext(false);
      const stats = state.live ? state.live.stats : null;
      if (hooks.onFinished && stats) hooks.onFinished(stats);
    }

    function advance() {
      if (dead || !state.live) return;
      if (phase === 'card') { advanceStage(); return; }
      if (phase !== 'banner') return;
      clearAuto();
      state.live.waiting = null;
      state.live.cursor += 1;
      pending = null;
      if (state.live.shootoutDone) {
        state.live.shootKicks = (state.live.shootKicks || 0) + 1;
        if (Math.random() < 0.45) state.live.stats.oppGoals += 1;
        if (state.live.shootKicks < 3) {
          const scene = L.previewChance(state, 'penalti');
          state.live.events.push({ type: 'chance', minute: 121 + state.live.shootKicks, scene: scene });
          state.live.cursor = state.live.events.length - 1;
          armAim(state.live.events[state.live.cursor]);
          return;
        }
        const us = L.teamGoals(state.live.stats);
        const them = state.live.stats.oppGoals || 0;
        state.live.stats.shootout = us >= them ? 'win' : 'loss';
        showStage('post');
        return;
      }
      state.live.stage = 'live';
      phase = 'live';
      hideCard();
      if (hooks.onSave) hooks.onSave();
      pump();
    }

    function endPoint(scene, outcome, aimX) {
      const mouth = scene.goal.y + scene.goal.h;
      const x = L.clamp(aimX, 24, L.LOG_W - 24);
      if (outcome === 'goal') {
        return { x: L.clamp(aimX, scene.goal.x + 10, scene.goal.x + scene.goal.w - 10), y: scene.goal.y + 10 };
      }
      if (outcome === 'save' || outcome === 'weak') {
        return { x: L.clamp(aimX, scene.goal.x + 4, scene.goal.x + scene.goal.w - 4), y: mouth + 2 };
      }
      if (outcome === 'over') return { x: x, y: Math.max(8, scene.goal.y - 16) };
      if (outcome === 'wide') return { x: x, y: mouth };
      if (outcome === 'wall' && scene.wall && scene.wall.length) {
        let best = scene.wall[0];
        for (let i = 1; i < scene.wall.length; i++) {
          if (Math.abs(scene.wall[i].x - aimX) < Math.abs(best.x - aimX)) best = scene.wall[i];
        }
        return { x: best.x, y: best.y };
      }
      if ((outcome === 'assist' || outcome === 'pass') && scene.teammate) {
        return { x: scene.teammate.x, y: scene.teammate.y - 8 };
      }
      if (outcome === 'cut' && scene.teammate) {
        const mid = { x: (scene.ball.x + scene.teammate.x) / 2, y: (scene.ball.y + scene.teammate.y) / 2 };
        let best = mid;
        let bestD = 1e9;
        (scene.defenders || []).forEach(function (d) {
          const dist = Math.hypot(d.x - mid.x, d.y - mid.y);
          if (dist < bestD) { bestD = dist; best = d; }
        });
        return { x: best.x, y: best.y };
      }
      if (outcome === 'off' && scene.teammate) return { x: scene.teammate.x + 40, y: scene.teammate.y + 16 };
      return { x: scene.ball.x + 12, y: scene.ball.y + 18 };
    }

    function startFlight(target, then) {
      const scene = shownScene;
      const side = Math.sign((ball.x - (L.GOAL.x + L.GOAL.w / 2)) || 1);
      const curl = ((scene && scene.type === 'frikik') ? 32 : 11) * side;
      flight = {
        x0: ball.x,
        y0: ball.y,
        x1: target.x,
        y1: target.y,
        t: 0,
        dur: 0.64 / speed(),
        curl: curl,
        then: then || null,
      };
      phase = 'fly';
      setNext(false);
      sfx('attack');
    }

    function commitOutcome() {
      if (!pending || pending.applied || !state.live) return;
      pending.applied = true;
      const live = state.live;
      const ev = live.events[live.cursor];
      L.applyChance(live.stats, pending.kind, pending.outcome);
      live.stats.chances += 1;
      const info = L.OUTCOMES[pending.outcome] || { banner: 'Devam', detail: '' };
      live.stats.moments.push({ minute: ev ? ev.minute : 0, text: info.banner });
      live.waiting = { text: info.banner, detail: info.detail, outcome: pending.outcome };
      if (hooks.onSave) hooks.onSave();
      phase = 'banner';
      showBanner(live.waiting);
      const good = pending.outcome === 'goal' || pending.outcome === 'assist';
      if (good) {
        shake = 1;
        flash = 0.55;
        if (pending.outcome === 'goal') celebrateT = 1.7;
        burst(ball.x, ball.y);
        if (pending.outcome === 'goal') burst(180, 430);
        sfx('goal');
        buzz(pending.outcome === 'goal' ? [18, 30, 18] : 12);
      } else if (pending.outcome === 'save' || pending.outcome === 'weak' || pending.outcome === 'wall') sfx('save');
      else if (pending.outcome === 'pass') sfx('pass');
      else sfx('miss');
    }

    function buzz(pattern) {
      try {
        if (hooks.vibrate && hooks.vibrate() === false) return;
        if (navigator.vibrate) navigator.vibrate(pattern);
      } catch (e) {}
    }

    function headerAcc() {
      const t = (Math.sin(headerPhase) + 1) / 2;
      return 1 - Math.min(1, Math.abs(t - 0.78) / 0.34);
    }

    function beginKick(swipe) {
      const ev = currentEvent();
      if (!ev || !ev.scene || phase !== 'aim') return;
      const scene = ev.scene;
      const attrs = state.live.attrs;
      if ((scene.control === 'pen' || scene.type === 'penalti') && L.resolvePenalty) {
        const composure = L.clamp(((attrs.teknik || 40) + (attrs.vizyon || 40)) / 200, 0, 1);
        const outcome = L.resolvePenalty(scene, swipe, composure, attrs, Math.random);
        pending = { kind: 'shot', outcome: outcome.outcome, aimX: outcome.aimX || scene.ball.x, applied: false };
        keeperTarget = outcome.aimX || scene.keeper.x;
        diveDir = Math.sign((outcome.aimX || scene.keeper.x) - scene.keeper.x) || 1;
        kickAnim = 1;
        sfx('kick');
        buzz(12);
        startFlight(endPoint(scene, outcome.outcome, pending.aimX), commitOutcome);
        return;
      }
      if ((scene.control === 'header' || scene.control === 'volley' || scene.type === 'kafa' || scene.type === 'korner' || scene.type === 'vole') && (L.resolveHeader || L.resolveVolley)) {
        const fn = (scene.control === 'volley' || scene.type === 'vole') && L.resolveVolley ? L.resolveVolley : L.resolveHeader;
        const outcome = fn(scene, headerAcc(), attrs, Math.random);
        pending = { kind: 'header', outcome: outcome.outcome, aimX: outcome.aimX || scene.ball.x, applied: false };
        kickAnim = 1;
        sfx('kick');
        buzz(10);
        startFlight(endPoint(scene, outcome.outcome, pending.aimX), commitOutcome);
        return;
      }
      if (scene.type === 'calim' && L.resolveDribble) {
        const outcome = L.resolveDribble(scene, swipe, attrs, Math.random);
        pending = { kind: 'dribble', outcome: outcome.outcome, aimX: scene.ball.x, applied: false };
        kickAnim = 1;
        sfx('kick');
        buzz(10);
        const def = scene.defenders && scene.defenders[0];
        const past = def
          ? { x: L.clamp(scene.ball.x + (scene.ball.x < def.x ? -40 : 40), 30, L.LOG_W - 30), y: scene.ball.y - 74 }
          : { x: scene.ball.x, y: scene.ball.y - 60 };
        const cut = def ? { x: def.x, y: def.y } : past;
        startFlight(outcome.outcome === 'lost' ? cut : past, commitOutcome);
        return;
      }
      if (scene.type === 'savunma' && L.resolveTackle) {
        const outcome = L.resolveTackle(scene, swipe, attrs, Math.random);
        pending = { kind: 'tackle', outcome: outcome.outcome, aimX: scene.ball.x, applied: false, concede: outcome.outcome === 'lost' };
        kickAnim = 1;
        sfx('kick');
        buzz(10);
        const atk = scene.attacker || (scene.defenders && scene.defenders[0]) || scene.ball;
        startFlight({ x: atk.x, y: atk.y }, function () {
          if (pending && pending.concede && state.live) {
            L.applyEvent(state.live.stats, 'opp');
            pending.concede = false;
            updateHud();
          }
          commitOutcome();
        });
        return;
      }
      const info = L.classifyAction(scene, swipe);
      if (info.kind === 'none') {
        hint('Biraz daha net kaydır.');
        return;
      }
      let outcome;
      let kind;
      if (info.kind === 'pass') {
        kind = 'pass';
        if (state.squad && state.squad[0]) {
          const mate = state.squad[0];
          scene.mateRel = mate.personality === 'selfish' ? Math.max(0, mate.rel - 30) : mate.rel;
        }
        outcome = L.resolvePass(scene, swipe, attrs, Math.random, state.player.pos);
      } else {
        kind = info.kind === 'selfish' ? 'selfish' : 'shot';
        outcome = L.resolveShot(scene, swipe, attrs, Math.random);
      }
      pending = { kind: kind, outcome: outcome.outcome, aimX: outcome.aimX == null ? scene.ball.x : outcome.aimX, applied: false };
      const aim = pending.aimX;
      if (outcome.outcome === 'save' || outcome.outcome === 'weak') keeperTarget = aim;
      else if (outcome.outcome === 'goal') keeperTarget = scene.keeper.x + (Math.sign(aim - scene.keeper.x) || 1) * 24;
      else keeperTarget = scene.keeper.x + (Math.sign(aim - scene.keeper.x) || 0) * 12;
      sfx('kick');
      kickAnim = 1;
      mateKick = 0;
      diveDir = Math.sign(keeperTarget - (shownScene ? shownScene.keeper.x : keeperX)) || diveDir;
      const first = endPoint(scene, outcome.outcome, aim);
      if (outcome.outcome === 'assist') {
        startFlight(first, function () {
          const far = Math.abs((scene.goal.x + 20) - scene.keeper.x) >= Math.abs((scene.goal.x + scene.goal.w - 20) - scene.keeper.x)
            ? scene.goal.x + 22 : scene.goal.x + scene.goal.w - 22;
          keeperTarget = scene.keeper.x + (Math.sign(far - scene.keeper.x) || 1) * 26;
          diveDir = Math.sign(keeperTarget - scene.keeper.x) || diveDir;
          kickAnim = 0;
          mateKick = 1;
          startFlight({ x: far, y: scene.goal.y + 10 }, commitOutcome);
        });
      } else {
        startFlight(first, commitOutcome);
      }
    }

    function onDown(e) {
      if (dead) return;
      if (phase === 'banner') {
        if (e.cancelable) e.preventDefault();
        advance();
        return;
      }
      if (phase !== 'aim') return;
      const ev = currentEvent();
      if (!ev || !ev.scene) return;
      if (e.cancelable) e.preventDefault();
      const p = toLogical(e);
      const near = Math.hypot(p.x - ev.scene.ball.x, p.y - ev.scene.ball.y) < 60;
      drag = { x: p.x, y: p.y, ox: p.x, oy: p.y, bx: ev.scene.ball.x, by: ev.scene.ball.y, near: near, pid: e.pointerId };
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    }

    function onMove(e) {
      if (!drag || drag.pid !== e.pointerId) return;
      if (e.cancelable) e.preventDefault();
      const p = toLogical(e);
      drag.x = p.x;
      drag.y = p.y;
      if (phase !== 'aim' || !drag.near) return;
      const ev = currentEvent();
      if (!ev || !ev.scene) return;
      if ((ev.scene.control === 'open' || !ev.scene.control) && ev.scene.type !== 'frikik' && ev.scene.type !== 'penalti') {
        ev.scene.ball.x = L.clamp(ev.scene.ball.x + (p.x - ev.scene.ball.x) * 0.28, 30, L.LOG_W - 30);
        ev.scene.ball.y = L.clamp(ev.scene.ball.y + (p.y - ev.scene.ball.y) * 0.28, 130, L.LOG_H - 28);
        ball.x = ev.scene.ball.x;
        ball.y = ev.scene.ball.y;
        userPos = placeUser(ev.scene);
        (ev.scene.defenders || []).forEach(function (d) {
          d.x += (ev.scene.ball.x - d.x) * 0.06;
          d.y += (ev.scene.ball.y - d.y) * 0.06;
        });
      }
      const swipe = { x1: ev.scene.ball.x, y1: ev.scene.ball.y, x2: p.x, y2: p.y };
      const info = L.classifyAction(ev.scene, swipe);
      if (info.kind === 'pass') hint('Pas yönü. Bırakınca top gider.');
      else if (info.kind === 'selfish') hint('Şut seçtin. Takım pas bekliyordu.');
      else if (info.dist >= 12) {
        const model = L.shotModel(ev.scene, swipe, state.live.attrs);
        if (!model.ok) hint('Kaleye doğru kaydır.');
        else if (model.band === 'weak') hint('Güç az. Biraz daha uzat.');
        else if (model.band === 'over') hint('Çok sert. Üstten çıkabilir.');
        else if (model.band === 'ideal' && model.onTarget) hint('Güç ideal. Köşe açıksa bırak.');
        else if (!model.onTarget) hint('Yön kale dışında.');
        else hint('Güç idare eder.');
      }
    }

    function onUp(e) {
      if (!drag || drag.pid !== e.pointerId) return;
      const p = toLogical(e);
      const start = drag;
      drag = null;
      if (phase !== 'aim') return;
      const ev = currentEvent();
      if (!ev || !ev.scene) return;
      const moved = Math.hypot(p.x - start.ox, p.y - start.oy);
      if (ev.scene.type === 'kafa' || ev.scene.control === 'header' || ev.scene.control === 'volley' || ev.scene.type === 'korner' || ev.scene.type === 'vole') {
        beginKick({ x1: ev.scene.ball.x, y1: ev.scene.ball.y, x2: p.x, y2: p.y });
        return;
      }
      if (moved < 14) {
        if (ev.scene.teammate && Math.hypot(p.x - ev.scene.teammate.x, p.y - ev.scene.teammate.y) < 36) {
          const swipe = L.tapPassSwipe(ev.scene);
          if (swipe) beginKick(swipe);
          return;
        }
        hint(start.near ? 'Basılı tutup hedefe kaydır.' : chanceHint(ev.scene));
        return;
      }
      if (!start.near) {
        hint('Önce topa yakın bas.');
        return;
      }
      const chip = (p.y - start.oy) > 8 && moved < 96 && (ev.scene.control === 'open' || ev.scene.type === 'sut' || ev.scene.type === 'frikik');
      beginKick({
        x1: start.bx || ev.scene.ball.x,
        y1: start.by || ev.scene.ball.y,
        x2: p.x,
        y2: p.y,
        curve: (p.x - start.ox) * 0.12,
        chip: chip,
      });
    }

    function burst(x, y) {
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 * i) / 16 + Math.random() * 0.2;
        const sp = 50 + Math.random() * 110;
        particles.push({
          x: x, y: y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 30,
          life: 0.55 + Math.random() * 0.25,
          gold: i % 2 === 0,
        });
      }
    }

    function update(dt) {
      shake = Math.max(0, shake - dt * 1.8);
      flash = Math.max(0, flash - dt * 1.4);
      celebrateT = Math.max(0, celebrateT - dt);
      ballSpin += dt * (phase === 'fly' ? 9 : 1.4);
      if (phase === 'live' && state.live && !state.live.paused) {
        const sp = (state.live.speed || 1) * speed();
        state.live.clock += dt * 1.15 * sp;
        pump();
        updateHud();
      }
      if (phase === 'aim') headerPhase += dt * 3.1;
      const shooting = phase === 'fly' && pending && pending.kind !== 'pass';
      const wantDive = shooting ? 1 : 0;
      diveAmt += (wantDive - diveAmt) * Math.min(1, dt * (shooting ? 9 : 2.2));
      if (phase === 'fly') {
        if (mateKick > 0) mateKick = 1;
        else if (kickAnim > 0) kickAnim = 1;
      } else {
        kickAnim = Math.max(0, kickAnim - dt * 2.6);
        mateKick = Math.max(0, mateKick - dt * 2.6);
      }
      if (keeperTarget !== keeperX) {
        const step = Math.min(1, dt * 7);
        keeperX += (keeperTarget - keeperX) * step;
      }
      if (flight) {
        flight.t += dt;
        const k = Math.min(1, flight.t / flight.dur);
        const e = 1 - Math.pow(1 - k, 3);
        const dx = flight.x1 - flight.x0;
        const dy = flight.y1 - flight.y0;
        const len = Math.hypot(dx, dy) || 1;
        const arc = Math.sin(k * Math.PI) * flight.curl;
        ball.x = flight.x0 + dx * e + (-dy / len) * arc;
        ball.y = flight.y0 + dy * e + (dx / len) * arc;
        if (k >= 1) {
          const then = flight.then;
          ball.x = flight.x1;
          ball.y = flight.y1;
          flight = null;
          if (then) then();
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 90 * dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    function roundRect(x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    function buildPitch() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cache.width = Math.round(L.LOG_W * dpr);
      cache.height = Math.round(L.LOG_H * dpr);
      const g = cache.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = L.LOG_W;
      const h = L.LOG_H;
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, '#23b254');
      grd.addColorStop(0.55, '#159443');
      grd.addColorStop(1, '#0c6d30');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      const stripeTop = 46;
      const stripeH = (h - stripeTop) / 10;
      for (let i = 0; i < 10; i++) {
        g.fillStyle = i % 2 ? 'rgba(255,255,255,0.075)' : 'rgba(0,0,0,0.07)';
        g.fillRect(0, stripeTop + stripeH * i, w, stripeH + 0.6);
      }
      g.fillStyle = '#07140f';
      g.fillRect(0, 0, w, 46);
      const stand = g.createLinearGradient(0, 0, 0, 46);
      stand.addColorStop(0, '#1a120c');
      stand.addColorStop(1, '#3a2414');
      g.fillStyle = stand;
      g.fillRect(0, 8, w, 32);
      g.fillStyle = 'rgba(255, 214, 140, 0.18)';
      g.beginPath();
      g.ellipse(90, 6, 70, 18, 0, 0, Math.PI * 2);
      g.ellipse(270, 6, 70, 18, 0, 0, Math.PI * 2);
      g.fill();
      const crowd = ['#f4f1e4', '#f59e0b', '#38bdf8', '#fb7185', '#a3e635', '#e7e5e4', '#c4b5fd'];
      const hairs = ['#1c1917', '#78350f', '#44403c', '#0f172a'];
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 20; i++) {
          const cx = 14 + i * 17 + (row ? 8 : 0);
          const cy = 18 + row * 11;
          g.fillStyle = crowd[(i * 3 + row) % crowd.length];
          g.beginPath();
          g.arc(cx, cy, 3.4, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = hairs[(i + row) % hairs.length];
          g.beginPath();
          g.arc(cx, cy - 1.4, 3.3, Math.PI, 0);
          g.fill();
        }
      }
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, 40);
      g.lineTo(w, 40);
      g.stroke();
      const goal = L.GOAL;
      const mouth = goal.y + goal.h;
      const cx = goal.x + goal.w / 2;
      g.strokeStyle = 'rgba(255,255,255,0.92)';
      g.lineWidth = 2;
      g.strokeRect(18, mouth, w - 36, h - mouth - 14);
      g.beginPath();
      g.moveTo(18, mouth + (h - mouth) * 0.46);
      g.lineTo(w - 18, mouth + (h - mouth) * 0.46);
      g.stroke();
      g.strokeRect(cx - 118, mouth, 236, 168);
      g.strokeRect(cx - 70, mouth, 140, 68);
      g.beginPath();
      g.arc(cx, mouth + 112, 3.2, 0, Math.PI * 2);
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.fill();
      g.beginPath();
      g.arc(cx, mouth + 112, 46, 0.55, Math.PI - 0.55);
      g.stroke();
      g.fillStyle = 'rgba(8, 40, 22, 0.45)';
      g.beginPath();
      g.moveTo(goal.x + 6, mouth);
      g.lineTo(goal.x + 18, goal.y + 2);
      g.lineTo(goal.x + goal.w - 18, goal.y + 2);
      g.lineTo(goal.x + goal.w - 6, mouth);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(236, 253, 245, 0.45)';
      g.lineWidth = 1;
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        g.beginPath();
        g.moveTo(goal.x + 6 + (goal.w - 12) * t, mouth);
        g.lineTo(goal.x + 18 + (goal.w - 36) * t, goal.y + 2);
        g.stroke();
      }
      for (let y = goal.y + 6; y < mouth; y += 5) {
        const t = (y - goal.y) / (mouth - goal.y);
        const left = goal.x + 18 + (6 - 18) * t;
        const right = goal.x + goal.w - 18 + ((goal.w - 6) - (goal.w - 18)) * t;
        g.beginPath();
        g.moveTo(left, y);
        g.lineTo(right, y);
        g.stroke();
      }
      g.strokeStyle = '#f8fafc';
      g.lineWidth = 4;
      g.lineCap = 'square';
      g.beginPath();
      g.moveTo(goal.x, mouth);
      g.lineTo(goal.x, goal.y);
      g.lineTo(goal.x + goal.w, goal.y);
      g.lineTo(goal.x + goal.w, mouth);
      g.stroke();
      g.lineWidth = 2;
      g.strokeStyle = 'rgba(15,23,42,0.35)';
      g.beginPath();
      g.moveTo(goal.x + 3, mouth);
      g.lineTo(goal.x + 3, goal.y + 3);
      g.lineTo(goal.x + goal.w - 2, goal.y + 3);
      g.stroke();
    }

    function mixHex(hex, amt) {
      const raw = String(hex || '#888').replace('#', '');
      const full = raw.length === 3 ? raw.split('').map(function (c) { return c + c; }).join('') : raw;
      const n = parseInt(full, 16);
      if (!isFinite(n)) return hex || '#888';
      let r = (n >> 16) & 255;
      let g = (n >> 8) & 255;
      let b = n & 255;
      const t = amt < 0 ? 0 : 255;
      const p = Math.min(1, Math.abs(amt));
      r = Math.round(r + (t - r) * p);
      g = Math.round(g + (t - g) * p);
      b = Math.round(b + (t - b) * p);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    function inkOn(hex) {
      const raw = String(hex || '#888').replace('#', '');
      const full = raw.length === 3 ? raw.split('').map(function (c) { return c + c; }).join('') : raw;
      const n = parseInt(full, 16);
      if (!isFinite(n)) return '#fff';
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      return (r * 299 + g * 587 + b * 114) / 1000 > 165 ? '#1c1917' : '#fff';
    }

    function drawFigure(x, y, o, time) {
      const skin = o.skin || '#e8b48a';
      const jersey = o.jersey || '#15803d';
      const shorts = o.shorts || '#f8fafc';
      const socks = o.socks || jersey;
      const boot = o.boot || '#1c1917';
      const hair = o.hair || '#1c1917';
      const kick = o.kick || 0;
      const amp = o.running ? 0.72 : 0.28;
      const tempo = o.running ? 80 : 210;
      const stride = Math.sin(time / tempo + (o.phase || 0)) * amp;
      ctx.save();
      ctx.translate(x, y + Math.sin(time / 180 + (o.phase || 0)) * (kick > 0.2 ? 0.2 : 0.6));
      if (o.dive) ctx.rotate(o.dive * 1.08);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(1, 18, 11, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      function leg(side, rot) {
        ctx.save();
        ctx.translate(side * 3.3, 6);
        ctx.rotate(rot);
        ctx.fillStyle = socks;
        roundRect(-2.2, 1, 4.4, 8, 2);
        ctx.fill();
        ctx.fillStyle = boot;
        ctx.beginPath();
        ctx.ellipse(1.4, 9.6, 3.5, 1.8, 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = mixHex(boot, 0.35);
        ctx.fillRect(-1.6, 9.1, 3.2, 0.8);
        ctx.restore();
      }
      leg(-1, -0.18 - stride);
      leg(1, 0.18 + stride - kick * 2.05);
      ctx.fillStyle = shorts;
      roundRect(-8, 1.2, 16, 7, 2.5);
      ctx.fill();
      ctx.fillStyle = mixHex(shorts, 0.28);
      ctx.fillRect(-8, 2.2, 16, 1.3);
      function arm(side, lift) {
        ctx.save();
        ctx.translate(side * 7.2, -6);
        ctx.rotate(side * 0.85 + lift);
        ctx.fillStyle = jersey;
        roundRect(-2.3, -1, 4.6, 5.4, 2);
        ctx.fill();
        ctx.fillStyle = skin;
        roundRect(-1.7, 3.6, 3.4, 4.2, 1.6);
        ctx.fill();
        if (o.keeper) {
          ctx.fillStyle = o.gloves || '#facc15';
          ctx.beginPath();
          ctx.arc(0, 8.6, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }
      if (o.celebrate) {
        arm(-1, -1.85);
        arm(1, 1.85);
      } else {
        arm(-1, stride * 0.35);
        arm(1, -stride * 0.35 - kick * 0.7);
      }
      ctx.fillStyle = jersey;
      roundRect(-9.2, -12, 18.4, 14.2, 4.5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (o.second) {
        ctx.fillStyle = o.second;
        ctx.fillRect(-1.5, -11.4, 3, 12.4);
      }
      ctx.fillStyle = mixHex(jersey, 0.22);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(-8.4, -11.2, 4, 12);
      ctx.globalAlpha = 1;
      ctx.fillStyle = mixHex(jersey, -0.28);
      ctx.fillRect(-4, -12, 8, 2.8);
      if (o.captain) {
        ctx.fillStyle = '#ffd56a';
        ctx.fillRect(-10.2, -5.5, 3.6, 2.4);
      }
      if (o.number) {
        ctx.fillStyle = inkOn(jersey);
        ctx.font = '800 8px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(o.number), 0, -4.2);
      }
      ctx.fillStyle = skin;
      ctx.fillRect(-2.2, -12.2, 4.4, 3.2);
      ctx.beginPath();
      ctx.arc(-5.3, -15.6, 1.5, 0, Math.PI * 2);
      ctx.arc(5.3, -15.6, 1.5, 0, Math.PI * 2);
      ctx.arc(0, -16.2, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hair;
      const style = o.hairStyle || 'short';
      if (style === 'buzz') {
        ctx.beginPath();
        ctx.arc(0, -16.4, 5.1, Math.PI * 1.02, Math.PI * 1.98);
        ctx.fill();
      } else if (style === 'mohawk') {
        ctx.fillRect(-1.7, -24, 3.4, 11);
        ctx.beginPath();
        ctx.arc(0, -16.2, 4.8, Math.PI * 1.15, Math.PI * 1.85);
        ctx.fill();
      } else if (style === 'long') {
        ctx.beginPath();
        ctx.arc(0, -17.2, 5.8, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-6.4, -16.5, 3.4, 11);
        ctx.fillRect(3, -16.5, 3.4, 11);
      } else if (style === 'curly') {
        ctx.beginPath();
        ctx.arc(0, -17.6, 5.4, Math.PI, 0);
        ctx.arc(-4.4, -18.2, 2.3, 0, Math.PI * 2);
        ctx.arc(0, -20.4, 2.3, 0, Math.PI * 2);
        ctx.arc(4.4, -18.2, 2.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, -17.4, 5.6, Math.PI * 0.98, Math.PI * 2.02);
        ctx.fill();
        ctx.fillRect(-5.4, -17.6, 10.8, 3.2);
      }
      if (o.beard && o.beard !== 'none') {
        ctx.save();
        ctx.fillStyle = hair;
        ctx.globalAlpha = o.beard === 'full' ? 0.95 : 0.45;
        ctx.beginPath();
        ctx.ellipse(0, -12.2, o.beard === 'full' ? 3.6 : 2.5, 1.7, 0, 0, Math.PI);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    function drawBall(x, y, spin) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0.5, 8.2, 6.8, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(spin || 0);
      const grd = ctx.createRadialGradient(-2.2, -2.4, 0.6, 0.4, 0.6, 7.4);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.7, '#f3efe4');
      grd.addColorStop(1, '#cfc6b2');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(0, 0, 7.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        const px = Math.cos(a) * 2.5;
        const py = Math.sin(a) * 2.5;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        const a2 = a + Math.PI / 5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 2.5, Math.sin(a) * 2.5);
        ctx.lineTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(Math.cos(a2) * 4.6, Math.sin(a2) * 4.6, 1.35, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawArrow(x1, y1, x2, y2, color) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2 - ux * 10, y2 - uy * 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - uy * 7 - ux * 14, y2 + ux * 7 - uy * 14);
      ctx.lineTo(x2 + uy * 7 - ux * 14, y2 - ux * 7 - uy * 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawMeter(model, power) {
      const x = 12;
      const y = 92;
      const h = 196;
      const w = 12;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(x, y, w, h, 6);
      ctx.fill();
      if (model) {
        const yOf = function (p) { return y + h - (L.clamp(p, 0, 100) / 100) * h; };
        const y1 = yOf(model.ideal + model.slack);
        const y2 = yOf(Math.max(0, model.ideal - model.slack));
        ctx.fillStyle = 'rgba(255, 206, 92, 0.55)';
        ctx.fillRect(x + 2, y1, w - 4, Math.max(4, y2 - y1));
      }
      let col = '#d8ffe8';
      if (model && model.band === 'ideal') col = '#ffd56a';
      else if (model && (model.band === 'over' || model.band === 'weak')) col = '#ff8b7a';
      const fillH = (L.clamp(power, 0, 100) / 100) * (h - 4);
      ctx.fillStyle = col;
      ctx.fillRect(x + 2, y + h - 2 - fillH, w - 4, fillH);
      ctx.restore();
    }

    function drawBanner(text) {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 16, 10, 0.78)';
      roundRect(36, 236, 288, 78, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 213, 106, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff8e8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const size = text && text.length > 12 ? 26 : 34;
      ctx.font = '800 ' + size + 'px Segoe UI, sans-serif';
      ctx.fillText(tr(text || ''), 180, 276);
      ctx.restore();
    }

    function draw(time) {
      if (!ctx || !state.live) return;
      const ev = state.live.events[state.live.cursor];
      ctx.clearRect(0, 0, L.LOG_W, L.LOG_H);
      if (cache.width) ctx.drawImage(cache, 0, 0, L.LOG_W, L.LOG_H);
      ctx.save();
      if (phase === 'live') {
        drawLive(time);
        ctx.restore();
        return;
      }
      if (shake > 0) ctx.translate(Math.sin(time / 18) * 5 * shake, 0);
      const scene = ev && ev.type === 'chance' ? ev.scene : null;
      const running = phase === 'fly';
      if (scene) {
        const foe = (state.live && state.live.oppColor) || '#b91c1c';
        const foe2 = (state.live && state.live.oppSecond) || '#f8fafc';
        (scene.defenders || []).forEach(function (d, i) {
          drawFigure(d.x, d.y, {
            jersey: foe, second: foe2, shorts: '#f8fafc', socks: foe, hair: '#1c1917',
            number: String(4 + (i % 3)), phase: i * 1.7, running: running,
          }, time);
        });
        (scene.wall || []).forEach(function (d, i) {
          drawFigure(d.x, d.y, {
            jersey: '#1d4ed8', shorts: '#e2e8f0', socks: '#1d4ed8', hair: '#0f172a',
            number: String(2 + i), phase: i * 2.1, running: false,
          }, time);
        });
        if (scene.teammate) {
          if (phase === 'aim' && scene.type === 'pas') {
            const pulse = 1 + Math.sin(time / 180) * 0.06;
            ctx.save();
            ctx.strokeStyle = 'rgba(157,255,198,0.95)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(scene.teammate.x, scene.teammate.y, 18 * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          drawFigure(scene.teammate.x, scene.teammate.y, {
            jersey: '#f8fafc', shorts: '#0f172a', socks: '#f8fafc', hair: '#78350f',
            number: '8', phase: 0.6, running: running, kick: mateKick,
          }, time);
        }
        drawFigure(keeperX, scene.keeper.y, {
          jersey: '#fb923c', shorts: '#111827', socks: '#111827', hair: '#44403c',
          number: '1', keeper: true, gloves: '#fde047', boot: '#0f172a',
          phase: 2.4, running: false, dive: diveAmt * diveDir,
        }, time);
        const meClub = L.clubById(state.clubId);
        const mine = meClub ? meClub.color : '#15803d';
        const look = (state.player && state.player.look) || {};
        drawFigure(userPos.x, userPos.y, {
          jersey: mine, second: meClub && meClub.second, shorts: '#f8fafc', socks: mine,
          hair: look.hairColor || '#1c1917', hairStyle: look.hair, skin: look.skin, boot: look.boots, beard: look.beard,
          number: String(L.shirtNumber(state.player.name)),
          captain: L.isCaptain(state), phase: 0.2, running: running, kick: kickAnim,
          celebrate: celebrateT > 0.2,
        }, time);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 10px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tx('match.you', 'SEN'), userPos.x, userPos.y + 26);
        if (phase === 'aim' && (scene.type === 'kafa' || scene.control === 'header' || scene.control === 'volley' || scene.type === 'korner' || scene.type === 'vole')) {
          const t = (Math.sin(headerPhase) + 1) / 2;
          ctx.save();
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          roundRect(70, 520, 220, 16, 8);
          ctx.fill();
          ctx.fillStyle = 'rgba(157,255,198,0.9)';
          ctx.fillRect(70 + 220 * 0.62, 522, 36, 12);
          ctx.fillStyle = '#ffd56a';
          ctx.beginPath();
          ctx.arc(70 + 220 * t, 528, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        if (phase === 'aim') {
          const pulse = 1 + Math.sin(time / 160) * 0.1;
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 213, 106, 0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(scene.ball.x, scene.ball.y, 16 * pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        if (drag && drag.near && phase === 'aim') {
          const swipe = { x1: scene.ball.x, y1: scene.ball.y, x2: drag.x, y2: drag.y };
          const dist = Math.hypot(swipe.x2 - swipe.x1, swipe.y2 - swipe.y1);
          if (dist > 14) {
            const info = L.classifyAction(scene, swipe);
            let color = '#ffd56a';
            if (info.kind === 'pass') color = '#9dffc6';
            else if (info.kind === 'selfish') color = '#fb7185';
            else {
              const model = L.shotModel(scene, swipe, state.live.attrs);
              if (!model.ok || !model.onTarget || model.band === 'over' || model.band === 'weak') color = '#ff8b7a';
              else if (model.band === 'ideal') color = '#ffd56a';
              else color = '#d8ffe8';
              if (model.ok) {
                ctx.save();
                ctx.globalAlpha = 0.16;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(scene.ball.x, scene.ball.y);
                ctx.lineTo(model.aimX - model.spread, model.mouthY);
                ctx.lineTo(model.aimX + model.spread, model.mouthY);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(model.aimX, model.mouthY, 5, 0, Math.PI * 2);
                ctx.fill();
              }
              drawMeter(model.ok ? model : null, model.power);
            }
            drawArrow(scene.ball.x, scene.ball.y, drag.x, drag.y, color);
          }
        }
        drawBall(ball.x, ball.y, ballSpin);
      } else {
        drawBall(ball.x, ball.y, ballSpin);
      }
      particles.forEach(function (p) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.gold ? '#ffd56a' : '#fff';
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1;
      });
      if (flash > 0) {
        ctx.fillStyle = 'rgba(255, 213, 106, ' + (flash * 0.25) + ')';
        ctx.fillRect(0, 0, L.LOG_W, L.LOG_H);
      }
      if (celebrateT > 0 && phase === 'banner') {
        const meClub = L.clubById(state.clubId);
        const slide = Math.min(1, (1.7 - celebrateT) / 0.45);
        ctx.save();
        ctx.translate(48 + slide * 150, 468 - Math.sin(slide * Math.PI) * 18);
        ctx.scale(1.55, 1.55);
        drawFigure(0, 0, {
          jersey: meClub ? meClub.color : '#15803d',
          second: meClub && meClub.second,
          shorts: '#f8fafc',
          socks: meClub ? meClub.color : '#15803d',
          hair: (state.player.look && state.player.look.hairColor) || '#1c1917',
          hairStyle: state.player.look && state.player.look.hair,
          skin: state.player.look && state.player.look.skin,
          boot: state.player.look && state.player.look.boots,
          beard: state.player.look && state.player.look.beard,
          number: String(L.shirtNumber(state.player.name)),
          captain: L.isCaptain(state),
          celebrate: true,
          running: slide < 0.85,
          phase: slide * 4,
        }, time);
        ctx.restore();
      }
      if (phase === 'banner' && state.live && state.live.waiting) drawBanner(state.live.waiting.text);
      ctx.restore();
    }

    function frame(t) {
      if (dead) return;
      if (!state.live) return;
      if (!lastT) lastT = t;
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      update(dt);
      draw(t);
      raf = requestAnimationFrame(frame);
    }

    let lastFit = '';
    function fit() {
      const wrap = canvas.parentElement;
      const availW = wrap && wrap.clientWidth > 40 ? wrap.clientWidth : 0;
      const availH = wrap && wrap.clientHeight > 40 ? wrap.clientHeight : 0;
      if (!availW || !availH) return;
      const aspect = L.LOG_W / L.LOG_H;
      let w = availW;
      let h = w / aspect;
      if (h > availH) {
        h = availH;
        w = h * aspect;
      }
      const key = Math.floor(w) + 'x' + Math.floor(h);
      if (key === lastFit) return;
      lastFit = key;
      canvas.style.width = Math.max(1, Math.floor(w)) + 'px';
      canvas.style.height = Math.max(1, Math.floor(h)) + 'px';
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(L.LOG_W * dpr);
      canvas.height = Math.round(L.LOG_H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildPitch();
    }

    function toLogical(e) {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * L.LOG_W;
      const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * L.LOG_H;
      return { x: x, y: y };
    }

    function onResize() { if (!dead) fit(); }
    let observer = null;

    this.start = function () {
      fit();
      if (window.ResizeObserver && canvas.parentElement) {
        observer = new ResizeObserver(function () { if (!dead) fit(); });
        observer.observe(canvas.parentElement);
      }
      window.addEventListener('resize', onResize);
      canvas.addEventListener('pointerdown', onDown, { passive: false });
      canvas.addEventListener('pointermove', onMove, { passive: false });
      canvas.addEventListener('pointerup', onUp, { passive: false });
      canvas.addEventListener('pointercancel', onUp, { passive: false });
      bootFlow();
      raf = requestAnimationFrame(function (t) {
        fit();
        frame(t);
      });
    };

    this.destroy = function () {
      if (dead) return;
      dead = true;
      clearAuto();
      cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };

    this.continue = advance;
    this.control = function (act, choice) {
      const live = state.live;
      if (!live) return;
      if (act === 'story-choice') {
        if (L.applyCard) L.applyCard(state, live.stage, choice);
        live.picked = true;
        advanceStage();
        return;
      }
      if (act === 'flow-pause') {
        live.paused = !live.paused;
        const btn = document.querySelector('[data-act="flow-pause"]');
        if (btn) btn.textContent = live.paused ? tx('flow.play', 'Sürdür') : tx('flow.pause', 'Dur');
        return;
      }
      if (act === 'flow-speed') {
        const cycle = [1, 2, 4];
        const at = cycle.indexOf(live.speed || 1);
        live.speed = cycle[(at + 1) % cycle.length];
        document.querySelectorAll('[data-act="flow-speed"]').forEach(function (btn) {
          btn.classList.toggle('on', Number(btn.getAttribute('data-mult')) === live.speed);
        });
        return;
      }
      if (act === 'flow-stats' || act === 'flow-tactics') {
        const panel = document.getElementById('match-panel');
        if (!panel) return;
        const open = panel.hidden || panel.getAttribute('data-kind') !== act;
        panel.hidden = !open;
        panel.setAttribute('data-kind', act);
        if (!open) return;
        if (act === 'flow-stats') {
          const stats = live.stats || {};
          panel.innerHTML = '<p>' + tx('flow.poss', 'Top') + ' ' + (live.possession || 50) + '%</p>' +
            '<p>' + tx('flow.shots', 'Şut') + ' ' + (stats.shots || 0) + ' · ' + (stats.onTarget || 0) + '</p>' +
            '<p>' + tx('dream.rate', 'Puan') + ' ' + L.rateMatch(stats) + '</p>' +
            '<p>' + tx('flow.chance', 'Pozisyon kalitesi') + ' ' + (stats.chances || 0) + '</p>';
        } else {
          const xi = (state.squad || []).slice(0, 5).map(function (m) {
            return '<li><b>' + m.name + '</b><span>' + m.pos + ' · ' + m.rel + '</span></li>';
          }).join('');
          panel.innerHTML = '<p>' + ((live.meta && live.meta.formation) || '4-3-3') + '</p><ul class="fixtures">' + xi + '</ul>';
        }
        return;
      }
      if (act === 'flow-skip' && phase === 'live') {
        let next = null;
        for (let i = live.cursor; i < live.events.length; i++) {
          if (live.events[i].type === 'chance') { next = live.events[i]; break; }
        }
        if (next) live.clock = Math.max(live.clock, next.minute - 0.01);
        pump();
        return;
      }
      if (act === 'onetwo' && phase === 'aim' && L.resolveOneTwo) {
        const ev = currentEvent();
        if (!ev || !ev.scene) return;
        const res = L.resolveOneTwo(ev.scene, live.attrs, Math.random, state.player.pos);
        if (res.outcome === 'return') {
          L.applyChance(live.stats, 'pass', 'pass');
          ev.scene.ball.y = Math.max(190, ev.scene.ball.y - 70);
          ball = { x: ev.scene.ball.x, y: ev.scene.ball.y };
          userPos = placeUser(ev.scene);
          hint(tx('flow.onetwo', 'Ver-kaç'));
          sfx('pass');
        } else {
          pending = { kind: 'pass', outcome: res.outcome || 'cut', aimX: ev.scene.ball.x, applied: false };
          startFlight(endPoint(ev.scene, pending.outcome, ev.scene.ball.x), commitOutcome);
        }
      }
    };
    this.reshow = function () { if (state.live) showStage(state.live.stage); };
    this.preview = function (type) {
      if (!state.live || !L.previewChance) return;
      const scene = L.previewChance(state, type);
      const ev = { type: 'chance', minute: Math.max(12, Math.floor(state.live.clock || 12)), scene: scene };
      state.live.events[state.live.cursor] = ev;
      hideCard();
      armAim(ev);
    };
    this.getScene = function () {
      const ev = currentEvent();
      return ev && ev.scene ? ev.scene : null;
    };
    this.toClient = function (x, y) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + (x / L.LOG_W) * rect.width,
        y: rect.top + (y / L.LOG_H) * rect.height,
      };
    };
    Object.defineProperty(this, 'phase', { get: function () { return phase; } });
    this.forceCelebrate = function () {
      celebrateT = 1.65;
      phase = 'banner';
      if (state.live && !state.live.waiting) {
        state.live.waiting = { text: 'GOL!', detail: 'Ağlar sallanıyor!', outcome: 'goal' };
      }
      burst(160, 420);
      burst(210, 390);
    };
  }

  function paintBust(canvas, look, kit) {
    if (!canvas) return;
    look = look || {};
    kit = kit || '#15803d';
    const ctx = canvas.getContext('2d');
    const dpr = 2;
    canvas.width = 140 * dpr;
    canvas.height = 160 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 140, 160);
    ctx.save();
    ctx.translate(70, 96);
    ctx.scale(2.1, 2.1);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 22, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = kit;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-16, -6, 32, 26, 6) : ctx.rect(-16, -6, 32, 26);
    ctx.fill();
    ctx.fillStyle = look.skin || '#e0b08a';
    ctx.fillRect(-3, -8, 6, 4);
    ctx.beginPath();
    ctx.arc(0, -16, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = look.hairColor || '#1c1917';
    const style = look.hair || 'short';
    if (style === 'buzz') {
      ctx.beginPath();
      ctx.arc(0, -17, 8.2, Math.PI, 0);
      ctx.fill();
    } else if (style === 'mohawk') {
      ctx.fillRect(-2, -30, 4, 16);
    } else if (style === 'long') {
      ctx.beginPath();
      ctx.arc(0, -17, 9, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-10, -16, 5, 18);
      ctx.fillRect(5, -16, 5, 18);
    } else if (style === 'curly') {
      ctx.beginPath();
      ctx.arc(-6, -20, 4, 0, Math.PI * 2);
      ctx.arc(0, -24, 4, 0, Math.PI * 2);
      ctx.arc(6, -20, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, -18, 9, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-8, -18, 16, 5);
    }
    if (look.beard && look.beard !== 'none') {
      ctx.globalAlpha = look.beard === 'full' ? 0.95 : 0.4;
      ctx.beginPath();
      ctx.ellipse(0, -10, look.beard === 'full' ? 5 : 3.5, 2.4, 0, 0, Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = look.boots || '#111827';
    ctx.beginPath();
    ctx.ellipse(-6, 22, 5, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(6, 22, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  root.YSMatch = { MatchView: MatchView, paintBust: paintBust };
})(typeof globalThis !== 'undefined' ? globalThis : this);
