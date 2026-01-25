from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import CSRFCheck
from rest_framework import exceptions


class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads the token from cookies instead of Authorization header.
    Falls back to header if cookie is not present.
    """
    def authenticate(self, request):
        # Try cookie first
        raw_token = request.COOKIES.get('jwt_access')
        
        # Fall back to Authorization header
        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)
        
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
