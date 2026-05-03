import json
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from dotenv import load_dotenv

load_dotenv()

import asyncpg
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} environment variable is required")
    return value


DB_DSN = _required_env("DATABASE_URL")
LLM_BASE_URL = _required_env("LLM_BASE_URL")
LLM_API_KEY = _required_env("LLM_API_KEY")
LLM_MODEL = _required_env("LLM_MODEL")
ALLOWED_ORIGINS = _required_env("ALLOWED_ORIGINS")


def _openai_url(path: str) -> str:
    base_url = LLM_BASE_URL.rstrip("/")
    if not base_url.endswith("/v1"):
        base_url = f"{base_url}/v1"
    return f"{base_url}/{path.lstrip('/')}"


# ---------------------------------------------------------------------------
# Database pool (module-level so lifespan can assign it)
# ---------------------------------------------------------------------------
db_pool: asyncpg.Pool | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_pool = await asyncpg.create_pool(DB_DSN, min_size=2, max_size=10)
    print("✓ Database connected")
    yield
    await db_pool.close()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="HelpDesk API", version="1.0.0", lifespan=lifespan)

_ALLOWED_ORIGINS = [
    o.strip()
    for o in ALLOWED_ORIGINS.split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


# ---------------------------------------------------------------------------
# SSE streaming proxy — the core engine
# ---------------------------------------------------------------------------
async def _stream_llm(
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    """
    Proxies a streaming chat completion request to the LLM API.

    Uses httpx.AsyncClient with iter_lines() to receive tokens one by one
    without buffering. Each token is re-emitted as an SSE data frame.

    Timeout strategy:
      - connect_timeout=10s  → fails fast if LLM is unreachable
      - read_timeout=60s     → allows slow but alive streams
    """
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": LLM_MODEL,
        "messages": messages,
        "stream": True,
    }

    timeout = httpx.Timeout(connect=10.0, read=60.0, write=10.0, pool=5.0)
    done_sent = False

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                _openai_url("chat/completions"),
                headers=headers,
                json=payload,
            ) as response:
                if response.status_code == 401:
                    yield f"data: {json.dumps({'error': 'LLM API: 401 Unauthorized'})}\n\n"
                    return
                if response.status_code != 200:
                    yield (
                        f"data: {json.dumps({'error': f'LLM API error {response.status_code}'})}\n\n"
                    )
                    return

                # Stream raw bytes, decode per SSE line — no buffering
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        done_sent = True
                        yield "data: [DONE]\n\n"
                        return
                    try:
                        obj = json.loads(data)
                        delta = obj["choices"][0]["delta"]
                        content = delta.get("content", "")
                        if content:
                            yield f"data: {json.dumps({'content': content})}\n\n"
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue

    except httpx.ConnectTimeout:
        yield f"data: {json.dumps({'error': 'LLM API connection timed out (10s)'})}\n\n"
    except httpx.ReadTimeout:
        yield f"data: {json.dumps({'error': 'LLM API read timed out (60s)'})}\n\n"
    except httpx.RemoteProtocolError as exc:
        print(f"Stream interrupted: {exc}", flush=True)
        yield f"data: {json.dumps({'error': 'Stream interrupted by remote server'})}\n\n"
    finally:
        if not done_sent:
            yield "data: [DONE]\n\n"


def _sse_response(generator: AsyncGenerator[str, None]) -> StreamingResponse:
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering
        },
    )


# ---------------------------------------------------------------------------
# Ticket endpoints
# ---------------------------------------------------------------------------
def _row_to_dict(row: asyncpg.Record) -> dict:
    d = dict(row)
    if "created_at" in d and d["created_at"]:
        d["created_at"] = d["created_at"].isoformat()
    return d


@app.get("/api/tickets")
async def list_tickets(status: Optional[str] = Query(None)):
    valid_statuses = {"open", "in_progress", "resolved"}
    if db_pool is None:
        raise HTTPException(503, "Database unavailable")
    async with db_pool.acquire() as conn:
        if status:
            if status not in valid_statuses:
                raise HTTPException(
                    400, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                )
            rows = await conn.fetch(
                "SELECT * FROM tickets WHERE status = $1 ORDER BY created_at DESC",
                status,
            )
        else:
            rows = await conn.fetch(
                "SELECT * FROM tickets ORDER BY created_at DESC"
            )
    return [_row_to_dict(r) for r in rows]


@app.get("/api/tickets/{ticket_id}")
async def get_ticket(ticket_id: int):
    if db_pool is None:
        raise HTTPException(503, "Database unavailable")
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM tickets WHERE id = $1", ticket_id
        )
    if not row:
        raise HTTPException(404, f"Ticket {ticket_id} not found")
    return _row_to_dict(row)


@app.get("/api/tickets/{ticket_id}/summary")
async def ticket_summary(ticket_id: int):
    """
    SSE endpoint: streams an AI-generated summary of a ticket's description.

    Data path:
      Client → GET /api/tickets/{id}/summary
        → fetch ticket from DB
        → POST LLM API (streaming)
        → yield SSE tokens back to client
    """
    if db_pool is None:
        raise HTTPException(503, "Database unavailable")
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM tickets WHERE id = $1", ticket_id
        )
    if not row:
        raise HTTPException(404, f"Ticket {ticket_id} not found")

    ticket = _row_to_dict(row)
    messages = [
        {
            "role": "system",
            "content": (
                "You are a senior support engineer. Analyze the following help desk ticket "
                "and provide a concise technical summary covering: root cause, current impact, "
                "proposed fix, and urgency level. Use markdown formatting."
            ),
        },
        {
            "role": "user",
            "content": (
                f"**Ticket #{ticket['id']}: {ticket['title']}**\n"
                f"Status: {ticket['status']}\n\n"
                f"{ticket['description']}"
            ),
        },
    ]

    return _sse_response(_stream_llm(messages))


# ---------------------------------------------------------------------------
# Chat endpoint (Support Agent)
# ---------------------------------------------------------------------------
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    SSE endpoint: proxies a full conversation to the LLM and streams the response.

    Accepts a messages array (full conversation history) and streams back
    the assistant reply token-by-token.
    """
    if not request.messages:
        raise HTTPException(400, "messages must not be empty")

    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    return _sse_response(_stream_llm(messages))


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "model": LLM_MODEL}
