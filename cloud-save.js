/* Kayıt kodu ve isteğe bağlı Firebase Firestore. SDK yok, REST. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.YSCloud = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TOKEN_KEY = 'yesil-saha-firebase-oturum';

  function bytes(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 128) out.push(c);
      else if (c < 2048) out.push(192 | (c >> 6), 128 | (c & 63));
      else out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
    return out;
  }

  function b64url(data) {
    let bin = '';
    const arr = data instanceof Uint8Array ? data : new Uint8Array(data);
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    const b64 = typeof btoa === 'function'
      ? btoa(bin)
      : Buffer.from(bin, 'binary').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function fromB64url(text) {
    const pad = text.length % 4 === 0 ? '' : '='.repeat(4 - (text.length % 4));
    const b64 = text.replace(/-/g, '+').replace(/_/g, '/') + pad;
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function utf8(data) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(data);
    let s = '';
    for (let i = 0; i < data.length; i++) s += String.fromCharCode(data[i]);
    return decodeURIComponent(escape(s));
  }

  function crc(str) {
    let h = 2166136261;
    const data = bytes(str);
    for (let i = 0; i < data.length; i++) {
      h ^= data[i];
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function encode(state) {
    const json = JSON.stringify(state);
    return 'YS1.' + b64url(bytes(json)) + '.' + crc(json);
  }

  function decode(code) {
    const raw = String(code || '').trim().replace(/\s+/g, '');
    const parts = raw.split('.');
    if (parts.length !== 3 || parts[0] !== 'YS1') return null;
    let json;
    try { json = utf8(fromB64url(parts[1])); } catch (e) { return null; }
    if (crc(json) !== parts[2]) return null;
    let data;
    try { data = JSON.parse(json); } catch (e) { return null; }
    if (!data || data.v !== 1 || !data.player || !data.clubId) return null;
    return data;
  }

  function config() {
    const c = root.FIREBASE_CONFIG;
    if (!c || !c.apiKey || !c.projectId) return null;
    if (String(c.apiKey).indexOf('BURAYA') >= 0) return null;
    if (String(c.projectId).indexOf('BURAYA') >= 0) return null;
    return c;
  }

  function configured() { return !!config(); }

  function readSession() {
    try {
      const raw = root.localStorage && root.localStorage.getItem(TOKEN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeSession(session) {
    try {
      if (root.localStorage) root.localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
    } catch (e) {}
  }

  function postJson(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          const err = new Error((data && data.error && data.error.message) || ('HTTP ' + res.status));
          err.payload = data;
          throw err;
        }
        return data;
      });
    });
  }

  function ensureUser() {
    const c = config();
    if (!c) return Promise.reject(new Error('unconfigured'));
    const saved = readSession();
    if (saved && saved.idToken && saved.localId && saved.exp > Date.now() + 60000) {
      return Promise.resolve(saved);
    }
    const refresh = saved && saved.refreshToken;
    const url = refresh
      ? 'https://securetoken.googleapis.com/v1/token?key=' + encodeURIComponent(c.apiKey)
      : 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + encodeURIComponent(c.apiKey);
    const body = refresh
      ? { grant_type: 'refresh_token', refresh_token: saved.refreshToken }
      : { returnSecureToken: true };
    return postJson(url, body).then(function (data) {
      const session = {
        idToken: data.id_token || data.idToken,
        refreshToken: data.refresh_token || data.refreshToken,
        localId: data.user_id || data.localId || (saved && saved.localId),
        exp: Date.now() + (Number(data.expires_in || data.expiresIn || 3600) * 1000),
      };
      writeSession(session);
      return session;
    });
  }

  const SYNC_KEY = 'yesil-saha-bulut-zaman';
  const QUEUE_KEY = 'yesil-saha-bulut-kuyruk';
  const DEVICE_KEY = 'yesil-saha-cihaz';

  function deviceId() {
    try {
      let id = root.localStorage && root.localStorage.getItem(DEVICE_KEY);
      if (!id) {
        id = 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        if (root.localStorage) root.localStorage.setItem(DEVICE_KEY, id);
      }
      return id;
    } catch (e) { return 'device'; }
  }

  function lastSync() {
    try { return Number((root.localStorage && root.localStorage.getItem(SYNC_KEY)) || 0); } catch (e) { return 0; }
  }

  function markSync(ts) {
    try { if (root.localStorage) root.localStorage.setItem(SYNC_KEY, String(ts || Date.now())); } catch (e) {}
  }

  function careerUrl(c, uid) {
    return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(c.projectId) +
      '/databases/(default)/documents/users/' + encodeURIComponent(uid) + '/career/current';
  }

  function adsOn() {
    try { return !!(root.localStorage && root.localStorage.getItem('yesil-saha-reklamsiz') === '1'); } catch (e) { return false; }
  }

  function readDoc(data) {
    const fields = data && data.fields;
    if (!fields) return null;
    const payload = fields.payload && fields.payload.stringValue;
    const state = decode(payload);
    const updated = Number((fields.updated && fields.updated.integerValue) || 0);
    return { state: state, updated: updated, removeAds: !!(fields.removeAds && fields.removeAds.booleanValue) };
  }

  function fetchDoc(session) {
    const c = config();
    const url = careerUrl(c, session.localId) + '?key=' + encodeURIComponent(c.apiKey);
    return fetch(url, { headers: { Authorization: 'Bearer ' + session.idToken } }).then(function (res) {
      if (res.status === 404) return null;
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data && data.error && data.error.message) || 'firestore');
        return readDoc(data);
      });
    });
  }

  function writeDoc(session, state, updated) {
    const c = config();
    const url = careerUrl(c, session.localId) +
      '?updateMask.fieldPaths=payload&updateMask.fieldPaths=updated&updateMask.fieldPaths=device&updateMask.fieldPaths=removeAds&updateMask.fieldPaths=version&key=' +
      encodeURIComponent(c.apiKey);
    return fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.idToken },
      body: JSON.stringify({
        fields: {
          payload: { stringValue: encode(state) },
          updated: { integerValue: String(updated) },
          device: { stringValue: deviceId() },
          removeAds: { booleanValue: adsOn() || !!(state && state.removeAds) },
          version: { stringValue: '1.8.1' },
        },
      }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data && data.error && data.error.message) || 'firestore');
        markSync(updated);
        try { if (root.localStorage) root.localStorage.removeItem(QUEUE_KEY); } catch (e) {}
        const row = boardFrom(state);
        const posted = row ? publishBoard(row).catch(function () { return { ok: false }; }) : Promise.resolve({ ok: false });
        return posted.then(function () { return { ok: true, updated: updated }; });
      });
    });
  }

  function online() {
    return typeof navigator === 'undefined' || navigator.onLine !== false;
  }

  function queue(state) {
    try {
      if (root.localStorage) root.localStorage.setItem(QUEUE_KEY, encode(state));
    } catch (e) {}
    return { ok: true, queued: true };
  }

  function saveCloud(state, opts) {
    const c = config();
    if (!c) return Promise.reject(new Error('unconfigured'));
    opts = opts || {};
    if (!online()) return Promise.resolve(queue(state));
    const localT = Number(state && state.cloudUpdated) || Date.now();
    return ensureUser().then(function (session) {
      return fetchDoc(session).then(function (remote) {
        const remoteT = remote && remote.updated || 0;
        const base = lastSync();
        const both = remote && remote.state && remoteT > base && localT > base && Math.abs(remoteT - localT) > 1500;
        if (both && !opts.force) {
          return { ok: false, conflict: true, remote: remote.state, remoteUpdated: remoteT, localUpdated: localT };
        }
        if (!opts.force && remote && remoteT > localT) {
          return { ok: true, remoteNewer: true, remote: remote.state, remoteUpdated: remoteT };
        }
        return writeDoc(session, state, Math.max(localT, Date.now()));
      });
    }).catch(function (err) {
      queue(state);
      throw err;
    });
  }

  function loadCloud() {
    const c = config();
    if (!c) return Promise.reject(new Error('unconfigured'));
    return ensureUser().then(function (session) {
      return fetchDoc(session).then(function (doc) {
        if (!doc) return null;
        if (doc.removeAds && root.localStorage) root.localStorage.setItem('yesil-saha-reklamsiz', '1');
        markSync(doc.updated || Date.now());
        return doc.state;
      });
    });
  }

  function flushQueue(state) {
    if (!configured() || !online()) return Promise.resolve({ ok: false });
    let queued = null;
    try { queued = root.localStorage && root.localStorage.getItem(QUEUE_KEY); } catch (e) {}
    const payload = queued ? decode(queued) : state;
    if (!payload) return Promise.resolve({ ok: true });
    return saveCloud(payload, { force: true });
  }

  function syncStamp() { return lastSync(); }

  function intField(n) { return { integerValue: String(Math.round(Number(n) || 0)) }; }
  function strField(s) { return { stringValue: String(s == null ? '' : s) }; }

  const BOARD_CACHE = 'yesil-saha-siralama';
  const BAD_NAME = ['amk', 'aq', 'siktir', 'siker', 'orospu', 'pic ', 'fuck', 'shit', 'bitch', 'kaltak'];

  function cleanName(name) {
    let s = String(name == null ? '' : name).replace(/\s+/g, ' ').trim();
    s = s.replace(/[^\p{L}\p{M}0-9 .'-]/gu, '');
    if (s.length > 16) s = s.slice(0, 16).trim();
    const low = s.toLowerCase();
    for (let i = 0; i < BAD_NAME.length; i++) {
      if (low.indexOf(BAD_NAME[i]) >= 0) return 'Player';
    }
    return s || 'Player';
  }

  function clubLabel(state) {
    const L = root.YSLogic;
    const club = L && L.clubById && state && L.clubById(state.clubId);
    const name = club && club.name ? club.name : (state && state.clubId) || '';
    return String(name).slice(0, 48);
  }

  function boardFrom(state) {
    if (!state || !state.player || !state.history) return null;
    const list = state.trophies || [];
    const stars = list.filter(function (row) {
      return row && (row.name === 'Altın Yıldız Ödülü' || row.name === 'Golden Star Award');
    }).length;
    const goals = Math.max(0, state.history.goals || 0);
    const assists = Math.max(0, state.history.assists || 0);
    const cups = (state.history.cups || 0) + (state.history.titles || 0);
    const trophies = Math.max(list.length, cups);
    return {
      name: cleanName(state.player.name),
      club: clubLabel(state),
      nat: String(state.player.nat || state.country || 'tr').slice(0, 8),
      age: state.player.age || 16,
      goals: goals,
      assists: assists,
      trophies: trophies,
      ballonStars: stars,
      careerScore: goals * 3 + assists * 2 + trophies * 25 + stars * 40,
      version: '1.8.1',
      updatedAt: Date.now(),
    };
  }

  function boardFields(record) {
    return {
      name: strField(cleanName(record.name)),
      club: strField(String(record.club || '').slice(0, 48)),
      nat: strField(String(record.nat || 'tr').slice(0, 8)),
      age: intField(record.age),
      goals: intField(record.goals),
      assists: intField(record.assists),
      trophies: intField(record.trophies),
      ballonStars: intField(record.ballonStars),
      careerScore: intField(record.careerScore),
      version: strField(record.version || '1.8.1'),
      updatedAt: intField(record.updatedAt || Date.now()),
    };
  }

  const BOARD_SORT = { career: 'careerScore', goals: 'goals', assists: 'assists', trophies: 'trophies' };

  function readCache() {
    try {
      const raw = root.localStorage && root.localStorage.getItem(BOARD_CACHE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeCache(pack) {
    try { if (root.localStorage) root.localStorage.setItem(BOARD_CACHE, JSON.stringify(pack)); } catch (e) {}
  }

  function publishBoard(record) {
    const c = config();
    const row = record && record.careerScore != null ? record : boardFrom(record);
    if (!row) return Promise.reject(new Error('unconfigured'));
    if (!c) return Promise.reject(new Error('unconfigured'));
    if (!online()) {
      const pack = readCache() || {};
      pack.queued = row;
      pack.at = Date.now();
      writeCache(pack);
      return Promise.resolve({ ok: true, queued: true });
    }
    const mask = ['name', 'club', 'nat', 'age', 'goals', 'assists', 'trophies', 'ballonStars', 'careerScore', 'version', 'updatedAt']
      .map(function (key) { return 'updateMask.fieldPaths=' + key; }).join('&');
    return ensureUser().then(function (session) {
      const url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(c.projectId) +
        '/databases/(default)/documents/leaderboard/' + encodeURIComponent(session.localId) +
        '?' + mask + '&key=' + encodeURIComponent(c.apiKey);
      return fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.idToken },
        body: JSON.stringify({ fields: boardFields(row) }),
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error((data && data.error && data.error.message) || 'firestore');
          return { ok: true, uid: session.localId };
        });
      });
    });
  }

  function readNum(field) {
    if (!field) return 0;
    return Number(field.integerValue || field.doubleValue || 0);
  }

  function rowFromDoc(doc, uid) {
    const fields = doc && doc.fields;
    if (!fields || !fields.name) return null;
    const id = uid || ((doc.name || '').split('/').pop());
    return {
      uid: id,
      name: fields.name.stringValue,
      club: fields.club && fields.club.stringValue,
      nat: fields.nat && fields.nat.stringValue,
      age: readNum(fields.age),
      goals: readNum(fields.goals),
      assists: readNum(fields.assists),
      trophies: readNum(fields.trophies),
      ballonStars: readNum(fields.ballonStars),
      careerScore: readNum(fields.careerScore),
      version: fields.version && fields.version.stringValue,
    };
  }

  function sortKey(kind) { return BOARD_SORT[kind] || 'careerScore'; }

  function fetchBoard(kind) {
    const c = config();
    const key = sortKey(kind);
    const cached = readCache();
    if (!c) return Promise.resolve({ rows: (cached && cached[key]) || [], me: null, offline: true, rank: null });
    if (!online()) {
      return Promise.resolve({
        rows: (cached && cached[key]) || [],
        me: cached && cached.me,
        offline: true,
        rank: cached && cached.ranks ? cached.ranks[key] : null,
      });
    }
    return ensureUser().then(function (session) {
      const url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(c.projectId) +
        '/databases/(default)/documents:runQuery?key=' + encodeURIComponent(c.apiKey);
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.idToken },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'leaderboard' }],
            orderBy: [{ field: { fieldPath: key }, direction: 'DESCENDING' }],
            limit: 100,
          },
        }),
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error((data && data.error && data.error.message) || 'firestore');
          const rows = [];
          (Array.isArray(data) ? data : []).forEach(function (item) {
            const row = rowFromDoc(item.document);
            if (row) rows.push(row);
          });
          const listed = rows.find(function (row) { return row.uid === session.localId; }) || null;
          return ownRow(session, listed).then(function (mine) {
          const pack = readCache() || {};
          pack[key] = rows;
          pack.me = mine || pack.me;
          pack.at = Date.now();
          writeCache(pack);
          return rankOf(session, key, mine).then(function (rank) {
            pack.ranks = pack.ranks || {};
            pack.ranks[key] = rank;
            writeCache(pack);
            return { rows: rows, me: mine, offline: false, rank: rank, uid: session.localId };
          });
          });
        });
      });
    }).catch(function () {
      return {
        rows: (cached && cached[key]) || [],
        me: cached && cached.me,
        offline: true,
        rank: cached && cached.ranks ? cached.ranks[key] : null,
      };
    });
  }

  function ownRow(session, listed) {
    if (listed) return Promise.resolve(listed);
    const c = config();
    const url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(c.projectId) +
      '/databases/(default)/documents/leaderboard/' + encodeURIComponent(session.localId) +
      '?key=' + encodeURIComponent(c.apiKey);
    return fetch(url, { headers: { Authorization: 'Bearer ' + session.idToken } }).then(function (res) {
      if (res.status === 404) return null;
      return res.json().then(function (data) {
        if (!res.ok) return null;
        return rowFromDoc(data, session.localId);
      });
    }).catch(function () { return null; });
  }

  function rankOf(session, key, mine) {
    if (!mine) return Promise.resolve(null);
    const c = config();
    const url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(c.projectId) +
      '/databases/(default)/documents:runAggregationQuery?key=' + encodeURIComponent(c.apiKey);
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.idToken },
      body: JSON.stringify({
        structuredAggregationQuery: {
          structuredQuery: {
            from: [{ collectionId: 'leaderboard' }],
            where: {
              fieldFilter: {
                field: { fieldPath: key },
                op: 'GREATER_THAN',
                value: { integerValue: String(mine[key] || 0) },
              },
            },
          },
          aggregations: [{ alias: 'c', count: {} }],
        },
      }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) return null;
        const first = Array.isArray(data) ? data[0] : null;
        const fields = first && first.result && first.result.aggregateFields;
        const higher = fields && fields.c ? readNum(fields.c) : 0;
        return higher + 1;
      });
    }).catch(function () { return null; });
  }

  function download(code, filename) {
    if (typeof document === 'undefined') return false;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'yesil-saha.ysave';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return true;
  }

  function share(code) {
    const title = 'Legend Striker';
    const fileOk = typeof File !== 'undefined';
    const file = fileOk ? new File([code], 'yesil-saha.ysave', { type: 'text/plain' }) : null;
    if (navigator.share) {
      const withFile = file && navigator.canShare && navigator.canShare({ files: [file] });
      const job = withFile
        ? navigator.share({ title: title, text: code, files: [file] })
        : navigator.share({ title: title, text: code });
      return job.then(function () { return 'shared'; });
    }
    return Promise.reject(new Error('noshare'));
  }

  return {
    encode: encode,
    decode: decode,
    configured: configured,
    saveCloud: saveCloud,
    loadCloud: loadCloud,
    flushQueue: flushQueue,
    syncStamp: syncStamp,
    deviceId: deviceId,
    cleanName: cleanName,
    boardFrom: boardFrom,
    publishBoard: publishBoard,
    fetchBoard: fetchBoard,
    download: download,
    share: share,
    crc: crc,
  };
});
