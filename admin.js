const statusEl = document.querySelector('#adminStatus');
const metricCards = document.querySelector('#metricCards');
const tagChart = document.querySelector('#tagChart');
const departmentChart = document.querySelector('#departmentChart');
const systemChart = document.querySelector('#systemChart');
const qualityChart = document.querySelector('#qualityChart');
const exportCsvBtn = document.querySelector('#exportCsvBtn');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}

function renderBars(target, entries, total, emptyText = 'Sem dados suficientes ainda.') {
  if (!entries || !entries.length) {
    target.innerHTML = `<p class="empty-state">${escapeHtml(emptyText)}</p>`;
    return;
  }
  const max = Math.max(...entries.map((entry) => entry.count), 1);
  target.innerHTML = entries.slice(0, 8).map(({ label, count }) => {
    const width = Math.max(6, Math.round((count / max) * 100));
    const percent = total ? Math.round((count / total) * 100) : 0;
    return `
      <div class="bar-row">
        <div class="bar-meta"><strong>${escapeHtml(label)}</strong><span>${count} · ${percent}%</span></div>
        <div class="bar-track" aria-label="${escapeHtml(label)}: ${count}"><span style="width:${width}%"></span></div>
      </div>
    `;
  }).join('');
}

function renderMetrics(data) {
  metricCards.innerHTML = [
    ['Entrevistas', data.total],
    ['Score médio', `${data.averageQuality}/100`],
    ['Temas detectados', data.uniqueTags],
    ['Setores mapeados', data.uniqueDepartments],
  ].map(([label, value]) => `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join('');
}

async function loadDashboard() {
  try {
    const result = window.VexStaticStore.buildDashboard();
    statusEl.textContent = `${result.total} entrevista(s) consideradas. Dados exibidos somente de forma agregada.`;
    renderMetrics(result);
    renderBars(tagChart, result.charts.tags, result.total, 'Nenhuma dor classificada ainda.');
    renderBars(departmentChart, result.charts.departments, result.total);
    renderBars(systemChart, result.charts.systems, result.total);
    renderBars(qualityChart, result.charts.quality, result.total);
  } catch (error) {
    statusEl.textContent = error.message;
  }
}

exportCsvBtn?.addEventListener('click', () => window.VexStaticStore.exportAggregateCsv());
loadDashboard();
