// ==========================================
// KUNDLI — jyotish consultation request
// ==========================================
import { auth, PANDIT_WHATSAPP } from "./config.js";

window.renderKundliForm = () => {
  const user = auth.currentUser;
  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-star-and-crescent"></i> कुंडली परामर्श</h2>
    <p style="color:var(--ink-soft); font-size:14px; margin-bottom:18px; line-height:1.6;">
      अपनी जन्म तिथि, समय और स्थान भरें। आचार्य जी आपकी कुंडली देखकर विस्तृत परामर्श देंगे।
    </p>

    <label class="form-label">आपका नाम</label>
    <input type="text" id="kName" class="form-input" value="${user ? (window.__currentUserData()?.name || "") : ""}" placeholder="जैसे: राम शर्मा">

    <label class="form-label">फ़ोन नंबर</label>
    <input type="tel" id="kPhone" class="form-input" placeholder="10 अंकों का मोबाइल नंबर">

    <label class="form-label">जन्म तिथि</label>
    <input type="date" id="kDob" class="form-input">

    <label class="form-label">जन्म समय</label>
    <input type="time" id="kTob" class="form-input">

    <label class="form-label">जन्म स्थान</label>
    <input type="text" id="kPob" class="form-input" placeholder="जैसे: उज्जैन, मध्य प्रदेश">

    <label class="form-label">आपकी समस्या / प्रश्न</label>
    <textarea id="kQuery" class="form-textarea" rows="3" placeholder="संक्षेप में बताएं..."></textarea>

    <div id="kError" style="color:#B23A3A; font-size:13px; margin-bottom:10px; display:none;"></div>
    <button class="btn-primary" id="kSubmitBtn"><i class="fa-brands fa-whatsapp"></i> परामर्श अनुरोध भेजें</button>
  `);

  document.getElementById("kSubmitBtn").addEventListener("click", () => {
    const name = document.getElementById("kName").value.trim();
    const phone = document.getElementById("kPhone").value.trim();
    const dob = document.getElementById("kDob").value;
    const tob = document.getElementById("kTob").value;
    const pob = document.getElementById("kPob").value.trim();
    const query = document.getElementById("kQuery").value.trim();
    const errBox = document.getElementById("kError");

    if (!name || !phone || !dob || !pob){
      errBox.innerText = "कृपया नाम, फ़ोन, जन्म तिथि और जन्म स्थान भरें।";
      errBox.style.display = "block";
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)){
      errBox.innerText = "कृपया सही 10 अंकों का मोबाइल नंबर डालें।";
      errBox.style.display = "block";
      return;
    }

    const msg =
`🙏 कुंडली परामर्श अनुरोध

नाम: ${name}
फ़ोन: ${phone}
जन्म तिथि: ${dob}
जन्म समय: ${tob || "उल्लेख नहीं"}
जन्म स्थान: ${pob}
प्रश्न: ${query || "उल्लेख नहीं"}`;

    window.open(`https://wa.me/${PANDIT_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");

    window.showOverlay(`
      <div class="empty-state">
        <i class="fa-solid fa-circle-check" style="color:var(--success);"></i>
        <h3 style="font-family:var(--font-display); color:var(--maroon); margin:0 0 8px;">अनुरोध भेजा गया!</h3>
        <p style="margin:0;">आचार्य जी शीघ्र ही WhatsApp पर संपर्क करेंगे।</p>
      </div>
    `);
  });
};

