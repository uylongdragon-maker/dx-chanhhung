import dotenv from "dotenv";
dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Testing with API Key ends with: " + apiKey?.slice(-4));
  
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  ];

  for (const url of endpoints) {
    try {
      console.log(`Testing URL: ${url.replace(apiKey!, "HIDDEN")}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
      });
      console.log(`Status: ${response.status} ${response.statusText}`);
      const data = await response.json();
      console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.log(`FAILED: ${err.message}`);
    }
  }
}

test();
