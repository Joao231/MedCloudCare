/* eslint-disable no-multi-str */
let template =
  "'''Algorithm-creation Template\n\
\
\nDeploying a model in order to perform Inference means that you have trained a model, tested its performance, and decided to use it to make predictions on new\ndata, in this case, images.\n\
\n\
This template uses two Python modules to provide structure for algorithm deployment: `InferTask` and `Application`.\n\
\n\
The instantiation of an `Application` object is what turns your code into an algorithm that can run on our application.\n\
\
\nEach algorithm is treated as an inference task, therefore it must inherit the `InferTask` class.\n\
\n\
After you created your algorithm class, you must instantiate it in the `Application` class, in its `init_infer` method.\n\
\n\
Below you can find an example of how to use the provided template.\n\
\n\
This code should be on the `main.py` file! All the Python modules that you use must be in `requirements.txt` file, one per line, alongside its corresponding version.\n\
'''\n\
\nimport os\n\
from container_api.scripts.app import Application\n\
from container_api.scripts.infer_task import InferTask\n\
\
\
\nclass SegmentationSpleen(InferTask):\n\
\n\
        def __init__(self,\n\
                root_dir,\n\
                task,\n\
        ):\n\
                \n\
                super().__init__(\n\
                        root_dir=root_dir\n\
                        task=task\n\
                )\n\
\n\
        '''\n\
        def pre_processing(self, data):\n\
            (...)\n\
\n\
        def post_processing(self, data):\n\
            (...)\n\
        '''\n\
\n\
\n\
        '''\n\
        def run(self, input_data): (Note: This function is mandatory!)\n\
\n\
\n\
        According to the task performed by the algorithm, the variable `input_data` is the following:\n\
\n              Segmentation, Classification, Lesion Detection, Object Localisation and Image Processing - \n\
\n              {'image': 'path to nii.gz file or DICOM dir containing the input images'}\n\
\n              Image Registration - \n\
\n              {'image': \n\
        \n              {'fixed_image': 'path to nii.gz file or DICOM dir containing the input images', \n\
        \n              'moving_image': 'path to nii.gz file or DICOM dir containing the input images'} \n\
\n              }\n\
\n\
        Here you should provide all the code you want to run, the workflow of your algorithm.\n\
        All the other functions you may add should be called here.\n\
\n\
        Also according to the task performed by the algorithm, the variable `output_data` must be the following:\n\
\n              Segmentation, Image Registration, Lesion Detection, Object Localisation and Image Processing - \n\
\n              {'image_np': 'a Python array containing the result image data', \n\
\n              'affine': 'an optional Python array containing the affine transformation of the result image'}\n\
\n              Classification - a Python dictionary containing the prediction labels as keys and the corresponding results as values as \n\
\n              {'prediction_label': 'prediction_result' (...)}\n\
\n\
\n\
\n              return output_data\n\
\n\
\n\
\n\
        The backend of our application will look for the `run` method and execute its code.\n\
\n\
        Finally, the output is written in the appropriate format and sent to the Viewer, that is:\n\
\n              Segmentation, Image Registration, Lesion Detection, Object Localisation and Image Processing - \n\
\n              the output Python array containing the result image data is converted to an ITK image, written in a .nrrd file and sent to the Viewer.\n\
\n              Classification - the Python dictionary containing the labels and their prediction result is sent as an JSON object to the Viewer.\n\
        '''\n\
\n\
\n\
\n\
class MyApp(Application):\n\
\n\
        def __init__(self, root_dir, task):\n\
\n\
        '''\n\
        Base Class for Any Algorithm Application\n\
        \n\
        :param root_dir: path for Algorithm root directory.\n\
        :param task: task performed by the Algorithm.\n\
        '''\n\
\n\
                super().__init__(\n\
                root_dir=root_dir\n\
                task=task\n\
                )\n\
\n\
        def init_infer(self):\n\
\n\
        '''\n\
        Init the provided algorithm class.\n\
        '''\n\
\n\
                infer = SegmentationSpleen(self.root_dir, self.task),\n\
                \n\
                return infer";

export default template;
