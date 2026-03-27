from rest_framework import serializers
from .models import CostCategory, Budget, Vendor, Expense


class CostCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CostCategory
        fields = ['id', 'name', 'category_type', 'description', 'is_active']
        read_only_fields = ['id']


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['id', 'name', 'business_number', 'contact_person', 'phone', 'email', 'address', 'is_active']
        read_only_fields = ['id']


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.category_type', read_only=True)
    used_amount = serializers.DecimalField(read_only=True, max_digits=15, decimal_places=2)
    current_amount = serializers.DecimalField(read_only=True, max_digits=15, decimal_places=2)
    remaining_amount = serializers.DecimalField(read_only=True, max_digits=15, decimal_places=2)
    expected_final_amount = serializers.DecimalField(read_only=True, max_digits=15, decimal_places=2)
    variance = serializers.DecimalField(read_only=True, max_digits=15, decimal_places=2)
    variance_status = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = [
            'id', 'project', 'category', 'category_name', 'category_type',
            'planned_amount', 'used_amount', 'current_amount', 'remaining_amount',
            'expected_final_amount', 'variance', 'variance_status', 'description',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_variance_status(self, obj):
        if obj.variance > 0:
            return 'savings'
        elif obj.variance < 0:
            return 'overrun'
        return 'on_budget'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.pk:
            data['used_amount'] = str(instance.used_amount)
            data['current_amount'] = str(instance.current_amount)
            data['remaining_amount'] = str(instance.remaining_amount)
            data['expected_final_amount'] = str(instance.expected_final_amount)
            data['variance'] = str(instance.variance)
        return data


class BudgetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['category', 'planned_amount', 'description']


class ExpenseSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    category_name = serializers.CharField(source='budget.category.name', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'budget', 'vendor', 'vendor_name', 'category_name',
            'amount', 'description', 'expense_date', 'status',
            'submitted_by', 'submitted_by_name', 'submitted_at',
            'approved_by', 'approved_by_name', 'approved_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'submitted_by', 'submitted_at', 'approved_by', 'approved_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['submitted_by'] = self.context['request'].user
        return super().create(validated_data)


class ExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['budget', 'vendor', 'amount', 'description', 'expense_date']