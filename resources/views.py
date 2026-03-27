from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from .models import ResourceAllocation, ResourceConflict
from .serializers import ResourceAllocationSerializer, ResourceConflictSerializer


class ResourceAllocationViewSet(viewsets.ModelViewSet):
    queryset = ResourceAllocation.objects.all()
    serializer_class = ResourceAllocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        user_id = self.request.query_params.get('user')
        
        queryset = ResourceAllocation.objects.select_related('project', 'user')
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        return queryset

    @action(detail=False, methods=['get'])
    def conflicts(self, request):
        conflicts = ResourceConflict.objects.filter(is_resolved=False).select_related('user')
        return Response(ResourceConflictSerializer(conflicts, many=True).data)

    @action(detail=False, methods=['get'])
    def check_conflicts(self, request):
        user_id = request.query_params.get('user_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        current_rate = float(request.query_params.get('allocation_rate', 0))

        if not all([user_id, start_date, end_date]):
            return Response({'error': '필수 파라미터 누락'}, status=status.HTTP_400_BAD_REQUEST)

        existing = ResourceAllocation.objects.filter(
            user_id=user_id,
            start_date__lte=end_date,
            end_date__gte=start_date,
            project__status__in=['planning', 'in_progress']
        )

        existing_rate = existing.aggregate(total=Sum('allocation_rate'))['total'] or 0
        total_rate = existing_rate + current_rate

        return Response({
            'has_conflict': total_rate > 100,
            'existing_rate': float(existing_rate),
            'total_rate': total_rate,
            'message': f'총 투입률 {total_rate}% (100% 초과)' if total_rate > 100 else '투입 가능'
        })

    @action(detail=False, methods=['get'])
    def heatmap(self, request):
        year = int(request.query_params.get('year', 2025))
        month = int(request.query_params.get('month', 1))
        
        from datetime import date
        from calendar import monthrange
        
        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])

        allocations = ResourceAllocation.objects.filter(
            start_date__lte=end_date,
            end_date__gte=start_date,
            project__status__in=['planning', 'in_progress']
        ).select_related('project', 'user')

        heatmap_data = {}
        for allocation in allocations:
            key = allocation.user.id
            if key not in heatmap_data:
                heatmap_data[key] = {
                    'user_id': allocation.user.id,
                    'user_name': allocation.user.get_full_name(),
                    'total_rate': 0,
                    'projects': []
                }
            heatmap_data[key]['total_rate'] += float(allocation.allocation_rate)
            heatmap_data[key]['projects'].append({
                'project_name': allocation.project.name,
                'rate': float(allocation.allocation_rate)
            })

        return Response(list(heatmap_data.values()))