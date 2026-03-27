from rest_framework import serializers
from .models import ApprovalType, ApprovalLine, ApprovalLineMember, Approval, ApprovalStep, ApprovalAction


class ApprovalTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalType
        fields = ['id', 'name', 'code', 'description', 'requires_expense']
        read_only_fields = ['id']


class ApprovalLineMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = ApprovalLineMember
        fields = ['user', 'user_name', 'order']


class ApprovalLineSerializer(serializers.ModelSerializer):
    members = ApprovalLineMemberSerializer(many=True, read_only=True)
    approvers_list = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalLine
        fields = ['id', 'name', 'description', 'approvers_list', 'is_default', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_approvers_list(self, obj):
        members = obj.approvallinemember_set.order_by('order')
        return [{'id': m.user.id, 'name': m.user.get_full_name()} for m in members]


class ApprovalStepSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)

    class Meta:
        model = ApprovalStep
        fields = ['id', 'order', 'approver', 'approver_name', 'status', 'comment', 'acted_at']


class ApprovalActionSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)

    class Meta:
        model = ApprovalAction
        fields = ['id', 'approver', 'approver_name', 'action', 'comment', 'created_at']


class ApprovalSerializer(serializers.ModelSerializer):
    approval_type_name = serializers.CharField(source='approval_type.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    requester_name = serializers.CharField(source='requester.get_full_name', read_only=True)
    current_approver_name = serializers.CharField(source='current_approver.get_full_name', read_only=True)
    steps = ApprovalStepSerializer(many=True, read_only=True)
    actions = ApprovalActionSerializer(many=True, read_only=True)

    class Meta:
        model = Approval
        fields = [
            'id', 'project', 'project_name', 'approval_type', 'approval_type_name',
            'title', 'content', 'amount', 'status', 'requester', 'requester_name',
            'current_approver', 'current_approver_name', 'current_step',
            'submitted_at', 'completed_at', 'created_at', 'updated_at',
            'steps', 'actions'
        ]
        read_only_fields = ['id', 'requester', 'submitted_at', 'completed_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['requester'] = self.context['request'].user
        return super().create(validated_data)


class ApprovalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Approval
        fields = ['project', 'approval_type', 'title', 'content', 'amount', 'approvers']

    def create(self, validated_data):
        approvers = validated_data.pop('approvers', [])
        approval = Approval.objects.create(**validated_data)
        for i, approver in enumerate(approvers):
            ApprovalStep.objects.create(approval=approval, order=i + 1, approver=approver)
        return approval


class ApprovalActionRequestSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True)