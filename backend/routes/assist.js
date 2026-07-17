import express from 'express';
import { generateAssistBrief } from '../services/gemini.js';

const router = express.Router();

// In-memory store for demo (Firestore is the documented scale path)
const assistanceRequests = [];
let nextId = 1;

// GET /api/assist — list requests (for Ops Console)
router.get('/', (req, res) => {
  res.json({ requests: assistanceRequests });
});

// POST /api/assist — submit a new request (fan-facing)
router.post('/', async (req, res) => {
  try {
    const { category, description, location } = req.body;

    if (!category || !description || !location) {
      return res.status(400).json({ error: 'category, description, and location are required' });
    }

    const id = `req_${nextId++}`;
    const request = {
      id,
      category,
      description: description.slice(0, 500), // no PII beyond session scope
      location,
      status: 'open',
      createdAt: new Date().toISOString(),
      staffBrief: null,
    };

    // Generate staff brief with Gemini
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

// PATCH /api/assist/:id — update status (ops staff)
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['open', 'in-progress', 'resolved'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  const req_ = assistanceRequests.find(r => r.id === id);
  if (!req_) return res.status(404).json({ error: 'Request not found' });

  req_.status = status;
  res.json({ request: req_ });
});

export default router;
