from django.contrib import admin
from .models import CostCategory, Budget, Vendor, Expense


@admin.register(CostCategory)
class CostCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category_type', 'is_active']
    list_filter = ['category_type', 'is_active']


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['project', 'category', 'planned_amount', 'created_by', 'created_at']
    list_filter = ['project', 'category']
    search_fields = ['project__name', 'category__name']


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'phone', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'business_number']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['budget', 'amount', 'status', 'submitted_by', 'expense_date']
    list_filter = ['status', 'expense_date']
    search_fields = ['budget__project__name', 'description']