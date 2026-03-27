from rest_framework import serializers
from .models import ResourceAllocation, ResourceConflict


class ResourceAllocationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    duration_months = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = ResourceAllocation
        fields = [
            'id', 'project', 'project_name', 'user', 'user_name', 'role', 'role_display',
            'start_date', 'end_date', 'allocation_rate', 'hours_per_month', 'description',
            'duration_days', 'duration_months', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        allocation = super().create(validated_data)
        self._check_conflicts(allocation)
        return allocation

    def _check_conflicts(self, allocation):
        conflicts = ResourceAllocation.objects.filter(
            user=allocation.user,
            start_date__lte=allocation.end_date,
            end_date__gte=allocation.start_date,
            project__status__in=['planning', 'in_progress']
        ).exclude(id=allocation.id)

        total_rate = sum([a.allocation_rate for a in conflicts]) + allocation.allocation_rate
        if total_rate > 100:
            ResourceConflict.objects.get_or_create(
                user=allocation.user,
                start_date=min([a.start_date for a in conflicts] + [allocation.start_date]),
                end_date=max([a.end_date for a in conflicts] + [allocation.end_date]),
                defaults={'total_allocation_rate': total_rate}
            )


class ResourceConflictSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    allocations = serializers.SerializerMethodField()

    class Meta:
        model = ResourceConflict
        fields = ['id', 'user', 'user_name', 'start_date', 'end_date', 'total_allocation_rate', 'is_resolved', 'allocations', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_allocations(self, obj):
        return ResourceAllocationSerializer(obj.conflict_allocations.all(), many=True).data