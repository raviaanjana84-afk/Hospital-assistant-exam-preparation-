// ==========================================
// VERCEL SERVERLESS FUNCTION
// Roz automatically Panchang (local calculation, koi limit nahi) aur
// Raashifal (free horoscope API + Gemini se Love/Career/Health/Money)
// Firestore me save karta hai (content/today document).
//
// Ye function Vercel Cron ke through roz subah automatically chalega.
// ==========================================

import { MhahPanchang } from "nepali-panchang-utils";

const FIREBASE_PROJECT_ID = "harsh-sharma-dc962";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Ujjain coordinates (Simhastha/Mahakal city)
const UJJAIN_LAT = 23.1765;
const UJJAIN_LNG = 75.7885;

// 12 राशियाँ (zodiac signs) — free horoscope API keys aur Hindi names
const ZODIAC_SIGNS = [
  { key: "aries", hindi: "मेष" },
  { key: "taurus", hindi: "वृषभ" },
  { key: "gemini", hindi: "मिथुन" },
  { key: "cancer", hindi: "कर्क" },
  { key: "leo", hindi: "सिंह" },
  { key: "virgo", hindi: "कन्या" },
  { key: "libra", hindi: "तुला" },
  { key: "scorpio", hindi: "वृश्चिक" },
  { key: "sagittarius", hindi: "धनु" },
  { key: "capricorn", hindi: "मकर" },
  { key: "aquarius", hindi: "कुंभ" },
  { key: "pisces", hindi: "मीन" }
];

// रोज़ बदलने वाले श्लोकों की सूची
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

// ---------- पंचांग (local calculation, कोई API limit नहीं) ----------
function calculatePanchang(){
  const panchang = new MhahPanchang();
  const now = new Date();
  const result = panchang.calculate(now);

  const vaar = result?.Day?.name_en_UK || "उपलब्ध नहीं";
  const tithiName = result?.Tithi?.name_en_UK || "";
  const pakshaName = result?.Paksha?.name_en_UK || "";
  const nakshatra = result?.Nakshatra?.name_en_UK || "उपलब्ध नहीं";
  const yoga = result?.Yoga?.name_en_UK || "उपलब्ध नहीं";
  const karana = result?.Karna?.name_en_UK || "उपलब्ध नहीं";

  let sunriseText = "उपलब्ध नहीं", sunsetText = "उपलब्ध नहीं";
  try{
    const cal = panchang.calendar(now, UJJAIN_LAT, UJJAIN_LNG);
    if (cal?.SunRise){
      sunriseText = new Date(cal.SunRise).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Kolkata' });
    }
    if (cal?.SunSet){
      sunsetText = new Date(cal.SunSet).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Kolkata' });
    }
  }catch(e){
    console.error("Sunrise/sunset calculation error:", e);
  }

  return {
    vaar: mapVaarToHindi(vaar),
    tithi: `${mapPakshaToHindi(pakshaName)} ${mapTithiToHindi(tithiName)}`.trim(),
    nakshatra: mapNakshatraToHindi(nakshatra),
    yoga: mapYogaToHindi(yoga),
    karana: mapKaranaToHindi(karana),
    muhurat: (sunriseText !== "उपलब्ध नहीं") ? `सूर्योदय ${sunriseText} · सूर्यास्त ${sunsetText}` : "उपलब्ध नहीं"
  };
}

const VAAR_MAP = { Sunday:"रविवार", Monday:"सोमवार", Tuesday:"मंगलवार", Wednesday:"बुधवार", Thursday:"गुरुवार", Friday:"शुक्रवार", Saturday:"शनिवार" };
function mapVaarToHindi(name){ return VAAR_MAP[name] || name; }

const PAKSHA_MAP = { "Shukla":"शुक्ल पक्ष", "Krishna":"कृष्ण पक्ष", "Waxing Moon":"शुक्ल पक्ष", "Waning Moon":"कृष्ण पक्ष" };
function mapPakshaToHindi(name){
  for (const key in PAKSHA_MAP){ if (name?.includes(key)) return PAKSHA_MAP[key]; }
  return name || "";
}

const TITHI_MAP = {
  "Pratipada":"प्रतिपदा","Dwitiya":"द्वितीया","Tritiya":"तृतीया","Chaturthi":"चतुर्थी","Panchami":"पंचमी",
  "Shashthi":"षष्ठी","Saptami":"सप्तमी","Ashtami":"अष्टमी","Navami":"नवमी","Dashami":"दशमी",
  "Ekadashi":"एकादशी","Dwadashi":"द्वादशी","Trayodashi":"त्रयोदशी","Chaturdashi":"चतुर्दशी",
  "Purnima":"पूर्णिमा","Amavasya":"अमावस्या","Full Moon":"पूर्णिमा","New Moon":"अमावस्या"
};
function mapTithiToHindi(name){
  for (const key in TITHI_MAP){ if (name?.includes(key)) return TITHI_MAP[key]; }
  return name || "";
}

const NAKSHATRA_MAP = {
  "Ashwini":"अश्विनी","Bharani":"भरणी","Krittika":"कृत्तिका","Rohini":"रोहिणी","Mrigashira":"मृगशिरा","Mrigasira":"मृगशिरा",
  "Ardra":"आर्द्रा","Punarvasu":"पुनर्वसु","Pushya":"पुष्य","Ashlesha":"आश्लेषा","Magha":"मघा",
  "PurvaPhalguni":"पूर्व फाल्गुनी","Purva Phalguni":"पूर्व फाल्गुनी","UttaraPhalguni":"उत्तर फाल्गुनी","Uttara Phalguni":"उत्तर फाल्गुनी",
  "Hasta":"हस्त","Chitra":"चित्रा","Swati":"स्वाति","Vishakha":"विशाखा","Anuradha":"अनुराधा","Jyeshtha":"ज्येष्ठा","Mula":"मूल",
  "PurvaAshadha":"पूर्वाषाढ़ा","Purva Ashadha":"पूर्वाषाढ़ा","UttaraAshadha":"उत्तराषाढ़ा","Uttara Ashadha":"उत्तराषाढ़ा",
  "Shravana":"श्रवण","Dhanishta":"धनिष्ठा","Shatabhisha":"शतभिषा",
  "PurvaBhadrapada":"पूर्व भाद्रपद","Purva Bhadrapada":"पूर्व भाद्रपद","UttaraBhadrapada":"उत्तर भाद्रपद","Uttara Bhadrapada":"उत्तर भाद्रपद","Revati":"रेवती"
};
function mapNakshatraToHindi(name){
  if (NAKSHATRA_MAP[name]) return NAKSHATRA_MAP[name];
  for (const key in NAKSHATRA_MAP){ if (name?.includes(key)) return NAKSHATRA_MAP[key]; }
  return name || "";
}

const YOGA_MAP = {
  "Vishkambha":"विष्कम्भ","Priti":"प्रीति","Ayushman":"आयुष्मान","Saubhagya":"सौभाग्य","Shobhana":"शोभन",
  "Atiganda":"अतिगण्ड","Sukarma":"सुकर्मा","Dhriti":"धृति","Shula":"शूल","Ganda":"गण्ड",
  "Vriddhi":"वृद्धि","Dhruva":"ध्रुव","Vyaghata":"व्याघात","Harshana":"हर्षण","Vajra":"वज्र",
  "Siddhi":"सिद्धि","Vyatipata":"व्यतीपात","Variyan":"वरीयान","Parigha":"परिघ","Shiva":"शिव",
  "Siddha":"सिद्ध","Sadhya":"साध्य","Shubha":"शुभ","Shukla":"शुक्ल","Brahma":"ब्रह्म",
  "Indra":"इन्द्र","Vaidhriti":"वैधृति"
};
function mapYogaToHindi(name){ return YOGA_MAP[name] || name || ""; }

const KARANA_MAP = {
  "Bava":"बव","Balava":"बालव","Kaulava":"कौलव","Taitila":"तैतिल","Gara":"गर","Vanija":"वणिज",
  "Vishti":"विष्टि","Shakuni":"शकुनि","Chatushpada":"चतुष्पद","Naga":"नाग","Kimstughna":"किंस्तुघ्न"
};
function mapKaranaToHindi(name){ return KARANA_MAP[name] || name || ""; }

// ---------- राशिफल (free API + Gemini से breakdown) ----------
async function getGeneralHoroscope(signKey){
  try{
    const url = `https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=${signKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.data?.horoscope || null;
  }catch(e){
    console.error(`Horoscope fetch error for ${signKey}:`, e);
    return null;
  }
}

async function generateCategoryBreakdown(generalText, hindiName){
  if (!GEMINI_API_KEY || !generalText) return null;
  try{
    const prompt = `यह आज का सामान्य राशिफल है (${hindiName} राशि के लिए):\n"${generalText}"\n\nइसी के आधार पर हिंदी में इन 4 श्रेणियों के लिए 1-2 वाक्य का संक्षिप्त राशिफल बनाएं। केवल यह JSON प्रारूप दें, कोई अतिरिक्त टेक्स्ट नहीं:\n{"general":"...","love":"...","career":"...","health":"...","money":"..."}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await res.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    text = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);
    return parsed;
  }catch(e){
    console.error("Gemini breakdown error:", e);
    return null;
  }
}

async function getAllHoroscopes(){
  const results = {};
  for (const sign of ZODIAC_SIGNS){
    try{
      const general = await getGeneralHoroscope(sign.key);
      const breakdown = general ? await generateCategoryBreakdown(general, sign.hindi) : null;

      results[sign.key] = {
        hindi: sign.hindi,
        general: breakdown?.general || "आज उपलब्ध नहीं है।",
        love: breakdown?.love || "आज उपलब्ध नहीं है।",
        career: breakdown?.career || "आज उपलब्ध नहीं है।",
        health: breakdown?.health || "आज उपलब्ध नहीं है।",
        money: breakdown?.money || "आज उपलब्ध नहीं है।"
      };
    }catch(e){
      console.error(`Failed for ${sign.key}:`, e);
      results[sign.key] = {
        hindi: sign.hindi,
        general: "आज उपलब्ध नहीं है।", love: "आज उपलब्ध नहीं है।",
        career: "आज उपलब्ध नहीं है।", health: "आज उपलब्ध नहीं है।", money: "आज उपलब्ध नहीं है।"
      };
    }
  }
  return results;
}

// ---------- Firestore सेव ----------
async function saveToFirestore(panchang, shlok, horoscopes){
  const fieldPaths = ["tithi","vaar","nakshatra","yoga","karana","muhurat","shlok","horoscopes","updatedAt","source"];
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
      horoscopes: { stringValue: JSON.stringify(horoscopes) },
      updatedAt: { stringValue: new Date().toISOString() },
      source: { stringValue: "local-calc+free-api" }
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
    const panchang = calculatePanchang();
    const shlok = getTodayShlok();
    const horoscopes = await getAllHoroscopes();

    await saveToFirestore(panchang, shlok, horoscopes);

    const debugPanchang = new MhahPanchang();
    const debugRaw = debugPanchang.calculate(new Date());

    res.status(200).json({
      success: true, ...panchang, shlok, horoscopeSignsCount: Object.keys(horoscopes).length,
      debug_raw: debugRaw
    });
  }catch(e){
    console.error("Panchang update failed:", e);
    res.status(500).json({ success: false, error: e.message });
  }
    }
        
