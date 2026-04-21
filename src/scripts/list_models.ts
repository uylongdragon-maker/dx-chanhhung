import dotenv from "dotenv";
dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    console.log(`Fetching model list...`);
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.log(`FAILED: ${err.message}`);
  }
}

test();
