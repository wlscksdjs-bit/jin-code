from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from projects.models import Project, ProjectVersion
from cost.models import Budget, Expense
from schedule.models import Task
from resources.models import ResourceAllocation, ResourceConflict
from .models import Notification, ProjectHealth


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        now = timezone.now()

        project_stats = Project.objects.aggregate(
            total=Count('id'),
            waiting=Count('id', filter=Q(status='waiting')),
            planning=Count('id', filter=Q(status='planning')),
            in_progress=Count('id', filter=Q(status='in_progress')),
            completed=Count('id', filter=Q(status='completed')),
            cancelled=Count('id', filter=Q(status='cancelled')),
        )

        budget_stats = Budget.objects.filter(
            project__status__in=['planning', 'in_progress']
        ).aggregate(
            total_planned=Sum('planned_amount'),
        )

        expense_stats = Expense.objects.filter(
            status='approved',
            budget__project__status__in=['planning', 'in_progress']
        ).aggregate(
            total_used=Sum('amount'),
        )

        delayed_tasks = Task.objects.filter(status='delayed').count()
        
        unresolved_conflicts = ResourceConflict.objects.filter(is_resolved=False).count()

        pending_approvals = 0

        return Response({
            'projects': project_stats,
            'budget': {
                'planned': str(budget_stats['total_planned'] or 0),
                'used': str(expense_stats['total_used'] or 0),
                'rate': round((float(expense_stats['total_used'] or 0) / float(budget_stats['total_planned'] or 1)) * 100, 1) if budget_stats['total_planned'] else 0,
            },
            'delayed_tasks': delayed_tasks,
            'resource_conflicts': unresolved_conflicts,
            'pending_approvals': pending_approvals,
        })

    @action(detail=False, methods=['get'])
    def project_list(self, request):
        projects = Project.objects.filter(status__in=['planning', 'in_progress']).annotate(
            budget_used=Sum('budgets__expenses__amount', filter=Q(budgets__expenses__status='approved')),
            budget_planned=Sum('budgets__planned_amount'),
            task_total=Count('tasks'),
            task_completed=Count('tasks', filter=Q(tasks__status='completed')),
            task_delayed=Count('tasks', filter=Q(tasks__status='delayed')),
        ).order_by('-created_at')[:10]

        data = []
        for p in projects:
            budget_rate = 0
            if p.budget_planned:
                budget_rate = (float(p.budget_used or 0) / float(p.budget_planned)) * 100
            
            task_rate = 0
            if p.task_total:
                task_rate = (p.task_completed / p.task_total) * 100

            data.append({
                'id': p.id,
                'name': p.name,
                'client': p.client,
                'status': p.status,
                'budget': {
                    'planned': str(p.budget_planned or 0),
                    'used': str(p.budget_used or 0),
                    'rate': round(budget_rate, 1),
                },
                'tasks': {
                    'total': p.task_total,
                    'completed': p.task_completed,
                    'delayed': p.task_delayed,
                    'rate': round(task_rate, 1),
                },
            })

        return Response(data)

    @action(detail=False, methods=['get'])
    def budget_alerts(self, request):
        budgets = Budget.objects.filter(
            project__status__in=['planning', 'in_progress']
        ).select_related('project', 'category')

        alerts = []
        for budget in budgets:
            used = float(budget.used_amount)
            planned = float(budget.planned_amount)
            if planned > 0:
                usage_rate = (used / planned) * 100
                if usage_rate >= 95:
                    alerts.append({
                        'type': 'budget_overrun',
                        'level': 'critical',
                        'project': budget.project.name,
                        'category': budget.category.name,
                        'message': f"{budget.project.name} - {budget.category.name} 예산의 {round(usage_rate)}% 사용",
                        'link': f'/projects/{budget.project.id}/cost',
                    })
                elif usage_rate >= 80:
                    alerts.append({
                        'type': 'budget_warning',
                        'level': 'warning',
                        'project': budget.project.name,
                        'category': budget.category.name,
                        'message': f"{budget.project.name} - {budget.category.name} 예산의 {round(usage_rate)}% 사용",
                        'link': f'/projects/{budget.project.id}/cost',
                    })

        return Response(alerts)

    @action(detail=False, methods=['get'])
    def schedule_alerts(self, request):
        two_weeks_later = timezone.now().date() + timedelta(days=14)

        delayed_tasks = Task.objects.filter(
            status='delayed',
            project__status__in=['planning', 'in_progress']
        ).select_related('project', 'assignee')[:10]

        upcoming_milestones = Task.objects.filter(
            is_milestone=True,
            status__in=['pending', 'in_progress'],
            end_date__lte=two_weeks_later,
            project__status__in=['planning', 'in_progress']
        ).select_related('project')[:10]

        alerts = []

        for task in delayed_tasks:
            alerts.append({
                'type': 'schedule_delay',
                'level': 'critical' if task.end_date < timezone.now().date() else 'warning',
                'project': task.project.name,
                'task': task.name,
                'message': f"{task.project.name} - {task.name} 작업이 지연되었습니다.",
                'link': f'/projects/{task.project.id}/schedule',
            })

        for task in upcoming_milestones:
            days_left = (task.end_date - timezone.now().date()).days
            alerts.append({
                'type': 'milestone_approaching',
                'level': 'warning',
                'project': task.project.name,
                'task': task.name,
                'message': f"{task.name} 마일스톤까지 {days_left}일 남음",
                'link': f'/projects/{task.project.id}/schedule',
            })

        return Response(alerts)

    @action(detail=False, methods=['get'])
    def resource_alerts(self, request):
        conflicts = ResourceConflict.objects.filter(is_resolved=False).select_related('user')[:10]

        alerts = []
        for conflict in conflicts:
            alerts.append({
                'type': 'resource_conflict',
                'level': 'warning',
                'user': conflict.user.get_full_name(),
                'period': f"{conflict.start_date} ~ {conflict.end_date}",
                'message': f"{conflict.user.get_full_name()}님의 투입률이 {conflict.total_allocation_rate}%입니다.",
                'link': '/resources',
            })

        return Response(alerts)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response({'status': 'ok'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True, read_at=timezone.now())
        return Response({'status': 'ok'})