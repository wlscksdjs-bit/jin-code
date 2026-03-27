from rest_framework import serializers
from .models import Project, ProjectVersion


class ProjectVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectVersion
        fields = ['id', 'version_number', 'estimated_cost', 'target_price', 'target_profit_rate', 'proposed_price', 'notes', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']


class ProjectSerializer(serializers.ModelSerializer):
    versions = ProjectVersionSerializer(many=True, read_only=True)
    current_version = ProjectVersionSerializer(read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    latest_version_number = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'client', 'description', 'start_date', 'end_date', 'status', 'created_by', 'created_by_name', 'created_at', 'updated_at', 'versions', 'current_version', 'latest_version_number']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ProjectVersionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectVersion
        fields = ['estimated_cost', 'target_price', 'target_profit_rate', 'proposed_price', 'notes']

    def validate(self, attrs):
        target_price = attrs.get('target_price')
        estimated_cost = attrs.get('estimated_cost')
        target_profit_rate = attrs.get('target_profit_rate')

        if target_price and estimated_cost:
            calculated_profit_rate = ((target_price - estimated_cost) / target_price) * 100
            attrs['calculated_profit_rate'] = round(calculated_profit_rate, 2)

        if target_profit_rate and estimated_cost and not target_price:
            attrs['suggested_price'] = estimated_cost / (1 - target_profit_rate / 100)

        return attrs


class BidSimulationSerializer(serializers.Serializer):
    estimated_cost = serializers.DecimalField(max_digits=15, decimal_places=2)
    target_profit_rate = serializers.DecimalField(max_digits=5, decimal_places=2)

    def to_representation(self, instance):
        estimated_cost = instance.get('estimated_cost')
        target_profit_rate = instance.get('target_profit_rate')

        suggested_price = estimated_cost / (1 - target_profit_rate / 100) if target_profit_rate else 0
        expected_profit = suggested_price - estimated_cost if suggested_price else 0
        actual_profit_rate = ((suggested_price - estimated_cost) / suggested_price * 100) if suggested_price else 0

        return {
            'estimated_cost': str(estimated_cost),
            'target_profit_rate': str(target_profit_rate),
            'suggested_price': str(round(suggested_price, 2)),
            'expected_profit': str(round(expected_profit, 2)),
            'actual_profit_rate': str(round(actual_profit_rate, 2)),
        }