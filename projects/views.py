from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
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

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response(
                {'error': '프로젝트 삭제는 관리자만 가능합니다.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        project = self.get_object()
        project_name = project.name
        project_id = project.id
        
        project.delete()
        
        return Response({
            'message': f'프로젝트 "{project_name}" (ID: {project_id})이(가) 삭제되었습니다.',
            'deleted_id': project_id
        }, status=status.HTTP_200_OK)

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