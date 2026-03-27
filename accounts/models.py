from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', '최고관리자'),
        ('manager', '경영진'),
        ('pm', 'PM'),
        ('designer', '설계담당'),
        ('constructor', '시공담당'),
        ('member', '팀원'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member', verbose_name='역할')
    team = models.CharField(max_length=100, blank=True, verbose_name='소속팀')
    department = models.CharField(max_length=100, blank=True, verbose_name='부서')
    phone = models.CharField(max_length=20, blank=True, verbose_name='연락처')
    position = models.CharField(max_length=50, blank=True, verbose_name='직책')

    class Meta:
        verbose_name = '사용자'
        verbose_name_plural = '사용자들'

    def __str__(self):
        return self.username

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_manager(self):
        return self.role in ['admin', 'manager']

    @property
    def is_pm(self):
        return self.role == 'pm'

    @property
    def can_approve(self):
        return self.role in ['admin', 'manager', 'pm']