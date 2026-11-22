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
      if (el) el.textContent = text || '';
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
      if (score) {
        score.textContent = (me ? me.short : 'Sen') + '  ' + L.teamGoals(live.stats) + ' – ' + live.stats.oppGoals + '  ' + (opp ? opp.short : 'Rakip');
      }
      const ev = live.events[Math.min(live.cursor, Math.max(0, live.events.length - 1))];
      const minute = document.getElementById('match-minute');
      if (minute && ev) minute.textContent = ev.minute + "'";
      const sub = document.getElementById('match-sub');
      if (!sub) return;
      if (ev && ev.type === 'chance') {
        const chances = live.events.filter(function (e) { return e.type === 'chance'; });
        const idx = chances.indexOf(ev);
        const labels = { sut: 'Şut', pas: 'Pas', frikik: 'Frikik' };
        sub.textContent = 'Pozisyon ' + (idx + 1) + '/' + chances.length + ' · ' + (labels[ev.scene.type] || 'Şut');
      } else if (ev && ev.type === 'opp') sub.textContent = 'Karşı atak';
      else if (ev && ev.type === 'solo') sub.textContent = 'Takım atağı';
    }

    function chanceHint(scene) {
      if (!scene) return 'Topu hedefe kaydır.';
      if (scene.type === 'pas') return 'Beyaz formaya kaydır veya üzerine dokun.';
      if (scene.type === 'frikik') return 'Barajın açığından kaleye kaydır. Altın bölge ideal güç.';
      return 'Topa bas, kaleye kaydır. Altın bölge ideal güç.';
    }

    function showBanner(waiting) {
      const live = state.live;
      const last = live && live.cursor >= live.events.length - 1;
      hint(waiting.detail || waiting.text || '');
      setNext(true, last ? 'Maç sonu' : 'Devam');
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
      const vx = scene.ball.x - gcx;
      const vy = scene.ball.y - mouth;
      const len = Math.hypot(vx, vy) || 1;
      return {
        x: L.clamp(scene.ball.x + (vx / len) * 30, 28, L.LOG_W - 28),
        y: L.clamp(scene.ball.y + (vy / len) * 30, 80, L.LOG_H - 24),
      };
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
      phase = 'aim';
      pending = null;
      flight = null;
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
      if (dead || phase !== 'banner' || !state.live) return;
      clearAuto();
      state.live.waiting = null;
      state.live.cursor += 1;
      pending = null;
      if (hooks.onSave) hooks.onSave();
      enter();
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
        burst(ball.x, ball.y);
        sfx('goal');
        try { if (navigator.vibrate) navigator.vibrate(pending.outcome === 'goal' ? [18, 24, 18] : 12); } catch (e) {}
      } else if (pending.outcome === 'save' || pending.outcome === 'weak' || pending.outcome === 'wall') sfx('save');
      else if (pending.outcome === 'pass') sfx('pass');
      else sfx('miss');
    }

    function beginKick(swipe) {
      const ev = currentEvent();
      if (!ev || !ev.scene || phase !== 'aim') return;
      const scene = ev.scene;
      const info = L.classifyAction(scene, swipe);
      if (info.kind === 'none') {
        hint('Biraz daha net kaydır.');
        return;
      }
      const attrs = state.live.attrs;
      let outcome;
      let kind;
      if (info.kind === 'pass') {
        kind = 'pass';
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
      const first = endPoint(scene, outcome.outcome, aim);
      if (outcome.outcome === 'assist') {
        startFlight(first, function () {
          const far = Math.abs((scene.goal.x + 20) - scene.keeper.x) >= Math.abs((scene.goal.x + scene.goal.w - 20) - scene.keeper.x)
            ? scene.goal.x + 22 : scene.goal.x + scene.goal.w - 22;
          keeperTarget = scene.keeper.x + (Math.sign(far - scene.keeper.x) || 1) * 26;
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
      drag = { x: p.x, y: p.y, ox: p.x, oy: p.y, near: near, pid: e.pointerId };
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
      beginKick({ x1: ev.scene.ball.x, y1: ev.scene.ball.y, x2: p.x, y2: p.y });
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
      grd.addColorStop(0, '#1ea24a');
      grd.addColorStop(1, '#0f7a34');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 12; i++) {
        g.fillStyle = i % 2 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.05)';
        g.fillRect(0, (h / 12) * i, w, h / 12 + 1);
      }
      g.fillStyle = '#0b321c';
      g.fillRect(0, 0, w, 36);
      const crowd = ['#ffd56a', '#f4f7ef', '#7dd3fc', '#fb7185', '#c4b5fd'];
      for (let i = 0; i < 16; i++) {
        g.fillStyle = crowd[i % crowd.length];
        g.beginPath();
        g.arc(18 + i * 21, 18, 5, 0, Math.PI * 2);
        g.fill();
      }
      const goal = L.GOAL;
      const mouth = goal.y + goal.h;
      const cx = goal.x + goal.w / 2;
      g.strokeStyle = 'rgba(255,255,255,0.92)';
      g.lineWidth = 2;
      g.strokeRect(22, mouth, w - 44, h - mouth - 18);
      g.strokeRect(cx - 116, mouth, 232, 162);
      g.strokeRect(cx - 68, mouth, 136, 64);
      g.beginPath();
      g.arc(cx, mouth + 108, 3, 0, Math.PI * 2);
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.fill();
      g.beginPath();
      g.arc(cx, mouth + 108, 42, 0.62, Math.PI - 0.62);
      g.stroke();
      g.fillStyle = 'rgba(6, 28, 16, 0.55)';
      g.fillRect(goal.x, goal.y, goal.w, goal.h);
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = 1;
      for (let x = goal.x + 8; x < goal.x + goal.w; x += 10) {
        g.beginPath();
        g.moveTo(x, goal.y + 2);
        g.lineTo(x, mouth - 1);
        g.stroke();
      }
      for (let y = goal.y + 6; y < mouth; y += 6) {
        g.beginPath();
        g.moveTo(goal.x + 2, y);
        g.lineTo(goal.x + goal.w - 2, y);
        g.stroke();
      }
      g.strokeStyle = '#f7f4ea';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(goal.x, goal.y);
      g.lineTo(goal.x, mouth);
      g.moveTo(goal.x + goal.w, goal.y);
      g.lineTo(goal.x + goal.w, mouth);
      g.moveTo(goal.x, goal.y);
      g.lineTo(goal.x + goal.w, goal.y);
      g.stroke();
    }

    function drawToken(x, y, radius, fill, label, ring) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(x + 1, y + radius + 3, radius * 0.82, radius * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = fill;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = ring || '#fff';
      ctx.stroke();
      if (label) {
        ctx.fillStyle = '#fff';
        ctx.font = '700 11px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y + 0.5);
      }
      ctx.restore();
    }

    function drawBall(x, y) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(x + 1, y + 9, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(x, y);
      ctx.fillStyle = '#f7f4ea';
      ctx.beginPath();
      ctx.arc(0, 0, 7.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1b1b1b';
      ctx.fillStyle = '#1b1b1b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 2.1, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 2.2, Math.sin(a) * 2.2);
        ctx.lineTo(Math.cos(a) * 6.3, Math.sin(a) * 6.3);
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
      ctx.fillText(text || '', 180, 276);
      ctx.restore();
    }

    function draw(time) {
      if (!ctx || !state.live) return;
      const ev = state.live.events[state.live.cursor];
      ctx.clearRect(0, 0, L.LOG_W, L.LOG_H);
      if (cache.width) ctx.drawImage(cache, 0, 0, L.LOG_W, L.LOG_H);
      ctx.save();
      if (shake > 0) ctx.translate(Math.sin(time / 18) * 5 * shake, 0);
      const scene = ev && ev.type === 'chance' ? ev.scene : null;
      if (scene) {
        (scene.defenders || []).forEach(function (d) {
          drawToken(d.x, d.y, 13, '#9f1239', '', '#fecdd3');
        });
        (scene.wall || []).forEach(function (d) {
          drawToken(d.x, d.y, 15, '#1e3a8a', '', '#bfdbfe');
        });
        if (scene.teammate) {
          if (phase === 'aim') {
            const pulse = 1 + Math.sin(time / 180) * 0.08;
            ctx.save();
            ctx.strokeStyle = scene.type === 'pas' ? 'rgba(157,255,198,0.95)' : 'rgba(255,255,255,0.45)';
            ctx.lineWidth = scene.type === 'pas' ? 3 : 2;
            ctx.beginPath();
            ctx.arc(scene.teammate.x, scene.teammate.y, 20 * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          drawToken(scene.teammate.x, scene.teammate.y, 14, '#f4f1e4', 'A', '#0f172a');
        }
        const bob = phase === 'aim' ? Math.sin(time / 380) * 3 : 0;
        drawToken(keeperX + bob, scene.keeper.y, 15, '#ff8a1e', 'K', '#fff7ed');
        const meClub = L.clubById(state.clubId);
        drawToken(userPos.x, userPos.y, 15, meClub ? meClub.color : '#ffd56a', String(L.shirtNumber(state.player.name)), '#fff');
        if (L.isCaptain(state)) {
          ctx.fillStyle = '#ffd56a';
          ctx.fillRect(userPos.x - 8, userPos.y - 2, 7, 4);
        }
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 11px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SEN', userPos.x, userPos.y + 28);
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
        drawBall(ball.x, ball.y);
      } else {
        drawBall(ball.x, ball.y);
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
      sfx('whistle');
      enter();
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
  }

  root.YSMatch = { MatchView: MatchView };
})(typeof globalThis !== 'undefined' ? globalThis : this);
