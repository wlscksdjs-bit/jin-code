from django.db import models
from django.conf import settings
from projects.models import Project


class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', '대기'),
        ('in_progress', '진행중'),
        ('completed', '완료'),
        ('delayed', '지연'),
        ('cancelled', '취소'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    name = models.CharField(max_length=200, verbose_name='작업명')
    description = models.TextField(blank=True, verbose_name='설명')
    start_date = models.DateField(verbose_name='시작일')
    end_date = models.DateField(verbose_name='종료일')
    progress = models.PositiveIntegerField(default=0, verbose_name='진행률(%)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='상태')
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    dependencies = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='dependents')
    order = models.PositiveIntegerField(default=0, verbose_name='순서')
    is_milestone = models.BooleanField(default=False, verbose_name='마일스톤 여부')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '작업(WBS)'
        verbose_name_plural = '작업들(WBS)'
        ordering = ['project', 'order']

    def __str__(self):
        return f"{self.project.name} - {self.name}"

    @property
    def is_delayed(self):
        if self.status in ['completed', 'cancelled']:
            return False
        from datetime import date
        return date.today() > self.end_date

    @property
    def duration_days(self):
        return (self.end_date - self.start_date).days

    @property
    def is_critical_path(self):
        return self.dependencies.exists()

    def save(self, *args, **kwargs):
        if self.progress >= 100 and self.status not in ['completed', 'cancelled']:
            self.status = 'completed'
        super().save(*args, **kwargs)


class TaskDependency(models.Model):
    DEPENDENCY_TYPE_CHOICES = [
        ('finish_to_start', '종료-시작 (FS)'),
        ('start_to_start', '시작-시작 (SS)'),
        ('finish_to_finish', '종료-종료 (FF)'),
        ('start_to_finish', '시작-종료 (SF)'),
    ]

    predecessor = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='successor_relations')
    successor = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='predecessor_relations')
    dependency_type = models.CharField(max_length=20, choices=DEPENDENCY_TYPE_CHOICES, default='finish_to_start')
    lag_days = models.IntegerField(default=0, verbose_name='지연 일수')

    class Meta:
        verbose_name = '작업 의존성'
        verbose_name_plural = '작업 의존성들'

    def __str__(self):
        return f"{self.predecessor.name} -> {self.successor.name} ({self.get_dependency_type_display()})"