from rest_framework import generics
from .models import CustomUser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import RegisterSerializer, UserProfileSerializer
# Create your views here.

class RegisterAPIView(generics.CreateAPIView):
    queryset= CustomUser.objects.all()
    pagination_classes = (AllowAny)
    serializer_class = RegisterSerializer


class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user