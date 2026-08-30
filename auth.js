// ==========================================
// AUTHENTICATION — login, signup, session state
// ==========================================
import { auth, db } from "./config.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_EMAILS = ["acharyaharsh@example.com"]; // TODO: apna admin email yahan daalo

let currentUserData = null;
window.__currentUserData = () => currentUserData;

// ---------- Auth state listener ----------
onAuthStateChanged(auth, async (user) => {
  const sideAvatar = document.getElementById("sideAvatar");
  const sideName = document.getElementById("sideName");
  const sideSub = document.getElementById("sideSub");
  const sideAuthBtn = document.getElementById("sideAuthBtn");
  const sideAdminBtn = document.getElementById("sideAdminBtn");

  if (user){
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()){
      await setDoc(userRef, {
        name: user.displayName || "श्रद्धालु",
        email: user.email,
        createdAt: new Date().toISOString()
      });
    }
    const data = (await getDoc(userRef)).data();
    currentUserData = { uid: user.uid, ...data };

    sideAvatar.innerText = (data.name || "U").charAt(0).toUpperCase();
    sideName.innerText = data.name || "श्रद्धालु";
    sideSub.innerText = user.email;
    sideAuthBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> लॉगआउट';
    sideAuthBtn.onclick = (e) => { e.preventDefault(); signOut(auth); };

    if (ADMIN_EMAILS.includes(user.email)){
      sideAdminBtn.style.display = "flex";
      sideAdminBtn.onclick = (e) => { e.preventDefault(); window.renderAdminPanel?.(); };
    } else {
      sideAdminBtn.style.display = "none";
    }
  } else {
    currentUserData = null;
    sideAvatar.innerText = "?";
    sideName.innerText = "अतिथि जी";
    sideSub.innerText = "लॉगिन करें";
    sideAuthBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> लॉगिन करें';
    sideAuthBtn.onclick = (e) => { e.preventDefault(); window.renderAuthForm?.("login"); };
    sideAdminBtn.style.display = "none";
  }
});

// ---------- Auth form (login/signup) ----------
window.renderAuthForm = (mode = "login") => {
  const isLogin = mode === "login";
  const html = `
    <h2 class="ov-title"><i class="fa-solid fa-om"></i> ${isLogin ? "लॉगिन करें" : "नया खाता बनाएं"}</h2>
    <div id="authError" style="color:#B23A3A; font-size:13px; margin-bottom:10px; display:none;"></div>
    ${!isLogin ? `
      <label class="form-label">आपका नाम</label>
      <input type="text" id="authName" class="form-input" placeholder="जैसे: राम शर्मा">
    ` : ""}
    <label class="form-label">ईमेल</label>
    <input type="email" id="authEmail" class="form-input" placeholder="you@example.com">
    <label class="form-label">पासवर्ड</label>
    <input type="password" id="authPassword" class="form-input" placeholder="कम से कम 6 अक्षर">
    <button class="btn-primary" id="authSubmitBtn" style="margin-top:6px;">
      ${isLogin ? "लॉगिन करें" : "खाता बनाएं"}
    </button>
    <p class="small-note">
      ${isLogin ? "खाता नहीं है? " : "पहले से खाता है? "}
      <button class="link-btn" id="authSwitchBtn">${isLogin ? "नया खाता बनाएं" : "लॉगिन करें"}</button>
    </p>
  `;
  window.showOverlay(html);

  document.getElementById("authSwitchBtn").addEventListener("click", () => {
    window.renderAuthForm(isLogin ? "signup" : "login");
  });

  document.getElementById("authSubmitBtn").addEventListener("click", async () => {
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const errBox = document.getElementById("authError");
    errBox.style.display = "none";

    if (!email || !password){
      errBox.innerText = "कृपया सभी जानकारी भरें।";
      errBox.style.display = "block";
      return;
    }

    try{
      if (isLogin){
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const name = document.getElementById("authName").value.trim();
        if (!name){
          errBox.innerText = "कृपया अपना नाम दर्ज करें।";
          errBox.style.display = "block";
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, "users", cred.user.uid), {
          name, email, createdAt: new Date().toISOString()
        });
      }
      window.hideOverlay();
    }catch(e){
      errBox.innerText = friendlyAuthError(e.code);
      errBox.style.display = "block";
    }
  });
};

function friendlyAuthError(code){
  const map = {
    "auth/email-already-in-use": "यह ईमेल पहले से पंजीकृत है।",
    "auth/invalid-email": "ईमेल सही नहीं है।",
    "auth/weak-password": "पासवर्ड कम से कम 6 अक्षर का होना चाहिए।",
    "auth/user-not-found": "खाता नहीं मिला। नया खाता बनाएं।",
    "auth/wrong-password": "पासवर्ड गलत है।",
    "auth/invalid-credential": "ईमेल या पासवर्ड गलत है।"
  };
  return map[code] || "कुछ गड़बड़ हो गई। दोबारा प्रयास करें।";
}

// ---------- Profile view ----------
window.renderProfile = () => {
  const user = auth.currentUser;
  if (!user){
    window.renderAuthForm("login");
    return;
  }
  const data = currentUserData || {};
  const html = `
    <h2 class="ov-title"><i class="fa-solid fa-user"></i> प्रोफाइल</h2>
    <div class="card" style="box-shadow:none; border:1px solid var(--cream-warm);">
      <p class="form-label">नाम</p>
      <p style="margin:0 0 14px; font-size:16px; font-weight:600;">${data.name || "—"}</p>
      <p class="form-label">ईमेल</p>
      <p style="margin:0; font-size:15px; color:var(--ink-soft);">${data.email || "—"}</p>
    </div>
    <button class="btn-secondary mt-16" id="myBookingsBtn"><i class="fa-solid fa-calendar-check"></i> मेरी बुकिंग देखें</button>
    <button class="btn-text" id="logoutBtn" style="color:#B23A3A;">लॉगआउट करें</button>
  `;
  window.showOverlay(html);
  document.getElementById("myBookingsBtn").addEventListener("click", () => window.renderMyBookings?.());
  document.getElementById("logoutBtn").addEventListener("click", () => { signOut(auth); window.hideOverlay(); });
};

