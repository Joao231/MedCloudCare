import hashlib
import os
import pathlib
from typing import Any, Dict, Iterator, Optional
import requests
from dicomweb_client import DICOMwebClient
from dicomweb_client.api import load_json_dataset
from expiringdict import ExpiringDict
from monailabel.datastore.local import LocalDatastore
from monailabel.datastore.utils.dicom import dicom_web_download_series, dicom_web_upload_dcm
from monailabel.interfaces.datastore import DefaultLabelTag
from .convert import binary_to_image, dicom_to_nifti, nifti_to_dicom_seg


class DICOMwebClientX(DICOMwebClient):
    def _decode_multipart_message(self, response: requests.Response, stream: bool) -> Iterator[bytes]:
        content_type = response.headers["content-type"]
        media_type, *ct_info = [ct.strip() for ct in content_type.split(";")]
        if media_type.lower() != "multipart/related":
            response.headers["content-type"] = "multipart/related"
        return super()._decode_multipart_message(response, stream)


class DICOMWebDatastore(LocalDatastore):
    def __init__(self, client: DICOMwebClient, cache_path: Optional[str] = None):
        self._client = client
        self._modality = "CT"
        uri_hash = hashlib.md5(self._client.base_url.encode("utf-8")).hexdigest()
        datastore_path = (
            os.path.join(cache_path, uri_hash)
            if cache_path
            else os.path.join(pathlib.Path.home(), ".cache", "monailabel", uri_hash)
        )
        print("initialized")
        self._stats_cache = ExpiringDict(max_len=100, max_age_seconds=30)
        super().__init__(datastore_path=datastore_path, auto_reload=True)


    def get_image_uri(self, image_id: str) -> str:

        image_dir = os.path.realpath(os.path.join(self._datastore.image_path(), image_id))
        
        if not os.path.exists(image_dir) or not os.listdir(image_dir):
            dicom_web_download_series(None, image_id, image_dir, self._client)

        image_nii_gz = os.path.realpath(os.path.join(self._datastore.image_path(), f"{image_id}.nii.gz"))
        if not os.path.exists(image_nii_gz):
            image_nii_gz = dicom_to_nifti(image_dir)
            super().add_image(image_id, image_nii_gz, self._dicom_info(image_id))

        return image_nii_gz


    def _dicom_info(self, series_id):
        meta = load_json_dataset(self._client.search_for_series(search_filters={"SeriesInstanceUID": series_id})[0])
        fields = ["StudyDate", "StudyTime", "Modality", "RetrieveURL", "PatientID", "StudyInstanceUID"]

        info = {"SeriesInstanceUID": series_id}
        for f in fields:
            info[f] = str(meta[f].value)
        return info

    
    def save_label(
        self, image_id: str, label_filename: str, label_tag: str, label_info: Dict[str, Any], label_id: str = ""
    ) -> str:
        print(f"\nInput - Image Id: {image_id}")
        print(f"\nInput - Label File: {label_filename}")
        print(f"\nInput - Label Tag: {label_tag}")
        print(f"\nInput - Label Info: {label_info}")

        image_uri = self.get_image_uri(image_id)
        label_ext = "".join(pathlib.Path(label_filename).suffixes)

        output_file = ""
        if label_ext == ".bin":
            output_file = binary_to_image(image_uri, label_filename)
            label_filename = output_file

        print(f"\nLabel File: {label_filename}")

        # Support DICOM-SEG uploading only final version
        if label_tag == DefaultLabelTag.FINAL:
            image_dir = os.path.realpath(os.path.join(self._datastore.image_path(), image_id))

            label_file = nifti_to_dicom_seg(image_dir, label_filename, label_info.get("label_info"))

            label_series_id = dicom_web_upload_dcm(label_file, self._client)
            label_info.update(self._dicom_info(label_series_id))
            os.unlink(label_file)

        label_id = super().save_label(image_id, label_filename, label_tag, label_info)
        print("\nSave completed!\n")

        if output_file:
            os.unlink(output_file)
        return label_id