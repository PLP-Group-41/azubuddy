// api/chat.js
import express from 'express';
import { buildPrompt } from '../prompts/assembler.js';
import { askLLM } from '../lib/llm.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { question, concept_id = null } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'invalid_request', message: 'question is required' });
    }

    const prompt = buildPrompt({ question, concept_id });
    const responseText = await askLLM(prompt);

    // Gemini's responseMimeType: 'application/json' guarantees valid JSON
    const parsed = JSON.parse(responseText);

    res.json({
      explanation: parsed.explanation || '',
      african_example: parsed.african_example || '',
      why_it_matters: parsed.why_it_matters || '',
      follow_ups: parsed.follow_ups || [],
      concept_id: concept_id
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

export default router;