from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'team', 'is_active']
    list_filter = ['role', 'team', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']

    fieldsets = UserAdmin.fieldsets + (
        ('추가 정보', {'fields': ('role', 'team', 'department', 'phone', 'position')}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('추가 정보', {'fields': ('role', 'team', 'department', 'phone', 'position')}),
    )