from django.db import models
from django.conf import settings
from projects.models import Project


class CostCategory(models.Model):
    CATEGORY_TYPE_CHOICES = [
        ('labor', '인건비'),
        ('material', '자재비'),
        ('outsource', '외주비'),
        ('equipment', '장비비'),
        ('etc', '기타'),
    ]

    name = models.CharField(max_length=100, verbose_name='카테고리명')
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPE_CHOICES, verbose_name='유형')
    description = models.TextField(blank=True, verbose_name='설명')
    is_active = models.BooleanField(default=True, verbose_name='활성화')

    class Meta:
        verbose_name = '비용 카테고리'
        verbose_name_plural = '비용 카테고리들'

    def __str__(self):
        return f"{self.get_category_type_display()} - {self.name}"


class Budget(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(CostCategory, on_delete=models.CASCADE, related_name='budgets')
    planned_amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='계획 금액')
    description = models.TextField(blank=True, verbose_name='설명')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '예산'
        verbose_name_plural = '예산들'
        unique_together = ['project', 'category']

    def __str__(self):
        return f"{self.project.name} - {self.category.name}: {self.planned_amount}"

    @property
    def used_amount(self):
        return self.expenses.filter(status='approved').aggregate(total=models.Sum('amount'))['total'] or 0

    @property
    def current_amount(self):
        return self.expenses.filter(status__in=['pending', 'approved']).aggregate(total=models.Sum('amount'))['total'] or 0

    @property
    def remaining_amount(self):
        return self.planned_amount - self.current_amount

    @property
    def expected_final_amount(self):
        return self.used_amount

    @property
    def variance(self):
        return self.planned_amount - self.expected_final_amount


class Vendor(models.Model):
    name = models.CharField(max_length=200, verbose_name='협력사명')
    business_number = models.CharField(max_length=20, blank=True, verbose_name='사업자등록번호')
    contact_person = models.CharField(max_length=100, blank=True, verbose_name='담당자')
    phone = models.CharField(max_length=20, blank=True, verbose_name='연락처')
    email = models.EmailField(blank=True, verbose_name='이메일')
    address = models.TextField(blank=True, verbose_name='주소')
    is_active = models.BooleanField(default=True, verbose_name='활성화')

    class Meta:
        verbose_name = '협력사'
        verbose_name_plural = '협력사들'

    def __str__(self):
        return self.name


class Expense(models.Model):
    STATUS_CHOICES = [
        ('pending', '대기'),
        ('submitted', '상신'),
        ('approved', '승인'),
        ('rejected', '반려'),
    ]

    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='expenses')
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='금액')
    description = models.TextField(verbose_name='세부 내용')
    expense_date = models.DateField(verbose_name='지출일')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='상태')
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='submitted_expenses')
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_expenses')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '비용'
        verbose_name_plural = '비용들'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.budget.project.name} - {self.amount}"

    def save(self, *args, **kwargs):
        if self.status == 'submitted' and not self.submitted_at:
            self.submitted_at = models.DateTimeField.now()
        if self.status == 'approved' and not self.approved_at:
            self.approved_at = models.DateTimeField.now()
        super().save(*args, **kwargs)