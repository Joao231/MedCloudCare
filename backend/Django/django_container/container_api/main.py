import os
from container_api.scripts.app import Application
from container_api.scripts.infer_task import InferTask, InferType
from monai.networks.nets import UNet
from monai.inferers import SlidingWindowInferer
from monai.transforms import (
    Activationsd,
    AddChanneld,
    AsDiscreted,
    LoadImaged,
    ScaleIntensityRanged,
    Spacingd,
    ToNumpyd,
    ToTensord,
)
from monailabel.transform.post import BoundingBoxd, Restored
from monailabel.interfaces.utils.transform import run_transforms
import torch

class SegmentationSpleen(InferTask):
    """
    This provides Inference for pre-trained spleen segmentation (UNet) model over MSD Dataset.
    """

    def __init__(
        self,
        root_dir,
        type=InferType.SEGMENTATION,
        labels=["spleen"],
        description="A pre-trained model for volumetric (3D) segmentation of the spleen from CT image",
    ):
        super().__init__(
            type=type,
            labels=labels,
            description=description,
        )

        self.root_dir = root_dir

    def pre_processing(self, data):
        transforms = [
            LoadImaged(keys="image"),
            AddChanneld(keys="image"),
            Spacingd(keys="image", pixdim=[1.0, 1.0, 1.0]),
            ScaleIntensityRanged(keys="image", a_min=-57, a_max=164, b_min=0.0, b_max=1.0, clip=True),
            ToTensord(keys="image"),
        ]

        return run_transforms(data, transforms, log_prefix="PRE", use_compose=False)


    def get_model_network(self, device):
        model_path = os.path.join(self.root_dir, "model.ts")
        network_params = {
            "dimensions": 3,
            "in_channels": 1,
            "out_channels": 2,
            "channels": [16, 32, 64, 128, 256],
            "strides": [2, 2, 2, 2],
            "num_res_units": 2,
            "norm": "batch",
        }
        network = UNet(**network_params, dropout=0.2)
  
        if not model_path and not network:
            return(f" -> Model Path does not exist/valid")

        network = None

        if network:
            if model_path:
                if device == "cuda" and torch.cuda.is_available():
                    checkpoint = torch.load(model_path)
                else:
                    checkpoint = torch.load(model_path, map_location=torch.device("cpu"))

                model_state_dict = checkpoint.get("model", checkpoint)
                network.load_state_dict(model_state_dict, strict=False)
        else:
            # If we are using a CPU-only machine, try to load the network for CPU inference
            if torch.cuda.is_available():
                network = torch.jit.load(model_path)
            else:
                network = torch.jit.load(model_path, map_location=torch.device("cpu"))

        if device == "cuda":
            network = network.cuda()
        network.eval()

        return network


    def run(self, input_data):
        data = self.pre_processing(input_data)

        inferer = SlidingWindowInferer(roi_size=[160, 160, 160])

        if not torch.cuda.is_available():
            device = "cpu"
        else:
            device = "cuda"

        network = self.get_model_network(device)
        if network:
            inputs = data["image"]
            inputs = inputs if torch.is_tensor(inputs) else torch.from_numpy(inputs)
            inputs = inputs[None]
            if device == "cuda":
                inputs = inputs.cuda()
            with torch.no_grad():
                outputs = inferer(inputs, network)
            if device == "cuda":
                torch.cuda.empty_cache()
            outputs = outputs[0]
            data["pred"] = outputs
        else:
            data = run_transforms(data, inferer, log_prefix="INF", log_name="Inferer")

        output_data = self.post_processing(data)

        return output_data

        
    def post_processing(self, data):
        transforms = [
            Activationsd(keys="pred", softmax=True),
            AsDiscreted(keys="pred", argmax=True),
            ToNumpyd(keys="pred"),
            Restored(keys="pred", ref_image="image"),
            BoundingBoxd(keys="pred", result="result", bbox="bbox"),
        ]

        return run_transforms(data, transforms, log_prefix="POST")


class MyApp(Application):
    def __init__(self, root_dir):
        
        super().__init__(
            root_dir=root_dir
        )

    def init_infer(self):
        infer = SegmentationSpleen(self.root_dir)
        
        return infer
