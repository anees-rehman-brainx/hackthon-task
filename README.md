# hackthon-task

NestJS API for **AI-assisted client brief → plain developer tickets**: analyze a requirements string, optionally collect clarifications, then return structured tickets (no Jira integration).

**Repository:** https://github.com/anees-rehman-brainx/hackthon-task  
**Active development branch:** `hackthon-2-may-13-2026`

## Setup

1. Copy **`.env.example`** to **`.env`** and set **`OPENAI_API_KEY`** (optional: `OPENAI_MODEL`, `PORT`, `CORS_ORIGIN`).
2. `npm install` then `npm run dev` (or `npm run build` && `npm start`). Default port **5000**.

## HTTP API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API stub message |
| `GET` | `/health` | Liveness + `openaiConfigured` |
| `POST` | `/api/brief-tickets/analyze` | Body `{ "requirements": "..." }` → `clarifications_needed` **or** `tickets_ready` |
| `POST` | `/api/brief-tickets/finalize` | Body `{ "requirements": "...", "clarificationAnswers": [{ "questionId", "answer" }] }` → `tickets_ready` |

Global **`ValidationPipe`** validates DTOs; model output is checked with **Zod** (see `src/brief-tickets/`).

## Frontend (pair repo)

**https://github.com/anees-rehman-brainx/hackathon-task-frontend** — same branch name for coordinated work.

## Docs

- **`docs/CHAT_HISTORY.md`** — session / decision log  
- **`docs/AI_CLIENT_BRIEF_TO_JIRA_UNDERSTANDING.md`** — product and implementation notes (plain tickets, flows)

Branch new work from `main` unless coordinating with the hackathon branch above.
