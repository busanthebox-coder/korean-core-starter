// Weekly buddy missions: the three scenarios to run with a Korean friend this week.
// The pick must be stable for the whole week — you might agree on a session on
// Monday and sit down on Saturday, and the list has to still be the same one.

const MISSION_COUNT = 3;

// ISO week: Monday starts the week, and the week belongs to the year holding its Thursday.
export function isoWeekKey(now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = (date.getDay() + 6) % 7; // Mon=0 … Sun=6
  date.setDate(date.getDate() - day + 3); // the Thursday of this week
  const thursday = date.getTime();
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const week = 1 + Math.round((thursday - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function spokenAlready(spoken, id) {
  return Array.isArray(spoken?.[id]) && spoken[id].length > 0;
}

export function pickBuddyMissions(scenarios = [], { now = new Date(), spoken = {} } = {}) {
  const pool = scenarios.filter(Boolean);
  if (pool.length <= MISSION_COUNT) return pool.slice();

  // Prefer what you haven't spoken yet; once the list is exhausted, everything is fair game again.
  const fresh = pool.filter((s) => !spokenAlready(spoken, s.id));
  const source = fresh.length >= MISSION_COUNT ? fresh : pool;

  const week = isoWeekKey(now);
  return source
    .map((scenario) => ({ scenario, key: hashSeed(`${week} ${scenario.id}`) }))
    .sort((a, b) => a.key - b.key)
    .slice(0, MISSION_COUNT)
    .map((entry) => entry.scenario);
}
