from django.shortcuts import render
from . import models
from django.http import JsonResponse
import json
from rest_framework.views import APIView
from django.conf import settings
from django.template.loader import render_to_string
from http.client import HTTPResponse
from .models import Model
from .serializers import ModelSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import os
from django.core.exceptions import ObjectDoesNotExist
from zipfile import ZipFile
from monailabel.utils.others.generic import get_mime_type
from django.http import FileResponse
from monailabel.utils.others.class_utils import get_class_of_subclass_from_file
import glob
import shutil
from os.path import basename
import sys
import subprocess
import requests

# Create your views here.
class Example(APIView):
    def get(self, request, format = None):
        example = 160
        #subprocess.run(["flask", "--version"], text=True, input="2 3")
        #response = requests.get('http://host.docker.internal:8080/docker_system_api/verify_DockerImage')
        #examplee = response.json()["Variable"]
        return JsonResponse({"variable": example})

@api_view(['GET', 'POST'])
def models(request):
    """
    List all model files, or create a new one.
    
    if request.method == 'GET':

        models = Model.objects.filter(user=request.GET["user"])
        
        serializer = ModelSerializer(models, many=True)

        
        return Response(serializer.data)
    """

    if request.method == 'POST':

        serializer = ModelSerializer(data=request.data)
       
        if serializer.is_valid():
            data = serializer.validated_data

            model_zip = data['file']
            model_name = data['name']

            with ZipFile(model_zip, 'r') as zip:
        
                #zip.printdir()
    
                zip.extractall(path=f'D:/tese/{model_name}')

            result = validate(model_dir=f'D:/tese/{model_name}')

            shutil.rmtree(f'D:/tese/{model_name}')

            if result == True:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

   
@api_view(['POST'])
def model_validation(request):
   
    if request.method == 'POST':

        serializer = ModelSerializer(data=request.data)

        if serializer.is_valid():
            data = serializer.validated_data

            model_zip = data['file']
            model_name = data['name']

            with ZipFile(model_zip, 'r') as zip:
        
                zip.printdir()
    
                zip.extractall(path=f'D:/tese/{model_name}')

            result = validate(model_dir=f'D:/tese/{model_name}')

            shutil.rmtree(f'D:/tese/{model_name}')

            if result == True:
                return Response(None, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

    else:
        print("Não recebi pedido de POST")


@api_view(['GET'])
def model_delete(request):

    if request.method == 'GET':

        algorithm_name = request.GET["algorithm"]

        model = Model.objects.filter(name=algorithm_name)

        try:
            model.delete()
            try:
                os.remove(f'D:/tese/Django/media/models/{algorithm_name}.zip')
                print (f"Algorithm named '{algorithm_name}' was deleted.")
            except OSError as e:
                print ("Error: %s - %s." % (e.filename, e.strerror))
                return Response({'message': 'Failed to delete algorithm!'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({'message': 'Algorithm was deleted!'}, status=status.HTTP_200_OK)
            
        
        except ObjectDoesNotExist:
            return Response({'message': 'Failed to delete algorithm!'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



def validate(model_dir):

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

    pre_trained_model_ts = glob.glob(model_dir + "/**/*.ts", recursive = True)
    pre_trained_model_pt = glob.glob(model_dir + "/**/*.pt", recursive = True)
    pre_trained_model_pth = glob.glob(model_dir + "/**/*.pth", recursive = True)

    if len(pre_trained_model_ts) == 0 and len(pre_trained_model_pt) == 0 and len(pre_trained_model_pth) == 0: # Não encontrou nenhum ficheiro com extensão '.ts' ou '.pt' na pasta
        return {"error": "\nIt does NOT have a pre-trained model file!"}

    
    # implement pip as a subprocess:
    #exit_code, output = subprocess.getstatusoutput([sys.executable, '-m', 'pip', 'install', '-r', requirements_txt])

    '''if exit_code != 0:
        print(output)
        return {"error": output}'''

    c = get_class_of_subclass_from_file("main", main_py, "Application")
    if c is None:
        return {"error": "\nIt does NOT implement class 'Application' in 'main.py'!"}

    app_instance = c(root_dir=model_dir)

    task = app_instance._infer
        
    if not task:
        return {"error": "\nInference Task is not Initialized!"}

    c = get_class_of_subclass_from_file("main", main_py, "InferTask")
    if c is None:
        return {"error": "\nIt does NOT implement class 'InferTask' in 'main.py'!"}


    return True
        

'''
@api_view(['GET', 'POST'])
def images(request):
    """
    List all images from user, or create a new one.
    Quando no frontend é feito o upload de uma Imagem para o Orthanc tem de ser passada a informação ao Django: 
    o estudo em questão, quem está a fazer o upload e o paciente a quem pertence o estudo.
    """
    if request.method == 'GET':

        studies = list(Study.objects.filter(user=request.GET["user"]))

        data = []

        for study in studies:
            data.append(study.study_uid)

        return Response(data)

    elif request.method == 'POST':

        try:
            patient  = Patient.objects.get(patient_id=request.data['patient_id'])
            study = Study.objects.get(study_uid=request.data['study_uid'], patient=patient)
        except ObjectDoesNotExist:
            patient = Patient(patient_id=request.data['patient_id'])
            user = UserAccount.objects.get(email=request.data['user'])
            study = Study(study_uid=request.data['study_uid'], patient=patient, user=user)
            patient.save()
            study.save()
        
        
        return Response(study.study_uid, status=status.HTTP_201_CREATED)
        
    else:
        print("Não recebi pedido de POST nem de GET")


@api_view(['GET'])
def images_encrypt(request):

    if request.method == 'GET':

        encrypt()

        dcm_images = glob.glob('C:/Users/beatr/Desktop/cifradas' + "/**/*.dcm", recursive = True)

        with ZipFile('C:/Users/beatr/Desktop/dcm_images.zip', 'w') as zip:
            for filePath in dcm_images:
                zip.write(filePath, basename(filePath))

        m_type = get_mime_type('C:/Users/beatr/Desktop/dcm_images.zip')

        return FileResponse(open('C:/Users/beatr/Desktop/dcm_images.zip', 'rb'), content_type=m_type)
'''
        
def safe_mkdir(path):
    try:
        os.mkdir(path)
        print("Pasta " + f"{path}" + " criada")
    except OSError:
        return 'Error creating folder'


def run_inference(model: str, series_id: str, inputExtension: str, task: str):

    app_dir = f'/usr/src/app/container_api/'

    print(f"\n1) Initializing Algorithm from: {app_dir}.\n")

    main_py = os.path.join(app_dir, "main.py")

    c = get_class_of_subclass_from_file("main", main_py, "Application")

    app_instance = c(app_dir, task)

    print(f"3) Algorithm's Info: {app_instance.info()}.\n")

    request = {'image': series_id, 'input_extension': inputExtension}

    result = app_instance.infer(request)

    if result is None:
        return HTTPResponse("Failed to execute infer")

    else:
        return result


@api_view(['POST'])
def ai_prediction(request, model: str, image: str):

    if request.method == 'POST':

        inputExtension = json.loads(request.data['params'])['inputExtension']

        task = json.loads(request.data['params'])['task']

        result = run_inference(model, image, inputExtension, task)

        if result.get("task_type") == "Classification":

            return Response(result, status=status.HTTP_200_OK)

        else:
            res_img = result.get("file")

            m_type = get_mime_type(res_img)

            return FileResponse(open(res_img, 'rb'), content_type=m_type)


