// ==========================================
// BHAKTI AI — Gemini-powered spiritual Q&A
// ==========================================
import { GEMINI_API_KEY } from "./config.js";
import { GoogleGenAI } from "https://esm.run/@google/genai";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

window.renderBhaktiAI = () => {
  window.showOverlay(`
    <h2 class="ov-title"><i class="fa-solid fa-sparkles"></i> भक्ति AI</h2>
    <p style="color:var(--ink-soft); font-size:13px; margin-bottom:14px;">
      आध्यात्मिक प्रश्न पूछें — आचार्य जी की शैली में उत्तर पाएं।
    </p>
    <div class="chat-window" id="chatWindow"></div>
    <div class="chat-input-row">
      <input type="text" id="aiInput" placeholder="अपना प्रश्न पूछें...">
      <button class="chat-send" id="aiSendBtn"><i class="fa-solid fa-paper-plane"></i></button>
    </div>
  `);

  const input = document.getElementById("aiInput");
  const sendBtn = document.getElementById("aiSendBtn");

  sendBtn.addEventListener("click", askBhaktiAI);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") askBhaktiAI(); });
};

async function askBhaktiAI(){
  const input = document.getElementById("aiInput");
  const chat = document.getElementById("chatWindow");
  const msg = input.value.trim();
  if (!msg) return;

  appendMsg(chat, msg, "user");
  input.value = "";

  const loadingId = "loading-" + Date.now();
  chat.innerHTML += `<div class="chat-msg ai" id="${loadingId}">सोच रहा हूँ...</div>`;
  chat.scrollTop = chat.scrollHeight;

  try{
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "आचार्य हर्ष शर्मा की तरह, विनम्र और आध्यात्मिक शैली में हिंदी में उत्तर दें: " + msg
    });
    const aiText = response?.text || "क्षमा करें, उत्तर नहीं मिल सका। पुनः प्रयास करें।";
    document.getElementById(loadingId).remove();
    appendMsg(chat, aiText, "ai");
  }catch(e){
    console.error("Bhakti AI error:", e);
    document.getElementById(loadingId).remove();
    appendMsg(chat, `त्रुटि: ${e.message || "नेटवर्क त्रुटि हुई। कृपया पुनः प्रयास करें।"}`, "ai");
  }
}

function appendMsg(chat, text, role){
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
