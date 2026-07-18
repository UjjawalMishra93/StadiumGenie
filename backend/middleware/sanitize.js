/** Hard character cap on any single message to prevent prompt injection via huge inputs. */
const MAX_INPUT_LENGTH = 4000;

/**
 * Strips HTML tags, script blocks, and javascript: URIs from a raw string.
 * Caps output length at `MAX_INPUT_LENGTH` characters.
 *
 * Exported separately so it can be unit-tested in isolation.
 *
 * @param {string} str - Raw user-provided string.
 * @returns {string} Sanitized string safe to include in AI prompts.
 */
export function sanitizeString(str) {
  return str
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '[removed]')
    .replace(/<[^>]+>/g, '')        // strip any remaining HTML tags
    .replace(/javascript:/gi, '')
    .slice(0, MAX_INPUT_LENGTH);
}

/**
 * Express middleware that sanitizes all message content strings in `req.body.messages`.
 * Prevents XSS and prompt injection attacks from fan-facing chat input.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function sanitizeChatInput(req, res, next) {
  if (req.body && req.body.messages && Array.isArray(req.body.messages)) {
    req.body.messages = req.body.messages.map(msg => ({
      ...msg,
      content: typeof msg.content === 'string' ? sanitizeString(msg.content) : msg.content,
    }));
  }
  next();
}
