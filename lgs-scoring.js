(() => {
  'use strict';

  const STATE_KEY = 'lgsArenaPwaV02';
  const SUBJECTS = {
    'Türkçe': { officialQuestions: 20, coefficient: 4, label: 'Türkçe' },
    'Matematik': { officialQuestions: 20, coefficient: 4, label: 'Matematik' },
    'Fen Bilimleri': { officialQuestions: 20, coefficient: 4, label: 'Fen' },
    'İnkılap Tarihi': { officialQuestions: 10, coefficient: 1, label: 'İnkılap' },
    'Din Kültürü': { officialQuestions: 10, coefficient: 1, label: 'Din' }
  };

  function readState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); }
    catch { return {}; }
  }

  function trNumber(value, digits = 1) {
    return Number(value || 0).toLocaleString('tr-TR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function normalizeSubjectName(name = '') {
    if (SUBJECTS[name]) return name;
    if (/inkılap/i.test(name)) return 'İnkılap Tarihi';
    if (/din/i.test(name)) return 'Din Kültürü';
    if (/fen/i.test(name)) return 'Fen Bilimleri';
    if (/mat/i.test(name)) return 'Matematik';
    if (/türk/i.test(name)) return 'Türkçe';
    return name;
  }

  function latestExamRows() {
    const resultPage = document.getElementById('resultPage');
    if (!resultPage?.classList.contains('active')) return [];
    const mode = document.getElementById('quizModeLabel')?.textContent?.trim();
    if (mode !== 'DENEME') return [];

    const total = Math.max(0, parseInt(document.getElementById('resultTotal')?.textContent || '0', 10) || 0);
    const state = readState();
    const history = Array.isArray(state.history) ? state.history : [];
    return total ? history.slice(-Math.min(total, history.length)) : [];
  }

  function calculate(rows) {
    const bySubject = {};
    rows.forEach(row => {
      const subject = normalizeSubjectName(row.subject);
      if (!SUBJECTS[subject]) return;
      bySubject[subject] ||= { asked: 0, correct: 0, wrong: 0, blank: 0 };
      const stat = bySubject[subject];
      stat.asked++;
      if (row.assisted || row.selected === null || row.selected === undefined) stat.blank++;
      else if (row.correct) stat.correct++;
      else stat.wrong++;
    });

    let weightedEarned = 0;
    let weightedMaximum = 0;
    let projectedNet = 0;
    let projectedQuestions = 0;
    const details = [];

    Object.entries(SUBJECTS).forEach(([name, cfg]) => {
      const stat = bySubject[name];
      if (!stat?.asked) return;
      const rawNet = stat.correct - stat.wrong / 3;
      const projectedSubjectNet = rawNet / stat.asked * cfg.officialQuestions;
      const ratio = projectedSubjectNet / cfg.officialQuestions;
      weightedEarned += projectedSubjectNet * cfg.coefficient;
      weightedMaximum += cfg.officialQuestions * cfg.coefficient;
      projectedNet += projectedSubjectNet;
      projectedQuestions += cfg.officialQuestions;
      details.push({ name, label: cfg.label, asked: stat.asked, correct: stat.correct, wrong: stat.wrong, blank: stat.blank, rawNet, projectedNet: projectedSubjectNet, ratio });
    });

    const weightedRatio = weightedMaximum ? weightedEarned / weightedMaximum : 0;
    const clampedRatio = Math.max(0, Math.min(1, weightedRatio));
    const estimatedScore = 100 + 400 * clampedRatio;
    const fullExamEquivalentNet = projectedQuestions
      ? Math.max(0, Math.min(90, projectedNet / projectedQuestions * 90))
      : 0;

    return { estimatedScore, weightedPercent: clampedRatio * 100, fullExamEquivalentNet, details, questionCount: rows.length };
  }

  function ensureCard() {
    const page = document.getElementById('resultPage');
    if (!page) return null;
    let card = document.getElementById('lgsEstimatedScoreCard');
    if (card) return card;

    card = document.createElement('section');
    card.id = 'lgsEstimatedScoreCard';
    card.className = 'lgs-estimated-score-card hidden';
    card.innerHTML = `
      <div class="lgs-score-main">
        <div><span>LGS ARENA TAHMİNİ PUAN</span><b id="lgsEstimatedScore">100,0</b><small>/ 500</small></div>
        <div class="lgs-score-badge" id="lgsScoreProjectionLabel">TAM SINAV KARŞILIĞI</div>
      </div>
      <div class="lgs-score-meta">
        <span><b id="lgsEquivalentNet">0,0</b> / 90 eşdeğer net</span>
        <span>Ağırlıklı başarı <b id="lgsWeightedPercent">%0,0</b></span>
      </div>
      <p>MEB’in 3 yanlış = 1 doğru ve 4-4-4-1-1 test ağırlıkları esas alınarak tam sınava ölçeklenen tahmini değerdir. Resmî LGS puanı değildir.</p>`;

    const actions = page.querySelector('.result-actions');
    if (actions) page.insertBefore(card, actions);
    else page.appendChild(card);
    return card;
  }

  function render() {
    const card = ensureCard();
    if (!card) return;
    const rows = latestExamRows();
    if (!rows.length) {
      card.classList.add('hidden');
      return;
    }

    const data = calculate(rows);
    document.getElementById('lgsEstimatedScore').textContent = trNumber(data.estimatedScore, 1);
    document.getElementById('lgsEquivalentNet').textContent = trNumber(data.fullExamEquivalentNet, 1);
    document.getElementById('lgsWeightedPercent').textContent = `%${trNumber(data.weightedPercent, 1)}`;
    document.getElementById('lgsScoreProjectionLabel').textContent = data.questionCount < 80 ? 'MİNİ → TAM SINAV' : 'TAM SINAV';
    card.classList.remove('hidden');
  }

  function init() {
    ensureCard();
    const page = document.getElementById('resultPage');
    if (!page) return;

    const observer = new MutationObserver(() => window.requestAnimationFrame(render));
    observer.observe(page, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    ['resultCorrect', 'resultTotal', 'rWrong', 'rBlank'].forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el, { subtree: true, childList: true, characterData: true });
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.LgsArenaScoring = { calculate, render };
})();