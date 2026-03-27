from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ResourceAllocationViewSet

router = DefaultRouter()
router.register(r'', ResourceAllocationViewSet, basename='resource')

urlpatterns = [
    path('', include(router.urls)),
]