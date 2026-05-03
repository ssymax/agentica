import asyncio
import os

import asyncpg
from dotenv import load_dotenv

load_dotenv()


async def run() -> None:
    dsn = os.environ["DATABASE_URL"]

    for attempt in range(10):
        try:
            conn = await asyncpg.connect(dsn)
            break
        except Exception as exc:
            print(f"  DB attempt {attempt + 1}/10 failed: {exc}")
            await asyncio.sleep(2)
    else:
        raise RuntimeError("Could not connect to database after 10 attempts")

    try:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tickets (
                id          SERIAL PRIMARY KEY,
                title       VARCHAR(255)    NOT NULL,
                description TEXT            NOT NULL,
                status      VARCHAR(50)     NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open', 'in_progress', 'resolved')),
                created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
            )
            """
        )
        print("✓ Schema ready")

        count = await conn.fetchval("SELECT COUNT(*) FROM tickets")
        if count == 0:
            from seed import TICKETS

            await conn.executemany(
                "INSERT INTO tickets (title, description, status, created_at) "
                "VALUES ($1, $2, $3, $4)",
                [
                    (t["title"], t["description"], t["status"], t["created_at"])
                    for t in TICKETS
                ],
            )
            print(f"✓ Seeded {len(TICKETS)} tickets")
    finally:
        await conn.close()


asyncio.run(run())
