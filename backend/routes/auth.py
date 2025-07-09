from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from backend.schemas.auth import UserRegister, UserOut, Token, ResetPasswordSchema, EmailRequest, TokenData
from backend.utils.auth import (
    get_user_by_email, get_user_by_username, authenticate_user,
    create_access_token, create_refresh_token,
    create_email_verification_token, create_password_reset_token,
    hash_password
)
from backend.utils.email import send_email
from backend.config import settings
from backend.database import users_collection
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from backend.utils.limiter import limiter
from uuid import uuid4
from datetime import datetime, timedelta
import requests
from authlib.integrations.base_client.errors import OAuthError, MismatchingStateError
from fastapi import Request

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ========== Google OAuth Setup ==========
oauth = OAuth()
config = Config(environ={
    "GOOGLE_CLIENT_ID": settings.GOOGLE_CLIENT_ID,
    "GOOGLE_CLIENT_SECRET": settings.GOOGLE_CLIENT_SECRET,
    "SECRET_KEY": settings.SECRET_KEY,
})
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"}
)

# ========== Google Auth Routes ==========

@router.get("/auth/login/google")
async def login_with_google(request: Request):
    print("SESSION BEFORE REDIRECT (login route):", dict(request.session)) 
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google", tags=["Auth"])
async def auth_google(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Google authorization failed.")

    # Step 1: Get user info from Google
    try:
        user_info_endpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f'Bearer {token["access_token"]}'}
        google_response = requests.get(user_info_endpoint, headers=headers)
        user_info = google_response.json()
    except Exception:
        raise HTTPException(status_code=401, detail="Failed to retrieve user info from Google.")

    user_email = user_info.get("email")
    user_name = user_info.get("name")
    user_id = user_info.get("id") or str(uuid4())

    if not user_email or not user_id:
        raise HTTPException(status_code=400, detail="Incomplete user info from Google.")

    # Step 2: Check if user exists
    existing_user = await users_collection.find_one({"email": user_email})

    if not existing_user:
        # Step 3: Create new user for Google login (no password)
        new_user = {
            "user_id": user_id,
            "username": user_name,
            "email": user_email,
            "is_verified": True,
            "is_oauth_user": True,
            "created_at": datetime.utcnow(),
        }
        await users_collection.insert_one(new_user)
        user = new_user
    else:
        user = existing_user

    # Step 4: Generate tokens
    access_token_expires = timedelta(seconds=token.get("expires_in", 3600))
    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=access_token_expires
    )

    refresh_token = create_refresh_token(
        data={"sub": user["email"]}
    )

    # Step 5: Send response with cookie + token in body
    response = RedirectResponse(
    url=f"http://localhost:5173/google/callback?access_token={access_token}"
)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="None",
        max_age=60 * 60 * 24 * 30  # 30 days
    )

    return response

# ========== Auth Routes ==========
@router.post("/auth/register", status_code=201)
@limiter.limit('5/minute')
async def register(request: Request,user: UserRegister):
    if await get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await get_user_by_username(user.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_pw = hash_password(user.password)
    user_id = str(uuid4())
    await users_collection.insert_one({
        "user_id": user_id,
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_pw,
        "disabled": False
    })
    return {"message": "User registered successfully", "user_id": user_id}

@router.post("/auth/login", response_model=Token)
@limiter.limit('5/minute')
async def login(request: Request,response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    identifier = form_data.username
    user = await authenticate_user(identifier, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user["email"]})
    refresh_token = create_refresh_token(data={"sub": user["email"]})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        samesite="lax",
        secure=False
    )

    return Token(access_token=access_token, token_type="bearer", message="User logged in successfully")

@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

@router.get("/auth/me", response_model=UserOut)
async def get_me(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "username": user["username"],
        "email": user["email"],
        "is_verified": user.get("is_verified", False)
    }

# ========== Email Verification ==========
@router.post("/auth/send-verification")
@limiter.limit("3/minute")
async def send_verification(request: Request,email_req: EmailRequest):
    token = create_email_verification_token(email_req.email)
    #link = f"http://localhost:8000/auth/verify-email?token={token}"
    frontend_url = "http://localhost:5173/verify-email?token=" + token
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <body style="background-color:#f9fafb; font-family:ui-sans-serif,system-ui,sans-serif; padding:2rem;">
        <div style="max-width:600px; margin:0 auto; background-color:white; border-radius:0.5rem; padding:2rem; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="font-size:1.5rem; font-weight:600; color:#111827; margin-bottom:1rem;">Email Verification</h2>
        <p style="font-size:1rem; color:#4b5563; margin-bottom:1rem;">
            Hello,
        </p>
        <p style="font-size:1rem; color:#4b5563; margin-bottom:1rem;">
            Thank you for signing up! To complete your registration, please verify your email address by clicking the button below.
        </p>

        <div style="text-align:center; margin:2rem 0;">
            <a href="{frontend_url}" style="background-color:#3b82f6; color:white; padding:0.75rem 1.5rem; border-radius:0.375rem; text-decoration:none; font-weight:500;">
            Verify Email
            </a>
        </div>

        <p style="font-size:0.875rem; color:#6b7280;">
            If you did not sign up for this account, you can safely ignore this email.
        </p>

        <p style="font-size:0.875rem; color:#6b7280; margin-top:2rem;">
            Regards,<br>
            The Team
        </p>
        </div>
    </body>
    </html>
    """
    await send_email("Verify your email", [email_req.email], html)
    return {"message": "Verification email sent"}

@router.get("/auth/verify-email")
@limiter.limit("3/minute")
async def verify_email(request: Request,token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        user = await get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        await users_collection.update_one({"email": email}, {"$set": {"is_verified": True}})
        return JSONResponse(content={"message": "Email verified successfully"})
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

# ========== Password Reset ==========
@router.post("/auth/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request,email_req: EmailRequest):
    user = await get_user_by_email(email_req.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = create_password_reset_token(email_req.email)
    #link = f"http://localhost:8000/auth/reset-password?token={token}"
    frontend_url = "http://localhost:5173/reset-password?token=" + token
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <body style="background-color:#f9fafb; font-family:ui-sans-serif,system-ui,sans-serif; padding:2rem;">
        <div style="max-width:600px; margin:0 auto; background-color:white; border-radius:0.5rem; padding:2rem; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="font-size:1.5rem; font-weight:600; color:#111827; margin-bottom:1rem;">Reset Your Password </h2>

        <p style="font-size:1rem; color:#4b5563; margin-bottom:1rem;">
            Hello,
        </p>

        <p style="font-size:1rem; color:#4b5563; margin-bottom:1rem;">
            We received a request to reset your password. Click the button below to set a new password.
        </p>

        <div style="text-align:center; margin:2rem 0;">
            <a href="{frontend_url}" style="background-color:#10b981; color:white; padding:0.75rem 1.5rem; border-radius:0.375rem; text-decoration:none; font-weight:500;">
            Reset Password
            </a>
        </div>

        <p style="font-size:0.875rem; color:#6b7280;">
            If you didn't request a password reset, please ignore this email. This link will expire after a short time for your security.
        </p>

        <p style="font-size:0.875rem; color:#6b7280; margin-top:2rem;">
            Stay safe,<br>
            The Team
        </p>
        </div>
    </body>
    </html>
    """
    await send_email("Password Reset", [email_req.email], html)
    return {"message": "Password reset email sent"}

@router.post("/auth/reset-password")
@limiter.limit("3/minute")
async def reset_password(request: Request,data: ResetPasswordSchema):
    try:
        payload = jwt.decode(data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        user = await get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        await users_collection.update_one({"email": email}, {"$set": {"hashed_password": hash_password(data.new_password)}})
        return {"message": "Password has been reset successfully"}
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

@router.post("/auth/refresh-token")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        new_access_token = create_access_token({"sub": payload.get("sub")})
        return {"access_token": new_access_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")