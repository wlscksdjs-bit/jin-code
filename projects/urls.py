from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectVersionViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
    path('projects/<int:project_pk>/versions/', ProjectVersionViewSet.as_view({'get': 'list', 'post': 'create'}), name='project-versions'),
    path('projects/<int:project_pk>/versions/<int:pk>/', ProjectVersionViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='project-version-detail'),
]