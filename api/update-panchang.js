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

const VAAR_HINDI = {
  "Sunday":"रविवार","Monday":"सोमवार","Tuesday":"मंगलवार","Wednesday":"बुधवार",
  "Thursday":"गुरुवार","Friday":"शुक्रवार","Saturday":"शनिवार"
};

const NAKSHATRA_HINDI = {
  "Ashwini":"अश्विनी","Bharani":"भरणी","Krittika":"कृत्तिका","Rohini":"रोहिणी","Mrigashira":"मृगशिरा",
  "Ardra":"आर्द्रा","Punarvasu":"पुनर्वसु","Pushya":"पुष्य","Ashlesha":"आश्लेषा","Magha":"मघा",
  "Purva Phalguni":"पूर्व फाल्गुनी","Uttara Phalguni":"उत्तर फाल्गुनी","Hasta":"हस्त","Chitra":"चित्रा",
  "Swati":"स्वाति","Vishakha":"विशाखा","Anuradha":"अनुराधा","Jyeshtha":"ज्येष्ठा","Mula":"मूल",
  "Purva Ashadha":"पूर्वाषाढ़ा","Uttara Ashadha":"उत्तराषाढ़ा","Shravana":"श्रवण","Dhanishta":"धनिष्ठा",
  "Shatabhisha":"शतभिषा","Purva Bhadrapada":"पूर्व भाद्रपद","Uttara Bhadrapada":"उत्तर भाद्रपद","Revati":"रेवती"
};

const YOGA_HINDI = {
  "Vishkambha":"विष्कम्भ","Priti":"प्रीति","Ayushman":"आयुष्मान","Saubhagya":"सौभाग्य","Shobhana":"शोभन",
  "Atiganda":"अतिगण्ड","Sukarma":"सुकर्मा","Dhriti":"धृति","Shula":"शूल","Ganda":"गण्ड",
  "Vriddhi":"वृद्धि","Dhruva":"ध्रुव","Vyaghata":"व्याघात","Harshana":"हर्षण","Vajra":"वज्र",
  "Siddhi":"सिद्धि","Vyatipata":"व्यतीपात","Variyan":"वरीयान","Parigha":"परिघ","Shiva":"शिव",
  "Siddha":"सिद्ध","Sadhya":"साध्य","Shubha":"शुभ","Shukla":"शुक्ल","Brahma":"ब्रह्म",
  "Indra":"इन्द्र","Vaidhriti":"वैधृति"
};

const KARANA_HINDI = {
  "Bava":"बव","Balava":"बालव","Kaulava":"कौलव","Taitila":"तैतिल","Gara":"गर","Vanija":"वणिज",
  "Vishti":"विष्टि","Shakuni":"शकुनि","Chatushpada":"चतुष्पद","Naga":"नाग","Kimstughna":"किंस्तुघ्न"
};

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

function formatPanchang(panchangData){
  const result = {
    tithi: "उपलब्ध नहीं",
    vaar: "उपलब्ध नहीं",
    nakshatra: "उपलब्ध नहीं",
    yoga: "उपलब्ध नहीं",
    karana: "उपलब्ध नहीं",
    muhurat: "उपलब्ध नहीं" // sunrise-sunset yahan jaayega
  };

  try{
    // तिथि
    const tithiObj = panchangData?.tithi?.[0];
    if (tithiObj){
      const hindiName = TITHI_HINDI[tithiObj.name] || tithiObj.name || "";
      const hindiPaksha = PAKSHA_HINDI[tithiObj.paksha] || tithiObj.paksha || "";
      result.tithi = `${hindiPaksha} ${hindiName}`.trim();
    }

    // वार (दिन)
    if (panchangData?.vaara){
      result.vaar = VAAR_HINDI[panchangData.vaara] || panchangData.vaara;
    }

    // नक्षत्र
    const nakshatraObj = panchangData?.nakshatra?.[0];
    if (nakshatraObj?.name){
      result.nakshatra = NAKSHATRA_HINDI[nakshatraObj.name] || nakshatraObj.name;
    }

    // योग
    const yogaObj = panchangData?.yoga?.[0];
    if (yogaObj?.name){
      result.yoga = YOGA_HINDI[yogaObj.name] || yogaObj.name;
    }

    // करण
    const karanaObj = panchangData?.karana?.[0];
    if (karanaObj?.name){
      result.karana = KARANA_HINDI[karanaObj.name] || karanaObj.name;
    }

    // सूर्योदय / सूर्यास्त ("मुहूर्त" की जगह उपयोगी जानकारी)
    if (panchangData?.sunrise && panchangData?.sunset){
      const sunriseTime = new Date(panchangData.sunrise).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' });
      const sunsetTime = new Date(panchangData.sunset).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' });
      result.muhurat = `सूर्योदय ${sunriseTime} · सूर्यास्त ${sunsetTime}`;
    }
  }catch(e){
    console.error("Format error:", e);
  }

  return result;
}

async function saveToFirestore(panchang, shlok){
  const fieldPaths = ["tithi","vaar","nakshatra","yoga","karana","muhurat","shlok","updatedAt","source"];
  const maskParams = fieldPaths.map(f => `updateMask.fieldPaths=${f}`).join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/content/today?key=${FIREBASE_API_KEY}&${maskParams}`;

  const body = {
    fields: {
      tithi: { stringValue: panchang.tithi },
      vaar: { stringValue: panchang.vaar },
      nakshatra: { stringValue: panchang.nakshatra },
      yoga: { stringValue: panchang.yoga },
      karana: { stringValue: panchang.karana },
      muhurat: { stringValue: panchang.muhurat },
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
    const panchang = formatPanchang(panchangData);
    const shlok = getTodayShlok();

    await saveToFirestore(panchang, shlok);

    res.status(200).json({ success: true, ...panchang, shlok });
  }catch(e){
    console.error("Panchang update failed:", e);
    res.status(500).json({ success: false, error: e.message });
  }
    }
        
