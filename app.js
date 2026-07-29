const form = document.querySelector('#interviewForm');
const steps = [...document.querySelectorAll('.step')];
const prevBtn = document.querySelector('#prevBtn');
const nextBtn = document.querySelector('#nextBtn');
const submitBtn = document.querySelector('#submitBtn');
const stepLabel = document.querySelector('#stepLabel');
const progressPercent = document.querySelector('#progressPercent');
const progressBar = document.querySelector('#progressBar');
const liveStatus = document.querySelector('#liveStatus');
const formAlert = document.querySelector('#formAlert');
const successDialog = document.querySelector('#successDialog');
const successMessage = document.querySelector('#successMessage');
const qualityBox = document.querySelector('#qualityBox');
const newInterviewBtn = document.querySelector('#newInterviewBtn');
const closeDialog = document.querySelector('.dialog-close');
let current = 0;

const today = new Date().toISOString().slice(0, 10);
const dateInput = form.querySelector('[name="interviewDate"]');
if (dateInput && !dateInput.value) dateInput.value = today;

function setPressed(button, value) {
  button.setAttribute('aria-pressed', String(value));
}

document.querySelector('[data-toggle-contrast]')?.addEventListener('click', (event) => {
  document.body.classList.toggle('high-contrast');
  setPressed(event.currentTarget, document.body.classList.contains('high-contrast'));
});

document.querySelector('[data-toggle-motion]')?.addEventListener('click', (event) => {
  document.body.classList.toggle('reduce-motion');
  setPressed(event.currentTarget, document.body.classList.contains('reduce-motion'));
});

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.body.classList.add('reduce-motion');
  const btn = document.querySelector('[data-toggle-motion]');
  if (btn) setPressed(btn, true);
}

function updateStep(focusFirst = true) {
  steps.forEach((step, index) => {
    step.classList.toggle('active', index === current);
    step.toggleAttribute('hidden', index !== current);
  });
  const total = steps.length;
  const percent = Math.round(((current + 1) / total) * 100);
  stepLabel.textContent = `Etapa ${current + 1} de ${total}`;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
  prevBtn.disabled = current === 0;
  nextBtn.style.display = current === total - 1 ? 'none' : 'inline-flex';
  submitBtn.style.display = current === total - 1 ? 'inline-flex' : 'none';
  liveStatus.textContent = `Você está na etapa ${current + 1} de ${total}: ${steps[current].querySelector('legend')?.textContent || ''}`;
  formAlert.hidden = true;
  if (focusFirst) {
    const focusTarget = steps[current].querySelector('input, textarea, button');
    setTimeout(() => focusTarget?.focus(), 40);
  }
}

function visibleRequiredFields() {
  return [...steps[current].querySelectorAll('[required]')];
}

function validateCurrentStep() {
  const invalid = [];
  for (const field of visibleRequiredFields()) {
    const valid = field.type === 'checkbox' ? field.checked : field.value.trim().length > 0;
    field.setAttribute('aria-invalid', String(!valid));
    if (!valid) invalid.push(field);
  }
  if (invalid.length) {
    formAlert.hidden = false;
    formAlert.textContent = 'Preencha os campos obrigatórios desta etapa antes de continuar.';
    liveStatus.textContent = formAlert.textContent;
    invalid[0].focus();
    return false;
  }
  return true;
}

prevBtn.addEventListener('click', () => {
  if (current > 0) {
    current -= 1;
    updateStep();
  }
});

nextBtn.addEventListener('click', () => {
  if (!validateCurrentStep()) return;
  if (current < steps.length - 1) {
    current += 1;
    updateStep();
  }
});

form.addEventListener('input', (event) => {
  if (event.target.matches('[aria-invalid="true"]')) {
    const valid = event.target.type === 'checkbox' ? event.target.checked : event.target.value.trim().length > 0;
    if (valid) event.target.setAttribute('aria-invalid', 'false');
  }
});

function collectFormData() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.urgentPriorities = [...form.querySelectorAll('input[name="urgentPriorities"]:checked')].map((x) => x.value);
  data.accessibilityNeeds = [...form.querySelectorAll('input[name="accessibilityNeeds"]:checked')].map((x) => x.value);
  data.consent = Boolean(form.querySelector('input[name="consent"]')?.checked);
  return data;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Salvando...';
  formAlert.hidden = true;
  try {
    const result = window.VexStaticStore.saveInterview(collectFormData());
    successMessage.textContent = `ID da resposta: ${result.id}. Score de qualidade: ${result.qualityScore}/100.`;
    qualityBox.innerHTML = `
      <div><strong>Tags detectadas:</strong> ${result.tags.length ? result.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(' ') : 'nenhuma tag automática'}</div>
      <div><strong>Campos importantes faltantes:</strong> ${result.missingFields.length ? result.missingFields.map(escapeHtml).join(', ') : 'nenhum'}</div>
    `;
    successDialog.showModal();
    liveStatus.textContent = 'Entrevista salva com sucesso.';
  } catch (error) {
    formAlert.hidden = false;
    formAlert.textContent = error.message;
    liveStatus.textContent = error.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar entrevista';
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}

newInterviewBtn.addEventListener('click', () => {
  successDialog.close();
  form.reset();
  if (dateInput) dateInput.value = today;
  current = 0;
  updateStep();
});
closeDialog.addEventListener('click', () => successDialog.close());

updateStep(false);
