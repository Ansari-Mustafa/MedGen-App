from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.routers import patients, appointments, notifications, reports, recordings, stream, templates, ws

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(recordings.router)
app.include_router(stream.router)
app.include_router(templates.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
