from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .serializers import RegisterSerializer
from .authentication import JWTCookieAuthentication


class RegisterView(APIView):
    authentication_classes = []  # Allow anonymous registration
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "id": user.id,
                "email": user.email,
                "name": user.name,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password')
        
        user = authenticate(request, username=email, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            response = Response({
                "id": user.id,
                "email": user.email,
                "name": getattr(user, "name", None),
                "is_staff": user.is_staff,
            }, status=status.HTTP_200_OK)
            
            # Set tokens in httpOnly cookies for security
            response.set_cookie(
                key='jwt_access',
                value=str(refresh.access_token),
                httponly=True,
                secure=True,  # Required for SameSite=None
                samesite='None',  # Allow cross-context (NFC Custom Tabs)
                max_age=3600 * 24 * 7  # 7 days
            )
            response.set_cookie(
                key='jwt_refresh',
                value=str(refresh),
                httponly=True,
                secure=True,
                samesite='None',
                max_age=3600 * 24 * 30  # 30 days
            )
            return response
        
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    def post(self, request):
        response = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
        response.delete_cookie('jwt_access')
        response.delete_cookie('jwt_refresh')
        return response


class MeView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "name": getattr(user, "name", None),
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        })
