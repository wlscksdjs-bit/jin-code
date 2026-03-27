from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApprovalTypeViewSet, ApprovalLineViewSet, ApprovalViewSet

router = DefaultRouter()
router.register(r'types', ApprovalTypeViewSet, basename='approvaltype')
router.register(r'lines', ApprovalLineViewSet, basename='approvalline')
router.register(r'', ApprovalViewSet, basename='approval')

urlpatterns = [
    path('', include(router.urls)),
]