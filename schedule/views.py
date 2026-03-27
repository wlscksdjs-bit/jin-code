from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Task, TaskDependency
from .serializers import TaskSerializer, TaskCreateSerializer, GanttChartSerializer, TaskDependencySerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        
        queryset = Task.objects.select_related('project', 'parent', 'assignee')
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        return queryset

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        task = self.get_object()
        progress = request.data.get('progress')
        
        if progress is None:
            return Response({'error': '진행률 값 필요'}, status=status.HTTP_400_BAD_REQUEST)
        
        task.progress = min(100, max(0, int(progress)))
        task.save()
        
        self._propagate_delay(task)
        
        return Response(TaskSerializer(task).data)

    def _propagate_delay(self, task):
        if task.is_delayed:
            for successor in task.dependents.all():
                if successor.end_date < task.end_date:
                    from datetime import timedelta
                    delay = (task.end_date - successor.end_date).days
                    successor.end_date = task.end_date + timedelta(days=delay)
                    successor.status = 'delayed'
                    successor.save()
                    self._propagate_delay(successor)

    @action(detail=False, methods=['get'])
    def gantt(self, request):
        project_id = request.query_params.get('project')
        
        if not project_id:
            return Response({'error': 'project 파라미터 필요'}, status=status.HTTP_400_BAD_REQUEST)
        
        tasks = Task.objects.filter(project_id=project_id).select_related('assignee')
        return Response(GanttChartSerializer(tasks, many=True).data)

    @action(detail=False, methods=['get'])
    def delayed(self, request):
        tasks = Task.objects.filter(status='delayed').select_related('project', 'assignee')
        return Response(TaskSerializer(tasks, many=True).data)


class TaskDependencyViewSet(viewsets.ModelViewSet):
    queryset = TaskDependency.objects.all()
    serializer_class = TaskDependencySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        task_id = self.request.query_params.get('task')
        if task_id:
            return TaskDependency.objects.filter(Q(predecessor_id=task_id) | Q(successor_id=task_id))
        return TaskDependency.objects.all()