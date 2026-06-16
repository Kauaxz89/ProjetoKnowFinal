let PERGUNTAS = [];
let PREMIOS = [];
let CURSOS = [];

Promise.all([
    fetch('quiz.json').then(r => r.json()),
    fetch('premios.json').then(r => r.json()),
    fetch('cursos.json').then(r => r.json())
]).then(([quiz, premios, cursos]) => {
    PERGUNTAS = quiz;
    PREMIOS = premios;
    CURSOS = cursos;
    renderCursos();
    populateSelect();
    initRaspa();
    renderLeads();
});

const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
}, { threshold: .1 });
document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

function switchTab(t) {
    ['quiz', 'raspa', 'form'].forEach((n, i) => {
        document.querySelectorAll('.app-tab')[i].classList.toggle('active', n === t);
        document.getElementById('panel-' + n).classList.toggle('active', n === t);
    });
}

const CURSO_CLASS = { info: 'info', enf: 'enf', adm: 'adm' };

function renderCursos() {
    const grid = document.getElementById('cursos-grid');
    if (!grid) return;
    grid.innerHTML = CURSOS.map(c => `
        <div class="curso-card ${CURSO_CLASS[c.id] || ''} fade-in">
            <div class="curso-emoji">${c.emoji}</div>
            <div class="curso-nome">${c.nome}</div>
            <div class="curso-duracao">${c.duracao}</div>
            <div class="curso-desc">${c.descricao}</div>
            <div class="curso-tags">${c.tags.map(t => `<span class="curso-tag">${t}</span>`).join('')}</div>
        </div>
    `).join('');
    grid.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}

function populateSelect() {
    const sel = document.getElementById('f-curso');
    if (!sel) return;
    CURSOS.forEach(c => {
        const opt = document.createElement('option');
        opt.value = `Técnico em ${c.nome}`;
        opt.textContent = `Técnico em ${c.nome}`;
        sel.appendChild(opt);
    });
}

let pts = {}, qIdx = 0, sel = [];
const NUM_Q = 5;

function startQuiz() {
    const s = localStorage.getItem('know_quiz');
    if (s) { const r = JSON.parse(s); showResult(r.curso, r.emoji, r.descricao); return; }
    pts = {}; qIdx = 0;
    const idx = [];
    while (idx.length < NUM_Q) {
        const r = Math.floor(Math.random() * PERGUNTAS.length);
        if (!idx.includes(r)) idx.push(r);
    }
    sel = idx.map(i => PERGUNTAS[i]);
    showScreen('quiz-question');
    renderQ();
}

function renderQ() {
    const p = sel[qIdx];
    document.getElementById('quiz-bar').style.width = (qIdx / NUM_Q * 100) + '%';
    document.getElementById('quiz-prog-label').textContent = 'Pergunta ' + (qIdx + 1) + ' de ' + NUM_Q;
    document.getElementById('quiz-q-text').textContent = p.pergunta;
    const c = document.getElementById('quiz-opts'); c.innerHTML = '';
    p.opcoes.forEach(op => {
        const b = document.createElement('button');
        b.className = 'quiz-opt';
        b.innerHTML = '<span class="quiz-opt-letter">' + op.letra + '</span>' + op.texto;
        b.onclick = () => pick(op.curso);
        c.appendChild(b);
    });
}

function pick(curso) {
    pts[curso] = (pts[curso] || 0) + 1;
    qIdx++;
    if (qIdx >= NUM_Q) calcResult(); else renderQ();
}

function calcResult() {
    document.getElementById('quiz-bar').style.width = '100%';
    const vencedor = Object.entries(pts).sort((a, b) => b[1] - a[1])[0][0];
    const curso = CURSOS.find(c => c.nome === vencedor) || CURSOS[0];
    const resultado = { curso: curso.nome, emoji: curso.emoji, descricao: curso.descricao };
    localStorage.setItem('know_quiz', JSON.stringify(resultado));
    showResult(resultado.curso, resultado.emoji, resultado.descricao);
}

function showResult(curso, emoji, descricao) {
    document.getElementById('result-icon').textContent = emoji;
    document.getElementById('result-course').textContent = 'Técnico em ' + curso;
    document.getElementById('result-text').textContent = descricao;
    showScreen('quiz-result');
}

function resetQuiz() { localStorage.removeItem('know_quiz'); showScreen('quiz-welcome'); }

function showScreen(id) {
    document.querySelectorAll('.quiz-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

let raspando = false;
let terminouRaspa = false;
let premioGanho = null;
let celulaAtiva = null;
let celulasReveladas = 0;
let ctxCelulas = [];
let gridSimbolos = [];
const RASPA_ULTIMA_DATA_KEY = "know_raspa_ultima_data";

const premiosRaspa = [
    { emoji: "👕", nome: "Camiseta Exclusiva KNOW", sub: "Você ganhou uma camiseta oficial!" },
    { emoji: "🖊️", nome: "Caneta + Bloco Ecológico", sub: "Kit personalizado KNOW!" },
    { emoji: "🎓", nome: "Isenção da Taxa de Matrícula", sub: "Sua matrícula ficou grátis!" },
    { emoji: "💰", nome: "10% de desconto", sub: "Na primeira mensalidade!" },
    { emoji: "🎟️", nome: "Ingresso VIP Feira Tech", sub: "Entrada exclusiva!" }
];

const simbolosExtras = ["🍀", "⭐", "💎", "🍒", "🔔", "🍋", "7️⃣", "🔥", "⚡", "🏆"];

const RASPA_CHANCE_VITORIA = 0.18;

function initRaspa() {
    const msg = document.getElementById("raspa-msg");
    const fill = document.getElementById("raspa-prog-fill");
    const lbl = document.getElementById("raspa-prog-label");
    const grid = document.getElementById("lottery-grid");
    const strip = document.getElementById("lottery-prize-strip");
    if (!grid) return;
    terminouRaspa = false; raspando = false; premioGanho = null; celulaAtiva = null;
    celulasReveladas = 0; ctxCelulas = []; gridSimbolos = [];
    msg.innerHTML = ""; msg.style.display = "none"; msg.classList.remove("win");
    fill.style.width = "0%"; lbl.textContent = "0 de 9 revelados";
    const cvGlobal = document.getElementById("raspa-canvas");
    if (cvGlobal) cvGlobal.style.display = "none";
    if (jaRaspouHoje()) { _bloquearCartela(grid, strip, msg, fill, lbl); return; }
    _criarCartela(grid, strip);
}

function _criarCartela(grid, strip) {
    const ganhou = Math.random() < RASPA_CHANCE_VITORIA;
    const premio = premiosRaspa[Math.floor(Math.random() * premiosRaspa.length)];
    let tipoWin = null, indiceWin = -1;
    if (ganhou) { tipoWin = Math.random() < 0.5 ? "linha" : "coluna"; indiceWin = Math.floor(Math.random() * 3); }
    strip.innerHTML = `<span>Prêmio a revelar</span><strong>❓ Raspe para descobrir</strong>`;
    const matriz = [[null, null, null], [null, null, null], [null, null, null]];
    if (ganhou && tipoWin === "linha") { for (let c = 0; c < 3; c++) matriz[indiceWin][c] = premio.emoji; }
    if (ganhou && tipoWin === "coluna") { for (let l = 0; l < 3; l++) matriz[l][indiceWin] = premio.emoji; }
    for (let l = 0; l < 3; l++) { for (let c = 0; c < 3; c++) { if (matriz[l][c] !== null) continue; matriz[l][c] = _simboloSeguro(matriz, l, c, premio.emoji); } }
    gridSimbolos = matriz.flat();
    premioGanho = ganhou ? { ...premio, tipo: tipoWin, indice: indiceWin } : null;
    grid.innerHTML = matriz.map((_, li) => `
        <div class="lottery-row" id="lottery-row-${li}">
            ${[0, 1, 2].map(ci => { const idx = li * 3 + ci; return `<div class="lottery-cell-wrap" id="cell-wrap-${idx}"><canvas class="cell-canvas" id="cell-cv-${idx}"></canvas></div>`; }).join("")}
        </div>
    `).join("");
    requestAnimationFrame(() => {
        for (let idx = 0; idx < 9; idx++) {
            const wrap = document.getElementById(`cell-wrap-${idx}`);
            const cv = document.getElementById(`cell-cv-${idx}`);
            if (!wrap || !cv) continue;
            cv.width = wrap.offsetWidth; cv.height = wrap.offsetHeight;
            const ctx = cv.getContext("2d"); _desenharCelula(ctx, cv.width, cv.height);
            ctxCelulas[idx] = { ctx, cv, revelada: false };
            cv.addEventListener("pointerdown", e => _iniciarCelula(idx, e));
            cv.addEventListener("pointermove", e => { if (raspando && celulaAtiva === idx) _rasparCelula(idx, e); });
            cv.addEventListener("pointerup", () => { raspando = false; });
            cv.addEventListener("pointercancel", () => { raspando = false; });
        }
    });
}

function _simboloSeguro(matriz, l, c, emojiPremioSorteado) {
    const pool = simbolosExtras.concat(premiosRaspa.map(p => p.emoji));
    const candidatos = pool.filter(s => {
        const naLinha = matriz[l].filter((v, i) => i !== c && v === s).length;
        const naColuna = [0, 1, 2].filter(li => li !== l && matriz[li][c] === s).length;
        if (naLinha >= 2 || naColuna >= 2) return false;
        return true;
    });
    const escolhidos = candidatos.length ? candidatos : pool;
    return escolhidos[Math.floor(Math.random() * escolhidos.length)];
}

function _bloquearCartela(grid, strip, msg, fill, lbl) {
    terminouRaspa = true;
    grid.innerHTML = [0, 1, 2].map(() => `<div class="lottery-row">${[0, 1, 2].map(() => `<div class="lottery-cell-wrap lottery-cell-bloqueada">🔒</div>`).join("")}</div>`).join("");
    strip.innerHTML = `<span>Limite diário</span><strong>Volte amanhã 🗓️</strong>`;
    msg.innerHTML = "Você já participou hoje. Tente novamente amanhã!";
    msg.style.display = "block";
    fill.style.width = "100%";
    lbl.textContent = "Limite diário usado";
}

function _desenharCelula(ctx, w, h) {
    ctx.globalCompositeOperation = "source-over";
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#e0e0e0"); grad.addColorStop(0.5, "#b0b0b0"); grad.addColorStop(1, "#c8c8c8");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,.2)";
    for (let i = 0; i < 80; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
    ctx.fillStyle = "rgba(0,0,0,.07)";
    for (let i = 0; i < 50; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#555"; ctx.font = `bold ${Math.round(h * 0.5)}px Arial`; ctx.fillText("?", w / 2, h / 2);
}

function _iniciarCelula(idx, e) {
    const c = ctxCelulas[idx];
    if (!c || c.revelada || terminouRaspa) return;
    raspando = true; celulaAtiva = idx; c.cv.setPointerCapture(e.pointerId); _rasparCelula(idx, e);
}

function _rasparCelula(idx, e) {
    const c = ctxCelulas[idx];
    if (!c || c.revelada) return;
    const rect = c.cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (c.cv.width / rect.width);
    const y = (e.clientY - rect.top) * (c.cv.height / rect.height);
    c.ctx.globalCompositeOperation = "destination-out";
    c.ctx.beginPath(); c.ctx.arc(x, y, 22, 0, Math.PI * 2); c.ctx.fill();
    _verificarCelula(idx);
}

function _verificarCelula(idx) {
    const c = ctxCelulas[idx];
    const img = c.ctx.getImageData(0, 0, c.cv.width, c.cv.height);
    let transp = 0;
    for (let i = 3; i < img.data.length; i += 4) if (img.data[i] === 0) transp++;
    const pct = transp / (c.cv.width * c.cv.height) * 100;
    if (pct >= 55 && !c.revelada) {
        c.revelada = true; celulasReveladas++;
        c.ctx.globalCompositeOperation = "source-over"; c.ctx.clearRect(0, 0, c.cv.width, c.cv.height);
        const grad = c.ctx.createLinearGradient(0, 0, c.cv.width, c.cv.height);
        grad.addColorStop(0, "#fff8ee"); grad.addColorStop(1, "#ffe8b0");
        c.ctx.fillStyle = grad; c.ctx.fillRect(0, 0, c.cv.width, c.cv.height);
        c.ctx.textAlign = "center"; c.ctx.textBaseline = "middle";
        c.ctx.font = `${Math.round(c.cv.height * 0.52)}px Arial`;
        c.ctx.fillText(gridSimbolos[idx], c.cv.width / 2, c.cv.height / 2);
        c.ctx.globalCompositeOperation = "source-over";
        document.getElementById("raspa-prog-fill").style.width = (celulasReveladas / 9 * 100) + "%";
        document.getElementById("raspa-prog-label").textContent = `${celulasReveladas} de 9 revelados`;
        if (celulasReveladas === 9) _finalizarRaspa();
    }
}

function _finalizarRaspa() {
    if (terminouRaspa) return;
    terminouRaspa = true;
    localStorage.setItem(RASPA_ULTIMA_DATA_KEY, _dataHoje());
    document.getElementById("raspa-prog-fill").style.width = "100%";
    document.getElementById("raspa-prog-label").textContent = "Tudo revelado! 🎉";
    const strip = document.getElementById("lottery-prize-strip");
    const msg = document.getElementById("raspa-msg");
    if (premioGanho) {
        const indices = [];
        if (premioGanho.tipo === "linha") { for (let ci = 0; ci < 3; ci++) indices.push(premioGanho.indice * 3 + ci); }
        else { for (let li = 0; li < 3; li++) indices.push(li * 3 + premioGanho.indice); }
        indices.forEach(idx => {
            const c = ctxCelulas[idx];
            if (!c) return;
            c.ctx.globalCompositeOperation = "source-over";
            c.ctx.strokeStyle = "#f5c518"; c.ctx.lineWidth = 5;
            c.ctx.strokeRect(2, 2, c.cv.width - 4, c.cv.height - 4);
        });
        if (premioGanho.tipo === "linha") {
            const rowEl = document.getElementById(`lottery-row-${premioGanho.indice}`);
            if (rowEl) rowEl.classList.add("winner");
        } else {
            indices.forEach(idx => { const wrap = document.getElementById(`cell-wrap-${idx}`); if (wrap) wrap.classList.add("winner-col"); });
        }
        const descTipo = premioGanho.tipo === "linha" ? `Linha ${premioGanho.indice + 1}` : `Coluna ${premioGanho.indice + 1}`;
        strip.innerHTML = `<span>Prêmio alvo</span><strong>${premioGanho.emoji} ${premioGanho.nome}</strong>`;
        msg.innerHTML = `🎉 PARABÉNS! Você fez combinação na <strong>${descTipo}</strong>!<br>${premioGanho.emoji} <strong>${premioGanho.nome}</strong> — ${premioGanho.sub}<br><small style="opacity:.75;font-weight:400">Apresente esta tela na secretaria. Válido por 30 dias.</small>`;
        msg.classList.add("win");
    } else {
        strip.innerHTML = `<span>Prêmio alvo</span><strong>Sem combinação desta vez</strong>`;
        msg.innerHTML = `Não foi dessa vez! Nenhuma linha ou coluna com 3 iguais.<br><a href="#matricula" style="color:inherit;text-decoration:underline;font-size:.85rem">Conheça nossos cursos →</a>`;
        msg.classList.remove("win");
    }
    msg.style.display = "block";
}

function _dataHoje() { return new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }); }
function jaRaspouHoje() { return localStorage.getItem(RASPA_ULTIMA_DATA_KEY) === _dataHoje(); }
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function showErr(id, show) {
    document.getElementById('err-' + id).classList.toggle('show', show);
    document.getElementById('f-' + id).classList.toggle('error', show);
}

function submitForm() {
    const nome = document.getElementById('f-nome').value.trim();
    const idade = parseInt(document.getElementById('f-idade').value);
    const email = document.getElementById('f-email').value.trim();
    const curso = document.getElementById('f-curso').value;
    let ok = true;
    showErr('nome', !nome || nome.length < 3); if (!nome || nome.length < 3) ok = false;
    showErr('idade', isNaN(idade) || idade < 14 || idade > 80); if (isNaN(idade) || idade < 14 || idade > 80) ok = false;
    showErr('email', !validateEmail(email)); if (!validateEmail(email)) ok = false;
    showErr('curso', !curso); if (!curso) ok = false;
    if (!ok) return;
    const leads = JSON.parse(localStorage.getItem('know_leads') || '[]');
    leads.push({ nome, idade, email, curso, data: new Date().toLocaleDateString('pt-BR') });
    localStorage.setItem('know_leads', JSON.stringify(leads));
    document.getElementById('f-nome').value = ''; document.getElementById('f-idade').value = '';
    document.getElementById('f-email').value = ''; document.getElementById('f-curso').value = '';
    const s = document.getElementById('form-success'); s.classList.add('show');
    setTimeout(() => s.classList.remove('show'), 4000);
    renderLeads();
}

function renderLeads() {
    const leads = JSON.parse(localStorage.getItem('know_leads') || '[]');
    const cont = document.getElementById('leads-container');
    const cnt = document.getElementById('leads-count');
    if (!leads.length) { cont.innerHTML = '<div class="admin-empty">Nenhum cadastro ainda. Os dados aparecerão aqui após envio do formulário.</div>'; cnt.textContent = ''; return; }
    cnt.textContent = leads.length + ' cadastro(s) registrado(s)';
    let h = '<div style="overflow-x:auto"><table class="leads-table"><thead><tr><th>Nome</th><th>Idade</th><th>Curso</th><th>Data</th></tr></thead><tbody>';
    leads.forEach(l => { h += `<tr><td><strong>${l.nome}</strong><br><small style="color:var(--cinza-claro)">${l.email}</small></td><td>${l.idade}</td><td>${l.curso}</td><td>${l.data}</td></tr>`; });
    h += '</tbody></table></div>'; cont.innerHTML = h;
}

function clearLeads() {
    if (confirm('Tem certeza que deseja apagar todos os cadastros?')) { localStorage.removeItem('know_leads'); renderLeads(); }
}
