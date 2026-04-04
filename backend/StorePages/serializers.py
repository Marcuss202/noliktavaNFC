from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Product, Sale, SaleItem, Purchase, PurchaseItem


User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=255, allow_blank=True, required=False)
    phone = serializers.CharField(max_length=32, allow_blank=True, required=False)

    def validate_email(self, value: str):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value: str):
        validate_password(value)
        return value

    def create(self, validated_data):
        email = validated_data["email"].strip().lower()
        password = validated_data["password"]
        full_name = validated_data.get("full_name", "")
        phone = validated_data.get("phone", "")

        # Create the custom user (Profile) using email as USERNAME_FIELD
        user = User.objects.create_user(email=email, password=password, name=full_name, phone=phone)
        return user

class ProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'stock_quantity', 'nfc_tag_id', 'description', 'image', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_image(self, obj):
        return obj.image.url if obj.image else None


class ProductMinimalSerializer(serializers.ModelSerializer):
    """Lightweight serializer for store list views"""
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'stock_quantity', 'nfc_tag_id', 'image']
        read_only_fields = ['id']

    def get_image(self, obj):
        return obj.image.url if obj.image else None


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'line_total']

    def get_line_total(self, obj):
        return obj.line_total


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ['id', 'note', 'created_at', 'total_amount', 'items']

    def get_total_amount(self, obj):
        return obj.total_amount


class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_cost', 'line_total']

    def get_line_total(self, obj):
        return obj.line_total


class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Purchase
        fields = ['id', 'supplier_name', 'note', 'created_at', 'total_amount', 'items']

    def get_total_amount(self, obj):
        return obj.total_amount