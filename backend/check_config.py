"""
Supabase + environment readiness check.

Run from project root:
    .venv/bin/python -m backend.check_config
    .venv/bin/python -m backend.check_config --create-buckets

Verifies:
  - Required env vars are set
  - Supabase GoTrue auth endpoint reachable
  - JWKS endpoint reachable (for RS256) or HS256 secret present
  - Database connection works
  - Required tables exist
  - Storage buckets exist and are writable
  - Redis reachable (ARQ queue)
  - Anthropic + ElevenLabs API keys present (shape check only)

With --create-buckets, missing storage buckets are created automatically
using the service role key.

Exits 0 if everything critical passes, 1 otherwise.
"""
import argparse
import asyncio
import sys
import uuid

import httpx
from sqlalchemy import text

from backend.config import get_settings
from backend.database import _get_engine, get_supabase


REQUIRED_BUCKETS = [
    # name, public?, allowed MIME types (None = any)
    ("audio", False, None),
    ("reports", False, None),
    ("templates", False, None),
]


# --- Output helpers -----------------------------------------------------------

OK = "[ OK ]"
FAIL = "[FAIL]"
WARN = "[WARN]"
SKIP = "[SKIP]"


class Results:
    def __init__(self) -> None:
        self.critical_failed = 0
        self.warned = 0
        self.passed = 0

    def ok(self, label: str, detail: str = "") -> None:
        self.passed += 1
        print(f"{OK} {label}" + (f" — {detail}" if detail else ""))

    def fail(self, label: str, detail: str) -> None:
        self.critical_failed += 1
        print(f"{FAIL} {label} — {detail}")

    def warn(self, label: str, detail: str) -> None:
        self.warned += 1
        print(f"{WARN} {label} — {detail}")

    def skip(self, label: str, detail: str = "") -> None:
        print(f"{SKIP} {label}" + (f" — {detail}" if detail else ""))


# --- Checks -------------------------------------------------------------------

def check_env(r: Results) -> None:
    print("\n# Environment variables")
    s = get_settings()
    required = {
        "SUPABASE_URL": s.supabase_url,
        "SUPABASE_ANON_KEY": s.supabase_anon_key,
        "SUPABASE_SERVICE_ROLE_KEY": s.supabase_service_role_key,
        "DATABASE_URL": s.database_url,
        "REDIS_URL": s.redis_url,
        "ANTHROPIC_API_KEY": s.anthropic_api_key,
        "ELEVENLABS_API_KEY": s.elevenlabs_api_key,
    }
    for key, val in required.items():
        if not val:
            r.fail(key, "missing")
        else:
            r.ok(key, f"set ({len(val)} chars)")

    if not s.supabase_jwt_secret:
        r.warn("SUPABASE_JWT_SECRET", "missing — HS256 fallback unavailable (fine if project uses JWKS)")
    else:
        r.ok("SUPABASE_JWT_SECRET", f"set ({len(s.supabase_jwt_secret)} chars)")

    if not s.openai_api_key:
        r.warn("OPENAI_API_KEY", "missing (optional — only needed if AI_PROVIDER=openai)")

    if not s.deepgram_api_key:
        r.warn("DEEPGRAM_API_KEY", "missing (optional — only needed if STT_PROVIDER=deepgram)")


async def check_supabase_auth(r: Results) -> None:
    print("\n# Supabase Auth")
    s = get_settings()
    if not s.supabase_url:
        r.skip("Supabase auth health", "no SUPABASE_URL")
        return

    base = s.supabase_url.rstrip("/")
    async with httpx.AsyncClient(timeout=10) as client:
        # GoTrue health
        try:
            res = await client.get(
                f"{base}/auth/v1/health",
                headers={"apikey": s.supabase_anon_key},
            )
            if res.status_code == 200:
                body = res.json()
                r.ok("GoTrue /auth/v1/health", f"{body.get('name', '?')} v{body.get('version', '?')}")
            else:
                r.fail("GoTrue /auth/v1/health", f"HTTP {res.status_code}: {res.text[:120]}")
        except Exception as e:
            r.fail("GoTrue /auth/v1/health", f"request failed: {e!r}")

        # Settings endpoint — tells us which providers are enabled
        try:
            res = await client.get(
                f"{base}/auth/v1/settings",
                headers={"apikey": s.supabase_anon_key},
            )
            if res.status_code == 200:
                body = res.json()
                email_cfg = body.get("external", {}).get("email", False)
                disabled = body.get("disable_signup", False)
                autoconfirm = body.get("mailer_autoconfirm", False)
                r.ok(
                    "Auth providers",
                    f"email={'enabled' if email_cfg else 'DISABLED'}, "
                    f"signup={'disabled' if disabled else 'enabled'}, "
                    f"autoconfirm={'on' if autoconfirm else 'off (email confirmation required)'}",
                )
                if not email_cfg:
                    r.fail("Email provider", "disabled in Supabase — enable it at Auth > Providers")
                if disabled:
                    r.fail("Signup", "disabled in Supabase — enable it at Auth > Settings")
                if not autoconfirm:
                    r.warn(
                        "Email confirmation",
                        "required — signups will need to click a confirmation email before the session is returned",
                    )
            else:
                r.warn("Auth settings", f"HTTP {res.status_code}")
        except Exception as e:
            r.warn("Auth settings", f"request failed: {e!r}")

        # JWKS (for RS256/ES256 verification)
        try:
            res = await client.get(f"{base}/auth/v1/.well-known/jwks.json")
            if res.status_code == 200:
                body = res.json()
                keys = body.get("keys", [])
                if keys:
                    algs = {k.get("alg") for k in keys}
                    r.ok("JWKS endpoint", f"{len(keys)} key(s), alg(s)={sorted(algs)}")
                else:
                    r.warn("JWKS endpoint", "reachable but no keys returned (HS256-only project?)")
            elif res.status_code == 404:
                if s.supabase_jwt_secret:
                    r.warn("JWKS endpoint", "404 — project uses HS256 only; backend falls back to shared secret")
                else:
                    r.fail("JWKS endpoint", "404 and no SUPABASE_JWT_SECRET — backend cannot verify JWTs")
            else:
                r.warn("JWKS endpoint", f"HTTP {res.status_code}")
        except Exception as e:
            r.warn("JWKS endpoint", f"request failed: {e!r}")


async def check_database(r: Results) -> None:
    print("\n# Database")
    s = get_settings()
    if not s.database_url:
        r.fail("DATABASE_URL", "not set — cannot connect")
        return

    try:
        engine, _ = _get_engine()
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT 1"))
            if res.scalar() == 1:
                r.ok("DB connection", "SELECT 1 succeeded")
            else:
                r.fail("DB connection", "SELECT 1 returned unexpected value")
    except Exception as e:
        r.fail("DB connection", f"{e!r}")
        return

    required_tables = [
        "profiles",
        "clinics",
        "patients",
        "appointments",
        "recordings",
        "reports",
        "templates",
        "processing_jobs",
        "notifications",
        "audit_logs",
        "transcripts",
    ]
    try:
        async with engine.connect() as conn:
            res = await conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema = 'public'"
                )
            )
            present = {row[0] for row in res}
        missing = [t for t in required_tables if t not in present]
        extra = sorted(present - set(required_tables))
        if not missing:
            r.ok("Required tables", f"all {len(required_tables)} present")
        else:
            r.fail("Required tables", f"missing: {missing}. Run: alembic upgrade head")
        if extra:
            print(f"       (also present in DB: {extra})")
    except Exception as e:
        r.fail("Table listing", f"{e!r}")


async def check_storage(r: Results, create_missing: bool = False) -> None:
    print("\n# Supabase Storage")
    s = get_settings()
    if not s.supabase_url or not s.supabase_service_role_key:
        r.skip("Storage", "missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return

    try:
        client = get_supabase()
    except Exception as e:
        r.fail("Supabase client", f"init failed: {e!r}")
        return

    try:
        buckets = await asyncio.to_thread(client.storage.list_buckets)
        names = {b.name for b in buckets}
        r.ok("List buckets", f"{len(names)} bucket(s): {sorted(names)}")
    except Exception as e:
        r.fail("List buckets", f"{e!r}")
        return

    for name, public, mime in REQUIRED_BUCKETS:
        if name in names:
            r.ok(f"Bucket '{name}'", "exists")
            continue
        if not create_missing:
            r.fail(f"Bucket '{name}'", "missing — rerun with --create-buckets or create in Dashboard > Storage")
            continue
        try:
            options: dict = {"public": public}
            if mime is not None:
                options["allowed_mime_types"] = mime
            await asyncio.to_thread(
                lambda: client.storage.create_bucket(name, options=options)
            )
            names.add(name)
            r.ok(f"Bucket '{name}'", "created")
        except Exception as e:
            r.fail(f"Bucket '{name}'", f"create failed: {e!r}")

    # Upload / download / delete probe on the audio bucket
    if "audio" in names:
        probe_path = f"__readiness_check__/{uuid.uuid4()}.txt"
        payload = b"hello from check_config"
        try:
            def _upload():
                client.storage.from_("audio").upload(
                    path=probe_path,
                    file=payload,
                    file_options={"content-type": "text/plain", "upsert": "true"},
                )
            await asyncio.to_thread(_upload)
            got = await asyncio.to_thread(client.storage.from_("audio").download, probe_path)
            if bytes(got) == payload:
                r.ok("Storage write/read probe", f"audio/{probe_path}")
            else:
                r.fail("Storage write/read probe", "round-trip data mismatch")
            await asyncio.to_thread(client.storage.from_("audio").remove, [probe_path])
        except Exception as e:
            r.fail("Storage write/read probe", f"{e!r}")


async def check_redis(r: Results) -> None:
    print("\n# Redis (ARQ queue)")
    s = get_settings()
    try:
        from redis.asyncio import Redis
    except ImportError:
        r.warn("Redis client", "redis package not installed — skipping")
        return

    try:
        redis = Redis.from_url(s.redis_url)
        pong = await redis.ping()
        if pong:
            r.ok("Redis PING", f"{s.redis_url}")
        else:
            r.fail("Redis PING", "no PONG")
        await redis.aclose()
    except Exception as e:
        r.fail("Redis", f"{e!r}  (is redis running? try: redis-server or brew services start redis)")


# --- Main ---------------------------------------------------------------------

async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--create-buckets",
        action="store_true",
        help="Create any missing storage buckets (audio/reports/templates) using the service role key.",
    )
    args = parser.parse_args()

    print("=" * 72)
    print("MedGen-v2 — Supabase & Environment Readiness Check")
    print("=" * 72)

    r = Results()
    check_env(r)
    await check_supabase_auth(r)
    await check_database(r)
    await check_storage(r, create_missing=args.create_buckets)
    await check_redis(r)

    print("\n" + "=" * 72)
    print(f"Summary: {r.passed} passed, {r.warned} warnings, {r.critical_failed} critical failures")
    print("=" * 72)

    if r.critical_failed:
        print("\nNot ready. Fix the [FAIL] items above before running the app.")
        return 1
    if r.warned:
        print("\nReady to run, but review [WARN] items — some features may be limited.")
    else:
        print("\nAll checks passed. You're good to go.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
