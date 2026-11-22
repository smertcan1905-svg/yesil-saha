/* Yerel bildirimler. Tarayıcıda ve izin yokken sessiz kalır. */
(function (root) {
  'use strict';
  const IDS = [11, 12, 13];

  function native() {
    try {
      return !!(root.Capacitor && root.Capacitor.isNativePlatform && root.Capacitor.isNativePlatform());
    } catch (e) {
      return false;
    }
  }

  function plugin() {
    if (!native() || !root.Capacitor.registerPlugin) return null;
    if (!plugin.ref) plugin.ref = root.Capacitor.registerPlugin('LocalNotifications');
    return plugin.ref;
  }

  function dayKey(date) {
    return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
  }

  function texts(lang) {
    if (lang === 'en') {
      return {
        energyTitle: 'Energy is full',
        energyBody: 'You are ready to train.',
        dailyTitle: 'Daily reward is ready',
        dailyBody: 'Keep the streak going.',
        idleTitle: 'Your club is waiting',
        idleBody: 'You have been off the pitch for two days.',
      };
    }
    return {
      energyTitle: 'Enerjin doldu',
      energyBody: 'Antrenman için hazırsın.',
      dailyTitle: 'Günlük ödül hazır',
      dailyBody: 'Serini bozma.',
      idleTitle: 'Kulübün seni bekliyor',
      idleBody: 'İki gündür sahaya çıkmadın.',
    };
  }

  function capPerDay(items) {
    const kept = [];
    const counts = {};
    items.sort(function (a, b) { return a.at - b.at; });
    items.forEach(function (item) {
      const key = dayKey(item.at);
      counts[key] = counts[key] || 0;
      if (counts[key] >= 2) return;
      counts[key] += 1;
      kept.push(item);
    });
    return kept.slice(0, 3);
  }

  function nextMorning(from) {
    const d = new Date(from.getTime());
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  }

  async function cancelAll(notes) {
    try {
      await notes.cancel({ notifications: IDS.map(function (id) { return { id: id }; }) });
    } catch (e) {}
  }

  async function ask() {
    const notes = plugin();
    if (!notes) return false;
    try {
      const status = await notes.requestPermissions();
      return status && status.display === 'granted';
    } catch (e) {
      return false;
    }
  }

  async function sync(state, settings) {
    const notes = plugin();
    if (!notes) return false;
    if (!settings || settings.notify === false) {
      await cancelAll(notes);
      return false;
    }
    try {
      const perm = await notes.checkPermissions();
      if (!perm || perm.display !== 'granted') return false;
      if (notes.createChannel) {
        await notes.createChannel({
          id: 'legend',
          name: 'Legend Striker',
          description: 'Energy, rewards and comeback reminders',
          importance: 3,
          vibration: settings.vibrate !== false,
        });
      }
      await cancelAll(notes);
      const copy = texts(settings.lang);
      const now = new Date();
      const queue = [];
      const energy = state && state.player ? state.player.energy : 100;
      if (energy < 100) {
        const minutes = (100 - energy) * 4;
        const at = new Date(now.getTime() + minutes * 60 * 1000);
        if (at.getTime() - now.getTime() > 60 * 1000) {
          queue.push({ id: 11, title: copy.energyTitle, body: copy.energyBody, at: at });
        }
      }
      queue.push({ id: 12, title: copy.dailyTitle, body: copy.dailyBody, at: nextMorning(now) });
      queue.push({ id: 13, title: copy.idleTitle, body: copy.idleBody, at: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) });
      const notesToSend = capPerDay(queue).map(function (item) {
        return {
          id: item.id,
          title: item.title,
          body: item.body,
          channelId: 'legend',
          schedule: { at: item.at, allowWhileIdle: true },
        };
      });
      if (notesToSend.length) await notes.schedule({ notifications: notesToSend });
      return true;
    } catch (e) {
      return false;
    }
  }

  root.YSNotify = { isNative: native, ask: ask, sync: sync };
})(typeof globalThis !== 'undefined' ? globalThis : this);
