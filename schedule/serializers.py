from rest_framework import serializers
from .models import Task, TaskDependency


class TaskDependencySerializer(serializers.ModelSerializer):
    predecessor_name = serializers.CharField(source='predecessor.name', read_only=True)
    successor_name = serializers.CharField(source='successor.name', read_only=True)

    class Meta:
        model = TaskDependency
        fields = ['id', 'predecessor', 'predecessor_name', 'successor', 'successor_name', 'dependency_type', 'lag_days']


class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source='assignee.get_full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    subtasks = serializers.SerializerMethodField()
    dependencies = serializers.SerializerMethodField()
    is_delayed = serializers.BooleanField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_name', 'parent', 'parent_name', 'name', 'description',
            'start_date', 'end_date', 'progress', 'status', 'status_display', 'assignee', 'assignee_name',
            'dependencies', 'subtasks', 'order', 'is_milestone', 'is_delayed', 'duration_days',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_subtasks(self, obj):
        if obj.parent is None:
            return TaskSerializer(obj.subtasks.all(), many=True).data
        return []

    def get_dependencies(self, obj):
        return TaskDependencySerializer(obj.predecessor_relations.all(), many=True).data


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['project', 'parent', 'name', 'description', 'start_date', 'end_date', 'assignee', 'order', 'is_milestone']


class GanttChartSerializer(serializers.ModelSerializer):
    name = serializers.CharField()
    start = serializers.DateField(source='start_date')
    end = serializers.DateField(source='end_date')
    progress = serializers.IntegerField()
    dependencies = serializers.SerializerMethodField()
    assignee_name = serializers.SerializerMethodField()
    is_milestone = serializers.BooleanField()
    status = serializers.CharField()

    class Meta:
        model = Task
        fields = ['id', 'name', 'start', 'end', 'progress', 'dependencies', 'assignee_name', 'is_milestone', 'status']

    def get_dependencies(self, obj):
        deps = obj.predecessor_relations.all()
        return [{'taskId': d.predecessor.id, 'type': d.dependency_type} for d in deps]

    def get_assignee_name(self, obj):
        return obj.assignee.get_full_name() if obj.assignee else None