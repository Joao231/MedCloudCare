from django.contrib import admin
from .models import UserAccount, Patient, Study, Model, GroupExtend

admin.site.register(UserAccount)
admin.site.register(Patient)
admin.site.register(Study)
admin.site.register(Model)
admin.site.register(GroupExtend)
