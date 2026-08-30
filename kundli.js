// ==========================================
// KUNDLI — vaidik kundli sevayein + booking
// ==========================================
import { auth } from "./config.js";
import { createBooking } from "./booking.js";

const KUNDLI_DATA = {
  sampoorna: {
    title: "संपूर्ण कुंडली निर्माण",
    price: 2100,
    desc: "जन्म कुंडली एक जातक के जन्म के समय आकाश मंडल का मानचित्र है। एक सटीक कुंडली ही जीवन की सही दिशा तय करती है।",
    points: [
      { label: "ग्रह स्थिति", text: "लग्न कुंडली, नवमांश कुंडली एवं अन्य 16 मुख्य वर्ग कुंडलियों का विस्तृत विवरण।" },
      { label: "दशा चक्र", text: "विंशोत्तरी महादशा एवं अंतर्दशा का कालखंड विश्लेषण।" },
      { label: "अष्टकवर्ग एवं गोचर", text: "ग्रहों की शक्ति और उनके वर्तमान प्रभाव की गणना।" },
      { label: "षोडशवर्ग सारणी", text: "सूक्ष्म गणनाओं के आधार पर आपके जीवन के विभिन्न पहलुओं (धन, स्वास्थ्य, संतान) का नक्शा।" }
    ],
    mahatva: "आचार्य हर्ष शर्मा द्वारा गणितीय शुद्धता के साथ बनाई गई यह कुंडली आपके पूरे जीवन का आधार बनती है, जिससे भविष्य में आने वाले उतार-चढ़ाव का पूर्वानुमान लगाया जा सकता है।"
  },
  gahan: {
    title: "गहन कुंडली विश्लेषण",
    price: 500,
    desc: "यदि आपके पास पहले से कुंडली है और आप अपने जीवन की वर्तमान समस्याओं का समाधान चाहते हैं, तो यह सेवा आपके लिए है।",
    points: [
      { label: "दोष पहचान", text: "कुंडली में कालसर्प, मांगलिक, पितृ दोष या चांडाल दोष की उपस्थिति की जाँच।" },
      { label: "करियर एवं धन", text: "आजीविका के क्षेत्र में सफलता और आर्थिक स्थिति का विश्लेषण।" },
      { label: "वैवाहिक जीवन", text: "विवाह में देरी या वैवाहिक कलह के ग्रहों का अध्ययन।" },
      { label: "सटीक उपाय", text: "रत्नों का परामर्श, मंत्र जाप और वैदिक शांति उपायों की जानकारी।" }
    ],
    mahatva: "इस विश्लेषण के माध्यम से आप जान पाएंगे कि वर्तमान में कौन सा ग्रह आपके अनुकूल है और किसे शांत करने की आवश्यकता है।"
  }
};

window.renderKundliMenu = () => {
  let cards = Object.keys(KUNDLI_DATA).map(key => {
    const s = KUNDLI_DATA[key];
    return `
      <div class="seva-card" data-key="${key}">
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
        <span class="seva-price">₹${s.price.toLocaleString('en-IN')}</span>
      </div>`;
  }).join("");

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-star-and-crescent"></i> वैदिक कुंडली सेवाएँ</h2>
    <p style="color:var(--ink-soft); font-size:13px; margin-bottom:16px;">ग्रहों की चाल से जानें अपना भविष्य</p>
    ${cards}
  `);

  document.querySelectorAll("#overlay-content .seva-card").forEach(card => {
    card.addEventListener("click", () => renderKundliDetail(card.dataset.key));
  });
};

// Keep old route name working too
window.renderKundliForm = window.renderKundliMenu;

function renderKundliDetail(key){
  const s = KUNDLI_DATA[key];
  const pointsHtml = s.points.map(p => `
    <li style="margin-bottom:10px;"><b style="color:var(--maroon);">${p.label}:</b> ${p.text}</li>
  `).join("");

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-star-and-crescent"></i> ${s.title}</h2>
    <span class="seva-price" style="display:inline-block; margin-bottom:14px;">₹${s.price.toLocaleString('en-IN')}</span>
    <p style="color:var(--ink-soft); font-size:14px; line-height:1.7; margin-bottom:14px;">${s.desc}</p>

    <p style="font-weight:700; color:var(--maroon); margin-bottom:8px; font-family:var(--font-display);">इसमें क्या शामिल है?</p>
    <ul style="padding-right:0; padding-left:20px; margin:0 0 16px; font-size:14px; line-height:1.6; color:var(--ink);">
      ${pointsHtml}
    </ul>

    <div class="card" style="background:var(--cream-warm); box-shadow:none; padding:14px; margin-bottom:18px;">
      <p style="margin:0; font-size:13px; line-height:1.6;"><b style="color:var(--maroon);">महत्व:</b> ${s.mahatva}</p>
    </div>

    <button class="btn-primary" id="kundliBookBtn"><i class="fa-brands fa-whatsapp"></i> अभी बनवाएं</button>
    <button class="btn-text" id="kundliBackBtn">← वापस सेवाओं पर जाएं</button>
  `);

  document.getElementById("kundliBackBtn").addEventListener("click", () => window.renderKundliMenu());
  document.getElementById("kundliBookBtn").addEventListener("click", () => renderKundliBookingForm(key));
}

function renderKundliBookingForm(key){
  const s = KUNDLI_DATA[key];
  const user = auth.currentUser;

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-star-and-crescent"></i> ${s.title}</h2>
    <p style="color:var(--ink-soft); font-size:13px; margin-bottom:16px;">
      कृपया अपनी जन्म संबंधी जानकारी भरें — आचार्य जी सटीक विश्लेषण के लिए इनका उपयोग करेंगे।
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

    <label class="form-label">आपकी समस्या / प्रश्न (वैकल्पिक)</label>
    <textarea id="kQuery" class="form-textarea" rows="3" placeholder="संक्षेप में बताएं..."></textarea>

    <div id="kError" style="color:#B23A3A; font-size:13px; margin-bottom:10px; display:none;"></div>
    <button class="btn-primary" id="kSubmitBtn"><i class="fa-brands fa-whatsapp"></i> बुक करें</button>
  `);

  document.getElementById("kSubmitBtn").addEventListener("click", async () => {
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

    await createBooking({
      seva: "कुंडली",
      sevaTitle: s.title,
      price: s.price,
      name, phone,
      date: dob,
      address: `जन्म समय: ${tob || "उल्लेख नहीं"} · जन्म स्थान: ${pob}${query ? " · प्रश्न: " + query : ""}`
    });

    window.hideOverlay();
  });
}
