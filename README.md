# hackthon-task

NestJS starter for weekly hackathons: `GET /`, `GET /health`, ConfigModule, CORS, **`OpenaiService`**, and **brief → tickets** APIs:

- `POST /api/brief-tickets/analyze` — body `{ "requirements": "..." }` → either `clarifications_needed` or `tickets_ready`
- `POST /api/brief-tickets/finalize` — body `{ "requirements": "...", "clarificationAnswers": [{ "questionId": "...", "answer": "..." }] }` → `tickets_ready`

Set `OPENAI_API_KEY` in `.env`. Branch new work from `main`.
