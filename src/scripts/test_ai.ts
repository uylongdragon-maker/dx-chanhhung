import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No API key found in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("Listing available models...");
    // The library doesn't have a direct listModels, but we can fetch it via fetch if needed
    // However, let's try a very basic model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hi");
    console.log("Success with default!");
  } catch (err: any) {
    console.log("ListModels/Testing failed: " + err.message);
  }
}

test();
