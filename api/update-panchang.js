// ==========================================
// VERCEL SERVERLESS FUNCTION
// Roz automatically Ujjain ka Panchang laata hai (Prokerala API se)
// aur Firestore me save karta hai (content/today document).
//
// Ye function Vercel Cron ke through roz subah automatically chalega.
// ==========================================

const PROKERALA_CLIENT_ID = process.env.PROKERALA_CLIENT_ID;
const PROKERALA_CLIENT_SECRET = process.env.PROKERALA_CLIENT_SECRET;
const FIREBASE_PROJECT_ID = "harsh-sharma-dc962";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// Ujjain coordinates (Simhastha/Mahakal city — appropriate default location)
const UJJAIN_COORDINATES = "23.1765,75.7885";

// Hindi tithi/paksha/nakshatra names — Prokerala English deta hai, hum Hindi me map karte hain
const TITHI_HINDI = {
  "Pratipada":"प्रतिपदा","Dwitiya":"द्वितीया","Tritiya":"तृतीया","Chaturthi":"चतुर्थी","Panchami":"पंचमी",
  "Shashthi":"षष्ठी","Saptami":"सप्तमी","Ashtami":"अष्टमी","Navami":"नवमी","Dashami":"दशमी",
  "Ekadashi":"एकादशी","Dwadashi":"द्वादशी","Trayodashi":"त्रयोदशी","Chaturdashi":"चतुर्दशी",
  "Purnima":"पूर्णिमा","Amavasya":"अमावस्या"
};
const PAKSHA_HINDI = { "Shukla Paksha":"शुक्ल पक्ष", "Krishna Paksha":"कृष्ण पक्ष" };

// रोज़ बदलने वाले श्लोकों की सूची — दिन के अनुसार अपने आप घूमती है
const SHLOK_LIST = [
  "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥ — गीता 2.47",
  "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥ — गीता 2.48",
  "वसुधैव कुटुम्बकम्। — महोपनिषद्",
  "सत्यमेव जयते नानृतं सत्येन पन्था विततो देवयानः। — मुण्डक उपनिषद्",
  "अहिंसा परमो धर्मः धर्म हिंसा तथैव च। — महाभारत",
  "यत्र नार्यस्तु पूज्यन्ते रमन्ते तत्र देवताः। — मनुस्मृति",
  "उद्यमेन हि सिध्यन्ति कार्याणि न मनोरथैः। — पंचतंत्र",
  "श्रद्धावान् लभते ज्ञानं तत्परः संयतेन्द्रियः। — गीता 4.39",
  "अन्नदाता सुखी भव। — पारंपरिक आशीर्वाद",
  "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः। — पारंपरिक श्लोक"
];

function getTodayShlok(){
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  return SHLOK_LIST[dayOfYear % SHLOK_LIST.length];
}

async function getProkeralaToken(){
  const res = await fetch("https://api.prokerala.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: PROKERALA_CLIENT_ID,
      client_secret: PROKERALA_CLIENT_SECRET
    })
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Prokerala token error: " + JSON.stringify(data));
  return data.access_token;
}

async function getPanchang(token){
  const now = new Date();
  const isoDateTime = now.toISOString();

  const url = `https://api.prokerala.com/v2/astrology/panchang?ayanamsa=1&coordinates=${UJJAIN_COORDINATES}&datetime=${encodeURIComponent(isoDateTime)}&la=hi`;

  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  if (data.errors) throw new Error("Prokerala panchang error: " + JSON.stringify(data.errors));
  return data.data;
}

function formatTithiMuhurat(panchangData){
  let tithiText = "उपलब्ध नहीं";
  let muhuratText = "उपलब्ध नहीं";

  try{
    const tithiObj = panchangData?.tithi?.[0];
    if (tithiObj){
      const name = tithiObj.name || "";
      const paksha = tithiObj.paksha || "";
      const hindiName = TITHI_HINDI[name] || name;
      const hindiPaksha = PAKSHA_HINDI[paksha] || paksha;
      tithiText = `${hindiPaksha} ${hindiName}`.trim();
    }

    const auspicious = panchangData?.auspicious_period;
    if (auspicious && auspicious.length > 0){
      const abhijit = auspicious.find(p => p.name?.toLowerCase().includes("abhijit"));
      if (abhijit){
        const start = new Date(abhijit.start).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' });
        const end = new Date(abhijit.end).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' });
        muhuratText = `अभिजित मुहूर्त: ${start} - ${end}`;
      } else {
        const first = auspicious[0];
        const start = new Date(first.start).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' });
        const end = new Date(first.end).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' });
        muhuratText = `${first.name}: ${start} - ${end}`;
      }
    }
  }catch(e){
    console.error("Format error:", e);
  }

  return { tithiText, muhuratText };
}

async function saveToFirestore(tithi, muhurat, shlok){
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/content/today?key=${FIREBASE_API_KEY}&updateMask.fieldPaths=tithi&updateMask.fieldPaths=muhurat&updateMask.fieldPaths=shlok&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=source`;

  const body = {
    fields: {
      tithi: { stringValue: tithi },
      muhurat: { stringValue: muhurat },
      shlok: { stringValue: shlok },
      updatedAt: { stringValue: new Date().toISOString() },
      source: { stringValue: "prokerala-auto" }
    }
  };

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok){
    const errText = await res.text();
    throw new Error("Firestore save error: " + errText);
  }
}

export default async function handler(req, res){
  try{
    const token = await getProkeralaToken();
    const panchangData = await getPanchang(token);
    const { tithiText, muhuratText } = formatTithiMuhurat(panchangData);
    const shlok = getTodayShlok();

    await saveToFirestore(tithiText, muhuratText, shlok);

    res.status(200).json({
      success: true,
      tithi: tithiText,
      muhurat: muhuratText,
      shlok,
      debug_raw_keys: Object.keys(panchangData || {}),
      debug_auspicious: panchangData?.auspicious_period || null
    });
  }catch(e){
    console.error("Panchang update failed:", e);
    res.status(500).json({ success: false, error: e.message });
  }
                                                                           }
      
