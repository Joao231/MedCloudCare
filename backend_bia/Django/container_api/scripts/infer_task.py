import copy
import tempfile
import itk
import numpy as np
from monai.data import write_nifti


def write_itk(image_np, output_file, affine, dtype):
    if len(image_np.shape) > 2:
        image_np = image_np.transpose().copy()
    if dtype:
        image_np = image_np.astype(dtype)
    

    result_image = itk.image_from_array(image_np)

    if affine is not None:
        convert_aff_mat = np.diag([-1, -1, 1, 1])
        if affine.shape[0] == 3:
            convert_aff_mat = np.diag([-1, -1, 1])
        affine = convert_aff_mat @ affine

        dim = affine.shape[0] - 1
        _origin_key = (slice(-1), -1)
        _m_key = (slice(-1), slice(-1))

        origin = affine[_origin_key]
        spacing = np.linalg.norm(affine[_m_key] @ np.eye(dim), axis=0)
        direction = affine[_m_key] @ np.diag(1 / spacing)

        result_image.SetDirection(itk.matrix_from_array(direction))
        result_image.SetSpacing(spacing)
        result_image.SetOrigin(origin)

    itk.imwrite(result_image, output_file)


class Writer:
  
    def __call__(self, data):

        dtype = data["result_dtype"]
        file_ext = data["result_extension"]
     
        image_np = data["image_np"]
        affine = data.get("affine", None)

        print("\n5) Result Image Numpy Array: ", image_np)
        print("\n6) Affine Function: ", affine)
        
        output_file = tempfile.NamedTemporaryFile(suffix=file_ext).name # ".nii.gz"
        print("\n7) Saving Result File to: {}".format(output_file) + '\n')
  
        write_nifti(image_np, "C:/Users/beatr/Desktop/result.nii.gz", affine=affine)
        
        write_itk(image_np, output_file, affine, dtype)

        return output_file


class InferTask:
    """
    Basic Inference Task Helper
    """

    def __init__(
        self,
        task: str,
    ):
        """
        :param task: task performed by the Algorithm.\n\
        
        """
        self.task = task
        

    def info(self):
        return {
            "task": self.task,
        }


    def __call__(self, request):
        """
        It provides basic implementation to:
            - Run Inferer using the run() method.
            - Run Writer to save the prediction result.

        Returns: Result in one of three formats: JSON, NRRD or DICOM.
        """
        
        ''' 'Image Processing',
            'Image Registration',
            'Object Localisation',
            'Classification',
            'Lesion Detection',
            'Segmentation',
        '''

        if self.task == 'Classification':

            data = copy.deepcopy(request)
            data = self.run(data)

            return data
            
        else:
            data = copy.deepcopy(request)
            data = self.run(data)

            config = {
                "result_extension": ".nrrd",
                "result_dtype": "uint16",
            }
            '''The DICOM standard does NOT allow floating point data in any of the standard modality types. 
            If the goal is to have DICOM files that display in other systems then it is better off casting to 16 bit.'''
            
            req = copy.deepcopy(config)
            req.update(copy.deepcopy(data))

            writer = Writer()

            result_file_name = writer(req)
            
            print("\n8) Result File: {}".format(result_file_name) +'\n')
            
            return result_file_name