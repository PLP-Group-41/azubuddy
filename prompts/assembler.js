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

export function buildPrompt({ question, concept_id }) {
  let conceptNote = '';
  if (concept_id) {
    const conceptPath = path.join(ROOT, 'concepts', `${concept_id}.json`);
    if (fs.existsSync(conceptPath)) {
      conceptNote = fs.readFileSync(conceptPath, 'utf-8');
    } else {
      conceptNote = `No curated note for "${concept_id}". Explain based on skills outline only.`;
    }
  } else {
    conceptNote = '(no concept_id; answer from skills outline, suggest picking a concept)';
  }

  return [
    '=== SYSTEM ===',
    SYSTEM_PROMPT,
    '=== RULES ===',
    RULES_PROMPT,
    '=== GROUNDING: AZ-900 SKILLS OUTLINE ===',
    JSON.stringify(skillsOutline, null, 2),
    '=== GROUNDING: CONCEPT NOTE ===',
    conceptNote,
    '=== LEARNER QUESTION ===',
    question,
    '=== OUTPUT FORMAT ===',
    'Respond with a JSON object only. Do not include markdown fences or any text outside the JSON object with these keys:',
    '{\n  "explanation": "2-3 sentences, no jargon",',
    '  "african_example": "1-2 sentences using a real African example",',
    '  "why_it_matters": "1 sentence",',
    '  "follow_ups": ["2-3 suggested next questions"]\n}'
  ].join('\n');
}