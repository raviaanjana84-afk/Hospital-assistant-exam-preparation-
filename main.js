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
      document.getElementById("displayTithi").innerText = val.tithi || "उपलब्ध नहीं";
      document.getElementById("displayMuhurat").innerText = val.muhurat || "उपलब्ध नहीं";
      document.getElementById("displayShlok").innerText = val.shlok || "आज कोई श्लोक उपलब्ध नहीं है।";
      if (val.youtubeId){
        document.getElementById("videoPlayer").src = "https://www.youtube.com/embed/" + val.youtubeId;
        document.getElementById("videoCard").style.display = "block";
      }
    } else {
      document.getElementById("displayTithi").innerText = "जल्द आ रहा है";
      document.getElementById("displayMuhurat").innerText = "जल्द आ रहा है";
      document.getElementById("displayShlok").innerText = "जल्द आ रहा है 🙏";
    }
  }catch(e){
    console.error("Daily content load error:", e);
    document.getElementById("displayTithi").innerText = "उपलब्ध नहीं";
    document.getElementById("displayMuhurat").innerText = "उपलब्ध नहीं";
    document.getElementById("displayShlok").innerText = "उपलब्ध नहीं";
  }
}

document.addEventListener("DOMContentLoaded", loadDailyContent);

// ---------- PWA install ----------
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Expose for other modules
window.__handleRoute = handleRoute;

