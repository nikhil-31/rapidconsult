# # rapidconsult/presence.py
# import redis
# from django.conf import settings
# from django.utils import timezone
#
# r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
#
#
# def mark_online(user_id: str):
#     """Mark user as online in Redis."""
#     r.sadd("presence:users", user_id)
#     r.set(f"presence:user:{user_id}", timezone.now().isoformat(), ex=300)
#
#
# def mark_offline(user_id: str):
#     """Mark user as offline in Redis (but keep last_seen)."""
#     r.srem("presence:users", user_id)
#     r.set(f"presence:user:{user_id}", timezone.now().isoformat())
#
#
# def get_online_users():
#     """Return list of user_ids currently online."""
#     return list(r.smembers("presence:users"))
#
#
# def get_last_seen(user_id: str):
#     """Return last seen timestamp if exists."""
#     return r.get(f"presence:user:{user_id}")
#
#
# def is_online(user_id: str) -> bool:
#     return str(user_id) in r.smembers("presence:users")
#

# rapidconsult/presence.py
import redis
from django.conf import settings
from django.utils import timezone

r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

ONLINE_USERS_KEY = "presence:users"


def mark_online(user_id: str, ttl: int = 60):
    """
    Mark user as online in Redis.
    Also set an expiring key that acts like a heartbeat.
    """
    user_id = str(user_id)
    r.sadd(ONLINE_USERS_KEY, user_id)
    r.set(f"presence:user:{user_id}:last_seen", timezone.now().isoformat())
    r.set(f"presence:user:{user_id}:heartbeat", "1", ex=ttl)


def mark_offline(user_id: str):
    """
    Mark user as offline, but keep last_seen for history.
    """
    user_id = str(user_id)
    r.srem(ONLINE_USERS_KEY, user_id)
    r.set(f"presence:user:{user_id}:last_seen", timezone.now().isoformat())
    r.delete(f"presence:user:{user_id}:heartbeat")


def heartbeat(user_id: str, ttl: int = 60):
    """
    Refresh the heartbeat key to keep the user online.
    Call this periodically from the frontend (ping).
    """
    user_id = str(user_id)
    if r.sismember(ONLINE_USERS_KEY, user_id):
        r.set(f"presence:user:{user_id}:heartbeat", "1", ex=ttl)


def get_online_users():
    """Return list of currently online users."""
    return list(r.smembers(ONLINE_USERS_KEY))


def is_online(user_id: str) -> bool:
    """
    A user is online if they’re in the set AND their heartbeat key exists.
    """
    user_id = str(user_id)
    return r.sismember(ONLINE_USERS_KEY, user_id) and r.exists(f"presence:user:{user_id}:heartbeat")


def get_last_seen(user_id: str):
    """Return last seen timestamp if exists."""
    return r.get(f"presence:user:{user_id}:last_seen")
