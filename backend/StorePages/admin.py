from django.contrib import admin
from .models import Profile, Product, Sale, SaleItem, Purchase, PurchaseItem


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


class SaleItemInline(admin.TabularInline):
	model = SaleItem
	extra = 1


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
	list_display = ("id", "note", "created_at")
	search_fields = ("note",)
	list_filter = ("created_at",)
	ordering = ("-created_at",)
	inlines = [SaleItemInline]


class PurchaseItemInline(admin.TabularInline):
	model = PurchaseItem
	extra = 1


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
	list_display = ("id", "supplier_name", "note", "created_at")
	search_fields = ("supplier_name", "note")
	list_filter = ("created_at",)
	ordering = ("-created_at",)
	inlines = [PurchaseItemInline]