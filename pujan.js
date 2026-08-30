// ==========================================
// PUJAN — seva list + booking
// ==========================================
import { auth } from "./config.js";
import { createBooking } from "./booking.js";

const PUJAN_DATA = {
  griha: { title: "गृह प्रवेश पूजन", desc: "नए घर में प्रवेश से पूर्व वास्तु दोष निवारण एवं सुख-समृद्धि हेतु संपूर्ण विधि से पूजन।", price: 3100 },
  satyanarayan: { title: "सत्यनारायण पूजा", desc: "मंगल कार्यों में विघ्न बाधा दूर करने एवं कृपा प्राप्ति हेतु सत्यनारायण भगवान की कथा एवं पूजन।", price: 2100 },
  navgrah: { title: "नवग्रह शांति पूजन", desc: "ग्रह दोष निवारण एवं जीवन में स्थिरता हेतु नौ ग्रहों की विशेष शांति पूजा।", price: 4500 }
};

window.renderPujanMenu = () => {
  let cards = Object.keys(PUJAN_DATA).map(key => {
    const s = PUJAN_DATA[key];
    return `
      <div class="seva-card" data-key="${key}">
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
        <span class="seva-price">₹${s.price.toLocaleString('en-IN')}</span>
      </div>`;
  }).join("");

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-hands-praying"></i> पूजन विभाग</h2>
    ${cards}
  `);

  document.querySelectorAll("#overlay-content .seva-card").forEach(card => {
    card.addEventListener("click", () => renderPujanBookingForm(card.dataset.key));
  });
};

function renderPujanBookingForm(key){
  const s = PUJAN_DATA[key];
  const user = auth.currentUser;

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-hands-praying"></i> ${s.title}</h2>
    <p style="color:var(--ink-soft); font-size:14px; margin-bottom:16px;">${s.desc}</p>
    <p class="seva-price" style="display:block; margin-bottom:18px;">₹${s.price.toLocaleString('en-IN')}</p>

    <label class="form-label">आपका नाम</label>
    <input type="text" id="bkName" class="form-input" value="${user ? (window.__currentUserData()?.name || "") : ""}" placeholder="जैसे: राम शर्मा">

    <label class="form-label">फ़ोन नंबर</label>
    <input type="tel" id="bkPhone" class="form-input" placeholder="10 अंकों का मोबाइल नंबर">

    <label class="form-label">पूजन की तारीख</label>
    <input type="date" id="bkDate" class="form-input">

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
      sevaTitle: s.title,
      price: s.price,
      name, phone, date, address
    });

    window.hideOverlay();
  });
}
