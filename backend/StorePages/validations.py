import re
from rest_framework.exceptions import ValidationError


def validate_password(password):
    """
    Password rules:
    - 8 to 64 characters
    - No spaces
    - English letters only
    - At least one uppercase
    - At least one lowercase
    - At least one number
    - At least one special character
    """

    if len(password) < 8:
        raise ValidationError(
            "Password must be at least 8 characters long."
        )

    if len(password) > 64:
        raise ValidationError(
            "Password cannot exceed 64 characters."
        )

    if " " in password:
        raise ValidationError(
            "Password cannot contain spaces."
        )

    if not re.fullmatch(
        r"[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?`~]+",
        password,
    ):
        raise ValidationError(
            "Password may only contain English letters, numbers, and symbols."
        )

    if not re.search(r"[A-Z]", password):
        raise ValidationError(
            "Password must contain at least one uppercase letter."
        )

    if not re.search(r"[a-z]", password):
        raise ValidationError(
            "Password must contain at least one lowercase letter."
        )

    if not re.search(r"\d", password):
        raise ValidationError(
            "Password must contain at least one number."
        )

    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?`~]", password):
        raise ValidationError(
            "Password must contain at least one special character."
        )