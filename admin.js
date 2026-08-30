// ==========================================
// ADMIN PANEL — bookings + daily content management
// ==========================================
import { db } from "./config.js";
import { collection, getDocs, query, orderBy, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.renderAdminPanel = () => {
  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-shield-halved"></i> एडमिन पैनल</h2>
    <div style="display:flex; gap:10px; margin-bottom:18px;">
      <button class="btn-secondary" id="adminBookingsTab">बुकिंग</button>
      <button class="btn-secondary" id="adminContentTab">दैनिक सामग्री</button>
    </div>
    <div id="adminBody"><p class="small-note">लोड हो रहा है...</p></div>
  `);

  document.getElementById("adminBookingsTab").addEventListener("click", renderAdminBookings);
  document.getElementById("adminContentTab").addEventListener("click", renderAdminContentForm);

  renderAdminBookings();
};

async function renderAdminBookings(){
  const body = document.getElementById("adminBody");
  body.innerHTML = `<p class="small-note">लोड हो रहा है...</p>`;

  try{
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty){
      body.innerHTML = `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>अभी तक कोई बुकिंग नहीं है।</p></div>`;
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const b = docSnap.data();
      html += `
        <div class="seva-card" style="cursor:default;">
          <h3>${b.sevaTitle || b.seva}</h3>
          <p style="margin:2px 0;">👤 ${b.name} · 📞 ${b.phone}</p>
          <p style="margin:2px 0;">📅 ${b.date} ${b.address ? "· 📍 " + b.address : ""}</p>
          <p style="margin:6px 0 0; font-size:12px; color:var(--ink-soft);">स्थिति: ${b.status || "pending"}</p>
        </div>
      `;
    });
    body.innerHTML = html;
  }catch(e){
    console.error("Admin bookings load error:", e);
    body.innerHTML = `<p class="small-note" style="color:#B23A3A;">बुकिंग लोड नहीं हो सकीं। Firestore rules जांचें।</p>`;
  }
}

function renderAdminContentForm(){
  const body = document.getElementById("adminBody");
  body.innerHTML = `
    <p class="small-note" style="text-align:left; margin-bottom:14px;">
      नोट: पंचांग (वार, तिथि, नक्षत्र, योग, करण) अपने आप हर दिन अपडेट होता है। यहाँ से बदलाव अस्थायी होगा — अगली स्वचालित अपडेट पर वापस बदल जाएगा।
    </p>

    <label class="form-label">वार</label>
    <input type="text" id="admVaar" class="form-input" placeholder="जैसे: सोमवार">

    <label class="form-label">तिथि</label>
    <input type="text" id="admTithi" class="form-input" placeholder="जैसे: शुक्ल पक्ष द्वितीया">

    <label class="form-label">नक्षत्र</label>
    <input type="text" id="admNakshatra" class="form-input" placeholder="जैसे: रोहिणी">

    <label class="form-label">योग</label>
    <input type="text" id="admYoga" class="form-input" placeholder="जैसे: सिद्धि">

    <label class="form-label">करण</label>
    <input type="text" id="admKarana" class="form-input" placeholder="जैसे: बव">

    <label class="form-label">सूर्योदय/सूर्यास्त</label>
    <input type="text" id="admMuhurat" class="form-input" placeholder="जैसे: सूर्योदय 06:00 · सूर्यास्त 18:30">

    <label class="form-label">आज का श्लोक</label>
    <textarea id="admShlok" class="form-textarea" rows="3" placeholder="श्लोक यहाँ लिखें..."></textarea>

    <label class="form-label">YouTube वीडियो ID (वैकल्पिक)</label>
    <input type="text" id="admYoutube" class="form-input" placeholder="जैसे: dQw4w9WgXcQ">

    <div id="admError" style="color:#B23A3A; font-size:13px; margin-bottom:10px; display:none;"></div>
    <div id="admSuccess" style="color:var(--success); font-size:13px; margin-bottom:10px; display:none;"></div>
    <button class="btn-primary" id="admSaveBtn">सहेजें</button>
  `;

  document.getElementById("admSaveBtn").addEventListener("click", async () => {
    const vaar = document.getElementById("admVaar").value.trim();
    const tithi = document.getElementById("admTithi").value.trim();
    const nakshatra = document.getElementById("admNakshatra").value.trim();
    const yoga = document.getElementById("admYoga").value.trim();
    const karana = document.getElementById("admKarana").value.trim();
    const muhurat = document.getElementById("admMuhurat").value.trim();
    const shlok = document.getElementById("admShlok").value.trim();
    const youtubeId = document.getElementById("admYoutube").value.trim();
    const errBox = document.getElementById("admError");
    const okBox = document.getElementById("admSuccess");
    errBox.style.display = "none";
    okBox.style.display = "none";

    try{
      await setDoc(doc(db, "content", "today"), { vaar, tithi, nakshatra, yoga, karana, muhurat, shlok, youtubeId }, { merge: true });
      okBox.innerText = "सफलतापूर्वक सहेजा गया!";
      okBox.style.display = "block";
    }catch(e){
      console.error("Content save error:", e);
      errBox.innerText = "सहेजने में समस्या हुई।";
      errBox.style.display = "block";
    }
  });
}
