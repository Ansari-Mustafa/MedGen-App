"""
ARQ worker entrypoint.

Run with:
    python -m arq backend.worker.WorkerSettings
"""
import sys
from pathlib import Path

# Ensure project root is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from arq.connections import RedisSettings
from backend.config import get_settings
from backend.tasks.pipeline import run_pipeline
from backend.tasks.onboard_template import onboard_template

settings = get_settings()


async def startup(ctx):
    """Called once when the worker starts. Set up shared resources."""
    import redis.asyncio as aioredis
    from backend.database import _get_engine

    ctx["redis"] = aioredis.from_url(settings.redis_url, decode_responses=True)
    _, factory = _get_engine()
    ctx["db_factory"] = factory


async def shutdown(ctx):
    """Called when the worker shuts down."""
    await ctx["redis"].aclose()


class WorkerSettings:
    functions = [run_pipeline, onboard_template]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_jobs = 10
    job_timeout = 600  # 10 min max per pipeline run
