from django.db import models
from django.conf import settings
from projects.models import Project
from cost.models import Vendor


class ResourceAllocation(models.Model):
    ROLE_CHOICES = [
        ('pm', 'PM'),
        ('designer', '설계담당'),
        ('constructor', '시공담당'),
        ('engineer', '엔지니어'),
        ('assistant', '보조'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='allocations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='allocations', null=True, blank=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='allocations', null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name='역할')
    start_date = models.DateField(verbose_name='투입 시작일')
    end_date = models.DateField(verbose_name='투입 종료일')
    allocation_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100, verbose_name='투입률(%)')
    hours_per_month = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name='월 근무시간')
    description = models.TextField(blank=True, verbose_name='설명')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '인력 배치'
        verbose_name_plural = '인력 배치들'
        unique_together = ['project', 'user', 'start_date', 'end_date']

    def __str__(self):
        if self.user:
            return f"{self.project.name} - {self.user.username} ({self.get_role_display()})"
        elif self.vendor:
            return f"{self.project.name} - {self.vendor.name} ({self.get_role_display()})"
        return f"{self.project.name} - (미지정)"

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.user and not self.vendor:
            raise ValidationError('직원 또는 협력사를 최소 하나 이상 선택해야 합니다.')

    @property
    def duration_days(self):
        return (self.end_date - self.start_date).days

    @property
    def duration_months(self):
        return round(self.duration_days / 30, 2)
    
    @property
    def assigned_name(self):
        """Returns the name of the assigned person or vendor"""
        if self.user:
            return self.user.get_full_name() or self.user.username
        elif self.vendor:
            return self.vendor.name
        return '미지정'
    
    @property
    def assigned_type(self):
        """Returns 'internal' or 'external'"""
        return 'external' if self.vendor else 'internal'


class ResourceConflict(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conflicts')
    start_date = models.DateField()
    end_date = models.DateField()
    total_allocation_rate = models.DecimalField(max_digits=5, decimal_places=2)
    conflict_allocations = models.ManyToManyField(ResourceAllocation, related_name='conflicts')
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = '인력 충돌'
        verbose_name_plural = '인력 충돌들'

    def __str__(self):
        return f"{self.user.username} - {self.start_date} ~ {self.end_date}: {self.total_allocation_rate}%"