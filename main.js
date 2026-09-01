// ==========================================
// CORE APP LOGIC — routing, overlay, sidebar, panchang
// ==========================================
import { db } from "./config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------- Overlay (bottom-sheet) control ----------
const overlayBackdrop = document.getElementById("overlayBackdrop");
const overlaySheet = document.getElementById("overlaySheet");
const overlayContent = document.getElementById("overlay-content");
const overlayClose = document.getElementById("overlayClose");

window.showOverlay = (html) => {
  overlayContent.innerHTML = html;
  overlayBackdrop.classList.add("show");
  overlaySheet.classList.add("open");
  document.body.style.overflow = "hidden";
};

window.hideOverlay = () => {
  overlayBackdrop.classList.remove("show");
  overlaySheet.classList.remove("open");
  document.body.style.overflow = "";
};

overlayBackdrop.addEventListener("click", window.hideOverlay);
overlayClose.addEventListener("click", window.hideOverlay);

// ---------- Sidebar control ----------
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const menuBtn = document.getElementById("menuBtn");

function openSidebar(){ sidebar.classList.add("open"); sidebarBackdrop.classList.add("show"); }
function closeSidebar(){ sidebar.classList.remove("open"); sidebarBackdrop.classList.remove("show"); }

menuBtn.addEventListener("click", openSidebar);
sidebarBackdrop.addEventListener("click", closeSidebar);

// ---------- Router ----------
// Har route ek function ko map karta hai jo overlay dikhata hai.
// Ye functions doosri files (hawan.js, pujan.js, etc.) me window par register hote hain.
const routes = {
  home: () => { window.hideOverlay(); closeSidebar(); window.scrollTo({top:0, behavior:"smooth"}); },
  hawan: () => window.renderHawanMenu?.(),
  pujan: () => window.renderPujanMenu?.(),
  kundli: () => window.renderKundliForm?.(),
  mantra: () => window.renderMantraLibrary?.(),
  quiz: () => window.renderQuizMenu?.(),
  bhaktiAI: () => window.renderBhaktiAI?.(),
  bookings: () => window.renderMyBookings?.(),
  profile: () => window.renderProfile?.(),
};

function handleRoute(routeName){
  closeSidebar();
  const fn = routes[routeName];
  if (fn) fn();
}

document.querySelectorAll("[data-route]").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    handleRoute(el.dataset.route);
    // bottom-nav active state
    if (el.classList.contains("nav-link")){
      document.querySelectorAll(".nav-link").forEach(n => n.classList.remove("active"));
      el.classList.add("active");
    }
  });
});

document.getElementById("profileBtn").addEventListener("click", () => handleRoute("profile"));
document.getElementById("shareBtn").addEventListener("click", (e) => { e.preventDefault(); shareApp(); });

function shareApp(){
  const shareData = { title: 'आचार्य हर्ष शर्मा', text: 'आध्यात्मिक सेवा के लिए इस ऐप को देखें 🙏', url: window.location.href };
  if (navigator.share) navigator.share(shareData).catch(()=>{});
  else window.open("https://wa.me/?text=" + encodeURIComponent(shareData.text + " " + shareData.url));
}

// ---------- Panchang / Shlok / Video (from Firestore: content/today) ----------
async function loadDailyContent(){
  try{
    const snap = await getDoc(doc(db, "content", "today"));
    if (snap.exists()){
      const val = snap.data();
      document.getElementById("displayVaar").innerText = val.vaar || "उपलब्ध नहीं";
      document.getElementById("displayTithi").innerText = val.tithi || "उपलब्ध नहीं";
      document.getElementById("displayNakshatra").innerText = val.nakshatra || "उपलब्ध नहीं";
      document.getElementById("displayYoga").innerText = val.yoga || "उपलब्ध नहीं";
      document.getElementById("displayKarana").innerText = val.karana || "उपलब्ध नहीं";
      document.getElementById("displayMuhurat").innerText = val.muhurat || "उपलब्ध नहीं";
      document.getElementById("displayShlok").innerText = val.shlok || "आज कोई श्लोक उपलब्ध नहीं है।";
      if (val.youtubeId){
        document.getElementById("videoPlayer").src = "https://www.youtube.com/embed/" + val.youtubeId;
        document.getElementById("videoCard").style.display = "block";
      }
    } else {
      ["displayVaar","displayTithi","displayNakshatra","displayYoga","displayKarana","displayMuhurat"].forEach(id => {
        document.getElementById(id).innerText = "जल्द आ रहा है";
      });
      document.getElementById("displayShlok").innerText = "जल्द आ रहा है 🙏";
    }
  }catch(e){
    console.error("Daily content load error:", e);
    ["displayVaar","displayTithi","displayNakshatra","displayYoga","displayKarana","displayMuhurat","displayShlok"].forEach(id => {
      document.getElementById(id).innerText = "उपलब्ध नहीं";
    });
  }
}

document.addEventListener("DOMContentLoaded", loadDailyContent);

// ---------- Rashifal (personalized horoscope) ----------
const RASHI_HINDI_NAMES = {
  aries:"मेष", taurus:"वृषभ", gemini:"मिथुन", cancer:"कर्क", leo:"सिंह", virgo:"कन्या",
  libra:"तुला", scorpio:"वृश्चिक", sagittarius:"धनु", capricorn:"मकर", aquarius:"कुंभ", pisces:"मीन"
};

let horoscopeData = null;

async function loadHoroscopeData(){
  try{
    const snap = await getDoc(doc(db, "content", "today"));
    if (snap.exists() && snap.data().horoscopes){
      horoscopeData = JSON.parse(snap.data().horoscopes);
    }
  }catch(e){
    console.error("Horoscope load error:", e);
  }
  initRashiUI();
}

function initRashiUI(){
  const savedRashi = localStorage.getItem("user_rashi");
  const selectView = document.getElementById("rashiSelectView");
  const displayView = document.getElementById("rashiDisplayView");

  if (savedRashi && RASHI_HINDI_NAMES[savedRashi]){
    selectView.style.display = "none";
    displayView.style.display = "block";
    document.getElementById("rashiName").innerText = RASHI_HINDI_NAMES[savedRashi];
    showRashiText(savedRashi, "general");
  } else {
    selectView.style.display = "block";
    displayView.style.display = "none";
  }
}

function showRashiText(rashiKey, type){
  const textEl = document.getElementById("rashiText");
  if (horoscopeData && horoscopeData[rashiKey]){
    textEl.innerText = horoscopeData[rashiKey][type] || "आज इस श्रेणी में जानकारी उपलब्ध नहीं है।";
  } else {
    textEl.innerText = "जल्द उपलब्ध होगा।";
  }
}

document.getElementById("rashiConfirmBtn").addEventListener("click", () => {
  const val = document.getElementById("rashiSelect").value;
  if (!val) return;
  localStorage.setItem("user_rashi", val);
  initRashiUI();
});

document.getElementById("rashiChangeBtn").addEventListener("click", () => {
  localStorage.removeItem("user_rashi");
  initRashiUI();
});

document.querySelectorAll(".rashi-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".rashi-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const savedRashi = localStorage.getItem("user_rashi");
    if (savedRashi) showRashiText(savedRashi, tab.dataset.type);
  });
});

document.addEventListener("DOMContentLoaded", loadHoroscopeData);

// ---------- PWA install ----------
let deferredPrompt;
const installBanner = document.getElementById("installBanner");
const installBtn = document.getElementById("installBtn");

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBanner) installBanner.style.display = "block";
});

installBtn?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted" && installBanner) installBanner.style.display = "none";
  deferredPrompt = null;
});

window.addEventListener("appinstalled", () => {
  if (installBanner) installBanner.style.display = "none";
});

// ---------- Service worker registration ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .catch((err) => console.error("Service worker registration failed:", err));
  });
}

// Expose for other modules
window.__handleRoute = handleRoute;
    
