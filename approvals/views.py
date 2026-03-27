from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ApprovalType, ApprovalLine, Approval, ApprovalStep
from .serializers import (
    ApprovalTypeSerializer, ApprovalLineSerializer, ApprovalSerializer,
    ApprovalCreateSerializer, ApprovalActionRequestSerializer
)


class ApprovalTypeViewSet(viewsets.ModelViewSet):
    queryset = ApprovalType.objects.all()
    serializer_class = ApprovalTypeSerializer
    permission_classes = [IsAuthenticated]


class ApprovalLineViewSet(viewsets.ModelViewSet):
    queryset = ApprovalLine.objects.all()
    serializer_class = ApprovalLineSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        line = serializer.save()
        approvers = self.request.data.get('approvers', [])
        for i, user_id in enumerate(approvers):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            from .models import ApprovalLineMember
            try:
                user = User.objects.get(id=user_id)
                ApprovalLineMember.objects.create(line=line, user=user, order=i + 1)
            except User.DoesNotExist:
                pass


class ApprovalViewSet(viewsets.ModelViewSet):
    queryset = Approval.objects.all()
    serializer_class = ApprovalSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ApprovalCreateSerializer
        return ApprovalSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Approval.objects.all()
        return Approval.objects.filter(requester=user)

    def perform_create(self, serializer):
        approval = serializer.save()
        if self.request.data.get('approvers'):
            approver_ids = self.request.data.get('approvers')
            from django.contrib.auth import get_user_model
            User = get_user_model()
            for i, approver_id in enumerate(approver_ids):
                try:
                    approver = User.objects.get(id=approver_id)
                    ApprovalStep.objects.create(approval=approval, order=i + 1, approver=approver)
                except User.DoesNotExist:
                    pass

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        approval = self.get_object()
        if approval.requester != request.user:
            return Response({'error': '상신 권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
        if approval.status != 'draft':
            return Response({'error': '이미 상신된 결재입니다.'}, status=status.HTTP_400_BAD_REQUEST)
        
        approval.submit()
        return Response(ApprovalSerializer(approval).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        approval = self.get_object()
        if approval.current_approver != request.user:
            return Response({'error': '승인 권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ApprovalActionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        approval.approve(request.user)
        return Response(ApprovalSerializer(approval).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        approval = self.get_object()
        if approval.current_approver != request.user:
            return Response({'error': '반려 권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ApprovalActionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        comment = serializer.validated_data.get('comment', '')
        approval.reject(request.user, comment)
        return Response(ApprovalSerializer(approval).data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        approvals = Approval.objects.filter(current_approver=request.user, status='pending')
        return Response(ApprovalSerializer(approvals, many=True).data)