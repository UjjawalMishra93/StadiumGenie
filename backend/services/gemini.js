import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

// ─── Named Constants ───────────────────────────────────────────────────────────

/** Maximum number of venue facts included in each system prompt (keeps tokens compact). */
const MAX_VENUE_FACTS_IN_PROMPT = 12;

/** Zone occupancy % at which a zone is considered high-crowd and included in the status block. */
const HIGH_CROWD_THRESHOLD_PCT = 75;

/** Zone occupancy % at which an alternative route warning is triggered in AI responses. */
const CRITICAL_CROWD_THRESHOLD_PCT = 85;

/** Target maximum response length communicated to the model (words). */
const MAX_RESPONSE_WORDS = 120;

/** Maximum number of chat log entries retained in memory. Prevents unbounded growth. */
const MAX_CHAT_LOGS = 500;

// ──────────────────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/** In-memory chat log for metrics collection (capped at MAX_CHAT_LOGS entries). */
export const chatLogs = [];

/**
 * Builds a compact, token-efficient system prompt grounded in real venue facts and live zone data.
 * Covers navigation, crowd management, accessibility, transport, sustainability, and multilingual support.
 *
 * @param {Array<object>} venueFacts - Static venue knowledge base entries.
 * @param {Array<object>} zoneStatuses - Live zone occupancy objects.
 * @param {string} [language='auto'] - Target reply language, or 'auto' for auto-detection.
 * @param {boolean} [accessibilityMode=false] - If true, enforces simplified language rules.
 * @returns {string} The complete system prompt string.
 */
export function buildSystemPrompt(venueFacts, zoneStatuses, language = 'auto', accessibilityMode = false) {
  const highCrowdZones = zoneStatuses
    .filter(z => z.occupancyPct > HIGH_CROWD_THRESHOLD_PCT)
    .map(z => `${z.name}: ${z.occupancyPct}% full${z.lastIncident ? ` (⚠️ ${z.lastIncident.message})` : ''}`)
    .join('; ');

  const venueContext = venueFacts
    .slice(0, MAX_VENUE_FACTS_IN_PROMPT)
    .map(f => `[${f.type.toUpperCase()}] ${f.name}: ${f.description}`)
    .join('\n');

  const accessNote = accessibilityMode
    ? 'Use short, simple sentences (max 15 words each). Avoid jargon. Be extra patient and clear.'
    : '';

  const langInstruction = language && language !== 'auto'
    ? `1. Always reply in the requested language: ${language}. Translate all facts and status info into ${language}.`
    : `1. Always reply in the SAME language the user writes in. Detect language automatically.`;

  return `You are StadiumGenie, the official AI concierge for FIFA World Cup 2026 stadiums.
Host venues: AT&T Stadium (Arlington TX), SoFi Stadium (Inglewood CA), MetLife Stadium (East Rutherford NJ).
Your role: help fans, volunteers, and venue staff with navigation, crowd info, accessibility, transport, and sustainability — in their own language.

RULES:
${langInstruction}
2. Ground your answers in the VENUE FACTS and LIVE STATUS below — do NOT hallucinate locations.
3. If a user asks about crowd: use LIVE STATUS. If a zone is >${CRITICAL_CROWD_THRESHOLD_PCT}% full, warn them and suggest an alternative.
4. For transport: always mention the metro/rail option first as the most sustainable choice. Include CO₂ context when relevant (metro emits ~14g CO₂/km vs ~192g for a car).
5. Keep answers focused and actionable (under ${MAX_RESPONSE_WORDS} words normally).
6. For volunteer/staff questions: provide clear, direct operational instructions.
${accessNote}

VENUE FACTS (${venueFacts.length} items — subset shown for brevity):
${venueContext}

LIVE ZONE STATUS (simulated, updated every ~8s):
${highCrowdZones || 'All zones at comfortable capacity.'}

Today's context: FIFA World Cup 2026 match day. Venue: AT&T Stadium, Arlington TX.`.trim();
}

/**
 * Streams a Gemini chat response to the Express `res` object via Server-Sent Events (SSE).
 * Logs performance metrics (latency, tokens) to `chatLogs` after completion.
 *
 * @param {object} params
 * @param {Array<{role: string, content: string}>} params.messages - Full conversation history.
 * @param {Array<object>} params.venueFacts - Static venue knowledge base.
 * @param {Array<object>} params.zoneStatuses - Live zone occupancy data.
 * @param {string} [params.language='auto'] - Target reply language.
 * @param {boolean} [params.accessibilityMode=false] - Whether to use simplified language.
 * @param {import('express').Response} params.res - Express response to write SSE chunks to.
 * @returns {Promise<{text: string, meta: object}>} The full response text and usage metadata.
 */
export async function streamChat({ messages, venueFacts, zoneStatuses, language = 'auto', accessibilityMode = false, res }) {
  const startTime = Date.now();
  const model = genAI.getGenerativeModel({
    model: config.modelName,
    systemInstruction: buildSystemPrompt(venueFacts, zoneStatuses, language, accessibilityMode),
  });

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastUserMessage = messages[messages.length - 1].content;

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastUserMessage);

  let fullText = '';
  let promptTokens = 0;
  let responseTokens = 0;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullText += text;
    res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
  }

  // Usage metadata
  const usage = (await result.response).usageMetadata;
  promptTokens = usage?.promptTokenCount || 0;
  responseTokens = usage?.candidatesTokenCount || 0;
  const latencyMs = Date.now() - startTime;

  // Log for metrics — cap to prevent unbounded memory growth
  chatLogs.push({
    id: `log_${Date.now()}`,
    promptTokens,
    responseTokens,
    latencyMs,
    language,
    timestamp: new Date().toISOString(),
  });
  if (chatLogs.length > MAX_CHAT_LOGS) {
    chatLogs.splice(0, chatLogs.length - MAX_CHAT_LOGS);
  }

  res.write(`data: ${JSON.stringify({ type: 'done', latencyMs, promptTokens, responseTokens })}\n\n`);
  res.end();

  return {
    text: fullText,
    meta: { latencyMs, promptTokens, responseTokens }
  };
}

/**
 * Generates a one-sentence AI crowd summary for the Ops Console dashboard.
 * Focuses on the highest-risk zone when any zone exceeds 80% occupancy.
 *
 * @param {Array<object>} zoneStatuses - Current zone occupancy data.
 * @returns {Promise<string>} A concise, action-oriented ops summary sentence.
 */
export async function generateCrowdSummary(zoneStatuses) {
  const model = genAI.getGenerativeModel({ model: config.modelName });
  const prompt = `You are an operations AI for a FIFA World Cup 2026 stadium. Given these crowd levels, write ONE concise action-oriented sentence (max 20 words) for the ops team. Focus on the highest-risk zone if any zone is above 80%.

Zone data: ${JSON.stringify(zoneStatuses.map(z => ({ name: z.name, pct: z.occupancyPct, incident: z.lastIncident?.message || null })))}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generates a multilingual public announcement for stadium broadcast systems.
 * Uses Gemini to translate and localize a staff-authored message.
 *
 * @param {object} params
 * @param {string} params.staffMessage - The original message in staff's language.
 * @param {string[]} [params.targetLanguages=['en','es','fr','ar']] - BCP-47 language codes to translate into.
 * @returns {Promise<Record<string, string>>} Map of language code → translated announcement.
 */
export async function generateBroadcast({ staffMessage, targetLanguages = ['en', 'es', 'fr', 'ar'] }) {
  const model = genAI.getGenerativeModel({ model: config.modelName });
  const prompt = `You are helping FIFA World Cup 2026 stadium staff draft a public announcement.
Staff message: "${staffMessage}"
Translate and localize this into the following languages: ${targetLanguages.join(', ')}.
Format your response as JSON: { "en": "...", "es": "...", "fr": "...", "ar": "..." }.
Keep each translation under 40 words. Professional and calm tone.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  // Try to parse JSON, fallback to raw text
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { en: text };
  } catch {
    return { en: text };
  }
}

/**
 * Generates a concise staff-facing brief for an accessibility assistance request.
 * Tells the volunteer exactly what action to take.
 *
 * @param {object} params
 * @param {string} params.category - Type of assistance needed (e.g. "Wheelchair Access").
 * @param {string} params.description - Fan's description of their need.
 * @param {string} params.location - Fan's current location in the stadium.
 * @returns {Promise<string>} A brief (≤30 words) operational instruction for the volunteer.
 */
export async function generateAssistBrief({ category, description, location }) {
  const model = genAI.getGenerativeModel({ model: config.modelName });
  const prompt = `A FIFA World Cup 2026 stadium fan has submitted an accessibility assistance request. Write a concise staff-facing brief (max 30 words) that tells the volunteer exactly what to do.
Category: ${category}
Description: ${description}
Location: ${location}
Output ONLY the brief text, no formatting.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
