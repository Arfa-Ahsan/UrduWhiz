from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from backend.config import settings

# Async client for all operations
client = AsyncIOMotorClient(settings.MONGO_URI)
db = client["UrduWhiz"]
collection = db["logs"]
users_collection = db["Users"]
sessions_collection = db["Sessions"]
messages_collection=db['Nessages']

