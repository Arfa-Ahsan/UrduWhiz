from fastapi import FastAPI,Request
from fastapi import FastAPI, Header, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from backend.routes import api, auth
import time,requests
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from backend.utils.logger import log_to_db
from backend.utils.limiter import limiter
import os


app = FastAPI(title="UrduWhiz")
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("FASTAPI_SECRET_KEY"),
    same_site="lax",  # Use 'lax' for local development; use 'none' for production with HTTPS
    max_age=86400,              
    session_cookie="session"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "Rate limit exceeded"},
))


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# # Logging time taken for each api request
@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    log_to_db(
        level="INFO",
        message="Request received",
        path=request.url.path,
        ip=request.client.host
    )
    return response

app.include_router(auth.router, tags=["Auth"])
app.include_router(api.router, tags=["Upload & Chat"], prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to UrduWhiz"}