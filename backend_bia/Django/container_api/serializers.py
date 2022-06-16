from djoser.serializers import UserCreateSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Measurement, Model
User = get_user_model()


class UserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'password', 'profession', 'medical_certificate', 'social_apps')
        
        
class ModelSerializer(serializers.ModelSerializer):

    class Meta:
        model = Model
        fields = ['name', 'port', 'last_modification_at', 'last_modification_by', 'algorithm_overview', 
        'model_architecture', 'model_performance', 'data_description', 'version', 'input', 'output', 
        'references', 'additional_info', 'user', 'task', 'inputExtension', 'inputModality', 'framework', 'visibility', 
        'file', 'created_at', 'bodyPart']


class MeasurementSerializer(serializers.ModelSerializer):

    class Meta:
        model = Measurement
        fields = ['instance_uid', 'measurement_number', 'displayText', 'toolType', 'last_modification_at', 'last_modification_by', 'study', 'wadorsURI', 'created_at', 'user', 'report', 'label', 'description']


class EditModelSerializer(serializers.Serializer):

    name = serializers.CharField(max_length=200)

    version = serializers.IntegerField()

    algorithm_overview = serializers.CharField(max_length=500)

    model_architecture = serializers.CharField(max_length=500)

    model_performance = serializers.CharField(max_length=500)

    data_description = serializers.CharField(max_length=500)

    input = serializers.CharField(max_length=500)

    output = serializers.CharField(max_length=600)

    references = serializers.CharField(max_length=500, default='', allow_blank=True)

    additional_info = serializers.CharField(max_length=500, default='', allow_blank=True)

    task = serializers.CharField(
       max_length=32,
       default=''
    )

    inputExtension = serializers.CharField(
       max_length=32,
       default=''
    )

    inputModality = serializers.CharField(
       max_length=100,
       default=''
    )

    framework = serializers.CharField(
       max_length=100,
       default=''
    )

    bodyPart = serializers.CharField(
       max_length=100,
       default=''
    )


class FileSerializer(serializers.Serializer):
    file = serializers.FileField()
 