// ==========================================
// HAWAN — seva list + booking
// ==========================================
import { auth } from "./config.js";
import { createBooking } from "./booking.js";

const HAWAN_DATA = {
  samanya: { title: "माँ बगलामुखी सामान्य हवन", desc: "शत्रु बाधा और गृह क्लेश मुक्ति हेतु। इसमें मुख्य रूप से पीली सरसों, घी और सूखे गोले का प्रयोग किया जाता है।", price: 2350 },
  vishesh: { title: "माँ बगलामुखी विशेष हवन", desc: "विशेष कार्यों की सिद्धि हेतु। इसमें 21 प्रकार की जड़ी-बूटियों और सूखी लाल मिर्च का प्रयोग किया जाता है।", price: 5600 },
  mahavishesh: { title: "माँ बगलामुखी महाविशेष हवन", desc: "असाध्य रोगों और शत्रु विजय हेतु। इसमें 36 प्रकार की जड़ी-बूटियों का तांत्रिक विधान से प्रयोग होता है।", price: 11000 }
};

window.renderHawanMenu = () => {
  let cards = Object.keys(HAWAN_DATA).map(key => {
    const s = HAWAN_DATA[key];
    return `
      <div class="seva-card" data-key="${key}">
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
        <span class="seva-price">₹${s.price.toLocaleString('en-IN')}</span>
      </div>`;
  }).join("");

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-fire"></i> हवन विभाग</h2>
    ${cards}
  `);

  document.querySelectorAll("#overlay-content .seva-card").forEach(card => {
    card.addEventListener("click", () => renderHawanBookingForm(card.dataset.key));
  });
};

function renderHawanBookingForm(key){
  const s = HAWAN_DATA[key];
  const user = auth.currentUser;

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-fire"></i> ${s.title}</h2>
    <p style="color:var(--ink-soft); font-size:14px; margin-bottom:16px;">${s.desc}</p>
    <p class="seva-price" style="display:block; margin-bottom:18px;">₹${s.price.toLocaleString('en-IN')}</p>

    <label class="form-label">आपका नाम</label>
    <input type="text" id="bkName" class="form-input" value="${user ? (window.__currentUserData()?.name || "") : ""}" placeholder="जैसे: राम शर्मा">

    <label class="form-label">फ़ोन नंबर</label>
    <input type="tel" id="bkPhone" class="form-input" placeholder="10 अंकों का मोबाइल नंबर">

    <label class="form-label">हवन की तारीख</label>
    <input type="date" id="bkDate" class="form-input">

    <label class="form-label">पता / स्थान</label>
    <textarea id="bkAddress" class="form-textarea" rows="3" placeholder="हवन कहाँ करवाना है?"></textarea>

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
      seva: "हवन",
      sevaTitle: s.title,
      price: s.price,
      name, phone, date, address
    });

    window.hideOverlay();
  });
}

