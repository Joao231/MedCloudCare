from .models import Model
from rest_framework import serializers

class ModelSerializer(serializers.ModelSerializer):

    class Meta:
        model = Model
        fields = ['name', 'algorithm_overview', 'model_architecture', 'model_performance', 'data_description',
        'version', 'input', 'output', 'references', 'additional_info', 'user', 'task', 'visibility', 'file', 'created_at']