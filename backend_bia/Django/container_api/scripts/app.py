import copy
import os
from .dicom import DICOMwebClientX, DICOMWebDatastore
from dicomweb_client.session_utils import create_session_from_user_pass


class Application:
    
    def __init__(
        self,
        root_dir: str,
        task: str,
    ):
        """
        Base Class for Any Algorithm App

        :param root_dir: path for Algorithm root directory.\n\
        :param task: task performed by the Algorithm.\n\

        """
        self.root_dir = root_dir
        self.task = task
        self._datastore = self.init_datastore()
        self._infer = self.init_infer()

                
    def init_infer(self):
        return {}


    def init_datastore(self):
        studies = 'http://orthanc-service:8047/dicom-web'

        print(f"\n2) Using Orthanc via DICOM WEB: {studies}.\n")

        session = create_session_from_user_pass(username='orthanc', password='orthanc')

        #client = DICOMwebClient(url="http://10.111.188.57:8047", session=session)

        #studies = client.search_for_studies()

        #print(studies)

        dw_client = DICOMwebClientX(url="http://orthanc-service:8047", session=session, qido_url_prefix="/dicom-web",  wado_url_prefix="/dicom-web", stow_url_prefix=None)
        print("dicom client2:",  dw_client)
        print("initializing datastore")
        d = DICOMWebDatastore(dw_client)
        print("datastore:", d)
        
        return DICOMWebDatastore(dw_client)
            
        
    def info(self):
        
        meta = {
            "app_root_dir": self.root_dir,
            "infer_model": self._infer.info(),
            "datastore_series": self._datastore.list_images(),
        }

        return meta


    def infer(self, request):
        """
        Run Inference for an existing pre-trained model.

        Args:
            request: JSON object which contains the input `image` series.
            
        Returns:
            JSON containing the task type and the prediction result.
        """
    
        task = self._infer

        request = copy.deepcopy(request)
        datastore = self.datastore()

        if request["input_extension"] == ".dcm":
                request["image"] = os.path.realpath(os.path.join(datastore._datastore.image_path(), request["image"])).replace("\\","/")
        else:
            if self.task == 'Image Registration':
                series_ids = request["image"].split('S')
                for i in range(len(series_ids)):
                    series_ids[i] = datastore.get_image_uri(series_ids[i])
                
                request["image"] = {'fixed_image': series_ids[0], 'moving_image': series_ids[1]}
            
            else:
                request["image"] = datastore.get_image_uri(request["image"])

        print(f"\n4) Infer Request: {request}.\n")

        if self.task == 'Classification':
            result = task(request)
            
            return {"task_type": "Classification", "prediction": result}
            
        else:
            result_file_name = task(request)

            if result_file_name and os.path.exists(result_file_name):

                return {"task_type": self.task, "file": result_file_name}
            

    def datastore(self):
        return self._datastore
