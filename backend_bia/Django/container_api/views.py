from http.client import HTTPResponse
from .models import *
from .serializers import MeasurementSerializer, ModelSerializer, FileSerializer, EditModelSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import os
from django.core.exceptions import ObjectDoesNotExist
from zipfile import ZipFile
from monailabel.utils.others.generic import get_mime_type
from django.http import FileResponse
from .scripts.cifra import main as encrypt, AES, AES_decifra, pad, unpad
from .scripts.cifra import pad
from .scripts.decifra import main as decrypt
from monailabel.utils.others.class_utils import get_class_of_subclass_from_file
import inspect
import glob
import shutil
import subprocess
import pydicom
from datetime import datetime
from dicomweb_client.api import DICOMwebClient
from dicomweb_client.session_utils import create_session_from_user_pass
from monailabel.interfaces.datastore import DefaultLabelTag
import tempfile
import requests
import hashlib
from .scripts.dicom import DICOMwebClientX, DICOMWebDatastore
import time

# Imports do João
from django.http import JsonResponse
import pyotp
import json
from rest_framework.views import APIView
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from guardian.shortcuts import assign_perm
from guardian.shortcuts import remove_perm
from monailabel.interfaces.utils.app import app_instance
from guardian.shortcuts import get_user_perms, get_objects_for_group
from django.core.mail import EmailMessage
from django.conf import settings
import docker
from kubernetes import client, config
import random
from .scripts.encrypt_db import cifra, decifra
from django.core.files import File



# globals
#master_key=
#master_iv=


def encrypt_db(request, email):

    if request.method == 'POST':

        user = UserAccount.objects.get(email=email)

        key = os.urandom(32)    
        iv = os.urandom(16)

        key_encrypt = AES(master_key, master_iv, key, "CBC")

        key_encrypt_hex = key_encrypt.hex()

        iv_encrypt = AES(master_key, master_iv, iv, "CBC")

        iv_encrypt_hex = iv_encrypt.hex()

        user.key_user = key_encrypt_hex
        user.iv_user = iv_encrypt_hex
        '''
        first_name_bytes = bytes(user.first_name, encoding='utf-8')
        first_name_encrypt = AES(key, iv, pad(first_name_bytes), "CBC")
        first_name_encrypt_hex = first_name_encrypt.hex()

        last_name_bytes = bytes(user.last_name, encoding='utf-8')
        last_name_encrypt = AES(key, iv, pad(last_name_bytes), "CBC")
        last_name_encrypt_hex = last_name_encrypt.hex()
        
        profession_bytes = bytes(user.profession, encoding='utf-8')
        profession_encrypt = AES(key, iv, pad(profession_bytes), "CBC")
        profession_encrypt_hex = profession_encrypt.hex()

        user.first_name = first_name_encrypt_hex
        user.last_name = last_name_encrypt_hex'''
        #user.profession = profession_encrypt_hex

        if user.medical_certificate:
            
            filename = user.medical_certificate.path

            cifra(filename, 'CBC', key, iv)
            
            os.remove(filename)

            with open("/usr/src/app/new_image_cifradoCBC.bmp", "rb") as f:
                user.medical_certificate = File(f, name='new_image_cifradoCBC.bmp')
                user.save()
            
            os.remove("/usr/src/app/new_image_cifradoCBC.bmp")
            print("user tem medical certificate")

            return JsonResponse({'success': 'true'})

        else:
            user.save()

            return JsonResponse({'success': 'true'})

        

@api_view(['PUT'])
def api_save_label(
    request
):
    image = request.GET["image"]
    data = request.data
    data = dict(data)
    
    return save_label(image, data['params'][0], data['label'][0])


def save_label(image, params, label):
    file_ext = ".bin"
    label_file = tempfile.NamedTemporaryFile(suffix=file_ext).name
    tag = DefaultLabelTag.FINAL.value

    with open(label_file, "wb") as buffer:
        shutil.copyfileobj(label.file, buffer)
   

    session = create_session_from_user_pass(username='orthanc', password='orthanc')

    dw_client = DICOMwebClientX(
        url="http://orthanc-service:8047",
        session=session,
        qido_url_prefix="/dicom-web",
        wado_url_prefix="/dicom-web",
        stow_url_prefix="/dicom-web",
    )

    datastore = DICOMWebDatastore(dw_client)
    save_params = json.loads(params)
    for label_info in save_params['label_info']:
        label_info['description'] = save_params['submission_name']
    
    print(f"\nSave Label params: {save_params}")

    label_id = datastore.save_label(image, label_file, tag, save_params)

    #label_id = True

    if label_id:
        return Response({'success': 'true'}, status=status.HTTP_201_CREATED)
    else:
        return Response({'success': 'false'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def segmentation_delete(request):

    if request.method == 'POST':
        
        data = request.data

        wadoURI = data['wadoURI']
        patientID = data['patientID']

        print("\nEliminar segmentação. A eliminar...\n",)

        elements = wadoURI.split('=')
        new_string = ''

        for i in range(2,5):
            new_string += elements[i]

        new_elements = new_string.split('&')
        study_uid = new_elements[0]
        series_uid = new_elements[1].replace('seriesUID','')
        instance_uid = new_elements[2].replace('objectUID','')
        '''print(study_uid)
        print(series_uid)
        print(instance_uid)'''

        string = patientID+'|'+study_uid+'|'+series_uid+'|'+instance_uid
        #print(string)
        hash = hashlib.sha1(string.encode("utf-8"))
        hex_dig = hash.hexdigest()
        orthanc_id = ""
        for i in range(0, len(hex_dig), 8):
            orthanc_id += hex_dig[i:i+8]+'-'
        orthanc_id = orthanc_id.rstrip(orthanc_id[-1])
        #print(orthanc_id)

        username = "orthanc"
        password = "orthanc"

        response = requests.delete('http://orthanc-service:8047/instances/'+orthanc_id, auth=(username, password))

        if (response.status_code == 200):
                    
            return Response({'message': 'Segmentation was deleted!'}, status=status.HTTP_200_OK)
    
        else:
            return Response({'message': 'Failed to delete segmentation!'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def measurement_delete(request):

    if request.method == 'POST':

        user_email = request.GET["user"]
        
        user = UserAccount.objects.get(email=user_email)
        
        data = request.data

        measurement = json.loads(data['measurement'])

        print("\nEliminar medição. A eliminar...", measurement)

        creator = UserAccount.objects.get(email=measurement['created_by'])
        
        study = Study.objects.get(study_uid=measurement["study"], user=user)
        measurement["study"] = study.pk
        
        try:
            measurementObject = Measurement.objects.get(
                instance_uid=measurement['instance_uid'],
                study=measurement['study'], 
                user=creator.pk, 
                measurement_number=measurement["measurement_number"])
            
            ids = measurement['wadorsURI'].split('/')
            
            string = measurement['patient_id']+'|'+ids[3]+'|'+ids[5]+'|'+ids[7]
            #print(string)
            hash = hashlib.sha1(string.encode("utf-8"))
            hex_dig = hash.hexdigest()
            orthanc_id = ""
            for i in range(0, len(hex_dig), 8):
                orthanc_id += hex_dig[i:i+8]+'-'
            orthanc_id = orthanc_id.rstrip(orthanc_id[-1])
            #print(orthanc_id)

            username = "orthanc"
            password = "orthanc"

            response = requests.delete('http://orthanc-service:8047/instances/'+orthanc_id, auth=(username, password))

            if (response.status_code == 200):
                
                measurementObject.delete()
            
            return Response({'message': 'Measurement was deleted!'}, status=status.HTTP_200_OK)
        
        except ObjectDoesNotExist:
            return Response({'message': 'Failed to delete measurement!'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        

@api_view(['GET', 'POST'])
def measurements(request):
    """
    List measurements, or create a new one.
    """
    if request.method == 'POST':

        user_email = request.GET["user"]
        
        user = UserAccount.objects.get(email=user_email)
        
        data = request.data

        for key in list(data.keys()):
            measurement = json.loads(data[key])
            print(f"Medição recebida de user {user_email}: ", measurement)
            
            measurement["user"] = user.pk

            user_groups = user.groups.all()
            studies_from_groups = Study.objects.none()

            for group in user_groups:
                permissions_group = group.permissions.all().values()
                permissions = []
                for permission in permissions_group:
                    permissions.append(permission["name"])
                studies = get_objects_for_group(group, permissions, klass=Study, accept_global_perms=False)
                studies_from_groups = studies_from_groups | studies

            study_from_user = Study.objects.filter(user=user, study_uid=measurement["study"])

            if (len(study_from_user) == 0):
                print("\nO estudo não é do user. Foi partilhado com ele.")
            else:
                print("\nO estudo é do user.")
                measurement["study"] = study_from_user[0].pk

            for study_group in list(studies_from_groups):
                if str(measurement["study"]) == str(study_group): # estudo partilhado
                    shared_study = studies_from_groups.filter(study_uid=str(study_group))[0].pk
                    measurement["study"] = shared_study
            
            measurements = list(Measurement.objects.filter(instance_uid=measurement["instance_uid"], 
            study=measurement["study"], measurement_number=measurement["measurement_number"], 
            toolType=measurement['toolType'], displayText=measurement['displayText']))
            
            if len(measurements) == 1: #se a medição já existe, é porque estamos a editar
                print("Medição já a existe. A editar...")

                edited = False

                m = measurements[0]

                edit_fields = ['last_modification_by','last_modification_at']
                if ('label' in list(measurement.keys())):
                    if m.label != measurement['label']:
                        m.label = measurement['label']
                        edit_fields.append('label')
                        edited = True
                if ('description' in list(measurement.keys())):
                    if m.description != measurement['description']:
                        m.description = measurement['description']
                        edit_fields.append('description')
                        edited = True
                if ('wadorsURI' in list(measurement.keys())):
                    if m.wadorsURI != measurement['wadorsURI']:
                        m.wadorsURI = measurement['wadorsURI']
                        edit_fields.append('wadorsURI')
                        edited = True
                if ('report' in list(measurement.keys())):

                    measurement_owner_pk = m.user.pk
                    measurement_owner = UserAccount.objects.get(pk=measurement_owner_pk)

                    key_encrypt = measurement_owner.key_user
                    iv_encrypt = measurement_owner.iv_user
                    
                    key_bytes = bytes.fromhex(key_encrypt)
                    
                    key = AES_decifra(master_key, master_iv, key_bytes, "CBC")

                    iv_bytes = bytes.fromhex(iv_encrypt)

                    iv = AES_decifra(master_key, master_iv, iv_bytes, "CBC")

                    report_bytes = bytes.fromhex(m.report)

                    report_plain_text = AES_decifra(key, iv, report_bytes, "CBC")

                    unpadding = unpad(report_plain_text)

                    report_plain_text = unpadding.decode("utf-8")

                    if report_plain_text != measurement['report']:

                        bytes_measurement = bytes(measurement['report'], 'utf-8')

                        report_encrypt = AES(key, iv, pad(bytes_measurement), "CBC")

                        report_encrypt_hex = report_encrypt.hex()

                        m.report = report_encrypt_hex
                        edit_fields.append('report')
                        edited = True

                #print("\nEdited? ", edited)

                if edited == True:
                
                    m.last_modification_by = request.GET["user"]

                    m.save(update_fields=edit_fields)

            else:
                print("\nNova medição. A criar...")

                measurement["last_modification_by"] = request.GET["user"]

                measurement_owner = UserAccount.objects.get(email=request.GET["user"])

                key_encrypt = measurement_owner.key_user
                iv_encrypt = measurement_owner.iv_user
                
                key_bytes = bytes.fromhex(key_encrypt)
                
                key = AES_decifra(master_key, master_iv, key_bytes, "CBC")

                iv_bytes = bytes.fromhex(iv_encrypt)

                iv = AES_decifra(master_key, master_iv, iv_bytes, "CBC")

                bytes_measurement = bytes(measurement['report'], 'utf-8')

                print("Non-Encrypted report: ", bytes_measurement)

                report_encrypt = AES(key, iv, pad(bytes_measurement), "CBC")

                report_encrypt_hex = report_encrypt.hex()

                measurement['report'] = report_encrypt_hex

                print("Encrypted report: ", measurement['report'])

                serializer = MeasurementSerializer(data=measurement)

                if serializer.is_valid():
                    serializer.save()
                        
                else:
                    print(serializer.errors)
                    return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"success": 'true'}, status=status.HTTP_201_CREATED)

    elif request.method == 'GET':

        user = UserAccount.objects.get(email=request.GET["user"])

        study = request.GET["study"]

        user_groups = user.groups.all()
        studies_from_groups = Study.objects.none()
        users_from_groups = []

        for group in user_groups:
            users = group.user_set.all()
            for u in users:
                users_from_groups.append(u.pk)
            permissions_group = group.permissions.all().values()
            permissions = []
            for permission in permissions_group:
                permissions.append(permission["name"])
            studies = get_objects_for_group(group, permissions, klass=Study, accept_global_perms=False)
            studies_from_groups = studies_from_groups | studies

        study_from_user = Study.objects.filter(user=user, study_uid=study)
        measurements_from_shared = Measurement.objects.none()

        for study_group in list(studies_from_groups):
            if str(study) == str(study_group): # estudo partilhado
                print(f"\nEstudo {str(study_group)} foi partilhado pelo user: ", study_group.user)
                shared_study = studies_from_groups.filter(study_uid=str(study_group))[0].pk
                measurements_from_shared = Measurement.objects.filter(study=shared_study)
                for m in list(measurements_from_shared):
                    if m.user.pk in users_from_groups:
                        print("\nMedição efetuada pelo user: ", m.user)
                    else:
                        measurements_from_shared.exclude(id=m.id)

        if (len(study_from_user) == 0):
            print("\nO estudo não é do user. Foi partilhado com ele.")
            measurements = measurements_from_shared
            measurements = measurements.distinct()
        else:
            print("O estudo é do user.")
            measurements = Measurement.objects.filter(user=user, study=study_from_user[0].pk) | measurements_from_shared
            measurements = measurements.distinct()

    
        print("\nMedições a que o user tem acesso: ", measurements)
            
        response = []

        for measurement in list(measurements):
            user_email = measurement.user.email
            study_uid = measurement.study.study_uid
            serializer = MeasurementSerializer(measurement)
            measurement_data = serializer.data

            measurement_data["user"] = user_email

            measurement_data["study"] = study_uid 

            measurement_owner_pk = measurement.user.pk
            measurement_owner = UserAccount.objects.get(pk=measurement_owner_pk)

            key_encrypt = measurement_owner.key_user
            iv_encrypt = measurement_owner.iv_user
            
            key_bytes = bytes.fromhex(key_encrypt)
            
            key = AES_decifra(master_key, master_iv, key_bytes, "CBC")

            iv_bytes = bytes.fromhex(iv_encrypt)

            iv = AES_decifra(master_key, master_iv, iv_bytes, "CBC")

            report_bytes = bytes.fromhex(measurement_data["report"])

            report_plain_text = AES_decifra(key, iv, report_bytes, "CBC")

            unpadding = unpad(report_plain_text)

            measurement_data["report"] = unpadding.decode("utf-8")

            date_params2 = measurement_data["created_at"].split("T")
            date_last = date_params2[0] #YYYY-MM-DD
            time_last = date_params2[1].split(".")
            measurement_data["created_at"] = date_last + " " + time_last[0]

            date_params = measurement_data["last_modification_at"].split("T")
            date_last = date_params[0] #YYYY-MM-DD
            time_last = date_params[1].split(".")
            
            measurement_data["last_modification_at"] = date_last + " " + time_last[0]

            print(measurement_data)

            response.append(measurement_data)

        return JsonResponse(response, safe=False)



@api_view(['GET', 'POST', 'PUT'])
def models(request):
    """
    List all model files, or create a new one.
    """
    if request.method == 'GET':

        params = (request.GET).dict()
        
        user = UserAccount.objects.get(email=request.GET["user"])
        user_email = request.GET["user"]

        if 'group' in list(params.keys()):
            group_name = params['group']
            if group_name == 'investigators':
                models = Model.objects.filter(visibility=True) # todos os investigadores têm acesso aos public
            else:
                group = Group.objects.get(name=group_name)
                users = group.user_set.all().values()
                
                for userr in users:
                    if user_email == userr["email"]:
                        list_permissions_group = []
                        permissions_group = group.permissions.all().values()
                        for permission in permissions_group:
                            list_permissions_group.append(permission["name"])
                        models = get_objects_for_group(group, list_permissions_group, klass=Model, accept_global_perms=False)
                    
        else:
            models_from_groups = Model.objects.none()

            if user.profession == 'Investigator':
                user_groups = user.groups.all()
                for group in user_groups:
                    permissions_group = group.permissions.all().values()
                    permissions = []
                    for permission in permissions_group:
                        permissions.append(permission["name"])
                    models = get_objects_for_group(group, permissions, klass=Model, accept_global_perms=False)

                    models_from_groups = models_from_groups | models

            models = Model.objects.filter(user=user) | Model.objects.filter(visibility=True) | models_from_groups
        
        for field in list(params.keys()):
            if field == 'name':
                models = models.filter(name__icontains=params['name'])
            if field == 'bodyPart':
                models = models.filter(bodyPart__icontains=params['bodyPart'])
            elif field == 'version':
                models = models.filter(version=params['version'])
            elif field == 'task':
                models = models.filter(task__icontains=params['task'])
            elif field == 'modelDateFrom':
                format = f'%Y-%m-%d'
                start_date = datetime.strptime(params['modelDateFrom'], format)
                end_date = datetime.today()
                models = models.filter(created_at__range=[start_date, end_date])
            elif field == 'modelDateTo':
                format = f'%Y-%m-%d'
                start_date = datetime.strptime('1900-04-01', format) 
                end_date = datetime.strptime(params['modelDateTo'], format) 
                models = models.filter(created_at__range=[start_date, end_date])
            elif field == 'file':
                pathToZip = params['file']
                m_type = get_mime_type(f'/usr/src/{pathToZip}')
                
                return FileResponse(open(f'/usr/src/{pathToZip}', 'rb'), content_type=m_type)

        response = []

        for model in list(models):
            allPerms = []
            user_groups = user.groups.all()
            for group in user_groups:
                permissions_group = group.permissions.all().values()
                permissions = []
                for permission in permissions_group:
                    permissions.append(permission["name"])
                models_group = get_objects_for_group(group, permissions, klass=Model, accept_global_perms=False)
                if model in models_group:
                    allPerms = permissions
                perms = get_user_perms(user, model)
                for perm in perms:
                    allPerms.append(perm)

            serializer = ModelSerializer(model)
            model_data = serializer.data
            user = UserAccount.objects.get(pk=model_data["user"])
            model_data["user"] = user.email
            model_data["user_permissions"] = allPerms
            date_params = model_data["created_at"].split("T")
            date_params2 = model_data["last_modification_at"].split("T")
            date_last = date_params2[0] #YYYY-MM-DD
            time_last = date_params2[1].split(".")
            model_data["created_at"] = date_params[0]
            model_data["last_modification_at"] = date_last + " " + time_last[0]
            
            response.append(model_data)
         
        return JsonResponse(response, safe=False)


    elif request.method == 'POST':

        algorithm_name = request.data["name"]

        model = list(Model.objects.filter(name=algorithm_name))
        if len(model) == 1: #se o modelo já existe, é porque estamos a editar 

            print(f"Modelo {algorithm_name} já existe. A editar...")

            data = {
                'name': algorithm_name,
                'version': request.data["version"],
                'algorithm_overview': request.data["algorithm_overview"],
                'model_architecture': request.data["model_architecture"],
                'model_performance': request.data["model_performance"],
                'data_description': request.data["data_description"],
                'input': request.data["input"],
                'output': request.data["output"],
                'references': request.data["references"],
                'additional_info': request.data["additional_info"],
                'task': request.data["task"],
                'inputExtension': request.data["inputExtension"],
                'inputModality': request.data["inputModality"],
            }

            serializer = EditModelSerializer(data=data)

            if serializer.is_valid():
                data = serializer.validated_data

                task = data['task']
                file = {'file': request.data['file']}
                serializer = FileSerializer(data=file)

                if serializer.is_valid():
                    file_data = serializer.validated_data

                    with ZipFile(file_data['file'], 'r') as zip:
            
                        zip.printdir()
            
                        zip.extractall(path='/usr/src/app/django_container/container_api')

                    valid = validate(model_dir='/usr/src/app/django_container/container_api')

                    if valid == True:
                    
                        fields = ['version', 'algorithm_overview', 'model_architecture', 
                        'model_performance', 'data_description', 'input', 'output', 'references', 
                        'additional_info', 'file']

                        model = Model.objects.get(name=data['name'])

                        new_version = data['version'] + 1

                        model.algorithm_overview = data['algorithm_overview']
                        model.model_architecture = data['model_architecture']
                        model.model_performance = data['model_performance']
                        model.data_description = data['data_description']
                        model.input = data['input']
                        model.output = data['output']
                        model.references = data['references']
                        model.additional_info = data['additional_info']
                        model.file = file_data['file']
                        model.version = new_version
                        model.last_modification_by = request.data["user"]

                        #result = update_DockerImage(data['name'], new_version)

                        result = True

                        if result == True:
                            model.save(update_fields=fields)
                            print (f"Algorithm named '{algorithm_name}' was overwrited.")

                            return Response({"success": f"Algorithm named '{algorithm_name}' was overwrited\n"},
                                            status=status.HTTP_200_OK)
                        else:
                            return Response({"error": f"\nError updating model '{algorithm_name}' Docker image!"}, 
                                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                else:
                    print(serializer.errors)
                    return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            else:
                print(serializer.errors)
                return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        
        else: #se o modelo não existe, é porque estamos a criar

            print("Novo modelo. A criar...")
        
            user = UserAccount.objects.get(email=request.data["user"])
            
            data = request.data
            
            data["user"] = user.pk

            serializer = ModelSerializer(data=data)

            if serializer.is_valid():
                data = serializer.validated_data

                model_zip = data['file']
                model_name = data['name']
                model_task = data['task']
                model_framework = data['framework']

                with ZipFile(model_zip, 'r') as zip:
            
                    zip.printdir()

                    files_list = zip.namelist()
        
                    zip.extractall(path='/usr/src/app/django_container/container_api')

                result = validate(model_dir='/usr/src/app/django_container/container_api', model_task=model_task)


                if result == True:

                    port = build_DockerImage(model_name, files_list, model_framework)

                    #port = 8799

                    if port:
                        serializer.validated_data["port"] = port
                        serializer.save()

                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                else:
                    return Response(result, status=status.HTTP_400_BAD_REQUEST)

            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


    elif request.method == 'PUT':

        data = request.data

        serializer = EditModelSerializer(data=data)

        if serializer.is_valid():
            data = serializer.validated_data
            model_name = data['name']

            model = Model.objects.get(name=model_name)

            fields = ['version', 'algorithm_overview', 'model_architecture', 'model_performance',
            'data_description', 'input', 'output', 'references', 'additional_info', 'last_modification_by',
            'last_modification_at']

            model.version = data['version'] + 1
            model.algorithm_overview = data['algorithm_overview']
            model.model_architecture = data['model_architecture']
            model.model_performance = data['model_performance']
            model.data_description = data['data_description']
            model.input = data['input']
            model.output = data['output']
            model.references = data['references']
            model.additional_info = data['additional_info']
            model.last_modification_by = request.GET['user']

            model.save(update_fields=fields)     
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else:
        print(request.method)


def build_DockerImage(model_name, files_list, framework):

    print("Building Docker image...")

    client_docker = docker.from_env()

    print("client docker")
    
    config.load_incluster_config()

    print("client kubernetes")

    name = model_name

    port = random.randint(8001, 9000)
    while (Model.objects.filter(port=port).exists()):
        port = random.randint(8001, 9000)

    tag = rf'{name}'+":1"

    '''subprocess.run(["docker", "build", "-t", rf'{name}'+":1", "-f", 
    "C:/Users/beatr/Desktop/django_container/Dockerfile", "C:/Users/beatr/Desktop/django_container"], 
    text=True, input="2 3")

    subprocess.run([
        "docker", "run", "-d", "--network", "host", "--name", "model", "-p", "7000:7000", rf'{name}'+":1"
    ], text=True, input="2 3")'''

    print(tag)

    if framework == 'TensorFlow' or framework == 'Keras' or framework == 'Scikit-Learn':
        dockerfile="/usr/src/app/DockerFiles/Tensorflow_Keras_ScikitLearn/Dockerfile"
    elif framework == 'Pytorch' or framework == 'Monai':
        dockerfile="/usr/src/app/DockerFiles/Pytorch_Monai/Dockerfile"
    elif framework == 'H2O':
        dockerfile="/usr/src/app/DockerFiles/H2O/Dockerfile"
    elif framework == 'Spark':
        dockerfile="/usr/src/app/DockerFiles/Spark/Dockerfile"
    else:
        dockerfile="/usr/src/app/DockerFiles/Tensorflow_Keras_ScikitLearn/Dockerfile"

    client_docker.images.build(path="/usr/src/app/django_container", dockerfile="/usr/src/app/django_container/Dockerfile", tag=tag)

    print("Docker image built")

    v1 = client.AppsV1Api()

    namespace = 'default'

    manifest = {
    
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": {
        "name": "ml-deployment-" + name,
        "labels": {
        "app": "ml-deployment-" + name
        }
    },
    "spec": {
        "replicas": 1,
        "selector": {
        "matchLabels": {
            "app": "ml-deployment-" + name
        }
        },
        "template": {
        "metadata": {
            "labels": {
            "app": "ml-deployment-" + name
            }
        },
        "spec": {
            "containers": [
            {   
                "name": "ml-model-container",
                "image": name+":1",
                "imagePullPolicy": "Never",
                "command": [
                "gunicorn",
                "-b",
                "0.0.0.0:"+str(port),
                "-w",
                "3", 
                "-k",
                "sync",
                "django_container.wsgi"
                ],
                "ports": [
                {
                    "containerPort": 7000
                }
                ]
            }
            ]
        }
        }
    }
    }

    '''"command": [
                "gunicorn",
                "-b",
                "0.0.0.0:"+str(port),
                "-w",
                "3", 
                "-k",
                "gevent",
                "django_container.wsgi"
                ],'''

    v1.create_namespaced_deployment(namespace, manifest, pretty='true')

    v1 = client.CoreV1Api()

    manifest = {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
        "name": "ml-deployment-" + name
    },
    "spec": {
        "type": "LoadBalancer",
        "selector": {
        "app": "ml-deployment-" + name
        },
        "ports": [
        {
            "protocol": "TCP",
            "port": port,
            "targetPort": 7000
        }
        ]
    }
    }

    v1.create_namespaced_service(namespace, manifest, pretty='true')

    '''v1 = client.NetworkingV1Api()

    manifest = {
    "apiVersion": "networking.k8s.io/v1",
    "kind": "Ingress",
    "metadata": {
        "name": "ingress-" + name,
        "annotations": {
        "nginx.ingress.kubernetes.io/rewrite-target": "/$1"
        }
    },
    "spec": {
        "rules": [
        {
            "http": {
            "paths": [
                {
                "path": "/"+name+"/?/(.*)",
                "pathType": "Prefix",
                "backend": {
                    "service": {
                    "name": "ml-deployment-" + name,
                    "port": {
                        "number": port
                    }
                    }
                }
                }
            ]
            }
        }
        ]
    }
    }
    
    v1.create_namespaced_ingress(namespace, manifest, pretty='true')'''

    for file in files_list:
        os.remove('/usr/src/app/django_container/container_api/'+file)

    print("k8s resources created")
          
    return port


def update_DockerImage(name, version):

    print(f"Updating Docker image from {name}:{version}")
    
    config.load_incluster_config()

    subprocess.run(["docker", "build", "-t", name+":"+str(version), "-f", "/usr/src/app/django_container/Dockerfile", "/usr/src/app/django_container"], text=True, input="2 3")
    
    api_instance = client.AppsV1Api()
    deployments = api_instance.list_namespaced_deployment(namespace="default")
    deployment_name = "ml-deployment-"+name
    for deploy in deployments.items:
        if deployment_name == deploy.metadata.name:
            deployment=deploy

    deployment.spec.template.spec.containers[0].image = 'name'+':'+str(version)
    
    api_instance.patch_namespaced_deployment(name=deployment_name, namespace="default", body=deployment)

    return True



@api_view(['GET'])
def model_delete(request):

    if request.method == 'GET':

        namespace = 'default'

        algorithm_name = request.GET["algorithm"]

        model = Model.objects.filter(name=algorithm_name)

        try:
            model.delete()
            try:
                os.remove(f'/usr/src/app/media/models/{algorithm_name}.zip')
                print (f"Algorithm named '{algorithm_name}' was deleted.")
            except OSError as e:
                print ("Error: %s - %s." % (e.filename, e.strerror))
                return Response({'message': 'Failed to delete algorithm!'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            config.load_incluster_config()

            v1 = client.AppsV1Api()

            v1.delete_namespaced_deployment("ml-deployment-"+algorithm_name, namespace)

            v1 = client.CoreV1Api()

            v1.delete_namespaced_service("ml-deployment-"+algorithm_name, namespace)

            return Response({'message': 'Algorithm was deleted!'}, status=status.HTTP_200_OK)
            
        except ObjectDoesNotExist:
            return Response({'message': 'Failed to delete algorithm!'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def validate(model_dir, model_task):

    print(f"-> Validating Algorithm from: {model_dir}")

    main_py = os.path.join(model_dir, "main.py")
    if not os.path.exists(main_py):
        return {"error": "\nIt does NOT have a 'main.py' file!"}

    init_py = os.path.join(model_dir, "__init__.py")
    if not os.path.exists(init_py):
        return {"error": "\nIt does NOT have a '__init__.py' file!"}

    requirements_txt = os.path.join(model_dir, "requirements.txt")
    if not os.path.exists(requirements_txt):
        return {"error": "\nIt does NOT have a 'requirements.txt' file!"}

    c = get_class_of_subclass_from_file("main", main_py, "Application")
    if c is None:
        return {"error": "\nIt does NOT implement class 'Application' in 'main.py'!"}

    app_instance = c(root_dir=model_dir, task=model_task)

    task = app_instance._infer
        
    if not task:
        return {"error": "\nInference Task is not Initialized!"}

    c = get_class_of_subclass_from_file("main", main_py, "InferTask")
    if c is None:
        return {"error": "\nIt does NOT implement class 'InferTask' in 'main.py'!"}

    hasRunFunction = False
    for n, o in inspect.getmembers(c):
        if inspect.isfunction(o):
            if (o.__name__ == 'run'):
                hasRunFunction = True
                lines_code, i = inspect.getsourcelines(o)
                for info in lines_code:
                    if "return" in info:
                        info = info.split("return")
                        return_value = info[1]
                        if model_task != 'Classification':
                            hasImageKey = False # 'image_np' key is mandatory
                            if '{' in return_value: # result given as a dict {}
                                return_value_items = return_value.split(',')
                                for item in return_value_items:
                                    item = item.split(':')
                                    key = item[0].replace(' ', '')
                                    key = key.replace('{', '')
                                    key = key.replace("'", '')
                                    if 'image_np' == key:
                                        hasImageKey = True
                            
                            else: # result given as a variable
                                return_value = return_value.replace(' ', '')
                                return_value = return_value.replace('\n','')
                                for info in lines_code:
                                    if return_value in info and '=' in info and '{' in info and '}' in info:
                                        info = info.split("=")
                                        return_value = info[1]
                                        return_value_items = return_value.split(',')
                                        for item in return_value_items:
                                            item = item.split(':')
                                            key = item[0].replace(' ', '')
                                            key = key.replace('{', '')
                                            key = key.replace("'", '')
                                            if 'image_np' == key:
                                                hasImageKey = True

                            if hasImageKey == False:
                                return {"error": "\nThe algorithm should return a dict with 'image_np' as key!"}
                        
                        else: # model_task == 'Classification'
                            isDict = False # result of Classification task must be a Dict
                            if '{' in return_value and '}' in return_value:
                                isDict = True
                            else: # result given as a variable
                                return_value = return_value.replace(' ', '')
                                return_value = return_value.replace('\n','')
                                for info in lines_code:
                                    if return_value in info and '=' in info and '{' in info and '}' in info:
                                        isDict = True
                            if isDict == False:
                                return {"error": "\nThe algorithm should return a dict!"}
        else:
            continue
    
    if hasRunFunction == False:
        return {"error": "\nIt does NOT implement method 'run()' in 'main.py'!"}
            
    return True
        


@api_view(['GET', 'POST'])
def images(request):
    """
    List all images from user.
    """
    if request.method == 'GET':

        user = UserAccount.objects.get(email=request.GET["user"])
        
        studies = Study.objects.filter(user=user)

        user_groups = user.groups.all()
        studies_from_groups = Study.objects.none()

        for group in user_groups:
            permissions_group = group.permissions.all().values()
            permissions = []
            for permission in permissions_group:
                permissions.append(permission["name"])
            studies = get_objects_for_group(group, permissions, klass = Study, accept_global_perms=False)
            studies_from_groups = studies_from_groups | studies

        studies = Study.objects.filter(user=user) | studies_from_groups

        params = (request.GET).dict()
        
        for field in list(params.keys()):
            if field == 'patient_name':
                studies_empty = Study.objects.none()
                patients = []
                for patient in Patient.objects.all():

                    key = patient.key
                    iv = patient.iv

                    key_bytes = bytes.fromhex(key)
                    key_decrypt = AES_decifra(master_key, master_iv, key_bytes,"CBC")
                    
                    iv_bytes = bytes.fromhex(iv)
                    iv_decrypt = AES_decifra(master_key, master_iv, iv_bytes,"CBC")

                    patient_name_bytes = bytes.fromhex(patient.name)
                    patient_name_decrypt = AES_decifra(key_decrypt, iv_decrypt, patient_name_bytes,"CBC")

                    unpadding = unpad(patient_name_decrypt)

                    patient_name_text = unpadding.decode("utf-8")

                    print("Name: ", patient_name_text)

                    if (params['patient_name'].lower() in patient_name_text.lower()):
                        print(patient_name_text)
                        patients.append(patient)

                if (len(list(patients)) == 0):
                    studies = studies_empty
                else:
                    for patient in patients:
                        patient_object = Patient.objects.get(id_patient=patient.id_patient)
                        print(patient_object)
                        studies = studies | studies.filter(patient_id=patient_object.pk)
                        print(studies)
            elif field == 'patient_id':
                studies_empty = Study.objects.none()
                patients = Patient.objects.filter(id_patient__icontains=params['patient_id'])
                if (len(list(patients)) == 0):
                    studies = studies_empty
                else:
                    for patient in patients:
                        studies = studies | studies.filter(patient_id=patient.pk)
                    
            elif field == 'study_date':
                studies_empty = Study.objects.none()
                studies = studies_empty | studies.filter(study_date__icontains=params['study_date'])

        data = []

    
        for study in list(studies):

            allPerms = []
            
            # obter as permissões sobre o estudo
            user_groups = user.groups.all()
            for group in user_groups:
                permissions = []
                allPerms = []
                permissions_group = group.permissions.all().values()
                for permission in permissions_group:
                    allPerms.append(permission["name"])
                    permissions.append(permission["name"])
                
                studies = get_objects_for_group(group, permissions,  klass=Study, accept_global_perms=False)
                
                for s in list(studies):
                    if str(study) == str(s):
                        perms = get_user_perms(UserAccount.objects.get(email=request.GET["user"]), studies[0])
                        for perm in perms:
                            allPerms.append(perm)
                       
            patient = Patient.objects.get(pk=study.patient_id)
            key = patient.key
            iv = patient.iv
            key_bytes = bytes.fromhex(key)

            key_decrypt = AES_decifra(master_key, master_iv, key_bytes,"CBC")
            
            iv_bytes = bytes.fromhex(iv)
            
            iv_decrypt = AES_decifra(master_key, master_iv, iv_bytes,"CBC")

            patient_name_bytes = bytes.fromhex(patient.name)

            patient_name_decrypt = AES_decifra(key_decrypt, iv_decrypt, patient_name_bytes,"CBC")

            unpadding = unpad(patient_name_decrypt)

            patient_name_text = unpadding.decode("utf-8")

            user = study.user
            data.append({'study_uid': study.study_uid, 'study_date': study.study_date,
            'patient_id': patient.id_patient,
            'patient_name': patient_name_text,
            'user': user.email,
            'user_permissions': allPerms})

            print(f"\nStudy {study.study_uid} all permissions: ", allPerms)

        return JsonResponse(data, safe=False)
        


@api_view(['POST'])
def images_encrypt(request):

    if request.method == 'POST':

        start = time.time()
        

        user = UserAccount.objects.get(email=request.GET["user"])

        print(f"\nRequest Received in Encrypt by user: {user.__str__()}!")

        serializer = FileSerializer(data=request.data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            dicom_zip = data['file']

        with ZipFile(dicom_zip, 'r') as zip:
                zip.extractall(path=f'/usr/src/dicoms')

        session = create_session_from_user_pass(
            username='orthanc',
            password='orthanc'
        )

        orthanc = DICOMwebClient(
            url="http://orthanc-service:8047",
            session=session,
            qido_url_prefix="/dicom-web",
            wado_url_prefix="/dicom-web",
            stow_url_prefix="/dicom-web",
        )

        for path in glob.glob('/usr/src/dicoms' +  "/**/*", recursive=True):
            if os.path.isfile(path):
                dataset = pydicom.dcmread(path)
                patient_id = dataset.PatientID
                patient_name = dataset.PatientName

                if dataset.__contains__('StudyDate'):
                    study_date = dataset.StudyDate #must be in YYYY-MM-DD format
                    if study_date != '':
                        if len(study_date.split('-')) != 3 and len(study_date) == 8:
                            study_date = study_date[0:4] + '-' + study_date[4:6] + '-' + study_date[6:8]
                    else:
                        study_date = None
                
                study_uid = dataset.StudyInstanceUID
                try:
                    patient  = Patient.objects.get(id_patient=patient_id)
                    key_encrypt = patient.key
                    iv_encrypt = patient.iv

                    key_bytes = bytes.fromhex(key_encrypt)
        
                    key = AES_decifra(master_key, master_iv, key_bytes, "CBC")

                    iv_bytes = bytes.fromhex(iv_encrypt)
        
                    iv = AES_decifra(master_key, master_iv, iv_bytes, "CBC")

                except ObjectDoesNotExist:
                    key = os.urandom(32)    
                    iv = os.urandom(16)

                    key_encrypt = AES(master_key, master_iv, key, "CBC")

                    key_encrypt_hex = key_encrypt.hex()

                    iv_encrypt = AES(master_key, master_iv, iv, "CBC")

                    iv_encrypt_hex = iv_encrypt.hex()

                    patient_name_bytes = bytes(str(patient_name), encoding='utf-8')
                    patient_name_encrypt = AES(key, iv, pad(patient_name_bytes), "CBC")
                    patient_name_encrypt_hex = patient_name_encrypt.hex()

                    patient_name = patient_name_encrypt_hex
                    patient = Patient(id_patient=patient_id, name=patient_name,key=key_encrypt_hex, iv=iv_encrypt_hex)

                    patient.save()

                encrypt(path, key, iv)

                try:
                    study = Study.objects.get(study_uid=study_uid, patient=patient, user=user)
                except ObjectDoesNotExist:
                    study = Study(study_uid=study_uid, patient=patient, 
                    study_date=study_date,
                    user=user)
                    study.save()
                    print("Estudo " + study_uid + " criado!")
            
                orthanc.store_instances(datasets=[dataset], study_instance_uid=study_uid)

        print("\nSent to orthanc")

        if os.path.exists('/usr/src/imagens_cifradas'):
            shutil.rmtree('/usr/src/imagens_cifradas')


        # Mandar as cifradas para o Orthanc da 8043 apartir do Django e não do Frontend

        orthanc = DICOMwebClient(
            url="http://orthanc-service2:8048",
            session=session,
            qido_url_prefix="/dicom-web",
            wado_url_prefix="/dicom-web",
            stow_url_prefix="/dicom-web",
        )

        for path in glob.glob("/usr/src/encrypt_tags" +  "/**/*", recursive=True):
            if os.path.isfile(path):
                dataset = pydicom.dcmread(path)
                orthanc.store_instances(datasets=[dataset], study_instance_uid=study_uid)
        
        #shutil.make_archive('C:/Users/beatr/Desktop/cifradas', 'zip', "C:/Users/beatr/Desktop/encrypt_tags")

        pathsToRemove = [ "/usr/src/encrypt_tags", '/usr/src/dicoms']
        for path in pathsToRemove:
            shutil.rmtree(path)

        #m_type = get_mime_type('C:/Users/beatr/Desktop/cifradas.zip')

        end = time.time()
        print("Demorou: ", end - start)

        #return FileResponse(open('C:/Users/beatr/Desktop/cifradas.zip', 'rb'), content_type=m_type)

        return Response({'message': 'Study was uploaded!'}, status=status.HTTP_200_OK)



@api_view(['GET'])
def images_decrypt(request):

    if request.method == 'GET':

        print("\nRequest Received in Decrypt!")

        params = (request.GET).dict()

        study_uid = params['study']

        session = create_session_from_user_pass(
                username='orthanc',
                password='orthanc'
        )

        orthanc = DICOMwebClient(
            url="http://orthanc-service2:8048",
            session=session,
            qido_url_prefix="dicom-web",
            wado_url_prefix="dicom-web",
            stow_url_prefix="dicom-web",
        )

        instances = orthanc.retrieve_study(study_uid)

        save_dir = '/usr/src/orthanc_images'

        if params['hasPerm'] == 'false':
            os.makedirs(save_dir, exist_ok=True)
            for i, instance in enumerate(instances):
                file_name = os.path.join(save_dir, f"{i}.dcm")
                instance.save_as(file_name)
            
            if os.path.exists('/usr/src/imagens_cifradas'):
                shutil.rmtree('/usr/src/imagens_cifradas')
            shutil.make_archive('/usr/src/imagens_cifradas', 'zip', '/usr/src/orthanc_images')

            pathsToRemove = ['/usr/src/orthanc_images']

            for path in pathsToRemove:
                shutil.rmtree(path)
            
            m_type = get_mime_type('/usr/src/imagens_cifradas.zip')

            return FileResponse(open('/usr/src/imagens_cifradas.zip', 'rb'), content_type=m_type)

        else:
            study = list(Study.objects.filter(study_uid=study_uid))
            id_patient  = study[0].patient_id
            patient = Patient.objects.get(pk=id_patient)
            key = patient.key
            iv = patient.iv
            os.makedirs(save_dir, exist_ok=True)
            for i, instance in enumerate(instances):
                file_name = os.path.join(save_dir, f"{i}.dcm")
                instance.save_as(file_name)
                
                decrypt(file_name, key, iv)

            if os.path.exists('/usr/src/imagens_decifradas'):
                shutil.rmtree('/usr/src/imagens_decifradas')
            shutil.make_archive('/usr/src/imagens_decifradas', 'zip', '/usr/src/decrypt_tags')

            pathsToRemove = ["/usr/src/decrypt_tags", '/usr/src/orthanc_images']

            for path in pathsToRemove:
                shutil.rmtree(path)

            m_type = get_mime_type('/usr/src/imagens_decifradas.zip')
            
        print("Queried Orthanc")

        return FileResponse(open('/usr/src/imagens_decifradas.zip', 'rb'), content_type=m_type)


def safe_mkdir(path):
    try:
        os.mkdir(path)
        print("Pasta " + f"{path}" + " criada")
    except OSError:
        return 'Error creating folder'


def run_inference(model: str, series_id: str):

    model_object = Model.objects.get(name=model)
    
    model_zip = model_object.__str__()

    inputExtension = model_object.inputExtension

    task = model_object.task

    app_dir = f'C:/Users/beatr/Desktop/Django/algorithms/{model}'
    
    '''with ZipFile('C:/Users/beatr/Desktop/Django/media/'+model_zip, 'r') as zip:
        
        zip.extractall(path=app_dir)'''

    print(f"\n1) Initializing Algorithm from: {app_dir}.\n")

    main_py = app_dir + "/main.py"
    
    c = get_class_of_subclass_from_file("main", main_py, "Application")
    
    app_instance = c(app_dir, task)
    
    print(f"\n3) Algorithm's Info: {app_instance.info()}.\n")

    request = {'image': series_id, 'input_extension': inputExtension} #.dcm ou .nii.gz

    result = app_instance.infer(request)

    #shutil.rmtree(f'C:/Users/beatr/Desktop/Django/algorithms/{model}')
    
    if result is None:
        return HTTPResponse("Failed to execute infer")

    else:
        return result

    
@api_view(['POST'])
def ai_prediction(request, model: str, image: str):

    if request.method == 'POST':

        result = run_inference(model, image)

        #result = {'task_type': 'segmentation'}

        if result.get("task_type") == "Classification":

            return Response(result, status=status.HTTP_200_OK)

        else:
            res_img = result.get("file")

            #res_img = f"C:/Users/beatr/AppData/Local/Temp/tmp2fiafdb1.nrrd"

            #res_img = f'C:/Users/beatr/Desktop/brain.nrrd'

            m_type = get_mime_type(res_img)

            return FileResponse(open(res_img, 'rb'), content_type=m_type)


#********************************************** VIEWS DO JOÃO ************************************************

def set_social_apps(request, email):

    if request.method == 'POST':

        user = UserAccount.objects.get(email=email)

        user.social_apps = True
        user.save()

        return JsonResponse({'success': 'true'})

# visto!
#When the superuser sees if the medical certificate of the user is valid or not
class Change_Approval(APIView):
    def post(self, request):
        email = request.data.get("email")
        user = UserAccount.objects.get(email=email)
        approval = request.data.get("approval")
        print(approval)
        print(email)
        if approval == "Approved":
            user.isApproved = True
            user.save()
            response= {"Status": True}
            message = "Hey " + email + "!\nYour medical certificate was approved.\nGo to the activation account email that we previously sent to active your account now!\nLooking forward to seeing you there :)\n\nMedical App team"
            email = EmailMessage(
                'Invited to a group!',
                message,
                settings.EMAIL_HOST_USER,
                [email],
            )
            email.fail_silently=False
            email.send()
            os.remove(f"/usr/src/app/media/medical_certificates/user_{user.email}/new_image_decifradoCBC.bmp")
            return JsonResponse(response)
        else:
            response= {"Status": False}
            os.remove(f"/usr/src/app/media/medical_certificates/user_{user.email}/new_image_decifradoCBC.bmp")
            return JsonResponse(response)


#when a user wants to change to 2 factor authentication
class change_to2FA(APIView):
    def post(self, request):
        email = request.data.get("email")
        user = UserAccount.objects.get(email = email)
        if user.secret_key !="":
            response= {"Status": True, "secret_key": user.secret_key}
            return JsonResponse(response)
        else:
            key_encrypt = user.key_user
            iv_encrypt = user.iv_user
            
            key_bytes = bytes.fromhex(key_encrypt)
            
            key = AES_decifra(master_key, master_iv, key_bytes, "CBC")

            iv_bytes = bytes.fromhex(iv_encrypt)

            iv = AES_decifra(master_key, master_iv, iv_bytes, "CBC")
            secret_key = pyotp.random_base32()
            secret_key_bytes = bytes(secret_key, encoding='utf-8')
            secret_key_encrypt = AES(key, iv, pad(secret_key_bytes), "CBC")
            secret_key_encrypt_hex = secret_key_encrypt.hex()
            while UserAccount.objects.filter(secret_key=secret_key_encrypt_hex).exists():
                secret_key = pyotp.random_base32()
                secret_key_bytes = bytes(secret_key, encoding='utf-8')
                secret_key_encrypt = AES(key, iv, pad(secret_key_bytes), "CBC")
                secret_key_encrypt_hex = secret_key_encrypt.hex()
            user.secret_key = secret_key_encrypt_hex
            user.save()
            response= {"Status": False, "secret_key": secret_key}
            return JsonResponse(response)
        
        '''
        social_app = user.socialApp
        if social_app == True:
            response = {"Status": "You don´t need two factor authentication"}
        else:
            if user.secret_key !="":
            response= {"Status": True, "secret_key": user.secret_key}
            return JsonResponse(response)
        else:
            secret_key = pyotp.random_base32()
            while UserAccount.objects.filter(secret_key=secret_key).exists():
                secret_key = pyotp.random_base32()
            user.secret_key = secret_key
            user.save()
            response= {"Status": False, "secret_key": secret_key}
            return JsonResponse(response)
        '''
   

#to see if the user has already a secret or not
class check_Secret(APIView):
    lookup_url_kwarg = 'email'
    def get(self, request, format = None):
        email = request.GET.get(self.lookup_url_kwarg, None)
        user = UserAccount.objects.get(email = email)
        if user.secret_key !="":
            response= {"Status": True}
            return JsonResponse(response)
        else:
            response= {"Status": False}
            return JsonResponse(response)


#to see if the user has already a secret or not when the login is done not by apps
def check_Secret_login(request, email):
    if request.method == 'GET':        
        try:
            user = UserAccount.objects.get(email = email)
            
            if user.secret_key !="":
                response= {"Status": True}
                return JsonResponse(response)
            else:
                response= {"Status": False}
                return JsonResponse(response)

        except ObjectDoesNotExist:
            return JsonResponse({'message': 'UserAccount does not exist!'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


#to see if a user has a medical certificate
class check_MedicalCertificate(APIView):
    lookup_url_kwarg = 'email'
    def get(self, request, format = None):
        
        email = request.GET.get(self.lookup_url_kwarg, None)
        print(email)
        user = UserAccount.objects.get(email = email)
        print(user)
        if user.isApproved == True:
            response= {"Status": True}
            return JsonResponse(response)
        else:
            print("ola")
            response= {"Status": False}
            return JsonResponse(response)


def check_MedicalCertificate_login(request, email):
    if request.method == 'GET':
        #print(request.POST.get("email"))
        
        user = UserAccount.objects.get(email = email)
        print(user)
        print(user.profession)
        if user.profession == "Investigator":
            print(user)
            user.isApproved == True
            user.save()
            response= {"Status": True}
            return JsonResponse(response)
        else:
            if user.isApproved == True:
                response= {"Status": True}
                return JsonResponse(response)
            else:
                response= {"Status": False}
                return JsonResponse(response)


#to add a description in the sign up phase when the user logs in with apps
class add_Description(APIView):
    def post(self, request):
        email = request.data.get("email")
        print(email)
        profession = request.data.get("profession")
        print(profession)
        medical_certificate = request.data.get("medical_certificate")
        user = UserAccount.objects.get(email = email)
        if profession == "Investigator":
            group = Group.objects.all()[1]
            user.groups.add(group)
            user.profession = profession
            user.isApproved = True
            user.save()
            response= {"Status": True}
            return JsonResponse(response)
        else:
            print("sou medico")
            group = Group.objects.all()[0]
            user.groups.add(group)
            if user.medical_certificate:
                print("Já tem certificado médico")
                response= {"Status": False}
                return JsonResponse(response)
            else:
                user.profession = profession
                user.medical_certificate = medical_certificate
                user.save()
                response= {"Status": False}
                return JsonResponse(response)
    
    
#to login a user who has 2FA
class AuthCheckView_Login(APIView):
    def post(self, request, format = None):
        email = request.data.get("email")
        pin = request.data.get("pin")
        user = UserAccount.objects.get(email = email)

        key_encrypt = user.key_user
        iv_encrypt = user.iv_user
        
        key_bytes = bytes.fromhex(key_encrypt)
        
        key = AES_decifra(master_key, master_iv, key_bytes, "CBC")

        iv_bytes = bytes.fromhex(iv_encrypt)

        iv = AES_decifra(master_key, master_iv, iv_bytes, "CBC")

        secret_key_bytes = bytes.fromhex(user.secret_key)

        secret_key_plain_text = AES_decifra(key, iv, secret_key_bytes, "CBC")

        unpadding = unpad(secret_key_plain_text)

        secret_key_plain_text = unpadding.decode("utf-8")
        print(secret_key_plain_text)
        totp = pyotp.TOTP(secret_key_plain_text)
        print(totp)
        print("Current OTP:", totp.now())
        verification_status = totp.verify(pin)
        if verification_status == True:
            return JsonResponse({"Status": True})
        else:
            return JsonResponse({"Status": False})
  

def AuthCheckView_Login_login(request):
    if request.method == 'POST':
        a= json.loads(request.body)["body"]
        print(a)
        email = a[25:-2]
        print(email)
        pin = a[8:14]
        print(pin)
        user = UserAccount.objects.get(email = email)
        key_encrypt = user.key_user
        iv_encrypt = user.iv_user
        
        key_bytes = bytes.fromhex(key_encrypt)
        
        key = AES_decifra(master_key, master_iv, key_bytes, "CBC")

        iv_bytes = bytes.fromhex(iv_encrypt)

        iv = AES_decifra(master_key, master_iv, iv_bytes, "CBC")

        secret_key_bytes = bytes.fromhex(user.secret_key)

        secret_key_plain_text = AES_decifra(key, iv, secret_key_bytes, "CBC")

        unpadding = unpad(secret_key_plain_text)

        secret_key_plain_text = unpadding.decode("utf-8")
        print(secret_key_plain_text)
        totp = pyotp.TOTP(secret_key_plain_text)
        print(totp)
        print("Current OTP:", totp.now())
        verification_status = totp.verify(pin)
        if verification_status == True:
            return JsonResponse({"Status": True})
        else:
            return JsonResponse({"Status": False})


#to see if the user is a superuser ot not
def Check_Superuser(request, email):
       if request.method == 'GET':
        
        user = UserAccount.objects.get(email = email)
        if user.is_superuser == True:
            return JsonResponse({"Status": True})
        else:
            return JsonResponse({"Status": False})


#get the url of the medical certificate so that the admin can see the medical certificate and see if it is valid or not
class Get_url_medicalcertificate(APIView):
    lookup_url_kwarg = 'email'
    def get(self, request, format = None):
        email = request.GET.get(self.lookup_url_kwarg, None)
        user = UserAccount.objects.get(email = email)
        
        key_encrypt = user.key_user
        iv_encrypt = user.iv_user
        
        key_bytes = bytes.fromhex(key_encrypt)
        
        key = AES_decifra(master_key, master_iv, key_bytes, "CBC")

        iv_bytes = bytes.fromhex(iv_encrypt)

        iv = AES_decifra(master_key, master_iv, iv_bytes, "CBC")

        filename = user.medical_certificate.path

        result = decifra(filename, 'CBC', key, iv, user.email)
        #print(type(result))
        '''base64_bytes = base64.b64encode(result)
        base64_message = base64_bytes.decode('utf-8')
        print(type(base64_message))'''
        if user.medical_certificate:
            return JsonResponse({"Img": rf"/media/medical_certificates/user_{user.email}/new_image_decifradoCBC.bmp"}) 
        else:
            return JsonResponse({"Url":""}) 


def Add_main_group(request):
    if request.method == "POST":
        a = json.loads(request.body)["body"] # {email: email, profession: profession}
        a = a.split(":")
        profession = a[2]
        profession = profession.replace("\"", "")
        profession = profession.replace("}", "")

        print("\nProfession: ", profession)

        email = a[1].split(",")[0].replace("\"","")
        print("\nEmail: ", email)

        user = UserAccount.objects.get(email=email)
        if profession == "Investigator":
            for group in Group.objects.all():
                if group.name == 'investigators':
                    #group = Group.objects.all()[1]
                    user.groups.add(group)
                    return JsonResponse({"Status": "investigators"})
        else:
            for group in Group.objects.all():
                if group.name == 'health_professionals':
                    #group = Group.objects.all()[0]
                    user.groups.add(group)
                    return JsonResponse({"Status": "health_professionals"})


class Check_main_group(APIView):
    lookup_url_kwarg = 'email'

    def get(self, request):
        email = request.GET.get(self.lookup_url_kwarg, None)
        user = UserAccount.objects.get(email=email)

        for group in user.groups.all().values():
            if group['name'] == 'investigators':
                return JsonResponse({"Group": "investigators"})
            elif group['name'] == 'health_professionals':
                return JsonResponse({"Group": "health_professionals"})


# Alterado por Bia!
def Check_main_group_login(request, email):
    if request.method == 'GET':
        user = UserAccount.objects.get(email=email)
        for group in user.groups.all().values():
            if group['name'] == 'investigators':
                return JsonResponse({"Group": "investigators"})
            elif group['name'] == 'health_professionals':
                return JsonResponse({"Group": "health_professionals"})


class Check_user_groups(APIView):
    lookup_url_kwarg = 'email'
    def get(self, request):
        email = request.GET.get(self.lookup_url_kwarg, None)
        user = UserAccount.objects.get(email = email)
        groups = user.groups.all().values()
        
        
        return JsonResponse({"Groups": list(groups)})



# visto!
class Group_details(APIView):
    lookup_url_kwarg = 'group' #string
    lookup_url_kwarg_user = 'user' #string
    def get(self, request):
        group_name = request.GET.get(self.lookup_url_kwarg, None)
        user_email = request.GET.get(self.lookup_url_kwarg_user, None)
        params = (request.GET).dict()
        
        if group_name != "health_professionals" and group_name != "investigators":
            group = Group.objects.get(name=group_name)
            users = group.user_set.all().values()
        
            for user in users:
                if user_email == user["email"]:
                    profession = user["profession"]
                    if profession == "Health Professional":
                        users=list(users)
                        mainUser = group.user_set.all().values()[0]["email"]
                        permissions = group.permissions.all().values()
                        return JsonResponse({"Users": list(users), "Permissions": list(permissions), "mainUser": mainUser, "profession": profession})
                    else:
                        users=list(users)
                        mainUser = group.user_set.all().values()[0]["email"]
                        permissions = group.permissions.all().values()
                        return JsonResponse({"Users": list(users), "Permissions": list(permissions), "mainUser": mainUser, "profession": profession})
            
            return JsonResponse("You don't belong to this group!")
            
        else:
            group = Group.objects.get(name=group_name)
            usersFiltered = group.user_set.all()
            new_list = []
            if 'email' in list(params.keys()):
                usersFiltered = usersFiltered.filter(email__icontains=params['email'])
            if 'first_name' in list(params.keys()):
                usersFiltered = usersFiltered.filter(first_name__icontains=params['first_name'])
            if 'last_name' in list(params.keys()):
                usersFiltered = usersFiltered.filter(last_name__icontains=params['last_name'])
            
            new_list = list(usersFiltered.values())
            mainUser = group.user_set.all().values()[0]["email"]
            permissions = group.permissions.all().values()

            return JsonResponse({"Users": new_list, "Permissions": list(permissions), "mainUser": mainUser})

# visto!
class View_studies(APIView):
    lookup_url_kwarg = 'groupName'
    lookup_url_kwarg_user = 'user'
    def get(self, request):
        group_name = request.GET.get(self.lookup_url_kwarg, None)
        group = Group.objects.get(name = group_name)
        user_email = request.GET.get(self.lookup_url_kwarg_user, None)
        users = group.user_set.all().values()
        user = UserAccount.objects.get(email=user_email)
        
        for userr in users:
            if user_email == userr["email"]:
                list_permissions_group = []
                permissions_group = group.permissions.all().values()
                for permission in permissions_group:
                    list_permissions_group.append(permission["name"])
                studies = get_objects_for_group(group, list_permissions_group,  klass = Study, accept_global_perms=False)
                allPerms = list_permissions_group
                dict_studies = {}
                for study in studies:
                    perms = get_user_perms(user, study)
                    for perm in perms:
                        allPerms.append(perm)
                    dict_studies[study.study_uid] = {'user': study.user.email, 'user_permissions': allPerms}

                return JsonResponse({"Studies": dict_studies}, safe=False)
        
        return JsonResponse({"Studies":"You don't belong to this group!"})


#new
class Permissions_studies(APIView):
    lookup_url_kwarg_user = 'user'
    lookup_url_kwarg_study = 'study_id'
    def get(self, request, format = None):
        user_email = request.GET.get(self.lookup_url_kwarg_user, None)

        user = UserAccount.objects.get(email=user_email)


        study_uid = request.GET.get(self.lookup_url_kwarg_study, None)

        study = Study.objects.get(study_uid=study_uid, user=user)
        
        
        if user.has_perm('view_study', study) and user.has_perm('test_study', study):
            return JsonResponse({"Status": "You can view and test this study"})
        elif user.has_perm('view_study', study):
            return JsonResponse({"Status": "You can only view this study"})
        else:
            return JsonResponse({"Status": "You cannot view this study"}) 


# visto!
class View_models(APIView):
    lookup_url_kwarg = 'groupName'
    lookup_url_kwarg_user = 'user'
    def get(self, request):
        group_name = request.GET.get(self.lookup_url_kwarg, None)
        group = Group.objects.get(name=group_name)
        user_email = request.GET.get(self.lookup_url_kwarg_user, None)
        users = group.user_set.all().values()
        
        for userr in users:
            if user_email == userr["email"]:
                list_permissions_group = []
                permissions_group = group.permissions.all().values()
                for permission in permissions_group:
                    list_permissions_group.append(permission["name"])
                models = get_objects_for_group(group, list_permissions_group,  klass = Model, accept_global_perms=False)
                list_models=[]
                for model in models:
                    list_models.append(model.id)
                
                return JsonResponse({"Models": list_models})
        return JsonResponse({"Studies":"You don't belong to this group!"})


#new
class Permissions_models(APIView):
    lookup_url_kwarg_user = 'user'
    lookup_url_kwarg_model = 'mode_id'
    def get(self, request, format = None):
        user_email = request.GET.get(self.lookup_url_kwarg_user, None)

        user = UserAccount.objects.get(email = user_email)


        model_id = request.GET.get(self.lookup_url_kwarg_model, None)

        model = Model.objects.get(id = model_id)
        
        
        if user.has_perm('view_model', model) and user.has_perm('test_model', model):
            return JsonResponse({"Status": "You can view and test this model"})
        elif user.has_perm('view_model', model):
            return JsonResponse({"Status": "You can only view this model"})
        else:
            return JsonResponse({"Status": "You cannot view this model"})


# visto!
class Health_Professional_Add_group(APIView):
    def post(self, request):
        '''
        request = {
            'groupName': string,
            'mainUser': email,
            'users': list[string=email],
            'studies': list[string=study_uid],
            'permissions': list[string]
        }
        '''

        groupName = request.data.get("groupName")
        mainUserEmail = request.data.get("mainUser")
        mainUser = UserAccount.objects.get(email=mainUserEmail)
        
        users = request.data.get("users")
        users = list(json.loads(users))

        permissions = request.data.get("permissions")
        permissions = list(json.loads(permissions))
        
        group, created = Group.objects.get_or_create(name=groupName)

        mainUser.groups.add(group)

        message = "Hey " + mainUserEmail + "!\nYou were invited to a group called " + groupName + ".\nGo to Medical App to see more about that group!\nLooking forward to seeing you there :)\n\nMedical App team"
        email = EmailMessage(
            'Invited to a group!',
            message,
            settings.EMAIL_HOST_USER,
            [mainUserEmail],
        )
        email.fail_silently=False
        email.send()

        for user in users:
            User = UserAccount.objects.get(email=user)
            User.groups.add(group)
            message = "Hey " + user + "!\nYou were invited to a group called " + groupName + ".\nGo to Medical App to see more about that group!\nLooking forward to seeing you there :)\n\nMedical App team"
            email = EmailMessage(
                'Invited to a group!',
                message,
                settings.EMAIL_HOST_USER,
                [user],
            )
            email.fail_silently=False
            email.send()
        
    
        studies = request.data.get("studies")
        studies = list(json.loads(studies))

        for study in studies:
            try:
                study = Study.objects.get(study_uid=study, user=mainUser)
                for permission in permissions:
                    if Permission.objects.filter(codename=permission).exists():
                        permission1 = Permission.objects.get(codename=permission)
                        assign_perm(permission1, group, study)
                        permission2 = Permission.objects.get(codename=permission)
                        group.permissions.add(permission2)
                    else:
                        ct = ContentType.objects.get_for_model(Study)
                        permission1 = Permission.objects.create(codename=permission,
                                                        name=permission,
                                                        content_type=ct)
                        assign_perm(permission1, group, study)
                        permission2 = Permission.objects.get(codename=permission)
                        group.permissions.add(permission2)
            
            except ObjectDoesNotExist:
                return JsonResponse({"Status": False})
            
        return JsonResponse({"Status": True})


#visto!
class Investigator_Add_group(APIView):
    def post(self, request):
        '''
        request = {
            'groupName': string,
            'mainUser': email,
            'users': list[email],
            'models': list[string=name],
            'permissions': list[string]
        }
        '''
        groupName = request.data.get("groupName")
        mainUserEmail = request.data.get("mainUser")
        mainUser = UserAccount.objects.get(email=mainUserEmail)
        
        users = request.data.get("users")
        users = list(json.loads(users))

        permissions = request.data.get("permissions")
        permissions = list(json.loads(permissions))

        group, created = Group.objects.get_or_create(name=groupName)

        mainUser.groups.add(group)

        message = "Hey " + mainUserEmail + "!\nYou were invited to a group called " + groupName + ".\nGo to Medical App to see more about that group!\nLooking forward to seeing you there :)\n\nMedical App team"
       
        email = EmailMessage(
            'Invited to a group!',
            message,
            settings.EMAIL_HOST_USER,
            [mainUserEmail],
        )
        email.fail_silently=False
        email.send()

        for user in users:
            User = UserAccount.objects.get(email=user)
            User.groups.add(group)
            message = "Hey " + user + "!\nYou were invited to a group called " + groupName + ".\nGo to Medical App to see more about that group!\nLooking forward to seeing you there :)\n\nMedical App team"
            email = EmailMessage(
                'Invited to a group!',
                message,
                settings.EMAIL_HOST_USER,
                [user],
            )
            email.fail_silently=False
            email.send()
        
        models = request.data.get("models")
        models = list(json.loads(models))
        
        user_models = Model.objects.filter(user=mainUser)
        for model in models:
            model = Model.objects.get(name=model)
            if model in user_models:
                for permission in permissions:
                    if Permission.objects.filter(codename=permission).exists():
                        permission1 = Permission.objects.get(codename=permission)
                        assign_perm(permission1, group, model)
                        permission2 = Permission.objects.get(codename=permission)
                        group.permissions.add(permission2)
                    else:
                        ct = ContentType.objects.get_for_model(Model)
                        permission1 = Permission.objects.create(codename=permission,
                                                        name=permission,
                                                        content_type=ct)
                        assign_perm(permission1, group, model)
                        permission2 = Permission.objects.get(codename=permission)
                        group.permissions.add(permission2)
            else:
                return JsonResponse({"Status": False})
        
        
        return JsonResponse({"Status": True})


# visto!
class Remove_group(APIView):
    def post(self, request):
        mainUser = request.data.get("mainUser")
        mainUser = UserAccount.objects.get(email=mainUser)
        groupName = request.data.get("groupName")
        group = Group.objects.get(name=groupName)
        mainUser_email = group.user_set.all().values()[0]["email"]

        if mainUser.email == mainUser_email and mainUser.profession == "Health Professional":
            users = group.user_set.all().values()
            list_permissions_group = []
            permissions_group = group.permissions.all().values()
            for permission in permissions_group:
                list_permissions_group.append(permission["name"])
            studies = get_objects_for_group(group, list_permissions_group,  klass = Study, accept_global_perms=False)
            
            for user in users:
                print(user)
                User = UserAccount.objects.get(email=user["email"])
                message = message = "Hey " + user["email"] + "!\nYou were eliminated from a group called " + groupName + ".\nGo to Medical App to see more about that!\nLooking forward to seeing you there :)\n\nMedical App team"
                email = EmailMessage(
                    'Eliminated from a group!',
                    message,
                    settings.EMAIL_HOST_USER,
                    [mainUser.email],
                )
                email.fail_silently=False
                email.send()

                for study in studies:
                    perms = get_user_perms(User, study)
                    for perm in perms:
                        remove_perm(perm, User, study)

                User.groups.remove(group)
            
            group.delete()
           
            return JsonResponse({"Status": True})

        elif mainUser.email==mainUser_email and mainUser.profession == "Investigator":
            users = group.user_set.all().values()
            list_permissions_group = []
            permissions_group = group.permissions.all().values()
            for permission in permissions_group:
                list_permissions_group.append(permission["name"])
            models = get_objects_for_group(group, list_permissions_group,  klass = Model, accept_global_perms=False)
            
            for user in users:
                User = UserAccount.objects.get(email = user["email"])
                message = message = "Hey " + user["email"] + "!\nYou were eliminated from a group called " + groupName + ".\nGo to Medical App to see more about that!\nLooking forward to seeing you there :)\n\nMedical App team"
                
                email = EmailMessage(
                    'Eliminated from a group!',
                    message,
                    settings.EMAIL_HOST_USER,
                    [mainUser.email],
                )
                email.fail_silently=False
                email.send()

                for model in models:
                    perms = get_user_perms(User, model)
                    for perm in perms:
                        remove_perm(perm, User, model)

                User.groups.remove(group)
            
            group.delete()

            return JsonResponse({"Status": True})

        else:
            return JsonResponse({"Status": False})


# visto!
class See_permissions(APIView):
    lookup_url_kwarg = 'group'
    lookup_url_kwarg2 = 'email'
    lookup_url_kwarg_user = 'user'
    def get(self, request):
        groupName = request.GET.get(self.lookup_url_kwarg, None)
        email = request.GET.get(self.lookup_url_kwarg2, None)
        user_email = request.GET.get(self.lookup_url_kwarg_user, None)

        group, created = Group.objects.get_or_create(name=groupName)
        User = UserAccount.objects.get(email=email)

        if User.profession == "Health Professional":
            users = group.user_set.all().values()
            users = list(users)
            for user in users:
                if user_email == user["email"]:
                    permissions = []
                    allPerms = []
                    permissions_group = group.permissions.all().values()
                    for permission in permissions_group:
                        allPerms.append({'name': permission["name"], 'givenByGroup': True})
                        permissions.append(permission["name"])
                    print(allPerms)
                    studies = get_objects_for_group(group, permissions,  klass = Study, accept_global_perms=False)
                    print(studies)
                    perms = get_user_perms(User, studies[0])
                    for perm in perms:
                        allPerms.append({'name': perm, 'givenByGroup': False})
                    print("User Individual Permissions:", perms)

                    return JsonResponse({"Perms": allPerms})

            return JsonResponse({"Perms":"You don't belong to this group!"})
        else:
            users = group.user_set.all().values()
            users = list(users)
            for user in users:
                if user_email in user["email"]:
                    permissions = []
                    allPerms = []
                    permissions_group = group.permissions.all().values()
                    for permission in permissions_group:
                        allPerms.append({'name': permission["name"], 'givenByGroup': True})
                        permissions.append(permission["name"])
                    print(allPerms)
                    models = get_objects_for_group(group, permissions, klass = Model, accept_global_perms=False)
                    print(models)
                    perms = get_user_perms(User, models[0])
                    for perm in perms:
                        allPerms.append({'name': perm, 'givenByGroup': False})
                    print("User Individual Permissions:", perms)

                    return JsonResponse({"Perms": allPerms})
            
            return JsonResponse({"Perms":"You don't belong to this group!"})


# visto!
class Add_permissions(APIView):
    def post(self, request):
        groupName = request.data.get("groupName")
        
        group, created = Group.objects.get_or_create(name=groupName)
        user = request.data.get("user")
        appUser = request.data.get("appUser")
        appUser = appUser.replace("\"", "")
    
        permissions = request.data.get("permissions")
        permissions = list(json.loads(permissions))
 
        users = group.user_set.all().values()
        users = list(users)
       
        userToAdd = UserAccount.objects.get(email=user)
        User = UserAccount.objects.get(email=appUser)
        if User.profession == "Health Professional":
            for permission in permissions:
                if Permission.objects.filter(codename=permission).exists():
                    permission1 = Permission.objects.get(codename=permission)
                    list_permissions_group = []
                    permissions_group = group.permissions.all().values()
                    for permission in permissions_group:
                        list_permissions_group.append(permission['name'])
                    studies = get_objects_for_group(group, list_permissions_group, klass = Study, accept_global_perms=False)
                    for study in studies:
                        print(permission1)
                        assign_perm(permission1, userToAdd, study)
                    
                    return JsonResponse({"Status": True})
                else:
                    ct = ContentType.objects.get_for_model(Study)
                    permission1 = Permission.objects.create(codename=permission,
                                                name=permission,
                                                content_type=ct)
                    list_permissions_group = []
                    permissions_group = group.permissions.all().values()
                    for permission in permissions_group:
                        list_permissions_group.append(permission["name"])
                    studies = get_objects_for_group(group, list_permissions_group, klass = Study, accept_global_perms=False)
                    for study in studies:
                        assign_perm(permission1, userToAdd, study)
                    
                    return JsonResponse({"Status": True})

        else:
            for permission in permissions:
                if Permission.objects.filter(codename=permission).exists():
                    permission1 = Permission.objects.get(codename=permission)
                    list_permissions_group = []
                    permissions_group = group.permissions.all().values()
                    for permission in permissions_group:
                        list_permissions_group.append(permission['name'])
                    models = get_objects_for_group(group, list_permissions_group, klass = Model, accept_global_perms=False)
                    for model in models:
                        assign_perm(permission1, userToAdd, model)
                    
                    return JsonResponse({"Status": True})
                else:
                    ct = ContentType.objects.get_for_model(Model)
                    permission1 = Permission.objects.create(codename=permission,
                                                name=permission,
                                                content_type=ct)
                    list_permissions_group = []
                    permissions_group = group.permissions.all().values()
                    for permission in permissions_group:
                        list_permissions_group.append(permission["name"])
                    models = get_objects_for_group(group, list_permissions_group, klass = Model, accept_global_perms=False)
                    for model in models:
                        assign_perm(permission1, userToAdd, model)

                    return JsonResponse({"Status": True})


# visto!     
class Remove_permissions(APIView):
    def post(self, request):
        groupName = request.data.get("groupName")
        group, created = Group.objects.get_or_create(name =groupName)
        user = request.data.get("user")
        appUser = request.data.get("appUser")
        appUser = appUser.replace("\"", "")
        permissions = request.data.get("permissions")
        permissions = list(json.loads(permissions))
        
        userToRemove = UserAccount.objects.get(email=user)
        users = group.user_set.all().values()
        users = list(users)

        User = UserAccount.objects.get(email=appUser)
        if User.profession =="Health Professional":
            for permission in permissions:
                list_permissions_group = []
                permissions_group = group.permissions.all().values()
                for permissions in permissions_group:
                    list_permissions_group.append(permissions["name"])
                studies = get_objects_for_group(group, list_permissions_group, klass = Study, accept_global_perms=False)
                permission1 = Permission.objects.get(codename=permission)
                for study in studies:
                    print(study)
                    remove_perm(permission1, userToRemove, study)
            
            return JsonResponse({"Status": True})
        else:
            for permission in permissions:
                list_permissions_group = []
                permissions_group = group.permissions.all().values()
                for permissions in permissions_group:
                    list_permissions_group.append(permissions["name"])
                models = get_objects_for_group(group, list_permissions_group, klass = Model, accept_global_perms=False)
                
                permission1 = Permission.objects.get(codename=permission)
                for model in models:
                    print(model)
                    remove_perm(permission1, userToRemove, model)
        
            return JsonResponse({"Status": True})

        
# visto!
class Add_elements(APIView):
    def post(self, request):
        groupName = request.data.get("groupName")
        users = request.data.get("users")
        users = list(json.loads(users))

        appUser = request.data.get("appUser")
        appUser = appUser.replace("\"", "")
        
        group, created = Group.objects.get_or_create(name=groupName)
        permissions = group.permissions.all().values()

        users_group = group.user_set.all().values()
        users_group = list(users_group)
       
        User = UserAccount.objects.get(email=appUser)
        list_permissions_group = []
        for permission in permissions:
            list_permissions_group.append(permission["name"])
        if User.profession =="Health Professional":
            studies = get_objects_for_group(group, list_permissions_group, klass = Study, accept_global_perms=False)
            for user in users:
                User_add = UserAccount.objects.get(email=user)
                User_add.groups.add(group)
                for study in studies:
                    for permission in permissions:
                        permission = Permission.objects.get(codename=permission['name'])
                        assign_perm(permission, User_add, study)
                    perms = get_user_perms(User_add, study)
                    print("Novas permissões do novo user:", perms)

                message = "Hey " + user + "!\nYou were invited to a group called " + groupName + ".\nGo to Medical App to see more about that group!\nLooking forward to seeing you there :)\n\nMedical App team"
                
                email = EmailMessage(
                    'Invited to a group!',
                    message,
                    settings.EMAIL_HOST_USER,
                    [user],
                )
                email.fail_silently=False
                email.send()
            
            return JsonResponse({"Status": True})
        else:
            models = get_objects_for_group(group, list_permissions_group, klass = Model, accept_global_perms=False)
            for user in users:
                User_add = UserAccount.objects.get(email=user)
                User_add.groups.add(group)
                for model in models:
                    for permission in permissions:
                        print(permission)
                        permission = Permission.objects.get(codename=permission['name'])
                        assign_perm(permission, User_add, model)
                    perms = get_user_perms(User_add, model)
                    print("Novas permissões do novo user:", perms)

                message = "Hey " + user + "!\nYou were invited to a group called " + groupName + ".\nGo to Medical App to see more about that group!\nLooking forward to seeing you there :)\n\nMedical App team"
                email = EmailMessage(
                    'Invited to a group!',
                    message,
                    settings.EMAIL_HOST_USER,
                    [user],
                )
                email.fail_silently=False
                email.send()
            
            return JsonResponse({"Status": True})


# visto!
class Remove_elements(APIView):
    def post(self, request):
        groupName0 = request.data.get("groupName")
        users = request.data.get("users")
        users = list(json.loads(users))
        appUser = request.data.get("appUser")
        appUser = appUser.replace("\"", "")
        group, created = Group.objects.get_or_create(name =groupName0)

        users_group = group.user_set.all().values()
        users_group=list(users_group)
        
        User = UserAccount.objects.get(email=appUser)
        list_permissions_group = []
        permissions_group = group.permissions.all().values()
        for permission in permissions_group:
            list_permissions_group.append(permission["name"])
        
        if User.profession == "Health Professional":
            studies = get_objects_for_group(group, list_permissions_group, klass = Study, accept_global_perms=False)
            for user in users:
                User_remove = UserAccount.objects.get(email=user)
                User_remove.groups.remove(group)
                for study in studies:
                    perms = get_user_perms(User_remove, study)
                    for perm in perms:
                        remove_perm(perm, User_remove, study)
                    
                message = "Hey " + user + "!\nYou were eliminated from a group called " + groupName0 + ".\nGo to Medical App to see more about that!\nLooking forward to seeing you there :)\n\nMedical App team"
                
                email = EmailMessage(
                    'Eliminated from a group!',
                    message,
                    settings.EMAIL_HOST_USER,
                    [user],
                )
                email.fail_silently=False
                email.send()
        
        else:
            models = get_objects_for_group(group, list_permissions_group, klass = Model, accept_global_perms=False)
            for user in users:
                User_remove = UserAccount.objects.get(email=user)
                User_remove.groups.remove(group)
                for model in models:
                    perms = get_user_perms(User_remove, model)
                    for perm in perms:
                        remove_perm(perm, User_remove, model)
                message = "Hey " + user + "!\nYou were eliminated from a group called " + groupName0 + ".\nGo to Medical App to see more about that!\nLooking forward to seeing you there :)\n\nMedical App team"
                email = EmailMessage(
                    'Eliminated from a group!',
                    message,
                    settings.EMAIL_HOST_USER,
                    [user],
                )
                email.fail_silently=False
                email.send()

        return JsonResponse({"Status": True})

# adicionado por Bia!!!
class Investigator_Add_models(APIView):
    def post(self, request):
        '''
        request = {
            'groupName': string,
            'models': list[string=name],
        }
        '''
        groupName = request.data.get("groupName")
        group = Group.objects.get(name=groupName)

        models = request.data.get("models")
        models = list(json.loads(models))

        print(f"\nGroup {groupName} adding models ", models)

        permissions = []

        permissions_group = group.permissions.all().values()
        for permission in permissions_group:
            permissions.append(permission["name"])

        for model in models:
            model = Model.objects.get(name=model)
            for permission in permissions:
                print(
                    f"\nAdding permission {permission} over new model {model.name}\n")
                permission = Permission.objects.get(codename=permission)
                assign_perm(permission, group, model)

        return JsonResponse({"Status": True})


# adicionado por Bia!!!
class Investigator_Remove_models(APIView):
    def post(self, request):
        '''
        request = {
            'groupName': string,
            'models': list[string=name],
        }
        '''
        groupName = request.data.get("groupName")
        group = Group.objects.get(name=groupName)

        users_group = group.user_set.all().values()
        users_group = list(users_group)

        print("\nUsers from group ", len(users_group))

        models = request.data.get("models")
        models = list(json.loads(models))

        print(f"\nGroup {groupName} removing models ", models)

        permissions = []

        permissions_group = group.permissions.all().values()
        for permission in permissions_group:
            permissions.append(permission["name"])

        for model in models:
            try:
                model = Model.objects.get(name=model)
                for user in users_group:
                    User_remove = UserAccount.objects.get(email=user['email'])
                    perms = get_user_perms(User_remove, model)
                    # print(perms)
                    for perm in perms:
                        print(
                            f"\nRemoving {user['email']} permission {perm} over model {model.name}\n")
                        remove_perm(perm, User_remove, model)

                    for permission in permissions:
                        print(
                            f"\nRemoving Group permission {permission} over model {model.name}\n")
                        permission = Permission.objects.get(
                            codename=permission)
                        remove_perm(permission, group, model)

            except ObjectDoesNotExist:
                return JsonResponse({"Status": False})

        return JsonResponse({"Status": True})


# adicionado por Bia!!!
class Health_Professional_Add_studies(APIView):
    def post(self, request):
        '''
        request = {
            'groupName': string,
            'mainUser': email,
            'studies': list[string=study_uid],
        }
        '''
        groupName = request.data.get("groupName")
        group = Group.objects.get(name=groupName)

        mainUserEmail = request.data.get("mainUser")
        mainUser = UserAccount.objects.get(email=mainUserEmail)

        studies = request.data.get("studies")
        studies = list(json.loads(studies))

        print(f"\nGroup {groupName} adding studies ", studies)

        permissions = []

        permissions_group = group.permissions.all().values()
        for permission in permissions_group:
            permissions.append(permission["name"])

        for study in studies:
            try:
                study = Study.objects.get(study_uid=study, user=mainUser)
                for permission in permissions:
                    print(
                        f"\nAdding permission {permission} over new study {study.study_uid}\n")
                    permission = Permission.objects.get(codename=permission)
                    assign_perm(permission, group, study)

            except ObjectDoesNotExist:
                return JsonResponse({"Status": False})

        return JsonResponse({"Status": True})


# adicionado por Bia!!!
class Health_Professional_Remove_studies(APIView):
    def post(self, request):
        '''
        request = {
            'groupName': string,
            'mainUser': email,
            'studies': list[string=study_uid],
        }
        '''
        groupName = request.data.get("groupName")
        group = Group.objects.get(name=groupName)

        users_group = group.user_set.all().values()
        users_group = list(users_group)

        print("\nUsers from group ", len(users_group))

        mainUserEmail = request.data.get("mainUser")
        mainUser = UserAccount.objects.get(email=mainUserEmail)

        studies = request.data.get("studies")
        studies = list(json.loads(studies))

        print(f"\nGroup {groupName} removing studies ", studies)

        permissions = []

        permissions_group = group.permissions.all().values()
        for permission in permissions_group:
            permissions.append(permission["name"])

        for study in studies:
            try:
                study = Study.objects.get(study_uid=study, user=mainUser)
                for user in users_group:
                    User_remove = UserAccount.objects.get(email=user['email'])
                    perms = get_user_perms(User_remove, study)
                    # print(perms)
                    for perm in perms:
                        print(
                            f"\nRemoving {user['email']} permission {perm} over study {study.study_uid}\n")
                        remove_perm(perm, User_remove, study)

                    for permission in permissions:
                        print(
                            f"\nRemoving Group permission {permission} over study {study.study_uid}\n")
                        permission = Permission.objects.get(
                            codename=permission)
                        remove_perm(permission, group, study)

            except ObjectDoesNotExist:
                return JsonResponse({"Status": False})

        return JsonResponse({"Status": True})

