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
// पुष्टि किया गया structure: result.Day.name, result.Tithi.name, result.Paksha.name,
// result.Nakshatra.name, result.Yoga.name, result.Karna.name — ये सभी पहले से हिंदी में हैं!
function calculatePanchang(){
  const panchang = new MhahPanchang();
  const now = new Date();
  const result = panchang.calculate(now);

  const vaar = result?.Day?.name || "उपलब्ध नहीं";
  const tithiName = result?.Tithi?.name || "";
  const pakshaName = result?.Paksha?.name || "";
  const nakshatra = result?.Nakshatra?.name || "उपलब्ध नहीं";
  const yoga = result?.Yoga?.name || "उपलब्ध नहीं";
  const karana = result?.Karna?.name || "उपलब्ध नहीं";

  let sunriseText = "उपलब्ध नहीं", sunsetText = "उपलब्ध नहीं";
  try{
    const cal = panchang.calendar(now, UJJAIN_LAT, UJJAIN_LNG);
    const sunriseRaw = cal?.SunRise || cal?.Sunrise || cal?.sunrise;
    const sunsetRaw = cal?.SunSet || cal?.Sunset || cal?.sunset;
    if (sunriseRaw){
      sunriseText = new Date(sunriseRaw).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Kolkata' });
    }
    if (sunsetRaw){
      sunsetText = new Date(sunsetRaw).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Kolkata' });
    }
  }catch(e){
    console.error("Sunrise/sunset calculation error:", e);
  }

  return {
    vaar,
    tithi: pakshaName ? `${pakshaName} पक्ष ${tithiName}`.trim() : tithiName,
    nakshatra,
    yoga,
    karana,
    muhurat: (sunriseText !== "उपलब्ध नहीं") ? `सूर्योदय ${sunriseText} · सूर्यास्त ${sunsetText}` : "उपलब्ध नहीं"
  };
}

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
  if (!GEMINI_API_KEY || !generalText) return { __debug_reason: !GEMINI_API_KEY ? "no_api_key" : "no_general_text" };
  try{
    const prompt = `यह आज का सामान्य राशिफल है (${hindiName} राशि के लिए):\n"${generalText}"\n\nइसी के आधार पर हिंदी में इन 5 श्रेणियों के लिए 1-2 वाक्य का संक्षिप्त राशिफल बनाएं। केवल यह JSON प्रारूप दें, कोई अतिरिक्त टेक्स्ट नहीं:\n{"general":"...","love":"...","career":"...","health":"...","money":"..."}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await res.json();
    if (data?.error) return { __debug_reason: "gemini_error", __debug_detail: JSON.stringify(data.error) };

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!text) return { __debug_reason: "empty_gemini_text", __debug_detail: JSON.stringify(data) };

    text = text.replace(/```json|```/g, "").trim();
    try{
      return JSON.parse(text);
    }catch(parseErr){
      return { __debug_reason: "json_parse_failed", __debug_detail: text.slice(0, 300) };
    }
  }catch(e){
    return { __debug_reason: "fetch_exception", __debug_detail: e.message };
  }
}

function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

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
    // Gemini free tier: 20 requests/minute — 3 second wait rakhte hain taaki safe rahe
    await sleep(3000);
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

    res.status(200).json({
      success: true, ...panchang, shlok, horoscopeSignsCount: Object.keys(horoscopes).length,
      debug_cancer: horoscopes.cancer || null
    });
  }catch(e){
    console.error("Panchang update failed:", e);
    res.status(500).json({ success: false, error: e.message, stack: e.stack });
  }
      }
      
