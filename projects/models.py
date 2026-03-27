from django.db import models
from django.conf import settings


class Project(models.Model):
    STATUS_CHOICES = [
        ('waiting', '대기'),
        ('planning', ' 기획'),
        ('in_progress', '진행'),
        ('completed', '완료'),
        ('cancelled', '취소'),
    ]

    name = models.CharField(max_length=200, verbose_name='프로젝트명')
    client = models.CharField(max_length=200, verbose_name='고객사')
    description = models.TextField(blank=True, verbose_name='프로젝트 설명')
    start_date = models.DateField(verbose_name='시작일')
    end_date = models.DateField(verbose_name='종료일')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting', verbose_name='상태')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '프로젝트'
        verbose_name_plural = '프로젝트들'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def current_version(self):
        return self.versions.first()

    @property
    def latest_version_number(self):
        version = self.versions.first()
        return version.version_number if version else 'v0.0'


class ProjectVersion(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='versions')
    version_number = models.CharField(max_length=20, verbose_name='버전')
    estimated_cost = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='예상원가')
    target_price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='목표입찰가')
    target_profit_rate = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='목표수익률(%)')
    proposed_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name='제안입찰가')
    notes = models.TextField(blank=True, verbose_name='비고')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_versions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = '프로젝트 버전'
        verbose_name_plural = '프로젝트 버전들'
        ordering = ['-created_at']
        unique_together = ['project', 'version_number']

    def __str__(self):
        return f"{self.project.name} - {self.version_number}"

    def save(self, *args, **kwargs):
        if not self.version_number:
            last_version = ProjectVersion.objects.filter(project=self.project).first()
            if last_version:
                try:
                    major, minor = last_version.version_number.replace('v', '').split('.')
                    self.version_number = f"v{int(major)}.{int(minor) + 1}"
                except:
                    self.version_number = 'v1.0'
            else:
                self.version_number = 'v1.0'

        if self.target_price and not self.proposed_price:
            self.proposed_price = self.target_price

        super().save(*args, **kwargs)