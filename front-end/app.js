const N8N = 'http://localhost:5678';
const URL_RELATORIO  = `${N8N}/webhook/buscar-relatorio`;
const URL_RECX_CHAT  = `${N8N}/webhook/recx-chat`;
const URL_VALIDX     = `${N8N}/webhook/validx`;

// State
let relatorioCache  = null;
let selectedArea    = null;
let recxHistory     = [];
let validxHistory   = [];
let isSendingRecx   = false;
let isSendingValidx = false;
let notebook        = [];

// ── THEME ──
function initTheme() {
  const saved = localStorage.getItem('vs-theme') || 'dark';
  applyTheme(saved, false);
}

function applyTheme(theme, save = true) {
  document.documentElement.setAttribute('data-theme', theme);
  const pill = document.getElementById('theme-pill');
  if (pill) pill.classList.toggle('on', theme === 'light');
  const lbl = document.getElementById('theme-lbl');
  if (lbl) lbl.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '○' : '●';
  if (save) localStorage.setItem('vs-theme', theme);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

// ── NAV ──
function showPage(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  if (el) el.classList.add('active');
  if (page === 'archive') {
    if (relatorioCache) renderRelatorio(relatorioCache, 'archive-report');
    else buscarRelatorio('archive-report');
  }
  if (page === 'notebook') renderNotebook();
}

// ── TOAST ──
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── UTILS ──
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function md(text) {
  if (!text) return '<em style="color:var(--muted)">Não disponível.</em>';

  let html = text
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Section titles ##
  html = html.replace(/^## (.+)$/gm, (_, t) =>
    `<div class="md-section-title">${t}</div>`);

  // Numbered bold item titles **1. Título**
  html = html.replace(/^\*\*(\d+\..+?)\*\*$/gm, (_, t) =>
    `<div class="md-item-title">${t}</div>`);

  // Bold inline
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Key-value lines
  const kvKeys = 'Fonte|Data|Setor|Gatilho|Proposta de valor|Modelo de negócio|Barreira principal|Potencial|Evidências|Análise|Impacto Brasil|Horizonte|Contexto técnico|Por que importa|O que aconteceu|Area|Base|Descricao';
  html = html.replace(new RegExp(`^(${kvKeys}):\\s*(.+)$`, 'gm'),
    (_, key, val) =>
      `<div class="md-kv"><span class="md-kv-key">${key}</span><span class="md-kv-val">${val}</span></div>`);

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<div class="md-divider"></div>');

  // URLs to links
  html = html.replace(/(https?:\/\/[^\s<"]+)/g,
    '<a class="md-link" href="$1" target="_blank" rel="noopener">↗ Ver fonte</a>');

  // Paragraphs
  const blocks = html.split(/\n{2,}/);
  html = blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<div') || block.startsWith('<a')) return block;
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length === 0) return '';
    return `<p class="md-p">${lines.join('<br>')}</p>`;
  }).join('\n');

  return html;
}

// ── ANALYTICS ──
function renderAnalytics(raw, targetId) {
  let data;
  try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch(e) { return; }

  const tematicas = (data.tematicas || []).filter(t => t.contagem > 0).sort((a,b) => b.contagem - a.contagem);
  const ias = (data.ias_citadas || []).filter(i => i.contagem > 0).sort((a,b) => b.contagem - a.contagem);
  const maxTem = tematicas[0]?.contagem || 1;
  const maxIA  = ias[0]?.contagem || 1;
  const total  = data.total_noticias || 0;
  const tend   = data.tendencia_principal || '';

  const podiumHtml = tematicas.slice(0,3).map((t,i) => `
    <div class="podium-item">
      <div class="podium-rank">${['#1 — Primeiro','#2 — Segundo','#3 — Terceiro'][i]}</div>
      <div class="podium-name">${t.nome}</div>
      <div class="podium-count">${t.contagem} menções</div>
    </div>`).join('');

  const barHtml = tematicas.map(t => `
    <div class="bar-row">
      <div class="bar-row-top">
        <div class="bar-name">${t.nome}</div>
        <div class="bar-count">${t.contagem}</div>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(t.contagem/maxTem)*100}%"></div>
      </div>
      ${t.destaque ? `<div class="bar-insight">${t.destaque}</div>` : ''}
    </div>`).join('');

  const iaHtml = ias.length > 0
    ? ias.map(ia => `
      <div class="ia-row">
        <div class="ia-name">${ia.nome}</div>
        <div class="ia-track"><div class="ia-fill" style="width:${(ia.contagem/maxIA)*100}%"></div></div>
        <div class="ia-num">${ia.contagem}</div>
      </div>`).join('')
    : '<div class="ia-empty">Nenhuma IA identificada especificamente esta semana.</div>';

  document.getElementById(targetId).insertAdjacentHTML('beforeend', `
    <div class="analytics-header-row">
      <div class="analytics-title">O que está em alta</div>
      <div class="analytics-badge">${total} notícias analisadas</div>
    </div>
    ${tend ? `
    <div class="trend-callout">
      <div class="trend-icon">⚡</div>
      <div>
        <div class="trend-label">Trend Callout</div>
        <div class="trend-text">${tend}</div>
      </div>
    </div>` : ''}
    <div class="analytics-grid">
      <div class="an-card full">
        <div class="an-tag">Interesse por IA — ranking de temáticas</div>
        <div class="podium">${podiumHtml}</div>
      </div>
      <div class="an-card">
        <div class="an-tag">Distribuição completa</div>
        <div class="bar-list">${barHtml}</div>
      </div>
      <div class="an-card">
        <div class="an-tag">IAs mais mencionadas</div>
        <div class="ia-list">${iaHtml}</div>
      </div>
    </div>`);
}

// ── REPORT ──
function renderRelatorio(r, targetId) {
  document.getElementById(targetId).innerHTML = `
    <div class="section-header">
      <div class="section-title">Intelligence Chronicle</div>
      <div class="section-meta">Volume atual · ${fmtDate(r.criado_em)}</div>
    </div>
    <div class="report-grid">
      <div class="rcard full">
        <div class="rcard-tag">Notícias principais</div>
        <div class="rcard-body">${md(r.resumo)}</div>
      </div>
      <div class="rcard">
        <div class="rcard-tag">Tendências emergentes</div>
        <div class="rcard-body">${md(r.tendencias)}</div>
      </div>
      <div class="rcard">
        <div class="rcard-tag">Oportunidades de mercado</div>
        <div class="rcard-body">${md(r.oportunidades)}</div>
      </div>
    </div>`;
}

async function buscarRelatorio(target) {
  document.getElementById(target).innerHTML = `<div class="loader"><div class="loader-ring"></div><div class="loader-text">Syncing archive</div></div>`;
  try {
    const res = await fetch(URL_RELATORIO);
    const data = await res.json();
    const r = Array.isArray(data) ? data[0] : data;
    if (!r || !r.resumo) {
      document.getElementById(target).innerHTML = `<div class="msg-box"><h3>Archive empty</h3><p>Execute o Workflow 1 no n8n para gerar o primeiro relatório.</p></div>`;
      return;
    }
    relatorioCache = r;
    const el = document.getElementById('stat-data');
    if (el) el.textContent = fmtDate(r.criado_em).split(' de ')[0];
    renderRelatorio(r, target);
    if (r.analytics) renderAnalytics(r.analytics, target);
    showToast('Archive synced.');
    if (document.getElementById('hero-side')) updateHeroSide(r);
  } catch(e) {
    document.getElementById(target).innerHTML = `<div class="msg-box"><h3>Connection failed</h3><p>Verifique se o n8n está rodando na porta 5678 e os workflows estão publicados.</p><button class="btn btn-outline" style="margin:0 auto" onclick="buscarRelatorio('${target}')">Retry</button></div>`;
    showToast('Erro ao conectar com o n8n.', 'err');
  }
}

function updateHeroSide(r) {
  let data;
  try { data = typeof r.analytics === 'string' ? JSON.parse(r.analytics) : r.analytics; } catch(e) { return; }
  const tend = data?.tendencia_principal;
  const top = (data?.tematicas || []).sort((a,b) => b.contagem - a.contagem)[0];
  const side = document.getElementById('hero-side');
  if (!side || (!tend && !top)) return;
  side.innerHTML = `
    <div class="trend-pill">
      <div class="trend-pill-label">Trend Callout</div>
      <div class="trend-pill-title">${top ? 'Em alta: ' + top.nome : 'Tendência detectada'}</div>
      <div class="trend-pill-desc">${tend || top?.destaque || ''}</div>
    </div>
    <div class="trend-pill" style="border-color:rgba(255,215,0,0.15);background:rgba(255,215,0,0.04)">
      <div class="trend-pill-label" style="color:var(--secondary)">Archive Health</div>
      <div class="trend-pill-title">Fontes 100% ativas</div>
      <div class="trend-pill-desc">7 fontes monitoradas sem divergências.</div>
    </div>`;
}

// ── RECX CHAT ──
function selectArea(area, el) {
  document.querySelectorAll('.area-btn').forEach(a => a.classList.remove('sel'));
  el.classList.add('sel');
  selectedArea = area;
  recxHistory = [];
  renderRecxChat();
  document.getElementById('recx-input-area').style.display = 'flex';
  document.getElementById('recx-area-label').textContent = area;
  // Auto-send first message
  sendRecxMessage(`Quais são as principais oportunidades de negócio com IA na área de ${area}?`, true);
}

function renderRecxChat() {
  const thread = document.getElementById('recx-thread');
  if (!thread) return;

  if (recxHistory.length === 0) {
    thread.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-icon">✦</div>
        <h3>Selecione uma área ao lado</h3>
        <p>O RecX irá apresentar as oportunidades e você pode continuar conversando para explorar mais a fundo.</p>
      </div>`;
    return;
  }

  thread.innerHTML = recxHistory.map(msg => `
    <div class="chat-msg ${msg.role}">
      <div class="chat-av ${msg.role === 'user' ? 'user-av' : 'agent-av'}">
        ${msg.role === 'user' ? 'EU' : 'RX'}
      </div>
      <div class="chat-bubble">${md(msg.content)}</div>
    </div>`).join('');

  thread.scrollTop = thread.scrollHeight;
}

function showRecxTyping() {
  const thread = document.getElementById('recx-thread');
  const el = document.createElement('div');
  el.id = 'recx-typing';
  el.className = 'typing-wrap';
  el.innerHTML = `
    <div class="chat-av agent-av">RX</div>
    <div class="typing-bubble"><span></span><span></span><span></span></div>`;
  thread.appendChild(el);
  thread.scrollTop = thread.scrollHeight;
}

function hideRecxTyping() {
  const el = document.getElementById('recx-typing');
  if (el) el.remove();
}

async function sendRecxMessage(msgOverride, isAuto = false) {
  if (isSendingRecx) return;
  const input = document.getElementById('recx-input');
  const msg = msgOverride || (input ? input.value.trim() : '');
  if (!msg || !selectedArea) return;

  if (!isAuto && input) {
    input.value = '';
    input.style.height = 'auto';
  }

  recxHistory.push({ role: 'user', content: msg });
  renderRecxChat();
  showRecxTyping();
  isSendingRecx = true;

  const sendBtn = document.getElementById('recx-send-btn');
  if (sendBtn) sendBtn.disabled = true;

  try {
    const res = await fetch(URL_RECX_CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        area: selectedArea,
        mensagem: msg,
        historico: recxHistory.slice(-8)
      })
    });
    const data = await res.json();
    const texto = data?.text || data?.[0]?.text || data?.[0]?.json?.text || JSON.stringify(data);
    hideRecxTyping();
    recxHistory.push({ role: 'agent', content: texto });
    renderRecxChat();
    document.getElementById('btn-save-recx').style.display = 'inline-flex';
  } catch(e) {
    hideRecxTyping();
    recxHistory.push({ role: 'agent', content: 'Erro ao conectar com o RecX. Verifique se o Workflow 5 está publicado.' });
    renderRecxChat();
    showToast('Erro ao conectar com o RecX.', 'err');
  }

  isSendingRecx = false;
  if (sendBtn) sendBtn.disabled = false;
}

function clearRecxChat() {
  recxHistory = [];
  selectedArea = null;
  document.querySelectorAll('.area-btn').forEach(a => a.classList.remove('sel'));
  document.getElementById('recx-input-area').style.display = 'none';
  document.getElementById('btn-save-recx').style.display = 'none';
  renderRecxChat();
  showToast('Conversa encerrada.');
}

function saveRecxToNotebook() {
  if (recxHistory.length === 0) return;
  const entry = {
    id: Date.now(),
    tipo: 'RecX',
    area: selectedArea,
    titulo: `RecX — ${selectedArea}`,
    historico: [...recxHistory],
    anotacao: '',
    criado_em: new Date().toISOString()
  };
  notebook.unshift(entry);
  localStorage.setItem('vs-notebook', JSON.stringify(notebook));
  showToast('Conversa salva no Notebook!');
  document.getElementById('btn-save-recx').style.display = 'none';
}

// ── VALIDX CHAT ──
function renderValidxChat() {
  const thread = document.getElementById('validx-thread');
  if (!thread) return;

  if (validxHistory.length === 0) {
    thread.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-icon">💡</div>
        <h3>Outline your business concept</h3>
        <p>Descreva sua ideia e o ValidX irá analisá-la com base em dados reais do mercado.</p>
      </div>`;
    return;
  }

  thread.innerHTML = validxHistory.map(msg => `
    <div class="chat-msg ${msg.role}">
      <div class="chat-av ${msg.role === 'user' ? 'user-av' : 'agent-av'}">
        ${msg.role === 'user' ? 'EU' : 'VX'}
      </div>
      <div class="chat-bubble">${md(msg.content)}</div>
    </div>`).join('');

  thread.scrollTop = thread.scrollHeight;
}

function showValidxTyping() {
  const thread = document.getElementById('validx-thread');
  const el = document.createElement('div');
  el.id = 'validx-typing';
  el.className = 'typing-wrap';
  el.innerHTML = `
    <div class="chat-av agent-av">VX</div>
    <div class="typing-bubble"><span></span><span></span><span></span></div>`;
  thread.appendChild(el);
  thread.scrollTop = thread.scrollHeight;
}

function hideValidxTyping() {
  const el = document.getElementById('validx-typing');
  if (el) el.remove();
}

async function sendValidxMessage() {
  if (isSendingValidx) return;
  const input = document.getElementById('validx-input');
  const msg = input.value.trim();
  if (!msg) return;

  input.value = '';
  input.style.height = 'auto';
  validxHistory.push({ role: 'user', content: msg });
  renderValidxChat();
  showValidxTyping();
  isSendingValidx = true;
  document.getElementById('validx-send-btn').disabled = true;

  try {
    const res = await fetch(URL_VALIDX, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideia: msg, historico: validxHistory.slice(-6) })
    });
    const data = await res.json();
    const texto = data?.text || data?.[0]?.text || data?.[0]?.json?.text || JSON.stringify(data);
    hideValidxTyping();
    validxHistory.push({ role: 'agent', content: texto });
    renderValidxChat();
    document.getElementById('btn-save-validx').style.display = 'inline-flex';
    showToast('ValidX respondeu.');
  } catch(e) {
    hideValidxTyping();
    validxHistory.push({ role: 'agent', content: 'Erro ao conectar. Verifique se o Workflow 4 está publicado.' });
    renderValidxChat();
    showToast('Erro ao conectar com o ValidX.', 'err');
  }

  isSendingValidx = false;
  document.getElementById('validx-send-btn').disabled = false;
}

function clearValidxChat() {
  validxHistory = [];
  renderValidxChat();
  document.getElementById('btn-save-validx').style.display = 'none';
  showToast('Validation session cleared.');
}

function saveValidxToNotebook() {
  if (validxHistory.length === 0) return;
  const firstMsg = validxHistory.find(m => m.role === 'user')?.content || 'Ideia';
  const entry = {
    id: Date.now(),
    tipo: 'ValidX',
    area: null,
    titulo: `ValidX — ${firstMsg.slice(0, 50)}`,
    historico: [...validxHistory],
    anotacao: '',
    criado_em: new Date().toISOString()
  };
  notebook.unshift(entry);
  localStorage.setItem('vs-notebook', JSON.stringify(notebook));
  showToast('Validação salva no Notebook!');
  document.getElementById('btn-save-validx').style.display = 'none';
}

// ── NOTEBOOK ──
function loadNotebook() {
  try {
    const saved = localStorage.getItem('vs-notebook');
    notebook = saved ? JSON.parse(saved) : [];
  } catch(e) { notebook = []; }
}

function renderNotebook() {
  const container = document.getElementById('notebook-list');
  if (!container) return;

  if (notebook.length === 0) {
    container.innerHTML = `
      <div class="msg-box">
        <h3>Notebook vazio</h3>
        <p>Salve conversas do RecX e do ValidX para revisitar suas ideias depois.</p>
      </div>`;
    return;
  }

  container.innerHTML = notebook.map(entry => `
    <div class="nb-card" id="nb-${entry.id}">
      <div class="nb-card-header">
        <div class="nb-card-meta">
          <span class="nb-type nb-type-${entry.tipo.toLowerCase()}">${entry.tipo}</span>
          ${entry.area ? `<span class="nb-area">${entry.area}</span>` : ''}
        </div>
        <div class="nb-card-date">${fmtDateShort(entry.criado_em)}</div>
      </div>
      <div class="nb-card-title">${entry.titulo}</div>
      <div class="nb-card-preview">${entry.historico.slice(-2).map(m => `<div class="nb-msg nb-msg-${m.role}"><strong>${m.role === 'user' ? 'Você' : entry.tipo}:</strong> ${m.content.slice(0, 150)}${m.content.length > 150 ? '...' : ''}</div>`).join('')}</div>
      <div class="nb-annotation">
        <textarea
          class="nb-annotation-input"
          placeholder="Adicione suas anotações aqui..."
          onchange="saveAnnotation(${entry.id}, this.value)"
        >${entry.anotacao || ''}</textarea>
      </div>
      <div class="nb-card-actions">
        <button class="btn btn-ghost" onclick="deleteNotebookEntry(${entry.id})">Remover</button>
        <button class="btn btn-outline" onclick="expandEntry(${entry.id})">Ver conversa completa</button>
      </div>
      <div class="nb-full-chat" id="nb-full-${entry.id}" style="display:none">
        <div class="nb-full-divider"></div>
        ${entry.historico.map(m => `
          <div class="chat-msg ${m.role}" style="margin-bottom:12px">
            <div class="chat-av ${m.role === 'user' ? 'user-av' : 'agent-av'}" style="width:24px;height:24px;font-size:9px">
              ${m.role === 'user' ? 'EU' : entry.tipo.slice(0,2).toUpperCase()}
            </div>
            <div class="chat-bubble" style="font-size:12px">${md(m.content)}</div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

function saveAnnotation(id, value) {
  const entry = notebook.find(e => e.id === id);
  if (entry) {
    entry.anotacao = value;
    localStorage.setItem('vs-notebook', JSON.stringify(notebook));
  }
}

function deleteNotebookEntry(id) {
  notebook = notebook.filter(e => e.id !== id);
  localStorage.setItem('vs-notebook', JSON.stringify(notebook));
  renderNotebook();
  showToast('Entrada removida.');
}

function expandEntry(id) {
  const el = document.getElementById(`nb-full-${id}`);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function clearNotebook() {
  if (!confirm('Tem certeza que quer limpar todo o Notebook?')) return;
  notebook = [];
  localStorage.setItem('vs-notebook', JSON.stringify(notebook));
  renderNotebook();
  showToast('Notebook limpo.');
}


// ── NEWSLETTER ──
const URL_NEWSLETTER = `${N8N}/webhook/enviar-newsletter`;

async function cadastrarNewsletter() {
  const input = document.getElementById('newsletter-email');
  const btn = document.getElementById('newsletter-btn');
  const email = input.value.trim();

  if (!email || !email.includes('@')) {
    showToast('Digite um email válido.', 'err');
    input.focus();
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const res = await fetch(URL_NEWSLETTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      showToast('Relatório enviado! Verifique seu email.');
      input.value = '';
      btn.textContent = '✓ Cadastrado';
      btn.style.background = 'var(--surface3)';
      btn.style.color = 'var(--primary)';
    } else {
      throw new Error('Erro no envio');
    }
  } catch(e) {
    showToast('Erro ao enviar. Verifique se o Workflow 6 está publicado.', 'err');
    btn.disabled = false;
    btn.textContent = 'Receber agora';
  }
}

// ── TEXTAREA AUTO RESIZE ──
function initTextarea(id, sendFn) {
  const ta = document.getElementById(id);
  if (!ta) return;
  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
  });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFn(); }
  });
}

// ── INIT ──
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadNotebook();
  initTextarea('recx-input', sendRecxMessage);
  initTextarea('validx-input', sendValidxMessage);
  buscarRelatorio('dash-report');
  renderRecxChat();
  renderValidxChat();
});