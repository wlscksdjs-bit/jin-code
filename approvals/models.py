from django.db import models
from django.conf import settings
from projects.models import Project


class ApprovalType(models.Model):
    name = models.CharField(max_length=100, verbose_name='결재 유형')
    code = models.CharField(max_length=50, unique=True, verbose_name='코드')
    description = models.TextField(blank=True, verbose_name='설명')
    requires_expense = models.BooleanField(default=True, verbose_name='비용 연결 필요')

    class Meta:
        verbose_name = '결재 유형'
        verbose_name_plural = '결재 유형들'

    def __str__(self):
        return self.name


class ApprovalLine(models.Model):
    name = models.CharField(max_length=100, verbose_name='결재선명')
    description = models.TextField(blank=True, verbose_name='설명')
    approvers = models.ManyToManyField(settings.AUTH_USER_MODEL, through='ApprovalLineMember', related_name='approval_lines')
    is_default = models.BooleanField(default=False, verbose_name='기본 결재선')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = '결재선'
        verbose_name_plural = '결재선들'

    def __str__(self):
        return self.name


class ApprovalLineMember(models.Model):
    line = models.ForeignKey(ApprovalLine, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order = models.IntegerField(verbose_name='순서')

    class Meta:
        ordering = ['order']


class Approval(models.Model):
    STATUS_CHOICES = [
        ('draft', ' draft'),
        ('pending', '검토중'),
        ('approved', '승인'),
        ('rejected', '반려'),
        ('cancelled', '취소'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='approvals')
    approval_type = models.ForeignKey(ApprovalType, on_delete=models.PROTECT, verbose_name='결재 유형')
    title = models.CharField(max_length=200, verbose_name='제목')
    content = models.TextField(verbose_name='내용')
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name='금액')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='상태')
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='requested_approvals')
    current_approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='pending_approvals')
    current_step = models.IntegerField(default=0, verbose_name='현재 단계')
    submitted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '결재'
        verbose_name_plural = '결재들'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project.name} - {self.title} ({self.get_status_display()})"

    def submit(self):
        self.status = 'pending'
        self.submitted_at = models.DateTimeField.now()
        self._update_current_approver()
        self.save()

    def approve(self, approver):
        from django.db import transaction
        with transaction.atomic():
            ApprovalAction.objects.create(
                approval=self,
                approver=approver,
                action='approve',
                comment='승인'
            )
            self.current_step += 1
            if self.current_step >= self.approval_steps.count():
                self.status = 'approved'
                self.completed_at = models.DateTimeField.now()
                self._on_approved()
            else:
                self._update_current_approver()
            self.save()

    def reject(self, approver, comment):
        from django.db import transaction
        with transaction.atomic():
            ApprovalAction.objects.create(
                approval=self,
                approver=approver,
                action='reject',
                comment=comment
            )
            self.status = 'rejected'
            self.save()

    def _update_current_approver(self):
        next_step = self.approval_steps.filter(order=self.current_step + 1).first()
        if next_step:
            self.current_approver = next_step.approver

    def _on_approved(self):
        from cost.models import Expense
        if hasattr(self, 'expense'):
            expense = self.expense
            expense.status = 'approved'
            expense.approved_by = self.requester
            expense.save()


class ApprovalStep(models.Model):
    approval = models.ForeignKey(Approval, on_delete=models.CASCADE, related_name='approval_steps')
    order = models.IntegerField(verbose_name='순서')
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=[('pending', '대기'), ('approved', '승인'), ('rejected', '반려')], default='pending')
    comment = models.TextField(blank=True)
    acted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['order']


class ApprovalAction(models.Model):
    approval = models.ForeignKey(Approval, on_delete=models.CASCADE, related_name='actions')
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=[('approve', '승인'), ('reject', '반려')])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']