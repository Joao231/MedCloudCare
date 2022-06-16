import copy
import tempfile
import itk
import numpy as np
from monai.data import write_nifti


def write_itk(image_np, output_file, affine, dtype, compress):
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

    itk.imwrite(result_image, output_file, compress)


class Writer:
    def __init__(
        self,
        label="pred",
        json="result",
        ref_image=None,
        key_extension="result_extension",
        key_dtype="result_dtype",
        key_compress="result_compress",
        meta_key_postfix="meta_dict",
        nibabel=True,
    ):
        self.label = label
        self.json = json
        self.ref_image = ref_image if ref_image else label

        self.key_extension = key_extension
        self.key_dtype = key_dtype
        self.key_compress = key_compress
        self.meta_key_postfix = meta_key_postfix
        self.nibabel = nibabel

    def __call__(self, data):
        file_ext = ".nii.gz"
        dtype = data.get(self.key_dtype, None)
        compress = data.get(self.key_compress, False)
        file_ext = data.get(self.key_extension) if data.get(self.key_extension) else file_ext
     
        image_np = data[self.label]
        
        meta_dict = data.get(f"{self.ref_image}_{self.meta_key_postfix}")
        affine = meta_dict.get("affine") if meta_dict else None
        
        output_file = tempfile.NamedTemporaryFile(suffix=file_ext).name
        print("5) Saving Result File to: {}".format(output_file) + '\n')

        if self.nibabel and file_ext.lower() in [".nii", ".nii.gz"]:
            write_nifti(image_np, output_file, affine=affine, output_dtype=dtype)
        else:
            write_itk(image_np, output_file, affine, dtype, compress)

        return output_file, data.get(self.json, {})


class ClassificationWriter:
    def __init__(self, label="pred", label_names=None):
        self.label = label
        self.label_names = label_names

    def __call__(self, data):
        result = []
        for label in data[self.label]:
            result.append(self.label_names[int(label)])
        return None, {"prediction": result}



class InferType:
    """
    Type of Inference Model

    Attributes:
        SEGMENTATION -            Segmentation Model
        ANNOTATION -              Annotation Model
        CLASSIFICATION -          Classification Model
        OTHERS -                  Other Model Type
    """

    SEGMENTATION = "segmentation"
    ANNOTATION = "annotation"
    CLASSIFICATION = "classification"
    OTHERS = "others"
    KNOWN_TYPES = [SEGMENTATION, ANNOTATION, CLASSIFICATION, OTHERS]


class InferTask:
    """
    Basic Inference Task Helper
    """

    def __init__(
        self,
        type: InferType,
        labels,
        description,
        config=None,
    ):
        """
        :param path: App root directory path
        :param type: Type of Infer (segmentation, etc..)
        :param dimension: Input dimension
        :param description: Description
        :param config: K,V pairs to be part of user config
        
        """
        self.type = type
        self.labels = [] if labels is None else [labels] if isinstance(labels, str) else labels
        self.description = description
        self._config = {
            "device": "cpu",
            "result_extension": ".nrrd",
            "result_dtype": "uint16",
            "result_compress": False
        }

        if config:
            self._config.update(config)


    def info(self):
        return {
            "type": self.type,
            "labels": self.labels,
            "description": self.description,
            "config": self.config(),
        }

    def config(self):
        return self._config


    def __call__(self, request):
        """
        It provides basic implementation to run the following in order
            - Run Pre Transforms
            - Run Inferer
            - Run Post Transforms
            - Run Writer to save the label mask and result params

        Returns: Label (File Path) and Result Params (JSON)
        """

        req = copy.deepcopy(self._config)
        req.update(copy.deepcopy(request))
        print(f"4) Infer Request (final): {req}.\n")

        if self.type == InferType.SEGMENTATION:
            data = copy.deepcopy(req)
            data = self.run(data)
            
            result_file_name, result_json = self.segmentation_writer(data)
            result_json["label_names"] = self.labels

            print("6) Result File: {}".format(result_file_name) +'\n')
            print("7) Result Json: {}".format(result_json) +'\n')
            
            return result_file_name, result_json

        else:
            data = copy.deepcopy(req)
            data = self.run(data)

            return {"task_type": "classification", "prediction": data}


    def segmentation_writer(self, data, extension=None, dtype=None):
        """
        You can provide your own writer.  However this writer saves the prediction/label mask to file
        and fetches result json

        :param data: typically it is post processed data
        :param extension: output label extension
        :param dtype: output label dtype
        :return: tuple of output_file and result_json
        """
        if extension is not None:
            data["result_extension"] = extension
        if dtype is not None:
            data["result_dtype"] = dtype

        writer = Writer()
        
        return writer(data)