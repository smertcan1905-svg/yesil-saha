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

  function toFields(state) {
    return {
      fields: {
        payload: { stringValue: encode(state) },
        updated: { integerValue: String(Date.now()) },
      },
    };
  }

  function saveCloud(state) {
    const c = config();
    if (!c) return Promise.reject(new Error('unconfigured'));
    return ensureUser().then(function (session) {
      const url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(c.projectId) +
        '/databases/(default)/documents/careers/' + encodeURIComponent(session.localId) +
        '?updateMask.fieldPaths=payload&updateMask.fieldPaths=updated&key=' + encodeURIComponent(c.apiKey);
      return fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.idToken,
        },
        body: JSON.stringify(toFields(state)),
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error((data && data.error && data.error.message) || 'firestore');
          return { ok: true };
        });
      });
    });
  }

  function loadCloud() {
    const c = config();
    if (!c) return Promise.reject(new Error('unconfigured'));
    return ensureUser().then(function (session) {
      const url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(c.projectId) +
        '/databases/(default)/documents/careers/' + encodeURIComponent(session.localId) +
        '?key=' + encodeURIComponent(c.apiKey);
      return fetch(url, { headers: { Authorization: 'Bearer ' + session.idToken } }).then(function (res) {
        if (res.status === 404) return null;
        return res.json().then(function (data) {
          if (!res.ok) throw new Error((data && data.error && data.error.message) || 'firestore');
          const payload = data && data.fields && data.fields.payload && data.fields.payload.stringValue;
          return decode(payload);
        });
      });
    });
  }

  function intField(n) { return { integerValue: String(Math.round(Number(n) || 0)) }; }
  function strField(s) { return { stringValue: String(s == null ? '' : s) }; }

  function publishBoard(record) {
    const c = config();
    if (!c) return Promise.reject(new Error('unconfigured'));
    return ensureUser().then(function (session) {
      const url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(c.projectId) +
        '/databases/(default)/documents/leaderboard/' + encodeURIComponent(session.localId) +
        '?updateMask.fieldPaths=name&updateMask.fieldPaths=goals&updateMask.fieldPaths=assists&updateMask.fieldPaths=matches&updateMask.fieldPaths=club&updateMask.fieldPaths=country&updateMask.fieldPaths=updated&key=' +
        encodeURIComponent(c.apiKey);
      return fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.idToken },
        body: JSON.stringify({
          fields: {
            name: strField(record.name),
            goals: intField(record.goals),
            assists: intField(record.assists),
            matches: intField(record.matches),
            club: strField(record.club),
            country: strField(record.country),
            updated: intField(Date.now()),
          },
        }),
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error((data && data.error && data.error.message) || 'firestore');
          return { ok: true };
        });
      });
    });
  }

  function readNum(field) {
    if (!field) return 0;
    return Number(field.integerValue || field.doubleValue || 0);
  }

  function fetchBoard() {
    const c = config();
    if (!c) return Promise.reject(new Error('unconfigured'));
    return ensureUser().then(function (session) {
      const url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(c.projectId) +
        '/databases/(default)/documents:runQuery?key=' + encodeURIComponent(c.apiKey);
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.idToken },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'leaderboard' }],
            orderBy: [{ field: { fieldPath: 'goals' }, direction: 'DESCENDING' }],
            limit: 10,
          },
        }),
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error((data && data.error && data.error.message) || 'firestore');
          const rows = [];
          (Array.isArray(data) ? data : []).forEach(function (item) {
            const fields = item.document && item.document.fields;
            if (!fields) return;
            rows.push({
              name: fields.name && fields.name.stringValue,
              goals: readNum(fields.goals),
              assists: readNum(fields.assists),
              club: fields.club && fields.club.stringValue,
              country: fields.country && fields.country.stringValue,
            });
          });
          return rows;
        });
      });
    });
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
    publishBoard: publishBoard,
    fetchBoard: fetchBoard,
    download: download,
    share: share,
    crc: crc,
  };
});
