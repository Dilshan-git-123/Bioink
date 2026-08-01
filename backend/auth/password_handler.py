import bcrypt


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt.
    
    Uses the bcrypt library directly instead of passlib to avoid
    the known passlib 1.7.4 / bcrypt >= 4.1 incompatibility.
    """
    try:
        password_bytes = password.encode("utf-8")
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode("utf-8")
    except Exception as e:
        raise RuntimeError(f"Error hashing password: {str(e)}")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that a plain-text password matches a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False
