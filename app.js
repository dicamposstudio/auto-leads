const state = {
  type: 'cars',
  vehicle: null,
};

const $ = (id) => document.getElementById(id);
const els = {
  form: $('fipe-form'),
  brand: $('brand'),
  model: $('model'),
  year: $('year'),
  consultBtn: $('consult-btn'),
  status: $('form-status'),
  resultSection: $('result-section'),
  resultVehicle: $('result-vehicle'),
  resultMeta: $('result-meta'),
  resultPrice: $('result-price'),
  resultReference: $('result-reference'),
  resultCode: $('result-code'),
  resultFuel: $('result-fuel'),
  startLead: $('start-lead'),
  leadCard: $('lead-card'),
  leadForm: $('lead-form'),
  leadPhone: $('lead-phone'),
};

const API_BASE = '/api/fipe';
// Troque pelo WhatsApp da loja antes da apresentação comercial.
// Apenas números: DDI + DDD + telefone. Ex.: 5581999999999
const DEALER_WHATSAPP = '5581999999999';

function setStatus(message = '', isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle('error', isError);
}

function setOptions(select, items, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>` + items
    .map(item => `<option value="${String(item.code).replace(/"/g, '&quot;')}">${item.name}</option>`)
    .join('');
  select.disabled = false;
}

function resetSelect(select, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  select.disabled = true;
}

async function api(path) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Falha na consulta (${response.status})`);
  }
  return response.json();
}

async function loadBrands() {
  setStatus('Carregando marcas...');
  els.consultBtn.disabled = true;
  resetSelect(els.model, 'Selecione a marca primeiro');
  resetSelect(els.year, 'Selecione o modelo primeiro');
  els.brand.disabled = true;
  els.brand.innerHTML = '<option value="">Carregando marcas...</option>';

  try {
    const brands = await api(`/${state.type}/brands`);
    setOptions(els.brand, brands, 'Selecione a marca');
    setStatus('');
  } catch (error) {
    els.brand.innerHTML = '<option value="">Não foi possível carregar</option>';
    setStatus(error.message, true);
  }
}

async function onBrandChange() {
  resetSelect(els.model, 'Carregando modelos...');
  resetSelect(els.year, 'Selecione o modelo primeiro');
  els.consultBtn.disabled = true;
  if (!els.brand.value) {
    resetSelect(els.model, 'Selecione a marca primeiro');
    return;
  }
  try {
    const models = await api(`/${state.type}/brands/${els.brand.value}/models`);
    setOptions(els.model, models, 'Selecione o modelo');
  } catch (error) {
    resetSelect(els.model, 'Não foi possível carregar');
    setStatus(error.message, true);
  }
}

async function onModelChange() {
  resetSelect(els.year, 'Carregando anos...');
  els.consultBtn.disabled = true;
  if (!els.model.value) {
    resetSelect(els.year, 'Selecione o modelo primeiro');
    return;
  }
  try {
    const years = await api(`/${state.type}/brands/${els.brand.value}/models/${els.model.value}/years`);
    setOptions(els.year, years, 'Selecione o ano');
  } catch (error) {
    resetSelect(els.year, 'Não foi possível carregar');
    setStatus(error.message, true);
  }
}

async function onSubmit(event) {
  event.preventDefault();
  if (!els.brand.value || !els.model.value || !els.year.value) return;

  els.consultBtn.disabled = true;
  els.consultBtn.querySelector('span').textContent = 'Consultando...';
  setStatus('Buscando valor de referência...');

  try {
    const vehicle = await api(`/${state.type}/brands/${els.brand.value}/models/${els.model.value}/years/${encodeURIComponent(els.year.value)}`);
    state.vehicle = vehicle;
    renderResult(vehicle);
    setStatus('');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    els.consultBtn.disabled = false;
    els.consultBtn.querySelector('span').textContent = 'Consultar valor FIPE';
  }
}

function renderResult(vehicle) {
  els.resultVehicle.textContent = `${vehicle.brand} ${vehicle.model}`;
  els.resultMeta.textContent = `${vehicle.modelYear || ''}${vehicle.fuel ? ` • ${vehicle.fuel}` : ''}`;
  els.resultPrice.textContent = vehicle.price || 'Preço indisponível';
  els.resultReference.textContent = `Referência: ${vehicle.referenceMonth || 'mês vigente'}`;
  els.resultCode.textContent = vehicle.codeFipe || '—';
  els.resultFuel.textContent = vehicle.fuel || '—';
  els.resultSection.classList.remove('hidden');
  els.leadCard.classList.add('hidden');
  els.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
}

function onLeadSubmit(event) {
  event.preventDefault();
  if (!state.vehicle) return;

  const name = $('lead-name').value.trim();
  const phone = $('lead-phone').value.trim();
  const km = $('lead-km').value;
  const intent = $('lead-intent').value;
  const finance = $('lead-finance').value;
  const v = state.vehicle;

  const message = [
    `Olá! Meu nome é ${name}. Fiz uma simulação de avaliação no site.`,
    '',
    `🚗 Veículo: ${v.brand} ${v.model}`,
    `📅 Ano: ${v.modelYear || '—'}`,
    `⛽ Combustível: ${v.fuel || '—'}`,
    `📊 Valor FIPE de referência: ${v.price || '—'}`,
    `🔢 Código FIPE: ${v.codeFipe || '—'}`,
    `🛣️ Quilometragem: ${km}`,
    `🔁 Interesse: ${intent}`,
    `💳 Situação: ${finance}`,
    `📱 Meu contato: ${phone}`,
    '',
    'Gostaria de receber uma avaliação comercial do veículo.'
  ].join('\n');

  const target = `https://wa.me/${DEALER_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(target, '_blank', 'noopener,noreferrer');
}

document.querySelectorAll('.type-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    state.type = button.dataset.type;
    state.vehicle = null;
    els.resultSection.classList.add('hidden');
    loadBrands();
  });
});

els.brand.addEventListener('change', onBrandChange);
els.model.addEventListener('change', onModelChange);
els.year.addEventListener('change', () => { els.consultBtn.disabled = !els.year.value; });
els.form.addEventListener('submit', onSubmit);
els.startLead.addEventListener('click', () => {
  els.leadCard.classList.remove('hidden');
  els.leadCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
els.leadPhone.addEventListener('input', (event) => { event.target.value = formatPhone(event.target.value); });
els.leadForm.addEventListener('submit', onLeadSubmit);

loadBrands();
