from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import PermissionDenied

from .models import Product
from .serializers import ProductSerializer, ProductMinimalSerializer


class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoints for products.
    - List: GET /api/products/ (public)
    - Detail: GET /api/products/<id>/ (public)
    - Create: POST /api/products/ (admin only)
    - Update: PUT /api/products/<id>/ (admin only)
    - Partial update: PATCH /api/products/<id>/ (admin only)
    - Delete: DELETE /api/products/<id>/ (admin only)
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        """Use minimal serializer for list views"""
        if self.action == 'list':
            return ProductMinimalSerializer
        return ProductSerializer

    def get_permissions(self):
        """Allow read-only for all users; write only for staff"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
            return [permission() for permission in permission_classes]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Only staff can create products"""
        if not self.request.user.is_staff:
            raise PermissionDenied("Only admin users can create products")
        serializer.save()

    def perform_update(self, serializer):
        """Only staff can update products"""
        if not self.request.user.is_staff:
            raise PermissionDenied("Only admin users can update products")
        serializer.save()

    def perform_destroy(self, instance):
        """Only staff can delete products"""
        if not self.request.user.is_staff:
            raise PermissionDenied("Only admin users can delete products")
        instance.delete()

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def lookup_nfc(self, request):
        """
        Lookup product by NFC tag ID.
        GET /api/products/lookup_nfc/?nfc_tag_id=<tag_id>
        """
        nfc_tag_id = request.query_params.get('nfc_tag_id')
        if not nfc_tag_id:
            return Response(
                {'error': 'nfc_tag_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(nfc_tag_id=nfc_tag_id)
            serializer = self.get_serializer(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {'error': f'Product with NFC tag ID "{nfc_tag_id}" not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_stock(self, request, pk=None):
        """
        Update stock quantity for a product.
        PATCH /api/products/<id>/update_stock/
        Body: {"quantity": 10}  (replaces stock) or {"delta": 5} (adds/subtracts)
        """
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admin users can update stock'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        product = self.get_object()
        quantity = request.data.get('quantity')
        delta = request.data.get('delta')

        if quantity is not None:
            product.stock_quantity = quantity
        elif delta is not None:
            product.stock_quantity += delta
        else:
            return Response(
                {'error': 'Either "quantity" or "delta" must be provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        product.save()
        serializer = self.get_serializer(product)
        return Response(serializer.data)
