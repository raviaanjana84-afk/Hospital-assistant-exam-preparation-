// ==========================================
// QUIZ — dharmik gyaan
// ==========================================
const QUIZ_QUESTIONS = [
  { q: "भगवद्गीता में कुल कितने अध्याय हैं?", options: ["16", "18", "20", "24"], correct: 1 },
  { q: "हनुमान जी के पिता का नाम क्या है?", options: ["सूर्य देव", "पवन देव", "इंद्र देव", "वरुण देव"], correct: 1 },
  { q: "कुंभ मेला कितने वर्षों में एक बार लगता है?", options: ["6 वर्ष", "10 वर्ष", "12 वर्ष", "16 वर्ष"], correct: 2 },
  { q: "गायत्री मंत्र किस देवता को समर्पित है?", options: ["सूर्य देव (सावित्री)", "शिव जी", "विष्णु जी", "इंद्र देव"], correct: 0 },
  { q: "शिव जी के डमरू को क्या कहा जाता है?", options: ["शंख", "डमरू", "त्रिशूल", "नंदी"], correct: 1 },
  { q: "रामायण के रचयिता कौन हैं?", options: ["वेद व्यास", "वाल्मीकि", "तुलसीदास", "कालिदास"], correct: 1 },
  { q: "किस नदी को गंगा की सहायक नदी माना जाता है?", options: ["नर्मदा", "यमुना", "कावेरी", "गोदावरी"], correct: 1 },
  { q: "महाभारत के रचयिता कौन हैं?", options: ["वाल्मीकि", "वेद व्यास", "तुलसीदास", "सूरदास"], correct: 1 }
];

window.renderQuizMenu = () => {
  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-scroll"></i> धार्मिक ज्ञान क्विज</h2>
    <p style="color:var(--ink-soft); font-size:14px; margin-bottom:20px;">
      ${QUIZ_QUESTIONS.length} प्रश्नों की परीक्षा। अपना ज्ञान परखें!
    </p>
    <button class="btn-primary" id="startQuizBtn"><i class="fa-solid fa-play"></i> क्विज शुरू करें</button>
  `);
  document.getElementById("startQuizBtn").addEventListener("click", () => runQuiz(0, 0));
};

function runQuiz(index, score){
  if (index >= QUIZ_QUESTIONS.length){
    showQuizResult(score);
    return;
  }
  const q = QUIZ_QUESTIONS[index];
  const optionsHtml = q.options.map((opt, i) =>
    `<button class="quiz-option" data-i="${i}">${opt}</button>`
  ).join("");

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-scroll"></i> प्रश्न ${index + 1} / ${QUIZ_QUESTIONS.length}</h2>
    <p style="font-size:16px; font-weight:600; margin-bottom:18px;">${q.q}</p>
    <div id="quizOptions">${optionsHtml}</div>
  `);

  document.querySelectorAll("#quizOptions .quiz-option").forEach(btn => {
    btn.addEventListener("click", () => {
      const chosen = parseInt(btn.dataset.i);
      const isCorrect = chosen === q.correct;
      document.querySelectorAll("#quizOptions .quiz-option").forEach((b, i) => {
        b.style.pointerEvents = "none";
        if (i === q.correct) b.classList.add("correct");
        else if (i === chosen) b.classList.add("wrong");
      });
      setTimeout(() => runQuiz(index + 1, score + (isCorrect ? 1 : 0)), 900);
    });
  });
}

function showQuizResult(score){
  const total = QUIZ_QUESTIONS.length;
  const pct = Math.round((score / total) * 100);
  let msg = "बहुत अच्छा! 🙏";
  if (pct < 40) msg = "और अभ्यास करें 📖";
  else if (pct < 70) msg = "अच्छा प्रयास! 👍";

  window.showOverlay(`
    <div class="empty-state">
      <i class="fa-solid fa-trophy" style="color:var(--gold);"></i>
      <h3 style="font-family:var(--font-display); color:var(--maroon); margin:0 0 8px; font-size:22px;">${score} / ${total}</h3>
      <p style="margin:0 0 20px;">${msg}</p>
      <button class="btn-primary" id="retryQuizBtn">दोबारा खेलें</button>
    </div>
  `);
  document.getElementById("retryQuizBtn").addEventListener("click", () => runQuiz(0, 0));
}

