// ====================================================
// DEDICATED BOBA AI PRODUCT DESCRIPTION ENGINE MODULE
// ====================================================

async function generateAIDescription() {
  const titleInput = document.getElementById('pTitle');
  const descBox = document.getElementById('pDesc');

  if (!titleInput || !descBox) return;

  const title = titleInput.value.trim();
  if (!title) {
    alert("Please enter a Product Title, Brand, or Model Number (e.g. Uken U6052) first!");
    return;
  }

  descBox.value = "🌐 BOBA AI is searching Google Gemini 3.5 Flash servers for exact model specifications...";

  // Check for valid API key in config.js
  const apiKey = (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY.length > 5 && !CONFIG.GEMINI_API_KEY.includes("PASTE_YOUR"))
    ? CONFIG.GEMINI_API_KEY.trim()
    : null;

  if (!apiKey) {
    descBox.value = "⚠️ GEMINI_API_KEY is missing or invalid in config.js. Please add your key from https://aistudio.google.com.";
    alert("Gemini API Key is missing in config.js!");
    return;
  }

  try {
    const promptText = `You are an expert commercial hardware & industrial product catalog manager.
Search and extract the exact real-world specifications for this product/model SKU: "${title}".
Provide exact real-world dimensions (e.g. PH1 x 100mm), blade/tool material, tip finish, brand name, and applications.

Format your response EXACTLY in this 5-line structure:
🏷️ Brand & Model: [Exact Brand and Model Number]
📏 Size / Dimensions: [Exact Real Dimensions]
⚖️ Weight / Specifications: [Weight or Finish]
🌍 Country of Origin: [Country of Origin]
⚙️ Specs & Features: [Key Features & Applications]`;

    // Direct fetch to Gemini 3.5 Flash using x-goog-api-key header for AQ. keys
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: promptText }] }] 
      })
    });

    const data = await res.json();

    if (data.error) {
      descBox.value = "⚠️ Gemini API Error: " + data.error.message + "\n\n(Verify your key from https://aistudio.google.com is active).";
      return;
    }

    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (resultText) {
      descBox.value = resultText.trim();
    } else {
      descBox.value = "⚠️ No specifications returned for '" + title + "'. Please enter description manually.";
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    descBox.value = "⚠️ Network / API Error: " + err.message + ". Check your internet connection.";
  }
}