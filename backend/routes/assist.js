import express from 'express';
import { generateAssistBrief } from '../services/gemini.js';
import { AssistRequestSchema, AssistStatusSchema, validate } from '../config/schemas.js';
import { logger } from '../config/logger.js';

// ─── Named Constants ───────────────────────────────────────────────────────────

/** Prefix for all assistance request IDs. */
const ASSIST_ID_PREFIX = 'req_';

/** Maximum character length for fan-provided descriptions (PII boundary). */
const MAX_DESCRIPTION_LENGTH = 500;

// ──────────────────────────────────────────────────────────────────────────────

const router = express.Router();

/** In-memory store for demo (Firestore is the documented scale path). */
const assistanceRequests = [];
let nextId = 1;

/**
 * GET /api/assist
 * Lists all assistance requests (newest first). Used by Ops Console and volunteers.
 */
router.get('/', (req, res) => {
  res.json({ requests: assistanceRequests });
});

/**
 * POST /api/assist
 * Submits a new accessibility assistance request from a fan.
 * Generates a volunteer-facing AI brief via Gemini with a graceful fallback.
 */
router.post('/', async (req, res) => {
  try {
    const parsed = validate(AssistRequestSchema, req.body);
    if (!parsed.success) {
      logger.warn({ errors: parsed.errors }, 'Invalid assist request body');
      return res.status(400).json({ error: parsed.errors.join('; ') });
    }
    const { category, description, location } = parsed.data;

    const id = `${ASSIST_ID_PREFIX}${nextId++}`;
    const request = {
      id,
      category,
      description: description.slice(0, MAX_DESCRIPTION_LENGTH),
      location,
      status: 'open',
      createdAt: new Date().toISOString(),
      staffBrief: null,
    };

    try {
      request.staffBrief = await generateAssistBrief({ category, description, location });
      logger.info({ id, category, location }, 'Assistance request created with AI brief');
    } catch (briefErr) {
      logger.warn({ id, err: briefErr.message }, 'Gemini brief generation failed — using fallback');
      request.staffBrief = `${category} needed at ${location}. Fan note: ${description.slice(0, 60)}`;
    }

    assistanceRequests.unshift(request);
    res.status(201).json({ request });
  } catch (err) {
    logger.error({ err: err.message }, 'Error in POST /api/assist');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/assist/:id
 * Updates the status of an existing assistance request.
 * Used by ops staff and volunteers to track request resolution.
 */
router.patch('/:id', (req, res) => {
  const { id } = req.params;

  const parsed = validate(AssistStatusSchema, req.body);
  if (!parsed.success) {
    logger.warn({ errors: parsed.errors, id }, 'Invalid status in PATCH /api/assist');
    return res.status(400).json({ error: parsed.errors.join('; ') });
  }

  const found = assistanceRequests.find(r => r.id === id);
  if (!found) { return res.status(404).json({ error: 'Request not found' }); }

  found.status = parsed.data.status;
  logger.info({ id, status: found.status }, 'Assistance request status updated');
  res.json({ request: found });
});

export default router;
