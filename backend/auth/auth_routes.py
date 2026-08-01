import datetime
import uuid
import secrets
from fastapi import APIRouter, HTTPException, Depends, status
from database import db_get_user_by_email, db_create_user, db_update_user_last_login, db_get_user_by_id, db_update_user_reset_token, db_get_user_by_reset_token, db_update_user_password
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
from auth.schemas import UserRegister, TokenResponse, UserLogin, UserResponse, OAuthLogin, ForgotPasswordRequest, ResetPasswordRequest
from services.email_service import send_reset_email
from auth.jwt_handler import create_access_token, verify_token
from auth.password_handler import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """FastAPI dependency to extract and verify the JWT access token and return the current user."""
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db_get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/register", response_model=UserResponse)
def register(data: UserRegister):
    """Register a new user account after validating details and checking for email duplicates."""
    try:
        if data.password != data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        # Check if user already exists
        existing_user = db_get_user_by_email(data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        hashed = hash_password(data.password)
        user_id = str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat()
        
        user = {
            "id": user_id,
            "name": data.name,
            "email": data.email.lower().strip(),
            "password": hashed,
            "provider": "local",
            "provider_id": None,
            "profile_picture": None,
            "created_at": now,
            "last_login": None
        }
        
        created_user = db_create_user(user)
        return created_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin):
    """Authenticate credentials, log the login time, and generate a JWT access token."""
    try:
        user = db_get_user_by_email(data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not verify_password(data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat()
        db_update_user_last_login(user["id"], now)
        
        access_token = create_access_token(data={"sub": user["id"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "provider": user.get("provider", "local"),
                "provider_id": user.get("provider_id"),
                "profile_picture": user.get("profile_picture"),
                "created_at": user["created_at"],
                "last_login": now
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during login: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Return the profile data of the currently logged-in user."""
    try:
        return current_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred fetching user profile: {str(e)}"
        )

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """Invalidate local session (client removes JWT, backend returns status)."""
    try:
        return {"success": True, "message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during logout: {str(e)}"
        )

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    """Generate a password reset token and email it to the user."""
    user = db_get_user_by_email(data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )

    reset_token = secrets.token_urlsafe(32)
    # Expiry 30 mins from now in UTC
    expiry = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)).isoformat()

    db_update_user_reset_token(data.email, reset_token, expiry)

    try:
        send_reset_email(user["email"], reset_token)
    except Exception as exc:
        print(f"[forgot_password] Failed to send reset email to {user['email']}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send password reset email."
        )

    return {
        "success": True,
        "message": "Password reset email sent successfully."
    }

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    """Reset the user's password using a valid reset token."""
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
        
    user = db_get_user_by_reset_token(data.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid reset token."
        )
        
    # Verify token expiry
    if user.get("reset_token_expiry"):
        expiry_time = datetime.datetime.fromisoformat(user["reset_token_expiry"])
        if datetime.datetime.now(datetime.timezone.utc) > expiry_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired."
        )
        
    hashed = hash_password(data.new_password)
    db_update_user_password(user["id"], hashed)
    
    return {
        "success": True,
        "message": "Password has been reset successfully."
    }

# Replace with your actual Google Client ID from Google Cloud Console
GOOGLE_CLIENT_ID = "763375667270-mf5mefl5t1u2rhie1oaia0e232eulcbr.apps.googleusercontent.com"

@router.post("/google", response_model=TokenResponse)
def google_auth(data: OAuthLogin):
    """Authenticate with Google Access token."""
    try:
        # Fetch user info using Google Access Token
        headers = {"Authorization": f"Bearer {data.token}"}
        response = requests.get("https://www.googleapis.com/oauth2/v3/userinfo", headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
            
        user_info = response.json()
        email = user_info.get("email")
        name = user_info.get("name")
        provider_id = user_info.get("sub")
        profile_picture = user_info.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="Google profile did not contain an email")

        return process_oauth_login(
            email=email.lower().strip(),
            name=name or email.split('@')[0],
            provider="google",
            provider_id=provider_id,
            profile_picture=profile_picture
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during Google authentication: {str(e)}"
        )

@router.post("/microsoft", response_model=TokenResponse)
def microsoft_auth(data: OAuthLogin):
    """Authenticate with Microsoft Access token."""
    try:
        # Microsoft Graph API endpoint for user profile
        headers = {"Authorization": f"Bearer {data.token}"}
        response = requests.get("https://graph.microsoft.com/v1.0/me", headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Microsoft token")
            
        user_info = response.json()
        email = user_info.get("mail") or user_info.get("userPrincipalName")
        name = user_info.get("displayName")
        provider_id = user_info.get("id")
        
        if not email:
            raise HTTPException(status_code=400, detail="Microsoft profile did not contain an email")
            
        return process_oauth_login(
            email=email.lower().strip(),
            name=name or email.split('@')[0],
            provider="microsoft",
            provider_id=provider_id,
            profile_picture=None # We could fetch it from graph API, but it's another request
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during Microsoft authentication: {str(e)}"
        )

def process_oauth_login(email: str, name: str, provider: str, provider_id: str, profile_picture: str):
    user = db_get_user_by_email(email)
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat()
    
    if not user:
        # Auto-create user
        user_id = str(uuid.uuid4())
        hashed = hash_password(str(uuid.uuid4())) # Random password for OAuth users
        new_user = {
            "id": user_id,
            "name": name,
            "email": email,
            "password": hashed,
            "provider": provider,
            "provider_id": provider_id,
            "profile_picture": profile_picture,
            "created_at": now,
            "last_login": now
        }
        user = db_create_user(new_user)
    else:
        # Update last login
        db_update_user_last_login(user["id"], now)
        # We could also update the profile picture and provider_id if they are missing
        
    access_token = create_access_token(data={"sub": user["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "provider": user.get("provider", provider),
            "provider_id": user.get("provider_id", provider_id),
            "profile_picture": user.get("profile_picture", profile_picture),
            "created_at": user["created_at"],
            "last_login": now
        }
    }
