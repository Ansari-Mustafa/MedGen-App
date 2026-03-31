"""
Expo Push Notification service.
Uses the Expo push API to send notifications to mobile clients.
"""
import asyncio
import httpx
from backend.config import get_settings

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(expo_token: str, title: str, body: str, data: dict | None = None):
    """Send a single push notification via Expo."""
    if not expo_token or not expo_token.startswith("ExponentPushToken["):
        return

    payload = {
        "to": expo_token,
        "title": title,
        "body": body,
        "sound": "default",
        "data": data or {},
    }

    async with httpx.AsyncClient() as client:
        try:
            await client.post(EXPO_PUSH_URL, json=payload, timeout=10)
        except Exception:
            pass  # non-critical — log in production


async def send_push_to_users(tokens: list[str], title: str, body: str, data: dict | None = None):
    """Send to multiple tokens in one batch request."""
    valid = [t for t in tokens if t and t.startswith("ExponentPushToken[")]
    if not valid:
        return

    messages = [{"to": t, "title": title, "body": body, "sound": "default", "data": data or {}} for t in valid]

    async with httpx.AsyncClient() as client:
        try:
            await client.post(EXPO_PUSH_URL, json=messages, timeout=10)
        except Exception:
            pass
