const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey // <--- REQUIRED BY GOOGLE FOR AQ. KEYS
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: promptText }] }]
  })
});