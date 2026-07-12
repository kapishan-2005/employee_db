/**
 * AI Service
 *
 * Wraps calls to the Google Gemini API. Responsible only for talking
 * to the AI model — data fetching/formatting stays in the controller.
 *
 * Architecture:
 *   User Question -> Express API -> fetch MySQL context -> ai.service -> Gemini -> response
 */

import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';

const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/**
 * Send a prompt (with optional context data) to Gemini and return plain text.
 *
 * @param {string} systemInstruction - role/persona instructions for the AI
 * @param {string} userPrompt - the actual question / task
 * @returns {Promise<string>} AI-generated text
 */
export const askGemini = async (systemInstruction, userPrompt) => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(`${GEMINI_URL(GEMINI_MODEL)}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API returned no usable response');
  }

  return text.trim();
};

/**
 * Role-based system personas for the AI assistant.
 */
export const AI_PERSONAS = {
  ceo: `You are an AI business assistant for a company CEO. You analyze company-wide
workforce data (employees, departments, attendance) and provide concise, actionable
business insights and recommendations. Be direct, data-driven, and executive-level.
Keep answers short (3-6 sentences) unless asked for detail.`,

  admin: `You are an AI HR assistant. You help HR/Admin staff analyze employee attendance,
identify employees needing attention, assist with recruitment tasks, and generate HR
reports. Be practical and specific.`,

  manager: `You are an AI assistant for a team Manager. You help analyze team performance,
highlight workload or task issues, and suggest concrete improvements for the manager's
department/team. Keep it actionable.`,

  employee: `You are a helpful AI assistant for a company employee. You answer personal
questions about their own leave balance, attendance, and general company policies.
You do not have access to other employees' private data. Be friendly and concise.`,
};

export const getPersonaForRole = (role) => AI_PERSONAS[role] || AI_PERSONAS.employee;

export default { askGemini, AI_PERSONAS, getPersonaForRole };
