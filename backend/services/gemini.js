import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// Chat logs for metrics (in-memory for demo)
export const chatLogs = [];

/**
 * Build a compact system prompt with grounding context.
 * Keeps prompt tokens minimal by summarizing zone status.
 */
export function buildSystemPrompt(venueFacts, zoneStatuses, language = 'auto', accessibilityMode = false) {
  const highCrowdZones = zoneStatuses
    .filter(z => z.occupancyPct > 75)
    .map(z => `${z.name}: ${z.occupancyPct}% full${z.lastIncident ? ` (⚠️ ${z.lastIncident.message})` : ''}`)
    .join('; ');

  const venueContext = venueFacts
    .slice(0, 12) // keep prompt compact
    .map(f => `[${f.type.toUpperCase()}] ${f.name}: ${f.description}`)
    .join('\n');

  const accessNote = accessibilityMode
    ? 'Use short, simple sentences (max 15 words each). Avoid jargon. Be extra patient and clear.'
    : '';

  const langInstruction = language && language !== 'auto'
    ? `1. Always reply in the requested language: ${language}. Translate all facts and status info into ${language}.`
    : `1. Always reply in the SAME language the user writes in. Detect language automatically.`;

  return `You are StadiumGenie, the official AI concierge for FIFA World Cup 2026 stadiums (AT&T Stadium, SoFi Stadium, MetLife Stadium).
Your role: help fans with navigation, crowd info, accessibility, and transport — in their own language.

RULES:
${langInstruction}
2. Ground your answers in the VENUE FACTS and LIVE STATUS below — do NOT hallucinate locations.
3. If a user asks about crowd: use LIVE STATUS. If a zone is >85% full, warn them and suggest an alternative.
4. For transport: mention metro as the most sustainable option when relevant.
5. Keep answers focused and actionable (under 120 words normally).
${accessNote}

VENUE FACTS (${venueFacts.length} items — subset shown for brevity):
${venueContext}

LIVE ZONE STATUS (simulated, updated every ~8s):
${highCrowdZones || 'All zones at comfortable capacity.'}

Today's context: FIFA World Cup 2026 match day. Venue: AT&T Stadium, Arlington TX.`.trim();
}

/**
 * Stream a chat response via SSE.
 * Writes chunks to `res` (Express response) as 'data: ...\n\n'.
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

  // Log for metrics
  chatLogs.push({
    id: `log_${Date.now()}`,
    promptTokens,
    responseTokens,
    latencyMs,
    language,
    timestamp: new Date().toISOString(),
  });

  res.write(`data: ${JSON.stringify({ type: 'done', latencyMs, promptTokens, responseTokens })}\n\n`);
  res.end();

  return {
    text: fullText,
    meta: { latencyMs, promptTokens, responseTokens }
  };
}

/**
 * Generate a one-time crowd summary for the Ops Console.
 */
export async function generateCrowdSummary(zoneStatuses) {
  const model = genAI.getGenerativeModel({ model: config.modelName });
  const prompt = `You are an operations AI for a FIFA World Cup 2026 stadium. Given these crowd levels, write ONE concise action-oriented sentence (max 20 words) for the ops team. Focus on the highest-risk zone if any zone is above 80%.

Zone data: ${JSON.stringify(zoneStatuses.map(z => ({ name: z.name, pct: z.occupancyPct, incident: z.lastIncident?.message || null })))}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate a multilingual broadcast announcement.
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
 * Generate a staff-facing brief for an assistance request.
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
