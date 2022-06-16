import hashlib
import os
import requests
import pydicom
import io




def safe_mkdir(path):
    try:
        os.mkdir(path)
        print("Pasta " + f"{path}" + " criada")
    except OSError:
        return 'Error creating folder'




def cache_dicoms(patient_id, study_uid, series_uid, instances):
    # Orthanc
    url = "http://127.0.0.1:8042"
    series_folder = 'D:/tese/dicoms'
    
    if not(os.path.isdir(series_folder)):
        safe_mkdir(series_folder)
        for enum, instance_id in enumerate(instances):
            # Pede ao Orthanc as imagens para fazer cache delas e depois conseguir aplicar o modelo de AI nelas
            dicom = requests.get(url + "/instances/" + str(instance_id) + "/file")

            dicom_as_bytesio = io.BytesIO(dicom.content)
            dicom = pydicom.dcmread(dicom_as_bytesio)

            with open(os.path.join(series_folder, str(enum)+'.dcm'), 'wb') as out_file:
                pydicom.dcmwrite(out_file, dicom)
            
            del dicom

        return series_folder



def main():
        
    patient_id = '345345345234'

    instances_ids = ['1.3.12.2.1107.5.2.20.156005.2016122618233521671435314']

    series_id = '1.3.12.2.1107.5.2.20.156005.20161226182335844435311.0.0.0'

    study_id = '1.3.12.2.1107.5.2.20.156005.30000016122610282941400000009'

    #imageIds = []

    '''for url in list(imageUrl.keys()):
        data = url.split('/')
        study_uid = data[3]
        series_uid = data[5]
        imageIds.append(data[7])'''

    
    # https://book.orthanc-server.com/faq/orthanc-ids.html#orthanc-ids
    

    ids = []
    for imageId in instances_ids:
        string = patient_id+'|'+study_id+'|'+series_id+'|'+imageId
        hash = hashlib.sha1(string.encode("utf-8"))
        hex_dig = hash.hexdigest()
        orthanc_id = ""
        for i in range(0, len(hex_dig), 8):
            orthanc_id += hex_dig[i:i+8]+'-'
        orthanc_id = orthanc_id.rstrip(orthanc_id[-1])
        ids.append(orthanc_id)

    
    images_folder = cache_dicoms(patient_id, study_id, series_id, ids)

    print(images_folder)


main()