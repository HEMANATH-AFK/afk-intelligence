import json
import logging
import asyncio
from datetime import datetime
from redis.asyncio import Redis
from src.core.config import settings

logger = logging.getLogger(__name__)

class InMemoryPubSubManager:
    def __init__(self):
        self.channels = {}

    async def publish(self, channel: str, message: str):
        if channel in self.channels:
            for queue in self.channels[channel]:
                await queue.put(message)

    def pubsub(self):
        return InMemorySubscription(self)

class InMemorySubscription:
    def __init__(self, manager):
        self.manager = manager
        self.channel = None
        self.queue = asyncio.Queue()

    async def subscribe(self, channel: str):
        self.channel = channel
        if channel not in self.manager.channels:
            self.manager.channels[channel] = []
        self.manager.channels[channel].append(self.queue)

    async def get_message(self, ignore_subscribe_messages=True, timeout=1.0):
        try:
            msg = await asyncio.wait_for(self.queue.get(), timeout=timeout)
            return {"data": msg}
        except asyncio.TimeoutError:
            return None

    async def unsubscribe(self):
        if self.channel and self.channel in self.manager.channels:
            if self.queue in self.manager.channels[self.channel]:
                self.manager.channels[self.channel].remove(self.queue)

    async def close(self):
        pass

redis_client = None
in_memory_pubsub = InMemoryPubSubManager()
use_redis = True

try:
    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
except Exception as e:
    logger.warning(f"[OBSERVABILITY] Failed to initialize Redis connection: {e}. Using In-Memory PubSub.")
    use_redis = False

async def get_redis_client():
    global use_redis, redis_client
    if not use_redis:
        return None
    try:
        await redis_client.ping()
        return redis_client
    except Exception as e:
        logger.warning(f"[OBSERVABILITY] Redis ping failed: {e}. Switching dynamically to In-Memory PubSub.")
        use_redis = False
        return None

async def publish_event(workflow_id: str, state: str, event_type: str, message: str, payload: dict = None):
    channel = f"workflow:{workflow_id}"
    event_data = {
        "workflow_id": workflow_id,
        "state": state,
        "event_type": event_type,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "payload": payload or {}
    }
    
    client = await get_redis_client()
    if client:
        await client.publish(channel, json.dumps(event_data))
    else:
        await in_memory_pubsub.publish(channel, json.dumps(event_data))

async def subscribe_events(workflow_id: str):
    channel = f"workflow:{workflow_id}"
    client = await get_redis_client()
    if client:
        pubsub = client.pubsub()
        await pubsub.subscribe(channel)
        return pubsub
    else:
        pubsub = in_memory_pubsub.pubsub()
        await pubsub.subscribe(channel)
        return pubsub
