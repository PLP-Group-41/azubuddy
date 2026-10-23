// lib/llm.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) console.warn('GEMINI_API_KEY missing - chat will fail');
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI ? genAI.getGenerativeModel({
  model: 'gemini-3.5-flash-lite',
  generationConfig: {
    temperature: 0.25,
    maxOutputTokens: 512,
    responseMimeType: 'application/json',
    // 🔥 FIX: Gemini 3.x Flash-Lite rejects thinkingBudget: 0.
    // Use thinkingLevel: "minimal" to get as close to zero reasoning as possible.
    thinkingConfig: {
      thinkingLevel: "minimal"
    }
  }
}) : null;

/**
 * Streams the model output, calling onChunk(text) for every delta.
 */
export async function streamLLM(prompt, onChunk) {
  if (!model) throw new Error('Gemini not configured - missing GEMINI_API_KEY');
  const result = await model.generateContentStream(prompt);
  let full = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      full += text;
      onChunk(text);
    }
  }
  return full;
}

// Legacy wrapper
export async function askLLM(prompt) {
  return streamLLM(prompt, () => {});
}