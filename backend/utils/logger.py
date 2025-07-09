from backend.database import db
from datetime import datetime

log_collection = db["logs"]

def log_to_db(level: str, message: str, user: str = None, path: str = None, ip: str = None):
    log_entry = {
        "timestamp": datetime.utcnow(),
        "level": level.upper(),
        "message": message,
        "user": user,
        "path": path,
        "ip": ip,
    }
    log_collection.insert_one(log_entry)