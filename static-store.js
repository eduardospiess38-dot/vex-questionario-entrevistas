const STORE_KEY = 'vex_interview_demo_responses_v1';

const importantFields = ['respondentName', 'department', 'role', 'systemName', 'usageFrequency', 'mainTasks', 'workflowSteps', 'confusingParts', 'firstChange'];
const fieldLabels = {
  respondentName: 'Nome da pessoa entrevistada',
  department: 'Setor / área',
  role: 'Cargo / função',
  systemName: 'Sistema avaliado',
  usageFrequency: 'Frequência de uso',
  mainTasks: 'Principais tarefas',
  workflowSteps: 'Passo a passo',
  confusingParts: 'Dificuldades',
  firstChange: 'Primeira melhoria sugerida',
  consent: 'Consentimento',
};

function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').replace(/[\t ]+/g, ' ').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function sentenceCaseLight(text) {
  const clean = normalizeText(text);
  if (!clean) return '';
  return clean.replace(/(^|[.!?]\s+)([a-záàâãéèêíóôõúç])/g, (m, sep, chr) => sep + chr.toUpperCase());
}

function splitKeywords(text) {
  const base = normalizeText(text).toLowerCase();
  const tags = new Set();
  const rules = [
    ['lentidão', /lento|lentid|trava|demora|carrega/],
    ['erro', /erro|bug|falha|quebra|não funciona|nao funciona/],
    ['retrabalho', /retrabalho|repetir|manual|duplicad|duas vezes/],
    ['relatório', /relat[oó]rio|filtro|exporta|consulta|dashboard/],
    ['usabilidade', /confuso|difícil|dificil|não acho|nao acho|perdido|complicado/],
    ['integração externa', /planilha|whatsapp|email|e-mail|mensagem|fora do sistema|api|integra|erp/],
    ['acessibilidade', /leitor de tela|contraste|fonte|teclado|cego|baixa visão|baixa visao|surdo/],
    ['regra de negócio', /regra|exceção|excecao|valida|aprova|aprovação|fechamento|condição|condicao/],
    ['permissão', /permiss[aã]o|perfil|administrador|gestor|somente|apenas|usu[aá]rio/],
    ['critério de sucesso', /melhorou|menos cliques|menos tempo|segundos|reduzir|economizar|sucesso|pronto|conclu[ií]do/],
  ];
  for (const [tag, regex] of rules) if (regex.test(base)) tags.add(tag);
  return [...tags];
}

function cleanPayload(input) {
  const cleaned = {};
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) cleaned[key] = value.map(normalizeText).filter(Boolean);
    else if (typeof value === 'boolean') cleaned[key] = value;
    else cleaned[key] = sentenceCaseLight(value);
  }
  const missing = importantFields.filter((field) => !normalizeText(cleaned[field])).map((field) => fieldLabels[field] || field);
  if (!cleaned.consent) missing.push(fieldLabels.consent);
  const joined = Object.values(cleaned).flat().join(' ');
  const tags = splitKeywords(joined);
  const answeredImportant = importantFields.length - missing.filter((x) => x !== fieldLabels.consent).length;
  const textDepth = Object.values(cleaned).filter((v) => typeof v === 'string' && v.length >= 25).length;
  const qualityScore = Math.min(100, Math.max(0, Math.round((answeredImportant / importantFields.length) * 70 + Math.min(textDepth, 10) * 3)));
  return { cleaned, missing, tags, qualityScore };
}

function loadResponses() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
}

function saveResponses(rows) { localStorage.setItem(STORE_KEY, JSON.stringify(rows)); }

function saveInterview(payload) {
  const { cleaned, missing, tags, qualityScore } = cleanPayload(payload);
  const now = new Date().toISOString();
  const id = `demo_${Math.random().toString(36).slice(2, 10)}`;
  const row = { id, created_at: now, department: cleaned.department, system_name: cleaned.systemName, quality_score: qualityScore, missing_fields: missing, tags, cleaned_payload: cleaned };
  const rows = loadResponses();
  rows.unshift(row);
  saveResponses(rows);
  return { ok: true, id, qualityScore, missingFields: missing, tags, createdAt: now };
}

function increment(map, key) {
  const safeKey = normalizeText(key) || 'Não informado';
  map.set(safeKey, (map.get(safeKey) || 0) + 1);
}
function topEntries(map) { return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 12); }

function buildDashboard() {
  const rows = loadResponses();
  const departments = new Map();
  const systems = new Map();
  const tags = new Map();
  const quality = new Map();
  let scoreSum = 0;
  for (const row of rows) {
    increment(departments, row.department);
    increment(systems, row.system_name);
    const score = Number(row.quality_score || 0);
    scoreSum += score;
    increment(quality, score >= 80 ? 'Alta qualidade' : score >= 50 ? 'Média qualidade' : 'Precisa revisar');
    for (const tag of row.tags || []) increment(tags, tag);
  }
  return {
    ok: true,
    total: rows.length,
    averageQuality: rows.length ? Math.round(scoreSum / rows.length) : 0,
    uniqueTags: tags.size,
    uniqueDepartments: departments.size,
    charts: { tags: topEntries(tags), departments: topEntries(departments), systems: topEntries(systems), quality: topEntries(quality) },
  };
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportAggregateCsv() {
  const data = buildDashboard();
  const rows = [];
  for (const [category, entries] of Object.entries(data.charts)) {
    for (const entry of entries) rows.push([category, entry.label, entry.count]);
  }
  const csv = '\ufeff' + [['categoria', 'item', 'quantidade'].join(';')].concat(rows.map((r) => r.map(csvEscape).join(';'))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dashboard-entrevistas-vex-demo-anonimo.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

window.VexStaticStore = { saveInterview, buildDashboard, exportAggregateCsv, loadResponses };
