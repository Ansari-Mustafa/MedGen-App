import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.routers import patients, appointments, notifications, reports, recordings, stream, templates, ws, me, dashboard

settings = get_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("medgen.http")

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    t0 = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        dur_ms = (time.perf_counter() - t0) * 1000
        log.exception("%s %s 500 %.0fms", request.method, request.url.path, dur_ms)
        raise
    dur_ms = (time.perf_counter() - t0) * 1000
    log.info("%s %s %d %.0fms", request.method, request.url.path, response.status_code, dur_ms)
    return response


app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(recordings.router)
app.include_router(stream.router)
app.include_router(templates.router)
app.include_router(ws.router)
app.include_router(me.router)
app.include_router(dashboard.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
