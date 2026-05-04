FROM python:3.13-slim

# Install uv from official image (pinned for reproducibility)
COPY --from=ghcr.io/astral-sh/uv:0.11.8 /uv /uvx /bin/

WORKDIR /app

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH" \
    UV_NO_CACHE=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install dependencies first (layer cache)
COPY pyproject.toml .
RUN uv venv && uv pip install .

# Copy source
COPY . .

RUN chmod +x wait-for-postgres.sh

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
