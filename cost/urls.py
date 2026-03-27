from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CostCategoryViewSet, VendorViewSet, BudgetViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r'categories', CostCategoryViewSet, basename='costcategory')
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
]