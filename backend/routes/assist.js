import express from 'express';
import { generateAssistBrief } from '../services/gemini.js';

// ─── Named Constants ───────────────────────────────────────────────────────────

/** Prefix for all assistance request IDs. */
const ASSIST_ID_PREFIX = 'req_';

/** Maximum character length for fan-provided descriptions (PII boundary). */
const MAX_DESCRIPTION_LENGTH = 500;

/** Allowed status values for assistance request lifecycle. */
const VALID_STATUSES = ['open', 'in-progress', 'resolved'];

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
    const { category, description, location } = req.body;

    if (!category || !description || !location) {
      return res.status(400).json({ error: 'category, description, and location are required' });
    }

    const id = `${ASSIST_ID_PREFIX}${nextId++}`;
    const request = {
      id,
      category,
      description: description.slice(0, MAX_DESCRIPTION_LENGTH), // no PII beyond session scope
      location,
      status: 'open',
      createdAt: new Date().toISOString(),
      staffBrief: null,
    };

    // Generate staff brief with Gemini; fallback to a formatted plain-text brief
    try {
      request.staffBrief = await generateAssistBrief({ category, description, location });
    } catch {
      request.staffBrief = `${category} needed at ${location}. Fan note: ${description.slice(0, 60)}`;
    }

    assistanceRequests.unshift(request); // newest first
    res.status(201).json({ request });
  } catch (err) {
    console.error('[/api/assist]', err.message);
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
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const found = assistanceRequests.find(r => r.id === id);
  if (!found) return res.status(404).json({ error: 'Request not found' });

  found.status = status;
  res.json({ request: found });
});

export default router;
