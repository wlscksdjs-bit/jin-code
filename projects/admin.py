from django.contrib import admin
from .models import Project, ProjectVersion


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'client', 'start_date', 'end_date', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'client', 'start_date']
    search_fields = ['name', 'client', 'description']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(ProjectVersion)
class ProjectVersionAdmin(admin.ModelAdmin):
    list_display = ['project', 'version_number', 'estimated_cost', 'target_price', 'target_profit_rate', 'created_by', 'created_at']
    list_filter = ['version_number', 'created_at']
    search_fields = ['project__name', 'notes']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']