// Calculate lunar phase for a given date
export function getLunarPhase(date = new Date()) {
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const lunarCycle = 29.530588853;
  const diff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = ((diff % lunarCycle) + lunarCycle) % lunarCycle;
  const pct = phase / lunarCycle;

  if (phase < 1.85)  return { name: 'Nouvelle Lune',        emoji: '🌑', pct, intention: 'Intentions & nouveaux départs' };
  if (phase < 7.38)  return { name: 'Premier croissant',    emoji: '🌒', pct, intention: 'Semences & initiation' };
  if (phase < 9.22)  return { name: 'Premier quartier',     emoji: '🌓', pct, intention: 'Action & décision' };
  if (phase < 14.77) return { name: 'Gibbeuse croissante',  emoji: '🌔', pct, intention: 'Croissance & raffinement' };
  if (phase < 16.61) return { name: 'Pleine Lune',          emoji: '🌕', pct, intention: 'Gratitude & célébration' };
  if (phase < 22.15) return { name: 'Gibbeuse décroissante',emoji: '🌖', pct, intention: 'Lâcher-prise & réflexion' };
  if (phase < 23.99) return { name: 'Dernier quartier',     emoji: '🌗', pct, intention: 'Bilan & pardon' };
  return                     { name: 'Dernier croissant',   emoji: '🌘', pct, intention: 'Repos & intégration' };
}

export function formatDate(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function today() {
  return formatDate(new Date());
}

export function getDaysInYear(year = new Date().getFullYear()) {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return isLeap ? 366 : 365;
}

export function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
