from django.urls import path
from . import views


urlpatterns = [

    path('model/', views.models),
    path('measurement/', views.measurements),
    path('measurement_delete/', views.measurement_delete),
    path('segmentation_delete/', views.segmentation_delete),
    path('model_delete/', views.model_delete),
    path('image/', views.images),
    path('image_encrypt/', views.images_encrypt),
    path('image_decrypt/', views.images_decrypt),
    path('infer/<model>/<image>', views.ai_prediction),
    path('label/', views.api_save_label),
    path('encrypt_db/<str:email>', views.encrypt_db),
    path('set_social_apps/<str:email>', views.set_social_apps),


    path('change_approval', views.Change_Approval.as_view()),
    path('change_to2FA', views.change_to2FA.as_view()),
    path('check_secret', views.check_Secret.as_view()),
    path('check_secret_login/<str:email>', views.check_Secret_login),
    path('check_medical_certificate', views.check_MedicalCertificate.as_view()),
    path('check_medical_certificate_login/<str:email>', views.check_MedicalCertificate_login),
    path('add_description', views.add_Description.as_view()),
    path('2FA_login', views.AuthCheckView_Login.as_view()),
    path('2FA_login_login', views.AuthCheckView_Login_login),
    path('check_superuser/<str:email>', views.Check_Superuser),
    path('get_url_medicalcertificate', views.Get_url_medicalcertificate.as_view()),
    path('add_main_group', views.Add_main_group),
    path('check_main_group', views.Check_main_group.as_view()),
    path('check_main_group_login/<str:email>', views.Check_main_group_login),
    path('check_user_groups', views.Check_user_groups.as_view()),
    path('group_details', views.Group_details.as_view()),
    path('view_studies', views.View_studies.as_view()), #new
    path('permissions_studies', views.Permissions_studies.as_view()),
    path('view_models', views.View_models.as_view()), #new
    path('permissions_models', views.Permissions_models.as_view()),
    path('health_professional_add_group', views.Health_Professional_Add_group.as_view()),
    path('investigator_add_group', views.Investigator_Add_group.as_view()),
    path('remove_group', views.Remove_group.as_view()),
    path('see_permissions', views.See_permissions.as_view()),
    path('add_permissions', views.Add_permissions.as_view()),
    path('remove_permissions', views.Remove_permissions.as_view()),
    path('add_elements', views.Add_elements.as_view()),
    path('remove_elements', views.Remove_elements.as_view()),
    path('investigator_add_models', views.Investigator_Add_models.as_view()), #novo
    path('investigator_remove_models', views.Investigator_Remove_models.as_view()), #novo
    path('health_professional_add_studies', views.Health_Professional_Add_studies.as_view()), #novo
    path('health_professional_remove_studies', views.Health_Professional_Remove_studies.as_view()), #novo
]

