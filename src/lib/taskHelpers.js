export const PEOPLE = ['Inês', 'Pedro', 'Miguel'];

export const COMPLETION_TYPES = {
  on_time_no_reminder: { label: 'A tempo + Sem lembrete', value: 1.00, emoji: '🌟', color: 'text-primary' },
  on_time_with_reminder: { label: 'A tempo (com 1 lembrete)', value: 0.50, emoji: '⏰', color: 'text-accent' },
  late: { label: 'Feita com atraso', value: 0.25, emoji: '⚠️', color: 'text-destructive' },
  not_done: { label: 'Não feita', value: 0, emoji: '❌', color: 'text-destructive' },
};

export const WEEKLY_BONUS = 4.00;

export const PENALTIES = {
  'Inês': 'Telemóvel/TV',
  'Pedro': 'Monitores',
  'Miguel': 'Carro',
};

export const PERSON_AVATARS = {
  'Inês': '👩',
  'Pedro': '🧒',
  'Miguel': '👨',
};

export const TASK_ICONS = {
  'Máquina da louça': '🫧',
  'Mesa almoço': '🥗',
  'Mesa pequeno-almoço': '☕',
  'Mesa jantar': '🍽️',
  'Apanhar e Dobrar roupa': '🧺',
  'Estender roupa': '👕',
  'Despejar lixo': '🗑️',
  'Meias (10x)': '🧦',
  'Higiene Sidney': '�',
  'Passear Sidney': '🦮',
  'Escovar Sidney': '🪮',
  'Limpeza mensal': '🧹',
  'Limpeza semanal': '🧽',
};

export const COMMON_TASKS = [
  'Máquina da louça',
  'Mesa almoço',
  'Mesa pequeno-almoço',
  'Mesa jantar',
  'Apanhar e Dobrar roupa',
  'Estender roupa',
  'Despejar lixo',
  'Meias (10x)',
  'Higiene Sidney',
  'Passear Sidney',
  'Escovar Sidney',
  'Limpeza mensal',
  'Limpeza semanal',
];

export function getTaskIcon(taskName) {
  return TASK_ICONS[taskName] || '✅';
}

export function getLocalDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ISO week number (1-53), weeks start on Monday
export function getWeekOfYear(date) {
  const d = new Date(date);
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);
  return Math.round((thursday - firstThursday) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

// Returns a unique key for a given week: "YYYY-WNN" e.g. "2026-W17"
// Uses ISO 8601 weeks (Monday–Sunday). Year is the ISO year (may differ from calendar year in early Jan/late Dec).
export function getWeekKey(date) {
  const d = new Date(date);
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const isoYear = thursday.getFullYear();
  const weekNum = getWeekOfYear(d);
  return `${isoYear}-W${String(weekNum).padStart(2, '0')}`;
}

export function getCurrentWeekKey() {
  return getWeekKey(new Date());
}

export function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Keep for backward compat
export function getWeekNumber(date) {
  return getWeekOfYear(date);
}

export function getCurrentWeekNumber() {
  return getWeekOfYear(new Date());
}

export function calculateEarnings(tasks) {
  return tasks.reduce((sum, t) => sum + (t.value || 0), 0);
}

export function getPersonTasks(tasks, person) {
  return tasks.filter(t => t.person === person);
}

export function getWeekTasks(tasks, weekKey) {
  return tasks.filter(t => t.week_key === weekKey);
}

export function getMonthTasks(tasks, monthKey) {
  return tasks.filter(t => t.date && t.date.startsWith(monthKey));
}

export function checkWeeklyBonus(tasks, person, weekKey) {
  const personWeekTasks = tasks.filter(t => t.person === person && t.week_key === weekKey);
  if (personWeekTasks.length === 0) return false;
  return personWeekTasks.every(t => t.completion_type === 'on_time_no_reminder');
}

export function countFailures(tasks, person) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  return tasks.filter(t =>
    t.person === person &&
    t.completion_type === 'not_done' &&
    new Date(t.date + 'T12:00:00') >= thirtyDaysAgo
  ).length;
}