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