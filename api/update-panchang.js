// ==========================================
// PUJAN — real sevayein (Acharya ji se) + booking
// ==========================================
import { auth } from "./config.js";
import { createBooking } from "./booking.js";

const PUJAN_DATA = {
  mangal_dosh: {
    title: "मंगल दोष निवारण पूजन",
    price: 3100,
    templeReceipt: 350,
    desc: "कुंडली में मंगल दोष से निवारण के लिए मंगलनाथ मंदिर, उज्जैन में मंगल भात किया जाता है, जिसमें चावल और दही से मिश्रित भात चढ़ाया जाता है।"
  },
  kalsarp: {
    title: "कालसर्प पूजन",
    price: 5100,
    templeReceipt: 500,
    desc: "कालसर्प दोष से निवारण हेतु नवकुल चांदी के नाग-नागिन का पूजन किया जाता है, पश्चात विसर्जन किया जाता है।"
  },
  arka_vivah: {
    title: "अर्क विवाह",
    price: 5100,
    templeReceipt: 500,
    desc: "जिस लड़के की कुंडली में दो विवाह का योग होता है, उसके निवारण के लिए अर्क विवाह किया जाता है।"
  },
  kumbh_vivah: {
    title: "कुंभ विवाह",
    price: 5100,
    templeReceipt: 500,
    desc: "जिस लड़की की कुंडली में दो विवाह का योग होता है, उसके निवारण के लिए कुंभ विवाह किया जाता है।"
  },
  navgrah_shanti: {
    title: "नवग्रह शांति पूजन",
    price: 3100,
    templeReceipt: 350,
    desc: "कुंडली में नवग्रह का अशुभ प्रभाव कम करने के लिए नवग्रह शांति पूजन किया जाता है।"
  },
  pitru_dosh: {
    title: "पितृ दोष शांति पूजन (पिंडदान)",
    priceRange: "2,100 - 5,100",
    price: 2100,
    desc: "पितृ दोष से निवारण हेतु पिंडदान किया जाता है — नारायण बलि, नाग बलि के रूप में। शुल्क कार्य के अनुसार ₹2,100 से ₹5,100 के बीच रहता है।"
  },
  vastu_pujan: {
    title: "वास्तु पूजन",
    desc: "नवीन गृह प्रवेश या वास्तु दोष निवारण हेतु वास्तु पूजन किया जाता है। अवधि अनुसार शुल्क:",
    tiers: [
      { label: "1 दिवसीय अनुष्ठान", price: 11000 },
      { label: "2 दिवसीय अनुष्ठान", price: 15000 },
      { label: "3 दिवसीय अनुष्ठान", price: 21000 }
    ]
  },
  bhagwat_path: {
    title: "भागवत मूल पाठ (पितृ दोष शांति हेतु)",
    price: 35000,
    desc: "पितृ दोष शांति के लिए 7 दिवसीय भागवत मूल पाठ अनुष्ठान किया जाता है, जिससे पितृ दोष से शांति मिलती है।"
  }
};

window.renderPujanMenu = () => {
  let cards = Object.keys(PUJAN_DATA).map(key => {
    const s = PUJAN_DATA[key];
    let priceDisplay = "";
    if (s.tiers){
      priceDisplay = `<span class="seva-price">₹${s.tiers[0].price.toLocaleString('en-IN')} से शुरू</span>`;
    } else if (s.priceRange){
      priceDisplay = `<span class="seva-price">₹${s.priceRange}</span>`;
    } else {
      priceDisplay = `<span class="seva-price">₹${s.price.toLocaleString('en-IN')}</span>`;
    }
    return `
      <div class="seva-card" data-key="${key}">
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
        ${priceDisplay}
      </div>`;
  }).join("");

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-hands-praying"></i> पूजन विभाग</h2>
    <p style="color:var(--ink-soft); font-size:13px; margin-bottom:16px;">आचार्य हर्ष शर्मा द्वारा विधि-विधान से संपन्न</p>
    ${cards}
  `);

  document.querySelectorAll("#overlay-content .seva-card").forEach(card => {
    card.addEventListener("click", () => renderPujanDetail(card.dataset.key));
  });
};

function renderPujanDetail(key){
  const s = PUJAN_DATA[key];
  const user = auth.currentUser;

  let priceSection = "";
  if (s.tiers){
    priceSection = s.tiers.map(t => `
      <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--cream-warm);">
        <span style="font-size:14px;">${t.label}</span>
        <span class="seva-price">₹${t.price.toLocaleString('en-IN')}</span>
      </div>
    `).join("");
  } else if (s.priceRange){
    priceSection = `<span class="seva-price" style="display:inline-block; margin-bottom:6px;">₹${s.priceRange}</span>`;
  } else {
    priceSection = `<span class="seva-price" style="display:inline-block; margin-bottom:6px;">₹${s.price.toLocaleString('en-IN')}</span>`;
    if (s.templeReceipt){
      priceSection += `<p style="margin:4px 0 0; font-size:12px; color:var(--ink-soft);">+ ₹${s.templeReceipt} मंदिर परिसर की रसीद</p>`;
    }
  }

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-hands-praying"></i> ${s.title}</h2>
    <p style="color:var(--ink-soft); font-size:14px; line-height:1.7; margin-bottom:14px;">${s.desc}</p>
    <div style="margin-bottom:18px;">${priceSection}</div>

    <button class="btn-primary" id="pujanBookBtn"><i class="fa-brands fa-whatsapp"></i> बुक करें</button>
    <button class="btn-text" id="pujanBackBtn">← वापस सेवाओं पर जाएं</button>
  `);

  document.getElementById("pujanBackBtn").addEventListener("click", () => window.renderPujanMenu());
  document.getElementById("pujanBookBtn").addEventListener("click", () => renderPujanBookingForm(key));
}

function renderPujanBookingForm(key){
  const s = PUJAN_DATA[key];
  const user = auth.currentUser;

  let priceLabel = s.tiers ? `₹${s.tiers[0].price.toLocaleString('en-IN')} से शुरू` :
                   s.priceRange ? `₹${s.priceRange}` : `₹${s.price.toLocaleString('en-IN')}`;

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-hands-praying"></i> ${s.title}</h2>
    <p class="seva-price" style="display:block; margin-bottom:18px;">${priceLabel}</p>

    <label class="form-label">आपका नाम</label>
    <input type="text" id="bkName" class="form-input" value="${user ? (window.__currentUserData()?.name || "") : ""}" placeholder="जैसे: राम शर्मा">

    <label class="form-label">फ़ोन नंबर</label>
    <input type="tel" id="bkPhone" class="form-input" placeholder="10 अंकों का मोबाइल नंबर">

    <label class="form-label">पूजन की तारीख</label>
    <input type="date" id="bkDate" class="form-input">

    ${s.tiers ? `
    <label class="form-label">अनुष्ठान अवधि चुनें</label>
    <select id="bkTier" class="form-select">
      ${s.tiers.map(t => `<option value="${t.label}">${t.label} — ₹${t.price.toLocaleString('en-IN')}</option>`).join("")}
    </select>
    ` : ""}

    <label class="form-label">पता / स्थान</label>
    <textarea id="bkAddress" class="form-textarea" rows="3" placeholder="पूजन कहाँ करवाना है?"></textarea>

    <div id="bkError" style="color:#B23A3A; font-size:13px; margin-bottom:10px; display:none;"></div>
    <button class="btn-primary" id="bkSubmitBtn"><i class="fa-brands fa-whatsapp"></i> बुक करें</button>
  `);

  document.getElementById("bkSubmitBtn").addEventListener("click", async () => {
    const name = document.getElementById("bkName").value.trim();
    const phone = document.getElementById("bkPhone").value.trim();
    const date = document.getElementById("bkDate").value;
    const address = document.getElementById("bkAddress").value.trim();
    const tier = document.getElementById("bkTier")?.value || "";
    const errBox = document.getElementById("bkError");

    if (!name || !phone || !date){
      errBox.innerText = "कृपया नाम, फ़ोन नंबर और तारीख भरें।";
      errBox.style.display = "block";
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)){
      errBox.innerText = "कृपया सही 10 अंकों का मोबाइल नंबर डालें।";
      errBox.style.display = "block";
      return;
    }

    await createBooking({
      seva: "पूजन",
      sevaTitle: s.title + (tier ? ` (${tier})` : ""),
      price: s.price || (s.tiers ? s.tiers[0].price : 0),
      name, phone, date, address
    });

    window.hideOverlay();
  });
        }
