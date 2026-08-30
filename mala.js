// ==========================================
// DIGITAL JAP MALA (bead counter)
// ==========================================
let beads = parseInt(localStorage.getItem("mala_beads")) || 0;
let malas = parseInt(localStorage.getItem("mala_count")) || 0;

const bCountEl = document.getElementById("bCount");
const mCountEl = document.getElementById("mCount");
const mTextEl = document.getElementById("mText");
const mantraSelect = document.getElementById("mantraType");
const shankh = document.getElementById("shankh");

const MANTRAS = {
  "महामृत्युंजय": "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात्",
  "गायत्री मंत्र": "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्",
  "ॐ नमः शिवाय": "ॐ नमः शिवाय"
};

function updateMalaUI(){
  bCountEl.innerText = beads;
  mCountEl.innerText = malas;
  localStorage.setItem("mala_beads", beads);
  localStorage.setItem("mala_count", malas);
}

function updateMantraPreview(){
  const val = mantraSelect.value;
  if (MANTRAS[val]){
    mTextEl.innerText = MANTRAS[val];
    mTextEl.style.display = "block";
  } else {
    mTextEl.style.display = "none";
  }
}

document.getElementById("japBtn").addEventListener("click", () => {
  beads++;
  if (beads >= 108){
    beads = 0;
    malas++;
    shankh?.play().catch(()=>{});
    if (navigator.vibrate) navigator.vibrate([100,50,100]);
  } else {
    if (navigator.vibrate) navigator.vibrate(35);
  }
  updateMalaUI();
});

document.getElementById("resetJapBtn").addEventListener("click", () => {
  if (confirm("क्या आप गिनती शून्य करना चाहते हैं?")){
    beads = 0; malas = 0;
    updateMalaUI();
  }
});

mantraSelect.addEventListener("change", updateMantraPreview);

updateMalaUI();
updateMantraPreview();

