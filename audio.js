/* Orijinal sesler. Dosyalar bu proje için üretildi, üçüncü taraf parça yok. */
(function (root) {
  'use strict';
  const SRC = {
    music: 'audio/music.ogg',
    crowd: 'audio/crowd.ogg',
    whistle: 'audio/whistle.ogg',
    kick: 'audio/kick.ogg',
    net: 'audio/net.ogg',
    ui: 'audio/ui.ogg',
    jingle: 'audio/jingle.ogg',
  };
  let musicVol = 0.7;
  let sfxVol = 0.85;
  let muted = false;
  let unlocked = false;
  let crowdLevel = 0.22;
  let crowdTimer = 0;
  const loops = {};

  function clamp(n) { return Math.max(0, Math.min(1, Number(n) || 0)); }

  function loop(name) {
    if (typeof Audio === 'undefined') return null;
    if (!loops[name]) {
      const audio = new Audio(SRC[name]);
      audio.loop = true;
      audio.preload = 'auto';
      loops[name] = audio;
    }
    return loops[name];
  }

  function apply() {
    const music = loops.music;
    const crowd = loops.crowd;
    if (music) music.volume = muted ? 0 : clamp(musicVol) * 0.5;
    if (crowd) crowd.volume = muted ? 0 : clamp(sfxVol) * crowdLevel;
  }

  function play(name) {
    if (muted || !unlocked || typeof Audio === 'undefined') return;
    const audio = new Audio(SRC[name]);
    audio.volume = clamp(sfxVol);
    audio.play().catch(function () {});
  }

  function start(name) {
    const audio = loop(name);
    if (!audio) return;
    apply();
    if (audio.paused) audio.play().catch(function () {});
  }

  function stop(name) {
    const audio = loops[name];
    if (!audio) return;
    audio.pause();
  }

  root.YSAudio = {
    configure: function (settings) {
      settings = settings || {};
      muted = settings.sound === false;
      if (typeof settings.music === 'number') musicVol = settings.music;
      if (typeof settings.sfx === 'number') sfxVol = settings.sfx;
      apply();
    },
    unlock: function () {
      unlocked = true;
      if (!loops.crowd || loops.crowd.paused) start('music');
    },
    menu: function () {
      stop('crowd');
      crowdLevel = 0.22;
      start('music');
    },
    match: function () {
      stop('music');
      crowdLevel = 0.28;
      start('crowd');
    },
    attack: function () {
      crowdLevel = 0.72;
      apply();
      clearTimeout(crowdTimer);
      crowdTimer = setTimeout(function () {
        crowdLevel = 0.3;
        apply();
      }, 900);
    },
    goal: function () {
      crowdLevel = 1;
      apply();
      play('net');
      clearTimeout(crowdTimer);
      crowdTimer = setTimeout(function () {
        crowdLevel = 0.4;
        apply();
      }, 1600);
    },
    kick: function () { play('kick'); },
    whistle: function () { play('whistle'); },
    ui: function () { play('ui'); },
    jingle: function () { play('jingle'); },
    sfxVolume: function () { return muted ? 0 : clamp(sfxVol); },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
