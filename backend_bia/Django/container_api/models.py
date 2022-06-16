from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import Group



class UserAccountManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        user.set_password(password)
        user.save()

        return user
    
    def create_superuser(self, email, password, **extra_fields):
        user = self.create_user(email=email,
            password=password,
            **extra_fields
        )
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        
        return user


def user_directory_path(instance, filename):
    return 'medical_certificates/'+'user_{0}/{1}'.format(instance.email, filename)


class UserAccount(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=255, unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    secret_key = models.CharField(max_length=255, blank=True)
    #profession_CHOICES = [("Health Professional", "Health Professional"),("Investigator", "Investigator")]
    #profession = models.CharField(max_length=255, choices = profession_CHOICES, blank=True)
    profession = models.CharField(max_length=255, blank=True)
    medical_certificate = models.ImageField(upload_to = user_directory_path, blank=True)
    isApproved = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    iv_user = models.CharField(max_length=500, blank=True)
    key_user = models.CharField(max_length=500, blank=True)
    social_apps = models.BooleanField(default=False)

    objects = UserAccountManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'profession', 'medical_certificate']

    def get_full_name(self):
        return self.first_name

    def get_short_name(self):
        return self.first_name
    
    def __str__(self):
        return self.email


class Patient(models.Model):

    id_patient = models.CharField(unique=True, max_length=500, default='', null=False)
    name = models.CharField(max_length=200, default='', null=False)
    iv = models.CharField(unique=True, max_length=500, default='')
    key = models.CharField(unique=True, max_length=500, default='')

    

class GroupExtend(models.Model):
    id = models.AutoField(primary_key=True, null=False)
    group = models.OneToOneField(Group, on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)


class Model(models.Model):

    id = models.AutoField(primary_key=True)

    name = models.CharField(unique=True, max_length=200, default='', null=False)

    port = models.IntegerField(unique=True, blank=True)

    version = models.IntegerField(null=False)

    algorithm_overview = models.CharField(max_length=500, default='', null=False)

    model_architecture = models.CharField(max_length=500, default='', null=False)

    model_performance = models.CharField(max_length=500, default='', null=False)

    data_description = models.CharField(max_length=500, default='', null=False)

    input = models.CharField(max_length=500, default='', null=False)

    output = models.CharField(max_length=600, default='', null=False)

    references = models.CharField(max_length=500, default='')

    additional_info = models.CharField(max_length=500, default='')
    
    file = models.FileField(upload_to='models', blank=True, null=False)

    created_at = models.DateTimeField(auto_now_add=True)

    last_modification_at = models.DateTimeField(auto_now=True)

    last_modification_by = models.EmailField(max_length=255, blank=True)

    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)

    visibility = models.BooleanField(default=False)

    task = models.CharField(
       max_length=32,
       default=''
    )

    inputExtension = models.CharField(
       max_length=32,
       default=''
    )

    inputModality = models.CharField(
       max_length=100,
       default=''
    )

    framework = models.CharField(
       max_length=100,
       default=''
    )

    bodyPart = models.CharField(
       max_length=100,
       default=''
    )

    def __str__(self):
        return f"{self.file}"



class Study(models.Model):

    id = models.AutoField(primary_key=True)

    study_uid = models.CharField(max_length=256, default='', null=False)

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)

    study_date = models.DateField(blank=True, null=True)

    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.study_uid}"



class Measurement(models.Model):

    id = models.AutoField(primary_key=True)

    instance_uid = models.CharField(max_length=256, default='', null=False)

    measurement_number = models.IntegerField(null=False)

    study = models.ForeignKey(Study, on_delete=models.CASCADE)

    wadorsURI = models.CharField(max_length=500, default='', null=False)

    created_at = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)

    report = models.CharField(max_length=20000, default='', blank=True)

    label = models.CharField(max_length=200, default='')

    description = models.CharField(max_length=200, default='', blank=True)

    displayText = models.CharField(max_length=200, default='', blank=True)

    toolType = models.CharField(max_length=200, default='')

    last_modification_at = models.DateTimeField(auto_now=True)

    last_modification_by = models.EmailField(max_length=255, blank=True)


    def __str__(self):
        return f"{self.user.email} + {self.measurement_number}"