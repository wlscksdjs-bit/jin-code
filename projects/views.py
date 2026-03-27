from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Project, ProjectVersion
from .serializers import (
    ProjectSerializer, 
    ProjectVersionSerializer,
    ProjectVersionCreateSerializer,
    BidSimulationSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Project.objects.all()
        elif user.role == 'manager':
            return Project.objects.all()
        return Project.objects.filter(
            Q(created_by=user) | 
            Q(projectmember__user=user)
        ).distinct()

    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        project = self.get_object()
        serializer = ProjectVersionCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            version = serializer.save(project=project, created_by=request.user)
            return Response(ProjectVersionSerializer(version).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def simulate_bid(self, request):
        serializer = BidSimulationSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.to_representation(serializer.validated_data)
            return Response(result)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectVersionViewSet(viewsets.ModelViewSet):
    queryset = ProjectVersion.objects.all()
    serializer_class = ProjectVersionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ProjectVersion.objects.filter(project_id=self.kwargs['project_pk'])