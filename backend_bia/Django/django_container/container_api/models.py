from django.db import models
from django.utils.translation import gettext as _

# Create your models here.

class Model(models.Model):

    id = models.AutoField(primary_key=True)

    name = models.CharField(unique=True, max_length=200, default='', null=False)

    version = models.IntegerField(null=False)

    algorithm_overview = models.CharField(max_length=500, default='', null=False)

    model_architecture = models.CharField(max_length=500, default='', null=False)

    model_performance = models.CharField(max_length=500, default='', null=False)

    data_description = models.CharField(max_length=500, default='', null=False)

    input = models.CharField(max_length=500, default='', null=False)

    output = models.CharField(max_length=600, default='', null=False)

    references = models.CharField(max_length=500, default='')

    additional_info = models.CharField(max_length=500, default='')
    
    file = models.FileField(upload_to='D:/tese/django_container/media/models', blank=True, null=False)

    created_at = models.DateTimeField(auto_now_add=True)

    # Vai corresponder ao Id===email do User que carregou o modelo
    #user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)

    # Lista dos utilizadores que têm acesso ao modelo. Por defeito, só quem criou o modelo tem acesso.
    #access_users = models.ManyToManyField(UserAccount, related_name="model_access_users", default=[user])

    visibility = models.BooleanField(default=False)

    PROCESSING = 'Image Processing'
    REGISTRATION = 'Image Registration'
    LOCALISATION = 'Object Localisation'
    CLASSIFICATION = 'Classification'
    DETECTION = 'Lesion Detection'
    SEGMENTATION = 'Segmentation'
    TYPES = [
        (PROCESSING, _('Image Processing')),
        (REGISTRATION, _('Image Registration')),
        (LOCALISATION, _('Object Localisation')),
        (CLASSIFICATION, _('Classification')),
        (DETECTION, _('Lesion Detection')),
        (SEGMENTATION, _('Segmentation'))
    ]

    task = models.CharField(
       max_length=32,
       choices=TYPES,
       default=''
    )


    def __str__(self):
        return f"{self.file}"