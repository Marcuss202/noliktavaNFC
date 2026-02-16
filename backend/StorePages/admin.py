from django.contrib import admin
from .models import Profile, Product


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
	list_display = ("email", "name", "phone", "is_active", "is_staff", "is_superuser")
	search_fields = ("email", "name", "phone")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
	list_display = ("name", "nfc_tag_id", "price", "stock_quantity", "created_at")
	search_fields = ("name", "nfc_tag_id", "description")
	list_filter = ("created_at",)
	ordering = ("-created_at",)