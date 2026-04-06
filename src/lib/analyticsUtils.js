import { format, startOfWeek, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MODULE_LABELS = {
  abdominal_regions: 'Regiões Abdominais',
  auscultation_pulmonar: 'Ausculta Pulmonar',
  auscultation_cardiaca: 'Ausculta Cardíaca',
  cardiac_foci: 'Focos Cardíacos',
};

export const MODULE_COLORS = {
  abdominal_regions: '#0d9488',
  auscultation_pulmonar: '#6366f1',
  auscultation_cardiaca: '#f43f5e',
  cardiac_foci: '#f97316',
};

export const ALL_MODULES = Object.keys(MODULE_LABELS);

// Group progress records by user
export function groupProgressByUser(progressData, users) {
  const userMap = {};
  users.forEach(u => {
    userMap[u.email] = { ...u, records: [] };
  });

  progressData.forEach(p => {
    const email = p.created_by;
    if (!userMap[email]) {
      userMap[email] = { email, full_name: email, role: 'user', records: [] };
    }
    userMap[email].records.push(p);
  });

  return Object.values(userMap);
}

// Aggregate stats for a set of records
export function aggregateStats(records) {
  const total = records.length;
  const totalTime = records.reduce((s, r) => s + (r.completion_time || 0), 0);
  const totalScore = records.reduce((s, r) => s + (r.score || 0), 0);
  const avgAccuracy = total > 0
    ? Math.round(records.reduce((s, r) => s + (r.accuracy || 0), 0) / total)
    : 0;

  return { total, totalTime, totalScore, avgAccuracy };
}

// Per-module stats for a user's records
export function statsByModule(records) {
  return ALL_MODULES.map(mod => {
    const modRecords = records.filter(r => r.game_type === mod);
    const stats = aggregateStats(modRecords);
    return {
      module: mod,
      label: MODULE_LABELS[mod],
      color: MODULE_COLORS[mod],
      ...stats,
    };
  });
}

// Weekly aggregation for line chart
export function weeklyStats(records) {
  const weeks = {};
  records.forEach(r => {
    if (!r.created_date) return;
    const date = typeof r.created_date === 'string' ? parseISO(r.created_date) : new Date(r.created_date);
    if (!isValid(date)) return;
    const weekKey = format(startOfWeek(date, { locale: ptBR }), 'dd/MM', { locale: ptBR });
    if (!weeks[weekKey]) weeks[weekKey] = { week: weekKey, acessos: 0, tempo: 0, pontuacao: 0 };
    weeks[weekKey].acessos += 1;
    weeks[weekKey].tempo += (r.completion_time || 0);
    weeks[weekKey].pontuacao += (r.score || 0);
  });
  return Object.values(weeks).sort((a, b) => {
    const [da, ma] = a.week.split('/').map(Number);
    const [db, mb] = b.week.split('/').map(Number);
    return ma !== mb ? ma - mb : da - db;
  });
}

export function formatTime(seconds) {
  if (!seconds) return '0min';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}min${s > 0 ? ` ${s}s` : ''}`;
}