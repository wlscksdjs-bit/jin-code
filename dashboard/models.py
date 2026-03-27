from django.db import models
from django.conf import settings
from projects.models import Project


class Notification(models.Model):
    TYPE_CHOICES = [
        ('budget_overrun', '예산 초과'),
        ('schedule_delay', '일정 지연'),
        ('resource_conflict', '인력 충돌'),
        ('approval_pending', '결재 대기'),
        ('milestone_approaching', '마일스톤 임박'),
    ]

    LEVEL_CHOICES = [
        ('info', '정보'),
        ('warning', '경고'),
        ('critical', '심각'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='info')
    title = models.CharField(max_length=200, verbose_name='제목')
    message = models.TextField(verbose_name='메시지')
    link = models.CharField(max_length=200, blank=True, verbose_name='연결 링크')
    is_read = models.BooleanField(default=False, verbose_name='읽음 여부')
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = '알림'
        verbose_name_plural = '알림들'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class ProjectHealth(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='health')
    budget_health = models.CharField(max_length=20, choices=[
        ('healthy', '정상'), ('warning', '주의'), ('critical', '위험')
    ], default='healthy')
    schedule_health = models.CharField(max_length=20, choices=[
        ('healthy', '정상'), ('warning', '주의'), ('critical', '위험')
    ], default='healthy')
    resource_health = models.CharField(max_length=20, choices=[
        ('healthy', '정상'), ('warning', '주의'), ('critical', '위험')
    ], default='healthy')
    overall_health = models.CharField(max_length=20, choices=[
        ('healthy', '정상'), ('warning', '주의'), ('critical', '위험')
    ], default='healthy')
    last_checked = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '프로젝트 상태'
        verbose_name_plural = '프로젝트 상태들'

    def __str__(self):
        return f"{self.project.name} - {self.overall_health}"