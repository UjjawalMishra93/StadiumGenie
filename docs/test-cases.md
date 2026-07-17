# StadiumGenie — Manual Test Cases

## Critical Path Tests

### TC-1: Multilingual Chat (Fan Concierge)
**Steps:**
1. Open Fan App → Concierge tab
2. Type: "Where is Gate C4?" (English)
3. Verify: AI responds in English with step-by-step navigation

**Expected:** Answer mentions Gate C, provides directions, references venue facts.

---

### TC-2: Hindi Language Detection
**Steps:**
1. Type: "मुझे सबसे नज़दीक accessible restroom चाहिए"
2. Verify: AI responds in Hindi

**Expected:** Response in Hindi describing accessible restroom location.

---

### TC-3: Crowd Level Query
**Steps:**
1. Wait for crowd map to load
2. Ask: "Is Zone 3 crowded right now?"
3. Verify: AI references simulated live data

**Expected:** AI gives a crowd level-based answer and suggests alternatives if busy.

---

### TC-4: Accessibility Mode Toggle
**Steps:**
1. Click "Accessibility" button in header
2. Verify: UI contrast increases, font size grows, button shows "Accessibility ON"
3. Send a chat message
4. Click "Listen" on an AI response

**Expected:** Text-to-speech reads the response aloud.

---

### TC-5: Assistance Request Flow
**Steps:**
1. Go to Assistance tab
2. Select "Wheelchair Access", fill location "Section 114"
3. Submit
4. Switch to Ops Console → Assistance Requests
5. Verify the request appears with an AI-generated staff brief

**Expected:** Request visible in Ops Console with Gemini-drafted brief.

---

### TC-6: Ops Broadcast
**Steps:**
1. Switch to Ops Console view
2. In Broadcast Box, enter: "Zone 3 is at 90% capacity — please use Gate D"
3. Select all 4 languages, click "Generate Broadcast"

**Expected:** 4 translations displayed (English, Spanish, French, Arabic).

---

### TC-7: Transport Advisor
**Steps:**
1. Go to Transport tab
2. Click "Get AI Recommendation"

**Expected:** AI suggests metro as most sustainable option with natural language reasoning.

---

### TC-8: Rate Limiting
**Steps:**
1. Send 21+ chat messages rapidly

**Expected:** Server returns 429 with a friendly error message after limit is reached.

---

### TC-9: API Key Not Exposed
**Steps:**
1. Open browser DevTools → Network tab
2. Inspect /api/chat request/response
3. Check localStorage, sessionStorage, JS bundle

**Expected:** GEMINI_API_KEY is NOT present anywhere in the client.

---

### TC-10: Keyboard Navigation
**Steps:**
1. Tab through all interactive elements without using mouse
2. Verify all buttons, tabs, inputs are reachable and have visible focus

**Expected:** Focus ring visible on every element, no keyboard traps.
