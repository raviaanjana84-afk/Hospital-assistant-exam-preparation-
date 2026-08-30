// ==========================================
// SHARED BOOKING LOGIC — Firestore save + WhatsApp notify
// ==========================================
import { db, auth, PANDIT_WHATSAPP } from "./config.js";
import { collection, addDoc, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * booking = { seva, sevaTitle, price, name, phone, date, address }
 */
export async function createBooking(booking){
  const user = auth.currentUser;

  try{
    await addDoc(collection(db, "bookings"), {
      ...booking,
      userId: user ? user.uid : null,
      status: "pending",
      createdAt: new Date().toISOString()
    });
  }catch(e){
    console.error("Booking save error:", e);
  }

  // WhatsApp message
  const msg =
`🙏 नई बुकिंग अनुरोध

सेवा: ${booking.sevaTitle}
मूल्य: ₹${booking.price?.toLocaleString('en-IN') || "—"}
नाम: ${booking.name}
फ़ोन: ${booking.phone}
तारीख: ${booking.date}
${booking.address ? "पता: " + booking.address : ""}`;

  const waUrl = `https://wa.me/${PANDIT_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank");

  window.showOverlay(`
    <div class="empty-state">
      <i class="fa-solid fa-circle-check" style="color:var(--success);"></i>
      <h3 style="font-family:var(--font-display); color:var(--maroon); margin:0 0 8px;">बुकिंग सफल रही!</h3>
      <p style="margin:0;">आपका अनुरोध प्राप्त हो गया है। WhatsApp पर पंडित जी से जल्द संपर्क होगा।</p>
    </div>
  `);
}

// ---------- My Bookings (for logged-in users) ----------
window.renderMyBookings = async () => {
  const user = auth.currentUser;
  if (!user){
    window.renderAuthForm?.("login");
    return;
  }

  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-calendar-check"></i> मेरी बुकिंग</h2>
    <p class="small-note">लोड हो रहा है...</p>
  `);

  try{
    const q = query(collection(db, "bookings"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty){
      window.showOverlay(`
        <h2 class="ov-title"><i class="fa-solid fa-calendar-check"></i> मेरी बुकिंग</h2>
        <div class="empty-state">
          <i class="fa-solid fa-calendar-xmark"></i>
          <p>अभी तक कोई बुकिंग नहीं है।</p>
        </div>
      `);
      return;
    }

    let html = `<h2 class="ov-title"><i class="fa-solid fa-calendar-check"></i> मेरी बुकिंग</h2>`;
    snap.forEach(docSnap => {
      const b = docSnap.data();
      html += `
        <div class="seva-card" style="cursor:default;">
          <h3>${b.sevaTitle || b.seva}</h3>
          <p style="margin:2px 0;">📅 ${b.date} ${b.address ? "· 📍 " + b.address : ""}</p>
          <p style="margin:6px 0 0; font-size:12px; color:var(--ink-soft);">स्थिति: ${b.status || "pending"}</p>
        </div>
      `;
    });
    window.showOverlay(html);
  }catch(e){
    console.error("My bookings load error:", e);
    window.showOverlay(`
      <h2 class="ov-title"><i class="fa-solid fa-calendar-check"></i> मेरी बुकिंग</h2>
      <p class="small-note" style="color:#B23A3A;">बुकिंग लोड नहीं हो सकीं।</p>
    `);
  }
};

