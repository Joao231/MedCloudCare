from django.contrib import admin
from django.urls import path
from . import views

app_name = "container_api"

urlpatterns = [
    path('example', views.Example.as_view()),
    path('model/', views.models),
    path('model_validation/', views.model_validation),
    path('model_delete/', views.model_delete),
    path('infer/<model>/<image>', views.ai_prediction),
]