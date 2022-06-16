import copy
import os
#from monailabel.datastore.dicom import DICOMwebClientX, DICOMWebDatastore
from monailabel.interfaces.datastore import DefaultLabelTag
from container_api.scripts.infer_task import InferType
from dicomweb_client.session_utils import create_session_from_user_pass
from dicomweb_client.api import DICOMwebClient
from .dicom import DICOMwebClientX, DICOMWebDatastore

class Application:
    
    def __init__(
        self,
        root_dir: str,
    ):
        """
        Base Class for Any Algorithm App

        :param app_dir: path for Algorithm directory

        """
        self.root_dir = root_dir
        self._datastore = self.init_datastore()
        self._infer = self.init_infer()

                
    def init_infer(self):
        return {}


    def init_datastore(self):
        studies = 'http://orthanc-service:8047/dicom-web'

        print(f"2) Using Orthanc via DICOM WEB: {studies}.\n")

    
        session = create_session_from_user_pass(username='orthanc', password='orthanc')

        #client = DICOMwebClient(url="http://10.111.188.57:8047", session=session)

        #studies = client.search_for_studies()

        #print(studies)

        dw_client = DICOMwebClientX(url="http://10.101.245.254:8047", session=session, qido_url_prefix="/dicom-web",  wado_url_prefix="/dicom-web", stow_url_prefix=None)
        print("dicom client2:",  dw_client)
        print("initializing datastore")
        d = DICOMWebDatastore(dw_client)
        print("datastore:", d)
        
        return DICOMWebDatastore(dw_client)
            
        
    def info(self, seriesId):
        
        meta = {
            "app_root_dir": self.root_dir,
            "infer_model": self._infer.info(),
            "datastore_series": self._datastore.list_images(),
            "datastore_dicom_info" : self._datastore._dicom_info(seriesId),
        }

        return meta


    def infer(self, request):
        """
        Run Inference for an existing pre-trained model.

        Args:
            request: JSON object which contains the `image` and the desired `input_extension`.
            
        Returns:
            JSON containing `label` and `params`
        """
    
        task = self._infer

        if task.type == InferType.OTHERS:
            request = copy.deepcopy(request)
            datastore = self.datastore()
            request["fixed_image"] = datastore.get_image_uri(request["fixed_image"])
            request["moving_image"] = datastore.get_image_uri(request["moving_image"])

            result_file_name = task(request)

            return {"task_type": "registration", "file": result_file_name}

        else:
            request = copy.deepcopy(request)
            series_id = request["image"]
            datastore = self.datastore()
            request["image"] = datastore.get_image_uri(request["image"])

            if request["input_extension"] == ".dcm":
                request["image"] = os.path.realpath(os.path.join(datastore._datastore.image_path(), series_id)).replace("\\","/")

            if task.type == InferType.SEGMENTATION:
                result_file_name, result_json = task(request)

                label_id = None
                if result_file_name and os.path.exists(result_file_name):
                    tag = request.get("label_tag", DefaultLabelTag.ORIGINAL)
                    save_label = request.get("save_label", True)
                    if save_label:
                        label_id = datastore.save_label(series_id, result_file_name, tag, result_json)
                    else:
                        label_id = result_file_name

                return {"task_type": "segmentation", "label": label_id, "tag": DefaultLabelTag.ORIGINAL, "file": result_file_name, "params": result_json}

            else:
                result = task(request)
                
                return result


    def datastore(self):
        return self._datastore
