/* Her kulüp için kurgusal arma. Ağ yok, çizim burada. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.YSCrests = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function ink(hex) {
    const raw = String(hex || '#888888').replace('#', '');
    const full = raw.length === 3 ? raw.split('').map(function (c) { return c + c; }).join('') : raw;
    const n = parseInt(full, 16);
    if (!isFinite(n)) return '#ffffff';
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 > 168 ? '#1c1917' : '#fffaf3';
  }

  function initials(club) {
    if (club && club.initials) return club.initials;
    const name = club && club.name ? club.name : '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function shapePath(shape) {
    if (shape === 'round') return 'M32 6a26 26 0 1 0 0.1 0z';
    if (shape === 'lozenge') return 'M32 4 L56 24 L32 60 L8 24 Z';
    return 'M32 4 L54 12 L54 34 C54 48 44 56 32 60 C20 56 10 48 10 34 L10 12 Z';
  }

  function pattern(club, id) {
    const shape = club.shape || 'shield';
    const clip = shapePath(shape);
    const second = club.second || '#f8fafc';
    const kind = club.pattern || 'band';
    let inner = '';
    if (kind === 'stripes') {
      for (let i = 0; i < 5; i++) {
        inner += '<rect x="' + (8 + i * 10) + '" y="4" width="5" height="56" fill="' + second + '" opacity="0.9"/>';
      }
    } else if (kind === 'chevron') {
      inner += '<path d="M12 40 L32 22 L52 40 L52 48 L32 30 L12 48 Z" fill="' + second + '"/>';
    } else if (kind === 'quarters') {
      inner += '<rect x="32" y="4" width="24" height="28" fill="' + second + '" opacity="0.85"/>';
      inner += '<rect x="8" y="32" width="24" height="28" fill="' + second + '" opacity="0.85"/>';
    } else if (kind === 'rays') {
      inner += '<path d="M32 32 L32 6 L38 32 Z M32 32 L58 32 L32 38 Z M32 32 L32 58 L26 32 Z M32 32 L6 32 L32 26 Z" fill="' + second + '" opacity="0.8"/>';
    } else if (kind === 'plain') {
      inner += '<circle cx="32" cy="28" r="14" fill="none" stroke="' + second + '" stroke-width="3"/>';
    } else {
      inner += '<rect x="8" y="34" width="48" height="10" fill="' + second + '"/>';
    }
    return '<defs><clipPath id="' + id + '"><path d="' + clip + '"/></clipPath></defs>' +
      '<g clip-path="url(#' + id + ')">' + inner + '</g>';
  }

  function svg(club, size) {
    const px = size || 46;
    const color = club && club.color ? club.color : '#147a34';
    const second = club && club.second ? club.second : '#f8fafc';
    const shape = club && club.shape ? club.shape : 'shield';
    const id = 'c' + Math.abs((club && club.id ? club.id : 'x').split('').reduce(function (h, ch) {
      return ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
    }, 7)).toString(36);
    const letters = initials(club);
    const text = ink(color);
    const font = letters.length > 2 ? 11 : 15;
    return '<svg class="crest-svg" width="' + px + '" height="' + px + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<path d="' + shapePath(shape) + '" fill="' + esc(color) + '" stroke="' + esc(second) + '" stroke-width="3"/>' +
      pattern(club || {}, id) +
      '<text x="32" y="36" text-anchor="middle" font-family="Segoe UI, Helvetica, sans-serif" font-size="' + font +
      '" font-weight="800" fill="' + text + '">' + esc(letters) + '</text></svg>';
  }

  function html(club, size) {
    return '<span class="crest-wrap">' + svg(club, size) + '</span>';
  }

  return { svg: svg, html: html, initials: initials, ink: ink };
});
