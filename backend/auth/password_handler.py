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


def is_bcrypt_hash(hashed_password: str) -> bool:
    """Check if a string has a valid bcrypt hash prefix."""
    if not hashed_password:
        return False
    return hashed_password.startswith(("$2a$", "$2b$", "$2y$"))


def verify_password(plain_password: str, stored_password: str) -> bool:
    """Verify that a plain-text password matches a bcrypt hash."""
    if not plain_password or not stored_password:
        return False
    
    # If stored password is a bcrypt hash
    if is_bcrypt_hash(stored_password):
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                stored_password.encode("utf-8"),
            )
        except Exception:
            return False
            
    return False
