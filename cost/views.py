from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from .models import CostCategory, Budget, Vendor, Expense
from .serializers import (
    CostCategorySerializer, BudgetSerializer, BudgetCreateSerializer,
    VendorSerializer, ExpenseSerializer, ExpenseCreateSerializer
)


class CostCategoryViewSet(viewsets.ModelViewSet):
    queryset = CostCategory.objects.all()
    serializer_class = CostCategorySerializer
    permission_classes = [IsAuthenticated]


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Vendor.objects.filter(is_active=True)


class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return BudgetCreateSerializer
        return BudgetSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        if project_id:
            return Budget.objects.filter(project_id=project_id).select_related('category', 'project')
        return Budget.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def matrix(self, request):
        from projects.models import Project
        from django.db.models import Sum
        
        projects = Project.objects.filter(status__in=['planning', 'in_progress']).order_by('-created_at')[:10]
        categories = CostCategory.objects.filter(is_active=True).order_by('category_type', 'name')
        
        matrix_data = []
        
        for category in categories:
            row = {
                'category_id': category.id,
                'category_name': category.name,
                'category_type': category.category_type,
                'category_type_display': category.get_category_type_display(),
            }
            
            for project in projects:
                budget = Budget.objects.filter(project=project, category=category).first()
                if budget:
                    expenses = budget.expenses.filter(status='approved')
                    used = expenses.aggregate(total=Sum('amount'))['total'] or 0
                    pending = budget.expenses.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
                    remaining = float(budget.planned_amount) - float(used) - float(pending)
                    
                    row[f'project_{project.id}'] = {
                        'budget_id': budget.id,
                        'planned': float(budget.planned_amount),
                        'used': float(used),
                        'pending': float(pending),
                        'remaining': remaining,
                        'status': 'overrun' if remaining < 0 else 'warning' if remaining < float(budget.planned_amount) * 0.2 else 'ok'
                    }
                else:
                    row[f'project_{project.id}'] = None
            
            matrix_data.append(row)
        
        project_summaries = []
        for project in projects:
            budgets = Budget.objects.filter(project=project)
            total_planned = sum(float(b.planned_amount) for b in budgets)
            total_used = sum(
                budget.expenses.filter(status='approved').aggregate(total=Sum('amount'))['total'] or 0 
                for budget in budgets
            )
            total_pending = sum(
                budget.expenses.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0 
                for budget in budgets
            )
            
            project_summaries.append({
                'project_id': project.id,
                'project_name': project.name,
                'client': project.client,
                'status': project.status,
                'total_planned': total_planned,
                'total_used': total_used,
                'total_pending': total_pending,
                'total_remaining': total_planned - total_used - total_pending,
            })
        
        return Response({
            'categories': [{'id': c.id, 'name': c.name, 'type': c.category_type, 'type_display': c.get_category_type_display()} for c in categories],
            'projects': project_summaries,
            'matrix': matrix_data,
        })

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        budget = self.get_object()
        expenses = budget.expenses.filter(status='approved')
        total_used = expenses.aggregate(total=Sum('amount'))['total'] or 0
        total_pending = budget.expenses.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'planned': str(budget.planned_amount),
            'used': str(total_used),
            'pending': str(total_pending),
            'remaining': str(budget.planned_amount - (total_used + total_pending)),
            'variance': str(budget.planned_amount - total_used),
            'variance_status': 'savings' if budget.planned_amount > total_used else 'overrun'
        })


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ExpenseCreateSerializer
        return ExpenseSerializer

    def get_queryset(self):
        budget_id = self.request.query_params.get('budget')
        project_id = self.request.query_params.get('project')
        
        queryset = Expense.objects.select_related('budget__category', 'budget__project', 'vendor', 'submitted_by', 'approved_by')
        
        if budget_id:
            queryset = queryset.filter(budget_id=budget_id)
        elif project_id:
            queryset = queryset.filter(budget__project_id=project_id)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        expense = self.get_object()
        expense.status = 'submitted'
        expense.save()
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        expense = self.get_object()
        if not request.user.can_approve:
            return Response({'error': '승인 권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
        expense.status = 'approved'
        expense.approved_by = request.user
        expense.save()
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        expense = self.get_object()
        if not request.user.can_approve:
            return Response({'error': '승인 권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
        expense.status = 'rejected'
        expense.approved_by = request.user
        expense.save()
        return Response(ExpenseSerializer(expense).data)

    @action(detail=False, methods=['get'], url_path='project/(?P<project_id>[^/.]+)')
    def by_project(self, request, project_id=None):
        expenses = Expense.objects.filter(budget__project_id=project_id).select_related(
            'budget__category', 'budget__project', 'vendor', 'submitted_by', 'approved_by'
        )
        return Response(ExpenseSerializer(expenses, many=True).data)