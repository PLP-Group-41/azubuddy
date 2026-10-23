// prompts/assembler.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SYSTEM_PROMPT } from './system.js';
import { RULES_PROMPT } from './rules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const skillsOutline = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'skills-outline.json'), 'utf-8')
);

// Pre-compute once at module load: one line per domain, no subtopics.
// Keeps the prompt short -> faster time-to-first-token.
const SKILLS_SUMMARY = skillsOutline.domains
  .map(d => `- ${d.name} (${d.weight})`)
  .join('\n');

export function buildPrompt({ question, concept_id }) {
  let conceptNote = '';

  if (concept_id) {
    const conceptPath = path.join(ROOT, 'concepts', `${concept_id}.json`);
    if (fs.existsSync(conceptPath)) {
      conceptNote = fs.readFileSync(conceptPath, 'utf-8');
    } else {
      conceptNote = `No curated note for "${concept_id}". Explain using the skills summary only.`;
    }
  } else {
    conceptNote = '(no concept_id; answer from the skills summary, and suggest picking a concept)';
  }

  return [
    '=== SYSTEM ===',
    SYSTEM_PROMPT,
    '=== RULES ===',
    RULES_PROMPT,
    '=== GROUNDING: AZ-900 DOMAINS (SUMMARY) ===',
    SKILLS_SUMMARY,
    '=== GROUNDING: CONCEPT NOTE ===',
    conceptNote,
    '=== LEARNER QUESTION ===',
    question,
    '=== OUTPUT FORMAT ===',
    'Respond with a single JSON object only. No markdown fences, no prose outside JSON. Keys in this order:',
    '{"explanation":"2-3 sentences, no jargon","african_example":"1-2 sentences, real African example","why_it_matters":"1 sentence","follow_ups":["question 1","question 2","question 3"]}'
  ].join('\n');
}