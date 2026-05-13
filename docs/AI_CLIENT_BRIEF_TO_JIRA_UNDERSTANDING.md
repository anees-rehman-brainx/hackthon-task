# AI Client Brief → Developer Tickets — Codebase & Requirements Understanding

This document captures the **current state** of `hackathon-task-backend` and `hackathon-task-frontend`, how **OpenAI** is wired today, and how that maps to the **PMO brief-to-plain-tickets** task. **Jira / external ticket-system integration is out of scope for now** — output is **plain, dev-ready tickets** (structured text/JSON for display and export). Use this file as the baseline and **implementation checklist** (coding not started until explicitly approved).

---

## 1. Repository layout

| Area | Path | Role |
|------|------|------|
| Backend API | `hackathon-task-backend/` | NestJS 11, Express, global `ConfigModule`, `OpenaiModule` / `OpenaiService`, minimal HTTP surface |
| Frontend UI | `hackathon-task-frontend/` | React 19 + Vite 8, Axios `httpClient`, dev proxy to backend |

There is **no shared monorepo**; the two folders are independent projects (each can have its own git root).

---

## 2. Backend (`hackathon-task-backend`)

### 2.1 Stack and entry

- **Framework:** NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- **Config:** `@nestjs/config` — `ConfigModule.forRoot` is **global**, loads `.env` from `join(__dirname, "..", ".env")` unless `DOTENV_CONFIG_PATH` overrides
- **Entry:** `src/main.ts` — `NestExpressApplication`, **custom body parser:** `bodyParser: false` then `app.use(json({ limit: "1mb" }))` (relevant if you add large payloads or raw body needs later)
- **Port:** `PORT` from env, default **5000**
- **CORS:** `CORS_ORIGIN` trimmed → if set, that single origin; else `{ origin: true }` (permissive in dev)

### 2.2 HTTP API today

| Method | Path | Behavior |
|--------|------|------------|
| `GET` | `/` | JSON: `{ message, docs: "/health" }` |
| `GET` | `/health` | JSON: `{ ok, env, openaiConfigured }` — `openaiConfigured` is true iff `OPENAI_API_KEY` is non-empty after trim |

**No authentication**, no guards, no users — aligned with the task note that auth is not required.

### 2.3 Modules

- **`AppModule`:** imports `ConfigModule`, `OpenaiModule`, registers `AppController`
- **`OpenaiModule`:** `@Global()`, provides and exports **`OpenaiService`** so future feature modules can inject it without re-importing the module

### 2.4 OpenAI integration (`src/openai/openai.service.ts`)

**Environment**

- `OPENAI_API_KEY` — required for any call that uses the client; missing → `503` with `{ error, code: "OPENAI_NOT_CONFIGURED" }`
- `OPENAI_MODEL` — optional, default **`gpt-4.1-preview`**

**Client lifecycle**

- Lazy singleton: first successful key read creates `new OpenAI({ apiKey })`

**Public API surface for features**

- **`createChatJsonCompletion({ system, user, meta? })`** → `Promise<Record<string, unknown>>`
  - Uses **chat completions** with `response_format: { type: "json_object" }` (forces JSON object in the API contract sense)
  - `temperature: 0.3`
  - Maps `OpenAI.APIError` to `HttpException` with upstream status when in 4xx–5xx range, else `502`
  - Empty content → `502` + `OPENAI_EMPTY_RESPONSE`
  - Non-parseable JSON → `502` + `OPENAI_INVALID_JSON`
  - Logs phase (from `meta.phase` or `"chat"`), timing, token usage, and user payload length

**Implication for the new feature:** any “brief → structured tickets” flow can **reuse** this method for structured LLM output, but you will want **explicit Zod (or similar) validation** and/or a **JSON Schema** in the prompt plus post-parse validation — the service only guarantees “some JSON object,” not shape.

### 2.5 Dependencies (backend)

- Runtime: `openai` **^6.34.0**, `rxjs`, `reflect-metadata`
- No Jira SDK, no queue, no DB in `package.json` today — anything persistent or Jira-specific is **greenfield** unless added later.

---

## 3. Frontend (`hackathon-task-frontend`)

### 3.1 Stack

- React 19, Vite 8, ESLint 9, Axios

### 3.2 API wiring

- **`src/config/env.js` — `getApiBaseUrl()`**
  - If `VITE_API_BASE_URL` is set (no trailing slash), Axios uses that origin (browser talks directly to API; backend CORS must allow the Vite origin)
  - In **dev** with unset base URL: **empty string** → same-origin requests to the Vite dev server
  - In **prod** build with unset base: falls back to `http://127.0.0.1:5000` (fine for local prod preview; real deploy should set `VITE_API_BASE_URL`)

- **`vite.config.js`**
  - Proxies **`/api`** and **`/health`** to `VITE_PROXY_TARGET` or default `http://127.0.0.1:5000`
  - Note: `httpClient` has **no `/api` prefix** in current `App.jsx` (`get("/health")`), so health hits the proxy as `/health` ✓. Future Nest routes under a global prefix (e.g. `/api`) should stay consistent between Vite proxy rules and `httpClient` paths.

- **`httpClient`:** 120s timeout, `Content-Type: application/json` — suitable for longer LLM-backed requests once those endpoints exist.

### 3.3 UI today

- **`App.jsx`:** on mount, `GET /health`, shows JSON or error — **starter only**; no brief form or ticket UI yet.

---

## 4. Original task requirements (interpreted)

**Product goal:** PMO-oriented tool that turns **raw, unstructured client briefs** into clear **developer-ready task breakdowns** and **generated tickets** (original wording referenced Jira-style clarity; **delivery is plain tickets**, not Jira API).

**Constraints**

- **No authentication** in scope.
- **No silent assumptions** — prefer **clarifying questions** and explicit gaps over invented scope.

**Evaluation:** quality of AI interaction, prompts, and outputs over feature count.

---

## 5. Agreed scope after review (authoritative for implementation)

| Topic | Decision |
|--------|----------|
| Ticket destination | **Plain tickets only** — human-readable + structured payload for UI (e.g. title, description, acceptance criteria). **No Jira (or other) integration** in this phase. |
| Primary input | **Text area** for project requirements on the UI — **clean, error-free module**. |
| File upload | **PDF upload** — acknowledged; **implement later** (placeholder UI optional; no backend PDF pipeline until then). |
| Backend shape | **NestJS modules** with dedicated **controller(s)** and **service(s)** (not fat controllers). |
| AI layer | Requirements sent to **`OpenaiService`** behind prompts that **match** the no-assumptions / PMO rules. |
| Clarification loop | Model may respond with **clarifications needed** OR **tickets ready**. If clarifications: return to UI → user answers → **second request** includes **original requirements + Q&A** so the model has full context for **final plain tickets**. |

**Engineering expectations (non-functional)**

- Backend: Nest **best practices** (DTOs, validation pipe, thin controllers, testable services, clear module boundaries).
- Frontend: **Reusable components**, sensible **folder structure**, consistent error/loading handling, accessible forms.

---

## 6. User scenarios & flows (planning)

### Scenario A — Single pass (brief is sufficient)

1. User enters requirements in the text area and submits.
2. Backend runs the “analyze / generate” pipeline with OpenAI.
3. Model returns **`outcome: tickets`** (or equivalent) with a list of **plain developer tickets** + optional metadata (e.g. assumptions explicitly stated as such, or none).
4. UI renders tickets (cards/list), with copy/export affordances.

### Scenario B — Clarifications required

1. Same as A.1–A.2.
2. Model returns **`outcome: clarifications`** with a **bounded list of questions** (each question stable enough to map answers back — e.g. `id` + `question` string).
3. UI switches to a **clarification step**: user answers each question (text fields or textarea per question).
4. User submits **answers**; frontend sends **original requirements + structured Q&A** (and optionally the same `sessionId` if you add server-side session later).
5. Backend calls OpenAI again with a **“finalize tickets”** prompt using the **full** context.
6. UI shows **final plain tickets**; user can reset or edit locally if needed.

### Scenario C — PDF upload (later)

1. UI: file picker + upload control (disabled or “Coming soon” until implemented).
2. Backend: extract text from PDF (library choice TBD), merge with or replace textarea content, then same as A/B.
3. **Out of scope for the first coding milestone** unless explicitly pulled in.

### Scenario D — Errors & edge cases (must be designed in)

- Empty or whitespace-only brief → **400** with clear message; UI disables submit or shows inline validation.
- OpenAI missing / failing → **consistent error shape**; UI shows non-technical friendly message + optional “retry”.
- Model returns invalid JSON vs schema → **502/422** with logging; UI: “Something went wrong, try again.”
- Payload size → respect `main.ts` **1mb** JSON limit; document max characters for textarea.

---

## 7. Gap analysis: current codebase vs agreed scope

| Need | Today |
|------|--------|
| LLM access with JSON-shaped responses | ✅ `OpenaiService.createChatJsonCompletion` |
| Domain prompts + response contract + validation | ❌ To add |
| HTTP API for brief → clarifications OR tickets | ❌ To add |
| UI module: textarea, validation, states, ticket display | ❌ To add |
| Clarification Q&A step + second API call | ❌ To add |
| PDF pipeline | ❌ Deferred |
| Jira / external integrations | ❌ Explicitly **not** in this phase |
| Persistence | ❌ Optional later (state can live client-side for v1) |
| Auth | ❌ Correctly absent |

---

## 8. Implementation plan — step-by-step tasks (do in order)

Use this as the **sprint checklist**. Adjust numbering if parallelizing frontend/backend.

### Phase 0 — Contracts & conventions (no UI polish yet)

1. **Define the JSON contract** for both API responses (enums/strings, not free-form):
   - **Analyze / generate** response: discriminated union e.g. `{ outcome: "clarifications_needed", questions: [{ id, question }] }` **or** `{ outcome: "tickets_ready", tickets: [...], notes?: ... }`.
   - **Finalize** request: `{ requirements: string, clarificationAnswers: [{ questionId, answer: string }] }` (or array of strings if IDs are index-based — prefer stable IDs).
2. **Define the plain ticket object**: fields PMO/devs care about (e.g. `title`, `description`, `acceptanceCriteria[]`, `dependencies[]`, `priority?`, `labels?`) — only optional fields if the prompt allows “unknown”.
3. **Align URL prefix** with Vite: e.g. Nest global prefix `/api` and frontend `httpClient` base paths `/api/...`; confirm `vite.config.js` proxy still matches.
4. **Add validation library** on the backend if not present (e.g. `class-validator` + `class-transformer`, or Zod) — validate **inbound** DTOs and optionally **outbound** parsed LLM JSON before responding.

### Phase 1 — Backend feature module

5. Create **`BriefTicketsModule`** (name TBD) folder: `brief-tickets/` or `requirements/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`.
6. **`BriefTicketsService`**:
   - Inject `OpenaiService`.
   - Private methods: `buildSystemPromptAnalyze()`, `buildUserPayloadAnalyze()`, `buildSystemPromptFinalize()`, `buildUserPayloadFinalize()` — keep prompts **versionable** (constants or dedicated `prompts/` files).
   - Map `createChatJsonCompletion` result through **validators**; on mismatch throw controlled HTTP errors.
7. **`BriefTicketsController`**:
   - `POST /api/brief-tickets/analyze` (name TBD) — body: `{ requirements: string }`.
   - `POST /api/brief-tickets/finalize` — body: finalize contract from step 1.
8. **`AppModule`**: import the new module; **do not** put business logic in `AppController`.
9. **Logging**: log phase + duration (already partially in OpenAI service); avoid logging full user brief in production if sensitive — or document that logs may contain PII.

### Phase 2 — Prompts & “no assumptions” behavior

10. **Analyze prompt**: instruct model to return **only** the JSON schema; if ambiguity exists, prefer **`clarifications_needed`** with **specific, answerable questions** (not generic “tell me more”).
11. **Finalize prompt**: include verbatim **requirements** + **Q&A**; instruct to output **tickets_ready** only (or allow one more round later — v1: single finalize).
12. **Temperature / model**: keep low temperature for consistency; document `OPENAI_MODEL` override for evaluators.

### Phase 3 — Frontend architecture & UX

13. **Folder structure** (example): `src/features/brief-to-tickets/` with `components/` (`RequirementsForm`, `ClarificationForm`, `TicketList`, `ErrorBanner`, `LoadingState`), `api/briefTickets.js`, `hooks/useBriefAnalysis.js`.
14. **Requirements module**: textarea with character count / max length, submit button, disabled states, accessible labels (`aria-*`), keyboard submit.
15. **Wire `POST` analyze**: loading spinner/skeleton; map API discriminated response to UI state (`clarifications` vs `tickets`).
16. **Clarification step**: render questions; validate non-empty answers (or explicitly allow “unknown” per field if product wants it — decide in contract).
17. **Wire `POST` finalize**: then render **TicketList** as reusable cards.
18. **Errors**: parse Axios errors; show **user-friendly** messages; preserve draft text on failure.
19. **Health / dev**: keep or shrink the health debug panel for developers only (optional env flag) so the PMO screen stays clean.

### Phase 4 — Quality & hardening

20. **Backend e2e or unit tests** for DTO validation and happy-path mocked OpenAI (optional but strong signal for “clean / best practices”).
21. **Manual test matrix**: empty brief, very long brief, OpenAI down, clarifications path, direct tickets path, double-submit race (disable button while pending).
22. **Update `.env.example`** / README snippets for new routes and limits.

### Phase 5 — PDF (later)

23. Add multipart upload endpoint + PDF text extraction service + merge strategy with textarea.
24. UI: upload control, progress, file-type validation, error states.

---

## 9. Suggestions — UI/UX and product (optional improvements)

**UI/UX**

- **Progress indicator**: steps “Requirements → Clarifications (if needed) → Tickets” so users never feel lost.
- **Autosave draft** to `localStorage` so a refresh does not wipe a long brief.
- **Copy all tickets as Markdown** and **Download `.md` or `.json`** for handoff to any tool (including Jira paste later).
- **Collapsible “What we sent to the AI”** (advanced) for transparency without cluttering the default view.
- **Skeleton loaders** instead of only spinners for perceived performance.
- **Focus management**: move focus to first error or first clarification field on step change (a11y).

**Product / feature**

- **Editable tickets** in the UI before export (local edits only).
- **Regenerate** with a short “what to change” note (second finalize — optional, watch token cost).
- **Ticket templates** per project type (web app, API-only, mobile) via a dropdown influencing the prompt.
- **Rate limiting** on public deployments (no auth) to prevent abuse — future hardening.
- **Session id + server cache** if you later need audit trail without full auth (still optional).

---

## 10. Environment checklist (from code)

**Backend `.env` (typical)**

- `OPENAI_API_KEY` — required for AI features
- `OPENAI_MODEL` — optional
- `PORT` — optional (default 5000)
- `CORS_ORIGIN` — optional (restrict CORS when frontend is on another origin without proxy)
- `NODE_ENV` — optional
- `DOTENV_CONFIG_PATH` — optional override for env file location

**Frontend**

- `VITE_API_BASE_URL` — optional; see `env.js`
- `VITE_PROXY_TARGET` — optional; see `vite.config.js`

---

## 11. Code-review graph note

The workspace **code-review-graph** MCP was consulted first; for these two repo paths the graph reported **0 files / 0 nodes** (graph not built or not registered for this workspace path). This document is therefore based on **direct reading** of application source under `src/` and config files, not on graph-derived call graphs.

---

## 12. After the plan — when you are ready to code

1. Confirm the **JSON contract** names (`outcome` values, field names for tickets and questions) and whether **one or two** HTTP endpoints are enough for v1 (`analyze` + `finalize` as above).
2. Execute **Section 8 (Implementation plan)** in phase order; treat **Section 9 (Suggestions)** as a backlog, not blockers for v1.
3. Optionally register repos and run **`build_or_update_graph`** so code-review-graph can support impact analysis on the new modules.

---

*Agreed scope: plain tickets, no Jira integration in this phase; PDF deferred. Update this file as decisions land.*
