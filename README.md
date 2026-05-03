# Agentica — Unified Support Suite

A full-stack application combining a **Streaming Chat Interface** (Support Agent) and a **Help Desk Ticket Viewer with AI Summaries**, built with FastAPI, PostgreSQL, React + Vite, and Tailwind CSS v4.

---

## Quick Start

```bash
# 1. Copy and configure environment variables
cp .env.example .env
# Edit .env — set LLM_BASE_URL and LLM_API_KEY

# 2. Discover available model names via api.http (VS Code REST Client extension)
#    Open api.http and send the "Discover available LLM models" request.
#    Set LLM_MODEL= in .env to the model ID returned.

# 3. Start everything
# For local Postgres:
docker compose --profile local up --build

# For remote database (use DATABASE_URL from .env):
docker compose up --build
```

App is live at **http://localhost:3000**  
API is live at **http://localhost:8000**

---

## Architecture

### Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                          Browser                            │
└───┬─────────────────────────────────────────────────────────┘
    │
    │  GET /api/tickets[?status=…]
    │  GET /api/tickets/{id}
    ▼
┌─────────────────────────────────────────────────────────────┐
│                         FastAPI                             │
│                                                             │
│  GET /api/tickets*  ──► asyncpg ──────────────────────────► PostgreSQL
│                                                             │
│  GET /api/tickets/{id}/summary                              │
│  POST /api/chat         ──► httpx.AsyncClient.stream() ───► LLM API
│                                    │                        │
└────────────────────────────────────┼────────────────────────┘
                                     │
                     SSE frames (token by token)
                     data: {"content": "…"}
                     data: [DONE]
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Browser (streaming UI)                   │
│    TextDecoder + getReader() loop renders tokens live       │
└─────────────────────────────────────────────────────────────┘
```

### What happens if the LLM API is slow or drops mid-stream?

**Slow start (LLM takes >10s to begin responding):**  
The `httpx.Timeout(connect=10.0)` fires a `ConnectTimeout` exception. The SSE generator catches it, emits `data: {"error": "LLM API connection timed out (10s)"}` to the browser, and the frontend displays a toast notification.

**Mid-stream drop (connection breaks after first tokens):**  
`httpx` raises `RemoteProtocolError` or `ReadTimeout`. The generator first emits `data: {"error": "…"}` and then a final `data: [DONE]` from its `finally` block, so the browser's `getReader()` loop terminates cleanly. The frontend's `onError` handler sets an `error` field on the in-flight assistant message (preserving any partial content already received), and the "Stop" button transitions back to "Generate Summary". No zombie connections are left open.

**User cancels (clicks Stop):**  
`AbortController.abort()` is called on the browser side. The `fetch()` promise rejects with `DOMException('AbortError')`. The `useSSE` hook detects this specific error type and silently bails out — neither `onDone` nor `onError` fires. The "stopped" UI state is set up-front by `useChat.stop()`, which marks the active assistant message with `stoppedByUser: true` before aborting the stream. On the server side, FastAPI detects the client disconnect during the next `yield` and closes the generator.

---

## Discussion Questions

#### 1. AI Dev Stack

- **VS Code** + Gemini CLI + Claude Code CLI + Codex
- **Gemini 3.1 Pro** — created implementation plan from brief.
- **Claude Sonnet 4.6** — executed full-stack end-to-end (backend, frontend, SSE, Docker).
- **Codex GPT-5.5** — polish and edge case fixes.

#### 2. API Discovery

OpenAI-compatible API spec defines `GET /v1/models` for model listing. Response `id` field is used in every `/v1/chat/completions` call. Included `api.http` reproduces this.

#### 3. Database Schema & Scaling

**Current:** Single `tickets` table (`id`, `title`, `description`, `status`, `created_at`).

**For thousands of tickets:** Add full-text search index (tsvector + GIN), status index, cursor-based pagination, partitioning by date, read replicas.

#### 4. Credentials

**Now:** `LLM_BASE_URL` and `LLM_API_KEY` in `.env`, injected to Docker, never exposed to browser.

**Production:** some Secrets Manager, 30-day rotation, audit logging.

#### 5. State Management

Conversation history in `useState<ChatMessage[]>` inside `useChat` hook. Local state, no external store - LLM receives full history on every request, nothing to persist between sessions.

#### 6. Streaming Implementation

**Frontend:** SSE stream parsed using native `fetch` API + `response.body.getReader()` + `TextDecoder`. Manually processes `Uint8Array` chunks.

**Why this approach:** `EventSource` API only supports `GET` requests — can't POST conversation history as JSON. There are also nice libs like: `eventsource` but the syntax will not change dramatically.
**Alternatives:** WebSockets would enable bidirectional streaming and lower latency, but add complexity (connection lifecycle management, reconnection logic). SSE is simpler, HTTP-friendly, and sufficient for one-directional LLM responses.

#### 7. Tradeoffs

**With another 3 (x 2) hours, I would add:**

- **Testing:** Unit tests (pytest, vitest), integration tests (pytest-asyncio), E2E tests (Playwright).
- **Backend:** Cache ticket summaries in DB. Set `max_tokens` limits to control spend. Add database indexes on `status` and `created_at` to eliminate table-scans. Replace `print()` with `structlog` for structured logging in production. If needed: Migrate to ORM (SQLModel or SQLAlchemy 2.0+ async + Pydantic) for type safety and SQL injection prevention. Add OpenAPI documentation (Swagger/Scalar/Redoc).
- **Frontend:** Add React error boundaries to catch render crashes. Implement lazy-load chat history to prevent 100+ message conversations from bloating memory. Integrate TanStack Query for REST caching/refetching. Build a design system with atomic components (inputs, buttons) via Storybook or similar.

#### 8. Security & Production Notes

Why proxy LLM through backend: API key, base url stays server-side; rate limiting enforced; CORS respected.

#### 9. Time Spent

~1 hour planning both assignments into one architecture. ~1.5 hours implementation + Codex polish. ~30 minutes README. **Total: ~3 hours.** Planning was longer because merging two briefs into one coherent stack (Docker Compose, shared streaming behaviour, unified sidebar) required upfront design.

---

## API Reference

| Method | Endpoint                    | Description                                                      |
| ------ | --------------------------- | ---------------------------------------------------------------- |
| `GET`  | `/api/tickets`              | List all tickets. Supports `?status=open\|in_progress\|resolved` |
| `GET`  | `/api/tickets/{id}`         | Get a single ticket by ID                                        |
| `GET`  | `/api/tickets/{id}/summary` | SSE stream: AI-generated summary                                 |
| `POST` | `/api/chat`                 | SSE stream: conversational support agent                         |
| `GET`  | `/health`                   | Health check                                                     |

---

## API Testing

- **VS Code:** Use the included `api.http` file with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension. Variables are read automatically from `.env`.

- **Cursor/JetBrains:** Use built-in HTTP client or Thunder Client extension.

---
