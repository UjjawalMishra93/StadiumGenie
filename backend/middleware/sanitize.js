/**
 * Input sanitization middleware.
 * Strips/escapes HTML script tags from chat input to prevent XSS
 * when AI output is rendered in the browser.
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

function sanitizeString(str) {
  return str
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '[removed]')
    .replace(/<[^>]+>/g, '')   // strip any remaining HTML tags
    .replace(/javascript:/gi, '')
    .slice(0, 4000); // hard cap to prevent prompt injection via huge inputs
}
