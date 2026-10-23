// api/chat.js
import express from 'express';
import { buildPrompt } from '../prompts/assembler.js';
import { streamLLM } from '../lib/llm.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { question, concept_id = null } = req.body;

  // Validate BEFORE touching stream headers so a 400 still returns plain JSON.
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'invalid_request', message: 'question is required' });
  }

  // Stream headers. X-Accel-Buffering disables nginx buffering if you deploy behind one.
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (obj) => res.write(JSON.stringify(obj) + '\n');

  try {
    const prompt = buildPrompt({ question, concept_id });
    await streamLLM(prompt, (delta) => {
      send({ type: 'delta', text: delta });
    });
    send({ type: 'done', concept_id });
  } catch (err) {
    console.error('Chat error:', err);
    send({ type: 'error', message: err.message });
  } finally {
    res.end();
  }
});

export default router;