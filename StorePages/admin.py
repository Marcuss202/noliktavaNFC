from django.contrib import admin
from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
	list_display = ("email", "name", "phone", "is_active", "is_staff", "is_superuser")
	search_fields = ("email", "name", "phone")