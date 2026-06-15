// Dados carregados dos JSONs
let PERGUNTAS = [];
let PREMIOS = [];
let CURSOS = [];

// INIT â€” carrega os JSONs e inicializa tudo
Promise.all([
    fetch('quiz.json').then(r => r.json()),
    fetch('premios.json').then(r => r.json()),
    fetch('cursos.json').then(r => r.json())
]).then(([quiz, premios, cursos]) => {
    PERGUNTAS = quiz;
    PREMIOS = premios;
    CURSOS = cursos;
    renderCursos();   // Gera os cards da seÃ§Ã£o #cursos a partir de cursos.json
    populateSelect(); // Popula o <select> do formulÃ¡rio a partir de cursos.json
    initRaspa();
    renderLeads();
});

// SCROLL ANIMATIONS
const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
}, { threshold: .1 });
document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

// â”€â”€â”€ TABS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function switchTab(t) {
    ['quiz', 'raspa', 'form'].forEach((n, i) => {
        document.querySelectorAll('.app-tab')[i].classList.toggle('active', n === t);
        document.getElementById('panel-' + n).classList.toggle('active', n === t);
    });
}

// â”€â”€â”€ CURSOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Mapeia o id do curso para a classe CSS de cor da barra superior
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

    // Registra os cards gerados no observer de animaÃ§Ã£o scroll
    grid.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}

function populateSelect() {
    const sel = document.getElementById('f-curso');
    if (!sel) return;
    CURSOS.forEach(c => {
        const opt = document.createElement('option');
        opt.value = `TÃ©cnico em ${c.nome}`;
        opt.textContent = `TÃ©cnico em ${c.nome}`;
        sel.appendChild(opt);
    });
}

// â”€â”€â”€ QUIZ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    document.getElementById('result-course').textContent = 'TÃ©cnico em ' + curso;
    document.getElementById('result-text').textContent = descricao;
    showScreen('quiz-result');
}

function resetQuiz() { localStorage.removeItem('know_quiz'); showScreen('quiz-welcome'); }

function showScreen(id) {
    document.querySelectorAll('.quiz-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

 
// â”€â”€â”€â”€â”€â”€â”€â”€â”€ RASPADINHA LOTERIA â”€â”€â”€â”€â”€â”€â”€â”€â”€

let raspaCanvas;
let ctxRaspa;
let raspando = false;
let terminouRaspa = false;
let premio = null;
let simbolos = [];
const RASPA_ULTIMA_DATA_KEY = "know_raspa_ultima_data";

const premiosRaspa = [
    { emoji: "👕", nome: "Camiseta Exclusiva KNOW", sub: "Você ganhou uma camiseta oficial!" },
    { emoji: "🖊️", nome: "Caneta + Bloco Ecológico", sub: "Kit personalizado KNOW!" },
    { emoji: "🎓", nome: "Isenção da Taxa de Matrícula", sub: "Sua matrícula ficou grátis!" },
    { emoji: "💰", nome: "10% de desconto", sub: "Na primeira mensalidade!" },
    { emoji: "🎟️", nome: "Ingresso VIP Feira Tech", sub: "Entrada exclusiva!" }
];

const simbolosExtras = ["🍀", "⭐", "💎", "🍒", "🔔", "🍋", "🍉", "7️⃣", "🔥", "⚡", "🎲", "🏆"];

function initRaspa() {
    const area = document.getElementById("raspa-premio-bg");
    const grid = document.getElementById("lottery-grid");
    const strip = document.getElementById("lottery-prize-strip");
    const msg = document.getElementById("raspa-msg");
    const fill = document.getElementById("raspa-prog-fill");
    const label = document.getElementById("raspa-prog-label");

    if (!area || !grid) return;

    if (jaRaspouHoje()) {
        terminouRaspa = true;
        raspando = false;
        grid.innerHTML = "";
        strip.innerHTML = `<span>Limite diário</span><strong>Volte amanhã</strong>`;
        msg.innerHTML = "Você já raspou sua cartela de hoje. Tente novamente amanhã!";
        msg.style.display = "block";
        msg.classList.remove("win");
        fill.style.width = "100%";
        label.textContent = "Limite diário usado";

        raspaCanvas = document.getElementById("raspa-canvas");
        if (raspaCanvas) raspaCanvas.style.display = "none";
        return;
    }

    terminouRaspa = false;
    raspando = false;
    premio = null;
    msg.innerHTML = "";
    msg.style.display = "none";
    msg.classList.remove("win");
    fill.style.width = "0%";
    label.textContent = "0% raspado";

    criarCartela();

    raspaCanvas = document.getElementById("raspa-canvas");
    const rect = area.getBoundingClientRect();
    raspaCanvas.width = Math.max(1, Math.round(rect.width));
    raspaCanvas.height = Math.max(1, Math.round(rect.height));
    raspaCanvas.style.display = "block";

    ctxRaspa = raspaCanvas.getContext("2d");
    desenharCobertura();

    raspaCanvas.onpointerdown = e => {
        raspando = true;
        raspaCanvas.setPointerCapture(e.pointerId);
        raspar(e);
    };
    raspaCanvas.onpointermove = e => {
        if (raspando) raspar(e);
    };
    raspaCanvas.onpointerup = () => raspando = false;
    raspaCanvas.onpointercancel = () => raspando = false;
}

function criarCartela() {
    const grid = document.getElementById("lottery-grid");
    const strip = document.getElementById("lottery-prize-strip");
    const ganhou = Math.random() < 0.5;

    premio = premiosRaspa[Math.floor(Math.random() * premiosRaspa.length)];
    strip.innerHTML = `<span>Prêmio alvo</span><strong>${premio.emoji} ${premio.nome}</strong>`;

    simbolos = ganhou ? criarCartelaPremiada(premio.emoji) : criarCartelaPerdedora();
    simbolos = embaralhar(simbolos);

    grid.innerHTML = simbolos.map(s => `<div class="lottery-cell-symbol">${s}</div>`).join("");
    if (!ganhou) premio = null;
}

function criarCartelaPremiada(emojiPremio) {
    const base = [emojiPremio, emojiPremio, emojiPremio];
    const extras = simbolosExtras.filter(s => s !== emojiPremio);
    while (base.length < 9) {
        const s = extras[Math.floor(Math.random() * extras.length)];
        if (base.filter(v => v === s).length < 2) base.push(s);
    }
    return base;
}

function criarCartelaPerdedora() {
    const todos = premiosRaspa.map(p => p.emoji).concat(simbolosExtras);
    const base = [];
    while (base.length < 9) {
        const s = todos[Math.floor(Math.random() * todos.length)];
        if (base.filter(v => v === s).length < 2) base.push(s);
    }
    return base;
}

function embaralhar(lista) {
    return [...lista].sort(() => Math.random() - 0.5);
}

function dataRaspaHoje() {
    return new Date().toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

function jaRaspouHoje() {
    return localStorage.getItem(RASPA_ULTIMA_DATA_KEY) === dataRaspaHoje();
}

function desenharCobertura() {
    const grad = ctxRaspa.createLinearGradient(0, 0, raspaCanvas.width, raspaCanvas.height);
    grad.addColorStop(0, "#f6f6f6");
    grad.addColorStop(0.45, "#9d9d9d");
    grad.addColorStop(1, "#dedede");
    ctxRaspa.globalCompositeOperation = "source-over";
    ctxRaspa.fillStyle = grad;
    ctxRaspa.fillRect(0, 0, raspaCanvas.width, raspaCanvas.height);

    ctxRaspa.fillStyle = "rgba(255,255,255,.22)";
    for (let i = 0; i < 700; i++) {
        ctxRaspa.fillRect(Math.random() * raspaCanvas.width, Math.random() * raspaCanvas.height, 1, 1);
    }

    ctxRaspa.fillStyle = "#222";
    ctxRaspa.font = "700 24px Arial";
    ctxRaspa.textAlign = "center";
    ctxRaspa.fillText("SCRATCH TO WIN", raspaCanvas.width / 2, raspaCanvas.height / 2 - 6);
    ctxRaspa.font = "700 14px Arial";
    ctxRaspa.fillText("RASPE AQUI", raspaCanvas.width / 2, raspaCanvas.height / 2 + 22);
}

function raspar(e) {
    if (terminouRaspa) return;

    const rect = raspaCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (raspaCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (raspaCanvas.height / rect.height);

    ctxRaspa.globalCompositeOperation = "destination-out";
    ctxRaspa.beginPath();
    ctxRaspa.arc(x, y, 34, 0, Math.PI * 2);
    ctxRaspa.fill();
    verificarArea();
}

function verificarArea() {
    const img = ctxRaspa.getImageData(0, 0, raspaCanvas.width, raspaCanvas.height);
    let apagados = 0;

    for (let i = 3; i < img.data.length; i += 4) {
        if (img.data[i] === 0) apagados++;
    }

    const porcentagem = apagados / (raspaCanvas.width * raspaCanvas.height) * 100;
    document.getElementById("raspa-prog-fill").style.width = Math.min(100, porcentagem) + "%";
    document.getElementById("raspa-prog-label").textContent = Math.round(porcentagem) + "% raspado";

    if (porcentagem > 45) finalizarRaspa();
}

function finalizarRaspa() {
    terminouRaspa = true;
    localStorage.setItem(RASPA_ULTIMA_DATA_KEY, dataRaspaHoje());
    raspaCanvas.style.display = "none";
    document.getElementById("raspa-prog-fill").style.width = "100%";
    document.getElementById("raspa-prog-label").textContent = "100% revelado";

    document.querySelectorAll(".lottery-cell-symbol").forEach(el => el.classList.add("revealed"));

    const msg = document.getElementById("raspa-msg");
    if (premio && simbolos.filter(s => s === premio.emoji).length === 3) {
        msg.innerHTML = `🎉 PARABÉNS!<br>${premio.emoji} ${premio.nome}<br>${premio.sub}`;
        msg.classList.add("win");
    } else {
        msg.innerHTML = `Não foi dessa vez!<br>Esta cartela não tem três símbolos iguais do prêmio.`;
        msg.classList.remove("win");
    }
    msg.style.display = "block";
}
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
    if (!leads.length) { cont.innerHTML = '<div class="admin-empty">Nenhum cadastro ainda. Os dados aparecerÃ£o aqui apÃ³s envio do formulÃ¡rio.</div>'; cnt.textContent = ''; return; }
    cnt.textContent = leads.length + ' cadastro(s) registrado(s)';
    let h = '<div style="overflow-x:auto"><table class="leads-table"><thead><tr><th>Nome</th><th>Idade</th><th>Curso</th><th>Data</th></tr></thead><tbody>';
    leads.forEach(l => { h += `<tr><td><strong>${l.nome}</strong><br><small style="color:var(--cinza-claro)">${l.email}</small></td><td>${l.idade}</td><td>${l.curso}</td><td>${l.data}</td></tr>`; });
    h += '</tbody></table></div>'; cont.innerHTML = h;
}

function clearLeads() {
    if (confirm('Tem certeza que deseja apagar todos os cadastros?')) { localStorage.removeItem('know_leads'); renderLeads(); }
}
